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

  return { type: 'query', value: line }
}

function parseText (text) {
  let lastTag = null
  let lastLine = null

  return text.split('\n').reduce((queries, line) => {
    line = parseLine(line)
    switch (line.type) {
      case 'blank':
      case 'comment':
        break

      case 'query':
        if (lastTag === null) throw new Error('Query without tag')

        let query = line.value
        if (queries[lastTag] !== undefined) query = queries[lastTag] + ' ' + query
        queries[lastTag] = query

        break

      case 'tag':
        if (lastLine !== null && lastLine.type === 'tag') throw new Error('Tag overwritten')
        lastTag = line.value

        break
    }

    lastLine = line
    return queries
  }, {})
}

module.exports = {
  parseText
}
