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
    config_version: CONFIG_VERSION,
    target_wpm: 400,
    scale: 1,
    dark: false,
    show_message: false,
    selection_color: "#FF0000",
    modifiers: {
      normal: 1,
      start_clause: 1,
      end_clause: 1.8,
      start_sentence: 1.3,
      end_sentence: 2.2,
      start_paragraph: 2.0,
      end_paragraph: 2.8,
      short_space: 1.5,
      long_space: 2.2
    },
    font_family: "Menlo, Monaco, Consolas, monospace",
    selected_theme: 0,
    custom_themes: []
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
  function getter (obj, prop) {
    return function () { return obj[prop]; };
  }

  // and for setters
  function setter (obj, prop) {
    return function (val) { obj[prop] = val; }
  }

  // helper for making sure assigned numbers are within some range
  function clamper (setter, min, max) {
    return function (val) {
      if (typeof val !== 'number') throw new Error("Expecting number");
      setter(H.clamp(min, val, max));
    }
  }

  // and for making sure things are boolean
  function bool (setter) {
    return function (val) {
      setter(!!val);
    }
  }

  // colors need to be in hex form for the color picker to show them.
  function color (setter) {
    return function (val) {
      if (!(typeof val === 'string') || !val.match(/^#[0-9a-fA-F]{6}$/))
        throw new Error("bad color format");
      else
        setter(val);
    }
  }

  // some things shouldn't be changed
  function immuatble () {
    return function () {
      throw new Error("unmodifiable property");
    }
  }

  // silly javascript not having built-in function composition
  function comp (f1, f2) {
    return function () {
      return f1(f2.apply(this, arguments));
    };
  }

  // sometimes you need a function that always returns the same value
  function constantly (val) {
    return function () { return val; };
  }

  // this takes a flat array of [property name, getter, setter] tuples
  // it makes the transparent getters/setters for the given object, wrapping
  // the setters in the provided wrapper.
  // The wrapper is currently used in two situations. First, to make sure that
  // the config.DEFAULTS frontend doesn't get changed. And second, to make sure
  // that any time a variable is changed, the onchange event is triggered.
  function makeGettersSetters (obj, list, mutatorWrapper) {
    for (var i=0; i<list.length; i += 3) {
      // remember, list[i:i+3] is structured [property name, getter, setter]
      obj.__defineGetter__(list[i], list[i+1]);
      obj.__defineSetter__(list[i], mutatorWrapper(list[i+2]));
    }
  }

  // This takes an arbitrary object with uniform value types and creates
  // a frontend for it using mutatorWrapper to wrap the setter methods.
  function UniformFrontend (obj, mutatorWrapper) {
    makeGettersSetters(this,
      H.flatten(H.keys(obj).map(function (property) {
        return [
          property,
          getter(obj, property),
          setter(obj, property)
        ];
      })),
      mutatorWrapper
    );
  }

  // the created object also has a .list convenience funtion.
  UniformFrontend.prototype.list = function () { return H.keys(this); };


  // front end for individual styles (a theme is composed of two styles: light
  // and dark). Same structure as in IR
  function StyleFrontend (style, mutatorWrapper) {
    var colors = new UniformFrontend(style.colors, comp(mutatorWrapper, color));
    makeGettersSetters(this, [
      "backdrop_opacity",
      getter(style, "backdrop_opacity"),
      color(setter(style, "backdrop_opacity")),

      "colors", constantly(colors), immuatble()

    ], mutatorWrapper);
  }

  

  // front end for themes array. has a `.current` property which returns
  // the theme currently in use and can be set to any of the objects returned by
  // the `.list` method to change the theme. In addition, there's a `.next`
  // method which cycles through the list of themes. Also a `newTheme` method
  // for... making... new themes...
  function ThemesFrontend (opts, mutatorWrapper) {
    var themesArray;

    // front end for individual themes. Again, same structure as IR but with
    // a `.remove` method
    function ThemeFrontend (theme, mutatorWrapper) {
      var light = new StyleFrontend(theme.light, mutatorWrapper);
      var dark = new StyleFrontend(theme.dark, mutatorWrapper);
      makeGettersSetters(this, [
        "name",
        getter(theme, "name"),
        function (name) {
          if (!(typeof name === 'string')) throw new Error("Expecting string");
          theme.name = name.trim() || "Custom Theme";
        },
    
        "light", constantly(light), immuatble(),

        "dark", constantly(dark), immuatble()

      ], mutatorWrapper);
    }

    ThemeFrontend.prototype.remove = function () {
      if (!this.isCustom()) {
        throw new Error("Can't delete default themes")
      } else {
        var idx = themesArray.indexOf(this);
        var optsIdx = idx - DEFAULT_THEMES.length;
        themesArray.splice(idx, 1);
        opts.custom_themes.splice(optsIdx, 1);
        if (idx === themesArray.length) {
          opts.selected_theme--;
        }
      }
    };

    ThemeFrontend.prototype.isCustom = function () {
      return themesArray.indexOf(this) >= DEFAULT_THEMES.length;
    };

    themesArray = DEFAULT_THEMES.map(function (defaultTheme) {
      return new ThemeFrontend(defaultTheme, immuatble);
    }).concat(opts.custom_themes.map(function (customTheme) {
      return new ThemeFrontend(customTheme, mutatorWrapper);
    }));

    this.next = mutatorWrapper(function () {
      opts.selected_theme = (opts.selected_theme + 1) % themesArray.length;
    });

    this.newTheme = mutatorWrapper(function (select) {
      var newTheme = JSON.parse(JSON.stringify(DEFAULT_THEMES[0]));
      opts.custom_themes.push(newTheme);
      var frontend = addRemoveMethod(
        new ThemeFrontend(newTheme, mutatorWrapper)
      );
      themesArray.push(frontend);
      if (select) {
        opts.selected_theme = themesArray.length - 1;
      }
      return frontend;
    });

    this.list = function () { return themesArray.slice(0); };

    var getset = [
      "current",
      function () { return themesArray[opts.selected_theme]; },
      function (theme) {
        var idx = themes.indexOf(theme);
        if (idx > -1) {
          options.selected_theme = idx;
        } else {
          this.newTheme(true);
          H.recursiveExtend(this.theme, theme);
        }
      }
    ];
    makeGettersSetters(this, getset, mutatorWrapper);
  }

  // front end for entire jetzt config.
  function ConfigFrontend (opts, mutatorWrapper) {
    var modifiers = new UniformFrontend(opts.modifiers, function (setter) {
      return mutatorWrapper(clamper(setter, 0, 5));
    });
    var themes = new ThemesFrontend(opts, mutatorWrapper);
    var get = function (prop) { return getter(opts, prop); }
    var set = function (prop) { return setter(opts, prop); }

    var getset = [
      "scale", get("scale"), clamper(set("scale"), 0.1, 10)

      "dark", get("dark"), bool(set("scale")),

      "wpm", get("target_wpm"), clamper(set("target_wpm"), 100, 1500),

      "selection_color", get("selection_color"), color(set("selection_color")),

      "show_message", get("show_message"), bool(opts, "show_message"),

      "font", get("font_family"), set("font_family"),

      "modifiers", constantly(modifiers) , immuatble(),

      "themes", constantly(themes), immuatble()
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
  jetzt.config.setBackend = function (backend) {
    configBackend = backend;
    this.refresh();
    announce();
  };

  /**
   * Triggers an automatic reload of the persisted options
   */
  jetzt.config.refresh = function (cb) {
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
  jetzt.config.maxModifier = function (a, b) {
    return this.modifiers[a] > this.modifiers[b] ? a : b;
  };


  // load the options from the default config backend to get the ball rolling
  jetzt.config.refresh();

})(this);
