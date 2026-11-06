const encoder = new TextEncoder()
const fail = (message) => {
  throw new Error(message)
}
export function checkSize(text) {
  if (text.length > 1048576) fail('输入过长，请分批处理。')
}

export function githubImageUrl(source, target, override) {
  let text = source.trim()
  if (text.startsWith('<') && text.endsWith('>')) text = text.slice(1, -1).trim()
  if (
    /^(?:www\.)?github\.com\//i.test(text) ||
    /^(?:raw\.githubusercontent\.com|cdn\.jsdelivr\.net)\//i.test(text)
  )
    text = 'https://' + text
  let address
  try {
    address = new URL(text)
  } catch (_) {
    fail('请输入完整的 GitHub 图片文件链接。')
  }
  if (
    !['https:', 'http:'].includes(address.protocol) ||
    address.username ||
    address.password ||
    address.port
  ) {
    fail('请使用不含登录信息的 GitHub HTTPS 文件链接。')
  }
  let parts
  try {
    parts = address.pathname
      .slice(1)
      .split('/')
      .map((part) => decodeURIComponent(part))
  } catch (_) {
    fail('链接中有无效的百分号编码，请重新复制文件链接。')
  }

  const host = address.hostname.toLowerCase()
  let owner,
    repo,
    pathParts,
    ref = '',
    namespace = ''
  if (host === 'github.com' || host === 'www.github.com') {
    ;[owner, repo] = parts
    if (!['blob', 'raw'].includes(parts[2]))
      fail('需要图片的文件页链接（包含 /blob/ 或 /raw/），不能使用仓库首页或目录页。')
    pathParts = parts.slice(3)
  } else if (host === 'raw.githubusercontent.com') {
    ;[owner, repo] = parts
    pathParts = parts.slice(2)
  } else if (host === 'cdn.jsdelivr.net') {
    if (parts[0] !== 'gh') fail('需要 jsDelivr 的 GitHub 地址，格式为 /gh/用户/仓库@版本/路径。')
    owner = parts[1]
    const repoAndRef = parts[2] || ''
    const separator = repoAndRef.indexOf('@')
    if (separator < 1 || separator === repoAndRef.length - 1)
      fail('CDN 链接需要明确版本，例如 仓库@main/图片.png。')
    repo = repoAndRef.slice(0, separator)
    ref = repoAndRef.slice(separator + 1)
    pathParts = parts.slice(3)
  } else {
    fail('仅支持 github.com、raw.githubusercontent.com 或 cdn.jsdelivr.net 的 GitHub 文件链接。')
  }
  if (!owner || !repo || !/^[A-Za-z0-9_-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo))
    fail('链接缺少有效的用户或仓库名称。')
  if (!ref) {
    if (pathParts[0] === 'refs' && ['heads', 'tags'].includes(pathParts[1])) {
      namespace = pathParts.slice(0, 2).join('/') + '/'
      pathParts = pathParts.slice(2)
    }
    if (override) {
      const tail = pathParts.join('/')
      if (!tail.startsWith(override + '/'))
        fail('指定分支或标签与链接不一致，请填写链接中的完整名称。')
      ref = override
      pathParts = tail.slice(override.length + 1).split('/')
    } else {
      ref = pathParts.shift()
    }
  } else if (override && override !== ref) {
    fail('指定分支或标签与 CDN 链接中的版本不一致。')
  }
  if (!ref || !pathParts.length || pathParts.some((part) => !part || part === '.' || part === '..'))
    fail('链接中需要包含分支（或提交）和完整图片文件路径。')
  if (
    ref.split('/').some((part) => !part || part === '.' || part === '..') ||
    /[\u0000-\u0020]/.test(ref)
  )
    fail('分支或标签名称无效，请检查完整名称。')
  const encode = (part) =>
    encodeURIComponent(part).replace(
      /[!'()*]/g,
      (char) => '%' + char.charCodeAt(0).toString(16).toUpperCase(),
    )
  const path = pathParts.map(encode).join('/')
  const repository = encode(owner) + '/' + encode(repo)
  const href =
    target === 'jsdelivr'
      ? `https://cdn.jsdelivr.net/gh/${repository}@${encode(ref)}/${path}`
      : `https://raw.githubusercontent.com/${repository}/${namespace}${encode(ref)}/${path}`
  return { href, filename: pathParts[pathParts.length - 1] }
}

export function convertGithubImages(
  text,
  { target = 'raw', format = 'url', alt = '', override = '' } = {},
) {
  const links = text
    .split(/\r?\n/)
    .map((line, index) => ({ text: line.trim(), line: index + 1 }))
    .filter((item) => item.text)
  if (!links.length) fail('请先粘贴至少一个 GitHub 图片链接。')
  if (links.length > 1000) fail('一次最多转换 1000 个链接，请分批处理。')
  const results = links.map((item) => {
    let image
    try {
      image = githubImageUrl(item.text, target, override)
    } catch (error) {
      fail(`第 ${item.line} 行：${error.message}`)
    }
    const description = (alt || image.filename).replace(/[\r\n]/g, ' ')
    if (format === 'markdown')
      return `![${description.replace(/([\\\[\]])/g, '\\$1')}](${image.href})`
    if (format === 'html') {
      const escaped = description.replace(
        /[&<>"']/g,
        (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
      )
      return `<img src="${image.href}" alt="${escaped}">`
    }
    return image.href
  })
  return results.join('\n')
}

export function jsonFormat(text, compact = false, step = 2) {
  if (!text.trim()) fail('请先输入 JSON。')
  try {
    JSON.parse(text)
  } catch (error) {
    fail(`JSON 校验未通过：${error.message}`)
  }
  // Validate with the browser, but format original tokens so that large integers,
  // duplicate keys and exponent notation survive without serialization changes.
  const tokens = text.match(
    /"(?:\\.|[^"\\])*"|[{}\[\],:]|true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/g,
  )
  let nesting = 0
  for (const token of tokens) {
    if (token === '{' || token === '[') nesting++
    if (token === '}' || token === ']') nesting--
    if (nesting > 256) fail('JSON 嵌套超过 256 层，请缩小结构后再处理。')
  }
  if (compact) return tokens.join('')
  let depth = 0
  const parts = []
  const indent = () => ' '.repeat(step * depth)
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token === '{' || token === '[') {
      parts.push(token)
      const close = token === '{' ? '}' : ']'
      if (tokens[i + 1] === close) {
        parts.push(close)
        i++
      } else {
        depth++
        if (depth > 256) fail('JSON 嵌套超过 256 层，请缩小结构后再处理。')
        parts.push('\n', indent())
      }
    } else if (token === '}' || token === ']') {
      depth--
      parts.push('\n', indent(), token)
    } else if (token === ',') parts.push(',\n', indent())
    else if (token === ':') parts.push(': ')
    else parts.push(token)
  }
  return parts.join('')
}

export function encodeBase64(text, variant = 'standard') {
  const bytes = encoder.encode(text)
  const chunks = []
  for (let offset = 0; offset < bytes.length; offset += 16384) {
    chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 16384)))
  }
  let encoded = btoa(chunks.join(''))
  if (variant === 'url') {
    encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }
  return encoded
}

export function decodeBase64(text, variant = 'standard') {
  const urlSafe = variant === 'url'
  const clean = text.replace(/\s/g, '')
  const alphabet = urlSafe ? /^[A-Za-z0-9_-]*={0,2}$/ : /^[A-Za-z0-9+/]*={0,2}$/
  if (
    !alphabet.test(clean) ||
    clean.length % 4 === 1 ||
    (clean.includes('=') && clean.length % 4 !== 0)
  ) {
    fail('不是有效的 Base64。请检查所选格式、字符与末尾补位符。')
  }
  const normalized = clean.replace(/-/g, '+').replace(/_/g, '/')
  let binary
  try {
    binary = atob(normalized)
  } catch (_) {
    fail('Base64 无法解码，请检查输入是否完整。')
  }
  if (btoa(binary).replace(/=+$/, '') !== normalized.replace(/=+$/, ''))
    fail('Base64 尾部的有效位不正确。')
  try {
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(
      Uint8Array.from(binary, (char) => char.charCodeAt(0)),
    )
  } catch (_) {
    fail('解码结果不是有效 UTF-8 文本；此工具用于文本，不用于二进制文件。')
  }
}

export function textStats(text) {
  const points = [...text]
  const hasSegmenter = typeof Intl.Segmenter === 'function'
  let graphemes = points.length
  let words = (text.match(/\S+/gu) || []).length
  if (hasSegmenter) {
    graphemes = 0
    words = 0
    for (const part of new Intl.Segmenter('zh-CN', { granularity: 'grapheme' }).segment(text))
      graphemes++
    for (const part of new Intl.Segmenter('zh-CN', { granularity: 'word' }).segment(text))
      if (part.isWordLike) words++
  }
  const counts = {
    codepoints: points.length,
    graphemes,
    nonspace: points.filter((char) => !/\s/u.test(char)).length,
    lines: text ? text.replace(/\r\n?/g, '\n').split('\n').length : 0,
    bytes: encoder.encode(text).length,
    words,
  }
  return counts
}

export function cleanLines(
  text,
  { trim = true, drop = true, ignoreCase = false, order = 'original' } = {},
) {
  if (!text) return { text: '', before: 0, after: 0 }
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  const seen = new Set()
  const result = []
  for (let line of lines) {
    if (trim) line = line.trim()
    if (drop && !line.trim()) continue
    const key = ignoreCase ? line.toLowerCase() : line
    if (seen.has(key)) continue
    seen.add(key)
    result.push(line)
  }
  if (order !== 'original') {
    result.sort((a, b) => a.localeCompare(b, 'zh-CN', { numeric: true }))
    if (order === 'desc') result.reverse()
  }
  return { text: result.join('\n'), before: lines.length, after: result.length }
}

export function epochMilliseconds(raw, unit) {
  const text = raw.trim()
  if (text.length > 32) fail('时间戳过长，请检查输入和单位。')
  if (unit === 'seconds' ? !/^[+-]?\d+(?:\.\d{1,3})?$/.test(text) : !/^[+-]?\d+$/.test(text)) {
    fail(unit === 'seconds' ? '请输入秒时间戳，最多保留三位小数。' : '请输入整数毫秒时间戳。')
  }
  const sign = text.startsWith('-') ? -1n : 1n
  const [whole, fraction = ''] = text.replace(/^[+-]/, '').split('.')
  const value =
    unit === 'seconds'
      ? (BigInt(whole) * 1000n + BigInt(fraction.padEnd(3, '0'))) * sign
      : BigInt(whole) * sign
  if (value < -8640000000000000n || value > 8640000000000000n) fail('超出浏览器可表示的日期范围。')
  return Number(value)
}
