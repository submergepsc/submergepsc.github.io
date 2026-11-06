"""Render /tools/ and individual utility pages with the site's shared layout."""

import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def esc(value):
    return html.escape(str(value), quote=True)


def catalog():
    tools = json.loads((ROOT / 'catalog.json').read_text(encoding='utf-8'))
    slugs = [tool['slug'] for tool in tools]
    if len(set(slugs)) != len(slugs) or any(not re.fullmatch(r'[a-z][a-z0-9]*(?:-[a-z0-9]+)*', slug) for slug in slugs):
        raise ValueError('Invalid toolbox slug')
    return tools


def card(tool):
    search = ' '.join([tool['title'], tool['description'], *tool['keywords']])
    return f'''<a class="tool-card" href="/tools/{esc(tool['slug'])}/" data-category="{esc(tool['category'])}" data-search="{esc(search)}">
      <span class="tool-card-top"><span class="tool-mark" aria-hidden="true">{esc(tool['mark'])}</span><span class="tool-category">{esc(tool['category'])}</span></span>
      <h2>{esc(tool['title'])}</h2><p>{esc(tool['description'])}</p><span class="tool-card-link">打开工具 <b aria-hidden="true">↗</b></span></a>'''


def editor_pair(hint, options='', buttons='', placeholder='在这里粘贴要处理的内容…'):
    return f'''<p class="tool-hint">{hint}</p>{options}
      <div class="tool-editors"><div class="tool-editor"><label for="tool-input">输入</label><textarea id="tool-input" autocomplete="off" spellcheck="false" placeholder="{esc(placeholder)}"></textarea></div>
      <div class="tool-editor"><label for="tool-output">结果</label><textarea id="tool-output" readonly spellcheck="false" placeholder="处理结果显示在这里"></textarea></div></div>
      <div class="tool-actions">{buttons}<button class="tool-button" type="button" data-action="example">填入示例</button><button class="tool-button" type="button" data-action="copy">复制结果</button><button class="tool-button tool-button-quiet" type="button" data-action="clear">清空</button></div>'''


def utility(tool):
    slug = tool['slug']
    if slug == 'github-image':
        options = '''<div class="tool-options github-image-options">
          <label for="image-host">链接类型 <select id="image-host"><option value="raw">GitHub 原图（raw）</option><option value="jsdelivr">jsDelivr CDN</option></select></label>
          <label for="image-format">输出格式 <select id="image-format"><option value="url">图片链接</option><option value="markdown">Markdown 图片</option><option value="html">HTML 图片</option></select></label>
          <label for="image-alt">图片说明 <input id="image-alt" type="text" autocomplete="off" placeholder="留空使用文件名"></label></div>
          <details class="github-image-advanced"><summary>分支或标签名包含 /</summary><label for="image-ref">完整分支或标签名（可选）</label><input id="image-ref" type="text" autocomplete="off" placeholder="例如 feature/images"><p>只有分支或标签名含 / 时需要填写。批量转换时，所有链接应使用这个分支或标签。</p></details>'''
        return editor_pair('每行一个链接，支持 GitHub 文件页（blob）、raw 地址与 jsDelivr 地址。适用于公开仓库：这里只转换地址，不上传图片或检查文件是否存在。',
            options,
            '<button class="tool-button tool-button-primary" type="button" data-action="convert">生成图片链接</button>',
            'https://github.com/submergepsc/moonbit/blob/main/image.png')
    if slug == 'json':
        return editor_pair('按标准 JSON 校验。格式化保留键顺序、重复键与数字原始写法；支持最多 256 层嵌套。',
            '<div class="tool-options"><label for="json-indent">缩进 <select id="json-indent"><option value="2">2 空格</option><option value="4">4 空格</option></select></label></div>',
            '<button class="tool-button tool-button-primary" type="button" data-action="format">格式化</button><button class="tool-button" type="button" data-action="minify">压缩</button>',
            '{"hello":"世界"}')
    if slug == 'base64':
        return editor_pair('文本按 UTF-8 编解码。解码忽略空白；结果必须是有效的 UTF-8 文本。URL 安全格式编码时省略尾部补位符。',
            '<div class="tool-options"><label for="base64-variant">格式 <select id="base64-variant"><option value="standard">标准 Base64</option><option value="url">URL 安全 Base64</option></select></label></div>',
            '<button class="tool-button tool-button-primary" type="button" data-action="encode">编码 →</button><button class="tool-button" type="button" data-action="decode">← 解码</button>')
    if slug == 'url':
        return editor_pair('针对单个 URL 参数值使用 encodeURIComponent / decodeURIComponent。解码时加号 + 保持原样。',
            buttons='<button class="tool-button tool-button-primary" type="button" data-action="encode">编码 →</button><button class="tool-button" type="button" data-action="decode">← 解码</button>')
    if slug == 'line-cleaner':
        return editor_pair('按行去重并保留第一次出现的内容；可选择去空白、去空行和自然排序。',
            '<div class="tool-options tool-checkboxes"><label><input type="checkbox" id="trim-lines" checked>去除首尾空白</label><label><input type="checkbox" id="drop-empty" checked>去除空行</label><label><input type="checkbox" id="ignore-case">忽略大小写</label><label for="line-order">顺序 <select id="line-order"><option value="original">保留原顺序</option><option value="asc">自然升序</option><option value="desc">自然降序</option></select></label></div>',
            '<button class="tool-button tool-button-primary" type="button" data-action="clean">整理文本</button>')
    if slug == 'text-stats':
        metrics = [('codepoints', '字符数（码点）'), ('graphemes', '字素（视觉字符）'), ('nonspace', '非空白字符'), ('lines', '行数（含空行）'), ('bytes', 'UTF-8 字节数'), ('words', '词段')]
        metrics_html = ''.join(f'<div><dt>{label}</dt><dd id="metric-{name}">0</dd></div>' for name, label in metrics)
        return f'''<p class="tool-hint">输入后实时统计。字素按浏览器 Unicode 分段计算；词段按浏览器中文分词计算。末尾换行会增加一行。</p>
          <div class="tool-editor"><label for="tool-input">要统计的文本</label><textarea id="tool-input" autocomplete="off" spellcheck="false" placeholder="粘贴文字，看看它由多少字符组成…"></textarea></div>
          <dl class="tool-metrics">{metrics_html}</dl><div class="tool-actions"><button class="tool-button" type="button" data-action="example">填入示例</button><button class="tool-button" type="button" data-action="copy">复制统计</button><button class="tool-button tool-button-quiet" type="button" data-action="clear">清空</button></div>'''
    if slug == 'timestamp':
        return '''<p class="tool-hint">明确选择秒或毫秒。秒支持最多三位小数，毫秒使用整数；支持 1970 年以前的负时间戳。</p>
          <div class="time-tool-grid"><section class="time-tool-panel" aria-labelledby="epoch-heading"><h2 id="epoch-heading">时间戳 → 日期</h2><label for="epoch-input">Unix 时间戳</label><div class="tool-input-row"><input id="epoch-input" type="text" inputmode="decimal" placeholder="1700000000"><label class="sr-only" for="epoch-unit">时间戳单位</label><select id="epoch-unit"><option value="seconds">秒</option><option value="milliseconds">毫秒</option></select></div>
          <div class="tool-actions"><button class="tool-button tool-button-primary" type="button" data-action="to-date">转为日期</button><button class="tool-button" type="button" data-action="now">当前时间</button></div>
          <div class="tool-editor"><label for="date-output">日期结果</label><textarea id="date-output" rows="4" readonly placeholder="UTC 与本地时间"></textarea></div><button class="tool-button" type="button" data-action="copy-date">复制日期</button></section>
          <section class="time-tool-panel" aria-labelledby="date-heading"><h2 id="date-heading">日期 → 时间戳</h2><label for="date-input">日期与时间</label><input id="date-input" type="datetime-local" step="1"><label for="date-zone">以哪个时区解释输入</label><select id="date-zone"><option value="local">浏览器本地时区</option><option value="utc">UTC</option></select><p class="tool-zone" id="local-zone"></p>
          <div class="tool-actions"><button class="tool-button tool-button-primary" type="button" data-action="to-epoch">转为时间戳</button></div><div class="tool-editor"><label for="epoch-output">时间戳结果</label><textarea id="epoch-output" rows="4" readonly placeholder="秒与毫秒"></textarea></div><button class="tool-button" type="button" data-action="copy-epoch">复制时间戳</button></section></div>
          <div class="tool-actions"><button class="tool-button" type="button" data-action="example">填入示例</button><button class="tool-button tool-button-quiet" type="button" data-action="clear">清空</button></div>'''
    raise ValueError(f'No interface for tool {slug}')


def build_pages(page):
    tools = catalog()
    categories = list(dict.fromkeys(tool['category'] for tool in tools))
    categories_html = ''.join(f'<button type="button" class="filter-chip" data-tool-category="{esc(name)}" aria-pressed="false">{esc(name)}</button>' for name in categories)
    intro = f'''<section class="page-intro shell toolbox-intro"><span class="section-overline">THE WORKBENCH <span>随手可用的小工具</span></span><h1>把小问题，<br><i>顺手解决。</i></h1><p>整理文本、处理数据和转换格式。输入在当前浏览器中处理，不发送到服务器。</p><div class="toolbox-toolbar"><label class="sr-only" for="tool-search">查找工具</label><input id="tool-search" type="search" placeholder="查找工具，例如 JSON、时间戳…"><div class="tool-category-filters" aria-label="工具分类"><button type="button" class="filter-chip is-selected" data-tool-category="all" aria-pressed="true">全部</button>{categories_html}</div></div></section>
      <section class="tool-directory shell" id="tool-directory" aria-label="工具目录">{''.join(card(tool) for tool in tools)}</section><p class="tool-empty shell" hidden>没有找到匹配的工具，试试其他关键词或分类。</p><div class="tool-directory-footer shell"><span id="tool-count" role="status" aria-live="polite">{len(tools)} 个工具</span><span>输入不会写入网址或本地存储</span></div>'''
    routes = {'tools/index.html': page('工具箱', intro, '图片直链、JSON、编码、时间戳与文本工具，在浏览器中直接使用。', 'tools')}
    for tool in tools:
        others = ''.join(f'<a href="/tools/{esc(other["slug"])}/">{esc(other["title"])} ↗</a>' for other in tools if other['slug'] != tool['slug'])
        body = f'''<section class="tool-page-heading shell"><a class="back-link" href="/tools/">← 全部工具</a><span class="section-overline">{esc(tool['category'])} · TOOLBOX</span><h1>{esc(tool['title'])}</h1><p>{esc(tool['description'])}</p></section>
          <section class="tool-workspace shell" data-tool="{esc(tool['slug'])}" aria-label="{esc(tool['title'])}">{utility(tool)}<p id="tool-status" class="tool-status" role="status" aria-live="polite">在当前浏览器处理，不上传输入内容。</p></section>
          <aside class="other-tools shell" aria-label="其他工具"><h2>还可以用这些</h2><div>{others}</div></aside>'''
        routes[f'tools/{tool["slug"]}/index.html'] = page(tool['title'], body, tool['description'], 'tools')
    assets = '<link rel="stylesheet" href="/tools/assets/toolbox.css"><script src="/tools/assets/toolbox.js" defer></script>'
    return {path: html.replace('</head>', assets+'</head>') for path, html in routes.items()}


def search_entries():
    return [{'title': tool['title'], 'summary': tool['description'], 'category': '工具箱',
             'tags': tool['keywords'], 'date': '在线工具', 'text': tool['description'],
             'href': '/tools/'+tool['slug']+'/'} for tool in catalog()]
