var optsApp = angular.module('optsApp',[]);

optsApp.controller('OptionsController',['$scope','$window',function($scope,$window) {
	var configBackend = $window.jetzt.config.getBackend();

	var defaults = $window.jetzt.DEFAULT_OPTIONS;


	var saved;

	configBackend.get(function(opts) {
		$scope.$$phase || $scope.$apply(function() {
			saved = opts;
			$scope.options = angular.copy(opts);
		});			
	});

	

	$window.chrome.fontSettings.getFontList(function(fonts){
		$scope.$$phase || $scope.$apply(function() {
			$scope.installedFonts = fonts;
		});
	});

	$scope.listModifierNames = function () {
		var result = [];
		angular.forEach(defaults.modifiers, function (_, k) {
			result.push(k);
		});
		return result;
	};

	$scope.isClean = function () {
		return angular.equals(saved, $scope.options)
	};
	
	$scope.reset = function (toDefaults) {
		var opts = toDefaults ? defaults : saved;
	};

	$scope.showLab = function() {
		// this should be done using ng-show or something
		document.getElementById('labPopUp').show();	
	};

	$scope.modifierNames = [];

	angular.forEach(defaults.modifiers, function (_, k) {
		$scope.modifierNames.push(k);
	});

	$scope.$watch("options", function (val) {
		if (val) {
			configBackend.set(val);
			$window.jetzt.config.refresh();
		}
	}, true);

	$scope.editing = "Appearance";
}]);

optsApp.controller("ThemeCtrl", function ($scope, $window) {

	var lightReader = new jetzt.view.Reader();
	var darkReader = new jetzt.view.Reader();

	darkReader.dark = true;

	var setupReader = function (r, elemid) {
		r.appendTo(document.getElementById(elemid));
		r.setScale(0.65);
		r.setWord("jetzt");
		r.setProgress(34);
		r.setMessage("43s left");
		r.showMessage();
		r.setWPM(400);
		r.setWrap("“", "”");
		$scope.$watch("options.selected_theme", function (val) {
			if (typeof val === 'number') {
				var theme = $scope.options.themes[val];
				r.applyTheme(theme);
			}
		});
		$scope.$watch("theme", function (theme) {
			if (theme) {
				r.applyTheme(theme);
			}
		}, true);
		$scope.$watch("options.font_family", function (val) {
			if (typeof val === 'string') {
				r.setFont(val);
				r.setWord("jetzt");
			}
		});
	};

	setupReader(lightReader, "reader-demo-light");
	setupReader(darkReader, "reader-demo-dark");

	

	$scope.newCustomTheme = function () {
		var newTheme = angular.copy($scope.options.themes[$scope.options.selected_theme]);
		newTheme.name = "Custom Theme";
		newTheme.custom = true;
		$scope.options.themes.push(newTheme);
		$scope.options.selected_theme = $scope.options.themes.length-1;
		$scope.editTheme($scope.options.themes.length-1);
	};

	$scope.deleteTheme = function (idx) {
		var themes = $scope.options.themes;
		if (themes[idx].custom) {
			themes.splice(idx, 1);
		}
		if (idx === $scope.options.selected_theme) {
			$scope.options.selected_theme = 0;
		}
	};

	$scope.editTheme = function (idx) {
		$scope.options.selected_theme = idx;
		var theme = $scope.options.themes[idx];
		$scope.theme = theme;
		$scope.editingStyle = "light";
	};

	$scope.finishEditing = function () {
		$scope.theme = null;
	};

	$scope.listProperties = function () {
		if (!$scope.options) {
			return [];
		} else {
			var example = $scope.options.themes[0].light
			var props = [];
			for (var prop in example) {
				if (prop != "backdrop_opacity" && example.hasOwnProperty(prop)) {
					props.push(prop);
				}
			}
			return props;
		}
	};

	$scope.removeCruft = function (s) {
		return s.replace(/_/g, " ").replace("color", "");
	};


	$scope.$watch("pasted", function (val) {
		if (val) {
			$scope.pasted = null;
			try {
				var theme = JSON.parse(val);

				theme = jetzt.helpers.recursiveExtend({}, $scope.options.themes[0], theme);
				theme.custom = true;

				// TODO: validate the theme properly
				$scope.options.themes.push(theme);
				$scope.options.selected_theme = $scope.options.themes.length - 1;
			} catch (e) {
				$scope.error = "Invalid theme";
			}
		}
	})
});