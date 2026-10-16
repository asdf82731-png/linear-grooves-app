# Linear Grooves

爵士鼓「線性節奏」（linear grooves / fills）產生器與練習器，做成可安裝到 Android 主畫面的 PWA，離線也能用。

線性節奏的規則：任何時刻只有一個肢體發聲（右手 R、左手 L、大鼓 K 不重疊）。App 把小節切成數個短組（例如 `RLK`、`RLRK`、`RLRLK`），每組以大鼓結尾（或開頭），再串成整個小節。

## 功能
- 隨機產生線性節奏：16 分音符、8 分三連音、16 分六連音；2/4–7/4；1 或 2 小節
- 選擇允許的分組長度（2–6 音）、大鼓在組尾或組首、允許雙踩 KK
- 配器：右手 Hi-hat、右手 Ride、Fill（混合筒鼓）；每組第一音可加重音
- 鼓譜（五線譜）＋手順＋數拍（1 e & a），播放時即時標示目前音符
- 點任一組只重新產生那一組；換配器、左右對調（練弱手）、複製手順
- 合成鼓聲播放（不需音檔）、節拍器、預備拍、自動加速（每 N 次循環 +BPM）
- 收藏節奏（存在本機）

## 安裝到 Android
1. 把這個 repo 用 GitHub Pages 發佈：Settings → Pages → Source 選 `Deploy from a branch`，Branch 選 `main` / `(root)`。
2. 用 Android 的 Chrome 開啟 `https://<你的帳號>.github.io/linear-grooves/`。
3. 選單 →「安裝應用程式」或「加到主畫面」。

之後就像一般 App 一樣從主畫面開啟，第一次開啟後可離線使用。

想上架 Google Play，可以用 [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) 或 [PWABuilder](https://www.pwabuilder.com/) 把這個 PWA 包成 TWA（.aab）。

## 本機開發
```sh
python3 -m http.server 8000
# 開 http://localhost:8000
```
純 HTML/CSS/JS，沒有建置步驟。修改後記得把 `sw.js` 的 `VERSION` 加一，已安裝的 App 才會更新快取。

## 檔案
- `index.html` — 版面
- `style.css` — 樣式（自動深色模式）
- `app.js` — 產生器、鼓譜繪製、Web Audio 合成鼓與排程
- `sw.js` — 離線快取
- `manifest.webmanifest`、`icons/` — PWA 安裝資訊
