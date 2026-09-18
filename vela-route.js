(() => {
  const stage = document.querySelector('.route-stage');
  const path = document.getElementById('routePath');
  const progressPath = document.getElementById('routeProgress');
  const boat = document.getElementById('routeBoat');
  const body = document.getElementById('routeBoatBody');
  const wake = document.getElementById('routeWake');
  if (!stage || !path || !progressPath || !boat || !body || !wake) return;

  const length = path.getTotalLength();
  progressPath.style.strokeDasharray = String(length);
  progressPath.style.strokeDashoffset = String(length);

  const clamp = (n,min,max) => Math.min(max,Math.max(min,n));
  const lerp = (a,b,t) => a + (b-a)*t;
  const shortestAngle = (a,b) => {
    let d = (b-a+540)%360-180;
    return a+d;
  };

  let targetP = 0;
  let currentP = 0;
  let heading = 0;
  let lastP = 0;
  let velocity = 0;
  let visible = true;
  let lastTime = performance.now();

  function progressFromScroll(){
    const rect = stage.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const start = vh * .78;
    const end = -rect.height * .18;
    return clamp((start - rect.top) / (start - end), 0, 1);
  }

  function render(now){
    if (!visible) {
      requestAnimationFrame(render);
      return;
    }

    const dt = Math.max(1, now-lastTime);
    lastTime = now;

    targetP = progressFromScroll();
    currentP = lerp(currentP, targetP, 0.085);

    const point = path.getPointAtLength(length * currentP);
    const ahead = path.getPointAtLength(Math.min(length, length * currentP + 5));
    const rawHeading = Math.atan2(ahead.y - point.y, ahead.x - point.x) * 180 / Math.PI;
    const wanted = shortestAngle(heading, rawHeading);
    heading = lerp(heading, wanted, 0.11);

    velocity = lerp(velocity, (currentP-lastP) * 1000 / dt, 0.16);
    lastP = currentP;

    const speed = clamp(Math.abs(velocity) * 9, 0, 1);
    const t = now / 1000;
    const roll = Math.sin(t*2.4) * (1.6 + speed*2.2);
    const bob = Math.sin(t*3.1 + 0.8) * (0.8 + speed*0.7);
    const pitch = 1 + Math.sin(t*2.1) * 0.014;

    boat.setAttribute('transform', `translate(${point.x.toFixed(2)} ${point.y.toFixed(2)}) rotate(${heading.toFixed(2)})`);
    body.setAttribute('transform', `translate(0 ${bob.toFixed(2)}) rotate(${roll.toFixed(2)}) scale(1 ${pitch.toFixed(3)})`);

    const wakeOpacity = 0.20 + speed * 0.62;
    const wakeScale = 0.82 + speed * 0.42;
    wake.setAttribute('transform', `scale(${wakeScale.toFixed(3)} 1)`);
    wake.style.opacity = wakeOpacity.toFixed(3);

    progressPath.style.strokeDashoffset = String(length * (1-currentP));
    requestAnimationFrame(render);
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    currentP = targetP = .58;
    const point = path.getPointAtLength(length * currentP);
    const ahead = path.getPointAtLength(Math.min(length, length * currentP + 5));
    heading = Math.atan2(ahead.y - point.y, ahead.x - point.x) * 180 / Math.PI;
    boat.setAttribute('transform', `translate(${point.x} ${point.y}) rotate(${heading})`);
    body.setAttribute('transform','translate(0 0)');
    wake.style.opacity = '.18';
    progressPath.style.strokeDashoffset = String(length * (1-currentP));
  } else {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        visible = entries[0]?.isIntersecting ?? true;
        if (visible) lastTime = performance.now();
      }, {rootMargin:'180px 0px'});
      observer.observe(stage);
    }
    requestAnimationFrame(render);
  }
})();