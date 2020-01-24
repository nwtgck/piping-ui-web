const path = require('path');

module.exports = {
  target: 'webworker',
  output: {
    filename: 'sw.js',
    path: path.resolve(__dirname, 'dist')
  },
};
