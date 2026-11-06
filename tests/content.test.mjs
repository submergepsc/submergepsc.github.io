import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { prepareContent } from '../scripts/prepare-content.mjs'

async function fixture() {
  const root = await mkdtemp(resolve(tmpdir(), 'garden-content-'))
  for (const path of ['content/entries', 'content/projects', 'src/tools'])
    await mkdir(resolve(root, path), { recursive: true })
  await writeFile(
    resolve(root, 'content/site.json'),
    JSON.stringify({ brand: '测试', author: 'author', subtitle: '简介', series: {} }),
  )
  await writeFile(
    resolve(root, 'content/repositories.json'),
    JSON.stringify({ updated: '2026-11-07', repositories: [] }),
  )
  await writeFile(resolve(root, 'src/tools/catalog.json'), '[]')
  const note = (slug, extra, body) =>
    `---\nslug: ${slug}\ntitle: 标题\nsummary: 简介\ndate: '2026-11-07'\ntype: note\ncategory: 测试\ntopic: tech\nstage: growing\ntags: [测试]\n${extra}\n---\n${body}`
  return { root, note }
}
test('草稿与非公开正文不进入客户端数据、搜索、RSS 或 sitemap', async () => {
  const { root, note } = await fixture()
  try {
    await writeFile(
      resolve(root, 'content/entries/visible.md'),
      note('visible', 'public: true\ndraft: false', '## 正文\n公开内容'),
    )
    await writeFile(
      resolve(root, 'content/entries/draft.md'),
      note('draft', 'public: true\ndraft: true', 'DRAFT_SECRET_SENTINEL [内部](/missing/)'),
    )
    await writeFile(
      resolve(root, 'content/entries/private.md'),
      note('private', 'public: false\ndraft: false', 'PRIVATE_SECRET_SENTINEL'),
    )
    const data = await prepareContent({ root, siteUrl: 'https://example.com' })
    assert.equal(data.entries.length, 1)
    for (const name of [
      'src/generated/content.json',
      'public/search-index.json',
      'public/rss.xml',
      'public/sitemap.xml',
    ]) {
      const text = await readFile(resolve(root, name), 'utf8')
      assert.doesNotMatch(
        text,
        /DRAFT_SECRET_SENTINEL|PRIVATE_SECRET_SENTINEL|\/articles\/draft\/|\/articles\/private\//,
      )
    }
    assert.match(
      await readFile(resolve(root, 'public/sitemap.xml'), 'utf8'),
      /https:\/\/example.com\/articles\/visible\//,
    )
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
test('拒绝非法日期、重复公开 slug 和非法主地址', async () => {
  const { root, note } = await fixture()
  try {
    const path = resolve(root, 'content/entries/a.md')
    await writeFile(
      path,
      note('visible', 'public: true\ndraft: false', '正文').replace('2026-11-07', '2026-02-30'),
    )
    await assert.rejects(prepareContent({ root }), /日期/)
    await writeFile(path, note('visible', 'public: true\ndraft: false', '正文'))
    await writeFile(
      resolve(root, 'content/entries/b.md'),
      note('visible', 'public: true\ndraft: false', '正文'),
    )
    await assert.rejects(prepareContent({ root }), /重复/)
    await assert.rejects(prepareContent({ root, siteUrl: 'https://example.com/subpath' }), /根地址/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
