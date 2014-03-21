/*
   Licensed under the Apache License v2.0.
            
   A copy of which can be found at the root of this distrubution in 
   the file LICENSE-2.0 or at http://www.apache.org/licenses/LICENSE-2.0
*/

/*** This file not included in bookmarklet ***/

(function (window) {
  var jetzt  = window.jetzt
    , H      = jetzt.helpers
    , config = jetzt.config
    , themes = {};

  jetzt.themes = themes;

  var defaults = config.DEFAULT_THEMES;

  function customThemes () {
    return config("custom_themes");
  }

  /**
   * Returns the names of available themes
   */
  themes.list = function () {
    return defaults.concat(customThemes());
  };

  // monkey patch yay!
  config.getSelectedTheme = function () {
    var idx = config("selected_theme");
    var allthemes = themes.list();
    return allthemes[idx] || allthemes[0];
  };

  /**
   * Creates and selects a new theme
   */
  themes.newTheme = function (theme) {
    if (!theme) {
      theme = H.clone(config.getSelectedTheme());
      theme.name = "Custom Theme";
    }

    theme.custom = true;

    var customs = customThemes();
    customs.push(theme);

    config("custom_themes", customs);
    config("selected_theme", defaults.length + customs.length - 1);
  };

  themes.select = function (idx) {
    if (idx < defaults.length + customThemes().length) {
      config("selected_theme", idx);
    }
  };

  themes.remove = function (idx) {
    if (idx < defaults.length) return;
    idx -= defaults.length;

    var customs = customThemes();
    customs.splice(idx, 1);

    if (idx === customs.length) {
      themes.select(defaults.length + idx-1);
    }
    config("custom_themes", customs);
  };

})(this);
