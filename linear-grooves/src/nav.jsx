// Switch between the two tools of the app (上方膠囊).
export function ToolsNav({cur}) {
  return (
    <nav className="tools-nav" aria-label="切換工具">
      <a href="sticking.html" aria-current={cur === 'sticking' ? 'page' : undefined}>手順練習</a>
      <a href="./" aria-current={cur === 'grooves' ? 'page' : undefined}>線性節奏</a>
    </nav>
  );
}
