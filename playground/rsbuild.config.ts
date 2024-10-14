import { defineConfig } from '@rsbuild/core';
import { pluginMarko } from 'rsbuild-plugin-marko';

export default defineConfig({
  plugins: [
      pluginMarko({})
  ],
  tools: {
    rspack: {
      //important for compile to not use these. Compile warnings appear if these are not excluded from compile.
      externals: ['express', 'fsevents', 'yaml', 'tsx/cjs/api', '@rsbuild/core'],
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


