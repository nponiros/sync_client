'use strict';
const isparta = require('isparta');
module.exports = function(config) {
  config.set({
    basePath: '.',
    frameworks: ['jasmine-ajax', 'jasmine', 'commonjs'],
    singleRun: true,
    captureConsole: true,
    plugins: [
      'karma-babel-preprocessor',
      'karma-chrome-launcher',
      'karma-commonjs',
      'karma-coverage',
      'karma-firefox-launcher',
      'karma-jasmine',
      'karma-jasmine-ajax'
    ],
    browsers: ['Chrome', 'Firefox'],
    files: ['test/indexeddb_mock.js', 'src/**/*.js', 'test/unit/*_spec.js'],
    preprocessors: {
      'src/**/*.js': ['coverage', 'commonjs'],
      'test/**/*.js': ['babel', 'commonjs']
    },
    babelPreprocessor: {
      options: {
        presets: ['es2015']
      }
    },
    reporters: ['progress', 'coverage'],
    // optionally, configure the reporter
    coverageReporter: {
      type: 'html',
      dir: 'coverage/',
      instrumenters: {
        isparta
      },
      instrumenter: {
        '**/*.js': 'isparta'
      },
      instrumenterOptions: {
        isparta: {
          babel: {
            presets: 'es2015'
          }
        }
      }
    }
  });
};
