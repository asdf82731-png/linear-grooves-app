import {forwardRef, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {NumberInput} from '@astryxdesign/core/NumberInput';
import {CheckboxInput} from '@astryxdesign/core/CheckboxInput';
import {
  AppTheme, Choose, Dock, ExItems, Field, FoldGroup, Glossary, Group, Guide, Header, Hint, ModeList, Page, Pair, PracticeCard,
  SegChoice, SheetHead, Status, Toggle, load, save, useFlash, useKeys, useLatest, useStored,
} from '../../shared/src/ui.jsx';
import {HStack} from '@astryxdesign/core/HStack';
import {Text} from '@astryxdesign/core/Text';
import {List, ListItem} from '@astryxdesign/core/List';
import {
  DJENT_CELLS, LEVELS, LIBRARY, LIB_CATS, LIB_NAME, SUB_NAME, VOICES, buildLib, catItems, cycleText, detectLevel,
  displayIndex, editGroup, expand, favMini, flatten, generate, makeGroup, notationHtml, pool, rotations, setGroup, shiftLabel,
  stickingText, validPattern, voicesFor,
} from './groove.js';
import {createEngine} from './engine.js';
import {ToolsNav} from './nav.jsx';

const MIN_BPM = 40, MAX_BPM = 240;
const DEFAULTS = {
  sub: 4, beats: 4, bars: 1, sizes: [3, 4], kickPos: 'end', doubleKick: false, lib: 'classic',
  orch: 'hh', accents: true, bpm: 80, src: 'lib', libIdx: 0, libLast: {}, type: 'normal', dCell: '5', dPhrase: 4, dEnd: 'cut',
  click: true, clickSub: 'soft', countIn: false, trainer: false, trainerEvery: 4, trainerStep: 5, trainerMax: 140,
};
const TERMS = [
  ['一組', '幾個音連成的小片段，例如 R L K。整個節奏是由好幾組接起來的。'],
  ['16 分音符 / 三連音 / 六連音', '一拍裡打幾個音：4 個、3 個或 6 個。'],
  ['重音', '譜上有「>」、色塊有底線的音要打大聲一點。'],
  ['1 e & a', '數拍的念法，幫你知道每個音落在拍子的哪裡。'],
];
const clone = o => JSON.parse(JSON.stringify(o));
// a Djent cell is laid end to end over the phrase every time it changes
const finalize = p => { if (p.cell) p.groups = expand(p); return p; };

function migrate(S) {
  if (!['soft', 'same', 'off'].includes(S.clickSub)) S.clickSub = S.clickSub === false ? 'off' : 'soft';
  if (!DJENT_CELLS[S.dCell]) S.dCell = '5';
  if (![2, 4, 8].includes(S.dPhrase)) S.dPhrase = 4;
  if (!LIBRARY[S.libIdx]) S.libIdx = 0;
  if (!S.libLast || typeof S.libLast !== 'object') S.libLast = {};
  if (S.src !== 'gen') S.src = 'lib';
  return S;
}
// Settings follow a loaded pattern (favourite or last session).
const adopt = p => (p.cell ? {type: 'djent', sub: p.sub, beats: p.beats} : {type: 'normal', sub: p.sub, beats: p.beats, bars: p.bars});

export default function App() {
  return <AppTheme><Grooves /></AppTheme>;
}

function Grooves() {
  const [S, update, setS] = useStored('lg.settings', DEFAULTS, migrate);
  const [favs, setFavs] = useState(() => load('lg.favs', []));
  const [best, setBest] = useState(() => load('lg.best', {}));
  const [pattern, setPattern] = useState(() => {
    if (S.src === 'lib') return buildLib(LIBRARY[S.libIdx], S);
    const saved = load('lg.pattern', null);
    if (validPattern(saved)) return saved;
    return generate(S) || generate({...S, sizes: DEFAULTS.sizes});
  });
  const [picker, setPicker] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [armedFav, setArmedFav] = useState(-1);
  const [msg, flash, setMsg] = useFlash();
  const [help, setHelp] = useState(false);
  const notation = useRef(null), strip = useRef(null), practice = useRef(null);

  // a saved pattern brings its own settings along (once, at start)
  useEffect(() => { if (S.src === 'gen') update(adopt(pattern)); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => save('lg.pattern', pattern), [pattern]);
  useEffect(() => save('lg.favs', favs), [favs]);
  useEffect(() => save('lg.best', best), [best]);

  const SL = useMemo(() => flatten(pattern, S), [pattern, S.accents]); // eslint-disable-line react-hooks/exhaustive-deps
  const html = useMemo(() => notationHtml(pattern, SL), [pattern, SL]);

  // Slot highlighting goes straight to the DOM (staff rects and strip chips).
  const hl = useRef({map: [], last: -1});
  useLayoutEffect(() => {
    const map = SL.map(() => []);
    notation.current.querySelectorAll('[data-i]').forEach(el => map[+el.dataset.i]?.push(el));
    strip.current.querySelectorAll('.chip[data-i]').forEach(el => map[+el.dataset.i]?.push(el));
    if (pattern.cell) {
      const n = SL.length, sh = ((pattern.shift || 0) % n + n) % n;
      const len = pattern.cell.reduce((t, g) => t + g.stick.length, 0);
      const chips = [...strip.current.querySelectorAll('.chip[data-c]')];
      map.forEach((list, i) => list.push(chips[((i - sh + n) % n) % len]));
    }
    // a re-render that rebuilt the elements keeps the slot that is sounding lit
    const last = hl.current.last;
    if (last >= 0) map[last]?.forEach(el => el?.classList.add('on'));
    hl.current = {map, last};
  }, [html, pattern, SL]); // eslint-disable-line react-hooks/exhaustive-deps
  const highlight = i => {
    const h = hl.current;
    if (h.last >= 0 && h.map[h.last]) h.map[h.last].forEach(el => el?.classList.remove('on'));
    if (i >= 0 && h.map[i]) h.map[i].forEach(el => el?.classList.add('on'));
    h.last = i;
  };

  const live = useLatest({S, SL, pattern});
  const engine = useMemo(() => createEngine({
    get: () => live.current,
    onSlot: i => { highlight(i); if (i === 0) setMsg(m => (m.startsWith('預備') ? '' : m)); },
    onCount: n => setMsg(`預備 ${n}`),
    onMsg: m => setMsg(m),
    onBpm: v => update({bpm: v}),
  }), []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => engine.setBpm(S.bpm), [engine, S.bpm]);

  const setBpm = v => update({bpm: Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(v)))});
  const toggle = () => {
    if (engine.isPlaying()) { engine.stop(); setPlaying(false); highlight(-1); setMsg(''); } else { engine.play(); setPlaying(true); }
  };
  // a new groove (fresh = restart it from its first slot while playing)
  const apply = (p, fresh) => { setPattern(finalize(p)); if (fresh) { setPicker(-1); engine.restartGroove(); } };
  const regen = patch => {
    const next = {...S, ...patch};
    if (patch) update(patch);
    const p = generate(next);
    if (!p) { flash(`目前的「每組長度」湊不滿一小節（${next.beats * next.sub * next.bars} 個音），請在進階規則多勾幾種長度`); return false; }
    apply(p, true);
    return true;
  };
  const edit = f => { const p = clone(pattern); f(p); apply(p, false); };
  const loadLib = i => {
    const n = ((i % LIBRARY.length) + LIBRARY.length) % LIBRARY.length;
    update(s => ({libIdx: n, libLast: {...s.libLast, [LIBRARY[n].cat]: n}}));
    apply(buildLib(LIBRARY[n], S), true);
  };
  // 精選節奏 shows one category at a time; ◀ ▶ stay inside it
  const stepLib = d => { const items = catItems(LIBRARY[S.libIdx].cat), n = items.length; loadLib(items[(items.indexOf(S.libIdx) + d + n) % n]); };
  const nextGroove = () => (S.src === 'lib' ? stepLib(1) : regen());
  const revoice = (s = S) => edit(p => (p.cell || p.groups).forEach(g => { g.voices = voicesFor(g.stick, s); }));
  useKeys({
    Space: toggle, g: nextGroove, G: nextGroove,
    ArrowRight: () => S.src === 'lib' && stepLib(1), ArrowLeft: () => S.src === 'lib' && stepLib(-1),
  });

  const lib = S.src === 'lib', def = LIBRARY[S.libIdx], level = detectLevel(S);
  // the guide stays closed until 「? 使用說明」 is tapped
  const showGuide = help;
  const record = () => {
    const prev = best[def.id] || 0;
    setBest({...best, [def.id]: Math.max(prev, S.bpm)});
    flash(S.bpm > prev ? `記錄 ${S.bpm} BPM！下次試試 ${S.bpm + 5}` : `已記錄，你的最佳是 ${prev} BPM`);
  };
  const shiftBy = d => edit(p => { const n = SL.length; p.shift = (((p.shift || 0) + d) % n + n) % n; });

  return (
    <Page>
      <Header nav={<ToolsNav cur="grooves" />} title="Linear Grooves"
        guideOpen={showGuide} onHelp={() => setHelp(h => !h)} />
      {showGuide && (
        <Guide tips={TERMS} onOk={() => setHelp(false)}
        steps={[
          <><b>按下方的 ▶</b> 先聽一遍這個節奏。</>,
          <><b>看譜或看下面的色塊</b>跟著打：<span className="key R">R</span> 右手打 Hi-hat、<span className="key L">L</span> 左手打小鼓、<span className="key K">K</span> 右腳踩大鼓。</>,
          <><b>選「精選節奏」從清單挑一個</b>，或選「隨機產生」按「換一個」產生新的節奏；太難就把速度調慢。</>,
        ]} />
      )}

      <ModeList label="節奏從哪裡來" value={S.src} onChange={v => {
        update({src: v});
        if (v === 'lib') apply(buildLib(LIBRARY[S.libIdx], S), true); else regen();
      }} options={[{value: 'lib', label: '精選節奏', sub: '固定清單・記錄最佳速度'}, {value: 'gen', label: '隨機產生', sub: '每次都不一樣'}]} />

      <PracticeCard cardRef={practice} label="目前的節奏">
        {lib && <SheetHead name={def.name} en={def.en} best={best[def.id]} />}
        <HStack gap={2} hAlign="between" vAlign="center" wrap="wrap">
          <div className="meta">
            {pattern.cell
              ? `${SUB_NAME[pattern.sub]} · ${pattern.beats}/4 · ${pattern.bars} 小節 · Djent：${pattern.cell.map(g => g.stick.length).join('+')} 個一組`
              : `${SUB_NAME[pattern.sub]} · ${pattern.beats}/4 · ${pattern.bars} 小節 · ${pattern.groups.length} 組`}
          </div>
          <HStack gap={1.5}>
            <Button size="sm" variant="ghost" label="☆ 收藏" onClick={() => { setFavs([{p: clone(pattern), bpm: S.bpm}, ...favs].slice(0, 50)); flash('已加入「我的收藏」'); }} />
            <Button size="sm" variant="ghost" label="複製" onClick={async () => {
              const text = `${stickingText(pattern)}  (${SUB_NAME[pattern.sub]}, ${pattern.beats}/4, ${S.bpm} BPM)`;
              try { await navigator.clipboard.writeText(text); flash('已複製，可以貼到筆記或傳給別人'); } catch { flash(text); }
            }} />
          </HStack>
        </HStack>
        <Status msg={msg} />
        {pattern.cell && <Text as="p" className="cycle">{cycleText(pattern)}</Text>}
        <div className="notation" ref={notation} dangerouslySetInnerHTML={{__html: html}} />
        <div className="legend" aria-hidden="true">
          <span><i className="dot R" />R 右手</span><span><i className="dot L" />L 左手</span><span><i className="dot K" />K 大鼓（右腳）</span>
        </div>
        <HStack gap={2} hAlign="between" vAlign="end" wrap="wrap">
          <Text weight="semibold">{pattern.cell ? 'Riff 由這幾組組成（一直重複）' : '節奏由這幾組組成'}</Text>
          <Text type="supporting">點一組可以換掉它</Text>
        </HStack>
        <Strip ref={strip} pattern={pattern} S={S} picker={picker} n={SL.length} onPick={gi => setPicker(picker === gi ? -1 : gi)} />
        {picker >= 0 && pattern.groups[picker] && (
          <Picker pattern={pattern} gi={picker} S={S}
            onSet={stick => edit(p => setGroup(p, picker, stick, S))}
            onRandom={() => edit(p => { const g = editGroup(p, picker); Object.assign(g, makeGroup(g.stick.length, S, g.stick)); })}
            onClose={() => setPicker(-1)} />
        )}
        {lib && <Button width="100%" label={`✓ 打順了，記錄 ${S.bpm} BPM`} onClick={record} />}
      </PracticeCard>

      {lib ? (
        <Group title="精選節奏" id="h-lib">
          <ModeList label="節奏分類" value={def.cat} onChange={cat => {
            const items = catItems(cat);
            loadLib(items.includes(S.libLast[cat]) ? S.libLast[cat] : items[0]);
          }} options={Object.entries(LIB_CATS).map(([cat, name]) => ({value: cat, label: name, sub: `${catItems(cat).length} 個`}))} />
          <Hint>點一個開始練，右邊是前 2 拍的譜。練熟了按「✓ 打順了」記下速度，清單上就看得到哪些練過、練到多快。</Hint>
          <ExItems cur={catItems(def.cat).indexOf(S.libIdx)}
            onPick={k => { loadLib(catItems(def.cat)[k]); practice.current?.scrollIntoView({behavior: 'smooth', block: 'start'}); }}
            items={catItems(def.cat).map(i => {
              const d = LIBRARY[i];
              return {key: d.id, name: d.name, sub: d.en, mini: favMini(buildLib(d, S), S), best: best[d.id]};
            })} />
        </Group>
      ) : (
        <Group title="難度" id="h-level">
          <Field label="節奏類型">
            <ModeList label="節奏類型" value={S.type} onChange={v => regen({type: v})}
              options={[{value: 'normal', label: '一般', sub: '剛好湊滿小節'}, {value: 'djent', label: 'Djent 線性', sub: '分組跨過小節線'}]} />
          </Field>
          {S.type === 'djent' && (
            <>
              <Hint>固定的一組（或幾組）一直重複，像 Djent 的吉他 riff 一樣繞過小節線。點節奏裡任一組可以換掉它，每次重複都會一起換。</Hint>
              <Pair>
                <Choose label="每組長度" value={S.dCell} onChange={v => regen({dCell: v})}
                  options={[{value: '3', label: '3 個一組'}, {value: '5', label: '5 個一組'}, {value: '7', label: '7 個一組'},
                    {value: '4+5', label: '4 + 5（9 個一循環）'}, {value: '5+6', label: '5 + 6（11 個）'}, {value: '5+7', label: '5 + 7（12 個）'},
                    {value: '6+7', label: '6 + 7（13 個）'}, {value: '3+3+5', label: '3 + 3 + 5（11 個）'}]} />
                <Choose label="樂句結尾" value={S.dEnd} onChange={v => regen({dEnd: v})}
                  options={[{value: 'cut', label: '截斷（預設）'}, {value: 'full', label: '跑完整個循環'}]} />
              </Pair>
              <Field label="樂句長度">
                <SegChoice label="樂句長度" value={S.dPhrase} onChange={v => regen({dPhrase: v})}
                  options={[{value: 2, label: '2 小節'}, {value: 4, label: '4 小節'}, {value: 8, label: '8 小節'}]} />
                <Text type="supporting">選「跑完整個循環」時，會自動延長到分組接回第 1 拍為止。</Text>
              </Field>
            </>
          )}
          <SegChoice label="難度" value={level} onChange={v => { const L = LEVELS[v]; regen({sizes: L.sizes.slice(), lib: L.lib, doubleKick: L.doubleKick}); }}
            options={[{value: 'easy', label: '入門'}, {value: 'mid', label: '中等'}, {value: 'hard', label: '進階'}]} />
          <Hint>{level === 'custom' ? '目前使用你在「進階規則」裡的自訂設定。選一個難度可以回到預設。' : LEVELS[level].hint}</Hint>
          <Field label="一拍打幾個音">
            <SegChoice label="一拍打幾個音" value={S.sub} onChange={v => regen({sub: v})}
              options={[{value: 4, label: '4 個', sub: '16 分音符'}, {value: 3, label: '3 個', sub: '三連音'}, {value: 6, label: '6 個', sub: '六連音'}]} />
          </Field>
        </Group>
      )}

      <FoldGroup title="修改這個節奏" sub="挪動、換順序、左右對調">
        <List hasDividers edge="flush">
          <Tool title="整段往前／往後挪" text="每按一下挪一個音，練習從不同位置開始。"
            ctl={<><Button label="◀" tooltip="往前挪一個音" onClick={() => shiftBy(-1)} /><Button label="▶" tooltip="往後挪一個音" onClick={() => shiftBy(1)} /></>}
            state={<>{shiftLabel(pattern)} {!!pattern.shift && <Button size="sm" variant="ghost" label="回到原位" onClick={() => edit(p => { p.shift = 0; })} />}</>} />
          <Tool title="每組換個起點" text="音不變，每一組改從下一個音開始，例如 RLK → LKR。" ctl={<Button label="換起點" onClick={() => {
            edit(p => (p.cell || p.groups).forEach(g => { g.stick = g.stick.slice(1) + g.stick[0]; g.voices = g.voices.slice(1).concat(g.voices[0]); }));
            flash('每組都改從下一個音開始');
          }} />} />
          <Tool title="打亂各組順序" text="每組的打法不變，只換先後順序。" ctl={<Button label="打亂" onClick={() => {
            const p = clone(pattern), gs = p.cell || p.groups;
            if (gs.length < 2) return;
            const before = gs.map(g => g.stick).join();
            for (let t = 0; t < 10 && gs.map(g => g.stick).join() === before; t++) {
              for (let i = gs.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [gs[i], gs[j]] = [gs[j], gs[i]]; }
            }
            setPicker(-1);
            apply(p, false);
            flash('已打亂各組順序');
          }} />} />
          <Tool title="左右手對調" text="R 和 L 互換，用來練不順的那隻手。" ctl={<Button label="對調" onClick={() => {
            const swap = {R: 'L', L: 'R', K: 'K'};
            edit(p => (p.cell || p.groups).forEach(g => { g.stick = [...g.stick].map(c => swap[c]).join(''); g.voices = voicesFor(g.stick, S); }));
            flash('左右手已對調');
          }} />} />
          <Tool title="換打的鼓" text="手順不變，重新分配要打的鼓（選「Fill」配器時最明顯）。" ctl={<Button label="換鼓" onClick={() => revoice()} />} />
        </List>
      </FoldGroup>

      <FoldGroup title="練習設定" sub="節拍器、預備拍、自動加速">
        <Toggle label="節拍器：每拍響一聲" value={S.click} onChange={v => update({click: v})} />
        <Choose label="節拍器的細分音（例如 16 分音符的 e & a）" value={S.clickSub} onChange={v => update({clickSub: v})}
          options={[{value: 'soft', label: '比拍點小聲'}, {value: 'same', label: '跟拍點一樣大聲'}, {value: 'off', label: '不打，只有拍點'}]} />
        <Toggle label="預備拍：開始前先數一小節" value={S.countIn} onChange={v => update({countIn: v})} />
        <Toggle label="自動加速：打熟了自動變快" value={S.trainer} onChange={v => { update({trainer: v}); engine.resetLoops(); }} />
        {S.trainer && (
          <Pair>
            <Choose label="每重複幾次加快" value={S.trainerEvery} onChange={v => update({trainerEvery: +v})} options={[2, 4, 8]} />
            <Choose label="每次加快（BPM）" value={S.trainerStep} onChange={v => update({trainerStep: +v})} options={[2, 5, 10]} />
            <NumberInput label="最快到（BPM）" isIntegerOnly min={40} max={260} value={S.trainerMax}
              onChange={v => update({trainerMax: Math.max(40, Math.min(260, Math.round(v) || DEFAULTS.trainerMax))})} />
          </Pair>
        )}
      </FoldGroup>

      {!lib && (
        <FoldGroup title="進階規則" sub="自己決定怎麼產生節奏">
          <Pair>
            <Choose label="拍號（一小節幾拍）" value={S.beats} onChange={v => regen({beats: +v})} options={[2, 3, 4, 5, 6, 7].map(n => ({value: n, label: `${n}/4`}))} />
            {S.type !== 'djent' && (
              <Field label="幾個小節">
                <SegChoice label="幾個小節" value={S.bars} onChange={v => regen({bars: v})} options={[{value: 1, label: '1'}, {value: 2, label: '2'}]} />
              </Field>
            )}
          </Pair>
          <Field label="每組長度（幾個音）">
            <HStack gap={4} wrap="wrap">
              {[2, 3, 4, 5, 6, 7, 8].map(n => (
                <CheckboxInput key={n} label={String(n)} value={S.sizes.includes(n)}
                  onChange={on => regen({sizes: [2, 3, 4, 5, 6, 7, 8].filter(k => (k === n ? on : S.sizes.includes(k)))})} />
              ))}
            </HStack>
          </Field>
          <Field label="打法變化">
            <SegChoice label="打法變化" value={S.lib} onChange={v => { regen({lib: v}); flash(`打法變化：${LIB_NAME[v]}`); }}
              options={[{value: 'classic', label: '常見'}, {value: 'ext', label: '較多'}, {value: 'all', label: '全部'}]} />
            <Text type="supporting">常見：鼓手常用的打法。較多：同一隻手最多連打 2 下的所有打法。全部：沒有限制。</Text>
          </Field>
          <Pair>
            <Field label="大鼓在每組的">
              <SegChoice label="大鼓位置" value={S.kickPos} onChange={v => regen({kickPos: v})} options={[{value: 'end', label: '最後'}, {value: 'start', label: '最前'}]} />
            </Field>
            <Choose label="手打哪些鼓" value={S.orch} onChange={v => { update({orch: v}); revoice({...S, orch: v}); }}
              options={[{value: 'hh', label: '右手 Hi-hat、左手小鼓'}, {value: 'ride', label: '右手 Ride、左手小鼓'}, {value: 'china', label: '右手 China、左手小鼓'},
                {value: 'crash', label: '右手 Crash、左手小鼓'}, {value: 'toms', label: 'Fill：加入中鼓、落地鼓'}]} />
          </Pair>
          <Toggle label="可以連踩兩下大鼓（K K）" value={S.doubleKick} onChange={v => regen({doubleKick: v})} />
          <Toggle label="每組第一個音打重音（大鼓不打重音）" value={S.accents} onChange={v => update({accents: v})} />
        </FoldGroup>
      )}

      <Group title="我的收藏" id="h-fav">
        {!favs.length && <Hint>還沒有收藏。遇到喜歡的節奏，按樂譜右上角的「☆ 收藏」。</Hint>}
        {!!favs.length && <List hasDividers edge="flush">
          {favs.map((f, i) => (
            <ListItem key={i + stickingText(f.p)} itemKey={i + stickingText(f.p)}
              label={<span className="fav-stk">{stickingText(f.p)}</span>}
              description={<>
                <span className="fav-mini" dangerouslySetInnerHTML={{__html: favMini(f.p, S)}} />
                {SUB_NAME[f.p.sub]} · {f.p.beats}/4 · {f.p.bars} 小節 · {f.bpm} BPM
              </>}
              endContent={<HStack gap={1.5}>
              <Button size="sm" label="載入" onClick={() => {
                // a favourite is a groove of your own, not one from the curated list
                const p = clone(f.p);
                setS(s => ({...s, src: 'gen', ...adopt(p), bpm: f.bpm}));
                apply(p, true);
                window.scrollTo({top: 0, behavior: 'smooth'});
                flash('已載入');
              }} />
              <Button size="sm" variant={armedFav === i ? 'destructive' : 'secondary'} label={armedFav === i ? '確定刪除？' : '刪除'} onClick={() => {
                if (armedFav !== i) { setArmedFav(i); setTimeout(() => setArmedFav(a => (a === i ? -1 : a)), 3000); return; }
                setArmedFav(-1);
                setFavs(favs.filter((_, j) => j !== i));
              }} />
              </HStack>} />
          ))}
        </List>}
      </Group>

      <Dock actionLabel={lib ? '下一個' : '換一個'} onAction={nextGroove} bpm={S.bpm} setBpm={setBpm} min={MIN_BPM} max={MAX_BPM}
        playing={playing} onPlay={toggle} flash={flash} />
    </Page>
  );
}

// One edit tool as a list row: what it does, its buttons at the end, and its current state under the text.
function Tool({title, text, ctl, state}) {
  return (
    <ListItem label={title} description={<>{text}{state && <span className="tool-state">{state}</span>}</>}
      endContent={<HStack gap={1.5}>{ctl}</HStack>} />
  );
}

// The groups as coloured chips; tap one to replace it. Chips carry data-i (or data-c for a Djent cell) for highlighting.
const Strip = forwardRef(function Strip({pattern, S, picker, n, onPick}, ref) {
  const chip = (limb, k, g, attrs) => (
    <span key={k} className={`chip ${limb}${S.accents && k === 0 && limb !== 'K' ? ' acc' : ''}`} {...attrs}>
      {limb}<small>{VOICES[g.voices[k]].label}</small>
    </span>
  );
  if (pattern.cell) {
    let c = 0;
    return (
      <div className="strip" ref={ref}>
        {pattern.cell.map((g, ci) => {
          const gi = pattern.groups.findIndex(x => x.ci === ci);
          const sel = picker >= 0 && pattern.groups[picker]?.ci === ci;
          return (
            <button key={ci} type="button" className={'grp' + (sel ? ' sel' : '')} aria-label={`替換 riff 的第 ${ci + 1} 組（${g.stick}）`} onClick={() => onPick(gi)}>
              {[...g.stick].map((limb, k) => chip(limb, k, g, {'data-c': c++}))}
            </button>
          );
        })}
      </div>
    );
  }
  let i = 0;
  return (
    <div className="strip" ref={ref}>
      {pattern.groups.map((g, gi) => (
        <button key={gi} type="button" className={'grp' + (picker === gi ? ' sel' : '')} aria-label={`替換第 ${gi + 1} 組（${g.stick}）`} onClick={() => onPick(gi)}>
          {[...g.stick].map((limb, k) => chip(limb, k, g, {'data-i': displayIndex(pattern, n, i++)}))}
        </button>
      ))}
    </div>
  );
});

// Substitute one group: rotations of the same notes, or any other sticking of that length.
function Picker({pattern, gi, S, onSet, onRandom, onClose}) {
  const g = editGroup(pattern, gi), rot = rotations(g.stick), all = pool(g.stick.length, S);
  const opts = list => list.map(s => (
    <button key={s} type="button" className={'opt' + (s === g.stick ? ' cur' : '')} onClick={() => onSet(s)}>
      {[...s].map((c, k) => <b key={k} className={c}>{c}</b>)}
    </button>
  ));
  return (
    <div className="picker">
      <div className="pk-head">
        <strong>{pattern.cell ? `換掉 riff 的第 ${pattern.groups[gi].ci + 1} 組（每次重複都會換）` : `換掉第 ${gi + 1} 組`}</strong>
        <Button size="sm" label="隨便換一個" onClick={onRandom} />
        <Button size="sm" variant="primary" label="完成" onClick={onClose} />
      </div>
      <div className="pk-lbl">點下面任一個打法，就會換上去，可以邊播放邊試。</div>
      {!!rot.length && <><div className="pk-sub">同樣的音，換個起點</div><div className="pk-opts">{opts(rot)}</div></>}
      <div className="pk-sub">其他 {g.stick.length} 個音的打法（{all.length} 種）</div>
      <div className="pk-opts pk-scroll">{opts(all)}</div>
    </div>
  );
}
