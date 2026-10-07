/* ==========================================================================
   factor-mining-showcase — 应用逻辑
   Clean-room 重建：仅还原界面外观与交互。无后端、无网络请求，全部数据来自 data.js。
   ========================================================================== */

import { DB } from './data.js';

/* ---------- 工具 ---------- */
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const fmt = (v, d = 4) => (v === null || v === undefined ? '—' : Number(v).toFixed(d));
const pct = (v, d = 2) => (v === null || v === undefined ? '—' : `${(Number(v) * 100).toFixed(d)}%`);
const signed = (v, d = 4) => `${v >= 0 ? '+' : ''}${Number(v).toFixed(d)}`;

/** 数值着色：正绿负红（A 股习惯红涨，但此处表达「因子质量」故用绿正红负） */
const tone = (v, threshold = 0) => {
  if (v === null || v === undefined) return '';
  return v > threshold ? 'color: hsl(var(--success))' : v < -threshold ? 'color: hsl(var(--destructive))' : '';
};

/* ---------- 图标（内联 SVG，避免外部依赖） ---------- */
const icon = (name, size = 16) => {
  const paths = {
    sparkles: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/>',
    flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    table: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.2 4.2l2.8 2.8M17 17l2.8 2.8M1 12h4M19 12h4M4.2 19.8L7 17M17 7l2.8-2.8"/>',
    hardrive: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M7 14h2"/>',
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
    back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    play: '<path d="M6 4l14 8-14 8z"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  };
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true">${paths[name] || ''}</svg>`;
};

/* ==========================================================================
   图表（手写 SVG）
   ========================================================================== */

/** 折线图。series: [{name, points:number[], color, emphasize?, dash?}] */
function lineChart(series, opts = {}) {
  const {
    height = 210,
    width = 720,
    pad = { t: 12, r: 16, b: 26, l: 46 },
    zeroLine = true,
    xLabels = [],
    yFmt = (v) => v.toFixed(2),
  } = opts;

  const all = series.flatMap((s) => s.points).filter((v) => v !== null && v !== undefined);
  if (!all.length) return '<div class="empty">无数据</div>';

  let min = Math.min(...all);
  let max = Math.max(...all);
  if (zeroLine) { min = Math.min(min, 0); max = Math.max(max, 0); }
  if (min === max) { max = min + 1e-6; }
  const span = max - min;
  min -= span * 0.08;
  max += span * 0.08;

  const n = Math.max(...series.map((s) => s.points.length));
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const X = (i) => pad.l + (n <= 1 ? 0 : (i / (n - 1)) * innerW);
  const Y = (v) => pad.t + innerH - ((v - min) / (max - min)) * innerH;

  const ticks = 5;
  let grid = '';
  for (let k = 0; k <= ticks; k++) {
    const v = min + ((max - min) * k) / ticks;
    const y = Y(v);
    grid += `<line class="chart-grid" x1="${pad.l}" y1="${y.toFixed(1)}" x2="${width - pad.r}" y2="${y.toFixed(1)}" opacity="0.5"/>`;
    grid += `<text class="chart-tick" x="${pad.l - 8}" y="${(y + 3.5).toFixed(1)}" text-anchor="end">${yFmt(v)}</text>`;
  }

  let xAxis = '';
  if (xLabels.length) {
    const step = Math.max(1, Math.ceil(xLabels.length / 8));
    xLabels.forEach((lb, i) => {
      if (i % step !== 0) return;
      xAxis += `<text class="chart-tick" x="${X(i).toFixed(1)}" y="${height - 8}" text-anchor="middle">${esc(lb)}</text>`;
    });
  }

  const zero =
    zeroLine && min < 0 && max > 0
      ? `<line class="chart-axis" x1="${pad.l}" y1="${Y(0).toFixed(1)}" x2="${width - pad.r}" y2="${Y(0).toFixed(1)}" stroke-dasharray="3 3" opacity="0.8"/>`
      : '';

  const paths = series
    .map((s) => {
      const d = s.points
        .map((v, i) => (v === null || v === undefined ? null : `${i === 0 ? 'M' : 'L'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`))
        .filter(Boolean)
        .join(' ');
      const sw = s.emphasize ? 2.4 : 1.7;
      const op = s.emphasize ? 1 : 0.85;
      return `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${sw}" opacity="${op}"
        stroke-linejoin="round" stroke-linecap="round" ${s.dash ? `stroke-dasharray="${s.dash}"` : ''}/>`;
    })
    .join('');

  return `<svg class="chart" viewBox="0 0 ${width} ${height}" width="100%" height="${height}"
      role="img" preserveAspectRatio="xMidYMid meet">
      ${grid}${zero}
      <line class="chart-axis" x1="${pad.l}" y1="${pad.t + innerH}" x2="${width - pad.r}" y2="${pad.t + innerH}"/>
      ${xAxis}${paths}
    </svg>`;
}

/** 图例 */
function legend(series) {
  return `<div class="chart-legend">${series
    .map(
      (s) =>
        `<span class="chart-legend-item"><span class="chart-legend-swatch" style="background:${s.color}"></span>${esc(s.name)}</span>`
    )
    .join('')}</div>`;
}

/** 分段柱状图（用于柱状对比） */
function barChart(items, opts = {}) {
  const { height = 180, width = 720, pad = { t: 12, r: 16, b: 30, l: 46 }, yFmt = (v) => v.toFixed(3) } = opts;
  const vals = items.map((d) => d.value);
  let min = Math.min(...vals, 0);
  let max = Math.max(...vals, 0);
  if (min === max) max = min + 1e-6;
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const bw = (innerW / items.length) * 0.6;
  const Y = (v) => pad.t + innerH - ((v - min) / (max - min)) * innerH;

  const bars = items
    .map((d, i) => {
      const cx = pad.l + (innerW / items.length) * (i + 0.5);
      const y = Y(Math.max(d.value, 0));
      const h = Math.abs(Y(d.value) - Y(0));
      const color = d.value >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))';
      return `<rect x="${(cx - bw / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}"
        height="${Math.max(h, 1).toFixed(1)}" rx="2" fill="${color}" opacity="0.85"/>
        <text class="chart-tick" x="${cx.toFixed(1)}" y="${height - 10}" text-anchor="middle">${esc(d.label)}</text>`;
    })
    .join('');

  const grid = [0, 0.5, 1]
    .map((f) => {
      const v = min + (max - min) * f;
      const y = Y(v);
      return `<line class="chart-grid" x1="${pad.l}" y1="${y.toFixed(1)}" x2="${width - pad.r}" y2="${y.toFixed(1)}" opacity="0.5"/>
        <text class="chart-tick" x="${pad.l - 8}" y="${(y + 3.5).toFixed(1)}" text-anchor="end">${yFmt(v)}</text>`;
    })
    .join('');

  return `<svg class="chart" viewBox="0 0 ${width} ${height}" width="100%" height="${height}"
      role="img" preserveAspectRatio="xMidYMid meet">
      ${grid}
      <line class="chart-axis" x1="${pad.l}" y1="${Y(0).toFixed(1)}" x2="${width - pad.r}" y2="${Y(0).toFixed(1)}"/>
      ${bars}</svg>`;
}

/** 月度 IC 热力图 */
function heatmap(rows) {
  const cell = (v) => {
    if (v === null || v === undefined) return { bg: 'hsl(var(--muted))', fg: 'hsl(var(--muted-foreground))' };
    const a = Math.min(Math.abs(v) / 0.075, 1);
    const positive = v >= 0;
    const bg = positive
      ? `hsl(var(--success) / ${(0.1 + a * 0.75).toFixed(2)})`
      : `hsl(var(--destructive) / ${(0.1 + a * 0.75).toFixed(2)})`;
    return { bg, fg: a > 0.45 ? '#fff' : 'hsl(var(--foreground))' };
  };
  const head = `<tr><th></th>${Array.from({ length: 12 }, (_, i) => `<th style="text-align:center;font-weight:500">${i + 1}月</th>`).join('')}</tr>`;
  const body = rows
    .map(
      (r) =>
        `<tr><td style="font-weight:600">${esc(r.year)}</td>${r.months
          .map((v) => {
            const c = cell(v);
            return `<td style="background:${c.bg};color:${c.fg};text-align:center;font-variant-numeric:tabular-nums">${
              v === null || v === undefined ? '—' : (v * 100).toFixed(1)
            }</td>`;
          })
          .join('')}</tr>`
    )
    .join('');
  return `<div class="table-wrap" style="max-height:none"><table class="data" style="min-width:620px">${head}${body}</table></div>`;
}

/** 相关矩阵（下三角着色） */
function corrGrid(labels, m) {
  const cell = (v) => {
    const a = Math.min(Math.abs(v), 1);
    return v >= 0 ? `hsl(var(--success) / ${(0.06 + a * 0.7).toFixed(2)})` : `hsl(var(--destructive) / ${(0.06 + a * 0.7).toFixed(2)})`;
  };
  const head = `<tr><th></th>${labels.map((l) => `<th style="text-align:center;font-weight:500">${esc(l)}</th>`).join('')}</tr>`;
  const body = m
    .map(
      (row, i) =>
        `<tr><td style="font-weight:600">${esc(labels[i])}</td>${row
          .map((v, j) => {
            const show = j <= i;
            const bg = i === j ? 'hsl(var(--muted))' : show ? cell(v) : 'transparent';
            const fg = i === j ? 'hsl(var(--muted-foreground))' : Math.abs(v) > 0.55 ? '#fff' : 'hsl(var(--foreground))';
            return `<td style="background:${bg};color:${fg};text-align:center;font-variant-numeric:tabular-nums">${
              show ? (i === j ? '1' : v.toFixed(2)) : ''
            }</td>`;
          })
          .join('')}</tr>`
    )
    .join('');
  return `<div class="table-wrap" style="max-height:none"><table class="data" style="min-width:560px">${head}${body}</table></div>`;
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-2))',
  'hsl(200 90% 45%)',
];

/* ==========================================================================
   复用片段
   ========================================================================== */
const card = (title, body, opts = {}) => `
  <section class="card ${opts.hover ? 'card-hover' : ''}">
    ${title
      ? `<div class="card-header"><h3 class="card-title ${opts.small ? 'card-title-sm' : ''}">${
          opts.icon ? icon(opts.icon, opts.small ? 15 : 18) : ''
        }${title}</h3>${opts.desc ? `<p class="card-desc">${opts.desc}</p>` : ''}</div>`
      : ''
    }
    <div class="card-content">${body}</div>
  </section>`;

const metric = (label, value, style = '') => `
  <div class="metric"><div class="metric-label">${esc(label)}</div>
  <div class="metric-value" style="${style}">${value}</div></div>`;

const badge = (text, kind = 'muted') => `<span class="badge badge-${kind}">${esc(text)}</span>`;

const logLine = ([kind, text]) => {
  const t = new Date(Date.UTC(2026, 9, 8, 2, 31, 0) + RUN_LOG_OFFSET(kind)).toISOString().slice(11, 19);
  return `<div class="log-line"><span class="log-time">${t}</span><span class="log-${kind}">${esc(text)}</span></div>`;
};

/* 演示用：把日志时间做成递增的，看起来像真实运行的输出流 */
let _logCursor = 0;
function RUN_LOG_OFFSET() { return (_logCursor += 137) * 1000; }

/* ==========================================================================
   视图：因子挖掘
   ========================================================================== */
function viewMine() {
  const summary = DB.SUMMARY;
  const st = DB.OPERATOR_STATS;

  const families = DB.FAMILIES.map(
    (f) => `
    <a class="card card-hover" href="#/family?id=${encodeURIComponent(f.id)}" style="display:block">
      <div class="card-content" style="padding:16px">
        <div class="row row-between" style="align-items:flex-start;gap:8px">
          <div style="min-width:0">
            <div style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis">${esc(f.direction)} · 族包</div>
            <div class="mono-sm" style="color:hsl(var(--muted-foreground));margin-top:3px">${esc(f.id)}</div>
          </div>
          ${badge(f.mode === 'premium' ? '精品轨' : '快轨', f.mode === 'premium' ? 'primary' : 'muted')}
        </div>
        <div class="row row-gap-3" style="margin-top:12px;font-size:11px;color:hsl(var(--muted-foreground))">
          <span>因子 ${f.nFactors}</span>
          <span>保留 ${f.nKept}</span>
          <span>最优 IC <b style="color:hsl(var(--success))">${fmt(f.bestIc, 4)}</b></span>
        </div>
        <div style="margin-top:10px;padding-top:10px;border-top:1px solid hsl(var(--border) / 0.7);font-size:11px;color:hsl(var(--muted-foreground))">
          范式：${esc(f.paradigm)}
        </div>
      </div>
    </a>`
  ).join('');

  const caps = DB.CAPABILITIES.map(
    (c) => `
    <div class="row row-between" style="padding:10px 0;border-bottom:1px solid hsl(var(--border) / 0.6);gap:10px">
      <div style="min-width:0">
        <div class="row row-gap-2">
          <span class="mono-sm">${esc(c.id)}</span>
          ${badge(c.slot, 'primary')}
          <span style="font-size:12.5px;font-weight:500">${esc(c.name)}</span>
        </div>
        <div style="font-size:11px;color:hsl(var(--muted-foreground));margin-top:4px">
          来源：${esc(c.from)} · ${esc(c.note)}
        </div>
      </div>
      ${c.status === 'pending' ? badge('待放行', 'warning') : badge('已阻塞', 'destructive')}
    </div>`
  ).join('');

  const modeCards = `
    <div class="grid grid-2" style="gap:16px">
      <div class="card card-hover" style="cursor:pointer" data-mode="fast">
        <div class="card-content" style="padding:16px">
          <div class="row row-gap-2" style="font-weight:600;font-size:13.5px">${icon('flask', 16)}快轨 · GP 搜索</div>
          <p style="font-size:11.5px;color:hsl(var(--muted-foreground));margin-top:8px;line-height:1.7">
            遗传编程在<b>被扩充过的</b>搜索空间里进化表达式树。全程零 LLM 调用，一轮约 20–90 秒。
          </p>
          <div class="row row-gap-2" style="margin-top:10px">${badge('零 LLM', 'success')}${badge('分钟级', 'muted')}</div>
        </div>
      </div>
      <div class="card card-hover" style="cursor:pointer" data-mode="premium">
        <div class="card-content" style="padding:16px">
          <div class="row row-gap-2" style="font-weight:600;font-size:13.5px">${icon('sparkles', 16)}精品轨 · LLM 写代码</div>
          <p style="font-size:11.5px;color:hsl(var(--muted-foreground));margin-top:8px;line-height:1.7">
            由模型直接撰写 <code class="mono-sm">compute_fn</code> 源码，一次 LLM 调用产出 2 个因子约 25 秒。
          </p>
          <div class="row row-gap-2" style="margin-top:10px">${badge('LLM 驱动', 'primary')}${badge('表达力不受限', 'muted')}</div>
        </div>
      </div>
    </div>`;

  return `
  <div class="stack stack-6">
    ${card(
      '因子挖掘（统一入口）',
      `
      ${modeCards}

      <div style="margin-top:20px">
        <label class="field-label" for="topic">研究方向</label>
        <textarea id="topic" class="textarea" placeholder="一句话描述要挖的方向，例如「价量背离后的修复」">凸显收益误估</textarea>
        <p class="field-hint">
          方向会同时用于：检索知识库构造范式、组装注入上下文、以及 GP 的算子扩展。
        </p>
      </div>

      <div class="chips" style="margin-top:13px">
        <span style="font-size:11px;color:hsl(var(--muted-foreground))">从思路库快速选取：</span>
        ${DB.DIRECTIONS.slice(0, 6)
          .map((d) => `<button class="chip" data-topic="${esc(d)}">${esc(d)}</button>`)
          .join('')}
      </div>

      <div class="grid grid-4" style="margin-top:20px;gap:14px">
        <div><label class="field-label" for="pop">种群规模 population_size</label><input id="pop" class="input" type="number" value="24"></div>
        <div><label class="field-label" for="gen">迭代代数 n_generations</label><input id="gen" class="input" type="number" value="6"></div>
        <div><label class="field-label" for="topk">保留数 top_k</label><input id="topk" class="input" type="number" value="4"></div>
        <div><label class="field-label" for="nfac">因子数 n_factors</label><input id="nfac" class="input" type="number" value="2" disabled></div>
      </div>

      <div class="row row-gap-3 row-wrap" style="margin-top:20px">
        <button class="btn" id="run">${icon('play', 15)}开始挖掘</button>
        <button class="btn btn-outline" id="stop" disabled>${icon('stop', 15)}停止</button>
        <span class="ml-auto row row-gap-2">
          ${badge('空闲', 'muted')}
        </span>
      </div>

      <div style="margin-top:16px">
        <div class="row row-between" style="font-size:11px;color:hsl(var(--muted-foreground));margin-bottom:6px">
          <span id="progress-label">等待开始</span><span id="progress-pct">0%</span>
        </div>
        <div class="progress"><div class="progress-bar" id="progress" style="width:0%"></div></div>
      </div>
      `,
      { icon: 'flask' }
    )}

    ${card(
      `运行日志（<span id="log-count">${DB.RUN_LOG.length}</span> 行）`,
      `<div class="log-panel" id="log-panel">${DB.RUN_LOG.map(logLine).join('')}</div>`,
      { icon: 'scroll', small: true }
    )}

    ${card(`族包（${DB.FAMILIES.length}）`, `<div class="grid grid-3" style="gap:14px">${families}</div>`, {
      icon: 'layers',
      small: true,
      desc: '两条轨的产物都是族包，汇入同一条共享后置流程。',
    })}

    ${card(
      `能力扩充 · 待放行（${DB.CAPABILITIES.filter((c) => c.status === 'pending').length} 条 · 阻塞 ${
        DB.CAPABILITIES.filter((c) => c.status === 'blocked').length
      }）`,
      `<div>${caps}</div>`,
      {
        icon: 'wrench',
        small: true,
        desc: '知识库的构造范式被翻译成候选算子 / 字段，经可得性闸门校验后进入搜索空间。',
      }
    )}

    ${card(
      `算子库 · 注入目录（${st.native + st.extension} 条：原生 ${st.native} · 能力扩充 ${st.extension}）`,
      `
      <div class="grid grid-4" style="gap:14px">
        ${metric('原生算子', st.native)}
        ${metric('能力扩充', st.extension)}
        ${metric('已停用', st.disabled)}
        ${metric('统一算子目录', st.native + st.extension)}
      </div>
      <p class="field-hint" style="margin-top:14px">
        扩充算子与原生算子同名时会报错退出；被判死的构造范式会永久排除，不会再次注入。
      </p>`,
      { icon: 'toggle', small: true }
    )}

    <div class="demo-footer">
      知识库规模：${summary.nTables} 张表 / ${summary.nVars} 个变量（指纹 ${summary.fingerprint}）·
      族包 ${summary.nFamilies} 个 · 因子 ${summary.nFactors} 个 · 思路库 ${summary.nIdeas} 条（已用 ${summary.ideasUsed}）
    </div>
  </div>`;
}

/* ==========================================================================
   视图：因子库
   ========================================================================== */
function viewLibrary(state) {
  const origin = state.origin || '';
  const q = (state.q || '').toLowerCase();

  let rows = DB.FACTORS.slice();
  if (origin) rows = rows.filter((f) => f.origin === origin);
  if (q) rows = rows.filter((f) => f.name.toLowerCase().includes(q) || f.direction.toLowerCase().includes(q));

  const counts = {
    '': DB.FACTORS.length,
    fast: DB.FACTORS.filter((f) => f.origin === 'fast').length,
    premium: DB.FACTORS.filter((f) => f.origin === 'premium').length,
  };

  const table = rows.length
    ? `
    <div class="table-wrap"><table class="data">
      <thead><tr>
        <th>因子</th><th>来源</th><th>方向</th>
        <th class="num">IC</th><th class="num">Rank IC</th><th class="num">ICIR</th>
        <th class="num">IR</th><th class="num">胜率</th><th class="num">覆盖</th><th class="num">换手</th>
      </tr></thead>
      <tbody>
        ${rows
          .map(
            (f) => `<tr class="clickable" data-factor="${esc(f.name)}">
            <td class="mono-sm">${esc(f.name)}</td>
            <td>${badge(f.origin === 'fast' ? '快轨 GP' : '精品轨 LLM', f.origin === 'fast' ? 'muted' : 'primary')}</td>
            <td>${esc(f.direction)}</td>
            <td class="num" style="${tone(f.metrics.ic)};font-weight:600">${fmt(f.metrics.ic, 4)}</td>
            <td class="num" style="${tone(f.metrics.rank_ic)}">${fmt(f.metrics.rank_ic, 4)}</td>
            <td class="num">${fmt(f.metrics.icir, 3)}</td>
            <td class="num">${fmt(f.metrics.long_short_ir, 3)}</td>
            <td class="num">${pct(f.metrics.ic_win_rate, 1)}</td>
            <td class="num">${pct(f.metrics.coverage, 1)}</td>
            <td class="num">${fmt(f.metrics.turnover, 2)}</td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table></div>`
    : `<div class="empty">索引里还没有因子。去「因子挖掘」跑一次快轨或精品轨即可产出。</div>`;

  return `
  <div class="stack stack-6">
    <div class="row row-gap-3 row-wrap">
      <h2 style="font-size:18px">因子库</h2>
      <span style="font-size:12px;color:hsl(var(--muted-foreground))">
        统一索引：快轨 GP + 精品轨 LLM，同一套评测口径（IC 家族）
      </span>
      <button class="btn btn-outline btn-sm ml-auto" id="refresh">${icon('refresh', 14)}刷新</button>
    </div>

    <div class="row row-gap-3 row-wrap">
      <div class="chips">
        ${[
          ['', '全部来源'],
          ['fast', '只要快轨（GP）'],
          ['premium', '只要精品轨（LLM）'],
        ]
          .map(
            ([v, label]) =>
              `<button class="chip ${origin === v ? 'active' : ''}" data-origin="${v}">${esc(label)}<span class="count">${counts[v]}</span></button>`
          )
          .join('')}
      </div>
      <input class="input" id="search" placeholder="按因子名或方向搜索…" value="${esc(state.q || '')}"
        style="max-width:280px;margin-left:auto">
    </div>

    ${card('', table, {})}
  </div>`;
}

/* ==========================================================================
   视图：数据
   ========================================================================== */
function viewData(state) {
  const s = DB.SUMMARY;
  const q = (state.q || '').toLowerCase();
  const rows = q ? DB.TABLES.filter((t) => t.name.includes(q) || t.label.includes(q) || t.category.includes(q)) : DB.TABLES;
  const selected = state.selected || ['收盘价', '成交总量', '大单', '换手率'];

  const table = `
    <div class="table-wrap"><table class="data">
      <thead><tr>
        <th>表</th><th>说明</th><th>类别</th>
        <th class="num">变量数</th><th>起始</th><th>结束</th><th class="num">天数</th>
      </tr></thead>
      <tbody>${rows
        .map(
          (t) => `<tr>
          <td class="mono-sm">${esc(t.name)}</td>
          <td>${esc(t.label)}</td>
          <td>${badge(t.category, t.category === '量价' ? 'muted' : t.category === '基本面' ? 'primary' : 'warning')}</td>
          <td class="num">${t.vars}</td>
          <td class="mono-sm">${esc(t.start)}</td>
          <td class="mono-sm">${esc(t.end)}</td>
          <td class="num">${t.days}</td>
        </tr>`
        )
        .join('')}</tbody>
    </table></div>`;

  return `
  <div class="stack stack-6">
    <div class="row row-gap-3 row-wrap">
      <h2 style="font-size:18px">数据</h2>
      <span style="font-size:12px;color:hsl(var(--muted-foreground))">可用数据范围与字段覆盖</span>
    </div>

    ${card(
      '当前生效（只读）',
      `<div class="grid grid-4" style="gap:14px">
        <div class="kv-item"><div class="kv-label">数据根</div><div class="kv-value mono-sm">${esc(s.dataRoot)}</div></div>
        <div class="kv-item"><div class="kv-label">数据窗口</div><div class="kv-value mono-sm">${esc(s.window)}</div></div>
        <div class="kv-item"><div class="kv-label">注册表规模</div><div class="kv-value">${s.nTables} 张表 / ${s.nVars} 变量</div></div>
        <div class="kv-item"><div class="kv-label">指纹</div><div class="kv-value mono-sm">${esc(s.fingerprint)}</div></div>
      </div>`,
      { icon: 'database', small: true }
    )}

    ${card(
      `选择可用字段（${selected.length} 个已选）`,
      `
      <div class="row row-gap-3" style="margin-bottom:14px">
        <input class="input" id="field-filter" placeholder="筛选表名 / 说明 / 类别…" value="${esc(state.q || '')}" style="max-width:320px">
      </div>
      <div class="chips" style="margin-bottom:16px">
        <span style="font-size:11px;color:hsl(var(--muted-foreground))">内置预设按数据来源类别：</span>
        ${DB.FIELD_TYPES.map((t) => `<button class="chip" data-cat="${esc(t)}">${esc(t)}</button>`).join('')}
      </div>
      ${table}
      <div class="notice notice-warn" style="margin-top:16px">
        <span class="notice-icon">${icon('warn', 15)}</span>
        <div><b>频率后缀不是「注册一下就能用」</b>：整条流水线是单一频率的。
        当前注册表只覆盖日频变量，混频需要另做设计。</div>
      </div>`,
      { icon: 'table', small: true }
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
  const icSeriesData = [
    { name: 'IC', points: ic.map((p) => p.ic), color: CHART_COLORS[0] },
  ];
  const cumSeries = [{ name: '累积 IC', points: ic.map((p) => p.cum), color: CHART_COLORS[2], emphasize: true }];
  const groups = DB.groupPnl(48);
  const groupSeries = groups.map((g, i) => ({
    name: g.name,
    points: g.points,
    color: g.emphasize ? 'hsl(var(--chart-5))' : CHART_COLORS[i % CHART_COLORS.length],
    emphasize: !!g.emphasize,
  }));

  const m = f.metrics;
  const metricKeys = Object.keys(m);

  const carrier = f.kind === 'tree'
    ? `[滚动相关(20)](
  [归一化失衡](大单, 小单),
  [换手率]
) × [符号]([截面排名]([凸显系数](收盘价, 20)))`
    : `@register("${f.name}")
def compute_fn(df):
    # 凸显权重 × 收益 的截面协方差
    ref = df.groupby("Datetime")["close"].transform("median")
    sigma = (df["close"] - ref).abs() / (df["close"].abs() + 1e-9)
    rank = sigma.groupby(df["Datetime"]).rank(ascending=False)
    omega = (0.7 ** rank) / (0.7 ** rank).groupby(df["Datetime"]).transform("sum")
    r = df["close"].pct_change(${f.lookback})
    return omega.mul(r).groupby(df["Datetime"]).transform("mean")`;

  return `
  <div class="stack stack-6 animate-in">
    <div class="row row-gap-3 row-wrap">
      <button class="btn btn-ghost btn-sm" id="back">${icon('back', 14)}返回因子库</button>
      <h2 style="font-size:18px" class="mono-sm">${esc(f.name)}</h2>
      ${badge(f.origin === 'fast' ? '快轨 GP' : '精品轨 LLM', f.origin === 'fast' ? 'muted' : 'primary')}
      ${badge(f.direction, 'primary')}
    </div>

    <div class="grid grid-4" style="gap:14px">
      ${metric('IC', fmt(m.ic, 4), tone(m.ic))}
      ${metric('Rank IC', fmt(m.rank_ic, 4), tone(m.rank_ic))}
      ${metric('ICIR', fmt(m.icir, 3))}
      ${metric('IC t 值', fmt(m.ic_t, 2))}
    </div>

    ${card(
      '因子表现（曲线图）',
      `
      <div style="margin-bottom:6px;font-size:12px;font-weight:500">IC 时序</div>
      ${lineChart(icSeriesData, { yFmt: (v) => v.toFixed(3) })}
      <hr class="divider" style="margin:20px 0">
      <div style="margin-bottom:6px;font-size:12px;font-weight:500">累积 IC</div>
      ${lineChart(cumSeries, { yFmt: (v) => v.toFixed(2) })}
      <hr class="divider" style="margin:20px 0">
      <div style="margin-bottom:6px;font-size:12px;font-weight:500">分组 PnL（Q1–Q5 与多空）</div>
      ${lineChart(groupSeries, { height: 240, yFmt: (v) => v.toFixed(3) })}
      ${legend(groupSeries)}
      `,
      { icon: 'chart', small: true }
    )}

    <div class="grid grid-2" style="gap:24px;align-items:start">
      ${card(
        'IC 家族',
        `<div class="grid grid-2" style="gap:12px">
          ${metric('IC 胜率', pct(m.ic_win_rate, 1))}
          ${metric('RIR', fmt(m.rir, 3))}
          ${metric('多空 IR', fmt(m.long_short_ir, 3))}
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
            <div class="card-meta" style="margin-bottom:6px">数据字段</div>
            <div class="chips">${f.fields.map((x) => badge(x, 'muted')).join('')}</div>
          </div>
          <div>
            <div class="card-meta" style="margin-bottom:6px">算子</div>
            <div class="chips">${f.ops.map((x) => badge(x, 'primary')).join('')}</div>
          </div>
          <div class="grid grid-2" style="gap:12px">
            <div class="kv-item"><div class="kv-label">掩码</div><div class="kv-value">${f.mask.length ? esc(f.mask.join('、')) : '无（全样本窗口）'}</div></div>
            <div class="kv-item"><div class="kv-label">聚合</div><div class="kv-value">${esc(f.agg)}</div></div>
          </div>
          <div class="kv-item"><div class="kv-label">回看窗口</div><div class="kv-value">${f.lookback} 日</div></div>
        </div>`,
        { icon: 'tag', small: true }
      )}
    </div>

    ${card(
      `载体（${f.kind === 'code' ? 'LLM 写的 compute_fn' : 'GP 树文本'}）`,
      `<pre class="code-block">${esc(carrier)}</pre>`,
      { icon: 'flask', small: true }
    )}

    ${card(
      `全部指标（${metricKeys.length} 项）`,
      `<div class="table-wrap" style="max-height:none"><table class="data">
        <thead><tr><th>指标键</th><th class="num">值</th></tr></thead>
        <tbody>${metricKeys
          .map((k) => `<tr><td class="mono-sm">${esc(k)}</td><td class="num" style="${tone(m[k])}">${fmt(m[k], 4)}</td></tr>`)
          .join('')}</tbody>
      </table></div>`,
      { icon: 'file', small: true }
    )}

    ${card(
      '相关产物',
      `<div class="stack stack-2" style="font-size:12px">
        <a href="#/family?id=${encodeURIComponent(f.familyId)}" style="color:hsl(var(--primary))">→ 所属族包 ${esc(f.familyId)}</a>
        <span style="color:hsl(var(--muted-foreground))">→ 因子值视图：<span class="mono-sm">factor_refine</span></span>
        <span style="color:hsl(var(--muted-foreground))">→ 入库时间：<span class="mono-sm">${esc(f.createdAt)}</span></span>
      </div>`,
      { small: true }
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
  const groups = DB.groupPnl(48);
  const groupSeries = groups.map((g, i) => ({
    name: g.name,
    points: g.points,
    color: g.emphasize ? 'hsl(var(--chart-5))' : CHART_COLORS[i % CHART_COLORS.length],
    emphasize: !!g.emphasize,
  }));

  const labels = members.slice(0, 5).map((_, i) => `F${i + 1}`);
  const corr = DB.corrMatrix(labels);

  const variants = members
    .map(
      (f, i) => `<tr>
      <td class="mono-sm">${esc(f.name)}</td>
      <td class="num" style="${tone(f.metrics.ic)}">${fmt(f.metrics.ic, 4)}</td>
      <td class="num" style="${tone(f.metrics.rank_ic)}">${fmt(f.metrics.rank_ic, 4)}</td>
      <td class="num">${fmt(f.metrics.icir, 3)}</td>
      <td>${badge(f.origin === 'fast' ? '快轨' : '精品轨', f.origin === 'fast' ? 'muted' : 'primary')}</td>
      <td><a href="#/detail?f=${encodeURIComponent(f.name)}" style="color:hsl(var(--primary))">详情</a></td>
    </tr>`
    )
    .join('');

  const corpus = members
    .slice(0, 1)
    .map((f) => (f.kind === 'tree'
      ? `[协方差聚合](
  [凸显权重]([凸显系数](收盘价, 20)),
  [收益率](收盘价, 1)
)`
      : `def compute_fn(df):
    # 凸显权重 × 收益 协方差（STR）
    ...
    return str_col`))
    .join('');

  return `
  <div class="stack stack-6 animate-in">
    <div class="row row-gap-3 row-wrap">
      <button class="btn btn-ghost btn-sm" id="back">${icon('back', 14)}返回因子挖掘</button>
      <h2 style="font-size:18px">${esc(fam.direction)} · 族包</h2>
      ${badge(fam.mode === 'premium' ? '精品轨' : '快轨', fam.mode === 'premium' ? 'primary' : 'muted')}
      <span class="mono-sm" style="color:hsl(var(--muted-foreground))">${esc(fam.id)}</span>
    </div>

    ${card(
      '这一族是什么',
      `<p style="font-size:13px;line-height:1.85">
        围绕<b>${esc(fam.direction)}</b>这一收益来源产出的一组因子，共享同一构造范式
        <b>${esc(fam.paradigm)}</b> 与同一组数据字段。族内因子互为变体，用于对比不同参数与掩码条件下的表现。
      </p>
      <div class="grid grid-4" style="gap:14px;margin-top:16px">
        ${metric('因子数', fam.nFactors)}
        ${metric('保留数', fam.nKept)}
        ${metric('最优 IC', fmt(fam.bestIc, 4), tone(fam.bestIc))}
        ${metric('回看窗口', `${fam.lookback} 日`)}
      </div>`,
      { icon: 'layers', small: true }
    )}

    ${card(
      '本轮方向与注入来源',
      `<div class="stack stack-4">
        <div>
          <div class="card-meta" style="margin-bottom:6px">本轮方向</div>
          <div>${badge(fam.direction, 'primary')}</div>
        </div>
        <div>
          <div class="card-meta" style="margin-bottom:6px">注入的知识库页面</div>
          <div class="chips">${fam.wikiPages.map((p) => `<a class="chip" href="#">${esc(p)}</a>`).join('')}</div>
        </div>
        <div>
          <div class="card-meta" style="margin-bottom:6px">数据字段</div>
          <div class="chips">${fam.fields.map((x) => badge(x, 'muted')).join('')}</div>
        </div>
      </div>`,
      { icon: 'book', small: true }
    )}

    ${card(
      '这次运行的流水线结果',
      `
      <div style="margin-bottom:6px;font-size:12px;font-weight:500">分组 PnL</div>
      ${lineChart(groupSeries, { height: 230, yFmt: (v) => v.toFixed(3) })}
      ${legend(groupSeries)}
      <hr class="divider" style="margin:20px 0">
      <div style="margin-bottom:10px;font-size:12px;font-weight:500">月度 IC</div>
      ${heatmap(DB.monthlyIc())}
      <hr class="divider" style="margin:20px 0">
      <div style="margin-bottom:10px;font-size:12px;font-weight:500">族内相关性</div>
      ${corrGrid(labels, corr)}
      `,
      { icon: 'file', small: true }
    )}

    ${card(
      `变体族（${members.length}）`,
      `<div class="table-wrap" style="max-height:none"><table class="data">
        <thead><tr><th>因子</th><th class="num">IC</th><th class="num">Rank IC</th><th class="num">ICIR</th><th>来源</th><th></th></tr></thead>
        <tbody>${variants}</tbody>
      </table></div>`,
      { icon: 'layers', small: true }
    )}

    ${card(
      '载体原文（快轨 = 树文本 / 精品轨 = compute_fn 源码）',
      `<pre class="code-block">${esc(corpus)}</pre>`,
      { icon: 'file', small: true }
    )}

    ${card(
      `运行日志`,
      `<div class="log-panel">${DB.RUN_LOG.slice(-12).map(logLine).join('')}</div>`,
      { icon: 'scroll', small: true }
    )}
  </div>`;
}

/* ==========================================================================
   弹层：缓存库 / 全局设置
   ========================================================================== */
function modalCache() {
  const items = [
    ['面板缓存', '12.4 GB', 38, 0.71],
    ['相关矩阵缓存', '8.1 GB', 34, 0.64],
    ['因子值分片', '6.8 GB', 29, 0.83],
    ['去重指纹', '3.2 GB', 17, 0.92],
    ['检索索引', '2.6 GB', 10, 0.88],
  ];
  const total = items.reduce((a, b) => a + parseFloat(b[1]), 0).toFixed(1);
  return `
    <h3 style="font-size:16px;margin-bottom:4px">缓存库</h3>
    <p class="card-desc" style="margin-bottom:16px">每类缓存的体积 / 命中率 / 可清理量 —— <b>删缓存只影响速度，不改因子值</b>。</p>
    <div class="table-wrap" style="max-height:none"><table class="data">
      <thead><tr><th>类别</th><th class="num">体积</th><th class="num">文件数</th><th class="num">命中率</th></tr></thead>
      <tbody>${items
        .map(
          ([n, sz, cnt, hit]) =>
            `<tr><td>${esc(n)}</td><td class="num">${esc(sz)}</td><td class="num">${cnt}</td><td class="num">${pct(hit, 0)}</td></tr>`
        )
        .join('')}</tbody>
    </table></div>
    <div class="row row-between" style="margin-top:16px;font-size:12px">
      <span style="color:hsl(var(--muted-foreground))">合计约 <b>${total} GB</b> · 自动清理默认关闭</span>
      <button class="btn btn-outline btn-sm" data-close>关闭</button>
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
    <h3 style="font-size:16px;margin-bottom:4px">全局设置</h3>
    <p class="card-desc" style="margin-bottom:16px">并行/资源 · LLM 调用 · 日志，收在一处，与「因子挖掘」页的功能配置分开。<b>不影响因子值</b>。</p>
    <div class="stack stack-3">
      ${rows
        .map(
          ([label, hint, val]) => `
        <div class="row row-between" style="gap:16px;padding:10px 0;border-bottom:1px solid hsl(var(--border) / 0.6)">
          <div><div style="font-size:13px;font-weight:500">${esc(label)}</div>
          <div style="font-size:11px;color:hsl(var(--muted-foreground))">${esc(hint)}</div></div>
          <input class="input" value="${esc(val)}" style="max-width:130px">
        </div>`
        )
        .join('')}
    </div>
    <div class="row row-between" style="margin-top:16px">
      <span style="font-size:11px;color:hsl(var(--muted-foreground))">改动在下次运行生效</span>
      <button class="btn btn-outline btn-sm" data-close>关闭</button>
    </div>`;
}

/* ==========================================================================
   路由与渲染
   ========================================================================== */
const state = { origin: '', q: '', selected: null, runTimer: null };

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, query] = raw.split('?');
  const params = new URLSearchParams(query || '');
  return { path: path || 'mine', params };
}

function render() {
  const { path, params } = parseHash();
  const app = document.getElementById('app');
  let html = '';
  let active = path;

  if (path === 'mine') html = viewMine();
  else if (path === 'library') html = viewLibrary(state);
  else if (path === 'data') html = viewData(state);
  else if (path === 'detail') { html = viewDetail(params.get('f')); active = 'mine'; }
  else if (path === 'family') { html = viewFamily(params.get('id')); active = 'mine'; }
  else html = viewMine();

  app.innerHTML = html;
  setNav(active);
  wire();
  window.scrollTo({ top: 0, behavior: path === 'detail' || path === 'family' ? 'auto' : 'auto' });
}

function setNav(active) {
  document.querySelectorAll('.nav-item').forEach((el) => {
    el.classList.toggle('active', el.dataset.page === active);
  });
}

/* ---------- 交互绑定 ---------- */
function wire() {
  // 导航
  document.querySelectorAll('.nav-item').forEach((el) => {
    el.onclick = () => { location.hash = `#/${el.dataset.page}`; };
  });
  document.querySelector('.brand').onclick = () => { location.hash = '#/mine'; };

  // 返回
  const back = document.getElementById('back');
  if (back) back.onclick = () => history.back();

  // 因子库筛选
  document.querySelectorAll('[data-origin]').forEach((el) => {
    el.onclick = () => { state.origin = el.dataset.origin; render(); };
  });
  const search = document.getElementById('search');
  if (search) {
    let t;
    search.oninput = () => {
      clearTimeout(t);
      t = setTimeout(() => { state.q = search.value; render(); focusSearch(); }, 250);
    };
  }
  const fieldFilter = document.getElementById('field-filter');
  if (fieldFilter) fieldFilter.oninput = () => { state.q = fieldFilter.value; };

  // 行点击进详情
  document.querySelectorAll('[data-factor]').forEach((el) => {
    el.onclick = (e) => {
      if (e.target.closest('a')) return;
      location.hash = `#/detail?f=${encodeURIComponent(el.dataset.factor)}`;
    };
  });

  // 刷新（演示：重新渲染）
  const refresh = document.getElementById('refresh');
  if (refresh) refresh.onclick = () => { refresh.classList.add('spin'); setTimeout(render, 400); };

  // 研究方向快捷选取
  document.querySelectorAll('[data-topic]').forEach((el) => {
    el.onclick = () => { const t = document.getElementById('topic'); if (t) t.value = el.dataset.topic; };
  });

  // 模式卡片
  document.querySelectorAll('[data-mode]').forEach((el) => {
    el.onclick = () => {
      document.querySelectorAll('[data-mode]').forEach((c) => {
        c.style.borderColor = 'hsl(var(--border))';
        c.style.boxShadow = 'none';
      });
      el.style.borderColor = 'hsl(var(--primary))';
      el.style.boxShadow = '0 0 0 3px hsl(var(--primary) / 0.12)';
      const nf = document.getElementById('nfac');
      if (nf) nf.disabled = el.dataset.mode !== 'premium';
    };
  });

  // 运行 / 停止（演示动画）
  const run = document.getElementById('run');
  const stop = document.getElementById('stop');
  if (run && stop) {
    run.onclick = () => startRun(run, stop);
    stop.onclick = () => stopRun(run, stop);
  }

  // 弹层
  const mc = document.getElementById('cache-btn');
  if (mc) mc.onclick = () => openModal(modalCache());
  const ms = document.getElementById('settings-btn');
  if (ms) ms.onclick = () => openModal(modalSettings());
}

function focusSearch() {
  const el = document.getElementById('search');
  if (el) { el.focus(); const v = el.value; el.setSelectionRange(v.length, v.length); }
}

/* ---------- 演示用的「运行」动画 ---------- */
let running = false;
function startRun(run, stop) {
  if (running) return;
  running = true;
  run.disabled = true;
  stop.disabled = false;

  const bar = document.getElementById('progress');
  const pctEl = document.getElementById('progress-pct');
  const label = document.getElementById('progress-label');
  const stages = [
    [6, '加载注册表…'],
    [16, '检索知识库构造范式…'],
    [30, '能力扩充闸门校验…'],
    [44, '注入算子与参数网格…'],
    [58, 'GP gen 1/6 …'],
    [70, 'GP gen 3/6 …'],
    [82, 'GP gen 6/6 …'],
    [90, '共享后置：去重 / 前瞻审计 / 落库…'],
    [100, '完成'],
  ];
  let i = 0;
  state.runTimer = setInterval(() => {
    if (i >= stages.length) { stopRun(run, stop); return; }
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
}

/* ---------- 弹层 ---------- */
function openModal(contentHtml) {
  const wrap = document.getElementById('modal');
  wrap.innerHTML = `
    <div class="modal-backdrop" data-close></div>
    <div class="modal-panel animate-in">
      <div class="card-content">${contentHtml}</div>
    </div>`;
  wrap.style.display = 'block';
  wrap.querySelectorAll('[data-close]').forEach((el) => { el.onclick = closeModal; });
}
function closeModal() {
  const wrap = document.getElementById('modal');
  wrap.style.display = 'none';
  wrap.innerHTML = '';
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
