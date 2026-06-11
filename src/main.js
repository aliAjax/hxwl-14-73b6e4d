import './styles.css';

const key = 'hxwl-14-music-practice';
const planKey = 'hxwl-14-music-practice-plan';
const goalKey = 'hxwl-14-music-practice-goals';
const sessionKey = 'hxwl-14-practice-session';
const committedSessionsKey = 'hxwl-14-committed-sessions';
const filtersKey = 'hxwl-14-filters';
const viewsKey = 'hxwl-14-views';
const currentViewKey = 'hxwl-14-current-view';
const libraryKey = 'hxwl-14-music-library';

const librarySeed = [
  {
    id: crypto.randomUUID(),
    name: 'Blue Bossa',
    instrument: '电吉他',
    genre: '拉丁爵士',
    targetBpm: 120,
    defaultSections: [
      { name: '前奏', note: '分解和弦进入' },
      { name: '主歌', note: '和弦转换重点' },
      { name: '副歌', note: '扫弦节奏' },
      { name: 'Solo', note: '即兴练习' }
    ],
    referenceLinks: [
      { label: '原版录音', url: 'https://example.com/blue-bossa' }
    ],
    practiceNotes: '注意 ii-V-I 进行的流畅度，Bossa Nova 节奏要稳定。',
    createdAt: new Date().toISOString()
  },
  {
    id: crypto.randomUUID(),
    name: 'Autumn Leaves',
    instrument: '键盘',
    genre: '标准爵士',
    targetBpm: 100,
    defaultSections: [
      { name: '前奏', note: '左手根音配合' },
      { name: '主歌', note: '旋律声部' },
      { name: '副歌', note: '和弦转换' }
    ],
    referenceLinks: [],
    practiceNotes: '左手 walking bass 要稳定，右手旋律保持歌唱性。',
    createdAt: new Date().toISOString()
  }
];
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

const LibraryManager = (() => {
  function loadLibrary() {
    try {
      const raw = JSON.parse(localStorage.getItem(libraryKey) || 'null');
      if (Array.isArray(raw)) {
        return raw;
      }
      const seeded = JSON.parse(JSON.stringify(librarySeed));
      localStorage.setItem(libraryKey, JSON.stringify(seeded));
      return seeded;
    } catch {
      const seeded = JSON.parse(JSON.stringify(librarySeed));
      localStorage.setItem(libraryKey, JSON.stringify(seeded));
      return seeded;
    }
  }

  function saveLibrary(data) {
    localStorage.setItem(libraryKey, JSON.stringify(data));
  }

  function getAll() {
    return loadLibrary().sort((a, b) => {
      const aTime = a.createdAt || a.updatedAt || '';
      const bTime = b.createdAt || b.updatedAt || '';
      return bTime.localeCompare(aTime);
    });
  }

  function getById(id) {
    return loadLibrary().find(item => item.id === id) || null;
  }

  function getByName(name) {
    return loadLibrary().find(item => item.name === name) || null;
  }

  function add(item) {
    const data = loadLibrary();
    const newItem = {
      id: crypto.randomUUID(),
      name: (item.name || '').trim(),
      instrument: (item.instrument || '').trim(),
      genre: (item.genre || '').trim(),
      targetBpm: item.targetBpm ? Number(item.targetBpm) : null,
      defaultSections: Array.isArray(item.defaultSections) ? item.defaultSections.filter(s => s && s.name && s.name.trim()) : [],
      referenceLinks: Array.isArray(item.referenceLinks) ? item.referenceLinks.filter(l => l && l.url && l.url.trim()) : [],
      practiceNotes: (item.practiceNotes || '').trim(),
      createdAt: new Date().toISOString()
    };
    if (!newItem.name) {
      return { success: false, error: '曲目名称不能为空' };
    }
    if (data.some(d => d.name === newItem.name)) {
      return { success: false, error: '该曲目名称已存在' };
    }
    data.push(newItem);
    saveLibrary(data);
    return { success: true, item: newItem };
  }

  function update(id, updates) {
    const data = loadLibrary();
    const index = data.findIndex(item => item.id === id);
    if (index === -1) {
      return { success: false, error: '曲目不存在' };
    }
    const existing = data[index];
    const updatedName = (updates.name || existing.name).trim();
    if (!updatedName) {
      return { success: false, error: '曲目名称不能为空' };
    }
    if (data.some((d, i) => i !== index && d.name === updatedName)) {
      return { success: false, error: '该曲目名称已存在' };
    }
    data[index] = {
      ...existing,
      name: updatedName,
      instrument: (updates.instrument !== undefined ? updates.instrument : existing.instrument || '').trim(),
      genre: (updates.genre !== undefined ? updates.genre : existing.genre || '').trim(),
      targetBpm: updates.targetBpm !== undefined ? (updates.targetBpm ? Number(updates.targetBpm) : null) : existing.targetBpm,
      defaultSections: updates.defaultSections !== undefined
        ? updates.defaultSections.filter(s => s && s.name && s.name.trim())
        : existing.defaultSections || [],
      referenceLinks: updates.referenceLinks !== undefined
        ? updates.referenceLinks.filter(l => l && l.url && l.url.trim())
        : existing.referenceLinks || [],
      practiceNotes: updates.practiceNotes !== undefined ? (updates.practiceNotes || '').trim() : existing.practiceNotes || '',
      updatedAt: new Date().toISOString()
    };
    saveLibrary(data);
    return { success: true, item: data[index] };
  }

  function remove(id) {
    const data = loadLibrary();
    const filtered = data.filter(item => item.id !== id);
    if (filtered.length === data.length) {
      return { success: false, error: '曲目不存在' };
    }
    saveLibrary(filtered);
    return { success: true };
  }

  function getPieceDisplayName(pieceName) {
    if (!pieceName) return '';
    return pieceName;
  }

  function resolvePieceInfo(pieceValue) {
    if (!pieceValue) return { name: '', instrument: '', targetBpm: null, defaultSections: [] };
    if (typeof pieceValue === 'string') {
      const item = getByName(pieceValue);
      if (item) {
        return {
          name: item.name,
          instrument: item.instrument,
          targetBpm: item.targetBpm,
          defaultSections: item.defaultSections || []
        };
      }
      return { name: pieceValue, instrument: '', targetBpm: null, defaultSections: [] };
    }
    if (typeof pieceValue === 'object' && pieceValue.name) {
      return {
        name: pieceValue.name,
        instrument: pieceValue.instrument || '',
        targetBpm: pieceValue.targetBpm || null,
        defaultSections: pieceValue.defaultSections || []
      };
    }
    return { name: '', instrument: '', targetBpm: null, defaultSections: [] };
  }

  return {
    getAll,
    getById,
    getByName,
    add,
    update,
    remove,
    resolvePieceInfo,
    getPieceDisplayName
  };
})();

let library = LibraryManager.getAll();
let libraryFilter = { keyword: '', instrument: '', genre: '' };
const libraryInstruments = ['电吉他', '木吉他', '贝斯', '键盘', '钢琴', '鼓', '小提琴', '声乐', '其他'];

function refreshLibrary() {
  library = LibraryManager.getAll();
}

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
  sections: [],
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
      const sections = getSections(record);
      const matchedInNote = note.includes(filters.noteKeyword);
      const matchedInSections = sections.some(s => s.name && s.name.includes(filters.noteKeyword));
      if (!matchedInNote && !matchedInSections) return false;
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

  const libSelect = document.querySelector('#sessionLibrarySelect');
  let sections = [];
  if (libSelect && libSelect.value) {
    const item = LibraryManager.getById(libSelect.value);
    if (item && item.defaultSections && item.defaultSections.length) {
      const bpmVal = data.targetBpm ? Number(data.targetBpm) : (item.targetBpm || 80);
      sections = item.defaultSections.map(s => ({
        id: crypto.randomUUID(),
        name: s.name,
        bpm: bpmVal,
        mistakes: 0,
        mastery: 3,
        note: s.note || ''
      }));
    }
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
    sections: sections,
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
    note: session.note || `计时练习，实际时长 ${formatDuration(elapsedMs)}`,
    sections: session.sections && session.sections.length ? [...session.sections] : []
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

  const achievedGoals = [];
  goals = goals.map((goal) => {
    if (!goal.achieved && goal.piece === session.piece && session.targetBpm && session.targetBpm >= goal.targetBpm) {
      achievedGoals.push(goal.piece);
      return { ...goal, achieved: true, achievedAt: getToday(), autoAchieved: true };
    }
    return goal;
  });
  if (achievedGoals.length > 0) {
    saveGoals(goals);
    setTimeout(() => {
      alert(`🎉 恭喜！${achievedGoals.join('、')} 已达到目标 BPM，目标状态已自动更新为已达成！`);
    }, 100);
  }

  session = {
    id: null,
    status: 'idle',
    startTime: null,
    accumulatedMs: 0,
    instrument: '',
    piece: '',
    targetBpm: '',
    note: '',
    sections: [],
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
    sections: [],
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
    refreshLibrary();
    panel.innerHTML = `
      <div class="panelHead">
        <h2>练习会话计时</h2>
        <span class="muted">开始新的练习</span>
      </div>
      <form id="sessionForm" class="sessionForm">
        <div class="pieceSelectWrap small">
          <label class="pieceSelectLabel">📚 从资料库选择</label>
          <select id="sessionLibrarySelect" class="pieceLibrarySelect small">
            <option value="">手动输入...</option>
            ${library.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}${item.targetBpm ? ` (目标 ${item.targetBpm} BPM)` : ''}</option>`).join('')}
          </select>
        </div>
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
        <div id="sessionSectionsPreview" class="sessionSectionsPreview" style="display:none;">
          <div class="previewTitle">📋 默认练习片段</div>
          <div id="sessionSectionsList" class="sessionSectionsList"></div>
        </div>
        <button type="button" class="primary" id="startSessionBtn">▶ 开始练习</button>
      </form>
    `;

    document.querySelector('#startSessionBtn').addEventListener('click', startSession);
    const sessionLibSelect = document.querySelector('#sessionLibrarySelect');
    if (sessionLibSelect) {
      sessionLibSelect.addEventListener('change', (e) => {
        const libId = e.target.value;
        const sessionForm = document.querySelector('#sessionForm');
        if (!sessionForm) return;
        const instrumentSelect = sessionForm.querySelector('select[name="instrument"]');
        const pieceInput = sessionForm.querySelector('input[name="piece"]');
        const bpmInput = sessionForm.querySelector('input[name="targetBpm"]');
        const previewEl = document.querySelector('#sessionSectionsPreview');
        const listEl = document.querySelector('#sessionSectionsList');
        if (!libId) {
          if (listEl) listEl.innerHTML = '';
          if (previewEl) previewEl.style.display = 'none';
          return;
        }
        const item = LibraryManager.getById(libId);
        if (!item) return;
        if (item.instrument && instrumentSelect) {
          let found = false;
          for (const opt of instrumentSelect.options) {
            if (opt.value === item.instrument) {
              instrumentSelect.value = item.instrument;
              found = true;
              break;
            }
          }
          if (!found) {
            const newOpt = document.createElement('option');
            newOpt.value = item.instrument;
            newOpt.textContent = item.instrument;
            instrumentSelect.appendChild(newOpt);
            instrumentSelect.value = item.instrument;
          }
        }
        if (pieceInput) pieceInput.value = item.name;
        if (item.targetBpm && bpmInput && !bpmInput.value) {
          bpmInput.value = item.targetBpm;
        }
        if (item.defaultSections && item.defaultSections.length && previewEl && listEl) {
          listEl.innerHTML = item.defaultSections.map(s => `
            <span class="libSectionTag">${escapeHtml(s.name)}${s.note ? ` <small class="muted">· ${escapeHtml(s.note)}</small>` : ''}</span>
          `).join('');
          previewEl.style.display = 'block';
        } else if (previewEl) {
          previewEl.style.display = 'none';
        }
      });
    }
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
          ${session.sections && session.sections.length ? `
          <div class="sessionInfoRow">
            <span class="sessionLabel">练习片段</span>
            <strong>${session.sections.length} 段</strong>
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

    <div id="exportModal" class="modal" hidden>
      <div class="modalOverlay"></div>
      <div class="modalContent">
        <div class="modalHead">
          <h2>导出数据</h2>
          <button class="modalClose" id="exportModalClose">×</button>
        </div>
        <div class="modalBody">
          <div class="exportOptions">
            <div class="exportOption">
              <div class="exportOptionIcon">📝</div>
              <div class="exportOptionContent">
                <h3>仅导出练习记录</h3>
                <p class="muted">只包含练习记录数据，文件体积小，便于分享和迁移记录。</p>
              </div>
              <button class="primary" id="exportRecordsBtn">导出记录</button>
            </div>
            <div class="exportOption highlighted">
              <div class="exportOptionIcon">💾</div>
              <div class="exportOptionContent">
                <h3>完整备份（推荐）</h3>
                <p class="muted">包含练习记录、曲目资料库、练习目标、筛选视图和今日计划，完整备份所有本地数据。</p>
              </div>
              <button class="primary" id="exportFullBtn">完整备份</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div id="importModal" class="modal" hidden>
      <div class="modalOverlay"></div>
      <div class="modalContent">
        <div class="modalHead">
          <h2 id="importModalTitle">导入练习记录</h2>
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
        <div class="pieceSelectWrap small">
          <label class="pieceSelectLabel">📚 从资料库选择</label>
          <select id="planLibrarySelect" class="pieceLibrarySelect small">
            <option value="">手动输入...</option>
          </select>
        </div>
        <input name="piece" placeholder="曲目" required />
        <div class="pair">
          <input name="targetBpm" type="number" min="1" step="1" placeholder="目标BPM" required />
          <input name="estimatedMinutes" type="number" min="1" step="1" placeholder="预计分钟" required />
        </div>
        <div id="planSectionsPreview" class="planSectionsPreview" style="display:none;">
          <div class="previewTitle">📋 默认练习片段</div>
          <div id="planSectionsList" class="planSectionsList"></div>
        </div>
        <button class="primary">添加任务</button>
      </form>
      <div id="planSuggestions" class="planSuggestions" style="display:none;"></div>
      <div id="planList" class="planList"></div>
    </section>

    <section class="panel goalsPanel">
      <div class="panelHead">
        <h2>练习目标</h2>
        <span class="muted" id="goalsSummary"></span>
      </div>
      <form id="goalForm" class="goalForm">
        <div class="pieceSelectWrap small">
          <label class="pieceSelectLabel">📚 从资料库选择</label>
          <select id="goalLibrarySelect" class="pieceLibrarySelect small">
            <option value="">手动选择曲目...</option>
          </select>
        </div>
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
        <div id="goalSectionsPreview" class="goalSectionsPreview" style="display:none;">
          <div class="previewTitle">📋 该曲目练习片段（参考）</div>
          <div id="goalSectionsList" class="goalSectionsList"></div>
        </div>
        <button class="primary">设置目标</button>
      </form>
      <div id="goalsList" class="goalsList"></div>
    </section>

    <section class="panel goalDashboard">
      <div class="panelHead"><h2>目标进度仪表盘</h2></div>
      <div id="goalDashboard" class="goalDashboardGrid"></div>
    </section>

    <section class="panel suggestionPanel">
      <div class="panelHead">
        <h2>🎯 智能练习建议</h2>
        <span class="muted" id="suggestionMeta"></span>
      </div>
      <div id="suggestionOverview" class="suggestionOverview"></div>
      <div id="suggestionList" class="suggestionList"></div>
      <div id="suggestionConservative" class="suggestionConservative"></div>
    </section>

    <section class="panel reportPanel">
      <div class="panelHead">
        <div>
          <h2>📋 周/月复盘报告</h2>
          <span class="muted" id="reportRangeLabel"></span>
        </div>
        <div class="reportActions">
          <div class="reportRangeToggle">
            <button class="rangeBtn active" data-range="week" id="rangeWeekBtn">周报</button>
            <button class="rangeBtn" data-range="month" id="rangeMonthBtn">月报</button>
          </div>
          <button class="secondary small" id="exportReportBtn">📥 导出 HTML</button>
        </div>
      </div>
      <div id="reportContent" class="reportContent"></div>
    </section>

    <section class="layout">
      <form id="form" class="panel">
        <h2>练习记录</h2>
        <div class="pieceSelectWrap">
          <label class="pieceSelectLabel">📚 从资料库选择曲目（可选，自动带出信息）</label>
          <select id="formLibrarySelect" class="pieceLibrarySelect">
            <option value="">手动输入...</option>
          </select>
        </div>
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

    <section class="panel libraryPanel">
      <div class="panelHead">
        <h2>📚 曲目资料库</h2>
        <span class="muted" id="libraryCount"></span>
      </div>
      <div class="libraryFilterBar">
        <input id="librarySearch" placeholder="搜索曲目名、乐器、风格..." />
        <select id="libraryInstrumentFilter">
          <option value="">全部乐器</option>
          ${libraryInstruments.map(i => `<option value="${i}">${i}</option>`).join('')}
        </select>
        <input id="libraryGenreFilter" placeholder="按风格筛选" />
      </div>
      <form id="libraryForm" class="libraryForm">
        <div class="pair">
          <input name="name" placeholder="曲目名称 *" required />
          <select name="instrument" required>
            <option value="">选择乐器 *</option>
            <option value="电吉他">电吉他</option>
            <option value="木吉他">木吉他</option>
            <option value="贝斯">贝斯</option>
            <option value="键盘">键盘</option>
            <option value="钢琴">钢琴</option>
            <option value="鼓">鼓</option>
            <option value="小提琴">小提琴</option>
            <option value="声乐">声乐</option>
            <option value="其他">其他</option>
          </select>
        </div>
        <div class="pair">
          <input name="genre" placeholder="曲风（如：爵士、摇滚、古典）" />
          <input name="targetBpm" type="number" min="1" step="1" placeholder="目标BPM" />
        </div>
        <div class="librarySubSection">
          <div class="librarySubHead">
            <span>默认片段</span>
            <button type="button" class="secondary small" id="addLibSectionBtn">+ 添加片段</button>
          </div>
          <div id="libSectionsList" class="libSectionsList"></div>
        </div>
        <div class="librarySubSection">
          <div class="librarySubHead">
            <span>参考链接</span>
            <button type="button" class="secondary small" id="addLibLinkBtn">+ 添加链接</button>
          </div>
          <div id="libLinksList" class="libLinksList"></div>
        </div>
        <textarea name="practiceNotes" placeholder="练习备注（技巧难点、练习建议等）"></textarea>
        <div class="libraryFormActions">
          <button type="submit" class="primary" id="libSubmitBtn">➕ 添加到资料库</button>
          <button type="button" class="secondary" id="libResetBtn" hidden>取消编辑</button>
        </div>
        <input type="hidden" name="editingId" value="" />
      </form>
      <div id="libraryList" class="libraryList"></div>
    </section>

    <section class="panel segmentTrendPanel">
      <div class="panelHead">
        <h2>📊 分段趋势面板</h2>
        <span class="muted" id="segmentTrendMeta"></span>
      </div>
      <div id="segmentTrendContent" class="segmentTrendContent"></div>
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
const libraryForm = document.querySelector('#libraryForm');

let libSections = [];
let libLinks = [];

planForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(planForm).entries());
  let sections = [];
  const libSelect = document.querySelector('#planLibrarySelect');
  if (libSelect && libSelect.value) {
    const item = LibraryManager.getById(libSelect.value);
    if (item && item.defaultSections && item.defaultSections.length) {
      sections = item.defaultSections.map(s => ({
        id: crypto.randomUUID(),
        name: s.name,
        bpm: Number(data.targetBpm) || (item.targetBpm || 80),
        mistakes: 0,
        mastery: 3,
        note: s.note || ''
      }));
    }
  }
  const task = {
    id: crypto.randomUUID(),
    piece: data.piece,
    targetBpm: Number(data.targetBpm),
    estimatedMinutes: Number(data.estimatedMinutes),
    completed: false,
    date: getToday(),
    sections: sections
  };
  planTasks.push(task);
  savePlan(planTasks);
  planForm.reset();
  const previewEl = document.querySelector('#planSectionsPreview');
  if (previewEl) previewEl.style.display = 'none';
  render();
});

goalForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(goalForm).entries());
  let sections = [];
  const libSelect = document.querySelector('#goalLibrarySelect');
  if (libSelect && libSelect.value) {
    const item = LibraryManager.getById(libSelect.value);
    if (item && item.defaultSections && item.defaultSections.length) {
      sections = item.defaultSections.map(s => ({
        id: crypto.randomUUID(),
        name: s.name,
        bpm: Number(data.targetBpm) || (item.targetBpm || 80),
        mistakes: 0,
        mastery: 3,
        note: s.note || ''
      }));
    }
  }
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
    achievedAt: null,
    sections: sections
  };
  goals.push(goal);
  saveGoals(goals);
  goalForm.reset();
  const previewEl = document.querySelector('#goalSectionsPreview');
  if (previewEl) previewEl.style.display = 'none';
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
document.querySelector('#librarySearch').addEventListener('input', (e) => {
  libraryFilter.keyword = e.target.value;
  renderLibrary();
});
document.querySelector('#libraryInstrumentFilter').addEventListener('change', (e) => {
  libraryFilter.instrument = e.target.value;
  renderLibrary();
});
document.querySelector('#libraryGenreFilter').addEventListener('input', (e) => {
  libraryFilter.genre = e.target.value;
  renderLibrary();
});
document.querySelector('#sample').addEventListener('click', async () => {
  const confirmed = await showConfirm('重置数据', '确定要重置为示例数据吗？当前所有记录将被清除，此操作可通过历史版本回滚。');
  if (!confirmed) return;
  const result = VersionManager.resetToSampleData();
  records = result.records;
  render();
});

let pendingImportData = null;
let pendingImportType = 'records';

const exportBtn = document.querySelector('#exportBtn');
const importBtn = document.querySelector('#importBtn');
const importFile = document.querySelector('#importFile');
const importModal = document.querySelector('#importModal');
const importPreview = document.querySelector('#importPreview');
const modalClose = document.querySelector('#modalClose');
const modalCancel = document.querySelector('#modalCancel');
const modalConfirm = document.querySelector('#modalConfirm');
const importModalTitle = document.querySelector('#importModalTitle');

const exportModal = document.querySelector('#exportModal');
const exportModalClose = document.querySelector('#exportModalClose');
const exportRecordsBtn = document.querySelector('#exportRecordsBtn');
const exportFullBtn = document.querySelector('#exportFullBtn');

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportRecordsOnly() {
  const data = {
    type: 'records-only',
    exportedAt: new Date().toISOString(),
    version: '1.0',
    records: records
  };
  downloadJson(data, `music-practice-${getToday()}.json`);
}

function exportFullBackup() {
  const allPlanData = JSON.parse(localStorage.getItem(planKey) || 'null') || {};

  const data = {
    type: 'full-backup',
    exportedAt: new Date().toISOString(),
    version: '2.0',
    records: records,
    library: LibraryManager.getAll(),
    goals: goals,
    views: views,
    plan: allPlanData
  };
  downloadJson(data, `music-practice-full-backup-${getToday()}.json`);
}

function openExportModal() {
  exportModal.hidden = false;
}

function closeExportModal() {
  exportModal.hidden = true;
}

function exportData() {
  exportRecordsOnly();
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

function processFullBackupData(parsedData) {
  const result = {
    type: 'full-backup',
    hasRecords: false,
    hasLibrary: false,
    hasGoals: false,
    hasViews: false,
    hasPlan: false,
    records: null,
    library: { items: [], newItems: [], existingItems: [] },
    goals: { items: [], newItems: [], existingItems: [] },
    views: { items: [], newItems: [], existingItems: [] },
    plan: { dates: {}, totalTasks: 0, newTasks: 0, existingTasks: 0 }
  };

  if (parsedData.records !== undefined && Array.isArray(parsedData.records)) {
    result.hasRecords = true;
    result.records = parsedData.records.length > 0
      ? processImportData(parsedData.records)
      : { validRecords: [], newRecords: [], duplicateRecords: [], invalidRecords: [], allErrors: [] };
  } else {
    result.records = { validRecords: [], newRecords: [], duplicateRecords: [], invalidRecords: [], allErrors: [] };
  }

  if (parsedData.library !== undefined && Array.isArray(parsedData.library)) {
    result.hasLibrary = true;
    result.library.items = parsedData.library;
    const existingNames = new Set(library.map(item => item.name));
    parsedData.library.forEach(item => {
      if (existingNames.has(item.name)) {
        result.library.existingItems.push(item);
      } else {
        result.library.newItems.push(item);
      }
    });
  }

  if (parsedData.goals !== undefined && Array.isArray(parsedData.goals)) {
    result.hasGoals = true;
    result.goals.items = parsedData.goals;
    const existingKeys = new Set(goals.map(g => `${g.piece}-${g.targetBpm}`));
    parsedData.goals.forEach(goal => {
      const key = `${goal.piece}-${goal.targetBpm}`;
      if (existingKeys.has(key)) {
        result.goals.existingItems.push(goal);
      } else {
        result.goals.newItems.push(goal);
      }
    });
  }

  if (parsedData.views !== undefined && Array.isArray(parsedData.views)) {
    result.hasViews = true;
    result.views.items = parsedData.views;
    const existingNames = new Set(views.map(v => v.name));
    parsedData.views.forEach(view => {
      if (existingNames.has(view.name)) {
        result.views.existingItems.push(view);
      } else {
        result.views.newItems.push(view);
      }
    });
  }

  if (parsedData.plan !== undefined && typeof parsedData.plan === 'object' && parsedData.plan !== null) {
    result.hasPlan = true;
    result.plan.dates = parsedData.plan;
    const existingPlanData = JSON.parse(localStorage.getItem(planKey) || 'null') || {};
    for (const date in parsedData.plan) {
      const tasks = parsedData.plan[date];
      if (Array.isArray(tasks)) {
        result.plan.totalTasks += tasks.length;
        const existingTasks = existingPlanData[date] || [];
        const existingTaskKeys = new Set(existingTasks.map(t => `${t.piece}-${t.targetBpm}-${t.estimatedMinutes}`));
        tasks.forEach(task => {
          const key = `${task.piece}-${task.targetBpm}-${task.estimatedMinutes}`;
          if (existingTaskKeys.has(key)) {
            result.plan.existingTasks++;
          } else {
            result.plan.newTasks++;
          }
        });
      }
    }
  }

  return result;
}

function renderFullBackupPreview(result) {
  const { records, library, goals, views, plan } = result;

  let html = '';

  html += `
    <span class="backupTypeBadge full">💾 完整备份</span>
    <div class="backupSummary">
      <div class="backupSummaryItem">
        <span class="backupCount">${records.validRecords.length}</span>
        <span class="backupLabel">有效记录</span>
      </div>
      <div class="backupSummaryItem">
        <span class="backupCount">${library.items.length}</span>
        <span class="backupLabel">曲目资料</span>
      </div>
      <div class="backupSummaryItem">
        <span class="backupCount">${goals.items.length}</span>
        <span class="backupLabel">练习目标</span>
      </div>
      <div class="backupSummaryItem">
        <span class="backupCount">${views.items.length}</span>
        <span class="backupLabel">筛选视图</span>
      </div>
      <div class="backupSummaryItem">
        <span class="backupCount">${Object.keys(plan.dates).length}</span>
        <span class="backupLabel">计划天数</span>
      </div>
    </div>
  `;

  html += `
    <div class="importModeSection">
      <h3>导入模式</h3>
      <label class="importModeOption">
        <input type="radio" name="importMode" value="merge" checked />
        <div>
          <strong>合并导入</strong>
          <span class="muted">将新数据合并到现有数据中，已有数据保持不变（推荐）</span>
        </div>
      </label>
      <label class="importModeOption">
        <input type="radio" name="importMode" value="overwrite" />
        <div>
          <strong>覆盖导入</strong>
          <span class="muted">清除所有现有数据，仅保留导入的数据。此操作可通过历史版本回滚。</span>
        </div>
      </label>
    </div>
  `;

  html += `
    <div class="backupImportSection">
      <h3>📊 数据明细</h3>
      <div class="backupImportItem">
        <span class="backupImportItemName">练习记录（有效/新增/重复/错误）</span>
        <span class="backupImportItemCount">${records.validRecords.length} / ${records.newRecords.length} / ${records.duplicateRecords.length} / ${records.invalidRecords.length}</span>
      </div>
      <div class="backupImportItem">
        <span class="backupImportItemName">曲目资料库（总数/新增/已有）</span>
        <span class="backupImportItemCount">${library.items.length} / ${library.newItems.length} / ${library.existingItems.length}</span>
      </div>
      <div class="backupImportItem">
        <span class="backupImportItemName">练习目标（总数/新增/已有）</span>
        <span class="backupImportItemCount">${goals.items.length} / ${goals.newItems.length} / ${goals.existingItems.length}</span>
      </div>
      <div class="backupImportItem">
        <span class="backupImportItemName">筛选视图（总数/新增/已有）</span>
        <span class="backupImportItemCount">${views.items.length} / ${views.newItems.length} / ${views.existingItems.length}</span>
      </div>
      <div class="backupImportItem">
        <span class="backupImportItemName">今日计划（总任务数/新增/已有）</span>
        <span class="backupImportItemCount">${plan.totalTasks} / ${plan.newTasks} / ${plan.existingTasks}</span>
      </div>
    </div>
  `;

  if (records.allErrors.length > 0) {
    html += `
      <div class="importSection errors">
        <h3>❌ 记录格式错误 (${records.invalidRecords.length})</h3>
        <ul class="errorList">
          ${records.allErrors.map(e => `<li>${escapeHtml(e)}</li>`).join('')}
        </ul>
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

  if (pendingImportType === 'full-backup') {
    const { hasRecords, hasLibrary, hasGoals, hasViews, hasPlan } = pendingImportData;
    const hasAny = hasRecords || hasLibrary || hasGoals || hasViews || hasPlan;
    const hasNewData = (
      pendingImportData.records.newRecords.length > 0 ||
      pendingImportData.library.newItems.length > 0 ||
      pendingImportData.goals.newItems.length > 0 ||
      pendingImportData.views.newItems.length > 0 ||
      pendingImportData.plan.newTasks > 0
    );

    const hasData = mode === 'overwrite' ? hasAny : hasNewData;

    modalConfirm.disabled = !hasData;
    if (!hasData) {
      modalConfirm.textContent = mode === 'overwrite' ? '无有效数据可覆盖' : '无新增数据可导入';
    } else {
      modalConfirm.textContent = mode === 'overwrite'
        ? '确认覆盖导入全部数据'
        : '确认合并导入新增数据';
    }
  } else {
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
  pendingImportType = 'records';
  importModalTitle.textContent = '导入数据';
  importPreview.innerHTML = `
    <div class="importSelect">
      <p>请选择要导入的 JSON 文件</p>
      <button class="primary" id="selectFileBtn">选择文件</button>
      <p class="muted">支持练习记录文件和完整备份文件</p>
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
  pendingImportType = 'records';
}

exportBtn.addEventListener('click', openExportModal);
exportModalClose.addEventListener('click', closeExportModal);
exportModal.querySelector('.modalOverlay').addEventListener('click', closeExportModal);
exportRecordsBtn.addEventListener('click', () => {
  exportRecordsOnly();
  closeExportModal();
});
exportFullBtn.addEventListener('click', () => {
  exportFullBackup();
  closeExportModal();
});
importBtn.addEventListener('click', openImportModal);
modalClose.addEventListener('click', closeImportModal);
modalCancel.addEventListener('click', closeImportModal);
importModal.querySelector('.modalOverlay').addEventListener('click', closeImportModal);

importFile.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const parsed = await parseImportFile(file);

    if (parsed && parsed.type === 'full-backup') {
      pendingImportType = 'full-backup';
      importModalTitle.textContent = '导入完整备份';
      const result = processFullBackupData(parsed);
      pendingImportData = result;
      renderFullBackupPreview(result);
    } else {
      pendingImportType = 'records';
      importModalTitle.textContent = '导入练习记录';
      const result = processImportData(parsed);
      pendingImportData = result;
      renderImportPreview(result);
    }
  } catch (err) {
    showImportError(err.message);
  }
});

modalConfirm.addEventListener('click', async () => {
  if (!pendingImportData) return;

  const mode = getSelectedImportMode();

  if (pendingImportType === 'full-backup') {
    await handleFullBackupImport(mode);
  } else {
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
  }
});

async function handleFullBackupImport(mode) {
  const {
    hasRecords, hasLibrary, hasGoals, hasViews, hasPlan,
    records: recordData, library: libData, goals: goalsData, views: viewsData, plan: planData
  } = pendingImportData;

  const newRecordCount = recordData.newRecords.length;
  const validRecordCount = recordData.validRecords.length;
  const recordCount = mode === 'overwrite' ? validRecordCount : newRecordCount;

  const libCount = mode === 'overwrite' ? libData.items.length : libData.newItems.length;
  const goalCount = mode === 'overwrite' ? goalsData.items.length : goalsData.newItems.length;
  const viewCount = mode === 'overwrite' ? viewsData.items.length : viewsData.newItems.length;
  const planTaskCount = mode === 'overwrite' ? planData.totalTasks : planData.newTasks;

  const hasAnyData = hasRecords || hasLibrary || hasGoals || hasViews || hasPlan;
  if (!hasAnyData) {
    return;
  }

  if (mode === 'overwrite') {
    let confirmMsg = '确定要用导入的数据覆盖现有数据吗？\n\n将覆盖：\n';
    if (hasRecords) confirmMsg += `- ${validRecordCount} 条练习记录\n`;
    else confirmMsg += '- （无记录数据，不覆盖记录）\n';
    if (hasLibrary) confirmMsg += `- ${libData.items.length} 条曲目资料\n`;
    else confirmMsg += '- （无资料库数据，不覆盖）\n';
    if (hasGoals) confirmMsg += `- ${goalsData.items.length} 个练习目标\n`;
    else confirmMsg += '- （无目标数据，不覆盖）\n';
    if (hasViews) confirmMsg += `- ${viewsData.items.length} 个筛选视图\n`;
    else confirmMsg += '- （无视图数据，不覆盖）\n';
    if (hasPlan) confirmMsg += `- ${Object.keys(planData.dates).length} 天的计划任务\n`;
    else confirmMsg += '- （无计划数据，不覆盖）\n';
    confirmMsg += '\n此操作可通过历史版本回滚（仅练习记录）。';

    const confirmed = await showConfirm('覆盖导入确认', confirmMsg);
    if (!confirmed) return;
  }

  if (hasRecords) {
    let finalRecords;
    if (mode === 'overwrite') {
      const newRecs = recordData.validRecords.map(item => item.record);
      finalRecords = newRecs;
    } else {
      const newRecs = recordData.newRecords.map(item => item.record);
      finalRecords = [...newRecs, ...records];
    }

    const versionResult = VersionManager.recordChange('import', finalRecords, {
      count: recordCount,
      mode,
      type: 'full-backup'
    });
    records = versionResult.records;
  }

  if (mode === 'overwrite') {
    if (hasLibrary) {
      localStorage.setItem(libraryKey, JSON.stringify(libData.items));
      library = LibraryManager.getAll();
    }
    if (hasGoals) {
      goals = goalsData.items;
      saveGoals(goals);
    }
    if (hasViews) {
      views = viewsData.items;
      saveViews();
    }
    if (hasPlan) {
      localStorage.setItem(planKey, JSON.stringify(planData.dates));
      planTasks = loadPlan();
    }
  } else {
    if (libData.newItems.length > 0) {
      const currentLib = LibraryManager.getAll();
      const newLibItems = libData.newItems.map(item => ({
        ...item,
        id: crypto.randomUUID(),
        createdAt: item.createdAt || new Date().toISOString()
      }));
      const merged = [...currentLib, ...newLibItems];
      localStorage.setItem(libraryKey, JSON.stringify(merged));
      library = LibraryManager.getAll();
    }
    if (goalsData.newItems.length > 0) {
      const newGoals = goalsData.newItems.map(goal => ({
        ...goal,
        id: crypto.randomUUID(),
        createdAt: goal.createdAt || new Date().toISOString()
      }));
      goals = [...goals, ...newGoals];
      saveGoals(goals);
    }
    if (viewsData.newItems.length > 0) {
      const newViews = viewsData.newItems.map(view => ({
        ...view,
        id: crypto.randomUUID(),
        createdAt: view.createdAt || new Date().toISOString(),
        updatedAt: view.updatedAt || new Date().toISOString()
      }));
      views = [...views, ...newViews];
      saveViews();
    }
    if (planData.newTasks > 0) {
      const existingPlan = JSON.parse(localStorage.getItem(planKey) || 'null') || {};
      for (const date in planData.dates) {
        const tasks = planData.dates[date];
        if (Array.isArray(tasks) && tasks.length > 0) {
          const existingTasks = existingPlan[date] || [];
          const existingKeys = new Set(existingTasks.map(t => `${t.piece}-${t.targetBpm}-${t.estimatedMinutes}`));
          const newTasks = tasks
            .filter(t => !existingKeys.has(`${t.piece}-${t.targetBpm}-${t.estimatedMinutes}`))
            .map(t => ({ ...t, id: crypto.randomUUID() }));
          existingPlan[date] = [...existingTasks, ...newTasks];
        }
      }
      localStorage.setItem(planKey, JSON.stringify(existingPlan));
      planTasks = loadPlan();
    }
  }

  render();
  closeImportModal();

  const modeText = mode === 'overwrite' ? '（覆盖模式）' : '（合并模式）';
  const details = [];
  if (hasRecords) details.push(`练习记录: ${recordCount} 条`);
  if (hasLibrary) details.push(`曲目资料: ${libCount} 条`);
  if (hasGoals) details.push(`练习目标: ${goalCount} 个`);
  if (hasViews) details.push(`筛选视图: ${viewCount} 个`);
  if (hasPlan) details.push(`计划任务: ${planTaskCount} 条`);
  alert(`成功导入完整备份${modeText}！\n\n${details.join('\n')}`);
}

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

function renderSuggestions() {
  const result = SuggestionEngine.generateSuggestions();
  const metaEl = document.querySelector('#suggestionMeta');
  const overviewEl = document.querySelector('#suggestionOverview');
  const listEl = document.querySelector('#suggestionList');
  const conservativeEl = document.querySelector('#suggestionConservative');

  if (result.overall && result.overall.type === 'empty') {
    metaEl.textContent = '';
    overviewEl.innerHTML = '';
    listEl.innerHTML = `
      <div class="suggestionEmpty">
        <span class="suggestionEmptyIcon">${result.overall.icon}</span>
        <h3 class="suggestionEmptyTitle">${result.overall.title}</h3>
        <p class="suggestionEmptyDesc">${result.overall.message}</p>
      </div>
    `;
    conservativeEl.innerHTML = '';
    return;
  }

  const { overall, suggestions, conservative } = result;
  metaEl.textContent = `分析 ${overall.totalRecords} 条记录 · ${overall.activePieces} 首曲目 · 累计 ${overall.totalMinutes} 分钟`;

  const typeCounts = suggestions.reduce((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1;
    return acc;
  }, {});

  overviewEl.innerHTML = `
    <div class="overviewCard">
      <span class="overviewLabel">🚀 继续提速</span>
      <strong class="overviewValue">${typeCounts.speedup || 0}</strong>
      <span class="overviewSub">表现稳定的曲目</span>
    </div>
    <div class="overviewCard">
      <span class="overviewLabel">🧘 降速巩固</span>
      <strong class="overviewValue">${typeCounts.slowdown || 0}</strong>
      <span class="overviewSub">基础需扎实</span>
    </div>
    <div class="overviewCard">
      <span class="overviewLabel">⚠️ 错误异常</span>
      <strong class="overviewValue">${typeCounts.spike || 0}</strong>
      <span class="overviewSub">需重点关注</span>
    </div>
    <div class="overviewCard">
      <span class="overviewLabel">📖 长期未碰</span>
      <strong class="overviewValue">${typeCounts.catchup || 0}</strong>
      <span class="overviewSub">建议复习</span>
    </div>
  `;

  if (suggestions.length === 0) {
    listEl.innerHTML = `
      <div class="suggestionEmpty">
        <span class="suggestionEmptyIcon">✨</span>
        <h3 class="suggestionEmptyTitle">状态良好，暂无特殊建议</h3>
        <p class="suggestionEmptyDesc">
          当前曲目的练习节奏比较平稳。可以继续保持现有节奏练习，或尝试设置更高的目标 BPM 来挑战自己。
          建议每首曲目至少积累 3 次不同日期的练习后，趋势分析会更加准确。
        </p>
      </div>
    `;
  } else {
    listEl.innerHTML = suggestions.map(s => renderSuggestionCard(s)).join('');
  }

  if (conservative) {
    conservativeEl.innerHTML = `
      <div class="conservativeHead">
        <span class="conservativeIcon">${conservative.icon}</span>
        <h3 class="conservativeTitle">${conservative.title}</h3>
      </div>
      <p class="conservativeSummary">${conservative.summary}</p>
      <div class="conservativeTracks">
        ${conservative.tracks.map(t => `
          <div class="conservativeTrackItem">
            <span class="conservativeTrackTag" style="background: ${t.pieceType.color}">
              ${t.pieceType.icon} ${t.pieceType.type}
            </span>
            <span class="conservativeTrackName">${escapeHtml(t.piece)}</span>
            <span class="conservativeTrackMeta">
              ${escapeHtml(t.instrument)} · ${t.recordCount} 条记录${t.lastDate ? ` · 最近: ${t.lastDate}` : ''}
            </span>
          </div>
        `).join('')}
      </div>
      <div class="conservativeAdvice">${conservative.advice}</div>
    `;
  } else {
    conservativeEl.innerHTML = '';
  }

  listEl.querySelectorAll('[data-suggestion-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      archiveFilter = btn.dataset.suggestionFilter;
      render();
      document.querySelector('#rows').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function renderSuggestionCard(s) {
  const priorityLabels = { 0: '紧急', 1: '推荐', 2: '建议', 3: '关注' };
  const metricsByType = {
    speedup: [
      { label: '起始BPM', value: s.metrics.bpmFrom, cls: '' },
      { label: '当前BPM', value: s.metrics.bpmTo, cls: 'positive' },
      { label: '已提升', value: `+${s.metrics.bpmGain}`, cls: 'positive' },
      { label: '建议BPM', value: s.metrics.suggestedBpm, cls: 'positive' }
    ],
    slowdown: [
      { label: '当前BPM', value: s.metrics.currentBpm, cls: 'warning' },
      { label: '安全BPM', value: s.metrics.safeBpm, cls: '' },
      { label: '错误升高', value: `+${s.metrics.mistakeDelta}次`, cls: 'negative' }
    ],
    catchup: [
      { label: '未练习天数', value: `${s.metrics.daysSince}天`, cls: s.metrics.daysSince >= 21 ? 'negative' : 'warning' },
      { label: '上次BPM', value: s.metrics.lastBpm, cls: '' },
      { label: '历史最高', value: s.metrics.maxBpm, cls: 'positive' },
      { label: '热身BPM', value: s.metrics.warmupBpm, cls: 'info' }
    ],
    spike: [
      { label: '最近错误', value: `${s.metrics.latestMistakes}次`, cls: 'negative' },
      { label: '之前均值', value: `${s.metrics.avgPrev}次`, cls: '' },
      { label: '升高倍数', value: `${s.metrics.spikeRatio}x`, cls: 'negative' },
      { label: '建议BPM', value: s.metrics.suggestedBpm, cls: 'warning' }
    ]
  };

  const metrics = metricsByType[s.type] || [];

  return `
    <article class="suggestionCard" style="border-color: ${s.color}20;">
      <div class="suggestionHead">
        <div class="suggestionTitleBlock">
          <div class="suggestionIcon" style="background: ${s.color}15;">${s.icon}</div>
          <div class="suggestionTitleWrap">
            <h3 class="suggestionCategory">${s.title}</h3>
            <div class="suggestionPiece">
              <span class="suggestionPieceName">${escapeHtml(s.piece)}</span>
              <span class="suggestionPieceMeta" style="background: ${s.pieceType.color}">
                ${s.pieceType.icon} ${s.pieceType.type}
              </span>
              <span class="muted" style="font-size: 12px;">${escapeHtml(s.instrument)}</span>
            </div>
          </div>
        </div>
        <span class="suggestionPriority p${s.priority}">${priorityLabels[s.priority] || '建议'}</span>
      </div>
      <div class="suggestionBody">
        <div class="suggestionReason" style="border-left-color: ${s.color};">
          ${s.reason}
        </div>
        ${metrics.length ? `
          <div class="suggestionMetrics">
            ${metrics.map(m => `
              <div class="suggestionMetric">
                <div class="suggestionMetricLabel">${m.label}</div>
                <div class="suggestionMetricValue ${m.cls}">${m.value}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
        <div class="suggestionAction">
          <span class="suggestionActionIcon">💡</span>
          <div class="suggestionActionText">${s.suggestion}</div>
        </div>
        <button type="button" class="secondary small" data-suggestion-filter="${escapeHtml(s.piece)}" style="justify-self: start; margin-top: 4px;">
          🔍 查看该曲目记录
        </button>
      </div>
    </article>
  `;
}

function render() {
  syncGoalAchievements();
  renderSessionPanel();
  renderFilterPanel();
  renderSuggestions();
  const selectedPiece = pieceFilter.value;
  const pieces = [...new Set(records.map((record) => record.piece))].sort();
  pieceFilter.innerHTML = `<option value="">全部曲目</option>${pieces.map((piece) => `<option value="${escapeHtml(piece)}">${escapeHtml(piece)}</option>`).join('')}`;
  const goalPieceSelect = goalForm.querySelector('select[name="piece"]');
  goalPieceSelect.innerHTML = `<option value="">选择曲目</option>${pieces.map((piece) => `<option value="${escapeHtml(piece)}">${escapeHtml(piece)}</option>`).join('')}`;

  refreshLibrary();
  const formLibSelect = document.querySelector('#formLibrarySelect');
  if (formLibSelect) {
    const currentVal = formLibSelect.value;
    formLibSelect.innerHTML = `<option value="">手动输入...</option>${library.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}${item.instrument ? ` (${escapeHtml(item.instrument)})` : ''}</option>`).join('')}`;
    formLibSelect.value = currentVal;
    if (!formLibSelect.dataset.bound) {
      formLibSelect.dataset.bound = '1';
      formLibSelect.addEventListener('change', (e) => {
        const libId = e.target.value;
        if (!libId) return;
        const item = LibraryManager.getById(libId);
        if (!item) return;
        if (item.instrument && form.elements.instrument) {
          form.elements.instrument.value = item.instrument;
        }
        if (form.elements.piece) {
          form.elements.piece.value = item.name;
        }
        if (item.targetBpm && form.elements.bpm && !form.elements.bpm.value) {
          form.elements.bpm.value = item.targetBpm;
        }
        if (item.defaultSections && item.defaultSections.length && !currentSections.length && !editingId) {
          const bpmVal = form.elements.bpm && form.elements.bpm.value ? Number(form.elements.bpm.value) : (item.targetBpm || 80);
          item.defaultSections.forEach(s => {
            currentSections.push({
              id: crypto.randomUUID(),
              name: s.name,
              bpm: bpmVal,
              mistakes: 0,
              mastery: 3,
              note: s.note || ''
            });
          });
          renderSections();
        }
      });
    }
  }

  const planLibSelect = document.querySelector('#planLibrarySelect');
  if (planLibSelect) {
    const currentVal = planLibSelect.value;
    planLibSelect.innerHTML = `<option value="">手动输入...</option>${library.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}${item.targetBpm ? ` (目标 ${item.targetBpm} BPM)` : ''}</option>`).join('')}`;
    planLibSelect.value = currentVal;
    if (!planLibSelect.dataset.bound) {
      planLibSelect.dataset.bound = '1';
      planLibSelect.addEventListener('change', (e) => {
        const libId = e.target.value;
        const pieceInput = planForm.querySelector('input[name="piece"]');
        const bpmInput = planForm.querySelector('input[name="targetBpm"]');
        const previewEl = document.querySelector('#planSectionsPreview');
        const listEl = document.querySelector('#planSectionsList');
        if (!libId) {
          if (listEl) listEl.innerHTML = '';
          if (previewEl) previewEl.style.display = 'none';
          return;
        }
        const item = LibraryManager.getById(libId);
        if (!item) return;
        if (pieceInput) pieceInput.value = item.name;
        if (item.targetBpm && bpmInput && !bpmInput.value) {
          bpmInput.value = item.targetBpm;
        }
        if (item.defaultSections && item.defaultSections.length && previewEl && listEl) {
          listEl.innerHTML = item.defaultSections.map(s => `
            <span class="libSectionTag">${escapeHtml(s.name)}${s.note ? ` <small class="muted">· ${escapeHtml(s.note)}</small>` : ''}</span>
          `).join('');
          previewEl.style.display = 'block';
        } else if (previewEl) {
          previewEl.style.display = 'none';
        }
      });
    }
  }

  const goalLibSelect = document.querySelector('#goalLibrarySelect');
  if (goalLibSelect) {
    const currentVal = goalLibSelect.value;
    goalLibSelect.innerHTML = `<option value="">手动选择曲目...</option>${library.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}${item.targetBpm ? ` (建议目标 ${item.targetBpm} BPM)` : ''}</option>`).join('')}`;
    goalLibSelect.value = currentVal;
    if (!goalLibSelect.dataset.bound) {
      goalLibSelect.dataset.bound = '1';
      goalLibSelect.addEventListener('change', (e) => {
        const libId = e.target.value;
        const pieceSelect = goalForm.querySelector('select[name="piece"]');
        const bpmInput = goalForm.querySelector('input[name="targetBpm"]');
        const previewEl = document.querySelector('#goalSectionsPreview');
        const listEl = document.querySelector('#goalSectionsList');
        if (!libId) {
          if (listEl) listEl.innerHTML = '';
          if (previewEl) previewEl.style.display = 'none';
          return;
        }
        const item = LibraryManager.getById(libId);
        if (!item) return;
        if (pieceSelect) {
          let found = false;
          for (const opt of pieceSelect.options) {
            if (opt.value === item.name) {
              pieceSelect.value = item.name;
              found = true;
              break;
            }
          }
          if (!found) {
            const newOpt = document.createElement('option');
            newOpt.value = item.name;
            newOpt.textContent = item.name;
            pieceSelect.appendChild(newOpt);
            pieceSelect.value = item.name;
          }
        }
        if (item.targetBpm && bpmInput && !bpmInput.value) {
          bpmInput.value = item.targetBpm;
        }
        if (item.defaultSections && item.defaultSections.length && previewEl && listEl) {
          listEl.innerHTML = item.defaultSections.map(s => `
            <span class="libSectionTag">${escapeHtml(s.name)}${s.note ? ` <small class="muted">· ${escapeHtml(s.note)}</small>` : ''}</span>
          `).join('');
          previewEl.style.display = 'block';
        } else if (previewEl) {
          previewEl.style.display = 'none';
        }
      });
    }
  }
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
  const hasArchiveFilter = !!archiveFilter;
  const hasSectionFilter = !!filters.noteKeyword;
  if (hasArchiveFilter || hasSectionFilter) {
    const filterParts = [];
    if (hasArchiveFilter) filterParts.push(`🎵 ${escapeHtml(archiveFilter)}`);
    if (hasSectionFilter) filterParts.push(`📂 片段: ${escapeHtml(filters.noteKeyword)}`);
    filterBadge.innerHTML = `<span class="filterTag">筛选: ${filterParts.join(' · ')} <button id="clearFilter" class="clearFilter">×</button></span>`;
    document.querySelector('#clearFilter').addEventListener('click', () => {
      archiveFilter = '';
      pieceFilter.value = '';
      filters.piece = '';
      filters.noteKeyword = '';
      saveFilters();
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
  renderSegmentTrends();
  renderArchive();
  renderGoals();
  renderGoalDashboard();
  renderLibrary();
  renderReport();
}

function renderReport() {
  const report = ReportManager.generateReport(reportRange);
  const { summary, planCompletion, overdueGoals, recommendedSections, goalsProgress, trackArchive, rangeLabel, dailyRecords } = report;
  const rangeLabelEl = document.querySelector('#reportRangeLabel');
  const contentEl = document.querySelector('#reportContent');
  const weekBtn = document.querySelector('#rangeWeekBtn');
  const monthBtn = document.querySelector('#rangeMonthBtn');
  const exportBtn = document.querySelector('#exportReportBtn');

  rangeLabelEl.textContent = rangeLabel;

  if (weekBtn) {
    weekBtn.className = `rangeBtn ${reportRange === 'week' ? 'active' : ''}`;
    weekBtn.onclick = () => { reportRange = 'week'; render(); };
  }
  if (monthBtn) {
    monthBtn.className = `rangeBtn ${reportRange === 'month' ? 'active' : ''}`;
    monthBtn.onclick = () => { reportRange = 'month'; render(); };
  }
  if (exportBtn) {
    exportBtn.onclick = () => ReportManager.exportReport(reportRange);
  }

  const minutesChangeColor = summary.minutesChange >= 0 ? '#059669' : '#dc2626';
  const minutesChangeText = summary.minutesChange >= 0 ? `+${summary.minutesChange}` : summary.minutesChange;
  const minutesChangeIcon = summary.minutesChange >= 0 ? '↑' : '↓';
  const pieceChangeColor = summary.pieceChange >= 0 ? '#059669' : '#dc2626';
  const pieceChangeText = summary.pieceChange >= 0 ? `+${summary.pieceChange}` : summary.pieceChange;
  const pieceChangeIcon = summary.pieceChange >= 0 ? '↑' : '↓';
  const bpmGainColor = summary.bpmStats.gain >= 0 ? '#059669' : '#dc2626';
  const bpmGainText = summary.bpmStats.gain >= 0 ? `+${summary.bpmStats.gain}` : summary.bpmStats.gain;
  const bpmGainIcon = summary.bpmStats.gain >= 0 ? '↑' : '↓';
  const mistakeTrendColor = summary.mistakesStats.trend <= 0 ? '#059669' : '#dc2626';
  const mistakeTrendText = summary.mistakesStats.trend <= 0 ? (summary.mistakesStats.trend === 0 ? '0' : `${summary.mistakesStats.trend}`) : `+${summary.mistakesStats.trend}`;
  const mistakeTrendIcon = summary.mistakesStats.trend <= 0 ? (summary.mistakesStats.trend === 0 ? '→' : '↓') : '↑';
  const prevLabel = reportRange === 'week' ? '上周' : '上月';

  if (!summary.recordCount && !goalsProgress.length && !planCompletion.totalTasks) {
    contentEl.innerHTML = `
      <div class="reportEmpty">
        <span class="reportEmptyIcon">📊</span>
        <h3 class="reportEmptyTitle">暂无复盘数据</h3>
        <p class="reportEmptyDesc">添加练习记录、设置目标或今日计划后，这里将自动生成${reportRange === 'week' ? '周' : '月'}度复盘报告。</p>
      </div>
    `;
    return;
  }

  contentEl.innerHTML = `
    <div class="reportStats">
      <div class="reportStat">
        <span class="reportStatLabel">总练习时长</span>
        <strong class="reportStatValue">${summary.totalMinutes}<small>min</small></strong>
        <span class="reportStatChange" style="color:${minutesChangeColor};">${minutesChangeIcon} ${minutesChangeText} vs ${prevLabel}</span>
      </div>
      <div class="reportStat">
        <span class="reportStatLabel">曲目覆盖数</span>
        <strong class="reportStatValue">${summary.pieceCount}<small>首</small></strong>
        <span class="reportStatChange" style="color:${pieceChangeColor};">${pieceChangeIcon} ${pieceChangeText} vs ${prevLabel}</span>
      </div>
      <div class="reportStat">
        <span class="reportStatLabel">平均 BPM</span>
        <strong class="reportStatValue">${summary.bpmStats.avg}</strong>
        <span class="reportStatChange" style="color:${bpmGainColor};">${bpmGainIcon} ${bpmGainText} BPM</span>
      </div>
      <div class="reportStat">
        <span class="reportStatLabel">错误次数趋势</span>
        <strong class="reportStatValue">${summary.mistakesStats.avg}<small>次/次</small></strong>
        <span class="reportStatChange" style="color:${mistakeTrendColor};">${mistakeTrendIcon} ${mistakeTrendText} 次</span>
      </div>
      <div class="reportStat">
        <span class="reportStatLabel">练习天数</span>
        <strong class="reportStatValue">${summary.activeDays}<small>天</small></strong>
      </div>
      <div class="reportStat">
        <span class="reportStatLabel">练习记录</span>
        <strong class="reportStatValue">${summary.recordCount}<small>条</small></strong>
      </div>
    </div>

    ${dailyRecords.length ? `
    <div class="reportSection">
      <h3 class="reportSectionTitle">📅 每日练习时长</h3>
      <div class="reportChart">
        ${drawBarsInline(dailyRecords, 'min', '#d97706')}
      </div>
    </div>
    ` : ''}

    <div class="reportSection">
      <h3 class="reportSectionTitle">✅ 计划完成情况</h3>
      <div class="reportPlanCard">
        <div class="reportPlanHead">
          <div>
            <div class="reportPlanTitle">任务完成率</div>
            <div class="reportPlanMeta">
              <span>已完成: <strong>${planCompletion.completedTasks}</strong> / ${planCompletion.totalTasks} 个任务</span>
              <span>预计总时长: <strong>${planCompletion.totalEstimatedMinutes}min</strong></span>
            </div>
          </div>
          <div class="reportPlanPercent">${planCompletion.completionRate}%</div>
        </div>
        <div class="reportPlanBar"><div class="reportPlanFill" style="width:${planCompletion.completionRate}%;"></div></div>
        ${planCompletion.dailyStats.length ? `
        <div class="reportPlanDaily">
          ${planCompletion.dailyStats.map(d => `
            <div class="reportPlanDay">
              <span class="reportPlanDayDate">${d.date.slice(5)}</span>
              <span class="reportPlanDayInfo">完成 <strong>${d.completed}</strong>/${d.total} · ${d.minutes}min</span>
            </div>
          `).join('')}
        </div>
        ` : ''}
      </div>
    </div>

    ${goalsProgress.length ? `
    <div class="reportSection">
      <h3 class="reportSectionTitle">🎯 目标进度</h3>
      <div class="reportGoals">
        ${goalsProgress.map(g => {
          const isOverdue = g.progress.isOverdue && !g.progress.isAchieved;
          const isAchieved = g.progress.isAchieved || g.achieved;
          return `
          <div class="reportGoalCard ${isOverdue ? 'overdue' : ''} ${isAchieved ? 'achieved' : ''}">
            <div class="reportGoalHead">
              <div class="reportGoalTitle">${escapeHtml(g.piece)}</div>
              <span class="reportGoalTag" style="background:${g.pieceType.color};">${g.pieceType.icon} ${g.pieceType.type}</span>
            </div>
            <div class="reportGoalMeta">
              <span>目标: <strong>${g.targetBpm}</strong> BPM</span>
              <span>当前: <strong>${g.progress.currentBpm}</strong> BPM</span>
              <span>截止: <strong>${g.targetDate}</strong></span>
            </div>
            <div class="reportGoalProgress">
              <div class="reportGoalProgRow">
                <span>BPM ${g.progress.bpmProgress}%</span>
                <div class="reportGoalProgBar"><div class="reportGoalProgFill bpm" style="width:${g.progress.bpmProgress}%;"></div></div>
              </div>
              <div class="reportGoalProgRow">
                <span>本周 ${g.progress.weeklyProgress}%</span>
                <div class="reportGoalProgBar"><div class="reportGoalProgFill weekly" style="width:${g.progress.weeklyProgress}%;"></div></div>
              </div>
            </div>
            ${isOverdue ? `<div class="reportGoalAlert overdue">⚠ 已逾期 ${Math.abs(g.progress.daysRemaining)} 天</div>` : ''}
            ${isAchieved ? `<div class="reportGoalAlert achieved">✓ 已达成</div>` : ''}
          </div>
          `;
        }).join('')}
      </div>
    </div>
    ` : ''}

    ${overdueGoals.length ? `
    <div class="reportSection">
      <h3 class="reportSectionTitle overdue">⚠ 逾期目标 (${overdueGoals.length})</h3>
      <div class="reportOverdueList">
        ${overdueGoals.map(g => `
        <div class="reportOverdueItem">
          <div class="reportOverdueTitle">${escapeHtml(g.piece)}</div>
          <div class="reportOverdueMeta">
            <span>目标: <strong>${g.targetBpm} BPM</strong></span>
            <span>当前: <strong>${g.progress.currentBpm} BPM</strong></span>
            <span>逾期: <strong style="color:#dc2626;">${Math.abs(g.progress.daysRemaining)} 天</strong></span>
          </div>
        </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <div class="reportSection">
      <h3 class="reportSectionTitle">🔥 最值得继续练的片段</h3>
      ${recommendedSections.length ? `
      <div class="reportSectionsList">
        ${recommendedSections.map(s => {
          const masteryColor = getMasteryColor(s.latestMastery);
          return `
          <div class="reportSectionCard">
            <div class="reportSectionHead">
              <div>
                <div class="reportSectionName">${escapeHtml(s.piece)} · ${escapeHtml(s.name)}</div>
                <div class="reportSectionMeta">
                  <span>${escapeHtml(s.instrument)}</span>
                  <span>练习 <strong>${s.practiceCount}</strong> 次</span>
                </div>
              </div>
              <span class="reportMasteryBadge" style="background:${masteryColor};">${getMasteryLabel(s.latestMastery)}</span>
            </div>
            <div class="reportSectionStats">
              <div class="reportSectionStat">
                <span>当前 BPM</span>
                <strong>${s.latestBpm} <small style="color:${s.bpmGain >= 0 ? '#059669' : '#dc2626'};">(${s.bpmGain >= 0 ? '+' : ''}${s.bpmGain})</small></strong>
              </div>
              <div class="reportSectionStat">
                <span>错误次数</span>
                <strong>${s.latestMistakes} <small style="color:${s.mistakeTrend <= 0 ? '#059669' : '#dc2626'};">(${s.mistakeTrend <= 0 ? (s.mistakeTrend === 0 ? '0' : s.mistakeTrend) : '+' + s.mistakeTrend})</small></strong>
              </div>
              <div class="reportSectionStat">
                <span>掌握程度</span>
                <strong style="color:${masteryColor};">${s.latestMastery}/5</strong>
              </div>
            </div>
          </div>
          `;
        }).join('')}
      </div>
      ` : `
      <div class="reportEmpty small">
        <p class="muted" style="margin:0;text-align:center;">💡 本期暂无分段练习数据，添加练习记录时可拆分片段进行精细化复盘</p>
      </div>
      `}
    </div>

    ${trackArchive.length ? `
    <div class="reportSection">
      <h3 class="reportSectionTitle">📚 曲目档案</h3>
      <div class="reportTracks">
        ${trackArchive.map(t => {
          const mistakeColor = t.mistakeTrend < 0 ? '#059669' : t.mistakeTrend > 0 ? '#dc2626' : '#60736f';
          const mistakeText = t.mistakeTrend < 0 ? `↓ ${Math.abs(t.mistakeTrend)}` : t.mistakeTrend > 0 ? `↑ ${t.mistakeTrend}` : '—';
          return `
          <div class="reportTrackCard">
            <div class="reportTrackHead">
              <div class="reportTrackName">${escapeHtml(t.piece)}</div>
              <span class="muted">${escapeHtml(t.instrument)} · ${t.practiceCount} 次</span>
            </div>
            <div class="reportTrackStats">
              <span>最高 BPM: <strong>${t.maxBpm}</strong></span>
              <span>累计: <strong>${t.totalMinutes}min</strong></span>
              <span>最近: <strong>${t.lastDate}</strong></span>
              <span>错误趋势: <strong style="color:${mistakeColor};">${mistakeText}</strong></span>
            </div>
          </div>
          `;
        }).join('')}
      </div>
    </div>
    ` : ''}
  `;
}

function drawBarsInline(data, unit, color) {
  if (!data.length) return '';
  const max = Math.max(...data.map((item) => item.value), 1);
  return `<svg viewBox="0 0 500 160" style="width:100%;min-height:140px;">${data.map((item, index) => {
    const barWidth = Math.min(60, 440 / Math.max(data.length, 1));
    const gap = Math.max(8, (500 - barWidth * data.length) / (data.length + 1));
    const x = gap + index * (barWidth + gap * 0.5);
    const barHeight = (item.value / max) * 100;
    const y = 130 - barHeight;
    return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="4" fill="${color}"/>
<text x="${x + barWidth / 2}" y="${y - 6}" fill="#172522" font-size="11" font-weight="600" text-anchor="middle">${item.value}${unit}</text>
<text x="${x + barWidth / 2}" y="150" fill="#60736f" font-size="11" text-anchor="middle">${item.label}</text>`;
  }).join('')}</svg>`;
}

function computeSegmentTrends() {
  const ABSENCE_DAYS = 14;
  const pieceMap = new Map();

  records.forEach(record => {
    const sections = getSections(record);
    if (!sections.length) return;
    if (!pieceMap.has(record.piece)) {
      pieceMap.set(record.piece, {
        piece: record.piece,
        instrument: record.instrument,
        sectionMap: new Map(),
        recordDates: []
      });
    }
    const piece = pieceMap.get(record.piece);
    piece.recordDates.push(record.date);

    sections.forEach(section => {
      if (!piece.sectionMap.has(section.name)) {
        piece.sectionMap.set(section.name, {
          name: section.name,
          piece: record.piece,
          bpmHistory: [],
          mistakesHistory: [],
          masteryHistory: [],
          recordIds: []
        });
      }
      const seg = piece.sectionMap.get(section.name);
      seg.bpmHistory.push({ date: record.date, value: section.bpm });
      seg.mistakesHistory.push({ date: record.date, value: section.mistakes });
      seg.masteryHistory.push({ date: record.date, value: section.mastery });
      seg.recordIds.push(record.id);
    });
  });

  const today = getToday();
  const results = [];

  pieceMap.forEach(piece => {
    const segments = [];
    piece.sectionMap.forEach(seg => {
      const sortedBpm = [...seg.bpmHistory].sort((a, b) => a.date.localeCompare(b.date));
      const sortedMistakes = [...seg.mistakesHistory].sort((a, b) => a.date.localeCompare(b.date));
      const sortedMastery = [...seg.masteryHistory].sort((a, b) => a.date.localeCompare(b.date));

      const maxBpm = sortedBpm.length ? Math.max(...sortedBpm.map(h => h.value)) : 0;
      const latestBpm = sortedBpm.length ? sortedBpm[sortedBpm.length - 1].value : 0;
      const latestMastery = sortedMastery.length ? sortedMastery[sortedMastery.length - 1].value : 0;
      const latestMistakes = sortedMistakes.length ? sortedMistakes[sortedMistakes.length - 1].value : 0;

      let masteryTrend = 0;
      if (sortedMastery.length >= 2) {
        masteryTrend = sortedMastery[sortedMastery.length - 1].value - sortedMastery[sortedMastery.length - 2].value;
      }
      let mistakesTrend = 0;
      if (sortedMistakes.length >= 2) {
        mistakesTrend = sortedMistakes[sortedMistakes.length - 1].value - sortedMistakes[sortedMistakes.length - 2].value;
      }
      let bpmTrend = 0;
      if (sortedBpm.length >= 2) {
        bpmTrend = sortedBpm[sortedBpm.length - 1].value - sortedBpm[sortedBpm.length - 2].value;
      }

      const lastDate = sortedBpm.length ? sortedBpm[sortedBpm.length - 1].date : '';
      const daysSince = lastDate ? Math.round((new Date(today) - new Date(lastDate)) / (1000 * 60 * 60 * 24)) : 999;
      const longAbsent = daysSince >= ABSENCE_DAYS;
      const regressing = masteryTrend < 0 || mistakesTrend > 0;

      segments.push({
        name: seg.name,
        piece: seg.piece,
        bpmHistory: sortedBpm,
        mistakesHistory: sortedMistakes,
        masteryHistory: sortedMastery,
        maxBpm,
        latestBpm,
        latestMastery,
        latestMistakes,
        masteryTrend,
        mistakesTrend,
        bpmTrend,
        lastDate,
        daysSince,
        longAbsent,
        regressing,
        practiceCount: seg.bpmHistory.length,
        recordIds: seg.recordIds,
        alertLevel: longAbsent && regressing ? 'critical' : regressing ? 'warning' : longAbsent ? 'absent' : 'normal'
      });
    });

    segments.sort((a, b) => {
      const alertOrder = { critical: 0, warning: 1, absent: 2, normal: 3 };
      if (alertOrder[a.alertLevel] !== alertOrder[b.alertLevel]) return alertOrder[a.alertLevel] - alertOrder[b.alertLevel];
      return b.practiceCount - a.practiceCount;
    });

    results.push({
      piece: piece.piece,
      instrument: piece.instrument,
      segments,
      hasAlert: segments.some(s => s.alertLevel !== 'normal'),
      alertCount: segments.filter(s => s.alertLevel !== 'normal').length
    });
  });

  results.sort((a, b) => {
    if (a.hasAlert !== b.hasAlert) return a.hasAlert ? -1 : 1;
    if (a.alertCount !== b.alertCount) return b.alertCount - a.alertCount;
    return 0;
  });

  return results;
}

function renderSegmentTrends() {
  const data = computeSegmentTrends();
  const metaEl = document.querySelector('#segmentTrendMeta');
  const contentEl = document.querySelector('#segmentTrendContent');

  const totalSegments = data.reduce((sum, p) => sum + p.segments.length, 0);
  const alertSegments = data.reduce((sum, p) => sum + p.segments.filter(s => s.alertLevel !== 'normal').length, 0);
  const piecesWithSections = data.filter(p => p.segments.length > 0);

  if (metaEl) {
    metaEl.textContent = piecesWithSections.length
      ? `${piecesWithSections.length} 首曲目 · ${totalSegments} 个片段${alertSegments ? ` · ${alertSegments} 个需关注` : ''}`
      : '';
  }

  if (!piecesWithSections.length) {
    contentEl.innerHTML = `
      <div class="segmentTrendEmpty">
        <span class="segmentTrendEmptyIcon">📊</span>
        <h3 class="segmentTrendEmptyTitle">暂无分段练习数据</h3>
        <p class="segmentTrendEmptyDesc">添加练习记录时拆分片段（前奏、主歌、副歌、Solo等），即可在此查看各片段的趋势变化。</p>
      </div>
    `;
    return;
  }

  contentEl.innerHTML = piecesWithSections.map(piece => {
    const hasAlert = piece.hasAlert;
    return `
      <div class="segmentTrendPiece ${hasAlert ? 'hasAlert' : ''}">
        <div class="segmentTrendPieceHead">
          <div class="segmentTrendPieceInfo">
            <h3 class="segmentTrendPieceTitle">${escapeHtml(piece.piece)}</h3>
            <span class="segmentTrendPieceMeta">${escapeHtml(piece.instrument)} · ${piece.segments.length} 个片段</span>
          </div>
          ${hasAlert ? `<span class="segmentTrendAlertBadge">${piece.alertCount} 个需关注</span>` : ''}
        </div>
        <div class="segmentTrendGrid">
          ${piece.segments.map(seg => {
            const bpmSvg = drawMiniTrendLine(seg.bpmHistory, '#0f766e');
            const mistakesColor = seg.mistakesTrend > 0 ? '#dc2626' : seg.mistakesTrend < 0 ? '#059669' : '#60736f';
            const mistakesSvg = drawMiniTrendLine(seg.mistakesHistory, mistakesColor);
            const masterySvg = drawMiniTrendLine(seg.masteryHistory, getMasteryColor(seg.latestMastery));

            const bpmTrendIcon = seg.bpmTrend > 0 ? '↑' : seg.bpmTrend < 0 ? '↓' : '→';
            const bpmTrendColor = seg.bpmTrend > 0 ? '#059669' : seg.bpmTrend < 0 ? '#dc2626' : '#60736f';
            const mistakesTrendIcon = seg.mistakesTrend > 0 ? '↑' : seg.mistakesTrend < 0 ? '↓' : '→';
            const masteryTrendIcon = seg.masteryTrend > 0 ? '↑' : seg.masteryTrend < 0 ? '↓' : '→';
            const masteryTrendColor = seg.masteryTrend > 0 ? '#059669' : seg.masteryTrend < 0 ? '#dc2626' : '#60736f';

            return `
              <div class="segmentTrendCard ${seg.alertLevel}" data-segment-piece="${escapeHtml(seg.piece)}" data-segment-name="${escapeHtml(seg.name)}">
                <div class="segmentTrendCardHead">
                  <strong class="segmentTrendCardName">${escapeHtml(seg.name)}</strong>
                  <span class="masteryBadge" style="background: ${getMasteryColor(seg.latestMastery)}">${getMasteryLabel(seg.latestMastery)}</span>
                </div>
                ${seg.alertLevel !== 'normal' ? `
                  <div class="segmentTrendAlert">
                    ${seg.longAbsent ? `<span class="segmentTrendAlertTag absent">⏳ ${seg.daysSince}天未练</span>` : ''}
                    ${seg.regressing ? `<span class="segmentTrendAlertTag regressing">⚠️ 最近退步</span>` : ''}
                  </div>
                ` : ''}
                <div class="segmentTrendMetrics">
                  <div class="segmentTrendMetric">
                    <span class="segmentTrendMetricLabel">BPM</span>
                    <span class="segmentTrendMetricValue">${seg.latestBpm}</span>
                    <span class="segmentTrendMetricTrend" style="color:${bpmTrendColor}">${bpmTrendIcon}${seg.bpmTrend !== 0 ? Math.abs(seg.bpmTrend) : ''}</span>
                    ${bpmSvg}
                  </div>
                  <div class="segmentTrendMetric">
                    <span class="segmentTrendMetricLabel">错误</span>
                    <span class="segmentTrendMetricValue">${seg.latestMistakes}</span>
                    <span class="segmentTrendMetricTrend" style="color:${mistakesColor}">${mistakesTrendIcon}${seg.mistakesTrend !== 0 ? Math.abs(seg.mistakesTrend) : ''}</span>
                    ${mistakesSvg}
                  </div>
                  <div class="segmentTrendMetric">
                    <span class="segmentTrendMetricLabel">掌握度</span>
                    <span class="segmentTrendMetricValue" style="color:${getMasteryColor(seg.latestMastery)}">${seg.latestMastery}/5</span>
                    <span class="segmentTrendMetricTrend" style="color:${masteryTrendColor}">${masteryTrendIcon}${seg.masteryTrend !== 0 ? Math.abs(seg.masteryTrend) : ''}</span>
                    ${masterySvg}
                  </div>
                </div>
                <div class="segmentTrendCardFoot">
                  <span class="muted">练习 ${seg.practiceCount} 次${seg.lastDate ? ' · 最近 ' + seg.lastDate : ''}</span>
                  <button class="segmentTrendFilterBtn" data-filter-segment-piece="${escapeHtml(seg.piece)}" data-filter-segment-name="${escapeHtml(seg.name)}">筛选记录</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');

  function applySegmentFilter(pieceName, sectionName) {
    archiveFilter = pieceName;
    filters.piece = pieceName;
    filters.noteKeyword = sectionName;
    saveFilters();
    render();
    setTimeout(() => {
      document.querySelector('#rows')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  contentEl.querySelectorAll('.segmentTrendCard').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => {
      if (e.target.closest('.segmentTrendFilterBtn')) return;
      const pieceName = card.dataset.segmentPiece;
      const sectionName = card.dataset.segmentName;
      if (pieceName) applySegmentFilter(pieceName, sectionName);
    });
  });

  contentEl.querySelectorAll('[data-filter-segment-piece]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const pieceName = btn.dataset.filterSegmentPiece;
      const sectionName = btn.dataset.filterSegmentName;
      applySegmentFilter(pieceName, sectionName);
    });
  });
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

function addLibSection(name = '', note = '') {
  libSections.push({
    _id: crypto.randomUUID(),
    name: name,
    note: note
  });
  renderLibSections();
}

function removeLibSection(id) {
  libSections = libSections.filter(s => s._id !== id);
  renderLibSections();
}

function updateLibSection(id, field, value) {
  const section = libSections.find(s => s._id === id);
  if (section) {
    section[field] = value;
  }
}

function renderLibSections() {
  const listEl = document.querySelector('#libSectionsList');
  if (!listEl) return;
  if (!libSections.length) {
    listEl.innerHTML = '<p class="empty sectionsEmpty">暂无默认片段</p>';
    return;
  }
  listEl.innerHTML = libSections.map((section) => `
    <div class="libSectionItem" data-id="${section._id}">
      <input type="text" placeholder="片段名称" value="${escapeHtml(section.name)}" data-lib-section-field="name" data-lib-section-id="${section._id}" />
      <input type="text" placeholder="备注说明（可选）" value="${escapeHtml(section.note || '')}" data-lib-section-field="note" data-lib-section-id="${section._id}" />
      <button type="button" class="secondary small" data-lib-section-del="${section._id}">删除</button>
    </div>
  `).join('');

  listEl.querySelectorAll('[data-lib-section-field]').forEach(input => {
    input.addEventListener('input', (e) => {
      updateLibSection(e.target.dataset.libSectionId, e.target.dataset.libSectionField, e.target.value);
    });
  });

  listEl.querySelectorAll('[data-lib-section-del]').forEach(btn => {
    btn.addEventListener('click', () => removeLibSection(btn.dataset.libSectionDel));
  });
}

function addLibLink(label = '', url = '') {
  libLinks.push({
    _id: crypto.randomUUID(),
    label: label,
    url: url
  });
  renderLibLinks();
}

function removeLibLink(id) {
  libLinks = libLinks.filter(l => l._id !== id);
  renderLibLinks();
}

function updateLibLink(id, field, value) {
  const link = libLinks.find(l => l._id === id);
  if (link) {
    link[field] = value;
  }
}

function renderLibLinks() {
  const listEl = document.querySelector('#libLinksList');
  if (!listEl) return;
  if (!libLinks.length) {
    listEl.innerHTML = '<p class="empty sectionsEmpty">暂无参考链接</p>';
    return;
  }
  listEl.innerHTML = libLinks.map((link) => `
    <div class="libLinkItem" data-id="${link._id}">
      <input type="text" placeholder="链接标签（如：原版录音、乐谱、教程）" value="${escapeHtml(link.label)}" data-lib-link-field="label" data-lib-link-id="${link._id}" />
      <input type="url" placeholder="URL地址" value="${escapeHtml(link.url)}" data-lib-link-field="url" data-lib-link-id="${link._id}" />
      <button type="button" class="secondary small" data-lib-link-del="${link._id}">删除</button>
    </div>
  `).join('');

  listEl.querySelectorAll('[data-lib-link-field]').forEach(input => {
    input.addEventListener('input', (e) => {
      updateLibLink(e.target.dataset.libLinkId, e.target.dataset.libLinkField, e.target.value);
    });
  });

  listEl.querySelectorAll('[data-lib-link-del]').forEach(btn => {
    btn.addEventListener('click', () => removeLibLink(btn.dataset.libLinkDel));
  });
}

function resetLibraryForm() {
  libraryForm.reset();
  libraryForm.elements.editingId.value = '';
  libSections = [];
  libLinks = [];
  renderLibSections();
  renderLibLinks();
  document.querySelector('#libSubmitBtn').textContent = '➕ 添加到资料库';
  document.querySelector('#libResetBtn').hidden = true;
}

function editLibraryItem(id) {
  const item = LibraryManager.getById(id);
  if (!item) return;
  libraryForm.elements.name.value = item.name || '';
  libraryForm.elements.instrument.value = item.instrument || '';
  libraryForm.elements.genre.value = item.genre || '';
  libraryForm.elements.targetBpm.value = item.targetBpm || '';
  libraryForm.elements.practiceNotes.value = item.practiceNotes || '';
  libraryForm.elements.editingId.value = item.id;
  libSections = (item.defaultSections || []).map(s => ({ _id: crypto.randomUUID(), name: s.name || '', note: s.note || '' }));
  libLinks = (item.referenceLinks || []).map(l => ({ _id: crypto.randomUUID(), label: l.label || '', url: l.url || '' }));
  renderLibSections();
  renderLibLinks();
  document.querySelector('#libSubmitBtn').textContent = '💾 保存修改';
  document.querySelector('#libResetBtn').hidden = false;
  libraryForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderLibrary() {
  refreshLibrary();
  const countEl = document.querySelector('#libraryCount');
  const listEl = document.querySelector('#libraryList');
  const searchInput = document.querySelector('#librarySearch');
  const instrumentSelect = document.querySelector('#libraryInstrumentFilter');
  const genreInput = document.querySelector('#libraryGenreFilter');
  if (searchInput) searchInput.value = libraryFilter.keyword;
  if (instrumentSelect) instrumentSelect.value = libraryFilter.instrument;
  if (genreInput) genreInput.value = libraryFilter.genre;

  const keyword = libraryFilter.keyword.trim().toLowerCase();
  const instrumentFilter = libraryFilter.instrument;
  const genreFilter = libraryFilter.genre.trim().toLowerCase();

  const filtered = library.filter(item => {
    if (instrumentFilter && item.instrument !== instrumentFilter) return false;
    if (genreFilter && !(item.genre || '').toLowerCase().includes(genreFilter)) return false;
    if (keyword) {
      const haystack = [item.name, item.instrument, item.genre, item.practiceNotes].join(' ').toLowerCase();
      if (!haystack.includes(keyword)) return false;
    }
    return true;
  });

  const hasFilter = keyword || instrumentFilter || genreFilter;
  if (hasFilter) {
    countEl.textContent = `${filtered.length} / ${library.length} 首曲目`;
  } else {
    countEl.textContent = `共 ${library.length} 首曲目`;
  }

  if (!library.length) {
    listEl.innerHTML = '<p class="empty">暂无曲目，添加第一首到资料库</p>';
    return;
  }

  if (!filtered.length) {
    listEl.innerHTML = '<p class="empty">没有匹配的曲目，试试其他关键词</p>';
    return;
  }

  listEl.innerHTML = filtered.map((item) => `
    <article class="libraryCard" data-id="${item.id}">
      <div class="libraryCardHead">
        <div>
          <h3 class="libraryCardTitle">${escapeHtml(item.name)}</h3>
          <div class="libraryCardMeta">
            ${item.instrument ? `<span class="libTag instrument">🎵 ${escapeHtml(item.instrument)}</span>` : ''}
            ${item.genre ? `<span class="libTag genre">🎶 ${escapeHtml(item.genre)}</span>` : ''}
            ${item.targetBpm ? `<span class="libTag bpm">⚡ 目标 ${item.targetBpm} BPM</span>` : ''}
          </div>
        </div>
        <div class="libraryCardActions">
          <button class="secondary small" data-lib-edit="${item.id}">编辑</button>
          <button class="secondary small danger" data-lib-del="${item.id}">删除</button>
        </div>
      </div>
      ${item.defaultSections && item.defaultSections.length ? `
        <div class="libraryCardSection">
          <div class="libraryCardSectionTitle">📋 默认片段 (${item.defaultSections.length})</div>
          <div class="librarySections">
            ${item.defaultSections.map(s => `<span class="libSectionTag">${escapeHtml(s.name)}${s.note ? ` <em>(${escapeHtml(s.note)})</em>` : ''}</span>`).join('')}
          </div>
        </div>
      ` : ''}
      ${item.referenceLinks && item.referenceLinks.length ? `
        <div class="libraryCardSection">
          <div class="libraryCardSectionTitle">🔗 参考链接</div>
          <div class="libraryLinks">
            ${item.referenceLinks.map(l => `<a href="${escapeHtml(l.url)}" target="_blank" rel="noopener">${escapeHtml(l.label || l.url)}</a>`).join('')}
          </div>
        </div>
      ` : ''}
      ${item.practiceNotes ? `
        <div class="libraryCardSection">
          <div class="libraryCardSectionTitle">📝 练习备注</div>
          <div class="libraryNotes">${escapeHtml(item.practiceNotes)}</div>
        </div>
      ` : ''}
    </article>
  `).join('');

  listEl.querySelectorAll('[data-lib-edit]').forEach(btn => {
    btn.addEventListener('click', () => editLibraryItem(btn.dataset.libEdit));
  });
  listEl.querySelectorAll('[data-lib-del]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const item = LibraryManager.getById(btn.dataset.libDel);
      if (!item) return;
      const confirmed = await showConfirm('删除曲目', `确定从资料库删除「${item.name}」吗？\n已有练习记录不会被删除。`);
      if (!confirmed) return;
      const result = LibraryManager.remove(item.id);
      if (result.success) {
        render();
      } else {
        alert(result.error || '删除失败');
      }
    });
  });

  const addSectionBtn = document.querySelector('#addLibSectionBtn');
  const addLinkBtn = document.querySelector('#addLibLinkBtn');
  const resetBtn = document.querySelector('#libResetBtn');
  if (addSectionBtn) addSectionBtn.onclick = () => addLibSection();
  if (addLinkBtn) addLinkBtn.onclick = () => addLibLink();
  if (resetBtn) resetBtn.onclick = () => resetLibraryForm();

  if (!libraryForm.dataset.bound) {
    libraryForm.dataset.bound = '1';
    libraryForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(libraryForm).entries());
      const editingId = data.editingId;
      const payload = {
        name: data.name,
        instrument: data.instrument,
        genre: data.genre,
        targetBpm: data.targetBpm,
        defaultSections: libSections.map(s => ({ name: s.name, note: s.note })),
        referenceLinks: libLinks.map(l => ({ label: l.label, url: l.url })),
        practiceNotes: data.practiceNotes
      };
      let result;
      if (editingId) {
        result = LibraryManager.update(editingId, payload);
      } else {
        result = LibraryManager.add(payload);
      }
      if (result.success) {
        resetLibraryForm();
        render();
      } else {
        alert(result.error || '操作失败');
      }
    });
  }
}

function createRecordFromPlan(task) {
  const pieceInfo = LibraryManager.resolvePieceInfo(task.piece);
  
  editingId = null;
  currentSections = [];
  
  if (form.elements.instrument) {
    form.elements.instrument.value = pieceInfo.instrument || '';
  }
  if (form.elements.piece) {
    form.elements.piece.value = task.piece;
  }
  if (form.elements.date) {
    form.elements.date.value = getToday();
  }
  if (form.elements.bpm) {
    form.elements.bpm.value = task.targetBpm;
  }
  if (form.elements.minutes) {
    form.elements.minutes.value = task.estimatedMinutes;
  }
  if (form.elements.mistakes) {
    form.elements.mistakes.value = '';
  }
  if (form.elements.note) {
    form.elements.note.value = '';
  }
  
  if (task.sections && task.sections.length) {
    currentSections = task.sections.map(s => ({
      id: crypto.randomUUID(),
      name: s.name,
      bpm: Number(task.targetBpm),
      mistakes: 0,
      mastery: 3,
      note: s.note || ''
    }));
  } else if (pieceInfo.defaultSections && pieceInfo.defaultSections.length) {
    currentSections = pieceInfo.defaultSections.map(s => ({
      id: crypto.randomUUID(),
      name: s.name,
      bpm: Number(task.targetBpm),
      mistakes: 0,
      mastery: 3,
      note: s.note || ''
    }));
  }
  
  renderSections();
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function generateGoalSuggestions() {
  const suggestions = [];
  const activeGoals = goals.filter(g => !g.achieved);

  activeGoals.forEach((goal) => {
    const progress = calculateGoalProgress(goal);
    const reasons = [];

    if (progress.isOverdue) {
      reasons.push(`已逾期 ${Math.abs(progress.daysRemaining)} 天`);
    } else if (progress.daysRemaining <= 3) {
      reasons.push(`临近截止（剩余 ${progress.daysRemaining} 天）`);
    }

    if (progress.weeklyProgress < 60) {
      const shortfall = goal.weeklyMinutes - progress.weekMinutes;
      if (shortfall > 0) {
        reasons.push(`本周练习时长还差 ${shortfall} 分钟`);
      }
    }

    if (reasons.length > 0) {
      const shortfallMinutes = Math.max(0, goal.weeklyMinutes - progress.weekMinutes);
      const suggestedMinutes = Math.min(
        Math.max(30, shortfallMinutes, Math.ceil((goal.targetBpm - progress.currentBpm) / 2) * 10),
        120
      );
      const existingTask = planTasks.find(t => t.piece === goal.piece && !t.completed);
      suggestions.push({
        goalId: goal.id,
        piece: goal.piece,
        targetBpm: goal.targetBpm,
        currentBpm: progress.currentBpm,
        reasons: reasons,
        suggestedMinutes: suggestedMinutes,
        alreadyInPlan: !!existingTask
      });
    }
  });

  return suggestions.sort((a, b) => {
    if (a.alreadyInPlan !== b.alreadyInPlan) return a.alreadyInPlan ? 1 : -1;
    const progressA = calculateGoalProgress(goals.find(g => g.id === a.goalId));
    const progressB = calculateGoalProgress(goals.find(g => g.id === b.goalId));
    if (progressA.isOverdue !== progressB.isOverdue) return progressA.isOverdue ? -1 : 1;
    return progressA.daysRemaining - progressB.daysRemaining;
  });
}

function addSuggestionToPlan(suggestion) {
  const libItem = LibraryManager.getByName(suggestion.piece);
  let sections = [];
  if (libItem && libItem.defaultSections && libItem.defaultSections.length) {
    sections = libItem.defaultSections.map(s => ({
      id: crypto.randomUUID(),
      name: s.name,
      bpm: Number(suggestion.targetBpm),
      mistakes: 0,
      mastery: 3,
      note: s.note || ''
    }));
  }
  const task = {
    id: crypto.randomUUID(),
    piece: suggestion.piece,
    targetBpm: Number(suggestion.targetBpm),
    estimatedMinutes: Number(suggestion.suggestedMinutes),
    completed: false,
    date: getToday(),
    sections: sections,
    fromSuggestion: true
  };
  planTasks.push(task);
  savePlan(planTasks);
  render();
}

function renderPlan() {
  const listEl = document.querySelector('#planList');
  const suggestionEl = document.querySelector('#planSuggestions');
  const suggestions = generateGoalSuggestions();

  if (suggestions.length > 0 && suggestionEl) {
    suggestionEl.style.display = 'block';
    suggestionEl.innerHTML = `
      <div class="suggestionTitle">🎯 目标补练建议</div>
      <div class="suggestionList">
        ${suggestions.map((s) => `
          <div class="suggestionCard ${s.alreadyInPlan ? 'in-plan' : ''}">
            <div class="suggestionCardHead">
              <strong>${escapeHtml(s.piece)}</strong>
              <span class="suggestionBpm">当前 ${s.currentBpm} → 目标 ${s.targetBpm} BPM</span>
            </div>
            <div class="suggestionReasons">
              ${s.reasons.map(r => `<span class="suggestionReason">⚠ ${escapeHtml(r)}</span>`).join('')}
            </div>
            <div class="suggestionAction">
              <span class="suggestionMinutes">建议练习 ${s.suggestedMinutes} 分钟</span>
              ${s.alreadyInPlan
                ? '<span class="inPlanBadge">已在计划中</span>'
                : `<button class="primary small addSuggestionBtn" data-suggestion="${s.goalId}">➕ 添加到今日计划</button>`
              }
            </div>
          </div>
        `).join('')}
      </div>
    `;
    suggestionEl.querySelectorAll('[data-suggestion]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const goalId = btn.dataset.suggestion;
        const suggestion = suggestions.find(s => s.goalId === goalId);
        if (suggestion) addSuggestionToPlan(suggestion);
      });
    });
  } else if (suggestionEl) {
    suggestionEl.style.display = 'none';
    suggestionEl.innerHTML = '';
  }

  if (!planTasks.length) {
    listEl.innerHTML = '<p class="empty">暂无今日练习计划，点击上方添加任务</p><p class="emptyHint">💡 点击任务可快速生成练习记录</p>';
    return;
  }
  listEl.innerHTML = planTasks.map((task) => `
    <div class="planTask ${task.completed ? 'completed' : ''}" data-id="${task.id}">
      <label class="taskCheck">
        <input type="checkbox" ${task.completed ? 'checked' : ''} data-toggle="${task.id}" />
        <span class="checkmark"></span>
      </label>
      <div class="taskContent clickable" data-plan-record="${task.id}" title="点击生成练习记录">
        <div class="taskPiece">
          ${escapeHtml(task.piece)}
          <span class="taskRecordHint">📝 生成记录</span>
        </div>
        <div class="taskMeta">
          <span>目标 BPM: <strong>${task.targetBpm}</strong></span>
          <span>预计: <strong>${task.estimatedMinutes}min</strong></span>
        </div>
        ${task.sections && task.sections.length ? `
        <div class="taskSections">
          ${task.sections.map(s => `<span class="taskSectionTag">${escapeHtml(s.name)}</span>`).join('')}
        </div>
        ` : ''}
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
  document.querySelectorAll('[data-plan-record]').forEach((content) => content.addEventListener('click', () => {
    const taskId = content.dataset.planRecord;
    const task = planTasks.find((t) => t.id === taskId);
    if (task) {
      createRecordFromPlan(task);
    }
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
            ${goal.sections && goal.sections.length ? `
            <div class="taskSections">
              ${goal.sections.map(s => `<span class="taskSectionTag">${escapeHtml(s.name)}</span>`).join('')}
            </div>
            ` : ''}
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
          ${progress.isAchieved ? `<button class="goalUnachieve" data-goal-unachieve="${goal.id}">撤销达成</button>` : `<button class="goalAchieve" data-goal-achieve="${goal.id}">标记达成</button>`}
          <button class="goalDel" data-goal-del="${goal.id}" aria-label="删除">删除</button>
        </div>
      </div>
    `;
  }).join('');
  document.querySelectorAll('[data-goal-achieve]').forEach((button) => button.addEventListener('click', () => {
    const goalId = button.dataset.goalAchieve;
    goals = goals.map((g) => g.id === goalId ? { ...g, achieved: true, achievedAt: getToday(), autoAchieved: false } : g);
    saveGoals(goals);
    render();
  }));
  document.querySelectorAll('[data-goal-unachieve]').forEach((button) => button.addEventListener('click', async () => {
    const goalId = button.dataset.goalUnachieve;
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    const confirmed = await showConfirm('撤销达成', `确定要撤销「${goal.piece}」的达成状态吗？`);
    if (!confirmed) return;
    goals = goals.map((g) => g.id === goalId ? { ...g, achieved: false, achievedAt: null, autoAchieved: false } : g);
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

const SuggestionEngine = (() => {
  const MIN_RECORDS_FOR_TREND = 3;
  const LONG_ABSENCE_DAYS = 14;
  const MISTAKE_SPIKE_RATIO = 1.8;
  const BPM_BOOST_STABLE_RATIO = 0.7;

  function daysBetween(dateStr1, dateStr2) {
    const d1 = new Date(dateStr1);
    const d2 = new Date(dateStr2);
    return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
  }

  function getDaysSinceLastPractice(lastDateStr) {
    return daysBetween(lastDateStr, getToday());
  }

  function classifyPieceType(pieceName) {
    const lower = pieceName.toLowerCase();
    if (/(bossa|samba|latino)/.test(lower)) return { type: '拉丁爵士', color: '#f59e0b', icon: '🌴' };
    if (/(blues|蓝调)/.test(lower)) return { type: '布鲁斯', color: '#7c3aed', icon: '🎸' };
    if (/(ballad|慢歌|抒情)/.test(lower)) return { type: '抒情慢歌', color: '#ec4899', icon: '💝' };
    if (/(rock|摇滚|metal|金属)/.test(lower)) return { type: '摇滚/金属', color: '#dc2626', icon: '🔥' };
    if (/(classical|古典|bach|mozart|beethoven)/.test(lower)) return { type: '古典音乐', color: '#0891b2', icon: '🎻' };
    if (/(pop|流行)/.test(lower)) return { type: '流行音乐', color: '#06b6d4', icon: '🎤' };
    if (/(jazz|爵士|autumn|blue|standard)/.test(lower)) return { type: '标准爵士', color: '#8b5cf6', icon: '🎷' };
    return { type: '通用练习曲', color: '#6366f1', icon: '🎵' };
  }

  function analyzeBpmTrend(sortedRecords) {
    if (sortedRecords.length < MIN_RECORDS_FOR_TREND) return { trend: 'insufficient', slope: 0 };
    const bpms = sortedRecords.map(r => r.bpm);
    const totalDelta = bpms[bpms.length - 1] - bpms[0];
    const avgInterval = daysBetween(sortedRecords[0].date, sortedRecords[sortedRecords.length - 1].date) / (sortedRecords.length - 1);
    const slope = avgInterval > 0 ? totalDelta / avgInterval : 0;
    const consecutiveRises = bpms.slice(1).filter((b, i) => b >= bpms[i]).length;
    if (consecutiveRises >= bpms.length - 1 && totalDelta > 0) return { trend: 'rising', slope, totalDelta };
    if (totalDelta < 0) return { trend: 'falling', slope, totalDelta };
    return { trend: 'stable', slope, totalDelta };
  }

  function analyzeMistakeTrend(sortedRecords) {
    if (sortedRecords.length < MIN_RECORDS_FOR_TREND) return { trend: 'insufficient', spike: false };
    const mistakes = sortedRecords.map(r => r.mistakes);
    const totalDelta = mistakes[mistakes.length - 1] - mistakes[0];
    const avgPrev = mistakes.slice(0, -1).reduce((a, b) => a + b, 0) / Math.max(1, mistakes.length - 1);
    const lastMistakes = mistakes[mistakes.length - 1];
    const spike = avgPrev > 0 && lastMistakes >= avgPrev * MISTAKE_SPIKE_RATIO && mistakes.length >= 2;
    if (spike) return { trend: 'spiking', totalDelta, spike, spikeRatio: (lastMistakes / avgPrev).toFixed(1) };
    if (totalDelta < -2) return { trend: 'improving', totalDelta, spike };
    if (totalDelta > 2) return { trend: 'worsening', totalDelta, spike };
    return { trend: 'stable', totalDelta, spike };
  }

  function shouldSpeedUp(track, bpmAnalysis, mistakeAnalysis) {
    if (track.records.length < MIN_RECORDS_FOR_TREND) return null;
    const recentRecords = track.records.slice(-3);
    const bpmRising = bpmAnalysis.trend === 'rising';
    const mistakesControlled = mistakeAnalysis.trend === 'improving' || mistakeAnalysis.trend === 'stable';
    const latestBpm = track.records[track.records.length - 1].bpm;
    const avgMistakesRecent = recentRecords.reduce((s, r) => s + r.mistakes, 0) / recentRecords.length;
    if (bpmRising && mistakesControlled && avgMistakesRecent <= Math.max(5, track.records[0].mistakes * BPM_BOOST_STABLE_RATIO + 10)) {
      const suggestBpm = Math.min(latestBpm + Math.max(2, Math.round(bpmAnalysis.totalDelta / (track.records.length - 1) || 2)), Math.round(latestBpm * 1.08));
      return {
        type: 'speedup',
        title: '继续提速',
        icon: '🚀',
        color: '#059669',
        piece: track.piece,
        instrument: track.instrument,
        pieceType: classifyPieceType(track.piece),
        reason: `最近 ${track.records.length} 次练习中，BPM 从 ${track.records[0].bpm} 提升至 ${latestBpm}，错误次数${mistakeAnalysis.trend === 'improving' ? '持续下降' : '控制良好'}，表现稳定。`,
        suggestion: `建议下次练习尝试 BPM ${suggestBpm}（当前最高 ${track.maxBpm}），巩固速度后再继续上调。`,
        metrics: {
          bpmFrom: track.records[0].bpm,
          bpmTo: latestBpm,
          bpmGain: latestBpm - track.records[0].bpm,
          suggestedBpm: suggestBpm
        },
        priority: 1
      };
    }
    return null;
  }

  function shouldSlowDown(track, bpmAnalysis, mistakeAnalysis) {
    if (track.records.length < MIN_RECORDS_FOR_TREND) return null;
    const latest = track.records[track.records.length - 1];
    const prev = track.records.slice(0, -1);
    const avgBpmPrev = prev.reduce((s, r) => s + r.bpm, 0) / Math.max(1, prev.length);
    const avgMistakesPrev = prev.reduce((s, r) => s + r.mistakes, 0) / Math.max(1, prev.length);
    const bpmJumped = latest.bpm > avgBpmPrev * 1.06;
    const mistakesSurge = latest.mistakes > avgMistakesPrev * 1.6;
    if ((bpmAnalysis.trend === 'rising' && mistakeAnalysis.trend === 'worsening') || (bpmJumped && mistakesSurge)) {
      const conservativeBpm = Math.round(avgBpmPrev * 0.95);
      return {
        type: 'slowdown',
        title: '降低速度巩固',
        icon: '🧘',
        color: '#d97706',
        piece: track.piece,
        instrument: track.instrument,
        pieceType: classifyPieceType(track.piece),
        reason: `BPM 从 ${Math.round(avgBpmPrev)} 快速提升至 ${latest.bpm}，但错误次数从平均 ${Math.round(avgMistakesPrev)} 次升高到 ${latest.mistakes} 次，基础还不够扎实。`,
        suggestion: `建议降回 BPM ${conservativeBpm} 反复打磨 2-3 次，确保错误次数回到 ${Math.round(avgMistakesPrev)} 以下后再逐步提速。`,
        metrics: {
          currentBpm: latest.bpm,
          safeBpm: conservativeBpm,
          mistakeDelta: latest.mistakes - Math.round(avgMistakesPrev)
        },
        priority: 2
      };
    }
    return null;
  }

  function shouldCatchUp(track) {
    const daysSince = getDaysSinceLastPractice(track.lastDate);
    if (daysSince >= LONG_ABSENCE_DAYS) {
      const latest = track.records[track.records.length - 1];
      const warmupBpm = Math.max(Math.round(track.maxBpm * 0.75), latest.bpm - 15);
      return {
        type: 'catchup',
        title: '补练长期未碰曲目',
        icon: '📖',
        color: '#2563eb',
        piece: track.piece,
        instrument: track.instrument,
        pieceType: classifyPieceType(track.piece),
        reason: `距离上次练习已经过去 ${daysSince} 天（${track.lastDate}），肌肉记忆可能已经生疏，最高曾达到 ${track.maxBpm} BPM。`,
        suggestion: `先以 BPM ${warmupBpm} 热身 15-20 分钟唤醒记忆，再逐步恢复到日常水平。建议优先安排在本周前半周练习。`,
        metrics: {
          daysSince,
          lastBpm: latest.bpm,
          maxBpm: track.maxBpm,
          warmupBpm
        },
        priority: daysSince >= 21 ? 0 : 3
      };
    }
    return null;
  }

  function hasMistakeSpike(track, mistakeAnalysis) {
    if (mistakeAnalysis.spike) {
      const latest = track.records[track.records.length - 1];
      const prevRecords = track.records.slice(0, -1);
      const avgMistakesPrev = prevRecords.reduce((s, r) => s + r.mistakes, 0) / Math.max(1, prevRecords.length);
      const suggestedBpm = Math.max(latest.bpm - 10, Math.round(latest.bpm * 0.9));
      return {
        type: 'spike',
        title: '错误次数异常升高',
        icon: '⚠️',
        color: '#dc2626',
        piece: track.piece,
        instrument: track.instrument,
        pieceType: classifyPieceType(track.piece),
        reason: `最近一次练习（${latest.date}）错误 ${latest.mistakes} 次，是之前均值 ${Math.round(avgMistakesPrev)} 次的 ${mistakeAnalysis.spikeRatio} 倍。`,
        suggestion: `将 BPM 调至 ${suggestedBpm} 慢速精读，重点复盘出错段落。可拆分片段慢练，待错误回落至 ${Math.round(avgMistakesPrev * 1.2)} 以下再恢复原速。`,
        metrics: {
          latestMistakes: latest.mistakes,
          avgPrev: Math.round(avgMistakesPrev),
          spikeRatio: mistakeAnalysis.spikeRatio,
          suggestedBpm
        },
        priority: 0
      };
    }
    return null;
  }

  function generateInsufficientDataNote(trackStats) {
    const newTracks = trackStats.filter(t => t.records.length < MIN_RECORDS_FOR_TREND);
    if (newTracks.length === 0) return null;
    return {
      type: 'conservative',
      title: '数据不足，保守提示',
      icon: '💡',
      color: '#6b7280',
      summary: newTracks.length === 1
        ? `「${newTracks[0].piece}」仅有 ${newTracks[0].records.length} 条记录`
        : `有 ${newTracks.length} 首曲目记录不足（${MIN_RECORDS_FOR_TREND} 条以下）`,
      tracks: newTracks.map(t => ({
        piece: t.piece,
        instrument: t.instrument,
        recordCount: t.records.length,
        lastDate: t.lastDate,
        pieceType: classifyPieceType(t.piece)
      })),
      advice: `建议每首曲目积累至少 ${MIN_RECORDS_FOR_TREND} 次不同日期的练习后，系统才能可靠地分析趋势。现阶段请结合自我感受调整练习节奏，不要过度依赖单次练习的结果。`,
      priority: 99
    };
  }

  function generateSuggestions() {
    const trackStats = getTrackStats();
    const allSuggestions = [];

    if (records.length === 0) {
      return {
        overall: {
          type: 'empty',
          title: '暂无练习数据',
          icon: '🎯',
          color: '#6b7280',
          message: '添加第一条练习记录后，系统将自动为你生成智能练习建议。'
        },
        suggestions: [],
        conservative: null
      };
    }

    trackStats.forEach((track) => {
      const bpmAnalysis = analyzeBpmTrend(track.records);
      const mistakeAnalysis = analyzeMistakeTrend(track.records);
      const analyses = [
        hasMistakeSpike(track, mistakeAnalysis),
        shouldSlowDown(track, bpmAnalysis, mistakeAnalysis),
        shouldSpeedUp(track, bpmAnalysis, mistakeAnalysis),
        shouldCatchUp(track)
      ].filter(Boolean);
      allSuggestions.push(...analyses);
    });

    allSuggestions.sort((a, b) => a.priority - b.priority);
    const conservative = generateInsufficientDataNote(trackStats);

    const totalMinutes = records.reduce((s, r) => s + r.minutes, 0);
    const activePieces = trackStats.length;
    const avgDaysBetween = trackStats.length
      ? Math.round(trackStats.reduce((s, t) => {
          const d = getDaysSinceLastPractice(t.lastDate);
          return s + (d <= LONG_ABSENCE_DAYS ? d : 0);
        }, 0) / Math.max(1, trackStats.filter(t => getDaysSinceLastPractice(t.lastDate) <= LONG_ABSENCE_DAYS).length))
      : 0;

    return {
      overall: {
        totalRecords: records.length,
        totalMinutes,
        activePieces,
        avgDaysBetween
      },
      suggestions: allSuggestions,
      conservative
    };
  }

  return { generateSuggestions, classifyPieceType };
})();

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

const ReportManager = (() => {
  function getMonthRange(date = new Date()) {
    const d = new Date(date);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getDateRange(rangeType) {
    const today = new Date();
    if (rangeType === 'week') {
      return getWeekRange(today);
    }
    return getMonthRange(today);
  }

  function getRecordsInRange(recordsList, rangeType) {
    const { start, end } = getDateRange(rangeType);
    const startStr = formatDateKey(start);
    const endStr = formatDateKey(end);
    return recordsList.filter(r => r.date >= startStr && r.date <= endStr);
  }

  function getPrevRange(rangeType) {
    const today = new Date();
    if (rangeType === 'week') {
      const prevWeek = new Date(today);
      prevWeek.setDate(prevWeek.getDate() - 7);
      return getWeekRange(prevWeek);
    }
    const prevMonth = new Date(today);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    return getMonthRange(prevMonth);
  }

  function calcTotalMinutes(recordsList) {
    return recordsList.reduce((sum, r) => sum + r.minutes, 0);
  }

  function calcUniquePieces(recordsList) {
    return [...new Set(recordsList.map(r => r.piece))].length;
  }

  function calcBpmStats(recordsList, rangeType) {
    if (!recordsList.length) return { avg: 0, gain: 0, max: 0, min: 0 };
    const sorted = [...recordsList].sort((a, b) => a.date.localeCompare(b.date));
    const bpms = sorted.map(r => r.bpm);
    const avgVal = Math.round(avg(bpms));
    const max = Math.max(...bpms);
    const min = Math.min(...bpms);
    const gain = bpms.length >= 2 ? bpms[bpms.length - 1] - bpms[0] : 0;
    return { avg: avgVal, gain, max, min };
  }

  function calcMistakesStats(recordsList) {
    if (!recordsList.length) return { total: 0, avg: 0, trend: 0 };
    const sorted = [...recordsList].sort((a, b) => a.date.localeCompare(b.date));
    const mistakes = sorted.map(r => r.mistakes);
    const total = mistakes.reduce((sum, m) => sum + m, 0);
    const avgVal = Math.round(avg(mistakes));
    const trend = mistakes.length >= 2 ? mistakes[mistakes.length - 1] - mistakes[0] : 0;
    return { total, avg: avgVal, trend };
  }

  function getOverdueGoals(goalsList, recordsList) {
    return goalsList.filter(g => {
      if (g.achieved) return false;
      const progress = calculateGoalProgress(g);
      return progress.isOverdue;
    }).map(g => ({
      ...g,
      progress: calculateGoalProgress(g),
      pieceType: SuggestionEngine.classifyPieceType(g.piece)
    }));
  }

  function getRecommendedSections(recordsList, topN = 5) {
    const allSections = [];
    recordsList.forEach(record => {
      const sections = getSections(record);
      sections.forEach(s => {
        allSections.push({
          ...s,
          date: record.date,
          piece: record.piece,
          instrument: record.instrument
        });
      });
    });

    if (!allSections.length) return [];

    const sectionMap = new Map();
    allSections.forEach(s => {
      const key = `${s.piece}||${s.name}`;
      if (!sectionMap.has(key)) {
        sectionMap.set(key, {
          piece: s.piece,
          name: s.name,
          instrument: s.instrument,
          records: [],
          bpmHistory: [],
          mistakesHistory: [],
          masteryHistory: []
        });
      }
      const stat = sectionMap.get(key);
      stat.records.push(s);
      stat.bpmHistory.push({ date: s.date, value: s.bpm });
      stat.mistakesHistory.push({ date: s.date, value: s.mistakes });
      stat.masteryHistory.push({ date: s.date, value: s.mastery });
    });

    return [...sectionMap.values()].map(stat => {
      const sortedBpm = stat.bpmHistory.sort((a, b) => a.date.localeCompare(b.date));
      const sortedMistakes = stat.mistakesHistory.sort((a, b) => a.date.localeCompare(b.date));
      const sortedMastery = stat.masteryHistory.sort((a, b) => a.date.localeCompare(b.date));
      const latestBpm = sortedBpm.length ? sortedBpm[sortedBpm.length - 1].value : 0;
      const latestMistakes = sortedMistakes.length ? sortedMistakes[sortedMistakes.length - 1].value : 0;
      const latestMastery = sortedMastery.length ? sortedMastery[sortedMastery.length - 1].value : 0;
      const bpmGain = sortedBpm.length >= 2 ? sortedBpm[sortedBpm.length - 1].value - sortedBpm[0].value : 0;
      const mistakeTrend = sortedMistakes.length >= 2 ? sortedMistakes[sortedMistakes.length - 1].value - sortedMistakes[0].value : 0;

      let priorityScore = 0;
      if (latestMastery <= 2) priorityScore += 3;
      else if (latestMastery === 3) priorityScore += 1;
      if (mistakeTrend > 0) priorityScore += 2;
      if (latestMistakes >= 5) priorityScore += 2;
      if (bpmGain >= 0) priorityScore += 1;
      priorityScore += stat.records.length * 0.3;

      return {
        ...stat,
        latestBpm,
        latestMistakes,
        latestMastery,
        bpmGain,
        mistakeTrend,
        priorityScore,
        practiceCount: stat.records.length
      };
    }).sort((a, b) => b.priorityScore - a.priorityScore).slice(0, topN);
  }

  function getPlanCompletion(rangeType) {
    const planData = JSON.parse(localStorage.getItem(planKey) || 'null') || {};
    const { start, end } = getDateRange(rangeType);
    const startStr = formatDateKey(start);
    const endStr = formatDateKey(end);

    let totalTasks = 0;
    let completedTasks = 0;
    let totalEstimatedMinutes = 0;
    const dailyStats = [];

    Object.entries(planData).forEach(([date, tasks]) => {
      if (date >= startStr && date <= endStr && Array.isArray(tasks)) {
        const dayTotal = tasks.length;
        const dayCompleted = tasks.filter(t => t.completed).length;
        const dayMinutes = tasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);
        totalTasks += dayTotal;
        completedTasks += dayCompleted;
        totalEstimatedMinutes += dayMinutes;
        dailyStats.push({ date, total: dayTotal, completed: dayCompleted, minutes: dayMinutes });
      }
    });

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return { totalTasks, completedTasks, completionRate, totalEstimatedMinutes, dailyStats };
  }

  function getGoalsProgress(goalsList, recordsList, rangeType) {
    return goalsList.map(g => ({
      ...g,
      progress: calculateGoalProgress(g),
      pieceType: SuggestionEngine.classifyPieceType(g.piece)
    }));
  }

  function getTrackArchiveInRange(recordsList, rangeType) {
    const trackStats = getTrackStats();
    const pieceSet = new Set(recordsList.map(r => r.piece));
    return trackStats.filter(t => pieceSet.has(t.piece));
  }

  function generateReport(rangeType) {
    const recordsInRange = getRecordsInRange(records, rangeType);
    const { start, end } = getDateRange(rangeType);
    const prevRange = getPrevRange(rangeType);
    const prevStartStr = formatDateKey(prevRange.start);
    const prevEndStr = formatDateKey(prevRange.end);
    const prevRecords = records.filter(r => r.date >= prevStartStr && r.date <= prevEndStr);

    const totalMinutes = calcTotalMinutes(recordsInRange);
    const prevMinutes = calcTotalMinutes(prevRecords);
    const minutesChange = totalMinutes - prevMinutes;

    const pieceCount = calcUniquePieces(recordsInRange);
    const prevPieceCount = calcUniquePieces(prevRecords);
    const pieceChange = pieceCount - prevPieceCount;

    const bpmStats = calcBpmStats(recordsInRange, rangeType);
    const mistakesStats = calcMistakesStats(recordsInRange);

    const overdueGoals = getOverdueGoals(goals, records);
    const recommendedSections = getRecommendedSections(recordsInRange);
    const planCompletion = getPlanCompletion(rangeType);
    const goalsProgress = getGoalsProgress(goals, records, rangeType);
    const trackArchive = getTrackArchiveInRange(recordsInRange, rangeType);

    const rangeLabel = rangeType === 'week'
      ? `${formatDateKey(start)} ~ ${formatDateKey(end)}`
      : `${start.getFullYear()}年${start.getMonth() + 1}月`;

    return {
      rangeType,
      rangeLabel,
      startDate: formatDateKey(start),
      endDate: formatDateKey(end),
      generatedAt: new Date().toISOString(),
      summary: {
        totalMinutes,
        prevMinutes,
        minutesChange,
        pieceCount,
        prevPieceCount,
        pieceChange,
        bpmStats,
        mistakesStats,
        recordCount: recordsInRange.length,
        activeDays: new Set(recordsInRange.map(r => r.date)).size
      },
      planCompletion,
      goalsProgress,
      overdueGoals,
      recommendedSections,
      trackArchive,
      dailyRecords: groupDay(recordsInRange, 'minutes')
    };
  }

  function buildExportHtml(report) {
    const { rangeType, rangeLabel, summary, planCompletion, overdueGoals, recommendedSections, goalsProgress, trackArchive, generatedAt } = report;
    const typeLabel = rangeType === 'week' ? '周报' : '月报';

    const minutesChangeColor = summary.minutesChange >= 0 ? '#059669' : '#dc2626';
    const minutesChangeText = summary.minutesChange >= 0 ? `+${summary.minutesChange}` : summary.minutesChange;
    const pieceChangeColor = summary.pieceChange >= 0 ? '#059669' : '#dc2626';
    const pieceChangeText = summary.pieceChange >= 0 ? `+${summary.pieceChange}` : summary.pieceChange;
    const bpmGainColor = summary.bpmStats.gain >= 0 ? '#059669' : '#dc2626';
    const bpmGainText = summary.bpmStats.gain >= 0 ? `+${summary.bpmStats.gain}` : summary.bpmStats.gain;
    const mistakeTrendColor = summary.mistakesStats.trend <= 0 ? '#059669' : '#dc2626';
    const mistakeTrendText = summary.mistakesStats.trend <= 0 ? (summary.mistakesStats.trend === 0 ? '0' : `${summary.mistakesStats.trend}`) : `+${summary.mistakesStats.trend}`;

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>音乐练习${typeLabel} - ${rangeLabel}</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 40px;
    font-family: Inter, "PingFang SC", "Microsoft YaHei", sans-serif;
    background: #eef4f1;
    color: #172522;
  }
  .report-container {
    max-width: 900px;
    margin: 0 auto;
    background: white;
    border-radius: 16px;
    box-shadow: 0 12px 40px rgba(23, 61, 55, 0.1);
    overflow: hidden;
  }
  .report-header {
    padding: 32px 40px;
    background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%);
    color: white;
  }
  .report-header h1 { margin: 0 0 8px 0; font-size: 28px; }
  .report-header .subtitle { opacity: 0.9; font-size: 14px; }
  .report-header .meta { margin-top: 12px; font-size: 12px; opacity: 0.8; }
  .report-body { padding: 32px 40px; }
  .section { margin-bottom: 28px; }
  .section-title {
    font-size: 18px;
    font-weight: 700;
    color: #172522;
    margin: 0 0 16px 0;
    padding-bottom: 8px;
    border-bottom: 2px solid #e4efec;
  }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
  .stat-card {
    background: #fbfefc;
    border: 1px solid #e4efec;
    border-radius: 10px;
    padding: 16px;
  }
  .stat-label { font-size: 12px; color: #60736f; font-weight: 500; }
  .stat-value { font-size: 28px; font-weight: 700; color: #172522; margin-top: 4px; }
  .stat-change { font-size: 13px; font-weight: 600; margin-top: 4px; }
  .plan-bar {
    height: 10px;
    background: #e4efec;
    border-radius: 5px;
    overflow: hidden;
    margin-top: 8px;
  }
  .plan-fill {
    height: 100%;
    background: linear-gradient(90deg, #0f766e, #14b8a6);
    border-radius: 5px;
  }
  .list-group { display: grid; gap: 10px; }
  .list-item {
    background: #fbfefc;
    border: 1px solid #e4efec;
    border-radius: 8px;
    padding: 14px 16px;
  }
  .item-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 6px;
  }
  .item-title { font-weight: 600; color: #172522; font-size: 15px; }
  .item-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    color: white;
  }
  .item-meta {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    color: #60736f;
    font-size: 13px;
  }
  .item-meta strong { color: #172522; font-weight: 600; }
  .empty-tip {
    text-align: center;
    padding: 20px;
    color: #60736f;
    background: #f6faf8;
    border-radius: 8px;
    font-size: 13px;
  }
  .overdue { background: #fef2f2; border-color: #fca5a5; }
  .overdue .item-title { color: #991b1b; }
  .goals-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .goal-card {
    background: #fbfefc;
    border: 1px solid #e4efec;
    border-radius: 8px;
    padding: 14px;
  }
  .goal-card.overdue { background: #fef2f2; border-color: #fca5a5; }
  .goal-card.achieved { background: #f0fdf4; border-color: #86efac; }
  .progress-bar {
    height: 6px;
    background: #e4efec;
    border-radius: 3px;
    overflow: hidden;
    margin-top: 4px;
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #0f766e, #14b8a6);
    border-radius: 3px;
  }
  @media print {
    body { background: white; padding: 0; }
    .report-container { box-shadow: none; border-radius: 0; }
  }
  @media (max-width: 700px) {
    body { padding: 16px; }
    .report-header, .report-body { padding: 20px; }
    .stats-grid, .goals-grid { grid-template-columns: 1fr 1fr; }
  }
</style>
</head>
<body>
<div class="report-container">
  <div class="report-header">
    <h1>🎵 音乐练习${typeLabel}</h1>
    <div class="subtitle">${rangeLabel}</div>
    <div class="meta">生成时间：${new Date(generatedAt).toLocaleString('zh-CN')}</div>
  </div>
  <div class="report-body">
    <div class="section">
      <h2 class="section-title">📊 核心数据</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">总练习时长</div>
          <div class="stat-value">${summary.totalMinutes}<span style="font-size:14px;font-weight:500;color:#60736f;">min</span></div>
          <div class="stat-change" style="color:${minutesChangeColor};">${minutesChangeText} min vs 上${rangeType === 'week' ? '周' : '月'}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">曲目覆盖数</div>
          <div class="stat-value">${summary.pieceCount}<span style="font-size:14px;font-weight:500;color:#60736f;">首</span></div>
          <div class="stat-change" style="color:${pieceChangeColor};">${pieceChangeText} 首 vs 上${rangeType === 'week' ? '周' : '月'}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">平均 BPM</div>
          <div class="stat-value">${summary.bpmStats.avg}</div>
          <div class="stat-change" style="color:${bpmGainColor};">${bpmGainText} BPM 提升</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">错误次数趋势</div>
          <div class="stat-value">${summary.mistakesStats.avg}<span style="font-size:14px;font-weight:500;color:#60736f;">次/次</span></div>
          <div class="stat-change" style="color:${mistakeTrendColor};">${mistakeTrendText} 次变化</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px;">
        <div class="stat-card">
          <div class="stat-label">练习天数</div>
          <div class="stat-value">${summary.activeDays}<span style="font-size:14px;font-weight:500;color:#60736f;">天</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">练习记录数</div>
          <div class="stat-value">${summary.recordCount}<span style="font-size:14px;font-weight:500;color:#60736f;">条</span></div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">✅ 计划完成情况</h2>
      <div class="list-item">
        <div class="item-head">
          <div>
            <div class="item-title">任务完成率</div>
            <div class="item-meta">
              <span>已完成: <strong>${planCompletion.completedTasks}</strong> / ${planCompletion.totalTasks} 个任务</span>
              <span>预计总时长: <strong>${planCompletion.totalEstimatedMinutes}min</strong></span>
            </div>
          </div>
          <div style="font-size:24px;font-weight:700;color:#0f766e;">${planCompletion.completionRate}%</div>
        </div>
        <div class="plan-bar"><div class="plan-fill" style="width:${planCompletion.completionRate}%;"></div></div>
      </div>
      ${planCompletion.dailyStats.length ? `
      <div style="margin-top:12px;">
        <div style="font-size:13px;color:#60736f;margin-bottom:8px;">每日任务统计：</div>
        <div class="list-group">
          ${planCompletion.dailyStats.map(d => `
          <div class="list-item" style="padding:10px 14px;">
            <div class="item-head">
              <div class="item-title" style="font-size:14px;">${d.date}</div>
              <div class="item-meta">
                <span>完成: <strong>${d.completed}/${d.total}</strong></span>
                <span>预计: <strong>${d.minutes}min</strong></span>
              </div>
            </div>
          </div>
          `).join('')}
        </div>
      </div>
      ` : '<div class="empty-tip">本期暂无计划任务</div>'}
    </div>

    <div class="section">
      <h2 class="section-title">🎯 目标进度</h2>
      ${goalsProgress.length ? `
      <div class="goals-grid">
        ${goalsProgress.map(g => {
          const isOverdue = g.progress.isOverdue && !g.progress.isAchieved;
          const isAchieved = g.progress.isAchieved || g.achieved;
          return `
          <div class="goal-card ${isOverdue ? 'overdue' : ''} ${isAchieved ? 'achieved' : ''}">
            <div class="item-head">
              <div class="item-title">${g.piece}</div>
              <span class="item-tag" style="background:${g.pieceType.color};">${g.pieceType.icon} ${g.pieceType.type}</span>
            </div>
            <div class="item-meta" style="margin-bottom:8px;">
              <span>目标: <strong>${g.targetBpm} BPM</strong></span>
              <span>当前: <strong>${g.progress.currentBpm} BPM</strong></span>
              <span>截止: <strong>${g.targetDate}</strong></span>
            </div>
            <div style="font-size:12px;color:#60736f;">BPM 进度: ${g.progress.bpmProgress}%</div>
            <div class="progress-bar"><div class="progress-fill" style="width:${g.progress.bpmProgress}%;"></div></div>
            <div style="font-size:12px;color:#60736f;margin-top:6px;">本周练习: ${g.progress.weekMinutes}/${g.weeklyMinutes}min (${g.progress.weeklyProgress}%)</div>
            <div class="progress-bar"><div class="progress-fill" style="width:${g.progress.weeklyProgress}%;background:linear-gradient(90deg,#d97706,#f59e0b);"></div></div>
            ${isOverdue ? `<div style="margin-top:8px;font-size:12px;color:#991b1b;font-weight:600;">⚠ 已逾期 ${Math.abs(g.progress.daysRemaining)} 天</div>` : ''}
            ${isAchieved ? `<div style="margin-top:8px;font-size:12px;color:#059669;font-weight:600;">✓ 已达成</div>` : ''}
          </div>
          `;
        }).join('')}
      </div>
      ` : '<div class="empty-tip">暂无练习目标</div>'}
    </div>

    ${overdueGoals.length ? `
    <div class="section">
      <h2 class="section-title" style="color:#991b1b;">⚠ 逾期目标</h2>
      <div class="list-group">
        ${overdueGoals.map(g => `
        <div class="list-item overdue">
          <div class="item-head">
            <div class="item-title">${g.piece}</div>
            <span class="item-tag" style="background:#dc2626;">逾期 ${Math.abs(g.progress.daysRemaining)} 天</span>
          </div>
          <div class="item-meta">
            <span>目标: <strong>${g.targetBpm} BPM</strong></span>
            <span>当前: <strong>${g.progress.currentBpm} BPM</strong></span>
            <span>截止日期: <strong>${g.targetDate}</strong></span>
          </div>
        </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <div class="section">
      <h2 class="section-title">🔥 最值得继续练的片段</h2>
      ${recommendedSections.length ? `
      <div class="list-group">
        ${recommendedSections.map(s => {
          const masteryColor = getMasteryColor(s.latestMastery);
          return `
          <div class="list-item">
            <div class="item-head">
              <div>
                <div class="item-title">${s.piece} - ${s.name}</div>
                <div class="item-meta">
                  <span>乐器: <strong>${s.instrument}</strong></span>
                  <span>练习次数: <strong>${s.practiceCount}</strong></span>
                </div>
              </div>
              <span class="item-tag" style="background:${masteryColor};">${getMasteryLabel(s.latestMastery)}</span>
            </div>
            <div class="item-meta" style="margin-top:8px;">
              <span>当前 BPM: <strong>${s.latestBpm}</strong> <span style="color:${s.bpmGain >= 0 ? '#059669' : '#dc2626'};">(${s.bpmGain >= 0 ? '+' : ''}${s.bpmGain})</span></span>
              <span>错误次数: <strong>${s.latestMistakes}</strong> <span style="color:${s.mistakeTrend <= 0 ? '#059669' : '#dc2626'};">(${s.mistakeTrend <= 0 ? (s.mistakeTrend === 0 ? '0' : s.mistakeTrend) : '+' + s.mistakeTrend})</span></span>
              <span>掌握: <strong>${s.latestMastery}/5</strong></span>
            </div>
          </div>
          `;
        }).join('')}
      </div>
      ` : '<div class="empty-tip">本期暂无分段练习数据，添加练习记录时可拆分片段进行精细化复盘</div>'}
    </div>

    <div class="section">
      <h2 class="section-title">📚 曲目档案</h2>
      ${trackArchive.length ? `
      <div class="goals-grid">
        ${trackArchive.map(t => {
          const mistakeColor = t.mistakeTrend < 0 ? '#059669' : t.mistakeTrend > 0 ? '#dc2626' : '#60736f';
          const mistakeText = t.mistakeTrend < 0 ? `↓ ${Math.abs(t.mistakeTrend)}` : t.mistakeTrend > 0 ? `↑ ${t.mistakeTrend}` : '—';
          return `
          <div class="goal-card">
            <div class="item-head">
              <div>
                <div class="item-title">${t.piece}</div>
                <div class="item-meta">
                  <span>${t.instrument}</span>
                  <span>练习 <strong>${t.practiceCount}</strong> 次</span>
                </div>
              </div>
            </div>
            <div class="item-meta" style="margin-top:8px;">
              <span>最高 BPM: <strong>${t.maxBpm}</strong></span>
              <span>累计时长: <strong>${t.totalMinutes}min</strong></span>
              <span>最近: <strong>${t.lastDate}</strong></span>
            </div>
            <div style="margin-top:6px;font-size:12px;">
              错误趋势: <strong style="color:${mistakeColor};">${mistakeText}</strong>
            </div>
          </div>
          `;
        }).join('')}
      </div>
      ` : '<div class="empty-tip">本期暂无曲目数据</div>'}
    </div>
  </div>
</div>
</body>
</html>`;
  }

  function exportReport(rangeType) {
    const report = generateReport(rangeType);
    const html = buildExportHtml(report);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const typeLabel = rangeType === 'week' ? 'weekly' : 'monthly';
    a.download = `music-practice-${typeLabel}-report-${report.startDate}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return {
    generateReport,
    exportReport,
    getRecordsInRange,
    buildExportHtml
  };
})();

let reportRange = 'week';

initSession();
render();
