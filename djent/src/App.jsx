import {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {NumberInput} from '@astryxdesign/core/NumberInput';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {VStack} from '@astryxdesign/core/VStack';
import {HStack} from '@astryxdesign/core/HStack';
import {Text} from '@astryxdesign/core/Text';
import {
  AppTheme, Tip, Choose, DoneButton, Dock, ExItems, ExNav, Field, FoldGroup, Glossary, Group, Guide, Header, Hint, ModeList,
  Page, Pair, PracticeCard, SegChoice, SheetHead, Status, Toggle, load, save, useFlash, useKeys, useLatest, useStored,
} from '../../shared/src/ui.jsx';
import {CATS, FILLS, LIB, build, cycleText, describe, gridHtml, miniFor, pick, riffText, staffHtml} from './music.js';
import {createEngine} from './engine.js';

const MIN_BPM = 30, MAX_BPM = 240;
const DEFAULTS = {
  cat: 'chug', idx: {chug: 0, odd: 0, snare: 0, sext: 0, ghost: 0, fill: 0},
  basic: false, view: 'staff', phrase: 4, fillLen: 'auto', fillPick: 'rand', end: 'cut',
  sub: 'auto', pulse: 'auto', snare: 'auto', cym: 'auto', pedal: 'double',
  reps: 8, autoNext: false, playPart: 'all', timer: 0,
  bpm: 80, click: true, clickSub: 'soft', countIn: false, trainer: false, trainerEvery: 4, trainerStep: 5, trainerMax: 160,
};
const CAT_OPTS = [
  {value: 'chug', label: '基本 Chug', sub: '一小節剛好湊滿'},
  {value: 'odd', label: '奇數分組', sub: '跨過小節線'},
  {value: 'snare', label: '小鼓跟 riff', sub: '下層手腳線性'},
  {value: 'sext', label: '六連音爆發', sub: '三連音感覺'},
  {value: 'ghost', label: 'Ghost note 律動', sub: 'Half-time・小鼓輕重'},
  {value: 'fill', label: 'Gospel chops', sub: '線性 Fill'},
];
const CAT_HINT = {
  chug: '大鼓的分組加起來剛好一小節，每小節都從第 1 拍重新開始。先習慣「鈸固定、大鼓跟 riff」。',
  odd: '一組 3、5、7……個音一直重複，會繞過小節線。上面的鈸永遠是 4/4，跟著鈸數拍就不會迷路。',
  snare: '小鼓不固定在第 3 拍，而是跟大鼓一起組成 riff（同一時間只有一個鼓）。',
  sext: '一拍 6 個音的六連音。三連踩、三連音 Chug，再加上奇數分組。',
  ghost: 'Half-time 律動：第 3 拍小鼓打重音（>），中間夾很輕的 Ghost note（譜上括號裡的音）。只有小鼓有輕重，大鼓永遠一樣大聲。',
  fill: '前面是簡單的 Djent 節奏，最後是這個 Fill。每個 Fill 都會剛好結束在下一輪的第 1 拍。',
};
const TERMS = [
  ['分組', '格子圖的「分組」那一排，一段色條是一組，數字是這組有幾個音。'],
  ['↺ 接回第 1 拍', '奇數分組繞了幾小節以後，剛好又從第 1 拍開始。'],
  ['✂ 截斷', '樂句結束（或 Fill 開始）時，這一組還沒打完就切掉，下一輪從頭開始。'],
  ['基本練習', '只用 Hi-hat、小鼓、大鼓，Fill 也一樣。先用它把手腳配合打穩，再關掉練完整的音色和筒鼓 Fill。'],
  ['Ghost note', '小鼓上很輕的音，譜上寫在括號裡 (S)，格子圖是比較小、比較淡的點。棒子離鼓皮 1～2 公分輕輕落下。'],
  ['Gospel chops', '手、手、腳輪流的快速線性 Fill，例如 R L K。'],
];
const TIPS = [
  ['跟著鈸數拍', '大鼓的分組會一直跑掉，但鈸永遠在拍點上。嘴巴數「1 2 3 4」對著鈸，不要對著大鼓數。'],
  ['記形狀，不要數', '長的分組（9、11、13）把它當成一句 riff 記，像唱吉他的旋律一樣。'],
  ['先截斷，再跑完', '先用「截斷」練 4 小節的樂句，熟了再改「跑完整個循環」，聽分組怎麼接回第 1 拍。'],
  ['雙踏右腳開始', '每一組的第一下都是右腳，組內左右交替，重拍永遠落在右腳。'],
  ['手腳一樣大聲', '線性 Fill 最常見的問題是腳比手小聲。先慢速，聽每一下是不是一樣大。'],
  ['放鬆', '速度上不去時先降 10 BPM，肩膀和腳踝放鬆，比硬撐更快進步。'],
];
const LIMB_NAME = {RH: '右手', LH: '左手', RF: '右腳', LF: '左腳'};

function migrate(S) {
  S.idx = {...DEFAULTS.idx, ...S.idx};
  if (S.v !== 2) { S.view = 'staff'; S.v = 2; }   // v2: the staff became the default view
  if (!CATS.includes(S.cat)) S.cat = 'chug';
  if (![2, 4, 8].includes(S.phrase)) S.phrase = 4;
  if (!['soft', 'same', 'off'].includes(S.clickSub)) S.clickSub = 'soft';
  if (S.fillPick !== 'rand' && !FILLS.some(f => f.id === S.fillPick)) S.fillPick = 'rand';
  return S;
}

export default function App() {
  return <AppTheme><Djent /></AppTheme>;
}

function Djent() {
  const [S, update] = useStored('dj.settings', DEFAULTS, migrate);
  const [best, setBest] = useState(() => load('dj.best', {}));
  const [playing, setPlaying] = useState(false);
  const [repsN, setRepsN] = useState(0);
  const [, setTick] = useState(0);
  const [msg, flash, setMsg] = useFlash();
  const [help, setHelp] = useState(false);
  const fillChoice = useRef({});
  const [fillVer, setFillVer] = useState(0);
  const restart = useRef(false);
  const practice = useRef(null);
  const notation = useRef(null);

  useEffect(() => save('dj.best', best), [best]);

  const sheet = useMemo(() => LIB[S.cat].map(d => build(d, S.cat, S, fillChoice.current)),
    [S.cat, S.sub, S.end, S.phrase, S.snare, S.pulse, S.cym, S.basic, S.pedal, S.fillLen, S.fillPick, fillVer]); // eslint-disable-line react-hooks/exhaustive-deps
  const idx = Math.min(S.idx[S.cat] || 0, sheet.length - 1);
  const cur = sheet[idx];
  const html = useMemo(() => (S.view === 'grid' ? gridHtml(cur, S) : staffHtml(cur)), [cur, S.view, S.pedal]); // eslint-disable-line react-hooks/exhaustive-deps

  // Slot highlighting goes straight to the DOM: the notation is a big SVG/HTML block, re-rendering it per 16th would be wasteful.
  const hl = useRef({map: [], bars: [], last: -1});
  useLayoutEffect(() => {
    const box = notation.current, map = Array.from({length: cur.len}, () => []);
    box.querySelectorAll('[data-i]').forEach(el => map[+el.dataset.i].push(el));
    hl.current = {map, bars: [...box.querySelectorAll('[data-bar]')], last: -1};
  }, [html, cur.len]);
  const highlight = (i, ex) => {
    const h = hl.current;
    if (h.last >= 0 && h.map[h.last]) h.map[h.last].forEach(el => el.classList.remove('on'));
    if (i >= 0 && h.map[i]) h.map[i].forEach(el => el.classList.add('on'));
    h.last = i;
    // keep the bar being played on screen
    if (ex && i >= 0 && i % ex.bar === 0) h.bars[i / ex.bar]?.scrollIntoView({block: 'nearest', behavior: 'smooth'});
  };

  const live = useLatest({S, sheet, idx});
  const engine = useMemo(() => createEngine({
    get: () => live.current,
    onSlot: (i, ex) => {
      highlight(i, ex);
      if (i === 0) setMsg(m => (m.startsWith('預備') ? '' : m));
      if (i % ex.sub === 0 && live.current.S.timer) setTick(t => t + 1);
    },
    onCount: n => setMsg(`預備 ${n}`),
    onReps: n => setRepsN(n),
    onShow: i => { update(s => ({idx: {...s.idx, [s.cat]: i}})); flash(`下一個：${live.current.sheet[i].name}`); },
    onMsg: m => flash(m),
    onBpm: v => update({bpm: v}),
    onTimeUp: min => { setPlaying(false); highlight(-1); setRepsN(0); flash(`時間到！練了 ${min} 分鐘`); },
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => engine.setBpm(S.bpm), [engine, S.bpm]);
  useEffect(() => { if (restart.current) { restart.current = false; engine.play(); } });

  const setBpm = v => update({bpm: Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(v)))});
  const play = () => { engine.play(); setPlaying(true); setRepsN(0); };
  const stop = () => { engine.stop(); setPlaying(false); highlight(-1); setMsg(''); setRepsN(0); };
  const toggle = () => (engine.isPlaying() ? stop() : play());
  const replay = () => { if (engine.isPlaying()) { engine.stop(); highlight(-1); setRepsN(0); restart.current = true; } };
  const go = i => { update(s => ({idx: {...s.idx, [s.cat]: ((i % sheet.length) + sheet.length) % sheet.length}})); replay(); };
  // settings that change the phrase: rebuild it, and keep playing on the new one
  const reshape = patch => { replay(); update(patch); };
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
  // the guide stays closed until 「? 使用說明」 is tapped
  const showGuide = help;
  const used = new Set();
  cur.slots.forEach(s => s.forEach(h => used.add(h.limb)));
  const ghost = cur.slots.some(s => s.some(h => h.lvl === 'g'));

  return (
    <Page className={'djent' + (S.basic ? ' basic' : '')}>
      <VStack gap={4} className="col-main">
        <Header title="Djent Grooves"
          guideOpen={showGuide} onHelp={() => setHelp(h => !h)} />
        {showGuide && (
          <Guide tips={TERMS} onOk={() => setHelp(false)}
          steps={[
            <><b>在「練什麼」選一個練習</b>，第一次建議從「基本 Chug」的「3-3-2 Chug」開始，並打開「基本練習」。</>,
            <><b>按 ▶</b>，跟著五線譜打，亮起來的那一欄就是現在要打的音；看不習慣可以在「顯示」改成格子圖（一行一小節）。 <span className="key R">R</span><span className="key L">L</span> 是手，<span className="key fR">R</span><span className="key fL">L</span> 是腳。</>,
            <><b>打順了就按「✓ 打順了」</b>，再把速度調快 5 BPM。</>,
          ]} />
        )}

        <PracticeCard cardRef={practice}>
          <SheetHead name={cur.name} en={cur.en} best={best[cur.key]} />
          <div className="meta">{describe(cur, S, idx, sheet.length)}</div>
          <HStack gap={3} hAlign="between" vAlign="center" wrap="wrap">
            <div className="basic-tg">
              <Toggle label="基本練習" description="只有 Hi-hat、小鼓、大鼓" value={S.basic} onChange={v => reshape({basic: v})} />
            </div>
            <SegmentedControl label="顯示方式" size="sm" value={S.view} onChange={v => update({view: v})}>
              <SegmentedControlItem value="staff" label="五線譜" />
              <SegmentedControlItem value="grid" label="格子圖" />
            </SegmentedControl>
          </HStack>
          <Status msg={msg} />
          <Text as="p" className="cycle">{cycleText(cur, S)}</Text>
          <div className="legend">
            {['RH', 'LH', 'RF', 'LF'].filter(l => used.has(l)).map(l => <span key={l}><i className={'dot ' + l} />{LIMB_NAME[l]}</span>)}
            {ghost && <span className="lg-note">(S) Ghost note 很輕　&gt; 重音</span>}
            <span className="lg-note">↺ 接回第 1 拍　✂ 截斷</span>
          </div>
          <div ref={notation} className={S.view === 'grid' ? 'kit' + (cur.sub >= 6 ? ' dense' : '') : 'notation'}
            style={S.view === 'grid' ? {'--slots': cur.bar} : undefined} role="img" aria-label={`${cur.name}：${cur.bars} 小節`}
            dangerouslySetInnerHTML={{__html: html}} />
          {cur.fill && (
            <div className="fill-row">
              <span>Fill：<b>{cur.fill.name}</b>{S.basic ? '（基本練習：Hi-hat、小鼓、大鼓）' : '（右手筒鼓、左手小鼓）'}</span>
              {!cur.def.fill && S.fillPick === 'rand' && (
                <Button size="sm" label="換一個 Fill" onClick={() => {
                  replay();
                  const now = fillChoice.current[cur.key];
                  fillChoice.current[cur.key] = pick(FILLS.filter(f => f.id !== now)).id;
                  setFillVer(v => v + 1);
                }} />
              )}
            </div>
          )}
          {cur.tip && <Tip>{cur.tip}</Tip>}
          <ExNav onPrev={() => go(idx - 1)} onNext={() => go(idx + 1)} reps={repsTxt} />
          <DoneButton bpm={S.bpm} onClick={record} />
        </PracticeCard>
      </VStack>

      <VStack gap={4} className="col-side">
        <Group title="練什麼" id="h-what">
          <ModeList label="練習類型" value={S.cat} options={CAT_OPTS} onChange={c => { if (engine.isPlaying()) stop(); update({cat: c}); }} />
          <Hint>{CAT_HINT[S.cat]}</Hint>
          <ExItems cur={idx} onPick={i => { go(i); practice.current?.scrollIntoView({behavior: 'smooth', block: 'start'}); }}
            items={sheet.map(ex => ({
              key: ex.key, name: ex.name, best: best[ex.key], mini: miniFor(ex),
              stick: <span dangerouslySetInnerHTML={{__html: riffText(ex.def.fill ? FILLS.find(f => f.id === ex.def.fill).cells : ex.riff)}} />,
            }))} />
        </Group>

        <Group title="怎麼打" id="h-how">
          <Field label="樂句長度">
            <SegChoice label="樂句長度" value={S.phrase} onChange={v => reshape({phrase: v})}
              options={[{value: 2, label: '2 小節'}, {value: 4, label: '4 小節'}, {value: 8, label: '8 小節'}]} />
            {S.end === 'full' && <Hint>「跑完整個循環」時，會自動延長到分組接回第 1 拍為止。</Hint>}
          </Field>
          <Pair>
            <Choose label="樂句結尾" value={S.end} onChange={v => reshape({end: v})}
              options={[{value: 'cut', label: '截斷（預設）'}, {value: 'full', label: '跑完整個循環'}]} />
            <Field label="大鼓">
              <SegChoice label="大鼓" value={S.pedal} onChange={v => reshape({pedal: v})}
                options={[{value: 'double', label: '雙踏'}, {value: 'single', label: '單踏'}]} />
            </Field>
          </Pair>
          <Pair>
            <Choose label="Fill 長度" value={S.fillLen} onChange={v => reshape({fillLen: v})}
              options={[{value: 'auto', label: '自動（1 小節；Fill 練習照它的長度）'}, {value: 'b1', label: '最後 1 拍'},
                {value: 'b2', label: '最後 2 拍'}, {value: 'bar', label: '最後 1 小節'}, {value: 'none', label: '不要 Fill'}]} />
            {S.cat !== 'fill' && S.fillLen !== 'none' && (
              <Choose label="用哪一個 Fill" value={S.fillPick} onChange={v => reshape({fillPick: v})}
                options={[{value: 'rand', label: '隨機（每個練習抽一個）'}, ...FILLS.map(f => ({value: f.id, label: f.name}))]} />
            )}
          </Pair>
          <Pair>
            <Choose label="鈸的拍點" value={S.pulse} onChange={v => reshape({pulse: v})}
              options={[{value: 'auto', label: '照練習預設'}, {value: 'q', label: '4 分音符（每拍）'}, {value: 'h', label: '2 分音符（1、3 拍）'},
                {value: 'e', label: '8 分音符'}, {value: 's', label: '16 分音符（每一格）'}]} />
            <Choose label="小鼓位置" value={S.snare} onChange={v => reshape({snare: v})}
              options={[{value: 'auto', label: '照練習預設'}, {value: '3', label: '第 3 拍（Half-time）'}, {value: '24', label: '2、4 拍'}, {value: 'riff', label: '跟著 riff 走'}]} />
          </Pair>
          <Pair>
            {S.basic ? <Field label="鈸的音色"><Hint>基本練習固定用 Hi-hat。</Hint></Field> : (
              <Choose label="鈸的音色" value={S.cym} onChange={v => reshape({cym: v})}
                options={[{value: 'auto', label: '照練習預設'}, {value: 'ride', label: 'Ride'}, {value: 'crash', label: 'Crash'}, {value: 'china', label: 'China'}, {value: 'hh', label: 'Hi-hat'}]} />
            )}
            <Choose label="音符" value={S.sub} onChange={v => reshape({sub: v})}
              options={[{value: 'auto', label: '照練習預設'}, {value: '4', label: '16 分音符'}, {value: '6', label: '16 分六連音'}]} />
          </Pair>
          <div>
            <Button size="sm" label="上層打法回到練習預設" onClick={() => { reshape({sub: 'auto', pulse: 'auto', snare: 'auto', cym: 'auto'}); flash('上層打法回到練習預設'); }} />
          </div>
        </Group>

        <FoldGroup title="練習設定" sub="聲音、次數、計時、節拍器">
          <Choose label="App 幫你打哪些聲部" value={S.playPart} onChange={v => update({playPart: v})}
            options={[{value: 'all', label: '全部（手和腳）'}, {value: 'hands', label: '只播手的部分（你踩腳）'},
              {value: 'feet', label: '只播腳的部分（你打手）'}, {value: 'none', label: '都不播（只有節拍器）'}]} />
          <Toggle label="練完自動換下一個" value={S.autoNext} onChange={v => update({autoNext: v})} />
          <Choose label="每個練習重複幾次（一次＝一整個樂句）" value={S.reps} onChange={v => update({reps: +v})} options={[4, 8, 16, 32]} />
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

        <FoldGroup title="Djent 小技巧" sub="怎麼不迷路、怎麼練快"><Glossary items={TIPS} /></FoldGroup>
      </VStack>

      <Dock actionLabel="下一個" onAction={() => go(idx + 1)} bpm={S.bpm} setBpm={setBpm} min={MIN_BPM} max={MAX_BPM}
        playing={playing} onPlay={toggle} flash={flash} />
    </Page>
  );
}
