// Typewriter effect for site header title on first homepage load
// Keeps an idle subtle blinking caret afterwards
(function () {
  var titleElement = document.querySelector('header h1.title');
  if (!titleElement) return;

  var isHome = location.pathname === '/' || location.pathname.endsWith('/index.html');

  var fullText = (titleElement.textContent || '').trim();
  var TYPED_FLAG = 'typedTitleOnce';

  function hasCaretNode(node) {
    return !!node.querySelector('.typing-caret');
  }

  function appendCaretIdle() {
    if (hasCaretNode(titleElement)) return;
    var caret = document.createElement('span');
    caret.className = 'typing-caret typing-caret-idle';
    caret.setAttribute('aria-hidden', 'true');
    titleElement.appendChild(caret);
  }

  function startTyping() {
    var caret = document.createElement('span');
    caret.className = 'typing-caret typing-caret-active';
    caret.setAttribute('aria-hidden', 'true');
    titleElement.textContent = '';

    var index = 0;
    var speedMs = 75; // relatively fast

    var timer = setInterval(function () {
      titleElement.textContent = fullText.slice(0, index + 1);
      // Re-attach caret each tick (textContent resets children)
      titleElement.appendChild(caret);
      index++;

      if (index >= fullText.length) {
        clearInterval(timer);
        // Switch to idle blink
        caret.classList.remove('typing-caret-active');
        caret.classList.add('typing-caret-idle');
        try { sessionStorage.setItem(TYPED_FLAG, '1'); } catch (e) {}
      }
    }, speedMs);
  }

  // Only run on the homepage
  if (!isHome) {
    return;
  }

  var alreadyTyped = false;
  try { alreadyTyped = sessionStorage.getItem(TYPED_FLAG) === '1'; } catch (e) { alreadyTyped = false; }

  if (alreadyTyped || !fullText) {
    appendCaretIdle();
  } else {
    startTyping();
  }
})();


