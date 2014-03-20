javascript: 
"{JS}"
(function() {	
	function addStyle(cssCode) {
		var styleElement = document.createElement("style");
		  styleElement.type = "text/css";
		  if (styleElement.styleSheet) {
		    styleElement.styleSheet.cssText = cssCode;
		  } else {
		    styleElement.appendChild(document.createTextNode(cssCode));
		  }
		  document.getElementsByTagName("head")[0].appendChild(styleElement);
		}
	addStyle("{CSS}");
	window.jetzt.select();
})();