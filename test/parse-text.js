const test = require('tape')
const jsyesql = require('../')
const fixtures = require('./parse-text-fixtures.json')

for (const fixture of fixtures) {
  test(`fixture#${fixture.name}`, (t) => {
    const arr = jsyesql.parseTextToArray(fixture.text)
    t.same(arr, fixture.queries.array)

    const obj = jsyesql.parseTextToObject(fixture.text)
    t.same(obj, fixture.queries.obj)

    t.end()
  })
}
