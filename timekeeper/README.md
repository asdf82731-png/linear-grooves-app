# Time Keeper

**鼓手的時間感訓練**，獨立的 PWA，可以安裝到平板或手機主畫面，離線也能用。規格見 Claude Docs「Time Keeper 規格」。

## 功能
- **節拍器**：30–300 BPM、點按測速（T 鍵）、拍號 2/4–7/4、細分音（8 分、8 分三連音、16 分、16 分六連音；不打／比拍點小聲／一樣大聲）、預備拍
- **Gap click**：響 1／2／4 小節、安靜 1／2／4／8 小節循環；安靜時畫面預設不提示；漸進模式每成功一輪多安靜 1 小節（開麥克風時回來那一拍要在 ±30 ms 內）
- **位移節拍器**：click 只在 2、4 拍、每拍的 &、e、a，或每小節／每 2 小節第 1 拍；畫面標出 click 在一拍裡的位置
- **漸進速度**：從目前速度一路變到終點，或速度梯（到頂再回到起點）；每 N 小節變 X BPM
- **麥克風偵測（Beta）**：只偵測 4 分或 8 分音符。每一下對到最近的拍點，顯示快或慢幾毫秒（±10 ms 算準）；停止後顯示平均偏差、穩定度（標準差）、Gap click 安靜時的速度，以及每一下的偏差圖
- **延遲校正**：跟著 click 打 8 下，取中位數當作「平板 → Xenyx → 耳機 → 你 → 平板麥克風」的延遲
- **練習紀錄**：練超過 10 秒就存（最多 500 筆），附穩定度變化圖

## 使用情境
照《21 練習接線規劃》方案 B：平板 3.5mm（USB-C 轉接頭）→ Xenyx 502 CH1 → 耳機；鼓是電子鼓，平板用內建麥克風聽鼓棒打在 pad 上的聲音。只用在模式 1「快速練」。電子鼓 MIDI 輸入留到第二版（需要能同時接 eDRUMin 和耳機的 USB-C 擴充器）。

## 偵測方法
`onset-worklet.js` 在 AudioWorklet 裡處理麥克風：80 Hz 高通 → 包絡（瞬間上升、4 ms 釋放）→ 超過靈敏度門檻、而且大於 2–15 ms 前最大值的 3 倍就算一下，之後 50 ms 不再算。偵測時間在 AudioContext 的時鐘上，和節拍器同一個時鐘。同一個 class 也用在離線測試。

## 本機開發
```sh
python3 -m http.server 8000
# 開 http://localhost:8000/timekeeper/
```
麥克風只在 https 或 localhost 可用。修改後把 `sw.js` 的 `VERSION` 加一（保留 `tk-` 開頭）。

## 檔案
- `index.html`、`style.css`（從 Double Pedal 複製，加上 Time Keeper 與平板版面）
- `app.js` — 節拍器排程、四種模式、計分、校正、紀錄
- `onset-worklet.js` — 打擊偵測（AudioWorklet）
- `sw.js`、`manifest.webmanifest`（`id: "timekeeper"`）、`icons/`
