'use strict';
const { Plugin, Modal, Notice, TFile, TFolder, MarkdownView, PluginSettingTab, Setting,
  parseYaml, stringifyYaml, normalizePath } = require('obsidian');
const { splitName, makePlan } = (() => { const module = { exports: {} };
'use strict';

function splitName(basename) {
  const at = basename.indexOf('- ');
  return { code: (at < 0 ? basename : basename.slice(0, at)).trim(),
    title: at < 0 ? '' : basename.slice(at + 2).trim() };
}

function assertFilename(value) {
  if (!value || /[<>:"/\\|?*\u0000-\u001f\u007f]/.test(value) || /[. ]$/.test(value))
    throw new Error('名称不能包含路径分隔符、控制字符或 <> : " | ? *，也不能以句点结尾。');
  if (/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i.test(value))
    throw new Error('这个名称是系统保留名称，请换一个。');
  if (value.length > 180) throw new Error('文件名过长，请缩短名称或编号。');
}

function indexFiles(files) {
  const index = new Map();
  for (const file of files) {
    const code = splitName(file.basename).code.toUpperCase();
    const rows = index.get(code) || [];
    rows.push(file); index.set(code, rows);
  }
  return index;
}

function extend(code) {
  if (/\d{3}$/.test(code)) return code + 'A';
  if (/[A-Z]$/.test(code)) return code + '001';
  throw new Error('源笔记编号需要以三位数字或大写字母结尾，例如 001、001A、001.002。');
}

function nextCode(code, mode, index) {
  assertFilename(code);
  const free = value => !index.has(value.toUpperCase());
  if (mode === 'child') {
    for (let i = 1; i <= 9999; i++) {
      const candidate = `${code}.${String(i).padStart(3, '0')}`;
      if (free(candidate)) return candidate;
    }
    throw new Error('子级编号已超过本次查找范围，请调整源编号。');
  }
  if (mode !== 'smart') throw new Error('未知编号方式。');
  let candidate;
  const digits = code.match(/\d{3}$/);
  if (digits && digits[0] !== '999')
    candidate = code.slice(0, -3) + String(Number(digits[0]) + 1).padStart(3, '0');
  else if (/[A-Y]$/.test(code))
    candidate = code.slice(0, -1) + String.fromCharCode(code.charCodeAt(code.length - 1) + 1);
  if (candidate && free(candidate)) return candidate;
  candidate = code;
  for (let i = 0; i < 5; i++) {
    candidate = extend(candidate);
    if (free(candidate)) return candidate;
  }
  throw new Error('智能编号的五层扩展均已占用，请选择“子级编号”。');
}

function readSource(raw, parseYaml) {
  let body = raw.replace(/^\uFEFF/, '');
  let frontmatter = {};
  if (/^---\r?\n/.test(body)) {
    const match = body.match(/^---\r?\n([\s\S]*?)^(?:---|\.\.\.)(?:\r?\n|$)/m);
    if (!match) throw new Error('源笔记 YAML 没有结束标记，请先修正。');
    frontmatter = match[1].trim() ? parseYaml(match[1]) || {} : {};
    if (typeof frontmatter !== 'object' || Array.isArray(frontmatter))
      throw new Error('源笔记属性必须是 YAML 对象。');
    body = body.slice(match[0].length);
  }
  const inline = [];
  let fence = null;
  for (const line of body.split(/\r?\n/)) {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (marker) {
      if (!fence) fence = { char: marker[1][0], length: marker[1].length };
      else if (marker[1][0] === fence.char && marker[1].length >= fence.length && !marker[2].trim()) fence = null;
      continue;
    }
    if (fence) continue;
    const field = line.match(/^ {0,3}([^\s:\[\]`]+)::[ \t]*(.+)$/u);
    if (field && field[1].toLowerCase() !== 'crab_canon') inline.push(line.trim());
  }
  return { frontmatter, inline };
}

function makePlan({ source, raw, files, mode, title, folder, parseYaml, stringifyYaml, now = new Date() }) {
  const { code, title: originalTitle } = splitName(source.basename);
  const index = indexFiles(files);
  const newCode = nextCode(code, mode, index);
  const name = title.trim() || originalTitle || '新的想法';
  assertFilename(name);
  const basename = `${newCode}- ${name}`;
  assertFilename(basename);
  const path = (folder && folder !== '/' ? folder + '/' : '') + basename + '.md';
  const { frontmatter, inline } = readSource(raw, parseYaml);
  const pad = value => String(value).padStart(2, '0');
  const yaml = {
    qishiriqidate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    qishiriqitime: `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
    atomle: true, antinet: 'atom', '树的结构': true
  };
  if (Object.prototype.hasOwnProperty.call(frontmatter, '所属块')) yaml['所属块'] = frontmatter['所属块'];
  let parent = null;
  const dot = newCode.lastIndexOf('.');
  if (dot >= 0) {
    const parents = index.get(newCode.slice(0, dot).toUpperCase()) || [];
    if (parents.length > 1) throw new Error('上级编号对应多篇笔记，无法确定“上级条目”。请先处理重号。');
    parent = parents[0] || null;
    if (parent) {
      // A raw wiki path cannot represent these characters unambiguously.
      if (/[\[\]#|\r\n]/.test(parent.path)) throw new Error('上级笔记路径含 Wiki 链接特殊字符，请先调整路径。');
      yaml['上级条目'] = `[[${parent.path.replace(/\.md$/i, '')}]]`;
    }
  }
  return { code: newCode, path, parentPath: parent?.path || null, fields: inline.length,
    content: `---\n${stringifyYaml(yaml).trimEnd()}\n---\n\n${inline.join('\n')}${inline.length ? '\n' : ''}` };
}

module.exports = { splitName, assertFilename, indexFiles, nextCode, readSource, makePlan };

return module.exports; })();
const DEFAULTS = { location: 'obsidian', folder: '', breadcrumbs: false };

class SimilarNotePlugin extends Plugin {
  async onload() {
    const saved = await this.loadData() || {};
    this.data = { settings: { ...DEFAULTS, ...saved.settings }, drafts: saved.drafts || {} };
    this.saveQueue = Promise.resolve(); this.dead = false; this.busy = false;
    this.lastRun = null; this.session = null;
    this.addCommand({ id: 'create', name: '创建相似笔记', checkCallback: checking => {
      const file = this.app.workspace.getActiveFile();
      if (!(file instanceof TFile) || file.extension !== 'md') return false;
      if (!checking) this.openCreator(file); return true;
    }});
    this.addRibbonIcon('files', '创建相似笔记', () => this.openCreator(this.app.workspace.getActiveFile()));
    this.registerEvent(this.app.workspace.on('file-menu', (menu, file) => {
      if (file instanceof TFile && file.extension === 'md') menu.addItem(item =>
        item.setTitle('创建相似笔记').setIcon('files').onClick(() => this.openCreator(file)));
    }));
    this.addSettingTab(new SimilarSettings(this.app, this));
  }
  persist() {
    const snapshot = JSON.parse(JSON.stringify(this.data));
    const job = this.saveQueue.catch(() => {}).then(() => this.saveData(snapshot));
    this.saveQueue = job;
    return job;
  }
  remember(session) {
    this.data.drafts[session.sourcePath] = { title: session.title, mode: session.mode };
    return this.persist().catch(() => {
      new Notice('草稿未能写入插件设置，当前会话仍保留。请先复制名称，避免重启后丢失。', 8000);
    });
  }
  openCreator(file) {
    if (this.dead) return;
    if (this.busy) return new Notice('当前创建仍在进行，请稍候。');
    if (!(file instanceof TFile) || file.extension !== 'md') return new Notice('请先打开一篇 Markdown 笔记。');
    if (this.modal) { this.modal.titleInput?.focus(); return; }
    const previous = this.session;
    if (previous && previous.source === file && previous.sourcePath !== file.path && !previous.done) {
      this.data.drafts[file.path] = { title: previous.title, mode: previous.mode };
      delete this.data.drafts[previous.sourcePath];
      void this.persist().catch(() => new Notice('笔记改名后的草稿位置未能保存，请先复制名称。'));
      this.session = null;
    }
    if (!this.session || this.session.source !== file || this.session.done) {
      const draft = this.data.drafts[file.path];
      this.session = { source: file, sourcePath: file.path, sourceName: file.basename,
        title: typeof draft?.title === 'string' ? draft.title : splitName(file.basename).title || '新的想法',
        mode: draft?.mode === 'child' ? 'child' : 'smart', done: false, created: null, uncertain: false };
    }
    this.modal = new CreateModal(this, this.session); this.modal.open();
  }
  assertSource(session) {
    if (this.dead) throw new Error('插件已关闭，本次创建已停止。');
    if (session.source.path !== session.sourcePath || this.app.vault.getAbstractFileByPath(session.sourcePath) !== session.source)
      throw new Error('源笔记已移动、删除或替换，请关闭弹窗后从正确笔记重新打开。');
  }
  async readSource(session) {
    this.assertSource(session);
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    const raw = view?.file === session.source ? view.editor.getValue() : await this.app.vault.read(session.source);
    this.assertSource(session);
    return raw;
  }
  destination(session) {
    const settings = this.data.settings;
    let folder;
    if (settings.location === 'same') folder = session.source.parent;
    else if (settings.location === 'custom') {
      const path = String(settings.folder || '').trim();
      if (!path || path.startsWith('/') || /(^|[\\/])\.\.?([\\/]|$)|:/.test(path))
        throw new Error('请在插件设置中选择库内已存在的文件夹。');
      folder = this.app.vault.getAbstractFileByPath(normalizePath(path));
    } else folder = this.app.fileManager.getNewFileParent(session.sourcePath);
    if (!(folder instanceof TFolder)) throw new Error('目标文件夹不存在，请检查插件或 Obsidian 的新笔记位置设置。');
    return folder.path;
  }
  async preview(session) {
    const raw = await this.readSource(session);
    const files = this.app.vault.getMarkdownFiles();
    const plan = makePlan({ source: session.source, raw, files, mode: session.mode,
      title: session.title, folder: this.destination(session), parseYaml, stringifyYaml });
    return { ...plan, raw, fileCount: files.length };
  }
  async commit(session, shown) {
    if (this.busy || session.uncertain) return { state: 'busy' };
    if (session.created) return this.openCreated(session);
    if (!shown) throw new Error('请先完成预览。');
    this.busy = true;
    const started = performance.now();
    const run = this.lastRun = { schemaVersion: 1, phase: 'preflight', outcome: 'running', metadataPasses: 0, writes: 0 };
    try {
      const fresh = await this.preview(session); run.metadataPasses++;
      if (fresh.path !== shown.path || fresh.raw !== shown.raw || fresh.parentPath !== shown.parentPath) {
        return { state: 'changed', plan: fresh };
      }
      this.assertSource(session);
      if (this.app.vault.getAbstractFileByPath(fresh.path)) throw new Error('目标路径已存在，请重新预览。');
      run.phase = 'creating';
      let created;
      try { created = await this.app.vault.create(fresh.path, fresh.content); }
      catch (error) {
        if (this.app.vault.getAbstractFileByPath(fresh.path)) {
          session.uncertain = true;
          throw new Error(`创建结果需要核对：${fresh.path} 已存在。为避免重复，本次不再重试创建，请检查文件。`);
        }
        throw error;
      }
      session.created = created; session.done = true; run.writes = 1; run.phase = 'commit_confirmed';
      delete this.data.drafts[session.sourcePath];
      try { await this.persist(); } catch (_) { new Notice('笔记已创建，但草稿清理未保存；请勿把旧草稿当作未完成任务。', 7000); }
      if (this.dead) return { state: 'created', opened: false, path: created.path };
      const result = await this.openCreated(session);
      if (this.data.settings.breadcrumbs && !this.dead) void this.refreshBreadcrumbs(run);
      run.outcome = result.opened ? 'opened' : 'created_open_failed';
      return result;
    } catch (error) { run.outcome = session.uncertain ? 'unknown' : 'failed'; throw error; }
    finally {
      if (run.outcome === 'running') run.outcome = session.created ? 'created' : 'preview_changed';
      run.durationMs = Math.round(performance.now() - started); this.busy = false;
    }
  }
  async openCreated(session) {
    try {
      await this.app.workspace.getLeaf('tab').openFile(session.created);
      return { state: 'created', opened: true, path: session.created.path };
    } catch (_) { return { state: 'created', opened: false, path: session.created.path }; }
  }
  async refreshBreadcrumbs(run) {
    const plugin = this.app.plugins?.plugins?.breadcrumbs;
    if (typeof plugin?.api?.refreshIndex !== 'function') { run.breadcrumbs = 'unavailable'; return; }
    run.breadcrumbs = 'running';
    try {
      await plugin.api.refreshIndex();
      if (!this.dead && this.app.plugins?.plugins?.breadcrumbs === plugin && typeof plugin.view?.draw === 'function')
        await plugin.view.draw();
      run.breadcrumbs = 'finished';
    } catch (_) { run.breadcrumbs = 'failed'; new Notice('笔记已创建，Breadcrumbs 刷新失败，可在其插件中手动刷新。'); }
  }
  onunload() { this.dead = true; this.modal?.close(); }
}

class CreateModal extends Modal {
  constructor(plugin, session) { super(plugin.app); this.plugin = plugin; this.session = session; this.ticket = 0; this.closed = false; }
  onOpen() {
    const el = this.contentEl; el.empty(); this.modalEl.addClass('csn-modal');
    el.createDiv({ text: 'SIMILAR NOTE', cls: 'csn-eyebrow' });
    el.createEl('h2', { text: '延续一个想法' });
    el.createEl('p', { text: '创建新的编号卡片，继承关联属性。', cls: 'csn-subtitle' });
    const source = el.createDiv({ cls: 'csn-source' });
    source.createEl('span', { text: '源笔记' }); source.createEl('strong', { text: this.session.sourceName });
    const modes = el.createDiv({ cls: 'csn-modes', attr: { role: 'group', 'aria-label': '编号方式' } });
    this.modeButtons = ['smart', 'child'].map(mode => {
      const button = modes.createEl('button', { text: mode === 'smart' ? '智能编号' : '子级编号 · .001', attr: { type: 'button' } });
      button.onclick = () => { this.session.mode = mode; void this.plugin.remember(this.session); void this.update(); };
      return button;
    });
    const label = el.createEl('label', { text: '新笔记名称', cls: 'csn-label' });
    this.titleInput = el.createEl('input', { type: 'text', cls: 'csn-title', attr: { placeholder: '为新的想法命名', 'aria-label': '新笔记名称' } });
    label.appendChild(this.titleInput);
    this.titleInput.value = this.session.title;
    this.titleInput.oninput = () => {
      this.session.title = this.titleInput.value; void this.plugin.remember(this.session);
      this.plan = null; this.createButton.disabled = true;
      clearTimeout(this.timer); this.timer = setTimeout(() => void this.update(), 180);
    };
    this.previewEl = el.createDiv({ cls: 'csn-preview' });
    this.message = el.createDiv({ cls: 'csn-message', attr: { role: 'status', 'aria-live': 'polite' } });
    el.createEl('p', { cls: 'csn-footnote', text: '保留：所属块、行内字段、创建时间、ATOM 属性与上级条目。不会复制正文，也不生成螃蟹复习属性。' });
    const actions = el.createDiv({ cls: 'csn-actions' });
    this.discard = actions.createEl('button', { text: '放弃草稿', cls: 'csn-discard' });
    this.discard.onclick = async () => {
      delete this.plugin.data.drafts[this.session.sourcePath];
      try { await this.plugin.persist(); this.session.done = true; this.close(); }
      catch (_) { this.message.setText('草稿未能清除，请重试。'); }
    };
    this.later = actions.createEl('button', { text: '稍后再建' }); this.later.onclick = () => this.close();
    this.createButton = actions.createEl('button', { text: '创建并打开', cls: 'mod-cta' });
    this.createButton.onclick = () => void this.submit();
    this.scope.register(['Mod'], 'Enter', event => { event.preventDefault(); if (!this.createButton.disabled) void this.submit(); });
    if (this.session.created) {
      this.message.setText(`笔记已经创建：${this.session.created.path}`);
      this.createButton.setText('打开已创建笔记'); this.lockInputs(true);
    } else void this.update();
    this.titleInput.focus();
  }
  lockInputs(locked) {
    this.titleInput.disabled = locked; this.modeButtons.forEach(button => button.disabled = locked);
    this.discard.disabled = locked;
  }
  async update() {
    if (this.closed || this.submitting || this.session.created) return;
    const ticket = ++this.ticket; this.plan = null; this.createButton.disabled = true;
    this.modeButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(this.session.mode === (i ? 'child' : 'smart'))));
    try {
      const plan = await this.plugin.preview(this.session);
      if (this.closed || ticket !== this.ticket) return;
      this.plan = plan; this.paint(plan); this.message.setText(''); this.createButton.disabled = this.session.uncertain;
    } catch (error) { if (!this.closed && ticket === this.ticket) this.message.setText(error.message || String(error)); }
  }
  paint(plan) {
    this.previewEl.empty(); this.previewEl.createDiv({ text: '即将创建', cls: 'csn-preview-label' });
    this.previewEl.createEl('strong', { text: plan.path });
    this.previewEl.createDiv({ text: `${plan.fields} 个行内字段${plan.parentPath ? ' · 已关联上级条目' : ''}`, cls: 'csn-preview-meta' });
  }
  async submit() {
    if (this.submitting || this.createButton.disabled) return;
    this.submitting = true; this.lockInputs(true); this.createButton.disabled = true;
    this.message.setText('正在核对编号并创建…');
    try {
      const result = await this.plugin.commit(this.session, this.plan);
      if (this.closed) { if (result.state === 'created') new Notice(`笔记已创建：${result.path}`); return; }
      if (result.state === 'changed') {
        this.plan = result.plan; this.paint(result.plan); this.message.setText('源内容、编号或位置已有变化，预览已更新。请确认后再次创建。');
      } else if (result.state === 'created') {
        if (result.opened) { new Notice('新笔记已创建'); this.close(); }
        else { this.message.setText(`已创建：${result.path}。打开失败，可点击下方按钮重试打开。`); this.createButton.setText('打开已创建笔记'); }
      } else this.message.setText('另一项创建正在进行，请稍后重试。');
    } catch (error) { if (!this.closed) this.message.setText(error.message || String(error)); }
    finally {
      this.submitting = false;
      if (!this.closed) { this.lockInputs(!!this.session.created); this.createButton.disabled = this.session.uncertain || (!this.plan && !this.session.created); }
    }
  }
  onClose() {
    this.closed = true; this.ticket++; clearTimeout(this.timer);
    if (!this.session.done) void this.plugin.remember(this.session);
    if (this.plugin.modal === this) this.plugin.modal = null;
    this.contentEl.empty();
  }
}

class SimilarSettings extends PluginSettingTab {
  constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }
  display() {
    const el = this.containerEl; el.empty(); el.createEl('h2', { text: '相似笔记' });
    const settings = this.plugin.data.settings;
    const save = () => this.plugin.persist().catch(() => new Notice('设置保存失败，请重试。'));
    new Setting(el).setName('新笔记位置').setDesc('默认跟随 Obsidian 的“新建笔记的存放位置”。')
      .addDropdown(drop => drop.addOptions({ obsidian: '跟随 Obsidian', same: '源笔记所在文件夹', custom: '指定文件夹' })
        .setValue(settings.location).onChange(async value => { settings.location = value; await save(); this.display(); }));
    if (settings.location === 'custom') new Setting(el).setName('库内文件夹').setDesc('填写已存在的相对路径，例如 Cards；不会自动新建文件夹。')
      .addText(text => text.setValue(settings.folder).onChange(value => { settings.folder = value; void save(); }));
    new Setting(el).setName('创建后刷新 Breadcrumbs').setDesc('可选兼容旧版 Breadcrumbs API；未安装或接口不可用时不影响创建，不自动展开其树视图。')
      .addToggle(toggle => toggle.setValue(settings.breadcrumbs).onChange(value => { settings.breadcrumbs = value; void save(); }));
    new Setting(el).setName('最近一次操作诊断').setDesc('仅显示本会话耗时、阶段与计数；不含标题或正文，不上传。')
      .addButton(button => button.setButtonText('查看').onClick(() => {
        const modal = new Modal(this.app); modal.contentEl.createEl('h2', { text: '操作诊断' });
        modal.contentEl.createEl('pre', { text: JSON.stringify(this.plugin.lastRun || { status: '尚未创建' }, null, 2) }); modal.open();
      }));
  }
}
module.exports = SimilarNotePlugin;
