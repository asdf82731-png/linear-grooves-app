# 鼓手練習 App

這個 repo 有兩個**獨立**的 PWA，各自安裝到手機主畫面、各自離線使用：

| App | 練什麼 | 網址 |
| --- | --- | --- |
| [Linear Grooves](linear-grooves/) | 手：線性節奏、手順、Paradiddle、複節奏 | `https://asdf82731-png.github.io/drum-practice/linear-grooves/` |
| [Double Pedal 雙踏腳法](double-pedal/) | 腳：雙踏、手腳組合、腳踩鈸、Swing | `https://asdf82731-png.github.io/drum-practice/double-pedal/` |

根目錄的 `index.html` 只是選擇頁（不能安裝）。兩個 App 的範圍（scope）不重疊，所以安裝其中一個不會影響另一個。

根目錄的 `sw.js` 只用來移除舊版：Linear Grooves 以前放在根目錄，它的 service worker 範圍包含整個網站。新版不會再註冊它。

## 發佈
Settings → Pages → Source 選 `Deploy from a branch`，Branch 選 `main` / `(root)`。

## 本機開發
```sh
python3 -m http.server 8000
# Linear Grooves: http://localhost:8000/linear-grooves/
# Double Pedal:   http://localhost:8000/double-pedal/
```
