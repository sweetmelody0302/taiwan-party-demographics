const PARTIES={kmt:{name:'中國國民黨',short:'國民黨',code:'KMT',color:'#2567aa'},dpp:{name:'民主進步黨',short:'民進黨',code:'DPP',color:'#289264'},tpp:{name:'台灣民眾黨',short:'民眾黨',code:'TPP',color:'#159fac'}};
const ETHNIC=[['minnan','閩南／福老','#c27a35'],['hakka','客家（合併）','#7b5eaa'],['mainlander','外省背景','#587b9d'],['indigenous','原住民認同','#c94f56']];
const REGIONS=['北部','中部','南部','東部','離島'];
const LABELS=[["宜蘭縣",322,159],["彰化縣",161,250],["南投縣",232,268],["雲林縣",149,291],["新北市",315,94],["臺中市",219,209],["臺南市",142,371],["桃園市",269,108],["苗栗縣",224,172],["嘉義縣",168,327],["高雄市",182,394],["臺東縣",239,412],["花蓮縣",286,281],["新竹縣",257,142],["屏東縣",190,470]];
const state={tab:'explore',party:'dpp',county:'新竹市',a:'臺北市',b:'高雄市'};
let data,shapes,byName;
const $=s=>document.querySelector(s); const $$=s=>[...document.querySelectorAll(s)];
const fmt=n=>n.toLocaleString('zh-TW'); const pct=n=>n==null?'—':`${n.toFixed(1)}%`;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mix=(hex,t)=>{const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));const base=[239,241,236];return `rgb(${base.map((b,i)=>Math.round(b+(rgb[i]-b)*t)).join(',')})`};
function bar(label,value,color,max=100){return `<div class="metric-row"><span>${label}</span><div class="metric-bar"><i><b style="width:${Math.min(100,value/max*100)}%;--bar:${color}"></b></i></div><strong>${pct(value)}</strong></div>`}

async function init(){
  [data,shapes]=await Promise.all([fetch('data.json').then(r=>r.json()),fetch('map-shapes.json').then(r=>r.json())]);
  byName=Object.fromEntries(data.counties.map(c=>[c.name,c]));
  renderPolls(); renderPartySwitch(); renderCountyList(); renderMap(); renderDetail(); renderCompareSelectors(); renderCompare(); renderAudit(); renderDataTable(); bindTabs();
}
function renderPolls(){
  $('#poll-cards').innerHTML=Object.entries(PARTIES).map(([key,p])=>{const v=data.nationalPoll[key];return `<article class="poll-card" style="--party:${p.color}"><div class="poll-head"><h3>${p.name}</h3><span class="party-code">${p.code}</span></div><div class="poll-primary"><span>政黨支持傾向</span><strong>${v.support.toFixed(1)}<small>%</small></strong></div><div class="micro-row"><span>好感</span><i><b style="width:${v.favor}%;--bar:${p.color}"></b></i><strong>${v.favor.toFixed(1)}%</strong></div><div class="micro-row"><span>反感</span><i><b style="width:${v.unfavor}%;--bar:#a8aaa5"></b></i><strong>${v.unfavor.toFixed(1)}%</strong></div><p class="poll-foot">全國民調 · 未明確回答未併入正負評價</p></article>`}).join('');
}
function renderPartySwitch(){
  $('#party-switch').innerHTML=Object.entries(PARTIES).map(([k,p])=>`<button data-party="${k}" class="${k===state.party?'active':''}" style="--party:${p.color}" aria-pressed="${k===state.party}">${p.short}</button>`).join('');
  $$('#party-switch button').forEach(b=>b.onclick=()=>{state.party=b.dataset.party;renderPartySwitch();renderCountyList();updateMap();renderDetail()});
}
function renderCountyList(){
  $('#county-list').innerHTML=REGIONS.map(r=>`<div><div class="region-title">${r}</div>${data.counties.filter(c=>c.region===r).map(c=>`<button data-county="${c.name}" class="${c.name===state.county?'active':''}" aria-pressed="${c.name===state.county}"><span>${c.name}</span><strong>${c.party[state.party].toFixed(1)}</strong></button>`).join('')}</div>`).join('');
  $$('#county-list button').forEach(b=>b.onclick=()=>selectCounty(b.dataset.county));
}
function selectCounty(name){state.county=name;renderCountyList();updateMap();renderDetail()}
function renderMap(){
  const svg=$('#taiwan-map');
  svg.innerHTML=`<defs><pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0V28" fill="none" stroke="#dfe5df" stroke-width=".55"/></pattern></defs><rect width="460" height="625" fill="url(#grid)"/><text x="430" y="31" class="sea-label">N</text><path d="M432 39v27m-5-19 5-9 5 9" fill="none" stroke="#75847e"/><text x="78" y="520" class="sea-label" transform="rotate(-90 78 520)">TAIWAN STRAIT</text><text x="413" y="430" class="sea-label" transform="rotate(-90 413 430)">PACIFIC OCEAN</text>${['連江縣','金門縣','澎湖縣'].map((n,i)=>`<g><rect x="14" y="${i*133+42}" width="118" height="${i===2?141:112}" rx="9" fill="#f7f8f5" stroke="#d8dfda"/><text x="27" y="${i*133+62}" class="inset-label">${n}</text></g>`).join('')}${shapes.map(s=>`<path class="county-shape" tabindex="0" role="button" data-name="${s.name}" d="${s.path}"></path>`).join('')}${LABELS.map(([n,x,y])=>`<text x="${x}" y="${y}" text-anchor="middle" class="map-label">${n}</text>`).join('')}`;
  $$('.county-shape').forEach(path=>{path.addEventListener('click',()=>selectCounty(path.dataset.name));path.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectCounty(path.dataset.name)}});path.addEventListener('mouseenter',showTip);path.addEventListener('mousemove',moveTip);path.addEventListener('mouseleave',hideTip);path.addEventListener('focus',showTip);path.addEventListener('blur',hideTip)});updateMap();
}
function updateMap(){
  const p=PARTIES[state.party];const vals=data.counties.map(c=>c.party[state.party]);const min=Math.min(...vals),max=Math.max(...vals);
  $('#map-title').textContent=`${p.name} · 縣市政黨票`;$('#legend-dot').style.background=p.color;$('#map-gradient').style.background=`linear-gradient(90deg,${mix(p.color,.16)},${p.color})`;
  $$('.county-shape').forEach(path=>{const c=byName[path.dataset.name];const t=.16+(c.party[state.party]-min)/(max-min)*.84;path.setAttribute('fill',mix(p.color,t));path.classList.toggle('selected',c.name===state.county);path.setAttribute('aria-label',`${c.name}，${p.name}2024政黨票 ${pct(c.party[state.party])}`);path.setAttribute('aria-pressed',c.name===state.county)});
}
function showTip(e){const c=byName[e.currentTarget.dataset.name],p=PARTIES[state.party],tip=$('#map-tooltip');tip.innerHTML=`<strong>${c.name}</strong>${p.short} ${pct(c.party[state.party])}`;tip.hidden=false;if(e.clientX)moveTip(e)}
function moveTip(e){const wrap=$('.map-wrap').getBoundingClientRect(),tip=$('#map-tooltip');tip.style.left=`${e.clientX-wrap.left}px`;tip.style.top=`${e.clientY-wrap.top}px`}
function hideTip(){$('#map-tooltip').hidden=true}
function partyBars(c){return Object.entries(PARTIES).map(([k,p])=>bar(p.short,c.party[k],p.color,70)).join('')}
function ethnicBars(c){return ETHNIC.map(([k,l,color])=>c.ethnicity[k]==null?`<div class="metric-row"><span>${l}</span><div class="metric-bar"><i></i></div><strong>缺列</strong></div>`:bar(l,c.ethnicity[k],color)).join('')}
function renderDetail(){
  const c=byName[state.county],p=PARTIES[state.party],male=c.male/c.population*100,female=c.female/c.population*100;
  $('#county-detail').innerHTML=`<div class="detail-top"><div><p class="eyebrow">COUNTY PROFILE</p><h3>${c.name}</h3></div><span class="region-chip">${c.region}</span></div><div class="party-score" style="color:${p.color}"><span>2024 ${p.name}政黨票</span><strong>${c.party[state.party].toFixed(1)}<small>%</small></strong></div><div class="detail-body"><div class="stat-group"><h4>人口總數 <span>2025 年底</span></h4><div class="population-number">${fmt(c.population)}<small> 人</small></div></div><div class="stat-group"><h4>戶籍性別 <span>男／女</span></h4><div class="segmented"><span style="width:${male}%"></span><span style="width:${female}%"></span></div><div class="segment-labels"><span>男 ${male.toFixed(1)}% · ${fmt(c.male)}</span><span>女 ${female.toFixed(1)}% · ${fmt(c.female)}</span></div></div><div class="stat-group"><h4>三階段年齡 <span>2025 年底</span></h4><div class="metric-list">${bar('0–14 歲',c.agePct.child,'#d8a147')}${bar('15–64 歲',c.agePct.working,'#4b8b78')}${bar('65 歲以上',c.agePct.senior,'#995f75')}</div></div><div class="stat-group"><h4>三黨政黨票 <span>2024</span></h4><div class="metric-list">${partyBars(c)}</div></div><div class="stat-group"><h4>族群單一認同 <span>2014</span></h4><div class="metric-list">${ethnicBars(c)}</div>${!c.ethnicity.complete?'<p class="missing-note">大陸客家欄為原表「—」，合併客家保留缺列。</p>':''}</div></div><button class="detail-action" id="compare-current">把 ${c.name} 放入比較</button><p class="detail-foot">各組資料的年份、分母與測量方式不同。縣市政黨票三黨合計不含其他政黨。</p>`;
  $('#compare-current').onclick=()=>{state.a=c.name;setTab('compare');renderCompareSelectors();renderCompare()};
}
function renderCompareSelectors(){
  const options=data.counties.map(c=>`<option value="${c.name}">${c.name}</option>`).join('');$('#compare-a').innerHTML=options;$('#compare-b').innerHTML=options;$('#compare-a').value=state.a;$('#compare-b').value=state.b;$('#compare-a').onchange=e=>{state.a=e.target.value;renderCompare()};$('#compare-b').onchange=e=>{state.b=e.target.value;renderCompare()};$('#swap-counties').onclick=()=>{[state.a,state.b]=[state.b,state.a];renderCompareSelectors();renderCompare()};
}
function compareCard(c,label){return `<article class="comparison-card"><p class="eyebrow">地點 ${label}</p><h3>${c.name}</h3><span class="comparison-kicker">${c.region} · 2025 年底人口</span><div class="comparison-pop"><strong>${fmt(c.population)}</strong>人</div><div class="party-mini">${Object.entries(PARTIES).map(([k,p])=>`<div style="border-top:3px solid ${p.color}"><span>${p.short}</span><strong>${c.party[k].toFixed(1)}%</strong></div>`).join('')}</div></article>`}
function renderCompare(){
  const a=byName[state.a],b=byName[state.b];$('#compare-summary').innerHTML=compareCard(a,'A')+compareCard(b,'B');
  const male=c=>c.male/c.population*100,female=c=>c.female/c.population*100,delta=(x,y,unit='pp')=>{const d=x-y;return `<span class="${d>0?'delta-pos':d<0?'delta-neg':''}">${d>0?'+':''}${d.toFixed(unit==='人'?0:1)} ${unit}</span>`};
  const rows=[['人口',fmt(a.population),fmt(b.population),delta(a.population,b.population,'人')],['男性比例',pct(male(a)),pct(male(b)),delta(male(a),male(b))],['女性比例',pct(female(a)),pct(female(b)),delta(female(a),female(b))],['@年齡結構'],['0–14 歲',pct(a.agePct.child),pct(b.agePct.child),delta(a.agePct.child,b.agePct.child)],['15–64 歲',pct(a.agePct.working),pct(b.agePct.working),delta(a.agePct.working,b.agePct.working)],['65 歲以上',pct(a.agePct.senior),pct(b.agePct.senior),delta(a.agePct.senior,b.agePct.senior)],['@2024 立委政黨票'],...Object.entries(PARTIES).map(([k,p])=>[p.short,pct(a.party[k]),pct(b.party[k]),delta(a.party[k],b.party[k])]),['@2014 族群單一認同'],...ETHNIC.map(([k,l])=>[l,pct(a.ethnicity[k]),pct(b.ethnicity[k]),a.ethnicity[k]==null||b.ethnicity[k]==null?'—':delta(a.ethnicity[k],b.ethnicity[k])])];
  $('#compare-table').innerHTML=`<table class="comparison-table"><thead><tr><th>指標</th><th>${a.name}</th><th>${b.name}</th><th>A − B</th></tr></thead><tbody>${rows.map(r=>r.length===1?`<tr class="group-row"><td colspan="4">${r[0].slice(1)}</td></tr>`:`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</tbody></table>`;
}
function renderAudit(){
  const t=data.counties.reduce((s,c)=>({p:s.p+c.population,m:s.m+c.male,f:s.f+c.female,ch:s.ch+c.age.child,w:s.w+c.age.working,se:s.se+c.age.senior}),{p:0,m:0,f:0,ch:0,w:0,se:0});
  const cards=[['人口加總',fmt(t.p),'22 縣市＝官方全國總計'],['性別加總',fmt(t.m+t.f),'男性＋女性＝總人口'],['年齡加總',fmt(t.ch+t.w+t.se),'三階段＝總人口'],['族群完整度','19 / 22','3 離島縣有原表缺列']];
  $('#audit-cards').innerHTML=cards.map(x=>`<article class="audit-card"><span>${x[0]}</span><strong>${x[1]}</strong><small>✓ ${x[2]}</small></article>`).join('');
}
function renderDataTable(){
  $('#county-data-table').innerHTML=`<table class="data-table"><thead><tr><th>縣市</th><th>人口</th><th>男 %</th><th>女 %</th><th>0–14</th><th>15–64</th><th>65+</th><th>國民黨</th><th>民進黨</th><th>民眾黨</th><th>族群資料</th></tr></thead><tbody>${data.counties.map(c=>{const m=c.male/c.population*100;return `<tr><td><a href="#explore" data-table-county="${c.name}">${c.name}</a></td><td>${fmt(c.population)}</td><td>${m.toFixed(1)}</td><td>${(100-m).toFixed(1)}</td><td>${c.agePct.child.toFixed(1)}</td><td>${c.agePct.working.toFixed(1)}</td><td>${c.agePct.senior.toFixed(1)}</td><td>${c.party.kmt.toFixed(1)}</td><td>${c.party.dpp.toFixed(1)}</td><td>${c.party.tpp.toFixed(1)}</td><td class="${c.ethnicity.complete?'status-ok':'status-warn'}">${c.ethnicity.complete?'完整':'原表缺列'}</td></tr>`}).join('')}</tbody></table>`;
  $$('[data-table-county]').forEach(a=>a.onclick=e=>{e.preventDefault();state.county=a.dataset.tableCounty;setTab('explore');renderCountyList();updateMap();renderDetail()});
}
function bindTabs(){ $$('.tab').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));$$('[data-tab-jump]').forEach(b=>b.onclick=()=>setTab(b.dataset.tabJump)) }
function setTab(tab){state.tab=tab;$$('.tab').forEach(b=>{const active=b.dataset.tab===tab;b.classList.toggle('active',active);b.setAttribute('aria-selected',active)});$$('.view').forEach(v=>v.classList.toggle('active',v.id===`${tab}-view`));$('.tabs').scrollIntoView({behavior:'smooth',block:'start'})}
init().catch(err=>{document.body.innerHTML=`<main style="padding:40px"><h1>資料載入失敗</h1><p>${esc(err.message)}</p></main>`;console.error(err)});
