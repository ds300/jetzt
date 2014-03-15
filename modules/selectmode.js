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
          overlay.style.top = (getScrollTop() + rect.top) + "px";
          overlay.style.left = (getScrollLeft() + rect.left) + "px";
          overlay.style.width = rect.width + "px";
          overlay.style.height = rect.height + "px";
		  overlay.style.backgroundColor = options.view.selection_color;
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
  }
