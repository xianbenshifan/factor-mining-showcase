/* ==========================================================================
   factor-mining-showcase — 演示数据集
   --------------------------------------------------------------------------
   ⚠️ 全部为**合成数据**，用于界面演示，不代表任何真实回测结果。
   研究方向的命名取自展示者本人知识库中的 alpha 页，用以体现「知识库参与搜索」。
   数值由固定种子的伪随机数生成，保证每次刷新一致。
   ========================================================================== */

const SEED = 20261008;

/* ---------- 固定种子随机数（保证展示稳定） ---------- */
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(SEED);
const between = (lo, hi) => lo + rnd() * (hi - lo);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const round = (x, d = 4) => Number(x.toFixed(d));

/* ---------- 研究方向（取自知识库 alpha 页命名） ---------- */
const DIRECTIONS = [
  '凸显收益误估',
  '隔夜信息反应不足',
  '量激增注意力',
  '超大单冲击回补',
  '知情卖出信号',
  '极端涨幅彩票',
  '活跃度条件反转',
  '跳跃风险补偿',
  '非流动性与冲击补偿',
  '日内路径反转',
  '时段信息扩散',
  '邻码注意力溢出',
  '跟随大单过度反应',
  '连续波动补偿',
  '支撑阻力动量衰减',
  '处置效应筹码',
  '彩票型波动高估',
  '正跳跃追逐',
  '大小单博弈',
  '信息冲击消化滞后',
];

/* ---------- 构造范式（知识库 paradigms） ---------- */
const PARADIGMS = [
  '凸显权重收益协方差',
  '修正的隔夜反转',
  '修正的日内反转',
  '偏锋涨跌幅',
  '信噪比增强反转',
  '主力波动率',
  '价变共振',
  '残差反转',
  '知情主卖占比',
  '跳跃波动率',
  '量涌波动率',
  '特质隔夜收益波动率',
];

/* ---------- 载体用到的数据字段（知识库 data-semantics 命名） ---------- */
const FIELD_POOL = [
  '收盘价', '开盘价', '最高价', '最低价', '成交均价',
  '成交总量', '成交额', '换手率', '振幅',
  '大单', '超大单', '中单', '小单',
  '主动成交', '被动成交', '撤单', '净主动成交额',
  '盘口快照', '最优档深度', '总深度', '相对价差',
  '流通市值', '总市值', '账面市值比', '净资产收益率',
];

/* ---------- 算子目录（知识库 patterns） ---------- */
const OP_POOL = [
  '滚动均值', '滚动标准差', '滚动相关', '滚动排名', '滚动分位数',
  '整窗口z得分', '整窗口分位数', '时序平移', '差分', '线性衰减',
  '截面排名', '截面z得分', 'MAD去极值', '行业中性化', '组内中性化',
  '缺失值补齐', '绝对值', '符号', '安全除', '对数压缩', '带符号对数',
  '分位分桶', '收益率变换', '条件派生', '归一化失衡',
];

const AGG_POOL = ['均值聚合', '基础统计聚合', '偏度聚合', '协方差聚合', '双列相关聚合', '掩码占比聚合', '极差聚合'];
const MASK_POOL = ['阈值掩码', 'TopK排序掩码', '振幅掩码', '趋势掩码', '跳跃示性掩码', '时段掩码', '订单规模掩码'];

/* ---------- 生成一个因子 ---------- */
const KIND_LABEL = { fast: 'GP 树', premium: 'LLM 代码' };

function makeFactor(i, direction, origin) {
  const ic = round(between(0.012, 0.058), 4);
  const rankIc = round(ic * between(0.9, 1.06), 4);
  // 先定 ICIR 目标区间，再反推 IC 标准差 —— 保证 ICIR 落在日频因子的现实范围内
  const targetIcir = between(0.28, 0.92);
  const icir = round(targetIcir, 3);
  const rir = round(icir * between(0.85, 1.08), 3);
  const winRate = round(between(0.5, 0.62), 3);

  const nFields = 2 + Math.floor(rnd() * 3);
  const nOps = 2 + Math.floor(rnd() * 4);
  const fields = [];
  for (let k = 0; k < nFields; k++) {
    const f = pick(FIELD_POOL);
    if (!fields.includes(f)) fields.push(f);
  }
  const ops = [];
  for (let k = 0; k < nOps; k++) {
    const o = pick(OP_POOL);
    if (!ops.includes(o)) ops.push(o);
  }
  const lookback = pick([5, 10, 20, 20, 20, 30, 60]);

  const name = origin === 'fast'
    ? `${direction}_gp_${String(i).padStart(3, '0')}`
    : `${direction}_llm_${String(i).padStart(3, '0')}`;

  return {
    name,
    displayName: direction,
    origin,
    kind: origin === 'fast' ? 'tree' : 'code',
    familyId: `fam_${String(1000 + (i % 8)).slice(0, 4)}`,
    direction,
    paradigm: pick(PARADIGMS),
    fields,
    ops,
    mask: rnd() > 0.55 ? [pick(MASK_POOL)] : [],
    agg: pick(AGG_POOL),
    lookback,
    createdAt: `2026-10-${String(1 + (i % 7)).padStart(2, '0')}`,
    metrics: {
      ic,
      rank_ic: rankIc,
      icir,
      rir,
      ic_win_rate: winRate,
      ic_t: round(icir * Math.sqrt(between(60, 120)), 2),
      coverage: round(between(0.86, 0.99), 3),
      turnover: round(between(0.08, 0.42), 3),
      long_short_ir: round(between(0.5, 1.75), 3),
      top_group_excess: round(between(0.02, 0.14), 4),
      max_drawdown: round(between(0.04, 0.19), 4),
      pnl_corr_max: round(between(0.15, 0.72), 3),
      ic_std: round(ic / targetIcir, 4),
    },
  };
}

/* ---------- 组装因子池 ---------- */
const FACTORS = [];
let fi = 1;
DIRECTIONS.forEach((d, idx) => {
  const origin = idx % 5 === 0 ? 'premium' : 'fast';
  FACTORS.push(makeFactor(fi++, d, origin));
  if (idx % 3 === 0) FACTORS.push(makeFactor(fi++, d, 'fast'));
  if (idx % 7 === 0) FACTORS.push(makeFactor(fi++, d, 'premium'));
});

/* ---------- 族包 ---------- */
const FAMILIES = Array.from({ length: 8 }, (_, i) => {
  const members = FACTORS.filter((f) => f.familyId === `fam_${String(1000 + i).slice(0, 4)}`);
  const base = members[0] || FACTORS[i];
  const best = members.reduce((a, b) => (b.metrics.ic > a.metrics.ic ? b : a), base);
  return {
    id: base.familyId,
    name: `${base.direction} · 族包`,
    direction: base.direction,
    mode: members.some((m) => m.origin === 'premium') ? 'premium' : 'fast',
    paradigm: base.paradigm,
    nFactors: members.length,
    nKept: Math.max(1, members.length - (i % 2)),
    bestIc: best.metrics.ic,
    createdAt: `2026-10-${String(1 + i).padStart(2, '0')} 1${i}:2${i}`,
    wikiPages: [base.direction, base.paradigm, pick(PARADIGMS)],
    fields: base.fields,
    lookback: base.lookback,
  };
});

/* ---------- 运行日志（一次快轨运行） ---------- */
const RUN_LOG = [
  ['info', 'refine mine --mode fast --topic "凸显收益误估" --population_size 24 --n_generations 6'],
  ['info', 'load registry: 15 tables / 213 variables (fingerprint 3448b5a3e9ca3b97)'],
  ['ok', 'registry fingerprint verified · 数据窗口 2018-01-02 ~ 2026-09-30'],
  ['info', 'pick_patterns(topic) → 命中知识库 4 页：凸显收益误估 / 凸显权重收益协方差 / 偏锋涨跌幅 / 行为金融凸显理论'],
  ['info', 'capability expansion: translate patterns → ExpansionSpec(field/op/mask/agg)'],
  ['ok', 'gate: 未来信息检查通过 · schema 校验通过 · depends 均在注册表内 · 试跑通过 → 放行 3 条'],
  ['warn', 'gate: 1 条未通过（引用字段「分析师预期修正」不在注册表）→ blocked'],
  ['info', 'OPS 注入：原生 103 + 已放行扩充 34 → 137；param_grids 已更新'],
  ['info', 'GP 初始化种群 |P0| = 24'],
  ['info', 'gen 1/6  best |ICIR|(val) = 0.412   worst = 0.087   elapsed 11.4s'],
  ['info', 'gen 2/6  best |ICIR|(val) = 0.538   worst = 0.094   elapsed 23.1s'],
  ['info', 'gen 3/6  best |ICIR|(val) = 0.671   worst = 0.121   elapsed 35.6s'],
  ['info', 'gen 4/6  best |ICIR|(val) = 0.729   worst = 0.118   elapsed 47.2s'],
  ['info', 'gen 5/6  best |ICIR|(val) = 0.784   worst = 0.133   elapsed 59.8s'],
  ['info', 'gen 6/6  best |ICIR|(val) = 0.801   worst = 0.140   elapsed 71.5s'],
  ['ok', 'top-K 选择完成 → 4 个候选（按 val，短窗回退 train）'],
  ['info', '共享后置：算值 → 相关性去重 → 前瞻审计 → 落库 → 记账 → 生成看板 bundle'],
  ['ok', '去重：3 个保留（1 个与既有因子 |corr| > 0.85，action=drop）'],
  ['ok', '前瞻审计：4/4 通过（截断面板逐点比对）'],
  ['ok', '落库：factor_refine 视图写入 3 列 · 记账 3 条'],
  ['dim', 'bundle → _mined/ 草稿回写完成'],
  ['ok', 'run finished in 78.3s · kept 3 / attempted 4'],
];

/* ---------- 能力扩充（待放行 / 阻塞） ---------- */
const CAPABILITIES = [
  { id: 'cap_1041', slot: 'field', name: '凸显系数_市场自适应', status: 'pending', from: '凸显权重收益协方差', note: '参照点由全市场中位数改为行业中位数' },
  { id: 'cap_1042', slot: 'op', name: '滚动偏锋度', status: 'pending', from: '偏锋涨跌幅', note: '窗口内离群偏离的标准化三阶量' },
  { id: 'cap_1043', slot: 'mask', name: '注意力衰减窗口掩码', status: 'pending', from: '行为金融凸显理论', note: '显著事件后 N 日的衰减区间' },
  { id: 'cap_1044', slot: 'agg', name: '状态条件协方差', status: 'pending', from: '协方差聚合', note: '仅在两状态掩码内求协方差' },
  { id: 'cap_1039', slot: 'field', name: '分析师预期修正', status: 'blocked', from: '标准化预期外盈利', note: '缺少依赖字段：注册表中无该变量' },
  { id: 'cap_1036', slot: 'op', name: '分钟级残差算子', status: 'blocked', from: '高频特异波动率', note: '当前流水线为单一频率，无分钟表' },
];

/* ---------- 算子目录统计 ---------- */
const OPERATOR_STATS = { native: 103, extension: 34, stale: 0, disabled: 2 };

/* ---------- 数据目录（每张表 / 字段的覆盖） ---------- */
const TABLES = [
  { name: 'price_daily', label: '日频量价', category: '量价', vars: 42, start: '2018-01-02', end: '2026-09-30', days: 2114 },
  { name: 'trade_detail', label: '逐笔成交', category: '量价', vars: 28, start: '2019-03-01', end: '2026-09-30', days: 1842 },
  { name: 'order_book', label: '盘口快照', category: '量价', vars: 31, start: '2019-03-01', end: '2026-09-30', days: 1842 },
  { name: 'cancel_order', label: '撤单明细', category: '量价', vars: 18, start: '2020-01-02', end: '2026-09-30', days: 1620 },
  { name: 'fundamental_q', label: '单季财务', category: '基本面', vars: 56, start: '2018-03-31', end: '2026-06-30', days: 34 },
  { name: 'consensus', label: '一致预期', category: '另类', vars: 24, start: '2019-01-02', end: '2026-09-30', days: 1880 },
  { name: 'margin_trade', label: '融资融券', category: '量价', vars: 14, start: '2018-01-02', end: '2026-09-30', days: 2114 },
];

const FIELD_TYPES = ['量价', '基本面', '另类'];

/* ---------- 思路库（来自知识库的检索候选） ---------- */
const IDEAS = DIRECTIONS.slice(0, 10).map((d, i) => ({
  title: d,
  relevance: round(0.94 - i * 0.061, 3),
  used: i % 3 !== 0,
  group: i % 4 === 0 ? 'alpha' : 'paradigm',
  pages: 1 + Math.floor(rnd() * 4),
}));

/* ---------- 图表序列生成 ---------- */
/** IC 时序：围绕均值波动 */
function icSeries(mean, n = 60) {
  const out = [];
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const v = mean + (rnd() - 0.5) * mean * 2.4;
    acc += v;
    out.push({ i, ic: round(v, 4), cum: round(acc, 4) });
  }
  return out;
}

/** 分组 PnL：前 5 组 + 多空组合的累计收益曲线 */
function groupPnl(n = 48) {
  const groups = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'];
  const series = groups.map((g, gi) => {
    const drift = (gi - 2) * -0.00035 + (gi === 4 ? 0.0006 : 0) + (gi === 0 ? -0.0006 : 0);
    const pts = [];
    let v = 0;
    for (let i = 0; i < n; i++) {
      v += drift + (rnd() - 0.5) * 0.007;
      pts.push(v);
    }
    return { name: g, points: pts };
  });
  // 多空：Q1 - Q5（此处展示 Q5 减 Q1 的常规口径）
  const ls = [];
  let v = 0;
  for (let i = 0; i < n; i++) {
    v += 0.0009 + (rnd() - 0.5) * 0.004;
    ls.push(v);
  }
  series.push({ name: '多空', points: ls, emphasize: true });
  return series;
}

/** 月度 IC 热力图数据：year × month */
function monthlyIc() {
  const years = ['2022', '2023', '2024', '2025', '2026'];
  const rows = years.map((y) => ({
    year: y,
    months: Array.from({ length: 12 }, () => round(between(-0.045, 0.072), 4)),
  }));
  // 2026 只到 9 月
  rows[rows.length - 1].months = rows[rows.length - 1].months.map((v, i) => (i < 9 ? v : null));
  return rows;
}

/** 相关矩阵：n×n 对称 */
function corrMatrix(labels) {
  const n = labels.length;
  const m = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      const v = i === j ? 1 : round(between(-0.42, 0.78), 2);
      m[i][j] = v;
      m[j][i] = v;
    }
  }
  return m;
}

/* ---------- 汇总 ---------- */
const SUMMARY = {
  nTables: 15,
  nVars: 213,
  fingerprint: '3448b5a3e9ca3b97',
  nFamilies: FAMILIES.length,
  nFactors: FACTORS.length,
  nIdeas: 390,
  ideasUsed: 75,
  window: '2018-01-02 ~ 2026-09-30',
  dataRoot: '/data/storage',
};

export const DB = {
  DIRECTIONS,
  PARADIGMS,
  FACTORS,
  FAMILIES,
  RUN_LOG,
  CAPABILITIES,
  OPERATOR_STATS,
  TABLES,
  FIELD_TYPES,
  IDEAS,
  SUMMARY,
  KIND_LABEL,
  icSeries,
  groupPnl,
  monthlyIc,
  corrMatrix,
};
