/* storage backends */
var chromeConfigStorage = {
    get: function (cb) {
      chrome.storage.local.get(DEFAULT_OPTIONS, function (value) {
        cb(value);
      });
    },
    set: function (options) {
      chrome.storage.local.set(options);
    }
};

var localConfigStorage = {
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