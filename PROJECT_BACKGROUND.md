# 鼓手練習 App：專案背景（Linear Grooves ＋ Double Pedal）

> 這份文件給 AI 助手或新協作者當背景資料，說明兩個 App 的目的、架構、設計規範、資料格式和踩過的坑。改程式前請先讀完。

## 1. 專案概要

- **使用者**：學爵士鼓（台灣說的「爵士鼓」＝整組套鼓 drum kit）的鼓手，主要用 **Android 手機的 Chrome**，在練習室跟著 App 練。
- **語言**：介面全部是**繁體中文（zh-Hant）**，用白話口語，避免艱深術語；專有名詞保留英文（Paradiddle、Gallop、Heel-Toe…）。
- **形式**：兩個**獨立的 PWA**，各自安裝到手機主畫面、各自離線使用。
  | App | 練什麼 | 網址 |
  | --- | --- | --- |
  | **Linear Grooves** | 手：線性節奏、手順、Paradiddle、複節奏 | https://asdf82731-png.github.io/linear-grooves-app/linear-grooves/ |
  | **Double Pedal 雙踏腳法** | 腳：雙踏、手腳組合、腳踩鈸、Swing | https://asdf82731-png.github.io/linear-grooves-app/double-pedal/ |
- **Repo**：`asdf82731-png/linear-grooves-app`，GitHub Pages 從 `main` / `(root)` 發佈。
  - 已決定**不改名**，repo 維持 `linear-grooves-app`，README 網址也已改回 `/linear-grooves-app/`。

## 2. 技術原則

- **純 HTML／CSS／JavaScript**，沒有框架、沒有建置步驟、沒有外部 JS 套件。
- **聲音全部用 Web Audio API 即時合成**，不用任何音檔。
- 外部資源只有 Google Fonts（Big Shoulders Display、IBM Plex Mono、IBM Plex Sans），service worker 會把它快取起來離線用。
- 資料只存在使用者裝置的 `localStorage`，沒有後端、沒有帳號。
- 本機開發：在 repo 根目錄執行 `python3 -m http.server 8000`，再開 `/linear-grooves/` 或 `/double-pedal/`。

## 3. Repo 結構

```
/                      根目錄
├─ index.html          選擇頁：兩個 App 的連結，本身「不能安裝」（沒有 manifest）
├─ sw.js               只用來移除舊版的 service worker（見 §5）
├─ README.md           總覽
├─ .nojekyll           讓 GitHub Pages 原樣提供檔案
├─ linear-grooves/     App 1
│  ├─ index.html       線性節奏產生器（主頁）
│  ├─ app.js
│  ├─ sticking.html    手順練習（同一個 App 裡的第二個工具，上方膠囊切換）
│  ├─ sticking.js
│  ├─ style.css        兩個頁面共用
│  ├─ manifest.webmanifest   id: "linear-grooves"
│  ├─ sw.js            快取前綴 grooves-
│  └─ icons/           五線譜＋綠紅藍音符圖示
└─ double-pedal/       App 2
   ├─ index.html
   ├─ app.js
   ├─ style.css        從 Linear Grooves 複製後加上雙踏專用樣式
   ├─ manifest.webmanifest   id: "double-pedal"
   ├─ sw.js            快取前綴 dp-
   └─ icons/           橘色大鼓圓框＋綠點（右腳）紫點（左腳）
```

## 4. 兩個 App 必須獨立：規則與原因（重要）

兩個 App 在同一個網域 `asdf82731-png.github.io` 下，以下規則**都不能破壞**，否則手機會把兩個 App 當成同一個，「裝一個蓋掉另一個」：

1. **範圍（scope）不可重疊**：每個 App 的 `start_url` 和 `scope` 都是 `"./"`，也就是各自的資料夾。根目錄**不能**放有 manifest 的 App，否則根目錄的 scope 會包含兩個子資料夾。
2. **manifest `id` 必須不同，而且不能寫 `"./"`**：`id` 是以**網站的 origin** 為基準解析，不是 App 所在的資料夾。`"./"` 會讓兩個 App 都變成 `https://asdf82731-png.github.io/`，等於同一個 App（這就是曾經發生的 bug）。現在用 `"linear-grooves"`、`"double-pedal"`，不含 repo 名稱，改名也不受影響。驗證方式：用 Chromium 的 CDP `Page.getAppId`，兩個 App 的 `appId` 必須不同。
3. **快取名稱要有各自的前綴，只刪自己的快取**：同一個 origin 共用 Cache Storage。service worker 在 `activate` 時只能刪自己前綴的舊快取（`grooves-`、`dp-`），不能刪「所有不等於目前版本」的快取。
4. **localStorage 也共用**，所以 key 都要有前綴：Linear Grooves 用 `lg.`（線性節奏）和 `sc.`（手順），Double Pedal 用 `ft.`。

### 根目錄 `sw.js` 的用途
Linear Grooves 以前放在根目錄，它的 service worker 範圍包含整個網站。現在根目錄的 `sw.js` 是用來移除舊版：已裝過舊版的手機下次造訪時會抓到它，它會刪掉舊的 `lg-` 快取、取消註冊自己，再重新載入頁面。新版頁面不會再註冊它。

### 發佈新版的步驟
- 修改任何會被快取的檔案後，要把該 App 的 `sw.js` 裡的 `VERSION` 加一，並保留前綴，例如 `grooves-v3 → grooves-v4`、`dp-v4 → dp-v5`。
- service worker 用 stale-while-revalidate：先回快取、背景更新，所以使用者通常要**關掉 App 再開一次**才看到新版。
- GitHub Pages 的 HTTP 快取大約 10 分鐘。

## 5. 設計規範（兩個 App 共用）

### 版面
- **單欄「練習譜」**：最大寬度 720px，左右留白至少 16px（含 safe-area），手機 375px 寬度下不能出現整頁橫向捲動。
- 由上到下依序是：工具切換膠囊（只有 Linear Grooves 有）→ 大標題＋「? 使用說明」→ 第一次開啟的「三步開始練習」說明卡 → **練習卡（sheet）** → 「練什麼」選擇區 → 可折疊的設定面板（`<details class="fold">`）→ 頁尾。
- **底部固定播放列**：像硬體節拍器。由左到右是：主要動作按鈕（「下一個」或「換一個」）、速度（大字 BPM，可以點一下直接輸入數字、− / ＋ 每次 5、滑桿）、**圓形播放鍵（在最右邊，方便右手拇指按）**。

### 色彩 token（定義在 `:root`，自動支援深色模式）
| Token | 淺色 | 深色 | 用途 |
| --- | --- | --- | --- |
| `--bg` | #E9EDF0 | #0F1215 | 練習室灰 |
| `--surface` | #FFFFFF | #181D22 | 譜紙 |
| `--ink` | #15191E | #E6EAEE | 文字 |
| `--muted` | #5A6470 | #96A1AC | 次要文字 |
| `--line` | #CDD4DA | #2B333B | 線條 |
| `--accent` | #A9611B | #D8913F | 銅鈸色，主要按鈕、重音、標示 |
| `--r` | #2C67A8 | #74A9E4 | **右手（藍）** |
| `--l` | #BE3F33 | #EE7A6C | **左手（紅）** |
| `--k` | #2C7A4E | #62C08B | **大鼓／右腳（綠）** |
| `--lf` | #7A4FB0 | #B497E8 | **左腳（紫）**，只在 Double Pedal |
| `--hl` | 銅色 16% | 銅色 22% | 播放中目前音符的底色 |

深色模式寫在 `@media (prefers-color-scheme: dark)` 底下的 `:root:not([data-theme="light"])`，另外也支援 `:root[data-theme="dark"]`。

### 字型
- 標題、BPM 數字：**Big Shoulders Display**（窄體、大寫）
- 手順字母、數拍、標籤：**IBM Plex Mono**
- 內文：**IBM Plex Sans**，中文退回 Noto Sans TC 或系統字型

### 共通互動規則
- 色彩語意固定：手 R 藍、L 紅；腳 R 綠、L 紫；重音用底線或外圈；很輕的音用空心圓。
- 播放時，大字母、譜面、格子圖**同步標示目前的音**。
- 「練習卡」一定有：練習名稱＋英文或手順副標、「最佳 N BPM」膠囊、meta 行（音符種類、幾拍一循環、第幾個）、◀ 上一個／第幾次／下一個 ▶、「✓ 打順了，記錄 N BPM」按鈕。
- 練習選項用 `.modes`（大格子單選）和 `.seg`（分段控制）；練習清單用 `.ex-list`，每列顯示手順和最佳速度。
- 共通練習設定：節拍器、預備拍（先數一小節）、自動加速（每 N 次循環 +X BPM，最快到 M）、練完自動換下一個（重複 4/8/16/32 次）、左手或左腳開始（R/L 對調）。
- 播放中用 Wake Lock 讓螢幕保持亮著；鍵盤空白鍵播放／停止，← → 換練習。
- Chrome 規定使用者先點一下才能出聲，所以 AudioContext 在按 ▶ 時才建立。

### 文案語氣
- 直接、口語、短句。例如「打順了就按…」「寧可慢也不要亂」。
- 說明以「三步開始練習」為主，進階內容放在「小技巧」折疊區。
- 錯誤或提示訊息用 `flash()` 在練習卡上方的 status 行短暫顯示 2.6 秒。

## 6. App 1：Linear Grooves（手）

### 6.1 線性節奏（`linear-grooves/index.html` ＋ `app.js`）
**線性節奏的規則**：任何時刻只有一個肢體發聲（右手 R、左手 L、大鼓 K 不重疊）。

**產生方式**
- 把一小節切成數個短組（例如 `RLK`、`RLRK`），每組以大鼓結尾，或設定成以大鼓開頭，再串成整小節。
- 用動態規劃把總音數拆成允許的組長，保證一定湊得滿。
- 手順庫有三種：「常見」是精選清單；「較多」是同一隻手最多連 2 下的所有排列；「全部」是所有 R/L 排列。組長 2～8。
- 可以允許雙踩 `KK`。
- 難度一鍵選：入門（組長 3–4、常見）、中等（3–5、較多）、進階（2–7、全部、允許雙踩），進階細節收在「進階規則」。

**音符與配器**
- 音符：16 分音符、8 分三連音、16 分六連音；拍號 2/4～7/4；長度 1 或 2 小節。
- 配器：右手 Hi-hat、右手 Ride、Fill（混合筒鼓）；每組第一音可以加重音。

**資料格式**
```js
pattern = { sub, beats, bars, shift, groups: [{ stick: 'RLRK', voices: ['hh','sn','hh','k'] }, …] }
// voices: hh, ride, t1, sn, ft, k
// shift: 整體位移幾個音，可以跨小節線
```

**編輯功能**
- 點任一組可以「替換」成清單裡的其他手順，或「輪轉」換起點。
- 全部組一起輪轉、重排組的順序、整體位移、左右手對調、換配器、複製手順到剪貼簿。

**畫面**
- 用 SVG 畫五線譜鼓譜，下方有手順和數拍（1 e & a）。
- 合成鼓聲（KIT：k、sn、hh、ride、t1、ft）。
- 收藏存在 `lg.favs`。

### 6.2 手順練習（`linear-grooves/sticking.html` ＋ `sticking.js`）
**五種練習模式**
- **基本手法**（Rudiments）：單擊、雙擊、三擊、單 Paradiddle、六擊滾奏、Flam、Flam Tap、Flam Accent、Swiss Army Triplet、Drag。
- **Paradiddle 系列**：四種起點（標準／反轉／反向／延遲）、雙、三 Paradiddle、Paradiddle-diddle、Paradiddle 打六連音、Flam Paradiddle、Flam Paradiddle-diddle。
- **複節奏**：3:2、4:3、5:4、5:3、5:2、7:4、2:3、3:4。畫成雙線位置圖，可以只聽單手。
- **隨機手順**：8 分或 16 分，可以限制同手最多連打幾下，一次產生 8 個。
- **重音移動**：單擊、雙擊或 Paradiddle，重音逐一往後移。

**手順寫法**：`[f|d]?[R|L]>?`
- `f` 是 flam，`d` 是 drag，裝飾音由另一隻手打。
- `>` 是重音。
- 例：`'fR> L R fL> R L'`

**畫面與聲音**
- 大字母手順加上單線譜（含重音、裝飾音）。
- 練習墊音色，右手在右聲道、左手在左聲道。
- 最佳速度存在 `sc.best`。

## 7. App 2：Double Pedal 雙踏腳法（腳）

**目的**：練雙踏（兩腳都踩大鼓）和雙腳獨立（左腳踩 Hi-hat 踏板）。

### 7.1 六種練習模式（固定 43 個練習，另有隨機腳法）
- **單腳連踩**（Heel-Toe、同一腳連續，10 個，只用右腳＋一個踏板，`swap: true` 讓「左腳開始」改成左腳）：Heel-Toe 分解（8 分雙擊）、Heel-Toe 雙擊（1 e）、Heel-Toe 雙擊（& a）、三連音雙擊、Heel-Toe＋搖滾節奏、單腳三擊、單腳連 4 下、8 分轉 16 分、單腳三連音連續、單腳 16 分連續。
- **雙踏基本功**（只有腳，11 個）：4 分音符交替、8 分音符單擊、三連音單擊、16 分音符單擊、雙擊 RRLL、腳的 Paradiddle、Gallop（R L R –）、反 Gallop（– R L R）、4 音爆發、6 音爆發、六連音單擊。
- **雙踏節奏**（腳＋手，7 個）：8 分雙踏＋搖滾節奏、16 分連續雙踏、Gallop 節奏、三連音雙踏、Half-time 雙踏、大鼓點綴（雙擊）、雙踏＋打點。
- **手腳組合**（線性 Fill，7 個）：R＋腳腳（三連音）、R L＋腳腳、腳腳＋R L、R L R L＋腳腳（六連音）、R R L L＋腳腳（六連音）、5 音組 R L R＋腳腳（5 拍一循環）、R＋腳腳＋L。
- **左腳腳踩鈸**（8 個，左腳改踩 Hi-hat，不做左右對調）：2、4 拍、每拍、反拍、大鼓／腳踩鈸交替、Swing（大鼓 Feathering 輕踩＋Hi-hat 2、4）、Swing＋左手 Comping、Samba、左腳 Son Clave 3-2（2 小節）。
- **隨機腳法**：8 分、三連音或 16 分；可以限制同一隻腳最多連踩幾下（1～4 下）；可以加入休止（約 25%）。一次產生 8 個。

### 7.2 練習資料格式
```js
{ id, name, en, sub, tip,
  hand: 'hh' | 'ride' | 'sn',   // RH 的樂器，預設 hh
  lf:   'bd' | 'hf',            // LF 的樂器：雙踏 bd 或腳踩鈸 hf，預設 bd
  RH: 'x.x. x.x. …', LH: '…', RF: '…', LF: '…' }
```
- 每個字元是一格（slot）：`X` 重音、`x` 一般、`g` 很輕（ghost／feathering）、`.` 休止。空白會被忽略，只是為了好讀。
- `sub` 是一拍幾格（1、2、3、4、6），長度除以 `sub` 就是幾拍一循環，必須整除，而且各軌長度要一樣。
- 「左腳開始」只對 LF 是大鼓、或標了 `swap: true` 的練習有效，會把 RF 和 LF 對調。

### 7.3 畫面
- **大字母腳順**：右腳 R 綠、左腳 L 紫；在「手腳組合」裡手的 R/L 用藍和紅；兩腳同時踩用 ✕。腳踩鈸模式不顯示大字母。
- **四肢格子圖**：右手、左手、右腳、左腳各一排，只顯示有用到的肢體。標籤寫肢體加樂器，例如「左腳／腳踩鈸」。
  - 每一欄是一格，拍與拍之間有分隔線，最下面一排是數拍。
  - 鼓用圓點，鈸和腳踩鈸用菱形；重音有外圈，很輕的音是空心小圓。
  - 超過 5 拍的練習每 4 拍換一行。
  - 六連音只標拍點和 &，密集模式下點比較小。
- 播放時整欄標示目前的音；每個練習有一句技巧提示（左邊有銅色豎線）。
- 「腳法技巧」折疊區：Heel Down、Heel Up、Slide、Heel-Toe、Swivel、Hi-hat 踏法、彈簧與椅子、左腳比較弱、不要壓著鼓皮。

### 7.4 設定與聲音
- **App 幫你打哪些聲部**：全部／只播手的部分（你踩腳）／只播腳的部分／都不播（只有節拍器）。
- 練習計時：不計時、1、2、5、10 分鐘，時間到自動停止，播放中顯示剩餘時間。
- 其他和共通規則相同：自動換下一個、重複次數、左腳開始、節拍器、預備拍、自動加速（最快預設 160）。
- 合成音色：`bd` 大鼓、`sn` 小鼓、`hh` Hi-hat、`hf` 腳踩鈸、`ride`。
  - 聲道位置：右腳 +0.35、左腳 −0.35、右手 +0.2、左手 −0.1。
  - 音量：重音 1.0、一般 0.62、很輕 0.22。
- localStorage：`ft.settings`、`ft.best`、`ft.random`。

## 8. 安裝與疑難排解（給使用者的說明要點）

- **Android Chrome**：開網址 → ⋮ →「安裝應用程式」。iPhone 要用 Safari → 分享 →「加入主畫面」。
- **兩個 App 會互相覆蓋**：先確認 manifest id 和 scope 符合 §4。使用者端要從「設定 → 應用程式」把舊 App 完全解除安裝（只刪主畫面圖示不夠），清除網站資料，強制停止 Chrome，再重裝。
- **「無法開啟應用程式」**：通常是手機裡還留著舊版 App。⋮ 選單如果顯示「開啟應用程式」而不是「安裝」，代表舊 App 還在。另外，剛裝完要等大約 1 分鐘，Chrome 才會在背景做好 App。
- **沒有聲音**：Chrome「設定 → 網站設定 → 音效」要允許；要先按 ▶；調的要是媒體音量；iPhone 要關掉靜音開關。
- **改 repo 名稱**：Pages 網址會跟著變，舊網址不會轉址，變成 404；網址變了也代表 localStorage 會歸零，App 要重裝。

## 9. 開發流程慣例

- 在功能分支開發 → 開 PR → 合併到 `main`，GitHub Pages 就會發佈。
- commit 和 PR 說明用清楚的描述；PR 說明用繁體中文。
- 交付前用 Playwright 搭配 Chromium 檢查：
  - 375px 寬度下沒有整頁橫向捲動
  - 每個練習的各軌長度一致，而且能被 `sub` 整除
  - console 沒有錯誤
  - 深色模式正常
  - 兩個 App 的 `Page.getAppId` 不同
- **尚未做過的驗證**：真實手機上的安裝流程和音效聽感。

## 10. 待辦與可能的方向

- 使用者提過、可以考慮加入的內容：Blast Beat、更多爵士雙腳練法、聲音音量或音色調整。
- `double-pedal/style.css` 是從 Linear Grooves 整份複製來的，裡面有用不到的樣式，之後可以精簡。
