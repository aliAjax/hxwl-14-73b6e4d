import './styles.css';

const key = 'hxwl-14-music-practice';
const planKey = 'hxwl-14-music-practice-plan';
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

document.querySelector('#app').innerHTML = `
  <main class="shell">
    <header class="hero">
      <div>
        <p>hxwl-14 · port 5114</p>
        <h1>独立音乐练习仪表盘</h1>
      </div>
      <button id="sample">载入示例</button>
    </header>

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

function save() {
  localStorage.setItem(key, JSON.stringify(records));
}

function render() {
  const selectedPiece = pieceFilter.value;
  const pieces = [...new Set(records.map((record) => record.piece))].sort();
  pieceFilter.innerHTML = `<option value="">全部曲目</option>${pieces.map((piece) => `<option>${piece}</option>`).join('')}`;
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
    filterBadge.innerHTML = `<span class="filterTag">筛选: ${archiveFilter} <button id="clearFilter" class="clearFilter">×</button></span>`;
    document.querySelector('#clearFilter').addEventListener('click', () => {
      archiveFilter = '';
      pieceFilter.value = '';
      render();
    });
  } else {
    filterBadge.innerHTML = '';
  }

  document.querySelector('#rows').innerHTML = filtered.slice().reverse().map((record) => `<tr><td>${record.date}</td><td>${record.instrument}</td><td>${record.piece}</td><td>${record.bpm}</td><td>${record.minutes}min</td><td>${record.mistakes}</td><td><button data-edit="${record.id}">编辑</button><button data-del="${record.id}">删除</button></td></tr>`).join('');
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
      <article class="trackCard ${archiveFilter === track.piece ? 'active' : ''}" data-track="${track.piece}">
        <div class="trackHead">
          <div>
            <h3 class="trackTitle">${track.piece}</h3>
            <span class="trackInstrument">${track.instrument} · ${track.practiceCount} 次练习</span>
          </div>
          <button class="trackFilterBtn" data-filter-track="${track.piece}">筛选记录</button>
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
              ${track.notes.map((n) => `<li><span class="noteDate">${n.date}</span><span class="noteText">${n.note}</span></li>`).join('')}
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
        <div class="taskPiece">${task.piece}</div>
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
