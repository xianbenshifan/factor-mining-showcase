/* ==========================================================================
   factor-mining-showcase — 演示数据集
   --------------------------------------------------------------------------
   ⚠️ 全部为**合成数据**，用于界面演示，不代表任何真实回测结果。
   研究方向的命名取自展示者本人知识库中的 alpha 页，用以体现「知识库参与搜索」。
   数值由固定种子的伪随机数生成，保证每次刷新一致。
   ========================================================================== */

const SEED = 20261008;

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
  '凸显收益误估', '隔夜信息反应不足', '量激增注意力', '超大单冲击回补',
  '知情卖出信号', '极端涨幅彩票', '活跃度条件反转', '跳跃风险补偿',
  '非流动性与冲击补偿', '日内路径反转', '时段信息扩散', '邻码注意力溢出',
  '跟随大单过度反应', '连续波动补偿', '支撑阻力动量衰减', '处置效应筹码',
  '彩票型波动高估', '正跳跃追逐', '大小单博弈', '信息冲击消化滞后',
];

const PARADIGMS = [
  '凸显权重收益协方差', '修正的隔夜反转', '修正的日内反转', '偏锋涨跌幅',
  '信噪比增强反转', '主力波动率', '价变共振', '残差反转',
  '知情主卖占比', '跳跃波动率', '量涌波动率', '特质隔夜收益波动率',
];

const FIELD_POOL = [
  '收盘价', '开盘价', '最高价', '最低价', '成交均价',
  '成交总量', '成交额', '换手率', '振幅',
  '大单', '超大单', '中单', '小单',
  '主动成交', '被动成交', '撤单', '净主动成交额',
  '盘口快照', '最优档深度', '总深度', '相对价差',
  '流通市值', '总市值', '账面市值比', '净资产收益率',
];

const OP_POOL = [
  '滚动均值', '滚动标准差', '滚动相关', '滚动排名', '滚动分位数',
  '整窗口z得分', '整窗口分位数', '时序平移', '差分', '线性衰减',
  '截面排名', '截面z得分', 'MAD去极值', '行业中性化', '组内中性化',
  '缺失值补齐', '绝对值', '符号', '安全除', '对数压缩', '带符号对数',
  '分位分桶', '收益率变换', '条件派生', '归一化失衡',
];

const AGG_POOL = ['均值聚合', '基础统计聚合', '偏度聚合', '协方差聚合', '双列相关聚合', '掩码占比聚合', '极差聚合'];
const MASK_POOL = ['阈值掩码', 'TopK排序掩码', '振幅掩码', '趋势掩码', '跳跃示性掩码', '时段掩码', '订单规模掩码'];

/* ---------- 精品轨载体样本（LLM 写的 compute_fn，演示用） ---------- */
const CODE_SAMPLES = [
{
  carrier: 'code',
  paradigm: '凸显权重收益协方差',
  code: `@register("salience_str")
def compute_fn(df):
    """凸显权重 × 收益 的截面协方差（STR）"""
    # 参照点取全市场中位数：比均值稳健，不受极端个股牵引
    ref = df.groupby("Datetime")["close"].transform("median")
    sigma = (df["close"] - ref).abs() / (df["close"].abs() + 1e-9)

    # 窗口内按凸显系数降序排名（最凸显 = 1）
    rank = sigma.groupby("Datetime").rank(ascending=False)

    # delta^k 形式的认知衰减权重，再按日归一化
    delta = 0.7
    omega = delta ** rank
    omega = omega / omega.groupby("Datetime").transform("sum")

    # 凸显度与收益的协方差 —— 高 STR = 显眼时恰好涨，心理放大 → 高估
    r = df["close"].pct_change(20)
    return omega.mul(r)`,
},
{
  carrier: 'code',
  paradigm: '修正的隔夜反转',
  code: `@register("overnight_reversal_adj")
def compute_fn(df):
    """剔除开盘竞价噪声后的隔夜反转"""
    prev_close = df.groupby("Contract")["close"].shift(1)
    overnight = df["open"] / prev_close - 1

    # 用当日振幅对隔夜收益做尺度归一，避免高低波动股混在一起比
    amp = (df["high"] - df["low"]) / prev_close
    amp_ma = amp.groupby("Contract").transform(
        lambda s: s.rolling(20, min_periods=10).mean()
    )
    scaled = overnight / (amp_ma + 1e-9)

    # 截面去极值后再反转
    lo = scaled.groupby("Datetime").transform(lambda s: s.quantile(0.01))
    hi = scaled.groupby("Datetime").transform(lambda s: s.quantile(0.99))
    clipped = scaled.clip(lo, hi)
    return -clipped`,
},
{
  carrier: 'code',
  paradigm: '量涌波动率',
  code: `@register("volume_surge_attention")
def compute_fn(df):
    """成交量突增把该时刻变成醒目事件，注意力被吸走后价格反转"""
    vol = df["volume"]
    base = vol.groupby("Contract").transform(
        lambda s: s.rolling(60, min_periods=30).median()
    )
    surge = vol / (base + 1e-9)

    # 仅在「显著放量」的交易日上取信号，其余置 0（掩码语义）
    mask = (surge > 2.0).astype(float)

    # 放量日的日内收益
    intraday = df["close"] / df["open"] - 1
    signal = (surge * intraday * mask)
    return -signal.groupby("Datetime").transform("mean")`,
},
{
  carrier: 'code',
  paradigm: '剔除超大单后的大单涨跌幅',
  code: `@register("large_order_impact_recovery")
def compute_fn(df):
    """超大单冲击后的回补：资金冲击推离价格，随后部分回流"""
    mega = df["mega_order_net"]
    large = df["large_order_net"]

    # 剔除超大单，只看普通大单，避免把「知情冲击」与「跟随噪声」混为一谈
    pure = large - mega

    m = pure.groupby("Contract").transform(
        lambda s: s.rolling(20, min_periods=15).mean()
    )
    sd = pure.groupby("Contract").transform(
        lambda s: s.rolling(20, min_periods=15).std()
    )
    z = (pure - m) / (sd + 1e-9)

    # 冲击强度 × 后续回补方向
    ret = df["close"].pct_change(5)
    return (z * ret).groupby("Datetime").transform("median")`,
},
];

/* ---------- 快轨载体样本（GP 树文本） ---------- */
const TREE_SAMPLES = [
  `[协方差聚合](
  [凸显权重]([凸显系数](收盘价, 20)),
  [收益率](收盘价, 1)
)`,
  `[截面排名](
  [整窗口z得分](
    [归一化失衡](大单, 小单), 20
  )
)`,
  `[线性衰减](
  [滚动相关](换手率, 绝对收盘收益, 20), 5
)`,
];

/* ---------- 生成一个因子 ---------- */
function makeFactor(i, direction, origin) {
  const ic = round(between(0.012, 0.058), 4);
  const rankIc = round(ic * between(0.9, 1.06), 4);
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

  // 快轨取树文本样本；精品轨取 code 样本
  const isPremium = origin === 'premium';
  const sample = isPremium ? pick(CODE_SAMPLES) : null;
  const carrier = isPremium ? sample.code : pick(TREE_SAMPLES);
  const paradigm = isPremium ? sample.paradigm : pick(PARADIGMS);

  // 迷你走势（列表内联 sparkline）
  const spark = [];
  let acc = 0;
  for (let k = 0; k < 24; k++) {
    acc += ic + (rnd() - 0.5) * ic * 3;
    spark.push(round(acc, 5));
  }

  return {
    name: origin === 'fast'
      ? `${direction}_gp_${String(i).padStart(3, '0')}`
      : `${direction}_llm_${String(i).padStart(3, '0')}`,
    displayName: direction,
    origin,
    kind: isPremium ? 'code' : 'tree',
    familyId: `fam_${String(1000 + (i % 9)).slice(0, 4)}`,
    direction,
    paradigm,
    carrier,
    fields,
    ops,
    mask: rnd() > 0.55 ? [pick(MASK_POOL)] : [],
    agg: pick(AGG_POOL),
    lookback,
    createdAt: `2026-10-${String(1 + (i % 7)).padStart(2, '0')}`,
    spark,
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

const FACTORS = [];
let fi = 1;
DIRECTIONS.forEach((d, idx) => {
  // 精品轨为本演示的主角 —— 提高其出现比重
  const origin = idx % 3 === 0 ? 'fast' : 'premium';
  FACTORS.push(makeFactor(fi++, d, origin));
  if (idx % 2 === 0) FACTORS.push(makeFactor(fi++, d, 'premium'));
  if (idx % 5 === 0) FACTORS.push(makeFactor(fi++, d, 'fast'));
});

/* ---------- 族包 ---------- */
const FAMILIES = Array.from({ length: 9 }, (_, i) => {
  const id = `fam_${String(1000 + i).slice(0, 4)}`;
  const members = FACTORS.filter((f) => f.familyId === id);
  const base = members[0] || FACTORS[i];
  const best = members.reduce((a, b) => (b.metrics.ic > a.metrics.ic ? b : a), base);
  const hasPremium = members.some((m) => m.origin === 'premium');
  return {
    id,
    direction: base.direction,
    mode: hasPremium ? 'premium' : 'fast',
    paradigm: base.paradigm,
    nFactors: members.length,
    nKept: Math.max(1, members.length - (i % 2)),
    bestIc: best.metrics.ic,
    createdAt: `2026-10-${String(1 + i).padStart(2, '0')} 1${i}:2${i}`,
    wikiPages: [base.direction, base.paradigm, pick(PARADIGMS)],
    fields: base.fields,
    lookback: base.lookback,
    hasBoost: i % 4 === 0,
  };
});

/* ---------- 精品轨：三槽注入 ---------- */
const PREMIUM_SLOTS = [
  {
    key: 'directions',
    label: '① 思路库',
    sub: 'directions_text',
    desc: '按与方向的相关度排序取候选思路，已用过的标注状态',
    items: ['凸显收益误估', '偏锋涨跌幅', '凸显权重收益协方差', '惊恐因子'],
    meta: '候选 6 条 · 已用 2 条',
  },
  {
    key: 'rag',
    label: '② 知识库检索',
    sub: 'wiki_context',
    desc: '以方向为主词做混合检索（BM25 + 向量）后精排',
    items: ['凸显权重收益协方差 § 构造要点', '凸显权重 § 金融解释', '行为金融凸显理论 § 理论定义'],
    meta: '召回 24 段 · 精排后注入 3 段',
  },
  {
    key: 'pattern',
    label: '③ 构造范式',
    sub: 'pattern_context',
    desc: '按方向挑出的构造范式，给出流水线各段取值与参数',
    items: ['凸显权重收益协方差', '凸显权重', '协方差聚合'],
    meta: '命中 3 个范式 · pipeline 段齐全',
  },
];

/* ---------- 精品轨：三层校验 ---------- */
const VALIDATION_LAYERS = [
  {
    n: 1,
    name: '静态契约',
    brief: '每 Contract 一行 · 恰一个非 Contract 列 · 无 Datetime',
    in: 4,
    out: 3,
    rejected: [{ name: 'overnight_llm_003', reason: '返回了 2 个非 Contract 列' }],
  },
  {
    n: 2,
    name: '短窗试算',
    brief: '真编译真跑 probe_days，抓编译错与类型错',
    in: 3,
    out: 3,
    rejected: [],
  },
  {
    n: 3,
    name: '前瞻审计',
    brief: '截断面板逐点比对 T 处取值，抓未来信息',
    in: 3,
    out: 3,
    rejected: [],
    note: '结果侧判定，未通过只剔除、不发回模型',
  },
];

/* ---------- 精品轨：自动改错 ---------- */
const REPAIR_ROUNDS = [
  {
    round: 1,
    reason: '静态契约未通过：返回列含 Datetime',
    action: '同一对话下一拍，仅附失败说明',
    result: '已修正',
  },
  {
    round: 2,
    reason: '短窗试算抛异常：rolling.std 在 min_periods 不足时全 NaN',
    action: '同一对话下一拍，仅附失败说明',
    result: '已修正（补 min_periods=15）',
  },
];

/* ---------- boost：变体进化 ---------- */
const BOOST_DIMENSIONS = [
  { name: '参数', detail: '窗口 20 → 5 / 60', applied: true },
  { name: '参照点', detail: '全市场中位数 → 行业中位数', applied: true },
  { name: '聚合', detail: '协方差 → 秩相关', applied: false },
  { name: '掩码', detail: '叠加「显著事件后 N 日」区间', applied: true },
];

/* ---------- 运行日志（精品轨一次运行） ---------- */
const RUN_LOG = [
  ['info', 'refine mine --mode premium --topic "凸显收益误估" --n_factors 2'],
  ['info', 'load registry: 15 tables / 213 variables (fingerprint 3448b5a3e9ca3b97)'],
  ['ok', 'registry fingerprint verified · 数据窗口 2018-01-02 ~ 2026-09-30'],
  ['info', '三槽组装：思路库 6 条 · RAG 召回 24 段精排取 3 · 范式命中 3 个'],
  ['info', '注入可用字段清单（scope 裁剪后 213 → 42）与「本轮可调用算子」目录（137 条）'],
  ['ok', 'prompt 组装完成（约 6.4k tokens）'],
  ['info', 'LLM 调用 #1 → 返回 4 个 {name, code, fields, max_lookback}'],
  ['info', '第 1 层 静态契约：3 通过 / 1 淘汰（overnight_llm_003 返回 2 个非 Contract 列）'],
  ['warn', '回发模型修正（第 1 次）：仅附失败说明，不重述原任务'],
  ['ok', 'LLM 调用 #2 → 修正后通过静态契约'],
  ['info', '第 2 层 短窗试算（probe_days=250）：3 通过 / 0 淘汰'],
  ['info', '第 3 层 前瞻审计：截断面板逐点比对 → 3 通过 / 0 淘汰'],
  ['ok', '三层校验完成：3 个因子进入共享后置'],
  ['info', '共享后置：算值 → 相关性去重 → 落库 → 记账 → 生成看板 bundle'],
  ['ok', '去重：3 个保留（action=mark）'],
  ['ok', '落库：factor_refine 视图写入 3 列 · 记账 3 条'],
  ['dim', 'bundle → _mined/ 草稿回写完成'],
  ['ok', 'run finished in 41.7s · kept 3 / attempted 4 · LLM 调用 2 次'],
];

/* ---------- 能力扩充 ---------- */
const CAPABILITIES = [
  { id: 'cap_1041', slot: 'field', name: '凸显系数_市场自适应', status: 'pending', from: '凸显权重收益协方差', note: '参照点由全市场中位数改为行业中位数' },
  { id: 'cap_1042', slot: 'op', name: '滚动偏锋度', status: 'pending', from: '偏锋涨跌幅', note: '窗口内离群偏离的标准化三阶量' },
  { id: 'cap_1043', slot: 'mask', name: '注意力衰减窗口掩码', status: 'pending', from: '行为金融凸显理论', note: '显著事件后 N 日的衰减区间' },
  { id: 'cap_1044', slot: 'agg', name: '状态条件协方差', status: 'pending', from: '协方差聚合', note: '仅在两状态掩码内求协方差' },
  { id: 'cap_1039', slot: 'field', name: '分析师预期修正', status: 'blocked', from: '标准化预期外盈利', note: '缺少依赖字段：注册表中无该变量' },
  { id: 'cap_1036', slot: 'op', name: '分钟级残差算子', status: 'blocked', from: '高频特异波动率', note: '当前流水线为单一频率，无分钟表' },
];

const OPERATOR_STATS = { native: 103, extension: 34, disabled: 2 };

/* ---------- 数据目录 ---------- */
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

const IDEAS = DIRECTIONS.slice(0, 10).map((d, i) => ({
  title: d,
  relevance: round(0.94 - i * 0.061, 3),
  used: i % 3 !== 0,
  group: i % 4 === 0 ? 'alpha' : 'paradigm',
  pages: 1 + Math.floor(rnd() * 4),
}));

/* ---------- 图表序列 ---------- */
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
  const ls = [];
  let v = 0;
  for (let i = 0; i < n; i++) {
    v += 0.0009 + (rnd() - 0.5) * 0.004;
    ls.push(v);
  }
  series.push({ name: '多空', points: ls, emphasize: true });
  return series;
}

function monthlyIc() {
  const years = ['2022', '2023', '2024', '2025', '2026'];
  const rows = years.map((y) => ({
    year: y,
    months: Array.from({ length: 12 }, () => round(between(-0.045, 0.072), 4)),
  }));
  rows[rows.length - 1].months = rows[rows.length - 1].months.map((v, i) => (i < 9 ? v : null));
  return rows;
}

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

const SUMMARY = {
  nTables: 15,
  nVars: 213,
  fingerprint: '3448b5a3e9ca3b97',
  nFamilies: FAMILIES.length,
  nFactors: FACTORS.length,
  nPremium: FACTORS.filter((f) => f.origin === 'premium').length,
  nFast: FACTORS.filter((f) => f.origin === 'fast').length,
  nIdeas: 390,
  ideasUsed: 75,
  window: '2018-01-02 ~ 2026-09-30',
  dataRoot: '/data/storage',
  maxRepair: 2,
  probeDays: 250,
};

export const DB = {
  DIRECTIONS, PARADIGMS, FACTORS, FAMILIES,
  PREMIUM_SLOTS, VALIDATION_LAYERS, REPAIR_ROUNDS, BOOST_DIMENSIONS,
  RUN_LOG, CAPABILITIES, OPERATOR_STATS, TABLES, FIELD_TYPES, IDEAS, SUMMARY,
  icSeries, groupPnl, monthlyIc, corrMatrix,
};
