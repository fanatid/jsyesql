# jsyesql

[![Build Status](https://img.shields.io/travis/fanatid/jsyesql.svg?branch=master&style=flat-square)](https://travis-ci.org/fanatid/jsyesql)

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

  - [What this is it?](#what-this-is-it)
  - [Installation](#installation)
  - [What is jsyesql can?](#what-is-jsyesql-can)
  - [How jsyesql work?](#how-jsyesql-work)
  - [API](#api)
  - [Examples](#examples)
    - [Read SQL queries from disk](#read-sql-queries-from-disk)
    - [Insert queries with arbitrary number of arguments](#insert-queries-with-arbitrary-number-of-arguments)
    - [SQLite usage example](#sqlite-usage-example)
  - [LICENSE](#license)

## What this is it?

This is text parser of SQL queries to a Array or Object. Useful for separating SQL from code logic. With `jsyesql` you receive:

  - Syntax highlight and better editor support of SQL queries.
  - Better code readability. It's much easier read name of query than query which can contain few dozens lines. You do not need read query itself for understanding logic in code.
  - Query reuse. Often we need repeat same queries over and over. Instead of this we can refer to query name.
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

## What is jsyesql can?

`jsyesql` is only text parser. I did not include functions for reading files intentionally. There too much cases how this can be done: callbacks or promise, read from directory or one file, read files with some extension or everything, store queries from all files as Arrays or as Objects? Every project have own requirements. Plus absence of functions from [fs](https://nodejs.org/api/fs.html) package make `jsyesql` more compatiable with browser usage ([SQLite compiled with Emscripten](https://github.com/kripken/sql.js/)?).

## How jsyesql work?

First it's remove multiline comments `/* */` from text. Then process text line by line. Each line checking is this `query name` or not, which looks like: `-- name: mySuperQuery`. If not singleline comment (started with `--`) removed and [String#trim](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/trim) called. If resulted line is not empty it's added to query under last name.

For example text:

```sql
-- name: select
-- select id from table_name
SELECT id FROM table_name;

-- name: insert
/* insert id */
INSERT INTO table_name (id) VALUES ($1);
```

will be transformed to:

```js
{
  select: 'SELECT id FROM table_name;',
  insert: 'INSERT INTO table_name (id) VALUES ($1);'
}
```

By default, `parseText` function transform text to Object (alias of `parseTextToObject`), but if you want preserve order of queries from text you can use `parseTextToArray`.

## API

  - `parseText` — alias of `parseTextToObject`
  - `parseTextToArray` — parse text to Array of Objects with keys `name` and `query`, preserve order of queries
  - `parseTextToObject` — parse text to Object where key is `name` and value is `query`
  - `arrayToObject` — helper function which internally used by `parseTextToObject` for converting resulf of `parseTextToArray`

## Examples

#### Read SQL queries from disk

In this example we read contents of directory, make sure that filename have extension `.sql`, read content of this file, parse content with `jsyesql.parseText` and assign result to Object by filename without extension.

```js
const fs = require('fs').promises
const path = require('path')
const jsyesql = require('jsyesql')

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
```

Thanks to [fs Promises API](https://nodejs.org/api/fs.html#fs_fs_promises_api) we now can easily use functions from `fs` package with `Promises`.

#### Insert queries with arbitrary number of arguments

It's easy to work with queries when everything is defined, we just use `$1` / `$2` / `$3` and so on for arguments... but what if want insert (or update) arbitary number values?

This can be solved in next way (valid for PostgreSQL and [brianc/node-postgres](https://github.com/brianc/node-postgres/)):

```sql
-- name: insertUsers
INSERT INTO users (name, avatar) VALUES {VALUES};

-- name: insertUsersTypes
::text, ::bytea
```

```js
const lodash = require('lodash')

class DB {
  constructor () {
    this.sqlQueries = {}
  }

  async readSQLQueries (dir) {
    // read queries from disk (see previous example)
  }

  buildStatementQuery (name, rows) {
    const statement = lodash.get(this.sqlQueries, name, name)
    const statementTypes = lodash.get(this.sqlQueries, name + 'Types', null)
    const types = statementTypes ? statementTypes.split(',').map((s) => s.trim()) : null

    const values = []
    const chunks = []

    for (const row of rows) {
      const clause = []
      row.map((value, index) => {
        values.push(value)
        if (types) clause.push('$' + values.length + types[index])
        else clause.push('$' + values.length)
      })
      chunks.push('(' + clause.join(', ') + ')')
    }

    return { text: statement.replace('{VALUES}', chunks.join(', ')), values }
  }

  runStatementQuery (client, name, rows) {
    const stmt = this.buildStatementQuery(name, rows)
    return client.query(stmt)
  }
}

// and now you can do something like:
// const users = [['alice', aliveAvatarBuffer], ['bob', bobAvatarBuffer]]
// db.runStatementQuery(client, 'insertUsers', users)
```

#### SQLite usage example

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

## LICENSE [MIT](LICENSE)
