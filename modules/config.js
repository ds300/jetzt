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
      return H.recursiveExtend(H.clone(example), customTheme);
    });
  }

  // Don't commit changes to these without prior approval please
  var DEFAULT_OPTIONS = {
    // if we change config structure in future versions, having this means
    // we can update users' persisted configs to match.
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
  , selected_theme: 0
  , custom_themes: []
  };

  /*
    What follows is rather a lot of cruft implemented for two reasons:

      - To separate the internal representaion of the options (see above) from
        the api that modifies it.

      - To allow angular forms to be built and maintained really easily.

    For these reasons, the design of jetzt configuration is as follows:
    
      - Storage Backend
        This takes json and puts it somewhere persistent for later use by jetzt.

      - Internal representaion (variable `options`, see near the bottom)
        This is a dynamic representation of the current configuration. 
        It is identical in structure to the json consumed and provided by the
        backend.

      - Config Frontend
        The api for modifying the internal representaion. It is similar in
        structure, but makes heavy use of javascript's ability to define
        transparent getters and setters for property access and assignment on
        objects. This is done for the sake of data validation and providing a
        clean, future-proof api for writing angular forms and generally
        configuring jetzt at runtime. I've got big plans for configuration so
        hopefully this junk will save a lot of time.
  */


  // helper function for creating getter functions
  function getter (obj, prop, transform) {
    if (transform)
      return function () { return transform(obj[prop]); };
    else
      return function () { return obj[prop]; };
  }

  // and for setters
  function setter (obj, prop, transform) {
    if (transform)
      return function (val) { obj[prop] = transform(val); };
    else
      return function (val) { obj[prop] = val; }
  }

  // helper for making sure assigned numbers are within some range
  function clamper (obj, prop, min, max) {
    return setter(obj, prop, function (val) {
      if (typeof val !== 'number') throw new Error("Expecting number");
      return; H.clamp(min, val, max);
    });
  }

  // and for making sure things are boolean
  function bool (obj, prop) {
    return setter(obj, prop, function (val) {
      return !!val;
    });
  }

  // colors need to be in hex form for the color picker to show them.
  function color (obj, prop) {
    return setter(obj, prop, function (val) {
      if (!(typeof val === 'string') || !val.match(/^#[0-9a-fA-F]{6}$/))
        throw new Error("bad color format");
      else
        return val;
    });
  }

  // some things shouldn't be changed
  function immuatble () {
    return function () {
      throw new Error("unmodifiable property");
    }
  }

  // this takes a flat array of [property name, getter, setter] tuples
  // it makes the transparent getters/setters for the given object, wrapping
  // the setters in the provided wrapper.
  // The wrapper is currently used in two situations. First, to make sure that
  // the config.DEFAULTS frontend doesn't get changed. And second, to make sure
  // that any time a variable is changed, the onchange event is triggered.
  function makeGettersSetters (obj, list, mutatorWrapper) {
    for (var i=0; i<list.length; i += 3) {
      // list[i:i+3] is structured [property name, getter, setter]
      obj.__defineGetter__(list[i], list[i+1]);
      obj.__defineSetter__(list[i], mutatorWrapper(list[i+2]));
    }
  }

  // front end for delay modifiers. has the same structure as in the internal
  // representation, but with an additional `.list` method which returns the
  // names of the modifiers.
  function ModifiersFrontend (modifiers, mutatorWrapper) {
    var defaults = DEFAULT_OPTIONS.modifiers;
    var getset = [];
    H.keys(defaults).forEach(function (key) {
      getset.push(key, setter(modifiers, key), clamper(modifiers, key, 0, 5));
    });
    makeGettersSetters(this, getset, mutatorWrapper);
    this.list = function () { return H.keys(defaults); }
  }

  // front end for individual themes. Again, same structure as IR but with
  // a `.listColors` method.
  function ThemeFrontend (theme, mutatorWrapper) {
    this.listColors = function () { return H.keys(theme.colors); };

    var colors = {};
    makeGettersSetters(
      colors,
      H.flatten(H.keys(theme.colors).map(function (name) {
        return [name, getter(theme.colors, name), color(theme.colors, name)];
      })),
      mutatorWrapper
    );

    makeGettersSetters(
      this,
      [
        "backdrop_opacity"
      , getter(theme, "backdrop_opacity")
      , color(theme, "backdrop_opacity")

        "colors", function () { return colors; } , immuatble()
      ],
      mutatorWrapper);
  }

  // front end for themes array. has a `.current` property which returns
  // the theme currently in use and can be set to any of the objects returned by
  // the `.list` method to change the theme. In addition, there's a `.next`
  // method which cycles through the list of themes.
  function ThemesFrontend (opts, mutatorWrapper) {
    var themesArray;

    function addRemoveMethod (customThemeFrontend) {
      customThemeFrontend.remove = mutatorWrapper(function () {
        var idx = themesArray.indexOf(this);
        var optsIdx = idx - DEFAULT_THEMES.length;
        themesArray.splice(idx, 1);
        opts.custom_themes.splice(optsIdx, 1);
        if (idx === themesArray.length) {
          opts.selected_theme--;
        }
      });
      return customThemeFrontend;
    }

    var themesArray = DEFAULT_THEMES.map(function (defaultTheme) {
      return new ThemeFrontend(defaultTheme, immuatble);
    }).concat(opts.custom_themes.map(function (customTheme) {
      return addRemoveMethod(new ThemeFrontend(customTheme, mutatorWrapper));
    }));

    this.new = mutatorWrapper(function (select) {
      var newTheme = JSON.parse(JSON.stringify(DEFAULT_THEMES[0]));
      opts.custom_themes.push(newTheme);
      themesArray.push(
        addRemoveMethod(new ThemeFrontend(newTheme, mutatorWrapper)
      );
      if (select) {
        opts.selected_theme = themesArray.length - 1;
      }
    });

    this.list = function () { return themesArray.slice(0); };

    var getset = [
      "current"
    , function () { return themesArray[opts.selected_theme]; }
    , function (theme) {
        var idx = themes.indexOf(theme);
        if (idx > -1) {
          options.selected_theme = idx;
        } else {
          themes.newTheme(true);
          this.theme = H.recursiveExtend(this.theme, theme);
        }
      }
    ];
  }

  function ConfigFrontend (opts, mutatorWrapper) {
    var modifiers = new ModifiersFrontend(opts.modifiers, mutatorWrapper);
    var themes = new ThemesFrontend(opts);
    var get = function (prop) { return getter(opts, prop); }

    var getset = [
      "scale", get("scale"), clamper(opts, "scale", 0.1, 10)

    , "dark", get("dark"), bool(opts, "dark")

    , "wpm", get("target_wpm"), clamper(opts, "target_wpm", 100, 1500)

    , "selection_color", get("selection_color"), color(opts, "selection_color")

    , "show_message", get("show_message"), bool(opts, "show_message")

    , "font", get("font_family"), setter(opts, "font_family")

    , "theme"
    , function () { return themes[opts.selected_theme]; }
    , function (theme) {
        var idx = themes.indexOf(theme);
        if (idx > -1) {
          options.selected_theme = idx;
        } else {
          themes.newTheme(true);
          this.theme = H.recursiveExtend(this.theme, theme);
        }
      }

    , "modifiers", function () { return modifiers; } , immuatble()
    , "themes", function () { return themes; }, immuatble()
    ];

    makeGettersSetters(this, getset, mutatorWrapper);
  }


  /*** STATE ***/

  // This is where we store the options for the current instance of jetzt.
  // The identity of the object never changes.
  var options = H.clone(DEFAULT_OPTIONS);

  // list of folks to notify of changes
  var listeners = [];

  function announce () {
    listeners.forEach(function (cb) { cb(); });
  }

  jetzt.config = new ConfigFrontend(options, function (fn) {
    return function () {
      fn.apply(this, arguments);
      announce();
      persist();
    };
  });

  jetzt.config.DEFAULTS = new ConfigFrontend(DEFAULT_OPTIONS, immuatble);

  /**
   * takes a callback and invokes it each time an option changes
   * returns a function which, when invoked, unregisters the callback
   */
  jetzt.config.onChange = function (cb) {
    listeners.push(cb);
    return function () { H.removeFromArray(listeners, cb); };
  };

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
   * Triggers an automatic reload of the persisted options
   */
  config.refresh = function (cb) {
    configBackend.get(function (json) {
      unpersist(json);
      cb && cb();
    });
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
    } catch (e) {
      throw new Error("corrupt config json", e);
    }
  }


  /**
   * convenience function for finding the highest of two modifiers.
   */
  config.maxModifier = function (a, b) {
    return this.modifiers[a] > this.modifiers[b] ? a : b;
  };


  // load the options from the default config backend to get the ball rolling
  config.refresh();

})(this);
