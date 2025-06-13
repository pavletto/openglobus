[![NPM PACKAGE](https://img.shields.io/npm/v/@openglobus/og.svg?logo=npm&logoColor=fff&label=NPM+package&color=limegreen)](https://www.npmjs.com/@openglobus/og)
![BUILD](https://github.com/openglobus/openglobus/actions/workflows/push.yml/badge.svg)

# OpenGlobus

English | [简体中文](README_CN.md) | [Portuguese-BR](README_pt-BR.md)

[openglobus](https://www.openglobus.org/) is a typescript/javascript library designed to display interactive 3D maps and other geospatial data at a
scale from planet to bee.

It supports various high-resolution terrain providers, imagery layers, renders thousands of 3D objects, provides
geometry measurement tools, and more. It uses the WebGL technology, open-source and
completely free.

Openglobus main goal is to make 3D map features fast, good-looking, user-friendly and easy to implement in any
related project.

## Getting Start

### Installation

```sh
npm install @openglobus/og
```

### Fast initialization

Create your first openglobus application with [create-openglobus](https://www.npmjs.com/package/create-openglobus) template.  It support js, ts + react, etc.

Run:

```sh
npx create-openglobus
```

## React integration

Openglobus React module is available with [openglobus-react](https://github.com/openglobus/openglobus-react) package.

```sh
npm i @openglobus/openglobus-react
```

## Documentation and Examples

- [Examples](https://sandbox.openglobus.org)
- [Wiki](https://github.com/openglobus/openglobus/wiki)
- [API documentation](https://openglobus.github.io/docs/)

## Get Started to contribute

### Development

1. Clone repository.
2. Run in the repo folder:

```sh
npm install
```

### Build Library

Run

```sh
npm run build
```

Then, it will generate files at `lib/`:

- og.es.js
- og.es.js.map
- og.css
- ./res/...

### Run examples

First, it starts by watching sources and building into ./lib folder es module:

```sh
npm run dev
```

Second, runs local server, then you can browse 127.0.0.1:8080:

```sh
npm run serve
```

or

```sh
npm run dev_serve
```

Third, try an example from the sandbox:

```sh
 http://127.0.0.1:8080/sandbox/osm/osm.html
```

### Other scripts

`npm run docs` - build [api documentation](https://openglobus.github.io/docs/) into /api folder

`npm run serve` - run local web server for develop and watch examples

`npm run lint` - run code linter

`npm run test` - run tests

`tsc` - run typescript parser

## Support the Project

There are many ways to contribute back to the project:

- Help us test new and existing features and report [bugs](https://github.com/openglobus/openglobus/issues)
- Help answer questions on the community [forum](https://github.com/openglobus/openglobus/discussions)
  and [chat](https://gitter.im/openglobus/og)
- ⭐️ us on GitHub
- Spread the word about openglobus on [social media](https://twitter.com/openglobus)
- Become a contributor
- [Support with money](https://opencollective.com/openglobusjs)

## License

### MIT
