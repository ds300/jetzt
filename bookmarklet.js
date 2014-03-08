javascript: (function() {
	if (typeof cb == 'undefined') {
		cb = function() {
			var style = document.createElement('link');
			style.rel = 'stylesheet';
			style.type = 'text/css';
			style.href = 'https://rawgithub.com/ds300/jetzt/gh-pages/jetzt.css';
			document.head.appendChild(style);
			
			window.jetzt.select();
		};
		var script = document.createElement('script');
		script.src = 'https://rawgithub.com/ds300/jetzt/gh-pages/jetzt.js?callback=cb';
		script.onload = cb;
		document.body.appendChild(script);
	} else {
		window.jetzt.select();
	}
})();