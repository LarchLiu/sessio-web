# 五子棋 Bot

## Purpose

离线五子棋对局应用。用户可以选择 bot 难度、选择自己先手、Bot 先手或随机先手，在 15x15 棋盘上对弈；还能把当前棋局保存成 JSON，导入后按步复盘。

## Files

- `web/gomoku-bot.html`: 视图、样式、棋盘渲染、交互、保存/导入和复盘逻辑。
- `web/gomoku-bot-data.js`: 唯一运行时数据源，导出为 `window.GOMOKU_BOT_DATA`。
- `web/config.json`: Sessio 应用元数据。
- `AGENTS.md`: 这份契约、数据结构、导入导出说明和验证记录。
- `gomoku-bot-YYYYMMDDTHHMMSSsssZ.json`: 导出的棋局快照；优先通过 Sessio 写入 `web/exports/`，桥不可用或失败时下载到浏览器下载目录。

## App metadata

`web/config.json` 必须是有效 JSON，且包含这 6 个必需字符串字段：

```json
{
  "nameZh": "五子棋 Bot",
  "nameEn": "Gomoku Bot",
  "description": "离线五子棋对局应用，可选择先手和 Bot 难度，支持棋局保存、导入和复盘。",
  "author": "Alex",
  "email": "alex@example.com",
  "version": "1.3.0",
  "permissions": ["downloads"]
}
```

`downloads` 用于用户点击“导出棋局”时优先尝试 Sessio 文件写入，并在桥不可用或失败时回退到浏览器下载。导入通过本地文件选择器读取用户明确选择的 JSON，不需要额外权限。

## Run and preview

浏览器直接打开 `web/gomoku-bot.html` 即可，不需要服务器、网络或构建步骤。

Sessio 预览：打开 `web/gomoku-bot.html`，允许 inline JavaScript。页面通过同目录相对路径加载 `./gomoku-bot-data.js`。

## Runtime data structure

### Root object: `window.GOMOKU_BOT_DATA`

| Field | Type | Required | Description | Example |
|---|---:|:---:|---|---|
| `schemaVersion` | number | yes | 数据结构版本；当前实现只接受 `1`。 | `1` |
| `meta` | object | yes | 页面标题和说明。 | `{ title: "五子棋 Bot" }` |
| `settings` | object | yes | 棋盘规则、默认选项和 bot 思考延迟。 | `{ boardSize: 15, winLength: 5 }` |
| `players` | object | yes | 玩家和 bot 的显示名称。 | `{ human: { label: "你" } }` |
| `starterOptions` | array | yes | 先手选择项。 | `[{ id: "player", label: "你先手" }]` |
| `difficulties` | array | yes | Bot 难度选项和启发式参数。 | `[{ id: "normal", label: "普通" }]` |

### `meta` object

| Field | Type | Required | Description | Example |
|---|---:|:---:|---|---|
| `title` | string | yes | 页面主标题。 | `"五子棋 Bot"` |
| `subtitle` | string | yes | 标题下说明文本。 | `"离线五子棋对局，可选择 bot 难度和先手方"` |

### `settings` object

| Field | Type | Required | Description | Example |
|---|---:|:---:|---|---|
| `boardSize` | number | yes | 棋盘边长，必须为整数；当前 UI 按正方形网格渲染。 | `15` |
| `winLength` | number | yes | 获胜所需连续棋子数量。 | `5` |
| `defaultDifficultyId` | string | yes | 默认 bot 难度，必须匹配 `difficulties[].id`。 | `"normal"` |
| `defaultStarterId` | string | yes | 默认先手选项，必须匹配 `starterOptions[].id`。 | `"player"` |
| `botThinkDelayMs` | number | yes | Bot 落子前的延迟毫秒数。 | `260` |
| `maxMoveHistory` | number | yes | 最大落子数，用于判定棋盘满后的和棋。通常等于 `boardSize * boardSize`。 | `225` |

### `players` object

| Field | Type | Required | Description | Example |
|---|---:|:---:|---|---|
| `human` | object | yes | 人类玩家显示配置。 | `{ label: "你" }` |
| `bot` | object | yes | Bot 显示配置。 | `{ label: "Bot" }` |

### Player object: `players.human` and `players.bot`

| Field | Type | Required | Description | Example |
|---|---:|:---:|---|---|
| `label` | string | yes | 状态栏、历史记录和棋格辅助文本显示的玩家名称。 | `"Bot"` |

### Starter option object: `starterOptions[]`

| Field | Type | Required | Description | Example |
|---|---:|:---:|---|---|
| `id` | string | yes | 先手选项稳定 ID；允许值由数据文件提供，当前为 `player`、`bot`、`random`。 | `"random"` |
| `label` | string | yes | 分段按钮显示文本。 | `"随机先手"` |
| `description` | string | yes | 分段按钮下的简短说明。 | `"每局开始时随机决定黑棋"` |

### Difficulty object: `difficulties[]`

| Field | Type | Required | Description | Example |
|---|---:|:---:|---|---|
| `id` | string | yes | 难度稳定 ID。 | `"hard"` |
| `label` | string | yes | 难度下拉框显示文本。 | `"困难"` |
| `description` | string | yes | 难度说明，供维护者理解参数意图。 | `"优先处理活三、冲四和连五机会"` |
| `searchRadius` | number | yes | Bot 搜索已有棋子周围空点的半径，整数。 | `2` |
| `randomMoveChance` | number | yes | Bot 随机落子的概率，范围 `0` 到 `1`。 | `0.03` |
| `topCandidateCount` | number | yes | 评分后保留的候选落子数量，整数。 | `8` |
| `attackWeight` | number | yes | Bot 进攻评分权重。 | `1.28` |
| `defenseWeight` | number | yes | Bot 防守评分权重。 | `1.48` |
| `centerBias` | number | yes | 中心位置偏好权重。 | `0.42` |

## Exported save file

### File name

`gomoku-bot-YYYYMMDDTHHMMSSsssZ.json`

点击“导出棋局”后，页面从当前 live 对局或当前复盘源生成一次不可变 JSON 快照，并优先通过 Sessio 桥接写入 `web/exports/<filename>`。桥接成功时只生成这一份文件；桥不可用、超时或失败时，才使用相同快照回退到浏览器下载。浏览器直开时桥不可用，浏览器下载是预期路径。两种路径使用相同内容和精确到毫秒的 UTC 文件名。浏览器 Blob 的 MIME 类型是 `application/json;charset=utf-8`，桥接使用 `utf8`；`overwrite` 为 `false`，不会覆盖已有文件。预期文件通常小于 32 KiB，桥接会拒绝超过 25 MiB 的内容；App 允许导入的文件最大为 512 KiB。页面报告实际成功的路径；桥接失败后若下载成功，会明确说明使用了回退路径。

### Top-level object

| Field | Type | Required | Description | Example |
|---|---:|:---:|---|---|
| `schemaVersion` | number | yes | 保存文件版本；当前实现只接受 `1`。 | `1` |
| `app` | string | yes | 应用稳定 ID，当前固定为 `gomoku-bot`。 | `"gomoku-bot"` |
| `savedAt` | string | yes | 保存时间，ISO 8601 UTC 字符串。 | `"2026-09-06T12:34:56.000Z"` |
| `game` | object | yes | 棋局快照。 | `{ ... }` |

### `game` object

| Field | Type | Required | Description | Example |
|---|---:|:---:|---|---|
| `boardSize` | number | yes | 棋盘边长，整数。 | `15` |
| `winLength` | number | yes | 获胜所需连珠数。 | `5` |
| `maxMoveHistory` | number | yes | 判和用的最大步数，必须是 `1` 到 `boardSize * boardSize` 之间的整数。 | `225` |
| `difficultyId` | string | yes | 保存时选中的难度 ID。 | `"normal"` |
| `starterId` | string | yes | 保存时选中的先手选项 ID。 | `"player"` |
| `resolvedStarter` | string | yes | 实际执黑先手方，取值只能是 `player` 或 `bot`。 | `"player"` |
| `score` | object | yes | 累计比分。 | `{ human: 1, bot: 0, draws: 0 }` |
| `moves` | array | yes | 落子历史，按顺序记录。 | `[{ row: 7, col: 7, player: 1 }]` |

### `score` object

| Field | Type | Required | Description | Example |
|---|---:|:---:|---|---|
| `human` | number | yes | 人类胜局数。 | `1` |
| `bot` | number | yes | Bot 胜局数。 | `0` |
| `draws` | number | yes | 和棋数。 | `0` |

### `moves[]` object

| Field | Type | Required | Description | Example |
|---|---:|:---:|---|---|
| `row` | number | yes | 行号，0 基整数。 | `7` |
| `col` | number | yes | 列号，0 基整数。 | `7` |
| `player` | number | yes | 落子方；`1` 表示人类，`2` 表示 Bot。 | `1` |

导出格式中的所有字段都不允许为 `null`。`schemaVersion` 和 `app` 是应用常量，`savedAt` 来自用户点击时生成的 UTC 时间；棋盘规则、难度、先手、比分和落子来自当前 live 对局，复盘模式下则来自完整的原始复盘源。`moves[].row`、`col` 和 `player` 直接复制每一手经过验证的落子，不包含计时器、DOM、缓存或其他内部状态。

有效导出示例：

```json
{
  "schemaVersion": 1,
  "app": "gomoku-bot",
  "savedAt": "2026-09-06T12:34:56.789Z",
  "game": {
    "boardSize": 15,
    "winLength": 5,
    "maxMoveHistory": 225,
    "difficultyId": "normal",
    "starterId": "player",
    "resolvedStarter": "player",
    "score": { "human": 0, "bot": 0, "draws": 0 },
    "moves": [{ "row": 7, "col": 7, "player": 1 }]
  }
}
```

导入时，页面会验证文件大小、保存时间、棋盘大小、连珠数、最大步数、难度和先手枚举、比分、坐标范围、落子方、双方交替顺序、重复落子，以及胜负或和棋结束后没有多余落子，然后从第 0 手进入复盘模式。任何校验错误都会保留当前对局并显示错误。支持 5 到 25 路棋盘，连珠数必须在 3 到棋盘尺寸之间。

## Example data

```js
window.GOMOKU_BOT_DATA = {
  schemaVersion: 1,
  meta: {
    title: "五子棋 Bot",
    subtitle: "离线五子棋对局，可选择 bot 难度和先手方"
  },
  settings: {
    boardSize: 15,
    winLength: 5,
    defaultDifficultyId: "normal",
    defaultStarterId: "player",
    botThinkDelayMs: 260,
    maxMoveHistory: 225
  },
  players: {
    human: { label: "你" },
    bot: { label: "Bot" }
  },
  starterOptions: [
    { id: "player", label: "你先手", description: "你执黑先下" }
  ],
  difficulties: [
    {
      id: "normal",
      label: "普通",
      description: "会进攻和防守常见威胁",
      searchRadius: 2,
      randomMoveChance: 0.14,
      topCandidateCount: 10,
      attackWeight: 1.1,
      defenseWeight: 1.24,
      centerBias: 0.34
    }
  ]
};
```

## Updating data

只改 `web/gomoku-bot-data.js`。保留 `window.GOMOKU_BOT_DATA` 和 `schemaVersion: 1`。新增或调整难度时，确保 `settings.defaultDifficultyId` 指向存在的 `difficulties[].id`；新增或调整先手选项时，确保 `settings.defaultStarterId` 指向存在的 `starterOptions[].id`。修改 `boardSize` 后同步更新 `maxMoveHistory`，通常为 `boardSize * boardSize`。

## Data usage

`window.GOMOKU_BOT_DATA` 仍然是唯一运行时数据源，只放规则、文案、默认值和 Bot 参数。页面会读取标题、说明、棋盘尺寸、连珠数、默认难度、默认先手、Bot 思考延迟、最大步数、玩家标签、先手选项和难度参数。

棋局状态、比分、当前落子和复盘进度都只保存在页面内存中。导出按钮从当前 live 对局或当前复盘源生成一次 JSON 快照，先尝试 Sessio 文件写入；仅在桥不可用、超时或失败时才执行浏览器下载回退，不会在桥成功后重复下载。导入按钮读取用户选择的本地 JSON 文件，只用来重建棋盘、状态、比分和落子历史，再进入复盘模式。导出的内容只有棋局规则、选项、比分和落子，不包含姓名、账号或秘密；文件只进入当前 App 的 `web/exports/` 或本机下载目录，不会通过网络离开本机，也不会更新 `web/gomoku-bot-data.js`。

页面使用 `:root[data-sessio-theme="light|dark"]` 和 `--sessio-chat-background` 作为画布背景；CSS 会自动适配 Sessio 主题变化，复盘和棋盘不需要额外的 JavaScript 重绘。浏览器单独打开时，如果没有 Sessio 根属性，页面回退到 `prefers-color-scheme`。

## Installed location

开发源文件位于 `/Users/alex/.sessio-dev/projects/Dev/apps/gomoku-bot/`。验证后的安装副本位于 `/Users/alex/.sessio-dev/apps/gomoku-bot/`，页面与数据位于该目录下的 `web/`。

## Limitations and validation

- 页面离线运行，不加载 CDN、字体、图片、XHR 或后端接口。
- 缺少或无效的 `window.GOMOKU_BOT_DATA` 会显示可见错误状态。
- Bot 是启发式 AI，不是完整搜索引擎；困难难度会优先处理常见威胁，但不保证最优解。
- 导出优先通过 Sessio `postMessage` 写入 `web/exports/`，桥不可用、超时或失败时回退到浏览器下载；桥成功后不会重复下载。两种能力都需要 `downloads` 权限，直接浏览器模式会使用下载路径。
- 浏览器验证应覆盖初始渲染、浅色/深色主题、默认你先手、人类落子后 Bot 自动回应、Bot 先手、随机先手、悔一步、重新开局、导出棋局、导入棋局、复盘步进、复盘播放和窄屏布局。
