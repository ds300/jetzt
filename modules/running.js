/*
   Licensed under the Apache License v2.0.
            
   A copy of which can be found at the root of this distrubution in 
   the file LICENSE-2.0 or at http://www.apache.org/licenses/LICENSE-2.0
*/

(function (window) {

  var jetzt  = window.jetzt
    , config = jetzt.config
    , Reader = jetzt.Reader;

  /*** STATE ***/
  var running = false // whether or not the reader is running
    , instructions    // the list of instructions
    , index           // the index of the current instruction
    , runLoop         // the run loop timeout
    , reader;          // the reader, man.

  function calculateDelay(instr) {
    var interval = 60 * 1000 / config("target_wpm");
    if (instr.modifier !== "normal") {
      return interval * config.getModifier(instr.modifier);
    } else {
      var len = instr.token.length;
      var mul = 1;
      switch (len) {
        case 6:
        case 7:
          mul = 1.2;
          break;
        case 8:
        case 9:
          mul = 1.4;
          break;
        case 10:
        case 11:
          mul = 1.8;
          break;
        case 12:
        case 13:
          mul = 2;
      }
      return interval * mul;
    }
  }

  function updateReader (instr) {
    if (typeof instr === "undefined") {
      if (index < instructions.length) {
        instr = instructions[index];
      } else {
        instr = instructions[instructions.length - 1];
      }
    }
    reader.setWord(instr.token);
    reader.setWrap(instr.leftWrap, instr.rightWrap);
    reader.setProgress(100 * (index / instructions.length));
  }

  function handleInstruction (instr) {
    updateReader(instr);
    defer(calculateDelay(instr));
  }

  function defer (time) {
    runLoop = setTimeout(function (){
      if (running && index < instructions.length) {
        handleInstruction(instructions[index++]);
      } else {
        running = false;
      }
    }, time);
  }

  /**
   * start and stop the reader
   */
  function toggleRunning (run) {
    if (run === running) return;
    if (!instructions) throw new Error("jetzt has not been initialized");

    if (running) {
      clearTimeout(runLoop);
      running = false;
    } else {
      if (index === instructions.length) {
        index = 0;
      }
      running = true;
      defer(0);
    }
  }

  var startModifiers = {
    "start_sentence": true,
    "start_paragraph": true
  };

  /**
   * Navigate to the start of the sentence, or the start of the previous
   * sentence, if less than 5 words into current sentence.
   */
  function prevSentence () {
    index = Math.max(0, index - 5);
    while (index > 0 && !startModifiers[instructions[index].modifier]) {
      index--;
    }
    if (!running) updateReader();
  }

  /**
   * Navigate to the start of the next sentence.
   */
  function nextSentence () {
    index = Math.min(index+1, instructions.length - 1);
    while (index < instructions.length - 1 && !startModifiers[instructions[index].modifier]) {
      index++;
    }
    if (!running) updateReader();
  }

  /**
   * Navigate to the start of the paragraph, or the start of the previous
   * paragraph, if less than 5 words into current paragraph
   */
  function prevParagraph () {
    index = Math.max(0, index - 5);
    while (index > 0 && instructions[index].modifier != "start_paragraph") {
      index--;
    }
    if (!running) updateReader();
  }

  /**
   * Navigate to the start of the next paragraph.
   */
  function nextParagraph () {
    index = Math.min(index+1, instructions.length - 1);
    while (index < instructions.length - 1 && instructions[index].modifier != "start_paragraph") {
      index++;
    }
    if (!running) updateReader();
  }

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

  jetzt.close          = assertOpen(close);
  jetzt.toggleRunning  = assertOpen(toggleRunning);
  jetzt.adjustWPM      = adjustWPM;
  jetzt.adjustScale    = adjustScale;
  jetzt.read           = assertClosed(read);
  jetzt.nextParagraph  = assertOpen(nextParagraph);
  jetzt.nextSentence   = assertOpen(nextSentence);
  jetzt.prevParagraph  = assertOpen(prevParagraph);
  jetzt.prevSentence   = assertOpen(prevSentence);

})(this);


