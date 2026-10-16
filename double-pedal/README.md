# Double Pedal 雙踏腳法

爵士鼓**雙踏與雙腳技巧**練習 App，獨立的 PWA，可以安裝到手機主畫面，離線也能用。

## 功能
- 單腳連踩：Heel-Toe 分解、Heel-Toe 雙擊（1 e／& a）、三連音雙擊、Heel-Toe＋搖滾節奏、單腳三擊、單腳連 4 下、8 分轉 16 分、單腳三連音與 16 分連續（可用「左腳開始」改練左腳）
- 雙踏基本功：4 分／8 分／三連音／16 分／六連音單擊、雙擊、腳的 Paradiddle、Gallop、反 Gallop、4 音與 6 音爆發
- 雙踏節奏：8 分、16 分連續雙踏、Gallop、三連音、Half-time、大鼓點綴、雙踏＋打點（手打 Hi-hat／Ride＋小鼓）
- 手腳組合（線性 Fill）：R＋腳腳、RL＋腳腳、腳腳＋RL、RLRL＋腳腳、RRLL＋腳腳、5 音組、R＋腳腳＋L
- 左腳腳踩鈸：2、4 拍、每拍、反拍、與大鼓交替、爵士 Swing（大鼓 Feathering）、Swing＋Comping、Samba、左腳 Son Clave 3-2
- 重音移動（單擊／雙擊，三連音或 16 分）、隨機腳法（可限制同腳連踩、加入休止）
- 大字母腳順＋四肢格子圖（右手、左手、右腳、左腳各一排），播放時整欄標示目前的音
- 每個練習附技巧提示；「腳法技巧」整理 Heel Down／Heel Up／Slide／Heel-Toe／Swivel、Hi-hat 踏法與踏板設定
- 聲部選擇：全部、只播手（你踩腳）、只播腳、只有節拍器
- 左腳開始、練習計時、自動換下一個、自動加速、預備拍、「打順了」記錄最佳速度
- 合成大鼓、小鼓、Hi-hat、Ride、腳踩鈸音色；戴耳機時右腳在右聲道、左腳在左聲道

## 安裝到手機
用 GitHub Pages 發佈這個 repo 後，網址是 `https://<你的帳號>.github.io/linear-grooves-app/double-pedal/`。
- Android：用 Chrome 開啟 → 選單 →「安裝應用程式」或「加到主畫面」
- iPhone：用 Safari 開啟 → 分享 →「加入主畫面」

## 本機開發
```sh
python3 -m http.server 8000
# 開 http://localhost:8000/double-pedal/
```
純 HTML/CSS/JS，沒有建置步驟。修改後把 `sw.js` 的 `VERSION` 加一（保留 `dp-` 開頭），已安裝的 App 才會更新。

## 檔案
- `index.html` — 版面
- `style.css` — 樣式（自動深色模式）
- `app.js` — 練習內容、四肢格子圖、Web Audio 合成鼓與排程
- `sw.js` — 離線快取
- `manifest.webmanifest`、`icons/` — PWA 安裝資訊
