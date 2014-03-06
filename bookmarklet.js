javascript: (function() {
	if (typeof cb == 'undefined') {
		cb = function() {
			var style = document.createElement('link');
			style.rel = 'stylesheet';
			style.type = 'text/css';
			style.href = 'https://rawgithub.com/peteruithoven/jetzt/gh-pages/jetzt.css';
			document.head.appendChild(style);
			
			var text = window.getSelection().toString();
			if (text.trim().length > 0) {
				window.jetzt.init(text);
        window.getSelection().removeAllRanges();
      }
		};
		var script = document.createElement('script');
		script.src = 'https://rawgithub.com/peteruithoven/jetzt/gh-pages/jetzt.js?callback=cb&time'
				+ (new Date().getTime());
		script.onload = cb;
		document.body.appendChild(script);
	} else {
		var text = window.getSelection().toString();
		if (text.trim().length > 0) {
			window.jetzt.init(text);
      window.getSelection().removeAllRanges();
    }
	}
})();