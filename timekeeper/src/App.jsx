import {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Slider} from '@astryxdesign/core/Slider';
import {NumberInput} from '@astryxdesign/core/NumberInput';
import {Badge} from '@astryxdesign/core/Badge';
import {Heading} from '@astryxdesign/core/Heading';
import {
  AppTheme, Choose, Dock, Field, Glossary, Guide, Header, ModeGrid, Panel, Seg, Status, Toggle,
  load, save, useFlash, useKeys, useLatest, useStored,
} from '../../shared/src/ui.jsx';
import {MAX_BPM, MIN_BPM, MODE_NAME, PERFECT_MS, SHIFT_CELL, SHIFT_NAME, SUB_NAME, clampBpm, createKeeper, describeOff} from './core.js';
import {PATTERNS, patternStaff} from './patterns.js';
import {hitChart, logChart} from './charts.js';

const LOG_MAX = 500;
const DEFAULTS = {
  mode: 'gap', bpm: 80, meter: 4, subGrid: 2, subLevel: 'off', countIn: true,
  gapPlay: 2, gapMute: 2, gapShow: false, gapGrow: false, gapMax: 8,
  shiftPos: '24', rampKind: 'linear', rampEnd: 120, rampEvery: 4, rampStep: 5,
  detNote: 'q', sens: 6, seenGuide: false, pattern: 'q-single',
};
const MODE_OPTS = [
  {value: 'metro', label: '節拍器', sub: '一般的 click'},
  {value: 'gap', label: 'Gap click', sub: '響幾小節、安靜幾小節'},
  {value: 'shift', label: '位移節拍器', sub: 'click 只在 2、4 或反拍'},
  {value: 'ramp', label: '漸進速度', sub: '自動加速或減速'},
];
const TERMS = [
  ['Gap click', '節拍器響幾小節、安靜幾小節，一直循環。安靜時靠自己維持速度。'],
  ['偏差', '你打的時間點和拍點差幾毫秒。負數＝太早（搶拍），正數＝太晚（拖拍）。'],
  ['穩定度', '每一下偏差的分散程度（標準差），數字越小越穩。'],
  ['延遲校正', '平板的聲音要經過 Xenyx 才到耳機，麥克風也有延遲。校正後 App 會自動扣掉。'],
];

function migrate(S) {
  if (!MODE_NAME[S.mode]) S.mode = 'gap';
  if (!PATTERNS.some(p => p.id === S.pattern)) S.pattern = PATTERNS[0].id;
  if (!['off', 'soft', 'same'].includes(S.subLevel)) S.subLevel = 'off';
  if (![2, 3, 4, 5, 6, 7].includes(S.meter)) S.meter = 4;
  S.bpm = clampBpm(S.bpm);
  return S;
}
// dBFS → position on the level meter (−60 … 0 dB)
const levelPos = v => Math.max(0, Math.min(100, ((20 * Math.log10(Math.max(v, 1e-6)) + 60) / 60) * 100));

export default function App() {
  return <AppTheme><TimeKeeper /></AppTheme>;
}

function TimeKeeper() {
  const [S, update] = useStored('tk.settings', DEFAULTS, migrate);
  const [log, setLog] = useState(() => load('tk.log', []));
  const [latency, setLatency] = useState(() => load('tk.latency', null));   // {ms, date}
  const [playing, setPlaying] = useState(false);
  const [beat, setBeat] = useState({lit: -1, quiet: false, info: ''});
  const [mic, setMic] = useState(false);
  const [level, setLevel] = useState({bar: 0, thr: 0, note: '按「開始聽」後，這裡會顯示麥克風收到的音量；直線是門檻，打擊要超過它才算。'});
  const [recent, setRecent] = useState([]);
  const [calibText, setCalibText] = useState(null);
  const [calibbing, setCalibbing] = useState(false);
  const [result, setResult] = useState(null);
  const [armed, setArmed] = useState(false);
  const [msg, flash, setMsg] = useFlash();
  const [help, setHelp] = useState(false);
  const practice = useRef(null);
  const chartBox = useRef(null);
  const [chartW, setChartW] = useState(640);

  useEffect(() => save('tk.log', log), [log]);
  useEffect(() => { if (latency) save('tk.latency', latency); }, [latency]);

  const live = useLatest({S, latencyMs: latency ? latency.ms : null});
  const keeper = useMemo(() => createKeeper(() => live.current, {
    onCount: n => { setMsg(`預備 ${n}`); setBeat(b => ({...b, lit: n - 1})); },
    onBpm: v => flash(`${v} BPM`),
    onMsg: m => flash(m),
    onBeat: e => { setMsg(m => (m.startsWith('預備') ? '' : m)); setBeat({lit: e.hide ? -1 : e.beat, quiet: e.muted, info: e.info}); },
    onStopped: () => { setPlaying(false); setBeat({lit: -1, quiet: false, info: ''}); setMsg(''); },
    onLevel: (lv, thr) => setLevel({bar: levelPos(lv), thr: levelPos(thr), note: lv > thr ? '有聽到打擊' : '目前很安靜'}),
    onHit: off => setRecent(r => [...r.slice(-7), off]),
    onMic: on => { setMic(on); if (!on) setLevel(l => ({...l, bar: 0})); },
    onMicError: m => { flash(m); setLevel(l => ({...l, note: m})); },
    onCalib: (text, active) => { setCalibText(text); setCalibbing(active); },
    onCalibDone: rec => { setLatency(rec); setCalibText(null); setCalibbing(false); flash(`校正完成：延遲 ${rec.ms} 毫秒`); },
    onSession: (entry, res, keep) => {
      if (res) setResult(res);
      if (keep) setLog(l => [entry, ...l].slice(0, LOG_MAX));
    },
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  // the result chart is drawn at the width it really has, so its 11 px labels stay 11 px on a phone
  useLayoutEffect(() => { if (result && chartBox.current) setChartW(chartBox.current.clientWidth); }, [result]);

  const setBpm = v => { const b = clampBpm(v); update({bpm: b}); keeper.setBpm(b); };
  const play = () => { setResult(null); setRecent([]); keeper.play(); setPlaying(true); };
  const toggle = () => (keeper.isPlaying() ? keeper.stop() : play());
  // changes that alter the beat pattern restart cleanly
  const restart = useRef(false);
  useEffect(() => { if (restart.current) { restart.current = false; play(); } });
  const set = patch => { if (keeper.isPlaying()) { keeper.stop(); restart.current = true; } update(patch); };

  const taps = useRef([]);
  const tap = () => {
    const now = performance.now(), a = taps.current;
    if (a.length && now - a.at(-1) > 2000) a.length = 0;
    a.push(now);
    if (a.length > 4) a.shift();
    if (a.length < 4) { flash(`再點 ${4 - a.length} 下`); return; }
    const b = clampBpm(60000 / ((a.at(-1) - a[0]) / 3));
    setBpm(b);
    flash(`${b} BPM`);
  };
  useKeys({Space: toggle, t: tap, T: tap});

  const p = PATTERNS.find(q => q.id === S.pattern) || PATTERNS[0];
  const modeSub = {
    metro: `${S.meter}/4${S.subLevel === 'off' ? '' : ` · 細分 ${SUB_NAME[S.subGrid]}`}`,
    gap: `響 ${S.gapPlay} 小節 · 安靜 ${S.gapMute} 小節${S.gapGrow ? `（漸進到 ${S.gapMax}）` : ''}`,
    shift: `click 在 ${SHIFT_NAME[S.shiftPos]}`,
    ramp: `${S.bpm} → ${S.rampEnd} BPM · 每 ${S.rampEvery} 小節 ${S.rampEnd >= S.bpm ? '+' : '−'}${S.rampStep}${S.rampKind === 'ladder' ? ' · 速度梯' : ''}`,
  }[S.mode];
  const showGuide = help || !S.seenGuide;
  const shiftOn = (b, k) => (S.shiftPos === '24' ? b % 2 === 1 && k === 0 : SHIFT_CELL[S.shiftPos] != null ? k === SHIFT_CELL[S.shiftPos] : b === 0 && k === 0);
  const fmt = iso => { const d = new Date(iso); return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const groups = [];
  PATTERNS.forEach(q => { if (!groups.length || groups.at(-1)[0] !== q.group) groups.push([q.group, []]); groups.at(-1)[1].push(q); });
  const logSvg = useMemo(() => logChart(log), [log]);

  return (
    <div className="app tk">
      <div className="col-main">
        <Header title="Time Keeper" tag="練時間感：節拍器消失幾小節再回來，你還對得上嗎？開麥克風就知道你快了還是慢了幾毫秒。"
          guideOpen={showGuide} onHelp={() => (showGuide ? (setHelp(false), update({seenGuide: true})) : setHelp(true))} />
        {showGuide && (
          <Guide tips={TERMS} onOk={() => { setHelp(false); update({seenGuide: true}); }}>
            <li><b>在「打什麼」選一個動作、「怎麼練」選一種練法</b>，第一次建議「4 分音符 R L R L」配「Gap click」（響 2 小節、安靜 2 小節）。</li>
            <li><b>按 ▶</b>，照練習卡上的譜跟著 click 打；安靜的時候繼續打，心裡數拍。</li>
            <li><b>想知道準不準，按左下角「開始聽」</b>打開麥克風。第一次要先做「延遲校正」：跟著 click 打 8 下。</li>
          </Guide>
        )}

        <section className="sheet" ref={practice} aria-label="目前的練習">
          <div className="sheet-head">
            <div className="ex-title"><Heading level={2}>{MODE_NAME[S.mode]}</Heading><span className="ex-en">{modeSub}</span></div>
            <Button size="sm" label="點按測速" onClick={tap} />
          </div>
          <div className="pat-now">
            <span className="hint">打：<b>{p.name}</b></span>
            <div className="pat-staff" dangerouslySetInnerHTML={{__html: patternStaff(p, 4, 1.7)}} />
          </div>
          <Status msg={msg} />
          <div className={'beats' + (S.meter > 5 ? ' many' : '') + (beat.quiet ? ' quiet' : '')} aria-label="拍子">
            {Array.from({length: S.meter}, (_, b) => (
              <span key={b} className={'beat' + (b === 0 ? ' one' : '') + (beat.lit === b ? ' on' : '')}>
                <b>{b + 1}</b>
                {S.mode === 'shift' && <span className="cells">{[0, 1, 2, 3].map(k => <i key={k} className={shiftOn(b, k) ? 'c' : ''} />)}</span>}
              </span>
            ))}
          </div>
          <div className="info">{playing ? beat.info : `${S.meter}/4 · 按 ▶ 開始${mic ? '，麥克風正在聽' : ''}`}</div>
          {mic && (
            <div className="meter">
              <div className="meter-track" aria-hidden="true">
                <span className="meter-zone" /><span className="meter-mid" />
                <span className="meter-dots">
                  {recent.map((o, i) => (
                    <i key={i} className={Math.abs(o) <= PERFECT_MS ? 'ok' : o < 0 ? 'early' : 'late'}
                      style={{left: `${50 + (Math.max(-50, Math.min(50, o)) / 50) * 50}%`, opacity: (0.25 + (0.75 * (i + 1)) / recent.length).toFixed(2)}} />
                  ))}
                </span>
              </div>
              <div className="meter-scale" aria-hidden="true"><span>早 50 ms</span><span>準（±10）</span><span>晚 50 ms</span></div>
              <div className="meter-last" aria-live="polite">{recent.length ? `這一下${describeOff(recent.at(-1))}` : '還沒有聽到打擊'}</div>
            </div>
          )}
        </section>

        {result && (
          <section className="result" aria-labelledby="h-result">
            <Heading level={2} id="h-result">這次的結果</Heading>
            <Result r={result} latency={latency} chartBox={chartBox} chartW={chartW} />
          </section>
        )}
      </div>

      <div className="col-side">
        <Panel title="打什麼" id="h-play">
          <p className="hint">選一個動作，練習卡上會顯示一整小節的譜。麥克風會照這個動作的音符（4 分或 8 分）檢查你打得準不準。</p>
          <ol className="ex-list">
            {groups.map(([g, qs]) => [
              <li key={g} className="pat-group">{g}</li>,
              ...qs.map(q => (
                <li key={q.id}>
                  <button type="button" className={'ex' + (q.id === p.id ? ' cur' : '')} onClick={() => {
                    // the microphone checks the grid this pattern is played on
                    set({pattern: q.id, detNote: q.det});
                    practice.current?.scrollIntoView({behavior: 'smooth', block: 'start'});
                    flash(`打：${q.name}`);
                  }}>
                    <span className="ex-main"><span className="ex-name">{q.name}</span><span className="ex-en">偵測 {q.det === 'e' ? '8 分' : '4 分'}音符</span></span>
                    <span className="ex-mini" dangerouslySetInnerHTML={{__html: patternStaff(q, 2)}} />
                  </button>
                </li>
              )),
            ])}
          </ol>
        </Panel>

        <Panel title="怎麼練" id="h-what">
          <ModeGrid label="練習模式" value={S.mode} options={MODE_OPTS} onChange={m => set({mode: m})} />
          {S.mode === 'metro' && <p className="hint">最基本的節拍器。細分音、拍號在下面的「節拍器」設定。</p>}
          {S.mode === 'gap' && (
            <>
              <div className="row2">
                <Choose label="響幾小節" value={S.gapPlay} onChange={v => set({gapPlay: +v})} options={[1, 2, 4].map(n => ({value: n, label: `${n} 小節`}))} />
                <Choose label="安靜幾小節" value={S.gapMute} onChange={v => set({gapMute: +v})} options={[1, 2, 4, 8].map(n => ({value: n, label: `${n} 小節`}))} />
              </div>
              <Toggle label="安靜時畫面繼續標示拍子" description="關掉才是真的在練內在時間" value={S.gapShow} onChange={v => set({gapShow: v})} />
              <Toggle label="漸進：每成功一輪，安靜就多 1 小節" value={S.gapGrow} onChange={v => set({gapGrow: v})} />
              {S.gapGrow && (
                <>
                  <Choose label="最多安靜幾小節" value={S.gapMax} onChange={v => set({gapMax: +v})} options={[4, 8, 16]} />
                  <p className="hint">開麥克風時，回來那一拍差 30 毫秒以內才算成功；沒開就每一輪都加。</p>
                </>
              )}
            </>
          )}
          {S.mode === 'shift' && (
            <>
              <Choose label="click 響在哪裡" value={S.shiftPos} onChange={v => set({shiftPos: v})}
                options={[{value: '24', label: '2、4 拍（偶數拍）'}, {value: 'and', label: '每拍的 &（反拍）'}, {value: 'e', label: '每拍的 e'},
                  {value: 'a', label: '每拍的 a'}, {value: 'bar', label: '每小節只有第 1 拍'}, {value: '2bar', label: '每 2 小節只有第 1 拍'}]} />
              <p className="hint">你還是照拍點打，click 落在別的位置。畫面上方的小格子標出 click 在一拍裡的哪裡。</p>
            </>
          )}
          {S.mode === 'ramp' && (
            <>
              <Field label="怎麼變">
                <Seg label="怎麼變速" value={S.rampKind} onChange={v => set({rampKind: v})}
                  options={[{value: 'linear', label: '一路變到終點', sub: '到了就維持'}, {value: 'ladder', label: '速度梯', sub: '到頂再回到起點'}]} />
              </Field>
              <div className="row2">
                <NumberInput label="終點 BPM" isIntegerOnly min={30} max={300} value={S.rampEnd}
                  onChange={v => set({rampEnd: clampBpm(Math.round(v) || DEFAULTS.rampEnd)})} />
                <Choose label="每幾小節變一次" value={S.rampEvery} onChange={v => set({rampEvery: +v})} options={[1, 2, 4, 8]} />
                <Choose label="每次變多少 BPM" value={S.rampStep} onChange={v => set({rampStep: +v})} options={[1, 2, 5, 10]} />
              </div>
              <p className="hint">起點就是下方播放列的速度。終點比起點快就是加速，比較慢就是減速。</p>
            </>
          )}
        </Panel>

        <Panel title="節拍器" id="h-click">
          <div className="row2">
            <Choose label="拍號" value={S.meter} onChange={v => set({meter: +v})} options={[2, 3, 4, 5, 6, 7].map(n => ({value: n, label: `${n}/4`}))} />
            <Choose label="細分音" value={S.subGrid} onChange={v => set({subGrid: +v})} options={[2, 3, 4, 6].map(n => ({value: n, label: SUB_NAME[n]}))} />
          </div>
          <Choose label="細分音的音量" value={S.subLevel} onChange={v => set({subLevel: v})}
            options={[{value: 'off', label: '不打，只有拍點'}, {value: 'soft', label: '比拍點小聲'}, {value: 'same', label: '跟拍點一樣大聲'}]} />
          <Toggle label="預備拍：開始前先數一小節" value={S.countIn} onChange={v => set({countIn: v})} />
        </Panel>

        <Panel title={<>麥克風偵測 <Badge label="Beta" /></>} id="h-mic">
          <p className="hint">用平板的麥克風聽鼓棒打在 pad 上的聲音。只在這台裝置上即時處理，不錄音、不上傳。平板請放在鼓架上，靠近小鼓。</p>
          <Field label="你打的音符">
            <Seg label="你打的音符" value={S.detNote} onChange={v => set({detNote: v})}
              options={[{value: 'q', label: '4 分音符', sub: '每拍一下'}, {value: 'e', label: '8 分音符', sub: '每拍兩下'}]} />
          </Field>
          <div className="field">
            <Slider label={`靈敏度：${S.sens}（抓不到就調高，雜音也被算進去就調低）`} valueDisplay="none" min={1} max={10} value={S.sens}
              onChange={v => { update({sens: v}); keeper.setSensitivity(v); }} />
            <div className="level" aria-hidden="true"><span className="level-bar" style={{width: `${mic ? level.bar : 0}%`}} /><span className="level-thr" style={{left: `${level.thr}%`}} /></div>
            <span className="hint">{level.note}</span>
          </div>
          <div className="calib">
            <Button size="sm" label={calibbing ? '取消校正' : '延遲校正'} onClick={() => keeper.calibToggle()} />
            <span className="hint">{calibText ?? (latency ? `延遲 ${latency.ms} 毫秒（${latency.date} 校正）；換了平板位置或接線請重做` : '還沒校正')}</span>
          </div>
        </Panel>

        <Panel title="練習紀錄" id="h-log">
          <div className="chart" dangerouslySetInnerHTML={{__html: logSvg}} />
          <ol className="log">
            {log.length ? log.slice(0, 20).map((e, i) => (
              <li key={e.d + i}>
                <span className="lg-when">{fmt(e.d)}</span>
                <span className="lg-what">{MODE_NAME[e.mode] || e.mode} · {e.bpm} BPM · {mmss(e.dur)}</span>
                <span className="lg-num">{e.sd != null ? `${e.mean > 0 ? '+' : ''}${e.mean} ms · ±${e.sd}` : '—'}</span>
              </li>
            )) : <li className="empty">還沒有紀錄。練超過 10 秒、按停止後會記在這裡。</li>}
          </ol>
          {!!log.length && (
            <div>
              <Button size="sm" variant={armed ? 'destructive' : 'secondary'} label={armed ? '確定清除全部紀錄？' : '清除紀錄'} onClick={() => {
                if (!armed) { setArmed(true); setTimeout(() => setArmed(false), 3000); return; }
                setArmed(false);
                setLog([]);
              }} />
            </div>
          )}
        </Panel>

        <p className="foot">練習紀錄存在這台裝置上。在 Chrome 選單選「安裝應用程式」就能像 App 一樣使用，沒網路也能練。</p>
      </div>

      <Dock actionLabel={mic ? '停止聽' : '開始聽'} onAction={() => keeper.micToggle()} bpm={S.bpm} setBpm={setBpm}
        min={MIN_BPM} max={MAX_BPM} playing={playing} onPlay={toggle} flash={flash} />
    </div>
  );
}

function Result({r, latency, chartBox, chartW}) {
  const e = r.entry;
  const lean = e.mean < -5 ? '偏早（搶拍）' : e.mean > 5 ? '偏晚（拖拍）' : '很準';
  const steady = e.sd < 10 ? '非常穩' : e.sd < 20 ? '穩' : '不太穩';
  const rate = e.due ? e.n / e.due : 1;
  return (
    <>
      <div className="stats">
        <div className="stat"><span>平均偏差</span><b>{e.mean > 0 ? '+' : ''}{e.mean} ms</b><small>{lean}</small></div>
        <div className="stat"><span>穩定度</span><b>±{e.sd} ms</b><small>{steady}</small></div>
        <div className="stat"><span>速度飄移</span>
          {e.gap == null ? <><b>—</b><small>Gap click 開麥克風才有</small></>
            : <><b>{e.gap > 0 ? '+' : ''}{e.gap} BPM</b><small>安靜時比設定{Math.abs(e.gap) < 1 ? '幾乎一樣' : e.gap > 0 ? '快' : '慢'}</small></>}
        </div>
      </div>
      <div className="chart" ref={chartBox} dangerouslySetInnerHTML={{__html: hitChart(r.hits, r.dur, chartW)}} />
      <p className="hint">抓到 {e.n} / {e.due} 下{rate < 0.9 ? '：抓不到的太多，數字可能不準，試著調高靈敏度或把平板放近一點' : ''}。{latency ? '' : '還沒做延遲校正，平均偏差會包含裝置延遲。'}</p>
    </>
  );
}
