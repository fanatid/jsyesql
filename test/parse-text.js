const fs = require('fs')
const path = require('path')
const test = require('tape')
const jsyesql = require('../')
const fixtures = require('./parse-text-fixtures')

for (const fixture of fixtures) {
  test(`fixture#${fixture.name}`, (t) => {
    const location = path.join(__dirname, `${path.parse(__filename).name}-fixtures-${fixture.name}`)
    const fixtureText = fs.readFileSync(location, 'utf-8')

    const arr = jsyesql.parseTextToArray(fixtureText)
    t.same(arr, fixture.queries.array)

    const obj = jsyesql.parseTextToObject(fixtureText)
    t.same(obj, fixture.queries.obj)

    t.end()
  })
}
