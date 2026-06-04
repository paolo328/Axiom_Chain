/**
 * FAQ accordions for static pages (Radix content is empty without Next.js client).
 * Answers are read from FAQPage JSON-LD; open/close uses height animation.
 */
(function () {
  var DURATION_MS = 280;

  function decodeHtml(text) {
    var el = document.createElement('textarea');
    el.innerHTML = text;
    return el.value;
  }

  function triggerLabel(btn) {
    var clone = btn.cloneNode(true);
    clone.querySelectorAll('svg').forEach(function (node) {
      node.remove();
    });
    return clone.textContent.replace(/\s+/g, ' ').trim();
  }

  function parseFaqMap() {
    var map = Object.create(null);
    document.querySelectorAll('script[type="application/ld+json"]').forEach(function (node) {
      try {
        var data = JSON.parse(node.textContent);
        if (data['@type'] !== 'FAQPage' || !Array.isArray(data.mainEntity)) return;
        data.mainEntity.forEach(function (item) {
          var q = item && item.name;
          var a = item && item.acceptedAnswer && item.acceptedAnswer.text;
          if (q && a) map[q.trim()] = a;
        });
      } catch (err) {
        /* ignore malformed JSON-LD */
      }
    });
    return map;
  }

  function lookupAnswer(faqMap, question) {
    if (faqMap[question]) return faqMap[question];
    var decoded = decodeHtml(question);
    if (faqMap[decoded]) return faqMap[decoded];
    var keys = Object.keys(faqMap);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].replace(/\s+/g, ' ') === question.replace(/\s+/g, ' ')) {
        return faqMap[keys[i]];
      }
    }
    return null;
  }

  function setChevrons(trigger, open) {
    var down = trigger.querySelector('.lucide-chevron-down');
    var up = trigger.querySelector('.lucide-chevron-up');
    if (down) down.classList.toggle('hidden', open);
    if (up) up.classList.toggle('hidden', !open);
  }

  function prepareContent(content) {
    content.classList.add('axiom-accordion-panel');
    content.removeAttribute('hidden');
    content.style.height = '0px';
    content.style.opacity = '0';
    content.setAttribute('data-state', 'closed');
    content.setAttribute('aria-hidden', 'true');
  }

  function animatePanel(content, open, done) {
    if (open) {
      content.setAttribute('data-state', 'open');
      content.setAttribute('aria-hidden', 'false');
      content.style.height = '0px';
      content.style.opacity = '0';
      requestAnimationFrame(function () {
        content.style.height = content.scrollHeight + 'px';
        content.style.opacity = '1';
      });
      window.setTimeout(function () {
        if (content.getAttribute('data-state') === 'open') {
          content.style.height = 'auto';
        }
        if (done) done();
      }, DURATION_MS + 30);
      return;
    }

    var start = content.scrollHeight;
    content.style.height = start + 'px';
    content.style.opacity = '1';
    content.offsetHeight;
    content.setAttribute('data-state', 'closed');
    content.setAttribute('aria-hidden', 'true');
    requestAnimationFrame(function () {
      content.style.height = '0px';
      content.style.opacity = '0';
    });
    window.setTimeout(function () {
      if (done) done();
    }, DURATION_MS + 30);
  }

  function setItemOpen(item, open, instant) {
    var trigger = item.querySelector('[data-slot="accordion-trigger"]');
    var content = item.querySelector('[data-slot="accordion-content"]');
    if (!trigger || !content) return;

    item.setAttribute('data-state', open ? 'open' : 'closed');
    trigger.setAttribute('data-state', open ? 'open' : 'closed');
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    setChevrons(trigger, open);

    if (instant) {
      prepareContent(content);
      if (open) {
        content.setAttribute('data-state', 'open');
        content.setAttribute('aria-hidden', 'false');
        content.style.height = 'auto';
        content.style.opacity = '1';
      }
      return;
    }

    animatePanel(content, open);
  }

  function populateContent(content, answer) {
    if (!answer || content.textContent.trim()) return;
    content.innerHTML =
      '<div class="axiom-accordion-answer pb-4 pt-1 text-sm leading-relaxed text-muted-foreground">' +
      answer.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') +
      '</div>';
  }

  function initAccordion(root, faqMap) {
    var items = root.querySelectorAll('[data-slot="accordion-item"]');
    if (!items.length) return;

    items.forEach(function (item) {
      var trigger = item.querySelector('[data-slot="accordion-trigger"]');
      var content = item.querySelector('[data-slot="accordion-content"]');
      if (!trigger || !content) return;

      var question = triggerLabel(trigger);
      populateContent(content, lookupAnswer(faqMap, question));
      prepareContent(content);
      setChevrons(trigger, false);
      item.setAttribute('data-state', 'closed');
      trigger.setAttribute('data-state', 'closed');
      trigger.setAttribute('aria-expanded', 'false');

      trigger.addEventListener('click', function (event) {
        event.preventDefault();
        var isOpen = trigger.getAttribute('aria-expanded') === 'true';
        items.forEach(function (other) {
          if (other === item) {
            setItemOpen(other, !isOpen, false);
          } else if (other.querySelector('[aria-expanded="true"]')) {
            setItemOpen(other, false, false);
          }
        });
      });
    });
  }

  function init() {
    var faqMap = parseFaqMap();
    document.querySelectorAll('[data-slot="accordion"]').forEach(function (root) {
      initAccordion(root, faqMap);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
