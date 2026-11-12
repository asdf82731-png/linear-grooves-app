import {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {NumberInput} from '@astryxdesign/core/NumberInput';
import {
  AppTheme, MainColumn, SideColumn, Choose, DoneButton, Dock, ExItems, ExNav, Field, FoldGroup, Group, Guide, Header, Hint, ModeList, Page, Pair,
  PracticeCard, SegChoice, SheetHead, Status, Toggle, load, save, useFlash, useKeys, useLatest, useStored,
} from '../../shared/src/ui.jsx';
import {ACCENT_BASES, MODES, SUB_NAME, makeRandom, miniFor, notationHtml, sheet as buildSheet, stickString, swapped} from './sticking-data.js';
import {createEngine} from './sticking-engine.js';
import {ToolsNav} from './nav.jsx';

const MIN_BPM = 30, MAX_BPM = 240;
const DEFAULTS = {
  mode: 'rud', rSub: 4, rRun: 2, aBase: 'single', aSub: 4,
  reps: 8, autoNext: false, leftLead: false,
  bpm: 70, click: true, clickNote: 'q', clickSub: 'soft', countIn: false, trainer: false, trainerEvery: 4, trainerStep: 5, trainerMax: 140,
  polyMute: 'none', idx: {rud: 0, para: 0, rand: 0, acc: 0, poly: 0},
};
const MODE_OPTS = [
  {value: 'rud', label: '基本手法', sub: 'Rudiments'},
  {value: 'para', label: 'Paradiddle 系列', sub: '10 種變化'},
  {value: 'poly', label: '複節奏', sub: 'Polyrhythms'},
  {value: 'rand', label: '隨機手順', sub: 'R/L 組合'},
  {value: 'acc', label: '重音移動', sub: 'Accents'},
];
const TIPS = [
  ['速度', '從能打得穩、打得放鬆的速度開始，寧可慢也不要亂。'],
  ['自動換下一個', '預設會一直循環同一個練習。在「練習設定」打開「練完自動換下一個」，每個練習打完設定的次數就會跳到下一個，適合整份練完。'],
  ['左手開始', 'R、L 全部對調，用來加強比較弱的那隻手。'],
  ['聲音', '戴耳機時，右手的聲音在右邊、左手在左邊。'],
];

function migrate(S) {
  S.idx = {...DEFAULTS.idx, ...S.idx};
  if (!S.loopByDefault) { S.autoNext = false; S.loopByDefault = true; }   // exercises loop by default now
  if (!['q', 'e'].includes(S.clickNote)) S.clickNote = 'q';
  if (!['soft', 'same', 'off'].includes(S.clickSub)) S.clickSub = S.clickSub === false ? 'off' : 'soft';
  if (!MODES.includes(S.mode)) S.mode = 'rud';
  if (!ACCENT_BASES[S.aBase]) S.aBase = 'single';
  return S;
}
const randomFits = (r, S) => r && r.sub === S.rSub && r.run === S.rRun;

export default function App() {
  return <AppTheme><Sticking /></AppTheme>;
}

function Sticking() {
  const [S, update] = useStored('sc.settings', DEFAULTS, migrate);
  const [best, setBest] = useState(() => load('sc.best', {}));
  const [rand, setRand] = useState(() => { const r = load('sc.random', null); return randomFits(r, S) ? r : makeRandom(S); });
  const [playing, setPlaying] = useState(false);
  const [repsN, setRepsN] = useState(0);
  const [msg, flash, setMsg] = useFlash();
  const [help, setHelp] = useState(false);
  const restart = useRef(false), practice = useRef(null), notation = useRef(null);

  useEffect(() => save('sc.best', best), [best]);
  useEffect(() => save('sc.random', rand), [rand]);
  useEffect(() => {
    if (!randomFits(rand, S)) { setRand(makeRandom(S)); update(s => ({idx: {...s.idx, rand: 0}})); }
  }, [S.rSub, S.rRun]); // eslint-disable-line react-hooks/exhaustive-deps

  const sheet = useMemo(() => buildSheet(S, rand), [S.mode, S.aBase, S.aSub, rand]); // eslint-disable-line react-hooks/exhaustive-deps
  const idx = Math.min(S.idx[S.mode] || 0, sheet.length - 1);
  const cur = sheet[idx];
  const SL = useMemo(() => swapped(cur.notes, S.leftLead), [cur, S.leftLead]);
  const html = useMemo(() => notationHtml(cur, SL), [cur, SL]);

  // Slot highlighting goes straight to the DOM (the staff).
  const hl = useRef({map: [], last: -1});
  useLayoutEffect(() => {
    const map = SL.map(() => []);
    [notation.current].forEach(box => box?.querySelectorAll('[data-i]').forEach(el => map[+el.dataset.i]?.push(el)));
    // a re-render that rebuilt the elements keeps the slot that is sounding lit
    const last = hl.current.last;
    if (last >= 0) map[last]?.forEach(el => el?.classList.add('on'));
    hl.current = {map, last};
  }, [html, SL, cur.poly]); // eslint-disable-line react-hooks/exhaustive-deps
  const highlight = i => {
    const h = hl.current;
    if (h.last >= 0 && h.map[h.last]) h.map[h.last].forEach(el => el.classList.remove('on'));
    if (i >= 0 && h.map[i]) h.map[i].forEach(el => el.classList.add('on'));
    h.last = i;
  };

  const live = useLatest({S, sheet, idx});
  const engine = useMemo(() => createEngine({
    get: () => live.current,
    onSlot: i => { highlight(i); if (i === 0) setMsg(m => (m.startsWith('預備') ? '' : m)); },
    onCount: n => setMsg(`預備 ${n}`),
    onReps: n => setRepsN(n),
    onShow: i => { update(s => ({idx: {...s.idx, [s.mode]: i}})); flash(`下一個：${live.current.sheet[i].name}`); },
    onMsg: m => flash(m),
    onBpm: v => update({bpm: v}),
  }), []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => engine.setBpm(S.bpm), [engine, S.bpm]);
  useEffect(() => { if (restart.current) { restart.current = false; engine.play(); } });

  const setBpm = v => update({bpm: Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(v)))});
  const play = () => { engine.play(); setPlaying(true); setRepsN(0); };
  const stop = () => { engine.stop(); setPlaying(false); highlight(-1); setMsg(''); setRepsN(0); };
  const toggle = () => (engine.isPlaying() ? stop() : play());
  const replay = () => { if (engine.isPlaying()) { engine.stop(); highlight(-1); setRepsN(0); restart.current = true; } };
  const go = i => { update(s => ({idx: {...s.idx, [s.mode]: ((i % sheet.length) + sheet.length) % sheet.length}})); replay(); };
  const rebuild = patch => { if (engine.isPlaying()) stop(); update(patch); };
  useKeys({Space: toggle, ArrowRight: () => go(idx + 1), ArrowLeft: () => go(idx - 1)});

  const record = () => {
    const prev = best[cur.key] || 0;
    setBest({...best, [cur.key]: Math.max(prev, S.bpm)});
    flash(S.bpm > prev ? `記錄 ${S.bpm} BPM！下次試試 ${S.bpm + 5}` : `已記錄，你的最佳是 ${prev} BPM`);
  };
  const repsTxt = playing ? `第 ${repsN + 1}${S.autoNext && S.reps ? ` / ${S.reps}` : ''} 次` : (S.autoNext && S.reps ? `每個練 ${S.reps} 次` : '重複練同一個');
  // the guide stays closed until 「? 使用說明」 is tapped
  const showGuide = help;
  const many = S.leftLead ? '左' : '右', few = S.leftLead ? '右' : '左';
  const en = cur.poly ? `${many}手平均打 ${cur.poly.a} 下，${few}手同時平均打 ${cur.poly.b} 下`
    : cur.en ? (cur.en === cur.name ? '' : cur.en) : stickString(SL).replace(/(.{4})/g, '$1 ').trim();

  return (
    <Page className="split">
      <MainColumn>
        <Header nav={<ToolsNav cur="sticking" />} title="Sticking"
          guideOpen={showGuide} onHelp={() => setHelp(h => !h)} />
        {showGuide && (
          <Guide tips={TIPS} onOk={() => setHelp(false)}
          steps={[
            <><b>在下方「練什麼」選一個練習</b>，第一次建議從「單擊」開始。</>,
            <><b>按 ▶</b>，跟著大字母打：<span className="key R">R</span> 右手、<span className="key L">L</span> 左手。有底線的字要打重音（大聲一點），左上角的小字是裝飾音，用另一隻手輕輕先敲。</>,
            <><b>打順了就按「✓ 打順了」</b>記錄速度，再把速度調快 5 BPM 繼續練。</>,
          ]} />
        )}

        <PracticeCard cardRef={practice}>
          <SheetHead name={cur.name} en={en} best={best[cur.key]} />
          <div className="meta">
            {cur.poly ? `節拍器跟著${few}手（每拍一下） · 第 ${idx + 1} / ${sheet.length} 個`
              : `${SUB_NAME[cur.sub]} · ${cur.notes.length / cur.sub} 拍一循環 · 第 ${idx + 1} / ${sheet.length} 個`}
          </div>
          <Status msg={msg} />
          <div className="notation" ref={notation} dangerouslySetInnerHTML={{__html: html}} />
          <ExNav onPrev={() => go(idx - 1)} onNext={() => go(idx + 1)} reps={repsTxt} />
          <DoneButton bpm={S.bpm} onClick={record} />
        </PracticeCard>
      </MainColumn>

      <SideColumn>
        <Group title="練什麼" id="h-what">
          <ModeList label="練習類型" value={S.mode} options={MODE_OPTS} onChange={m => rebuild({mode: m})} />
          {S.mode === 'rud' && <Hint>鼓手最常用的基本手法，由簡單到難排列。</Hint>}
          {S.mode === 'para' && <Hint>先練單 Paradiddle 的四種起點（標準、反轉、反向、延遲），再練雙、三 Paradiddle 和加了 Flam 的版本。</Hint>}
          {S.mode === 'poly' && (
            <>
              <Hint>兩隻手在同一段時間裡平均打不同的次數，例如 3 對 2：右手打 3 下的時間，左手剛好打 2 下。圖上方那排是右手、下方是左手，對齊的點兩手同時打（清單裡用 <b>✕</b> 表示）。先用「只聽…」分開聽清楚，再兩手一起。</Hint>
              <Choose label="聲音" value={S.polyMute} onChange={v => update({polyMute: v})}
                options={[{value: 'none', label: '兩隻手都出聲'}, {value: 'L', label: '只聽右手'}, {value: 'R', label: '只聽左手'}]} />
            </>
          )}
          {S.mode === 'rand' && (
            <>
              <Hint>隨機產生 8 個左右手組合，一個接一個練，訓練看譜反應。</Hint>
              <Pair>
                <Field label="一拍打幾個音">
                  <SegChoice label="一拍打幾個音" value={S.rSub} onChange={v => rebuild({rSub: v})} options={[{value: 2, label: '2 個', sub: '8 分'}, {value: 4, label: '4 個', sub: '16 分'}]} />
                </Field>
                <Choose label="同一隻手最多連打" value={S.rRun} onChange={v => rebuild({rRun: +v})}
                  options={[{value: 1, label: '1 下（左右交替）'}, {value: 2, label: '2 下'}, {value: 3, label: '3 下'}, {value: 4, label: '4 下'}]} />
              </Pair>
              <div><Button size="sm" label="換一組新的" onClick={() => { if (engine.isPlaying()) stop(); setRand(makeRandom(S)); update(s => ({idx: {...s.idx, rand: 0}})); flash('換了一組新的隨機手順'); }} /></div>
            </>
          )}
          {S.mode === 'acc' && (
            <>
              <Hint>同一個手順，重音一個一個往後移，練習手的高低控制。選「兩個重音」時，每拍有兩個重音，練遍所有位置組合。</Hint>
              <Pair>
                <Choose label="基本手順" value={S.aBase} onChange={v => rebuild(s => ({aBase: ACCENT_BASES[v] ? v : 'single', idx: {...s.idx, acc: 0}}))}
                  options={[{value: 'single', label: '單擊 R L'}, {value: 'single2', label: '單擊 R L（兩個重音）'}, {value: 'double', label: '雙擊 R R L L'}, {value: 'para', label: 'Paradiddle R L R R L R L L'}]} />
                <Field label="一拍打幾個音">
                  <SegChoice label="一拍打幾個音" value={S.aSub} onChange={v => rebuild(s => ({aSub: v, idx: {...s.idx, acc: 0}}))} options={[{value: 3, label: '3 個'}, {value: 4, label: '4 個'}]} />
                </Field>
              </Pair>
            </>
          )}
          <ExItems cur={idx} onPick={i => { go(i); practice.current?.scrollIntoView({behavior: 'smooth', block: 'start'}); }}
            items={sheet.map(ex => {
              const notes = swapped(ex.notes, S.leftLead);
              const st = ex.poly
                ? notes.map((n, k) => (n.h === '-' ? <b key={k} className="rest">·</b> : n.h === 'B' ? <b key={k} className="B">✕</b> : <b key={k} className={n.h}>{n.h}</b>))
                : notes.map((n, k) => <b key={k} className={n.h + (n.acc ? ' acc' : '')}>{n.h}</b>);
              return {key: ex.key, name: ex.name, stick: st, mini: miniFor(ex, S.leftLead), best: best[ex.key]};
            })} />
        </Group>

        <FoldGroup title="練習設定" sub="次數、自動換下一個、左手開始、節拍器">
          <Choose label="節拍器打幾分音符" value={S.clickNote} onChange={v => update({clickNote: v})}
            options={[{value: 'q', label: '四分音符（每拍一聲）'}, {value: 'e', label: '八分音符（每拍兩聲）'}]} />
          <Toggle label="練完自動換下一個" value={S.autoNext} onChange={v => update({autoNext: v})} />
          <Choose label="每個練習重複幾次" value={S.reps} onChange={v => update({reps: +v})} options={[4, 8, 16, 32]} />
          <Toggle label="左手開始" description="R、L 對調；複節奏則換成左手打多的那邊" value={S.leftLead} onChange={v => { update({leftLead: v}); replay(); }} />
          <Toggle label="節拍器" value={S.click} onChange={v => update({click: v})} />
          <Choose label="節拍器的細分音（例如 16 分音符的 e & a）" value={S.clickSub} onChange={v => update({clickSub: v})}
            options={[{value: 'soft', label: '比拍點小聲'}, {value: 'same', label: '跟拍點一樣大聲'}, {value: 'off', label: '不打，只有拍點'}]} />
          <Toggle label="預備拍：開始前先數一小節" value={S.countIn} onChange={v => update({countIn: v})} />
          <Toggle label="自動加速：打熟了自動變快" value={S.trainer} onChange={v => { update({trainer: v}); engine.resetLoops(); }} />
          {S.trainer && (
            <Pair>
              <Choose label="每重複幾次加快" value={S.trainerEvery} onChange={v => update({trainerEvery: +v})} options={[2, 4, 8]} />
              <Choose label="每次加快（BPM）" value={S.trainerStep} onChange={v => update({trainerStep: +v})} options={[2, 5, 10]} />
              <NumberInput label="最快到（BPM）" isIntegerOnly min={30} max={260} value={S.trainerMax}
                onChange={v => update({trainerMax: Math.max(30, Math.min(260, Math.round(v) || DEFAULTS.trainerMax))})} />
            </Pair>
          )}
        </FoldGroup>
      </SideColumn>

      <Dock actionLabel="下一個" onAction={() => go(idx + 1)} bpm={S.bpm} setBpm={setBpm} min={MIN_BPM} max={MAX_BPM}
        playing={playing} onPlay={toggle} flash={flash} />
    </Page>
  );
}
