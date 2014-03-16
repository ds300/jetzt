/*
   Licensed under the Apache License v2.0.
            
   A copy of which can be found at the root of this distrubution in 
   the file LICENSE-2.0 or at http://www.apache.org/licenses/LICENSE-2.0
*/

(function (window) {

  var jetzt = window.jetzt;
  var H = jetzt.helpers;

  // Don't commit changes to these without prior approval please
  jetzt.DEFAULT_OPTIONS = {
      target_wpm: 400
    , scale: 1
    , dark: false
    , modifiers: {
          normal: 1
        , start_clause: 1
        , end_clause: 1.8
        , start_sentence: 1.3
        , end_sentence: 2.2
        , start_paragraph: 2.0
        , end_paragraph: 2.8
        , short_space: 1.5
        , long_space: 2.2
      }
    , view : {
          selection_color : "red"
        , font_family: "Menlo, Consolas, Monaco, monospace"
      }
    // keybindings and so forth soon
  };

  // This is where we store the options for the current instance of jetzt.
  var options = H.recursiveExtend({}, jetzt.DEFAULT_OPTIONS);

  // This is where we store the backend getters/setters. It is initialised
  // with a localStorage placeholder for the bookmarklet and demo page.
  var configBackend = {
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

  var listeners = [];

  function announce () {
    listeners.forEach(function (cb) { cb(); });
  }

  

  // recursive lookup. Like clojure's get-in;
  function lookup (map, keyPath) {
    if (keyPath.length === 0) throw new Error("No keys specified.");

    var key = keyPath[0];
    if (keyPath.length === 1) {
      if (!map.hasOwnProperty(key)) {
        console.warn("config lookup: no key '"+key+"'");
      }
      return map[key];
    } else {
      var submap = map[key];
      if (realTypeOf(submap) !== 'Object') {
        console.warn("config lookup: no key '"+key+"'");
        return;
      } else {
        return lookup(submap, keyPath.slice(1));
      }
    }
  }

  // recursive put. Like clojure's assoc-in
  function put (map, keyPath, val) {
    if (keyPath.length === 0) throw new Error("No keys specified.");

    var key = keyPath[0];
    if (keyPath.length === 1) {
      map[key] = val;
    } else {
      var submap = map[key];
      if (realTypeOf(submap) !== 'Object') {
        submap = {};
        map[key] = submap;
      }
      _put(submap, keyPath.slice(1), val);
    }
  }


  /**
   * jetzt.config
   * get and set config variables.
   *
   * e.g.
   *      jetzt.config("cheese", "Edam")
   * 
   * sets the "cheese" option to the string "Edam"
   *
   *      jetzt.config("cheese")
   *
   *      => "edam"
   *
   * It also has support for key paths
   *
   *      jetzt.config(["cheese", "color"], "blue")
   *      jetzt.config(["cheese", "name"], "Stilton")
   *
   *      jetzt.config(["cheese", "name"])
   *
   *      => "Stilton"
   *
   *      jetzt.config("cheese")
   * 
   *      => {color: "blue", name: "Stilton"}
   */
  jetzt.config = function (keyPath, val) {
    if (typeof keyPath === 'string') keyPath = [keyPath];

    if (arguments.length === 1) {
      return lookup(options, keyPath);
    } else {
      put(options, keyPath, val);
      configBackend.set(options);
      announce();
    }
  };

  /**
   * config.setBackend
   * Set the config 'backend' store. Should be an object with methods
   * void get(cb(opts))
   * void set(opts)
   */
  jetzt.config.setBackend = function (backend) {
    configBackend = backend;
    backend.get(function (opts) {
      if (realTypeOf(opts) === 'Object') {
        options = H.recursiveExtend({}, options, opts);
        announce();
      } else {
        throw new Error("bad config backend");
      }
    });
  };

  // convenince functions for dealing with delay modifiers
  jetzt.config.getModifier = function (mod) {
    return jetzt.config(["modifiers", mod]) || 1;
  };

  jetzt.config.maxModifier = function (a, b) {
    if (jetzt.config.getModifier(a) > jetzt.config.getModifier(b)) {
      return a;
    } else {
      return b;
    }
  };

  jetzt.config.onChange = function (cb) {
    listeners.push(cb);
    return function () { H.removeFromArray(listeners, cb); };
  };

  jetzt.config.refresh = function () {
    this.setConfigBackend(configBackend);
  };

  /**
   * Adjust the size of the reader
   */
  jetzt.config.adjustScale = function (diff) {
    var current = this("scale");
    var adjusted = clamp(0.1, current + diff, 10);

    this("scale", adjusted);
  };


  /**
   * Adjust the speed of the reader (words per minute)
   */
  jetzt.config.adjustWPM = function (diff) {
    var current = this("target_wpm");
    var adjusted = clamp(100, current + diff, 1500);

    this("target_wpm", adjusted);
  };

  /**
   * Toggle the theme of the reader
   */
  function toggleTheme () {
    this("dark", !this("dark"));
  };

})(this);


