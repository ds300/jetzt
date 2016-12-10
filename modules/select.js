/*
   Licensed under the Apache License v2.0.
            
   A copy of which can be found at the root of this distrubution in 
   the file LICENSE-2.0 or at http://www.apache.org/licenses/LICENSE-2.0
*/

(function (window) {

  var jetzt  = window.jetzt
    , H      = jetzt.helpers;

  function on (event, cb) {
    window.addEventListener(event, cb);
  }

  function off (event, cb) {
    window.removeEventListener(event, cb);
  }

  /**
   * Begin interactive dom node selection.
   */
  function selectMode () {
    var selection = [];
    var previousElement = null;

    var showSelection = function () {

      overlays = [];

      for (var i=0, len=selection.length; i < len; i++) {
        if (!jetzt.view.addOverlay(selection[i])) {
          break;
        }
      }
    };

    var setSelection = function (sel) {
      jetzt.view.removeAllOverlays();
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
      "SECTION": true
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

    var domainSpecificDomModifications = function(selection) {
      if (location.host === "play.google.com" &&
          location.href.indexOf('com/books/reader') != -1) {
        return modifyDomForGooglePlay(selection);
      }
      return selection;
    };

    var modifyDomForGooglePlay = function(selection) {
      console.log(selection);
      var newSelection = []
      for (var i = 0; i < selection.length; i++) {
        var text = getTextFromGbsChildren(selection[i]);
        var p = document.createElement("P");
        p.appendChild(document.createTextNode(text));
        newSelection.push(p);
      }
      return newSelection;
    }

    var getTextFromGbsChildren = function(element) {
      var text = "";
      for (var i = 0; i < element.childNodes.length; i++) {
        var child = element.childNodes[i];
        if (child.tagName === 'GBS') {
          for (var j = 0; j < child.childNodes.length; j++) {
            var textNode = child.childNodes[j];
            if (textNode.tagName === 'GBT') {
              if (window.getComputedStyle(textNode).display !== 'none') {
                text += textNode.textContent;
              }
            }
          }
        } else {
          text += getTextFromGbsChildren(child);
        }
      }
      return text;
    }

    var stop = function () {
      jetzt.view.removeAllOverlays();
      off("mouseover", mouseoverHandler);
      off("mousemove", moveHandler);
      off("keydown", keydownHandler);
      off("keyup", keyupHandler);
      off("click", clickHandler);
      previousElement && H.removeClass(previousElement, "sr-pointer");
    };

    var mouseoverHandler = function (ev) {
      previousElement && H.removeClass(previousElement, "sr-pointer");

      H.addClass(ev.target, "sr-pointer");

      previousElement = ev.target;

      if (ev.altKey) {
        setSelection([ev.target]);
      } else {
        setSelection(selectSiblings(ev.target));
      }
    };

    var clickHandler = function (ev) {
      stop();
      selection = domainSpecificDomModifications(selection);
      jetzt.init(jetzt.parse.dom(selection));
    };

    var moveHandler = function (ev) {
      mouseoverHandler(ev);
      off("mousemove", moveHandler);
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

    on("mouseover", mouseoverHandler);
    on("click", clickHandler);
    on("mousemove", moveHandler);
    on("keydown", keydownHandler);
    on("keyup", keyupHandler);
  }

  jetzt.select = function (contextData) {
    var text;
    if (contextData === undefined) {
      text = window.getSelection().toString();
    } else {
      text = contextData.selectionText;
    }
    if (text.trim().length > 0) {
      jetzt.init(jetzt.parse.string(text));
      window.getSelection().removeAllRanges();
    } else {
      selectMode();
    }
  };

})(this);


