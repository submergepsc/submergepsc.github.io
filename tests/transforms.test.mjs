import test from 'node:test'
import assert from 'node:assert/strict'
import {
  githubImageUrl,
  convertGithubImages,
  jsonFormat,
  encodeBase64,
  decodeBase64,
  cleanLines,
  textStats,
  epochMilliseconds,
} from '../src/tools/transforms.js'

test('GitHub 文件链接、中文路径、分支和 CDN 转换', () => {
  const input = 'https://github.com/submergepsc/pics/blob/main/目录/a b.png?raw=true#L1'
  assert.equal(
    githubImageUrl(input, 'raw', '').href,
    'https://raw.githubusercontent.com/submergepsc/pics/main/%E7%9B%AE%E5%BD%95/a%20b.png',
  )
  assert.equal(
    githubImageUrl(
      'https://github.com/me/pics/blob/feature/images/a.png',
      'jsdelivr',
      'feature/images',
    ).href,
    'https://cdn.jsdelivr.net/gh/me/pics@feature%2Fimages/a.png',
  )
  assert.throws(() => githubImageUrl('https://example.com/a.png', 'raw', ''), /仅支持/)
  assert.throws(
    () => githubImageUrl('https://github.com/me/pics/tree/main/a.png', 'raw', ''),
    /文件页/,
  )
})
test('批量转换的转义和整批错误行为', () => {
  const url = 'https://github.com/me/pics/blob/main/a.png'
  assert.equal(
    convertGithubImages(url, { format: 'markdown', alt: '图 [1]' }),
    '![图 \\[1\\]](https://raw.githubusercontent.com/me/pics/main/a.png)',
  )
  assert.match(
    convertGithubImages(url, { format: 'html', alt: '"<图>&' }),
    /alt="&quot;&lt;图&gt;&amp;"/,
  )
  assert.throws(() => convertGithubImages(url + '\ninvalid'), /第 2 行/)
})
test('JSON 保留大整数、重复键和指数，并拒绝过深嵌套', () => {
  const text = '{"n":9007199254740993,"n":1e30,"a":[]}'
  assert.equal(jsonFormat(text, true), text)
  assert.match(jsonFormat(text), /9007199254740993/)
  assert.match(jsonFormat(text, false, 4), /\n {4}"n"/)
  assert.throws(() => jsonFormat('['.repeat(257) + '0' + ']'.repeat(257)), /256/)
})
test('Base64 保留 Unicode 与 BOM，校验原始有效位', () => {
  for (const variant of ['standard', 'url']) {
    const text = '\uFEFF中文 👩‍💻'
    assert.equal(decodeBase64(encodeBase64(text, variant), variant), text)
  }
  assert.throws(() => decodeBase64('Zh=='), /有效位/)
  assert.throws(() => decodeBase64('/w=='), /UTF-8/)
})
test('文本稳定去重、自然排序与 Unicode 统计', () => {
  assert.equal(cleanLines(' a \na\n\nB\nb', { ignoreCase: true }).text, 'a\nB')
  assert.equal(cleanLines('item10\nitem2', { order: 'asc' }).text, 'item2\nitem10')
  const count = textStats('👩‍💻\n')
  assert.equal(count.codepoints, 4)
  assert.equal(count.graphemes, 2)
  assert.equal(count.lines, 2)
  assert.equal(count.bytes, 12)
})
test('时间戳小数、负值与日期表示边界', () => {
  assert.equal(epochMilliseconds('-0.001', 'seconds'), -1)
  assert.equal(epochMilliseconds('1700000000.123', 'seconds'), 1700000000123)
  assert.throws(() => epochMilliseconds('1.0001', 'seconds'), /三位小数/)
  assert.throws(() => epochMilliseconds('8640000000000001', 'milliseconds'), /日期范围/)
})
