import './styles.css';

const key = 'hxwl-14-music-practice';
const planKey = 'hxwl-14-music-practice-plan';
const goalKey = 'hxwl-14-music-practice-goals';
const seed = [
  { id: crypto.randomUUID(), instrument: '电吉他', piece: 'Blue Bossa', date: '2026-06-01', bpm: 86, minutes: 35, mistakes: 18, note: '和弦转换卡顿' },
  { id: crypto.randomUUID(), instrument: '电吉他', piece: 'Blue Bossa', date: '2026-06-03', bpm: 92, minutes: 42, mistakes: 13, note: '副歌更稳定' },
  { id: crypto.randomUUID(), instrument: '电吉他', piece: 'Blue Bossa', date: '2026-06-06', bpm: 98, minutes: 45, mistakes: 9, note: '开始合伴奏' },
  { id: crypto.randomUUID(), instrument: '键盘', piece: 'Autumn Leaves', date: '2026-06-02', bpm: 72, minutes: 30, mistakes: 21, note: '左手节奏不稳' },
  { id: crypto.randomUUID(), instrument: '键盘', piece: 'Autumn Leaves', date: '2026-06-05', bpm: 78, minutes: 38, mistakes: 15, note: '分段练习有效' }
];

let records = JSON.parse(localStorage.getItem(key) || 'null') || seed;
let editingId = null;
let archiveFilter = '';

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
          <input name="bpm" type="number" min="1" step="1" placeholder="速度BPM" required />
          <input name="minutes" type="number" min="1" step="1" placeholder="练习时长min" required />
        </div>
        <input name="mistakes" type="number" min="0" step="1" placeholder="错误次数" required />
        <textarea name="note" placeholder="备注"></textarea>
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
  const item = { ...data, bpm: Number(data.bpm), minutes: Number(data.minutes), mistakes: Number(data.mistakes), id: editingId || crypto.randomUUID() };
  records = editingId ? records.map((record) => (record.id === editingId ? item : record)) : [item, ...records];
  editingId = null;
  form.reset();
  save();
  render();
});
search.addEventListener('input', render);
pieceFilter.addEventListener('change', () => {
  archiveFilter = '';
  render();
});
document.querySelector('#sample').addEventListener('click', () => {
  records = seed;
  save();
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
        <h3>⚠️ 重复记录 (${duplicateRecords.length}) - 这些记录将被跳过</h3>
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
        <h3>✅ 新增记录 (${newRecords.length}) - 这些记录将被导入</h3>
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

  modalConfirm.disabled = newRecords.length === 0;
  if (newRecords.length === 0) {
    modalConfirm.textContent = '无有效数据可导入';
  } else {
    modalConfirm.textContent = `确认导入 ${newRecords.length} 条记录`;
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

modalConfirm.addEventListener('click', () => {
  if (!pendingImportData || pendingImportData.newRecords.length === 0) return;

  const newRecords = pendingImportData.newRecords.map(item => item.record);
  records = [...newRecords, ...records];
  save();
  render();
  closeImportModal();

  const count = newRecords.length;
  alert(`成功导入 ${count} 条练习记录！`);
});

function save() {
  localStorage.setItem(key, JSON.stringify(records));
}

function render() {
  syncGoalAchievements();
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
  const effectivePieceFilter = archiveFilter || pieceFilter.value;
  const filtered = records
    .filter((record) => !effectivePieceFilter || record.piece === effectivePieceFilter)
    .filter((record) => [record.instrument, record.piece, record.note].join(' ').includes(search.value.trim()))
    .sort((a, b) => a.date.localeCompare(b.date));
  const uncompletedCount = planTasks.filter((task) => !task.completed).length;
  const totalEstimated = planTasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);
  document.querySelector('#summary').innerHTML = [
    ['总练习时长', `${records.reduce((sum, record) => sum + record.minutes, 0)}min`],
    ['曲目数', pieces.length],
    ['平均BPM', Math.round(avg(records.map((record) => record.bpm)))],
    ['今日待完成', uncompletedCount + ' 项'],
    ['预计总时长', totalEstimated + 'min']
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

  document.querySelector('#rows').innerHTML = filtered.slice().reverse().map((record) => `<tr><td>${escapeHtml(record.date)}</td><td>${escapeHtml(record.instrument)}</td><td>${escapeHtml(record.piece)}</td><td>${record.bpm}</td><td>${record.minutes}min</td><td>${record.mistakes}</td><td><button data-edit="${escapeHtml(record.id)}">编辑</button><button data-del="${escapeHtml(record.id)}">删除</button></td></tr>`).join('');
  document.querySelectorAll('[data-del]').forEach((button) => button.addEventListener('click', () => {
    records = records.filter((record) => record.id !== button.dataset.del);
    save();
    render();
  }));
  document.querySelectorAll('[data-edit]').forEach((button) => button.addEventListener('click', () => {
    const record = records.find((item) => item.id === button.dataset.edit);
    editingId = record.id;
    Object.entries(record).forEach(([name, value]) => {
      if (form.elements[name]) form.elements[name].value = value;
    });
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

render();
