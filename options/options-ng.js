var optsApp = angular.module('optsApp',[]);

optsApp.controller('OptionsController',['$scope',function($scope) {
	$scope.options = options;
	$scope.save = function() { configBackend.set($scope.options) };
	$scope.load = function() {
		configBackend.get(function(opts) {
			$scope.$apply(function() { 
				options = recursiveExtend({}, options, opts);
				$scope.options = opts
			});
		});
	};
}]);