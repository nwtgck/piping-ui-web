module.exports = {
  // (base: https://stackoverflow.com/q/56127998/2885946)
  css: {
    sourceMap: true
  },
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
