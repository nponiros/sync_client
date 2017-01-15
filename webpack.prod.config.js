const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: './src/index.js',
  devtool: 'source-map',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'sync-client.min.js',
    libraryTarget: 'commonjs2',
    library: 'sync-client.min.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          plugins: ['transform-runtime'],
          presets: [
            ['es2015', { modules: false }],
          ],
        },
      },
    ],
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
        screw_ie8: true,
        conditionals: true,
        unused: true,
        comparisons: true,
        sequences: true,
        dead_code: true,
        evaluate: true,
        if_return: true,
        join_vars: true,
      },
      output: {
        comments: false,
      },
      sourceMap: true,
    }),
    new webpack.DefinePlugin({
      'process.env': { NODE_ENV: JSON.stringify('production') },
    }),
  ],
  resolve: {
    extensions: ['.webpack-loader.js', '.web-loader.js', '.loader.js', '.js'],
    modules: [
      path.resolve(__dirname, 'node_modules'),
    ],
  },
};
