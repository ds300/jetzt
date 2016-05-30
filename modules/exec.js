/*
   Licensed under the Apache License v2.0.
            
   A copy of which can be found at the root of this distrubution in 
   the file LICENSE-2.0 or at http://www.apache.org/licenses/LICENSE-2.0
*/

(function (window) {

  var jetzt  = window.jetzt
    , config = jetzt.config;

  function calculateDelay(instr) {
    var interval = 60 * 1000 / config("target_wpm");
    if (instr.modifier !== "normal") {
      return interval * config(["modifiers", instr.modifier]);
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
    return interval;
  }

  var startModifiers = {
    "start_sentence": true,
    "start_paragraph": true
  };


  /**
   * Executor takes some instructions and a reader and updates the reader
   * based on the start/stop/naviation methods.
   */
  function Executor (instructions) {
    var reader = jetzt.view.reader;

    /*** STATE ***/
    var running = false // whether or not the reader is running
      , index = 0       // the index of the current instruction
      , runLoop;        // the run loop timeout

    function updateReader (instr) {
      if (typeof instr === "undefined") {
        if (index < instructions.length) {
          instr = instructions[index];
        } else {
          instr = instructions[instructions.length - 1];
        }
      }
      reader.setWord(instr.token, instr.decorator);
      reader.setWrap(instr.leftWrap, instr.rightWrap);
      reader.setProgress(100 * (index / instructions.length));

      if (index === 1) {
        startedReading();
      } else if (index === instructions.length) {
        finishedReading();
      } else if (index % 5 === 0) {
        calculateRemaining();
      }
    }

    /**
     * Calculate and display the time remaining
     */
    function calculateRemaining () {
      var words = instructions.length;
      var timestamp = Math.round(new Date().getTime() / 1000);
      var elapsed = timestamp - reader.started;
      var remaining = (elapsed * (words - index)) / index;
      reader.setMessage(Math.round(remaining) + "s left");
    }

    
    function startedReading () {
      var timestamp = Math.round(new Date().getTime() / 1000);
      reader.started = timestamp;
    }
    
    function finishedReading () {
      var words = instructions.length;
      var timestamp = Math.round(new Date().getTime() / 1000);
      var elapsed = timestamp - reader.started;
      reader.setMessage(words + " words in " + elapsed + "s");
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
     * Start executing instructions
     */
    this.start = function () {
      if (index === instructions.length) {
        index = 0;
      }
      running = true;
      defer(0);
    };

    /**
     * Stop executing instructions
     */
    this.stop = function () {
      clearTimeout(runLoop);
      running = false;
    };

    /**
     * start and stop the reader
     */
    this.toggleRunning = function (run) {
      if (run === running) return;

      running ? this.stop() : this.start();
    };
    
    /**
     * Navigate to the start of the sentence, or the start of the previous
     * sentence, if less than 5 words into current sentence.
     */
    this.prevSentence = function () {
      index = Math.max(0, index - 5);
      while (index > 0 && !startModifiers[instructions[index].modifier]) {
        index--;
      }
      if (!running) updateReader();
    };

    /**
     * Navigate to the start of the next sentence.
     */
    this.nextSentence = function () {
      index = Math.min(index+1, instructions.length - 1);
      while (index < instructions.length - 1
               && !startModifiers[instructions[index].modifier]) {
        index++;
      }
      if (!running) updateReader();
    };

    /**
     * Navigate to the start of the paragraph, or the start of the previous
     * paragraph, if less than 5 words into current paragraph
     */
    this.prevParagraph = function () {
      index = Math.max(0, index - 5);
      while (index > 0 && instructions[index].modifier != "start_paragraph") {
        index--;
      }
      if (!running) updateReader();
    };

    /**
     * Navigate to the start of the next paragraph.
     */
    this.nextParagraph = function () {
      index = Math.min(index+1, instructions.length - 1);
      while (index < instructions.length - 1
              && instructions[index].modifier != "start_paragraph") {
        index++;
      }
      if (!running) updateReader();
    };
  }


  /**
   * jetzt.exec
   * creates an instruction execution interface for a given set of
   * instructions
   */
  jetzt.exec = function (instructions) {
    return new Executor(instructions);
  };

})(this);
