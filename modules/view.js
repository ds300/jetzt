/*
   Licensed under the Apache License v2.0.

   A copy of which can be found at the root of this distrubution in
   the file LICENSE-2.0 or at http://www.apache.org/licenses/LICENSE-2.0
*/

(function (window) {

  var jetzt = window.jetzt
    , config = jetzt.config
    , H = jetzt.helpers
    , div = H.div
    , span = H.span
    , view = {};

  jetzt.view = view;

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
      , message = div("sr-message")
      , reticle = div("sr-reticle")
      , hiddenInput = H.elem("input", "sr-input")
      , wordBox = div("sr-word-box", [
          reticle, progressBar, message, word, wpm, hiddenInput
        ])
      , box = div("sr-reader", [
          leftWrap,
          wordBox,
          rightWrap
        ])

      , wrapper = div("sr-reader-wrapper", [box])

      , unlisten;


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

    this.dark = false;

    this.applyConfig = function () {
      // initialise custom size/wpm
      this.dark = config("dark");
      var theme = config.getSelectedTheme();
      this.applyTheme(theme);

      this.setScale(config("scale"));
      this.setWPM(config("target_wpm"));
      this.setFont(config("font_family"));

      if (config("show_message")) {
        this.showMessage();
      } else {
        this.hideMessage();
      }
    };

    this.appendTo = function (elem) {
      // fade in backdrop
      elem.appendChild(backdrop);
      backdrop.offsetWidth;
      H.addClass(backdrop, "in");

      // pull down box;
      elem.appendChild(wrapper);
      wrapper.offsetWidth;
      H.addClass(wrapper, "in");
    };

    this.watchConfig = function () {
      var that = this;
      unlisten = config.onChange(function () { that.applyConfig(); });
    };

    this.unwatchConfig = function () {
      unlisten && unlisten();
    };

    this.show = function (cb) {
      this.appendTo(document.body);

      // apply and listen to config;
      this.applyConfig();
      this.watchConfig();

      // need to stop the input focus from scrolling the page up.
      var scrollTop = H.getScrollTop();
      grabFocus();
      document.body.scrollTop = scrollTop;
      document.documentElement.scrollTop = scrollTop;

      hiddenInput.onblur = grabFocus;

      typeof cb === 'function' && window.setTimeout(cb, 340);
    };


    this.hide = function (cb) {
      unlisten();
      hiddenInput.onblur = null;
      hiddenInput.blur();
      H.removeClass(backdrop, "in");
      H.removeClass(wrapper, "in");
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
      // thanks for pointing that out
      leftWord.style.fontFamily = font;
      pivotChar.style.fontFamily = font;
      rightWord.style.fontFamily = font;
      leftWrap.style.fontFamily = font;
      rightWrap.style.fontFamily = font;
      wpm.style.fontFamily = font;
      message.style.fontFamily = font;
    };

    this.applyTheme = function (theme) {
      var style;
      if (this.dark) {
        style = theme.dark;
      } else {
        style = theme.light;
      }
      backdrop.style.backgroundColor = style.backdrop_color;
      backdrop.style.opacity = style.backdrop_opacity;
      wordBox.style.backgroundColor = style.background_color;
      leftWord.style.color = style.foreground_color;
      rightWord.style.color = style.foreground_color;
      leftWrap.style.backgroundColor = style.wrap_background_color;
      rightWrap.style.backgroundColor = style.wrap_background_color;
      leftWrap.style.color = style.wrap_foreground_color;
      rightWrap.style.color = style.wrap_foreground_color;
      reticle.style.borderColor = style.reticle_color;
      pivotChar.style.color = style.pivot_color;
      progressBar.style.borderColor = style.progress_bar_foreground_color;
      progressBar.style.backgroundColor = style.progress_bar_background_color;
      message.style.color = style.message_color;
      wpm.style.color = style.message_color;
    };


    this.setProgress = function (percent) {
      progressBar.style.borderLeftWidth = Math.ceil(percent * 4) + "px";
    };

    this.setMessage = function (msg) {
     message.innerHTML = msg;
    };

    this.showMessage = function () {
      message.style.display = "block";
    };

    this.hideMessage = function () {
      message.style.display = "none";
    };

    this.started = false;

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

    this.clear = function () {
      this.setWrap("", "");
      this.setWord("   ");
    };
  }

  view.Reader = Reader;

  // we only need one instance of Reader now.
  var readerSingleton;

  view.__defineGetter__("reader", function () {
    if (!readerSingleton) readerSingleton = new Reader();

    return readerSingleton;
  });


  var overlaidElems = [];

  /**
   * Makes an overlay for the given element.
   * Returns false if the overlay is off the bottom of the screen,
   * otherwise returns true;
   */
  view.addOverlay = function (elem) {
    var rect = elem.getBoundingClientRect();

    var overlay = H.div("sr-overlay");
    overlay.style.top = (H.getScrollTop() + rect.top) + "px";
    overlay.style.left = (H.getScrollLeft() + rect.left) + "px";
    overlay.style.width = rect.width + "px";
    overlay.style.height = rect.height + "px";
    overlay.style.backgroundColor = config("selection_color");
    document.body.appendChild(overlay);
    elem.___jetztOverlay = overlay;

    overlaidElems.push(elem);

    return rect.top < window.innerHeight;
  };

  view.removeOverlay = function (elem) {
    if (elem.___jetztOverlay) {
      elem.___jetztOverlay.remove();
      delete elem.___jetztOverlay;
      H.removeFromArray(overlaidElems, elem);
    }
  };

  view.removeAllOverlays = function () {
    for (var i = overlaidElems.length; i--;) {
      var elem = overlaidElems[i];
      elem.___jetztOverlay.remove();
      delete elem.___jetztOverlay;
    }
    overlaidElems = [];
  };



  var highlight;

  view.highlightRange = function (range) {
    // todo
  };


})(this);
