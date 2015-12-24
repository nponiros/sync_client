module.exports = function(config) {
  config.set({
    basePath: '.',
    frameworks: ['jasmine-ajax', 'jasmine', 'commonjs'],
    singleRun: true,
    captureConsole: true,
    plugins: [
      'karma-babel-preprocessor',
      'karma-commonjs',
      'karma-chrome-launcher',
      'karma-jasmine',
      'karma-jasmine-ajax'
    ],
    browsers: ['Chrome'],
    files: ['test/indexeddb_mock.js', 'src/**/*.js', 'test/unit/*_spec.js'],
    preprocessors: {
      'src/**/*.js': ['babel', 'commonjs'],
      'test/**/*.js': ['babel', 'commonjs']
    },
    babelPreprocessor: {
      options: {
        presets: ['es2015']
      },
      sourceFileName: function(file) {
        return file.originalPath;
      }
    }
  });
};
