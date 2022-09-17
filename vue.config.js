const webpack = require('webpack');

module.exports = {
  // (from: https://cli.vuejs.org/config/#publicpath)
  publicPath: "./",
  // (base: https://stackoverflow.com/q/56127998/2885946)
  css: {
    sourceMap: true
  },
  configureWebpack: {
    plugins: [
      new webpack.ProvidePlugin({
        process: 'process',
        Buffer: ['buffer', 'Buffer'],
      }),
      // (base: https://medium.com/curofy-engineering/a-guide-to-inject-variable-into-your-code-using-webpack-36c49fcc1dcd)
      new webpack.DefinePlugin({
        PIPING_SERVER_URLS: process.env.PIPING_SERVER_URLS || JSON.stringify([
          "https://ppng.io",
          "https://piping.nwtgck.repl.co",
          "https://ppng.herokuapp.com",
          "https://piping.glitch.me",
          "https://piping-47q675ro2guv.runkit.sh"
        ]),
      })
    ],
    resolve: {
      fallback: {
        process: require.resolve("process/browser"),
        buffer: require.resolve("buffer/"),
      },
    },
  },
  // (from: https://github.com/vuetifyjs/vuetify/issues/8279#issuecomment-517900297)
  transpileDependencies: ['vuetify'],
};
