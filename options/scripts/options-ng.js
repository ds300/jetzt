var optsApp = angular.module('optsApp',[]);

optsApp.controller('OptionsController',['$scope','$window',function($scope,$window) {
	var loadOptions = function() {
		configBackend.get(function(opts) {
			$scope.$apply(function() {
					options = recursiveExtend({}, options, opts);
					$scope.options = options;
			});			
		});
	};
	
	var loadFonts = function() {
		$window.chrome.fontSettings.getFontList(function(fonts){
			$scope.$apply(function() {
				$scope.installedFonts = fonts;
			});
		});
	}
	
	$scope.options = options;
	$scope.save = function() { configBackend.set($scope.options) };
	$scope.load = loadOptions;
	$scope.showLab = function() {
		document.getElementById('labPopUp').show();	
	}
	
	setConfigBackend(chromeConfigStorage);	
	angular.element(document).ready(loadOptions);
	angular.element(document).ready(loadFonts);
}]);