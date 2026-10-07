/* ==========================================================================
   factor-mining-showcase — 应用逻辑
   Clean-room 重建：仅还原界面外观与交互。无后端、无网络请求。
   ========================================================================== */

import { DB } from './data.js';

/* ---------- 常量 ---------- */
const C = {
  premium: 'hsl(262 83% 58%)',
  premiumSoft: 'hsl(262 83% 58% / 0.12)',
  fast: 'hsl(221.2 83.2% 53.3%)',
  fastSoft: 'hsl(221.2 83.2% 53.3% / 0.12)',
  series: [
    'hsl(221.2 83.2% 53.3%)',
    'hsl(38 92% 50%)',
    'hsl(0 84.2% 60.2%)',
    'hsl(142.1 76.2% 36.3%)',
    'hsl(262 83% 58%)',
    'hsl(200 90% 45%)',
  ],
};

/* ---------- 工具 ---------- */
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const fmt = (v, d = 4) => (v === null || v === undefined ? '—' : Number(v).toFixed(d));
const pct = (v, d = 2) => (v === null || v === undefined ? '—' : `${(Number(v) * 100).toFixed(d)}%`);
const tone = (v) => {
  if (v === null || v === undefined) return '';
  return v > 0 ? 'color: hsl(var(--success))' : v < 0 ? 'color: hsl(var(--destructive))' : '';
};
/** 千分位整数 */
const int = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/* ---------- 图标 ---------- */
const ICONS = {
  sparkles: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/>',
  flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  table: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.2 4.2l2.8 2.8M17 17l2.8 2.8M1 12h4M19 12h4M4.2 19.8L7 17M17 7l2.8-2.8"/>',
  drive: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M7 14h2"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/>',
  layers: '<path d="M12 2l9 5-9 5-9-5z"/><path d="M3 12l9 5 9-5M3 17l9 5 9-5"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0 5 5L21 21l-3 .5-.5-3-9.4-9.4a4 4 0 0 1-5-5z"/>',
  toggle: '<circle cx="15" cy="12" r="3"/><rect x="2" y="7" width="20" height="10" rx="5"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  gauge: '<path d="M12 14l4-4"/><path d="M3 18a9 9 0 1 1 18 0"/>',
  tag: '<path d="M20.6 13.4L13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  book: '<path d="M4 4h9a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z"/><path d="M20 4h-4a3 3 0 0 1 3 3v13a2 2 0 0 1-2 2"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
  scroll: '<path d="M8 2h9l4 4v14a2 2 0 0 1-2 2H8"/><path d="M4 6a2 2 0 0 1 2-2v18a2 2 0 0 1-2-2z"/>',
  warn: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  play: '<path d="M6 4l14 8-14 8z"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  code: '<path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  zap: '<path d="M13 2L3 14h9l-1 8 10-12h-9z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>',
  arrowUp: '<path d="M12 19V5M5 12l7-7 7 7"/>',
  arrowDown: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
};

const icon = (name, size = 16, cls = '') =>
  `<svg class="icon ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true">${ICONS[name] || ''}</svg>`;

/* ---------- 语法高亮（先分词再转义，避免二次解析） ---------- */
const PY_KW = new Set(['def','return','import','from','as','if','else','elif','for','while','in','not','and','or','class','with','try','except','raise','None','True','False','lambda','yield','pass','register','clip','astype','float','int']);

function highlightCode(code) {
  const re = /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|(@[A-Za-z_]\w*)|(\b\d+\.?\d*\b)|([A-Za-z_]\w*)/g;
  const out = [];
  let last = 0;
  let m;
  while ((m = re.exec(code)) !== null) {
    if (m.index > last) out.push(esc(code.slice(last, m.index)));
    const [full, comment, str, deco, num, word] = m;
    if (comment) out.push(`<span class="tok-c">${esc(comment)}</span>`);
    else if (str) out.push(`<span class="tok-s">${esc(str)}</span>`);
    else if (deco) out.push(`<span class="tok-d">${esc(deco)}</span>`);
    else if (num) out.push(`<span class="tok-n">${esc(num)}</span>`);
    else if (word) out.push(PY_KW.has(word) ? `<span class="tok-k">${esc(word)}</span>` : esc(word));
    last = m.index + full.length;
  }
  out.push(esc(code.slice(last)));
  return out.join('');
}

/** GP 树文本着色：把 [算子]、数字、字段名区分开 */
function highlightTree(text) {
  return esc(text)
    .replace(/\[([^\]]+)\]/g, '<span class="tok-k">[$1]</span>')
    .replace(/(\b\d+\b)/g, '<span class="tok-n">$1</span>');
}

/* ==========================================================================
   图表
   ========================================================================== */
function lineChart(series, opts = {}) {
  const {
    height = 200, width = 760,
    pad = { t: 14, r: 18, b: 28, l: 48 },
    zeroLine = true, area = false, xLabels = [],
    yFmt = (v) => v.toFixed(2),
  } = opts;

  const all = series.flatMap((s) => s.points).filter((v) => v !== null && v !== undefined);
  if (!all.length) return '<div class="empty">无数据</div>';

  let min = Math.min(...all);
  let max = Math.max(...all);
  if (zeroLine) { min = Math.min(min, 0); max = Math.max(max, 0); }
  if (min === max) max = min + 1e-6;
  const span = max - min;
  min -= span * 0.09;
  max += span * 0.09;

  const n = Math.max(...series.map((s) => s.points.length));
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const X = (i) => pad.l + (n <= 1 ? 0 : (i / (n - 1)) * innerW);
  const Y = (v) => pad.t + innerH - ((v - min) / (max - min)) * innerH;

  const gid = `g${Math.random().toString(36).slice(2, 8)}`;
  const ticks = 5;
  let grid = '';
  for (let k = 0; k <= ticks; k++) {
    const v = min + ((max - min) * k) / ticks;
    const y = Y(v);
    grid += `<line class="chart-grid" x1="${pad.l}" y1="${y.toFixed(1)}" x2="${width - pad.r}" y2="${y.toFixed(1)}"/>`;
    grid += `<text class="chart-tick" x="${pad.l - 9}" y="${(y + 3.5).toFixed(1)}" text-anchor="end">${yFmt(v)}</text>`;
  }

  let xAxis = '';
  if (xLabels.length) {
    const step = Math.max(1, Math.ceil(xLabels.length / 8));
    xLabels.forEach((lb, i) => {
      if (i % step !== 0) return;
      xAxis += `<text class="chart-tick" x="${X(i).toFixed(1)}" y="${height - 9}" text-anchor="middle">${esc(lb)}</text>`;
    });
  }

  const zero = zeroLine && min < 0 && max > 0
    ? `<line x1="${pad.l}" y1="${Y(0).toFixed(1)}" x2="${width - pad.r}" y2="${Y(0).toFixed(1)}"
        stroke="hsl(var(--muted-foreground))" stroke-width="1" stroke-dasharray="3 3" opacity="0.45"/>`
    : '';

  const defs = [];
  const paths = series.map((s, si) => {
    const pts = s.points.map((v, i) => (v === null || v === undefined ? null : [X(i), Y(v)])).filter(Boolean);
    if (!pts.length) return '';
    const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const color = s.color;
    let fill = '';
    if (area && si === 0) {
      defs.push(`<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient>`);
      fill = `<path d="${d} L${pts[pts.length - 1][0].toFixed(1)},${(pad.t + innerH).toFixed(1)} L${pts[0][0].toFixed(1)},${(pad.t + innerH).toFixed(1)} Z"
        fill="url(#${gid})" stroke="none"/>`;
    }
    const tip = `${s.name}：${s.points[s.points.length - 1]}`;
    return `${fill}<path d="${d}" fill="none" stroke="${color}" stroke-width="${s.emphasize ? 2.4 : 1.7}"
      opacity="${s.emphasize ? 1 : 0.88}" stroke-linejoin="round" stroke-linecap="round"
      ${s.dash ? `stroke-dasharray="${s.dash}"` : ''}><title>${esc(tip)}</title></path>`;
  }).join('');

  return `<svg class="chart" viewBox="0 0 ${width} ${height}" width="100%" height="${height}"
      role="img" preserveAspectRatio="xMidYMid meet">
      ${defs.length ? `<defs>${defs.join('')}</defs>` : ''}
      ${grid}${zero}
      <line class="chart-axis" x1="${pad.l}" y1="${pad.t + innerH}" x2="${width - pad.r}" y2="${pad.t + innerH}"/>
      ${xAxis}${paths}
    </svg>`;
}

function legend(series) {
  return `<div class="chart-legend">${series.map((s) =>
    `<span class="chart-legend-item"><span class="chart-legend-swatch" style="background:${s.color}"></span>${esc(s.name)}</span>`
  ).join('')}</div>`;
}

/** 迷你走势图（表格内联） */
function sparkline(points, opts = {}) {
  const w = opts.width || 88;
  const h = opts.height || 26;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const X = (i) => (i / (points.length - 1)) * (w - 2) + 1;
  const Y = (v) => h - 2 - ((v - min) / span) * (h - 4);
  const d = points.map((v, i) => `${i === 0 ? 'M' : 'L'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  const trend = points[points.length - 1] - points[0];
  const color = trend >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))';
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">
    <path d="${d}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
  </svg>`;
}

function heatmap(rows) {
  const cell = (v) => {
    if (v === null || v === undefined) return { bg: 'hsl(var(--muted))', fg: 'hsl(var(--muted-foreground))' };
    const a = Math.min(Math.abs(v) / 0.075, 1);
    return {
      bg: v >= 0
        ? `hsl(var(--success) / ${(0.1 + a * 0.75).toFixed(2)})`
        : `hsl(var(--destructive) / ${(0.1 + a * 0.75).toFixed(2)})`,
      fg: a > 0.45 ? '#fff' : 'hsl(var(--foreground))',
    };
  };
  const head = `<tr><th></th>${Array.from({ length: 12 }, (_, i) =>
    `<th style="text-align:center;font-weight:500">${i + 1}月</th>`).join('')}</tr>`;
  const body = rows.map((r) =>
    `<tr><td style="font-weight:600;color:hsl(var(--foreground))">${esc(r.year)}</td>${r.months.map((v) => {
      const c = cell(v);
      return `<td style="background:${c.bg};color:${c.fg};text-align:center;font-variant-numeric:tabular-nums">${
        v === null || v === undefined ? '—' : (v * 100).toFixed(1)}</td>`;
    }).join('')}</tr>`).join('');
  return `<div class="table-wrap table-plain"><table class="data" style="min-width:640px">${head}${body}</table></div>`;
}

function corrGrid(labels, m) {
  const cell = (v) => (v >= 0
    ? `hsl(var(--success) / ${(0.06 + Math.min(Math.abs(v), 1) * 0.7).toFixed(2)})`
    : `hsl(var(--destructive) / ${(0.06 + Math.min(Math.abs(v), 1) * 0.7).toFixed(2)})`);
  const head = `<tr><th></th>${labels.map((l) => `<th style="text-align:center;font-weight:500">${esc(l)}</th>`).join('')}</tr>`;
  const body = m.map((row, i) =>
    `<tr><td style="font-weight:600;color:hsl(var(--foreground))">${esc(labels[i])}</td>${row.map((v, j) => {
      const show = j <= i;
      const bg = i === j ? 'hsl(var(--muted))' : show ? cell(v) : 'transparent';
      const fg = i === j ? 'hsl(var(--muted-foreground))' : Math.abs(v) > 0.55 ? '#fff' : 'hsl(var(--foreground))';
      return `<td style="background:${bg};color:${fg};text-align:center;font-variant-numeric:tabular-nums">${
        show ? (i === j ? '1' : v.toFixed(2)) : ''}</td>`;
    }).join('')}</tr>`).join('');
  return `<div class="table-wrap table-plain"><table class="data" style="min-width:560px">${head}${body}</table></div>`;
}

/* ==========================================================================
   复用片段
   ========================================================================== */
const card = (title, body, opts = {}) => {
  const head = title
    ? `<div class="card-header">
        <h3 class="card-title ${opts.small ? 'card-title-sm' : ''}">
          ${opts.icon ? `<span class="card-icon">${icon(opts.icon, opts.small ? 15 : 17)}</span>` : ''}
          <span>${title}</span>
          ${opts.aside ? `<span class="card-aside">${opts.aside}</span>` : ''}
        </h3>
        ${opts.desc ? `<p class="card-desc">${opts.desc}</p>` : ''}
      </div>`
    : '';
  return `<section class="card ${opts.accent ? `accent-${opts.accent}` : ''} ${opts.hover ? 'card-hover' : ''}">
    ${head}<div class="card-content ${title ? '' : 'pt-0'}">${body}</div></section>`;
};

const metric = (label, value, style = '', sub = '') => `
  <div class="metric">
    <div class="metric-label">${esc(label)}</div>
    <div class="metric-value" style="${style}">${value}</div>
    ${sub ? `<div class="metric-sub">${sub}</div>` : ''}
  </div>`;

const badge = (text, kind = 'muted') => `<span class="badge badge-${kind}">${esc(text)}</span>`;
const originBadge = (o) => (o === 'premium'
  ? `<span class="badge badge-premium">${icon('sparkles', 11)}精品轨</span>`
  : `<span class="badge badge-fast">${icon('zap', 11)}快轨</span>`);

const sectionTitle = (title, sub = '', right = '') => `
  <div class="section-head">
    <div>
      <h2 class="section-title">${title}</h2>
      ${sub ? `<p class="section-sub">${sub}</p>` : ''}
    </div>
    ${right ? `<div class="section-right">${right}</div>` : ''}
  </div>`;

/* 日志时间以固定基准递增，看起来像持续输出 */
let _logCursor = 0;
const logLine = ([kind, text]) => {
  _logCursor += 113;
  const t = new Date(Date.UTC(2026, 9, 8, 2, 31, 0) + _logCursor * 1000).toISOString().slice(11, 19);
  return `<div class="log-line"><span class="log-time">${t}</span><span class="log-${kind}">${esc(text)}</span></div>`;
};
const resetLogCursor = () => { _logCursor = 0; };

/* ==========================================================================
   视图：因子挖掘（精品轨为主角）
   ========================================================================== */
function viewMine() {
  const s = DB.SUMMARY;
  const st = DB.OPERATOR_STATS;

  /* --- 精品轨 hero --- */
  const slots = DB.PREMIUM_SLOTS.map((slot) => `
    <div class="slot">
      <div class="slot-head">
        <span class="slot-label">${esc(slot.label)}</span>
        <code class="slot-sub">${esc(slot.sub)}</code>
      </div>
      <p class="slot-desc">${esc(slot.desc)}</p>
      <ul class="slot-items">${slot.items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <div class="slot-meta">${esc(slot.meta)}</div>
    </div>`).join('');

  const steps = DB.VALIDATION_LAYERS.map((l, i) => `
    <div class="step">
      <div class="step-rail">
        <span class="step-dot">${l.n}</span>
        ${i < DB.VALIDATION_LAYERS.length - 1 ? '<span class="step-line"></span>' : ''}
      </div>
      <div class="step-body">
        <div class="step-head">
          <span class="step-name">${esc(l.name)}</span>
          <span class="step-counts">
            <b class="ok">${l.out}</b> 通过${l.in - l.out > 0 ? ` · <b class="bad">${l.in - l.out}</b> 淘汰` : ''}
          </span>
        </div>
        <p class="step-brief">${esc(l.brief)}</p>
        ${l.rejected.length ? `<div class="step-rejected">${l.rejected.map((r) =>
          `<div class="rejected-row">${icon('x', 12)}<code>${esc(r.name)}</code><span>${esc(r.reason)}</span></div>`).join('')}</div>` : ''}
        ${l.note ? `<p class="step-note">${icon('warn', 12)}${esc(l.note)}</p>` : ''}
      </div>
    </div>`).join('');

  const repairs = DB.REPAIR_ROUNDS.map((r) => `
    <div class="repair">
      <span class="repair-badge">第 ${r.round} 次</span>
      <div>
        <div class="repair-reason">${esc(r.reason)}</div>
        <div class="repair-action">${esc(r.action)}</div>
      </div>
      <span class="repair-result">${icon('check', 12)}${esc(r.result)}</span>
    </div>`).join('');

  const boosts = DB.BOOST_DIMENSIONS.map((d) => `
    <div class="boost ${d.applied ? 'applied' : ''}">
      <span class="boost-name">${esc(d.name)}</span>
      <span class="boost-detail">${esc(d.detail)}</span>
      <span class="boost-state">${d.applied ? icon('check', 12) : '跳过'}</span>
    </div>`).join('');

  /* --- 族包 --- */
  const fams = DB.FAMILIES.map((f) => `
    <a class="fam ${f.mode === 'premium' ? 'is-premium' : ''}" href="#/family?id=${encodeURIComponent(f.id)}">
      <div class="fam-head">
        <div class="fam-title">${esc(f.direction)}</div>
        ${f.mode === 'premium' ? originBadge('premium') : originBadge('fast')}
      </div>
      <div class="fam-id">${esc(f.id)}${f.hasBoost ? ` · <span class="boost-tag">有 boost 变体</span>` : ''}</div>
      <div class="fam-stats">
        <span>因子 <b>${f.nFactors}</b></span>
        <span>保留 <b>${f.nKept}</b></span>
        <span>最优 IC <b class="ok">${fmt(f.bestIc, 4)}</b></span>
      </div>
      <div class="fam-paradigm">${esc(f.paradigm)}</div>
    </a>`).join('');

  const caps = DB.CAPABILITIES.map((c) => `
    <div class="cap-row">
      <div class="cap-main">
        <div class="cap-head">
          <code class="cap-id">${esc(c.id)}</code>
          ${badge(c.slot, 'primary')}
          <span class="cap-name">${esc(c.name)}</span>
        </div>
        <div class="cap-note">来源：${esc(c.from)} · ${esc(c.note)}</div>
      </div>
      ${c.status === 'pending' ? badge('待放行', 'warning') : badge('已阻塞', 'destructive')}
    </div>`).join('');

  return `
  <div class="stack stack-6">
    ${sectionTitle(
      '因子挖掘',
      '两条挖矿轨共用同一套算子、面板、去重与评估；知识库是「增强」的落点',
      `<span class="track-stat">${originBadge('premium')}<b>${s.nPremium}</b></span>
       <span class="track-stat">${originBadge('fast')}<b>${s.nFast}</b></span>`
    )}

    <!-- ======== 精品轨 hero ======== -->
    <section class="hero">
      <div class="hero-glow" aria-hidden="true"></div>
      <div class="hero-body">
        <div class="hero-top">
          <div class="hero-badge">${icon('sparkles', 14)}核心路线</div>
          <h2 class="hero-title">精品轨 · LLM 直接写代码</h2>
          <p class="hero-sub">
            由模型撰写 <code>compute_fn</code> 源码 —— 表达力不受算子集限制。
            知识库通过<b>三槽注入</b>参与：思路库扩提示词、RAG 补上下文、构造范式定 pipeline；
            产物经<b>三层校验</b>淘汰后才进入共享后置。
          </p>
          <div class="hero-facts">
            <span class="fact">${icon('zap', 13)}一次 LLM 调用 · 2 因子约 25s</span>
            <span class="fact">${icon('shield', 13)}三层校验 · 自动改错 ${s.maxRepair} 次</span>
            <span class="fact">${icon('code', 13)}载体为任意可向量化 Python</span>
          </div>
        </div>

        <div class="hero-slots">
          <div class="slots-title">三槽注入 <span>同一方向下三槽同时组装</span></div>
          <div class="grid grid-3" style="gap:14px">${slots}</div>
        </div>

        <div class="hero-pipeline">
          <div class="slots-title">三层校验链 <span>任一层淘汰即记 reason，不进后置</span></div>
          <div class="steps">${steps}</div>
          <div class="repairs">
            <div class="repairs-title">${icon('wrench', 13)}自动改错 —— 仅对「可改的失败」接同一对话的下一拍</div>
            ${repairs}
            <p class="repairs-note">
              可改 = 非法 JSON / 静态契约不过 / 短窗试算抛异常。<b>前瞻审计未通过不发回模型</b>（结果侧判定，只剔除）。
            </p>
          </div>
        </div>

        <div class="hero-boost">
          <div class="slots-title">boost 变体 <span>取已产出的 code 因子，沿四层维度出变体</span></div>
          <div class="boosts">${boosts}</div>
        </div>
      </div>
    </section>

    <!-- ======== 运行控制 ======== -->
    ${card(
      '发起一次挖掘',
      `
      <div class="mode-pick">
        <button class="mode primary" data-mode="premium" type="button">
          <span class="mode-icon">${icon('sparkles', 18)}</span>
          <span class="mode-text">
            <b>精品轨</b>
            <small>LLM 写 compute_fn · 三槽注入 + 三层校验</small>
          </span>
          <span class="mode-check">${icon('check', 14)}</span>
        </button>
        <button class="mode" data-mode="fast" type="button">
          <span class="mode-icon">${icon('zap', 18)}</span>
          <span class="mode-text">
            <b>快轨</b>
            <small>GP 搜索 · 零 LLM · 一轮 20–90s</small>
          </span>
          <span class="mode-check">${icon('check', 14)}</span>
        </button>
      </div>

      <div class="form-block">
        <label class="field-label" for="topic">研究方向</label>
        <textarea id="topic" class="textarea" rows="2" placeholder="一句话描述要挖的方向">凸显收益误估</textarea>
        <p class="field-hint">方向会同时用于：检索知识库构造范式、组装三槽注入上下文、以及 GP 的算子扩展。</p>
      </div>

      <div class="chips" style="margin-top:14px">
        <span class="chips-label">思路库快速选取</span>
        ${DB.DIRECTIONS.slice(0, 6).map((d) => `<button class="chip" data-topic="${esc(d)}" type="button">${esc(d)}</button>`).join('')}
      </div>

      <div class="grid grid-4 form-grid">
        <div><label class="field-label" for="pop">population_size</label><input id="pop" class="input" type="number" value="24"></div>
        <div><label class="field-label" for="gen">n_generations</label><input id="gen" class="input" type="number" value="6"></div>
        <div><label class="field-label" for="topk">top_k</label><input id="topk" class="input" type="number" value="4"></div>
        <div><label class="field-label" for="nfac">n_factors</label><input id="nfac" class="input" type="number" value="2"></div>
      </div>

      <div class="run-bar">
        <button class="btn btn-lg" id="run" type="button">${icon('play', 15)}开始挖掘</button>
        <button class="btn btn-outline btn-lg" id="stop" type="button" disabled>${icon('stop', 15)}停止</button>
        <span class="run-state" id="run-state">${badge('空闲', 'muted')}</span>
      </div>

      <div class="progress-block">
        <div class="progress-head"><span id="progress-label">等待开始</span><span id="progress-pct">0%</span></div>
        <div class="progress"><div class="progress-bar" id="progress" style="width:0%"></div></div>
      </div>
      `,
      { icon: 'flask', accent: 'premium' }
    )}

    ${card(
      '运行日志',
      `<div class="log-panel" id="log-panel">${DB.RUN_LOG.map(logLine).join('')}</div>`,
      { icon: 'scroll', small: true, aside: `<span class="log-count">${DB.RUN_LOG.length} 行</span>` }
    )}

    ${card(
      `族包`,
      `<div class="grid grid-3" style="gap:14px">${fams}</div>`,
      { icon: 'layers', small: true, aside: `<b>${DB.FAMILIES.length}</b> 个`, desc: '两条轨的产物都是族包，汇入同一条共享后置流程。' }
    )}

    ${card(
      `能力扩充 · 待放行`,
      `<div>${caps}</div>`,
      {
        icon: 'wrench', small: true,
        aside: `<b>${DB.CAPABILITIES.filter((c) => c.status === 'pending').length}</b> 待放行 · <b>${DB.CAPABILITIES.filter((c) => c.status === 'blocked').length}</b> 阻塞`,
        desc: '知识库的构造范式被翻译成候选算子 / 字段，经可得性闸门校验后进入快轨搜索空间。',
      }
    )}

    ${card(
      '算子库 · 注入目录',
      `<div class="grid grid-4">
        ${metric('原生算子', st.native)}
        ${metric('能力扩充', st.extension)}
        ${metric('已停用', st.disabled)}
        ${metric('合计', st.native + st.extension, 'color:hsl(262 83% 58%)')}
      </div>
      <p class="field-hint" style="margin-top:16px">
        扩充算子与原生算子重名时会报错退出；被判死的构造范式永久排除，不再注入。
      </p>`,
      { icon: 'toggle', small: true, aside: `<b>${st.native + st.extension}</b> 条` }
    )}

    <div class="demo-footer">
      知识库规模：${s.nTables} 张表 / ${s.nVars} 个变量（指纹 <code>${s.fingerprint}</code>）·
      族包 ${s.nFamilies} · 因子 ${s.nFactors} · 思路库 ${int(s.nIdeas)} 条（已用 ${s.ideasUsed}）·
      数据窗口 ${s.window}
    </div>
  </div>`;
}

/* ==========================================================================
   视图：因子库
   ========================================================================== */
const COLS = [
  { key: 'name', label: '因子', sortable: true, type: 'text' },
  { key: 'origin', label: '来源', sortable: true, type: 'text' },
  { key: 'direction', label: '方向', sortable: true, type: 'text' },
  { key: 'ic', label: 'IC', sortable: true, type: 'num', get: (f) => f.metrics.ic, d: 4 },
  { key: 'rank_ic', label: 'Rank IC', sortable: true, type: 'num', get: (f) => f.metrics.rank_ic, d: 4 },
  { key: 'icir', label: 'ICIR', sortable: true, type: 'num', get: (f) => f.metrics.icir, d: 3 },
  { key: 'ir', label: '多空 IR', sortable: true, type: 'num', get: (f) => f.metrics.long_short_ir, d: 3 },
  { key: 'win', label: '胜率', sortable: true, type: 'num', get: (f) => f.metrics.ic_win_rate, d: 1, pct: true },
  { key: 'cov', label: '覆盖', sortable: true, type: 'num', get: (f) => f.metrics.coverage, d: 1, pct: true },
  { key: 'to', label: '换手', sortable: true, type: 'num', get: (f) => f.metrics.turnover, d: 2 },
  { key: 'spark', label: '累积走势', sortable: false },
];

function viewLibrary(state) {
  const origin = state.origin || '';
  const q = (state.q || '').toLowerCase();
  const sort = state.sort || { key: 'ic', dir: 'desc' };

  let rows = DB.FACTORS.slice();
  if (origin) rows = rows.filter((f) => f.origin === origin);
  if (q) rows = rows.filter((f) => f.name.toLowerCase().includes(q) || f.direction.toLowerCase().includes(q));

  const col = COLS.find((c) => c.key === sort.key);
  if (col && col.sortable) {
    rows.sort((a, b) => {
      let va = col.get ? col.get(a) : a[col.key === 'origin' ? 'origin' : col.key];
      let vb = col.get ? col.get(b) : b[col.key === 'origin' ? 'origin' : col.key];
      if (typeof va === 'string') return sort.dir === 'asc' ? va.localeCompare(vb, 'zh') : vb.localeCompare(va, 'zh');
      return sort.dir === 'asc' ? va - vb : vb - va;
    });
  }

  const counts = {
    '': DB.FACTORS.length,
    premium: DB.FACTORS.filter((f) => f.origin === 'premium').length,
    fast: DB.FACTORS.filter((f) => f.origin === 'fast').length,
  };

  const head = COLS.map((c) => {
    const active = sort.key === c.key;
    return `<th class="${c.type === 'num' ? 'num' : ''} ${c.sortable ? 'sortable' : ''} ${active ? 'sorted' : ''}"
      ${c.sortable ? `data-sort="${c.key}"` : ''}>
      <span class="th-inner">${esc(c.label)}${c.sortable
        ? `<span class="sort-mark">${active ? icon(sort.dir === 'asc' ? 'arrowUp' : 'arrowDown', 11) : ''}</span>`
        : ''}</span></th>`;
  }).join('');

  const body = rows.length
    ? rows.map((f) => `<tr class="clickable" data-factor="${esc(f.name)}">
        <td><code class="factor-name">${esc(f.name)}</code></td>
        <td>${originBadge(f.origin)}</td>
        <td class="dim">${esc(f.direction)}</td>
        <td class="num strong" style="${tone(f.metrics.ic)}">${fmt(f.metrics.ic, 4)}</td>
        <td class="num" style="${tone(f.metrics.rank_ic)}">${fmt(f.metrics.rank_ic, 4)}</td>
        <td class="num">${fmt(f.metrics.icir, 3)}</td>
        <td class="num">${fmt(f.metrics.long_short_ir, 3)}</td>
        <td class="num">${pct(f.metrics.ic_win_rate, 1)}</td>
        <td class="num">${pct(f.metrics.coverage, 1)}</td>
        <td class="num">${fmt(f.metrics.turnover, 2)}</td>
        <td>${sparkline(f.spark)}</td>
      </tr>`).join('')
    : `<tr><td colspan="${COLS.length}"><div class="empty">
        索引里还没有因子。去「因子挖掘」跑一次快轨或精品轨即可产出。
       </div></td></tr>`;

  return `
  <div class="stack stack-6">
    ${sectionTitle(
      '因子库',
      '统一索引：两条轨同表，同一套评测口径（IC 家族）',
      `<button class="btn btn-outline btn-sm" id="refresh" type="button">${icon('refresh', 14)}刷新</button>`
    )}

    <div class="filter-bar">
      <div class="chips">
        ${[['', '全部来源'], ['premium', '只看精品轨'], ['fast', '只看快轨']].map(([v, label]) =>
          `<button class="chip ${origin === v ? 'active' : ''}" data-origin="${v}" type="button">
            ${v ? (v === 'premium' ? icon('sparkles', 12) : icon('zap', 12)) : ''}
            ${esc(label)}<span class="count">${counts[v]}</span>
          </button>`).join('')}
      </div>
      <div class="search-box">
        ${icon('search', 14)}
        <input class="input input-bare" id="search" placeholder="按因子名或方向搜索…" value="${esc(state.q || '')}">
      </div>
    </div>

    <div class="table-wrap"><table class="data">
      <thead><tr>${head}</tr></thead>
      <tbody>${body}</tbody>
    </table></div>

    <p class="table-note">
      共 <b>${rows.length}</b> 个因子${origin || q ? '（已筛选）' : ''} · 点击任意行查看单因子详情
    </p>
  </div>`;
}

/* ==========================================================================
   视图：数据
   ========================================================================== */
function viewData(state) {
  const s = DB.SUMMARY;
  const q = (state.q || '').toLowerCase();
  const rows = q ? DB.TABLES.filter((t) => t.name.includes(q) || t.label.includes(q) || t.category.includes(q)) : DB.TABLES;

  const catKind = (c) => (c === '量价' ? 'muted' : c === '基本面' ? 'primary' : 'warning');

  return `
  <div class="stack stack-6">
    ${sectionTitle('数据', '可用数据范围与字段覆盖（只读）')}

    ${card(
      '当前生效',
      `<div class="grid grid-4">
        <div class="kv-item"><div class="kv-label">数据根</div><div class="kv-value mono">${esc(s.dataRoot)}</div></div>
        <div class="kv-item"><div class="kv-label">数据窗口</div><div class="kv-value mono">${esc(s.window)}</div></div>
        <div class="kv-item"><div class="kv-label">注册表规模</div><div class="kv-value">${s.nTables} 张表 / ${s.nVars} 变量</div></div>
        <div class="kv-item"><div class="kv-label">指纹</div><div class="kv-value mono">${esc(s.fingerprint)}</div></div>
      </div>`,
      { icon: 'database', small: true, aside: badge('只读', 'muted') }
    )}

    ${card(
      '注册表覆盖',
      `<div class="filter-bar" style="margin-bottom:16px">
        <div class="chips">
          <span class="chips-label">按类别</span>
          ${DB.FIELD_TYPES.map((t) => `<button class="chip" data-cat="${esc(t)}" type="button">${esc(t)}</button>`).join('')}
        </div>
        <div class="search-box">
          ${icon('search', 14)}
          <input class="input input-bare" id="field-filter" placeholder="筛选表名 / 说明…" value="${esc(state.q || '')}">
        </div>
      </div>
      <div class="table-wrap"><table class="data">
        <thead><tr>
          <th>表</th><th>说明</th><th>类别</th>
          <th class="num">变量数</th><th>起始</th><th>结束</th><th class="num">天数</th>
        </tr></thead>
        <tbody>${rows.map((t) => `<tr>
          <td><code class="factor-name">${esc(t.name)}</code></td>
          <td>${esc(t.label)}</td>
          <td>${badge(t.category, catKind(t.category))}</td>
          <td class="num strong">${t.vars}</td>
          <td class="dim mono">${esc(t.start)}</td>
          <td class="dim mono">${esc(t.end)}</td>
          <td class="num">${int(t.days)}</td>
        </tr>`).join('')}</tbody>
      </table></div>
      <div class="notice notice-warn" style="margin-top:16px">
        <span class="notice-icon">${icon('warn', 15)}</span>
        <div><b>频率后缀不是「注册一下就能用」</b>：整条流水线是单一频率的。当前注册表只覆盖日频变量，混频需要另做设计。</div>
      </div>`,
      { icon: 'table', small: true, aside: `<b>${rows.length}</b> / ${DB.TABLES.length} 张` }
    )}
  </div>`;
}

/* ==========================================================================
   视图：单因子详情
   ========================================================================== */
function viewDetail(name) {
  const f = DB.FACTORS.find((x) => x.name === name);
  if (!f) return `<div class="empty">未选择因子。</div>`;

  const ic = DB.icSeries(f.metrics.ic, 60);
  const cum = [{ name: '累积 IC', points: ic.map((p) => p.cum), color: C.series[0] }];
  const groups = DB.groupPnl(48);
  const groupSeries = groups.map((g, i) => ({
    name: g.name, points: g.points,
    color: g.emphasize ? C.series[2] : C.series[i % C.series.length],
    emphasize: !!g.emphasize,
  }));
  const m = f.metrics;
  const isPremium = f.origin === 'premium';

  const validation = isPremium
    ? `<div class="rows">
        ${[
          ['静态契约', '每 Contract 一行 · 恰一个非 Contract 列', '通过'],
          ['短窗试算', `probe_days = ${DB.SUMMARY.probeDays}`, '通过'],
          ['前瞻审计', '截断面板逐点比对', '通过'],
        ].map(([n, b, r]) => `
          <div class="val-row">
            <span class="val-name">${esc(n)}</span>
            <span class="val-brief">${esc(b)}</span>
            <span class="val-state ok">${icon('check', 12)}${esc(r)}</span>
          </div>`).join('')}
      </div>
      <p class="field-hint" style="margin-top:12px">
        本轮自动改错启用 ${DB.SUMMARY.maxRepair} 次；前瞻审计未通过不发回模型（结果侧判定，只剔除）。
      </p>`
    : `<p class="field-hint">快轨产物为 GP 树文本，经 <code>compile_tree</code> 在面板上求值后由 <code>IcirEvaluator</code> 计算 |ICIR|，不走三层校验。</p>`;

  return `
  <div class="stack stack-6 animate-in">
    <div class="detail-head">
      <button class="btn btn-ghost btn-sm" id="back" type="button">${icon('back', 14)}返回</button>
      <code class="detail-name">${esc(f.name)}</code>
      ${originBadge(f.origin)}
      ${badge(f.direction, 'primary')}
    </div>

    <div class="grid grid-5">
      ${metric('IC', fmt(m.ic, 4), tone(m.ic))}
      ${metric('Rank IC', fmt(m.rank_ic, 4), tone(m.rank_ic))}
      ${metric('ICIR', fmt(m.icir, 3))}
      ${metric('IR', fmt(m.long_short_ir, 3))}
      ${metric('IC t 值', fmt(m.ic_t, 2))}
    </div>

    ${card(
      '因子表现',
      `<div class="chart-block">
        <div class="chart-label">IC 时序</div>
        ${lineChart([{ name: 'IC', points: ic.map((p) => p.ic), color: C.series[0] }], { area: true, yFmt: (v) => v.toFixed(3) })}
      </div>
      <div class="chart-block">
        <div class="chart-label">累积 IC</div>
        ${lineChart(cum, { height: 180, yFmt: (v) => v.toFixed(2) })}
      </div>
      <div class="chart-block">
        <div class="chart-label">分组 PnL（Q1–Q5 与多空）</div>
        ${lineChart(groupSeries, { height: 250, yFmt: (v) => v.toFixed(3) })}
        ${legend(groupSeries)}
      </div>`,
      { icon: 'chart', small: true }
    )}

    <div class="grid grid-2 align-start">
      ${card(
        'IC 家族',
        `<div class="grid grid-2">
          ${metric('IC 胜率', pct(m.ic_win_rate, 1))}
          ${metric('RIR', fmt(m.rir, 3))}
          ${metric('IC 标准差', fmt(m.ic_std, 4))}
          ${metric('头部组超额', pct(m.top_group_excess, 2), tone(m.top_group_excess))}
          ${metric('最大回撤', pct(m.max_drawdown, 2), 'color:hsl(var(--destructive))')}
          ${metric('与既有因子最大 |corr|', fmt(m.pnl_corr_max, 3))}
        </div>`,
        { icon: 'gauge', small: true }
      )}

      ${card(
        '用到的字段与算子',
        `<div class="stack stack-4">
          <div>
            <div class="card-meta">数据字段</div>
            <div class="chips">${f.fields.map((x) => badge(x, 'muted')).join('')}</div>
          </div>
          <div>
            <div class="card-meta">算子</div>
            <div class="chips">${f.ops.map((x) => badge(x, 'primary')).join('')}</div>
          </div>
          <div class="grid grid-2">
            <div class="kv-item"><div class="kv-label">掩码</div><div class="kv-value">${f.mask.length ? esc(f.mask.join('、')) : '无（全样本窗口）'}</div></div>
            <div class="kv-item"><div class="kv-label">聚合</div><div class="kv-value">${esc(f.agg)}</div></div>
          </div>
          <div class="kv-item"><div class="kv-label">回看窗口</div><div class="kv-value">${f.lookback} 日</div></div>
        </div>`,
        { icon: 'tag', small: true }
      )}
    </div>

    ${isPremium
      ? card('三层校验', validation, { icon: 'shield', small: true, accent: 'premium', aside: badge('精品轨专属', 'premium') })
      : card('求值与评估', validation, { icon: 'shield', small: true })}

    ${card(
      `载体原文 · ${isPremium ? 'compute_fn 源码' : 'GP 树文本'}`,
      `<pre class="code-block ${isPremium ? 'tall' : ''}"><code>${isPremium ? highlightCode(f.carrier) : highlightTree(f.carrier)}</code></pre>`,
      { icon: 'code', small: true, accent: isPremium ? 'premium' : '', aside: isPremium ? 'LLM 生成' : '进化生成' }
    )}

    ${card(
      '相关产物',
      `<div class="grid grid-3">
        <a class="prod" href="#/family?id=${encodeURIComponent(f.familyId)}">
          ${icon('layers', 15)}<span>所属族包</span><code>${esc(f.familyId)}</code>
        </a>
        <div class="prod">${icon('database', 15)}<span>因子值视图</span><code>factor_refine</code></div>
        <div class="prod">${icon('file', 15)}<span>入库时间</span><code>${esc(f.createdAt)}</code></div>
      </div>`,
      { small: true }
    )}

    ${card(
      `全部指标`,
      `<div class="table-wrap table-plain"><table class="data">
        <thead><tr><th>指标键</th><th class="num">值</th></tr></thead>
        <tbody>${Object.keys(m).map((k) =>
          `<tr><td><code class="factor-name">${esc(k)}</code></td><td class="num" style="${tone(m[k])}">${fmt(m[k], 4)}</td></tr>`).join('')}</tbody>
      </table></div>`,
      { icon: 'file', small: true, aside: `<b>${Object.keys(m).length}</b> 项` }
    )}
  </div>`;
}

/* ==========================================================================
   视图：族包详情
   ========================================================================== */
function viewFamily(id) {
  const fam = DB.FAMILIES.find((x) => x.id === id);
  if (!fam) return `<div class="empty">未选择族包。</div>`;

  const members = DB.FACTORS.filter((f) => f.familyId === fam.id);
  const isPremium = fam.mode === 'premium';
  const groups = DB.groupPnl(48);
  const groupSeries = groups.map((g, i) => ({
    name: g.name, points: g.points,
    color: g.emphasize ? C.series[2] : C.series[i % C.series.length],
    emphasize: !!g.emphasize,
  }));
  const labels = members.slice(0, 5).map((_, i) => `F${i + 1}`);
  const hero = members.find((f) => f.origin === 'premium') || members[0];

  return `
  <div class="stack stack-6 animate-in">
    <div class="detail-head">
      <button class="btn btn-ghost btn-sm" id="back" type="button">${icon('back', 14)}返回</button>
      <h2 class="detail-title">${esc(fam.direction)} · 族包</h2>
      ${isPremium ? originBadge('premium') : originBadge('fast')}
      <code class="detail-name dim">${esc(fam.id)}</code>
      ${fam.hasBoost ? badge('含 boost 变体', 'primary') : ''}
    </div>

    ${card(
      '这一族是什么',
      `<p class="prose">
        围绕 <b>${esc(fam.direction)}</b> 这一收益来源产出的一组因子，共享同一构造范式
        <b>${esc(fam.paradigm)}</b> 与同一组数据字段。族内因子互为变体，用于对比不同参数与掩码条件下的表现。
      </p>
      <div class="grid grid-4" style="margin-top:18px">
        ${metric('因子数', fam.nFactors)}
        ${metric('保留数', fam.nKept)}
        ${metric('最优 IC', fmt(fam.bestIc, 4), tone(fam.bestIc))}
        ${metric('回看窗口', `${fam.lookback} 日`)}
      </div>`,
      { icon: 'layers', small: true, accent: isPremium ? 'premium' : '' }
    )}

    ${card(
      '本轮方向与注入来源',
      `<div class="grid grid-3">
        <div>
          <div class="card-meta">本轮方向</div>
          <div style="margin-top:6px">${badge(fam.direction, 'primary')}</div>
        </div>
        <div>
          <div class="card-meta">注入的知识库页面</div>
          <div class="chips" style="margin-top:6px">${fam.wikiPages.map((p) =>
            `<a class="chip" href="#/mine">${icon('book', 12)}${esc(p)}</a>`).join('')}</div>
        </div>
        <div>
          <div class="card-meta">数据字段</div>
          <div class="chips" style="margin-top:6px">${fam.fields.map((x) => badge(x, 'muted')).join('')}</div>
        </div>
      </div>`,
      { icon: 'book', small: true }
    )}

    ${isPremium && hero
      ? card(
          '载体原文 · compute_fn 源码',
          `<pre class="code-block tall"><code>${highlightCode(hero.carrier)}</code></pre>`,
          { icon: 'code', small: true, accent: 'premium', aside: '本族代表因子' }
        )
      : ''}

    ${card(
      '这次运行的流水线结果',
      `<div class="chart-block">
        <div class="chart-label">分组 PnL</div>
        ${lineChart(groupSeries, { height: 240, yFmt: (v) => v.toFixed(3) })}
        ${legend(groupSeries)}
      </div>
      <div class="chart-block">
        <div class="chart-label">月度 IC</div>
        ${heatmap(DB.monthlyIc())}
      </div>
      <div class="chart-block">
        <div class="chart-label">族内相关性</div>
        ${corrGrid(labels, DB.corrMatrix(labels))}
      </div>`,
      { icon: 'chart', small: true }
    )}

    ${card(
      `变体族`,
      `<div class="table-wrap table-plain"><table class="data">
        <thead><tr>
          <th>因子</th><th class="num">IC</th><th class="num">Rank IC</th><th class="num">ICIR</th>
          <th>来源</th><th>累积走势</th><th></th>
        </tr></thead>
        <tbody>${members.map((f) => `<tr>
          <td><code class="factor-name">${esc(f.name)}</code></td>
          <td class="num strong" style="${tone(f.metrics.ic)}">${fmt(f.metrics.ic, 4)}</td>
          <td class="num" style="${tone(f.metrics.rank_ic)}">${fmt(f.metrics.rank_ic, 4)}</td>
          <td class="num">${fmt(f.metrics.icir, 3)}</td>
          <td>${originBadge(f.origin)}</td>
          <td>${sparkline(f.spark)}</td>
          <td><a class="link" href="#/detail?f=${encodeURIComponent(f.name)}">详情</a></td>
        </tr>`).join('')}</tbody>
      </table></div>`,
      { icon: 'layers', small: true, aside: `<b>${members.length}</b> 个` }
    )}

    ${card(
      '运行日志',
      `<div class="log-panel compact">${DB.RUN_LOG.slice(-12).map(logLine).join('')}</div>`,
      { icon: 'scroll', small: true }
    )}
  </div>`;
}

/* ==========================================================================
   弹层
   ========================================================================== */
function modalCache() {
  const items = [
    ['面板缓存', 12.4, 128, 0.71], ['相关矩阵缓存', 8.1, 34, 0.64],
    ['因子值分片', 6.8, 29, 0.83], ['去重指纹', 3.2, 17, 0.92], ['检索索引', 2.6, 10, 0.88],
  ];
  const total = items.reduce((a, b) => a + b[1], 0).toFixed(1);
  return `
    <div class="modal-head">
      <h3>缓存库</h3>
      <button class="btn btn-ghost btn-sm" data-close type="button">${icon('x', 14)}</button>
    </div>
    <p class="card-desc">每类缓存的体积 / 命中率 / 可清理量 —— <b>删缓存只影响速度，不改因子值</b>。</p>
    <div class="table-wrap table-plain" style="margin-top:14px"><table class="data">
      <thead><tr><th>类别</th><th class="num">体积</th><th class="num">文件数</th><th class="num">命中率</th></tr></thead>
      <tbody>${items.map(([n, sz, cnt, hit]) =>
        `<tr><td>${esc(n)}</td><td class="num">${sz} GB</td><td class="num">${cnt}</td>
         <td class="num">${pct(hit, 0)}</td></tr>`).join('')}</tbody>
    </table></div>
    <div class="modal-foot">
      <span>合计约 <b>${total} GB</b> · 自动清理默认关闭</span>
      <button class="btn btn-outline btn-sm" data-close type="button">关闭</button>
    </div>`;
}

function modalSettings() {
  const rows = [
    ['并行上限', 'worker 数', '4'],
    ['LLM 重试次数', '失败后重试', '2'],
    ['输出上限', 'tokens', '8192'],
    ['日志级别', '写入详细度', 'info'],
  ];
  return `
    <div class="modal-head">
      <h3>全局设置</h3>
      <button class="btn btn-ghost btn-sm" data-close type="button">${icon('x', 14)}</button>
    </div>
    <p class="card-desc">并行/资源 · LLM 调用 · 日志，收在一处，与「因子挖掘」页的功能配置分开。<b>不影响因子值</b>。</p>
    <div class="rows" style="margin-top:14px">
      ${rows.map(([label, hint, val]) => `
        <div class="setting-row">
          <div><div class="setting-name">${esc(label)}</div><div class="setting-hint">${esc(hint)}</div></div>
          <input class="input" value="${esc(val)}" style="max-width:130px">
        </div>`).join('')}
    </div>
    <div class="modal-foot">
      <span>改动在下次运行生效</span>
      <button class="btn btn-outline btn-sm" data-close type="button">关闭</button>
    </div>`;
}

/* ==========================================================================
   路由
   ========================================================================== */
const state = { origin: '', q: '', sort: { key: 'ic', dir: 'desc' }, mode: 'premium', runTimer: null };

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, query] = raw.split('?');
  return { path: path || 'mine', params: new URLSearchParams(query || '') };
}

function render() {
  const { path, params } = parseHash();
  const app = document.getElementById('app');
  let html = '';
  let active = path;

  resetLogCursor();
  if (path === 'mine') html = viewMine();
  else if (path === 'library') html = viewLibrary(state);
  else if (path === 'data') html = viewData(state);
  else if (path === 'detail') { html = viewDetail(params.get('f')); active = 'mine'; }
  else if (path === 'family') { html = viewFamily(params.get('id')); active = 'mine'; }
  else html = viewMine();

  app.innerHTML = html;
  setNav(active);
  wire();
  if (path === 'mine') selectMode(state.mode);

  const main = document.querySelector('.main');
  if (main && window.scrollY > 0) window.scrollTo({ top: 0 });
}

function setNav(active) {
  document.querySelectorAll('.nav-item').forEach((el) => el.classList.toggle('active', el.dataset.page === active));
}

/* ---------- 交互 ---------- */
function wire() {
  document.querySelectorAll('.nav-item').forEach((el) => {
    el.onclick = () => { location.hash = `#/${el.dataset.page}`; };
  });
  const brand = document.querySelector('.brand');
  if (brand) brand.onclick = () => { location.hash = '#/mine'; };

  const back = document.getElementById('back');
  if (back) back.onclick = () => history.back();

  // 因子库：来源筛选
  document.querySelectorAll('[data-origin]').forEach((el) => {
    el.onclick = () => { state.origin = el.dataset.origin; render(); };
  });

  // 因子库：排序
  document.querySelectorAll('[data-sort]').forEach((el) => {
    el.onclick = () => {
      const key = el.dataset.sort;
      state.sort = state.sort.key === key
        ? { key, dir: state.sort.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'desc' };
      render();
    };
  });

  // 搜索（防抖）
  const search = document.getElementById('search');
  if (search) {
    let t;
    search.oninput = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        state.q = search.value;
        render();
        const el = document.getElementById('search');
        if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
      }, 280);
    };
  }
  const fieldFilter = document.getElementById('field-filter');
  if (fieldFilter) fieldFilter.oninput = () => { state.q = fieldFilter.value; };

  // 行点击
  document.querySelectorAll('[data-factor]').forEach((el) => {
    el.onclick = (e) => {
      if (e.target.closest('a')) return;
      location.hash = `#/detail?f=${encodeURIComponent(el.dataset.factor)}`;
    };
  });

  // 刷新
  const refresh = document.getElementById('refresh');
  if (refresh) {
    refresh.onclick = () => {
      refresh.querySelector('.icon')?.classList.add('spin');
      setTimeout(render, 420);
    };
  }

  // 思路库快捷选取
  document.querySelectorAll('[data-topic]').forEach((el) => {
    el.onclick = () => { const t = document.getElementById('topic'); if (t) t.value = el.dataset.topic; };
  });

  // 模式选择
  document.querySelectorAll('[data-mode]').forEach((el) => {
    el.onclick = () => selectMode(el.dataset.mode);
  });

  const run = document.getElementById('run');
  const stop = document.getElementById('stop');
  if (run && stop) {
    run.onclick = () => startRun(run, stop);
    stop.onclick = () => stopRun(run, stop);
  }

  const mc = document.getElementById('cache-btn');
  if (mc) mc.onclick = () => openModal(modalCache());
  const ms = document.getElementById('settings-btn');
  if (ms) ms.onclick = () => openModal(modalSettings());
}

function selectMode(mode) {
  state.mode = mode;
  document.querySelectorAll('[data-mode]').forEach((el) => {
    el.classList.toggle('primary', el.dataset.mode === mode);
  });
  const nfac = document.getElementById('nfac');
  const gen = document.getElementById('gen');
  const pop = document.getElementById('pop');
  if (mode === 'premium') {
    if (gen) { gen.value = '1'; gen.disabled = true; }
    if (pop) { pop.value = '1'; pop.disabled = true; }
    if (nfac) nfac.disabled = false;
  } else {
    if (gen) { gen.value = '6'; gen.disabled = false; }
    if (pop) { pop.value = '24'; pop.disabled = false; }
    if (nfac) nfac.disabled = true;
  }
}

/* ---------- 运行动画 ---------- */
let running = false;
function startRun(run, stop) {
  if (running) return;
  running = true;
  run.disabled = true;
  stop.disabled = false;
  const st = document.getElementById('run-state');
  if (st) st.innerHTML = badge('运行中', 'warning');

  const bar = document.getElementById('progress');
  const pctEl = document.getElementById('progress-pct');
  const label = document.getElementById('progress-label');
  const stages = [
    [6, '加载注册表…'],
    [16, '三槽组装：思路库 / RAG / 构造范式…'],
    [26, 'prompt 组装完成，调用 LLM…'],
    [40, '第 1 层 静态契约…'],
    [52, '回发模型修正（若需）…'],
    [64, '第 2 层 短窗试算…'],
    [76, '第 3 层 前瞻审计…'],
    [88, '共享后置：去重 / 落库…'],
    [100, '完成'],
  ];
  let i = 0;
  state.runTimer = setInterval(() => {
    if (i >= stages.length) { stopRun(run, stop); if (st) st.innerHTML = badge('已完成', 'success'); return; }
    const [p, text] = stages[i++];
    if (bar) bar.style.width = `${p}%`;
    if (pctEl) pctEl.textContent = `${p}%`;
    if (label) label.textContent = text;
  }, 620);
}

function stopRun(run, stop) {
  clearInterval(state.runTimer);
  state.runTimer = null;
  running = false;
  if (run) run.disabled = false;
  if (stop) stop.disabled = true;
  const bar = document.getElementById('progress');
  if (bar) bar.style.width = '0%';
  const pctEl = document.getElementById('progress-pct');
  if (pctEl) pctEl.textContent = '0%';
  const label = document.getElementById('progress-label');
  if (label) label.textContent = '等待开始';
  const st = document.getElementById('run-state');
  if (st) st.innerHTML = badge('空闲', 'muted');
}

/* ---------- 弹层 ---------- */
function openModal(html) {
  const wrap = document.getElementById('modal');
  wrap.innerHTML = `<div class="modal-backdrop" data-close></div>
    <div class="modal-panel animate-in"><div class="modal-body">${html}</div></div>`;
  wrap.style.display = 'block';
  wrap.querySelectorAll('[data-close]').forEach((el) => { el.onclick = closeModal; });
  document.addEventListener('keydown', escClose);
}
function escClose(e) { if (e.key === 'Escape') closeModal(); }
function closeModal() {
  const wrap = document.getElementById('modal');
  wrap.style.display = 'none';
  wrap.innerHTML = '';
  document.removeEventListener('keydown', escClose);
}

/* ---------- 主题 ---------- */
function initTheme() {
  const saved = localStorage.getItem('fms-theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = saved ? saved === 'dark' : prefersDark;
  document.documentElement.classList.toggle('dark', dark);
  updateThemeIcon(dark);
}
function toggleTheme() {
  const dark = !document.documentElement.classList.contains('dark');
  document.documentElement.classList.toggle('dark', dark);
  localStorage.setItem('fms-theme', dark ? 'dark' : 'light');
  updateThemeIcon(dark);
}
function updateThemeIcon(dark) {
  const btn = document.getElementById('theme-btn');
  if (btn) btn.innerHTML = icon(dark ? 'sun' : 'moon', 16);
}

/* ---------- 启动 ---------- */
initTheme();
document.getElementById('theme-btn').onclick = toggleTheme;
window.addEventListener('hashchange', render);
render();
