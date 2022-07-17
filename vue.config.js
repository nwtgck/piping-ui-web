const webpack = require('webpack');
const {InjectManifest} = require('workbox-webpack-plugin');

module.exports = {
  // (from: https://cli.vuejs.org/config/#publicpath)
  publicPath: "./",
  // (base: https://stackoverflow.com/q/56127998/2885946)
  css: {
    sourceMap: true
  },
  configureWebpack: {
    plugins: [
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
  },
  // (from: https://github.com/vuetifyjs/vuetify/issues/8279#issuecomment-517900297)
  transpileDependencies: ['vuetify'],
  // (from: https://medium.com/@dougallrich/give-users-control-over-app-updates-in-vue-cli-3-pwas-20453aedc1f2)
  pwa: new InjectManifest({
    swSrc: './src/service-worker/dist/src/sw.js',
    swDest: 'service-worker.js',
    exclude: [
      /\.map$/,
      '_redirects',
      // Ignore piping-ui.auth caching because the logic can be changeable in the future
      /piping-ui-auth.*\.js/
    ],
  }),
};
