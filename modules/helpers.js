/*
   Licensed under the Apache License v2.0.
            
   A copy of which can be found at the root of this distrubution in 
   the file LICENSE-2.0 or at http://www.apache.org/licenses/LICENSE-2.0
*/

function removeFromArray (arr, item) {
  var pos = arr.indexOf(item);
  if (pos > -1) {
    arr.splice(pos, 1);
  }
}

function getScrollTop () {
  return document.body.scrollTop || document.documentElement.scrollTop;
}

function getScrollLeft () {
  return document.body.scrollLeft || document.documentElement.scrollLeft;
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
