# Case Report Trends

## Purpose

离线查看肿瘤标志物报告趋势和明细表。页面上半部分显示多指标折线趋势，下半部分显示原始报告记录，适合把后续真实报告数据替换进同一数据结构后复用。

## Files

- `web/case-report-trends.html`: 视图、样式、SVG 图表渲染、日期悬浮提示和筛选交互。
- `web/case-report-trends-data.js`: 唯一运行时数据源，导出为 `window.CASE_REPORT_TRENDS_DATA`。
- `web/config.json`: Sessio 应用元数据。
- `AGENTS.md`: 这份契约、数据结构、更新说明和验证记录。

## App metadata

`web/config.json` 必须是有效 JSON，且包含这 6 个必需字符串字段：

```json
{
  "nameZh": "病例报告趋势",
  "nameEn": "Case Report Trends",
  "description": "离线查看肿瘤标志物报告趋势和明细表。",
  "author": "Alex",
  "email": "alex@example.com",
  "version": "1.0.0"
}
```

## Run and preview

浏览器直接打开 `web/case-report-trends.html` 即可，不需要服务器、网络或构建步骤。

Sessio 预览：打开 `web/case-report-trends.html`，允许 inline JavaScript。页面通过同目录相对路径加载 `./case-report-trends-data.js`。

## Data structure

### Root object: `window.CASE_REPORT_TRENDS_DATA`

| Field | Type | Required | Description | Example |
|---|---:|:---:|---|---|
| `schemaVersion` | number | yes | 数据结构版本；当前实现只接受 `1`。 | `1` |
| `meta` | object | yes | 页面标题和坐标轴元信息。 | `{ title: "Case Report Trends" }` |
| `series` | array | yes | 指标序列元数据，决定图例、颜色和筛选项。 | `[{ key: "CEA", label: "CEA", color: "#8bc34a", visible: true }]` |
| `records` | array | yes | 报告明细记录。 | `[{ reportedAt: "2024-04-16 10:15:00", englishName: "CEA", value: 10.4 }]` |

### `meta` object

| Field | Type | Required | Description | Example |
|---|---:|:---:|---|---|
| `title` | string | yes | 页面主标题。 | `"Case Report Trends"` |
| `subtitle` | string | no | 标题下说明文本。 | `"Tumor marker report values over time with source table"` |
| `yAxisLabel` | string | no | Y 轴语义标签。 | `"值"` |
| `xAxisLabel` | string | no | X 轴语义标签。 | `"报告日期"` |

### Series object: `series[]`

| Field | Type | Required | Description | Example |
|---|---:|:---:|---|---|
| `key` | string | yes | 指标稳定键；HTML 会归一化大小写和符号，`CA19-9` 和 `CA199` 会匹配到同一键。 | `"CA199"` |
| `label` | string | yes | 图例和筛选控件显示名称。 | `"CA199"` |
| `color` | string | yes | SVG 折线和点颜色，CSS 颜色字符串。 | `"#f4c542"` |
| `visible` | boolean | no | 数据维护提示字段；`false` 时默认隐藏该序列。 | `true` |

### Record object: `records[]`

| Field | Type | Required | Description | Example |
|---|---:|:---:|---|---|
| `reportedAt` | string | yes | 报告时间，格式 `YYYY-MM-DD HH:mm:ss`。用于 X 轴和表格排序。 | `"2024-04-16 10:15:00"` |
| `hospital` | string | yes | 检测医院。用于表格和医院筛选。 | `"赤峰市医院"` |
| `chineseName` | string | yes | 中文项目名。用于表格、搜索和悬浮提示。 | `"癌胚抗原(CEA)测定"` |
| `englishName` | string | yes | 英文指标名。用于序列归类、表格和筛选。 | `"CEA"` |
| `value` | number | yes | 检测值，必须是有限数字。 | `10.4` |
| `unit` | string | yes | 当前记录单位，直接显示在表格和悬浮提示中。 | `"ng/ml"` |
| `range` | string | yes | 参考范围原文，页面不解析，只显示。 | `"0-5"` |
| `flag` | string | no | 状态提示；`high` 显示 `↑`，`low` 显示 `↓`，其他值按正常显示。 | `"high"` |

## Example data

```js
window.CASE_REPORT_TRENDS_DATA = {
  schemaVersion: 1,
  meta: {
    title: "Case Report Trends",
    subtitle: "Tumor marker report values over time with source table",
    yAxisLabel: "值",
    xAxisLabel: "报告日期"
  },
  series: [
    { key: "CEA", label: "CEA", color: "#8bc34a", visible: true }
  ],
  records: [
    {
      reportedAt: "2024-04-16 10:15:00",
      hospital: "赤峰市医院",
      chineseName: "癌胚抗原(CEA)测定",
      englishName: "CEA",
      value: 10.4,
      unit: "ng/ml",
      range: "0-5",
      flag: "high"
    }
  ]
};
```

## Updating data

只改 `web/case-report-trends-data.js`。保留 `window.CASE_REPORT_TRENDS_DATA`、`schemaVersion: 1`、`series` 和 `records` 字段。新增指标时同步添加 `series[]` 元数据；如果没有添加，HTML 会用灰色 fallback 显示该指标。

当前数据是按报告截图手工转写和补齐的示例数据，不应当被当作完整病历。替换成真实数据时，建议从原始表格导出后生成同结构 JS，避免在 HTML 中写死记录。这个页面没有运行时导入器；如果后续用图片、文档或自由文本更新数据，应先离线提取并逐字段映射到上面的 schema，无法可靠映射的内容不要写入数据文件。

## Data usage

页面只读取 `meta.title`、`meta.subtitle`、`meta.yAxisLabel`、`meta.xAxisLabel`、`series.key`、`series.label`、`series.color`、`series.visible` 以及每条记录的 `reportedAt`、`hospital`、`chineseName`、`englishName`、`value`、`unit`、`range`、`flag`。

HTML 会把 `englishName` 归一化后与 `series.key` 匹配，按 `reportedAt` 排序，按医院、指标和搜索词过滤，并把同一天的数据聚成图表悬浮提示。表格直接显示原始字段，`flag` 为 `high` 或 `low` 时会显示箭头并给整行加淡红背景。

数据是本地示例数据，只在页面内使用，不会发送到网络或写入后端。离线打开时没有网络传输。

## Installed location

开发源文件位于 `/Users/alex/.sessio-dev/projects/Dev/apps/case-report-trends/`。按 Sessio 约定，验证后的安装副本位于 `/Users/alex/.sessio-dev/apps/case-report-trends/`，页面与数据位于该目录下的 `web/`。

## Limitations and validation

- 页面离线运行，不加载 CDN、字体、图片、XHR 或后端接口。
- 缺少或无效的 `window.CASE_REPORT_TRENDS_DATA` 会显示可见错误状态。
- 图表使用所有指标的原始值共用一个 Y 轴；不同单位共轴适合复刻截图和观察趋势，不适合精确跨单位比较。
- 已验证 HTML 引用同目录数据 JS，数据文件可被 JS 引擎解析，页面在桌面宽度和窄屏宽度都能渲染，医院筛选可更新图表与表格，图表日期悬浮提示可显示该日期全部指标，高于或低于参考范围的记录行都会显示淡红色背景。发布后安装副本包含 `CLAUDE.md`。
