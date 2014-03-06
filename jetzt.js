/*

  Copyright (c) David Sheldrick 2014

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.

*/

(function () {

  /*
    $$\   $$\ $$$$$$$$\ $$\       $$$$$$$\  $$$$$$$$\ $$$$$$$\   $$$$$$\  
    $$ |  $$ |$$  _____|$$ |      $$  __$$\ $$  _____|$$  __$$\ $$  __$$\ 
    $$ |  $$ |$$ |      $$ |      $$ |  $$ |$$ |      $$ |  $$ |$$ /  \__|
    $$$$$$$$ |$$$$$\    $$ |      $$$$$$$  |$$$$$\    $$$$$$$  |\$$$$$$\  
    $$  __$$ |$$  __|   $$ |      $$  ____/ $$  __|   $$  __$$<  \____$$\ 
    $$ |  $$ |$$ |      $$ |      $$ |      $$ |      $$ |  $$ |$$\   $$ |
    $$ |  $$ |$$$$$$$$\ $$$$$$$$\ $$ |      $$$$$$$$\ $$ |  $$ |\$$$$$$  |
    \__|  \__|\________|\________|\__|      \________|\__|  \__| \______/ 
  */

  // make an element of the specified tag and class
  function elem (tagName, className, kids) {
    var result = document.createElement(tagName);
    result.className = className || "";
    if (kids) {
      kids.forEach(function (kid) {result.appendChild(kid);})
    }
    return result;
  }

  function div (className, kids) {
    return elem('div', className, kids);
  }

  function span (className, kids) {
    return elem('span', className, kids);
  }


  // flatten possibly nested array
  function flatten (arr) {
    var result = [];
    var flat = function flat (thing) {
      if (Object.prototype.toString.call(thing) === '[object Array]')
        thing.forEach(flat);
      else
        result.push(thing);
    };
    flat(arr);
    return result;
  }

  function clamp (min, num, max) {
    return Math.min(Math.max(num, min), max);
  }


  /*
     $$$$$$\   $$$$$$\  $$\   $$\ $$$$$$$$\ $$$$$$\  $$$$$$\  
    $$  __$$\ $$  __$$\ $$$\  $$ |$$  _____|\_$$  _|$$  __$$\ 
    $$ /  \__|$$ /  $$ |$$$$\ $$ |$$ |        $$ |  $$ /  \__|
    $$ |      $$ |  $$ |$$ $$\$$ |$$$$$\      $$ |  $$ |$$$$\ 
    $$ |      $$ |  $$ |$$ \$$$$ |$$  __|     $$ |  $$ |\_$$ |
    $$ |  $$\ $$ |  $$ |$$ |\$$$ |$$ |        $$ |  $$ |  $$ |
    \$$$$$$  | $$$$$$  |$$ | \$$ |$$ |      $$$$$$\ \$$$$$$  |
     \______/  \______/ \__|  \__|\__|      \______| \______/
  */

  var config = (function () {
    var storageEnabled = function () {
      return !!(window.chrome && chrome.storage);
    };

    var default_options = {
      target_wpm: 400,
      scale: 1
    };

    var options = default_options;

    if (storageEnabled())
      chrome.storage.local.get(default_options, function (value) {
        options = value;
      });

    return function (key, val) {
      if (typeof val === 'undefined') {
        if (options.hasOwnProperty(key)) {
          return options[key];
        } else {
          throw new Error("bad key: " + key);
        }
      } else if (options.hasOwnProperty(key) && typeof val === typeof options[key]){
        options[key] = val;
        if (storageEnabled())
          chrome.storage.local.set(options);
      } else {
        throw new Error("bad key/val: " + key + ": " + val);
      }
    };
  })();

    // delay multipliers
  var modifiers = {
    normal: 1,
    start_clause: 1,
    end_clause: 1.8,
    start_sentence: 1.3,
    end_sentence: 2.2,
    start_paragraph: 2.0,
    end_paragraph: 2.8,
    short_space: 1.5,
    long_space: 2.2
  };

  function maxModifier(a, b) {
    if ((modifiers[a] || 1) > (modifiers[b] || 1)) {
      return a;
    } else {
      return b;
    }
  }


  /*
    $$$$$$$\   $$$$$$\  $$$$$$$\   $$$$$$\  $$$$$$\ $$\   $$\  $$$$$$\  
    $$  __$$\ $$  __$$\ $$  __$$\ $$  __$$\ \_$$  _|$$$\  $$ |$$  __$$\ 
    $$ |  $$ |$$ /  $$ |$$ |  $$ |$$ /  \__|  $$ |  $$$$\ $$ |$$ /  \__|
    $$$$$$$  |$$$$$$$$ |$$$$$$$  |\$$$$$$\    $$ |  $$ $$\$$ |$$ |$$$$\ 
    $$  ____/ $$  __$$ |$$  __$$<  \____$$\   $$ |  $$ \$$$$ |$$ |\_$$ |
    $$ |      $$ |  $$ |$$ |  $$ |$$\   $$ |  $$ |  $$ |\$$$ |$$ |  $$ |
    $$ |      $$ |  $$ |$$ |  $$ |\$$$$$$  |$$$$$$\ $$ | \$$ |\$$$$$$  |
    \__|      \__|  \__|\__|  \__| \______/ \______|\__|  \__| \______/ 
  */

  function wordShouldBeSplitUp(word) {
    return word.length > 13 || word.length > 9 && word.indexOf("-") > -1;
  }

  function _maybeSplitLongWord (word) {
    if (wordShouldBeSplitUp(word)) {
      var result = [];

      var dashIdx = word.indexOf("-");
      if (dashIdx > 0 && dashIdx < word.length - 1) {
        result.push(word.substr(0, dashIdx));
        result.push(word.substr(dashIdx + 1));
        return flatten(result.map(_maybeSplitLongWord));
      } else {
        var partitions = Math.ceil(word.length / 8);
        var partitionLength = Math.ceil(word.length / partitions);
        while (partitions--) {
          result.push(word.substr(0, partitionLength));
          word = word.substr(partitionLength);
        }
        return result;
      }
    } else {
      return [word];
    }
  }

  // split a long word into sensible sections
  function splitLongWord (word) {
    var result = _maybeSplitLongWord(word);
    if (result.length > 1) {
      for (var i=0; i<result.length-1; i++) {
        result[i] += "-";
      }
    }
    return result;
  }

  var wraps = {
    double_quote: {left: "“", right: "”"},
    parens: {left: "(", right: ")"}
  };

  // convert raw text into instructions
  function parseText(text) {
                        // long dashes ↓
    var tokens = text.match(/["“”\(\)\/–—]|--+|\n+|[^\s"“”\(\)\/–—]+/g);

    var instructions = [];

    var modifier = "start_paragraph";

    var modNext = function (mod) {
      modifier = maxModifier(modifier, mod);
    };

    var modPrev = function (mod) {
      if (instructions.length > 0) {
        var current = instructions[instructions.length-1].modifier;
        instructions[instructions.length-1].modifier = maxModifier(current, mod);
      }
    };

    var leftWrap = "";
    var rightWrap = "";

    var pushWrap = function (wrap) {
      leftWrap += wrap.left;
      rightWrap = wrap.right + rightWrap;
    };

    var popWrap = function (wrap) {
      var left = "";
      while (left !== wrap.left && leftWrap.length > 0) {
        left = leftWrap.substr(leftWrap.length - 1);
        leftWrap = leftWrap.substr(0, leftWrap.length - 1);
        rightWrap = rightWrap.substr(1);
      }
    };

    var clearWrap = function (wrap) {
      leftWrap = "";
      rightWrap = "";
    };

    var spacerInstruction = null;

    var spacer = function () {
      if (spacerInstruction) {
        spacerInstruction.modifier = "long_space";
      } else {
        spacerInstruction = {
          leftWrap: leftWrap,
          rightWrap: rightWrap,
          token: "   ",
          modifier: "short_space"
        };
      }
    };

    var emit = function (token) {
      if (spacerInstruction) {
        instructions.push(spacerInstruction);
      }

      instructions.push({
        token: token,
        leftWrap: leftWrap,
        rightWrap: rightWrap,
        modifier: modifier
      });

      modifier = "normal";
      spacerInstruction = null;
    };

    // doesn't handle nested double quotes, but that junk is *rare*.
    var double_quote_state = false;

    var handle_tkn = function (tkn) {
      if (wordShouldBeSplitUp(tkn)) {
        splitLongWord(tkn).forEach(emit);
      } else {
        emit(tkn);
      }
    };
    

    for (var i=0; i<tokens.length; i++) {
      var tkn = tokens[i];

      switch (tkn) {
        case "“":
          spacer();
          pushWrap(wraps.double_quote);
          modNext("start_clause");
          break;
        case "”":
          popWrap(wraps.double_quote);
          modPrev("end_clause");
          spacer();
          break;
        case "\"":
          if (double_quote_state) {
            spacer();
            popWrap(wraps.double_quote)
            modNext("start_clause");
          } else {
            pushWrap(wraps.double_quote);
            modPrev("end_clause");
            spacer();
          }
          double_quote_state = !double_quote_state;
          break;
        case "(":
          spacer();
          pushWrap(wraps.parens);
          modNext("start_clause");
          break;
        case ")":
          popWrap(wraps.parens);
          modPrev("end_clause");
          spacer();
          break;
        default:
          if (tkn.match(/^(\/|--+|—|–)$/)) {
            modNext("start_clause");
            handle_tkn(tkn);
            modNext("start_clause");
          } else if (tkn.match(/[.?!…]+$/)) {
            modNext("end_sentence");
            handle_tkn(tkn);
            modNext("start_sentence");
          } else if (tkn.match(/[,;:]$/)) {
            modNext("end_clause");
            handle_tkn(tkn);
            modNext("start_clause");
          } else if (tkn.match(/\n+/)) {
            clearWrap();
            modPrev("end_paragraph");
            spacer();
            modNext("start_paragraph");
            double_quote_state = false;
          } else if (tkn.match(/^".+$/)) {
            double_quote_state = true;
            modNext("start_clause");
            handle_tkn(tkn.substr(1));
          } else {
            handle_tkn(tkn);
          }
      }
    }

    return instructions;
  }



  /*
     $$$$$$\ $$$$$$$$\  $$$$$$\ $$$$$$$$\ $$$$$$$$\ 
    $$  __$$\\__$$  __|$$  __$$\\__$$  __|$$  _____|
    $$ /  \__|  $$ |   $$ /  $$ |  $$ |   $$ |      
    \$$$$$$\    $$ |   $$$$$$$$ |  $$ |   $$$$$\    
     \____$$\   $$ |   $$  __$$ |  $$ |   $$  __|   
    $$\   $$ |  $$ |   $$ |  $$ |  $$ |   $$ |      
    \$$$$$$  |  $$ |   $$ |  $$ |  $$ |   $$$$$$$$\ 
     \______/   \__|   \__|  \__|  \__|   \________|
  */

  // vars
  var running,      // whether or not the reader is running
      instructions, // the list of instructions
      index,        // the index of the current instruction
      runLoop;      // the run loop timeout


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

  // elements
  var blackout, // the dark backdrop div
      box,      // the reader box div
      wordDiv,
      wpmDiv,
      leftSpan,
      rightSpan,
      progressBar,
      reticle;

  function makeBlackout () {
    blackout = div("sr-blackout");
    document.body.appendChild(blackout);
    blackout.offsetWidth;
    blackout.className = "sr-blackout in";
  }

  function makeBox () {
    wordDiv = div("sr-word");
    wpmDiv = div("sr-wpm");
    reticle = div("sr-reticle");
    leftSpan = span();
    rightSpan = span();
    progressBar = div("sr-progress");

    box = div("sr-reader", [
      div("sr-wrap sr-left", [leftSpan]),
      div("sr-word-box", [
        reticle,
        progressBar,
        wordDiv,
        wpmDiv
      ]),
      div("sr-wrap sr-right", [rightSpan]),
    ]);

    document.body.appendChild(box);

    box.offsetWidth;
    box.style.top = "50%";
    adjustScale(0);
    adjustWPM(0);
  }

  function dismiss () {
    blackout.className = "sr-blackout";
      box.style.top = "-50%";
      window.setTimeout(function () {
        blackout.remove();
        box.remove();
        delete blackout;
        delete box;
        delete wordDiv;
        delete wpmDiv;
        delete leftSpan;
        delete rightSpan;
        delete progressBar;
        delete reticle;
      }, 340);
  }

  function adjustScale (diff) {
    var current = config("scale");
    var adjusted = clamp(0.1, current + diff, 2);
    config("scale", adjusted);

    box.style.webkitTransform = "translate(-50%, -50%) scale("+adjusted+")";
    box.style.mozTransform = "translate(-50%, -50%) scale("+adjusted+")";
    box.style.transform = "translate(-50%, -50%) scale("+adjusted+")";
  } 

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

  function setProgress (percent) {
    progressBar.style.borderLeftWidth = Math.ceil(percent * 4) + "px";
  }

  function setWord (word) {
    var pivot = calculatePivot(word);
    wordDiv.innerHTML = word.substr(0, pivot)
                        + "<span class='sr-pivot'>"
                        + word.substr(pivot, 1)
                        + "</span>"
                        + word.substr(pivot + 1);
    wordDiv.offsetWidth;
    var pivotElem = wordDiv.getElementsByClassName("sr-pivot")[0];
    var pivotCenter = reticle.offsetLeft + (reticle.offsetWidth / 2);
    wordDiv.style.left = (pivotCenter - pivotElem.offsetLeft - (pivotElem.offsetWidth / 2)) + "px";
    setProgress(100 * (index / instructions.length));
  }

  function adjustWPM (diff) {
    var current = config("target_wpm");
    var adjusted = clamp(100, current + diff, 1500);

    config("target_wpm", adjusted);

    wpmDiv.innerHTML = adjusted + "";
  }

  function setWrap (left, right) {
    if (left !== leftSpan.innerHTML) {
      leftSpan.innerHTML = left;
      rightSpan.innerHTML = right;
    }
  }

  function popWrap () {
    leftSpan.innerHTML = leftSpan.innerHTML.substr(0, leftSpan.innerHTML.length - 1);
    rightSpan.innerHTML = rightSpan.innerHTML.substr(1);
  }

  function clearWrap () {
    leftSpan.innerHTML = "";
    rightSpan.innerHTML = "";
  }


  /*
    $$$$$$$\  $$\   $$\ $$\   $$\ $$\   $$\ $$$$$$\ $$\   $$\  $$$$$$\  
    $$  __$$\ $$ |  $$ |$$$\  $$ |$$$\  $$ |\_$$  _|$$$\  $$ |$$  __$$\ 
    $$ |  $$ |$$ |  $$ |$$$$\ $$ |$$$$\ $$ |  $$ |  $$$$\ $$ |$$ /  \__|
    $$$$$$$  |$$ |  $$ |$$ $$\$$ |$$ $$\$$ |  $$ |  $$ $$\$$ |$$ |$$$$\ 
    $$  __$$< $$ |  $$ |$$ \$$$$ |$$ \$$$$ |  $$ |  $$ \$$$$ |$$ |\_$$ |
    $$ |  $$ |$$ |  $$ |$$ |\$$$ |$$ |\$$$ |  $$ |  $$ |\$$$ |$$ |  $$ |
    $$ |  $$ |\$$$$$$  |$$ | \$$ |$$ | \$$ |$$$$$$\ $$ | \$$ |\$$$$$$  |
    \__|  \__| \______/ \__|  \__|\__|  \__|\______|\__|  \__| \______/ 
  */

  function calculateDelay(instr) {
    var interval = 60 * 1000 / config("target_wpm");
    if (instr.modifier !== "normal") {
      return interval * (modifiers[instr.modifier] || 1);
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

  function handleInstruction (instr) {
    setWord(instr.token);
    setWrap(instr.leftWrap, instr.rightWrap);
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

  function toggleRunning () {
    if (running) {
      clearTimeout(runLoop);
      running = false;
    } else {
      running = true;
      defer(0);
    }
  }

  var startModifiers = {
    "start_sentence": true,
    "start_paragraph": true
  };

  function prevSentence () {
    index = Math.max(0, index - 5);
    while (index > 0 && !startModifiers[instructions[index].modifier]) {
      index--;
    }
    if (!running) setWord(instructions[index].token);
  }

  function nextSentence () {
    index = Math.min(index+1, instructions.length - 1);
    while (index < instructions.length - 1 && !startModifiers[instructions[index].modifier]) {
      index++;
    }
    if (!running) setWord(instructions[index].token);
  }

  function prevParagraph () {
    index = Math.max(0, index - 5);
    while (index > 0 && instructions[index].modifier != "start_paragraph") {
      index--;
    }
    if (!running) setWord(instructions[index].token);
  }

  function nextParagraph () {
    index = Math.min(index+1, instructions.length - 1);
    while (index < instructions.length - 1 && instructions[index].modifier != "start_paragraph") {
      index++;
    }
    if (!running) setWord(instructions[index].token);
  }

  /*
     $$$$$$\   $$$$$$\  $$\   $$\ $$$$$$$$\ $$$$$$$\   $$$$$$\  $$\       
    $$  __$$\ $$  __$$\ $$$\  $$ |\__$$  __|$$  __$$\ $$  __$$\ $$ |      
    $$ /  \__|$$ /  $$ |$$$$\ $$ |   $$ |   $$ |  $$ |$$ /  $$ |$$ |      
    $$ |      $$ |  $$ |$$ $$\$$ |   $$ |   $$$$$$$  |$$ |  $$ |$$ |      
    $$ |      $$ |  $$ |$$ \$$$$ |   $$ |   $$  __$$< $$ |  $$ |$$ |      
    $$ |  $$\ $$ |  $$ |$$ |\$$$ |   $$ |   $$ |  $$ |$$ |  $$ |$$ |      
    \$$$$$$  | $$$$$$  |$$ | \$$ |   $$ |   $$ |  $$ | $$$$$$  |$$$$$$$$\ 
     \______/  \______/ \__|  \__|   \__|   \__|  \__| \______/ \________|
  */


  function handleKeydown (ev) {
    switch (ev.keyCode) {
      case 27: //esc
        ev.preventDefault();
        close();
        break;
      case 38: //up
        ev.preventDefault();
        adjustWPM(10);
        break;
      case 40: //down
        ev.preventDefault();
        adjustWPM(-10);
        break;
      case 37: //left
        ev.preventDefault();
        if (ev.altKey) prevParagraph();
        else prevSentence();
        break;
      case 39: //right
        ev.preventDefault();
        if (ev.altKey) nextParagraph();
        else nextSentence();
        break;
      case 32: //space
        ev.preventDefault();
        if (index == instructions.length) index = 0;
        toggleRunning();
        break;
      case 107:
      case 187: //plus
        ev.preventDefault();
        adjustScale(0.1);
        break;
      case 109:
      case 189: //minus
        ev.preventDefault();
        adjustScale(-0.1);
        break;
    }
  }

  var existingOnKeyDown;

  function init (text) {
    if (!instructions) {
      makeBlackout();
      makeBox();

      blackout.onclick = close;

      instructions = parseText(text);

      index = 0;

      existingOnKeyDown = window.onkeydown;
      window.onkeydown = handleKeydown;

      setTimeout(toggleRunning, 500);
    } else {
      throw new Error("jetzt already initialized");
    }
  }

  var close = function () {
    if (instructions) {
      if (running) toggleRunning();
      dismiss();
      instructions = null;
      window.onkeydown = existingOnKeyDown; 
    } else {
      throw new Error("jetzt not yet initialized");
    }
  };

  if (!window.jetzt) {
    window.jetzt = {
      init: init,
      close: close,
      adjustWPM: adjustWPM,
      adjustScale: adjustScale,
      toggleRunning: function () {
        if (instructions) toggleRunning();
        else throw new Error("jetzt not yet initialized")
      }
    } 
  }


  window.addEventListener("keydown", function (ev) {
    if (!instructions && ev.altKey && ev.keyCode === 83) {
      ev.preventDefault();
      var text = window.getSelection().toString();
      if (text.trim().length > 0) {
        init(text);
      }
    }
  })

  
})();
