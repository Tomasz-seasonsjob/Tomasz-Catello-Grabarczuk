(() => {
  const stage = document.querySelector('.route-stage');
  const path = document.getElementById('routePath');
  const progressPath = document.getElementById('routeProgress');
  const boat = document.getElementById('routeBoat');
  if (!stage || !path || !progressPath || !boat) return;

  const length = path.getTotalLength();
  progressPath.style.strokeDasharray = String(length);
  progressPath.style.strokeDashoffset = String(length);

  const clamp = (n,min,max) => Math.min(max,Math.max(min,n));

  function setBoat(p){
    const point = path.getPointAtLength(length * p);
    const ahead = path.getPointAtLength(Math.min(length, length * p + 2));
    const angle = Math.atan2(ahead.y - point.y, ahead.x - point.x) * 180 / Math.PI;
    boat.setAttribute('transform', `translate(${point.x} ${point.y}) rotate(${angle})`);
    progressPath.style.strokeDashoffset = String(length * (1 - p));
  }

  function update(){
    const rect = stage.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const start = vh * .78;
    const end = -rect.height * .18;
    const p = clamp((start - rect.top) / (start - end), 0, 1);
    setBoat(p);
  }

  let ticking = false;
  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setBoat(.58);
  } else {
    setBoat(0);
    window.addEventListener('scroll', requestUpdate, {passive:true});
    window.addEventListener('resize', requestUpdate);
    update();
  }
})();