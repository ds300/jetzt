/*
   Licensed under the Apache License v2.0.
            
   A copy of which can be found at the root of this distrubution in 
   the file LICENSE-2.0 or at http://www.apache.org/licenses/LICENSE-2.0
*/

(function (window) {
  "use strict";

  if (typeof window.jetzt !== 'undefined') {
    console.warn("jetzt unable to initialize, window.jetzt already set");
    return;
  }

  window.jetzt = {
    selectMode: selectMode
    , read: assertClosed(read)
    , readString: assertClosed(readString)
    , readDOM: assertClosed(readDOM)
    , close: assertOpen(close)
    , toggleRunning: assertOpen(toggleRunning)
    , adjustWPM: adjustWPM
    , adjustScale: adjustScale
    , DEFAULT_OPTIONS: DEFAULT_OPTIONS
    , config: config
    , setConfigBackend: setConfigBackend
    , Instructionator: Instructionator
    , nextParagraph: assertOpen(nextParagraph)
    , nextSentence: assertOpen(nextSentence)
    , prevParagraph: assertOpen(prevParagraph)
    , prevSentence: assertOpen(prevSentence)
    , select: assertClosed(select)
  };


  function select() {
    var text = window.getSelection().toString();
    if (text.trim().length > 0) {
      readString(text);
      window.getSelection().removeAllRanges();
    } else {
      selectMode();
    }
  }

  window.addEventListener("keydown", function (ev) {
    if (!instructions && ev.altKey && ev.keyCode === 83) {
      ev.preventDefault();
      select();
    }
  });

})(window);
