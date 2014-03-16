/*
   Licensed under the Apache License v2.0.
            
   A copy of which can be found at the root of this distrubution in 
   the file LICENSE-2.0 or at http://www.apache.org/licenses/LICENSE-2.0
*/

  function handleKeydown (ev) {
    if(ev.ctrlKey || ev.metaKey) {
      return;
    } 
    var killEvent = function () {
      ev.preventDefault();
      ev.stopImmediatePropagation();
    };
    // handle custom keybindings eventually
    switch (ev.keyCode) {
      case 27: //esc
        killEvent();
        close();
        break;
      case 38: //up
        killEvent();
        adjustWPM(10);
        break;
      case 40: //down
        killEvent();
        adjustWPM(-10);
        break;
      case 37: //left
        killEvent();
        if (ev.altKey) prevParagraph();
        else prevSentence();
        break;
      case 39: //right
        killEvent();
        if (ev.altKey) nextParagraph();
        else nextSentence();
        break;
      case 32: //space
        killEvent();
        toggleRunning();
        break;
      case 187: // =/+ (MSIE, Safari, Chrome)
      case 107: // =/+ (Firefox, numpad)
      case 61: // =/+ (Firefox, Opera)
        killEvent();
        adjustScale(0.1);
        break;
      case 109: // -/_ (numpad, Opera, Firefox)
      case 189: // -/_ (MSIE, Safari, Chrome)
      case 173: // -/_ (Firefox)
        killEvent();
        adjustScale(-0.1);
        break;
      case 48: //0 key, for changing the theme
        killEvent();
        toggleTheme();
        break;
    }
  }
