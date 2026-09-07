# 家谱树

## Purpose

离线展示家族代际、父母关系、配偶关系、人物详情，并遵循 Sessio 的明暗主题契约。页面适合维护者把真实家谱数据替换进同一数据结构后复用，也适合在 Sessio 里作为可视化家谱工具预览。

## Files

- `web/family-tree.html`: 视图、样式、树图布局、筛选、缩放、PNG 截图导出、Sessio 主题适配和人物详情交互。
- `web/family-tree-data.js`: 唯一运行时数据源，导出为 `window.FAMILY_TREE_DATA`。
- `web/config.json`: Sessio 应用元数据和权限声明。
- `AGENTS.md`: 这份契约、数据结构、更新说明和验证记录。

## App metadata

`web/config.json` 必须是有效 JSON，包含 6 个必需字符串字段，并通过 `downloads` 允许截图下载和 Sessio 文件写入：

```json
{
  "nameZh": "家谱树",
  "nameEn": "Family Tree",
  "description": "离线展示家谱树、人物关系和人物详情，遵循 Sessio 明暗主题契约。",
  "author": "Alex",
  "email": "alex@example.com",
  "version": "1.4.0",
  "permissions": ["downloads"]
}
```

## Run and preview

浏览器直接打开 `web/family-tree.html` 即可，不需要服务器、网络或构建步骤。主画布占满可用视口高度，鼠标滚轮调整缩放，按住鼠标左键拖动画布平移。默认不选中任何人；`适配视图` 在无选中时按当前可见节点的整体包围盒居中并缩放到尽量铺满画布，在有选中人物时以该节点为中心显示。右侧详情边栏只在选中人物后显示，清空选中后自动隐藏并让画布占满横向空间。

Sessio 预览：打开 `web/family-tree.html`，允许 inline JavaScript。页面读取 `:root[data-sessio-theme="light|dark"]`，并把 `--sessio-chat-background` 作为画布背景；CSS 会自动适配 Sessio 主题变化，不需要额外的 JavaScript 重绘。浏览器单独打开时，如果没有 Sessio 根属性，页面回退到 `prefers-color-scheme`。
页面通过同目录相对路径加载 `./family-tree-data.js`。

点击 `保存截图` 会导出当前代际筛选和“显示配偶”状态下的完整树画布，导出范围不受当前视口的缩放和平移影响。在 Sessio 中，PNG 通过文件写入桥保存到 `web/screenshots/family-tree-<UTC时间戳>.png`；文件名唯一，写入请求使用 `overwrite: false`。直接在浏览器中打开时，页面使用浏览器下载保存同名 PNG。

## Data structure

### Root object: `window.FAMILY_TREE_DATA`

| Field | Type | Required | Description | Example |
|---|---:|:---:|---|---|
| `schemaVersion` | number | yes | 数据结构版本；当前实现只接受 `1`。 | `1` |
| `meta` | object | yes | 页面标题、说明和数据来源说明。 | `{ title: "刘氏家谱树" }` |
| `records` | array | yes | 人物记录数组。 | `[{ id: "p001", name: "刘天", generation: 1 }]` |

### `meta` object

| Field | Type | Required | Description | Example |
|---|---:|:---:|---|---|
| `title` | string | no | 页面主标题；缺省显示 `家谱树`。 | `"刘氏家谱树"` |
| `subtitle` | string | no | 标题下说明文本；缺省显示通用说明。 | `"按代际、父母关系和家庭排行展示直系家族成员及配偶。"` |
| `familyName` | string | no | 家族名称，仅作为数据说明保留，当前 HTML 不直接显示。 | `"刘氏"` |
| `sourceNote` | string | no | 数据来源说明，仅作为维护说明保留，当前 HTML 不直接显示。 | `"示例数据按用户提供的数据结构和参考图手工录入。"` |

### Record object: `records[]`

| Field | Type | Required | Description | Example |
|---|---:|:---:|---|---|
| `name` | string | yes | 人物姓名，显示在节点、搜索和详情面板。 | `"刘天"` |
| `id` | string or number | yes | 人物唯一 ID；父母、配偶关系都通过 ID 引用。 | `"p001"` |
| `gender` | string | yes | 性别枚举；`male` 显示为男，`female` 显示为女，其他值显示为其他。 | `"male"` |
| `generation` | number | yes | 代际序号，用于纵向布局、代际筛选和节点标签。 | `1` |
| `ordinal` | number | yes | 家庭排行；男按长子、次子、三子显示，女按长女、次女、三女显示。 | `1` |
| `fatherId` | string, number, or null | no | 父亲 ID；用于详情显示和推导本族直系父节点。 | `"p001"` |
| `motherId` | string, number, or null | no | 母亲 ID；用于详情显示和推导本族直系父节点。 | `"s001"` |
| `birthdate` | string | no | 出生日期，格式 `YYYY-MM-DD`；详情中原样显示。 | `"1868-02-12"` |
| `deathdate` | string | no | 死亡日期，格式 `YYYY-MM-DD`；详情中原样显示，健在或未知可写 `null` 或省略。 | `"1937-09-20"` |
| `biography` | string | no | 人物简介；详情面板显示。 | `"一世祖，示例家谱的起始人物。"` |
| `spouseIds` | array | no | 配偶 ID 数组；顶部节点图标、配偶节点和详情面板使用。 | `["s001"]` |
| `isOtherFamily` | boolean | yes | 是否外姓或其他家族成员；本族成员为 `false`，配偶记录为 `true`。 | `false` |

## Example data

```js
window.FAMILY_TREE_DATA = {
  schemaVersion: 1,
  meta: {
    title: "刘氏家谱树",
    subtitle: "按代际、父母关系和家庭排行展示直系家族成员及配偶。",
    familyName: "刘氏",
    sourceNote: "示例数据。"
  },
  records: [
    {
      id: "p001",
      name: "刘天",
      gender: "male",
      generation: 1,
      ordinal: 1,
      fatherId: null,
      motherId: null,
      birthdate: "1868-02-12",
      deathdate: "1937-09-20",
      biography: "一世祖，示例家谱的起始人物。",
      spouseIds: ["s001"],
      isOtherFamily: false
    }
  ]
};
```

## Updating data

只改 `web/family-tree-data.js`。保留 `window.FAMILY_TREE_DATA`、`schemaVersion: 1`、`meta` 和 `records` 顶层结构。新增人物时要保证 `id` 唯一；父母和配偶关系只能引用已存在或即将一并加入的 ID。

本应用按本族直系来布树：如果 `fatherId` 指向本族成员，优先把父亲作为直系父节点；否则如果 `motherId` 指向本族成员，则使用母亲作为直系父节点。`isOtherFamily: true` 的人物作为配偶节点附着在本族人物右侧，不参与主干树布局。替换真实数据时，配偶记录也应保留完整人物字段，并把 `isOtherFamily` 设为 `true`。

如果后续用图片、文档或自由文本更新数据，应先离线提取并逐字段映射到上面的 schema，无法可靠映射的内容不要写入数据文件。日期必须保持 `YYYY-MM-DD` 字符串，未知日期可省略或写空字符串/null。

## Data usage

页面读取 `meta.title`、`meta.subtitle`，以及每条记录的 `name`、`id`、`gender`、`generation`、`ordinal`、`fatherId`、`motherId`、`birthdate`、`deathdate`、`biography`、`spouseIds`、`isOtherFamily`。

HTML 会校验 `schemaVersion`、`records`、`id`、`name`、`generation` 和 `ordinal`，然后从父母 ID 推导父子连线，从 `spouseIds` 推导配偶节点。节点中的子女数量为运行时根据本族子女记录统计的派生值，HTML 中不保存任何人物记录副本。

当前数据是示例数据，按用户提供的数据结构和参考图手工录入，用于演示布局与交互。人物数据只在本地页面内使用，不会发送到网络。截图会把当前显示的人物姓名和关系渲染为 PNG；在 Sessio 中仅写入当前 App 的 `web/screenshots/`，在普通浏览器中仅通过用户触发的下载保存。页面不使用网络、云端截图服务或浏览器持久化存储。主题状态由 Sessio 环境控制，页面只读取根属性和背景变量，不保存本地主题偏好。

## Generated files

- 路径规则：`web/screenshots/family-tree-<UTC时间戳>.png`。
- 格式和来源：PNG，由页面按照当前布局把人物卡片和关系线直接绘制到离屏 Canvas 生成，不创建额外 iframe。
- 大小限制：发送给 Sessio 前检查不得超过 25 MiB；渲染最多约 1200 万像素。
- 覆盖规则：时间戳文件名用于避免冲突，桥请求固定使用 `overwrite: false`。
- 触发方式：只有用户点击 `保存截图` 才会生成和写入文件。

## Installed location

开发源文件位于 `/Users/alex/.sessio-dev/projects/Dev/apps/family-tree/`。按 Sessio 约定，验证后的安装副本位于 `$SESSIO_APP_HOME/apps/family-tree/`，其中 `$SESSIO_APP_HOME` 必须来自正在运行的 Sessio 进程。

## Limitations and validation

- 页面离线运行，不加载 CDN、字体、图片、XHR 或后端接口。
- 缺少或无效的 `window.FAMILY_TREE_DATA` 会显示可见错误状态。
- 页面不提供人物数据编辑保存；修改人物应更新 `web/family-tree-data.js`。
- 截图使用浏览器原生 Canvas 2D API；浏览器无法创建 Canvas 或 PNG Blob 时会显示错误并停止导出。
- 工作区使用 CSS 禁止文本选择，拖动画布不会选中文字；点击空白处会清空当前选中人物。
- 代际筛选只显示选中代际的人物，不保留跨代父子连线。
- 已验证 HTML 引用同目录数据 JS，数据文件可被 JS 引擎解析，HTML 不包含示例人物记录副本，`config.json` 含 6 个必需字符串字段和 `downloads` 权限。浏览器验证应覆盖初始渲染、无人物时右侧边栏隐藏、选中人物后显示详情、`data-sessio-theme="light"`、`data-sessio-theme="dark"`、浏览器无属性回退、搜索、点击人物详情、显示/隐藏配偶、滚轮缩放、拖拽平移、适配视图、完整 PNG 导出和窄屏布局。
