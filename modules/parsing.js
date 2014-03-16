/*
   Licensed under the Apache License v2.0.
            
   A copy of which can be found at the root of this distrubution in 
   the file LICENSE-2.0 or at http://www.apache.org/licenses/LICENSE-2.0
*/

// WARNING: The code in this file is rather complex, I'm ashamed to say.
//          I honestly tried very, very hard to do this in a cleaner
//          fashion. Please forgive me. 

/*

INSTRUCTION TYPES

Instructions have a .exec method which gets passed the reader (the reader
is the thing that displays all the stuff on screen), the interval derived
from target_wpm, and a continutation function.

They have three possible return types:
  - a number representing the amount of time to wait until executing the next
    instruction
  - undefined, in which case the next instruction is executed immediately
  - false, in which case control of execution rests in the hands of the .exec
    method, which should call the continuation function in order to resume
    execution of instructions.

The continuation function takes an optional marker parameter, which causes the
instruction executor to skip over instructions until it gets to the marker.

Markers are numbers which lie in the instruction stream. Positive numbers are
used for demarcation of unique blocks and so forth, negative nubmers are used
for demaracation of ordinary things like sentences and paragraphs. 

*/

var SHORT_PAUSE = {
  exec: function (reader, interval) {
    return modifiers("short_pause") * interval;
  }
};
var LONG_PAUSE = {
  exec: function (reader, interval) {
    return modifiers("long_pause") * interval;
  }
};

var CLEAR_WRAP = {
  exec: function (reader) {
    reader.setWrap("", "");
  }
};

var CLEAR_WORD = {
  exec: function (reader) {
    reader.setWord("");
  }
};

// The only two built-in markers at this point.
var START_PARAGRAPH = -1;
var START_SENTENCE = -2;


function SetWrap (left, right) {
  this.left = left;
  this.right = right;
}

SetWrap.prototype.exec = function (reader) {
  reader.setWrap(this.left, this.right);
};

function Word (html, modifier, progress, node, offset, length) {
  this.html = html;
  this.modifier = modifier;
  this.progress = progress;
  this.node = node;
  this.offset = offset;
  this.length = length; // the length of the actual token
}

Word.prototype.exec = function (reader, interval) {
  reader.setWord(this.html);
  reader.setProgress(this.progress);
  return interval * modifier(this.modifier);
};

function Block (elem) {
  this.elem = elem;
}

Block.prototype.exec = function (reader, interval, cont) {
  reader.hide();
  var top = this.elem.getBoundingClientRect().top 
             + (document.documentElement.scrollTop || document.body.scrollTop);
  document.body.scrollTop = top;
  document.documentElement.scrollTop = top;
  // some function to focus on the element
  // some function to allow user to read or skip block
  // some timeout to continue after block if user does nothing
  setTimeout(cont, 2000);
  return false;
};


/**
 * Helper class for generating jetzt instructions.
 * Very subject to change.
 */
function Instructionator () {
  // there should always be at least one item in the buffer, except at the
  // start and at the end
  var buffer = []
    , modifier = "normal"
    , space = 0
    , wraps = [];

  // gets the next available instruction
  this.next = function () {
    if (buffer.length === 0) {
      return null;
    } else {
      return buffer.shift();
    }
  };

  // we need to be able to modify the previous instruction before setting
  // it free, so if the buffer only has one item in it, we need to feed
  // the instructionator more informations about what kinds of instructions
  // to produce.
  this.needsMore = function () {
    return buffer.length <= 1;
  };

  // add a modifier to the next token
  this.modNext = function (mod) {
    modifier = maxModifier(modifier, mod);
  };

  // add a modifier to the previous token
  this.modPrev = function (mod) {
    var i = buffer.length;
    while (i--) {
      var instr = buffer[i];
      if (instr.hasOwnProperty("modifier")) {
        instr.modifier = maxModifier(instr.modifier, mod);
        break;
      }
    }
  };

  var _emit = function (instr) {
    if (space) {
      buffer.push(space === 1 ? SHORT_PAUSE : LONG_PAUSE);
    }

    buffer.push(instr);

    modifier = "normal";
    space = 0;
  };

  var _emitWrap = function (wrap) {
    _emit(new SetWrap(
      wraps.map(function (w) { return w.left; }).join("");
      , wraps.map(function (w) { return w.right; }).reverse().join("");
    ));
  };

  // start a wrap on the next token
  this.pushWrap = function (wrap) {
    wraps.push(wrap);
    _emitWrap();
  };

  // stop the specified wrap before the next token.
  // Pops off any wraps in the way
  this.popWrap = function (wrap) {
    var idx = wraps.lastIndexOf(wrap);
    if (idx > -1) {
      wraps.splice(wraps.lastIndexOf(wrap), wraps.length);
    }
    _emitWrap();
  };

  // pop all wraps
  this.clearWrap = function (wrap) {
    wraps = [];
    _emit(CLEAR_WRAP);
  };

  this.marker = function (marker) {
    buffer.push(marker);
  };

  // put a spacer before the next token
  this.spacer = function () {
    space++;
  };

  var prePostPunct = /^['¿¡‘]+|[?!.;,*'’\-…:]+$/;

  // add the token
  this.word = function (tkn, progress) {
    var sections = tkn.sections || [];
    var pivot = calculatePivot(tkn.token.replace(prePostPunct, ""));
    insertPivot(pivot, sections);
    var html = renderWord(tkn.token, sections);
    var word = new Word(html
                         , modifier
                         , progress
                         , tkn.node
                         , tkn.offset
                         , tkn.token.length);
    _emit(word);
  };

  this.block = function (node) {
    _emit(new Block(node));
  }
}



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
  parens: {left: "(", right: ")"},
  heading1: {left: "", right: ""}
};

var encodeHTMLEntities = (function () {
  var elem = document.createElement('div');
  return function (s) {
    elem.textContent = s;
    return elem.innerHTML;
  }
})();

function makeStartTag (sec) {
  switch (sec.type) {
    case "pivot":
      return '<span class="pivot">';
    case "A":
      return '<a href="' + sec.node.href + '">';
    default:
      return '<' + sec.type.toLowerCase() + '>';
  }
}

function makeEndTag (sec) {
  if (sec.type === "pivot") {
    return '</span>';
  } else {
    return '</' + sec.type.toLowerCase() + '>';
  }
}


function insertPivot (pivotIndex, sections) {
  var pivotSection = {
    type: "pivot"
    , start: pivotIndex
    , end: pivotIndex + 1
  };

  if (sections.length === 0) {
    sections.push(pivotSection);
  } else {
    var i = 0;
    while (i < sections.length && sections[i].start <= pivotIndex) {
      i++;
    }
    sections.splice(i, 0, pivotSection);
  }
}

function renderWord(word, sections) {
  sections = sections.slice(0); // debug mode only. comment out when production
  var index = 0;
  var i = 0;
  var parts = [];
  while (i > -1) {
    console.log(i, sections.slice(0));
    var sec = sections[i];
    if (sec.start > index) {
      parts.push(encodeHTMLEntities(word.slice(index, sec.start)));
      index = sec.start;
    }

    if (sec.start === index) parts.push(makeStartTag(sec));

    if (sections[i+1]) {
      if (sections[i+1].start < sec.end) {
        i++;
      } else {
        parts.push(encodeHTMLEntities(word.slice(index, sec.end)));
        sections.splice(i, 1);
        index = sec.end;
      }
      continue;
    } else {
      parts.push(encodeHTMLEntities(word.slice(index, sec.end)));
      parts.push(makeEndTag(sec));
      sections.splice(i, 1);
      index = sec.end;
      i--;
    }
  }

  if (index < word.length) {
    parts.push(encodeHTMLEntities(word.slice(index)));
  }

  console.log(parts);

  return parts.join("");
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

function numLeadingWhitespaceChars(str) {
  var match = str.match(/^\s+/);
  if (match) return match[0].length;
  else return 0;
}

var ALL_TYPES = {
  "#text": true
  , "H1": true
  , "H2": true
  , "H3": true
  , "H4": true
  , "H5": true
  , "H6": true
  , "A": true
  , "EM": true
  , "STRONG": true
  , "SUP": true
  , "SUB": true
  , "S": true
  , "CODE": true
  , "UL": true
  , "OL": true
  , "LI": true
  , "DL": true
  , "DD": true
  , "DT": true
  , "Q": true
  , "BLOCKQUOTE": true
  , "IMG": true
  , "DIV": true
  , "TABLE": true
  , "FORM": true
  , "PRE": true
};

var STYLE_TYPES = {
  "A": true
  , "EM": true
  , "STRONG": true
  , "SUP": true
  , "SUB": true
  , "S": true
  , "CODE": true
};

var WRAPPED_TYPES = {
  "H1": true
  , "H2": true
  , "H3": true
  , "H4": true
  , "H5": true
  , "H6": true
  , "BLOCKQUOTE": true
  , "LI": true
};

var BREAK_TYPES = {
  "LI": true
  , "DT": true
  , "DD": true
  , "IMG": true
  , "DIV": true
  , "PRE": true
  , "TABLE": true
  , "BLOCKQUOTE": true
  , "FORM": true
  , "PRE": true
  , "H1": true
  , "H2": true
  , "H3": true
  , "H4": true
  , "H5": true
  , "H6": true
};

var BLOCK_TYPES = {
  "IMG": true
  , "DIV": true
  , "TABLE": true
  , "FORM": true
  , "PRE": true
};

var NO_TEXT_TYPES = {
  "IMG": true
};

var NO_READ_TYPES = {
  "IMG": true
  , "TABLE": true
};

function Token (token, startNode, offset, end) {
  this.token = token;
  this.startNode = startNode;
  this.offset = offset;
  this.end = end;
  // maybe sections;
}

Token.prototype.select = function () {
  // first select the node this token starts on;
  var range = document.createRange();
  range.selectNodeContents(this.startNode);

  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  // get it's parsed text so we know how many whitespace chars it starts with
  var fullText = sel.toString();
  var base = numLeadingWhitespaceChars(fullText);

  // now collapse the selection to the start, move it to the token's offset,
  // and then extend it to the end of the token.
  sel.collapseToStart();

  for (var i=0; i<this.offset + base; i++) {
    sel.modify("move", "forward", "character");
  }

  for (var i=0; i<this.token.length; i++) {
    sel.modify("extend", "forward", "character")
  }

  return sel;
}

var LINEFEED = {
  select: function () {
    var sel = window.getSelection();
    sel.removeAllRanges();
    return sel;
  }
};

function range2str(range) {
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  var result = sel.toString();
  sel.removeAllRanges();
  return result;
}

function elem2str(elem) {
  var range = document.createRange();
  range.selectNodeContents(elem);
  return range2str(range);
}

function partitionStream (node, text, index) {

  index = index || 0;
  text = text || elem2str(node).trim();

  var nodeStack = [node];

  var pushKids = function (node) {
    var kids = node.childNodes
      , i = kids.length;
    while (i--) nodeStack.push(kids[i]);
  };

  return new Stream(function () {
    if (nodeStack.length === 0) return null;

    var node = nodeStack.pop();

    if (ALL_TYPES[node.nodeName]) {
      var str = elem2str(node).trim();

      if (str.length || NO_TEXT_TYPES[node.nodeName]) {
        var start  = text.indexOf(str, index)
          , result =  {
                        type: node.nodeName
                        , start: start
                        , end: start + str.length 
                        , node: node
                      };

        if (node.childNodes.length) {
          pushKids(node);
        } else {
          index = result.end;
        }

        return result;
      }
    } 

    pushKids(node);
    return this.next();
  });
}

function tokenMatchStream (text) {
  var re = /["“”\(\)\/–—]|--+|\n+|[^\s"“”\(\)\/–—]+/g;
  return new Stream(function () {
    var result = re.exec(text);
    if (result === null) {
      this.next = function () { return null; };
    }
    return result;
  });
}

function pseudoMatch (str, index) {
  var result = [str];
  result.index = index;
  return result;
}

function breakCheck (tknEnd, tknStart, partition) {
  return (tknEnd > partition.end || tknStart < partition.start)
           && BREAK_TYPES[partition.type];
}

function rangesIntersect (aMin, aMax, bMin, bMax) {
  return !((aMax < bMin) || (bMax < aMin));
}

function tokenStream (tokenMatches, partitions) {
  var partition = partitions.next()
    , pStack = [];

  return new Stream(function () {
    var match = tokenMatches.next();

    if (!match || !partition) return null;

    var tkn = match[0];

    if (tkn.match(/\n+/)) {
      return LINEFEED;

    } else if wordShouldBeSplitUp(tkn) {
      var parts = splitLongWord(tkn);
      var index = match.index;
      for (var i = 0, len = parts.length; i < len; i++) {
        var part = parts[i];
        parts[i] = pseudoMatch(part, index);
        index += part.length;
      }
      tokenMatches = tokenMatches.pushBack(parts);
      return this.next();
    }

    var tknStart = match.index;
    var tknEnd = tknStart + tkn.length;

    while (pStack.length && pStack[pStack.length-1].end <= tknStart) {
      pStack.pop();
    } 


    var needsBreaking = false;

    while (partition && partition.start < tknEnd) {
      pStack.push(partition);
      needsBreaking = needsBreaking || breakCheck(tknEnd, tknStart, partition);
      partition = partitions.next();
    }

    if (!pStack.length) {
      throw new Error("something is amiss");
    }

    if (needsBreaking) {
      var idx = 0;
      var plen = pStack.length;
      var broken = [];
      for (var i=0; i < plen; i++) {
        var p = pStack[i];
        if (breakCheck(tknEnd, tknStart, p)) {
          var prelen = p.start - (tknStart + idx);
          if (prelen > 0) {
            var firstPart = tkn.substr(idx, prelen);
            broken.push(pseudoMatch(firstPart, tknStart + idx))
            idx += prelen;
          }
          var postlen = tknEnd - p.end;
          if (postlen > 0) {
            var middlePart = tkn.slice(idx, tkn.length - postlen);
            broken.push(pseudoMatch(middlePart, tknStart + idx));
            idx += middlePart.length;
          } else {
            broken.push(pseudoMatch(tkn.substr(idx), tknStart + idx));
            idx = tkn.length;
          }
        }
      }

      if (idx < tkn.length) {
        broken.push(pseudoMatch(tkn.substr(idx), tknStart + idx));
      }

      pStack.push(partition);
      partition = pStack.shift();
      partitions = partitions.pushBack(pStack);
      pStack = [];

      tokenMatches = tokenMatches.pushBack(broken);
      return this.next();
    }

    var root = pStack[0];
    var sections = [];
    for (var i=0, len=pStack.length; i<len; i++) {
      var p = pStack[i];
      if (STYLE_TYPES[p.type]
          // this intersection check may no longer be necessary
          && rangesIntersect(p.start, p.end, tknStart, tknEnd)) {
        sections.push({
          type: p.type
          , node: p.node
          , start: Math.max(p.start - tknStart, 0)
          , end: Math.min(tkn.length, p.end - tknStart)
        });
      }
    }

    var result = new Token(tkn, root.node, tknStart - root.start, tknEnd);

    if (sections.length) result.sections = sections;

    return result;

  }).buffered();
}

function NodesParser (nodes) {
  var numNodes = nodes.length;
  var text = elem2str(nodes[0]).trim();

  var startIndices = [0];

  for (var i = 1; i < numNodes; i++) {
    startIndices.push(text.length);
    text += "\n" + elem2str(nodes[i]).trim();
  }

  var partitionStreams = [];

  for (var i=0; i < numNodes; i++) {
    partitionStreams.push(partitionStream(nodes[i], text, startIndices[i]));
  }

  var partitions = concat.apply(null, partitionStreams);

  var blockParitions = [];

  partitions = partitions.filter(function (p) {
    if (BLOCK_TYPES[p.type]) {
      if (!blockParitions.length
           || blockParitions[blockParitions.length-1].start < p.start) {
        blockParitions.push(p);
      }
    }

    return true;
  });

  var tokenMatches = tokenMatchStream(text);

  var tokens = tokenStream(tokenMatches, partitions);

  var lookbehind = [];
  var lookbehindLength = 3; // subtract one

  var addToLookbehind = function (tkn) {
    lookbehind.push(tkn);
    while (lookbehind.length > lookbehindLength) lookbehind.shift();
  };

  var getLookbehind = function (n) {
    return lookbehind[lookbehind.length - 1 - n];
  };

  var tkn = tokens.next();

  function nextToken () {
    if (tkn === null) return null;
    else {
      var t = tkn;
      addToLookbehind(t);
      tkn = tokens.next();
      return t;
    }
  }

  var progress = function (tkn) {
    return tkn.end / text.length;
  };

  var outgoing = [];

  return new Stream(function () {

    if (outgoing.length) return outgoing.shift();

    var t = nextToken();

    if (t === null) return null;

    switch (tkn.token) {
      ca
    }

    var ret;
    if (!tkn.token.match(/^\s+$/)) 
      ret = new Word(tkn, progress(tkn));

    tkn = tokens.next();
    if (!ret) ret = this.next();
    return ret;
  });
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