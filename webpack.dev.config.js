const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: './src/index.js',
  devtool: 'source-map',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'syncClient.js',
    libraryTarget: 'commonjs2',
    library: 'syncClient.js',
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
  performance: {
    hints: false,
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': { NODE_ENV: JSON.stringify('development') },
    }),
  ],
  resolve: {
    extensions: ['.webpack-loader.js', '.web-loader.js', '.loader.js', '.js'],
    modules: [
      path.resolve(__dirname, 'node_modules'),
    ],
  },
};
