/*
   Licensed under the Apache License v2.0.
            
   A copy of which can be found at the root of this distrubution in 
   the file LICENSE-2.0 or at http://www.apache.org/licenses/LICENSE-2.0
*/

function calculateDelay(instr) {
  var interval = 60 * 1000 / config("target_wpm");
  if (instr.modifier !== "normal") {
    return interval * modifier(instr.modifier);
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
