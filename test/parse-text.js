const test = require('tape')
const jsyesql = require('../')
const fixtures = require('./parse-text-fixtures.json')

for (const fixture of fixtures) {
  test(`fixture#${fixture.name}`, (t) => {
    const queries = jsyesql.parseText(fixture.text)
    t.same(queries, fixture.queries)

    t.end()
  })
}
