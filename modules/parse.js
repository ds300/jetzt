/*
   Licensed under the Apache License v2.0.
            
   A copy of which can be found at the root of this distrubution in 
   the file LICENSE-2.0 or at http://www.apache.org/licenses/LICENSE-2.0
*/

(function (window) {

  var jetzt = window.jetzt;
  var H = jetzt.helpers;
  var config = jetzt.config;


  // splitting long words. Used by the Instructionator.

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
        return H.flatten(result.map(_maybeSplitLongWord));
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
      modifier = config.maxModifier(modifier, mod);
    };

    // add a modifier to the previous token
    this.modPrev = function (mod) {
      if (instructions.length > 0) {
        var current = instructions[instructions.length-1].modifier;
        instructions[instructions.length-1].modifier = config.maxModifier(current, mod);
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
    guillemot: {left: "«", right: "»"},
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
    var tokens = text.match(/["«»“”\(\)\/–—]|--+|\n+|[^\s"“«»”\(\)\/–—]+/g);

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
        case "«":
          $.spacer();
          $.pushWrap(wraps.guillemot);
          $.modNext("start_clause");
          break;
        case "»":
          $.popWrap(wraps.guillemot);
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

  function parseStuff (parser, content) {
    var instr = new Instructionator();
    if (H.realTypeOf(content) === "Array") {
      content.forEach(function (item) {
        instr.modNext("start_paragraph");
        parser(item, instr);
        instr.clearWrap();
        instr.modPrev("end_paragraph");
      });
    } else {
      parser(content, instr);
    }

    return instr.getInstructions();
  }

  jetzt.parse = {
    /**
     * Read the given string, or array of strings.
     */
    string: function (str) {
      return parseStuff(parseText, str);
    },

    /**
     * Read the given DOM element, or array of DOM elements.
     */
    dom: function (dom) {
      return parseStuff(parseDom, dom);
    }
  };

})(this);

