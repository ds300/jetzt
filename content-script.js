(function (window) {
  "use strict";

  var configStorage = {
    get: function (cb) {
      chrome.storage.local.get(window.jetzt.DEFAULT_OPTIONS, function (value) {
        cb(value);
      });
    },
    set: function (options) {
      chrome.storage.local.set(options);
    }
  };

  window.jetzt.setConfigBackend(configStorage);
})(window);
