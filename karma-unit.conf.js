'use strict';

const webpackConfig = require('./webpack.dev.config');

webpackConfig.entry = undefined;
webpackConfig.output = undefined;

module.exports = function (config) {
  config.set({
    basePath: '.',
    frameworks: ['jasmine'],
    singleRun: true,
    captureConsole: true,
    plugins: [
      'karma-chrome-launcher',
      'karma-jasmine',
      'karma-webpack',
      'karma-sourcemap-loader',
    ],
    browsers: ['Chrome'],
    files: ['src/**/*.js', 'test/unit/*.spec.js'],
    preprocessors: {
      'src/**/*.js': ['webpack', 'sourcemap'],
      'test/**/*.js': ['webpack', 'sourcemap'],
    },
    webpack: webpackConfig,
    webpackMiddleware: {
      stats: 'errors-only',
    },
    reporters: ['progress'],
  });
};
