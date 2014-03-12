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

(function (window) {
  "use strict";

  if (typeof window.jetzt !== 'undefined') {
    console.warn("jetzt unable to initialize, window.jetzt already set");
    return;
  }

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

  function removeFromArray (arr, item) {
    var pos = arr.indexOf(item);
    if (pos > -1) {
      arr.splice(pos, 1);
    }
  }

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

  function _modClass (elem, classes, cb) {
    var elemClasses = [];
    if (elem.className.trim().length >= 0) {
      elemClasses = elem.className.split(/\s+/)
    }

    classes.split(/\s+/).forEach(function (klass) {
      cb(elemClasses, klass);
    });

    elem.className = elemClasses.join(" ");
  }

  function addClass (elem, classesToAdd) {
    _modClass(elem, classesToAdd, function (acc, klass) {
      removeFromArray(acc, klass);
      acc.push(klass);
    });
  }

  function removeClass (elem, classesToRemove) {
    _modClass(elem, classesToRemove, removeFromArray);
  }

  function realTypeOf (thing) {
    return Object.prototype.toString.call(thing).slice(8, -1);
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

  // merge objects together and so forth. don't rely on child object
  // references being preserved.
  function recursiveExtend () {
    var result = arguments[0];
    for (var i=1; i<arguments.length; i++) {
      var uber = arguments[i];
      for (var prop in uber) {
        if (uber.hasOwnProperty(prop)) {
          if (result.hasOwnProperty(prop)) {
            var resultVal = result[prop];
            var uberVal = uber[prop];
            if (realTypeOf(resultVal) === 'Object' && realTypeOf(uberVal) === 'Object') {
              result[prop] = recursiveExtend({}, resultVal, uberVal);
            } else {
              result[prop] = uberVal;
            }
          } else {
            result[prop] = uber[prop];
          }
        }
      }
    }
    return result;
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

  var DEFAULT_OPTIONS = {
      target_wpm: 400,
      scale: 1,
      dark: false,
      modifiers: {
        normal: 1,
        start_clause: 1,
        end_clause: 1.8,
        start_sentence: 1.3,
        end_sentence: 2.2,
        start_paragraph: 2.0,
        end_paragraph: 2.8,
        short_space: 1.5,
        long_space: 2.2
      }
      // keybindings and so forth soon
  };

  var options = recursiveExtend({}, DEFAULT_OPTIONS);

  // placeholder config backend for when there is no real backend.
  var configBackend = {
    get: function (cb) {
      cb(options);
    },
    set: function (opts) {}
  };

  /**
   * jetzt.setConfigBackend
   * Set the config 'backend' store. Should be an object with methods
   * void get(cb(opts))
   * void set(opts)
   */
  function setConfigBackend (backend) {
    configBackend = backend;
    backend.get(function (opts) {
      if (realTypeOf(opts) === 'Object') {
        options = recursiveExtend({}, options, opts);
      } else {
        throw new Error("bad config backend");
      }
    });
  };

  // recursive lookup
  function lookup (map, keyPath) {
    if (keyPath.length === 0) throw new Error("this should never happen");

    var key = keyPath[0];
    if (keyPath.length === 1) {
      if (!map.hasOwnProperty(key)) {
        console.warn("config lookup: no key '"+key+"'");
      }
      return map[key];
    } else {
      var submap = map[key];
      if (realTypeOf(submap) !== 'Object') {
        console.warn("config lookup: no key '"+key+"'");
        return;
      } else {
        return lookup(submap, keyPath.slice(1));
      }
    }
  }

  function put (map, keyPath, val) {
    if (keyPath.length === 0) throw new Error("this should never happen");

    var key = keyPath[0];
    if (keyPath.length === 1) {
      map[key] = val;
    } else {
      var submap = map[key];
      if (realTypeOf(submap) !== 'Object') {
        submap = {};
        map[key] = submap;
      }
      _put(submap, keyPath.slice(1), val);
    }
  }


  /**
   * jetzt.config
   * get and set config variables.
   *
   * e.g.
   *      jetzt.config("cheese", "Edam")
   * 
   * sets the "cheese" option to the string "Edam"
   *
   *      jetzt.config("cheese")
   *
   *      => "edam"
   *
   * It also has support for key paths
   *
   *      jetzt.config(["cheese", "color"], "blue")
   *      jetzt.config(["cheese", "name"], "Stilton")
   *
   *      jetzt.config(["cheese", "name"])
   *
   *      => "Stilton"
   *
   *      jetzt.config("cheese")
   * 
   *      => {color: "blue", name: "Stilton"}
   */
  function config (keyPath, val) {
    if (typeof keyPath === 'string') keyPath = [keyPath];

    if (typeof val === 'undefined') {
      return lookup(options, keyPath);
    } else {
      put(options, keyPath, val);
      configBackend.set(options);
    }
  }

  function modifier(mod) {
    return config(["modifiers", mod]) || 1;
  }

  function maxModifier(a, b) {
    if ((modifier(a) || 1) > (modifier(b) || 1)) {
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
    $$  ____/ $$  __$$ |$$  __$$   \____$$\   $$ |  $$ \$$$$ |$$ |\_$$ |
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

  /**
   * Helper class for generating jetzt instructions.
   * Very subject to change.
   */
  function Instructionator () {
    // state
    var instructions = []
      , modifier = "normal"
      , wraps = []
      , spacerInstruction = null
      , done = false;

    // add a modifier to the next token
    this.modNext = function (mod) {
      modifier = maxModifier(modifier, mod);
    };

    // add a modifier to the previous token
    this.modPrev = function (mod) {
      if (instructions.length > 0) {
        var current = instructions[instructions.length-1].modifier;
        instructions[instructions.length-1].modifier = maxModifier(current, mod);
      }
    };

    // start a wrap on the next token
    this.pushWrap = function (wrap) {
      wraps.push(wrap);
    };

    // stop the specified wrap before the next token.
    // Pops off any wraps in the way
    this.popWrap = function (wrap) {
      var idx = wraps.lastIndexOf(wrap);
      if (idx > -1)
        wraps.splice(wraps.lastIndexOf(wrap), wraps.length);
    };

    // pop all wraps
    this.clearWrap = function (wrap) {
      wraps = [];
    };

    var _addWraps = function (instr) {
      instr.leftWrap = wraps.map(function (w) { return w.left; }).join("");
      instr.rightWrap = wraps.map(function (w) { return w.right; }).reverse().join("");
      return instr;
    }

    // put a spacer before the next token
    this.spacer = function () {
      if (spacerInstruction) {
        spacerInstruction.modifier = "long_space";
      } else {
        spacerInstruction = _addWraps({
          token: "   ",
          modifier: "short_space"
        });
      }
    };

    var _emit = function (token) {
      if (spacerInstruction) {
        instructions.push(spacerInstruction);
      }

      instructions.push(_addWraps({
        token: token,
        modifier: modifier
      }));

      modifier = "normal";
      spacerInstruction = null;
    };

    // add the token
    this.token = function (tkn) {
      if (wordShouldBeSplitUp(tkn)) {
        splitLongWord(tkn).forEach(_emit);
      } else {
        _emit(tkn);
      }
    };

    this.getInstructions = function () {
      return instructions;
    };
  }

  var wraps = {
    double_quote: {left: "“", right: "”"},
    parens: {left: "(", right: ")"},
    heading1: {left: "H1", right: ""}
  };

  function parseDom(topnode,$instructionator) {
    var inst =  ($instructionator) ? $instructionator :  new Instructionator();
    var node=null;

    for(var i=0;i<topnode.childNodes.length;i++) {
        node=topnode.childNodes[i];

        //TODO add modifiers, e.g. based on node.nodeName
        switch(node.nodeName) {
          case "H1":
            //commented out until view for headings is implemented    
            //inst.pushWrap(wraps.heading1);
            inst.modNext("start_paragraph");
            parseDom(node,inst);
            inst.spacer();
            inst.clearWrap();
            inst.modPrev("end_paragraph");
            break;
          case "SCRIPT":
            break;
          case "#text":
            if(node.textContent.trim().length > 0) parseText(node.textContent.trim(),inst);
            break;
          case "P":
            inst.clearWrap();
            inst.modNext("start_paragraph");
            parseDom(node, inst)
            inst.modPrev("end_paragraph");
            inst.clearWrap();
            break;
          case "#comment":
            break;
          default:
            parseDom(node,inst);
        }
    }

    return inst.getInstructions();
  }

  // convert raw text into instructions
  function parseText (text,$instructionator) {
                        // long dashes ↓
    var tokens = text.match(/["“”\(\)\/–—]|--+|\n+|[^\s"“”\(\)\/–—]+/g);

    var $ = ($instructionator) ? $instructionator :  new Instructionator();

    // doesn't handle nested double quotes, but that junk is *rare*;
    var double_quote_state = false;

    for (var i=0; i<tokens.length; i++) {
      var tkn = tokens[i];

      switch (tkn) {
        case "“":
          $.spacer();
          $.pushWrap(wraps.double_quote);
          $.modNext("start_clause");
          break;
        case "”":
          $.popWrap(wraps.double_quote);
          $.modPrev("end_clause");
          $.spacer();
          break;
        case "\"":
          if (double_quote_state) {
            $.popWrap(wraps.double_quote)
            $.spacer();
            $.modNext("start_clause");
          } else {
            $.spacer();
            $.pushWrap(wraps.double_quote);
            $.modPrev("end_clause");
          }
          double_quote_state = !double_quote_state;
          break;
        case "(":
          $.spacer();
          $.pushWrap(wraps.parens);
          $.modNext("start_clause");
          break;
        case ")":
          $.popWrap(wraps.parens);
          $.modPrev("end_clause");
          $.spacer();
          break;
        default:
          if (tkn.match(/^(\/|--+|—|–)$/)) {
            $.modNext("start_clause");
            $.token(tkn);
            $.modNext("start_clause");
          } else if (tkn.match(/[.?!…]+$/)) {
            $.modNext("end_sentence");
            $.token(tkn);
            $.modNext("start_sentence");
          } else if (tkn.match(/[,;:]$/)) {
            $.modNext("end_clause");
            $.token(tkn);
            $.modNext("start_clause");
          } else if (tkn.match(/\n+/)) {
            if (tkn.length > 1
                // hack for linefeed-based word wrapping. Ugly. So ugly.
                || (i > 0 && tokens[i - 1].match(/[.?!…'"”]+$/))) {

              $.clearWrap();
              $.modPrev("end_paragraph");
              $.spacer();
              $.modNext("start_paragraph");
              double_quote_state = false;
            }
          } else if (tkn.match(/^".+$/)) {
            double_quote_state = true;
            $.modNext("start_clause");
            $.token(tkn.substr(1));
          } else {
            $.token(tkn);
          }
      }
    }

    return $.getInstructions();
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
  var running = false, // whether or not the reader is running
      instructions,    // the list of instructions
      index,           // the index of the current instruction
      runLoop,         // the run loop timeout
      reader;          // the reader, man.


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
      , reticle = div("sr-reticle")
      , hiddenInput = elem("input", "sr-input")

      , box = div("sr-reader", [
          leftWrap,
          div("sr-word-box", [reticle, progressBar, word, wpm, hiddenInput]),
          rightWrap
        ])

      , wrapper = div("sr-reader-wrapper", [box]);

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

    this.show = function (cb) {
      // fade in backdrop
      document.body.appendChild(backdrop);
      backdrop.offsetWidth;
      addClass(backdrop, "in");

      // pull down box;
      document.body.appendChild(wrapper);
      wrapper.offsetWidth;
      addClass(wrapper, "in");

      // initialise custom size/wpm
      this.setScale(config("scale"));
      this.setWPM(config("target_wpm"));

      // initialise custom theme
      this.setTheme(config("dark"));

      // need to stop the input focus from scrolling the page up.
      var scrollTop = document.body.scrollTop;
      grabFocus();
      document.body.scrollTop = scrollTop;

      hiddenInput.onblur = grabFocus;

      typeof cb === 'function' && window.setTimeout(cb, 340);
    };


    this.hide = function (cb) {
      hiddenInput.onblur = null;
      hiddenInput.blur();
      removeClass(backdrop, "in");
      removeClass(wrapper, "in");
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

    this.setTheme = function (dark) {
      if (dark)
        addClass(box, "sr-dark");
      else
        removeClass(box, "sr-dark");
    };

    this.setProgress = function (percent) {
      progressBar.style.borderLeftWidth = Math.ceil(percent * 4) + "px";
    };

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

  function readStuff (parse, content) {
    var instr = new Instructionator();
    if (realTypeOf(content) === "Array") {
      content.forEach(function (item) {
        instr.modNext("start_paragraph");
        parse(item, instr);
        instr.clearWrap();
        instr.modPrev("end_paragraph");
      });
    } else {
      parse(content, instr);
    }

    read(instr.getInstructions());
  }

  /**
   * Read the given string, or array of strings.
   */
  function readString (str) {
    readStuff(parseText, str);
  }

  /**
   * Read the given DOM element, or array of DOM elements.
   */
  function readDOM (dom) {
    readStuff(parseDom, dom);
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
   * Begin interactive dom node selection.
   */
  function selectMode () {
    var selection = [];
    var overlays = [];
    var previousElement = null;

    var showSelection = function () {

      overlays = [];

      for (var i=0, len=selection.length; i < len; i++) {
        var rect = selection[i].getBoundingClientRect();

        if (rect.top >= window.innerHeight) {
          break;
        } else {
          var overlay = div("sr-overlay");
          overlay.style.top = (document.body.scrollTop + rect.top) + "px";
          overlay.style.left = (document.body.scrollLeft + rect.left) + "px";
          overlay.style.width = rect.width + "px";
          overlay.style.height = rect.height + "px";
          document.body.appendChild(overlay);
          overlays.push(overlay);
        }
      }
    };

    var hideSelection = function () {
      overlays.forEach(function (el) {
        el.remove();
      });
    };

    var setSelection = function (sel) {
      hideSelection();
      selection = sel;
      showSelection();
    };

    

    var validParents = {
      "DIV": true,
      "ARTICLE": true,
      "BLOCKQUOTE": true,
      "MAIN": true,
      "SECTION": true,
      "UL": true,
      "OL": true,
      "DL": true
    };

    var validChildren = {
      "P": true,
      "H1": true,
      "H2": true,
      "H3": true,
      "H4": true,
      "H5": true,
      "H6": true,
      "SPAN": true,
      "DL": true,
      "OL": true,
      "UL": true,
      "BLOCKQUOTE": true,
      "SECTION": true,
    };

    var selectSiblings = function (el) {
      var firstChild = el;
      var parent = el.parentNode;
      while (parent && !validParents[parent.tagName]) {
        firstChild = parent;
        parent = firstChild.parentNode;

      }

      if (parent) {
        var kids = parent.childNodes
          , len = kids.length
          , result = []
          , i = 0;

          while (kids[i] !== firstChild) i++;

          for (; i < len; i++) {
            var kid = kids[i];
            if (validChildren[kid.tagName]) {
              result.push(kid);
            }
          }

          return result;

      } else {
        return [el];
      }
    };

    var stop = function () {
      hideSelection();
      window.removeEventListener("mouseover", mouseoverHandler);
      window.removeEventListener("mousemove", moveHandler);
      window.removeEventListener("keydown", keydownHandler);
      window.removeEventListener("keyup", keyupHandler);
      window.removeEventListener("click", clickHandler);
      previousElement && removeClass(previousElement, "sr-pointer");
    };

    var mouseoverHandler = function (ev) {
      previousElement && removeClass(previousElement, "sr-pointer");

      addClass(ev.target, "sr-pointer");

      previousElement = ev.target;

      if (ev.altKey) {
        setSelection([ev.target]);
      } else {
        setSelection(selectSiblings(ev.target));
      }
    };

    var clickHandler = function (ev) {
      stop();
      readDOM(selection);
    };

    var moveHandler = function (ev) {
      mouseoverHandler(ev);
      window.removeEventListener("mousemove", moveHandler);
    };

    var keydownHandler = function (ev) {
      if (ev.keyCode === 27) {
        stop();
      } else if (ev.altKey && selection.length > 1) {
        setSelection([selection[0]]);
      }
    };

    var keyupHandler = function (ev) {
      if (!ev.altKey && selection.length === 1) {
        setSelection(selectSiblings(selection[0]));
      }
    };

    window.addEventListener("mouseover", mouseoverHandler);
    window.addEventListener("click", clickHandler);
    window.addEventListener("mousemove", moveHandler);
    window.addEventListener("keydown", keydownHandler);
    window.addEventListener("keyup", keyupHandler);
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


  window.addEventListener("keydown", function (ev) {
    if (!instructions && ev.altKey && ev.keyCode === 83) {
      ev.preventDefault();
      select();
    }
  });

})(window);
