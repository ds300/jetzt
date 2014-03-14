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


// Saves options to config-backend.
function save_options() {
    //get options from view
    var select = document.getElementById("color");
  	options.view.selection_color = select.children[select.selectedIndex].value;

   //store items
	configBackend.set(options);

  // Update status to let user know options were saved.
  var status = document.getElementById("status");
  status.innerHTML = "Options Saved.";
  setTimeout(function() { status.innerHTML = ""; }, 750);
}

function init() {
	setConfigBackend(chromeConfigStorage); //this should maybe be flexible (e.g. sync options between chromes)
	configBackend.get(restore_options);
}

// set view to loaded options
function restore_options(opts) {
    options = recursiveExtend({}, options, opts);

    console.log("resetting options UI");
  var select = document.getElementById("color");
  for (var i = 0; i < select.children.length; i++) {
    var child = select.children[i];
    if (child.value == options.view.selection_color) {
     child.selected = "true";
      break;
    }
  }
}

document.addEventListener('DOMContentLoaded', init);
document.querySelector('#save').addEventListener('click', save_options);
document.querySelector('#cancel').addEventListener('click', init);
