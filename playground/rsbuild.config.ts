import { defineConfig } from '@rsbuild/core';
import { pluginMarko } from '../src';

export default defineConfig({
  plugins: [
    pluginMarko({
      isSSR: false,
    }),
  ],
  source: {
    entry: {
      index: {
        import: ['./src/index.mjs']
      }
    }
  }
});


