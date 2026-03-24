# AI 圓桌 (AI Roundtable)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status: Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg)](#-experimental-prototype--實驗性原型)

> 讓多個 AI 助手圍桌討論，交叉評價，深度協作

一個 Chrome 擴充功能，讓你像「會議主持人」一樣，同時操控多個 AI（Claude、ChatGPT、Gemini），實現真正的 AI 圓桌會議。

<!-- TODO: 添加 GIF 演示 -->
<!-- ![Demo GIF](assets/demo.gif) -->

---

## 🔬 Experimental Prototype / 實驗性原型

**EN**

This is an **experimental prototype** built to validate a working method:

> **Ask the same question to multiple models, let them debate each other, and use the friction to expose blind spots and expand thinking.**

It is **not** a production-ready tool, nor an attempt to compete with AI aggregators or workflow platforms.
Think of it as a *runnable experiment* rather than a polished product.

**中文**

這是一個**實驗性原型**，用於驗證一種工作方式：

> **同一個問題，讓多個模型同時回答並互相辯論，用分歧與衝突逼出漏洞、拓展思路。**

它**不是**一個生產級工具，也不是為了和任何 AI 聚合器或工作流產品競爭。
你可以把它理解為：**一份可以直接執行的實驗記錄**。

---

## 🎯 Non-goals / 刻意不做的事

**EN**

* No guarantee of long-term compatibility (AI web UIs change frequently)
* No promise of ongoing maintenance or rapid fixes
* No cloud backend, accounts, or data persistence
* No complex workflow orchestration, exports, or template libraries
* Not trying to support every model or platform

The focus is validating the **roundtable workflow**, not building software for its own sake.

**中文**

* 不承諾長期相容（AI 網頁端結構隨時可能變化）
* 不保證持續維護或快速修復
* 不做雲端帳號、資料儲存或同步
* 不做複雜的工作流編排、匯出或範本庫
* 不追求覆蓋所有模型或平臺

重點在於**驗證「圓桌式思考流程」是否有價值**，而不是把軟體本身做大做全。

---

## ❓ Why this does NOT use APIs / 為什麼不用 API

**EN**

This project intentionally operates on the **web UIs** (Claude / ChatGPT / Gemini) instead of APIs.

In practice, **API and web chat often behave differently** — commonly due to model variants, hidden system settings, sampling parameters, or UI-specific features.

I'm currently most satisfied with, and calibrated to, the **web chat experience**, so this experiment stays on the web to validate the workflow under real conditions I actually use.

**中文**

這個專案刻意選擇直接操作 **Claude / ChatGPT / Gemini 的網頁端**，而不是使用 API。

在實際使用中，**API 和 Web 端的表現往往並不一致**，常見原因包括：模型版本差異、隱藏的系統設定、採樣參數，以及網頁端特有的互動能力。

目前我對 **Web 端 Chat 的體驗最熟悉、也最滿意**，因此這次實驗選擇留在 Web 端，驗證的是我真實使用場景下的思考流程，而不是 API 能力。

---

## 核心特性

- **統一控制檯** - 透過 Chrome 側邊欄同時管理多個 AI
- **多目標傳送** - 一條訊息同時傳送給多個 AI，對比回答
- **檔案上傳** - 同時向多個 AI 傳送圖片或文件附件
- **互評模式** - 讓所有 AI 互相評價，對等參與（/mutual 指令）
- **交叉引用** - 讓 Claude 評價 ChatGPT 的回答，或反過來
- **討論模式** - 兩個 AI 就同一主題進行多輪深度討論
- **無需 API** - 直接操作網頁介面，使用你現有的 AI 訂閱

---

## 🧭 推薦使用流程 / Recommended Workflow

**中文**

1. **普通模式**：同題多答，製造分歧
2. **/mutual**：互相挑刺，逼出前提
3. **@ 稽核**：由你決定誰審誰
4. **/cross**：兩方圍攻一方，壓力測試
5. **討論模式**：只在需要時進行多輪辯論

**EN**

1. **Normal** — Ask the same question to multiple models (create divergence)
2. **/mutual** — Let models critique each other (expose assumptions)
3. **@ audit** — You decide who audits whom
4. **/cross** — Two models pressure-test one conclusion
5. **Discussion** — Run multi-round debates only when needed

---

## 🚀 快速開始 / Quick Start

### 安裝

1. 下載或 Clone 本儲存庫
2. 開啟 Chrome，進入 `chrome://extensions/`
3. 開啟右上角「開發者模式」
4. 點擊「載入解壓縮的擴充功能」
5. 選擇此專案資料夾

### 首次使用提示：請重新整理頁面

開啟側邊欄並選取目標 AI 後，**建議將每個 AI 的網頁重新整理一次**。
這樣可以確保外掛正確獲取頁面內容並穩定綁定（尤其是這些分頁已經開啟一段時間的情況下）。

> **First-run tip:** After opening the sidebar and selecting target AIs, **refresh each AI page once** to ensure reliable detection.

### 準備工作

1. 開啟 Chrome，登入以下 AI 平臺（視需要）：
   - [Claude](https://claude.ai)
   - [ChatGPT](https://chatgpt.com)
   - [Gemini](https://gemini.google.com)

2. 推薦使用 Chrome 的 Split Tab 功能，將 2 個 AI 頁面並列顯示

3. 點擊擴充功能圖示，開啟側邊欄控制檯

---

## 使用方法

### 普通模式

**基本傳送**
1. 勾選要傳送的目標 AI（Claude / ChatGPT / Gemini）
2. 輸入訊息
3. 按 Enter 或點擊「傳送」按鈕

**@ 提及語法**
- 點擊 @ 按鈕快速插入 AI 名稱
- 或手動輸入：`@Claude 你怎麼看這個問題？`

**互評（推薦）**

基於目前已有回覆，讓所有選中的 AI 互相評價：
```
/mutual
/mutual 重點分析優缺點
```

用法：
1. 先傳送一個問題給多個 AI，等待它們各自回覆
2. 點擊 `/mutual` 按鈕或輸入 `/mutual`
3. 每個 AI 都會收到其他 AI 的回覆並進行評價
   - 2 AI：A 評價 B，B 評價 A
   - 3 AI：A 評價 BC，B 評價 AC，C 評價 AB

**交叉引用（單向）**

兩個 AI（自動偵測）：
```
@Claude 評價一下 @ChatGPT
```
最後 @ 的是來源（被評價），前面的是目標（評價者）

三個 AI（使用 /cross 指令）：
```
/cross @Claude @Gemini <- @ChatGPT 評價一下
/cross @ChatGPT <- @Claude @Gemini 對比一下
```

#### 指令語法詳解

格式：`/cross @[目標 AI] <- @[來源 AI] [你的指令]`

*   **`<-` 左側 (@目標 AI)**：這條訊息要「傳送給誰」。
*   **`<-` 右側 (@來源 AI)**：要「抓取誰」目前的最新回覆內容。
*   **最後的文字**：你要求目標 AI 執行的具體任務。

**實際案例：**
1.  `/cross @claude @gemini <- @chatgpt 評價一下`
    *   *語意：* 「嘿 Claude 和 Gemini，你們看看 ChatGPT 剛才說了什麼，然後評價一下它的觀點。」
2.  `/cross @chatgpt <- @claude @gemini 對比一下`
    *   *語意：* 「嘿 ChatGPT，這裡有 Claude 和 Gemini 兩邊的回答，請你幫我對比一下這兩者有什麼異同。」

**互評（/mutual）vs 交叉引用（/cross）**

| 指令 | 適用場景 | 運作邏輯 |
| :--- | :--- | :--- |
| **`/mutual`** | 全體參與者對等討論 | 每個 AI 都會收到「其他所有 AI」的回答並給出評價。 |
| **`/cross`** | 指定特定 AI 進行稽核 | 精確控制哪些 AI 負責評價，哪些 AI 被評價，適合進行「壓力測試」。 |

**動作下拉選單**：快速插入預設動作詞（評價/借鑑/批評/補充/對比）

### 討論模式

讓兩個 AI 就同一主題進行深度辯論：

1. 點擊頂部「討論」切換到討論模式
2. 選擇 2 個參與討論的 AI
3. 輸入討論主題
4. 點擊「開始討論」

**討論流程**

```
第 1 輪: 兩個 AI 各自闡述觀點
第 2 輪: 互相評價對方的觀點
第 3 輪: 回應對方的評價，深化討論
...
總結: 雙方各自生成討論總結
```

---

## 技術架構

```
ai-roundtable/
├── manifest.json           # Chrome 擴充功能配置 (Manifest V3)
├── background.js           # Service Worker 訊息中轉
├── sidepanel/
│   ├── panel.html         # 側邊欄 UI
│   ├── panel.css          # 樣式
│   └── panel.js           # 控制邏輯
├── content/
│   ├── claude.js          # Claude 頁面注入指令碼
│   ├── chatgpt.js         # ChatGPT 頁面注入指令碼
│   └── gemini.js          # Gemini 頁面注入指令碼
└── icons/                  # 擴充功能圖示
```

---

## 隱私說明

- **不上傳任何內容** - 擴充功能完全在在地執行，不向任何伺服器傳送資料
- **無遙測/日誌採集** - 不收集使用資料、不追蹤行為
- **資料儲存位置** - 僅使用瀏覽器在地儲存（chrome.storage.local）
- **無第三方服務** - 不依賴任何外部 API 或服務
- **如何刪除資料** - 解除安裝擴充功能即可完全清除，或在 Chrome 擴充功能設定中清除儲存

---

## 常見問題

### Q: 安裝後無法連線 AI 頁面？
**A:** 安裝或更新擴充功能後，需要重新整理已開啟的 AI 頁面。

### Q: 交叉引用時提示"無法獲取回覆"？
**A:** 確保來源 AI 已經有回覆。系統會獲取該 AI 的最新一條回覆。

### Q: ChatGPT 回覆很長時會逾時嗎？
**A:** 不會。系統支援最長 10 分鐘的回覆擷取。

---

## 已知限制

- 依賴各 AI 平臺的 DOM 結構，平臺更新可能導致功能失效
- 討論模式固定 2 個參與者
- 不支援 Claude Artifacts、ChatGPT Canvas 等特殊功能
- **Gemini 不支援自動檔案上傳** - 由於 Google 的安全限制，Gemini 需要手動上傳檔案（Claude 和 ChatGPT 正常支援）

---

## Contributing

Contributions welcome (low-maintenance project):

- Reproducible bug reports (input + output + steps + environment)
- Documentation improvements
- Small PRs (fixes/docs)

> **Note:** Feature requests may not be acted on due to limited maintenance capacity.

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Author

**Axton Liu** - AI Educator & Creator

- Website: [axtonliu.ai](https://www.axtonliu.ai)
- YouTube: [@AxtonLiu](https://youtube.com/@AxtonLiu)
- Twitter/X: [@axtonliu](https://twitter.com/axtonliu)

### Learn More

- [MAPS™ AI Agent Course](https://www.axtonliu.ai/aiagent) - Systematic AI agent skills training
- [Agent Skills Resource Library](https://www.axtonliu.ai/agent-skills) - Claude Code Skills collection and guides
- [Claude Skills: A Systematic Guide](https://www.axtonliu.ai/newsletters/ai-2/posts/claude-agent-skills-maps-framework) - Complete methodology
- [AI Elite Weekly Newsletter](https://www.axtonliu.ai/newsletters/ai-2) - Weekly AI insights
- [Free AI Course](https://www.axtonliu.ai/axton-free-course) - Get started with AI

---

© AXTONLIU™ & AI 精英學院™ 版權所有
