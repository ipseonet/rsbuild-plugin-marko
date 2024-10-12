import { defineConfig } from '@rsbuild/core';
import { pluginMarko } from '../src';

export default defineConfig({
  plugins: [
      pluginMarko({isBrowser: true})
  ],
  source: {
    entry:{
      index: {
        import: ['./src/index.mjs'],
      }
    }
  },
  // html: {
  //   template: './src/index.marko',
  // },
});


