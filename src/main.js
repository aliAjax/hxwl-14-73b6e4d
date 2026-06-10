import './styles.css';

const key = 'hxwl-14-music-practice';
const planKey = 'hxwl-14-music-practice-plan';
const goalKey = 'hxwl-14-music-practice-goals';
const sessionKey = 'hxwl-14-practice-session';
const committedSessionsKey = 'hxwl-14-committed-sessions';
const filtersKey = 'hxwl-14-filters';
const viewsKey = 'hxwl-14-views';
const currentViewKey = 'hxwl-14-current-view';
const seed = [
  { id: crypto.randomUUID(), instrument: '电吉他', piece: 'Blue Bossa', date: '2026-06-01', bpm: 86, minutes: 35, mistakes: 18, note: '和弦转换卡顿', sections: [
    { id: crypto.randomUUID(), name: '前奏', bpm: 80, mistakes: 3, mastery: 3, note: '分解和弦流畅度不够' },
    { id: crypto.randomUUID(), name: '主歌', bpm: 86, mistakes: 8, mastery: 2, note: '和弦转换卡顿明显' },
    { id: crypto.randomUUID(), name: '副歌', bpm: 86, mistakes: 7, mastery: 2, note: '扫弦节奏不稳' }
  ]},
  { id: crypto.randomUUID(), instrument: '电吉他', piece: 'Blue Bossa', date: '2026-06-03', bpm: 92, minutes: 42, mistakes: 13, note: '副歌更稳定', sections: [
    { id: crypto.randomUUID(), name: '前奏', bpm: 88, mistakes: 2, mastery: 4, note: '进步明显' },
    { id: crypto.randomUUID(), name: '主歌', bpm: 92, mistakes: 6, mastery: 3, note: '转换更流畅' },
    { id: crypto.randomUUID(), name: '副歌', bpm: 92, mistakes: 5, mastery: 3, note: '扫弦节奏改善' }
  ]},
  { id: crypto.randomUUID(), instrument: '电吉他', piece: 'Blue Bossa', date: '2026-06-06', bpm: 98, minutes: 45, mistakes: 9, note: '开始合伴奏', sections: [
    { id: crypto.randomUUID(), name: '前奏', bpm: 98, mistakes: 1, mastery: 5, note: '已掌握' },
    { id: crypto.randomUUID(), name: '主歌', bpm: 98, mistakes: 4, mastery: 4, note: '基本流畅' },
    { id: crypto.randomUUID(), name: '副歌', bpm: 98, mistakes: 3, mastery: 4, note: '配合伴奏稳定' },
    { id: crypto.randomUUID(), name: 'Solo', bpm: 95, mistakes: 1, mastery: 3, note: '开始练习即兴' }
  ]},
  { id: crypto.randomUUID(), instrument: '键盘', piece: 'Autumn Leaves', date: '2026-06-02', bpm: 72, minutes: 30, mistakes: 21, note: '左手节奏不稳' },
  { id: crypto.randomUUID(), instrument: '键盘', piece: 'Autumn Leaves', date: '2026-06-05', bpm: 78, minutes: 38, mistakes: 15, note: '分段练习有效', sections: [
    { id: crypto.randomUUID(), name: '前奏', bpm: 75, mistakes: 2, mastery: 4, note: '左手稳定' },
    { id: crypto.randomUUID(), name: '主歌', bpm: 78, mistakes: 7, mastery: 3, note: '左手根音配合' },
    { id: crypto.randomUUID(), name: '副歌', bpm: 78, mistakes: 6, mastery: 3, note: '和弦转换需加强' }
  ]}
];

const historyKey = 'hxwl-14-music-practice-history';
const metaKey = 'hxwl-14-music-practice-meta';

const VersionManager = (() => {
  const SCHEMA_VERSION = 1;
  const MAX_HISTORY = 200;

  function loadMeta() {
    try {
      return JSON.parse(localStorage.getItem(metaKey) || 'null') || { schemaVersion: 0, currentVersion: 0 };
    } catch {
      return { schemaVersion: 0, currentVersion: 0 };
    }
  }

  function saveMeta(meta) {
    localStorage.setItem(metaKey, JSON.stringify(meta));
  }

  function loadHistory() {
    try {
      return JSON.parse(localStorage.getItem(historyKey) || '[]');
    } catch {
      return [];
    }
  }

  function saveHistory(history) {
    const trimmed = history.length > MAX_HISTORY
      ? history.slice(history.length - MAX_HISTORY)
      : history;
    localStorage.setItem(historyKey, JSON.stringify(trimmed));
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function stampRecords(recordsList, version) {
    const now = new Date().toISOString();
    return recordsList.map(r => ({
      ...r,
      _version: r._version || version,
      _updatedAt: r._updatedAt || now
    }));
  }

  function isMigrated(recordsList) {
    return recordsList.length > 0 && recordsList.every(r => r._version !== undefined);
  }

  function generateDescription(action, details) {
    const templates = {
      add: (d) => d && d.count
        ? `新增 ${d.count} 条练习记录${d.names ? '：' + d.names.join('、') : ''}`
        : '新增练习记录',
      edit: (d) => d && d.name
        ? `编辑记录：${d.name}${d.field ? '（' + d.field + '）' : ''}`
        : '编辑练习记录',
      delete: (d) => d && d.name
        ? `删除记录：${d.name}`
        : d && d.count
          ? `删除 ${d.count} 条记录`
          : '删除练习记录',
      import: (d) => d && d.count
        ? `导入 ${d.count} 条练习记录${d.mode === 'overwrite' ? '（覆盖模式）' : ''}`
        : '导入练习记录',
      reset: () => '重置为示例数据',
      rollback: (d) => d && d.toVersion !== undefined
        ? `回滚到版本 v${d.toVersion}`
        : '回滚到历史版本',
      migrate: () => '迁移旧数据，初始化版本管理'
    };
    return templates[action] ? templates[action](details) : '未知操作';
  }

  function init() {
    const meta = loadMeta();
    let rawRecords;
    try {
      rawRecords = JSON.parse(localStorage.getItem(key) || 'null');
    } catch {
      rawRecords = null;
    }

    if (meta.schemaVersion < SCHEMA_VERSION) {
      if (rawRecords && Array.isArray(rawRecords) && !isMigrated(rawRecords)) {
        meta.currentVersion = 1;
        meta.schemaVersion = SCHEMA_VERSION;
        const migrated = stampRecords(rawRecords, meta.currentVersion);
        localStorage.setItem(key, JSON.stringify(migrated));

        const history = loadHistory();
        history.push({
          id: crypto.randomUUID(),
          version: meta.currentVersion,
          timestamp: new Date().toISOString(),
          action: 'migrate',
          description: generateDescription('migrate'),
          affectedRecordIds: migrated.map(r => r.id),
          snapshot: deepClone(migrated),
          meta: { recordCount: migrated.length }
        });
        saveHistory(history);
        saveMeta(meta);
        return { records: migrated, meta, migrated: true };
      }

      if (!rawRecords) {
        meta.currentVersion = 1;
        meta.schemaVersion = SCHEMA_VERSION;
        const seeded = stampRecords(deepClone(seed), meta.currentVersion);
        localStorage.setItem(key, JSON.stringify(seeded));

        const history = loadHistory();
        history.push({
          id: crypto.randomUUID(),
          version: meta.currentVersion,
          timestamp: new Date().toISOString(),
          action: 'reset',
          description: generateDescription('reset'),
          affectedRecordIds: seeded.map(r => r.id),
          snapshot: deepClone(seeded),
          meta: { recordCount: seeded.length }
        });
        saveHistory(history);
        saveMeta(meta);
        return { records: seeded, meta, migrated: true };
      }

      meta.schemaVersion = SCHEMA_VERSION;
      saveMeta(meta);
    }

    return { records: rawRecords || [], meta, migrated: false };
  }

  function recordChange(action, currentRecords, details) {
    const meta = loadMeta();
    meta.currentVersion += 1;

    const version = meta.currentVersion;
    const now = new Date().toISOString();

    const stamped = currentRecords.map(r => ({
      ...r,
      _version: version,
      _updatedAt: now
    }));

    const affectedIds = action === 'add' && details && details.ids
      ? details.ids
      : action === 'delete' && details && details.ids
        ? details.ids
        : action === 'edit' && details && details.ids
          ? details.ids
          : stamped.map(r => r.id);

    const history = loadHistory();
    history.push({
      id: crypto.randomUUID(),
      version,
      timestamp: now,
      action,
      description: generateDescription(action, details),
      affectedRecordIds: affectedIds,
      snapshot: deepClone(stamped),
      meta: details ? { ...details } : {}
    });

    saveHistory(history);
    saveMeta(meta);
    localStorage.setItem(key, JSON.stringify(stamped));

    return { records: stamped, version, meta };
  }

  function rollback(historyId) {
    const history = loadHistory();
    const entry = history.find(h => h.id === historyId);
    if (!entry) return { success: false, error: '历史记录不存在' };
    if (!entry.snapshot) return { success: false, error: '快照数据丢失' };

    const meta = loadMeta();
    meta.currentVersion += 1;

    const restoredSnapshot = deepClone(entry.snapshot);
    const version = meta.currentVersion;
    const now = new Date().toISOString();

    const stamped = restoredSnapshot.map(r => ({
      ...r,
      _version: version,
      _updatedAt: now
    }));

    history.push({
      id: crypto.randomUUID(),
      version,
      timestamp: now,
      action: 'rollback',
      description: generateDescription('rollback', { toVersion: entry.version }),
      affectedRecordIds: stamped.map(r => r.id),
      snapshot: deepClone(stamped),
      meta: { rollbackFromHistoryId: historyId, rollbackFromVersion: entry.version }
    });

    saveHistory(history);
    saveMeta(meta);
    localStorage.setItem(key, JSON.stringify(stamped));

    return { success: true, records: stamped, version, rolledBackTo: entry };
  }

  function getHistory() {
    return loadHistory().sort((a, b) => b.version - a.version);
  }

  function getCurrentVersion() {
    return loadMeta().currentVersion;
  }

  function resetToSampleData() {
    const meta = loadMeta();
    meta.currentVersion += 1;
    const version = meta.currentVersion;
    const now = new Date().toISOString();

    const seeded = deepClone(seed).map(r => ({
      ...r,
      _version: version,
      _updatedAt: now
    }));

    const history = loadHistory();
    history.push({
      id: crypto.randomUUID(),
      version,
      timestamp: now,
      action: 'reset',
      description: generateDescription('reset'),
      affectedRecordIds: seeded.map(r => r.id),
      snapshot: deepClone(seeded),
      meta: { recordCount: seeded.length }
    });

    saveHistory(history);
    saveMeta(meta);
    localStorage.setItem(key, JSON.stringify(seeded));

    return { records: seeded, version };
  }

  return {
    init,
    recordChange,
    rollback,
    getHistory,
    getCurrentVersion,
    resetToSampleData,
    SCHEMA_VERSION,
    deepClone
  };
})();

const vmInitResult = VersionManager.init();
let records = vmInitResult.records;
let editingId = null;
let archiveFilter = '';
let currentSections = [];

const defaultFilters = {
  instrument: '',
  piece: '',
  dateStart: '',
  dateEnd: '',
  bpmMin: '',
  bpmMax: '',
  mistakesMin: '',
  mistakesMax: '',
  noteKeyword: ''
};

let filters = JSON.parse(localStorage.getItem(filtersKey) || 'null') || { ...defaultFilters };
let views = JSON.parse(localStorage.getItem(viewsKey) || 'null') || [];
let currentViewId = localStorage.getItem(currentViewKey) || '';
let filterPanelExpanded = true;

let session = JSON.parse(localStorage.getItem(sessionKey) || 'null') || {
  id: null,
  status: 'idle',
  startTime: null,
  accumulatedMs: 0,
  instrument: '',
  piece: '',
  targetBpm: '',
  note: '',
  createdAt: null
};
let committedSessionIds = JSON.parse(localStorage.getItem(committedSessionsKey) || '[]');
let sessionTimer = null;

const defaultSectionNames = ['前奏', '主歌', '副歌', 'Solo', '桥段', '尾奏'];

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMasteryLabel(mastery) {
  const labels = { 1: '初学', 2: '熟悉', 3: '掌握', 4: '熟练', 5: '精通' };
  return labels[mastery] || '未知';
}

function getMasteryColor(mastery) {
  const colors = { 1: '#dc2626', 2: '#d97706', 3: '#0891b2', 4: '#0d9488', 5: '#059669' };
  return colors[mastery] || '#60736f';
}

function saveSession() {
  localStorage.setItem(sessionKey, JSON.stringify(session));
}

function saveCommittedSessions() {
  localStorage.setItem(committedSessionsKey, JSON.stringify(committedSessionIds));
}

function saveFilters() {
  localStorage.setItem(filtersKey, JSON.stringify(filters));
}

function saveViews() {
  localStorage.setItem(viewsKey, JSON.stringify(views));
}

function saveCurrentView() {
  localStorage.setItem(currentViewKey, currentViewId);
}

function applyFilters(recordsToFilter) {
  return recordsToFilter.filter(record => {
    if (filters.instrument && record.instrument !== filters.instrument) return false;
    if (filters.piece && record.piece !== filters.piece) return false;
    if (filters.dateStart && record.date < filters.dateStart) return false;
    if (filters.dateEnd && record.date > filters.dateEnd) return false;
    if (filters.bpmMin && record.bpm < Number(filters.bpmMin)) return false;
    if (filters.bpmMax && record.bpm > Number(filters.bpmMax)) return false;
    if (filters.mistakesMin && record.mistakes < Number(filters.mistakesMin)) return false;
    if (filters.mistakesMax && record.mistakes > Number(filters.mistakesMax)) return false;
    if (filters.noteKeyword) {
      const note = record.note || '';
      if (!note.includes(filters.noteKeyword)) return false;
    }
    return true;
  });
}

function hasActiveFilters() {
  return Object.entries(filters).some(([key, value]) => {
    if (key === 'noteKeyword') return value.trim() !== '';
    return value !== '' && value !== null && value !== undefined;
  });
}

function getActiveFilterCount() {
  return Object.entries(filters).filter(([key, value]) => {
    if (key === 'noteKeyword') return value.trim() !== '';
    return value !== '' && value !== null && value !== undefined;
  }).length;
}

function resetFilters() {
  filters = { ...defaultFilters };
  currentViewId = '';
  saveFilters();
  saveCurrentView();
  render();
}

function updateFilter(field, value) {
  filters[field] = value;
  currentViewId = '';
  saveFilters();
  saveCurrentView();
  render();
}

async function saveView(name) {
  if (!name.trim()) {
    await showConfirm('提示', '请输入视图名称');
    return false;
  }
  const existingView = views.find(v => v.name === name.trim());
  if (existingView) {
    const confirmed = await showConfirm('确认覆盖', '该视图名称已存在，是否覆盖？');
    if (!confirmed) return false;
    existingView.filters = { ...filters };
    existingView.updatedAt = new Date().toISOString();
  } else {
    views.push({
      id: crypto.randomUUID(),
      name: name.trim(),
      filters: { ...filters },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  saveViews();
  return true;
}

function loadView(viewId) {
  const view = views.find(v => v.id === viewId);
  if (!view) return;
  filters = { ...view.filters };
  currentViewId = viewId;
  saveFilters();
  saveCurrentView();
  render();
}

async function deleteView(viewId) {
  const confirmed = await showConfirm('删除视图', '确定删除该视图？');
  if (!confirmed) return;
  views = views.filter(v => v.id !== viewId);
  if (currentViewId === viewId) {
    currentViewId = '';
    saveCurrentView();
  }
  saveViews();
  render();
}

function getFilterDescription() {
  const parts = [];
  if (filters.instrument) parts.push(`乐器: ${filters.instrument}`);
  if (filters.piece) parts.push(`曲目: ${filters.piece}`);
  if (filters.dateStart || filters.dateEnd) {
    const start = filters.dateStart || '不限';
    const end = filters.dateEnd || '不限';
    parts.push(`日期: ${start} ~ ${end}`);
  }
  if (filters.bpmMin || filters.bpmMax) {
    const min = filters.bpmMin || '不限';
    const max = filters.bpmMax || '不限';
    parts.push(`BPM: ${min} ~ ${max}`);
  }
  if (filters.mistakesMin || filters.mistakesMax) {
    const min = filters.mistakesMin || '不限';
    const max = filters.mistakesMax || '不限';
    parts.push(`错误: ${min} ~ ${max}`);
  }
  if (filters.noteKeyword) parts.push(`备注: "${filters.noteKeyword}"`);
  return parts;
}

function getSessionElapsedMs() {
  if (session.status === 'idle') return 0;
  let elapsed = session.accumulatedMs;
  if (session.status === 'running' && session.startTime) {
    elapsed += Date.now() - session.startTime;
  }
  return elapsed;
}

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function startSession() {
  const sessionForm = document.querySelector('#sessionForm');
  const data = Object.fromEntries(new FormData(sessionForm).entries());
  
  if (!data.instrument.trim() || !data.piece.trim()) {
    alert('请填写乐器和曲目');
    return;
  }

  session = {
    id: crypto.randomUUID(),
    status: 'running',
    startTime: Date.now(),
    accumulatedMs: 0,
    instrument: data.instrument.trim(),
    piece: data.piece.trim(),
    targetBpm: data.targetBpm ? Number(data.targetBpm) : null,
    note: data.note ? data.note.trim() : '',
    createdAt: Date.now()
  };
  saveSession();
  startSessionTimer();
  renderSessionPanel();
}

function pauseSession() {
  if (session.status !== 'running') return;
  session.accumulatedMs += Date.now() - session.startTime;
  session.startTime = null;
  session.status = 'paused';
  saveSession();
  stopSessionTimer();
  renderSessionPanel();
}

function resumeSession() {
  if (session.status !== 'paused') return;
  session.startTime = Date.now();
  session.status = 'running';
  saveSession();
  startSessionTimer();
  renderSessionPanel();
}

function endSession() {
  if (session.status === 'idle') return;
  
  if (committedSessionIds.includes(session.id)) {
    alert('该会话已保存过记录，请勿重复提交');
    return;
  }

  const elapsedMs = getSessionElapsedMs();
  const minutes = Math.max(1, Math.round(elapsedMs / 60000));

  if (!confirm(`本次练习时长 ${minutes} 分钟，确定结束并生成记录？`)) return;

  const item = {
    id: crypto.randomUUID(),
    instrument: session.instrument,
    piece: session.piece,
    date: getToday(),
    bpm: session.targetBpm || 60,
    minutes: minutes,
    mistakes: 0,
    note: session.note || `计时练习，实际时长 ${formatDuration(elapsedMs)}`
  };

  const hasDuplicateRecord = isDuplicate(item, records);
  if (!hasDuplicateRecord) {
    const newRecords = [item, ...records];
    const result = VersionManager.recordChange('add', newRecords, {
      count: 1,
      names: [`${item.instrument} - ${item.piece} (${item.date})`],
      ids: [item.id]
    });
    records = result.records;
  } else {
    alert('已存在相同练习记录，本次会话不会重复保存');
  }
  committedSessionIds.push(session.id);
  saveCommittedSessions();

  session = {
    id: null,
    status: 'idle',
    startTime: null,
    accumulatedMs: 0,
    instrument: '',
    piece: '',
    targetBpm: '',
    note: '',
    createdAt: null
  };
  saveSession();
  stopSessionTimer();
  renderSessionPanel();
  render();
}

function cancelSession() {
  if (session.status === 'idle') return;
  if (!confirm('确定取消本次练习？计时数据将不会被保存。')) return;
  
  session = {
    id: null,
    status: 'idle',
    startTime: null,
    accumulatedMs: 0,
    instrument: '',
    piece: '',
    targetBpm: '',
    note: '',
    createdAt: null
  };
  saveSession();
  stopSessionTimer();
  renderSessionPanel();
}

function startSessionTimer() {
  stopSessionTimer();
  sessionTimer = setInterval(() => {
    const timerDisplay = document.querySelector('#sessionTimer');
    if (timerDisplay) {
      timerDisplay.textContent = formatDuration(getSessionElapsedMs());
    }
  }, 1000);
}

function stopSessionTimer() {
  if (sessionTimer) {
    clearInterval(sessionTimer);
    sessionTimer = null;
  }
}

function renderSessionPanel() {
  const panel = document.querySelector('#sessionPanel');
  if (!panel) return;

  const pieces = [...new Set(records.map((record) => record.piece))].sort();
  const instruments = [...new Set(records.map((record) => record.instrument))].sort();

  if (session.status === 'idle') {
    panel.innerHTML = `
      <div class="panelHead">
        <h2>练习会话计时</h2>
        <span class="muted">开始新的练习</span>
      </div>
      <form id="sessionForm" class="sessionForm">
        <div class="pair">
          <select name="instrument" required>
            <option value="">选择乐器</option>
            ${instruments.map(i => `<option value="${escapeHtml(i)}">${escapeHtml(i)}</option>`).join('')}
            <option value="其他">其他</option>
          </select>
          <input name="piece" list="pieceSuggestions" placeholder="曲目" required />
          <datalist id="pieceSuggestions">
            ${pieces.map(p => `<option value="${escapeHtml(p)}">`).join('')}
          </datalist>
        </div>
        <div class="pair">
          <input name="targetBpm" type="number" min="1" step="1" placeholder="目标BPM" />
          <input name="note" placeholder="备注（可选）" />
        </div>
        <button type="button" class="primary" id="startSessionBtn">▶ 开始练习</button>
      </form>
    `;

    document.querySelector('#startSessionBtn').addEventListener('click', startSession);
  } else {
    const elapsed = getSessionElapsedMs();
    const isRunning = session.status === 'running';
    
    panel.innerHTML = `
      <div class="panelHead">
        <h2>练习会话计时</h2>
        <span class="sessionStatus ${session.status}">${isRunning ? '● 进行中' : '❚❚ 已暂停'}</span>
      </div>
      <div class="sessionActive">
        <div class="sessionInfo">
          <div class="sessionInfoRow">
            <span class="sessionLabel">曲目</span>
            <strong>${escapeHtml(session.piece)}</strong>
          </div>
          <div class="sessionInfoRow">
            <span class="sessionLabel">乐器</span>
            <strong>${escapeHtml(session.instrument)}</strong>
          </div>
          ${session.targetBpm ? `
          <div class="sessionInfoRow">
            <span class="sessionLabel">目标BPM</span>
            <strong>${session.targetBpm}</strong>
          </div>
          ` : ''}
          ${session.note ? `
          <div class="sessionInfoRow">
            <span class="sessionLabel">备注</span>
            <strong>${escapeHtml(session.note)}</strong>
          </div>
          ` : ''}
        </div>
        <div class="sessionTimer">
          <div id="sessionTimer" class="timerDisplay">${formatDuration(elapsed)}</div>
          <div class="timerHint">已练习 ${Math.round(elapsed / 60000)} 分钟</div>
        </div>
        <div class="sessionActions">
          ${isRunning 
            ? `<button class="secondary" id="pauseSessionBtn">❚❚ 暂停</button>`
            : `<button class="primary" id="resumeSessionBtn">▶ 继续</button>`
          }
          <button class="primary" id="endSessionBtn">■ 结束并保存</button>
          <button class="secondary" id="cancelSessionBtn">取消</button>
        </div>
      </div>
    `;

    const pauseBtn = document.querySelector('#pauseSessionBtn');
    const resumeBtn = document.querySelector('#resumeSessionBtn');
    const endBtn = document.querySelector('#endSessionBtn');
    const cancelBtn = document.querySelector('#cancelSessionBtn');

    if (pauseBtn) pauseBtn.addEventListener('click', pauseSession);
    if (resumeBtn) resumeBtn.addEventListener('click', resumeSession);
    if (endBtn) endBtn.addEventListener('click', endSession);
    if (cancelBtn) cancelBtn.addEventListener('click', cancelSession);
  }
}

function initSession() {
  if (session.status === 'running') {
    startSessionTimer();
  }
  renderSessionPanel();
}

function getSections(record) {
  return record.sections && Array.isArray(record.sections) ? record.sections : [];
}

function addSection(name = '') {
  currentSections.push({
    id: crypto.randomUUID(),
    name: name || '新片段',
    bpm: form.elements.bpm ? Number(form.elements.bpm.value) : 80,
    mistakes: 0,
    mastery: 3,
    note: ''
  });
  renderSections();
}

function removeSection(id) {
  currentSections = currentSections.filter(s => s.id !== id);
  renderSections();
}

function updateSection(id, field, value) {
  const section = currentSections.find(s => s.id === id);
  if (section) {
    if (['bpm', 'mistakes', 'mastery'].includes(field)) {
      section[field] = Number(value);
    } else {
      section[field] = value;
    }
  }
}

function renderSections() {
  const listEl = document.querySelector('#sectionsList');
  if (!currentSections.length) {
    listEl.innerHTML = '<p class="empty sectionsEmpty">暂无片段，点击上方按钮添加练习片段</p>';
    return;
  }

  listEl.innerHTML = currentSections.map((section, index) => `
    <div class="sectionCard" data-section-id="${section.id}">
      <div class="sectionHead">
        <input class="sectionNameInput" type="text" value="${escapeHtml(section.name)}" data-section-field="name" data-section-id="${section.id}" placeholder="片段名称" />
        <button type="button" class="sectionDelBtn" data-section-del="${section.id}" aria-label="删除片段">×</button>
      </div>
      <div class="sectionFields">
        <div class="sectionField">
          <label>BPM</label>
          <input type="number" min="1" step="1" value="${section.bpm}" data-section-field="bpm" data-section-id="${section.id}" />
        </div>
        <div class="sectionField">
          <label>错误次数</label>
          <input type="number" min="0" step="1" value="${section.mistakes}" data-section-field="mistakes" data-section-id="${section.id}" />
        </div>
        <div class="sectionField">
          <label>掌握程度</label>
          <select data-section-field="mastery" data-section-id="${section.id}">
            ${[1,2,3,4,5].map(m => `<option value="${m}" ${section.mastery === m ? 'selected' : ''}>${m} - ${getMasteryLabel(m)}</option>`).join('')}
          </select>
        </div>
      </div>
      <input class="sectionNoteInput" type="text" value="${escapeHtml(section.note)}" data-section-field="note" data-section-id="${section.id}" placeholder="片段备注..." />
    </div>
  `).join('');

  listEl.querySelectorAll('[data-section-field]').forEach(input => {
    input.addEventListener('input', (e) => {
      updateSection(e.target.dataset.sectionId, e.target.dataset.sectionField, e.target.value);
    });
  });

  listEl.querySelectorAll('[data-section-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      removeSection(btn.dataset.sectionDel);
    });
  });
}

function getSectionStats(trackRecords) {
  const sectionMap = new Map();

  trackRecords.forEach(record => {
    const sections = getSections(record);
    sections.forEach(section => {
      if (!sectionMap.has(section.name)) {
        sectionMap.set(section.name, {
          name: section.name,
          records: [],
          bpmHistory: [],
          mistakesHistory: [],
          masteryHistory: []
        });
      }
      const stats = sectionMap.get(section.name);
      stats.records.push({ ...section, date: record.date });
      stats.bpmHistory.push({ date: record.date, value: section.bpm });
      stats.mistakesHistory.push({ date: record.date, value: section.mistakes });
      stats.masteryHistory.push({ date: record.date, value: section.mastery });
    });
  });

  return [...sectionMap.values()].map(section => {
    const sortedBpm = section.bpmHistory.sort((a, b) => a.date.localeCompare(b.date));
    const sortedMistakes = section.mistakesHistory.sort((a, b) => a.date.localeCompare(b.date));
    const sortedMastery = section.masteryHistory.sort((a, b) => a.date.localeCompare(b.date));

    const maxBpm = sortedBpm.length ? Math.max(...sortedBpm.map(h => h.value)) : 0;
    const latestMastery = sortedMastery.length ? sortedMastery[sortedMastery.length - 1].value : 0;
    const mistakeTrend = sortedMistakes.length >= 2
      ? sortedMistakes[sortedMistakes.length - 1].value - sortedMistakes[0].value
      : 0;

    return {
      ...section,
      bpmHistory: sortedBpm,
      mistakesHistory: sortedMistakes,
      masteryHistory: sortedMastery,
      maxBpm,
      latestMastery,
      mistakeTrend,
      practiceCount: section.records.length
    };
  }).sort((a, b) => b.practiceCount - a.practiceCount);
}

function loadPlan() {
  const data = JSON.parse(localStorage.getItem(planKey) || 'null') || {};
  const today = getToday();
  return data[today] || [];
}

function savePlan(tasks) {
  const data = JSON.parse(localStorage.getItem(planKey) || 'null') || {};
  const today = getToday();
  data[today] = tasks;
  localStorage.setItem(planKey, JSON.stringify(data));
}

let planTasks = loadPlan();

const goalSeed = [
  { id: crypto.randomUUID(), piece: 'Blue Bossa', targetBpm: 120, startBpm: 86, targetDate: '2026-06-30', weeklyMinutes: 180, createdAt: '2026-06-01', achieved: false, achievedAt: null },
  { id: crypto.randomUUID(), piece: 'Autumn Leaves', targetBpm: 100, startBpm: 72, targetDate: '2026-06-20', weeklyMinutes: 150, createdAt: '2026-06-01', achieved: false, achievedAt: null }
];

function loadGoals() {
  return JSON.parse(localStorage.getItem(goalKey) || 'null') || goalSeed;
}

function saveGoals(goals) {
  localStorage.setItem(goalKey, JSON.stringify(goals));
}

let goals = loadGoals();

function getWeekRange(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

function getWeekMinutes(piece) {
  const { start, end } = getWeekRange();
  const formatDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const startStr = formatDate(start);
  const endStr = formatDate(end);
  return records
    .filter(r => r.piece === piece && r.date >= startStr && r.date <= endStr)
    .reduce((sum, r) => sum + r.minutes, 0);
}

function getMaxBpm(piece) {
  const pieceRecords = records.filter(r => r.piece === piece);
  return pieceRecords.length ? Math.max(...pieceRecords.map(r => r.bpm)) : 0;
}

function getGoalAchievedAt(goal) {
  const achievedRecord = records
    .filter(r => r.piece === goal.piece && r.bpm >= goal.targetBpm)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  return achievedRecord ? achievedRecord.date : getToday();
}

function syncGoalAchievements() {
  let changed = false;
  goals = goals.map((goal) => {
    if (goal.achieved || getMaxBpm(goal.piece) < goal.targetBpm) return goal;
    changed = true;
    return { ...goal, achieved: true, achievedAt: getGoalAchievedAt(goal) };
  });
  if (changed) saveGoals(goals);
}

function calculateGoalProgress(goal) {
  const currentBpm = getMaxBpm(goal.piece);
  const bpmProgress = goal.targetBpm > goal.startBpm
    ? Math.min(100, Math.max(0, ((currentBpm - goal.startBpm) / (goal.targetBpm - goal.startBpm)) * 100))
    : 100;
  const weekMinutes = getWeekMinutes(goal.piece);
  const weeklyProgress = goal.weeklyMinutes > 0
    ? Math.min(100, (weekMinutes / goal.weeklyMinutes) * 100)
    : 0;
  const today = new Date();
  const targetDate = new Date(goal.targetDate);
  const createdDate = new Date(goal.createdAt);
  const totalDays = Math.ceil((targetDate - createdDate) / (1000 * 60 * 60 * 24));
  const daysPassed = Math.ceil((today - createdDate) / (1000 * 60 * 60 * 24));
  const timeProgress = totalDays > 0 ? Math.min(100, Math.max(0, (daysPassed / totalDays) * 100)) : 100;
  const isOverdue = !goal.achieved && today > targetDate;
  const daysRemaining = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
  const isAchieved = goal.achieved || currentBpm >= goal.targetBpm;
  return {
    bpmProgress: Math.round(bpmProgress),
    weeklyProgress: Math.round(weeklyProgress),
    timeProgress: Math.round(timeProgress),
    currentBpm,
    weekMinutes,
    isOverdue,
    daysRemaining,
    isAchieved,
    totalDays,
    daysPassed
  };
}

document.querySelector('#app').innerHTML = `
  <main class="shell">
    <header class="hero">
      <div>
        <p>hxwl-14 · port 5114</p>
        <h1>独立音乐练习仪表盘</h1>
      </div>
      <div class="heroButtons">
        <button id="sample">载入示例</button>
        <button id="historyBtn" class="secondary">📜 历史版本</button>
        <button id="exportBtn" class="secondary">导出数据</button>
        <button id="importBtn" class="secondary">导入数据</button>
        <input type="file" id="importFile" accept=".json" hidden />
      </div>
    </header>

    <div id="importModal" class="modal" hidden>
      <div class="modalOverlay"></div>
      <div class="modalContent">
        <div class="modalHead">
          <h2>导入练习记录</h2>
          <button class="modalClose" id="modalClose">×</button>
        </div>
        <div class="modalBody">
          <div id="importPreview"></div>
        </div>
        <div class="modalFoot">
          <button class="modalCancel" id="modalCancel">取消</button>
          <button class="primary modalConfirm" id="modalConfirm" disabled>确认导入</button>
        </div>
      </div>
    </div>

    <div id="promptModal" class="modal" hidden>
      <div class="modalOverlay"></div>
      <div class="modalContent">
        <div class="modalHead">
          <h2 id="promptTitle">输入</h2>
          <button class="modalClose" id="promptClose">×</button>
        </div>
        <div class="modalBody">
          <p id="promptMessage" class="muted"></p>
          <input type="text" id="promptInput" placeholder="" />
        </div>
        <div class="modalFoot">
          <button class="modalCancel" id="promptCancel">取消</button>
          <button class="primary modalConfirm" id="promptConfirm">确认</button>
        </div>
      </div>
    </div>

    <div id="confirmModal" class="modal" hidden>
      <div class="modalOverlay"></div>
      <div class="modalContent">
        <div class="modalHead">
          <h2 id="confirmTitle">确认</h2>
          <button class="modalClose" id="confirmClose">×</button>
        </div>
        <div class="modalBody">
          <p id="confirmMessage"></p>
        </div>
        <div class="modalFoot">
          <button class="modalCancel" id="confirmCancel">取消</button>
          <button class="primary modalConfirm" id="confirmConfirm">确认</button>
        </div>
      </div>
    </div>

    <div id="historyModal" class="modal" hidden>
      <div class="modalOverlay"></div>
      <div class="modalContent">
        <div class="modalHead">
          <div>
            <h2>📜 数据版本历史</h2>
            <span class="muted" id="historyCurrentVersion"></span>
          </div>
          <button class="modalClose" id="historyClose">×</button>
        </div>
        <div class="modalBody">
          <div id="historyList"></div>
        </div>
        <div class="modalFoot">
          <button class="modalCancel" id="historyCancelBtn">关闭</button>
        </div>
      </div>
    </div>

    <section class="panel sessionPanel" id="sessionPanel"></section>

    <section class="panel filterPanel">
      <div class="filterPanelHead" id="filterPanelHead">
        <div class="filterPanelTitle">
          <h2>多维度筛选</h2>
          <span class="filterCount" id="filterCount"></span>
        </div>
        <div class="filterPanelActions">
          <span class="currentViewName" id="currentViewName"></span>
          <button class="secondary small" id="toggleFilterPanel">${filterPanelExpanded ? '收起' : '展开'}</button>
        </div>
      </div>
      <div class="filterPanelBody" id="filterPanelBody">
        <div class="viewsBar">
          <div class="viewsList" id="viewsList"></div>
          <div class="viewsActions">
            <button class="secondary small" id="saveViewBtn">💾 保存视图</button>
            <button class="secondary small" id="resetFiltersBtn">🔄 重置</button>
          </div>
        </div>
        <div class="filterGrid">
          <div class="filterItem">
            <label>乐器</label>
            <select id="filterInstrument">
              <option value="">全部乐器</option>
            </select>
          </div>
          <div class="filterItem">
            <label>曲目</label>
            <select id="filterPiece">
              <option value="">全部曲目</option>
            </select>
          </div>
          <div class="filterItem">
            <label>开始日期</label>
            <input type="date" id="filterDateStart" />
          </div>
          <div class="filterItem">
            <label>结束日期</label>
            <input type="date" id="filterDateEnd" />
          </div>
          <div class="filterItem">
            <label>最低BPM</label>
            <input type="number" min="1" step="1" id="filterBpmMin" placeholder="不限" />
          </div>
          <div class="filterItem">
            <label>最高BPM</label>
            <input type="number" min="1" step="1" id="filterBpmMax" placeholder="不限" />
          </div>
          <div class="filterItem">
            <label>最少错误</label>
            <input type="number" min="0" step="1" id="filterMistakesMin" placeholder="不限" />
          </div>
          <div class="filterItem">
            <label>最多错误</label>
            <input type="number" min="0" step="1" id="filterMistakesMax" placeholder="不限" />
          </div>
          <div class="filterItem filterItemFull">
            <label>备注关键词</label>
            <input type="text" id="filterNoteKeyword" placeholder="输入备注关键词..." />
          </div>
        </div>
        <div class="activeFilters" id="activeFilters"></div>
      </div>
    </section>

    <section class="panel planPanel">
      <div class="panelHead">
        <h2>今日练习计划</h2>
        <span class="planDate">${getToday()}</span>
      </div>
      <form id="planForm" class="planForm">
        <input name="piece" placeholder="曲目" required />
        <div class="pair">
          <input name="targetBpm" type="number" min="1" step="1" placeholder="目标BPM" required />
          <input name="estimatedMinutes" type="number" min="1" step="1" placeholder="预计分钟" required />
        </div>
        <button class="primary">添加任务</button>
      </form>
      <div id="planList" class="planList"></div>
    </section>

    <section class="panel goalsPanel">
      <div class="panelHead">
        <h2>练习目标</h2>
        <span class="muted" id="goalsSummary"></span>
      </div>
      <form id="goalForm" class="goalForm">
        <div class="pair">
          <select name="piece" required>
            <option value="">选择曲目</option>
          </select>
          <input name="targetBpm" type="number" min="1" step="1" placeholder="目标BPM" required />
        </div>
        <div class="pair">
          <input name="targetDate" type="date" required />
          <input name="weeklyMinutes" type="number" min="1" step="1" placeholder="每周练习分钟" required />
        </div>
        <button class="primary">设置目标</button>
      </form>
      <div id="goalsList" class="goalsList"></div>
    </section>

    <section class="panel goalDashboard">
      <div class="panelHead"><h2>目标进度仪表盘</h2></div>
      <div id="goalDashboard" class="goalDashboardGrid"></div>
    </section>

    <section class="layout">
      <form id="form" class="panel">
        <h2>练习记录</h2>
        <input name="instrument" placeholder="乐器" required />
        <input name="piece" placeholder="曲目" required />
        <input name="date" type="date" required />
        <div class="pair">
          <input name="bpm" type="number" min="1" step="1" placeholder="整体速度BPM" required />
          <input name="minutes" type="number" min="1" step="1" placeholder="练习时长min" required />
        </div>
        <input name="mistakes" type="number" min="0" step="1" placeholder="整体错误次数" required />
        <textarea name="note" placeholder="整体备注"></textarea>

        <div class="sectionDivider">
          <span>分段练习复盘</span>
          <button type="button" id="addSectionBtn" class="secondary small">+ 添加片段</button>
        </div>
        <div id="sectionsList" class="sectionsList"></div>
        <div id="sectionQuickAdd" class="sectionQuickAdd">
          <span>快速添加：</span>
          ${defaultSectionNames.map(name => `<button type="button" class="quickSectionBtn" data-name="${name}">${name}</button>`).join('')}
        </div>

        <button class="primary">保存记录</button>
      </form>

      <div>
        <section class="summary" id="summary"></section>
        <section class="panel">
          <div class="panelHead"><h2>BPM提升曲线</h2><select id="pieceFilter"></select></div>
          <div class="chart" id="bpmChart"></div>
        </section>
      </div>
    </section>

    <section class="cards">
      <div class="panel"><h2>练习时长趋势</h2><div class="chart small" id="minutesChart"></div></div>
      <div class="panel"><h2>错误次数变化</h2><div class="chart small" id="mistakeChart"></div></div>
    </section>

    <section class="panel">
      <div class="panelHead"><h2>记录列表</h2><input id="search" placeholder="搜索乐器、曲目或备注" /></div>
      <div id="filterBadge" class="filterBadge"></div>
      <div class="tableWrap"><table><thead><tr><th>日期</th><th>乐器</th><th>曲目</th><th>BPM</th><th>时长</th><th>错误</th><th></th></tr></thead><tbody id="rows"></tbody></table></div>
    </section>

    <section class="panel">
      <div class="panelHead"><h2>曲目档案</h2><span class="muted" id="archiveCount"></span></div>
      <div id="trackArchive" class="trackArchive"></div>
    </section>
  </main>
`;

const form = document.querySelector('#form');
const search = document.querySelector('#search');
const pieceFilter = document.querySelector('#pieceFilter');
const planForm = document.querySelector('#planForm');
const goalForm = document.querySelector('#goalForm');

planForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(planForm).entries());
  const task = {
    id: crypto.randomUUID(),
    piece: data.piece,
    targetBpm: Number(data.targetBpm),
    estimatedMinutes: Number(data.estimatedMinutes),
    completed: false,
    date: getToday()
  };
  planTasks.push(task);
  savePlan(planTasks);
  planForm.reset();
  render();
});

goalForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(goalForm).entries());
  const existingGoal = goals.find(g => g.piece === data.piece && !g.achieved);
  if (existingGoal) {
    if (!confirm('该曲目已有进行中的目标，是否覆盖？')) return;
    goals = goals.filter(g => g.id !== existingGoal.id);
  }
  const startBpm = getMaxBpm(data.piece) || 0;
  const goal = {
    id: crypto.randomUUID(),
    piece: data.piece,
    targetBpm: Number(data.targetBpm),
    startBpm,
    targetDate: data.targetDate,
    weeklyMinutes: Number(data.weeklyMinutes),
    createdAt: getToday(),
    achieved: false,
    achievedAt: null
  };
  goals.push(goal);
  saveGoals(goals);
  goalForm.reset();
  render();
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  const item = {
    ...data,
    bpm: Number(data.bpm),
    minutes: Number(data.minutes),
    mistakes: Number(data.mistakes),
    id: editingId || crypto.randomUUID(),
    sections: currentSections.length ? [...currentSections] : undefined
  };
  if (!editingId && isDuplicate(item, records)) {
    alert('已存在相同练习记录，请勿重复提交');
    return;
  }
  const updatedRecords = editingId
    ? records.map((record) => (record.id === editingId ? item : record))
    : [item, ...records];
  const action = editingId ? 'edit' : 'add';
  const details = editingId
    ? { name: `${item.instrument} - ${item.piece} (${item.date})`, ids: [item.id] }
    : { count: 1, names: [`${item.instrument} - ${item.piece} (${item.date})`], ids: [item.id] };
  const vmResult = VersionManager.recordChange(action, updatedRecords, details);
  records = vmResult.records;
  editingId = null;
  currentSections = [];
  form.reset();
  render();
});
document.querySelector('#addSectionBtn').addEventListener('click', () => addSection());

document.querySelectorAll('.quickSectionBtn').forEach(btn => {
  btn.addEventListener('click', () => addSection(btn.dataset.name));
});

search.addEventListener('input', render);
pieceFilter.addEventListener('change', () => {
  archiveFilter = '';
  render();
});
document.querySelector('#sample').addEventListener('click', async () => {
  const confirmed = await showConfirm('重置数据', '确定要重置为示例数据吗？当前所有记录将被清除，此操作可通过历史版本回滚。');
  if (!confirmed) return;
  const result = VersionManager.resetToSampleData();
  records = result.records;
  render();
});

let pendingImportData = null;

const exportBtn = document.querySelector('#exportBtn');
const importBtn = document.querySelector('#importBtn');
const importFile = document.querySelector('#importFile');
const importModal = document.querySelector('#importModal');
const importPreview = document.querySelector('#importPreview');
const modalClose = document.querySelector('#modalClose');
const modalCancel = document.querySelector('#modalCancel');
const modalConfirm = document.querySelector('#modalConfirm');

function exportData() {
  const data = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    records: records
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `music-practice-${getToday()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function validateSection(section, recordIndex, sectionIndex) {
  const errors = [];
  const requiredFields = ['name', 'bpm', 'mistakes', 'mastery'];
  const numberFields = ['bpm', 'mistakes', 'mastery'];

  if (typeof section !== 'object' || section === null || Array.isArray(section)) {
    return { valid: false, errors: [`第 ${recordIndex + 1} 条记录的第 ${sectionIndex + 1} 个片段不是有效的对象`] };
  }

  for (const field of requiredFields) {
    if (section[field] === undefined || section[field] === null || section[field] === '') {
      errors.push(`第 ${recordIndex + 1} 条记录的第 ${sectionIndex + 1} 个片段缺少必填字段: ${field}`);
    }
  }

  for (const field of numberFields) {
    if (section[field] !== undefined && section[field] !== null) {
      const num = Number(section[field]);
      if (isNaN(num)) {
        errors.push(`第 ${recordIndex + 1} 条记录的第 ${sectionIndex + 1} 个片段字段 ${field} 必须是数字`);
      } else if (field === 'bpm' && num < 1) {
        errors.push(`第 ${recordIndex + 1} 条记录的第 ${sectionIndex + 1} 个片段字段 ${field} 必须大于 0`);
      } else if (field === 'mistakes' && num < 0) {
        errors.push(`第 ${recordIndex + 1} 条记录的第 ${sectionIndex + 1} 个片段字段 ${field} 不能为负数`);
      } else if (field === 'mastery' && (num < 1 || num > 5)) {
        errors.push(`第 ${recordIndex + 1} 条记录的第 ${sectionIndex + 1} 个片段掌握程度必须在 1-5 之间`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

function validateRecord(record, index) {
  const errors = [];
  const requiredFields = ['instrument', 'piece', 'date', 'bpm', 'minutes', 'mistakes'];
  const numberFields = ['bpm', 'minutes', 'mistakes'];

  if (typeof record !== 'object' || record === null || Array.isArray(record)) {
    return { valid: false, errors: [`第 ${index + 1} 条记录不是有效的对象`] };
  }

  for (const field of requiredFields) {
    if (record[field] === undefined || record[field] === null || record[field] === '') {
      errors.push(`缺少必填字段: ${field}`);
    }
  }

  for (const field of numberFields) {
    if (record[field] !== undefined && record[field] !== null) {
      const num = Number(record[field]);
      if (isNaN(num)) {
        errors.push(`字段 ${field} 必须是数字`);
      } else if (field === 'minutes' && num < 1) {
        errors.push(`字段 ${field} 必须大于 0`);
      } else if (field === 'mistakes' && num < 0) {
        errors.push(`字段 ${field} 不能为负数`);
      } else if (field === 'bpm' && num < 1) {
        errors.push(`字段 ${field} 必须大于 0`);
      }
    }
  }

  if (record.date && !/^\d{4}-\d{2}-\d{2}$/.test(record.date)) {
    errors.push('日期格式必须为 YYYY-MM-DD');
  }

  if (record.sections !== undefined && record.sections !== null) {
    if (!Array.isArray(record.sections)) {
      errors.push('sections 字段必须是数组');
    } else {
      record.sections.forEach((section, sectionIndex) => {
        const sectionValidation = validateSection(section, index, sectionIndex);
        if (!sectionValidation.valid) {
          errors.push(...sectionValidation.errors);
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.map(e => `第 ${index + 1} 条: ${e}`)
  };
}

function isDuplicate(record, existingRecords) {
  return existingRecords.some(r =>
    r.instrument === record.instrument &&
    r.piece === record.piece &&
    r.date === record.date &&
    r.bpm === Number(record.bpm) &&
    r.minutes === Number(record.minutes) &&
    r.mistakes === Number(record.mistakes)
  );
}

function parseImportFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const parsed = JSON.parse(content);
        resolve(parsed);
      } catch (err) {
        reject(new Error('JSON 解析失败，请检查文件格式'));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}

function processImportData(parsedData) {
  const result = {
    validRecords: [],
    newRecords: [],
    duplicateRecords: [],
    invalidRecords: [],
    allErrors: []
  };

  let importRecords = [];

  if (Array.isArray(parsedData)) {
    importRecords = parsedData;
  } else if (parsedData && Array.isArray(parsedData.records)) {
    importRecords = parsedData.records;
  } else {
    throw new Error('无法识别的文件格式，请确保文件包含 records 数组或本身就是记录数组');
  }

  if (importRecords.length === 0) {
    throw new Error('文件中没有找到任何练习记录');
  }

  importRecords.forEach((record, index) => {
    const validation = validateRecord(record, index);

    if (!validation.valid) {
      result.invalidRecords.push({ record, index });
      result.allErrors.push(...validation.errors);
      return;
    }

    const normalizedRecord = {
      id: crypto.randomUUID(),
      instrument: String(record.instrument).trim(),
      piece: String(record.piece).trim(),
      date: String(record.date).trim(),
      bpm: Number(record.bpm),
      minutes: Number(record.minutes),
      mistakes: Number(record.mistakes),
      note: record.note ? String(record.note).trim() : ''
    };

    if (record.sections && Array.isArray(record.sections) && record.sections.length > 0) {
      normalizedRecord.sections = record.sections.map(section => ({
        id: crypto.randomUUID(),
        name: String(section.name).trim(),
        bpm: Number(section.bpm),
        mistakes: Number(section.mistakes),
        mastery: Number(section.mastery),
        note: section.note ? String(section.note).trim() : ''
      }));
    }

    result.validRecords.push({ record: normalizedRecord, index });

    if (isDuplicate(normalizedRecord, records)) {
      result.duplicateRecords.push({ record: normalizedRecord, index });
    } else {
      result.newRecords.push({ record: normalizedRecord, index });
    }
  });

  return result;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderImportPreview(result) {
  const { newRecords, duplicateRecords, invalidRecords, allErrors } = result;
  const total = newRecords.length + duplicateRecords.length + invalidRecords.length;

  let html = '';

  html += `
    <div class="importSummary">
      <div class="summaryItem new">
        <span class="summaryCount">${newRecords.length}</span>
        <span class="summaryLabel">新增记录</span>
      </div>
      <div class="summaryItem duplicate">
        <span class="summaryCount">${duplicateRecords.length}</span>
        <span class="summaryLabel">重复记录</span>
      </div>
      <div class="summaryItem invalid">
        <span class="summaryCount">${invalidRecords.length}</span>
        <span class="summaryLabel">格式错误</span>
      </div>
    </div>
    <div class="importModeSection">
      <h3>导入模式</h3>
      <label class="importModeOption">
        <input type="radio" name="importMode" value="merge" checked />
        <div>
          <strong>合并导入</strong>
          <span class="muted">将新记录追加到现有数据（推荐）</span>
        </div>
      </label>
      <label class="importModeOption">
        <input type="radio" name="importMode" value="overwrite" />
        <div>
          <strong>覆盖导入</strong>
          <span class="muted">清除所有现有记录，仅保留导入数据。此操作可通过历史版本回滚。</span>
        </div>
      </label>
    </div>
  `;

  if (allErrors.length > 0) {
    html += `
      <div class="importSection errors">
        <h3>❌ 格式错误 (${invalidRecords.length})</h3>
        <ul class="errorList">
          ${allErrors.map(e => `<li>${escapeHtml(e)}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  if (duplicateRecords.length > 0) {
    html += `
      <div class="importSection duplicates">
        <h3>⚠️ 重复记录 (${duplicateRecords.length}) - 合并模式会跳过，覆盖模式会保留</h3>
        <div class="tableWrap">
          <table class="previewTable">
            <thead>
              <tr>
                <th>序号</th>
                <th>日期</th>
                <th>乐器</th>
                <th>曲目</th>
                <th>BPM</th>
                <th>时长</th>
                <th>错误</th>
              </tr>
            </thead>
            <tbody>
              ${duplicateRecords.map(({ record, index }) => `
                <tr class="duplicateRow">
                  <td>${index + 1}</td>
                  <td>${escapeHtml(record.date)}</td>
                  <td>${escapeHtml(record.instrument)}</td>
                  <td>${escapeHtml(record.piece)}</td>
                  <td>${record.bpm}</td>
                  <td>${record.minutes}min</td>
                  <td>${record.mistakes}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  if (newRecords.length > 0) {
    html += `
      <div class="importSection new">
        <h3>✅ 新增记录 (${newRecords.length}) - 合并模式将导入这些记录</h3>
        <div class="tableWrap">
          <table class="previewTable">
            <thead>
              <tr>
                <th>序号</th>
                <th>日期</th>
                <th>乐器</th>
                <th>曲目</th>
                <th>BPM</th>
                <th>时长</th>
                <th>错误</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              ${newRecords.map(({ record, index }) => `
                <tr class="newRow">
                  <td>${index + 1}</td>
                  <td>${escapeHtml(record.date)}</td>
                  <td>${escapeHtml(record.instrument)}</td>
                  <td>${escapeHtml(record.piece)}</td>
                  <td>${record.bpm}</td>
                  <td>${record.minutes}min</td>
                  <td>${record.mistakes}</td>
                  <td>${record.note ? escapeHtml(record.note) : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  importPreview.innerHTML = html;
  importPreview.querySelectorAll('input[name="importMode"]').forEach((radio) => {
    radio.addEventListener('change', updateImportConfirmState);
  });
  updateImportConfirmState();
}

function getSelectedImportMode() {
  const modeEl = importPreview.querySelector('input[name="importMode"]:checked');
  return modeEl ? modeEl.value : 'merge';
}

function updateImportConfirmState() {
  if (!pendingImportData) {
    modalConfirm.disabled = true;
    modalConfirm.textContent = '确认导入';
    return;
  }

  const mode = getSelectedImportMode();
  const importCount = mode === 'overwrite'
    ? pendingImportData.validRecords.length
    : pendingImportData.newRecords.length;

  modalConfirm.disabled = importCount === 0;
  if (importCount === 0) {
    modalConfirm.textContent = mode === 'overwrite' ? '无有效数据可覆盖' : '无新增数据可导入';
  } else {
    modalConfirm.textContent = mode === 'overwrite'
      ? `确认覆盖导入 ${importCount} 条记录`
      : `确认导入 ${importCount} 条记录`;
  }
}

function showImportError(message) {
  importPreview.innerHTML = `
    <div class="importError">
      <h3>❌ 导入失败</h3>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
  modalConfirm.disabled = true;
  modalConfirm.textContent = '确认导入';
}

function openImportModal() {
  importFile.value = '';
  pendingImportData = null;
  importPreview.innerHTML = `
    <div class="importSelect">
      <p>请选择要导入的 JSON 文件</p>
      <button class="primary" id="selectFileBtn">选择文件</button>
      <p class="muted">支持导出的 JSON 文件格式</p>
    </div>
  `;
  modalConfirm.disabled = true;
  modalConfirm.textContent = '确认导入';
  importModal.hidden = false;

  setTimeout(() => {
    const selectFileBtn = document.querySelector('#selectFileBtn');
    if (selectFileBtn) {
      selectFileBtn.addEventListener('click', () => importFile.click());
    }
  }, 0);
}

function closeImportModal() {
  importModal.hidden = true;
  pendingImportData = null;
}

exportBtn.addEventListener('click', exportData);
importBtn.addEventListener('click', openImportModal);
modalClose.addEventListener('click', closeImportModal);
modalCancel.addEventListener('click', closeImportModal);
importModal.querySelector('.modalOverlay').addEventListener('click', closeImportModal);

importFile.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const parsed = await parseImportFile(file);
    const result = processImportData(parsed);
    pendingImportData = result;
    renderImportPreview(result);
  } catch (err) {
    showImportError(err.message);
  }
});

modalConfirm.addEventListener('click', async () => {
  if (!pendingImportData) return;

  const mode = getSelectedImportMode();
  const newRecords = pendingImportData.newRecords.map(item => item.record);
  const validRecords = pendingImportData.validRecords.map(item => item.record);
  const recordsToImport = mode === 'overwrite' ? validRecords : newRecords;
  if (recordsToImport.length === 0) return;

  let finalRecords;
  if (mode === 'overwrite') {
    const confirmed = await showConfirm(
      '覆盖导入确认',
      `确定要用导入的 ${recordsToImport.length} 条记录覆盖所有现有 ${records.length} 条记录吗？\n此操作可通过历史版本回滚。`
    );
    if (!confirmed) return;
    finalRecords = recordsToImport;
  } else {
    finalRecords = [...recordsToImport, ...records];
  }

  const result = VersionManager.recordChange('import', finalRecords, {
    count: recordsToImport.length,
    mode,
    ids: recordsToImport.map(r => r.id)
  });
  records = result.records;
  render();
  closeImportModal();

  const count = recordsToImport.length;
  const modeText = mode === 'overwrite' ? '（覆盖模式）' : '';
  alert(`成功导入 ${count} 条练习记录${modeText}！`);
});

function showPrompt(title, message, placeholder = '', defaultValue = '') {
  return new Promise((resolve) => {
    const modal = document.querySelector('#promptModal');
    const titleEl = document.querySelector('#promptTitle');
    const messageEl = document.querySelector('#promptMessage');
    const inputEl = document.querySelector('#promptInput');
    const confirmBtn = document.querySelector('#promptConfirm');
    const cancelBtn = document.querySelector('#promptCancel');
    const closeBtn = document.querySelector('#promptClose');
    const overlay = modal.querySelector('.modalOverlay');

    titleEl.textContent = title;
    messageEl.textContent = message;
    inputEl.placeholder = placeholder;
    inputEl.value = defaultValue;

    modal.hidden = false;
    setTimeout(() => inputEl.focus(), 50);

    const cleanup = () => {
      modal.hidden = true;
      confirmBtn.onclick = null;
      cancelBtn.onclick = null;
      closeBtn.onclick = null;
      overlay.onclick = null;
      inputEl.onkeydown = null;
    };

    confirmBtn.onclick = () => {
      const value = inputEl.value;
      cleanup();
      resolve(value);
    };

    cancelBtn.onclick = () => {
      cleanup();
      resolve(null);
    };

    closeBtn.onclick = () => {
      cleanup();
      resolve(null);
    };

    overlay.onclick = () => {
      cleanup();
      resolve(null);
    };

    inputEl.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        confirmBtn.click();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelBtn.click();
      }
    };
  });
}

function showConfirm(title, message) {
  return new Promise((resolve) => {
    const modal = document.querySelector('#confirmModal');
    const titleEl = document.querySelector('#confirmTitle');
    const messageEl = document.querySelector('#confirmMessage');
    const confirmBtn = document.querySelector('#confirmConfirm');
    const cancelBtn = document.querySelector('#confirmCancel');
    const closeBtn = document.querySelector('#confirmClose');
    const overlay = modal.querySelector('.modalOverlay');

    titleEl.textContent = title;
    messageEl.textContent = message;

    modal.hidden = false;

    const cleanup = () => {
      modal.hidden = true;
      confirmBtn.onclick = null;
      cancelBtn.onclick = null;
      closeBtn.onclick = null;
      overlay.onclick = null;
    };

    confirmBtn.onclick = () => {
      cleanup();
      resolve(true);
    };

    cancelBtn.onclick = () => {
      cleanup();
      resolve(false);
    };

    closeBtn.onclick = () => {
      cleanup();
      resolve(false);
    };

    overlay.onclick = () => {
      cleanup();
      resolve(false);
    };
  });
}

function save() {
  console.warn('[Deprecation] save() is deprecated, use VersionManager.recordChange() instead');
  localStorage.setItem(key, JSON.stringify(records));
}

const historyModal = document.querySelector('#historyModal');
const historyListEl = document.querySelector('#historyList');
const historyBtn = document.querySelector('#historyBtn');
const historyClose = document.querySelector('#historyClose');
const historyCancelBtn = document.querySelector('#historyCancelBtn');
const historyCurrentVersionEl = document.querySelector('#historyCurrentVersion');

function getActionLabel(action) {
  const labels = {
    add: { text: '新增', icon: '➕', color: '#059669', bg: '#dcfce7' },
    edit: { text: '编辑', icon: '✏️', color: '#d97706', bg: '#fef3c7' },
    delete: { text: '删除', icon: '🗑️', color: '#dc2626', bg: '#fee2e2' },
    import: { text: '导入', icon: '📥', color: '#0891b2', bg: '#cffafe' },
    reset: { text: '重置', icon: '🔄', color: '#7c3aed', bg: '#ede9fe' },
    rollback: { text: '回滚', icon: '⏪', color: '#0369a1', bg: '#dbeafe' },
    migrate: { text: '迁移', icon: '⬆️', color: '#6b7280', bg: '#f3f4f6' }
  };
  return labels[action] || { text: '未知', icon: '❓', color: '#6b7280', bg: '#f3f4f6' };
}

function formatTime(isoString) {
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function renderHistory() {
  const history = VersionManager.getHistory();
  const currentVersion = VersionManager.getCurrentVersion();
  historyCurrentVersionEl.textContent = `当前版本：v${currentVersion} · 共 ${history.length} 条历史记录`;

  if (history.length === 0) {
    historyListEl.innerHTML = `
      <div class="historyEmpty">
        <p class="muted">暂无历史记录</p>
      </div>
    `;
    return;
  }

  historyListEl.innerHTML = history.map((entry) => {
    const action = getActionLabel(entry.action);
    const isCurrent = entry.version === currentVersion;
    const snapshotCount = entry.snapshot ? entry.snapshot.length : 0;
    const rollbackInfo = entry.action === 'rollback' && entry.meta && entry.meta.rollbackFromVersion
      ? `<span class="historyMetaTag historyRollback">从 v${entry.meta.rollbackFromVersion} 回滚</span>`
      : '';
    const importInfo = entry.action === 'import' && entry.meta && entry.meta.mode === 'overwrite'
      ? `<span class="historyMetaTag historyOverwrite">覆盖模式</span>`
      : '';

    return `
      <div class="historyItem ${isCurrent ? 'current' : ''}" data-history-id="${entry.id}">
        <div class="historyItemHead">
          <div class="historyBadge" style="background: ${action.bg}; color: ${action.color}">
            <span class="historyIcon">${action.icon}</span>
            <span>${action.text}</span>
          </div>
          <div class="historyVersion">
            <strong>v${entry.version}</strong>
            ${isCurrent ? '<span class="historyCurrentTag">当前</span>' : ''}
          </div>
        </div>
        <div class="historyItemBody">
          <p class="historyDesc">${escapeHtml(entry.description)}</p>
          <div class="historyMeta">
            <span class="historyMetaItem">🕐 ${formatTime(entry.timestamp)}</span>
            <span class="historyMetaItem">📊 ${snapshotCount} 条记录</span>
            <span class="historyMetaItem">🎯 影响 ${entry.affectedRecordIds.length} 条</span>
            ${rollbackInfo}
            ${importInfo}
          </div>
        </div>
        <div class="historyItemActions">
          ${!isCurrent ? `<button class="primary small" data-rollback="${entry.id}">⏪ 回滚到此版本</button>` : ''}
          <button class="secondary small" data-preview="${entry.id}">👁 预览</button>
        </div>
        <div class="historyPreview" data-preview-panel="${entry.id}" hidden></div>
      </div>
    `;
  }).join('');

  historyListEl.querySelectorAll('[data-rollback]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const historyId = e.currentTarget.dataset.rollback;
      const entry = history.find((h) => h.id === historyId);
      if (!entry) return;

      const confirmed = await showConfirm(
        '回滚确认',
        `确定要回滚到版本 v${entry.version} 吗？\n\n操作：${entry.description}\n时间：${formatTime(entry.timestamp)}\n\n此操作会生成一条新的历史记录，可以再次回滚。`
      );
      if (!confirmed) return;

      const result = VersionManager.rollback(historyId);
      if (result.success) {
        records = result.records;
        renderHistory();
        render();
        alert(`已成功回滚到版本 v${entry.version}！\n图表和数据已重新计算。`);
      } else {
        alert(`回滚失败：${result.error || '未知错误'}`);
      }
    });
  });

  historyListEl.querySelectorAll('[data-preview]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const historyId = e.currentTarget.dataset.preview;
      const panel = historyListEl.querySelector(`[data-preview-panel="${historyId}"]`);
      if (!panel) return;

      if (panel.hidden) {
        const entry = history.find((h) => h.id === historyId);
        if (entry && entry.snapshot) {
          panel.innerHTML = renderHistorySnapshotPreview(entry.snapshot);
        }
        panel.hidden = false;
        e.currentTarget.textContent = '🙈 收起';
      } else {
        panel.hidden = true;
        panel.innerHTML = '';
        e.currentTarget.textContent = '👁 预览';
      }
    });
  });
}

function renderHistorySnapshotPreview(snapshot) {
  if (!snapshot || snapshot.length === 0) {
    return '<div class="historyPreviewEmpty"><p class="muted">该版本无记录</p></div>';
  }

  return `
    <div class="historyPreviewHeader">该版本包含 ${snapshot.length} 条记录：</div>
    <div class="tableWrap">
      <table class="previewTable">
        <thead>
          <tr>
            <th>日期</th>
            <th>乐器</th>
            <th>曲目</th>
            <th>BPM</th>
            <th>时长</th>
            <th>错误</th>
            <th>备注</th>
          </tr>
        </thead>
        <tbody>
          ${snapshot.slice().sort((a, b) => b.date.localeCompare(a.date)).map((r) => `
            <tr>
              <td>${escapeHtml(r.date)}</td>
              <td>${escapeHtml(r.instrument)}</td>
              <td>${escapeHtml(r.piece)}</td>
              <td>${r.bpm}</td>
              <td>${r.minutes}min</td>
              <td>${r.mistakes}</td>
              <td>${r.note ? escapeHtml(r.note) : '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function openHistoryModal() {
  renderHistory();
  historyModal.hidden = false;
}

function closeHistoryModal() {
  historyModal.hidden = true;
}

historyBtn.addEventListener('click', openHistoryModal);
historyClose.addEventListener('click', closeHistoryModal);
historyCancelBtn.addEventListener('click', closeHistoryModal);
historyModal.querySelector('.modalOverlay').addEventListener('click', closeHistoryModal);

function renderFilterPanel() {
  const instruments = [...new Set(records.map((record) => record.instrument))].sort();
  const pieces = [...new Set(records.map((record) => record.piece))].sort();

  const filterInstrument = document.querySelector('#filterInstrument');
  const filterPiece = document.querySelector('#filterPiece');
  const filterDateStart = document.querySelector('#filterDateStart');
  const filterDateEnd = document.querySelector('#filterDateEnd');
  const filterBpmMin = document.querySelector('#filterBpmMin');
  const filterBpmMax = document.querySelector('#filterBpmMax');
  const filterMistakesMin = document.querySelector('#filterMistakesMin');
  const filterMistakesMax = document.querySelector('#filterMistakesMax');
  const filterNoteKeyword = document.querySelector('#filterNoteKeyword');
  const filterCount = document.querySelector('#filterCount');
  const currentViewName = document.querySelector('#currentViewName');
  const activeFilters = document.querySelector('#activeFilters');
  const viewsList = document.querySelector('#viewsList');
  const filterPanelBody = document.querySelector('#filterPanelBody');
  const toggleBtn = document.querySelector('#toggleFilterPanel');

  filterInstrument.innerHTML = `<option value="">全部乐器</option>${instruments.map(i => `<option value="${escapeHtml(i)}">${escapeHtml(i)}</option>`).join('')}`;
  filterPiece.innerHTML = `<option value="">全部曲目</option>${pieces.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('')}`;

  filterInstrument.value = filters.instrument;
  filterPiece.value = filters.piece;
  filterDateStart.value = filters.dateStart;
  filterDateEnd.value = filters.dateEnd;
  filterBpmMin.value = filters.bpmMin;
  filterBpmMax.value = filters.bpmMax;
  filterMistakesMin.value = filters.mistakesMin;
  filterMistakesMax.value = filters.mistakesMax;
  filterNoteKeyword.value = filters.noteKeyword;

  const activeCount = getActiveFilterCount();
  filterCount.textContent = activeCount > 0 ? `${activeCount} 个筛选条件` : '';
  filterCount.className = `filterCount ${activeCount > 0 ? 'active' : ''}`;

  const currentView = views.find(v => v.id === currentViewId);
  currentViewName.textContent = currentView ? `📌 ${escapeHtml(currentView.name)}` : '';

  const filterDescriptions = getFilterDescription();
  if (filterDescriptions.length > 0) {
    activeFilters.innerHTML = `
      <span class="activeFiltersLabel">当前筛选:</span>
      ${filterDescriptions.map(d => `<span class="activeFilterTag">${escapeHtml(d)}</span>`).join('')}
    `;
  } else {
    activeFilters.innerHTML = '<span class="activeFiltersLabel muted">暂无筛选条件，显示全部记录</span>';
  }

  if (views.length > 0) {
    viewsList.innerHTML = `
      <span class="viewsLabel">常用视图:</span>
      ${views.map(view => `
        <button class="viewTag ${currentViewId === view.id ? 'active' : ''}" data-view-id="${view.id}">
          ${escapeHtml(view.name)}
          <span class="viewTagDel" data-view-del="${view.id}" title="删除视图">×</span>
        </button>
      `).join('')}
    `;
  } else {
    viewsList.innerHTML = '<span class="viewsLabel muted">暂无保存的视图</span>';
  }

  filterPanelBody.style.display = filterPanelExpanded ? 'block' : 'none';
  toggleBtn.textContent = filterPanelExpanded ? '收起' : '展开';

  filterInstrument.onchange = (e) => updateFilter('instrument', e.target.value);
  filterPiece.onchange = (e) => updateFilter('piece', e.target.value);
  filterDateStart.onchange = (e) => updateFilter('dateStart', e.target.value);
  filterDateEnd.onchange = (e) => updateFilter('dateEnd', e.target.value);
  filterBpmMin.oninput = (e) => updateFilter('bpmMin', e.target.value);
  filterBpmMax.oninput = (e) => updateFilter('bpmMax', e.target.value);
  filterMistakesMin.oninput = (e) => updateFilter('mistakesMin', e.target.value);
  filterMistakesMax.oninput = (e) => updateFilter('mistakesMax', e.target.value);
  filterNoteKeyword.oninput = (e) => updateFilter('noteKeyword', e.target.value);

  toggleBtn.onclick = () => {
    filterPanelExpanded = !filterPanelExpanded;
    render();
  };

  document.querySelector('#saveViewBtn').onclick = async () => {
    const name = await showPrompt('保存视图', '请输入视图名称:', '例如：电吉他练习、最近一周等');
    if (name !== null && name !== undefined) {
      const success = await saveView(name);
      if (success) {
        render();
      }
    }
  };

  document.querySelector('#resetFiltersBtn').onclick = async () => {
    const confirmed = await showConfirm('重置筛选', '确定重置所有筛选条件？');
    if (confirmed) {
      resetFilters();
    }
  };

  document.querySelectorAll('[data-view-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (e.target.hasAttribute('data-view-del')) return;
      loadView(btn.dataset.viewId);
    });
  });

  document.querySelectorAll('[data-view-del]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await deleteView(btn.dataset.viewDel);
    });
  });
}

function render() {
  syncGoalAchievements();
  renderSessionPanel();
  renderFilterPanel();
  const selectedPiece = pieceFilter.value;
  const pieces = [...new Set(records.map((record) => record.piece))].sort();
  pieceFilter.innerHTML = `<option value="">全部曲目</option>${pieces.map((piece) => `<option value="${escapeHtml(piece)}">${escapeHtml(piece)}</option>`).join('')}`;
  const goalPieceSelect = goalForm.querySelector('select[name="piece"]');
  goalPieceSelect.innerHTML = `<option value="">选择曲目</option>${pieces.map((piece) => `<option value="${escapeHtml(piece)}">${escapeHtml(piece)}</option>`).join('')}`;
  if (archiveFilter) {
    pieceFilter.value = pieces.includes(archiveFilter) ? archiveFilter : '';
  } else {
    pieceFilter.value = selectedPiece && pieces.includes(selectedPiece) ? selectedPiece : '';
  }

  renderSections();
  const effectivePieceFilter = archiveFilter || pieceFilter.value;
  let filtered = records
    .filter((record) => !effectivePieceFilter || record.piece === effectivePieceFilter)
    .filter((record) => [record.instrument, record.piece, record.note].join(' ').includes(search.value.trim()))
    .sort((a, b) => a.date.localeCompare(b.date));

  filtered = applyFilters(filtered);
  const uncompletedCount = planTasks.filter((task) => !task.completed).length;
  const totalEstimated = planTasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);
  const filteredPieces = [...new Set(filtered.map((record) => record.piece))];
  const activeFilters = hasActiveFilters();
  const totalMinutes = filtered.reduce((sum, record) => sum + record.minutes, 0);
  const avgBpm = filtered.length ? Math.round(avg(filtered.map((record) => record.bpm))) : 0;
  const recordCount = filtered.length;
  const avgMistakes = filtered.length ? Math.round(avg(filtered.map((record) => record.mistakes))) : 0;

  document.querySelector('#summary').innerHTML = [
    [activeFilters ? '筛选时长' : '总练习时长', `${totalMinutes}min${activeFilters ? ' / ' + records.reduce((sum, r) => sum + r.minutes, 0) + 'min' : ''}`],
    [activeFilters ? '筛选曲目' : '曲目数', activeFilters ? `${filteredPieces.length} / ${pieces.length}` : pieces.length],
    [activeFilters ? '筛选平均BPM' : '平均BPM', activeFilters ? `${avgBpm} / ${Math.round(avg(records.map((r) => r.bpm)))}` : Math.round(avg(records.map((r) => r.bpm)))],
    ['筛选记录数', `${recordCount} 条`],
    ['平均错误', `${avgMistakes} 次`]
  ].map(([label, value]) => `<article><span>${label}</span><strong>${value}</strong></article>`).join('');
  drawLine('#bpmChart', filtered.map((record) => ({ label: record.date.slice(5), value: record.bpm })), 'BPM', '#0f766e');
  drawBars('#minutesChart', groupDay(filtered, 'minutes'), 'min', '#d97706');
  drawLine('#mistakeChart', filtered.map((record) => ({ label: record.date.slice(5), value: record.mistakes })), '次', '#dc2626');

  const filterBadge = document.querySelector('#filterBadge');
  if (archiveFilter) {
    filterBadge.innerHTML = `<span class="filterTag">筛选: ${escapeHtml(archiveFilter)} <button id="clearFilter" class="clearFilter">×</button></span>`;
    document.querySelector('#clearFilter').addEventListener('click', () => {
      archiveFilter = '';
      pieceFilter.value = '';
      render();
    });
  } else {
    filterBadge.innerHTML = '';
  }

  document.querySelector('#rows').innerHTML = filtered.slice().reverse().map((record) => {
    const sections = getSections(record);
    return `
      <tr>
        <td>${escapeHtml(record.date)}</td>
        <td>${escapeHtml(record.instrument)}</td>
        <td>${escapeHtml(record.piece)}</td>
        <td>${record.bpm}</td>
        <td>${record.minutes}min</td>
        <td>${record.mistakes}</td>
        <td>
          ${sections.length ? `<button data-sections="${escapeHtml(record.id)}" class="sectionViewBtn" title="查看片段">📋 ${sections.length}段</button>` : ''}
          <button data-edit="${escapeHtml(record.id)}">编辑</button>
          <button data-del="${escapeHtml(record.id)}">删除</button>
        </td>
      </tr>
      ${sections.length ? `
      <tr class="sectionDetailRow" data-section-detail="${escapeHtml(record.id)}" hidden>
        <td colspan="7">
          <div class="sectionDetail">
            <div class="sectionDetailTitle">练习片段详情</div>
            <div class="sectionDetailGrid">
              ${sections.map(s => `
                <div class="sectionDetailCard">
                  <div class="sectionDetailHead">
                    <strong>${escapeHtml(s.name)}</strong>
                    <span class="masteryBadge" style="background: ${getMasteryColor(s.mastery)}">${getMasteryLabel(s.mastery)}</span>
                  </div>
                  <div class="sectionDetailStats">
                    <span>BPM: <strong>${s.bpm}</strong></span>
                    <span>错误: <strong>${s.mistakes}</strong>次</span>
                  </div>
                  ${s.note ? `<div class="sectionDetailNote">${escapeHtml(s.note)}</div>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        </td>
      </tr>
      ` : ''}
    `;
  }).join('');

  document.querySelectorAll('[data-del]').forEach((button) => button.addEventListener('click', async () => {
    const recordId = button.dataset.del;
    const record = records.find((r) => r.id === recordId);
    if (!record) return;
    const confirmed = await showConfirm('删除记录', `确定要删除这条记录吗？\n${record.instrument} - ${record.piece} (${record.date})\n此操作可通过历史版本回滚。`);
    if (!confirmed) return;
    const filtered = records.filter((r) => r.id !== recordId);
    const result = VersionManager.recordChange('delete', filtered, {
      name: `${record.instrument} - ${record.piece} (${record.date})`,
      ids: [recordId]
    });
    records = result.records;
    render();
  }));

  document.querySelectorAll('[data-edit]').forEach((button) => button.addEventListener('click', () => {
    const record = records.find((item) => item.id === button.dataset.edit);
    editingId = record.id;
    currentSections = getSections(record).map(s => ({ ...s }));
    Object.entries(record).forEach(([name, value]) => {
      if (form.elements[name]) form.elements[name].value = value;
    });
    renderSections();
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));

  document.querySelectorAll('[data-sections]').forEach((button) => button.addEventListener('click', () => {
    const detailRow = document.querySelector(`[data-section-detail="${button.dataset.sections}"]`);
    if (detailRow) {
      detailRow.hidden = !detailRow.hidden;
      button.textContent = detailRow.hidden ? `📋 ${getSections(records.find(r => r.id === button.dataset.sections)).length}段` : '收起';
    }
  }));
  renderPlan();
  renderArchive();
  renderGoals();
  renderGoalDashboard();
}

function renderArchive() {
  const trackStats = getTrackStats();
  const archiveEl = document.querySelector('#trackArchive');
  const countEl = document.querySelector('#archiveCount');
  countEl.textContent = `共 ${trackStats.length} 首`;

  if (!trackStats.length) {
    archiveEl.innerHTML = '<p class="empty">暂无曲目数据</p>';
    return;
  }

  archiveEl.innerHTML = trackStats.map((track) => {
    const trendColor = track.mistakeTrend < 0 ? '#059669' : track.mistakeTrend > 0 ? '#dc2626' : '#60736f';
    const trendText = track.mistakeTrend < 0 ? `↓ ${Math.abs(track.mistakeTrend)}` : track.mistakeTrend > 0 ? `↑ ${track.mistakeTrend}` : '—';
    const trendSvg = drawTrendLine(track.mistakes.sort((a, b) => a.date.localeCompare(b.date)), trendColor);
    const sectionStats = getSectionStats(track.records);

    return `
      <article class="trackCard ${archiveFilter === track.piece ? 'active' : ''}" data-track="${escapeHtml(track.piece)}">
        <div class="trackHead">
          <div>
            <h3 class="trackTitle">${escapeHtml(track.piece)}</h3>
            <span class="trackInstrument">${escapeHtml(track.instrument)} · ${track.practiceCount} 次练习</span>
          </div>
          <button class="trackFilterBtn" data-filter-track="${escapeHtml(track.piece)}">筛选记录</button>
        </div>
        <div class="trackStats">
          <div class="trackStat">
            <span class="trackStatLabel">最近练习</span>
            <strong class="trackStatValue">${track.lastDate}</strong>
          </div>
          <div class="trackStat">
            <span class="trackStatLabel">最高BPM</span>
            <strong class="trackStatValue">${track.maxBpm}</strong>
          </div>
          <div class="trackStat">
            <span class="trackStatLabel">累计时长</span>
            <strong class="trackStatValue">${track.totalMinutes}min</strong>
          </div>
          <div class="trackStat">
            <span class="trackStatLabel">错误趋势</span>
            <strong class="trackStatValue" style="color: ${trendColor}">${trendText}</strong>
            ${trendSvg}
          </div>
        </div>

        ${sectionStats.length ? `
          <div class="trackSections">
            <div class="trackSectionsTitle">
              <span>📊 片段进步趋势</span>
              <span class="muted">${sectionStats.length} 个片段</span>
            </div>
            <div class="trackSectionsGrid">
              ${sectionStats.map(section => {
                const sectionTrendColor = section.mistakeTrend < 0 ? '#059669' : section.mistakeTrend > 0 ? '#dc2626' : '#60736f';
                const sectionTrendText = section.mistakeTrend < 0 ? `↓ ${Math.abs(section.mistakeTrend)}` : section.mistakeTrend > 0 ? `↑ ${section.mistakeTrend}` : '—';
                const bpmTrendSvg = drawMiniTrendLine(section.bpmHistory, '#0f766e');
                const mistakeTrendSvg = drawMiniTrendLine(section.mistakesHistory, sectionTrendColor);
                const masteryTrendSvg = drawMiniTrendLine(section.masteryHistory, getMasteryColor(section.latestMastery));

                return `
                  <div class="trackSectionCard">
                    <div class="trackSectionHead">
                      <strong class="trackSectionName">${escapeHtml(section.name)}</strong>
                      <span class="masteryBadge" style="background: ${getMasteryColor(section.latestMastery)}">${getMasteryLabel(section.latestMastery)}</span>
                    </div>
                    <div class="trackSectionStats">
                      <div class="trackSectionStat">
                        <span class="trackSectionStatLabel">最高BPM</span>
                        <strong class="trackSectionStatValue">${section.maxBpm}</strong>
                        ${bpmTrendSvg}
                      </div>
                      <div class="trackSectionStat">
                        <span class="trackSectionStatLabel">错误趋势</span>
                        <strong class="trackSectionStatValue" style="color: ${sectionTrendColor}">${sectionTrendText}</strong>
                        ${mistakeTrendSvg}
                      </div>
                      <div class="trackSectionStat">
                        <span class="trackSectionStatLabel">掌握程度</span>
                        <strong class="trackSectionStatValue" style="color: ${getMasteryColor(section.latestMastery)}">${section.latestMastery}/5</strong>
                        ${masteryTrendSvg}
                      </div>
                    </div>
                    <div class="trackSectionMeta">
                      <span class="muted">练习 ${section.practiceCount} 次</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : `
          <div class="trackSectionsEmpty">
            <span class="muted">💡 该曲目暂无分段练习记录，添加练习时可拆分片段进行精细化复盘</span>
          </div>
        `}

        ${track.notes.length ? `
          <div class="trackNotes">
            <div class="trackNotesTitle">练习备注</div>
            <ul class="trackNotesList">
              ${track.notes.map((n) => `<li><span class="noteDate">${escapeHtml(n.date)}</span><span class="noteText">${escapeHtml(n.note)}</span></li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </article>
    `;
  }).join('');

  document.querySelectorAll('[data-filter-track]').forEach((button) => {
    button.addEventListener('click', () => {
      archiveFilter = button.dataset.filterTrack;
      render();
      document.querySelector('#rows').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function renderPlan() {
  const listEl = document.querySelector('#planList');
  if (!planTasks.length) {
    listEl.innerHTML = '<p class="empty">暂无今日练习计划，点击上方添加任务</p>';
    return;
  }
  listEl.innerHTML = planTasks.map((task) => `
    <div class="planTask ${task.completed ? 'completed' : ''}" data-id="${task.id}">
      <label class="taskCheck">
        <input type="checkbox" ${task.completed ? 'checked' : ''} data-toggle="${task.id}" />
        <span class="checkmark"></span>
      </label>
      <div class="taskContent">
        <div class="taskPiece">${escapeHtml(task.piece)}</div>
        <div class="taskMeta">
          <span>目标 BPM: <strong>${task.targetBpm}</strong></span>
          <span>预计: <strong>${task.estimatedMinutes}min</strong></span>
        </div>
      </div>
      <button class="taskDel" data-plan-del="${task.id}" aria-label="删除">×</button>
    </div>
  `).join('');
  document.querySelectorAll('[data-toggle]').forEach((checkbox) => checkbox.addEventListener('change', () => {
    const taskId = checkbox.dataset.toggle;
    planTasks = planTasks.map((task) =>
      task.id === taskId ? { ...task, completed: checkbox.checked } : task
    );
    savePlan(planTasks);
    render();
  }));
  document.querySelectorAll('[data-plan-del]').forEach((button) => button.addEventListener('click', () => {
    planTasks = planTasks.filter((task) => task.id !== button.dataset.planDel);
    savePlan(planTasks);
    render();
  }));
}

function renderGoals() {
  const listEl = document.querySelector('#goalsList');
  const summaryEl = document.querySelector('#goalsSummary');
  const activeGoals = goals.filter(g => !g.achieved);
  const achievedGoals = goals.filter(g => g.achieved);
  summaryEl.textContent = `进行中 ${activeGoals.length} 项 · 已达成 ${achievedGoals.length} 项`;
  if (!goals.length) {
    listEl.innerHTML = '<p class="empty">暂无练习目标，设置目标开始追踪进度</p>';
    return;
  }
  const sortedGoals = [...goals].sort((a, b) => {
    if (a.achieved !== b.achieved) return a.achieved ? 1 : -1;
    return a.targetDate.localeCompare(b.targetDate);
  });
  listEl.innerHTML = sortedGoals.map((goal) => {
    const progress = calculateGoalProgress(goal);
    let statusClass = '';
    let statusText = '';
    if (progress.isAchieved) {
      statusClass = 'achieved';
      statusText = '✓ 已达成';
    } else if (progress.isOverdue) {
      statusClass = 'overdue';
      statusText = `⚠ 已逾期 ${Math.abs(progress.daysRemaining)} 天`;
    } else {
      statusText = `剩余 ${progress.daysRemaining} 天`;
    }
    return `
      <div class="goalCard ${statusClass}" data-id="${goal.id}">
        <div class="goalHead">
          <div>
            <h3 class="goalPiece">${escapeHtml(goal.piece)}</h3>
            <div class="goalMeta">
              <span>目标 BPM: <strong>${goal.targetBpm}</strong></span>
              <span>截止: <strong>${goal.targetDate}</strong></span>
              <span>每周: <strong>${goal.weeklyMinutes}min</strong></span>
            </div>
          </div>
          <div class="goalStatus ${statusClass}">${statusText}</div>
        </div>
        <div class="goalProgress">
          <div class="progressRow">
            <span class="progressLabel">BPM 进度</span>
            <span class="progressValue">${progress.currentBpm} / ${goal.targetBpm} (${progress.bpmProgress}%)</span>
          </div>
          <div class="progressBar"><div class="progressFill bpm" style="width: ${progress.bpmProgress}%"></div></div>
          <div class="progressRow">
            <span class="progressLabel">本周练习</span>
            <span class="progressValue">${progress.weekMinutes} / ${goal.weeklyMinutes}min (${progress.weeklyProgress}%)</span>
          </div>
          <div class="progressBar"><div class="progressFill weekly" style="width: ${progress.weeklyProgress}%"></div></div>
          <div class="progressRow">
            <span class="progressLabel">时间进度</span>
            <span class="progressValue">${progress.daysPassed} / ${progress.totalDays} 天 (${progress.timeProgress}%)</span>
          </div>
          <div class="progressBar"><div class="progressFill time" style="width: ${progress.timeProgress}%"></div></div>
        </div>
        <div class="goalActions">
          ${!progress.isAchieved ? `<button class="goalAchieve" data-goal-achieve="${goal.id}">标记达成</button>` : ''}
          <button class="goalDel" data-goal-del="${goal.id}" aria-label="删除">删除</button>
        </div>
      </div>
    `;
  }).join('');
  document.querySelectorAll('[data-goal-achieve]').forEach((button) => button.addEventListener('click', () => {
    const goalId = button.dataset.goalAchieve;
    goals = goals.map((g) => g.id === goalId ? { ...g, achieved: true, achievedAt: getToday() } : g);
    saveGoals(goals);
    render();
  }));
  document.querySelectorAll('[data-goal-del]').forEach((button) => button.addEventListener('click', () => {
    if (!confirm('确定删除该目标？')) return;
    goals = goals.filter((g) => g.id !== button.dataset.goalDel);
    saveGoals(goals);
    render();
  }));
}

function renderGoalDashboard() {
  const dashboardEl = document.querySelector('#goalDashboard');
  if (!goals.length) {
    dashboardEl.innerHTML = '<p class="empty">设置目标后查看进度仪表盘</p>';
    return;
  }
  const activeGoals = goals.filter(g => !g.achieved);
  const achievedGoals = goals.filter(g => g.achieved);
  const overdueGoals = activeGoals.filter(g => calculateGoalProgress(g).isOverdue);
  const totalWeekMinutes = activeGoals.reduce((sum, g) => sum + getWeekMinutes(g.piece), 0);
  const totalTargetWeekMinutes = activeGoals.reduce((sum, g) => sum + g.weeklyMinutes, 0);
  const overallWeekProgress = totalTargetWeekMinutes > 0
    ? Math.round((totalWeekMinutes / totalTargetWeekMinutes) * 100)
    : 0;
  const avgBpmProgress = activeGoals.length
    ? Math.round(activeGoals.reduce((sum, g) => sum + calculateGoalProgress(g).bpmProgress, 0) / activeGoals.length)
    : 0;
  dashboardEl.innerHTML = `
    <div class="dashboardStat">
      <span class="dashboardLabel">进行中目标</span>
      <strong class="dashboardValue">${activeGoals.length}</strong>
    </div>
    <div class="dashboardStat">
      <span class="dashboardLabel">已达成目标</span>
      <strong class="dashboardValue achieved">${achievedGoals.length}</strong>
    </div>
    <div class="dashboardStat">
      <span class="dashboardLabel">逾期目标</span>
      <strong class="dashboardValue ${overdueGoals.length ? 'overdue' : ''}">${overdueGoals.length}</strong>
    </div>
    <div class="dashboardStat">
      <span class="dashboardLabel">本周总练习</span>
      <strong class="dashboardValue">${totalWeekMinutes}min</strong>
      <div class="dashboardMiniBar">
        <div class="dashboardMiniFill" style="width: ${Math.min(100, overallWeekProgress)}%"></div>
      </div>
      <span class="dashboardMiniLabel">目标 ${totalTargetWeekMinutes}min · ${overallWeekProgress}%</span>
    </div>
    <div class="dashboardStat">
      <span class="dashboardLabel">平均BPM进度</span>
      <strong class="dashboardValue">${avgBpmProgress}%</strong>
      <div class="dashboardMiniBar">
        <div class="dashboardMiniFill bpm" style="width: ${avgBpmProgress}%"></div>
      </div>
    </div>
    ${overdueGoals.length ? `
      <div class="overdueAlert">
        <strong>⚠ 逾期提醒</strong>
        <p>以下目标已逾期，请尽快完成：</p>
        <ul>
          ${overdueGoals.map(g => `<li>${escapeHtml(g.piece)} - 目标 ${g.targetBpm} BPM (逾期 ${Math.abs(calculateGoalProgress(g).daysRemaining)} 天)</li>`).join('')}
        </ul>
      </div>
    ` : ''}
    ${activeGoals.filter(g => calculateGoalProgress(g).bpmProgress >= 100).length ? `
      <div class="achieveAlert">
        <strong>🎉 可达成目标</strong>
        <p>以下目标BPM已达标，点击"标记达成"完成目标：</p>
        <ul>
          ${activeGoals.filter(g => calculateGoalProgress(g).bpmProgress >= 100).map(g => `<li>${escapeHtml(g.piece)} - 当前 ${getMaxBpm(g.piece)} BPM ≥ 目标 ${g.targetBpm} BPM</li>`).join('')}
        </ul>
      </div>
    ` : ''}
  `;
}

function avg(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function groupDay(data, field) {
  const map = new Map();
  data.forEach((record) => map.set(record.date, (map.get(record.date) || 0) + record[field]));
  return [...map.entries()].map(([label, value]) => ({ label: label.slice(5), value }));
}

function getTrackStats() {
  const trackMap = new Map();
  records.forEach((record) => {
    if (!trackMap.has(record.piece)) {
      trackMap.set(record.piece, {
        piece: record.piece,
        instrument: record.instrument,
        records: [],
        totalMinutes: 0,
        maxBpm: 0,
        lastDate: '',
        notes: [],
        mistakes: []
      });
    }
    const track = trackMap.get(record.piece);
    track.records.push(record);
    track.totalMinutes += record.minutes;
    track.maxBpm = Math.max(track.maxBpm, record.bpm);
    track.lastDate = track.lastDate > record.date ? track.lastDate : record.date;
    if (record.note && record.note.trim()) {
      track.notes.push({ date: record.date, note: record.note });
    }
    track.mistakes.push({ date: record.date, value: record.mistakes });
  });

  return [...trackMap.values()].map((track) => {
    const sortedRecords = track.records.sort((a, b) => a.date.localeCompare(b.date));
    const sortedMistakes = track.mistakes.sort((a, b) => a.date.localeCompare(b.date));
    const mistakeTrend = sortedMistakes.length >= 2
      ? sortedMistakes[sortedMistakes.length - 1].value - sortedMistakes[0].value
      : 0;
    const practiceCount = track.records.length;

    return {
      ...track,
      records: sortedRecords,
      notes: track.notes.sort((a, b) => b.date.localeCompare(a.date)),
      mistakeTrend,
      practiceCount
    };
  }).sort((a, b) => b.lastDate.localeCompare(a.lastDate));
}

function drawTrendLine(data, color) {
  if (!data.length) return '';
  const max = Math.max(...data.map((item) => item.value), 1);
  const width = 200;
  const height = 60;
  const padding = 10;
  const points = data.map((item, index) => `${padding + index * ((width - padding * 2) / Math.max(data.length - 1, 1))},${height - padding - (item.value / max) * (height - padding * 2)}`).join(' ');
  return `<svg viewBox="0 0 ${width} ${height}" class="trendSvg"><polyline points="${points}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>${data.map((item, index) => `<circle cx="${padding + index * ((width - padding * 2) / Math.max(data.length - 1, 1))}" cy="${height - padding - (item.value / max) * (height - padding * 2)}" r="3" fill="${color}"/>`).join('')}</svg>`;
}

function drawMiniTrendLine(data, color) {
  if (!data.length) return '';
  const max = Math.max(...data.map((item) => item.value), 1);
  const width = 120;
  const height = 36;
  const padding = 4;
  const points = data.map((item, index) => `${padding + index * ((width - padding * 2) / Math.max(data.length - 1, 1))},${height - padding - (item.value / max) * (height - padding * 2)}`).join(' ');
  return `<svg viewBox="0 0 ${width} ${height}" class="miniTrendSvg"><polyline points="${points}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/></svg>`;
}

function drawLine(selector, data, unit, color) {
  const el = document.querySelector(selector);
  if (!data.length) return (el.innerHTML = '<p class="empty">暂无数据</p>');
  const max = Math.max(...data.map((item) => item.value), 1);
  const points = data.map((item, index) => `${42 + index * (420 / Math.max(data.length - 1, 1))},${178 - (item.value / max) * 132}`).join(' ');
  el.innerHTML = `<svg viewBox="0 0 500 220"><polyline points="${points}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/>${data.map((item, index) => `<circle cx="${42 + index * (420 / Math.max(data.length - 1, 1))}" cy="${178 - (item.value / max) * 132}" r="5" fill="${color}"/><text x="${42 + index * (420 / Math.max(data.length - 1, 1))}" y="205">${item.label}</text><text x="${42 + index * (420 / Math.max(data.length - 1, 1))}" y="${166 - (item.value / max) * 132}">${item.value}${unit}</text>`).join('')}</svg>`;
}

function drawBars(selector, data, unit, color) {
  const el = document.querySelector(selector);
  if (!data.length) return (el.innerHTML = '<p class="empty">暂无数据</p>');
  const max = Math.max(...data.map((item) => item.value), 1);
  el.innerHTML = `<svg viewBox="0 0 500 220">${data.map((item, index) => `<rect x="${48 + index * 86}" y="${180 - (item.value / max) * 140}" width="34" height="${(item.value / max) * 140}" rx="5" fill="${color}"/><text x="${65 + index * 86}" y="${168 - (item.value / max) * 140}">${item.value}${unit}</text><text x="${65 + index * 86}" y="205">${item.label}</text>`).join('')}</svg>`;
}

initSession();
render();
