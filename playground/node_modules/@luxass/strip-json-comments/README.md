# strip-json-comments

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]

A fork of [sindresorhus/strip-json-comments](https://github.com/sindresorhus/strip-json-comments) but with support for CJS & ESM. And some small modifications.

## 📦 Installation

```sh
npm install @luxass/strip-json-comments
```

## 📚 Usage

There is a small difference to the original package. You can see it [here](#differences-to-sindresorhusstrip-json-comments).

```ts
import { strip } from "@luxass/strip-json-comments";

const json = `{
  // this is a comment
  "foo": /* this is also a comment */ "bar"
}`;

JSON.parse(strip(json)); // { foo: "bar" }
```

## Differences to [sindresorhus/strip-json-comments](https://github.com/sindresorhus/strip-json-comments)

The main differences are:
- This package is published as ESM & CJS
- And the `default export` is moved to a `named export` called `strip`

```diff
- import stripJsonComments from "strip-json-comments";
+ import { strip } from "@luxass/strip-json-comments";
```

## 📄 License

Published under [MIT License](./LICENSE).

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@luxass/strip-json-comments?style=flat&colorA=18181B&colorB=4169E1
[npm-version-href]: https://npmjs.com/package/@luxass/strip-json-comments
[npm-downloads-src]: https://img.shields.io/npm/dm/@luxass/strip-json-comments?style=flat&colorA=18181B&colorB=4169E1
[npm-downloads-href]: https://npmjs.com/package/@luxass/strip-json-comments
