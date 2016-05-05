/*
   Licensed under the Apache License v2.0.

   A copy of which can be found at the root of this distrubution in
   the file LICENSE-2.0 or at http://www.apache.org/licenses/LICENSE-2.0
*/

(function (window) {

  var jetzt = window.jetzt
    , H = jetzt.helpers;

  // if you add any properties to themes, make sure to bump this
  var CONFIG_VERSION = 0;

  var DEFAULT_THEMES = [
    {
      "name": "Classic",
      "dark": {
        "backdrop_opacity": "0.86",
        "colors": {
          "backdrop": "#000000",
          "background": "#303030",
          "foreground": "#E0E0E0",
          "message": "#909090",
          "pivot": "#73b5ee",
          "progress_bar_background": "#000000",
          "progress_bar_foreground": "#3a5566",
          "reticle": "#656565",
          "wrap_background": "#404040",
          "wrap_foreground": "#a1a1a1"
        }
      },
      "light": {
        "backdrop_opacity": "0.07",
        "colors": {
          "backdrop": "black",
          "background": "#fbfbfb",
          "foreground": "#333333",
          "message": "#929292",
          "pivot": "#E01000",
          "progress_bar_background": "black",
          "progress_bar_foreground": "#00c00a",
          "reticle": "#efefef",
          "wrap_background": "#f1f1f1",
          "wrap_foreground": "#666"
        }
      }
    }
    // put more themes here
  ];

  var DEFAULT_MODIFIERS = {
    normal: 1,
    start_clause: 1,
    end_clause: 1.8,
    start_sentence: 1.3,
    end_sentence: 2.2,
    start_paragraph: 2.0,
    end_paragraph: 2.8,
    short_space: 1.5,
    long_space: 2.2
  }

  // Don't commit changes to these without prior approval please
  var DEFAULT_OPTIONS = {
    // if we change config structure in future versions, having this means
    // we can update users' persisted configs to match.
    config_version: CONFIG_VERSION,
    target_wpm: 400,
    scale: 1,
    dark: false,
    selected_theme: 0,
    show_message: false,
    strip_citation: false,
    selection_color: "#FF0000",
    modifiers: DEFAULT_MODIFIERS,
    font_family: "Menlo, Monaco, Consolas, monospace",
    font_weight: "normal",
    custom_themes: []
  };


  /*** STATE ***/

  // This is where we store the options for the current instance of jetzt.
  // The identity of the object never changes.
  var options = H.clone(DEFAULT_OPTIONS);

  // list of folks to notify of changes
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
      if (H.realTypeOf(submap) !== 'Object') {
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
      if (H.realTypeOf(submap) !== 'Object') {
        submap = {};
        map[key] = submap;
      }
      _put(submap, keyPath.slice(1), val);
    }
  }

  /*** BACKEND ***/

  // the backend is a swappable object with two methods, get and set. 
  // get takes a cb and should invoke the callback, supplying the persisted
  // JSON if available, or some falsey value if not. Set takes some json and
  // presumably puts it somewhere. Or not. whatevs.

  // It is initialised with a localStorage placeholder for the bookmarklet and
  // demo page.
  var KEY = "jetzt_options";

  var configBackend = {
    get: function (cb) {
      var json = localStorage.getItem(KEY);
      if(json) {
        cb("{}");
      } else {
        cb(json);
      }
    },
    set: function (json) {
      localStorage.setItem(KEY, json);
    }
  };

  /*** (DE)SERIALISATION ***/

  function persist () {
    configBackend.set(JSON.stringify(options));
  }

  function unpersist (json) {
    try {
      var opts = JSON.parse(json || "{}")
        , repersist = false;

      if (opts.config_version != CONFIG_VERSION) {

        // update custom themes
        if (opts.custom_themes) {
          H.keys(opts.custom_themes).forEach(function (id) {
            var customTheme = opts.custom_themes[id];
            opts.custom_themes[id] =
                    H.recursiveExtend(DEFAULT_THEMES.Classic, customTheme);
          });
        }

        opts.config_version = CONFIG_VERSION;
        repersist = true;
      }

      H.recursiveExtend(options, opts);

      window.jazz = options;

      repersist && persist();
      announce();
    } catch (e) {
      throw new Error("corrupt config json", e);
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
  var config = function (keyPath, val) {
    if (typeof keyPath === 'string') keyPath = [keyPath];

    if (arguments.length === 1) {
      return lookup(options, keyPath);
    } else {
      put(options, keyPath, val);
      persist();
      announce();
    }
  };

  jetzt.config = config;

  config.DEFAULTS = H.clone(DEFAULT_OPTIONS);
  config.DEFAULT_THEMES = H.clone(DEFAULT_THEMES);

  /**
   * takes a callback and invokes it each time an option changes
   * returns a function which, when invoked, unregisters the callback
   */
  config.onChange = function (cb) {
    listeners.push(cb);
    return function () { H.removeFromArray(listeners, cb); };
  };

  /**
   * Set the config 'backend' store. Should be an object with methods
   * void get(cb(opts))
   * void set(opts)
   */
  config.setBackend = function (backend) {
    configBackend = backend;
    this.refresh();
    announce();
  };

  /**
   * Triggers an automatic reload of the persisted options
   */
  config.refresh = function (cb) {
    configBackend.get(function (json) {
      unpersist(json);
      cb && cb();
    });
  };

  config.getSelectedTheme = function () {
    return DEFAULT_THEMES[options.selected_theme] || DEFAULT_THEMES[0];
  };

  /**
   * convenience function for finding the highest of two modifiers.
   */
  config.maxModifier = function (a, b) {
    return this(["modifiers", a]) > this(["modifiers", b]) ? a : b;
  };

  config.adjustWPM = function (diff) {
    options.target_wpm = H.clamp(100, options.target_wpm + diff, 1500);
    announce();
    persist();
  };

  config.adjustScale = function (diff) {
    this("scale", H.clamp(0, options.scale + diff, 1));
  };


  /**
   * might be neccessary to trigger a save manually
   */
  config.save = function () {
    persist();
  };

  // load the options from the default config backend to get the ball rolling
  config.refresh();

})(this);
