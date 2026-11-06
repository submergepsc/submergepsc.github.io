import { readFile, readdir, stat, writeFile, rm } from 'node:fs/promises'
import { resolve, relative, sep } from 'node:path'
import { parseHTML, DOMParser } from 'linkedom'
import { projectRoot } from './prepare-content.mjs'

const out = resolve(projectRoot, 'dist')
// SSG 的 nested 输出需将这个特殊路由整理为平台使用的根目录 404.html。
try {
  if ((await stat(resolve(out, '404.html'))).isDirectory()) {
    const content = await readFile(resolve(out, '404.html/index.html'))
    await rm(resolve(out, '404.html'), { recursive: true })
    await writeFile(resolve(out, '404.html'), content)
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}
const { paths } = JSON.parse(
  await readFile(resolve(projectRoot, 'src/generated/content.json'), 'utf8'),
)
const files = []
async function walk(dir) {
  for (const name of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, name.name)
    if (name.isDirectory()) await walk(path)
    else if (path.endsWith('.html')) files.push(path)
  }
}
await walk(out)
const documents = new Map()
for (const path of files) documents.set(path, parseHTML(await readFile(path, 'utf8')).document)
const errors = []
for (const path of paths) {
  const target = resolve(
    out,
    path === '/' ? 'index.html' : path === '/404.html' ? '404.html' : path.slice(1) + 'index.html',
  )
  if (!documents.has(target)) errors.push(`缺少页面 ${path}`)
}
for (const [path, document] of documents) {
  if (!document.querySelector('h1') || !document.querySelector('main'))
    errors.push(`${relative(out, path)}: 未生成页面正文`)
  for (const node of document.querySelectorAll('a[href],link[href],script[src],img[src]')) {
    const ref = node.getAttribute(node.hasAttribute('href') ? 'href' : 'src')
    if (!ref || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(ref)) continue
    const parsed = new URL(ref, 'https://site.invalid/' + relative(out, path).split(sep).join('/'))
    let target = resolve(out, '.' + decodeURIComponent(parsed.pathname))
    if (!target.startsWith(out + sep) && target !== out) {
      errors.push(`路径超出 dist: ${ref}`)
      continue
    }
    try {
      if ((await stat(target)).isDirectory()) target = resolve(target, 'index.html')
      await stat(target)
      if (
        parsed.hash &&
        documents.has(target) &&
        !documents.get(target).getElementById(decodeURIComponent(parsed.hash.slice(1)))
      )
        errors.push(`${relative(out, path)}: 缺少锚点 ${ref}`)
    } catch {
      errors.push(`${relative(out, path)}: 缺少文件 ${ref}`)
    }
  }
}
for (const name of ['rss.xml', 'sitemap.xml']) {
  const doc = new DOMParser().parseFromString(
    await readFile(resolve(out, name), 'utf8'),
    'text/xml',
  )
  if (!doc.documentElement || doc.querySelector('parsererror')) errors.push(`${name}: XML 无效`)
}
if (files.length !== paths.length) errors.push(`页面数量不一致：${files.length} / ${paths.length}`)
if (errors.length) throw new Error(errors.join('\n'))
console.log(`静态输出校验通过：${files.length} 个 HTML，站内文件与锚点均存在。`)
