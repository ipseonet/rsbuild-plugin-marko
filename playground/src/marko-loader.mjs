
import { URL, pathToFileURL, fileURLToPath } from "url";
import * as compiler from "@marko/compiler";
import path from "node:path";
import {stringify} from "node:querystring";
import * as fs from "node:fs";


const markoExtensionRegex = /\.marko$/;
const jsExtensionRegex = /\.(js|mjs|ts)$/;

export async function resolve(specifier, context, defaultResolve) {

    let resolvedPath;
    // const parentURL = context;
    let url;
    // if (parentURL) {
    //     url = new URL(specifier, parentURL).href;
    // } else {
    url = pathToFileURL(path.resolve(process.cwd(), specifier)).href;
    // }
    if (specifier.startsWith('file:')) {
        resolvedPath = fileURLToPath(specifier);
    }

    if (markoExtensionRegex.test(specifier)) {
        const syncResult = compiler.compileFileSync(url, {
            modules: "cjs",
        });
        return {
            shortCircuit: true,
            code: syncResult.code,
            url: resolvedPath,
        }
    } else {
        // return defaultResolve(specifier, context, defaultResolve);
        const syncresult2 = compiler.compileFileSync(url, {
            modules: "cjs",
        });
        return {
            shortCircuit: true,
            code: syncresult2.code,
            url: URL,
        }
    }
}

// Call the function to see the result
resolve().then(result => {
    console.log("Resolved Result:", result);
}).catch(error => {
    console.error("Error:", error);
});


//
// export async function resolve(specifier, context, defaultResolve) {
//     if (jsExtensionRegex.test(specifier)) {
//         let resolvedPath;
//         const {parentURL = null} = context;
//         let url;
//         if (parentURL) {
//             url = new URL(specifier, parentURL).href;
//         } else {
//             url = pathToFileURL(path.resolve(process.cwd(), specifier)).href;
//         }
//         if (specifier.startsWith('file:')) {
//             resolvedPath = fileURLToPath(specifier);
//         }
//
//         // if (specifier.startsWith('file:')) {
//         //     // If specifier is already a file URL, just use it
//         //     resolvedPath = fileURLToPath(specifier);
//         // } else if (path.isAbsolute(specifier)) {
//         //     // If specifier is an absolute path, use it directly
//         //     resolvedPath = specifier;
//         // } else {
//         //     // Handle relative paths
//         //     const baseDir = context.parentURL ? path.dirname(fileURLToPath(context.parentURL)) : process.cwd();
//         //     resolvedPath = path.resolve(baseDir, specifier);
//         //
//         //     // If the file doesn't exist, try looking in the playground/src directory
//         //     if (!fs.existsSync(resolvedPath)) {
//         //         const playgroundPath = path.resolve(process.cwd(), 'playground', 'src', specifier);
//         //         if (fs.existsSync(playgroundPath)) {
//         //             resolvedPath = playgroundPath;
//         //         }
//         //     }
//         //
//         //     if (!fs.existsSync(resolvedPath)) {
//         //         throw new Error(`Unable to resolve ${specifier}`);
//         //     }
//         // }
//
//         // const url = pathToFileURL(resolvedPath).href;
//
//         if (markoExtensionRegex.test(specifier)) {
//             try {
//                 const {code, map, meta} = await compiler.compileSync(resolvedPath, {
//                     output: "dom",
//                     sourceMaps: true,
//                     modules: "cjs"
//                 });
//                 return {
//                     url,
//                     resolvedPath,
//                     format: "cjs",
//                     source: code,
//                     map,
//                     shortCircuit: true,
//                     meta: {
//                         markoMeta: meta,
//                         resolvedPath,
//                     }
//                 };
//             } catch (error) {
//                 console.error(`Error compiling Marko file ${specifier}:`, error);
//                 throw error;
//             }
//
//         }
//     }
//     return defaultResolve(specifier, context);
// }


// export async function load(url, context, defaultLoad) {
//     if (markoExtensionRegex.test(url)) {
//         const filename = fileURLToPath(url);
//         try {
//             const { code, map, meta } = await compiler.compileSync(filename);
//             return {
//                 format: "module",
//                 source: code,
//                 map,
//                 shortCircuit: true,
//                 meta: {
//                     markoMeta: meta,
//                     url,
//                     filename
//                 }
//             };
//         } catch (error) {
//             console.error(`Error compiling Marko file ${filename}:`, error);
//             return defaultLoad(url, context, defaultLoad);
//         }
//     }
//     return defaultLoad(url, context, defaultLoad);
// }

