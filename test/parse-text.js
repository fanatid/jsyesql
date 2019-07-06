const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')
const test = require('tape')
const jsyesql = require('../')

const fixtures = yaml.safeLoad(fs.readFileSync(path.join(__dirname, 'parse-text-fixtures.yml')))

for (const fixture of fixtures) {
  test(`parse-text-fixture#${fixture.name}`, (t) => {
    const arr = jsyesql.parseTextToArray(fixture.text)
    t.same(arr, fixture.queries)

    const obj = jsyesql.parseTextToObject(fixture.text)
    t.same(obj, jsyesql.arrayToObject(fixture.queries))

    t.end()
  })
}
