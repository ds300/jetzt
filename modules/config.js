/*
   Licensed under the Apache License v2.0.

   A copy of which can be found at the root of this distrubution in
   the file LICENSE-2.0 or at http://www.apache.org/licenses/LICENSE-2.0
*/

(function (window) {

  var jetzt = window.jetzt
    , H = jetzt.helpers
    , config = {};

  jetzt.config = config;

  // if you add any properties to themes, make sure to bump this
  var CONFIG_VERSION = 0;

  var DEFAULT_THEMES = [
    {
      "name": "Default"
    , "dark": {
        "backdrop_opacity": "0.5"
      , "colors": {
          "backdrop": "#000000"
        , "background": "#303030"
        , "foreground": "#E0E0E0"
        , "message": "#909090"
        , "pivot": "#E01000"
        , "progress_bar_background": "#000000"
        , "progress_bar_foreground": "#b1dcdb"
        , "reticle": "#656565"
        , "wrap_background": "#404040"
        , "wrap_foreground": "#a1a1a1"
        }
      }
    , "light": {
        "backdrop_opacity": "0.07"
      , "colors": {
          "backdrop": "black"
        , "background": "#fbfbfb"
        , "foreground": "#353535"
        , "message": "#929292"
        , "pivot": "#E01000"
        , "progress_bar_background": "black"
        , "progress_bar_foreground": "#00be0b"
        , "reticle": "#efefef"
        , "wrap_background": "#f1f1f1"
        , "wrap_foreground": "#666"
        }
      }
    }
    // put more themes here
  ];

  // this function makes sure that any custom themes existing on the user's
  // local storage have up-to-date properties.
  function updateCustomThemes (customThemes) {
    var example = DEFAULT_THEMES[0];
    return customThemes.map(function (customTheme) {
      return H.recursiveExtend({}, example, theme);
    });
  }

  // Don't commit changes to these without prior approval please
  var DEFAULT_OPTIONS = {
    // if we change config structure in future versions, having this means
    // we can update user's persisted configs to match.
    config_version: CONFIG_VERSION
  , target_wpm: 400
  , scale: 1
  , dark: false
  , show_message: false
  , selection_color: "#FF0000"
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
  , font_family: "Menlo, Monaco, Consolas, monospace"
  , selected_theme: 0 // index into `themes` array, not custom_themes
  , custom_themes: []
  };



  /*** STATE ***/

  // This is where we store the options for the current instance of jetzt.
  var options = JSON.parse(JSON.stringify(DEFAULT_OPTIONS));

  // this gets set as the concatenation of DEFAULT_THEMES and
  // options.custom_themes every time config is loaded from the backend.
  var themes = DEFAULT_THEMES.slice(0);

  // list of folks to notify of changes
  var listeners = [];

  function announce () {
    listeners.forEach(function (cb) { cb(); });
  }

  /**
   * takes a callback and invokes it each time an option changes
   * returns a function which, when invoked, unregisters the callback
   */
  config.onChange = function (cb) {
    listeners.push(cb);
    return function () { H.removeFromArray(listeners, cb); };
  };




  /*** GETTERS/SETTERS ***/

  // here I use javascript's ability to define transparent getters and
  // setters for property access and assignment on objects. This seems like
  // bad style to me, but it makes writing angular forms much easier than
  // when using opaque getters and setters.

  var getset = [
    [
      "scale",
      function () { return options.scale; },
      function (s) { options.scale = H.clamp(0.1, s, 10); }
    ],
    [
      "dark",
      function () { return options.dark; },
      function (dark) { options.dark = !!dark; }
    ],
    [
      "wpm",
      function () { return options.target_wpm; },
      function (wpm) { options.target_wpm = H.clamp(100, wpm, 1500); }
    ],
    [
      "selectionColor",
      function () { return options.selection_color; },
      function (color) { options.selection_color = color; }
    ],
    [
      "showMessage",
      function () { return options.show_message; },
      function (sm) { options.show_message = !!sm }
    ],
    [
      "font",
      function () { return options.font_family; },
      function (font) { options.font_family = font; }
    ],
    [
      "theme",
      function () { return themes[options.selected_theme]; },
      function (theme) {
        var idx = themes.indexOf(theme);
        if (idx > -1) {
          options.selected_theme = idx;
        } else {
          config.newTheme(true);
          this.theme = H.recursiveExtend(this.theme, theme);
        }
      }
    ]
  ];

  // all setter methods cause config to be persisted and onChange event to be
  // fired.
  function wrapSetter (fn) {
    return function () {
      fn.apply(this, arguments);
      persist();
      announce();
    }
  }

  function makeGettersSetters (obj, list) {
    list.forEach(function (row) {
      var name = row[0]
        , get = row[1]
        , set = row[2];
      obj.__defineGetter__(name, get);
      obj.__defineSetter__(name, wrapSetter(set));
    });
  }

  makeGettersSetters(config, getset);

  // so now, e.g., if options.tartget_wpm === 1000, I could be all like
  //
  //    config.wpm += 1000;
  //
  // and now, because we defined the setter, options.target_wpm === 1500


  // and the same for modifiers
  var modifier_getsets = [];

  function addModGetSet (name) {
    modifier_getsets.push([
      name, 
      function () { return options.modifiers[name]; },
      function (n) { options.modifiers[name] = H.clamp(0, n, 5); }
    ]);
  }
  
  for (var name in options.modifiers) {
    if (options.modifiers.hasOwnProperty(name)) {
      addModGetSet(name);
    }
  }

  config.modifiers = {};

  makeGettersSetters(config.modifiers, modifier_getsets);



  /*** BACKEND ***/

  // the backend is a swappable object with two methods, get and set. 
  // get takes a cb and should invoke the callback, supplying the persisted
  // JSON if available, or some falsey value if not. Set takes some json and
  // presumably puts it somewhere. Or not. whatevs.

  // It is initialised with a localStorage placeholder for the bookmarklet and
  // demo page.
  var KEY = "jetzt-options";

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

  /**
   * Set the config 'backend' store. Should be an object with methods
   * void get(cb(opts))
   * void set(opts)
   */
  config.setBackend = function (backend) {
    configBackend = backend;
    config.refresh();
    announce();
  };

  /**
   * I'm not sure it's wise to make this available so probably best not to
   * depend on it.
   */
  config.getBackend = function () {
    return configBackend;
  };

  /**
   * Triggers an automatic reload of the persisted options
   */
  config.refresh = function () {
    backend.get(unpersist);
  };

  /*** (DE)SERIALISATION ***/

  function persist () {
    options.custom_themes = themes.slice(DEFAULT_THEMES.length); 
    configBackend.set(JSON.stringify(options));
    delete options.custom_themes;
  }

  function unpersist (json) {
    try {
      var opts = JSON.parse(json || "{}")
        , repersist = false;
      if (opts.config_version != CONFIG_VERSION) {

        if (opts.custom_themes && opts.custom_themes.length > 0) {
          opts.custom_themes = updateCustomThemes(opts.custom_themes);
        }

        opts.config_version = CONFIG_VERSION;
        repersist = true;
      }

      options = H.recursiveExtend({}, DEFAULT_OPTIONS, opts);
      themes = DEFAULT_THEMES.concat(options.custom_themes);

      repersist && persist();
      announce();
    } catch {
      throw new Error("corrupt config json");
    }
  }


  /**
   * convenience function for finding the highest of two modifiers.
   */
  config.maxModifier = function (a, b) {
    return this.modifiers[a] > this.modifiers[b] ? a : b;
  };

  /**
   * Lists all themes, both default and custom.
   */
  config.listThemes = function () {
    return themes;
  };

  /**
   * creates a new theme. If a truthy argument is passed, causes
   * the new theme to be the selected theme.
   */
  config.newTheme = wrapSetter(function (select) {
    var newTheme = JSON.parse(JSON.stringify(this.theme));
    newTheme.name = "Custom Theme";
    themes.push(newTheme);
    if (select) this.theme = newTheme;
  });

  /**
   * Cycles to the next theme in the list, or back to the start of the list
   * when the end is reached.
   */
  config.nextTheme = wrapSetter(function () {
    options.selected_theme = (options.selected_theme + 1) % themes.length;
  });
  

  // load the options from the default config backend
  config.setBackend(configBackend);

})(this);
