import type { RsbuildPluginAPI } from '@rsbuild/core';
import MarkoRspackPlugin, {
  type MarkoPluginOptions,
} from '../tools/MarkoRspackPlugin';

const PLUGIN_MARKO_NAME = 'rsbuild:marko';
const pluginMarko = (options: MarkoPluginOptions = {}) => {
  const markoRspackPlugin = new MarkoRspackPlugin(options);

  return {
    name: PLUGIN_MARKO_NAME,
    setup: (api: RsbuildPluginAPI) => {
      markoRspackPlugin.setup(api);

      api.modifyRspackConfig((config, { target }) => {
        config.plugins = config.plugins || [];

        if (target === 'node') {
          config.plugins.push({
            name: 'MarkoRspackServerPlugin',
            // @ts-ignore
            apply(compiler) {
              markoRspackPlugin.apply(compiler);
            },
          });
        } else {
          config.plugins.push({
            name: 'MarkoRspackBrowserPlugin',
            // @ts-ignore
            apply(compiler) {
              markoRspackPlugin.apply(compiler);
            },
          });
        }

        return config;
      });

      console.log('Marko plugin initialized.');
    },
  };
};

export { PLUGIN_MARKO_NAME, pluginMarko };
