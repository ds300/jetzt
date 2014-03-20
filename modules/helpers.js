/*
   Licensed under the Apache License v2.0.
            
   A copy of which can be found at the root of this distrubution in 
   the file LICENSE-2.0 or at http://www.apache.org/licenses/LICENSE-2.0
*/

(function (window) {

  var jetzt = window.jetzt;
  var H = {};

  jetzt.helpers = H;

  H.removeFromArray = function (arr, item) {
    var pos = arr.indexOf(item);
    if (pos > -1) arr.splice(pos, 1);
  };

  // TODO: Move dom specific stuff into separate helpers module for testing
  //       purposes
  H.getScrollTop = function () {
    return document.body.scrollTop || document.documentElement.scrollTop;
  };

  H.getScrollLeft = function () {
    return document.body.scrollLeft || document.documentElement.scrollLeft;
  };


  // make an element of the specified tag and class
  H.elem = function (tagName, className, kids) {
    var result = document.createElement(tagName);
    result.className = className || "";
    if (kids) {
      kids.forEach(function (kid) {result.appendChild(kid);})
    }
    return result;
  };

  H.div = function (className, kids) {
    return H.elem('div', className, kids);
  };

  H.span = function (className, kids) {
    return H.elem('span', className, kids);
  };

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

  H.addClass = function (elem, classesToAdd) {
    _modClass(elem, classesToAdd, function (acc, klass) {
      H.removeFromArray(acc, klass);
      acc.push(klass);
    });
  };

  H.removeClass = function (elem, classesToRemove) {
    _modClass(elem, classesToRemove, H.removeFromArray);
  };

  H.hasClass = function (elem, classesToFind) {
    var found = true;
    _modClass(elem, classesToFind, function (elemClassses, klass) {
      found = found && elemClassses.indexOf(klass) > -1;
    });
    return found;
  };

  H.realTypeOf = function (thing) {
    return Object.prototype.toString.call(thing).slice(8, -1);
  };

  // flatten possibly nested array
  H.flatten = function (arr) {
    var result = [];
    var flat = function flat (thing) {
      if (Object.prototype.toString.call(thing) === '[object Array]')
        thing.forEach(flat);
      else
        result.push(thing);
    };
    flat(arr);
    return result;
  };

  H.clamp = function (min, num, max) {
    return Math.min(Math.max(num, min), max);
  };

  // merge objects together and so forth. don't rely on child object
  // references being preserved.
  H.recursiveExtend = function () {
    var result = arguments[0];
    for (var i=1; i<arguments.length; i++) {
      var uber = arguments[i];
      for (var prop in uber) {
        if (uber.hasOwnProperty(prop)) {
          if (result.hasOwnProperty(prop)) {
            var resultVal = result[prop];
            var uberVal = uber[prop];
            if (H.realTypeOf(resultVal) === 'Object'
                 && H.realTypeOf(uberVal) === 'Object') {
              result[prop] = H.recursiveExtend({}, resultVal, uberVal);
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
  };

  H.keys = function (obj) {
    var result = [];
    for (var prop in obj) { if (obj.hasOwnProperty(prop)) result.push(prop); }
    return result;
  };

  H.clone = function (obj) {
    return JSON.parse(JSON.stringify(obj));
  }

})(this);


