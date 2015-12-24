module.exports = function(config) {
  config.set({
    basePath: '.',
    frameworks: ['jasmine', 'commonjs'],
    singleRun: true,
    captureConsole: true,
    plugins: [
      'karma-babel-preprocessor',
      'karma-commonjs',
      'karma-chrome-launcher',
      'karma-jasmine'
    ],
    browsers: ['Chrome'],
    files: ['dist/syncClient.min.js', 'test/integration/*_spec.js'],
    preprocessors: {
      'dist/syncClient.min.js': ['commonjs'],
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
