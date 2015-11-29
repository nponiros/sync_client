'use strict';

const gulp = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');

const pluginRenames = {
  'gulp-eslint': 'eslint'
};

const plugins = gulpLoadPlugins({
  rename: pluginRenames,
  replaceString: /^gulp(-|\.)/
});

gulp.task('eslint', () => {
  return gulp.src('src/**/*.js')
    .pipe(plugins.eslint('eslint.yaml'))
    .pipe(plugins.eslint.format());
});

gulp.task('build', () => {
  return gulp.src('src/**/*.js')
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.babel({
      presets: ['es2015']
    }))
    .pipe(plugins.sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
});

gulp.task('default', ['eslint']);
