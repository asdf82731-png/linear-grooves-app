# Linear Grooves

鼓手練習工具，包含兩個工具（App 上方可切換）：**線性節奏**與**手順練習**。

爵士鼓「線性節奏」（linear grooves / fills）產生器與練習器，做成可安裝到 Android 主畫面的 PWA，離線也能用。

線性節奏的規則：任何時刻只有一個肢體發聲（右手 R、左手 L、大鼓 K 不重疊）。App 把小節切成數個短組（例如 `RLK`、`RLRK`、`RLRLK`），每組以大鼓結尾（或開頭），再串成整個小節。

## 功能
- 第一次開啟有「三步開始練習」說明，右上角「? 使用說明」可隨時再打開
- 難度一鍵選：入門／中等／進階；細部規則收在「進階規則」
- 隨機產生線性節奏：16 分音符、8 分三連音、16 分六連音；2/4–7/4；1 或 2 小節
- **Djent 線性**：固定一組（3、5、7）或組合（4+5、5+6、5+7、6+7、3+3+5）一直重複、跨過小節線；樂句 2／4／8 小節，結尾可選「截斷」或「跑完整個循環」；鼓譜標出 ↺ 接回第 1 拍、✂ 截斷；點任一組換掉時，每次重複都一起換
- 選擇允許的分組長度、大鼓在組尾或組首、允許雙踩 KK
- 配器：右手 Hi-hat、Ride、China、Crash，或 Fill（混合筒鼓）；每組第一音可加重音（大鼓不加）
- 鼓譜（五線譜）＋手順＋數拍（1 e & a），播放時即時標示目前音符
- 手順庫：經典、擴充（同手最多連 2 下的所有排列）、全部（所有 R/L 排列）；分組 2–8 音
- 點任一組：從清單「替換」成其他手順，或「輪轉」換起點；也可一次「組內輪轉」全部、「重排組順序」
- 整體位移：整段節奏往前/往後移一個音（例如從 1 e 開始），可跨小節線
- 換配器、左右對調（練弱手）、複製手順
- 合成鼓聲播放（不需音檔）、節拍器、預備拍、自動加速（每 N 次循環 +BPM）
- 收藏節奏（存在本機）

## 手順練習（sticking.html）
- 基本手法：單擊、雙擊、三擊、單 Paradiddle、六擊滾奏、Flam、Flam Tap、Flam Accent、Swiss Army Triplet、Drag
- Paradiddle 系列：四種起點（標準／反轉／反向／延遲）、雙、三 Paradiddle、Paradiddle-diddle、Paradiddle 打六連音、Flam Paradiddle、Flam Paradiddle-diddle
- 複節奏：3:2、4:3、5:4、5:3、5:2、7:4、2:3、3:4，雙線位置圖，可只聽單手
- 隨機手順：產生 8 個 R/L 組合（8 分或 16 分，可限制同手連打次數）
- 重音移動：單擊／雙擊／Paradiddle，重音逐一往後移
- 大字母手順＋單線譜（含重音、裝飾音），播放時標示目前的音
- 每個練習重複 N 次後自動換下一個；左手開始（R/L 對調）
- 練習墊音色，戴耳機時右手在右聲道、左手在左聲道
- 「打順了」記錄每個練習的最佳速度

## 安裝到 Android
1. 把這個 repo 用 GitHub Pages 發佈：Settings → Pages → Source 選 `Deploy from a branch`，Branch 選 `main` / `(root)`。
2. 用 Android 的 Chrome 開啟 `https://<你的帳號>.github.io/drum-practice/linear-grooves/`。
3. 選單 →「安裝應用程式」或「加到主畫面」。

之後就像一般 App 一樣從主畫面開啟，第一次開啟後可離線使用。

想上架 Google Play，可以用 [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) 或 [PWABuilder](https://www.pwabuilder.com/) 把這個 PWA 包成 TWA（.aab）。

## 本機開發
```sh
python3 -m http.server 8000
# 開 http://localhost:8000/linear-grooves/
```
純 HTML/CSS/JS，沒有建置步驟。修改後記得把 `sw.js` 的 `VERSION` 加一，已安裝的 App 才會更新快取。

## 另一個 App：Double Pedal
`../double-pedal/` 是獨立的雙踏與雙腳技巧練習 App，有自己的圖示，可以另外安裝，說明見 [double-pedal/README.md](../double-pedal/README.md)。

## 檔案
- `index.html` — 版面
- `style.css` — 樣式（自動深色模式）
- `app.js` — 產生器、鼓譜繪製、Web Audio 合成鼓與排程
- `sw.js` — 離線快取
- `manifest.webmanifest`、`icons/` — PWA 安裝資訊
