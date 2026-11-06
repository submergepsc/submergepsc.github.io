#!/usr/bin/env python3
"""Build a public digital garden from explicitly published Markdown files."""
import html, json, re, shutil, math
from datetime import datetime, timezone
from email.utils import format_datetime
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import quote, urlparse, unquote
from xml.etree import ElementTree

import markdown
import yaml
from tools.pages import build_pages as toolbox_pages, search_entries as toolbox_search_entries

ROOT=Path(__file__).resolve().parent
CONTENT=ROOT/'content'
OUT=ROOT/'dist'
BASE='https://submergepsc.github.io'

def esc(x): return html.escape(str(x), quote=True)
def route(slug): return f'/articles/{slug}/'

class Document(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = []
        self.links = []
        self.references = []
        self.ids = set()

    def handle_data(self, data):
        self.text.append(data)

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if attributes.get('id'):
            self.ids.add(attributes['id'])
        if tag == 'a':
            self.links.append(attributes.get('href', ''))
        field = 'href' if tag in ('a', 'link') else 'src' if tag in ('img', 'script') else None
        if field and attributes.get(field):
            self.references.append(attributes[field])


def read_markdown(path):
    raw = path.read_text(encoding='utf-8')
    if not raw.startswith('---\n') or '\n---\n' not in raw[4:]:
        raise ValueError(f'{path.name}: Markdown requires YAML frontmatter')
    front, body = raw[4:].split('\n---\n', 1)
    meta = yaml.safe_load(front)
    if not isinstance(meta, dict):
        raise ValueError(f'{path.name}: invalid frontmatter')
    return meta, body


def load():
    site = json.loads((CONTENT/'site.json').read_text(encoding='utf-8'))
    entries, excluded = [], 0
    for path in sorted((CONTENT/'entries').glob('*.md')):
        entry, body = read_markdown(path)
        # Check publication before rendering or inspecting links to private notes.
        if entry.get('public') is not True or entry.get('draft') is not False:
            excluded += 1
            continue
        for field in ('slug', 'title', 'summary', 'date', 'type', 'category', 'topic', 'stage'):
            if not isinstance(entry.get(field), str) or not entry[field].strip():
                raise ValueError(f'{path.name}: {field} must be a nonempty string')
        datetime.strptime(entry['date'], '%Y-%m-%d')
        if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', entry['slug']):
            raise ValueError(f'{path.name}: invalid slug')
        if entry['type'] not in ('article', 'note', 'essay', 'journal'):
            raise ValueError(f'{path.name}: invalid entry type')
        if entry['stage'] not in ('seedling', 'growing', 'evergreen'):
            raise ValueError(f'{path.name}: invalid stage')
        if entry['topic'] not in ('tech', 'thinking', 'life'):
            raise ValueError(f'{path.name}: invalid topic')
        if not isinstance(entry.get('tags'), list) or not all(isinstance(t, str) for t in entry['tags']):
            raise ValueError(f'{path.name}: tags must be a list of strings')
        if entry.get('updated'):
            datetime.strptime(entry['updated'], '%Y-%m-%d')
        renderer = markdown.Markdown(extensions=['extra', 'toc', 'sane_lists', 'codehilite'],
                                     extension_configs={'toc': {'permalink': False}, 'codehilite': {'guess_lang': False}})
        entry['html'] = renderer.convert(body).replace('<table>', '<table tabindex="0">').replace('<pre>', '<pre tabindex="0">')
        entry['toc'] = renderer.toc
        doc = Document()
        doc.feed(entry['html'])
        entry['text'] = ' '.join(doc.text)
        entry['links'] = doc.links
        entry['words'] = len(re.findall(r'[\u3400-\u9fff]|\b[A-Za-z0-9_]+\b', entry['text']))
        entries.append(entry)
    if len({e['slug'] for e in entries}) != len(entries):
        raise ValueError('Duplicate public entry slugs')
    entries.sort(key=lambda e:(e.get('updated', e['date']), e['slug']), reverse=True)
    return site, entries, excluded


def minutes(e):
    return max(1, math.ceil(e['words'] / 350))

def meta(e):
    stage={'seedling':'幼苗','growing':'生长中','evergreen':'常青'}.get(e.get('stage'),'笔记')
    tags=''.join(f'<a class="tag" href="/garden/?tag={quote(t)}">{esc(t)}</a>' for t in e.get('tags',[]))
    updated = f'<span>更新于 {esc(e["updated"])}</span>' if e.get('updated') and e['updated'] != e['date'] else ''
    return f'<div class="entry-meta"><time datetime="{esc(e["date"])}">{esc(e["date"])}</time>{updated}<span class="stage stage-{esc(e["stage"])}"><i></i>{stage}</span><span>约 {minutes(e)} 分钟</span></div><div class="tag-row">{tags}</div>'

def card(e,featured=False):
    typ={'article':'长文','note':'短记','essay':'花园手记','journal':'随记'}.get(e['type'],'笔记')
    return f'<article class="entry-card {"featured-card" if featured else ""}" data-entry-type="{esc(e["type"])}" data-entry-category="{esc(e["category"])}" data-entry-tags="{esc(json.dumps(e["tags"],ensure_ascii=False))}" data-entry-topic="{esc(e["topic"])}" data-entry-stage="{esc(e["stage"])}"><div class="card-kicker"><span class="type-mark">{typ}</span><span>{esc(e["category"])}</span></div><h3><a href="{route(e["slug"])}">{esc(e["title"])}</a></h3><p class="card-summary">{esc(e["summary"])}</p>{meta(e)}</article>'

def page(title,body,description='',active='garden'):
    nav=[('/','首页','home'),('/garden/','花园','garden'),('/projects/','项目','projects'),('/tools/','工具箱','tools'),('/journal/','随记','journal'),('/about/','关于','about')]
    nav_html=''.join(f'<a class="nav-link {"is-active" if active==key else ""}" href="{href}"'+(' aria-current="page"' if active==key else '')+f'>{label}</a>' for href,label,key in nav)
    return f'''<!doctype html><html lang="zh-CN" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="description" content="{esc(description)}"><meta property="og:title" content="{esc(title)} · SubmergePSC"><meta property="og:description" content="{esc(description)}"><title>{esc(title)} · SubmergePSC</title><link rel="stylesheet" href="/assets/site.css"><link rel="icon" href="/assets/mark.svg"><link rel="alternate" type="application/rss+xml" href="/rss.xml"><script>try{{const t=localStorage.getItem('sp-theme');if(t)document.documentElement.dataset.theme=t}}catch(e){{}}</script></head><body><a class="skip-link" href="#main">跳到正文</a><header class="topbar"><div class="nav-wrap"><a class="brand" href="/"><span class="brand-mark">s<span></span></span><span class="brand-word">SubmergePSC<small>digital garden</small></span></a><nav class="main-nav" aria-label="主导航">{nav_html}</nav><div class="nav-actions"><a class="search-link" href="/search/" aria-label="搜索">/</a><button class="theme-toggle" type="button" aria-label="切换主题">☼</button><button class="menu-toggle" type="button" aria-label="打开导航" aria-expanded="false"><span></span><span></span><span></span></button></div></div></header><main id="main">{body}</main><footer class="footer"><div class="footer-inner"><a class="footer-brand" href="/">SubmergePSC</a><p>把学到的、想到的、经历的，慢慢留下来。</p><div class="footer-links"><a href="/garden/">漫步花园</a><a href="/journal/">随记</a><a href="/rss.xml">RSS</a><a href="https://github.com/submergepsc">GitHub ↗</a></div><small>由真实记录慢慢生长 · © {datetime.now().year} SubmergePSC</small></div></footer><script src="/assets/site.js" defer></script></body></html>'''

def home(site,entries):
    featured=sorted([e for e in entries if e.get('featured')], key=lambda e: e['featured'])[:3]
    recent=[e for e in entries if e not in featured][:4]
    cards=''.join(card(e,True) for e in featured)
    rows=''.join(f'<a class="recent-row" href="{route(e["slug"])}"><span class="recent-date">{esc(e["date"][-5:])}</span><span class="recent-type">{esc(e["category"])}</span><span class="recent-title">{esc(e["title"])}</span><span class="recent-arrow">↗</span></a>' for e in recent)
    return f'''<section class="hero shell"><div class="hero-copy"><div class="hero-eyebrow"><span class="live-dot"></span>一座正在生长的个人花园</div><h1>{esc(site['tagline'])}</h1><p class="hero-subtitle">{esc(site['subtitle'])} 有些记录是完整文章，有些只是一个起点。</p><div class="hero-actions"><a class="button button-dark" href="/garden/">逛逛花园 <span>↗</span></a><a class="text-link" href="/about/">认识园丁 →</a></div></div><div class="hero-art" aria-hidden="true"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="garden-stem stem-one"><i></i><b></b><em></em></div><div class="garden-stem stem-two"><i></i><b></b></div><div class="garden-stem stem-three"><i></i><b></b><em></em></div><span class="art-label">notes in progress</span><span class="art-coordinate">01 / 06</span></div><div class="hero-bottom"><span>一切从一次记录开始</span><span>SCROLL TO EXPLORE ↓</span></div></section><section class="garden-map shell"><div class="section-heading"><div><span class="section-overline">THE GARDEN <span>01—03</span></span><h2>从你此刻的好奇心出发。</h2></div><a class="quiet-link" href="/garden/">查看所有主题 ↗</a></div><div class="map-grid"><a class="map-card map-tech" href="/garden/?type=article"><span class="map-index">01 / MAKING</span><span class="map-icon">⌘</span><h3>技术实践</h3><p>项目、代码、测试，以及解决问题的过程。</p><span class="map-count">从真实的尝试开始 ↗</span></a><a class="map-card map-reading" href="/garden/?type=note"><span class="map-index">02 / THINKING</span><span class="map-icon">⌁</span><h3>阅读与思考</h3><p>在读的内容、还没想完的问题和新的联系。</p><span class="map-count">收集正在长大的想法 ↗</span></a><a class="map-card map-life" href="/journal/"><span class="map-index">03 / LIVING</span><span class="map-icon">✳</span><h3>日常生活</h3><p>值得记住的片刻，一点自己的观察。</p><span class="map-count">留个位置给下一则随记 ↗</span></a></div></section><section class="latest-band"><div class="latest-layout shell"><div class="latest-intro"><span class="section-overline">RECENTLY PLANTED <span>最近种下</span></span><h2>一些还在<br>生长的记录。</h2><p>想法会更新，笔记也会变。这里留下它们此刻的样子。</p><a class="quiet-link" href="/garden/">漫步所有笔记 ↗</a></div><div class="featured-grid">{cards}</div></div></section><section class="recent-section shell"><div class="section-heading"><div><span class="section-overline">A WALK THROUGH NOTES <span>最近更新</span></span><h2>最近留下的脚印。</h2></div><a class="quiet-link" href="/garden/">全部记录 ↗</a></div><div class="recent-list">{rows}</div></section><section class="now-card shell"><div class="now-mark">✳</div><div><span class="section-overline">A SMALL NOTE TO SELF</span><h2>慢一点也没关系，<br>花园本来就是慢慢长的。</h2><p>你可以从一则短记开始，再沿着它找到相关的文章与项目。</p></div><a class="button button-outline" href="/journal/">去看随记 ↗</a></section>'''

def garden(entries):
    categories=sorted({e['category'] for e in entries})
    chips=''.join(f'<button class="filter-chip" data-category="{esc(c)}">{esc(c)}</button>' for c in categories)
    cards=''.join(card(e) for e in entries)
    return f'''<section class="page-intro shell"><span class="section-overline">WANDER AROUND <span>花园索引</span></span><h1>沿着好奇心，<br><i>慢慢逛。</i></h1><p>这里的记录会变化。有的已经整理成文章，有的还在生长。</p><div class="garden-stats"><span><b>{len(entries):02d}</b> 则公开记录</span><span><b>{len(categories):02d}</b> 个主题角落</span><span>✳ 随时可以回来补充</span></div></section>
    <section class="garden-list shell" aria-label="笔记列表"><div class="filter-bar"><div class="filter-group" aria-label="内容类型"><button class="filter-chip is-selected" data-type="all" aria-pressed="true">全部</button><button class="filter-chip" data-type="article" aria-pressed="false">长文</button><button class="filter-chip" data-type="note" aria-pressed="false">短记</button><button class="filter-chip" data-type="essay" aria-pressed="false">花园手记</button><button class="filter-chip" data-type="journal" aria-pressed="false">随记</button></div><button class="filter-toggle" type="button" aria-expanded="false" aria-controls="category-filters">筛选主题 ＋</button></div>
    <div class="category-filters" id="category-filters" hidden>{chips}</div>
    <div class="garden-tools"><span id="filter-summary" role="status" aria-live="polite">显示全部 {len(entries)} 则记录</span><label for="stage-filter">生长状态 <select id="stage-filter"><option value="all">全部</option><option value="seedling">幼苗</option><option value="growing">生长中</option><option value="evergreen">常青</option></select></label><button type="button" class="reset-filters" hidden>清除筛选 ×</button></div>
    <div class="garden-grid" id="garden-grid">{cards}</div><div class="empty-filter" hidden>这个角落还没有公开笔记。试试其他筛选，或者过段时间再来看看。</div></section>'''

def article(entry,entries):
    related=[]
    for e in entries:
        if e['slug']==entry['slug']:continue
        score=len(set(e.get('tags',[]))&set(entry.get('tags',[])))
        if entry.get('project') and e.get('project')==entry['project']:score+=3
        if score:related.append((score,e))
    related.sort(key=lambda x:(x[0],x[1]['date']),reverse=True)
    rel=''.join(f'<a class="related-link" href="{route(e["slug"])}"><span>{esc(e["category"])}</span>{esc(e["title"])} <b>↗</b></a>' for _,e in related[:3])
    if not rel:
        rel = f'<a class="related-link" href="/garden/"><span>花园索引</span>沿着其他主题继续走 <b>↗</b></a>'
    typ={'article':'长文','note':'短记','essay':'花园手记','journal':'随记'}.get(entry['type'],'笔记')
    toc = f'<aside class="article-toc" aria-label="文章目录"><span>这篇笔记</span>{entry["toc"]}</aside>' if '<li>' in entry['toc'] else '<aside></aside>'
    backlinks = [e for e in entries if e['slug'] != entry['slug'] and route(entry['slug']) in e['links']]
    incoming = ''.join(f'<a href="{route(e["slug"])}">{esc(e["title"])} ↗</a>' for e in backlinks)
    incoming_html = f'<div class="backlinks"><div class="section-overline">哪些笔记走到了这里</div>{incoming}</div>' if incoming else ''
    project = f'<a class="inline-project" href="/projects/{esc(entry["project"])}/">看看关联项目 ↗</a>' if entry.get('project') else ''
    if entry.get('series'):
        series_id=entry['series']
        series_name=json.loads((CONTENT/'site.json').read_text())['series'][series_id]['title']
        project += f'<a class="inline-project" href="/series/{esc(series_id)}/">专题：{esc(series_name)} ↗</a>'
    return f'''<section class="article-top shell"><a class="back-link" href="/garden/">← 回到花园</a><div class="article-heading"><span class="eyebrow">{esc(entry['category'])} · {typ}</span><h1>{esc(entry['title'])}</h1><p class="article-deck">{esc(entry['summary'])}</p>{meta(entry)}</div></section>
    <div class="article-layout shell">{toc}<article class="prose" data-article-body>{entry['html']}<div class="article-end"><span>✳</span><p>记于 {esc(entry['date'])} · {esc(entry.get('updated',entry['date']))} 更新</p><button class="copy-page-link" type="button">复制链接 ↗</button></div>{project}{incoming_html}<div class="related"><div class="section-overline">继续散步 <span>RELATED NOTES</span></div>{rel}</div></article></div>'''

def project_records():
    records = []
    for path in sorted((CONTENT/'projects').glob('*.md')):
        project, body = read_markdown(path)
        renderer = markdown.Markdown(extensions=['extra', 'toc'])
        project['html'] = renderer.convert(body)
        project['toc'] = renderer.toc
        project['slug'] = path.stem
        records.append(project)
    return records


def project_card(project, number):
    slug = esc(project['slug'])
    return f"""<article class="project-card">
      <a class="project-visual" href="/projects/{slug}/"><img src="{esc(project['image'])}" alt="{esc(project['image_alt'])}" loading="lazy" width="900" height="510"><span class="project-number">{number:02d} / FIELD NOTE</span></a>
      <div class="project-info"><div class="project-status"><span class="live-dot"></span>{esc(project['status'])} · {esc(project['label'])}</div><h2><a href="/projects/{slug}/">{esc(project['title'])}</a></h2><p>{esc(project['summary'])}</p><div class="project-links"><a href="/projects/{slug}/">项目笔记 ↗</a><a href="{esc(project['repository'])}">GitHub ↗</a></div></div></article>"""


def projects(entries):
    cards = ''.join(project_card(p, i+1) for i,p in enumerate(project_records()))
    return f"""<section class="page-intro shell"><span class="section-overline">THINGS I HAVE BEEN MAKING</span><h1>一些在做的<br><i>小东西。</i></h1><p>渲染器、实验脚本、数据工具。把代码背后的问题与过程也记下来。</p></section><section class="projects-grid shell">{cards}</section><section class="project-note shell"><a class="quiet-link" href="/projects/repositories/">查看全部公开仓库与学习足迹 ↗</a></section>"""


def project_detail(slug,entries):
    project = next(p for p in project_records() if p['slug']==slug)
    facts = ''.join(f'<div><span>{esc(k)}</span><b>{esc(v)}</b></div>' for k,v in project['facts'])
    related = ''.join(f'<a class="project-note-link" href="{route(e["slug"])}">{esc(e["title"])} ↗</a>' for e in entries if e.get('project')==slug)
    body = f"""<section class="project-hero shell"><a class="back-link" href="/projects/">← 回到项目</a><div class="project-hero-copy"><span class="section-overline">{esc(project['label'])}</span><h1>{esc(project['title'])}</h1><p>{esc(project['summary'])}</p><a class="button button-dark" href="{esc(project['repository'])}">查看公开仓库 ↗</a></div></section>
    <section class="project-facts shell">{facts}</section>
    <figure class="project-screenshot shell"><img src="{esc(project['image'])}" alt="{esc(project['image_alt'])}" width="900" height="510"><figcaption>{esc(project['image_alt'])}</figcaption></figure>
    <section class="project-detail-layout shell"><aside class="article-toc" aria-label="项目目录"><span>项目地图</span>{project['toc']}</aside><article class="prose">{project['html']}<div class="related"><div class="section-overline">相关笔记 <span>GARDEN PATH</span></div>{related}</div></article></section>"""
    return page(project['title'],body,project['summary'],'projects')


def repository_directory():
    data = json.loads((CONTENT/'repositories.json').read_text(encoding='utf-8'))
    groups = []
    for category in dict.fromkeys(r['group'] for r in data['repositories']):
        repos = [r for r in data['repositories'] if r['group']==category]
        rows = ''.join(f'<li><a href="{esc(r["url"])}"><strong>{esc(r["name"])}</strong><span>{esc(r["summary"])}</span><i>↗</i></a></li>' for r in repos)
        groups.append(f'<section class="repo-group"><h2>{esc(category)} <small>{len(repos):02d}</small></h2><ul>{rows}</ul></section>')
    body = f"""<section class="page-intro shell"><a class="back-link" href="/projects/">← 回到项目</a><h1>公开仓库，<br><i>学习足迹。</i></h1><p>这里也放练习、资料、fork 与早期尝试。仓库只是一个入口，整理好的内容会慢慢长成项目笔记。</p><span class="section-overline">整理于 {esc(data['updated'])} · {len(data['repositories'])} 个公开仓库</span></section><div class="repository-directory shell">{''.join(groups)}</div>"""
    return page('公开仓库与学习足迹',body,'SubmergePSC 公开仓库目录，包含项目、练习、工具和上游 fork。','projects')


def archive(entries):
    months = sorted({e['date'][:7] for e in entries}, reverse=True)
    sections=[]
    for month in months:
        rows=''.join(f'<li><time datetime="{e["date"]}">{e["date"][5:]}</time><a href="{route(e["slug"])}">{esc(e["title"])}</a><span>{esc(e["category"])}</span></li>' for e in entries if e['date'].startswith(month))
        sections.append(f'<section><h2>{month}</h2><ul class="archive-list">{rows}</ul></section>')
    return page('归档', '<section class="page-intro shell"><span class="section-overline">THROUGH THE SEASONS</span><h1>时间留下的，<br><i>一页一页。</i></h1><p>按首次整理发布的月份回看。文中提及的历史事件另有日期。</p></section><div class="archive shell">'+''.join(sections)+'</div>','按月份浏览数字花园。')


def series_pages(site, entries):
    pages={}
    groups=[]
    for slug, series in site['series'].items():
        notes=sorted([e for e in entries if e.get('series')==slug],key=lambda e:e['slug'])
        if not notes:
            continue
        intro=f'<section class="page-intro shell"><a class="back-link" href="/series/">← 全部专题</a><h1>{esc(series["title"])}</h1><p>{esc(series["summary"])}</p><span class="section-overline">{len(notes)} 则笔记 · 持续整理</span></section>'
        cards=''.join(card(e) for e in notes)
        pages[f'series/{slug}/index.html']=page(series['title'],intro+'<section class="garden-grid shell series-grid">'+cards+'</section>',series['summary'])
        groups.append(f'<a class="series-card" href="/series/{slug}/"><span class="section-overline">{len(notes):02d} NOTES</span><h2>{esc(series["title"])}</h2><p>{esc(series["summary"])}</p><b>沿这条小路走走 ↗</b></a>')
    pages['series/index.html']=page('专题','<section class="page-intro shell"><span class="section-overline">FOLLOW A THREAD</span><h1>顺着一条线索，<br><i>继续探索。</i></h1><p>把相关笔记放在一起，从一个问题走向下一个问题。</p></section><section class="series-list shell">'+''.join(groups)+'</section>','数字花园中的主题阅读路线。')
    return pages


def validate_output():
    documents = {}
    for path in OUT.rglob('*.html'):
        document = Document()
        document.feed(path.read_text(encoding='utf-8'))
        documents[path.resolve()] = document
    errors = []
    for path, document in documents.items():
        for reference in document.references:
            parsed = urlparse(reference)
            if parsed.scheme or parsed.netloc:
                continue
            target = (OUT / unquote(parsed.path).lstrip('/')) if parsed.path.startswith('/') else path.parent / unquote(parsed.path) if parsed.path else path
            if target.is_dir():
                target = target/'index.html'
            target = target.resolve()
            if not target.is_relative_to(OUT.resolve()) or not target.is_file():
                errors.append(f'{path.relative_to(OUT)}: missing target {reference}')
            elif parsed.fragment and target in documents and unquote(parsed.fragment) not in documents[target].ids:
                errors.append(f'{path.relative_to(OUT)}: missing heading {reference}')
    for name in ('rss.xml', 'sitemap.xml'):
        ElementTree.parse(OUT/name)
    if errors:
        raise ValueError('Public output has invalid links:\n'+'\n'.join(errors))

def main():
    site,entries,excluded=load()
    if OUT.is_symlink():
        raise ValueError('Refusing to replace a symlinked output directory')
    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(ROOT/'assets', OUT/'assets')
    tool_assets = OUT/'tools/assets'
    tool_assets.mkdir(parents=True)
    for name in ('toolbox.css', 'toolbox.js'):
        shutil.copy2(ROOT/'tools'/name, tool_assets/name)
    home_body = home(site,entries)
    home_body = home_body.replace(esc(site['tagline']), '<span class="hero-line">把学到的、</span><span class="hero-line">想到的、经历的，</span><span class="hero-line">慢慢留下来。</span>')
    home_body = home_body.replace('/garden/?type=article', '/garden/?topic=tech').replace('/garden/?type=note', '/garden/?topic=thinking')
    home_body = home_body.replace('01 / 06', 'always growing')
    # A real project path is available from the homepage as well as the top nav.
    showcase = '<section class="home-projects shell"><div class="section-heading"><div><span class="section-overline">FROM THE WORKBENCH <span>项目笔记</span></span><h2>想法，也长成了一些小东西。</h2></div><a class="quiet-link" href="/projects/">全部项目 ↗</a></div><div class="projects-grid">' + ''.join(project_card(p,i+1) for i,p in enumerate(project_records()[:2])) + '</div></section>'
    home_body = home_body.replace('<section class="now-card shell">', showcase+'<section class="now-card shell">')
    home_body = home_body.replace('<a class="button button-outline" href="/journal/">去看随记 ↗</a>', '<a class="button button-outline" href="/now/">此刻在做什么 ↗</a>')
    routes={'index.html':page('数字花园',home_body,site['subtitle'],'home')}
    routes['garden/index.html']=page('漫步花园',garden(entries),'沿着主题与好奇心，浏览公开的技术实践与笔记。')
    journal='<section class="journal-intro shell"><span class="section-overline">THE FIELD NOTES <span>随手记下的日常</span></span><div class="journal-hero"><div><h1>生活不是<br><i>项目进度表。</i></h1><p>有些片刻不需要一个结论，只需要被认真记住。</p></div><div class="journal-sketch"><span>today</span><i></i><b></b><em>✳</em></div></div></section><section class="journal-empty shell"><div class="empty-art"><span>✳</span><i></i><b></b></div><div class="empty-copy"><span class="section-overline">A SPACE TO GROW</span><h2>这里先留一块空地。</h2><p>等第一则愿意分享的日常来到，随记会从这里开始。花园的其他角落已经有一些技术实践与正在生长的想法。</p><a class="button button-dark" href="/garden/">先去逛逛花园 ↗</a></div></section>'
    routes['journal/index.html']=page('随记',journal,'留出一片空地给日常片段与阅读随记。','journal')
    journals=[e for e in entries if e['type']=='journal']
    if journals:
        journal_intro='<section class="page-intro shell"><span class="section-overline">THE FIELD NOTES</span><h1>留下一点，<br><i>日常的温度。</i></h1><p>值得记住的片刻与自己的观察。</p></section>'
        routes['journal/index.html']=page('随记',journal_intro+'<section class="garden-grid shell series-grid">'+''.join(card(e) for e in journals)+'</section>','日常片段与阅读随记。','journal')
    routes['projects/index.html']=page('项目',projects(entries),'从真实代码、公开仓库与工程记录出发的项目笔记。','projects')
    about=f'<section class="page-intro shell"><span class="section-overline">ABOUT THE GARDENER</span><h1>你好，我是<br><i>{esc(site["author"])}。</i></h1><p>{esc(site["subtitle"])} 我会记录技术实践、阅读、日常和还在生长的想法。</p></section><section class="about-body shell"><article class="prose"><h2>这座花园</h2><p>有些记录已经整理成文章，有些还只是一个起点。技术实践会从 MoonBit、Agent、Linux 工具与实验项目展开；阅读和日常则等真实片段慢慢加入。</p><h2>如何阅读</h2><p>可以沿主题探索，也可以从最近的记录开始。知识笔记会继续修订，随记保留发生时的视角。</p><div class="about-links"><a href="/garden/">逛逛花园 ↗</a><a href="{esc(site["github"])}" target="_blank" rel="noreferrer">GitHub ↗</a></div></article><aside class="about-aside"><span>GARDEN RULE NO. 01</span><p>先把真实的东西种下来。</p><i>✳</i></aside></section>'
    routes['about/index.html']=page('关于',about,'SubmergePSC 数字花园的园丁介绍。','about')
    now='<section class="page-intro shell"><span class="section-overline">NOW · 2026-11</span><h1>此刻，<br><i>还在路上。</i></h1><p>我在搭建这座数字花园，也从真实的技术实践里挑选值得留下的记录。</p></section><section class="now-content shell"><article><span class="section-overline">正在整理</span><h2>把分散的笔记，慢慢变成可以散步的花园。</h2><p>第一批内容来自 Markdown 渲染器、Agent 实验、Linux 工具排查和数据绘图工作流。阅读与日常随记会等合适的真实片段出现后再加入。</p></article><aside>这页由园丁手动维护<br><span>上次更新 · 2026-11-05</span></aside></section>'
    routes['now/index.html']=page('近况',now,'SubmergePSC 当前关注的项目与想法。')
    search='<section class="page-intro shell"><span class="section-overline">FIND A PATH</span><h1>在花园里<br><i>找一找。</i></h1><p>搜索标题、摘要与标签。</p><form class="search-form" id="search-form"><label class="sr-only" for="search-input">搜索花园</label><input id="search-input" type="search" placeholder="试试 Markdown、Obsidian、Agent…"><button class="button button-dark">搜索 ↗</button></form><p class="search-hint" id="search-hint">输入关键词开始搜索。</p><div class="search-results" id="search-results"></div></section>'
    search = search.replace('搜索标题、摘要与标签。', '搜索全文、标题与标签。多个关键词用空格分开。').replace('id="search-hint"','id="search-hint" role="status" aria-live="polite"').replace('id="search-results"','id="search-results" aria-label="搜索结果"')
    routes['search/index.html']=page('搜索花园',search,'全文搜索 SubmergePSC 数字花园中的公开笔记。')
    for e in entries:routes[f'articles/{e["slug"]}/index.html']=page(e['title'],article(e,entries),e['summary'])
    for project in project_records():
        slug=project['slug']
        routes[f'projects/{slug}/index.html']=project_detail(slug,entries)
    routes['projects/repositories/index.html']=repository_directory()
    routes['archive/index.html']=archive(entries)
    routes.update(series_pages(site,entries))
    routes.update(toolbox_pages(page))
    routes['404.html']=page('走错了一个岔路','<section class="not-found shell"><span>404 · A LITTLE DETOUR</span><h1>这条小路<br><i>还没有长出来。</i></h1><p>也许它还在整理中，或者路标换了位置。</p><a class="button button-dark" href="/">回到花园 ↗</a></section>','返回数字花园。')
    for name,body in routes.items():
        public_path = '/' if name=='index.html' else '/'+name.removesuffix('index.html')
        canonical = BASE+public_path
        extra = f'<link rel="canonical" href="{esc(canonical)}"><meta property="og:url" content="{esc(canonical)}"><meta property="og:locale" content="zh_CN"><meta property="og:type" content="{"article" if name.startswith("articles/") else "website"}">'
        if name=='404.html' or name=='search/index.html':
            extra += '<meta name="robots" content="noindex,follow">'
        if name.startswith('articles/'):
            entry = next(e for e in entries if name==f'articles/{e["slug"]}/index.html')
            structured = {'@context':'https://schema.org','@type':'BlogPosting','headline':entry['title'],'description':entry['summary'],'datePublished':entry['date']+'T00:00:00+08:00','dateModified':entry.get('updated',entry['date'])+'T00:00:00+08:00','author':{'@type':'Person','name':site['author'],'url':BASE+'/about/'},'mainEntityOfPage':canonical}
            extra += '<script type="application/ld+json">'+json.dumps(structured,ensure_ascii=False).replace('<','\\u003c')+'</script>'
        body=body.replace('</head>',extra+'</head>')
        body=body.replace('<a href="/rss.xml">RSS</a>', '<a href="/tools/">工具箱</a><a href="/series/">专题</a><a href="/archive/">归档</a><a href="/now/">近况</a><a href="/rss.xml">RSS</a>')
        body=body.replace('生活不是<br><i>项目进度表。</i>', '留下一点，<br><i>日常的温度。</i>')
        body=body.replace("if(t)document.documentElement.dataset.theme=t", "document.documentElement.dataset.theme=t||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')")
        path=OUT/name
        path.parent.mkdir(parents=True,exist_ok=True)
        path.write_text(body,encoding='utf-8')
    search_data=[{k:e[k] for k in ['title','summary','category','tags','date','text']}|{'href':route(e['slug'])} for e in entries]
    search_data.extend(toolbox_search_entries())
    (OUT/'search-index.json').write_text(json.dumps(search_data,ensure_ascii=False,indent=2)+'\n')
    rss=''.join(f'<item><title>{esc(e["title"])}</title><link>{BASE}{route(e["slug"])}</link><guid>{BASE}{route(e["slug"])}</guid><pubDate>{format_datetime(datetime.strptime(e["date"],"%Y-%m-%d").replace(tzinfo=timezone.utc))}</pubDate><description>{esc(e["summary"])}</description></item>' for e in entries)
    (OUT/'rss.xml').write_text(f'<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>{esc(site["brand"])} · 数字花园</title><link>{BASE}/</link><description>{esc(site["subtitle"])}</description><language>zh-cn</language>{rss}</channel></rss>',encoding='utf-8')
    paths=['/' if name=='index.html' else '/'+name.removesuffix('index.html') for name in routes if name not in ['404.html','search/index.html']]
    (OUT/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join(f'<url><loc>{BASE}{p}</loc></url>' for p in paths)+'</urlset>',encoding='utf-8')
    (OUT/'robots.txt').write_text(f'User-agent: *\nAllow: /\nSitemap: {BASE}/sitemap.xml\n')
    (OUT/'.nojekyll').touch()
    validate_output()
    print(json.dumps({'public_entries':len(entries),'excluded_entries':excluded,'html_files':sum(1 for _ in OUT.rglob('*.html')),'routes':len(routes),'output':str(OUT)},ensure_ascii=False,indent=2))

if __name__=='__main__':main()
