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
			window.jetzt.select();
		};
		addStyle('https://ds300.github.io/jetzt/jetzt.css');
		addScript('https://ds300.github.io/jetzt/jetzt-solid.min.js',cb);
	} else {
		window.jetzt.select();
	}
})();
