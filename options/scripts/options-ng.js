var optsApp = angular.module('optsApp',['ngRoute']);

optsApp.value('jetzt', window.jetzt);

optsApp.value('loremIpsum',
	"Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy"
	+" nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut"
	+" wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper "
	+"suscipit lobortis nisl ut aliquip ex ea commodo consequat. Duis autem "
	+"vel eum iriure dolor in hendrerit in vulputate velit esse molestie "
	+"consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et "
	+"accumsan et iusto odio dignissim qui blandit praesent luptatum zzril "
	+"delenit augue duis dolore te feugait nulla facilisi. Nam liber tempor "
	+"cum soluta nobis eleifend option congue nihil imperdiet doming id quod "
	+"mazim placerat facer possim assum. Typi non habent claritatem insitam; "
	+"est usus legentis in iis qui facit eorum claritatem. Investigationes "
	+"demonstraverunt lectores legere me lius quod ii legunt saepius. Claritas "
	+"est etiam processus dynamicus, qui sequitur mutationem consuetudium "
	+"lectorum. Mirum est notare quam littera gothica, quam nunc putamus parum "
	+"claram, anteposuerit litterarum formas humanitatis per seacula quarta "
	+"decima et quinta decima. Eodem modo typi, qui nunc nobis videntur parum "
	+"clari, fiant sollemnes in futurum.");

optsApp.controller("MenuCtrl", function ($scope, $route) {
	$scope.$on("$routeChangeSuccess", function () {
		$scope.editing = $route.current.templateUrl.match(/(\w+)\.html/)[1];
	});
});

optsApp.factory("Persist", function ($window) {
	var persisters = [];
	$window.onbeforeunload = function () {
		persisters.forEach(function (f) { f(); });
	};

	return function ($scope, persister) {
		$scope.$on("$destroy", function () {
			persister();
			persisters.splice(persisters.indexOf(persister), 1);
		});
		persisters.push(persister);
	};
});

optsApp.controller("ReadingCtrl", function ($scope, $window, jetzt, Persist) {

	var defaults = jetzt.config.DEFAULTS.modifiers;

	var saved;

	// make sure we get the versions from storage
	jetzt.config.refresh(function () {
		$scope.modifiers = angular.copy(jetzt.config("modifiers"));
		$scope.stripCitation = jetzt.config("strip_citation");
		saved = angular.copy(jetzt.config("modifiers"));
		$scope.$$phase || $scope.$apply();
	});

	$scope.resetDefaultModifiers = function () {
		jetzt.config("modifiers", defaults);
		$scope.modifiers = angular.copy(defaults);
	};

	$scope.resetSessionModifiers = function () {
		if (saved) {
			jetzt.config("modifiers", saved);
			$scope.modifiers = angular.copy(saved);
		}
	};

	$scope.isDefaultClean = function () {
		return angular.equals(defaults, $scope.modifiers); 
	};

	$scope.isSessionClean = function () {
		return angular.equals(saved, $scope.modifiers);
	};

	$scope.modifiersList = jetzt.helpers.keys(defaults);


	Persist($scope, function () {
		jetzt.config("modifiers", $scope.modifiers);
		jetzt.config("strip_citation", $scope.stripCitation);
	});
});

optsApp.controller("AppearanceCtrl", function ($scope, jetzt, Persist) {

	$scope.themes = jetzt.themes;
	$scope.config = jetzt.config;

	$scope.fontWeights = ["normal", "bold", "100", "200", "300", "400", "500", "600", "700", "800", "900"];

	window.chrome.fontSettings.getFontList(function (fonts){
		$scope.$$phase || $scope.$apply(function () {
			$scope.installedFonts = fonts;
		});
	});

	jetzt.config.refresh(function () {
		$scope.font = jetzt.config("font_family");
		$scope.fontWeight = jetzt.config("font_weight");
		$scope.selectionColor = jetzt.config("selection_color");
		$scope.$$phase || $scope.$apply();
	});

	$scope.editTheme = function (idx) {
		jetzt.themes.select(idx);
		$scope.theme = jetzt.config.getSelectedTheme();
		$scope.editingStyle = "light";
	};

	$scope.finishEditing = function () {
		jetzt.config.save();
		$scope.theme = null;
		$scope.editingStyle = null;
	};

	$scope.newTheme = function () {
		jetzt.themes.newTheme();
		$scope.editTheme(jetzt.themes.list().length - 1);
	};

	$scope.noUnderscores = function (s) {
		return s.replace(/_/g, " ");
	};

	$scope.colorsList = jetzt.helpers.keys(jetzt.config.getSelectedTheme().light.colors);

	$scope.$watch("pasted", function (val) {
		if (val) {
			$scope.pasted = null;
			try {
				var theme = JSON.parse(val);

				// TODO: validate the theme properly
				jetzt.themes.newTheme(theme);

			} catch (e) {
				$scope.error = "Invalid theme";
			}
		}
	});

	Persist($scope, function () {
		jetzt.config("font_family", $scope.font);
		jetzt.config("font_weight", $scope.fontWeight);
		jetzt.config("selection_color", $scope.selectionColor);
	});
});

optsApp.controller("KeyboardCtrl", function ($scope) {
	//blah
});

optsApp.directive("readerDemo", function (loremIpsum, jetzt, $window) {
	return {
		scope: false,
		restrict: "A",
		link: function ($scope, $elem, $attrs) {
			var lightdark = $attrs.readerDemo;
			var text = angular.element("<span>").text(loremIpsum);
			$elem.append(text);

			var r = new $window.jetzt.view.Reader();


			r.appendTo($elem[0]);
			r.setScale(0.65);
			r.setWord("jetzt");
			r.setProgress(34);
			r.setMessage("43s left");
			r.showMessage();
			r.setWPM(400);
			r.setWrap("&ldquo;", "&rdquo;");

			r.dark = lightdark === "dark";

			$scope.$watch(jetzt.config.getSelectedTheme, function (theme) {
				if (theme) {
					r.applyTheme(theme);
				}
			}, true);

			$scope.$watch("font", function (val) {
				r.setFont(val);
				r.setWord("jetzt");
			});

			$scope.$watch("fontWeight", function (val) {
				r.setFontWeight(val);
				r.setWord("jetzt");
			});
		}
	}
})

optsApp.config(function($routeProvider) {
	$routeProvider
		.when('/', {
			templateUrl: 'templates/appearance.html',
			controller: 'AppearanceCtrl',
		})
		.when('/reading', {
			templateUrl: 'templates/reading.html',
			controller: 'ReadingCtrl'
		})
		.when('/keyboard', {
			templateUrl: 'templates/keyboard.html',
			controller: 'KeyboardCtrl'
		});

});
