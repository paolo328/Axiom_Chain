/**
 * Trusted By logo marquee for static site (replaces Next.js Marquee component).
 */
(function () {
  var SPEED_PX_PER_SEC = 40;

  function initMarquee(outer, direction) {
    if (outer.dataset.axiomMarqueeBound) return;
    outer.dataset.axiomMarqueeBound = '1';

    var track = outer.firstElementChild;
    if (!track) return;

    var firstCopy = track.firstElementChild;
    if (!firstCopy) return;

    function setup() {
      var copyWidth = firstCopy.offsetWidth;
      var viewportWidth = outer.offsetWidth;
      if (!copyWidth || !viewportWidth) return;

      var needed = Math.max(2, Math.ceil(viewportWidth / copyWidth) + 1);
      var copies = track.querySelectorAll(':scope > .flex.w-max.shrink-0');

      while (copies.length < needed) {
        var clone = firstCopy.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
        copies = track.querySelectorAll(':scope > .flex.w-max.shrink-0');
      }

      track.style.setProperty('--marquee-shift', '-' + copyWidth + 'px');
      track.style.animationName = direction === 'right' ? 'marquee-loop-reverse' : 'marquee-loop';
      track.style.animationDuration = copyWidth / SPEED_PX_PER_SEC + 's';
      track.style.animationTimingFunction = 'linear';
      track.style.animationIterationCount = 'infinite';
    }

    function bindImages() {
      var imgs = firstCopy.querySelectorAll('img');
      var pending = 0;
      var scheduled = false;

      function schedule() {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(function () {
          scheduled = false;
          setup();
        });
      }

      imgs.forEach(function (img) {
        if (!img.complete) {
          pending++;
          img.addEventListener('load', function () {
            pending--;
            if (pending <= 0) schedule();
          }, { once: true });
        }
      });

      schedule();
    }

    bindImages();

    if (typeof ResizeObserver !== 'undefined') {
      var ro = new ResizeObserver(setup);
      ro.observe(outer);
      ro.observe(firstCopy);
    } else {
      window.addEventListener('resize', setup);
    }
  }

  function init() {
    document.querySelectorAll('.trusted-partners [class*="group/marquee"]').forEach(function (el, idx) {
      initMarquee(el, idx % 2 === 1 ? 'right' : 'left');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
