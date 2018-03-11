# jsyesql

[![NPM Package](https://img.shields.io/npm/v/jsyesql.svg?style=flat-square)](https://www.npmjs.org/package/jsyesql) [![Build Status](https://img.shields.io/travis/fanatid/jsyesql.svg?branch=master&style=flat-square)](https://travis-ci.org/fanatid/jsyesql)

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

JavaScript + [Yesql](https://github.com/krisajenkins/yesql)

Inspired by [goyesql](https://github.com/nleof/goyesql)

Parse text and associate SQL queries to a Object. Useful for separating SQL from code logic.

## Usage

```js
const fs = require('fs')
const jsyesql = require('jsyesql')

/*
queries.sql:
-- name: selectAll
SELECT * FROM table_name; -- comment
*/

const queries = jsyesql.parseText(fs.readFileSync('./queries.sql', 'utf8'))
console.log(queries.selectAll)
// SELECT * FROM table_name;
```

## LICENSE

This library is free and open-source software released under the MIT license.
