(function() {
	/** Pop-up fade-in/-out delay */
	var FADE_DURATION = 250;
	
	/**
	 * Load the stylesheet that will pick the correct font for the user's OS
	 */
	function loadOSStyles() {
		var osStyle = document.createElement('link');
		osStyle.rel = 'stylesheet';
		osStyle.type = 'text/css';
		if(navigator.userAgent.indexOf('Windows') !== -1) {
			osStyle.href = 'styles/options-win.css';
		} else if(navigator.userAgent.indexOf('Macintosh') !== -1) {
			osStyle.href = 'styles/options-mac.css';
		} else if(navigator.userAgent.indexOf('CrOS') !== -1) {
			osStyle.href = 'styles/options-cros.css';
			// Change the “Chrome” label to “Chrome OS” on CrOS.
			document.querySelector('.sideBar h1').innerText = 'Chrome OS';
		} else {
			osStyle.href = 'styles/options-linux.css';
		}
		document.head.appendChild(osStyle);
	}
	/**
	 * Change any chrome:// link to use the goToPage function
	 */
	function setUpChromeLinks() {
		// Get the list of <a>s.
		var links = document.getElementsByTagName('a');
		// For each link,
		for(var i = 0; i < links.length; i++) {
			// if the URL begins with “chrome://”,
			if(links[i].href.indexOf('chrome://') === 0) {
				// tell it to goToPage onclick.
				links[i].onclick = goToPage;
			}
		}
	}
	/**
	 * Use chrome.tabs.update to open a link Chrome will not open normally
	 */
	function goToPage(e) {
		// Prevent the browser from following the link.
		e.preventDefault();
		chrome.tabs.update({ url: e.target.href });
	}
	
	/**
	 * Add show and hide functions to all pop-up pages
	 */
	function setUpPopups() {
		// Get the list of pop-ups.
		var popups = document.getElementsByClassName('page');
		// For each pop-up,
		for(var i = 0; i < popups.length; i++) {
			// Set the show and hide functions.
			popups[i].show = showPopup;
			popups[i].fadeOut = fadeOutPopup;
			popups[i].hide = hidePopup;
			
			// Get the list of close buttons.
			var closeButtons = popups[i].getElementsByClassName('closeButton');
			// For each close button,
			for(var j = 0; j < closeButtons.length; j++) {
				// If it is a direct child of the pop-up,
				if(closeButtons[j].parentElement === popups[i]) {
					// Make it close the pop-up.
					closeButtons[j].addEventListener('click', function(e) {
						e.target.parentElement.fadeOut();
					}, false);
				}
			}
		}
		
		// Get the list of overlays.
		var overlays = document.getElementsByClassName('overlay');
		// For each overlay,
		for(var i = 0; i < overlays.length; i++) {
			overlays[i].fadeOutChildPopups = fadeOutChildPopups;
			overlays[i].hideChildPopups = hideChildPopups;
			// Close child pop-ups onclick.
			overlays[i].addEventListener('click', function(e) {
				// If the click was outside any pop-up.
				if(e.target.classList.contains('overlay')) {
					e.target.fadeOutChildPopups();
				}
			}, false);
		}
	}
	/**
	 * Show a pop-up page
	 */
	function showPopup() {
		// Un-hide the pop-up.
		this.classList.remove('hidden');
		// If the pop-up is in an overlay element,
		if(this.parentElement.classList.contains('overlay')) {
			// Un-hide the overlay.
			this.parentElement.classList.remove('hidden');
			var self = this;
			setTimeout(function() {
				self.parentElement.classList.remove('transparent');
			}, 1);
		}
	}
	/**
	 * Fade out a pop-up page
	 */
	function fadeOutPopup() {
		// If the pop-up is in an overlay element,
		if(this.parentElement.classList.contains('overlay')) {
			// Fade it out.
			this.parentElement.classList.add('transparent');
		}
		var self = this;
		setTimeout(function() {
			self.hide();
		}, FADE_DURATION);
	}
	/**
	 * Finish hiding a pop-up page
	 */
	function hidePopup() {
		// If the pop-up is in an overlay element,
		if(this.parentElement.classList.contains('overlay')) {
			// Hide the overlay.
			this.parentElement.classList.add('hidden');
		}
		// Hide the pop-up.
		this.classList.add('hidden');
	}
	/**
	 * Fade out all the pop-ups in an overlay.
	 */
	function fadeOutChildPopups() {
		// Fade the overlay out.
		this.classList.add('transparent');
		
		var self = this;
		setTimeout(function() {
			self.hideChildPopups();
		}, FADE_DURATION);
	}
	/**
	 * Hide all the pop-ups in an overlay.
	 */
	function hideChildPopups() {
		// Hide the overlay.
		this.classList.add('hidden');
		// Get the list of pop-ups.
		var popups = this.getElementsByClassName('page');
		// Hide each pop-up.
		for(var i = 0; i < popups.length; i++) {
			popups[i].classList.add('hidden');
		}
	}
	
	// Load OS styles and set up chrome:// links when the page loads.
	window.addEventListener('load', function() {
		loadOSStyles();
		setUpChromeLinks();
		setUpPopups();
	}, false);
})();