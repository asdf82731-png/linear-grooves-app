// Building blocks shared by the four drum apps, made from Astryx components.
// Layout follows the practice-sheet design: header, practice card, 「練什麼」, folds, and a transport docked at the bottom.
import {useCallback, useEffect, useRef, useState} from 'react';
import {Theme} from '@astryxdesign/core/theme';
import {neutralTheme} from '@astryxdesign/theme-neutral/built';
import {Button} from '@astryxdesign/core/Button';
import {IconButton} from '@astryxdesign/core/IconButton';
import {Slider} from '@astryxdesign/core/Slider';
import {Switch} from '@astryxdesign/core/Switch';
import {Selector} from '@astryxdesign/core/Selector';
import {Collapsible} from '@astryxdesign/core/Collapsible';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import '@astryxdesign/theme-neutral/theme.css';
import '../mini-staff.js';
import './base.css';

export function AppTheme({children}) {
  return <Theme theme={neutralTheme} mode="system">{children}</Theme>;
}

/* ---------- state ---------- */
export function load(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch { return fallback; }
}
export function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}
// Settings object saved to localStorage under `key` on every change. `init` runs once on the loaded value (migrations).
export function useStored(key, defaults, init = s => s) {
  const [S, setS] = useState(() => init({...defaults, ...load(key, {})}));
  useEffect(() => save(key, S), [key, S]);
  const update = useCallback(patch => setS(s => ({...s, ...(typeof patch === 'function' ? patch(s) : patch)})), []);
  return [S, update, setS];
}
// A ref that always holds the latest value, for audio callbacks that outlive a render.
export function useLatest(v) {
  const r = useRef(v);
  r.current = v;
  return r;
}

// Status line on the practice card: flash() shows a message for 2.6 s.
export function useFlash() {
  const [msg, setMsg] = useState('');
  const timer = useRef(null);
  const flash = useCallback(m => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(cur => (cur === m ? '' : cur)), 2600);
  }, []);
  return [msg, flash, setMsg];
}

/* ---------- page pieces ---------- */
export function Header({title, tag, nav, guideOpen, onHelp}) {
  return (
    <header className="top">
      {nav}
      <div className="top-row">
        <Heading level={1} type="display-3" className="brand">{title}</Heading>
        {onHelp && <Button size="sm" variant={guideOpen ? 'primary' : 'secondary'} label="? 使用說明" onClick={onHelp} />}
      </div>
      {tag && <Text type="supporting" as="p">{tag}</Text>}
    </header>
  );
}

export function Guide({title = '三步開始練習', children, tips, onOk}) {
  return (
    <section className="guide" aria-label="使用說明">
      <Heading level={2}>{title}</Heading>
      <ol className="steps">{children}</ol>
      {tips && (
        <Collapsible trigger={<Text weight="semibold" color="accent">小技巧</Text>} defaultIsOpen={false}>
          <Glossary items={tips} />
        </Collapsible>
      )}
      <div><Button variant="primary" size="sm" label="知道了" onClick={onOk} /></div>
    </section>
  );
}

export function Glossary({items}) {
  return (
    <dl className="glossary">
      {items.map(([dt, dd]) => [<dt key={dt + 't'}>{dt}</dt>, <dd key={dt + 'd'}>{dd}</dd>])}
    </dl>
  );
}

// Folding settings panel (「練習設定」 and friends).
export function Fold({title, sub, children}) {
  return (
    <section className="panel fold">
      <Collapsible defaultIsOpen={false} trigger={
        <span className="fold-head"><Heading level={2}>{title}</Heading>{sub && <Text type="supporting">{sub}</Text>}</span>
      }>
        <div className="fold-body">{children}</div>
      </Collapsible>
    </section>
  );
}

export function Panel({title, children, id}) {
  return (
    <section className="panel" aria-labelledby={id}>
      {title && <Heading level={2} id={id}>{title}</Heading>}
      {children}
    </section>
  );
}

// Big single-choice tiles (練什麼).
export function ModeGrid({label, value, options, onChange}) {
  return (
    <div className="modes" role="radiogroup" aria-label={label}>
      {options.map(o => (
        <button key={o.value} type="button" role="radio" aria-checked={o.value === value} className="mode"
          onClick={() => onChange(o.value)}>
          <span className="mode-name">{o.label}</span>
          {o.sub && <span className="mode-sub">{o.sub}</span>}
        </button>
      ))}
    </div>
  );
}

// Segmented single choice with an optional small second line (一拍幾個音 and the like).
export function Seg({label, value, options, onChange}) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map(o => (
        <button key={o.value} type="button" role="radio" aria-checked={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}{o.sub && <small>{o.sub}</small>}
        </button>
      ))}
    </div>
  );
}

export function Field({label, children}) {
  return <div className="field"><Text type="label">{label}</Text>{children}</div>;
}

export function Toggle({label, description, value, onChange}) {
  return <Switch label={label} description={description} value={value} onChange={onChange} labelPosition="start" labelSpacing="spread" width="100%" />;
}

export function Choose({label, value, options, onChange, isLabelHidden}) {
  return (
    <Selector label={label} isLabelHidden={isLabelHidden} value={String(value)}
      options={options.map(o => (typeof o === 'object' ? {value: String(o.value), label: o.label} : {value: String(o), label: String(o)}))}
      onChange={v => onChange(v)} />
  );
}

/* ---------- practice card ---------- */
export function SheetHead({name, en, best}) {
  return (
    <div className="sheet-head">
      <div className="ex-title">
        <Heading level={2}>{name}</Heading>
        {en && <span className="ex-en">{en}</span>}
      </div>
      <span className={'best-pill' + (best ? ' has' : '')}>{best ? `最佳 ${best} BPM` : '還沒記錄'}</span>
    </div>
  );
}

export function Status({msg}) {
  return <div className="status" aria-live="polite">{msg}</div>;
}

export function ExNav({onPrev, onNext, reps}) {
  return (
    <div className="ex-nav">
      <Button size="sm" variant="ghost" label="◀ 上一個" onClick={onPrev} />
      <span className="reps">{reps}</span>
      <Button size="sm" variant="ghost" label="下一個 ▶" onClick={onNext} />
    </div>
  );
}

export function DoneButton({bpm, onClick}) {
  return <Button width="100%" label={`✓ 打順了，記錄 ${bpm} BPM`} onClick={onClick} />;
}

// Exercise list: name, colour-coded sticking, a half-bar mini staff and the best tempo.
export function ExList({items, cur, onPick}) {
  return (
    <ol className="ex-list">
      {items.map((it, i) => (
        <li key={it.key}>
          <button type="button" className={'ex' + (i === cur ? ' cur' : '')} onClick={() => onPick(i)}>
            <span className="ex-main">
              <span className="ex-name">{it.name}</span>
              {it.stick && <span className="ex-st">{it.stick}</span>}
            </span>
            {it.mini && <span className="ex-mini" dangerouslySetInnerHTML={{__html: it.mini}} />}
            <span className={'ex-best' + (it.best ? ' has' : '')}>{it.best ? it.best + ' BPM' : '—'}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

// Colour-coded letters: [{c, cls}] → <b class=cls>c</b>
export function Letters({items}) {
  return items.map((s, i) => <b key={i} className={s.cls}>{s.c}</b>);
}

/* ---------- transport dock ---------- */
// The big tempo number: tap it to type; Enter or tapping elsewhere applies it, Esc cancels.
export function BpmField({bpm, min, max, onCommit, onOutOfRange}) {
  const [draft, setDraft] = useState(null);
  const fresh = useRef(false);
  return (
    <input className="bpm" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={3} enterKeyHint="done" autoComplete="off"
      aria-label="速度 BPM，點一下可以直接輸入數字" value={draft ?? String(bpm)}
      onFocus={e => { fresh.current = true; setDraft(String(bpm)); e.target.select(); }}
      onClick={e => { if (fresh.current) { fresh.current = false; e.target.select(); } }}
      onChange={e => setDraft(e.target.value.replace(/\D/g, '').slice(0, 3))}
      onKeyDown={e => {
        if (e.key === 'Enter') e.currentTarget.blur();
        else if (e.key === 'Escape') { setDraft(null); setTimeout(() => e.target.blur()); }
      }}
      onBlur={() => {
        fresh.current = false;
        const v = parseInt(draft, 10);
        setDraft(null);
        if (!v) return;
        const c = Math.max(min, Math.min(max, v));
        onCommit(c);
        if (c !== v && onOutOfRange) onOutOfRange(c);
      }} />
  );
}

const PLAY = 'M7 4.5v15l13-7.5z', PAUSE = 'M6 5h4.5v14H6zM13.5 5H18v14h-4.5z';

// Bottom bar like a hardware metronome: main action on the left, tempo in the middle, ▶ on the right for the thumb.
export function Dock({actionLabel, onAction, bpm, setBpm, min = 30, max = 240, step = 5, playing, onPlay, flash, extra}) {
  return (
    <nav className="dock" aria-label="播放控制">
      <div className="dock-in">
        {actionLabel && <Button variant="primary" size="lg" label={actionLabel} onClick={onAction} />}
        <div className="tempo">
          <div className="tempo-top">
            <Button size="sm" label="−" tooltip="慢一點" onClick={() => setBpm(bpm - step)} />
            <BpmField bpm={bpm} min={min} max={max} onCommit={setBpm}
              onOutOfRange={c => flash?.(`速度可以設定 ${min}–${max}，已改成 ${c}`)} />
            <span className="bpm-unit">速度<br />BPM</span>
            <Button size="sm" label="+" tooltip="快一點" onClick={() => setBpm(bpm + step)} />
          </div>
          <Slider label="速度" isLabelHidden valueDisplay="none" min={min} max={max} value={bpm} onChange={setBpm} />
        </div>
        {extra}
        <IconButton className="play" variant="primary" size="lg" label={playing ? '停止' : '播放'} onClick={onPlay}
          icon={<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" fill="currentColor"><path d={playing ? PAUSE : PLAY} /></svg>} />
      </div>
    </nav>
  );
}

// Space plays / stops, ← → change exercise; ignored while typing in a field.
export function useKeys(map) {
  const ref = useLatest(map);
  useEffect(() => {
    const onKey = e => {
      if (e.target.closest?.('input, select, textarea, [contenteditable="true"], [role="combobox"]')) return;
      const f = ref.current[e.code === 'Space' ? 'Space' : e.key];
      if (f) { e.preventDefault(); f(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [ref]);
}

export function registerSW() {
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
  }
}
