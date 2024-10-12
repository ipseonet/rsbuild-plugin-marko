import { RsbuildPluginAPI} from '@rsbuild/core';
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

      // let pluginLoaded = false;
      let serverApplied = false;
      let browserApplied = false;

      api.modifyRspackConfig((config, { target }) => {
          config.plugins = config.plugins || [];

          const targets = ['node', 'web'];

        if (target) {
          // If a specific target is set
          if (target === 'node' && !serverApplied) {
            console.log('Applying MarkoRspackServerPlugin for node target');
            // @ts-ignore
              config.plugins.push({
                name: 'MarkoRspackServerPlugin',
                // @ts-ignore
                apply(compiler) {
                  markoRspackPlugin.serverApply(compiler);
                },
              });
          } else if (target === 'web' && !browserApplied) {
            console.log('Applying MarkoRspackBrowserPlugin for web target');
            // @ts-ignore
              config.plugins.push({
                name: 'MarkoRspackBrowserPlugin',
                // @ts-ignore
                apply(compiler) {
                  markoRspackPlugin.browserApply(compiler);
                },
              });
            browserApplied = true;
          }
        } else {
          // If no specific target is set, apply for both
          for (const currentTarget of targets) {
            if (currentTarget === 'node' && !serverApplied) {
              console.log('Applying MarkoRspackServerPlugin for node target');
              config.plugins.push({
                name: 'MarkoRspackServerPlugin',
                // @ts-ignore
                apply(compiler) {
                  markoRspackPlugin.serverApply(compiler);
                },
              });
            } else if (currentTarget === 'web' && !browserApplied) {
              console.log('Applying MarkoRspackBrowserPlugin for web target');
              config.plugins.push({
                name: 'MarkoRspackBrowserPlugin',
                // @ts-ignore
                apply(compiler) {
                  markoRspackPlugin.browserApply(compiler);
                },
              });
              browserApplied = true;
            }
          }
        }

        return config;
      });
      console.log('Marko plugin initialized.');
    },
  };
};

export { PLUGIN_MARKO_NAME, pluginMarko };
