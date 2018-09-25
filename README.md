
[![NPM version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Build Status][travis-image]][travis-url]
[![Coverage Status][coveralls-image]][coveralls-url]
[![License][license-image]](LICENSE)
[![Donate][donate-image]][donate-url]

# Cache Deps
Globally cache dependencies from a package-lock.json or a bower.json for faster installs.


## Why?
I wanted NPM and Bower dependencies cached in a base docker image for faster builds of child images but there were no built in commands for populating the cache of either NPM or Bower, this is the tool to fill that gap.


## Install
`npm i cache-deps -g`


## Usage

### NPM
⚠️ Only tested with version 6.4.1  
`npm-cache-add --help`

`npm-cache-add package-lock.json`

### Bower
⚠️ Only tested with version 1.8.4  
`bower-cache-add --help`

`bower-cache-add bower.json`


## API
None as of now, it's on the TODO list.


## Developer

### Install
```bash
git clone https://github.com/Faleij/cache-deps.git
cd cache-deps
npm install
npm link # optional, enables "npm-cache-add" and "bower-cache-add" globally
```

### Build
Build Once:  
`npm run build`

Rebuild on file changes:  
`npm run build -- --watch`

Look at [typescript compiler options](https://www.typescriptlang.org/docs/handbook/compiler-options.html) for more options

### Styleguide
Airbnbs styleguide is used.  
Tslint ensures compliance.


## License

[MIT](LICENSE)

Require other licesing options? Open an issue.

Copyright (c) 2018 Faleij [faleij@gmail.com](mailto:faleij@gmail.com)

[npm-image]: http://img.shields.io/npm/v/cache-deps.svg
[npm-url]: https://npmjs.org/package/cache-deps
[downloads-image]: https://img.shields.io/npm/dm/cache-deps.svg
[downloads-url]: https://npmjs.org/package/cache-deps
[travis-image]: https://travis-ci.org/Faleij/cache-deps.svg?branch=master
[travis-url]: https://travis-ci.org/Faleij/cache-deps
[coveralls-image]: https://coveralls.io/repos/Faleij/cache-deps/badge.svg?branch=master&service=github
[coveralls-url]: https://coveralls.io/github/Faleij/cache-deps?branch=master
[license-image]: https://img.shields.io/badge/license-MIT-blue.svg
[donate-image]: https://img.shields.io/badge/Donate-PayPal-green.svg
[donate-url]: https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=faleij%40gmail%2ecom&lc=GB&item_name=faleij&item_number=cacheDeps&currency_code=SEK&bn=PP%2dDonationsBF%3abtn_donate_SM%2egif%3aNonHosted
