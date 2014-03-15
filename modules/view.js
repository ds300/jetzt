  /*
    $$\    $$\ $$$$$$\ $$$$$$$$\ $$\      $$\
    $$ |   $$ |\_$$  _|$$  _____|$$ | $\  $$ |
    $$ |   $$ |  $$ |  $$ |      $$ |$$$\ $$ |
    \$$\  $$  |  $$ |  $$$$$\    $$ $$ $$\$$ |
     \$$\$$  /   $$ |  $$  __|   $$$$  _$$$$ |
      \$$$  /    $$ |  $$ |      $$$  / \$$$ |
       \$  /   $$$$$$\ $$$$$$$$\ $$  /   \$$ |
        \_/    \______|\________|\__/     \__|
  */

  // calculate the focal character index
  function calculatePivot (word) {
    var l = word.length;
    if (l < 2) {
      return 0;
    } else if (l < 6) {
      return 1;
    } else if (l < 10) {
      return 2;
    } else if (l < 14) {
      return 3;
    } else {
      return 4;
    }
  }

  function Reader () {
    // elements
    var backdrop = div("sr-blackout")
      , wpm = div("sr-wpm")
      , leftWrap = div("sr-wrap sr-left")
      , rightWrap = div("sr-wrap sr-right")
      , leftWord = span()
      , rightWord = span()
      , pivotChar = span("sr-pivot")
      , word = div("sr-word", [leftWord, pivotChar, rightWord])
      , progressBar = div("sr-progress")
      , reticle = div("sr-reticle")
      , hiddenInput = elem("input", "sr-input")

      , box = div("sr-reader", [
          leftWrap,
          div("sr-word-box", [reticle, progressBar, word, wpm, hiddenInput]),
          rightWrap
        ])

      , wrapper = div("sr-reader-wrapper", [box]);

    hiddenInput.onkeyup = hiddenInput.onkeypress = function (ev) {
      if(!ev.ctrlKey && !ev.metaKey) {
	    	ev.stopImmediatePropagation();
	      return false;
	    }
    };

    var grabFocus = function () {
      hiddenInput.focus();
    };

    this.onBackdropClick = function (cb) {
      backdrop.onclick = cb;
    };

    this.onKeyDown = function (cb) {
      hiddenInput.onkeydown = cb;
    };

    this.show = function (cb) {
      // fade in backdrop
      document.body.appendChild(backdrop);
      backdrop.offsetWidth;
      addClass(backdrop, "in");

      // pull down box;
      document.body.appendChild(wrapper);
      wrapper.offsetWidth;
      addClass(wrapper, "in");

      // initialise custom size/wpm
      this.setScale(config("scale"));
      this.setWPM(config("target_wpm"));
      this.setFont(config("font"));

      // initialise custom theme
      this.setTheme(config("dark"));

      // need to stop the input focus from scrolling the page up.
      var scrollTop = getScrollTop();
      grabFocus();
      document.body.scrollTop = scrollTop;
      document.documentElement.scrollTop = scrollTop;

      hiddenInput.onblur = grabFocus;

      typeof cb === 'function' && window.setTimeout(cb, 340);
    };


    this.hide = function (cb) {
      hiddenInput.onblur = null;
      hiddenInput.blur();
      removeClass(backdrop, "in");
      removeClass(wrapper, "in");
      window.setTimeout(function () {
        backdrop.remove();
        wrapper.remove();
        typeof cb === 'function' && cb();
      }, 340);
    };

    this.setScale = function (scale) {
      wrapper.style.webkitTransform = "translate(-50%, -50%) scale("+scale+")";
      wrapper.style.mozTransform = "translate(-50%, -50%) scale("+scale+")";
      wrapper.style.transform = "translate(-50%, -50%) scale("+scale+")";
    };

    this.setWPM = function (target_wpm) {
      wpm.innerHTML = target_wpm + "";
    };
    
    this.setFont = function (font) {
    	// really, we should be setting font-family of 
    	//  ".sr-reader .sr-word-box .sr-word > span"
    	word.style.fontFamily = font;
    }

    this.setTheme = function (dark) {
      if (dark)
        addClass(box, "sr-dark");
      else
        removeClass(box, "sr-dark");
    };

    this.setProgress = function (percent) {
      progressBar.style.borderLeftWidth = Math.ceil(percent * 4) + "px";
    };

    this.setWord = function (token) {
      var pivot = calculatePivot(token.replace(/[?.,!:;*-]+$/, ""));
      leftWord.innerHTML = token.substr(0, pivot);
      pivotChar.innerHTML = token.substr(pivot, 1);
      rightWord.innerHTML = token.substr(pivot + 1)

      word.offsetWidth;
      var pivotCenter = reticle.offsetLeft + (reticle.offsetWidth / 2);
      word.style.left = (pivotCenter - pivotChar.offsetLeft - (pivotChar.offsetWidth / 2)) + "px";
    };

    this.setWrap = function (left, right) {
      leftWrap.innerHTML = left;
      rightWrap.innerHTML = right;

      var lw = leftWrap.offsetWidth;
      var rw = rightWrap.offsetWidth;

      wrapper.style.paddingLeft = "50px";
      wrapper.style.paddingRight = "50px";
      if (lw > rw) {
        wrapper.style.paddingRight = 50 + (lw - rw) + "px";
      } else if (rw > lw) {
        wrapper.style.paddingLeft = 50 + (rw - lw) + "px";
      }
    };
  }

    /**
   * Read the given instructions.
   */
  function read (instrs) {
    instructions = instrs;

    reader = new Reader();
    reader.onBackdropClick(close);
    reader.onKeyDown(handleKeydown)
    reader.show();

    index = 0;

    setTimeout(toggleRunning, 500);
  }
