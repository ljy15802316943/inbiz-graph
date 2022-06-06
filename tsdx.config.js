const postcss = require('rollup-plugin-postcss');
const cssnano = require('cssnano');

module.exports = {
  rollup(config, options) {
    config.plugins.push(
      postcss({
        use: ['sass', 'stylus', 'less'],
        extract : true,
        less: true,
        extensions: ['.css', '.sss', '.pcss', '.less'],
        plugins: [
          cssnano({
            preset: 'default',
          }),
        ],
        inject: true,
        // only write out CSS for the first bundle (avoids pointless extra files):
        extract: !!options.writeMeta,
      })
    );
    return config;
  },
};