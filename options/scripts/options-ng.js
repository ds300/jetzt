var optsApp = angular.module('optsApp',[]);

optsApp.controller('OptionsController',['$scope','$window',function($scope,$window) {
	$scope.options = $window.jetzt.config;

	var defaults = $window.jetzt.DEFAULT_OPTIONS;

	$scope.resetDefaultModifiers = function () {
		angular.extend($scope.options.modifiers, defaults.modifiers);
	};
	

	$window.chrome.fontSettings.getFontList(function(fonts){
		$scope.$$phase || $scope.$apply(function() {
			$scope.installedFonts = fonts;
		});
	});

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

		$scope.$watch("options.theme", function (theme) {
			if (theme) {
				r.applyTheme(theme);
				// trigger persist
				$window.jetzt.config.theme = theme;
			}
		}, true);
		$scope.$watch("options.font", function (val) {
			console.log(val);
			r.setFont(val);
			r.setWord("jetzt");
		});
	};

	setupReader(lightReader, "reader-demo-light");
	setupReader(darkReader, "reader-demo-dark");

	
	$scope.editTheme = function (theme) {
		$scope.options.theme = theme;
		$scope.editingStyle = "light";
	};

	$scope.finishEditing = function () {
		$scope.editingStyle = null;
	};

	$scope.colorProperties = (function () {
		var example = $window.jetzt.config.theme;
		var props = [];
		for (var prop in example.light.colors) {
			if (example.light.colors.hasOwnProperty(prop)) {
				props.push(prop);
			}
		}
		return props;
	})();

	$scope.noUnderscores = function (s) {
		return s.replace(/_/g, " ");
	};

	$scope.$watch("pasted", function (val) {
		if (val) {
			$scope.pasted = null;
			try {
				var theme = JSON.parse(val);

				// TODO: validate the theme properly
				$window.jetzt.config.theme = theme;

			} catch (e) {
				$scope.error = "Invalid theme";
			}
		}
	})
});