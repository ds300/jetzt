/*
   Licensed under the Apache License v2.0.
            
   A copy of which can be found at the root of this distrubution in 
   the file LICENSE-2.0 or at http://www.apache.org/licenses/LICENSE-2.0
*/

(function (window) {
  
  if (typeof window.jetzt !== 'undefined') {
    console.warn("jetzt unable to initialize, window.jetzt already set");
    return;
  } else {
    window.jetzt = {};
  }

})(this);