var optsApp = angular.module('optsApp',[]);

optsApp.controller('OptionsController',['$scope','$window',function($scope,$window) {
	var configBackend = $window.jetzt.config.getBackend();

	var options = $window.jetzt.DEFAULT_OPTIONS;



	var loadOptions = function() {
		configBackend.get(function(opts) {
			$scope.$$phase || $scope.$apply(function() {
					options = jetzt.helpers.recursiveExtend({}, options, opts);
					$scope.options = angular.copy(options);
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

	$scope.listModifierNames = function () {
		var result = [];
		angular.forEach(options.modifiers, function (_, k) {
			result.push(k);
		});
		return result;
	};

	$scope.isClean = function () {
		return angular.equals(options, $scope.options)
	};
	
	$scope.save = function() {
		configBackend.set($scope.options);
		options = angular.copy($scope.options);
	};

	$scope.load = loadOptions;

	$scope.showLab = function() {
		// this should be done using ng-show or something
		document.getElementById('labPopUp').show();	
	};
	
	// I don't think there's any reason to wait here?
	angular.element(document).ready(loadOptions);
	angular.element(document).ready(loadFonts);
}]);