import { join } from 'node:path';
import {
  type Compiler,
  type Configuration,
} from '@rspack/core';
import { Compilation } from '@rspack/core'
import {sources} from '@rspack/core';
import moduleName from '../helpers/module-name';
import {RsbuildPlugin} from "@rsbuild/core";

interface ResolvablePromise<T> extends Promise<T> {
  resolve(value: T): void;
}

declare module '@rspack/core' {
  interface Compiler {
    // @ts-ignore
    watchMode?: boolean;
    watching?: Compiler['watching'];
    markoPluginOptions?: MarkoRspackPlugin['options'] & {
      markoCompileCache?: Map<unknown, unknown>;
      markoVirtualSources?: Map<string, { code: string | Buffer; map?: any }>;
    };
    markoAssetsPending?: ResolvablePromise<void>;
    markoAssetsRead?: boolean;
    markoEntriesPending?: ResolvablePromise<void>;
    markoEntriesRead?: boolean;
  }
}

export interface MarkoPluginOptions {
  isBrowser?: boolean;
  runtimeId?: string;
}

export default class MarkoRspackPlugin {
  private options: MarkoPluginOptions & {
    markoCompileCache: Map<unknown, unknown>;
    markoVirtualSources: Map<string, { code: string | Buffer; map?: any }>;
  };
  private serverCompiler: Compiler | null = null;
  private browserCompilers: Compiler[] = [];
  private clientEntries: { [x: string]: string } = {};
  private clientAssets: {
    [buildName: string]: {
      [entryName: string]: { [assetType: string]: string[] };
    };
  } = {};
  private rsbuildApi: RsbuildPlugin['setup'] extends (api: infer T) => any ? T : never;

  constructor(options: MarkoPluginOptions = {}) {
    this.rsbuildApi = {} as any;
    this.options = {
      ...options,
      markoCompileCache: new Map(),
      markoVirtualSources: new Map(),
    };

    if (this.options.runtimeId) {
      this.options.runtimeId = this.normalizeRuntimeId(this.options.runtimeId);
    }
  }

  browserApply(compiler: Compiler) {
    this.browserCompilers.push(compiler);
    this.applyBrowser(compiler);
    this.setupRules(compiler);
    // Ensure entry points are properly set
    // @ts-ignore
    compiler.options.entry = this.getEntryPoints(compiler);

  }
  serverApply(compiler: Compiler) {
    this.serverCompiler = compiler;
    this.applyServer(compiler);
    this.setupRules(compiler);
    // Ensure entry points are properly set
    // @ts-ignore
    compiler.options.entry = this.getEntryPoints(compiler);
  }


    setup(api: RsbuildPlugin['setup'] extends (api: infer T) => any ? T : never) {
        this.rsbuildApi = api;
    }

    private getEntryPoints(compiler: Compiler): Configuration['entry'] {
        const rsbuildConfig = this.rsbuildApi.getRsbuildConfig();
        const environments = rsbuildConfig.environments || {};
        const source = rsbuildConfig.source || {};

        if (environments.node && environments.web) {
            // Multi-environment (SSR) scenario
            if (compiler.options.target === 'node') {
                // @ts-ignore
              return environments.node.source.entry || {};
            } else {
                // @ts-ignore
              return environments.web.source.entry || {};
            }
        } else if (environments.node) {
            // Node-only environment
            // @ts-ignore
          return environments.node.source.entry || {};
        } else if (environments.web) {
            // Web-only environment
            // @ts-ignore
          return environments.web.source.entry || {};
        } else {
            // Single-target scenario
            return source.entry || {};
        }
    }

  private setupRules(compiler: Compiler) {
    const {isBrowser} = this.options;


    compiler.options.module.rules.push(
        {
          test: /\.marko$/,
          type: 'javascript/auto',
          use: [
            {
              loader: join(__dirname, '../node_modules', '@marko/webpack/loader'),
              options: {
                compiler: join(__dirname, '../node_modules', '@marko/compiler'),
                hydrateIncludeImports: /\.\w+(?<![cm]?js|json|wasm|marko)$/,
                babelConfig: {
                  presets: [
                    [
                      '@babel/preset-env',
                      // "babel-plugin-macros",
                      {
                        targets: isBrowser ? 'defaults' : {node: 'current'},
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
                  comments: false,
                  compact: false,
                  babelrc: false,
                  configFile: false,
                  browserslistConfigFile: false
                },
                virtualFiles: true,
              },
            },
          ],
        },
        {
          test: /\.(jpg|jpeg|gif|png|svg|)$/,
          type: 'asset',
        },
    )
  }


  private applyServer(compiler: Compiler) {
    (compiler as any).markoEntriesPending = this.createDeferredPromise<void>();
    this.serverCompiler = compiler;

    compiler.hooks.thisCompilation.tap(
      'MarkoRspackServer',
      (compilation: Compilation) => {
        if (!this.options.runtimeId && compilation.outputOptions.uniqueName) {
          this.options.runtimeId = this.normalizeRuntimeId(
            compilation.outputOptions.uniqueName,
          );
        }

        compilation.hooks.finishModules.tap(
          'MarkoRspackServer:finishModules',
          (modules) => {
            let hasChangedEntries = false;
            const removedEntryIds = new Set(Object.keys(this.clientEntries));

            for (const mod of modules) {
              const resource = (mod as any).resource;
              if (resource?.endsWith('.marko?server-entry')) {
                const filename = resource.replace(/\?server-entry$/, '');
                const entryTemplateId = moduleName(filename);

                if (!removedEntryIds.delete(entryTemplateId)) {
                  hasChangedEntries = true;
                  this.clientEntries[entryTemplateId] =
                    `${filename}?browser-entry`;
                }
              }
            }

            for (const removedEntryId of removedEntryIds) {
              hasChangedEntries = true;
              delete this.clientEntries[removedEntryId];
              for (const compilerName in this.clientAssets) {
                delete this.clientAssets[compilerName][removedEntryId];
              }
            }

            if (hasChangedEntries) {
              for (const browserCompiler of this.browserCompilers) {
                browserCompiler.watching?.invalidate();
              }
            }
          },
        );

        compilation.hooks.processAssets.tapPromise(
          {
            name: 'MarkoRspackServer:processAssets',
            stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
          },
          async () => {
            await Promise.all(
              this.browserCompilers.map((it) => (it as any).markoAssetsPending),
            );

            const clientAssets = this.sortKeys(this.clientAssets);

            for (const chunk of compilation.chunks) {
              if (!chunk.canBeInitial()) {
                continue;
              }

              for (const file of chunk.files) {
                compilation.updateAsset(file, (old: sources.Source) => {
                  const placeholder = 'MARKO_MANIFEST_PLACEHOLDER';
                  const placeholderPosition = old
                    .source()
                    .toString()
                    .indexOf(placeholder);
                  if (placeholderPosition > -1) {
                    const hasMultipleBuilds = this.browserCompilers.length > 1;
                    const defaultBuild =
                      this.browserCompilers.length > 0 &&
                      this.browserCompilers[0].name
                        ? clientAssets[this.browserCompilers[0].name] || {}
                        : {};

                    const content = hasMultipleBuilds
                      ? `{
            getAssets(entry, buildName) {
              const buildAssets = this.builds[buildName];
              if (!buildAssets) {
                throw new Error("Unable to load assets for build with a '$global.buildName' of '" + buildName + "'.");
              }
              return buildAssets[entry] || {};
            },
            builds: ${JSON.stringify(clientAssets)}
          }`
                      : `{
            getAssets(entry) {
              return this.build[entry] || {};
            },
            build: ${JSON.stringify(defaultBuild)}
          }`;

                    const newSource = new sources.ReplaceSource(old);
                    newSource.replace(
                      placeholderPosition,
                      placeholderPosition + placeholder.length - 1,
                      content,
                    );

                    return newSource;
                  }

                  return old;
                });
              }
            }
            (this.serverCompiler as any).markoEntriesPending.resolve();
          },
        );
      },
    );
  }

  private applyBrowser(compiler: Compiler) {
    const compilerName = compiler.options.name || 'default';
    const entryOption = compiler.options.entry;
    this.browserCompilers.push(compiler);

    compiler.options.entry = async () => {
      if (!this.serverCompiler) {
        throw new Error('Server compiler not initialized');
      }
      await (this.serverCompiler as any).markoEntriesPending;

      const normalizedEntries: any = {};
      for (const key in this.clientEntries) {
        normalizedEntries[key] = {
          import: [this.clientEntries[key]],
        };
      }

      if (typeof entryOption === 'function') {
        const currentEntry = await entryOption();
        return { ...currentEntry, ...normalizedEntries };
      }
      if (typeof entryOption === 'object' && !Array.isArray(entryOption)) {
        return { ...entryOption, ...normalizedEntries };
      }
      return normalizedEntries;
    };

    compiler.hooks.make.tap(
      'MarkoRspackBrowser',
      (compilation: Compilation) => {
        const pendingAssets = this.createDeferredPromise<void>();
        (compiler as any).markoAssetsPending = pendingAssets;

        compilation.hooks.afterProcessAssets.tap(
          'MarkoRspackBrowser:afterProcessAssets',
          () => {
            for (const [entryName, entrypoint] of compilation.entrypoints) {
              const assetsByType: { [x: string]: string[] } = {};

              for (const chunk of entrypoint.chunks) {
                for (const file of chunk.files) {
                  const asset = compilation.getAsset(file);
                  if (asset) {
                    const source = asset.source;
                    if (
                      source instanceof sources.RawSource &&
                      source.buffer().length === 0
                    ) {
                      compilation.deleteAsset(file);
                      continue;
                    }
                    const ext = file.split('.').pop() || '';
                    const type = (assetsByType[ext] = assetsByType[ext] || []);
                    type.push(file);
                  }
                }
              }

              const buildAssets = (this.clientAssets[compilerName] =
                this.clientAssets[compilerName] || {});
              buildAssets[entryName] = assetsByType;
            }
            // console.log('Client assets:', this.clientAssets);

            if (
              this.serverCompiler &&
              (this.serverCompiler as any).markoAssetsRead
            ) {
              this.serverCompiler.watching?.invalidate();
            }

            pendingAssets.resolve();
          },
        );
      },
    );
  }

  private normalizeRuntimeId(id: string): string {
    return id.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  private createDeferredPromise<T>(): Promise<T> & {
    resolve: (value: T) => void;
  } {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((r) => {
      resolve = r;
    }) as Promise<T> & { resolve: (value: T) => void };
    promise.resolve = resolve;
    return promise;
  }

  private sortKeys(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(this.sortKeys.bind(this));
    }
    return Object.keys(obj)
      .sort()
      .reduce((result: any, key) => {
        result[key] = this.sortKeys(obj[key]);
        return result;
      }, {});
  }
}
