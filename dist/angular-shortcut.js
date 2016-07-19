(function (angular) {
  'use strict';
  angular.module('angular-shortcut', []);
})(angular);

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

/* eslint no-loop-func:1, guard-for-in:1, quote-props:1 */

(function (angular) {
  'use strict';
  angular.module('angular-shortcut').factory('shortcuts', ['$document', function ($document) {
    var overwriteWithout = function (arr, item) {
      for (var i = arr.length; i >= 0; i--) {
        if (arr[i] === item) {
          arr.splice(i, 1);
        }
      }
    };

    var shortcuts = [];

    var charKeyCodes = {
      'delete': 8,
      'tab': 9,
      'enter': 13,
      'return': 13,
      'esc': 27,
      'space': 32,
      'left': 37,
      'up': 38,
      'right': 39,
      'down': 40,
      ';': 186,
      '=': 187,
      ',': 188,
      '-': 189,
      '.': 190,
      '/': 191,
      '`': 192,
      '[': 219,
      '\\': 220,
      ']': 221,
      '\'': 222
    };

    var keyCodeChars = {};
    for (var character in charKeyCodes) {
      var keyCode = charKeyCodes[character];
      keyCodeChars[keyCode] = character;
    }

    var inOrder = function (keys, initial) {
      var len = keys.length;
      for (var i = 0; i < len; i++) {
        charKeyCodes[keys[i]] = initial + i;
      }
    };

    inOrder('1234567890', 49);
    inOrder('abcdefghijklmnopqrstuvwxyz', 65);

    var modifierKeys = {
      'shift': 'shift',
      'ctrl': 'ctrl',
      'meta': 'meta',
      'alt': 'alt'
    };

    var parseKeySet = function (keySet) {
      var names = keySet.split('+');
      var keys = {};

      // Default modifiers to unset.
      for (var i in modifierKeys) {
        keys[modifierKeys[i]] = false;
      }

      for (var n in names) {
        var name = names[n];
        var modifierKey = modifierKeys[name];
        if (modifierKey) {
          keys[modifierKey] = true;
        } else {
          keys.keyCode = charKeyCodes[name];

          // In case someone tries for a weird key.
          if (!keys.keyCode) {
            return;
          }
        }
      }

      return keys;
    };

    var parseEvent = function (e) {
      var keys = {};
      keys.keyCode = charKeyCodes[keyCodeChars[e.which]];
      keys.meta = e.metaKey || false;
      keys.alt = e.altKey || false;
      keys.ctrl = e.ctrlKey || false;
      keys.shift = e.shiftKey || false;
      return keys;
    };

    var match = function (k1, k2) {
      return (
        k1.keyCode === k2.keyCode &&
        k1.ctrl === k2.ctrl &&
        k1.alt === k2.alt &&
        k1.meta === k2.meta &&
        k1.shift === k2.shift
      );
    };

    $document.bind('keydown', function (e) {
      var $target = $(e.target);

      var eventKeys = parseEvent(e);
      var shortcut;

      for (var i = shortcuts.length - 1; i >= 0; i--) {
        shortcut = shortcuts[i];
        if ((!shortcut.target || $target.closest(shortcut.target).length) && match(eventKeys, shortcut.keys)) {
          if (shortcut.respectInputs &&
            (($target.is('input, textarea') && $target.val() !== ''))) {
            return;
          }

          $target.blur();

          // NOTE: the action is responsible for $scope.$apply!
          var r = shortcut.action();

          var passive = shortcut.passive || r === false;

          if (!passive) {
            e.preventDefault();
          }

          if ($target.is('input[type="text"], textarea')) {
            $target.focus();
          }

          return passive;
        }
      }
    });

    return {
      shortcuts: shortcuts,
      register: function (shortcut) {
        shortcut.keys = parseKeySet(shortcut.keySet);

        // Be lenient.
        if (!shortcut.keys) {
          return;
        }

        shortcuts.push(shortcut);
        return shortcut;
      },
      unregister: function (shortcut) {
        overwriteWithout(shortcuts, shortcut);
      }
    };
  }]);
})(angular);
