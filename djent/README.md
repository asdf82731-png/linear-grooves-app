# Djent Grooves

**Djent 節奏庫**，獨立的 PWA，可以安裝到手機或平板主畫面，離線也能用。

上層：右手的鈸一直打 4/4、左手的小鼓放在第 3 拍（或 2、4 拍）。
下層：大鼓（或大鼓＋小鼓）跟著 riff，用奇數分組繞過小節線，到樂句結尾截斷或跑完整個循環。

## 功能
- 曲庫 30 個原創練習，分 5 類：基本 Chug（6）、奇數分組跨小節（8）、小鼓跟 riff（6）、六連音爆發（4）、Gospel chops 線性 Fill（6）
- **基本練習**開關：每個 groove 都能切換，只用 Hi-hat、小鼓、大鼓，Fill 也一樣；關掉時鈸可以選 China／Crash／Ride／Hi-hat，Fill 用筒鼓，Fill 後的第 1 拍打 Crash
- 樂句 2／4／8 小節；結尾「截斷」（預設）或「跑完整個循環」（自動延長到分組接回第 1 拍）
- Fill：最後 1 拍、2 拍、1 小節或不要；隨機抽或指定；Fill 一定結束在完整的一組，接回下一輪的第 1 拍
- 上層打法可以改：鈸打 4 分、2 分或 8 分；小鼓第 3 拍、2 和 4 拍，或跟著 riff 走
- 音符：16 分音符或 16 分六連音（拍號固定 4/4）
- 大鼓：雙踏或單踏；雙踏**每組從右腳開始**、組內左右交替（沒有左腳開始選項）
- 顯示：格子圖（一小節一行，「分組」那排標出每組長度、↺ 接回第 1 拍、✂ 截斷）或五線譜，用下拉選單切換
- 平板橫放：左邊譜、右邊設定，4 小節一次顯示；播放時自動捲到目前這一小節
- 共通練習設定：節拍器（含細分音）、預備拍、自動加速、自動換下一個、練習計時、App 幫你打哪些聲部、「打順了」記錄最佳速度

## 安裝
GitHub Pages 網址：`https://asdf82731-png.github.io/linear-grooves-app/djent/`
- Android：Chrome 開啟 → ⋮ →「安裝應用程式」
- iPad／iPhone：Safari 開啟 → 分享 →「加入主畫面」

## 本機開發
```sh
python3 -m http.server 8000
# 開 http://localhost:8000/djent/
```
純 HTML/CSS/JS，沒有建置步驟。修改後把 `sw.js` 的 `VERSION` 加一（保留 `dj-` 開頭）。

## 檔案
- `index.html` — 版面（`.col-main` 譜、`.col-side` 設定；寬度 ≥ 900px 變兩欄）
- `style.css` — 從 Double Pedal 複製，加上 Djent 與平板版面
- `app.js` — 曲庫、樂句產生、格子圖與五線譜、Web Audio 合成鼓（含 China、Crash、筒鼓）
- `sw.js`、`manifest.webmanifest`（`id: "djent"`）、`icons/`
