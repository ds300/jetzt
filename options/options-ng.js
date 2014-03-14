var optsApp = angular.module('optsApp',[]);

optsApp.controller('OptionsController',['$scope',function($scope) {
	var loadOptions = function() {
		configBackend.get(function(opts) {
			$scope.$apply(function() {
					options = recursiveExtend({}, options, opts);
					$scope.options = options;
			});			
		});
	};
	$scope.options = options;
	$scope.save = function() { configBackend.set($scope.options) };
	$scope.load = loadOptions;
	
	angular.element(document).ready(loadOptions);
	setConfigBackend(chromeConfigStorage);
}]);