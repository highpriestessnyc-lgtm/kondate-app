import { useState, useEffect } from 'react';
import Head from 'next/head';

const CATS = [
  { id: 'veg', name: '🥦 野菜・卵', items: [
    {id:'tamago',e:'🥚',n:'卵'},{id:'tofu',e:'🫙',n:'豆腐'},
    {id:'ninjin',e:'🥕',n:'にんじん'},{id:'tamanegi',e:'🧅',n:'玉ねぎ'},
    {id:'jagaimo',e:'🥔',n:'じゃがいも'},{id:'kyabetsu',e:'🥬',n:'キャベツ'},
    {id:'hakusai',e:'🥬',n:'白菜'},{id:'negi',e:'🌿',n:'ねぎ'},
    {id:'tomato',e:'🍅',n:'トマト'},{id:'horenso',e:'🌱',n:'ほうれん草'},
    {id:'kinoko',e:'🍄',n:'きのこ'},{id:'nasu',e:'🍆',n:'なす'},
    {id:'kyuri',e:'🥒',n:'きゅうり'},{id:'brocco',e:'🥦',n:'ブロッコリー'},
    {id:'daikon',e:'🌾',n:'大根'},{id:'avocado',e:'🥑',n:'アボカド'},
    {id:'corn',e:'🌽',n:'とうもろこし'},{id:'edamame',e:'🫛',n:'枝豆'},
    {id:'moyashi',e:'🌱',n:'もやし'},{id:'paprika',e:'🫑',n:'パプリカ'},
  ]},
  { id: 'meat', name: '🥩 肉・魚', items: [
    {id:'chicken',e:'🍗',n:'鶏肉'},{id:'pork',e:'🥩',n:'豚肉'},
    {id:'beef',e:'🥩',n:'牛肉'},{id:'salmon',e:'🐟',n:'さけ'},
    {id:'shrimp',e:'🦐',n:'えび'},{id:'bacon',e:'🥓',n:'ベーコン'},
    {id:'sausage',e:'🌭',n:'ソーセージ'},{id:'tuna',e:'🥫',n:'ツナ缶'},
    {id:'ika',e:'🦑',n:'いか'},{id:'ham',e:'🍖',n:'ハム'},
    {id:'saba',e:'🐠',n:'さば缶'},{id:'hotate',e:'🐚',n:'ほたて'},
  ]},
  { id: 'dairy', name: '🥛 乳製品', items: [
    {id:'milk',e:'🥛',n:'牛乳'},{id:'cheese',e:'🧀',n:'チーズ'},
    {id:'butter',e:'🧈',n:'バター'},{id:'yogurt',e:'🫙',n:'ヨーグルト'},
    {id:'cream',e:'🍶',n:'生クリーム'},
  ]},
  { id: 'grain', name: '🍚 主食', items: [
    {id:'rice',e:'🍚',n:'ごはん'},{id:'pasta',e:'🍝',n:'パスタ'},
    {id:'bread',e:'🍞',n:'パン'},{id:'udon',e:'🍜',n:'うどん'},
    {id:'soba',e:'🍜',n:'そば'},{id:'ramen',e:'🍜',n:'ラーメン麺'},
  ]},
];

export default function Home() {
  const [tab, setTab] = useState('fridge');
  const [activeCat, setActiveCat] = useState('veg');
  const [fridge, setFridge] = useState({});
  const [favMeals, setFavMeals] = useState([]);
  const [favSauces, setFavSauces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [openSteps, setOpenSteps] = useState({});
  const [lastSnap, setLastSnap] = useState({});

  useEffect(() => {
    try {
      const f = localStorage.getItem('fridge'); if (f) setFridge(JSON.parse(f));
      const fm = localStorage.getItem('favMeals'); if (fm) setFavMeals(JSON.parse(fm));
      const fs = localStorage.getItem('favSauces'); if (fs) setFavSauces(JSON.parse(fs));
    } catch(e) {}
  }, []);

  const saveFridge = (f) => { setFridge(f); try { localStorage.setItem('fridge', JSON.stringify(f)); } catch(e) {} };
  const saveFavMeals = (m) => { setFavMeals(m); try { localStorage.setItem('favMeals', JSON.stringify(m)); } catch(e) {} };
  const saveFavSauces = (s) => { setFavSauces(s); try { localStorage.setItem('favSauces', JSON.stringify(s)); } catch(e) {} };

  const toggleIng = (cat, item) => {
    const nf = { ...fridge };
    if (nf[item.id]) delete nf[item.id]; else nf[item.id] = { item, qty: 1 };
    saveFridge(nf);
  };
  const chgQty = (id, d) => {
    if (!fridge[id]) return;
    const nf = { ...fridge };
    nf[id].qty = Math.max(0.5, Math.round((nf[id].qty + d) * 10) / 10);
    saveFridge(nf);
  };
  const resetFridge = () => { if (confirm('リセットしますか？')) saveFridge({}); };

  const generate = async () => {
    const keys = Object.keys(fridge);
    if (!keys.length) return;
    const ingList = keys.map(k => { const { item, qty } = fridge[k]; return `${item.n}(${qty % 1 === 0 ? qty : qty.toFixed(1)}個)`; }).join('、');
    setLastSnap(JSON.parse(JSON.stringify(fridge)));
    setLoading(true); setResult(null); setError(null); setOpenSteps({});
    try {
      const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ingredients: ingList }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setResult(data);
      setTab('menu');
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const deduct = () => {
    if (!confirm('使った食材を差し引きますか？')) return;
    const nf = { ...fridge };
    Object.keys(lastSnap).forEach(id => {
      if (nf[id]) { nf[id].qty = Math.max(0, Math.round((nf[id].qty - lastSnap[id].qty) * 10) / 10); if (nf[id].qty <= 0) delete nf[id]; }
    });
    saveFridge(nf); alert('✅ 完了！');
  };

  const toggleFavMeal = (m) => {
    const idx = favMeals.findIndex(f => f.name === m.name);
    if (idx >= 0) saveFavMeals(favMeals.filter((_, i) => i !== idx));
    else saveFavMeals([...favMeals, { ...m, id: Date.now() }]);
  };
  const toggleFavSauce = (s) => {
    const idx = favSauces.findIndex(f => f.name === s.name);
    if (idx >= 0) saveFavSauces(favSauces.filter((_, i) => i !== idx));
    else saveFavSauces([...favSauces, { ...s, id: Date.now() }]);
  };

  const togSteps = (id) => setOpenSteps(p => ({ ...p, [id]: !p[id] }));

  const fridgeKeys = Object.keys(fridge);
  const cat = CATS.find(c => c.id === activeCat);
  const micon = { '朝食': '🌅', '昼食': '☀️', '夕食': '🌙' };

  return (
    <>
      <Head>
        <title>今日の献立なーに？</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;1,400&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
        :root{--bg:#FDFAF5;--sur:#FFF;--dark:#1C1916;--muted:#8A8278;--bdr:rgba(28,25,22,0.1);--gold:#9A7B3C;--gl:#F7F0DC;--gd:#7A5E20;--sage:#5A7040;--sl:#EAF0DF;--plum:#50407A;--pl:#F0ECF5;--ruby:#7A2E38;--rl:#FAE8E8;--amb:#C49A30;}
        body{font-family:'Noto Sans JP',sans-serif;background:var(--bg);color:var(--dark);font-size:14px;min-height:100vh;}
        .hdr{background:var(--bg);border-bottom:1px solid var(--bdr);padding:12px 16px 0;position:sticky;top:0;z-index:100;}
        .hdr-top{display:flex;align-items:baseline;gap:8px;margin-bottom:10px;}
        .h1{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;}
        .hem{font-size:11px;color:var(--muted);font-family:'Cormorant Garamond',serif;font-style:italic;}
        .tabs{display:flex;}
        .tb{flex:1;padding:8px 4px 7px;border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;font-family:'Noto Sans JP',sans-serif;font-size:11px;color:var(--muted);display:flex;flex-direction:column;align-items:center;gap:2px;transition:all .15s;}
        .tb.on{color:var(--gold);border-bottom-color:var(--gold);font-weight:700;}
        .ti{font-size:17px;}
        .note{background:var(--sl);padding:7px 14px;font-size:11px;color:var(--sage);display:flex;align-items:center;gap:5px;}
        .ftop{padding:10px 14px 6px;display:flex;justify-content:space-between;align-items:center;}
        .ftop-h{font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:600;font-style:italic;}
        .rbtn{font-size:11px;color:var(--ruby);border:1px solid rgba(122,46,56,0.25);background:none;padding:4px 10px;border-radius:20px;cursor:pointer;}
        .ctabs{display:flex;overflow-x:auto;padding:0 14px;border-bottom:1px solid var(--bdr);}
        .ctabs::-webkit-scrollbar{display:none;}
        .ct{flex-shrink:0;padding:7px 12px 5px;font-size:12px;color:var(--muted);border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;white-space:nowrap;font-family:'Noto Sans JP',sans-serif;}
        .ct.on{color:var(--dark);border-bottom-color:var(--dark);font-weight:700;}
        .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:8px;padding:12px 14px 120px;}
        .ic{background:var(--sur);border:1.5px solid var(--bdr);border-radius:12px;padding:9px 4px 7px;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;position:relative;min-height:84px;justify-content:center;transition:all .12s;}
        .ic:active{transform:scale(0.92);}
        .ic.on{background:var(--gl);border-color:var(--gold);}
        .ie{font-size:24px;line-height:1;}
        .in{font-size:10px;text-align:center;line-height:1.3;font-weight:500;}
        .ichk{position:absolute;top:4px;right:4px;width:14px;height:14px;background:var(--gold);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:8px;font-weight:900;}
        .qc{display:flex;align-items:center;gap:3px;margin-top:3px;}
        .qb{width:20px;height:20px;border-radius:50%;border:1.5px solid var(--gold);background:#fff;color:var(--gold);font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;}
        .qn{font-size:11px;font-weight:700;color:var(--gold);min-width:20px;text-align:center;}
        .mwrap{padding:12px 14px 120px;}
        .ssel{background:var(--sur);border:1px solid var(--bdr);border-radius:12px;padding:10px 12px;margin-bottom:10px;}
        .ssel-t{font-size:10px;color:var(--muted);margin-bottom:5px;}
        .schips{display:flex;flex-wrap:wrap;gap:4px;}
        .sc{background:var(--gl);color:var(--gd);font-size:10px;padding:3px 8px;border-radius:20px;font-weight:500;display:flex;align-items:center;gap:3px;}
        .sc-q{background:var(--gold);color:#fff;border-radius:10px;padding:1px 5px;font-size:9px;font-weight:700;}
        .gbtn{width:100%;padding:14px;background:var(--dark);color:#F7F0DC;border:none;border-radius:12px;font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font-style:italic;}
        .gbtn:disabled{background:#C0BAB0;cursor:not-allowed;}
        .ghint{text-align:center;font-size:11px;color:var(--muted);margin-top:5px;}
        .mc{background:var(--sur);border:1px solid var(--bdr);border-radius:14px;margin-bottom:10px;overflow:hidden;}
        .mch{padding:9px 12px;display:flex;align-items:center;justify-content:space-between;}
        .mch-朝食{background:#FFF8EE;}.mch-昼食{background:var(--sl);}.mch-夕食{background:var(--pl);}
        .mcl{display:flex;align-items:center;gap:8px;}
        .mbdg{font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;color:#fff;}
        .mbdg-朝食{background:var(--amb);}.mbdg-昼食{background:var(--sage);}.mbdg-夕食{background:var(--plum);}
        .mname{font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:600;}
        .fb{font-size:20px;border:none;background:none;cursor:pointer;padding:4px;line-height:1;}
        .mcb{padding:10px 12px;}
        .mdsc{font-size:12px;color:#444;line-height:1.7;margin-bottom:6px;}
        .chips{display:flex;flex-wrap:wrap;gap:3px;margin-top:4px;}
        .chip{font-size:10px;padding:2px 8px;border-radius:20px;font-weight:500;}
        .chip-m{background:var(--gl);color:var(--gd);}
        .chip-s{background:var(--sl);color:var(--sage);}
        .rtog{background:none;border:1px solid var(--bdr);color:var(--muted);border-radius:8px;padding:5px 10px;font-size:11px;cursor:pointer;font-family:'Noto Sans JP',sans-serif;margin-top:7px;}
        .rsteps{padding-top:8px;margin-top:7px;border-top:1px solid var(--bdr);}
        .step{display:flex;gap:7px;margin-bottom:7px;align-items:flex-start;}
        .snum{width:17px;height:17px;border-radius:50%;background:var(--dark);color:#fff;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;}
        .stxt{font-size:11px;line-height:1.6;color:#333;}
        .sblk{background:var(--sur);border:1px solid var(--bdr);border-radius:14px;margin-bottom:10px;overflow:hidden;}
        .sbhdr{background:var(--sl);padding:9px 12px;}
        .sbttl{font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:600;color:var(--sage);font-style:italic;}
        .si{padding:10px 12px;border-bottom:1px solid var(--bdr);}
        .si:last-child{border-bottom:none;}
        .sirow{display:flex;align-items:flex-start;justify-content:space-between;gap:6px;}
        .sn{font-size:13px;font-weight:700;}
        .scat{font-family:'Cormorant Garamond',serif;font-size:12px;color:var(--muted);font-style:italic;}
        .sdsc{font-size:11px;color:#555;margin-top:3px;line-height:1.6;}
        .dbtn{width:100%;margin-top:8px;padding:11px;background:var(--rl);border:1px solid rgba(122,46,56,0.2);border-radius:12px;color:var(--ruby);font-size:12px;font-weight:700;cursor:pointer;font-family:'Noto Sans JP',sans-serif;}
        .tip{background:var(--gl);border:1px solid rgba(154,123,60,0.2);border-radius:12px;padding:11px 13px;margin-bottom:10px;}
        .tip-l{font-family:'Cormorant Garamond',serif;font-size:15px;font-weight:600;color:var(--gd);margin-bottom:3px;font-style:italic;}
        .tip-t{font-size:12px;color:var(--dark);line-height:1.7;}
        .rtry{width:100%;padding:12px;background:transparent;border:1.5px solid var(--dark);border-radius:12px;color:var(--dark);font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:600;font-style:italic;cursor:pointer;margin-top:8px;}
        .fwrap{padding:12px 14px 100px;}
        .fttl{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:600;font-style:italic;margin-bottom:10px;}
        .fcard{background:var(--sur);border:1px solid var(--bdr);border-radius:12px;padding:11px 12px;margin-bottom:8px;display:flex;align-items:flex-start;gap:8px;}
        .fi{flex:1;min-width:0;}
        .fn{font-size:13px;font-weight:700;}
        .fsub{font-size:10px;color:var(--muted);margin-top:2px;}
        .fdsc{font-size:11px;color:#555;margin-top:4px;line-height:1.5;}
        .dbtn2{font-size:16px;border:none;background:none;cursor:pointer;color:var(--muted);padding:2px;flex-shrink:0;}
        .empty{text-align:center;padding:36px 16px;color:var(--muted);}
        .ei{font-size:36px;margin-bottom:10px;}
        .divider{height:1px;background:var(--bdr);margin:16px 0;}
        .lbox{text-align:center;padding:32px;}
        .spin{width:30px;height:30px;border:2px solid var(--gl);border-top-color:var(--gold);border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 12px;}
        @keyframes spin{to{transform:rotate(360deg)}}
        .ltxt{font-family:'Cormorant Garamond',serif;font-size:16px;color:var(--muted);font-style:italic;}
        .err{background:var(--rl);border:1px solid rgba(122,46,56,0.3);border-radius:12px;padding:13px;margin:10px 0;font-size:12px;color:var(--ruby);}
        .res-ttl{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;margin-bottom:12px;font-style:italic;}
      `}</style>

      {/* HEADER */}
      <div className="hdr">
        <div className="hdr-top">
          <span className="h1">今日の献立なーに？</span>
          <em className="hem">by AI Chef</em>
        </div>
        <div className="tabs">
          {[['fridge','🥬','冷蔵庫'],['menu','🍽️','献立'],['favs','❤️','お気に入り']].map(([id,icon,label])=>(
            <button key={id} className={`tb ${tab===id?'on':''}`} onClick={()=>{setTab(id);}}>
              <span className="ti">{icon}</span>{label}
            </button>
          ))}
        </div>
      </div>

      {/* FRIDGE TAB */}
      {tab==='fridge' && <>
        <div className="note">🧂 調味料は全部ある前提で献立を考えます</div>
        <div className="ftop">
          <span className="ftop-h">冷蔵庫の中身</span>
          <button className="rbtn" onClick={resetFridge}>🗑 リセット</button>
        </div>
        <div className="ctabs">
          {CATS.map(c=><button key={c.id} className={`ct ${activeCat===c.id?'on':''}`} onClick={()=>setActiveCat(c.id)}>{c.name}</button>)}
        </div>
        <div className="grid">
          {cat.items.map(item=>{
            const s=fridge[item.id]; const qty=s?s.qty:0;
            return <div key={item.id} className={`ic ${s?'on':''}`} onClick={()=>toggleIng(cat,item)}>
              {s&&<div className="ichk">✓</div>}
              <div className="ie">{item.e}</div>
              <div className="in">{item.n}</div>
              {s&&<div className="qc" onClick={e=>e.stopPropagation()}>
                <button className="qb" onClick={()=>chgQty(item.id,-0.5)}>－</button>
                <span className="qn">{qty%1===0?qty:qty.toFixed(1)}</span>
                <button className="qb" onClick={()=>chgQty(item.id,0.5)}>＋</button>
              </div>}
            </div>;
          })}
        </div>
        {/* Generate button at bottom */}
        <div style={{position:'sticky',bottom:0,background:'var(--bg)',borderTop:'1px solid var(--bdr)',padding:'12px 14px',paddingBottom:'max(12px,env(safe-area-inset-bottom))'}}>
          <button className="gbtn" onClick={generate} disabled={!fridgeKeys.length||loading}>
            {loading?'考え中...':'✦ 献立を考える'}
          </button>
          <p className="ghint">{fridgeKeys.length?`${fridgeKeys.length}種類の食材で献立を考えます`:'食材を1つ以上選んでください'}</p>
        </div>
      </>}

      {/* MENU TAB */}
      {tab==='menu' && <div className="mwrap">
        <div className="ssel">
          <div className="ssel-t">選んだ食材</div>
          <div className="schips">
            {fridgeKeys.length ? fridgeKeys.map(k=>{const{item,qty}=fridge[k];return<span key={k} className="sc">{item.e} {item.n}<span className="sc-q">{qty%1===0?qty:qty.toFixed(1)}</span></span>;})
            :<span style={{fontSize:11,color:'var(--muted)'}}>冷蔵庫タブで食材を選んでください</span>}
          </div>
        </div>
        <button className="gbtn" onClick={generate} disabled={!fridgeKeys.length||loading} style={{marginBottom:8}}>
          {loading?'考え中...':'✦ 献立を考える'}
        </button>
        {loading && <div className="lbox"><div className="spin"></div><p className="ltxt">献立を考えています...</p></div>}
        {error && <div className="err">⚠️ {error}<br/><button className="rtry" onClick={generate} style={{marginTop:8}}>✦ もう一度試す</button></div>}
        {result && <>
          <div style={{marginTop:14}}>
            <div className="res-ttl">✦ 今日の献立</div>
            {(result.meals||[]).map((m,i)=>{
              const rid='meal'+i; const isFav=favMeals.some(f=>f.name===m.name);
              return <div key={i} className="mc">
                <div className={`mch mch-${m.type}`}>
                  <div className="mcl">
                    <span className={`mbdg mbdg-${m.type}`}>{micon[m.type]||'🍽️'} {m.type}</span>
                    <span className="mname">{m.name}</span>
                  </div>
                  <button className="fb" onClick={()=>toggleFavMeal(m)}>{isFav?'❤️':'🤍'}</button>
                </div>
                <div className="mcb">
                  <p className="mdsc">{m.desc}</p>
                  <div className="chips">{(m.ingredients||[]).map((x,j)=><span key={j} className="chip chip-m">{x}</span>)}</div>
                  {(m.steps||[]).length>0&&<>
                    <button className="rtog" onClick={()=>togSteps(rid)}>{openSteps[rid]?'▲ 閉じる':'📋 作り方を見る'}</button>
                    {openSteps[rid]&&<div className="rsteps">{m.steps.map((s,j)=><div key={j} className="step"><div className="snum">{j+1}</div><div className="stxt">{s}</div></div>)}</div>}
                  </>}
                </div>
              </div>;
            })}
            {(result.sauces||[]).length>0&&<div className="sblk">
              <div className="sbhdr"><span className="sbttl">✦ 今日のソース</span></div>
              {result.sauces.map((s,i)=>{
                const sid='sauce'+i; const isFav=favSauces.some(f=>f.name===s.name);
                return <div key={i} className="si">
                  <div className="sirow">
                    <div><div className="sn">{s.name}</div><div className="scat">{s.category}</div></div>
                    <button className="fb" onClick={()=>toggleFavSauce(s)}>{isFav?'❤️':'🤍'}</button>
                  </div>
                  <p className="sdsc">{s.desc}</p>
                  <div className="chips">{(s.ingredients||[]).map((x,j)=><span key={j} className="chip chip-s">{x}</span>)}</div>
                  {(s.steps||[]).length>0&&<>
                    <button className="rtog" onClick={()=>togSteps(sid)} style={{borderColor:'var(--sage)',color:'var(--sage)'}}>{openSteps[sid]?'▲ 閉じる':'📋 作り方'}</button>
                    {openSteps[sid]&&<div className="rsteps">{s.steps.map((st,j)=><div key={j} className="step"><div className="snum">{j+1}</div><div className="stxt">{st}</div></div>)}</div>}
                  </>}
                </div>;
              })}
            </div>}
            {result.tip&&<div className="tip"><div className="tip-l">✦ Chef's Note</div><p className="tip-t">{result.tip}</p></div>}
            <button className="dbtn" onClick={deduct}>🗑 使った食材を冷蔵庫から差し引く</button>
            <button className="rtry" onClick={generate}>✦ 別の献立を提案してもらう</button>
          </div>
        </>}
      </div>}

      {/* FAVS TAB */}
      {tab==='favs' && <div className="fwrap">
        <div className="fttl">✦ お気に入りの献立</div>
        {favMeals.length ? favMeals.map(m=><div key={m.id} className="fcard">
          <div className="fi"><div className="fn">{m.name}</div><div className="fsub">{m.type}</div><div className="fdsc">{m.desc}</div></div>
          <button className="dbtn2" onClick={()=>saveFavMeals(favMeals.filter(f=>f.id!==m.id))}>✕</button>
        </div>) : <div className="empty"><div className="ei">🤍</div><p>献立の🤍を押して保存</p></div>}
        <div className="divider"/>
        <div className="fttl">✦ お気に入りのソース</div>
        {favSauces.length ? favSauces.map(s=><div key={s.id} className="fcard">
          <div className="fi"><div className="fn">{s.name}</div><div className="fsub" style={{fontStyle:'italic'}}>{s.category}</div><div className="fdsc">{s.desc}</div></div>
          <button className="dbtn2" onClick={()=>saveFavSauces(favSauces.filter(f=>f.id!==s.id))}>✕</button>
        </div>) : <div className="empty"><div className="ei">🫙</div><p>ソースの🤍を押して保存</p></div>}
      </div>}
    </>
  );
}
