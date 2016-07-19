Angular Shortcut
===========

An angular shortcut system based of Zach Snow's blog post: http://zachsnow.com/#!/blog/2013/angularjs-shortcuts/

Shortcuts are english based rather than key codes so you don't have to keep looking them up.

## Install
`npm install angular-shortcut`

In your app:
`angular.module('app', ['angular-shortcut'])`

## Usage
Can be used as a directive on any clickable item.
`<button ng-shortcut="'enter'" ng-shortcut-click></button>`

Or anywhere else:
`<shortcut ng-shortcut="'enter'" ng-shortcut-action="someScopeMethod()"></shortcut>`

It detaches with scope $destroy so you can use normal ng-if to enable/disable
`<shortcut ng-if="somethingIsEnabled" ng-shortcut="'enter'" ng-shortcut-action="someScopeMethod()"></shortcut>`

## Test
Not written yet.
