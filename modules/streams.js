/*
   Licensed under the Apache License v2.0.
            
   A copy of which can be found at the root of this distrubution in 
   the file LICENSE-2.0 or at http://www.apache.org/licenses/LICENSE-2.0
*/


function Stream (next) {
  this.next = next || function () { return null; };
}

Stream.prototype.pushBack = function (array) {
  var savedNext = this.next;
  var i = 0;
  this.next = function () {
    if (i < array.length) {
      return array[i++];
    } else {
      this.next = savedNext;
      return this.next();
    }
  };
  return this;
};

Stream.prototype.concat = function (stream) {
  var that = this;
  return new Stream(function () {
    if (that === null) {
      return stream.next();
    } else {
      var item = that.next();
      if (item === null) {
        that = null;
        return stream.next();
      } else {
        return item;
      }
    }
  });
};

Stream.prototype.buffered = function (bufferSize, chunkSize, delay) {
  bufferSize = bufferSize || 100;
  chunkSize = chunkSize || 10;
  delay = delay || 50;

  var buffer = [];
  var stream = this;
  var dead = false;

  var fillBuffer = function fillBuffer () {
    var item = stream.next();
    var startSize = buffer.length;
    var targetSize = Math.min(bufferSize, startSize + chunkSize);
    while (item !== null && buffer.length < targetSize) {
      buffer.push(item);
      item = stream.next();
    }
    if (item === null) {
      dead = true;
    } else if (buffer.length < bufferSize) {
      setTimeout(fillBuffer, delay);
    }
  };

  fillBuffer();

  return new Stream(function () {
    if (buffer.length) {
      return buffer.shift();
    } else if (dead) {
      return null;
    } else {
      fillBuffer();
      return this.next();
    }
  });
};

Stream.prototype.filter = function (filter) {
  var that = this;
  return new Stream(function () {
    var item = that.next();
    while (item !== null) {
      if (filter(item)) {
        return item;
      } else {
        item = that.next();
      }
    } 
    this.next = function () { return null; }
    return null;
  });
}

function concat () {
  var streams = arguments;
  var result = streams[0];
  for (var i=1; i<streams.length; i++) {
    result = result.concat(streams[i]);
  }
  return result;
}

function arrayStream (arr) {
  var i = 0;
  return new Stream(function () {
    if (i < arr.length) {
      return arr[i++];
    } else {
      return null;
    }
  });
}
