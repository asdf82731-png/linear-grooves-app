// Share a practice item as a link, with no server: the data rides in the URL's #fragment
// (never sent to the web server), as base64url-encoded JSON. Same idea as GrooveScribe's shareable groove URLs.
//   shareLink('g', {p, bpm}) → https://…/linear-grooves/#g=eyJw…
//   readShared('g') → the object, or null; call clearShared() once it has been taken in.

const b64url = s => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = s => atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));

export function shareLink(key, data) {
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  const enc = b64url(String.fromCharCode(...bytes));
  return `${location.origin}${location.pathname}#${key}=${enc}`;
}

export function readShared(key) {
  const m = location.hash.match(new RegExp(`[#&]${key}=([A-Za-z0-9_-]+)`));
  if (!m) return null;
  try {
    const bin = unb64url(m[1]);
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))));
  } catch {
    return null;
  }
}

export function clearShared() {
  history.replaceState(null, '', location.pathname + location.search);
}

// The phone's share sheet when there is one (LINE, Messenger…), otherwise copy to the clipboard.
// Returns a message for the status line.
export async function sendLink(url, title) {
  if (navigator.share) {
    try { await navigator.share({title, url}); return '已開啟分享'; } catch (e) { if (e && e.name === 'AbortError') return ''; }
  }
  try { await navigator.clipboard.writeText(url); return '連結已複製，貼給別人就能打開這個節奏'; } catch { return url; }
}
