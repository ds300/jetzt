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

/* give some feedback to the user */
function confirmSave() {
  var status = document.getElementById("status");
  status.innerHTML = "Options Saved.";
  setTimeout(function() { status.innerHTML = ""; }, 750);
}

/* set view to current options */
function view2opts() {
    var select = document.getElementById("color");
  	options.view.selection_color = select.children[select.selectedIndex].value;
	options.target_wpm = document.getElementById("wpm").value;

	return options;
}

/* get currently set options */
function opts2view(options) {
  var select = document.getElementById("color");
  for (var i = 0; i < select.children.length; i++) {
    var child = select.children[i];
    if (child.value == options.view.selection_color) {
     child.selected = "true";
      break;
    }
  }
  document.getElementById("wpm").value = options.target_wpm;
}

/* saves options to config-backend. */
function save_options() {
    //get options from view
	options = view2opts();

   //store items
	configBackend.set(options);
}

/* (re-) load options from backend */
function init() {
	setConfigBackend(chromeConfigStorage); //this should maybe be determined flexible (e.g. sync options between chromes)
	configBackend.get(restore_options);
}

/* set view to loaded options */
function restore_options(opts) {
   options = recursiveExtend({}, options, opts);
   opts2view(options);
}

document.addEventListener('DOMContentLoaded', init);
document.querySelector('#save').addEventListener('click', save_options);
document.querySelector('#cancel').addEventListener('click', init);
