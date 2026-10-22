# 鼓手練習 App

這個 repo 有四個**獨立**的 PWA，各自安裝到手機主畫面、各自離線使用：

| App | 練什麼 | 網址 |
| --- | --- | --- |
| [Linear Grooves](linear-grooves/) | 手：線性節奏、手順、Paradiddle、複節奏 | `https://asdf82731-png.github.io/linear-grooves-app/linear-grooves/` |
| [Double Pedal 雙踏腳法](double-pedal/) | 腳：雙踏、手腳組合、腳踩鈸、Swing | `https://asdf82731-png.github.io/linear-grooves-app/double-pedal/` |
| [Djent Grooves](djent/) | Djent 節奏庫：鈸固定 4/4、大鼓奇數分組跨小節、Gospel chops Fill | `https://asdf82731-png.github.io/linear-grooves-app/djent/` |
| [Time Keeper](timekeeper/) | 時間感：Gap click、位移節拍器、漸進速度、麥克風偵測準度 | `https://asdf82731-png.github.io/linear-grooves-app/timekeeper/` |

根目錄的 `index.html` 只是選擇頁（不能安裝）。四個 App 的範圍（scope）不重疊，所以安裝其中一個不會影響其他的。

根目錄的 `sw.js` 只用來移除舊版：Linear Grooves 以前放在根目錄，它的 service worker 範圍包含整個網站。新版不會再註冊它。

## 發佈
Settings → Pages → Source 選 `Deploy from a branch`，Branch 選 `main` / `(root)`。

## 本機開發
```sh
python3 -m http.server 8000
# Linear Grooves: http://localhost:8000/linear-grooves/
# Double Pedal:   http://localhost:8000/double-pedal/
# Djent Grooves:  http://localhost:8000/djent/
# Time Keeper:    http://localhost:8000/timekeeper/
```
