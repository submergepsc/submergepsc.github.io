import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import matter from 'gray-matter'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import { parseHTML } from 'linkedom'

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  )
const json = (value) => JSON.stringify(value, null, 2) + '\n'
const dateValid = (value) =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value

function render(body) {
  const headings = [],
    ids = new Set()
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    highlight(code, lang) {
      return lang && hljs.getLanguage(lang)
        ? hljs.highlight(code, { language: lang, ignoreIllegals: true }).value
        : ''
    },
  })
  const baseHeading =
    md.renderer.rules.heading_open ||
    ((tokens, i, options, env, self) => self.renderToken(tokens, i, options))
  const fence = md.renderer.rules.fence
  md.renderer.rules.fence = (...args) =>
    `<div class="code-block">${fence(...args)}<button class="copy-code" type="button" data-copy-code aria-label="复制代码">复制</button></div>`
  md.renderer.rules.heading_open = (tokens, i, options, env, self) => {
    const title = (tokens[i + 1].children || [])
      .filter((t) => !['html_inline', 'image'].includes(t.type))
      .map((t) => t.content)
      .join('')
    const base =
      title
        .normalize('NFKC')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}_\s-]/gu, '')
        .trim()
        .replace(/\s+/g, '-') || 'section'
    let id = base,
      n = 1
    while (ids.has(id)) id = `${base}-${n++}`
    ids.add(id)
    tokens[i].attrSet('id', id)
    headings.push({ id, title, level: Number(tokens[i].tag.slice(1)) })
    return baseHeading(tokens, i, options, env, self)
  }
  const html = md
    .render(body)
    .replace(/<table>/g, '<table tabindex="0">')
    .replace(/<pre>/g, '<pre tabindex="0">')
  const { document } = parseHTML(`<html><body>${html}</body></html>`)
  return {
    html,
    headings,
    text: document.body.textContent.replace(/\s+/g, ' ').trim(),
    links: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
  }
}

export async function prepareContent({ root = projectRoot, siteUrl = process.env.SITE_URL } = {}) {
  const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'))
  const site = await readJson('content/site.json')
  const url = new URL(siteUrl || site.url || 'https://submergepsc.github.io')
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  )
    throw new Error('SITE_URL 必须是完整的站点根地址，例如 https://example.com')
  site.url = url.origin
  const entries = [],
    projects = []
  let excluded = 0
  for (const name of (await readdir(resolve(root, 'content/entries')))
    .filter((n) => n.endsWith('.md'))
    .sort()) {
    const { data, content } = matter(await readFile(resolve(root, 'content/entries', name), 'utf8'))
    if (data.public !== true || data.draft !== false) {
      excluded++
      continue
    }
    for (const key of ['slug', 'title', 'summary', 'date', 'type', 'category', 'topic', 'stage'])
      if (typeof data[key] !== 'string' || !data[key].trim())
        throw new Error(`${name}: ${key} 必须为非空字符串`)
    if (
      !slugPattern.test(data.slug) ||
      !dateValid(data.date) ||
      (data.updated && !dateValid(data.updated))
    )
      throw new Error(`${name}: slug 或日期无效`)
    if (
      !['article', 'note', 'essay', 'journal'].includes(data.type) ||
      !['tech', 'thinking', 'life'].includes(data.topic) ||
      !['seedling', 'growing', 'evergreen'].includes(data.stage)
    )
      throw new Error(`${name}: 类型、主题或生长状态无效`)
    if (!Array.isArray(data.tags) || !data.tags.every((t) => typeof t === 'string'))
      throw new Error(`${name}: tags 必须为字符串数组`)
    if (entries.some((e) => e.slug === data.slug)) throw new Error(`${name}: slug 重复`)
    if (data.series && !site.series[data.series]) throw new Error(`${name}: 专题不存在`)
    const rendered = render(content)
    const words = rendered.text.match(/[\u3400-\u9fff]|\b[A-Za-z0-9_]+\b/g) || []
    entries.push({
      ...data,
      ...rendered,
      href: `/articles/${data.slug}/`,
      minutes: Math.max(1, Math.ceil(words.length / 350)),
    })
  }
  entries.sort(
    (a, b) =>
      (b.updated || b.date).localeCompare(a.updated || a.date) || b.slug.localeCompare(a.slug),
  )
  for (const name of (await readdir(resolve(root, 'content/projects')))
    .filter((n) => n.endsWith('.md'))
    .sort()) {
    const { data, content } = matter(
      await readFile(resolve(root, 'content/projects', name), 'utf8'),
    )
    const slug = name.slice(0, -3)
    if (!slugPattern.test(slug)) throw new Error(`${name}: 项目标识无效`)
    for (const field of ['title', 'summary', 'image', 'image_alt', 'repository'])
      if (!data[field]) throw new Error(`${name}: 缺少 ${field}`)
    projects.push({ ...data, slug, ...render(content), href: `/projects/${slug}/` })
  }
  for (const entry of entries)
    if (entry.project && !projects.some((p) => p.slug === entry.project))
      throw new Error(`${entry.slug}: 关联项目不存在`)
  const tools = await readJson('src/tools/catalog.json')
  if (
    new Set(tools.map((t) => t.slug)).size !== tools.length ||
    tools.some((t) => !slugPattern.test(t.slug))
  )
    throw new Error('工具标识无效或重复')
  const series = Object.entries(site.series)
    .map(([slug, value]) => ({
      ...value,
      slug,
      href: `/series/${slug}/`,
      entries: entries
        .filter((e) => e.series === slug)
        .sort((a, b) => a.slug.localeCompare(b.slug)),
    }))
    .filter((s) => s.entries.length)
  const repositories = await readJson('content/repositories.json')
  const paths = [
    '/',
    '/garden/',
    '/projects/',
    '/projects/repositories/',
    '/tools/',
    '/about/',
    '/search/',
    '/series/',
    '/archive/',
    '/404.html',
    ...entries.map((e) => e.href),
    ...projects.map((p) => p.href),
    ...series.map((s) => s.href),
    ...tools.map((t) => `/tools/${t.slug}/`),
  ]
  const search = entries
    .map(({ title, summary, category, tags, date, text, href }) => ({
      title,
      summary,
      category,
      tags,
      date,
      text,
      href,
    }))
    .concat(
      tools.map((t) => ({
        title: t.title,
        summary: t.description,
        category: '工具箱',
        tags: t.keywords,
        date: '在线工具',
        text: t.description,
        href: `/tools/${t.slug}/`,
      })),
    )
  const data = { site, entries, projects, repositories, tools, series, paths }
  await mkdir(resolve(root, 'src/generated'), { recursive: true })
  await mkdir(resolve(root, 'public'), { recursive: true })
  await writeFile(resolve(root, 'src/generated/content.json'), json(data))
  await writeFile(resolve(root, 'public/search-index.json'), json(search))
  const rssItems = entries
    .map(
      (e) =>
        `<item><title>${escape(e.title)}</title><link>${site.url}${e.href}</link><guid>${site.url}${e.href}</guid><pubDate>${new Date(`${e.date}T00:00:00Z`).toUTCString()}</pubDate><description>${escape(e.summary)}</description></item>`,
    )
    .join('')
  await writeFile(
    resolve(root, 'public/rss.xml'),
    `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escape(site.brand)} · 数字花园</title><link>${site.url}/</link><description>${escape(site.subtitle)}</description><language>zh-cn</language>${rssItems}</channel></rss>`,
  )
  await writeFile(
    resolve(root, 'public/sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths
      .filter((p) => !['/search/', '/404.html'].includes(p))
      .map((p) => `<url><loc>${escape(site.url + p)}</loc></url>`)
      .join('')}</urlset>`,
  )
  await writeFile(
    resolve(root, 'public/robots.txt'),
    `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`,
  )
  await writeFile(resolve(root, 'public/.nojekyll'), '')
  console.log(
    `内容准备：${entries.length} 篇公开记录，${excluded} 篇草稿排除，${projects.length} 个项目，${tools.length} 个工具`,
  )
  return data
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  await prepareContent()
