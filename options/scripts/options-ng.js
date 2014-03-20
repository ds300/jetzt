var optsApp = angular.module('optsApp',['ngRoute']);

optsApp.value('config', window.jetzt.config);

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

optsApp.controller("ReadingCtrl", function ($scope, $window, config) {

	$scope.modifiers = angular.copy(config.modifiers);

	var defaults = config.DEFAULTS.modifiers;

	var saved;

	config.refresh(function () {
		saved = angular.copy(config.modifiers);
	});

	$scope.resetDefaultModifiers = function () {
		angular.extend(config.modifiers, defaults);
	};

	$scope.resetSessionModifiers = function () {
		saved && angular.extend(config.modifiers, saved);
	};

	$scope.isDefaultClean = function () {
		return angular.equals(defaults, config.modifiers)
	};

	$scope.isSessionClean = function () {
		return angular.equals(saved, config.modifiers);
	};

	var persist = function () {
		angular.extend(config.modifiers, $scope.modifiers);
		$window.onbeforeunload = null;
	};

	$scope.$on("$destroy", persist);

	$window.onbeforeunload = persist;
});

optsApp.controller("AppearanceCtrl", function ($scope, config) {

	$scope.config = config;
	$scope.themes = config.themes;

	window.chrome.fontSettings.getFontList(function (fonts){
		$scope.$$phase || $scope.$apply(function () {
			$scope.installedFonts = fonts;
		});
	});

	var editingId;

	$scope.editTheme = function (id) {
		config.themes.current = id;
		$scope.theme = config.themes.get(id);
		$scope.themeName = id;
		editingId = id;
		$scope.editingStyle = "light";
	};

	$scope.finishEditing = function () {
		if (!config.themes.rename(editingId, $scope.themeName)) return;
		$scope.editingStyle = null;
		editingId = null;
		$scope.themeName = null;
		$scope.theme = null;
	};

	$scope.canRename = function () {
		return editingId
		    && config.themes.canRename(editingId, $scope.themeName);
	};

	$scope.noUnderscores = function (s) {
		return s.replace(/_/g, " ");
	};

	$scope.$watch("pasted", function (val) {
		if (val) {
			$scope.pasted = null;
			try {
				var theme = JSON.parse(val);

				// TODO: validate the theme properly
				config.themes.newTheme(theme);

			} catch (e) {
				$scope.error = "Invalid theme";
			}
		}
	});
});

optsApp.controller("KeyboardCtrl", function ($scope) {
	//blah
});

optsApp.directive("readerDemo", function (loremIpsum, config, $window) {
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
			r.setWrap("“", "”");

			r.dark = lightdark === "dark";

			$scope.$watch("themes.current", function (id) {
				if (id) {
					r.applyTheme(config.themes.get(id));
				}
			}, true);

			$scope.$watch("theme", function (theme) {
				if (theme) { r.applyTheme(theme); }
			}, true)

			$scope.$watch("config.font", function (val) {
				r.setFont(val);
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