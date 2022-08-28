const path = require('path');

module.exports = {
  target: 'webworker',
  output: {
    filename: 'service-worker.js',
    path: path.resolve(__dirname, '../../public')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: 'ts-loader',
        options: {
          configFile: 'sw-tsconfig.json',
        },
      }
    ]
  },
  optimization: {
    minimize: false
  },
};
