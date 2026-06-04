/**
 * Homepage interactive sections for static export (services tabs, projects, process).
 */
(function () {
  if (!window.AXIOM_HOME_DATA) return;

  var DATA = window.AXIOM_HOME_DATA;

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function splitTitle(title, subtitle) {
    return (
      esc(title) +
      (subtitle ? ' <span class="text-foreground-50">' + esc(subtitle) + '</span>' : '')
    );
  }

  function serviceCard(card, accent) {
    var href = 'services-' + card.lane + '/' + card.slug + '.html';
    var colorVar = accent === 'accent' ? 'var(--color-accent)' : 'var(--color-secondary)';
    var hoverText =
      accent === 'accent'
        ? 'max-md:text-accent group-hover:text-accent'
        : 'max-md:text-secondary-muted group-hover:text-secondary-muted';
    var borderHover =
      accent === 'accent'
        ? 'max-md:border-accent group-hover:border-accent'
        : 'max-md:border-secondary group-hover:border-secondary';

    return (
      '<a class="group relative flex flex-col overflow-hidden rounded-2xl border-2 bg-background p-5 transition-colors duration-300 border-foreground-10 ' +
      borderHover +
      ' min-w-0 flex-1" href="' +
      esc(href) +
      '">' +
      '<div aria-hidden="true" class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 max-md:opacity-[0.10] group-hover:opacity-[0.10]" style="background:linear-gradient(135deg, ' +
      colorVar +
      ' 0%, transparent 55%)"></div>' +
      '<div class="relative z-10 flex h-full flex-col">' +
      '<h3 class="text-lg font-extrabold leading-[1.15] tracking-[-0.5px] text-foreground">' +
      splitTitle(card.title, card.subtitle) +
      '</h3>' +
      '<p class="mt-2.5 text-sm font-semibold leading-[1.5] text-foreground-70">' +
      esc(card.summary) +
      '</p>' +
      '<div class="mt-auto inline-flex items-center gap-1.5 pt-3 text-2xs font-extrabold uppercase tracking-[1px] text-foreground-70 transition-colors duration-300 ' +
      hoverText +
      '">View<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-right size-3.5 transition-transform duration-200 max-md:-translate-y-0.5 max-md:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true"><path d="M7 7h10v10"></path><path d="M7 17 17 7"></path></svg></div>' +
      '</div></a>'
    );
  }

  function servicePanel(cards, accent) {
    var inner = cards
      .slice(0, 3)
      .map(function (c) {
        return serviceCard(c, accent);
      })
      .join('');
    return (
      '<div class="flex h-full flex-col gap-3 md:flex-row">' + inner + '</div>'
    );
  }

  var TAB_ACTIVE =
    'border-foreground-10 bg-foreground-10 text-foreground hover:bg-foreground-10 font-medium';
  var TAB_IDLE =
    'border-transparent font-semibold text-foreground-50 hover:bg-transparent hover:text-foreground-70';

  function setTabState(tab, active) {
    if (!tab.dataset.axiomTabBase) {
      tab.dataset.axiomTabBase = tab.className
        .replace(TAB_ACTIVE, '')
        .replace(TAB_IDLE, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
    tab.className = tab.dataset.axiomTabBase + ' ' + (active ? TAB_ACTIVE : TAB_IDLE);
    tab.setAttribute('aria-selected', active ? 'true' : 'false');
    tab.tabIndex = active ? 0 : -1;
  }

  function findServicePanelWrap(tablist) {
    var host = tablist.parentElement;
    if (!host) return null;
    for (var i = 0; i < host.children.length; i++) {
      var child = host.children[i];
      if (child === tablist) continue;
      if (child.getAttribute && child.getAttribute('aria-hidden') === 'true') continue;
      var cn = child.className || '';
      if (cn.indexOf('overflow-hidden') >= 0 && cn.indexOf('relative') >= 0) {
        return child;
      }
    }
    return null;
  }

  function initTabGroup(tablist, groups, accent) {
    if (!tablist || tablist.dataset.axiomTabsBound) return;
    tablist.dataset.axiomTabsBound = '1';

    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
    var panelWrap = findServicePanelWrap(tablist);
    if (!panelWrap || !groups.length || tabs.length !== groups.length) return;

    panelWrap.classList.add('axiom-service-panels');
    panelWrap.innerHTML = '';

    var panels = groups.map(function (group, idx) {
      var panel = document.createElement('div');
      panel.setAttribute('role', 'tabpanel');
      panel.className = 'h-full axiom-service-panel';
      panel.hidden = idx !== 0;
      panel.innerHTML = servicePanel(group.cards, accent);
      panelWrap.appendChild(panel);
      return panel;
    });

    function activate(index) {
      tabs.forEach(function (tab, i) {
        setTabState(tab, i === index);
      });
      panels.forEach(function (panel, i) {
        if (i === index) {
          panel.hidden = false;
          panel.classList.remove('is-leaving');
          panel.classList.add('is-active');
        } else if (!panel.hidden) {
          panel.classList.add('is-leaving');
          panel.classList.remove('is-active');
          window.setTimeout(function () {
            if (!panel.classList.contains('is-active')) {
              panel.hidden = true;
              panel.classList.remove('is-leaving');
            }
          }, 280);
        } else {
          panel.hidden = true;
          panel.classList.remove('is-active', 'is-leaving');
        }
      });
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener('click', function () {
        activate(index);
      });
      tab.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          var next =
            e.key === 'ArrowRight'
              ? (index + 1) % tabs.length
              : (index - 1 + tabs.length) % tabs.length;
          activate(next);
          tabs[next].focus();
        }
      });
    });

    activate(0);
  }

  function projectCard(project, hero) {
    var href = 'projects/' + project.slug + '.html';
    var tags = esc(project.tags || '');
    var titleClass = hero
      ? 'line-clamp-2 font-medium leading-tight text-white min-h-[3.75rem] text-2xl sm:min-h-[4.5rem] sm:text-3xl'
      : 'line-clamp-2 font-medium leading-tight text-white min-h-[3rem] text-xl sm:min-h-[3.5rem] sm:text-2xl';
    var articleClass = hero
      ? 'group relative flex flex-col overflow-hidden rounded-2xl border border-foreground-10 h-full min-h-0'
      : 'group relative flex flex-col overflow-hidden rounded-2xl border border-foreground-10 h-full min-h-0 md:min-h-[235px]';
    var pad = hero ? 'px-6 py-5' : 'px-5 py-4';

    return (
      '<a class="block h-full" href="' +
      esc(href) +
      '"><article class="' +
      articleClass +
      '">' +
      '<img alt="" loading="lazy" decoding="async" class="object-cover object-center transition-transform duration-500 group-hover:scale-105" style="position:absolute;height:100%;width:100%;left:0;top:0;right:0;bottom:0;object-fit:cover" src="' +
      esc(project.image) +
      '"/>' +
      '<div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,var(--color-accent)_0%,transparent_70%)] opacity-0 transition-opacity duration-500 group-hover:opacity-[0.06]"></div>' +
      '<div class="relative z-20 mt-auto ' +
      pad +
      '"><div class="absolute inset-0 bg-black/70"></div>' +
      '<div class="relative z-10"><p class="mb-2 text-xs font-bold uppercase tracking-widest text-white/70">' +
      tags +
      '</p><h3 class="' +
      titleClass +
      '">' +
      esc(project.title) +
      '</h3>' +
      '<div class="grid transition-[grid-template-rows] duration-300 ease-out grid-rows-[0fr] group-hover:grid-rows-[1fr]"><div class="overflow-hidden"><p class="mt-3 text-sm leading-relaxed text-white/80 line-clamp-3">' +
      esc(project.description) +
      '</p><span class="inline-flex items-center gap-2 mt-3 text-xs font-medium uppercase tracking-widest text-white/70 group-hover:text-accent-green">Read case study<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right size-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg></span></div></div></div></div></article></a>'
    );
  }

  function projectPanel(entry) {
    if (!entry) return '';
    return (
      '<div class="grid h-full grid-cols-1 grid-rows-[2fr_1fr_1fr] gap-4 md:grid-cols-[1.6fr_1fr] md:grid-rows-2 md:[&>*:first-child]:row-span-2">' +
      projectCard(entry.hero, true) +
      projectCard(entry.supporting[0], false) +
      projectCard(entry.supporting[1], false) +
      '</div>'
    );
  }

  function initProjectTabs(section) {
    var tablist = section.querySelector('[role="tablist"][aria-label="Project verticals"]');
    if (!tablist || tablist.dataset.axiomTabsBound) return;
    tablist.dataset.axiomTabsBound = '1';

    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
    var panelWrap = tablist.parentElement && tablist.parentElement.nextElementSibling;
    if (!panelWrap || !DATA.projects || !DATA.projects.verticals) return;

    panelWrap.classList.add('axiom-project-panels');
    panelWrap.innerHTML = '';

    var panels = DATA.projects.verticals.map(function (vertical, idx) {
      var panel = document.createElement('div');
      panel.setAttribute('role', 'tabpanel');
      panel.hidden = idx !== 0;
      panel.innerHTML = projectPanel(DATA.projects.byVertical[vertical]);
      panelWrap.appendChild(panel);
      return panel;
    });

    function activate(index) {
      tabs.forEach(function (tab, i) {
        var active = i === index;
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
        tab.tabIndex = active ? 0 : -1;
        if (active) {
          tab.classList.add('border', 'border-foreground-10', 'bg-foreground-10', 'text-foreground');
          tab.classList.remove('border-transparent', 'text-foreground-50');
        } else {
          tab.classList.remove('border-foreground-10', 'bg-foreground-10', 'text-foreground');
          tab.classList.add('border-transparent', 'text-foreground-50');
        }
      });
      panels.forEach(function (panel, i) {
        panel.hidden = i !== index;
      });
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener('click', function () {
        activate(index);
      });
    });

    activate(0);
  }

  function initProcess(section) {
    if (section.dataset.axiomProcessBound) return;
    section.dataset.axiomProcessBound = '1';

    var items = Array.prototype.slice.call(
      section.querySelectorAll('ol > li.rounded-2xl')
    );
    if (items.length < 2) return;

    items.forEach(function (li) {
      li.querySelectorAll('[class*="md:grid-cols-2"]').forEach(function (el) {
        el.classList.remove('hidden');
      });
    });

    if (!window.matchMedia('(min-width: 1024px)').matches) return;

    var ol = items[0].parentElement;
    var shell = document.createElement('div');
    shell.className = 'axiom-process-tabs';

    var nav = document.createElement('div');
    nav.className = 'axiom-process-tabs__nav';
    nav.setAttribute('role', 'tablist');
    nav.setAttribute('aria-orientation', 'vertical');

    var content = document.createElement('div');
    content.className = 'axiom-process-tabs__content';

    function activateProcess(activeIdx) {
      nav.querySelectorAll('.axiom-process-tabs__step').forEach(function (b, i) {
        b.classList.toggle('is-active', i === activeIdx);
        b.setAttribute('aria-selected', i === activeIdx ? 'true' : 'false');
      });
      content.querySelectorAll('.axiom-process-tabs__panel').forEach(function (p, i) {
        if (i === activeIdx) {
          p.hidden = false;
          p.classList.add('is-active');
          p.classList.remove('is-leaving');
        } else if (!p.hidden) {
          p.classList.add('is-leaving');
          p.classList.remove('is-active');
          window.setTimeout(function () {
            if (!p.classList.contains('is-active')) {
              p.hidden = true;
              p.classList.remove('is-leaving');
            }
          }, 320);
        } else {
          p.hidden = true;
          p.classList.remove('is-active', 'is-leaving');
        }
      });
    }

    items.forEach(function (li, index) {
      var num = li.querySelector('.font-mono');
      var heading = li.querySelector('h3');
      var label = (num ? num.textContent.trim() + ' ' : '') + (heading ? heading.textContent.trim() : 'Step');

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'axiom-process-tabs__step';
      btn.setAttribute('role', 'tab');
      btn.textContent = label;
      btn.addEventListener('click', function () {
        activateProcess(index);
      });
      nav.appendChild(btn);

      li.classList.add('axiom-process-tabs__panel');
      li.setAttribute('role', 'tabpanel');
      content.appendChild(li);

      if (index === 0) btn.classList.add('is-active');
      if (index !== 0) li.hidden = true;
    });

    shell.appendChild(nav);
    shell.appendChild(content);
    ol.replaceWith(shell);
  }

  function initServices(section) {
    var tablists = section.querySelectorAll('[role="tablist"][aria-label="Service groups"]');
    DATA.serviceSections.forEach(function (cfg, idx) {
      initTabGroup(tablists[idx], cfg.groups, cfg.accent);
    });
  }

  function init() {
    var sections = document.querySelectorAll('section');
    sections.forEach(function (section) {
      var text = section.textContent || '';
      if (text.indexOf('Our Services') !== -1 && text.indexOf('The services we specialise') !== -1) {
        initServices(section);
      }
      if (text.indexOf("Projects we've shipped") !== -1 || text.indexOf('Projects we') !== -1) {
        initProjectTabs(section);
      }
      if (text.indexOf('Our Process') !== -1 && text.indexOf('Four phases') !== -1) {
        initProcess(section);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
