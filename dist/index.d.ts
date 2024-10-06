import { RsbuildPlugin, RsbuildPluginAPI } from '@rsbuild/core';
import { Compiler } from '@rspack/core';

interface ResolvablePromise<T> extends Promise<T> {
    resolve(value: T): void;
}
declare module '@rspack/core' {
    interface Compiler {
        watchMode?: boolean;
        watching?: Compiler['watching'];
        markoPluginOptions?: MarkoRspackPlugin['options'] & {
            markoCompileCache?: Map<unknown, unknown>;
            markoVirtualSources?: Map<string, {
                code: string | Buffer;
                map?: any;
            }>;
        };
        markoAssetsPending?: ResolvablePromise<void>;
        markoAssetsRead?: boolean;
        markoEntriesPending?: ResolvablePromise<void>;
        markoEntriesRead?: boolean;
    }
}
interface MarkoPluginOptions {
    isBrowser?: boolean;
    runtimeId?: string;
    isSSR?: boolean;
}
declare class MarkoRspackPlugin {
    private options;
    private serverCompiler;
    private browserCompilers;
    private isSSR;
    private clientEntries;
    private clientAssets;
    private rsbuildApi;
    constructor(options?: MarkoPluginOptions);
    apply(compiler: Compiler): void;
    setup(api: RsbuildPlugin['setup'] extends (api: infer T) => any ? T : never): void;
    private getEntryPoints;
    private setupRules;
    private setupSSR;
    private applyServer;
    private applyBrowser;
    private normalizeRuntimeId;
    private createDeferredPromise;
    private sortKeys;
}

declare const PLUGIN_MARKO_NAME = "rsbuild:marko";
declare const pluginMarko: (options?: MarkoPluginOptions) => {
    name: string;
    setup: (api: RsbuildPluginAPI) => void;
};

export { PLUGIN_MARKO_NAME, pluginMarko };
