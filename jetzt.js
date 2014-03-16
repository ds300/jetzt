/*
   Licensed under the Apache License v2.0.
            
   A copy of which can be found at the root of this distrubution in 
   the file LICENSE-2.0 or at http://www.apache.org/licenses/LICENSE-2.0
*/

(function (window) {
  "use strict";

  window.addEventListener("keydown", function (ev) {
    if (!instructions && ev.altKey && ev.keyCode === 83) {
      ev.preventDefault();
      window.jetzt.select();
    }
  });

})(window);
