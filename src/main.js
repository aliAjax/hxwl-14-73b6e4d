import './styles.css';

const key = 'hxwl-14-music-practice';
const planKey = 'hxwl-14-practice-plan';
const seed = [
  { id: crypto.randomUUID(), instrument: '电吉他', piece: 'Blue Bossa', date: '2026-06-01', bpm: 86, minutes: 35, mistakes: 18, note: '和弦转换卡顿' },
  { id: crypto.randomUUID(), instrument: '电吉他', piece: 'Blue Bossa', date: '2026-06-03', bpm: 92, minutes: 42, mistakes: 13, note: '副歌更稳定' },
  { id: crypto.randomUUID(), instrument: '电吉他', piece: 'Blue Bossa', date: '2026-06-06', bpm: 98, minutes: 45, mistakes: 9, note: '开始合伴奏' },
  { id: crypto.randomUUID(), instrument: '键盘', piece: 'Autumn Leaves', date: '2026-06-02', bpm: 72, minutes: 30, mistakes: 21, note: '左手节奏不稳' },
  { id: crypto.randomUUID(), instrument: '键盘', piece: 'Autumn Leaves', date: '2026-06-05', bpm: 78, minutes: 38, mistakes: 15, note: '分段练习有效' }
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

let records = JSON.parse(localStorage.getItem(key) || 'null') || seed;
let plans = JSON.parse(localStorage.getItem(planKey) || 'null') || [];
let editingId = null;

document.querySelector('#app').innerHTML = `
  <main class="shell">
    <header class="hero">
      <div>
        <p>hxwl-14 · port 5114</p>
        <h1>独立音乐练习仪表盘</h1>
      </div>
      <button id="sample">载入示例</button>
    </header>

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

    <section class="panel planPanel">
      <div class="panelHead">
        <h2>今日练习计划</h2>
        <span class="planDate" id="planDate"></span>
      </div>
      <form id="planForm" class="planForm">
        <input name="piece" placeholder="曲目" required />
        <input name="targetBpm" type="number" min="1" step="1" placeholder="目标BPM" required />
        <input name="minutes" type="number" min="1" step="1" placeholder="预计分钟" required />
        <button class="primary">添加任务</button>
      </form>
      <div class="planList" id="planList"></div>
    </section>

    <section class="cards">
      <div class="panel"><h2>练习时长趋势</h2><div class="chart small" id="minutesChart"></div></div>
      <div class="panel"><h2>错误次数变化</h2><div class="chart small" id="mistakeChart"></div></div>
    </section>

    <section class="panel">
      <div class="panelHead"><h2>记录列表</h2><input id="search" placeholder="搜索乐器、曲目或备注" /></div>
      <div class="tableWrap"><table><thead><tr><th>日期</th><th>乐器</th><th>曲目</th><th>BPM</th><th>时长</th><th>错误</th><th></th></tr></thead><tbody id="rows"></tbody></table></div>
    </section>
  </main>
`;

const form = document.querySelector('#form');
const search = document.querySelector('#search');
const pieceFilter = document.querySelector('#pieceFilter');
const planForm = document.querySelector('#planForm');
const planList = document.querySelector('#planList');
const planDateEl = document.querySelector('#planDate');

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
pieceFilter.addEventListener('change', render);
document.querySelector('#sample').addEventListener('click', () => {
  records = seed;
  save();
  render();
});

planForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(planForm).entries());
  const plan = {
    id: crypto.randomUUID(),
    piece: data.piece,
    targetBpm: Number(data.targetBpm),
    minutes: Number(data.minutes),
    completed: false,
    date: todayStr()
  };
  plans.push(plan);
  savePlans();
  planForm.reset();
  render();
});

function save() {
  localStorage.setItem(key, JSON.stringify(records));
}

function savePlans() {
  localStorage.setItem(planKey, JSON.stringify(plans));
}

function todayPlans() {
  const today = todayStr();
  return plans.filter((plan) => plan.date === today);
}

function togglePlan(id) {
  plans = plans.map((plan) => plan.id === id ? { ...plan, completed: !plan.completed } : plan);
  savePlans();
  render();
}

function deletePlan(id) {
  plans = plans.filter((plan) => plan.id !== id);
  savePlans();
  render();
}

function render() {
  const selectedPiece = pieceFilter.value;
  const pieces = [...new Set(records.map((record) => record.piece))].sort();
  pieceFilter.innerHTML = `<option value="">全部曲目</option>${pieces.map((piece) => `<option>${piece}</option>`).join('')}`;
  pieceFilter.value = selectedPiece && pieces.includes(selectedPiece) ? selectedPiece : '';
  const filtered = records
    .filter((record) => !pieceFilter.value || record.piece === pieceFilter.value)
    .filter((record) => [record.instrument, record.piece, record.note].join(' ').includes(search.value.trim()))
    .sort((a, b) => a.date.localeCompare(b.date));

  const today = todayPlans();
  const pendingCount = today.filter((p) => !p.completed).length;
  const totalMinutes = today.reduce((sum, p) => sum + p.minutes, 0);
  const completedMinutes = today.filter((p) => p.completed).reduce((sum, p) => sum + p.minutes, 0);

  document.querySelector('#summary').innerHTML = [
    ['总练习时长', `${records.reduce((sum, record) => sum + record.minutes, 0)}min`],
    ['曲目数', pieces.length],
    ['平均BPM', Math.round(avg(records.map((record) => record.bpm)))],
    ['今日待完成', `${pendingCount}项`],
    ['今日预计时长', `${totalMinutes}min`]
  ].map(([label, value]) => `<article><span>${label}</span><strong>${value}</strong></article>`).join('');

  drawLine('#bpmChart', filtered.map((record) => ({ label: record.date.slice(5), value: record.bpm })), 'BPM', '#0f766e');
  drawBars('#minutesChart', groupDay(filtered, 'minutes'), 'min', '#d97706');
  drawLine('#mistakeChart', filtered.map((record) => ({ label: record.date.slice(5), value: record.mistakes })), '次', '#dc2626');

  planDateEl.textContent = todayStr();
  if (today.length === 0) {
    planList.innerHTML = '<p class="empty">还没有今日练习计划，添加一个任务开始吧！</p>';
  } else {
    planList.innerHTML = today.map((plan) => `
      <div class="planItem ${plan.completed ? 'completed' : ''}">
        <label class="planCheck">
          <input type="checkbox" ${plan.completed ? 'checked' : ''} data-toggle="${plan.id}" />
          <span class="checkmark"></span>
        </label>
        <div class="planInfo">
          <span class="planPiece">${plan.piece}</span>
          <span class="planMeta">目标 ${plan.targetBpm} BPM · ${plan.minutes} 分钟</span>
        </div>
        <button class="planDel" data-plan-del="${plan.id}">删除</button>
      </div>
    `).join('');
  }

  document.querySelectorAll('[data-toggle]').forEach((checkbox) => checkbox.addEventListener('change', () => {
    togglePlan(checkbox.dataset.toggle);
  }));
  document.querySelectorAll('[data-plan-del]').forEach((button) => button.addEventListener('click', () => {
    deletePlan(button.dataset.planDel);
  }));

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
}

function avg(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function groupDay(data, field) {
  const map = new Map();
  data.forEach((record) => map.set(record.date, (map.get(record.date) || 0) + record[field]));
  return [...map.entries()].map(([label, value]) => ({ label: label.slice(5), value }));
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
