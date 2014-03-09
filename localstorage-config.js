(function (window) {
  "use strict";
  
  var KEY = "jetzt-options";

  var configStorage = {
    get: function (cb) {
      var options = localStorage.getItem(KEY);
      if(options === null) {
        cb({});
      } else {
        cb(JSON.parse(options));
      }
    },
    set: function (options) {
      localStorage.setItem(KEY,JSON.stringify(options));
    }
  };

  var html5StorageEnabled = function ()  {
    try {
      return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
      return false;
    }
  };
  if(html5StorageEnabled()) {
    window.jetzt.setConfigBackend(configStorage);
  }
})(window);