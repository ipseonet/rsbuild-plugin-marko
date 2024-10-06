// node_modules/tsup/assets/esm_shims.js
import { fileURLToPath } from "url";
import path from "path";
var getFilename = () => fileURLToPath(import.meta.url);
var getDirname = () => path.dirname(getFilename());
var __dirname = /* @__PURE__ */ getDirname();

// tools/MarkoRspackPlugin.ts
import { join } from "node:path";
import { Compilation } from "@rspack/core";
import { sources } from "@rspack/core";

// helpers/module-name.ts
import { createHash } from "node:crypto";
import path2 from "node:path";
var CWD = process.cwd();
function module_name_default(filename) {
  const lastSepIndex = filename.lastIndexOf(path2.sep);
  let name = filename.slice(
    lastSepIndex + 1,
    filename.indexOf(".", lastSepIndex)
  );
  if (name === "index" || name === "template") {
    name = filename.slice(
      filename.lastIndexOf(path2.sep, lastSepIndex - 1) + 1,
      lastSepIndex
    );
  }
  return `${name}_${createHash("MD5").update(path2.relative(CWD, filename)).digest("base64").replace(/[/+]/g, "-").slice(0, 4)}`;
}

// tools/MarkoRspackPlugin.ts
var MarkoRspackPlugin = class {
  options;
  serverCompiler = null;
  browserCompilers = [];
  isSSR;
  clientEntries = {};
  clientAssets = {};
  rsbuildApi;
  constructor(options = {}) {
    this.rsbuildApi = {};
    this.options = {
      ...options,
      markoCompileCache: /* @__PURE__ */ new Map(),
      markoVirtualSources: /* @__PURE__ */ new Map()
    };
    if (this.options.runtimeId) {
      this.options.runtimeId = this.normalizeRuntimeId(this.options.runtimeId);
    }
    this.isSSR = options.isSSR ?? false;
  }
  apply(compiler) {
    const isServerCompiler = compiler.options.target === "node";
    if (isServerCompiler) {
      this.serverCompiler = compiler;
      this.applyServer(compiler);
    } else {
      this.browserCompilers.push(compiler);
      this.applyBrowser(compiler);
    }
    this.setupRules(compiler);
    if (this.isSSR) {
      this.setupSSR(compiler, isServerCompiler);
    }
    compiler.options.entry = this.getEntryPoints(compiler);
  }
  setup(api) {
    this.rsbuildApi = api;
  }
  getEntryPoints(compiler) {
    const rsbuildConfig = this.rsbuildApi.getRsbuildConfig();
    const environments = rsbuildConfig.environments || {};
    const source = rsbuildConfig.source || {};
    if (environments.node && environments.web) {
      if (compiler.options.target === "node") {
        return environments.node.source.entry || {};
      } else {
        return environments.web.source.entry || {};
      }
    } else if (environments.node) {
      return environments.node.source.entry || {};
    } else if (environments.web) {
      return environments.web.source.entry || {};
    } else {
      return source.entry || {};
    }
  }
  setupRules(compiler) {
    const { isBrowser } = this.options;
    compiler.options.module.rules.push(
      {
        test: /\.marko$/,
        type: "javascript/auto",
        use: [
          {
            loader: join(__dirname, "../node_modules", "@marko/webpack/loader"),
            options: {
              babelConfig: {
                presets: [
                  [
                    "@babel/preset-env",
                    {
                      targets: isBrowser ? "defaults" : { node: "current" }
                    }
                  ]
                ],
                plugins: [
                  [
                    "@babel/plugin-transform-runtime",
                    {
                      regenerator: true
                    }
                  ]
                ]
              },
              virtualFiles: true,
              debug: true,
              compiler: {
                debug: true
              }
            }
          }
        ]
      },
      {
        test: /\.(jpg|jpeg|gif|png|svg)$/,
        type: "asset"
      }
    );
  }
  setupSSR(compiler, isServerCompiler) {
    if (isServerCompiler) {
      this.applyServer(compiler);
    } else {
      this.applyBrowser(compiler);
    }
  }
  applyServer(compiler) {
    compiler.markoEntriesPending = this.createDeferredPromise();
    this.serverCompiler = compiler;
    compiler.hooks.thisCompilation.tap(
      "MarkoRspackServer",
      (compilation) => {
        if (!this.options.runtimeId && compilation.outputOptions.uniqueName) {
          this.options.runtimeId = this.normalizeRuntimeId(
            compilation.outputOptions.uniqueName
          );
        }
        compilation.hooks.finishModules.tap(
          "MarkoRspackServer:finishModules",
          (modules) => {
            let hasChangedEntries = false;
            const removedEntryIds = new Set(Object.keys(this.clientEntries));
            for (const mod of modules) {
              const resource = mod.resource;
              if (resource?.endsWith(".marko?server-entry")) {
                const filename = resource.replace(/\?server-entry$/, "");
                const entryTemplateId = module_name_default(filename);
                if (!removedEntryIds.delete(entryTemplateId)) {
                  hasChangedEntries = true;
                  this.clientEntries[entryTemplateId] = `${filename}?browser-entry`;
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
          }
        );
        compilation.hooks.processAssets.tapPromise(
          {
            name: "MarkoRspackServer:processAssets",
            stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
          },
          async () => {
            await Promise.all(
              this.browserCompilers.map((it) => it.markoAssetsPending)
            );
            const clientAssets = this.sortKeys(this.clientAssets);
            for (const chunk of compilation.chunks) {
              if (!chunk.canBeInitial()) {
                continue;
              }
              for (const file of chunk.files) {
                compilation.updateAsset(file, (old) => {
                  const placeholder = "MARKO_MANIFEST_PLACEHOLDER";
                  const placeholderPosition = old.source().toString().indexOf(placeholder);
                  if (placeholderPosition > -1) {
                    const hasMultipleBuilds = this.browserCompilers.length > 1;
                    const defaultBuild = this.browserCompilers.length > 0 && this.browserCompilers[0].name ? clientAssets[this.browserCompilers[0].name] || {} : {};
                    const content = hasMultipleBuilds ? `{
            getAssets(entry, buildName) {
              const buildAssets = this.builds[buildName];
              if (!buildAssets) {
                throw new Error("Unable to load assets for build with a '$global.buildName' of '" + buildName + "'.");
              }
              return buildAssets[entry] || {};
            },
            builds: ${JSON.stringify(clientAssets)}
          }` : `{
            getAssets(entry) {
              return this.build[entry] || {};
            },
            build: ${JSON.stringify(defaultBuild)}
          }`;
                    const newSource = new sources.ReplaceSource(old);
                    newSource.replace(
                      placeholderPosition,
                      placeholderPosition + placeholder.length - 1,
                      content
                    );
                    return newSource;
                  }
                  return old;
                });
              }
            }
            this.serverCompiler.markoEntriesPending.resolve();
          }
        );
      }
    );
  }
  applyBrowser(compiler) {
    const compilerName = compiler.options.name || "default";
    const entryOption = compiler.options.entry;
    this.browserCompilers.push(compiler);
    compiler.options.entry = async () => {
      if (!this.serverCompiler) {
        throw new Error("Server compiler not initialized");
      }
      await this.serverCompiler.markoEntriesPending;
      const normalizedEntries = {};
      for (const key in this.clientEntries) {
        normalizedEntries[key] = {
          import: [this.clientEntries[key]]
        };
      }
      if (typeof entryOption === "function") {
        const currentEntry = await entryOption();
        return { ...currentEntry, ...normalizedEntries };
      }
      if (typeof entryOption === "object" && !Array.isArray(entryOption)) {
        return { ...entryOption, ...normalizedEntries };
      }
      return normalizedEntries;
    };
    compiler.hooks.make.tap(
      "MarkoRspackBrowser",
      (compilation) => {
        const pendingAssets = this.createDeferredPromise();
        compiler.markoAssetsPending = pendingAssets;
        compilation.hooks.afterProcessAssets.tap(
          "MarkoRspackBrowser:afterProcessAssets",
          () => {
            for (const [entryName, entrypoint] of compilation.entrypoints) {
              const assetsByType = {};
              for (const chunk of entrypoint.chunks) {
                for (const file of chunk.files) {
                  const asset = compilation.getAsset(file);
                  if (asset) {
                    const source = asset.source;
                    if (source instanceof sources.RawSource && source.buffer().length === 0) {
                      compilation.deleteAsset(file);
                      continue;
                    }
                    const ext = file.split(".").pop() || "";
                    const type = assetsByType[ext] = assetsByType[ext] || [];
                    type.push(file);
                  }
                }
              }
              const buildAssets = this.clientAssets[compilerName] = this.clientAssets[compilerName] || {};
              buildAssets[entryName] = assetsByType;
            }
            if (this.serverCompiler && this.serverCompiler.markoAssetsRead) {
              this.serverCompiler.watching?.invalidate();
            }
            pendingAssets.resolve();
          }
        );
      }
    );
  }
  normalizeRuntimeId(id) {
    return id.replace(/[^a-zA-Z0-9_]/g, "_");
  }
  createDeferredPromise() {
    let resolve;
    const promise = new Promise((r) => {
      resolve = r;
    });
    promise.resolve = resolve;
    return promise;
  }
  sortKeys(obj) {
    if (typeof obj !== "object" || obj === null) {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(this.sortKeys.bind(this));
    }
    return Object.keys(obj).sort().reduce((result, key) => {
      result[key] = this.sortKeys(obj[key]);
      return result;
    }, {});
  }
};

// src/index.ts
var PLUGIN_MARKO_NAME = "rsbuild:marko";
var pluginMarko = (options = {}) => {
  const markoRspackPlugin = new MarkoRspackPlugin(options);
  return {
    name: PLUGIN_MARKO_NAME,
    setup: (api) => {
      markoRspackPlugin.setup(api);
      api.modifyRspackConfig((config, { target }) => {
        config.plugins = config.plugins || [];
        if (target === "node") {
          config.plugins.push({
            name: "MarkoRspackServerPlugin",
            // @ts-ignore
            apply(compiler) {
              markoRspackPlugin.apply(compiler);
            }
          });
        } else {
          config.plugins.push({
            name: "MarkoRspackBrowserPlugin",
            // @ts-ignore
            apply(compiler) {
              markoRspackPlugin.apply(compiler);
            }
          });
        }
        return config;
      });
      console.log("Marko plugin initialized.");
    }
  };
};
export {
  PLUGIN_MARKO_NAME,
  pluginMarko
};
