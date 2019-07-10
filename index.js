// -- name: MY_QUERY
const RE_TAG = new RegExp('^\\s*--\\s*name\\s*:(.*)$')
// everything after `--` is single line comment
const RE_COMMENT_SINGLE_LINE = new RegExp('--.*$')
// everything in `/**/` is single/multi line comment
const RE_COMMENT_MULTI_LINE = new RegExp('\\/\\*.*?\\*\\/', 'gms')

function parseLine (line) {
  // first, check is line TAG or not, because TAG defined through comment
  const tag = RE_TAG.exec(line)
  if (tag) return { type: 'tag', value: tag[1].trim() }

  // remove comment and trim string
  line = line.replace(RE_COMMENT_SINGLE_LINE, '').trim()

  // empty line
  if (line === '') return { type: 'blank' }

  // query or part of query
  return { type: 'query', value: line }
}

function parseTextToArray (text) {
  text = text.replace(RE_COMMENT_MULTI_LINE, '') // remove multi-line comments

  let lastType = null
  let lastTag = null

  const queries = []
  function pushQuery (name, query) {
    const obj = queries.find((query) => query.name === name)
    if (obj) obj.query += ' ' + query
    else queries.push({ name, query })
  }

  const lines = text.split('\n')
  for (let i = 0; i < lines.length; ++i) {
    const { type, value } = parseLine(lines[i])
    switch (type) {
      case 'blank':
        break

      case 'query':
        if (lastTag === null) throw new Error(`Query without tag at line ${i + 1}: ${lines[i]}`)
        pushQuery(lastTag, value)

        break

      case 'tag':
        if (lastType !== null && lastType === 'tag') throw new Error(`Tag overwritten at line ${i + 1}: ${lines[i]}`)
        lastTag = value

        break
    }

    lastType = type
  }

  return queries
}

function parseTextToObject (text) {
  return arrayToObject(parseTextToArray(text))
}

function arrayToObject (queries) {
  const obj = Object.create(null)
  for (const { name, query } of queries) obj[name] = query
  return obj
}

module.exports = {
  parseText: parseTextToObject,
  parseTextToArray,
  parseTextToObject,
  arrayToObject
}
