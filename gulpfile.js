'use strict';

var gulp = require('gulp');
var del = require('del');
var $ = require('gulp-load-plugins')();

gulp.task('clean', function (next) {
  return del('dist', next);
});

gulp.task('build', function () {
  return gulp.src(['src/shortcut.module.js', 'src/*.js'])
    .pipe($.stripDebug())
    .pipe($.uglify({ mangle: false }))
    .pipe($.concat('angular-shortcut.js'))
    .pipe(gulp.dest('dist/'));
});

gulp.task('default', ['clean', 'build']);

gulp.task('test', function () {
  gulp.src('tests/**/*.spec.js')
    .pipe($.jasmine());
});
