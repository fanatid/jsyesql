# jsyesql

[![Build Status](https://img.shields.io/travis/fanatid/jsyesql.svg?branch=master&style=flat-square)](https://travis-ci.org/fanatid/jsyesql)

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

## What this is it?

This is text parser of SQL queries to a Array or Object. Useful for separating SQL from code logic. With `jsyesql` you receive:

  - Syntax highlight and better editor support of SQL queries.
  - Better code readability. It's much easier read name of query than query which contains few dozens lines. You do not need read query itself for understanding logic in code.
  - Query reuse. Often we need repeat same queries over and over. Instead this we can refer to query name.
  - Teams separation. DBAs no need go through all JS code for fixing SQL queries.

Inspired by [Yesql](https://github.com/krisajenkins/yesql), see [rational section](https://github.com/krisajenkins/yesql#rationale) there for more info.

## Installation

[npm](https://www.npmjs.com/):

```bash
npm install https://github.com/fanatid/jsyesql
```

[yarn](https://yarnpkg.com/):

```bash
yarn add https://github.com/fanatid/jsyesql
```

By default `npm` / `yarn` will install code from `master` branch. If you want specified version, just add some branch name / commit hash / tag and the end of URL. See [Yarn add](https://yarnpkg.com/lang/en/docs/cli/add/) or [npm install](https://docs.npmjs.com/cli/install) for details about installing package from git repo.

## Usage

`jsyesql` do not care will you store one query per file or many queries. It's parser only.

`jsyesql` do not read files, you need read file in your own code and pass text. This was done intentionally (for example for usage with [SQLite compiled with Emscripten](https://github.com/kripken/sql.js/)).

Example:

```bash
$ tree .
.
├── sql
│   ├── create.sql
│   └── users.sql
└── sql.js
$ node sql.js
┌─────────┬────┬───────────┐
│ (index) │ id │   name    │
├─────────┼────┼───────────┤
│    0    │ 1  │ 'jsyesql' │
└─────────┴────┴───────────┘
```

`./sql/create.sql`
```sql
-- name: createUsers
CREATE TABLE users (
  id serial PRIMARY KEY,
  name text NOT NULL
);
```

`./sql/users.sql`
```sql
-- name: insert
INSERT INTO users (name) VALUES ($1);

-- name: selectAll
SELECT * FROM users;
```

`./sql.js`
```js
const fs = require('fs').promises
const path = require('path')
const jsyesql = require('jsyesql')
const sqlite3 = require('sqlite3')

async function readSQLQueries (dir) {
  const filenames = await fs.readdir(dir)

  const queries = {}
  for (const filename of filenames) {
    const match = filename.match(/(.+)\.sql$/)
    const name = match && match[1]
    if (!name) continue

    const text = await fs.readFile(path.join(dir, filename), 'utf8')
    queries[name] = jsyesql.parseText(text)
  }

  return queries
}

async function asyncWrap (fn) {
  return new Promise((resolve, reject) => {
    fn((err, ...args) => err ? reject(err) : resolve(args))
  })
}

;(async () => {
  // read queries
  const queries = await readSQLQueries(path.join(__dirname, 'sql'))

  // open in-memory database
  const db = new sqlite3.Database(':memory:')
  await new Promise((resolve) => setTimeout(resolve, 10)) // delay for opening database

  // create table users
  await asyncWrap((cb) => db.run(queries.create.createUsers, cb))

  // insert new users
  await asyncWrap((cb) => db.run(queries.users.insert, { 1: 'jsyesql' }, cb))

  // select all users
  const [users] = await asyncWrap((cb) => db.all(queries.users.selectAll, cb))
  console.table(users)

  // close database
  db.close()
})().catch((err) => {
  console.log(err.stack || err)
  process.exit(1)
})
```

## LICENSE

This library is free and open-source software released under the MIT license.
