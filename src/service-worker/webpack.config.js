const path = require('path');

module.exports = {
  target: 'webworker',
  output: {
    filename: 'sw.js',
    path: path.resolve(__dirname, 'dist', 'src')
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
};
