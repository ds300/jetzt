var optsApp = angular.module('optsApp',[]);

optsApp.controller('OptionsController',['$scope','$window',function($scope,$window) {
	var configBackend = $window.jetzt.config.getBackend();

	$scope.options = $window.jetzt.DEFAULT_OPTIONS;

	var loadOptions = function() {
		configBackend.get(function(opts) {
			$scope.$$phase || $scope.$apply(function() {
					options = jetzt.helpers.recursiveExtend({}, options, opts);
					$scope.options = options;
			});			
		});
	};
	
	var loadFonts = function() {
		$window.chrome.fontSettings.getFontList(function(fonts){
			$scope.$$phase || $scope.$apply(function() {
				$scope.installedFonts = fonts;
			});
		});
	};
	
	$scope.save = function() { configBackend.set($scope.options) };

	$scope.load = loadOptions;

	$scope.showLab = function() {
		// this should be done using ng-show or something
		document.getElementById('labPopUp').show();	
	};
	
	// I don't think there's any reason to wait here?
	angular.element(document).ready(loadOptions);
	angular.element(document).ready(loadFonts);
}]);