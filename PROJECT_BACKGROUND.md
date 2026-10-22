# 鼓手練習 App：專案背景（Linear Grooves ＋ Double Pedal ＋ Djent Grooves）

> 這份文件給 AI 助手或新協作者當背景資料，說明三個 App 的目的、架構、設計規範、資料格式和踩過的坑。改程式前請先讀完。

## 1. 專案概要

- **使用者**：學爵士鼓（台灣說的「爵士鼓」＝整組套鼓 drum kit）的鼓手，主要用 **Android 手機的 Chrome**，在練習室跟著 App 練。Djent Grooves 主要在 **Android 平板橫放**使用。
- **語言**：介面全部是**繁體中文（zh-Hant）**，用白話口語，避免艱深術語；專有名詞保留英文（Paradiddle、Gallop、Heel-Toe…）。
- **形式**：三個**獨立的 PWA**，各自安裝到主畫面、各自離線使用。
  | App | 練什麼 | 網址 |
  | --- | --- | --- |
  | **Linear Grooves** | 手：線性節奏、手順、Paradiddle、複節奏 | https://asdf82731-png.github.io/linear-grooves-app/linear-grooves/ |
  | **Double Pedal 雙踏腳法** | 腳：雙踏、手腳組合、腳踩鈸、Swing | https://asdf82731-png.github.io/linear-grooves-app/double-pedal/ |
  | **Djent Grooves** | Djent 節奏庫：鈸固定 4/4、大鼓奇數分組跨小節、Gospel chops Fill | https://asdf82731-png.github.io/linear-grooves-app/djent/ |
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
├─ index.html          選擇頁：三個 App 的連結，本身「不能安裝」（沒有 manifest）
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
└─ djent/              App 3
   ├─ index.html       .col-main（譜）＋ .col-side（設定），寬度 ≥ 900px 變兩欄
   ├─ app.js
   ├─ style.css        從 Double Pedal 複製後加上 Djent 與平板樣式
   ├─ manifest.webmanifest   id: "djent"
   ├─ sw.js            快取前綴 dj-
   └─ icons/           深灰底、銅色 China 鈸＋綠點紫點
```

## 4. 三個 App 必須獨立：規則與原因（重要）

三個 App 在同一個網域 `asdf82731-png.github.io` 下，以下規則**都不能破壞**，否則手機會把它們當成同一個，「裝一個蓋掉另一個」：

1. **範圍（scope）不可重疊**：每個 App 的 `start_url` 和 `scope` 都是 `"./"`，也就是各自的資料夾。根目錄**不能**放有 manifest 的 App，否則根目錄的 scope 會包含所有子資料夾。
2. **manifest `id` 必須不同，而且不能寫 `"./"`**：`id` 是以**網站的 origin** 為基準解析，不是 App 所在的資料夾。`"./"` 會讓兩個 App 都變成 `https://asdf82731-png.github.io/`，等於同一個 App（這就是曾經發生的 bug）。現在用 `"linear-grooves"`、`"double-pedal"`、`"djent"`，不含 repo 名稱，改名也不受影響。驗證方式：用 Chromium 的 CDP `Page.getAppId`，三個 App 的 `appId` 必須不同。
3. **快取名稱要有各自的前綴，只刪自己的快取**：同一個 origin 共用 Cache Storage。service worker 在 `activate` 時只能刪自己前綴的舊快取（`grooves-`、`dp-`、`dj-`），不能刪「所有不等於目前版本」的快取。
4. **localStorage 也共用**，所以 key 都要有前綴：Linear Grooves 用 `lg.`（線性節奏）和 `sc.`（手順），Double Pedal 用 `ft.`，Djent Grooves 用 `dj.`。

### 根目錄 `sw.js` 的用途
Linear Grooves 以前放在根目錄，它的 service worker 範圍包含整個網站。現在根目錄的 `sw.js` 是用來移除舊版：已裝過舊版的手機下次造訪時會抓到它，它會刪掉舊的 `lg-` 快取、取消註冊自己，再重新載入頁面。新版頁面不會再註冊它。

### 發佈新版的步驟
- 修改任何會被快取的檔案後，要把該 App 的 `sw.js` 裡的 `VERSION` 加一，並保留前綴，例如 `grooves-v3 → grooves-v4`、`dp-v4 → dp-v5`、`dj-v1 → dj-v2`。
- service worker 用 stale-while-revalidate：先回快取、背景更新，所以使用者通常要**關掉 App 再開一次**才看到新版。
- GitHub Pages 的 HTTP 快取大約 10 分鐘。

## 5. 設計規範（三個 App 共用）

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
- 色彩語意固定：手 R 藍、L 紅；腳 R 綠、L 紫；重音用底線或外圈（只有 Linear Grooves 的手有重音）。**大鼓沒有輕重音**：三個 App 的大鼓永遠同一個音量、沒有重音或輕音標記。
- 播放時，大字母、譜面、格子圖**同步標示目前的音**。
- 「練習卡」一定有：練習名稱＋英文或手順副標、「最佳 N BPM」膠囊、meta 行（音符種類、幾拍一循環、第幾個）、◀ 上一個／第幾次／下一個 ▶、「✓ 打順了，記錄 N BPM」按鈕。
- 練習選項用 `.modes`（大格子單選）和 `.seg`（分段控制）；練習清單用 `.ex-list`，每列顯示手順和最佳速度。
- 共通練習設定：節拍器、預備拍（先數一小節）、自動加速（每 N 次循環 +X BPM，最快到 M）、練完自動換下一個（重複 4/8/16/32 次）、左手或左腳開始（R/L 對調）。
- 播放中用 Wake Lock 讓螢幕保持亮著；鍵盤空白鍵播放／停止，← → 換練習。
- Chrome 規定使用者先點一下才能出聲，所以 AudioContext 在按 ▶ 時才建立。
- **音量處理鏈（三個頁面相同）**：`master`（每個頁面各自的放大倍數）→ 只抓最高峰的限幅器（DynamicsCompressor：threshold 0、ratio 20、attack 0）→ ×0.5 → 軟削波 WaveShaper（0.7 以下完全線性，以上平滑彎到 0.98）→ 喇叭。
  - 放大倍數：線性節奏 2、手順練習 2.4、Double Pedal 2.8。比原本大聲約 5.5～6.5 dB，峰值不超過 0 dBFS。
  - **不要用預設參數的 DynamicsCompressor**（threshold −24、ratio 12），它會把重音和一般音壓成一樣大聲，整體也變小聲。
- **節拍器**：每一拍都是同一個聲音（沒有第一拍比較高或比較大聲），三個頁面都一樣。
  - **細分音**（設定「節拍器的細分音」，`S.clickSub`）：一拍裡的每個音都會響，例如 16 分音符的 1 e & a。三個選項：
    - `soft`「比拍點小聲」（預設）：e、&、a 用同一個聲音、音量 0.3（約小 10 dB）
    - `same`「跟拍點一樣大聲」：每個音完全一樣
    - `off`「不打，只有拍點」
    - 舊版存的 true/false 會自動換成 soft/off。手順練習的複節奏不打細分音。
  - 音色：參考使用者自己的 Pro Metronome（`asdf82731-png/metronome`）木魚的音高滑落 1250→875 Hz，改成低通 3.5 kHz 的方波，滿音量保持 25 ms 再淡出。
  - 走獨立的 `clickBus`（0.9），在各頁面的放大倍數之後才接進限幅器，所以三個頁面的節拍器一樣大聲，約 −5.5 dB，比鼓聲大。
  - 要再更大聲，就會開始犧牲重音和輕音的差距。調整時要量兩件事：每一下的音量，以及重音和一般音的差距（約 50 ms 視窗）。

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
- 配器：右手 Hi-hat、Ride、China、Crash，或 Fill（混合筒鼓）；每組第一音可以加重音。

**Djent 線性**（節奏類型「Djent 線性」，`S.type = 'djent'`）
- 不湊滿小節：一個 cell（一組或幾組，`DJENT_CELLS`：3、5、7、4+5、5+6、5+7、6+7、3+3+5）一直重複，跨過小節線。
- 樂句 `S.dPhrase` 2／4／8 小節；`S.dEnd` = `cut`（在樂句結尾截斷）或 `full`（延長到 cell 接回第 1 拍：至少 dPhrase 小節、而且是循環長度的倍數）。
- `pattern.cell` 存 cell，`pattern.groups` 由 `expand()` 展開（每組帶 `ci` cell 序號，最後一組 `cut: true`）。換組、輪轉、打亂、對調、換鼓都改 cell，再重新展開，所以每次重複都一起換。
- 下方色塊只列 cell 的幾組；鼓譜標 ↺（cell 在小節第 1 拍重新開始）和 ✂（截斷）。
- 不分右腳左腳、不加 Fill（Fill 在 Djent Grooves）。

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
- **左腳腳踩鈸**（8 個，左腳改踩 Hi-hat，不做左右對調）：2、4 拍、每拍、反拍、大鼓／腳踩鈸交替、Swing（大鼓四分音符＋Hi-hat 2、4）、Swing＋左手 Comping、Samba、左腳 Son Clave 3-2（2 小節）。
- **隨機腳法**：8 分、三連音或 16 分；可以限制同一隻腳最多連踩幾下（1～4 下）；可以加入休止（約 25%）。一次產生 8 個。

### 7.2 練習資料格式
```js
{ id, name, en, sub, tip,
  hand: 'hh' | 'ride' | 'sn',   // RH 的樂器，預設 hh
  lf:   'bd' | 'hf',            // LF 的樂器：雙踏 bd 或腳踩鈸 hf，預設 bd
  RH: 'x.x. x.x. …', LH: '…', RF: '…', LF: '…' }
```
- 每個字元是一格（slot）：`x` 一般、`.` 休止（沒有重音、也沒有輕音）。空白會被忽略，只是為了好讀。
- **Double Pedal 不使用重音**：所有練習（含隨機腳法）每一下都一樣大聲，畫面上也沒有重音標記。不要再加 `X`。
- `sub` 是一拍幾格（1、2、3、4、6），長度除以 `sub` 就是幾拍一循環，必須整除，而且各軌長度要一樣。
- 「左腳開始」只對 LF 是大鼓、或標了 `swap: true` 的練習有效，會把 RF 和 LF 對調。

### 7.3 畫面
- **大字母腳順**：右腳 R 綠、左腳 L 紫；在「手腳組合」裡手的 R/L 用藍和紅；兩腳同時踩用 ✕。腳踩鈸模式不顯示大字母。
- **四肢格子圖**：右手、左手、右腳、左腳各一排，只顯示有用到的肢體。標籤寫肢體加樂器，例如「左腳／腳踩鈸」。
  - 每一欄是一格，拍與拍之間有分隔線，最下面一排是數拍。
  - 鼓用圓點，鈸和腳踩鈸用菱形。
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
  - 音量：每一下都是 0.62（沒有重音、也沒有輕音）。
- localStorage：`ft.settings`、`ft.best`、`ft.random`。

## 7b. App 3：Djent Grooves（Djent 節奏庫）

**目的**：練 Djent 的核心能力：奇數分組跨過小節線，上層鈸一直維持 4/4，不迷失拍子。需求訪談的決定都記在這裡。

### 結構
- **上層**：右手鈸（`pulse`：4 分 q、2 分 h、8 分 e、16 分 s；`cym`：china、crash、ride、hh），左手小鼓（`snare`：`3` 第 3 拍、`24` 2 和 4 拍、`riff` 跟著 riff）。
- **下層**：riff cell（`riff: ['KK.', 'KK.', 'K.']`，`K` 大鼓、`S` 小鼓、`g` 小鼓 Ghost note、`.` 休止）從第 1 拍開始一直重複，在 Fill 開始處（或樂句結尾）截斷。下層一定線性：小鼓固定在拍點時，那一格的大鼓讓開；`snare` 不是 `riff` 時 riff 裡的 `S` 改成大鼓。
- **大鼓**：`pedal` 雙踏或單踏；雙踏**每組從右腳開始、組內左右交替**；**沒有左腳開始選項**（使用者要求）。大鼓沒有輕重音。
- 拍號固定 4/4；`sub` 16 分（4）或 16 分六連音（6），每個練習有預設，可以用「音符」改。

### 樂句與 Fill
- `phrase` 2／4／8 小節；`end` = `cut`（預設）或 `full`（延長到 cell 接回第 1 拍，至少 phrase 小節）。`full` 時 Fill 蓋掉最後一段。
- Fill 長度 `fillLen`：auto（Fill 類用它自己的長度，其他 1 小節）、b1、b2、bar、none。`fillPick`：隨機（每個練習抽一個，可按「換一個 Fill」）或指定。
- Fill 是 Gospel chops 線性 cell（`FILLS`，例如 `RLK`、`RLRKK`），重複後**靠右對齊**：最後一組完整，剛好接回下一輪第 1 拍。Fill 期間鈸停。
- 完整練習：Fill 右手由高到低打 t1 → t2 → ft，左手小鼓；有 Fill 時樂句第 1 拍的鈸改成 Crash。

### 基本練習（`basic`）
每個 groove 都可以切換的開關，不是另一個分類。開啟時**只用 Hi-hat、小鼓、大鼓**（鈸強制 hh，Fill 的右手也打 hh、左手小鼓），仍然跨小節線、照截斷或跑完整個循環。

### 曲庫（38 個，全部是模仿風格的原創練習，不抄寫特定歌曲）
基本 Chug 6、奇數分組跨小節 8（3、5、7、9、11、13、5+7、3+3+5）、小鼓跟 riff 6、六連音爆發 4、Ghost note 律動 8、Gospel chops Fill 6。

### Ghost note 律動（`LIB.ghost`，練習帶 `dyn: true`）
- 這是唯一有輕重的類別，而且**只有小鼓**有三級：Ghost（`lvl: 'g'`，×0.28）、一般、重音（`lvl: 'a'`，×1.45，只給固定拍點的小鼓，也就是第 3 拍）。Hi-hat 在拍點之間 ×0.7（`lvl: 's'`）。**大鼓永遠沒有輕重**。
- 預設 Hi-hat、8 分音符（`16 分 Hi-hat＋Ghost` 用 16 分）。前 6 個是一整小節的形狀（一組 16 個音），最後 2 個是 5、7 個一組的 Ghost riff，會跨小節。
- 顯示：五線譜 Ghost note 加括號、重音在符桿上方畫 >，字母排顯示淡色 g；格子圖 Ghost 是小而淡的點、重音有外圈。
- 其他類別不受影響；需求訪談時決定不做「全部練習自動加 Ghost note」，也不放進 Linear Grooves。

### 畫面
- 下拉選單切換**五線譜（預設）／格子圖**。`dj.settings` 裡沒有 `v: 2` 的舊設定會在第一次開啟時改成五線譜一次，之後尊重使用者的選擇。格子圖一小節一行：鈸、筒鼓（只在用到的小節）、分組、小鼓、大鼓（兩腳同一排，右腳綠、左腳紫）、數拍。分組排顯示每組長度、↺、✂；Fill 區域有淡淡的底色。
- 五線譜：China B5（外加圓圈）、Crash A5、HH G5、Ride F5、t1 E5、t2 D5、小鼓 C5、落地鼓 A4、大鼓 F4；下面一排是下層的字母和分組括號。
- 播放時自動捲到目前這一小節。
- **平板**：寬度 ≥ 900px 兩欄（左譜 sticky、右設定 360px），五線譜每行兩小節，高度 ≤ 860px 時再壓縮，1280×800 可以一次看到 4 小節；760–899px 單欄加寬到 860px。播放列按鈕放大。

### 聲音
同樣的音量處理鏈，放大倍數 2.6。新增 China（中頻噪音＋不和諧方波）、Crash（明亮長尾）、t1／t2／ft。localStorage：`dj.settings`、`dj.best`。

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
  - 三個 App 的 `Page.getAppId` 不同
- **尚未做過的驗證**：真實手機上的安裝流程和音效聽感。

## 10. 待辦與可能的方向

- 使用者提過、可以考慮加入的內容：Blast Beat、更多爵士雙腳練法、聲音音量或音色調整。
- Djent Grooves 之後的候選：「自己組」產生器、奇數拍號（7/8 等）、32 分音符。
- `double-pedal/style.css` 是從 Linear Grooves 整份複製來的，裡面有用不到的樣式，之後可以精簡。
