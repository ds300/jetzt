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

  // split a long word into sensible sections
  function splitLongWord (word) {
    if (wordShouldBeSplitUp(word)) {
      var result = [];

      var dashIdx = word.indexOf("-");
      if (dashIdx > 0 && dashIdx < word.length - 1) {
        result.push(word.substr(0, dashIdx));
        result.push(word.substr(dashIdx + 1));
        return H.flatten(result.map(splitLongWord));
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

  // regexp that matches in-text citations
  var _reInTextCitation = (function () {
    var au = "((\\S\\.\\s)?(\\S+\\s)?\\S+?)";          // author
    var et = "(,?\\set\\sal\\.?)";                     // et al.

    var yr = "((16|17|18|19|20)\\d{2}[a-z]?)";         // year restricted in 17c.-21c.
    var pt = "([a-z]{1,4}\\.\\s\\d+)";                 // part: p. 199, chap. 5, etc.
    var yp = "(" + yr + "|" + pt + ")";                // year and part
    var pp = "(" + pt + "|\\d+)";                      // part and page

    var as = "((" + au + ",\\s)*" + au +
             ",?\\s(and|&)\\s)?" + au + et;            // multiple authors
    var ml = as + "?\\s\\d+(,\\s\\d+)*";               // MLA author-page (disabled)
    var ap = "(" + as + "?,?\\s)?" + yp +
             "((,\\s|:)" + pp + ")*";                  // APA/CMS/ASA author-year-page

    var hs = "(" + as + "|" + ap + ")";                // humanist single citation
    var hm = "\\((" + hs + "(;|,|,?\\s(and|&))\\s)*" +
             hs + "\\)";                               // humanist multiple citations
    var ie = "\\[\\d+\\]";                             // IEEE

    return new RegExp("\\s?(" + hm + "|" + ie + ")", "g");
  })();

  function stripInTextCitation (text) {
    return text.replace(_reInTextCitation, "");
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

    // add a decorator to the previous token
    this.decPrev = function (dec) {
      if (instructions.length > 0) {
        var current = instructions[instructions.length-1].decorator;
        instructions[instructions.length-1].decorator += dec;
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
          modifier: "short_space",
          decorator: ""
        });
      }
    };

    // add the token
    this.token = function (token) {
      if (spacerInstruction) {
        instructions.push(spacerInstruction);
      }

      var trunks = wordShouldBeSplitUp(token) ? splitLongWord(token) : [token]
        , last = trunks.pop();
      trunks.forEach(function (t) {
        instructions.push(_addWraps({
          token: t,
          modifier: "normal",
          decorator: "-"
        }));
      });
      instructions.push(_addWraps({
        token: last,
        modifier: modifier,
        decorator: ""
      }));

      modifier = "normal";
      spacerInstruction = null;
    };

    this.getInstructions = function () {
      return instructions;
    };
  }

  var wraps = {
    guillemot: {left: "«", right: "»"},
    double_quote: {left: "“", right: "”"},
    parens: {left: "(", right: ")"},
    heading: {left: "#", right: ""},
    blockquote: {left: "›", right: ""}  // U+203A
  };

  function parseDom(topnode,$instructionator) {
    var inst =  ($instructionator) ? $instructionator :  new Instructionator();

    var nodes = null;
    if (H.realTypeOf(topnode) === "Array") {
      nodes = topnode;
    } else {
      nodes = topnode.childNodes;

      var all_inline = [].reduce.call(
        nodes,
        function(val, node) {
          return val && (node.nodeType !== 1 ||
            !!window.getComputedStyle(node).display.match(/^inline/));
        },
        true
      );
      if (all_inline) {
        var text = topnode.textContent.trim();
        if (text.length > 0) parseText(text, inst);
        return inst.getInstructions();
      }
    }

    var node=null;
    for(var i=0;i<nodes.length;i++) {
        node = nodes[i];

        //TODO add modifiers, e.g. based on node.nodeName
        switch(node.nodeName) {
          case "H1":
          case "H2":
          case "H3":
          case "H4":
          case "H5":
          case "H6":
            inst.clearWrap();
            inst.pushWrap(wraps.heading);
            inst.modNext("start_paragraph");
            parseDom(node,inst);
            inst.spacer();
            inst.popWrap(wraps.heading);
            inst.modPrev("end_paragraph");
            break;
          case "BLOCKQUOTE":
            inst.pushWrap(wraps.blockquote);
            inst.modNext("start_paragraph");
            parseDom(node,inst);
            inst.popWrap(wraps.blockquote);
            inst.modPrev("end_paragraph");
            break;
          case "SCRIPT":
            break;
          case "#text":
            if(node.textContent.trim().length > 0) parseText(node.textContent.trim(),inst);
            break;
          case "DL":
          case "OL":
          case "UL":
          case "SECTION":
          case "P":
            inst.modNext("start_paragraph");
            parseDom(node, inst)
            inst.modPrev("end_paragraph");
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
    if (config("strip_citation")) text = stripInTextCitation(text);
                        // long dashes ↓
    var tokens = text.match(/["«»“”\(\)\/–—]|--+|\n+|[^\s"“«»”\(\)\/–—]+/g);
    if (tokens === null) tokens = [];

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
          } else if (tkn.match(/^[.?!…]+$/)) {
            $.decPrev(tkn);
            $.modPrev("end_sentence");
          } else if (tkn.match(/[.?!…]+$/)) {
            $.modNext("end_sentence");
            $.token(tkn);
            $.modNext("start_sentence");
          } else if (tkn.match(/^[,;:]$/)) {
            $.decPrev(tkn);
            $.modPrev("end_clause");
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
    parser(content, instr);

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

