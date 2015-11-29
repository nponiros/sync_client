const path = require('path');
module.exports = {
  entry: './src/sync_client.js',
  devtool: 'source-map',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'syncClient.js',
    libraryTarget: 'commonjs'
  },
  module: {
    loaders: [
      {
        test: path.join(__dirname, 'src'),
        loader: 'babel?presets[]=es2015'
      }
    ]
  }
};
