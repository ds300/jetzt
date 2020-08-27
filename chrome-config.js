(function (document) {
  "use strict";

  var configStorage = {
    get: function (cb) {
      chrome.storage.local.get({options: "{}"}, function (map) {
        cb(map.options);
      });
    },
    set: function (json) {
      chrome.storage.local.set({options: json});
    }
  };

  document.jetzt.config.setBackend(configStorage);

})(document);
