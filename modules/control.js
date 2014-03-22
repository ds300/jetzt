/*
   Licensed under the Apache License v2.0.
            
   A copy of which can be found at the root of this distrubution in 
   the file LICENSE-2.0 or at http://www.apache.org/licenses/LICENSE-2.0
*/

(function (window) {

  var jetzt = window.jetzt
    , H = jetzt.helpers
    , config = jetzt.config
    , control = {};

  jetzt.control = control;

  function killEvent (ev) {
    ev.preventDefault();
    ev.stopImmediatePropagation();
  }

  /**
   * hooks an executor up to keyboard controls.
   */
  control.keyboard = function (executor) {
    jetzt.view.reader.onKeyDown(function (ev) {
      if(ev.ctrlKey || ev.metaKey) {
        return;
      }

      // handle custom keybindings eventually
      switch (ev.keyCode) {
        case 27: //esc
          killEvent(ev);
          jetzt.quit();
          break;
        case 38: //up
          killEvent(ev);
          config.adjustWPM(+10);
          break;
        case 40: //down
          killEvent(ev);
          config.adjustWPM(-10);
          break;
        case 37: //left
          killEvent(ev);
          if (ev.altKey) executor.prevParagraph();
          else executor.prevSentence();
          break;
        case 39: //right
          killEvent(ev);
          if (ev.altKey) executor.nextParagraph();
          else executor.nextSentence();
          break;
        case 32: //space
          killEvent(ev);
          executor.toggleRunning();
          break;
        case 187: // =/+ (MSIE, Safari, Chrome)
        case 107: // =/+ (Firefox, numpad)
        case 61: // =/+ (Firefox, Opera)
          killEvent(ev);
          config.adjustScale(0.1);
          break;
        case 109: // -/_ (numpad, Opera, Firefox)
        case 189: // -/_ (MSIE, Safari, Chrome)
        case 173: // -/_ (Firefox)
          killEvent(ev);
          config.adjustScale(-0.1);
          break;
        case 48: //0 key, for changing the theme
          killEvent(ev);
          config("dark", !config("dark"));
          break;
        case 191: // / and ?
          killEvent(ev);
          config("show_message", !config("show_message"));
          break;
      }

    });
  };

  window.addEventListener("keydown", function (ev) {
    if (!jetzt.isOpen() && ev.altKey && ev.keyCode === 83) {
      ev.preventDefault();
      jetzt.select();
    }
  });

})(this);
