# Pro Metronome（PWA）

可安裝到手機主畫面、離線使用的節拍器。

網址：`https://asdf82731-png.github.io/linear-grooves-app/metronome/`

原本是獨立的 repo（`asdf82731-png/metronome`），現在和其他鼓手練習 App 放在同一個 repo，共用 `shared/src/` 的輸出音量處理鏈、背景不變慢的排程計時器和螢幕恆亮。

## 安裝到手機

- **iPhone（Safari）**：開啟網址 → 分享按鈕 → 「加入主畫面」。
- **Android（Chrome）**：開啟網址 → 右上選單 → 「安裝應用程式」或「加到主畫面」。

第一次開啟後就會快取，之後沒有網路也能使用。

## 程式架構（Astryx 版）

介面用 [Astryx](https://github.com/meta/astryx)（Meta 開源的設計系統）＋ React 19 製作，用 Vite 建置。

- `src/`：原始碼。改程式只改這裡。
  - `App.jsx`：畫面（Astryx 元件）
  - `engine.js`：Web Audio 節拍器（排程、合成音色、人聲數拍）
  - `music.js`：拍號、細分節奏、音色等資料
  - `vox.js`：人聲數拍的音檔（base64）
  - `styles.css`：版面、擺錘、拍子條等節拍器專用的樣式（顏色用 Astryx 主題 token）
  - `public/`：`sw.js`、`manifest.webmanifest`、`icons/`，建置時原樣複製到根目錄
- 共用的部分在 `../shared/src/`：`audio.js`（限幅器＋軟削波的輸出鏈 `createLimiter`、螢幕恆亮 `createWakeLock`）、`timer.js`（排程用的計時器）。畫面沒有用 `shared/src/ui.jsx`，節拍器有自己的版面和字型。
- `metronome/` 底下的 `index.html`、`assets/`、`sw.js`、`manifest.webmanifest`、`icons/` 是**建置產生的檔案**，GitHub Pages 直接提供它們。不要手動修改。

## 更新版本

在 repo 根目錄執行：

```bash
npm install                  # 第一次
npm run build -- metronome   # 改完 metronome/src/ 之後重新建置
npm run check -- metronome   # 自動檢查
```

1. 把 `metronome/src/public/sw.js` 的版本（例如 `pro-metronome-v27`）加一。
2. 建置後把 `src/` 和建置產生的檔案一起 commit。
3. 手機重新開啟 App 一兩次就會拿到新版。

自動檢查在手機直向、手機橫向、平板直向、平板橫向（TCL NXTPAPER 11）各開一次，檢查：打開沒有錯誤、開始鍵完整出現在畫面上（不用捲動）、BPM 輸入 300 時三位數沒有被截斷、頁面不會左右捲動。
