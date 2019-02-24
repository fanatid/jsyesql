// -- name: $tag
const RE_TAG = new RegExp('^\\s*--\\s*name\\s*:\\s*(.+)')
// -- $comment
const RE_COMMENT = new RegExp('^\\s*--\\s*(.+)')

function parseLine (line) {
  line = line.trim()

  if (line === '') return { type: 'blank' }

  const tag = RE_TAG.exec(line)
  if (tag) return { type: 'tag', value: tag[1] }

  const comment = RE_COMMENT.exec(line)
  if (comment) return { type: 'comment', value: comment[1] }

  const posi = line.indexOf('--')
  if (posi !== -1) line = line.slice(0, posi - 1)

  return { type: 'query', value: line }
}

function arrayToObject (queries) {
  return queries.reduce((obj, item) => {
    obj[item.name] = item.query
    return obj
  }, {})
}

function parseTextToArray (text) {
  let lastLine = null
  let lastTag = null

  const queries = []
  function pushQuery (name, query) {
    const obj = queries.find((query) => query.name === name)
    if (obj) obj.query += ' ' + query
    else queries.push({ name, query })
  }

  for (const lineRaw of text.split('\n')) {
    const line = parseLine(lineRaw)
    switch (line.type) {
      case 'blank':
      case 'comment':
        break

      case 'query':
        if (lastTag === null) throw new Error('Query without tag')
        pushQuery(lastTag, line.value)

        break

      case 'tag':
        if (lastLine !== null && lastLine.type === 'tag') throw new Error('Tag overwritten')
        lastTag = line.value

        break
    }

    lastLine = line
  }

  return queries
}

function parseTextToObject (text) {
  return arrayToObject(parseTextToArray(text))
}

module.exports = {
  arrayToObject,
  parseTextToArray,
  parseTextToObject,
  parseText: parseTextToObject
}
