import {useEffect, useMemo, useRef, useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {NumberInput} from '@astryxdesign/core/NumberInput';
import {CheckboxInput} from '@astryxdesign/core/CheckboxInput';
import {
  AppTheme, Tip, Choose, DoneButton, Dock, ExItems, ExNav, Field, FoldGroup, Glossary, Group, Guide, Header, Hint, Letters,
  ModeList, Page, Pair, PracticeCard, SegChoice, SheetHead, Status, Toggle, load, save, useFlash, useKeys, useLatest, useStored,
} from '../../shared/src/ui.jsx';
import {
  BASIC, COMBO, COUNTS, GROOVE, HEEL, HIHAT, INST_NAME, LIMB_NAME, MODES, SUB_NAME,
  build, feetFrom, randomFeet, sticking, swapped,
} from './data.js';
import {createEngine} from './engine.js';

const MIN_BPM = 30, MAX_BPM = 240;
const DEFAULTS = {
  mode: 'basic', rSub: 4, rRun: 2, rRest: false,
  reps: 8, autoNext: false, leftLead: false, playPart: 'all', timer: 0,
  bpm: 70, click: true, clickSub: 'soft', countIn: false, trainer: false, trainerEvery: 4, trainerStep: 5, trainerMax: 160,
  seenGuide: false, idx: {basic: 0, heel: 0, groove: 0, combo: 0, hh: 0, rand: 0},
};
const LISTS = {basic: BASIC, heel: HEEL, groove: GROOVE, combo: COMBO, hh: HIHAT};
const MODE_OPTS = [
  {value: 'basic', label: '雙踏基本功', sub: '只有腳'},
  {value: 'heel', label: '單腳連踩', sub: 'Heel-Toe・單踏板'},
  {value: 'groove', label: '雙踏節奏', sub: '腳＋手的 Groove'},
  {value: 'combo', label: '手腳組合', sub: 'Hand-Foot Fills'},
  {value: 'hh', label: '左腳腳踩鈸', sub: '獨立性・Swing'},
  {value: 'rand', label: '隨機腳法', sub: '看譜反應'},
];
const MODE_HINT = {
  basic: '兩腳都踩大鼓（雙踏板）。由簡單到難：先求左右腳音量、間隔一樣，再求快。',
  heel: '只用一隻腳、一個踏板，練同一腳連續踩：Heel-Toe 雙擊、三擊、連 4 下、到 16 分連續。預設練右腳；打開「左腳開始」就換成左腳踩雙踏的左踏板。每組的第一下通常用腳跟。',
  groove: '手打穩定的 Hi-hat／Ride 和小鼓，腳在下面踩雙踏。先把手打到不用想，再把注意力放在腳。',
  combo: <>手和腳輪流發聲（同一時間只有一個肢體），常用在過門（Fill）。<span className="key R">R</span><span className="key L">L</span> 是手、<span className="key fR">R</span><span className="key fL">L</span> 是腳。</>,
  hh: '左腳改踩 Hi-hat 踏板（踩下去「嚓」一聲）。右手在 Ride，右腳踩大鼓。這一類不會左右腳對調。',
  rand: '隨機產生 8 個腳順，一個接一個練，訓練看譜反應。',
};
const TIPS = [
  ['只放手的部分', '在「練習設定」把聲音改成「只播手的部分」，App 幫你打手，你專心踩腳。'],
  ['左腳開始', '雙踏練習的左右腳對調，用來加強比較弱的左腳。'],
  ['聲音', '戴耳機時，右腳的大鼓在右邊、左腳在左邊，聽得出哪一腳不平均。'],
  ['計時', '設定練習時間，時間到自動停，適合練耐力。'],
];
const TECHNIQUE = [
  ['Heel Down 腳跟放下', '腳跟貼著踏板，用腳踝發力。動作小、好控制，適合慢速。'],
  ['Heel Up 腳跟抬起', '腳跟離開踏板，用整條腿的重量往下，是搖滾、雙踏最常用的踩法。'],
  ['Slide 滑踩', '腳從踏板中間往前滑，一個動作踩出兩下（雙擊）。先練慢的「一下、兩下」，再把兩下連起來。'],
  ['Heel-Toe 腳跟腳尖', '腳尖抬著、腳跟往下踩出第一下；腳跟留在原位，換腳尖往下踩出第二下，像腳在踏板上「搖」一下。一個循環就是兩下，適合單踏板的快速雙擊。先練「分解」，兩下一樣大聲再加速。'],
  ['Swivel 轉腳', '腳尖左右轉動帶動每一下，速度很快時可以減少大腿負擔。'],
  ['Hi-hat 踏法', '2、4 拍「嚓」：腳尖踩下馬上放鬆。也可以腳跟上下帶出 Heel-Toe 的「1 & 2 &」。'],
  ['彈簧與椅子', '左右踏板的彈簧鬆緊、拍頭角度盡量調成一樣；椅子高度讓大腿約略和地面平行。'],
  ['左腳比較弱', '開「左腳開始」練一樣的內容；速度先降 10 BPM，讓兩腳聽起來一樣大聲、一樣平均。'],
  ['不要壓著鼓皮', '踩完讓拍頭彈回來，不要一直壓在鼓皮上，聲音才會乾淨、不悶。'],
];

// Earlier versions' saved settings keep working.
function migrate(S) {
  S.idx = {...DEFAULTS.idx, ...S.idx};
  if (!S.loopByDefault) { S.autoNext = false; S.loopByDefault = true; }   // exercises loop by default now
  if (!['soft', 'same', 'off'].includes(S.clickSub)) S.clickSub = S.clickSub === false ? 'off' : 'soft';
  if (!MODES.includes(S.mode)) S.mode = 'basic';
  if (![2, 3, 4].includes(S.rSub)) S.rSub = 4;
  return S;
}
function makeRandom(S) {
  const n = S.rSub * 4, seen = new Set(), list = [];
  for (let tries = 0; list.length < 8 && tries < 400; tries++) {
    const f = randomFeet(n, S.rRun, S.rRest);
    if (seen.has(f)) continue;
    seen.add(f);
    list.push(f);
  }
  return {sub: S.rSub, run: S.rRun, rest: S.rRest, list};
}
const randomFits = (r, S) => r && r.sub === S.rSub && r.run === S.rRun && r.rest === S.rRest;

export default function App() {
  return <AppTheme><DoublePedal /></AppTheme>;
}

function DoublePedal() {
  const [S, update] = useStored('ft.settings', DEFAULTS, migrate);
  const [best, setBest] = useState(() => load('ft.best', {}));
  const [rand, setRand] = useState(() => { const r = load('ft.random', null); return randomFits(r, S) ? r : makeRandom(S); });
  const [playing, setPlaying] = useState(false);
  const [hl, setHl] = useState(-1);
  const [repsN, setRepsN] = useState(0);
  const [, setTick] = useState(0);
  const [msg, flash, setMsg] = useFlash();
  const [help, setHelp] = useState(false);
  const restart = useRef(false);
  const practice = useRef(null);

  useEffect(() => save('ft.best', best), [best]);
  useEffect(() => save('ft.random', rand), [rand]);
  // random settings changed → new sheet, back to the first one
  useEffect(() => {
    if (!randomFits(rand, S)) { setRand(makeRandom(S)); update(s => ({idx: {...s.idx, rand: 0}})); }
  }, [S.rSub, S.rRun, S.rRest]); // eslint-disable-line react-hooks/exhaustive-deps

  const sheet = useMemo(() => {
    if (LISTS[S.mode]) return LISTS[S.mode].map(d => build(d, S.mode));
    return rand.list.map((f, i) => feetFrom(f, rand.sub, 'rand:' + f, `隨機 ${i + 1}`, {tip: '先看清楚整排再開始，休止（·）的地方腳要停住。'}));
  }, [S.mode, rand]);
  const idx = Math.min(S.idx[S.mode] || 0, sheet.length - 1);
  const cur = sheet[idx];
  const CL = useMemo(() => swapped(cur, S.leftLead), [cur, S.leftLead]);
  const st = useMemo(() => sticking(cur, CL), [cur, CL]);

  const live = useLatest({S, sheet, idx});
  const engine = useMemo(() => createEngine({
    get: () => live.current,
    onSlot: (i, sub) => {
      setHl(i);
      if (i === 0) setMsg(m => (m.startsWith('預備') ? '' : m));
      if (i % sub === 0 && live.current.S.timer) setTick(t => t + 1);
    },
    onCount: n => setMsg(`預備 ${n}`),
    onReps: n => setRepsN(n),
    onShow: i => {
      update(s => ({idx: {...s.idx, [s.mode]: i}}));
      flash(`下一個：${live.current.sheet[i].name}`);
    },
    onMsg: m => flash(m),
    onBpm: v => update({bpm: v}),
    onTimeUp: min => { setPlaying(false); setHl(-1); setRepsN(0); flash(`時間到！練了 ${min} 分鐘`); },
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => engine.setBpm(S.bpm), [engine, S.bpm]);
  // jumping to another exercise while playing restarts cleanly on it
  useEffect(() => { if (restart.current) { restart.current = false; engine.play(); } });

  const setBpm = v => update({bpm: Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(v)))});
  const play = () => { engine.play(); setPlaying(true); setRepsN(0); };
  const stop = () => { engine.stop(); setPlaying(false); setHl(-1); setMsg(''); setRepsN(0); };
  const toggle = () => (engine.isPlaying() ? stop() : play());
  const replay = () => { if (engine.isPlaying()) { engine.stop(); setHl(-1); setRepsN(0); restart.current = true; } };
  const go = i => {
    const n = ((i % sheet.length) + sheet.length) % sheet.length;
    update(s => ({idx: {...s.idx, [s.mode]: n}}));
    replay();
  };
  const rebuild = patch => { if (engine.isPlaying()) stop(); update(patch); };
  useKeys({Space: toggle, ArrowRight: () => go(idx + 1), ArrowLeft: () => go(idx - 1)});

  const record = () => {
    const prev = best[cur.key] || 0;
    setBest({...best, [cur.key]: Math.max(prev, S.bpm)});
    flash(S.bpm > prev ? `記錄 ${S.bpm} BPM！下次試試 ${S.bpm + 5}` : `已記錄，你的最佳是 ${prev} BPM`);
  };

  let repsTxt = playing ? `第 ${repsN + 1}${S.autoNext && S.reps ? ` / ${S.reps}` : ''} 次` : (S.autoNext && S.reps ? `每個練 ${S.reps} 次` : '重複練同一個');
  if (playing && S.timer) {
    const left = Math.max(0, Math.ceil(S.timer * 60 - engine.elapsed() / 1000));
    repsTxt += ` · 剩 ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  }
  const showGuide = help || !S.seenGuide;

  return (
    <Page>
      <Header title="Double Pedal"
        guideOpen={showGuide} onHelp={() => (showGuide ? (setHelp(false), update({seenGuide: true})) : setHelp(true))} />

      {showGuide && (
        <Guide tips={TIPS} onOk={() => { setHelp(false); update({seenGuide: true}); }}
        steps={[
          <><b>在下方「練什麼」選一個練習</b>，第一次建議從「雙踏基本功」的「4 分音符交替」開始。</>,
          <><b>按 ▶</b>，跟著大字母踩：<span className="key fR">R</span> 右腳（主踏板）、<span className="key fL">L</span> 左腳（副踏板或腳踩鈸）。下方的格子圖一排是一個肢體，亮起來的那一欄就是現在要打的音。</>,
          <><b>打順了就按「✓ 打順了」</b>記錄速度，再把速度調快 5 BPM 繼續練。</>,
        ]} />
      )}

      <PracticeCard cardRef={practice}>
        <SheetHead name={cur.name} en={cur.en || st.map(s => s.c).join('').replace(/(.{4})/g, '$1 ').trim()} best={best[cur.key]} />
        <div className="meta">{SUB_NAME[cur.sub]} · {cur.len / cur.sub} 拍一循環 · 第 {idx + 1} / {sheet.length} 個</div>
        <Status msg={msg} />
        {S.mode !== 'hh' && (
          <div className="big" aria-label="腳順">
            {Array.from({length: cur.len / cur.sub}, (_, b) => (
              <span className="bt" key={b}>
                {Array.from({length: cur.sub}, (_, k) => {
                  const i = b * cur.sub + k, s = st[i];
                  return <span key={k} className={`n ${s.cls}${hl === i ? ' on' : ''}`}>{s.c}</span>;
                })}
              </span>
            ))}
          </div>
        )}
        <div className="legend">
          {CL.map(l => <span key={l.limb}><i className={'dot ' + l.limb} />{LIMB_NAME[l.limb]}・{INST_NAME[l.inst]}</span>)}
        </div>
        <KitGrid ex={cur} lanes={CL} hl={hl} />
        {cur.tip && <Tip>{cur.tip}</Tip>}
        <ExNav onPrev={() => go(idx - 1)} onNext={() => go(idx + 1)} reps={repsTxt} />
        <DoneButton bpm={S.bpm} onClick={record} />
      </PracticeCard>

      <Group title="練什麼" id="h-what">
        <ModeList label="練習類型" value={S.mode} options={MODE_OPTS} onChange={m => rebuild({mode: m})} />
        <Hint>{MODE_HINT[S.mode]}</Hint>
        {S.mode === 'rand' && (
          <>
            <Pair>
              <Field label="一拍踩幾個音">
                <SegChoice label="一拍踩幾個音" value={S.rSub} onChange={v => rebuild({rSub: v})}
                  options={[{value: 2, label: '2 個', sub: '8 分'}, {value: 3, label: '3 個', sub: '三連音'}, {value: 4, label: '4 個', sub: '16 分'}]} />
              </Field>
              <Choose label="同一隻腳最多連踩" value={S.rRun} onChange={v => rebuild({rRun: +v})}
                options={[{value: 1, label: '1 下（左右交替）'}, {value: 2, label: '2 下'}, {value: 3, label: '3 下'}, {value: 4, label: '4 下'}]} />
            </Pair>
            <CheckboxInput label="加入休止（空拍）" value={S.rRest} onChange={v => rebuild({rRest: v})} />
            <div>
              <Button size="sm" label="換一組新的" onClick={() => {
                if (engine.isPlaying()) stop();
                setRand(makeRandom(S));
                update(s => ({idx: {...s.idx, rand: 0}}));
                flash('換了一組新的隨機腳順');
              }} />
            </div>
          </>
        )}
        <ExItems cur={idx} onPick={i => { go(i); practice.current?.scrollIntoView({behavior: 'smooth', block: 'start'}); }}
          items={sheet.map(ex => {
            const lanes = swapped(ex, S.leftLead);
            return {key: ex.key, name: ex.name, best: best[ex.key], stick: <Letters items={sticking(ex, lanes)} />, mini: miniFor(ex, lanes)};
          })} />
      </Group>

      <FoldGroup title="腳法技巧" sub="踩法、設定、常見問題"><Glossary items={TECHNIQUE} /></FoldGroup>

      <FoldGroup title="練習設定" sub="聲音、次數、左腳開始、計時、節拍器">
        <Choose label="App 幫你打哪些聲部" value={S.playPart} onChange={v => update({playPart: v})}
          options={[{value: 'all', label: '全部（手和腳）'}, {value: 'hands', label: '只播手的部分（你踩腳）'},
            {value: 'feet', label: '只播腳的部分（你打手）'}, {value: 'none', label: '都不播（只有節拍器）'}]} />
        <Toggle label="練完自動換下一個" value={S.autoNext} onChange={v => update({autoNext: v})} />
        <Choose label="每個練習重複幾次" value={S.reps} onChange={v => update({reps: +v})} options={[4, 8, 16, 32]} />
        <Toggle label="左腳開始" description="雙踏的左右腳對調；單腳連踩改練左腳" value={S.leftLead}
          onChange={v => { update({leftLead: v}); replay(); }} />
        <Choose label="練習計時（時間到自動停止）" value={S.timer} onChange={v => { update({timer: +v}); engine.resetTimer(); }}
          options={[{value: 0, label: '不計時'}, {value: 1, label: '1 分鐘'}, {value: 2, label: '2 分鐘'}, {value: 5, label: '5 分鐘'}, {value: 10, label: '10 分鐘'}]} />
        <Toggle label="節拍器：每拍響一聲" value={S.click} onChange={v => update({click: v})} />
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

      <Dock actionLabel="下一個" onAction={() => go(idx + 1)} bpm={S.bpm} setBpm={setBpm} min={MIN_BPM} max={MAX_BPM}
        playing={playing} onPlay={toggle} flash={flash} />
    </Page>
  );
}

// Kit grid: one row per limb, one column per slot, beats separated by a line.
// Patterns longer than 5 beats wrap into systems of 4 beats, like bars on a page.
function KitGrid({ex, lanes, hl}) {
  const beats = ex.len / ex.sub, per = beats > 5 ? 4 : beats;
  const bar = beats % 4 === 0 ? 4 : Infinity;   // multi-bar patterns count 1–4 in every bar
  // Every syllable, sextuplets too (1 la li & la li); the dense grid sets them in a smaller type.
  const count = (k, b) => (k === 0 ? (b % bar) + 1 : COUNTS[ex.sub][k]);
  const systems = [];
  for (let b0 = 0; b0 < beats; b0 += per) systems.push([b0, Math.min(beats, b0 + per)]);
  const row = (key, label, cls, b0, b1, cell) => (
    <div className={'kr ' + cls} key={key}>
      <span className="kl">{label}</span>
      {Array.from({length: b1 - b0}, (_, j) => {
        const b = b0 + j;
        return <span className="kb" key={b}>{Array.from({length: ex.sub}, (_, k) => cell(b * ex.sub + k, k, b))}</span>;
      })}
    </div>
  );
  return (
    <div className={'kit' + (ex.sub >= 6 ? ' dense' : '')} style={{'--slots': per * ex.sub}} role="img"
      aria-label={`${ex.name}：` + lanes.map(l => `${LIMB_NAME[l.limb]}${INST_NAME[l.inst]}`).join('、')}>
      {systems.map(([b0, b1]) => (
        <div className="ksys" key={b0}>
          {lanes.map(l => row(l.limb, <>{LIMB_NAME[l.limb]}<small>{INST_NAME[l.inst]}</small></>, l.limb, b0, b1,
            i => <span key={i} className={'kc' + (hl === i ? ' on' : '')}>{l.hits[i] !== '.' && <i className={'hit ' + l.inst} />}</span>))}
          {row('cnt', '', 'cnt', b0, b1, (i, k, b) => <span key={i} className="kc">{count(k, b)}</span>)}
        </div>
      ))}
    </div>
  );
}

// The first two beats as a small staff (hands and feet), to recognise an exercise at a glance.
function miniFor(ex, lanes) {
  const n = Math.min(ex.len, 2 * ex.sub), slots = [];
  for (let i = 0; i < n; i++) slots.push(lanes.filter(l => l.hits[i] !== '.').map(l => ({inst: l.inst, limb: l.limb})));
  const letters = sticking(ex, lanes).slice(0, n);
  return window.MiniStaff ? window.MiniStaff.svg({sub: ex.sub, slots, letters, label: `${ex.name}：前 2 拍`}) : '';
}
