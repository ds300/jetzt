/*
   Licensed under the Apache License v2.0.
            
   A copy of which can be found at the root of this distrubution in 
   the file LICENSE-2.0 or at http://www.apache.org/licenses/LICENSE-2.0
*/

(function (window) {
  var jetzt  = window.jetzt
    , reader = jetzt.view.reader;


  /*** state ***/
  var executor;

  jetzt.init = function (instructions) {
    if (executor) throw new Error("jetzt already initialised");

    reader.clear();
    executor = jetzt.exec(instructions);
    jetzt.control.keyboard(executor);

    reader.show();
    reader.onBackdropClick(jetzt.quit);

    setTimeout(function () { executor.start(); }, 500);
  };

  jetzt.quit = function () {
    executor.stop();
    reader.hide();
    executor = null;
  };

  jetzt.isOpen = function () {
    return !!executor;
  };

})(this);
