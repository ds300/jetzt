/*
   Licensed under the Apache License v2.0.
            
   A copy of which can be found at the root of this distrubution in 
   the file LICENSE-2.0 or at http://www.apache.org/licenses/LICENSE-2.0
*/

/**
 * Adjust the size of the reader
 */
function adjustScale (diff) {
  var current = config("scale");
  var adjusted = clamp(0.1, current + diff, 10);

  config("scale", adjusted);

  reader && reader.setScale(adjusted);
};


/**
 * Adjust the speed of the reader (words per minute)
 */
function adjustWPM (diff) {
  var current = config("target_wpm");
  var adjusted = clamp(100, current + diff, 1500);

  config("target_wpm", adjusted);

  reader && reader.setWPM(adjusted);
};

/**
 * Toggle the theme of the reader
 */
function toggleTheme () {
  var current = config("dark");
  config("dark", !current);
  reader && reader.setTheme(config("dark"));
};

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
    case 57: // 9 key, for 'what-was-that?'
      adjustWPM(-100);
      if (ev.altKey) prevParagraph();
      else prevSentence();
      break;
  }
}

// wrap a function to make sure it only gets called it jetzt isn't open
function assertClosed(fn) {
  return function () {
    if (instructions) throw new Error("jetzt already open");
    else fn.apply(this, arguments);
  };
}

// wrap a function to make sure it only gets called it jetzt is open
function assertOpen(fn) {
  return function () {
    if (!instructions) throw new Error("jetzt not currently open");
    else fn.apply(this, arguments);
  };
}

/**
 * Dismiss the jetzt reader
 */
function close () {
  if (instructions) {
    if (running) jetzt.toggleRunning();
    reader.hide();
    reader = null;
    instructions = null;
  } else {
    throw new Error("jetzt not yet initialized");
  }
};
