/**
 * Services mega-menu for static Axiom Chain site (replaces Next.js client nav).
 */
(function () {
  var HOVER_CLOSE_MS = 150;

  function sitePrefix() {
    var path = window.location.pathname.replace(/\\/g, '/');
    var dir = path.replace(/[^/]*\.html?$/, '').replace(/\/$/, '');
    if (!dir || dir === '/') return '';
    var depth = dir.split('/').filter(Boolean).length;
    return depth ? '../'.repeat(depth) : '';
  }

  function panelHtml(p) {
    return (
      '<div class="container-page axiom-services-panel__inner">' +
      '<div class="axiom-services-panel__grid">' +
      '<div class="axiom-services-panel__col axiom-services-panel__col--blockchain">' +
      '<h3 class="axiom-services-panel__title font-accent">Blockchain</h3>' +
      '<p class="axiom-services-panel__desc">Build practical blockchain-enabled products with enterprise-grade security and scalability.</p>' +
      '<ul class="axiom-services-panel__list">' +
      '<li><a href="' + p + 'services-blockchain/blockchain-consulting.html"><span class="axiom-services-panel__num">01</span><span>Consulting &amp; Strategy</span></a></li>' +
      '<li><a href="' + p + 'services-blockchain/product-discovery-workshops.html"><span class="axiom-services-panel__num">02</span><span>Product Development</span></a></li>' +
      '<li><a href="' + p + 'services-blockchain/smart-contracts.html"><span class="axiom-services-panel__num">03</span><span>Blockchain Engineering</span></a></li>' +
      '</ul>' +
      '<a class="axiom-services-panel__cta axiom-services-panel__cta--green" href="' + p + 'services-blockchain.html">View blockchain services <span aria-hidden="true">→</span></a>' +
      '</div>' +
      '<div class="axiom-services-panel__col axiom-services-panel__col--ai">' +
      '<h3 class="axiom-services-panel__title font-accent">Artificial Intelligence</h3>' +
      '<p class="axiom-services-panel__desc">Turn AI into practical tools, workflows, and products that drive tangible business value.</p>' +
      '<ul class="axiom-services-panel__list">' +
      '<li><a href="' + p + 'services-ai/ai-audit-opportunity-assessment.html"><span class="axiom-services-panel__num">01</span><span>Advisory</span></a></li>' +
      '<li><a href="' + p + 'services-ai/custom-ai-workflow-solutions.html"><span class="axiom-services-panel__num">02</span><span>AI Product &amp; Workflow Design</span></a></li>' +
      '<li><a href="' + p + 'services-ai/copilots-internal-tools.html"><span class="axiom-services-panel__num">03</span><span>AI Solutions</span></a></li>' +
      '<li><a href="' + p + 'services-ai/governance-controls.html"><span class="axiom-services-panel__num">04</span><span>AI Engineering &amp; Governance</span></a></li>' +
      '</ul>' +
      '<a class="axiom-services-panel__cta axiom-services-panel__cta--accent" href="' + p + 'services-ai.html">View AI services <span aria-hidden="true">→</span></a>' +
      '</div>' +
      '</div></div>'
    );
  }

  function positionPanel(panel) {
    var header = document.querySelector('header');
    if (!header || !panel) return;
    panel.style.top = header.getBoundingClientRect().bottom + 'px';
  }

  function setOpen(state, open) {
    var trigger = state.trigger;
    var panel = state.panel;
    var chevron = trigger && trigger.querySelector('svg');
    if (!trigger || !panel) return;

    state.wrap.classList.toggle('is-open', open);
    document.body.classList.toggle('axiom-services-open', open);
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    trigger.classList.toggle('text-nav-item', !open);
    trigger.classList.toggle('text-theme-accent', open);
    if (chevron) chevron.classList.toggle('rotate-180', open);

    if (open) {
      positionPanel(panel);
      panel.removeAttribute('hidden');
    } else {
      panel.setAttribute('hidden', '');
    }
  }

  function closeAll() {
    document.querySelectorAll('[data-axiom-services-state]').forEach(function (node) {
      var state = node._axiomServicesState;
      if (state) setOpen(state, false);
    });
  }

  function bindServicesNav(state) {
    var wrap = state.wrap;
    var trigger = state.trigger;
    var panel = state.panel;
    var closeTimer = null;

    function cancelClose() {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
    }

    function openMenu() {
      cancelClose();
      setOpen(state, true);
    }

    function scheduleClose() {
      cancelClose();
      closeTimer = setTimeout(function () {
        setOpen(state, false);
      }, HOVER_CLOSE_MS);
    }

    function toggle(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (state.wrap.classList.contains('is-open')) {
        setOpen(state, false);
      } else {
        openMenu();
      }
    }

    trigger.addEventListener('mouseenter', openMenu);
    trigger.addEventListener('mouseleave', scheduleClose);
    panel.addEventListener('mouseenter', openMenu);
    panel.addEventListener('mouseleave', scheduleClose);
    trigger.addEventListener('click', toggle);
    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') toggle(e);
      if (e.key === 'Escape') closeAll();
    });

    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target) && !panel.contains(e.target)) closeAll();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAll();
    });

    window.addEventListener('resize', function () {
      if (state.wrap.classList.contains('is-open')) positionPanel(panel);
    });

    var main = document.getElementById('main-content');
    if (main) {
      main.addEventListener('scroll', function () {
        if (state.wrap.classList.contains('is-open')) positionPanel(panel);
      }, { passive: true });
    }
  }

  function init() {
    var nav = document.querySelector('nav[aria-label="Main navigation"]');
    if (!nav) return;

    var trigger = null;
    nav.querySelectorAll('[role="button"]').forEach(function (el) {
      if (/^services$/i.test(el.textContent.replace(/\s+/g, ' ').trim().split(' ')[0]) || el.textContent.trim().indexOf('Services') === 0) {
        trigger = el;
      }
    });
    if (!trigger || trigger.dataset.axiomServicesBound) return;

    var prefix = sitePrefix();
    var wrap = document.createElement('div');
    wrap.className = 'axiom-services-dropdown';
    wrap.setAttribute('data-axiom-services-state', '1');
    trigger.parentNode.insertBefore(wrap, trigger);
    wrap.appendChild(trigger);

    trigger.dataset.axiomServicesTrigger = '1';
    trigger.dataset.axiomServicesBound = '1';
    trigger.setAttribute('aria-controls', 'axiom-services-panel');
    trigger.id = trigger.id || 'axiom-services-trigger';

    var panel = document.createElement('div');
    panel.id = 'axiom-services-panel';
    panel.className = 'axiom-services-panel';
    panel.setAttribute('hidden', '');
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', 'Services menu');
    panel.innerHTML = panelHtml(prefix);
    document.body.appendChild(panel);

    var state = { wrap: wrap, trigger: trigger, panel: panel };
    wrap._axiomServicesState = state;
    bindServicesNav(state);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
