javascript: (function() {
	var addStyle = function(url) {
		var style = document.createElement('link');
		style.rel = 'stylesheet';
		style.type = 'text/css';
		style.href = url;
		document.head.appendChild(style);
	};
	var addScript = function(url,cb) {
		var script = document.createElement('script');
		script.src = url;
		if(cb) {
			script.onload = cb;
		}
		document.body.appendChild(script);
	};
	if (typeof window.jetzt === 'undefined') {
		var cb = function() {
			addScript('https://raw.github.com/peteruithoven/jetzt/localStorage/localstorage-config.js');
			window.jetzt.select();
		};
		addStyle('https://rawgithub.com/peteruithoven/jetzt/localStorage/jetzt.css');
		addScript('https://raw.github.com/peteruithoven/jetzt/localStorage/jetzt.js',cb);
	} else {
		window.jetzt.select();
	}
})();