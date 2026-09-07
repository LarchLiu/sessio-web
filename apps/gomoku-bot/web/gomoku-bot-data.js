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
    human: {
      label: "你"
    },
    bot: {
      label: "Bot"
    }
  },
  starterOptions: [
    { id: "player", label: "你先手", description: "你执黑先下" },
    { id: "bot", label: "Bot 先手", description: "Bot 执黑先下" },
    { id: "random", label: "随机先手", description: "每局开始时随机决定黑棋" }
  ],
  difficulties: [
    {
      id: "easy",
      label: "简单",
      description: "偏随机，偶尔会漏防",
      searchRadius: 1,
      randomMoveChance: 0.42,
      topCandidateCount: 12,
      attackWeight: 0.9,
      defenseWeight: 1.0,
      centerBias: 0.2
    },
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
    },
    {
      id: "hard",
      label: "困难",
      description: "优先处理活三、冲四和连五机会",
      searchRadius: 2,
      randomMoveChance: 0.03,
      topCandidateCount: 8,
      attackWeight: 1.28,
      defenseWeight: 1.48,
      centerBias: 0.42
    }
  ]
};
