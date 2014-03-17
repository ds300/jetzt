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
		angular.forEach(options.modifiers, function (_, k) {
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

	$scope.editing = "Appearance";
}]);

optsApp.controller("ThemeController", function ($scope) {
	var qualifiedNewThemeName = function (name, n) {
		var themes = $scope.options.themes;
		var qualified = name + " " + n;
		for (var i=0, len=themes.length; i < len; i++) {
			if (themes[i].name === qualified) {
				return qualifiedNewThemeName(name, n+1);
			}
		}
		return qualified;
	};

	$scope.newCustomTheme = function () {
		var newTheme = angular.copy($scope.options.selected_theme);
		newTheme.name = qualifiedNewThemeName("Custom Theme", 1);
		newTheme.custom = true;
		$scope.options.themes.push(newTheme);
		$scope.options.selected_theme = newTheme.name;
	};

	$scope.deleteTheme = function (idx) {
		var themes = $scope.options.themes;
		if (themes[idx].custom) {
			themes.splice(idx, 1);
		}
		$scope.options.selected_theme = "Default";
	};
});