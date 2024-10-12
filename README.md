**# rsbuild-plugin-marko (beta)

An Rsbuild plugin to provide support for the Marko template engine.  
The @marko/webpack/plugin did work with Rsbuild because of the specific requirements Rsbuild has for plugins and left the use of .server or .browser with the webpack plugin as undefined.\
This plugin is build using Rspack and incorporates the @marko/webpack/loader. Other built-in functions include babel and automatically using the plugin for server/browser so it only has to be included once. There is functionality for SSR and the plugin loads both server and browser versions of the plugin.

<p>
  <a href="https://npmjs.com/package/rsbuild-plugin-example">
   <img src="https://img.shields.io/npm/v/rsbuild-plugin-example?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" />
  </a>
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="license" />
  <a href="https://npmcharts.com/compare/rsbuild-plugin-example?minimal=true"><img src="https://img.shields.io/npm/dm/rsbuild-plugin-example.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="downloads" /></a>
</p>

## Usage

Install Dependencies:
```
npm install -D
@babel/plugin-transform-runtime
@babel/preset-env
@marko/webpack
@rsbuild/core
```
Install:

```
npm add rsbuild-plugin-marko -D
```

## MarkoPluginOptions
The runtimeID is handled automatically, and the isBrowser is more so courtesy and peace of mind. It is also handled automatically. isSSR removed for both plugins loading when environments are set.
```
MarkoPluginOptions {
  runtimeId?: string;
  isBrowser?: boolean;
}
```

Add plugin to your `rsbuild.config.ts`:

```ts
// rsbuild.config.ts
import { defineConfig } from '@rsbuild/core';
import { pluginMarko } from 'rsbuild-plugin-marko';

export default defineConfig({
  plugins: [
    pluginMarko(),
  ],
});

```

Configurations typically needed in Webpack are baked in:
```
{
        test: /\.marko$/,
        type: 'javascript/auto',
        use: [
          {
            loader: join(__dirname, '../node_modules', '@marko/webpack/loader'),
            options: {
              babelConfig: {
                presets: [
                  [
                    '@babel/preset-env',
                    {
                      targets: isBrowser ? 'defaults' : { node: 'current' },
                    },
                  ],
                ],
                plugins: [
                  [
                    '@babel/plugin-transform-runtime',
                    {
                      regenerator: true,
                    },
                  ],
                ],
              },
              virtualFiles: true,
              debug: true,
              compiler: {
                debug: true,
              },
            },
          },
        ],
      },
      {
        test: /\.(jpg|jpeg|gif|png|svg)$/,
        type: 'asset',
      },
```
If it turns out to be the case that leaving these options out for users to add different one, please leave input as an issue.

## Using Marko Templates

After the plugin registration is completed, Rsbuild will automatically parse template files with the .marko extension and compile them using the Marko template engine.

Example: first create a src/index.marko file, and include that file as your source.entry or import your marko components into your source.entry page:
(the template marko file can be in any directory as long as source.entry properly imports them. The html.template is typically used for SSR.)

* Note: Only tested success with .js/.mjs/.ts as source.entry files and the use of .marko as components only.

### WEB ONLY (Standard)
```
import { defineConfig } from '@rsbuild/core';
import { pluginMarko } from '../src';

export default defineConfig({
  plugins: [
    pluginMarko(),
  ],
  source: {
     entry: {
       index: {
         import: ['./src/index.mjs']
       }
     }
   }
}
```
The important thing here is the required source.entry format. There can be multiple entries included alongside index, but each has to have an import: ['/path/to/entry']

Suppose there is this code in button.marko:
```
class {
    sayHi() {
        alert("Hi! Your Marko Button works!");
    }
}

<button on-click("sayHi") id="first">Click me!</button>
```

After using the Marko plugin, use the Marko syntax in the index.marko template and reference it as follows:

```
<!-- Input -->
import Button from './button.marko';
<h1 id="content">Hello, Marko!</h1>
  <div>Success! Marko loaded! Click the button below:</div>
  <Button label="Click me!" />

<!-- Output -->
Hello Marko!
Success! Marko loaded! Click the button below:
[Click me!]
```
### Playground is set up for testing purposes:
```
cd playground
npm install
npm run dev
```

### Jesus Christ is Lord, Hallelujah!
#### License

[MIT](./LICENSE).**
