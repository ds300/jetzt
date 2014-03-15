  /*
     $$$$$$\   $$$$$$\  $$\   $$\ $$$$$$$$\ $$$$$$\  $$$$$$\
    $$  __$$\ $$  __$$\ $$$\  $$ |$$  _____|\_$$  _|$$  __$$\
    $$ /  \__|$$ /  $$ |$$$$\ $$ |$$ |        $$ |  $$ /  \__|
    $$ |      $$ |  $$ |$$ $$\$$ |$$$$$\      $$ |  $$ |$$$$\
    $$ |      $$ |  $$ |$$ \$$$$ |$$  __|     $$ |  $$ |\_$$ |
    $$ |  $$\ $$ |  $$ |$$ |\$$$ |$$ |        $$ |  $$ |  $$ |
    \$$$$$$  | $$$$$$  |$$ | \$$ |$$ |      $$$$$$\ \$$$$$$  |
     \______/  \______/ \__|  \__|\__|      \______| \______/
  */

  var DEFAULT_OPTIONS = {
      target_wpm: 400,
      scale: 1,
      dark: false,
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
	  view : {
	  	selection_color : "red",
	  	font_family: "Georgia"
	  }
      // keybindings and so forth soon
  };

  var options = recursiveExtend({}, DEFAULT_OPTIONS);

  // placeholder config backend for when there is no real backend.
  var configBackend = {
    get: function (cb) {
      cb(options);
    },
    set: function (opts) {}
  };

  /**
   * jetzt.setConfigBackend
   * Set the config 'backend' store. Should be an object with methods
   * void get(cb(opts))
   * void set(opts)
   */
  function setConfigBackend (backend) {
    configBackend = backend;
    backend.get(function (opts) {
      if (realTypeOf(opts) === 'Object') {
        options = recursiveExtend({}, options, opts);
      } else {
        throw new Error("bad config backend");
      }
    });
  };

  // recursive lookup
  function lookup (map, keyPath) {
    if (keyPath.length === 0) throw new Error("this should never happen");

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

  function put (map, keyPath, val) {
    if (keyPath.length === 0) throw new Error("this should never happen");

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
  function config (keyPath, val) {
    if (typeof keyPath === 'string') keyPath = [keyPath];

    if (typeof val === 'undefined') {
      return lookup(options, keyPath);
    } else {
      put(options, keyPath, val);
      configBackend.set(options);
    }
  }

  function modifier(mod) {
    return config(["modifiers", mod]) || 1;
  }

  function maxModifier(a, b) {
    if ((modifier(a) || 1) > (modifier(b) || 1)) {
      return a;
    } else {
      return b;
    }
  }
