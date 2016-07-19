/* eslint no-loop-func:1, guard-for-in:1 */
(function (angular) {
  'use strict';

  angular.module('angular-shortcut').directive('ngShortcut', ['$parse', '$location', 'shortcuts', function ($parse, $location, shortcuts) {
    function isSet(attrs, expr) {
      return attrs[expr] !== undefined || attrs.hasOwnProperty(expr);
    }

    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        var shortcutKeySets = scope.$eval(attrs.ngShortcut);
        if (!shortcutKeySets) {
          console.log('No KeySet');
          return;
        }
        shortcutKeySets = shortcutKeySets.split('|');

        var action;
        var eventAction = function (event) {
          return function () {
            element.trigger(event);
          };
        };
        if (isSet(attrs, 'ngShortcutClick')) {
          action = function () {
            element.trigger('click');
            element.addClass('active-state');
            setTimeout(function () {
              element.removeClass('active-state');
            }, 200);
          };
        } else if (isSet(attrs, 'ngShortcutFocus')) {
          action = eventAction('focus');
        } else if (isSet(attrs, 'ngShortcutFastClick')) {
          // Since we are just triggering (not binding)
          // this works just fine.
          action = eventAction('click');
        } else if (attrs.ngShortcutNavigate) {
          var url = scope.$eval(attrs.ngShortcutNavigate);
          action = function () {
            $location.path(url);
          };
        } else if (attrs.ngShortcutAction) {
          var fn = $parse(attrs.ngShortcutAction);
          action = function () {
            var r = fn(scope);
            scope.$apply();
            return r;
          };
        }

        var passive = scope.$eval(attrs.ngShortcutPassive) || false;

        var target;
        if (attrs.ngShortcutTarget) {
          var targetExpression = attrs.ngShortcutTarget;
          if (targetExpression === '.') {
            target = $(element);
          } else if (targetExpression.indexOf('>') >= 0) {
            target = $(element).closest(targetExpression.substring(1));
          } else {
            target = $(element).find(targetExpression);
          }
        }

        var respectInputs = attrs.ngShortcutRespectInputs === 'true';

        for (var k in shortcutKeySets) {
          var keySet = shortcutKeySets[k];
          var shortcut = shortcuts.register({
            keySet: keySet,
            action: action,
            target: target,
            respectInputs: respectInputs,
            passive: passive,
            description: attrs.ngShortcutDescription || ''
          });

          scope.$on('$destroy', function () {
            shortcuts.unregister(shortcut);
          });
        }
      }
    };
  }]);
})(angular);
