import { defineConfig } from '@rsbuild/core';
import { pluginMarko } from '../src';

export default defineConfig({
  plugins: [
      pluginMarko({})
  ],
  tools: {
    rspack: {
      externals: ['express'],
    },
  },
  environments: {
    node: {
      output: {
        target: 'node',
      },
      source: {
        entry:{
          index: {
            import:['./src/server.mjs']
          }
        }
      }
    },
    web: {

      source: {
        entry:{
          index: {
            import:['./src/index.mjs']
          }
        }
      }
    }
  }
//For use of Single-environment without environments.node
  // source: {
  //   entry:{
  //     index: {
  //       import: ['./src/index.mjs'],
  //     }
  //   }
  // },
  // html: {
  //   template: './src/index.marko',
  // },
});


