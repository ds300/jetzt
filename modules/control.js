/*
   Licensed under the Apache License v2.0.
            
   A copy of which can be found at the root of this distrubution in 
   the file LICENSE-2.0 or at http://www.apache.org/licenses/LICENSE-2.0
*/

(function (window) {

  var jetzt = window.jetzt
    , view = jetzt.view
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
    var reader = view.reader;
    var onkeydown = function (ev) {
      if(ev.ctrlKey || ev.metaKey) {
        return;
      }

      // handle custom keybindings eventually
      switch (ev.keyCode) {
        case 27: //esc
          killEvent(ev);
          executor.stop();
          reader.hide();
          break;
        case 38: //up
          killEvent(ev);
          config.adjustWPM(10);
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
          config.toggleTheme();
          break;
      }
    };

    reader.onKeyDown(onkeydown);
  }

  function open (instrs) {
    instructions = instrs;

    reader = new Reader();
    reader.onBackdropClick(close);
    reader.onKeyDown(handleKeydown)
    reader.show();

    index = 0;

    setTimeout(toggleRunning, 500);
  }

})(this);


