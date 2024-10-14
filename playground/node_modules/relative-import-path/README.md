<h1 align="center">
  <!-- Logo -->
  <br/>
  relative-import-path
	<br/>

  <!-- Format -->
  <a href="https://github.com/prettier/prettier">
    <img src="https://img.shields.io/badge/styled_with-prettier-ff69b4.svg" alt="Styled with prettier"/>
  </a>
  <!-- CI -->
  <a href="https://github.com/marko-js/relative-import-path/actions/workflows/ci.yml">
    <img src="https://github.com/marko-js/relative-import-path/actions/workflows/ci.yml/badge.svg" alt="Build status"/>
  </a>
  <!-- Coverage -->
  <a href="https://codecov.io/gh/marko-js/relative-import-path">
    <img src="https://codecov.io/gh/marko-js/relative-import-path/branch/main/graph/badge.svg?token=lKuTHVY3Ks" alt="Code Coverage"/>
  </a>
  <!-- NPM Version -->
  <a href="https://npmjs.org/package/relative-import-path">
    <img src="https://img.shields.io/npm/v/relative-import-path.svg" alt="NPM version"/>
  </a>
  <!-- Downloads -->
  <a href="https://npmjs.org/package/relative-import-path">
    <img src="https://img.shields.io/npm/dm/relative-import-path.svg" alt="Downloads"/>
  </a>
</h1>

Like path.relative, but for generating short require'able paths.

- Removes unnecessary `node_modules` from resolved relative paths.
- Automatically converts windows style paths to POSIX.

# Installation

```console
npm install relative-import-path
```

# API

```ts
/**
 * Given two absolute file paths, resolves a short require'able relative path.
 */
function resolveRelativePath(from: string, to: string): string;
```

# Examples

```javascript
import { relativeImportPath } from "relative-import-path";

relativeImportPath("/a/b", "/c/d"); // /c/d
relativeImportPath("/a/a", "/a/b"); // ./b
relativeImportPath("/a/a/a", "/a/b/a"); // ../b/a
relativeImportPath("/a/node_modules/a/a", "/a/node_modules/b/a"); // b/a
relativeImportPath("/a/node_modules/a/a", "/a/node_modules/a/b"); // ./b
relativeImportPath("/a/a", "/node_modules/b"); // b
relativeImportPath("/a/a", "/a/node_modules/b"); // b
relativeImportPath("/a/b/c", "/a/node_modules/b"); // b
relativeImportPath("/a/a", "/b/node_modules/b"); // /b/node_modules/b
relativeImportPath("/a/b/c", "/b/node_modules/b"); // /b/node_modules/b
relativeImportPath("/a/a", "/a/b/node_modules/b"); // ./b/node_modules/b
relativeImportPath("/a/node_modules/@a/a/a", "/a/node_modules/@a/b/a"); // @a/b/a
relativeImportPath("/a/node_modules/@a/a/a", "/a/node_modules/@a/a/b"); // ./b
```

# Code of Conduct

This project adheres to the [eBay Code of Conduct](./.github/CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.
