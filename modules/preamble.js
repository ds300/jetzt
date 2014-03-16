(function (window) {
  if (typeof window.jetzt !== 'undefined') {
    console.warn("jetzt unable to initialize, window.jetzt already set");
    return;
  } else {
    window.jetzt = {};
  }
})(this);