(() => {
  'use strict';
  const search = document.querySelector('#tool-search');
  if (search) {
    const cards = [...document.querySelectorAll('#tool-directory .tool-card')];
    let category = 'all';
    const filter = () => {
      const terms = search.value.normalize('NFKC').toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
      let shown = 0;
      for (const card of cards) {
        const haystack = card.dataset.search.normalize('NFKC').toLocaleLowerCase();
        card.hidden = !(category === 'all' || card.dataset.category === category) || !terms.every(term => haystack.includes(term));
        if (!card.hidden) shown++;
      }
      document.querySelector('.tool-empty').hidden = shown > 0;
      document.querySelector('#tool-count').textContent = `${shown} / ${cards.length} 个工具`;
    };
    search.addEventListener('input', filter);
    document.querySelectorAll('button[data-tool-category]').forEach(button => button.addEventListener('click', () => {
      category = button.dataset.toolCategory;
      document.querySelectorAll('button[data-tool-category]').forEach(other => {
        const selected = other === button;
        other.classList.toggle('is-selected', selected);
        other.setAttribute('aria-pressed', String(selected));
      });
      filter();
    }));
  }

  const workspace = document.querySelector('[data-tool]');
  if (!workspace) return;
  const tool = workspace.dataset.tool;
  const input = document.querySelector('#tool-input');
  const output = document.querySelector('#tool-output');
  const status = document.querySelector('#tool-status');
  const encoder = new TextEncoder();
  const say = (text, error = false) => {
    status.textContent = text;
    status.classList.toggle('is-error', error);
  };
  const fail = message => { throw new Error(message); };
  const checkSize = text => {
    if (text.length > 1048576) fail('输入过长，请分批处理。');
  };
  const copy = async text => {
    if (!text) { say('还没有可复制的结果。'); return; }
    try {
      await navigator.clipboard.writeText(text);
      say('已复制到剪贴板。');
    } catch (_) {
      say('无法自动复制，请在结果框中选中并复制。', true);
    }
  };

  function githubImageUrl(source, target, override) {
    let text = source.trim();
    if (text.startsWith('<') && text.endsWith('>')) text = text.slice(1, -1).trim();
    if (/^(?:www\.)?github\.com\//i.test(text) || /^(?:raw\.githubusercontent\.com|cdn\.jsdelivr\.net)\//i.test(text)) text = 'https://' + text;
    let address;
    try { address = new URL(text); }
    catch (_) { fail('请输入完整的 GitHub 图片文件链接。'); }
    if (!['https:', 'http:'].includes(address.protocol) || address.username || address.password || address.port) {
      fail('请使用不含登录信息的 GitHub HTTPS 文件链接。');
    }
    let parts;
    try { parts = address.pathname.slice(1).split('/').map(part => decodeURIComponent(part)); }
    catch (_) { fail('链接中有无效的百分号编码，请重新复制文件链接。'); }

    const host = address.hostname.toLowerCase();
    let owner, repo, pathParts, ref = '', namespace = '';
    if (host === 'github.com' || host === 'www.github.com') {
      [owner, repo] = parts;
      if (!['blob', 'raw'].includes(parts[2])) fail('需要图片的文件页链接（包含 /blob/ 或 /raw/），不能使用仓库首页或目录页。');
      pathParts = parts.slice(3);
    } else if (host === 'raw.githubusercontent.com') {
      [owner, repo] = parts;
      pathParts = parts.slice(2);
    } else if (host === 'cdn.jsdelivr.net') {
      if (parts[0] !== 'gh') fail('需要 jsDelivr 的 GitHub 地址，格式为 /gh/用户/仓库@版本/路径。');
      owner = parts[1];
      const repoAndRef = parts[2] || '';
      const separator = repoAndRef.indexOf('@');
      if (separator < 1 || separator === repoAndRef.length - 1) fail('CDN 链接需要明确版本，例如 仓库@main/图片.png。');
      repo = repoAndRef.slice(0, separator);
      ref = repoAndRef.slice(separator + 1);
      pathParts = parts.slice(3);
    } else {
      fail('仅支持 github.com、raw.githubusercontent.com 或 cdn.jsdelivr.net 的 GitHub 文件链接。');
    }
    if (!owner || !repo || !/^[A-Za-z0-9_-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo)) fail('链接缺少有效的用户或仓库名称。');
    if (!ref) {
      if (pathParts[0] === 'refs' && ['heads', 'tags'].includes(pathParts[1])) {
        namespace = pathParts.slice(0, 2).join('/') + '/';
        pathParts = pathParts.slice(2);
      }
      if (override) {
        const tail = pathParts.join('/');
        if (!tail.startsWith(override + '/')) fail('指定分支或标签与链接不一致，请填写链接中的完整名称。');
        ref = override;
        pathParts = tail.slice(override.length + 1).split('/');
      } else {
        ref = pathParts.shift();
      }
    } else if (override && override !== ref) {
      fail('指定分支或标签与 CDN 链接中的版本不一致。');
    }
    if (!ref || !pathParts.length || pathParts.some(part => !part || part === '.' || part === '..')) fail('链接中需要包含分支（或提交）和完整图片文件路径。');
    if (ref.split('/').some(part => !part || part === '.' || part === '..') || /[\u0000-\u0020]/.test(ref)) fail('分支或标签名称无效，请检查完整名称。');
    const encode = part => encodeURIComponent(part).replace(/[!'()*]/g, char => '%' + char.charCodeAt(0).toString(16).toUpperCase());
    const path = pathParts.map(encode).join('/');
    const repository = encode(owner) + '/' + encode(repo);
    const href = target === 'jsdelivr'
      ? `https://cdn.jsdelivr.net/gh/${repository}@${encode(ref)}/${path}`
      : `https://raw.githubusercontent.com/${repository}/${namespace}${encode(ref)}/${path}`;
    return {href, filename: pathParts[pathParts.length - 1]};
  }

  function convertGithubImages(text) {
    const links = text.split(/\r?\n/).map((line, index) => ({text: line.trim(), line: index + 1})).filter(item => item.text);
    if (!links.length) fail('请先粘贴至少一个 GitHub 图片链接。');
    if (links.length > 1000) fail('一次最多转换 1000 个链接，请分批处理。');
    const target = document.querySelector('#image-host').value;
    const format = document.querySelector('#image-format').value;
    const alt = document.querySelector('#image-alt').value.trim();
    const override = document.querySelector('#image-ref').value.trim();
    const results = links.map(item => {
      let image;
      try { image = githubImageUrl(item.text, target, override); }
      catch (error) { fail(`第 ${item.line} 行：${error.message}`); }
      const description = (alt || image.filename).replace(/[\r\n]/g, ' ');
      if (format === 'markdown') return `![${description.replace(/([\\\[\]])/g, '\\$1')}](${image.href})`;
      if (format === 'html') {
        const escaped = description.replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
        return `<img src="${image.href}" alt="${escaped}">`;
      }
      return image.href;
    });
    output.value = results.join('\n');
    say(`已生成 ${results.length} 个${format === 'markdown' ? ' Markdown 图片引用' : format === 'html' ? ' HTML 图片引用' : '图片直链'}。文件可访问性由原仓库决定。`);
  }

  function jsonFormat(text, compact) {
    if (!text.trim()) fail('请先输入 JSON。');
    try { JSON.parse(text); } catch (error) { fail(`JSON 校验未通过：${error.message}`); }
    // Validate with the browser, but format original tokens so that large integers,
    // duplicate keys and exponent notation survive without serialization changes.
    const tokens = text.match(/"(?:\\.|[^"\\])*"|[{}\[\],:]|true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/g);
    let nesting = 0;
    for (const token of tokens) {
      if (token === '{' || token === '[') nesting++;
      if (token === '}' || token === ']') nesting--;
      if (nesting > 256) fail('JSON 嵌套超过 256 层，请缩小结构后再处理。');
    }
    if (compact) return tokens.join('');
    const step = Number(document.querySelector('#json-indent').value);
    let depth = 0;
    const parts = [];
    const indent = () => ' '.repeat(step * depth);
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token === '{' || token === '[') {
        parts.push(token);
        const close = token === '{' ? '}' : ']';
        if (tokens[i+1] === close) { parts.push(close); i++; }
        else {
          depth++;
          if (depth > 256) fail('JSON 嵌套超过 256 层，请缩小结构后再处理。');
          parts.push('\n', indent());
        }
      } else if (token === '}' || token === ']') {
        depth--;
        parts.push('\n', indent(), token);
      } else if (token === ',') parts.push(',\n', indent());
      else if (token === ':') parts.push(': ');
      else parts.push(token);
    }
    return parts.join('');
  }

  function encodeBase64(text) {
    const bytes = encoder.encode(text);
    const chunks = [];
    for (let offset = 0; offset < bytes.length; offset += 16384) {
      chunks.push(String.fromCharCode(...bytes.subarray(offset, offset+16384)));
    }
    let encoded = btoa(chunks.join(''));
    if (document.querySelector('#base64-variant').value === 'url') {
      encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    return encoded;
  }

  function decodeBase64(text) {
    const urlSafe = document.querySelector('#base64-variant').value === 'url';
    const clean = text.replace(/\s/g, '');
    const alphabet = urlSafe ? /^[A-Za-z0-9_-]*={0,2}$/ : /^[A-Za-z0-9+/]*={0,2}$/;
    if (!alphabet.test(clean) || clean.length % 4 === 1 || (clean.includes('=') && clean.length % 4 !== 0)) {
      fail('不是有效的 Base64。请检查所选格式、字符与末尾补位符。');
    }
    const normalized = clean.replace(/-/g, '+').replace(/_/g, '/');
    let binary;
    try { binary = atob(normalized); } catch (_) { fail('Base64 无法解码，请检查输入是否完整。'); }
    if (btoa(binary).replace(/=+$/, '') !== normalized.replace(/=+$/, '')) fail('Base64 尾部的有效位不正确。');
    try {
      return new TextDecoder('utf-8', {fatal: true, ignoreBOM: true}).decode(Uint8Array.from(binary, char => char.charCodeAt(0)));
    } catch (_) { fail('解码结果不是有效 UTF-8 文本；此工具用于文本，不用于二进制文件。'); }
  }

  function textStats(text) {
    const points = [...text];
    const hasSegmenter = typeof Intl.Segmenter === 'function';
    let graphemes = points.length;
    let words = (text.match(/\S+/gu) || []).length;
    if (hasSegmenter) {
      graphemes = 0; words = 0;
      for (const part of new Intl.Segmenter('zh-CN', {granularity: 'grapheme'}).segment(text)) graphemes++;
      for (const part of new Intl.Segmenter('zh-CN', {granularity: 'word'}).segment(text)) if (part.isWordLike) words++;
    }
    const counts = {
      codepoints: points.length,
      graphemes,
      nonspace: points.filter(char => !/\s/u.test(char)).length,
      lines: text ? text.replace(/\r\n?/g, '\n').split('\n').length : 0,
      bytes: encoder.encode(text).length,
      words,
    };
    for (const [name, value] of Object.entries(counts)) document.querySelector(`#metric-${name}`).textContent = value.toLocaleString('zh-CN');
    return counts;
  }

  function cleanLines(text) {
    if (!text) return {text: '', before: 0, after: 0};
    const lines = text.replace(/\r\n?/g, '\n').split('\n');
    const trim = document.querySelector('#trim-lines').checked;
    const drop = document.querySelector('#drop-empty').checked;
    const ignoreCase = document.querySelector('#ignore-case').checked;
    const seen = new Set();
    const result = [];
    for (let line of lines) {
      if (trim) line = line.trim();
      if (drop && !line.trim()) continue;
      const key = ignoreCase ? line.toLowerCase() : line;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(line);
    }
    const order = document.querySelector('#line-order').value;
    if (order !== 'original') {
      result.sort((a,b) => a.localeCompare(b, 'zh-CN', {numeric: true}));
      if (order === 'desc') result.reverse();
    }
    return {text: result.join('\n'), before: lines.length, after: result.length};
  }

  function epochMilliseconds(raw, unit) {
    const text = raw.trim();
    if (text.length > 32) fail('时间戳过长，请检查输入和单位。');
    if (unit === 'seconds' ? !/^[+-]?\d+(?:\.\d{1,3})?$/.test(text) : !/^[+-]?\d+$/.test(text)) {
      fail(unit === 'seconds' ? '请输入秒时间戳，最多保留三位小数。' : '请输入整数毫秒时间戳。');
    }
    const sign = text.startsWith('-') ? -1n : 1n;
    const [whole, fraction = ''] = text.replace(/^[+-]/, '').split('.');
    const value = unit === 'seconds' ? (BigInt(whole)*1000n + BigInt(fraction.padEnd(3, '0'))) * sign : BigInt(whole)*sign;
    if (value < -8640000000000000n || value > 8640000000000000n) fail('超出浏览器可表示的日期范围。');
    return Number(value);
  }

  function toDate() {
    const source = document.querySelector('#epoch-input');
    const unit = document.querySelector('#epoch-unit').value;
    const date = new Date(epochMilliseconds(source.value, unit));
    const local = new Intl.DateTimeFormat('zh-CN', {year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', timeZoneName:'shortOffset', hourCycle:'h23'}).format(date);
    document.querySelector('#date-output').value = `UTC：${date.toISOString()}\n本地：${local}`;
    say('日期已转换。');
  }

  function toEpoch() {
    const text = document.querySelector('#date-input').value;
    if (!text) fail('请先选择日期和时间。');
    const utc = document.querySelector('#date-zone').value === 'utc';
    const date = new Date(text + (utc ? 'Z' : ''));
    if (!Number.isFinite(date.getTime())) fail('日期无效或超出范围。');
    const fields = text.match(/^(\d{4,})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (!fields) fail('请输入完整日期，精度最多到秒。');
    const actual = utc
      ? [date.getUTCFullYear(), date.getUTCMonth()+1, date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()]
      : [date.getFullYear(), date.getMonth()+1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()];
    if (actual.some((value, i) => value !== Number(fields[i+1] || 0))) fail('日期不存在，或该本地时间处于夏令时跳过的区间。');
    document.querySelector('#epoch-output').value = `秒：${date.getTime()/1000}\n毫秒：${date.getTime()}`;
    say(`已按${utc ? ' UTC' : '浏览器本地时区'}转换。`);
  }

  const examples = {
    json: '{"site":"SubmergePSC","hello":"世界","items":[1,2,3],"large":9007199254740993}',
    base64: '你好，SubmergePSC 👋',
    url: '学习笔记 / hello + world?&=',
    'line-cleaner': ' apple \nbanana\napple\n\nBANANA\nitem10\nitem2',
    'text-stats': 'Hello，世界 👩‍💻\n第二行。',
    'github-image': 'https://github.com/submergepsc/moonbit/blob/main/image.png',
  };

  workspace.addEventListener('click', async event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    try {
      if (action === 'clear') {
        workspace.querySelectorAll('textarea, input:not([type="checkbox"])').forEach(field => { field.value = ''; });
        if (tool === 'text-stats') textStats('');
        say('已清空。');
        return;
      }
      if (action === 'example') {
        if (tool === 'timestamp') {
          document.querySelector('#epoch-unit').value = 'seconds';
          document.querySelector('#epoch-input').value = '1700000000';
          document.querySelector('#date-input').value = '2023-11-14T22:13:20';
          document.querySelector('#date-zone').value = 'utc';
          toDate(); toEpoch();
        } else {
          input.value = examples[tool];
          if (output) output.value = '';
          if (tool === 'text-stats') textStats(input.value);
        }
        say('已填入示例，可继续编辑。');
        return;
      }
      if (action === 'copy') {
        if (tool === 'text-stats') {
          await copy([...document.querySelectorAll('.tool-metrics div')].map(row => row.innerText.replace(/\n/g, '：')).join('\n'));
        } else await copy(output.value);
        return;
      }
      if (tool === 'timestamp') {
        if (action === 'to-date') toDate();
        if (action === 'to-epoch') toEpoch();
        if (action === 'copy-date') await copy(document.querySelector('#date-output').value);
        if (action === 'copy-epoch') await copy(document.querySelector('#epoch-output').value);
        if (action === 'now') {
          document.querySelector('#epoch-input').value = String(document.querySelector('#epoch-unit').value === 'seconds' ? Math.floor(Date.now()/1000) : Date.now());
          toDate();
        }
        return;
      }
      checkSize(input.value);
      if (tool === 'github-image') {
        convertGithubImages(input.value);
        return;
      }
      if (tool === 'json') output.value = jsonFormat(input.value, action === 'minify');
      if (tool === 'base64') output.value = action === 'encode' ? encodeBase64(input.value) : decodeBase64(input.value);
      if (tool === 'url') {
        try { output.value = action === 'encode' ? encodeURIComponent(input.value) : decodeURIComponent(input.value); }
        catch (_) { fail('无法转换，请检查百分号编码或 Unicode 字符是否完整。'); }
      }
      if (tool === 'line-cleaner') {
        const result = cleanLines(input.value);
        output.value = result.text;
        say(`已整理：${result.before} 行 → ${result.after} 行。`);
        return;
      }
      say('处理完成。');
    } catch (error) {
      if (output) output.value = '';
      if (tool === 'timestamp') {
        if (['to-date', 'now'].includes(action)) document.querySelector('#date-output').value = '';
        if (action === 'to-epoch') document.querySelector('#epoch-output').value = '';
      }
      say(error.message || '处理失败，请检查输入。', true);
    }
  });

  if (tool === 'text-stats') input.addEventListener('input', () => {
    try {
      checkSize(input.value); textStats(input.value);
      say(typeof Intl.Segmenter === 'function' ? '统计已更新。' : '当前浏览器不支持 Unicode 分段；字素按码点计数，词段按空白分隔。');
    }
    catch (error) { say(error.message, true); }
  });
  if (tool === 'timestamp') document.querySelector('#local-zone').textContent = `本地时区：${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
  workspace.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && tool !== 'timestamp') {
      const primary = workspace.querySelector('.tool-button-primary');
      if (primary) { event.preventDefault(); primary.click(); }
    }
  });
})();
