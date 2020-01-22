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
      // (base: https://medium.com/curofy-engineering/a-guide-to-inject-variable-into-your-code-using-webpack-36c49fcc1dcd)
      new webpack.DefinePlugin({
        PIPING_SERVER_URLS: process.env.PIPING_SERVER_URLS || JSON.stringify([
          "https://ppng.ml",
          "https://piping.arukascloud.io",
          "https://ppng.herokuapp.com"
        ]),
      })
    ],
    module: {
      rules: [
        // (base: https://vuetifyjs.com/en/customization/sass-variables#variable-api)
        // SASS has different line endings than SCSS
        // and cannot use semicolons in the markup
        {
          test: /\.scss$/,
          use: [
            'vue-style-loader',
            'css-loader',
            {
              loader: 'sass-loader',
              // Requires sass-loader@^7.0.0
              options: {
                // This is the path to your variables
                data: "@import '@/styles/variables.scss'"
              },
            },
          ],
        },
      ]
    },
  },
  // (from: https://github.com/vuetifyjs/vuetify/issues/8279#issuecomment-517900297)
  transpileDependencies: ['vuetify'],
  // (from: https://medium.com/@dougallrich/give-users-control-over-app-updates-in-vue-cli-3-pwas-20453aedc1f2)
  pwa: {
    workboxPluginMode: 'InjectManifest',
    workboxOptions: {
      swSrc: './src/sw.js',
      swDest: 'service-worker.js',
      importWorkboxFrom: 'local',
      exclude: [/\.map$/, '_redirects'],
    },
  }
};
