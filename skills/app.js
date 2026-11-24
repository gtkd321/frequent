(function(){
'use strict';
const KEY='frequent-skilltree-v1';
let mem=null;
function load(){try{const r=localStorage.getItem(KEY);if(r)return JSON.parse(r)}catch(e){}return mem||{entries:[],think:[],feelings:[],inventory:[],stars:{},focusTarget:10}}
function save(){mem=S;try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
let S=load();
['entries','think','feelings','inventory'].forEach(k=>{if(!Array.isArray(S[k]))S[k]=[]});
if(!S.stars)S.stars={};if(!S.focusTarget)S.focusTarget=10;

const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const fmtDate=d=>{const [y,m,dd]=d.split('-').map(Number);return new Date(y,m-1,dd).toLocaleDateString(undefined,{month:'short',day:'numeric'})};

const SKILL={},BRANCH_OF={};
BRANCHES.forEach(b=>b.skills.forEach(([id,name])=>{SKILL[id]={id,name,branch:b};BRANCH_OF[id]=b.id}));
const PRACTICE_BRANCHES=new Set(['mind','psych','spirit','fitness','music','home','fiction','life']);
const allFeelings=[];WHEEL.forEach((s,si)=>{s.inner.forEach(f=>allFeelings.push({f,core:s.core,si,ring:'inner'}));s.outer.forEach(f=>allFeelings.push({f,core:s.core,si,ring:'outer'}))});

function pts(e){const base=(MODES[e.mode]||{pts:1}).pts;return e.points!=null?e.points:base+Math.max(0,(e.diff||2)-2)}
function allEntries(){return HISTORY.map((e,i)=>Object.assign({id:'h'+i},e)).concat(S.entries)}
function skillPoints(){const p={},gate={};allEntries().forEach(e=>{[e.skill,e.skill2].forEach(s=>{if(!s||!SKILL[s])return;p[s]=(p[s]||0)+pts(e);if(e.mode==='handson'||e.mode==='tested')gate[s]=true})});return{p,gate}}
function levelOf(points,gated){let L=0;LEVELS.forEach((l,i)=>{if(points>=l.min)L=i});if(gated&&L>3)L=3;return L}
function total(){return allEntries().reduce((a,e)=>a+pts(e)+(e.skill2?pts(e):0),0)}
function weekPts(){const d=new Date();d.setDate(d.getDate()-6);const c=d.toISOString().slice(0,10);return allEntries().filter(e=>e.date>=c).reduce((a,e)=>a+pts(e)+(e.skill2?pts(e):0),0)}
function addEntry(e){e.id='u'+Date.now()+Math.random().toString(36).slice(2,6);e.date=e.date||today();S.entries.push(e);save();renderHeader()}
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2600)}
function lampLevel(){const t=total();const stages=[[0,'Seed'],[50,'Sapling'],[150,'Tree'],[300,'Ripening olives'],[500,'Oil bottle'],[800,'Lamp']];let n='Seed';stages.forEach(([m,s])=>{if(t>=m)n=s});return n}
function renderHeader(){$('#phoraTotal').innerHTML=`<b>${total()} φόρα</b>${lampLevel()}`}

/* ---------- tabs ---------- */
let tab='today',logFilter='all',logSort='new';
document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.tab;document.querySelectorAll('.tabs button').forEach(x=>x.setAttribute('aria-selected',x===b));render();window.scrollTo({top:0})}));
function render(){const v=$('#view');v.innerHTML=({today:viewToday,write:viewWrite,sell:viewSell,life:viewLife,tree:viewTree,log:viewLog,pivots:viewPivots})[tab]();bindView()}

/* ---------- today ---------- */
function dayOfYear(){const n=new Date();return Math.floor((n-new Date(n.getFullYear(),0,0))/864e5)}
function ladderToday(){return LADDER[(dayOfYear()-1)%30]}
function viewToday(){
  const h=new Date().getHours();
  const P={think:{t:'Think First',d:'Answer a hard question yourself before AI sees it. Then argue the other side.',btn:'Start a rep',fn:'think'},
    feel:{t:'Feeling Wheel',d:'Pick one of 72 feelings and stay with it for a few minutes.',btn:'Open the wheel',fn:'feel'},
    inv:{t:'Daily inventory',d:'Speak or type tonight’s examination. Tag passions, virtues and feelings.',btn:'Begin inventory',fn:'inv'}};
  const next=h<12?'think':h<18?'feel':'inv';
  const others=Object.keys(P).filter(k=>k!==next);
  const L=ladderToday();
  const doneToday={think:S.think.some(t=>t.date===today()),feel:S.feelings.some(t=>t.date===today()),inv:S.inventory.some(t=>t.date===today())};
  const touched=new Set(S.feelings.map(f=>f.feeling)).size;
  return `<h1 class="section-title">${new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'})}</h1>
  <p class="lede">One rep at a time. Every rep earns φόρα and grows a branch of your tree.</p>
  <article class="card up-next"><span class="eyebrow">Up next${doneToday[next]?' · done today':''}</span><h3>${P[next].t}</h3><p class="muted">${P[next].d}</p><div class="row" style="margin-top:var(--space-4)"><button class="btn" data-open="${P[next].fn}">${P[next].btn}</button></div></article>
  <div class="stats"><div class="stat"><b>${weekPts()}</b><span>φόρα this week</span></div><div class="stat"><b>${touched}/72</b><span>feelings touched</span></div><div class="stat"><b>${S.inventory.length}</b><span>inventories</span></div></div>
  ${warmCard()}
  <div class="practice-row">${hallMini()}${startMini()}${distillMini()}${unMini()}${moneyMini()}${shopMini()}${jobMini()}${moveMini()}${treatMini()}${others.map(k=>`<button class="mini" data-open="${P[k].fn}"><span class="eyebrow">${doneToday[k]?'Done today':'Also today'}</span><h4>${P[k].t}</h4><p>${P[k].d}</p></button>`).join('')}
  ${(()=>{const sc=S.chars&&S.chars.length?staleChar():null;return `<button class="mini" data-gotab="write"><span class="eyebrow">Fiction</span><h4>${sc?'How is '+esc(sc.name)+' doing?':'Back to your story'}</h4><p>${sc?'A two-question check-in with your character.':'Add your first character and log a session.'}</p></button>`})()}
  ${(()=>{lifeInit();const d=S.promises.filter(p=>p.kind==='daily');const k=d.filter(p=>((p.log||{})[today()]||0)>=p.clips).length;return `<button class="mini" data-gotab="life"><span class="eyebrow">Life · ${d.length?k+' of '+d.length+' promises kept':'promises to self'}</span><h4>${S.clip.goal?'Trade up: '+esc(clipNow()):'The paper clip game'}</h4><p>${S.clip.goal?'Offer it to someone today.':'Trade one red paper clip up, one person at a time.'}</p></button>`})()}
  ${(()=>{const c=cardOfDay();const n=Object.keys(cardState()).length;return `<button class="mini card-mini" data-open="card">${cardIcon(c.m,44)}<span class="eyebrow">Index cards · ${c.done?'done today':n+' of '+CARD_METHODS.length+' tried'}</span><h4>${c.done?'Tomorrow: next method':esc(c.m.name)}</h4><p>${c.done?'You tried '+esc(c.m.name)+'. Tap to add notes.':esc(c.m.tag)}</p></button>`})()}
  <button class="mini" data-open="read"><span class="eyebrow">Optional</span><h4>Deep read</h4><p>Log one Hacker News thread: the problem, their approach, one idea to borrow.</p></button></div>
  <article class="card ladder-card" style="margin-top:var(--space-5)"><span class="eyebrow">The Ladder · Step ${L[0]} of 30</span><h3 style="font-family:var(--font-display);font-size:var(--text-lg);margin:var(--space-2) 0">${esc(L[1])}</h3><p>${esc(L[2])}</p><p class="note" style="margin-top:var(--space-2)">This question appears in tonight’s inventory.</p></article>
  <div class="row" style="margin-top:var(--space-3)"><button class="btn ghost small" data-open="shelf">All index-card methods</button></div>`;
}

/* ---------- tree ---------- */
function viewTree(){
  const {p,gate}=skillPoints();
  const fogM={};fogList().forEach(f=>fogM[f.b.id]=f.days);
  const order=BRANCHES.slice().sort((a,b)=>b.skills.reduce((s,[id])=>s+(p[id]||0),0)-a.skills.reduce((s,[id])=>s+(p[id]||0),0));
  return `<h1 class="section-title">Your skill tree</h1>
  <p class="lede">Levels follow Greekquent’s olive path: Seed, Sapling, Tree, Harvest, Lamp. Work skills stop at Tree until you log a hands-on rep, something you did yourself without AI, or a test with real people.</p>
  <div class="grid2">${order.map(b=>{
    const bp=b.skills.reduce((s,[id])=>s+(p[id]||0),0);
    return `<article class="card branch${fogM[b.id]!=null?' fogged':''}">${fogM[b.id]!=null?`<div class="fog"><span>The Nothing · ${fogM[b.id]} days</span><button class="btn small" data-nameit="${b.id}">Name it</button></div>`:''}<div class="branch-head"><h3>${esc(b.name)}</h3><span class="pts">${bp}</span></div>
    ${b.occ?`<a class="pay" href="${b.url}" target="_blank" rel="noopener">${esc(b.occ)}: ${b.pay} median (BLS)</a>`:'<span class="pay">Practice branch, measured by reps</span>'}
    <div class="nodes">${b.skills.map(([id,name])=>{
      const pt=p[id]||0;const gated=!PRACTICE_BRANCHES.has(b.id)&&!gate[id];const L=levelOf(pt,gated);
      const nxt=LEVELS[L+1];const cur=LEVELS[L];const pct=nxt?Math.min(100,Math.round((pt-cur.min)/(nxt.min-cur.min)*100)):100;
      const blocked=gated&&L===3&&pt>=LEVELS[4].min;
      return `<button class="node lv${L}" data-skill="${id}"><span class="node-top"><span>${esc(name)}</span><span class="lvl">${LEVELS[L].n}</span></span><span class="bar"><i style="width:${blocked?100:pct}%"></i></span><span class="xs muted">${pt} φόρα${nxt&&!blocked?` · ${nxt.min-pt} to ${nxt.n}`:''}</span>${(gated&&L>=2)?`<span class="gate">${blocked?'Ready for Harvest: log a hands-on rep to unlock':'Needs a hands-on rep to pass Tree'}</span>`:''}</button>`}).join('')}</div></article>`}).join('')}</div>`;
}
function openSkill(id){
  const s=SKILL[id];const list=allEntries().filter(e=>e.skill===id||e.skill2===id).sort((a,b)=>b.date.localeCompare(a.date));
  openSheet(s.name,`<p class="muted small">${esc(s.branch.name)}${s.branch.occ?` · <a href="${s.branch.url}" target="_blank" rel="noopener">${esc(s.branch.occ)} ${s.branch.pay}</a>`:''}</p>
  <div class="row"><button class="btn small" data-quick="${id}" data-mode="handson">Log a hands-on rep</button><button class="btn ghost small" data-quick="${id}" data-mode="asked">Log a question</button></div>
  <div>${list.length?list.map(entryRow).join(''):'<p class="empty">No evidence yet. Your first rep plants the seed.</p>'}</div>`);
}

/* ---------- log ---------- */
function frontier(e){const b=SKILL[e.skill]?SKILL[e.skill].branch:null;const pay=b&&b.payN?b.payN/40000:0;return (e.diff||2)*2+pay+(S.stars[e.id]?3:0)}
function entryRow(e){const s=SKILL[e.skill];const m=MODES[e.mode]||{label:e.mode};
  return `<div class="entry"><div><div class="entry-title">${esc(e.title)}</div><div class="entry-meta"><span>${fmtDate(e.date)}</span><span>${s?esc(s.name):''}</span><span class="badge ${e.mode==='handson'||e.mode==='tested'?'hands':''}">${esc(m.label)}</span>${e.diff?`<span class="dots" title="Difficulty ${e.diff} of 5">${'●'.repeat(e.diff)}${'○'.repeat(5-e.diff)}</span>`:''}</div></div>
  <div class="row" style="gap:var(--space-1)"><span class="pts">+${pts(e)}</span><button class="star" data-star="${e.id}" aria-pressed="${!!S.stars[e.id]}" aria-label="Mark as interesting">★</button></div></div>`}
function viewLog(){
  let list=allEntries();if(logFilter!=='all')list=list.filter(e=>BRANCH_OF[e.skill]===logFilter||BRANCH_OF[e.skill2]===logFilter);
  list.sort(logSort==='new'?(a,b)=>b.date.localeCompare(a.date):(a,b)=>frontier(b)-frontier(a));
  const used=BRANCHES.filter(b=>allEntries().some(e=>BRANCH_OF[e.skill]===b.id));
  return `<h1 class="section-title">Log</h1>
  <p class="lede">Every question, build and edit from your Frequent work, sorted into skills. “Frontier” ranks by difficulty, the pay of the nearest career, and your stars.</p>
  <details class="add card"><summary>+ Add an entry</summary><form class="form" id="addForm">
    <label class="f">What did you do or ask?<input type="text" name="title" required maxlength="160"></label>
    <label class="f">Skill<select name="skill">${BRANCHES.map(b=>`<optgroup label="${esc(b.name)}">${b.skills.map(([id,n])=>`<option value="${id}">${esc(n)}</option>`).join('')}</optgroup>`).join('')}</select></label>
    <label class="f">How<select name="mode"><option value="asked">Asked a question (+1)</option><option value="directed">Directed AI to build (+2)</option><option value="shipped">Shipped (+4)</option><option value="handson">Hands-on, I did it myself (+5)</option><option value="tested">Tested with real people (+6)</option></select></label>
    <label class="f">Difficulty <input type="range" name="diff" min="1" max="5" value="3"></label>
    <button class="btn" type="submit">Save entry</button></form></details>
  <div class="row" style="justify-content:space-between;margin-bottom:var(--space-3)"><div class="seg" role="group" aria-label="Sort"><button data-sort="new" aria-pressed="${logSort==='new'}">Newest</button><button data-sort="frontier" aria-pressed="${logSort==='frontier'}">Frontier</button></div><span class="xs muted">${list.length} entries</span></div>
  <div class="filters"><button class="chip" data-filter="all" aria-pressed="${logFilter==='all'}">All</button>${used.map(b=>`<button class="chip" data-filter="${b.id}" aria-pressed="${logFilter===b.id}">${esc(b.name)}</button>`).join('')}</div>
  <div class="card">${list.length?list.map(entryRow).join(''):'<p class="empty">Nothing here yet.</p>'}</div>
  <div class="row" style="margin-top:var(--space-5)"><button class="btn ghost small" id="exportBtn">Save backup</button><label class="btn ghost small" style="cursor:pointer">Restore backup<input type="file" id="importFile" accept="application/json" hidden></label></div>
  <p class="note" style="margin-top:var(--space-2)">Everything stays on this device. Use Save backup to move it to another phone or browser.</p>`;
}

/* ---------- pivots ---------- */
function viewPivots(){
  const {p,gate}=skillPoints();
  return `<h1 class="section-title">Pivot points</h1>
  <p class="lede">Careers your evidence already points toward, ordered by how close you are. Pay figures are U.S. medians from the Bureau of Labor Statistics.</p>
  <div class="grid2">${PIVOTS.map(v=>{const sc=v.skills.reduce((a,s)=>a+(p[s]||0),0);
  return `<article class="card pivot"><span class="eyebrow">${sc} φόρα of evidence</span><h3 style="margin-top:var(--space-1)">${esc(v.title)}</h3><a class="pay" href="${v.url}" target="_blank" rel="noopener">${esc(v.occ)}: ${v.pay} (BLS)</a>
  <dl><dt>Why it fits</dt><dd>${esc(v.why)}</dd><dt>The gap</dt><dd>${esc(v.gap)}</dd><dt>First move</dt><dd>${esc(v.move)}</dd></dl>
  <div class="row" style="margin-top:var(--space-4)"><button class="btn small" data-quick="${v.skills[0]}" data-mode="handson" data-title="${esc(v.move)}">I did the first move</button></div></article>`}).join('')}</div>
  <p class="note" style="margin-top:var(--space-5)">The psychology and coaching branch maps to <a href="https://www.bls.gov/ooh/community-and-social-service/substance-abuse-behavioral-disorder-and-mental-health-counselors.htm" target="_blank" rel="noopener">counselors at $59,350 median</a>, which typically requires a master’s degree. Life coaching has no BLS category.</p>`;
}

/* ---------- sheet ---------- */
let sheetCleanup=null;
function openSheet(title,html){$('#sheetTitle').textContent=title;$('#sheetBody').innerHTML=html;$('#sheetBody').scrollTop=0;$('#sheetWrap').hidden=false;document.body.style.overflow='hidden';bindSheet();setTimeout(()=>{const f=$('#sheetBody').querySelector('textarea,input,button');f&&f.focus()},50)}
function closeSheet(){if(typeof stStop==='function')stStop();if(sheetCleanup){sheetCleanup();sheetCleanup=null}$('#sheetWrap').hidden=true;document.body.style.overflow='';render()}
document.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click',closeSheet));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#sheetWrap').hidden)closeSheet()});
function bindSheet(){const b=$('#sheetBody');b.querySelectorAll('[data-quick]').forEach(x=>x.addEventListener('click',()=>quickLog(x.dataset.quick,x.dataset.mode,x.dataset.title)));b.querySelectorAll('[data-star]').forEach(bindStar)}
function quickLog(skill,mode,title){
  openSheet(mode==='handson'?'Log a hands-on rep':'Log an entry',`<form class="form" id="qForm"><label class="f">What did you do?<input type="text" name="title" value="${esc(title||'')}" required maxlength="160"></label>
  <label class="f">Difficulty <input type="range" name="diff" min="1" max="5" value="3"></label><p class="note">${esc(SKILL[skill].name)} · ${esc(MODES[mode].label)}</p><button class="btn" type="submit">Save</button></form>`);
  $('#qForm').addEventListener('submit',ev=>{ev.preventDefault();const f=new FormData(ev.target);const e={title:f.get('title'),skill,mode,diff:+f.get('diff')};addEntry(e);toast(`+${pts(e)} φόρα`);closeSheet()});
}
function bindStar(x){x.addEventListener('click',()=>{const id=x.dataset.star;S.stars[id]=!S.stars[id];if(!S.stars[id])delete S.stars[id];save();x.setAttribute('aria-pressed',!!S.stars[id])})}

/* ---------- speech ---------- */
function speechInto(btn,ta){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){btn.disabled=true;btn.title='Speech input is not available in this browser. Use the microphone on your keyboard instead.';const n=btn.parentElement.querySelector('.mic-note');if(n)n.textContent='Tip: tap the microphone on your phone keyboard to dictate.';return()=>{}}
  let rec=null,on=false,base='';
  btn.addEventListener('click',()=>{
    if(on){rec&&rec.stop();return}
    rec=new SR();rec.lang='en-US';rec.continuous=true;rec.interimResults=true;base=ta.value?ta.value.trim()+' ':'';
    rec.onresult=ev=>{let fin='',int='';for(let i=0;i<ev.results.length;i++){const r=ev.results[i];if(r.isFinal)fin+=r[0].transcript;else int+=r[0].transcript}ta.value=base+fin+int;ta.dispatchEvent(new Event('input'))};
    rec.onend=()=>{on=false;btn.classList.remove('on');btn.setAttribute('aria-pressed','false')};
    rec.onerror=()=>{on=false;btn.classList.remove('on');toast('Speech stopped. You can keep typing.')};
    try{rec.start();on=true;btn.classList.add('on');btn.setAttribute('aria-pressed','true')}catch(e){toast('Could not start the microphone.')}
  });
  return()=>{try{rec&&rec.stop()}catch(e){}};
}
const MIC=`<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;

/* ---------- think first ---------- */
function openThink(){
  const sugg=allEntries().filter(e=>e.mode==='asked').sort((a,b)=>frontier(b)-frontier(a)).slice(0,4);
  const st={step:0,q:'',skill:'mind_dialectic',answer:'',conf:3,counter:'',change:'',outcome:'',added:'',secs:0};
  let iv=null;
  const steps=['Question','Your answer','Other side','Spar with AI','What changed'];
  function draw(){
    const bar=`<div class="steps">${steps.map((_,i)=>`<i class="${i<=st.step?'on':''}"></i>`).join('')}</div><span class="eyebrow">Step ${st.step+1} of 5 · ${steps[st.step]}</span>`;
    let h='';
    if(st.step===0)h=`<label class="f">What question are you working on?<textarea id="tq" style="min-height:80px" placeholder="Something you'd normally just ask AI">${esc(st.q)}</textarea></label>
      ${sugg.length?`<div><p class="xs muted" style="margin-bottom:var(--space-2)">Or revisit a frontier question from your log:</p><div class="seg">${sugg.map(s=>`<button type="button" data-sq="${esc(s.title)}" data-ss="${s.skill}">${esc(s.title)}</button>`).join('')}</div></div>`:''}
      <label class="f">Which skill does it grow?<select id="tskill">${BRANCHES.map(b=>`<optgroup label="${esc(b.name)}">${b.skills.map(([id,n])=>`<option value="${id}" ${id===st.skill?'selected':''}>${esc(n)}</option>`).join('')}</optgroup>`).join('')}</select></label>
      <button class="btn" id="tnext">Next: answer it yourself</button>`;
    if(st.step===1)h=`<p class="small"><b>${esc(st.q)}</b></p><div class="row" style="justify-content:space-between"><span class="timer" id="ttime">0:00</span><span class="xs muted">Focus goal: ${S.focusTarget} min. No AI yet.</span></div>
      <label class="f">Your best answer, in your own words<textarea id="ta" placeholder="Reason it out. Rough is fine.">${esc(st.answer)}</textarea></label>
      <div class="row"><button class="mic" id="tmic" type="button" aria-label="Dictate" aria-pressed="false">${MIC}</button><span class="xs muted mic-note" id="twc">0 words</span></div>
      <label class="f">How confident are you? <span id="tconfv">${st.conf} of 5</span><input type="range" id="tconf" min="1" max="5" value="${st.conf}"></label>
      <button class="btn" id="tnext">Next: argue the other side</button>`;
    if(st.step===2)h=`<label class="f">The strongest case against your answer<textarea id="tc" placeholder="Steelman it. Make the other side sound smart.">${esc(st.counter)}</textarea></label>
      <label class="f">What evidence would change your mind?<textarea id="tch" style="min-height:80px">${esc(st.change)}</textarea></label>
      <button class="btn" id="tnext">Next: spar with AI</button>`;
    if(st.step===3){const pr=`I'm training my own thinking, so please don't give me your answer yet.\n\nQuestion: ${st.q}\n\nMy answer (confidence ${st.conf}/5): ${st.answer}\n\nStrongest counterargument I found: ${st.counter}\n\nWhat would change my mind: ${st.change}\n\nPlease:\n1. Name the weakest assumption in my answer.\n2. Ask me one question about something I missed.\n3. Rate my counterargument 1–5 and say how to make it stronger.\n4. Only give your own view if I ask for it.`;
      h=`<p class="small">Copy this into your AI of choice. It asks for critique, not a replacement answer.</p><div class="prompt-box" id="tprompt">${esc(pr)}</div>
      <div class="row"><button class="btn" id="tcopy">Copy prompt</button><button class="btn ghost" id="tnext">I've sparred. Next</button></div>`;}
    if(st.step===4)h=`<p class="small">After the critique, where did you land?</p><div class="seg" id="tout">${['Kept','Refined','Reversed'].map(o=>`<button type="button" data-o="${o}" aria-pressed="${st.outcome===o}">${o}</button>`).join('')}</div>
      <label class="f">What did you miss that AI caught? Or what did you see that AI missed?<textarea id="tadd" style="min-height:80px">${esc(st.added)}</textarea></label>
      <button class="btn" id="tsave" ${st.outcome?'':'disabled'}>Finish rep</button>`;
    $('#sheetBody').innerHTML=bar+h;$('#sheetBody').scrollTop=0;wire();
  }
  function wire(){
    const b=$('#sheetBody');
    b.querySelectorAll('[data-sq]').forEach(x=>x.addEventListener('click',()=>{st.q=x.dataset.sq;st.skill=x.dataset.ss;draw()}));
    const n=$('#tnext');
    if(st.step===0){n.addEventListener('click',()=>{st.q=$('#tq').value.trim();st.skill=$('#tskill').value;if(!st.q){toast('Write the question first.');return}st.step=1;draw()})}
    if(st.step===1){const ta=$('#ta'),wc=$('#twc');const upd=()=>{st.answer=ta.value;const w=(ta.value.match(/\S+/g)||[]).length;wc.textContent=w+' words'};ta.addEventListener('input',upd);upd();
      const stop=speechInto($('#tmic'),ta);sheetCleanup=()=>{stop();clearInterval(iv)};
      $('#tconf').addEventListener('input',e=>{st.conf=+e.target.value;$('#tconfv').textContent=st.conf+' of 5'});
      clearInterval(iv);iv=setInterval(()=>{st.secs++;const t=$('#ttime');if(t){t.textContent=Math.floor(st.secs/60)+':'+String(st.secs%60).padStart(2,'0');if(st.secs===S.focusTarget*60)toast('Focus goal reached.')}},1000);
      n.addEventListener('click',()=>{if((st.answer.match(/\S+/g)||[]).length<15){toast('Write at least a few sentences first.');return}clearInterval(iv);stop();st.step=2;draw()})}
    if(st.step===2){n.addEventListener('click',()=>{st.counter=$('#tc').value.trim();st.change=$('#tch').value.trim();if(!st.counter){toast('Give the other side a real try.');return}st.step=3;draw()})}
    if(st.step===3){$('#tcopy').addEventListener('click',async()=>{const t=$('#tprompt').textContent;try{await navigator.clipboard.writeText(t);toast('Copied')}catch(e){const r=document.createRange();r.selectNodeContents($('#tprompt'));const s=getSelection();s.removeAllRanges();s.addRange(r);toast('Selected. Copy it from here.')}});n.addEventListener('click',()=>{st.step=4;draw()})}
    if(st.step===4){b.querySelectorAll('[data-o]').forEach(x=>x.addEventListener('click',()=>{st.outcome=x.dataset.o;st.added=$('#tadd').value;draw()}));
      $('#tsave').addEventListener('click',()=>{st.added=$('#tadd').value.trim();const words=(st.answer.match(/\S+/g)||[]).length;const focused=st.secs>=S.focusTarget*60;
        let p=3+(words>=80?1:0)+(focused?1:0);
        S.think.push({date:today(),q:st.q,skill:st.skill,conf:st.conf,outcome:st.outcome,words,secs:st.secs});
        if(focused)S.focusTarget=Math.min(30,S.focusTarget+1);
        addEntry({title:'Think First: '+st.q.slice(0,120),skill:'mind_dialectic',skill2:st.skill!=='mind_dialectic'?st.skill:undefined,mode:'think',diff:3,points:p});
        if(S.think.length%5===0)addEntry({title:'Calibration check: 5 Think First reps',skill:'mind_calib',mode:'practice',points:2});
        toast(`+${p} φόρα${focused?' · focus goal now '+S.focusTarget+' min':''}`);closeSheet()})}
  }
  openSheet('Think First','');draw();
}

/* ---------- deep read ---------- */
function openRead(){
  openSheet('Deep read',`<form class="form" id="rForm"><label class="f">Thread or article<input type="text" name="t" required maxlength="160" placeholder="Title or link"></label>
  <label class="f">The problem they faced<textarea name="p" style="min-height:70px" required></textarea></label>
  <label class="f">How they approached it<textarea name="a" style="min-height:70px" required></textarea></label>
  <label class="f">One idea to borrow<textarea name="s" style="min-height:70px" required></textarea></label>
  <button class="btn" type="submit">Save (+2 φόρα)</button></form>`);
  $('#rForm').addEventListener('submit',ev=>{ev.preventDefault();const f=new FormData(ev.target);addEntry({title:'Deep read: '+f.get('t'),skill:'mind_read',mode:'read',diff:2,note:{p:f.get('p'),a:f.get('a'),s:f.get('s')}});toast('+2 φόρα');closeSheet()});
}

/* ---------- feeling wheel ---------- */
function feelCounts(){const c={};S.feelings.forEach(f=>c[f.feeling]=(c[f.feeling]||0)+1);return c}
function arc(cx,cy,r0,r1,a0,a1){const p=(r,a)=>[cx+r*Math.cos(a),cy+r*Math.sin(a)];const [x0,y0]=p(r1,a0),[x1,y1]=p(r1,a1),[x2,y2]=p(r0,a1),[x3,y3]=p(r0,a0);const lg=(a1-a0)>Math.PI?1:0;return `M${x0},${y0}A${r1},${r1} 0 ${lg} 1 ${x1},${y1}L${x2},${y2}A${r0},${r0} 0 ${lg} 0 ${x3},${y3}Z`}
function wheelSVG(sel){
  const c=feelCounts();const cx=200,cy=200;const D=Math.PI/180;let out='';
  WHEEL.forEach((s,i)=>{const a0=(-90+i*60)*D,a1=(-90+(i+1)*60)*D;
    out+=`<path d="${arc(cx,cy,48,118,a0+.004,a1-.004)}" fill="${s.color}" opacity="${sel===i?1:.88}" data-sector="${i}" role="button" tabindex="0" aria-label="${s.core}"><title>${s.core}</title></path>`;
    const mid=(a0+a1)/2,tx=cx+83*Math.cos(mid),ty=cy+85*Math.sin(mid);
    out+=`<text x="${tx}" y="${ty+5}" text-anchor="middle" style="font-size:${s.core.length>6?12:15}px">${s.core.toUpperCase()}</text>`;
    [['inner',120,156],['outer',158,194]].forEach(([ring,r0,r1])=>{s[ring].forEach((f,j)=>{const b0=a0+j*10*D,b1=b0+10*D;const n=c[f]||0;
      out+=`<path d="${arc(cx,cy,r0,r1,b0+.006,b1-.006)}" fill="${s.color}" opacity="${n?Math.min(1,.45+n*.18):.14}" data-feel="${f}" role="button" tabindex="0" aria-label="${f}${n?', touched '+n+' times':''}"><title>${f}${n?' · '+n:''}</title></path>`})});
  });
  const touched=Object.keys(c).length;
  out+=`<text class="hub" x="${cx}" y="${cy+4}" text-anchor="middle">${touched}</text><text class="hub-sub" x="${cx}" y="${cy+22}" text-anchor="middle">of 72</text>`;
  return `<svg class="wheel" viewBox="0 0 400 400" role="img" aria-label="Feeling Wheel, ${touched} of 72 feelings touched">${out}</svg>`;
}
function openFeel(sel){
  sel=sel==null?0:sel;
  function draw(){const c=feelCounts();const s=WHEEL[sel];
    $('#sheetBody').innerHTML=`<div class="wheel-wrap"><div>${wheelSVG(sel)}<p class="note" style="text-align:center;margin-top:var(--space-2)">Tap a color to see its feelings. Rings fill in as you practice.</p></div>
    <div class="stack"><div><span class="eyebrow" style="color:${s.color}">${s.core}</span><p class="xs muted">Inner ring, then outer ring</p></div>
    <div class="feel-grid">${s.inner.concat(s.outer).map(f=>`<button class="feel ${c[f]?'done':''}" style="${c[f]?'color:'+s.color:''}" data-pick="${f}"><span style="color:var(--text)">${f}</span><span class="ct">${c[f]?c[f]+'×':''}</span></button>`).join('')}</div>
    <p class="note">From Gloria Willcox’s 1982 Feeling Wheel: 72 feelings around six core ones. This version uses “Sensuous” for the original’s “Sexy.”</p></div></div>`;
    const b=$('#sheetBody');
    b.querySelectorAll('[data-sector]').forEach(x=>{const go=()=>{sel=+x.dataset.sector;draw()};x.addEventListener('click',go);x.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}})});
    b.querySelectorAll('[data-feel],[data-pick]').forEach(x=>{const go=()=>practice(x.dataset.feel||x.dataset.pick);x.addEventListener('click',go);x.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();go()}})});
  }
  openSheet('Feeling Wheel','');draw();
  function practice(f){
    const meta=allFeelings.find(x=>x.f===f);const col=WHEEL[meta.si].color;
    const st={mins:2,approach:'Recall a time',secs:0,running:false,done:false};let iv=null;
    function d2(){
      if(!st.running&&!st.done){$('#sheetBody').innerHTML=`<button class="btn ghost small" id="fback">← Back to wheel</button><div><span class="eyebrow" style="color:${col}">${meta.core}</span><h3 style="font-family:var(--font-display);font-size:var(--text-xl);margin-top:var(--space-1)">${f}</h3></div>
        <div><p class="small" style="margin-bottom:var(--space-2)">How do you want to meet it?</p><div class="seg" id="fap">${['Recall a time','Notice it now','Invite it gently'].map(a=>`<button type="button" data-a="${a}" aria-pressed="${st.approach===a}">${a}</button>`).join('')}</div></div>
        <div><p class="small" style="margin-bottom:var(--space-2)">For how long?</p><div class="seg" id="fmin">${[1,2,3,5].map(m=>`<button type="button" data-m="${m}" aria-pressed="${st.mins===m}">${m} min</button>`).join('')}</div></div>
        <button class="btn" id="fstart">Begin</button>
        <p class="safety">You can stop at any time, and stopping still counts. If a feeling becomes overwhelming, open your eyes, name five things you can see and feel your feet on the floor. In the U.S. you can call or text 988 any time. This practice supports, and doesn’t replace, work with a counselor, sponsor or spiritual father.</p>`;
        $('#fback').addEventListener('click',draw);
        $('#sheetBody').querySelectorAll('[data-a]').forEach(x=>x.addEventListener('click',()=>{st.approach=x.dataset.a;d2()}));
        $('#sheetBody').querySelectorAll('[data-m]').forEach(x=>x.addEventListener('click',()=>{st.mins=+x.dataset.m;d2()}));
        $('#fstart').addEventListener('click',()=>{st.running=true;d2();iv=setInterval(tick,1000)});
        sheetCleanup=()=>clearInterval(iv);return}
      if(st.running){const left=st.mins*60-st.secs;const pr=FEEL_PROMPTS[Math.floor(st.secs/20)%FEEL_PROMPTS.length];
        $('#sheetBody').innerHTML=`<div style="text-align:center;display:grid;gap:var(--space-4);padding:var(--space-6) 0"><span class="eyebrow" style="color:${col}">${esc(st.approach)}</span><h3 style="font-family:var(--font-display);font-size:var(--text-xl)">${f}</h3><span class="timer" id="ftime">${Math.floor(left/60)}:${String(left%60).padStart(2,'0')}</span><p id="fprompt" class="muted">${pr}</p><div><button class="btn ghost" id="fstop">Stop here</button></div></div>`;
        $('#fstop').addEventListener('click',finish);return}
      if(st.done){$('#sheetBody').innerHTML=`<h3 style="font-family:var(--font-display);font-size:var(--text-lg)">${f} · ${Math.round(st.secs/6)/10} min</h3>
        <label class="f">How strong did it get? <span id="fintv">2 of 5</span><input type="range" id="fint" min="0" max="5" value="2"></label>
        <label class="f">One line about it (optional)<textarea id="fnote" style="min-height:70px"></textarea></label><div class="row"><button class="mic" id="fmic" type="button" aria-label="Dictate" aria-pressed="false">${MIC}</button><span class="xs muted mic-note"></span></div>
        <button class="btn" id="fsave">Save</button>`;
        $('#fint').addEventListener('input',e=>$('#fintv').textContent=e.target.value+' of 5');
        const stop=speechInto($('#fmic'),$('#fnote'));sheetCleanup=stop;
        $('#fsave').addEventListener('click',()=>{const p=st.secs>=st.mins*60?(st.mins>=3?3:2):1;
          S.feelings.push({date:today(),feeling:f,core:meta.core,secs:st.secs,approach:st.approach,intensity:+$('#fint').value,note:$('#fnote').value.trim()});
          addEntry({title:'Sat with '+f+' ('+Math.max(1,Math.round(st.secs/60))+' min)',skill:'psych_feel',mode:'practice',points:p});
          const n=new Set(S.feelings.map(x=>x.feeling)).size;if(n===72&&!S.entries.some(e=>e.title==='Touched all 72 feelings'))addEntry({title:'Touched all 72 feelings',skill:'psych_feel',mode:'practice',points:25});
          toast(`+${p} φόρα`);stop();sheetCleanup=null;draw()})}
    }
    function tick(){st.secs++;if(st.secs>=st.mins*60){finish();return}const left=st.mins*60-st.secs;const t=$('#ftime');if(t)t.textContent=Math.floor(left/60)+':'+String(left%60).padStart(2,'0');if(st.secs%20===0){const p=$('#fprompt');if(p)p.textContent=FEEL_PROMPTS[Math.floor(st.secs/20)%FEEL_PROMPTS.length]}}
    function finish(){clearInterval(iv);st.running=false;st.done=true;d2()}
    d2();
  }
}

/* ---------- inventory ---------- */
function openInv(){
  const L=ladderToday();
  const st={text:'',ladder:'',pass:[],virt:[],feels:[],w:{},rec:false,recs:[],amend:''};
  WEAPONS.forEach(([k])=>st.w[k]=0);
  let view='write';
  function draw(){
    if(view==='insights'){$('#sheetBody').innerHTML=`<div class="seg"><button data-v="write">Tonight</button><button data-v="insights" aria-pressed="true">Insights</button></div>`+insights();wireTabs();
      const cp=$('#aicopy');if(cp)cp.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(aiPrompt());toast('Copied. Paste it into your AI.')}catch(e){toast('Copy failed on this browser.')}});return}
    const chips=(arr,key,sel)=>`<div class="seg">${arr.map(x=>`<button type="button" data-${key}="${esc(x)}" aria-pressed="${sel.includes(x)}">${esc(x)}</button>`).join('')}</div>`;
    $('#sheetBody').innerHTML=`<div class="seg"><button data-v="write" aria-pressed="true">Tonight</button><button data-v="insights">Insights</button></div>
    <div><span class="eyebrow">Give thanks, then look back over the day</span></div>
    <label class="f">Speak or type your inventory<textarea id="itext" placeholder="What happened today? Where did I fall, where did I grow, what thoughts came and how did I meet them?">${esc(st.text)}</textarea></label>
    <div class="row"><button class="mic" id="imic" type="button" aria-label="Dictate inventory" aria-pressed="false">${MIC}</button><span class="xs muted mic-note">Tap to speak. Tap again to stop.</span></div>
    <label class="f">The Ladder, Step ${L[0]}: ${esc(L[1])}. ${esc(L[2])}<textarea id="iladder" style="min-height:70px">${esc(st.ladder)}</textarea></label>
    <div><p class="small" style="margin-bottom:var(--space-2)"><b>Passions I noticed</b></p>${chips(PASSIONS.map(p=>p[0]),'pa',st.pass)}</div>
    <div><p class="small" style="margin-bottom:var(--space-2)"><b>Virtues I practiced</b></p>${chips(PASSIONS.map(p=>p[1]),'vi',st.virt)}</div>
    <div><p class="small" style="margin-bottom:var(--space-2)"><b>Feelings I had</b> <span class="muted">(from the wheel)</span></p>${chips(WHEEL.map(w=>w.core),'core',[])}<div id="ifeels" class="seg" style="margin-top:var(--space-2)">${st.feels.map(f=>`<button type="button" data-rmf="${esc(f)}" aria-pressed="true">${esc(f)} ✕</button>`).join('')}</div></div>
    <div><p class="small" style="margin-bottom:var(--space-2)"><b>Unseen Warfare: rate today</b> <span class="muted">(1 low, 5 high)</span></p>${WEAPONS.map(([k,n])=>`<div class="rate"><span>${n}</span><div class="seg">${[1,2,3,4,5].map(v=>`<button type="button" data-wk="${k}" data-wv="${v}" aria-pressed="${st.w[k]===v}">${v}</button>`).join('')}</div></div>`).join('')}</div>
    <div><label class="row small" style="gap:var(--space-2)"><input type="checkbox" id="irec" ${st.rec?'checked':''}> Add a recovery Step 10 lens</label>
    ${st.rec?`<div style="margin-top:var(--space-2)"><p class="xs muted" style="margin-bottom:var(--space-2)">Where was I…</p>${chips(RECOVERY,'rc',st.recs)}</div>`:''}</div>
    <label class="f">One amendment for tomorrow<input type="text" id="iamend" value="${esc(st.amend)}" maxlength="160"></label>
    <button class="btn" id="isave">Save inventory (+3 φόρα)</button>
    <p class="note">Your inventory stays on this device. Nothing is sent anywhere unless you copy it out.</p>`;
    wireTabs();const b=$('#sheetBody');
    const ta=$('#itext');ta.addEventListener('input',()=>st.text=ta.value);$('#iladder').addEventListener('input',e=>st.ladder=e.target.value);$('#iamend').addEventListener('input',e=>st.amend=e.target.value);
    const stop=speechInto($('#imic'),ta);sheetCleanup=stop;
    const tog=(arr,v)=>{const i=arr.indexOf(v);i>=0?arr.splice(i,1):arr.push(v)};
    b.querySelectorAll('[data-pa]').forEach(x=>x.addEventListener('click',()=>{tog(st.pass,x.dataset.pa);x.setAttribute('aria-pressed',st.pass.includes(x.dataset.pa))}));
    b.querySelectorAll('[data-vi]').forEach(x=>x.addEventListener('click',()=>{tog(st.virt,x.dataset.vi);x.setAttribute('aria-pressed',st.virt.includes(x.dataset.vi))}));
    b.querySelectorAll('[data-rc]').forEach(x=>x.addEventListener('click',()=>{tog(st.recs,x.dataset.rc);x.setAttribute('aria-pressed',st.recs.includes(x.dataset.rc))}));
    b.querySelectorAll('[data-wk]').forEach(x=>x.addEventListener('click',()=>{st.w[x.dataset.wk]=+x.dataset.wv;b.querySelectorAll(`[data-wk="${x.dataset.wk}"]`).forEach(y=>y.setAttribute('aria-pressed',y===x))}));
    b.querySelectorAll('[data-core]').forEach(x=>x.addEventListener('click',()=>{const w=WHEEL.find(w=>w.core===x.dataset.core);const box=$('#ifeels');
      box.innerHTML=st.feels.map(f=>`<button type="button" data-rmf="${esc(f)}" aria-pressed="true">${esc(f)} ✕</button>`).join('')+w.inner.concat(w.outer).filter(f=>!st.feels.includes(f)).map(f=>`<button type="button" data-addf="${f}">${f}</button>`).join('');wireFeels()}));
    function wireFeels(){$('#ifeels').querySelectorAll('[data-addf]').forEach(x=>x.addEventListener('click',()=>{st.feels.push(x.dataset.addf);x.dataset.rmf=x.dataset.addf;delete x.dataset.addf;x.setAttribute('aria-pressed','true');x.textContent=x.dataset.rmf+' ✕';x.replaceWith(x.cloneNode(true));wireFeels()}));
      $('#ifeels').querySelectorAll('[data-rmf]').forEach(x=>x.onclick=()=>{st.feels=st.feels.filter(f=>f!==x.dataset.rmf);x.remove()})}
    wireFeels();
    $('#irec').addEventListener('change',e=>{st.rec=e.target.checked;st.text=ta.value;stop();draw()});
    $('#isave').addEventListener('click',()=>{st.text=ta.value.trim();if(!st.text&&!st.ladder.trim()){toast('Say or write a little first.');return}
      S.inventory.push({date:today(),text:st.text,ladderStep:L[0],ladder:st.ladder.trim(),pass:st.pass,virt:st.virt,feels:st.feels,w:st.w,recs:st.rec?st.recs:null,amend:st.amend.trim()});
      addEntry({title:'Daily inventory · Ladder step '+L[0],skill:'sp_inventory',skill2:st.rec?'psych_recovery':undefined,mode:'practice',points:3});
      if(Object.values(st.w).some(v=>v))addEntry({title:'Unseen Warfare self-rating',skill:'sp_warfare',mode:'practice',points:1});
      if(st.ladder.trim())addEntry({title:'Ladder step '+L[0]+': '+L[1],skill:'sp_ladder',mode:'practice',points:2});
      stop();sheetCleanup=null;view='insights';toast('Inventory saved');draw();$('#sheetBody').scrollTop=0});
  }
  function wireTabs(){$('#sheetBody').querySelectorAll('[data-v]').forEach(x=>x.addEventListener('click',()=>{if(sheetCleanup){sheetCleanup()}view=x.dataset.v;draw()}))}
  openSheet('Daily inventory','');draw();
}
const STOP=new Set('i me my myself we our you your he she it its they them a an the and but or so of to in on at for with from by as is am are was were be been being have has had do did does not no that this these those there then than just very really today about what when where who how why which would could should can will into out up down over again also too some any all more most much like get got go went one'.split(' '));
function insights(){
  const inv=S.inventory.slice().sort((a,b)=>a.date.localeCompare(b.date));
  if(!inv.length)return `<p class="empty">Insights appear after your first inventory.</p>`;
  const last=n=>inv.slice(-n);
  const days=new Set(inv.map(i=>i.date));let streak=0;const d=new Date();for(;;){const k=d.toISOString().slice(0,10);if(days.has(k)){streak++;d.setDate(d.getDate()-1)}else break}
  const cnt=(arr,key)=>{const c={};arr.forEach(i=>(i[key]||[]).forEach(x=>c[x]=(c[x]||0)+1));return Object.entries(c).sort((a,b)=>b[1]-a[1])};
  const p30=cnt(last(30),'pass'),v30=cnt(last(30),'virt'),f30=cnt(last(30),'feels');
  const avg=(arr,k)=>{const v=arr.map(i=>i.w&&i.w[k]).filter(Boolean);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null};
  const wk=WEAPONS.map(([k,n])=>{const a=avg(last(7),k),b=avg(inv.slice(-14,-7),k);return{n,a,b,k}}).filter(x=>x.a!=null);
  const words={};last(30).forEach(i=>((i.text+' '+(i.ladder||'')).toLowerCase().match(/[a-zα-ωά-ώ']{4,}/g)||[]).forEach(w=>{if(!STOP.has(w))words[w]=(words[w]||0)+1}));
  const topW=Object.entries(words).filter(x=>x[1]>1).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const spark=k=>{const v=last(14).map(i=>i.w&&i.w[k]||0);if(v.length<2)return'';const W=300,H=48;const pts=v.map((x,i)=>`${(i/(v.length-1))*W},${H-4-(x/5)*(H-8)}`).join(' ');return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="var(--olive)" stroke-width="2"/></svg>`};
  let corr='';
  if(inv.length>=7){const hi=inv.filter(i=>i.w&&i.w.prayer>=4),lo=inv.filter(i=>i.w&&i.w.prayer&&i.w.prayer<=2);if(hi.length>=3&&lo.length>=3){const m=a=>a.reduce((s,i)=>s+(i.pass||[]).length,0)/a.length;corr=`<div class="insight">On days you rated prayer 4 or 5, you noted <b>${m(hi).toFixed(1)}</b> passions on average, compared with <b>${m(lo).toFixed(1)}</b> on days you rated it 1 or 2. This is a pattern in your own entries, not proof of cause.</div>`}}
  return `<div class="stats"><div class="stat"><b>${streak}</b><span>day streak</span></div><div class="stat"><b>${inv.length}</b><span>inventories</span></div><div class="stat"><b>${new Set(inv.map(i=>i.ladderStep)).size}/30</b><span>Ladder steps met</span></div></div>
  <div class="card">
  ${p30.length?`<div class="insight"><b>Passions you noticed most</b> (last 30): ${p30.slice(0,3).map(([k,v])=>`${esc(k)} ${v}×`).join(', ')}</div>`:''}
  ${v30.length?`<div class="insight"><b>Virtues you practiced most:</b> ${v30.slice(0,3).map(([k,v])=>`${esc(k)} ${v}×`).join(', ')}</div>`:''}
  ${f30.length?`<div class="insight"><b>Feelings you named most:</b> ${f30.slice(0,4).map(([k,v])=>`${esc(k)} ${v}×`).join(', ')}</div>`:''}
  ${wk.map(x=>`<div class="insight"><b>${x.n}</b>: ${x.a.toFixed(1)} this week${x.b!=null?` (${x.a>x.b?'up':'down'} from ${x.b.toFixed(1)})`:''}${spark(x.k)}</div>`).join('')}
  ${topW.length?`<div class="insight"><b>Words that keep coming up:</b> ${topW.map(([w,c])=>`${esc(w)} (${c})`).join(', ')}</div>`:''}
  ${corr}
  ${inv[inv.length-1].amend?`<div class="insight"><b>Your amendment for tomorrow:</b> ${esc(inv[inv.length-1].amend)}</div>`:''}
  </div>
  <div class="card stack"><span class="eyebrow">Deeper review with AI</span><p class="small">Copies your last 7 inventories with instructions to quote your own words, avoid diagnosing and suggest one practice. Paste it into the AI you trust. Consider sharing the patterns with your spiritual father.</p><button class="btn small" id="aicopy">Copy for AI review</button></div>`;
}
function aiPrompt(){
  const inv=S.inventory.slice(-7);
  return `Please review my last ${inv.length} daily inventories. I'm an Orthodox Christian using the Ladder of Divine Ascent, Unseen Warfare and an evening examination of conscience${inv.some(i=>i.recs)?', along with a recovery Step 10 lens':''}.\n\nGuidelines:\n- Quote my own words when you point out a pattern.\n- Don't diagnose me or replace my spiritual father, counselor or sponsor.\n- Compare what I wrote with my self-ratings and say where they agree or disagree.\n- Name one recurring passion and the virtue that opposes it, then suggest one small practice for this week.\n- Ask me one question to take into prayer.\n\n`+inv.map(i=>`Date: ${i.date}\nInventory: ${i.text}\nLadder step ${i.ladderStep}: ${i.ladder||'(none)'}\nPassions: ${(i.pass||[]).join(', ')||'none'}\nVirtues: ${(i.virt||[]).join(', ')||'none'}\nFeelings: ${(i.feels||[]).join(', ')||'none'}\nSelf-ratings: ${WEAPONS.map(([k,n])=>n+' '+(i.w&&i.w[k]||'-')).join('; ')}${i.recs?`\nStep 10: ${i.recs.join(', ')||'none'}`:''}\nAmendment: ${i.amend||'-'}`).join('\n\n');
}

/* ---------- write: fiction, characters, books, blocks ---------- */
['chars','people','books','writing','drafts','blockHits'].forEach(k=>{if(!S[k])S[k]=k==='blockHits'?{}:[]});
const daysSince=d=>d?Math.floor((new Date(today())-new Date(d))/864e5):Infinity;
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
function charLast(c){const ci=c.checkins||[];return ci.length?ci[ci.length-1]:null}
function staleChar(){return S.chars.filter(c=>!c.archived).sort((a,b)=>{const la=charLast(a),lb=charLast(b);return (la?la.date:'').localeCompare(lb?lb.date:'')})[0]}
function wordsOf(t){return (String(t||'').match(/\S+/g)||[]).length}

function viewWrite(){
  const sc=staleChar();const wk=S.writing.filter(w=>daysSince(w.date)<7);
  const wkMin=wk.reduce((a,w)=>a+(w.mins||0),0),wkWords=wk.reduce((a,w)=>a+(w.words||0),0);
  const hits=Object.entries(S.blockHits).sort((a,b)=>b[1]-a[1]);
  const blockName=id=>(BLOCKS.find(b=>b.id===id)||{}).name;
  const books=[{id:'carnegie',title:CARNEGIE.title,author:CARNEGIE.author,seed:true}].concat(S.books);
  return `<h1 class="section-title">Write</h1>
  <p class="lede">Characters grow from real attention to real people. Check in with your characters, notice one person a day, and when you get stuck, name the block and try one way out.</p>
  <article class="card up-next">${sc?`<span class="eyebrow">Character check-in · ${charLast(sc)?daysSince(charLast(sc).date)+' days since you last asked':'not checked in yet'}</span><h3>How is ${esc(sc.name)} doing?</h3><p class="muted">${charLast(sc)?`Last time: ${esc(charLast(sc).mood)}. “${esc(charLast(sc).a.slice(0,110))}${charLast(sc).a.length>110?'…':''}”`:esc(sc.want?'Wants: '+sc.want:'Two questions, answered in their voice.')}</p><div class="row" style="margin-top:var(--space-4)"><button class="btn" data-checkin="${sc.id}">Check in</button></div>`
  :`<span class="eyebrow">Start here</span><h3>Bring back your first character</h3><p class="muted">Add someone from the story you’re returning to. The app will ask how they’re doing every few days.</p><div class="row" style="margin-top:var(--space-4)"><button class="btn" data-newchar>Add a character</button></div>`}</article>
  <div class="stats"><div class="stat"><b>${wkMin}</b><span>minutes written this week</span></div><div class="stat"><b>${wkWords}</b><span>words this week</span></div><div class="stat"><b>${S.people.length}</b><span>people noticed</span></div></div>
  <div class="practice-row">
   <button class="mini" data-wopen="session"><span class="eyebrow">Writing</span><h4>Log a session</h4><p>Minutes, words and anything that got in the way.</p></button>
   <button class="mini" data-wopen="people"><span class="eyebrow">Carnegie, principle 1</span><h4>People notebook</h4><p>One real person today: what they cared about and one detail.</p></button>
   <button class="mini" data-wopen="stuck"><span class="eyebrow">Unstick</span><h4>I’m stuck</h4><p>Name the block, read what it is, try a 10-minute drill.</p></button>
  </div>
  <h2 class="sub-title">Characters</h2>
  ${S.chars.length?`<div class="grid2">${S.chars.map(c=>{const l=charLast(c);return `<button class="card char-card" data-char="${c.id}"><span class="eyebrow">${esc(c.role||'Character')}${c.story?' · '+esc(c.story):''}</span><h3>${esc(c.name)}</h3><p class="small muted">${l?`${esc(l.mood)} · ${l.date===today()?'checked in today':daysSince(l.date)+' days ago'}`:'Not checked in yet'}</p>${c.want?`<p class="small">Wants: ${esc(c.want)}</p>`:''}</button>`}).join('')}</div>`:'<p class="empty">No characters yet.</p>'}
  <div class="row" style="margin-top:var(--space-3)"><button class="btn ghost small" data-newchar>+ Add a character</button>${S.chars.length?'<button class="btn ghost small" id="charPrompt">Copy prompt: let AI interview my characters</button>':''}</div>
  <h2 class="sub-title">Writing blocks</h2>
  ${hits.length?`<p class="small muted" style="margin-bottom:var(--space-3)">Your most common: ${hits.slice(0,3).map(([k,v])=>`${esc(blockName(k))} (${v})`).join(', ')}</p>`:''}
  <div class="feel-grid blocks">${BLOCKS.map(b=>`<button class="feel" data-block="${b.id}"><span>${esc(b.name)}</span><span class="ct">${S.blockHits[b.id]||''}</span></button>`).join('')}</div>
  <h2 class="sub-title">Books and insights</h2>
  <div class="grid2">${books.map(b=>{const n=S.books.find(x=>x.id===b.id);const ins=(b.seed?(S.carnegie||{}).insights:(n||{}).insights)||[];return `<button class="card char-card" data-book="${b.id}"><span class="eyebrow">${b.seed?'30 principles':esc(b.status||'Reading')}</span><h3>${esc(b.title)}</h3><p class="small muted">${esc(b.author||'')} · ${ins.length} insight${ins.length===1?'':'s'}</p></button>`}).join('')}</div>
  <div class="row" style="margin-top:var(--space-3)"><button class="btn ghost small" data-newbook>+ Add a book</button></div>
  <h2 class="sub-title">From ChatGPT</h2>
  <div class="card stack"><p class="small">Bring in fiction you wrote with ChatGPT. In ChatGPT, open <b>Settings → Data controls → Export data</b>. When the email arrives, unzip it and choose <b>conversations.json</b> here. The file is read only on this device.</p>
  <label class="btn ghost small" style="cursor:pointer;justify-self:start">Choose conversations.json<input type="file" id="gptFile" accept=".json,application/json" multiple hidden></label>
  ${S.drafts.length?`<div>${S.drafts.map(d=>`<div class="entry"><div><div class="entry-title">${esc(d.title)}</div><div class="entry-meta"><span>${esc(d.date)}</span><span>${wordsOf(d.text)} words</span></div></div><button class="btn ghost small" data-draft="${d.id}">Open</button></div>`).join('')}</div>`:''}</div>`;
}

/* characters */
function charForm(c){c=c||{};return `<form class="form" id="cForm">
  <label class="f">Name<input type="text" name="name" required maxlength="60" value="${esc(c.name)}"></label>
  <label class="f">Story or project<input type="text" name="story" maxlength="80" value="${esc(c.story)}"></label>
  <label class="f">Role<input type="text" name="role" maxlength="60" placeholder="Protagonist, sister, rival…" value="${esc(c.role)}"></label>
  <label class="f">What do they want?<input type="text" name="want" maxlength="160" value="${esc(c.want)}"></label>
  <label class="f">What do they need but can’t see?<input type="text" name="need" maxlength="160" value="${esc(c.need)}"></label>
  <label class="f">What do they love that has nothing to do with the plot?<input type="text" name="loves" maxlength="160" value="${esc(c.loves)}"></label>
  <label class="f">Wound or secret<input type="text" name="wound" maxlength="160" value="${esc(c.wound)}"></label>
  <label class="f">Who in real life sparked them? (initials only)<input type="text" name="spark" maxlength="40" value="${esc(c.spark)}"></label>
  <button class="btn" type="submit">Save character</button></form>`}
function editChar(id,seed){
  const c=S.chars.find(x=>x.id===id)||Object.assign({},seed||{});
  openSheet(id?'Edit '+c.name:'New character',charForm(c));
  $('#cForm').addEventListener('submit',ev=>{ev.preventDefault();const f=Object.fromEntries(new FormData(ev.target));
    if(id){Object.assign(c,f)}else{const n=Object.assign({id:uid(),created:today(),checkins:[]},f);S.chars.push(n);addEntry({title:'New character: '+n.name,skill:'fic_char',mode:'practice',points:2});toast('+2 φόρα')}
    save();closeSheet()});
}
function openChar(id){
  const c=S.chars.find(x=>x.id===id);const ci=(c.checkins||[]).slice().reverse();
  const row=(k,v)=>v?`<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`:'';
  openSheet(c.name,`<div class="row"><button class="btn" data-checkin="${c.id}">Check in</button><button class="btn ghost small" id="cEdit">Edit</button></div>
  <dl class="char-dl">${row('Story',c.story)}${row('Role',c.role)}${row('Wants',c.want)}${row('Needs',c.need)}${row('Loves',c.loves)}${row('Wound or secret',c.wound)}${row('Sparked by',c.spark)}</dl>
  <h3 class="sub-title" style="margin-top:0">Check-ins</h3>
  ${ci.length?ci.map(x=>`<div class="insight"><span class="xs muted">${fmtDate(x.date)} · ${esc(x.mood)}</span><p class="small"><b>${esc(x.q)}</b></p><p class="small">${esc(x.a)}</p>${x.q2?`<p class="small"><b>${esc(x.q2)}</b></p><p class="small">${esc(x.a2)}</p>`:''}</div>`).join(''):'<p class="empty">No check-ins yet.</p>'}`);
  $('#cEdit').addEventListener('click',()=>editChar(c.id));
  $('#sheetBody').querySelector('[data-checkin]').addEventListener('click',()=>checkIn(c.id));
}
function checkIn(id){
  const c=S.chars.find(x=>x.id===id);const n=(c.checkins||[]).length;
  const qs=CHAR_Q.map(q=>q.replace(/\{n\}/g,c.name));
  const q1=qs[0],q2=qs[1+((n*3+dayOfYear())%(qs.length-1))];
  openSheet('Check in with '+c.name,`<p class="small muted">Answer in ${esc(c.name)}’s voice if you can. Short is fine.</p>
  <label class="f">${esc(q1)}<textarea id="ca1" style="min-height:90px"></textarea></label><div class="row"><button class="mic" id="cm1" type="button" aria-label="Dictate" aria-pressed="false">${MIC}</button><span class="xs muted mic-note"></span></div>
  <label class="f">${esc(q2)}<textarea id="ca2" style="min-height:90px"></textarea></label><div class="row"><button class="mic" id="cm2" type="button" aria-label="Dictate" aria-pressed="false">${MIC}</button><span class="xs muted mic-note"></span></div>
  <div><p class="small" style="margin-bottom:var(--space-2)">How are they, overall?</p><div class="seg" id="cmood">${MOODS.map(m=>`<button type="button" data-mood="${m}">${m}</button>`).join('')}</div></div>
  <button class="btn" id="csave">Save check-in (+2 φόρα)</button>`);
  const s1=speechInto($('#cm1'),$('#ca1')),s2=speechInto($('#cm2'),$('#ca2'));sheetCleanup=()=>{s1();s2()};
  let mood='';$('#cmood').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{mood=b.dataset.mood;$('#cmood').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b))}));
  $('#csave').addEventListener('click',()=>{const a=$('#ca1').value.trim(),a2=$('#ca2').value.trim();if(!a&&!a2){toast('Answer at least one question.');return}
    c.checkins=c.checkins||[];c.checkins.push({date:today(),q:q1,a,q2,a2,mood:mood||'Okay'});
    const deep=wordsOf(a+' '+a2)>=60;addEntry({title:'Checked in with '+c.name,skill:'fic_char',mode:'practice',points:deep?3:2});toast(`+${deep?3:2} φόρα`);s1();s2();sheetCleanup=null;closeSheet()});
}
function charPrompt(){
  return `I'm returning to fiction writing and want to know my characters better. Interview them one at a time, as a curious, warm journalist. Ask one question at a time and wait for me to answer in the character's voice. Don't write the story for me or suggest plot. After every few answers, tell me one thing the character revealed that I may not have noticed.\n\n`+S.chars.map(c=>{const l=charLast(c);return `${c.name}${c.role?' ('+c.role+')':''}${c.story?', from '+c.story:''}. Wants: ${c.want||'?'}. Needs: ${c.need||'?'}. Loves: ${c.loves||'?'}. Wound or secret: ${c.wound||'?'}.${l?` Last check-in (${l.mood}): "${l.a}"`:''}`}).join('\n');
}

/* people notebook */
function openPeople(){
  const recent=S.people.slice(-5).reverse();
  openSheet('People notebook',`<p class="small muted">Carnegie’s first principle is to “become genuinely interested in other people.” This is also where characters come from. Use initials or a nickname.</p>
  <form class="form" id="pForm"><label class="f">Who? (initials or a nickname)<input type="text" name="who" required maxlength="40"></label>
  ${Object.entries(PEOPLE_Q).map(([k,q])=>`<label class="f">${esc(q)}<textarea name="${k}" style="min-height:64px"></textarea></label>`).join('')}
  <button class="btn" type="submit">Save (+2 φόρα)</button></form>
  ${recent.length?`<h3 class="sub-title">Recent</h3>${recent.map(p=>`<div class="insight"><span class="xs muted">${fmtDate(p.date)}</span><p class="small"><b>${esc(p.who)}</b>${p.cared?' · cares about '+esc(p.cared):''}</p>${p.detail?`<p class="small">${esc(p.detail)}</p>`:''}<button class="btn ghost small" data-seed="${p.id}">Seed a character from this</button></div>`).join('')}`:''}`);
  $('#pForm').addEventListener('submit',ev=>{ev.preventDefault();const f=Object.fromEntries(new FormData(ev.target));f.id=uid();f.date=today();S.people.push(f);addEntry({title:'Noticed '+f.who,skill:'fic_observe',mode:'practice',points:2});toast('+2 φόρα');openPeople()});
  $('#sheetBody').querySelectorAll('[data-seed]').forEach(b=>b.addEventListener('click',()=>{const p=S.people.find(x=>x.id===b.dataset.seed);editChar(null,{spark:p.who,loves:p.cared,wound:'',want:'',need:'',role:'',story:'',name:''})}));
}

/* writing session */
function openSession(){
  const projects=[...new Set(S.writing.map(w=>w.project).concat(S.chars.map(c=>c.story)).filter(Boolean))];
  openSheet('Log a writing session',`<form class="form" id="wForm">
  <label class="f">Project<input type="text" name="project" list="projList" maxlength="80" value="${esc(projects[0]||'')}"><datalist id="projList">${projects.map(p=>`<option value="${esc(p)}">`).join('')}</datalist></label>
  <label class="f">Minutes<input type="number" name="mins" min="1" max="600" value="20" inputmode="numeric"></label>
  <label class="f">Words (rough is fine)<input type="number" name="words" min="0" max="20000" value="0" inputmode="numeric"></label>
  <label class="f">Did anything get in the way?<select name="block"><option value="">No, it flowed</option>${BLOCKS.map(b=>`<option value="${b.id}">${esc(b.name)}</option>`).join('')}</select></label>
  <label class="f">One line about today’s pages<input type="text" name="note" maxlength="200"></label>
  <button class="btn" type="submit">Save session</button></form>`);
  $('#wForm').addEventListener('submit',ev=>{ev.preventDefault();const f=Object.fromEntries(new FormData(ev.target));const mins=+f.mins||0,words=+f.words||0;
    S.writing.push({date:today(),project:f.project,mins,words,block:f.block,note:f.note});if(f.block)S.blockHits[f.block]=(S.blockHits[f.block]||0)+1;
    const p=3+Math.min(3,Math.floor(mins/15));addEntry({title:'Wrote '+mins+' min'+(f.project?' on '+f.project:''),skill:'fic_draft',mode:'handson',points:p});toast(`+${p} φόρα`);
    if(f.block){openBlock(f.block)}else closeSheet()});
}

/* blocks */
function openStuck(){
  openSheet('What kind of stuck?',`<p class="small muted">Pick the one that sounds closest. Naming it is the first step.</p><div class="stack">${BLOCKS.map(b=>`<button class="mini" data-block="${b.id}"><h4>${esc(b.name)}</h4><p>${esc(b.what.split('. ')[0])}.</p></button>`).join('')}</div>`);
  $('#sheetBody').querySelectorAll('[data-block]').forEach(x=>x.addEventListener('click',()=>{S.blockHits[x.dataset.block]=(S.blockHits[x.dataset.block]||0)+1;save();openBlock(x.dataset.block)}));
}
function openBlock(id){
  const b=BLOCKS.find(x=>x.id===id);
  openSheet(b.name,`<p>${esc(b.what)}</p>
  <div><span class="eyebrow">You might notice</span><ul class="ul">${b.signs.map(s=>`<li>${esc(s)}</li>`).join('')}</ul></div>
  <div><span class="eyebrow">Ways to get unstuck</span><ol class="ul">${b.moves.map(s=>`<li>${esc(s)}</li>`).join('')}</ol></div>
  <div class="card stack"><span class="eyebrow">10-minute drill</span><p class="small"><b>${esc(b.drill)}</b></p><div class="row"><span class="timer" id="dtime">10:00</span><button class="btn small" id="dgo">Start</button></div>
  <textarea id="dtext" placeholder="Write here, or in your own notebook."></textarea><div class="row"><button class="mic" id="dmic" type="button" aria-label="Dictate" aria-pressed="false">${MIC}</button><span class="xs muted mic-note"></span></div>
  <button class="btn" id="ddone">I did the drill (+3 φόρα)</button></div>
  <button class="btn ghost small" id="dtalk">Copy prompt: talk this block through with AI</button>`);
  const stop=speechInto($('#dmic'),$('#dtext'));let iv=null,left=600;sheetCleanup=()=>{stop();clearInterval(iv)};
  $('#dgo').addEventListener('click',e=>{if(iv){clearInterval(iv);iv=null;e.target.textContent='Resume';return}e.target.textContent='Pause';iv=setInterval(()=>{left--;const t=$('#dtime');if(t)t.textContent=Math.floor(left/60)+':'+String(left%60).padStart(2,'0');if(left<=0){clearInterval(iv);iv=null;toast('Ten minutes. Well done.')}},1000)});
  $('#ddone').addEventListener('click',()=>{addEntry({title:'Unstick drill: '+b.name,skill:'fic_draft',mode:'handson',points:3});const t=$('#dtext').value.trim();if(t)S.writing.push({date:today(),project:'Drill',mins:Math.round((600-left)/60),words:wordsOf(t),note:b.name});save();toast('+3 φόρα');stop();sheetCleanup=null;closeSheet()});
  $('#dtalk').addEventListener('click',async()=>{const pr=`I'm a fiction writer returning after a break, and I'm stuck with this: "${b.name}". ${b.what}\n\nBefore you give advice, ask me two questions about what's actually happening when I sit down to write. Then suggest one small next step I can do in under ten minutes. Don't write any of the story for me.`;try{await navigator.clipboard.writeText(pr);toast('Copied')}catch(e){toast('Copy failed on this browser.')}});
}

/* books */
function bookObj(id){if(id==='carnegie'){S.carnegie=S.carnegie||{insights:[],tried:{}};return Object.assign({id,title:CARNEGIE.title,author:CARNEGIE.author,seed:true},S.carnegie)}return S.books.find(b=>b.id===id)}
function bookStore(id){return id==='carnegie'?S.carnegie:S.books.find(b=>b.id===id)}
function openBook(id){
  const b=bookObj(id);const st=bookStore(id);st.insights=st.insights||[];
  const princ=b.seed?CARNEGIE.parts.map((part,pi)=>`<details class="details"${pi===1?' open':''}><summary>${esc(part.name)}</summary>${part.p.map(([t,lens],i)=>{const k=pi+'.'+i;const n=(st.tried||{})[k]||0;return `<div class="insight"><p class="small"><b>${esc(t)}</b></p>${lens?`<p class="small muted">For your writing: ${esc(lens)}</p>`:''}<div class="row"><button class="btn ghost small" data-try="${k}">I practiced this today${n?' ('+n+')':''}</button></div></div>`}).join('')}</details>`).join(''):'';
  openSheet(b.title,`<p class="small muted">${esc(b.author||'')}${b.seed?` · <a href="${CARNEGIE.src}" target="_blank" rel="noopener">principles summary</a>`:''}</p>
  ${!b.seed?`<div class="seg" id="bstat">${['Want to read','Reading','Finished'].map(s=>`<button type="button" data-s="${s}" aria-pressed="${(b.status||'Reading')===s}">${s}</button>`).join('')}</div>`:''}
  <div class="card stack"><span class="eyebrow">New insight</span><p class="small">Write your own take first. Then you can bring it to AI to discuss.</p>
  <label class="f">What struck you?<textarea id="bi" style="min-height:80px"></textarea></label>
  <label class="f">Where will you use it: in life, or in a character?<input type="text" id="bu" maxlength="200"></label>
  <div class="row"><button class="mic" id="bmic" type="button" aria-label="Dictate" aria-pressed="false">${MIC}</button><button class="btn" id="bsave">Save insight (+2 φόρα)</button><button class="btn ghost small" id="bdisc">Copy discussion prompt</button></div></div>
  ${princ}
  ${st.insights.length?`<h3 class="sub-title">Your insights</h3>${st.insights.slice().reverse().map(x=>`<div class="insight"><span class="xs muted">${fmtDate(x.date)}</span><p class="small">${esc(x.text)}</p>${x.use?`<p class="small muted">Use: ${esc(x.use)}</p>`:''}</div>`).join('')}`:''}`);
  const stop=speechInto($('#bmic'),$('#bi'));sheetCleanup=stop;
  const bs=$('#bstat');if(bs)bs.querySelectorAll('button').forEach(x=>x.addEventListener('click',()=>{st.status=x.dataset.s;save();bs.querySelectorAll('button').forEach(y=>y.setAttribute('aria-pressed',y===x))}));
  $('#sheetBody').querySelectorAll('[data-try]').forEach(x=>x.addEventListener('click',()=>{st.tried=st.tried||{};st.tried[x.dataset.try]=(st.tried[x.dataset.try]||0)+1;const [pi,i]=x.dataset.try.split('.').map(Number);addEntry({title:'Practiced: '+CARNEGIE.parts[pi].p[i][0],skill:'fic_observe',mode:'practice',points:1});x.textContent='I practiced this today ('+st.tried[x.dataset.try]+')';toast('+1 φόρα')}));
  $('#bsave').addEventListener('click',()=>{const t=$('#bi').value.trim();if(!t){toast('Write the insight first.');return}st.insights.push({date:today(),text:t,use:$('#bu').value.trim()});addEntry({title:'Insight: '+b.title,skill:'fic_read',mode:'read',points:2});toast('+2 φόρα');stop();sheetCleanup=null;openBook(id)});
  $('#bdisc').addEventListener('click',async()=>{const t=$('#bi').value.trim()||(st.insights.length?st.insights[st.insights.length-1].text:'');if(wordsOf(t)<10){toast('Write a few sentences of your own take first.');return}
    const pr=`I'm reading ${b.title}${b.author?' by '+b.author:''}. Here is my own take, written before asking you:\n\n"${t}"\n\nPlease discuss it with me like a thoughtful book-club partner. Push back where you disagree, connect it to one other book or tradition (Orthodox Christian sources are welcome), and ask me one question about how this could deepen a fictional character. Keep your reply under 200 words.`;
    try{await navigator.clipboard.writeText(pr);toast('Copied')}catch(e){toast('Copy failed on this browser.')}});
}
function newBook(){
  openSheet('Add a book',`<form class="form" id="nbForm"><label class="f">Title<input type="text" name="title" required maxlength="120"></label><label class="f">Author<input type="text" name="author" maxlength="80"></label><label class="f">Status<select name="status"><option>Reading</option><option>Want to read</option><option>Finished</option></select></label><button class="btn" type="submit">Add</button></form>`);
  $('#nbForm').addEventListener('submit',ev=>{ev.preventDefault();const f=Object.fromEntries(new FormData(ev.target));S.books.push(Object.assign({id:uid(),insights:[]},f));save();closeSheet()});
}

/* chatgpt import */
const FIC_RE=/\b(story|stories|chapter|novel|character|characters|scene|fiction|plot|protagonist|draft|manuscript|dialogue|narrator|short story|villain)\b/i;
function convText(c){const m=c.mapping||{};let nodes=Object.values(m).filter(n=>n.message&&n.message.content&&n.message.author&&['user','assistant'].includes(n.message.author.role));
  nodes.sort((a,b)=>(a.message.create_time||0)-(b.message.create_time||0));
  return nodes.map(n=>{const parts=(n.message.content.parts||[]).filter(p=>typeof p==='string').join('\n').trim();return parts?(n.message.author.role==='user'?'ME: ':'CHATGPT: ')+parts:''}).filter(Boolean).join('\n\n')}
async function importGPT(files){
  let convs=[];for(const f of files){try{const d=JSON.parse(await f.text());convs=convs.concat(Array.isArray(d)?d:(d.conversations||[]))}catch(e){toast('Could not read '+f.name);return}}
  if(!convs.length){toast('No conversations found in that file.');return}
  const list=convs.map((c,i)=>{const t=convText(c);return{i,title:c.title||'Untitled',date:c.create_time?new Date(c.create_time*1000).toISOString().slice(0,10):'',text:t,fic:FIC_RE.test((c.title||'')+' '+t.slice(0,4000))}}).filter(x=>x.text);
  let showAll=false;
  function draw(){const shown=list.filter(x=>showAll||x.fic);
    $('#sheetBody').innerHTML=`<p class="small">${list.length} conversations found. ${list.filter(x=>x.fic).length} look like fiction. Check the ones to keep in your Write section.</p>
    <label class="row small"><input type="checkbox" id="gall" ${showAll?'checked':''}> Show all conversations</label>
    <div class="stack" style="gap:var(--space-1)">${shown.map(x=>`<label class="entry" style="cursor:pointer"><span class="row" style="gap:var(--space-3);flex-wrap:nowrap"><input type="checkbox" data-gi="${x.i}"><span><span class="entry-title">${esc(x.title)}</span><span class="entry-meta"><span>${x.date}</span><span>${wordsOf(x.text)} words</span></span></span></span></label>`).join('')||'<p class="empty">Nothing matched. Try showing all conversations.</p>'}</div>
    <button class="btn" id="gsave">Keep selected</button>`;
    $('#gall').addEventListener('change',e=>{showAll=e.target.checked;draw()});
    $('#gsave').addEventListener('click',()=>{const sel=[...$('#sheetBody').querySelectorAll('[data-gi]:checked')].map(x=>list.find(l=>l.i===+x.dataset.gi));if(!sel.length){toast('Check at least one.');return}
      sel.forEach(x=>{if(!S.drafts.some(d=>d.title===x.title&&d.date===x.date))S.drafts.push({id:uid(),title:x.title,date:x.date,text:x.text.slice(0,60000)})});save();toast(sel.length+' kept');closeSheet()});}
  openSheet('Import from ChatGPT','');draw();
}
function openDraft(id){const d=S.drafts.find(x=>x.id===id);
  openSheet(d.title,`<p class="xs muted">${esc(d.date)} · ${wordsOf(d.text)} words · stays on this device</p><div class="row"><button class="btn small" id="dchar">Add a character from this story</button><button class="btn ghost small" id="ddel">Remove</button></div><div class="prompt-box" style="max-height:none">${esc(d.text)}</div>`);
  $('#dchar').addEventListener('click',()=>editChar(null,{story:d.title}));
  $('#ddel').addEventListener('click',()=>{S.drafts=S.drafts.filter(x=>x.id!==id);save();closeSheet()});
}
function bindWrite(v){
  v.querySelectorAll('[data-checkin]').forEach(b=>b.addEventListener('click',()=>checkIn(b.dataset.checkin)));
  v.querySelectorAll('[data-newchar]').forEach(b=>b.addEventListener('click',()=>editChar(null)));
  v.querySelectorAll('[data-char]').forEach(b=>b.addEventListener('click',()=>openChar(b.dataset.char)));
  v.querySelectorAll('[data-block]').forEach(b=>b.addEventListener('click',()=>openBlock(b.dataset.block)));
  v.querySelectorAll('[data-book]').forEach(b=>b.addEventListener('click',()=>openBook(b.dataset.book)));
  v.querySelectorAll('[data-newbook]').forEach(b=>b.addEventListener('click',newBook));
  v.querySelectorAll('[data-draft]').forEach(b=>b.addEventListener('click',()=>openDraft(b.dataset.draft)));
  v.querySelectorAll('[data-wopen]').forEach(b=>b.addEventListener('click',()=>({session:openSession,people:openPeople,stuck:openStuck})[b.dataset.wopen]()));
  const cp=v.querySelector('#charPrompt');if(cp)cp.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(charPrompt());toast('Copied. Paste it into your AI.')}catch(e){toast('Copy failed on this browser.')}});
  const gf=v.querySelector('#gptFile');if(gf)gf.addEventListener('change',()=>gf.files.length&&importGPT([...gf.files]));
}

/* ---------- sell ---------- */
['leads','sales'].forEach(k=>{if(!S[k])S[k]=[]});if(!S.bizSteps)S.bizSteps={};if(!S.sellPhone)S.sellPhone='+18033990665';
let bizTab='ride';
function dueLeads(){return S.leads.filter(l=>l.nextDate&&l.nextDate<=today()&&!['Won','Not now'].includes(l.stage)).sort((a,b)=>a.nextDate.localeCompare(b.nextDate))}
function nextStep(bid){const b=BIZ.find(x=>x.id===bid);const d=S.bizSteps[bid]||{};const i=b.steps.findIndex((_,i)=>!d[i]);return i<0?null:{b,i,t:b.steps[i]}}
function viewSell(){if(bizTab==='jobs')return jobsView(sellSeg());
  const b=BIZ.find(x=>x.id===bizTab);const due=dueLeads();const d=S.bizSteps[b.id]||{};const done=Object.keys(d).length;
  const leads=S.leads.filter(l=>l.biz===b.id);const wk=S.leads.reduce((a,l)=>a+(l.touches||[]).filter(t=>daysSince(t.date)<7).length,0);
  const rev=S.sales.filter(s=>s.biz===b.id&&daysSince(s.date)<30).reduce((a,s)=>a+s.amount,0);
  const ns=nextStep(b.id);
  let top;
  if(due.length){const l=due[0];const bz=BIZ.find(x=>x.id===l.biz);top=`<span class="eyebrow">Follow up · ${esc(bz.short)}${due.length>1?` · ${due.length-1} more due`:''}</span><h3>${esc(l.name)}</h3><p class="muted">${esc(l.next||'Check in')}${l.interest?' · '+esc(l.interest):''}</p><div class="row" style="margin-top:var(--space-4)"><button class="btn" data-lead="${l.id}">Open lead</button></div>`}
  else if(ns){top=`<span class="eyebrow">Next step · ${esc(b.short)} · ${ns.i+1} of ${b.steps.length}</span><h3 style="font-size:var(--text-lg)">${esc(ns.t[0])}</h3>${ns.t[1]?`<p class="small"><a href="${ns.t[1]}" target="_blank" rel="noopener">Open the link</a></p>`:''}<div class="row" style="margin-top:var(--space-4)"><button class="btn" data-bstep="${ns.i}">Done (+3 φόρα)</button></div>`}
  else top=`<span class="eyebrow">${esc(b.short)}</span><h3>Every step is done</h3><p class="muted">Keep the follow-ups going.</p>`;
  const stageCount=STAGES.map(s=>[s,leads.filter(l=>l.stage===s).length]);
  return `<h1 class="section-title">Sell</h1>
  <p class="lede">One next action at a time. Due follow-ups come first, then the next concrete step for the business you’re viewing.</p>
  ${sellSeg()}
  <article class="card up-next">${top}</article>
  <div class="stats"><div class="stat"><b>${done}/${b.steps.length}</b><span>steps done</span></div><div class="stat"><b>${leads.filter(l=>!['Won','Not now'].includes(l.stage)).length}</b><span>open leads</span></div><div class="stat"><b>${b.id==='ride'?'$'+rev.toFixed(0):wk}</b><span>${b.id==='ride'?'sales, last 30 days':'follow-ups this week'}</span></div></div>
  <p class="small muted">${esc(b.lede)}</p>
  ${b.rules?`<div class="safety" style="margin-top:var(--space-3)">${esc(b.rules)} <a href="${b.rulesUrl}" target="_blank" rel="noopener">Source</a></div>`:''}
  <div class="row" style="margin-top:var(--space-4)"><button class="btn" data-newlead>+ Add a lead</button>${b.id==='ride'?'<button class="btn ghost" data-sale>+ Log a sale</button>':''}${b.id==='freq'?'':'<button class="btn ghost small" data-carcard>Car card with QR</button>'}</div>
  <h2 class="sub-title">Pipeline</h2>
  <div class="filters">${stageCount.map(([s,n])=>`<span class="chip" aria-pressed="false">${s} ${n}</span>`).join('')}</div>
  <div class="card">${leads.length?leads.sort((x,y)=>(x.nextDate||'9').localeCompare(y.nextDate||'9')).map(l=>`<button class="entry lead-row" data-lead="${l.id}"><div><div class="entry-title">${esc(l.name)}</div><div class="entry-meta"><span class="badge ${l.stage==='Won'?'hands':''}">${esc(l.stage)}</span>${l.source?`<span>${esc(l.source)}</span>`:''}${l.nextDate?`<span>${l.nextDate<=today()?'Due ':''}${fmtDate(l.nextDate)}</span>`:''}</div></div><span class="xs muted">${(l.touches||[]).length} touches</span></button>`).join(''):'<p class="empty">No leads yet. Add the first person who showed interest.</p>'}</div>
  <h2 class="sub-title">Concrete steps</h2>
  <div class="card">${b.steps.map(([t,u],i)=>`<label class="entry step-row"><span class="row" style="flex-wrap:nowrap;align-items:flex-start;gap:var(--space-3)"><input type="checkbox" data-bstepchk="${i}" ${d[i]?'checked':''}><span class="small">${esc(t)}${u?` <a href="${u}" target="_blank" rel="noopener">Link</a>`:''}${d[i]?` <span class="xs muted">· ${fmtDate(d[i])}</span>`:''}</span></span></label>`).join('')}</div>
  <h2 class="sub-title">Scripts</h2>
  <div class="stack">${b.scripts.map(([h,t])=>`<div class="card"><span class="eyebrow">${esc(h)}</span><p class="small" style="margin-top:var(--space-2)">${esc(t)}</p><button class="btn ghost small" style="margin-top:var(--space-2)" data-copy="${esc(t)}">Copy</button></div>`).join('')}</div>${b.id==='freq'?freqHtml():''}`;
}
function freqHtml(){const F=window.FREQ;const have=new Set(S.leads.filter(l=>l.biz==='freq').map(l=>l.name));
  return `<h2 class="sub-title">People to talk to</h2>
  <div class="stack">${F.people.map((p,i)=>`<div class="card"><span class="eyebrow">${esc(p.r)}</span><h4 style="margin:var(--space-1) 0">${esc(p.n)}</h4><p class="small"><b>Why:</b> ${esc(p.why)}</p><p class="small"><b>Ask:</b> ${esc(p.ask)}</p><p class="small muted">${esc(p.how)} · <a href="${p.u}" target="_blank" rel="noopener">Open</a></p><div class="row" style="margin-top:var(--space-2)">${have.has(p.n)?'<span class="badge hands">In pipeline</span>':`<button class="btn ghost small" data-addppl="${i}">Add to pipeline</button>`}</div></div>`).join('')}</div>
  <h2 class="sub-title">Ways to fund it</h2>
  <div class="card">${F.money.map(m=>`<div class="entry"><div><div class="entry-title">${esc(m[0])}</div><div class="small">${esc(m[1])}${m[2]?` <a href="${m[2]}" target="_blank" rel="noopener">Source</a>`:''}</div></div></div>`).join('')}</div>
  <h2 class="sub-title">Approaches to study</h2>
  <div class="card">${F.study.map(m=>`<div class="entry"><div><div class="entry-title">${esc(m[0])}</div><div class="small">${esc(m[1])} <a href="${m[2]}" target="_blank" rel="noopener">Read</a></div></div></div>`).join('')}</div>`;
}
function stepDone(bid,i){S.bizSteps[bid]=S.bizSteps[bid]||{};S.bizSteps[bid][i]=today();const b=BIZ.find(x=>x.id===bid);addEntry({title:b.short+' step: '+b.steps[i][0].slice(0,90),skill:bid==='tour'?'xp_course':bid==='freq'?'ld_curr':'biz_offer',skill2:'biz_sales',mode:'handson',points:3});toast('+3 φόρα')}
function editLead(id){
  const l=S.leads.find(x=>x.id===id)||{biz:bizTab,stage:'New'};
  openSheet(id?'Edit lead':'New lead',`<form class="form" id="lForm">
  <label class="f">Business<select name="biz">${BIZ.map(b=>`<option value="${b.id}" ${b.id===l.biz?'selected':''}>${esc(b.name)}</option>`).join('')}</select></label>
  <label class="f">Name<input type="text" name="name" required maxlength="80" value="${esc(l.name)}"></label>
  <label class="f">Phone or email (only if they offered it)<input type="text" name="contact" maxlength="120" value="${esc(l.contact)}"></label>
  <label class="f">Where you met<input type="text" name="source" maxlength="80" list="srcList" value="${esc(l.source)}"><datalist id="srcList"><option value="Tasting"><option value="Texted from car card"><option value="Restaurant visit"><option value="Church"><option value="Greek class"><option value="Referral"><option value="Online"></datalist></label>
  <label class="f">What they care about<input type="text" name="interest" maxlength="160" value="${esc(l.interest)}"></label>
  <label class="f">Stage<select name="stage">${STAGES.map(s=>`<option ${s===l.stage?'selected':''}>${s}</option>`).join('')}</select></label>
  <label class="f">Next step<input type="text" name="next" maxlength="160" value="${esc(l.next)}" placeholder="Text the tasting photo"></label>
  <label class="f">When<input type="date" name="nextDate" value="${esc(l.nextDate||'')}"></label>
  <button class="btn" type="submit">Save lead</button></form>`);
  $('#lForm').addEventListener('submit',ev=>{ev.preventDefault();const f=Object.fromEntries(new FormData(ev.target));
    if(id){const prev=l.stage;Object.assign(l,f);if(prev!==f.stage)stageEntry(l)}else{const n=Object.assign({id:uid(),created:today(),touches:[]},f);S.leads.push(n);addEntry({title:'New lead: '+n.name,skill:'biz_sales',mode:'handson',points:1});toast('+1 φόρα')}
    save();closeSheet()});
}
function stageEntry(l){const won=l.stage==='Won';addEntry({title:(won?'Won: ':'Moved to '+l.stage+': ')+l.name,skill:'biz_sales',mode:won?'tested':'handson',points:won?6:2});toast(won?'Won. +6 φόρα':'+2 φόρα')}
function openLead(id){
  const l=S.leads.find(x=>x.id===id);const b=BIZ.find(x=>x.id===l.biz);
  openSheet(l.name,`<p class="small muted">${esc(b.name)}${l.source?' · '+esc(l.source):''}${l.contact?' · '+esc(l.contact):''}</p>
  ${l.interest?`<p class="small">Cares about: ${esc(l.interest)}</p>`:''}
  <div><p class="small" style="margin-bottom:var(--space-2)">Stage</p><div class="seg" id="lst">${STAGES.map(s=>`<button type="button" data-st="${s}" aria-pressed="${s===l.stage}">${s}</button>`).join('')}</div></div>
  <div class="card stack"><span class="eyebrow">Log a touch</span><div class="seg" id="lk">${['Text','Call','Met','Tasting','Email'].map((k,i)=>`<button type="button" data-k="${k}" aria-pressed="${i===0}">${k}</button>`).join('')}</div>
  <label class="f">What happened?<input type="text" id="ln" maxlength="200"></label>
  <label class="f">Next step<input type="text" id="lnext" maxlength="160" value="${esc(l.next)}"></label>
  <label class="f">When<input type="date" id="ld" value="${(()=>{const d=new Date();d.setDate(d.getDate()+2);return d.toISOString().slice(0,10)})()}"></label>
  <button class="btn" id="lsave">Save touch (+1 φόρα)</button></div>
  <div class="row"><button class="btn ghost small" id="ledit">Edit</button>${l.contact&&/^[+\d\s()-]{7,}$/.test(l.contact)?`<a class="btn ghost small" href="sms:${esc(l.contact.replace(/[^\d+]/g,''))}">Text</a>`:''}</div>
  ${(l.touches||[]).length?`<h3 class="sub-title">History</h3>${l.touches.slice().reverse().map(t=>`<div class="insight"><span class="xs muted">${fmtDate(t.date)} · ${esc(t.kind)}</span><p class="small">${esc(t.note)}</p></div>`).join('')}`:''}`);
  let kind='Text';const bd=$('#sheetBody');
  bd.querySelectorAll('[data-k]').forEach(x=>x.addEventListener('click',()=>{kind=x.dataset.k;bd.querySelectorAll('[data-k]').forEach(y=>y.setAttribute('aria-pressed',y===x))}));
  bd.querySelectorAll('[data-st]').forEach(x=>x.addEventListener('click',()=>{if(l.stage===x.dataset.st)return;l.stage=x.dataset.st;save();stageEntry(l);bd.querySelectorAll('[data-st]').forEach(y=>y.setAttribute('aria-pressed',y===x))}));
  $('#ledit').addEventListener('click',()=>editLead(id));
  $('#lsave').addEventListener('click',()=>{l.touches=l.touches||[];l.touches.push({date:today(),kind,note:$('#ln').value.trim()});l.next=$('#lnext').value.trim();l.nextDate=$('#ld').value;addEntry({title:kind+' with '+l.name,skill:'biz_sales',mode:'handson',points:1});toast('+1 φόρα');closeSheet()});
}
function logSale(){
  openSheet('Log a sale',`<form class="form" id="sForm"><label class="f">Amount ($)<input type="number" name="amount" step="0.01" min="0" required inputmode="decimal"></label><label class="f">What sold<input type="text" name="items" maxlength="120" placeholder="2 waters, 1 cable"></label><button class="btn" type="submit">Save</button></form>`);
  $('#sForm').addEventListener('submit',ev=>{ev.preventDefault();const f=Object.fromEntries(new FormData(ev.target));S.sales.push({date:today(),biz:'ride',amount:+f.amount,items:f.items});addEntry({title:'Ride sale $'+(+f.amount).toFixed(2),skill:'biz_sales',mode:'tested',points:2});toast('+2 φόρα');closeSheet()});
}
function carCard(){
  const kinds={OLIVE:'Curious about Greek olive oil? Text OLIVE for an invite to a free tasting.',TOUR:'Dreaming of Greece at harvest? Text TOUR for the one-page trip plan.'};
  let k='OLIVE';
  function draw(){const link='sms:'+S.sellPhone.replace(/[^\d+]/g,'')+'?&body='+k;let svg='';try{const q=qrcode(0,'M');q.addData(link);q.make();svg=q.createSvgTag({cellSize:5,margin:2,scalable:true})}catch(e){svg='<p class="small">QR unavailable.</p>'}
    $('#sheetBody').innerHTML=`<div class="seg">${Object.keys(kinds).map(x=>`<button type="button" data-ck="${x}" aria-pressed="${x===k}">${x}</button>`).join('')}</div>
    <label class="f">Your number<input type="tel" id="cph" value="${esc(S.sellPhone)}"></label>
    <div class="car-card" id="carPrint"><div class="cc-qr">${svg}</div><div><p class="cc-t">${esc(kinds[k])}</p><p class="cc-s">Text <b>${k}</b> to ${esc(S.sellPhone)}</p><p class="cc-f">For products and events only. All rides go through the Uber app.</p></div></div>
    <button class="btn" id="cprint">Print card</button><p class="note">Riders opt in by texting you, so there’s no pitch. Add them as leads when they text.</p>`;
    $('#sheetBody').querySelectorAll('[data-ck]').forEach(x=>x.addEventListener('click',()=>{k=x.dataset.ck;draw()}));
    $('#cph').addEventListener('change',e=>{S.sellPhone=e.target.value.trim()||S.sellPhone;save();draw()});
    $('#cprint').addEventListener('click',()=>{document.body.classList.add('printing-card');window.print();setTimeout(()=>document.body.classList.remove('printing-card'),500)});}
  openSheet('Car card','');draw();
}
function bindSell(v){
  v.querySelectorAll('[data-biz]').forEach(b=>b.addEventListener('click',()=>{bizTab=b.dataset.biz;render()}));
  v.querySelectorAll('[data-lead]').forEach(b=>b.addEventListener('click',()=>openLead(b.dataset.lead)));
  v.querySelectorAll('[data-addppl]').forEach(b=>b.addEventListener('click',()=>{const p=FREQ.people[+b.dataset.addppl];S.leads.push({id:uid(),created:today(),touches:[],biz:'freq',name:p.n,contact:p.how,source:'Research',interest:p.ask,stage:'New',next:'Send the first message',nextDate:today()});addEntry({title:'New partner lead: '+p.n,skill:'biz_sales',mode:'handson',points:1});toast('Added · +1 φόρα');render()}));
  v.querySelectorAll('[data-newlead]').forEach(b=>b.addEventListener('click',()=>editLead(null)));
  v.querySelectorAll('[data-sale]').forEach(b=>b.addEventListener('click',logSale));
  v.querySelectorAll('[data-carcard]').forEach(b=>b.addEventListener('click',carCard));
  v.querySelectorAll('[data-bstep]').forEach(b=>b.addEventListener('click',()=>{stepDone(bizTab,+b.dataset.bstep);render()}));
  v.querySelectorAll('[data-bstepchk]').forEach(c=>c.addEventListener('change',()=>{const i=+c.dataset.bstepchk;if(c.checked)stepDone(bizTab,i);else{delete S.bizSteps[bizTab][i];save()}render()}));
  v.querySelectorAll('[data-copy]').forEach(b=>{b.dataset.cb=1;b.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(b.dataset.copy);toast('Copied')}catch(e){toast('Copy failed on this browser.')}})});
}


/* ---------- index-card methods ---------- */
function cardState(){S.cardm=S.cardm||{};return S.cardm}
function cardOfDay(){const st=cardState();const t=CARD_METHODS.find(m=>st[m.id]&&st[m.id].date===today());if(t)return {m:t,done:true};const n=CARD_METHODS.find(m=>!st[m.id]);return n?{m:n,done:false}:{m:CARD_METHODS[dayOfYear()%CARD_METHODS.length],done:false,all:true}}
function openCard(id){
  const m=CARD_METHODS.find(x=>x.id===id);const st=cardState()[id];const n=CARD_METHODS.indexOf(m)+1;
  openSheet('Card '+n+' of '+CARD_METHODS.length+': '+m.name,`<div class="stack">
  <div class="row" style="align-items:center;gap:var(--space-3)">${cardIcon(m,72)}<div><p class="eyebrow">${esc(m.who)}</p><p><b>${esc(m.tag)}</b></p></div></div>
  <p>${esc(m.what)}</p>
  <h4>Best practices</h4><ul class="tight">${m.how.map(h=>`<li>${esc(h)}</li>`).join('')}</ul>
  <div class="card up-next"><span class="eyebrow">Try it today · about 15 minutes</span><p>${esc(m.tryToday)}</p><p class="small muted">You need: ${esc(m.mats)}</p></div>
  <p class="small"><b>Common mistake:</b> ${esc(m.pitfall)}</p>
  <p class="small">Read more: ${m.links.map(l=>`<a href="${l.u}" target="_blank" rel="noopener">${esc(l.t)}</a>`).join(' · ')}</p>
  ${st?`<p class="note">Tried ${esc(fmtDate(st.date))} · ${'★'.repeat(st.rating||0)}${st.notes?' · “'+esc(st.notes)+'”':''}</p>`:''}
  <form class="form" id="cmForm"><label class="f">How did it go? Keep it, tweak it, or drop it?<textarea name="notes" rows="3">${esc(st&&st.notes)}</textarea></label>
  <div class="row" role="radiogroup" aria-label="Rating">${[1,2,3,4,5].map(i=>`<label class="chip"><input type="radio" name="rating" value="${i}" ${st&&st.rating===i?'checked':''}> ${i}★</label>`).join('')}</div>
  <button class="btn" type="submit">${st?'Update':'I tried it'}</button></form></div>`);
  $('#cmForm').addEventListener('submit',ev=>{ev.preventDefault();const f=new FormData(ev.target);const first=!cardState()[id];
    cardState()[id]={date:first?today():st.date,rating:+f.get('rating')||0,notes:(f.get('notes')||'').trim()};
    if(first){addEntry({title:'Index cards: tried '+m.name,skill:'mind_cards',skill2:id==='nabokov'?'fic_draft':undefined,mode:'practice',points:2});toast('+2 φόρα · next method tomorrow')}else{save();toast('Saved')}
    closeSheet();render()});
}
function openCardShelf(){const st=cardState();
  openSheet('Index-card methods',`<p class="small muted">One a day, in order. Each takes about 15 minutes. Your ratings show which to keep.</p>
  <div class="shelf">${CARD_METHODS.map((m,i)=>`<button class="shelf-item" data-cm="${m.id}">${cardIcon(m,48)}<span><b>${i+1}. ${esc(m.name)}</b><span class="xs muted">${st[m.id]?'Tried · '+'★'.repeat(st[m.id].rating||0):esc(m.tag)}</span></span></button>`).join('')}</div>`);
  $('#sheetBody').querySelectorAll('[data-cm]').forEach(b=>b.addEventListener('click',()=>openCard(b.dataset.cm)));
}

/* ---------- life: promises and the paper clip game ---------- */
function lifeInit(){S.promises=S.promises||[];S.clip=S.clip||{goal:'',trades:[],offers:[]};S.identity=S.identity||'';if(!S.coffeeAdded&&S.promises.length){if(!S.promises.some(p=>p.tag==='coffee'))S.promises.push({id:uid(),kind:'daily',tag:'coffee',text:'A little coffee to clean and organize, then rest in that clean feeling',why:'Coffee is the cue. Tidy one small spot, then sit a minute in it.',clips:1,log:{},created:today()});S.coffeeAdded=1;save()}}
function clipNow(){const t=S.clip.trades;return t.length?t[t.length-1].got:'One red paper clip'}
function promiseStreak(p){let n=0;const d=new Date();if(((p.log||{})[today()]||0)<p.clips)d.setDate(d.getDate()-1);for(;;){const k=d.toISOString().slice(0,10);if(((p.log||{})[k]||0)>=p.clips){n++;d.setDate(d.getDate()-1)}else break}return n}
function jarSvg(n,color){const show=Math.min(n,12);let c='';for(let i=0;i<show;i++){const x=8+(i%4)*8,y=44-Math.floor(i/4)*9,r=(i*37)%50-25;c+=`<rect x="${x}" y="${y}" width="9" height="4" rx="2" fill="none" stroke="${color}" stroke-width="1.6" transform="rotate(${r} ${x+4} ${y+2})"/>`}
 return `<svg width="48" height="58" viewBox="0 0 48 58" aria-hidden="true"><path d="M6 12h36v38a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6z" fill="#fffdf7" stroke="#8a8670" stroke-width="1.6"/><rect x="4" y="6" width="40" height="6" rx="2" fill="#d8d2bd"/>${c}${n>12?`<text x="24" y="22" text-anchor="middle" font-size="9" fill="#555">+${n-12}</text>`:''}</svg>`}
function viewLife(){lifeInit();
  const tr=S.clip.trades,of=S.clip.offers;const wkOff=of.filter(o=>daysSince(o.date)<7).length+tr.filter(t=>daysSince(t.date)<7).length;
  const daily=S.promises.filter(p=>p.kind==='daily'),todo=S.promises.filter(p=>p.kind==='once'&&!p.kept),kept=S.promises.filter(p=>p.kind==='once'&&p.kept);
  const game=!S.clip.goal?`<span class="eyebrow">Start here · the paper clip game</span><h3>Trade one red paper clip up, one person at a time</h3><p class="muted">${esc(CLIP_GAME.story.split('. ').slice(0,3).join('. '))}.</p><div class="row" style="margin-top:var(--space-4)"><button class="btn" id="clipStart">Start the game</button></div>`
   :`<span class="eyebrow">The paper clip game · trade ${tr.length} · ${wkOff}/3 offers this week</span><h3>You have: ${esc(clipNow())}</h3><p class="muted">Aiming for: ${esc(S.clip.goal)}</p>
   <div class="chain">${['One red paper clip'].concat(tr.map(t=>t.got)).map((x,i)=>`<span class="link-chip${i===tr.length?' now':''}">${esc(x)}</span>`).join('<span class="arr">→</span>')}</div>
   <div class="row" style="margin-top:var(--space-4)"><button class="btn" id="clipTrade">Log a trade (+5)</button><button class="btn ghost" id="clipOffer">I offered it (+1)</button><button class="btn ghost" id="clipPost">Copy a trade post</button><button class="btn ghost small" id="clipRules">Rules</button></div>`;
  return `<h1 class="section-title">Life</h1>
  <p class="lede">Promises to yourself and the person you’re growing into. Small, kept, every day.</p>
  <button class="identity" id="idEdit">${S.identity?`<span class="eyebrow">Who I’m becoming</span><span class="id-t">I am someone who ${esc(S.identity)}</span>`:'<span class="eyebrow">Who I’m becoming</span><span class="id-t muted">Finish the sentence: I am someone who…</span>'}</button>
  ${unHtml()}
  ${hallHtml()}
  ${startHtml()}
  ${distillHtml()}
  ${moneyHtml()}
  <article class="card up-next">${game}</article>
  ${compactHtml()}
  ${shopHtml()}
  <h2 class="sub-title">Daily promises</h2>
  <p class="small muted" style="margin-bottom:var(--space-3)">${esc(CLIP_JAR.what)} <a href="${CLIP_JAR.link.u}" target="_blank" rel="noopener">${esc(CLIP_JAR.link.t)}</a></p>
  ${daily.length?`<div class="grid2">${daily.map(p=>{const m=(p.log||{})[today()]||0;const full=m>=p.clips;return `<div class="card promise${full?' kept':''}"><div class="jars"><button class="jar-btn" data-clip="${p.id}" ${full?'disabled':''} aria-label="Move one clip for ${esc(p.text)}">${jarSvg(p.clips-m,'#8a8670')}<span class="xs">to go</span></button><span class="arr">→</span><span class="jar-btn">${jarSvg(m,'#b5523b')}<span class="xs">done</span></span></div><div class="p-body"><h4>${esc(p.text)}</h4><p class="xs muted">${full?'Kept today':m+' of '+p.clips+' today'} · ${promiseStreak(p)} day streak</p>${p.why?`<p class="small">${esc(p.why)}</p>`:''}<button class="linkish xs" data-pdel="${p.id}">Remove</button></div></div>`}).join('')}</div>`:`<div class="card"><p class="small">No daily promises yet. Start with the three minimums you already chose.</p><div class="row" style="margin-top:var(--space-3)"><button class="btn small" id="seedMins">Add chant, practice, workout and coffee reset</button></div></div>`}
  <h2 class="sub-title">Life to-do</h2>
  ${todo.length?`<div class="card">${todo.map(p=>`<label class="step-row entry"><input type="checkbox" data-keep="${p.id}"><div><div class="entry-title">${esc(p.text)}</div>${p.why?`<div class="entry-meta"><span>${esc(p.why)}</span></div>`:''}</div></label>`).join('')}</div>`:'<p class="empty">Things you’ve promised yourself you’ll do once: be at the family harvest, see Meteora, finish the novel.</p>'}
  <div class="row" style="margin-top:var(--space-3)"><button class="btn ghost small" id="pNew">+ Add a promise</button></div>
  ${kept.length?`<h2 class="sub-title">Kept</h2><div class="card">${kept.slice().reverse().map(p=>`<div class="entry"><div><div class="entry-title">${esc(p.text)}</div><div class="entry-meta"><span>Kept ${esc(fmtDate(p.kept))}</span></div></div></div>`).join('')}</div>`:''}
  ${tr.length?`<h2 class="sub-title">Trade stories</h2><div class="card">${tr.slice().reverse().map((t,i)=>`<div class="entry"><div><div class="entry-title">${esc(t.gave)} → ${esc(t.got)}</div><div class="entry-meta"><span>${esc(fmtDate(t.date))}</span><span>${esc(t.who||'')}</span></div>${t.lesson?`<p class="small">“${esc(t.lesson)}”</p>`:''}</div></div>`).join('')}</div>`:''}`;
}
function clipRules(){openSheet('The paper clip game',`<div class="stack"><p>${esc(CLIP_GAME.story)}</p><p class="small muted">${esc(CLIP_GAME.caveat)}</p><h4>Rules</h4><ol class="tight">${CLIP_GAME.rules.map(r=>`<li>${esc(r)}</li>`).join('')}</ol><p class="small">${CLIP_GAME.links.map(l=>`<a href="${l.u}" target="_blank" rel="noopener">${esc(l.t)}</a>`).join(' · ')}</p></div>`)}
function bindLife(v){
  const on=(id,fn)=>{const e=v.querySelector('#'+id);if(e)e.addEventListener('click',fn)};
  on('clipRules',clipRules);
  on('clipStart',()=>{openSheet('Start the paper clip game',`<div class="stack"><p class="small">${esc(CLIP_GAME.story)}</p><p class="small muted">${esc(CLIP_GAME.caveat)}</p><ol class="tight">${CLIP_GAME.rules.map(r=>`<li>${esc(r)}</li>`).join('')}</ol>
   <form class="form" id="cgForm"><label class="f">What would be fun to trade up to? (You can change it later.)<input type="text" name="goal" required maxlength="80" placeholder="A guitar, a flight to Greece, a used car…"></label><button class="btn" type="submit">Find a red paper clip and begin</button></form></div>`);
   $('#cgForm').addEventListener('submit',ev=>{ev.preventDefault();S.clip.goal=new FormData(ev.target).get('goal').trim();save();closeSheet();render();toast('Game on. Offer the clip to three people this week.')})});
  on('clipTrade',()=>{openSheet('Log a trade',`<form class="form" id="ctForm"><label class="f">You gave<input type="text" name="gave" required maxlength="80" value="${esc(clipNow())}"></label><label class="f">You got<input type="text" name="got" required maxlength="80"></label><label class="f">Who (first name)<input type="text" name="who" maxlength="40"></label><label class="f">Where you met<input type="text" name="where" maxlength="80"></label><label class="f">What did they care about? One detail about them.<textarea name="lesson" rows="3"></textarea></label>${(S.shelf||[]).some(i=>i.status==='shelf')?`<p class="small muted">Sweeteners from your trade shelf, if any went along:</p><div>${S.shelf.filter(i=>i.status==='shelf').map(i=>`<label class="step-row entry"><input type="checkbox" name="sw" value="${i.id}"><div><div class="entry-title">${esc(i.name)}</div></div></label>`).join('')}</div>`:''}<label class="f">Is what you got bigger than what you gave?<select name="bigger"><option value="no">No, same size or smaller</option><option value="yes">Yes, it takes more room</option></select></label><button class="btn" type="submit">Save trade</button></form>`);
   $('#ctForm').addEventListener('submit',ev=>{ev.preventDefault();const fd=new FormData(ev.target);const sw=fd.getAll('sw');const f=Object.fromEntries(fd);delete f.sw;f.date=today();shelfInit();const swi=S.shelf.filter(i=>sw.includes(i.id));swi.forEach(i=>itemOut(i,'traded'));if(swi.length)f.gave+=' + '+swi.map(i=>i.name).join(', ');const big=f.bigger==='yes';delete f.bigger;S.clip.trades.push(f);if(big)S.promises.push({id:uid(),kind:'once',text:'One in, one out: let something about the size of '+f.got+' leave this week',why:'From the paper clip trade on '+fmtDate(today()),clips:1,log:{},created:today()});addEntry({title:'Paper clip trade: '+f.gave+' → '+f.got,skill:'life_trade',skill2:'biz_sales',mode:'tested',points:5});toast(big?'+5 φόρα · one-out promise added':'+5 φόρα');closeSheet();render()})});
  on('clipOffer',()=>{S.clip.offers.push({date:today(),item:clipNow()});addEntry({title:'Offered '+clipNow()+' for trade',skill:'life_trade',mode:'practice',points:1});toast('+1 φόρα · a no still counts');render()});
  on('clipPost',()=>{const t=CLIP_GAME.post.replace('[ITEM]',clipNow());navigator.clipboard&&navigator.clipboard.writeText(t).then(()=>toast('Post copied'),()=>toast('Copy failed'));});
  on('idEdit',()=>{openSheet('Who I’m becoming',`<form class="form" id="idForm"><p class="small muted">James Clear’s idea: every kept promise is a vote for the person you want to be.</p><label class="f">I am someone who…<input type="text" name="t" maxlength="120" value="${esc(S.identity)}" placeholder="keeps small promises to himself"></label><button class="btn" type="submit">Save</button></form>`);$('#idForm').addEventListener('submit',ev=>{ev.preventDefault();S.identity=new FormData(ev.target).get('t').trim();save();closeSheet();render()})});
  on('seedMins',()=>{[['Chant','Morning, before anything else'],['Practice','My daily practice rep'],['Workout','9 AM, phone stays in the car']].forEach(([t,w])=>S.promises.push({id:uid(),kind:'daily',text:t,why:w,clips:1,log:{},created:today()}));if(!S.promises.some(p=>p.tag==='coffee'))S.promises.push({id:uid(),kind:'daily',tag:'coffee',text:'A little coffee to clean and organize, then rest in that clean feeling',why:'Coffee is the cue. Tidy one small spot, then sit a minute in it.',clips:1,log:{},created:today()});S.coffeeAdded=1;save();render()});
  on('pNew',()=>{openSheet('New promise',`<form class="form" id="pForm"><label class="f">I promise myself I will…<input type="text" name="text" required maxlength="100"></label><label class="f">Kind<select name="kind"><option value="daily">Every day (paper clip jar)</option><option value="once">Once (life to-do)</option></select></label><label class="f">Clips per day (daily only)<input type="number" name="clips" min="1" max="120" value="1"></label><label class="f">Why it matters<input type="text" name="why" maxlength="120"></label><button class="btn" type="submit">Make the promise</button></form>`);
   $('#pForm').addEventListener('submit',ev=>{ev.preventDefault();const f=Object.fromEntries(new FormData(ev.target));S.promises.push({id:uid(),kind:f.kind,text:f.text.trim(),why:f.why.trim(),clips:Math.max(1,Math.min(120,+f.clips||1)),log:{},created:today()});save();closeSheet();render()})});
  v.querySelectorAll('[data-clip]').forEach(b=>b.addEventListener('click',()=>{const p=S.promises.find(x=>x.id===b.dataset.clip);p.log=p.log||{};const m=(p.log[today()]||0)+1;p.log[today()]=m;
    if(m===p.clips){addEntry({title:'Promise kept: '+p.text,skill:'life_promise',mode:'practice',points:2});toast('Kept · +2 φόρα')}else{save();toast((p.clips-m)+' to go')}render()}));
  v.querySelectorAll('[data-keep]').forEach(b=>b.addEventListener('change',()=>{const p=S.promises.find(x=>x.id===b.dataset.keep);p.kept=today();addEntry({title:'Kept a promise: '+p.text,skill:'life_promise',mode:'handson',points:3});toast('Promise kept · +3 φόρα');render()}));
  v.querySelectorAll('[data-pdel]').forEach(b=>b.addEventListener('click',()=>{if(confirm('Remove this promise?')){S.promises=S.promises.filter(x=>x.id!==b.dataset.pdel);save();render()}}));
}

/* ---------- compact game ---------- */
function shelfInit(){S.shelf=S.shelf||[];S.compacts=S.compacts||[]}
const SZ=k=>(COMPACT.sizes.find(s=>s[0]===k)||COMPACT.sizes[1]);
function spaceOf(items){return items.reduce((a,i)=>a+SZ(i.size)[2],0)}
function valOf(items){return items.reduce((a,i)=>a+(+i.value||0),0)}
function outJar(){return (S.promises||[]).find(p=>p.tag==='out'&&p.kind==='daily')}
function itemOut(i,how){i.status=how;i.out=today();const p=outJar();if(p){p.log=p.log||{};const m=(p.log[today()]||0)+1;p.log[today()]=m;if(m===p.clips)addEntry({title:'Promise kept: '+p.text,skill:'life_promise',mode:'practice',points:2})}}
function ebayUrl(q){return 'https://www.ebay.com/sch/i.html?_nkw='+encodeURIComponent(q)+'&LH_Sold=1&LH_Complete=1'}
function compactHtml(){shelfInit();
  const on=S.shelf.filter(i=>i.status==='shelf');const out=S.shelf.filter(i=>['traded','given','tossed'].includes(i.status));
  const freed=spaceOf(out);
  return `<h2 class="sub-title">Compact game</h2>
  <div class="card stack"><p class="small">${esc(COMPACT.what)}</p>
  <div class="stats" style="margin:0"><div class="stat"><b>${on.length}</b><span>on the shelf · $${valOf(on)}</span></div><div class="stat"><b>${out.length}</b><span>items out of the house</span></div><div class="stat"><b>${(freed/4).toFixed(freed%4?1:0)}</b><span>shoeboxes of space freed</span></div></div>
  <div class="row"><button class="btn small" id="shAdd">Room sweep</button>${outJar()?'':'<button class="btn ghost small" id="jarOn">Turn on daily items-out jar</button>'}${on.length>=2?'<button class="btn ghost small" id="cpTrade">Trade a bundle for one thing</button>':''}<button class="btn ghost small" id="cpHow">How to play</button></div>
  ${on.length?`<div>${on.map(i=>`<div class="entry"><div><div class="entry-title">${esc(i.name)}</div><div class="entry-meta"><span>${esc(SZ(i.size)[1])}</span><span>${i.value?'$'+esc(i.value):'no price yet'}</span>${i.room?`<span>${esc(i.room)}</span>`:''}${i.story?`<span>${esc(i.story)}</span>`:''}<a href="${ebayUrl(i.name)}" target="_blank" rel="noopener">Sold prices</a></div></div><div class="row" style="gap:4px"><button class="btn ghost small" data-copy="${esc(listingText(i))}">Copy listing</button><button class="btn ghost small" data-shout="${i.id}" data-how="given">Give (church sale)</button><button class="btn ghost small" data-shout="${i.id}" data-how="tossed">Toss</button></div></div>`).join('')}</div>`:'<p class="empty">Shelf is empty. Walk one room for 10 minutes and shelf what you’d trade.</p>'}
  <details class="local-links"><summary class="small"><b>Lexington trading links</b> · Marketplace and local groups</summary>${localLinks()}</details>
  ${S.compacts.length?`<h4>Compactions</h4>${S.compacts.slice().reverse().map(c=>`<div class="entry"><div><div class="entry-title">${c.n} item${c.n===1?"":"s"} → ${esc(c.got)}</div><div class="entry-meta"><span>${esc(fmtDate(c.date))}</span><span>$${c.v0} in ${c.s0} → $${c.v1} in ${c.s1} space</span><span class="badge hands">${c.s1?((c.v1/c.s1)/((c.v0||1)/c.s0)).toFixed(1):'∞'}× value per space</span></div></div></div>`).join('')}`:''}</div>`;
}
function bindCompact(v){
  v.querySelectorAll('.local-links [data-copy], [data-copy]').forEach(b=>{if(b.dataset.cb)return;b.dataset.cb=1;b.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(b.dataset.copy);toast('Listing copied. Paste it into Marketplace.')}catch(e){toast('Copy failed on this browser.')}})});
  const on=(id,fn)=>{const e=v.querySelector('#'+id);if(e)e.addEventListener('click',fn)};
  const sizeSel=n=>`<select name="${n}">${COMPACT.sizes.map(s=>`<option value="${s[0]}" ${s[0]==='shoebox'?'selected':''}>${s[1]}</option>`).join('')}</select>`;
  on('cpHow',()=>{openSheet('Compact game',`<div class="stack"><p>${esc(COMPACT.what)}</p><h4>Rules</h4><ol class="tight">${COMPACT.rules.map(r=>`<li>${esc(r)}</li>`).join('')}</ol><h4>Compact things worth aiming for</h4><ul class="tight">${COMPACT.targets.map(t=>`<li><b>${esc(t[0])}.</b> ${esc(t[1])}</li>`).join('')}</ul><h4>Trading on Facebook</h4><ul class="tight">${COMPACT.fb.map(t=>`<li>${esc(t)}</li>`).join('')}</ul><h4>Lexington links</h4>${localLinks()}<h4>After the clutter</h4><p class="small">The Sidetracked Home Executives card file keeps the house clear once the piles are gone.</p><button class="btn ghost small" id="cpShe">Open that card method</button><p class="small">${COMPACT.links.map(l=>`<a href="${l.u}" target="_blank" rel="noopener">${esc(l.t)}</a>`).join(' · ')}</p></div>`);const sb=$('#cpShe');if(sb)sb.addEventListener('click',()=>{closeSheet();openCard('she')})});
  on('shAdd',()=>{let n={kept:0,shelf:0,given:0,tossed:0};const room0=(S.shelf.length?S.shelf[S.shelf.length-1].room:'')||'';
   openSheet('Room sweep',`<form class="form" id="shForm"><p class="small muted">Pick up one thing at a time and decide. Ten minutes is enough.</p><label class="f">Room<input type="text" name="room" maxlength="40" value="${esc(room0)}" placeholder="Bedroom, studio, kitchen…"></label><label class="f">What is it? Brand and model if it has one.<input type="text" name="name" required maxlength="80"></label>
   <label class="f">Pile<select name="pile"><option value="shelf">Trade shelf</option><option value="given">Give (church sale)</option><option value="tossed">Toss or recycle</option><option value="kept">Keep</option></select></label>
   <div class="ifshelf stack"><label class="f">Size${sizeSel('size')}</label><label class="f">Value guess in dollars (check sold prices later)<input type="number" name="value" min="0" max="100000"></label><label class="f">Its story in one line (where it came from)<input type="text" name="story" maxlength="120"></label></div>
   <p class="xs muted" id="swTally">Nothing sorted yet.</p><div class="row"><button class="btn" type="submit">Next item</button><button class="btn ghost" type="button" id="swDone">Done</button></div></form>`);
   const fm=$('#shForm');const box=fm.querySelector('.ifshelf');fm.pile.addEventListener('change',()=>{box.style.display=fm.pile.value==='shelf'?'':'none'});
   $('#swDone').addEventListener('click',()=>{closeSheet();render()});
   fm.addEventListener('submit',ev=>{ev.preventDefault();const f=Object.fromEntries(new FormData(fm));const it={id:uid(),name:f.name.trim(),room:f.room.trim(),size:f.size||'shoebox',value:f.value?+f.value:0,story:(f.story||'').trim(),status:'shelf',date:today()};S.shelf.push(it);
    if(f.pile==='kept')it.status='kept';else if(f.pile!=='shelf'){itemOut(it,f.pile);addEntry({title:(f.pile==='given'?'Gave away ':'Tossed ')+it.name,skill:'home_ops',mode:'practice',points:1})}
    n[f.pile]++;save();const p=outJar();$('#swTally').textContent=`This sweep: ${n.shelf} to trade, ${n.given} to give, ${n.tossed} tossed, ${n.kept} kept`+(p?` · jar ${(p.log||{})[today()]||0} of ${p.clips}`:'');
    const room=fm.room.value;fm.reset();fm.room.value=room;box.style.display='';fm.name.focus()})});
  on('jarOn',()=>{S.promises.push({id:uid(),kind:'daily',tag:'out',text:'Let 5 things leave the house',why:'Give, toss or trade. Each one moves a clip on its own.',clips:5,log:{},created:today()});save();toast('Jar on');render()});
  on('cpTrade',()=>{const items=S.shelf.filter(i=>i.status==='shelf');openSheet('Trade a bundle for one thing',`<form class="form" id="cpForm"><p class="small muted">Pick what went into the bundle.</p><div>${items.map(i=>`<label class="step-row entry"><input type="checkbox" name="it" value="${i.id}" checked><div><div class="entry-title">${esc(i.name)}</div><div class="entry-meta"><span>${esc(SZ(i.size)[1])}</span><span>$${i.value||0}</span></div></div></label>`).join('')}</div>
   <label class="f">What did you get?<input type="text" name="got" required maxlength="80"></label><label class="f">Its size${sizeSel('gsize').replace('value="pocket"','value="pocket" selected').replace('value="shoebox" selected','value="shoebox"')}</label><label class="f">Its value in dollars<input type="number" name="gval" min="0" max="100000" required></label><label class="f">How<select name="how"><option value="trade">Traded the bundle for it</option><option value="sell">Sold the bundle, then bought it</option></select></label><p class="xs muted" id="cpPrev"></p><button class="btn" type="submit">Save compaction</button></form>`);
   const fm=$('#cpForm');const prev=()=>{const ids=[...fm.querySelectorAll('[name=it]:checked')].map(x=>x.value);const g=S.shelf.filter(i=>ids.includes(i.id));const s1=SZ(fm.gsize.value)[2],v1=+fm.gval.value||0;$('#cpPrev').textContent=`$${valOf(g)} in ${spaceOf(g)} space → $${v1} in ${s1} space`};fm.addEventListener('input',prev);prev();
   fm.addEventListener('submit',ev=>{ev.preventDefault();const ids=[...fm.querySelectorAll('[name=it]:checked')].map(x=>x.value);if(!ids.length){toast('Pick at least one item.');return}const g=S.shelf.filter(i=>ids.includes(i.id));
    const c={date:today(),n:g.length,got:fm.got.value.trim(),v0:valOf(g),s0:spaceOf(g),v1:+fm.gval.value||0,s1:SZ(fm.gsize.value)[2],how:fm.how.value};g.forEach(i=>itemOut(i,'traded'));S.compacts.push(c);
    const better=c.s1<c.s0&&c.v1>=c.v0*0.8;addEntry({title:`Compact: ${c.n} item${c.n===1?"":"s"} → ${c.got}`,skill:'life_trade',skill2:'home_ops',mode:'tested',points:better?8:5});toast(better?'Smaller and worth it · +8 φόρα':'+5 φόρα');closeSheet();render()})});
  v.querySelectorAll('[data-shout]').forEach(b=>b.addEventListener('click',()=>{const i=S.shelf.find(x=>x.id===b.dataset.shout);itemOut(i,b.dataset.how);addEntry({title:(i.status==='given'?'Gave away ':'Tossed ')+i.name,skill:'home_ops',mode:'practice',points:1});toast('Out of the house · +1 φόρα');render()}));
}
function localLinks(){return `<ul class="tight small">${COMPACT.local.map(l=>`<li><a href="${l.u}" target="_blank" rel="noopener">${esc(l.t)}</a>${l.d?' · '+esc(l.d):''}</li>`).join('')}</ul><p class="xs muted">${esc(COMPACT.localNote)}</p>`}
function listingText(i){const want=(COMPACT.targets.slice(0,4).map(t=>t[0].replace(/^(A|An|One) (great |quality |good )?/,'').toLowerCase())).join(', ');
  return `${i.name}${i.story?'\n\n'+i.story:''}\n\n${i.value?'$'+i.value+' or trade':'Make an offer or trade'}. Pickup in Lexington, SC.\nOpen to trades for something smaller: ${want}, or make me an offer.`}
function warmDay(){const d=new Date();return Math.floor((d-new Date(d.getFullYear(),0,0))/864e5)}
function warmCard(){const t=WARMUP.tips[warmDay()%WARMUP.tips.length];const done=S.entries.some(e=>e.date===today()&&/^Warm-up/.test(e.title||''));
  return `<button class="card warm-card" data-open="warm" style="text-align:left;width:100%;margin-top:var(--space-4)"><span class="eyebrow">Morning warm-up${done?' · done today':' · 5 minutes'}</span><h4 style="margin:var(--space-1) 0">${esc(t.t)}</h4><p class="small muted">${esc(t.d)}</p><p class="xs" style="margin-top:var(--space-2)">${t.s.map(x=>esc(x[0])).join(' · ')} · tap to start</p></button>`}
function openWarm(){const t=WARMUP.tips[warmDay()%WARMUP.tips.length];
  openSheet('Morning warm-up',`<div class="stack"><p class="small">${esc(WARMUP.note)}</p><h4>Six steps, about five minutes</h4>${WARMUP.steps.map((s,i)=>`<label class="entry step-row"><span class="row" style="flex-wrap:nowrap;align-items:flex-start;gap:var(--space-3)"><input type="checkbox" class="wchk"><span class="small"><b>${esc(s[0])}.</b> ${esc(s[1])}</span></span></label>`).join('')}
  <label class="f">First thing I’ll open<input type="text" id="wFirst" maxlength="120" placeholder="The Greekquent lesson draft"></label>
  <button class="btn" id="wDone">Warm-up done (+1 φόρα)</button>
  <h4>Today’s pointer: ${esc(t.t)}</h4><p class="small">${esc(t.d)}</p><p class="xs">${t.s.map(x=>`<a href="${x[1]}" target="_blank" rel="noopener">${esc(x[0])}</a>`).join(' · ')}</p>
  <details><summary class="small">All pointers</summary><ul class="tight small">${WARMUP.tips.map(x=>`<li><b>${esc(x.t)}.</b> ${esc(x.d)} ${x.s.map(y=>`<a href="${y[1]}" target="_blank" rel="noopener">${esc(y[0])}</a>`).join(' · ')}</li>`).join('')}</ul></details></div>`);
  $('#wDone').addEventListener('click',()=>{const f=$('#wFirst').value.trim();addEntry({title:'Warm-up'+(f?': then '+f:''),skill:'home_ops',mode:'practice',points:1});toast('+1 φόρα');closeSheet();render()})}
/* ---------- drawings, mobility, run plan, treats ---------- */
function fig(s,w){const out=[];s.split('|').forEach(t=>{const k=t[0],r=t.slice(2).trim(),n=r.replace(/,/g,' ').split(/\s+/).map(Number);
  if(k==='W')out.push(`<line x1="${n[0]}" y1="6" x2="${n[0]}" y2="110" class="fg-wall"/>`);
  else if(k==='F')out.push('<line x1="4" y1="110" x2="156" y2="110" class="fg-floor"/>');
  else if(k==='L')out.push(`<polyline points="${r}" class="fg-body"/>`);
  else if(k==='G')out.push(`<polyline points="${r}" class="fg-ghost"/>`);
  else if(k==='C')out.push(`<circle cx="${n[0]}" cy="${n[1]}" r="8" class="fg-head"/>`);
  else if(k==='T')out.push(`<circle cx="${n[0]}" cy="${n[1]}" r="8" class="fg-target"/>`);
  else if(k==='O')out.push(`<circle cx="${n[0]}" cy="${n[1]}" r="${n[2]}" class="fg-arrow"/>`);
  else if(k==='E')out.push(`<ellipse cx="${n[0]}" cy="${n[1]}" rx="${n[2]}" ry="${n[3]}" class="fg-head"/>`);
  else if(k==='R')out.push(`<rect x="${n[0]}" y="${n[1]}" width="${n[2]}" height="${n[3]}" class="fg-prop"/>`);
  else if(k==='P')out.push(`<path d="${r}" class="fg-body"/>`);
  else if(k==='A')out.push(`<path d="M${n[0]},${n[1]} Q${n[2]},${n[3]} ${n[4]},${n[5]}" class="fg-arrow" marker-end="url(#fgArr)"/>`)});
  return `<svg class="fig" viewBox="0 -6 160 122" width="${w||160}" role="img" aria-hidden="true"><defs><marker id="fgArr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--gold)"/></marker></defs>${out.join('')}</svg>`}
function moveInit(){S.run=S.run||{week:0,logs:[]};S.treats=S.treats||{cur:null,log:[],claimed:[]}}
const exById=id=>MOVE.ex.find(e=>e.id===id);
function moveSuggest(){const d=new Date().getDay();return MOVE.routines.find(r=>r.id===([1,3,5].includes(d)?'strong':'daily'))}
function moveMini(){moveInit();const r=moveSuggest();const done=S.entries.some(e=>e.date===today()&&/^Mobility/.test(e.title||''));
  return `<button class="mini card-mini" data-open="move">${fig(exById(r.ids[0]).fig,64)}<span class="eyebrow">Mobility · ${done?'done today':'run-ready'}</span><h4>${esc(r.name)} · ${esc(r.time)}</h4><p>Week ${S.run.week+1} of the return-to-run plan. Drawings for every move.</p></button>`}
function openMove(){moveInit();const R=S.run,wk=R.logs.filter(l=>l.week===R.week),ok=wk.filter(l=>l.pain<=5&&l.am!=='worse').length;
  const last=R.logs[R.logs.length-1],red=last&&last.week===R.week&&(last.pain>5||last.am==='worse');const pend=R.logs.find(l=>l.am==null&&l.date!==today());
  const areas=[...new Set(MOVE.ex.map(e=>e.area))];
  openSheet('Mobility and running',`<div class="stack"><p class="small">${esc(MOVE.note)}</p>
  <div class="routine-grid">${MOVE.routines.map(r=>`<button class="mini" data-rt="${r.id}"><span class="eyebrow">${esc(r.time)}${r.id===moveSuggest().id?' · today':''}</span><h4>${esc(r.name)}</h4><p class="xs">${esc(r.why)}</p></button>`).join('')}</div>
  <article class="card"><span class="eyebrow">Return to running · ${esc(MOVE.run[R.week][0])} · ${ok} of 3 sessions</span><h4 style="margin:var(--space-1) 0">${esc(MOVE.run[R.week][1])}</h4><p class="xs muted">${esc(MOVE.runNote)}</p>
   ${pend?`<div class="notice small" style="margin-top:var(--space-3)">Morning check for the ${fmtDate(pend.date)} run: are you back to your usual?<div class="row" style="margin-top:var(--space-2)"><button class="btn small" data-am="ok">Same or better</button><button class="btn ghost small" data-am="worse">Worse</button></div></div>`:''}
   ${red?`<p class="small" style="color:var(--warn);margin-top:var(--space-3)">Last run was in the red. Repeat this week, or step back one.</p>`:''}
   <div class="row" style="margin-top:var(--space-3);align-items:flex-end"><label class="f" style="flex:1">Pain during the run, 0 to 10<select id="runPain">${[0,1,2,3,4,5,6,7,8,9,10].map(i=>`<option>${i}</option>`).join('')}</select></label><button class="btn" id="runLog">Log this run (+2)</button></div>
   <div class="row" style="margin-top:var(--space-2)">${ok>=3&&R.week<MOVE.run.length-1?`<button class="btn small" id="runUp">Move to ${esc(MOVE.run[R.week+1][0])}</button>`:''}${R.week>0?`<button class="btn ghost small" id="runDown">Step back a week</button>`:''}</div>
   <details style="margin-top:var(--space-3)"><summary class="small">All 8 weeks</summary><ol class="tight small">${MOVE.run.map((w,i)=>`<li${i===R.week?' style="font-weight:700"':''}>${esc(w[1])}</li>`).join('')}</ol></details></article>
  <h4>Pain traffic light</h4><ul class="tight small">${MOVE.pain.map(p=>`<li><b>${esc(p[0])}.</b> ${esc(p[1])}</li>`).join('')}</ul><p class="xs"><a href="${MOVE.painSrc[1]}" target="_blank" rel="noopener">${esc(MOVE.painSrc[0])}</a></p>
  <details><summary class="small">All ${MOVE.ex.length} moves with drawings</summary>${areas.map(a=>`<h4 style="margin-top:var(--space-4)">${a}</h4><div class="ex-grid">${MOVE.ex.filter(e=>e.area===a).map(e=>`<div class="ex-card">${fig(e.fig)}<b class="small">${esc(e.name)}</b><span class="xs muted">${esc(e.dose)}</span><span class="xs">${esc(e.cue)}</span></div>`).join('')}</div>`).join('')}</details>
  <details><summary class="small">Why strength over stretching</summary><ul class="tight xs">${MOVE.src.map(x=>`<li><a href="${x[1]}" target="_blank" rel="noopener">${esc(x[0])}</a></li>`).join('')}</ul></details>
  <p class="xs muted">${esc(MOVE.disclaimer)}</p></div>`);
  const b=$('#sheetBody');
  b.querySelectorAll('[data-rt]').forEach(x=>x.addEventListener('click',()=>openRoutine(x.dataset.rt,0)));
  b.querySelectorAll('[data-am]').forEach(x=>x.addEventListener('click',()=>{pend.am=x.dataset.am;save();toast(pend.am==='ok'?'Good. That one counts.':'Noted. Repeat this week.');openMove()}));
  $('#runLog').addEventListener('click',()=>{const p=+$('#runPain').value;R.logs.push({id:uid(),date:today(),week:R.week,pain:p,am:null});addEntry({title:'Run: '+MOVE.run[R.week][0]+' · pain '+p,skill:'fit_cond',mode:'practice',points:2});toast(p>5?'+2 φόρα. Pain above 5: repeat this week.':'+2 φόρα. Check in tomorrow morning.');openMove()});
  const up=$('#runUp');if(up)up.addEventListener('click',()=>{R.week++;save();toast('On to '+MOVE.run[R.week][0]);openMove()});
  const dn=$('#runDown');if(dn)dn.addEventListener('click',()=>{R.week--;save();openMove()})}
function openRoutine(id,i){const r=MOVE.routines.find(x=>x.id===id),e=exById(r.ids[i]),last=i===r.ids.length-1;
  openSheet(r.name,`<div class="stack"><button class="btn ghost small" id="rtBack">← All routines</button><span class="eyebrow">${i+1} of ${r.ids.length} · ${esc(e.area)}</span>
  <div class="fig-big">${fig(e.fig,320)}</div><h3 style="font-family:var(--font-display)">${esc(e.name)}</h3><p><b>${esc(e.dose)}</b></p><p class="small">${esc(e.cue)}</p>${e.test?`<p class="small muted">${esc(e.test)}</p>`:''}
  <div class="row">${i>0?'<button class="btn ghost" id="rtPrev">Previous</button>':''}${last?'<button class="btn" id="rtDone">Routine done (+2 φόρα)</button>':'<button class="btn" id="rtNext">Next move</button>'}</div><p class="xs muted">${esc(MOVE.disclaimer)}</p></div>`);
  $('#rtBack').addEventListener('click',openMove);
  const p=$('#rtPrev');if(p)p.addEventListener('click',()=>openRoutine(id,i-1));
  const n=$('#rtNext');if(n)n.addEventListener('click',()=>openRoutine(id,i+1));
  const d=$('#rtDone');if(d)d.addEventListener('click',()=>{addEntry({title:'Mobility: '+r.name,skill:'fit_mobility',mode:'practice',points:2});toast('+2 φόρα');closeSheet();render()})}
function treatStats(){moveInit();const L=S.treats.log,t=L.filter(x=>x.taken).length;return {n:L.length,t,toBig:TREATS.every-(t%TREATS.every),unlocked:Math.floor(t/TREATS.every)-S.treats.claimed.length}}
function treatMini(){const st=treatStats(),c=S.treats.cur;
  return `<button class="mini" data-open="treat"><span class="eyebrow">${c?'Treat waiting':'Treat menu · '+st.t+' of '+st.n+' taken'}</span><h4>${c?esc(c.video||c.treat):'Pick a treat before your next block'}</h4><p>${c?'After: '+esc(c.task):st.unlocked>0?'A big treat is unlocked.':st.toBig+' more blocks to a big treat.'}</p></button>`}
function openTreat(){const st=treatStats(),T=S.treats,c=T.cur;
  const tail=`<p class="small"><b>The one rule.</b> ${esc(TREATS.rule)}</p>
  <details><summary class="small">YouTube rules</summary><ol class="tight small">${TREATS.yt.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></details>
  <details><summary class="small">Bundle it during the task</summary><ul class="tight small">${TREATS.during.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details>
  <details><summary class="small">Why this works</summary><ul class="tight xs">${TREATS.src.map(x=>`<li><a href="${x[1]}" target="_blank" rel="noopener">${esc(x[0])}</a></li>`).join('')}</ul></details>`;
  const big=st.unlocked>0?`<article class="card"><span class="eyebrow">Big treat unlocked</span><h4>${TREATS.every} treats taken. Pick one this week.</h4><div class="row" style="margin-top:var(--space-2)">${TREATS.big.map((x,i)=>`<button class="btn ghost small" data-big="${i}">${esc(x)}</button>`).join('')}</div></article>`:'';
  const stats=`<p class="xs muted">Taken ${st.t} of ${st.n} finished blocks${st.n?' ('+Math.round(100*st.t/st.n)+'%)':''} · ${st.toBig} more to a big treat. Taking it is the part that works.</p>`;
  if(c){openSheet('Treat waiting',`<div class="stack"><span class="eyebrow">Block in progress</span><h3>${esc(c.task)}</h3><p>Then: <b>${esc(c.treat)}</b>${c.video?' · '+esc(c.video):''}</p>
   <button class="btn" id="tTake">Block done, taking the treat (+1)</button><button class="btn ghost" id="tSkip">Block done, skipping the treat</button><button class="btn ghost small" id="tCancel">Cancel this block</button>${stats}${big}${tail}</div>`);
   const fin=taken=>{T.log.push({date:today(),task:c.task,treat:c.treat,taken});T.cur=null;addEntry({title:'Block: '+c.task+(taken?' · treat taken':''),skill:'home_ops',mode:'practice',points:1});const s=treatStats();toast(taken?(s.t%TREATS.every===0?'+1 φόρα. Big treat unlocked.':'+1 φόρα. Enjoy it.'):'+1 φόρα. Next time, take it.');closeSheet();render()};
   $('#tTake').addEventListener('click',()=>fin(true));$('#tSkip').addEventListener('click',()=>fin(false));$('#tCancel').addEventListener('click',()=>{T.cur=null;save();closeSheet();render()})}
  else{openSheet('Treat menu',`<div class="stack"><p class="small">Choose the treat before you start, then take it right after. Small and immediate beats big and someday.</p>
   <label class="f">The block (a chore, admin, outreach)<input type="text" id="tTask" maxlength="120" placeholder="Send three olive oil follow-ups"></label>
   <span class="small"><b>Right after, I get:</b></span><div class="treat-pick">${TREATS.after.map((x,i)=>`<label class="chip-pick"><input type="radio" name="tr" value="${i}"${i===0?' checked':''}> ${esc(x)}</label>`).join('')}</div>
   <label class="f" id="tVidW">The video, picked now<input type="text" id="tVid" maxlength="160" placeholder="Title or link"></label>
   <button class="btn" id="tStart">Start the block</button>${stats}${big}${tail}</div>`);
   const sync=()=>{$('#tVidW').style.display=document.querySelector('input[name=tr]:checked').value==='0'?'':'none'};document.querySelectorAll('input[name=tr]').forEach(x=>x.addEventListener('change',sync));
   $('#tStart').addEventListener('click',()=>{const task=$('#tTask').value.trim();if(!task){toast('Name the block first.');return}const i=+document.querySelector('input[name=tr]:checked').value;const v=$('#tVid').value.trim();if(i===0&&!v){toast('Pick the video now, before working.');return}T.cur={task,treat:TREATS.after[i],video:i===0?v:'',start:Date.now()};save();toast('Go. The treat is waiting.');closeSheet();render()})}
  $('#sheetBody').querySelectorAll('[data-big]').forEach(x=>x.addEventListener('click',()=>{T.claimed.push({date:today(),what:TREATS.big[+x.dataset.big]});addEntry({title:'Big treat: '+TREATS.big[+x.dataset.big],skill:'home_ops',mode:'practice',points:0});toast('Enjoy it. You earned it.');openTreat()}))}
function sellSeg(){return `<div class="seg" style="margin-bottom:var(--space-4)">${BIZ.map(x=>`<button data-biz="${x.id}" aria-pressed="${x.id===bizTab}">${esc(x.short)}</button>`).join('')}<button data-biz="jobs" aria-pressed="${bizTab==='jobs'}">Day job</button></div>`}
/* ---------- day jobs ---------- */
function jobsInit(){S.jobs=S.jobs||[];S.jobPrefs=S.jobPrefs||['q','c','p']}
function jobScore(x){return S.jobPrefs.reduce((a,k)=>a+(x.s[k]||0),0)}
function jobIdeas(){jobsInit();return JOBS.ideas.slice().sort((a,b)=>jobScore(b)-jobScore(a))}
function jobPick(){const used=new Set(S.jobs.map(j=>j.idea));const c=jobIdeas().filter(x=>!used.has(x.id));return c.length?c[warmDay()%Math.min(3,c.length)]:null}
function jobDue(){jobsInit();return S.jobs.filter(j=>j.stage==='Applied'&&daysSince(j.date)>=5)}
function jobMini(){jobsInit();const wk=S.jobs.filter(j=>daysSince(j.date)<7).length,d=jobDue(),p=jobPick();
  return `<button class="mini" data-gojobs><span class="eyebrow">Day job · ${wk} of 3 applied this week</span><h4>${d.length?'Follow up: '+esc(d[0].t):p?esc(p.t):'Find one more'}</h4><p>${d.length?esc(d[0].where):p?esc(p.where)+' · '+esc(p.pay):'Add a job you spotted.'}</p></button>`}
function dots(n){return '<span class="jdots">'+[1,2,3].map(i=>`<i class="${i<=n?'on':''}"></i>`).join('')+'</span>'}
function jobCard(x,big){const ap=S.jobs.find(j=>j.idea===x.id);
  return `<div class="${big?'':'card job-card'}"><span class="eyebrow">${esc(x.where)} · ${esc(x.pay)}</span><h${big?3:4} style="margin:var(--space-1) 0">${esc(x.t)}</h${big?3:4}>
  <div class="jtags">${Object.keys(JOBS.tags).map(k=>`<span class="xs${S.jobPrefs.includes(k)?' strong':''}">${JOBS.tags[k]} ${dots(x.s[k]||0)}</span>`).join('')}</div>
  <p class="small" style="margin-top:var(--space-2)">${esc(x.tip)}</p>
  <div class="row" style="margin-top:var(--space-3)"><a class="btn ${big?'':'ghost '}small" href="${x.url}" target="_blank" rel="noopener">Open the postings</a>${x.url2?`<a class="btn ghost small" href="${x.url2}" target="_blank" rel="noopener">County application</a>`:''}${ap?`<span class="xs muted">Applied ${fmtDate(ap.date)} · ${esc(ap.stage)}</span>`:`<button class="btn small" data-japply="${x.id}">I applied (+3 φόρα)</button>`}</div></div>`}
function jobsView(seg){jobsInit();const d=jobDue(),p=jobPick(),wk=S.jobs.filter(j=>daysSince(j.date)<7).length;
  const open=S.jobs.filter(j=>!['Started','No'].includes(j.stage)).length,iv=S.jobs.filter(j=>['Interview','Offer','Started'].includes(j.stage)).length;
  const fu=JOBS.scripts[1][1];
  const top=d.length?`<span class="eyebrow">Follow up · applied ${daysSince(d[0].date)} days ago</span><h3>${esc(d[0].t)}</h3><p class="muted">${esc(d[0].where)}</p><div class="row" style="margin-top:var(--space-4)"><button class="btn" data-jfu="${d[0].id}">I followed up (+1)</button><button class="btn ghost" data-copy="${esc(fu.replace('[job]',d[0].t))}">Copy the call script</button></div>`
   :p?`<span class="eyebrow">Today’s one application · best match for your filter</span>${jobCard(p,true)}`:`<span class="eyebrow">Every idea tried</span><h3>Add one you spotted</h3>`;
  return `<h1 class="section-title">Sell</h1><p class="lede">${esc(JOBS.note)}</p>${seg}
  <article class="card up-next">${top}</article>
  <div class="stats"><div class="stat"><b>${wk}/3</b><span>applied this week</span></div><div class="stat"><b>${open}</b><span>open applications</span></div><div class="stat"><b>${iv}</b><span>interviews or better</span></div></div>
  <h2 class="sub-title">What matters most to you</h2><div class="row">${Object.keys(JOBS.tags).map(k=>`<button class="btn small ${S.jobPrefs.includes(k)?'':'ghost'}" data-jpref="${k}" aria-pressed="${S.jobPrefs.includes(k)}">${JOBS.tags[k]}</button>`).join('')}</div>
  <p class="xs muted" style="margin-top:var(--space-2)">Jobs are sorted by your picks. Dots are rough guesses; the first shift tells you more.</p>
  <h2 class="sub-title">My applications</h2>
  ${S.jobs.length?S.jobs.slice().reverse().map(j=>`<div class="entry"><div><div class="entry-title">${esc(j.t)}</div><div class="entry-meta"><span>${esc(j.where)}</span><span>${fmtDate(j.date)}</span></div></div><select data-jstage="${j.id}" aria-label="Stage">${JOBS.stages.map(s=>`<option${s===j.stage?' selected':''}>${s}</option>`).join('')}</select></div>`).join(''):'<p class="small muted">Nothing yet. One application is a win.</p>'}
  <form id="jAdd" class="row" style="margin-top:var(--space-3);align-items:flex-end"><label class="f" style="flex:2">Job I spotted<input type="text" name="t" maxlength="80" placeholder="Bookstore clerk" required></label><label class="f" style="flex:2">Where<input type="text" name="w" maxlength="80" placeholder="Lexington"></label><button class="btn ghost" type="submit">Add (+3)</button></form>
  <h2 class="sub-title">Sensory-friendly ideas nearby</h2><div class="job-grid">${jobIdeas().map(x=>jobCard(x)).join('')}</div>
  <h2 class="sub-title">Scripts</h2><div class="stack">${JOBS.scripts.map(([h,t])=>`<div class="card"><span class="eyebrow">${esc(h)}</span><p class="small" style="margin-top:var(--space-2)">${esc(t)}</p><button class="btn ghost small" style="margin-top:var(--space-2)" data-copy="${esc(t)}">Copy</button></div>`).join('')}</div>
  <details style="margin-top:var(--space-4)"><summary class="small">Adjustments you can ask for, and a first-shift kit</summary><ul class="tight small">${JOBS.adjust.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p class="xs">${JOBS.adjustSrc.map(x=>`<a href="${x[1]}" target="_blank" rel="noopener">${esc(x[0])}</a>`).join(' · ')}</p><p class="small"><b>Kit:</b> ${JOBS.kit.map(esc).join(' · ')}</p></details>
  <p class="xs" style="margin-top:var(--space-3)">${JOBS.help.map(x=>`<a href="${x[1]}" target="_blank" rel="noopener">${esc(x[0])}</a>`).join('')}</p>`}
function bindJobs(v){
  v.querySelectorAll('[data-gojobs]').forEach(b=>b.addEventListener('click',()=>{bizTab='jobs';document.querySelector('.tabs [data-tab=sell]').click()}));
  const apply=(t,where,idea)=>{S.jobs.push({id:uid(),idea,t,where,stage:'Applied',date:today()});addEntry({title:'Applied: '+t,skill:'biz_career',mode:'handson',points:3});toast('+3 φόρα. Follow-up reminder in 5 days.');render()};
  v.querySelectorAll('[data-japply]').forEach(b=>b.addEventListener('click',()=>{const x=JOBS.ideas.find(i=>i.id===b.dataset.japply);apply(x.t,x.where,x.id)}));
  v.querySelectorAll('[data-jfu]').forEach(b=>b.addEventListener('click',()=>{const j=S.jobs.find(x=>x.id===b.dataset.jfu);j.stage='Followed up';addEntry({title:'Followed up: '+j.t,skill:'biz_career',mode:'handson',points:1});toast('+1 φόρα');render()}));
  v.querySelectorAll('[data-jpref]').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.jpref;S.jobPrefs=S.jobPrefs.includes(k)?S.jobPrefs.filter(x=>x!==k):S.jobPrefs.concat(k);save();render()}));
  v.querySelectorAll('[data-jstage]').forEach(s=>s.addEventListener('change',()=>{const j=S.jobs.find(x=>x.id===s.dataset.jstage);j.stage=s.value;if(['Interview','Offer','Started'].includes(s.value)){addEntry({title:s.value+': '+j.t,skill:'biz_career',mode:'handson',points:s.value==='Started'?5:3});toast('Nice. +φόρα')}else save();render()}));
  const f=$('#jAdd');if(f)f.addEventListener('submit',e=>{e.preventDefault();apply(f.t.value.trim(),f.w.value.trim()||'Lexington area',null)})}
/* ---------- workshop ---------- */
function shopInit(){S.shop=S.shop||{projects:[]};if(!S.shop.seeded){S.shop.seeded=true;S.shop.half=true;S.shop.projects.push(shopNew(SHOP.studio,'shop_build'))}
  if(!S.shop.half){S.shop.half=true;const p=S.shop.projects.find(x=>x.name===SHOP.studio.name&&!x.done);if(p){const was=new Set(p.steps.filter(x=>x.done).map(x=>x.t));p.why=SHOP.studio.why;p.where=SHOP.studio.where;p.skill='shop_wood';p.steps=SHOP.studio.steps.map(t=>({t,done:was.has(t)}))}}}
function shopNew(t,skill){return {id:uid(),name:t.name||t.n,why:t.why||t.w||'',where:t.where||'',skill:skill||'shop_wood',steps:(t.steps||t.s).map(x=>({t:x,done:false})),sessions:[],created:today(),done:''}}
function shopNext(p){return p.steps.find(s=>!s.done)}
function shopActive(){shopInit();return S.shop.projects.filter(p=>!p.done)}
function shopPct(p){return p.steps.length?Math.round(100*p.steps.filter(s=>s.done).length/p.steps.length):0}
function shopMini(){const a=shopActive(),p=a[0];const done=S.entries.some(e=>e.date===today()&&/^Workshop/.test(e.title||''));
  return `<button class="mini" data-open="shop"><span class="eyebrow">Workshop${done?' · done today':' · manual labor'}</span><h4>${p?esc(p.name):'Pick a project'}</h4><p>${p&&shopNext(p)?'Next: '+esc(shopNext(p).t):'Hands on wood. Something real gets finished.'}</p></button>`}
function shopHtml(){shopInit();const a=shopActive(),fin=S.shop.projects.filter(p=>p.done);
  return `<h2 class="sub-title">Workshop</h2><p class="small muted" style="margin-bottom:var(--space-3)">${esc(SHOP.note)} <a href="${SHOP.ladder[1]}" target="_blank" rel="noopener">${esc(SHOP.ladder[0])}</a></p>
  <div class="grid2">${a.map(p=>{const n=shopNext(p);const mins=p.sessions.reduce((s,x)=>s+(+x.min||0),0);return `<button class="card shop-card" data-shop="${p.id}"><span class="eyebrow">${p.steps.filter(s=>s.done).length} of ${p.steps.length} steps · ${p.sessions.length} sessions · ${Math.round(mins/6)/10} h</span><h4>${esc(p.name)}</h4><span class="bar"><i style="width:${shopPct(p)}%"></i></span><p class="small">${n?'Next: '+esc(n.t):'All steps done. Mark it finished.'}</p>${p.where?`<p class="xs muted">Where it goes: ${esc(p.where)}</p>`:''}</button>`}).join('')}</div>
  <div class="row" style="margin-top:var(--space-3)"><button class="btn ghost small" id="shopIdeas">+ Another project</button><button class="btn ghost small" id="shopLabor">Heavy day: just manual labor</button></div>
  ${fin.length?`<p class="xs muted" style="margin-top:var(--space-2)">Finished: ${fin.map(p=>esc(p.name)+' ('+esc(fmtDate(p.done))+')').join(' · ')}</p>`:''}`}
function openShop(id){shopInit();const p=S.shop.projects.find(x=>x.id===id)||shopActive()[0];if(!p){openShopIdeas();return}
  const n=shopNext(p),isStudio=p.name===SHOP.studio.name;
  openSheet(p.name,`<div class="stack">${p.why?`<p class="small muted">${esc(p.why)}</p>`:''}
  ${n?`<article class="card up-next"><span class="eyebrow">Next step</span><h4>${esc(n.t)}</h4></article>`:'<p class="notice small">Every step is checked. Finish it.</p>'}
  <form class="form" id="ssForm"><span class="small"><b>Log a session</b></span><div class="treat-pick">${[15,30,60,120].map((m,i)=>`<label class="chip-pick"><input type="radio" name="min" value="${m}"${i===1?' checked':''}> ${m<60?m+' min':m/60+' h'}</label>`).join('')}</div>
  ${n?`<label class="chip-pick"><input type="checkbox" name="fin" checked> I finished "${esc(n.t.split(/[.:]/)[0])}"</label>`:''}
  <label class="f">Note (optional)<input type="text" name="note" maxlength="140" placeholder="Squared two frames, one needs glue"></label><button class="btn" type="submit">Log it</button></form>
  <details><summary class="small">All steps</summary><div>${p.steps.map((s,i)=>`<label class="step-row entry"><input type="checkbox" data-sstep="${i}"${s.done?' checked':''}><div class="small">${esc(s.t)}</div></label>`).join('')}</div></details>
  ${isStudio?`<details open><summary class="small">The space question</summary><p class="small">${esc(SHOP.space)}</p><p class="small"><b>Where panels go, in order:</b></p><ol class="tight small">${SHOP.place.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><p class="xs">${SHOP.placeSrc.map(x=>`<a href="${x[1]}" target="_blank" rel="noopener">${esc(x[0])}</a>`).join(' · ')}</p></details>
  <details><summary class="small">Insulation safety</summary><ul class="tight small">${SHOP.safety.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p class="xs">${SHOP.safetySrc.map(x=>`<a href="${x[1]}" target="_blank" rel="noopener">${esc(x[0])}</a>`).join(' · ')}</p></details>`:''}
  ${p.sessions.length?`<details><summary class="small">Sessions</summary>${p.sessions.slice().reverse().map(x=>`<div class="xs">${esc(fmtDate(x.date))} · ${x.min} min${x.note?' · '+esc(x.note):''}</div>`).join('')}</details>`:''}
  <div class="row"><button class="btn ghost small" id="ssEdit">Edit project</button>${!n?'<button class="btn small" id="ssDone">Finished (+5)</button>':''}</div></div>`);
  $('#sheetBody').querySelectorAll('[data-sstep]').forEach(c=>c.addEventListener('change',()=>{p.steps[+c.dataset.sstep].done=c.checked;save()}));
  $('#ssForm').addEventListener('submit',ev=>{ev.preventDefault();const f=Object.fromEntries(new FormData(ev.target));const m=+f.min;let pt=m>=60?4:m>=30?3:2;
    if(f.fin&&n){n.done=true;pt+=1}p.sessions.push({date:today(),min:m,note:f.note||'',step:f.fin&&n?n.t:''});
    addEntry({title:'Workshop: '+p.name+(f.fin&&n?' · step done':'')+(f.note?' · '+f.note:''),skill:p.skill||'shop_build',skill2:'shop_labor',mode:'handson',points:pt});toast('+'+pt+' φόρα · hands-on');closeSheet()});
  const e=$('#ssEdit');e&&e.addEventListener('click',()=>openShopEdit(p.id));
  const d=$('#ssDone');d&&d.addEventListener('click',()=>{p.done=today();addEntry({title:'Workshop finished: '+p.name,skill:p.skill||'shop_build',mode:'handson',points:5});toast('Finished. +5 φόρα');closeSheet()})}
function openShopEdit(id){const p=S.shop.projects.find(x=>x.id===id);const isNew=!p;const q=p||{name:'',why:'',where:'',skill:'shop_wood',steps:[]};
  openSheet(isNew?'New project':'Edit project',`<form class="form" id="seForm"><label class="f">Project<input type="text" name="name" required maxlength="80" value="${esc(q.name)}"></label>
  <label class="f">Why it matters<input type="text" name="why" maxlength="160" value="${esc(q.why)}"></label><label class="f">Where it goes (can wait)<input type="text" name="where" maxlength="100" value="${esc(q.where)}"></label>
  <label class="f">Kind<select name="skill">${[['shop_build','Studio & home build'],['shop_wood','Woodworking']].map(([v,l])=>`<option value="${v}"${q.skill===v?' selected':''}>${l}</option>`).join('')}</select></label>
  <label class="f">Steps, one per line<textarea name="steps" rows="8">${esc(q.steps.map(s=>s.t).join('\n'))}</textarea></label>
  <button class="btn" type="submit">Save</button>${!isNew?'<button class="btn ghost small" type="button" id="seDel">Remove project</button>':''}</form>`);
  $('#seForm').addEventListener('submit',ev=>{ev.preventDefault();const f=Object.fromEntries(new FormData(ev.target));const lines=f.steps.split('\n').map(x=>x.trim()).filter(Boolean);
    const old=p?p.steps:[];const steps=lines.map(t=>({t,done:!!(old.find(s=>s.t===t)||{}).done}));
    if(p)Object.assign(p,{name:f.name,why:f.why,where:f.where,skill:f.skill,steps});else S.shop.projects.push(Object.assign(shopNew({name:f.name,why:f.why,where:f.where,steps:lines.length?lines:['First small step']},f.skill)));save();closeSheet()});
  const dl=$('#seDel');dl&&dl.addEventListener('click',()=>{if(confirm('Remove '+p.name+'?')){S.shop.projects=S.shop.projects.filter(x=>x.id!==p.id);save();closeSheet()}})}
function openShopIdeas(){shopInit();const have=new Set(S.shop.projects.map(p=>p.name));
  openSheet('Another project',`<div class="stack"><p class="small muted">Small builds that serve your life. Add one; it gets its own steps you can edit.</p>${SHOP.ideas.map((x,i)=>`<article class="card"><h4>${esc(x.n)}</h4><p class="small">${esc(x.w)}</p><button class="btn ghost small" data-sidea="${i}"${have.has(x.n)?' disabled':''}>${have.has(x.n)?'Added':'Add this'}</button></article>`).join('')}<button class="btn" id="siOwn">My own project</button></div>`);
  $('#sheetBody').querySelectorAll('[data-sidea]').forEach(b=>b.addEventListener('click',()=>{S.shop.projects.push(shopNew(SHOP.ideas[+b.dataset.sidea],'shop_wood'));save();toast('Added to the Workshop');openShopIdeas()}));
  $('#siOwn').addEventListener('click',()=>openShopEdit(null))}
function openLabor(){unInit();openSheet('Heavy day: manual labor',`<div class="stack"><p class="small">On a heavy day, shrink the ask. Do one of these with your hands. No thinking required.</p>
  ${S.unstuck.moved?`<p class="notice small"><b>What got you moving last time:</b> ${esc(S.unstuck.moved)}</p>`:''}
  ${SHOP.labor.map((x,i)=>`<button class="btn ghost" data-labor="${i}">${esc(x)}</button>`).join('')}<p class="xs"><a href="${SHOP.ladder[1]}" target="_blank" rel="noopener">${esc(SHOP.ladder[0])}</a></p></div>`);
  $('#sheetBody').querySelectorAll('[data-labor]').forEach(b=>b.addEventListener('click',()=>{addEntry({title:'Manual labor: '+SHOP.labor[+b.dataset.labor],skill:'shop_labor',mode:'handson',points:1});toast('+1 φόρα. The fog pulls back.');closeSheet()}))}

/* ---------- unstuck ---------- */
function unInit(){S.unstuck=S.unstuck||{};const U=S.unstuck;['good','names','quiet','seen'].forEach(k=>U[k]=U[k]||[]);U.day=U.day||'';U.story=U.story||'';U.moved=U.moved||''}
function branchLast(){const last={};allEntries().forEach(e=>[e.skill,e.skill2].forEach(s=>{const b=s&&BRANCH_OF[s];if(b&&(!last[b]||e.date>last[b]))last[b]=e.date}));return last}
function fogList(){const last=branchLast();return BRANCHES.filter(b=>last[b.id]&&daysSince(last[b.id])>=UNSTUCK.fogDays).map(b=>({b,days:daysSince(last[b.id])})).sort((x,y)=>y.days-x.days)}
function unTimer(id,secs,done){const el=$('#'+id);const end=Date.now()+secs*1000;const tick=()=>{const left=Math.max(0,Math.round((end-Date.now())/1000));const e=$('#'+id);if(!e){clearInterval(h);return}e.textContent=Math.floor(left/60)+':'+String(left%60).padStart(2,'0');if(left<=0){clearInterval(h);done()}};const h=setInterval(tick,500);tick();sheetCleanup=()=>clearInterval(h)}
function unMini(){unInit();const U=S.unstuck,h=new Date().getHours(),fog=fogList();const goodT=U.good.some(g=>g.date===today());
  if(h>=18&&!goodT)return `<button class="mini" data-open="good"><span class="eyebrow">Unstuck · tonight</span><h4>Three good things</h4><p>What went well today, and why it happened.</p></button>`;
  if(fog.length)return `<button class="mini fog-mini" data-nameit="${fog[0].b.id}"><span class="eyebrow">The Nothing · ${fog.length} branch${fog.length===1?'':'es'} in fog</span><h4>Name it: ${esc(fog[0].b.name)}</h4><p>${fog[0].days} days untouched. One tiny action, 2 minutes.</p></button>`;
  return `<button class="mini" data-open="seen"><span class="eyebrow">Unstuck · fight it directly</span><h4>Be seen once today</h4><p>Predict the judgment, do it anyway, check what happened.</p></button>`}
function unHtml(){unInit();const U=S.unstuck,fog=fogList();const n=U.day?daysSince(U.day)+1:0;const ev=U.day?allEntries().filter(e=>e.date>=U.day).length:0;const qm=U.quiet.reduce((s,x)=>s+x.min,0);
  const seenDone=U.seen.filter(x=>x.happened!=null);const better=seenDone.filter(x=>x.better).length;
  return `<article class="card unstuck"><span class="eyebrow">${U.day?'Unstuck · day '+n+' · since '+esc(fmtDate(U.day)):'Unstuck'}</span>
  ${U.day?`<h3>${U.story?'“'+esc(U.story)+'”':'You got unstuck.'}</h3>`:`<h3>Mark the day you got unstuck</h3><p class="muted small">${esc(UNSTUCK.note)}</p>`}
  ${U.day?`<div class="stats"><div class="stat"><b>${ev}</b><span>reps since</span></div><div class="stat"><b>${U.good.length}</b><span>good-things nights</span></div><div class="stat"><b>${seenDone.length?better+'/'+seenDone.length:U.seen.length}</b><span>${seenDone.length?'went better than predicted':'times seen'}</span></div><div class="stat"><b>${qm}</b><span>quiet minutes</span></div></div>`:''}
  <div class="row" style="margin-top:var(--space-3)">${U.day?'':'<button class="btn" data-un="day">Mark my Unstuck Day</button>'}<button class="btn${U.day?'':' ghost'}" data-un="seen">Be seen (+3)</button><button class="btn ghost" data-un="good">Three good things</button><button class="btn ghost" data-un="quiet">The Quiet</button><button class="btn ghost" data-un="name">Name it</button>${U.day?'<button class="btn ghost small" data-un="ev">Evidence</button><button class="btn ghost small" data-un="day">Edit</button>':''}</div>
  ${fog.length?`<p class="small fog-line">The Nothing is over ${fog.slice(0,3).map(f=>`<button class="linkish" data-nameit="${f.b.id}">${esc(f.b.name)} (${f.days}d)</button>`).join(', ')}${fog.length>3?' and '+(fog.length-3)+' more':''}.</p>`:''}</article>`}
function openUnDay(){unInit();const U=S.unstuck;openSheet('My Unstuck Day',`<form class="form" id="udForm"><p class="small muted">Bastian names the Empress and Fantasia comes back. Name your day.</p>
  <label class="f">The day<input type="date" name="day" required value="${esc(U.day||today())}"></label>
  <label class="f">What changed, in a sentence or two<textarea name="story" rows="3" maxlength="300">${esc(U.story)}</textarea></label>
  <label class="f">What got me moving (my plan for the next foggy day)<textarea name="moved" rows="3" maxlength="300" placeholder="The 9 AM gym, small asks, people…">${esc(U.moved)}</textarea></label>
  <button class="btn" type="submit">Save</button></form>`);
  $('#udForm').addEventListener('submit',ev=>{ev.preventDefault();const f=Object.fromEntries(new FormData(ev.target));const first=!U.day;Object.assign(U,f);if(first)addEntry({title:'Unstuck Day marked',skill:'life_unstuck',mode:'practice',points:3});toast(first?'Marked. +3 φόρα. Celebrate it.':'Saved');closeSheet()})}
function openGood(){unInit();openSheet('Three good things',`<form class="form" id="gdForm"><p class="small">${esc(UNSTUCK.good)}</p>${[1,2,3].map(i=>`<label class="f">${i}. What went well<input type="text" name="t${i}" maxlength="140" ${i===1?'required':''}></label><label class="f xs">Why it happened<input type="text" name="w${i}" maxlength="160"></label>`).join('')}
  <button class="btn" type="submit">Save (+2)</button><p class="xs"><a href="${UNSTUCK.goodSrc[1]}" target="_blank" rel="noopener">${esc(UNSTUCK.goodSrc[0])}</a></p></form>`);
  $('#gdForm').addEventListener('submit',ev=>{ev.preventDefault();const f=Object.fromEntries(new FormData(ev.target));const items=[1,2,3].map(i=>({t:f['t'+i].trim(),why:f['w'+i].trim()})).filter(x=>x.t);S.unstuck.good.push({date:today(),items});addEntry({title:'Three good things: '+items.map(x=>x.t).join('; '),skill:'life_unstuck',mode:'practice',points:2});toast('+2 φόρα');closeSheet()})}
function openQuiet(){unInit();openSheet('The Quiet',`<div class="stack"><p class="small">${esc(UNSTUCK.quiet)}</p><div class="treat-pick">${[5,10,20].map((m,i)=>`<label class="chip-pick"><input type="radio" name="qm" value="${m}"${i===1?' checked':''}> ${m} min</label>`).join('')}</div>
  <div class="big-timer" id="qT">10:00</div><button class="btn" id="qGo">Begin the Quiet</button><p class="xs"><a href="${UNSTUCK.quietSrc[1]}" target="_blank" rel="noopener">${esc(UNSTUCK.quietSrc[0])}</a></p></div>`);
  const sync=()=>{const m=+document.querySelector('input[name=qm]:checked').value;$('#qT').textContent=m+':00'};document.querySelectorAll('input[name=qm]').forEach(x=>x.addEventListener('change',sync));
  $('#qGo').addEventListener('click',()=>{const m=+document.querySelector('input[name=qm]:checked').value;$('#qGo').disabled=true;$('#qGo').textContent='Phone away. Nothing to do.';
    unTimer('qT',m*60,()=>{S.unstuck.quiet.push({date:today(),min:m});addEntry({title:'The Quiet: '+m+' min',skill:'mind_attn',mode:'practice',points:m>=10?2:1});toast('Done. Attention grows in the quiet.');try{navigator.vibrate&&navigator.vibrate(300)}catch(e){};$('#qGo').textContent='Done'})})}
function openNameIt(bid){unInit();const fog=fogList();const b=BRANCHES.find(x=>x.id===bid)||(fog[0]&&fog[0].b)||BRANCHES[0];
  openSheet('Name it',`<div class="stack"><p class="small">${esc(UNSTUCK.name)}</p>
  <label class="f">Branch<select id="niB">${BRANCHES.map(x=>`<option value="${x.id}"${x.id===b.id?' selected':''}>${esc(x.name)}${fog.some(f=>f.b.id===x.id)?' · in fog':''}</option>`).join('')}</select></label>
  <label class="f">One tiny action, said out loud<input type="text" id="niT" maxlength="120" placeholder="Open the file and read one paragraph"></label>
  <div class="big-timer" id="niTm">2:00</div><button class="btn" id="niGo">Name it and start 2 minutes</button><button class="btn ghost small" id="niNow">Already did it</button>
  <details><summary class="small">Heavy day?</summary><p class="small">Shrink it further, or just use your hands.</p><button class="btn ghost small" id="niLab">Manual labor list</button></details>
  <p class="xs"><a href="${UNSTUCK.baSrc[1]}" target="_blank" rel="noopener">${esc(UNSTUCK.baSrc[0])}</a> · <a href="${UNSTUCK.gmork[1]}" target="_blank" rel="noopener">${esc(UNSTUCK.gmork[0])}</a></p></div>`);
  const log=()=>{const t=$('#niT').value.trim()||'one tiny action';const br=BRANCHES.find(x=>x.id===$('#niB').value);S.unstuck.names.push({date:today(),t,b:br.id});addEntry({title:'Named it: '+t,skill:br.skills[0][0],mode:'practice',points:1});toast('+1 φόρα. The fog pulls back from '+br.name+'.');closeSheet()};
  $('#niGo').addEventListener('click',()=>{if(!$('#niT').value.trim()){toast('Name it first.');return}$('#niGo').disabled=true;$('#niGo').textContent='Go';unTimer('niTm',120,()=>{$('#niGo').disabled=false;$('#niGo').textContent='Two minutes done. Log it (+1)';$('#niGo').onclick=log})});
  $('#niNow').addEventListener('click',log);$('#niLab').addEventListener('click',openLabor)}
function openSeen(){unInit();const U=S.unstuck,X=UNSTUCK.seen,open=U.seen.filter(x=>x.happened==null);
  openSheet('Be seen',`<div class="stack"><p class="small">${esc(X.why)}</p>
  ${open.map(x=>`<article class="card"><span class="eyebrow">Waiting for the result · ${esc(fmtDate(x.date))}</span><h4>${esc(x.act)}</h4><p class="small">You predicted: “${esc(x.pred)}” (${x.sure}% sure)</p><button class="btn small" data-seenres="${x.id}">What actually happened</button></article>`).join('')}
  <form class="form" id="bsForm"><label class="f">The thing<input type="text" name="act" required maxlength="140" list="bsIdeas" placeholder="Send one job application without rewriting it"><datalist id="bsIdeas">${X.ideas.map(i=>`<option value="${esc(i)}">`).join('')}</datalist></label>
  <label class="f">Exactly what will happen<input type="text" name="pred" required maxlength="160" placeholder="They won't reply, or they'll think less of me"></label>
  <label class="f">How sure, 0 to 100 <input type="range" name="sure" min="0" max="100" step="10" value="70"></label>
  <label class="f">The hiding move I'll drop<input type="text" name="drop" maxlength="120" placeholder="Over-preparing, apologizing first, not sending"></label>
  <button class="btn" type="submit">I'm going to do it</button></form>
  <details><summary class="small">How this works</summary><ol class="tight small">${X.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol><p class="xs">${X.src.map(x=>`<a href="${x[1]}" target="_blank" rel="noopener">${esc(x[0])}</a>`).join(' · ')}</p><p class="xs muted">${esc(X.care)}</p></details>
  ${U.seen.filter(x=>x.happened!=null).length?`<details><summary class="small">Past experiments</summary>${U.seen.filter(x=>x.happened!=null).slice().reverse().map(x=>`<div class="entry"><div><div class="entry-title">${esc(x.act)}</div><div class="xs">Predicted: ${esc(x.pred)} · Happened: ${esc(x.happened)}${x.learn?' · Learned: '+esc(x.learn):''}</div></div></div>`).join('')}</details>`:''}</div>`);
  $('#bsForm').addEventListener('submit',ev=>{ev.preventDefault();const f=Object.fromEntries(new FormData(ev.target));U.seen.push({id:uid(),date:today(),act:f.act,pred:f.pred,sure:+f.sure,drop:f.drop,happened:null});save();toast('Go. Watch them, not yourself.');closeSheet()});
  $('#sheetBody').querySelectorAll('[data-seenres]').forEach(b=>b.addEventListener('click',()=>openSeenRes(b.dataset.seenres)))}
function openSeenRes(id){const x=S.unstuck.seen.find(s=>s.id===id);openSheet('What actually happened',`<form class="form" id="srForm"><p class="small">You did: <b>${esc(x.act)}</b><br>You predicted: “${esc(x.pred)}” (${x.sure}% sure)</p>
  <label class="f">What actually happened<input type="text" name="happened" required maxlength="200"></label>
  <label class="chip-pick"><input type="checkbox" name="better" checked> It went better than I predicted</label>
  <label class="f">What I learned<input type="text" name="learn" maxlength="200"></label><button class="btn" type="submit">Save (+3)</button></form>`);
  $('#srForm').addEventListener('submit',ev=>{ev.preventDefault();const f=Object.fromEntries(new FormData(ev.target));Object.assign(x,{happened:f.happened,better:!!f.better,learn:f.learn,done:today()});addEntry({title:'Be seen: '+x.act,skill:'life_unstuck',mode:'tested',points:3});toast('+3 φόρα. That is the Nothing losing ground.');closeSheet()})}
function openEvidence(){unInit();const U=S.unstuck;const list=allEntries().filter(e=>e.date>=U.day).sort((a,b)=>b.date.localeCompare(a.date));
  openSheet('Evidence since '+fmtDate(U.day),`<div class="stack"><p class="small">The Nothing says nothing matters. This is what you did.</p>${U.moved?`<p class="notice small"><b>What got you moving:</b> ${esc(U.moved)}</p>`:''}<div>${list.slice(0,80).map(entryRow).join('')}</div></div>`)}
function bindUnstuck(v){v.querySelectorAll('[data-un]').forEach(b=>b.addEventListener('click',()=>({day:openUnDay,good:openGood,quiet:openQuiet,name:()=>openNameIt(),seen:openSeen,ev:openEvidence})[b.dataset.un]()));
  v.querySelectorAll('[data-nameit]').forEach(b=>b.addEventListener('click',ev=>{ev.stopPropagation();openNameIt(b.dataset.nameit)}));
  v.querySelectorAll('[data-shop]').forEach(b=>b.addEventListener('click',()=>openShop(b.dataset.shop)));
  const i=v.querySelector('#shopIdeas');i&&i.addEventListener('click',openShopIdeas);const l=v.querySelector('#shopLabor');l&&l.addEventListener('click',openLabor)}
/* ---------- kitchen & money ---------- */
function mnInit(){const D=MONEY.defaults;S.money=S.money||{};const M=S.money;M.prep=M.prep||[];M.ate=M.ate||[];M.moved=M.moved||[];M.moves=M.moves||{};M.outs=M.outs||[];
  if(M.out==null)M.out=D.out;if(M.home==null)M.home=D.home;if(M.day==null)M.day=D.day;if(M.goal==null)M.goal=D.goal;return M}
function mnWeek(){const d=new Date(today()+'T12:00:00');const j=new Date(d.getFullYear(),0,1);return Math.floor(((d-j)/864e5+j.getDay())/7)}
function mnMenu(){return MONEY.menus[mnWeek()%MONEY.menus.length]}
function mnAdd(ds,n){const d=new Date(ds+'T12:00:00');d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)}
function mnStock(){const M=mnInit();const last=M.prep.filter(p=>daysSince(p.date)<=3).slice(-1)[0];
  const fridge=last?Math.max(0,last.fridge-M.ate.filter(a=>a.from==='fridge'&&a.date>=last.date).length):0;
  const freezer=Math.max(0,M.prep.reduce((s,p)=>s+(+p.freezer||0),0)-M.ate.filter(a=>a.from==='freezer').length);
  return {fridge,freezer,eatBy:last?mnAdd(last.date,3):''}}
function mnSv(a,M){return a.sv!=null?a.sv:Math.max(0,M.out-M.home)}
function mnSave(){const M=mnInit();return M.ate.reduce((s,a)=>s+mnSv(a,M),0)}
function mnMovedTo(k){return mnInit().moved.filter(m=>!k||m.to===k).reduce((s,m)=>s+(+m.amt||0),0)}
function mnUnbanked(){return Math.max(0,mnSave()-mnMovedTo())}
function mnMonth(){const M=mnInit(),m=today().slice(0,7);return M.ate.filter(a=>a.date.slice(0,7)===m).reduce((s,a)=>s+mnSv(a,M),0)}
function mnPreppedThisWeek(){return mnInit().prep.some(p=>daysSince(p.date)<7)}
function mnMealOut(){const M=mnInit();return Math.floor(M.ate.length/MONEY.mealOutEvery)-M.outs.length}
function money$(n){return '$'+Math.round(n).toLocaleString()}
function moneyMini(){const M=mnInit(),st=mnStock(),isDay=new Date().getDay()===M.day,u=mnUnbanked();
  let eb,h,p;
  if(isDay&&!mnPreppedThisWeek()){eb='Prep day';h=mnMenu().n;p='About 90 minutes. Five lunches, and the week is decided.'}
  else if(st.fridge){eb='Kitchen & money · '+st.fridge+' in the fridge';h='Eat from the fridge today';p='Eat by '+fmtDate(st.eatBy)+'. Each one saves about '+money$(M.out-M.home)+'.'}
  else if(st.freezer){eb='Kitchen & money · fridge empty';h=st.freezer+' meals in the freezer';p='Move one to the fridge tonight.'}
  else {eb='Kitchen & money';h='The fridge is empty';p='Next prep: '+MONEY.days[M.day]+'. Or a 30-minute rescue prep now.'}
  if(u>=25)p+=' '+money$(u)+' saved and not yet moved.';
  return `<button class="mini" data-open="money"><span class="eyebrow">${esc(eb)}</span><h4>${esc(h)}</h4><p>${esc(p)}</p></button>`}
function moneyHtml(){const M=mnInit(),st=mnStock(),u=mnUnbanked(),ef=mnMovedTo('ef'),mo=mnMealOut();const step=ef<500?0:ef<M.goal?1:2;const L=MONEY.ladder[step];
  return `<h2 class="sub-title">Kitchen & money</h2><p class="small muted" style="margin-bottom:var(--space-3)">${esc(MONEY.note)} <a href="${MONEY.stat[1]}" target="_blank" rel="noopener">${esc(MONEY.stat[0])}</a></p>
  <div class="stats"><div class="stat"><b>${st.fridge}</b><span>meals in the fridge</span></div><div class="stat"><b>${money$(mnMonth())}</b><span>saved this month</span></div><div class="stat"><b>${money$(mnMovedTo())}</b><span>moved to future you</span></div></div>
  <div class="grid2" style="margin-top:var(--space-3)">
   <button class="card" data-mn="prep"><span class="eyebrow">${mnPreppedThisWeek()?'Prepped this week':'Prep day · '+esc(MONEY.days[M.day])}</span><h4>${esc(mnMenu().n)}</h4><p class="small">${st.fridge?'Eat by '+esc(fmtDate(st.eatBy))+'.':'Log a prep session (+4).'} ${st.freezer?st.freezer+' in the freezer.':''}</p></button>
   <button class="card" data-mn="pay"><span class="eyebrow">Pay future you · step ${step+1} of 3</span><h4>${u?money$(u)+' ready to move':esc(L.n)}</h4>${step<2?`<span class="bar"><i style="width:${Math.min(100,Math.round(100*ef/(step?M.goal:500)))}%"></i></span>`:''}<p class="small">${esc(L.n)}: ${money$(ef)} so far.</p></button></div>
  <div class="row" style="margin-top:var(--space-3)"><button class="btn small" data-mn="ate">I ate a prepped meal (+1)</button><button class="btn ghost small" data-mn="moves">Money moves</button>${mo>0?'<button class="btn ghost small" data-mn="out">Meal out earned</button>':''}<button class="btn ghost small" data-mn="set">Settings</button></div>`}
function openMoney(){const M=mnInit(),st=mnStock();if(new Date().getDay()===M.day&&!mnPreppedThisWeek()||!st.fridge&&!st.freezer){openPrep();return}openAte()}
function openPrep(){const M=mnInit(),m=mnMenu();
  openSheet('Prep day: '+m.n,`<div class="stack"><ul class="tight small"><li><b>Base:</b> ${esc(m.base)}</li><li><b>Protein:</b> ${esc(m.pro)}</li><li><b>Veg:</b> ${esc(m.veg)}</li><li><b>Fast-day pot:</b> ${esc(m.fast)}</li></ul>
  <p class="xs muted">${esc(MONEY.fastNote)}</p>
  <details><summary class="small">Shopping list</summary><ul class="tight small">${m.shop.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><button class="btn ghost small" id="pCopy">Copy list</button></details>
  <details open><summary class="small">The flow</summary><ol class="tight small">${MONEY.flow.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></details>
  <details><summary class="small">${esc(MONEY.quick.n)}</summary><ol class="tight small">${MONEY.quick.s.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></details>
  <form class="form" id="pForm"><span class="small"><b>Log it</b></span><div class="row"><label class="f">Meals for the fridge<input type="number" name="fridge" min="0" max="12" value="5"></label><label class="f">For the freezer<input type="number" name="freezer" min="0" max="20" value="0"></label></div><button class="btn" type="submit">Prep done (+4)</button></form>
  <p class="xs">${MONEY.safety.map(esc).join(' ')} <a href="${MONEY.safetySrc[1]}" target="_blank" rel="noopener">${esc(MONEY.safetySrc[0])}</a> · <a href="${MONEY.cooking[1]}" target="_blank" rel="noopener">${esc(MONEY.cooking[0])}</a></p></div>`);
  $('#pCopy').addEventListener('click',()=>{try{navigator.clipboard.writeText(m.shop.join('\n'));toast('List copied')}catch(e){}});
  $('#pForm').addEventListener('submit',ev=>{ev.preventDefault();const f=Object.fromEntries(new FormData(ev.target));const fr=+f.fridge||0,fz=+f.freezer||0;const pt=fr+fz>=3?4:2;
    M.prep.push({date:today(),fridge:fr,freezer:fz,menu:m.n});addEntry({title:'Prep day: '+m.n+' · '+(fr+fz)+' meals',skill:'money_prep',skill2:'food_bake',mode:'handson',points:pt});toast('+'+pt+' φόρα · the week is decided');closeSheet()})}
function openAte(){const M=mnInit(),st=mnStock(),sv=Math.max(0,M.out-M.home);
  openSheet('A prepped meal',`<div class="stack"><p class="small">Each one saves about ${money$(sv)}: ${money$(M.out)} out vs ${money$(M.home)} at home.</p>
  <div class="row"><button class="btn" data-from="fridge"${st.fridge?'':' disabled'}>From the fridge (${st.fridge})</button><button class="btn ghost" data-from="freezer"${st.freezer?'':' disabled'}>From the freezer (${st.freezer})</button></div>
  ${!st.fridge&&!st.freezer?'<button class="btn ghost small" id="aPrep">Nothing prepped. Open prep day</button>':''}${st.fridge?`<p class="xs muted">Eat by ${esc(fmtDate(st.eatBy))}.</p>`:''}</div>`);
  $('#sheetBody').querySelectorAll('[data-from]').forEach(b=>b.addEventListener('click',()=>{M.ate.push({date:today(),from:b.dataset.from,sv});addEntry({title:'Ate a prepped meal · saved '+money$(sv),skill:'money_prep',skill2:'money_save',mode:'practice',points:1});
    const u=mnUnbanked();toast('+1 φόρα · '+money$(u)+' ready to move');closeSheet();if(M.ate.length%MONEY.mealOutEvery===0)setTimeout(()=>toast('A planned meal out is earned'),2800)}));
  const a=$('#aPrep');a&&a.addEventListener('click',openPrep)}
function openPay(){const M=mnInit(),u=mnUnbanked(),ef=mnMovedTo('ef'),step=ef<500?0:ef<M.goal?1:2;
  openSheet('Pay future you',`<div class="stack"><p class="small">Prepped meals have saved ${money$(mnSave())}. ${money$(u)} is still sitting in checking. Move it, then log it here.</p>
  <ol class="tight small">${MONEY.ladder.map((l,i)=>`<li${i===step?' style="font-weight:600"':''}>${esc(l.n)}. ${esc(l.d)} <a href="${l.src[1]}" target="_blank" rel="noopener">${esc(l.src[0])}</a>${l.src2?` · <a href="${l.src2[1]}" target="_blank" rel="noopener">${esc(l.src2[0])}</a>`:''}</li>`).join('')}</ol>
  <form class="form" id="payForm"><div class="row"><label class="f">Amount<input type="number" name="amt" min="1" step="1" required value="${Math.round(u)||''}"></label><label class="f">Where it went<select name="to"><option value="ef"${step<2?' selected':''}>Emergency fund</option><option value="ira"${step===2?' selected':''}>Roth IRA</option><option value="other">Other savings</option></select></label></div><button class="btn" type="submit">I moved it (+3)</button></form>
  <p class="xs muted">The easiest version: an automatic weekly transfer. <a href="${MONEY.autoSrc[1]}" target="_blank" rel="noopener">${esc(MONEY.autoSrc[0])}</a>. ${esc(MONEY.disclaimer)}</p>
  ${M.moved.length?`<details><summary class="small">History</summary>${M.moved.slice().reverse().map(x=>`<div class="xs">${esc(fmtDate(x.date))} · ${money$(x.amt)} · ${x.to==='ef'?'Emergency fund':x.to==='ira'?'Roth IRA':'Savings'}</div>`).join('')}</details>`:''}</div>`);
  $('#payForm').addEventListener('submit',ev=>{ev.preventDefault();const f=Object.fromEntries(new FormData(ev.target));const a=+f.amt;if(!a)return;M.moved.push({date:today(),amt:a,to:f.to});
    addEntry({title:'Paid future me: '+money$(a)+(f.to==='ira'?' to the Roth IRA':f.to==='ef'?' to the emergency fund':' to savings'),skill:'money_invest',mode:'directed',points:3});toast('+3 φόρα · future you says thanks');closeSheet()})}
function openMoves(){const M=mnInit();
  openSheet('Money moves',`<div class="stack"><p class="small">One-time moves. Each one keeps paying after you do it once.</p>${MONEY.moves.map(m=>`<label class="step-row entry"><input type="checkbox" data-mv="${m.id}"${M.moves[m.id]?' checked disabled':''}><div><div class="entry-title small">${esc(m.t)}</div><div class="xs muted">${esc(m.w)}${M.moves[m.id]?' · done '+esc(fmtDate(M.moves[m.id])):''}</div></div></label>`).join('')}</div>`);
  $('#sheetBody').querySelectorAll('[data-mv]').forEach(c=>c.addEventListener('change',()=>{if(!c.checked)return;const m=MONEY.moves.find(x=>x.id===c.dataset.mv);M.moves[m.id]=today();c.disabled=true;addEntry({title:'Money move: '+m.t,skill:'money_save',mode:'directed',points:2});toast('+2 φόρα')}))}
function openMealOut(){const M=mnInit();openSheet('Meal out, earned',`<div class="stack"><p class="small">Every ${MONEY.mealOutEvery} prepped meals earns one planned meal out. Pick the place ahead, enjoy it, no guilt.</p><form class="form" id="moForm"><label class="f">Where<input type="text" name="w" maxlength="80"></label><button class="btn" type="submit">I took it</button></form></div>`);
  $('#moForm').addEventListener('submit',ev=>{ev.preventDefault();M.outs.push({date:today(),where:new FormData(ev.target).get('w')||''});save();toast('Enjoy it');closeSheet()})}
function openMoneySet(){const M=mnInit();openSheet('Kitchen & money settings',`<form class="form" id="msForm"><label class="f">A typical meal out costs<input type="number" name="out" min="1" value="${M.out}"></label><label class="f">A prepped meal costs<input type="number" name="home" min="0" value="${M.home}"></label>
  <label class="f">Prep day<select name="day">${MONEY.days.map((d,i)=>`<option value="${i}"${i===M.day?' selected':''}>${d}</option>`).join('')}</select></label><label class="f">Emergency fund goal (3 to 6 months of basic costs)<input type="number" name="goal" min="500" step="100" value="${M.goal}"></label><button class="btn" type="submit">Save</button></form>`);
  $('#msForm').addEventListener('submit',ev=>{ev.preventDefault();const f=Object.fromEntries(new FormData(ev.target));M.out=+f.out;M.home=+f.home;M.day=+f.day;M.goal=Math.max(500,+f.goal||500);save();closeSheet();render()})}
function bindMoney(v){v.querySelectorAll('[data-mn]').forEach(b=>b.addEventListener('click',()=>({prep:openPrep,pay:openPay,ate:openAte,moves:openMoves,out:openMealOut,set:openMoneySet})[b.dataset.mn]()))}
/* ---------- study hall ---------- */
const HALL={script:['Flip the Timeular to Study hall.','Book, pencil and one index card on the desk.','Write the date and your start page on the card.','Tap Start, join the call. The phone stays on the call until the end.'],
 during:['Read on paper. The call is your only screen.','End of each chapter, or every 10 pages: one line on the card.','A student arrives: write the page on the card, card in the book, book closed. They get all of you.','They leave: open the book at the card and keep going.'],
 why:'Showing up is the job, even when no one comes. The card holds your place so a student never costs you the book.',
 src:[['Writing down where you stopped reduces attention residue (Leroy and Glomb 2018)','https://www.thewhyweproject.com/people/sophie-leroy'],['Autistic adults describe outside structure and prompts as what gets them moving (Buckle et al. 2021)','https://pmc.ncbi.nlm.nih.gov/articles/PMC8314008/']]};
function hlInit(){S.hall=S.hall||{};const H=S.hall;H.sessions=H.sessions||[];H.days=H.days||[];if(H.meet==null)H.meet='';if(H.time==null)H.time='';return H}
function hlBooks(){return (S.books||[]).filter(b=>(b.status||'Reading')==='Reading')}
function hlBook(id){return (S.books||[]).find(b=>b.id===id)}
function hlLastPage(id){const s=hlInit().sessions.filter(x=>x.book===id&&x.p1).slice(-1)[0];return s?s.p1:''}
function hlToday(){return hlInit().days.includes(new Date().getDay())}
function hlStats(){const H=hlInit(),s=H.sessions;return {n:s.length,came:s.filter(x=>x.students>0).length,pages:s.reduce((a,x)=>a+Math.max(0,(+x.p1||0)-(+x.p0||0)),0),min:s.reduce((a,x)=>a+(+x.min||0),0)}}
function hlClock(ts){const d=new Date(ts);return d.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}
function hallMini(){const H=hlInit();if(H.cur)return `<button class="mini" data-open="hall"><span class="eyebrow">Study hall · in progress</span><h4>Back from the call?</h4><p>Started ${esc(hlClock(H.cur.start))}. Log the page you reached.</p></button>`;
  if(!hlToday())return '';const done=H.sessions.some(x=>x.date===today());const b=hlBook(H.book);
  return `<button class="mini" data-open="hall"><span class="eyebrow">Study hall${H.time?' · '+esc(H.time):''}${done?' · showed up':''}</span><h4>${done?'You showed up':'Show up, then read'}</h4><p>${done?'Logged.':b?esc(b.title)+(hlLastPage(b.id)?', from page '+esc(hlLastPage(b.id)):''):'Pick the book you’ll read on the call.'}</p></button>`}
function hallHtml(){const H=hlInit(),st=hlStats(),b=hlBook(H.book);
  return `<h2 class="sub-title">Study hall</h2><p class="small muted" style="margin-bottom:var(--space-3)">${esc(HALL.why)}</p>
  <div class="stats"><div class="stat"><b>${st.n}</b><span>times showed up</span></div><div class="stat"><b>${st.pages}</b><span>pages read on the call</span></div><div class="stat"><b>${Math.round(st.min/6)/10}</b><span>hours held open</span></div></div>
  <div class="row" style="margin-top:var(--space-3)"><button class="btn small" data-hl="go">${H.cur?'Finish study hall':'Start study hall'}</button><button class="btn ghost small" data-hl="set">Days and Meet link</button></div>
  <p class="xs muted" style="margin-top:var(--space-2)">${H.days.length?esc(H.days.map(d=>MONEY.days[d].slice(0,3)).join(', '))+(H.time?' · '+esc(H.time):''):'No days set yet.'}${b?' · Reading: '+esc(b.title):''}${st.came?' · students came '+st.came+' time'+(st.came>1?'s':''):''}</p>`}
function openHall(){const H=hlInit();if(H.cur){openHallEnd();return}if(!H.days.length&&!H.meet){openHallSet(true);return}
  const bs=hlBooks();const sel=H.book&&hlBook(H.book)?H.book:(bs[0]||{}).id||'';
  openSheet('Study hall',`<form class="form" id="hsForm"><p class="small muted">${esc(HALL.why)}</p>
  <div class="card"><span class="eyebrow">Before</span><ol class="tight small">${HALL.script.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></div>
  <div class="card"><span class="eyebrow">On the call, read once now</span><ol class="tight small">${HALL.during.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></div>
  <label class="f">Book<select name="book">${bs.map(b=>`<option value="${b.id}"${b.id===sel?' selected':''}>${esc(b.title)}</option>`).join('')}<option value="__new"${bs.length?'':' selected'}>+ A new book</option></select></label>
  <label class="f" id="hsNew"${bs.length?' hidden':''}>New book title<input type="text" name="nt" maxlength="120"></label>
  <label class="f">Start page<input type="number" name="p0" min="0" value="${esc(String(hlLastPage(sel)||''))}"></label>
  <button class="btn" type="submit">Start${H.meet?' and join the call':''}</button>
  <p class="xs">${HALL.src.map(x=>`<a href="${x[1]}" target="_blank" rel="noopener">${esc(x[0])}</a>`).join(' · ')}</p></form>`);
  const f=$('#hsForm');f.book.addEventListener('change',()=>{$('#hsNew').hidden=f.book.value!=='__new';if(f.book.value!=='__new')f.p0.value=hlLastPage(f.book.value)||''});
  f.addEventListener('submit',ev=>{ev.preventDefault();let id=f.book.value;
    if(id==='__new'){const t=f.nt.value.trim();if(!t){toast('Name the book first.');return}id=uid();S.books.push({id,title:t,author:'',status:'Reading',insights:[]})}
    H.book=id;H.cur={start:Date.now(),date:today(),book:id,p0:+f.p0.value||0};save();closeSheet();render();
    if(H.meet){const l=document.createElement('a');l.href=H.meet;l.target='_blank';l.rel='noopener';document.body.appendChild(l);l.click();l.remove()}})}
function openHallEnd(){const H=hlInit(),c=H.cur,b=hlBook(c.book)||{title:'Book'};const min=Math.max(1,Math.round((Date.now()-c.start)/60000));
  openSheet('Study hall: done',`<form class="form" id="heForm"><p class="small">Started ${esc(hlClock(c.start))}, about ${min} minute${min===1?'':'s'}. ${esc(b.title)}, from page ${c.p0||'?'}.</p>
  <label class="f">Minutes on the call<input type="number" name="min" min="1" max="300" value="${Math.min(min,300)}"></label>
  <label class="f">Page you reached<input type="number" name="p1" min="0" value=""></label>
  <span class="small">Students who came</span><div class="treat-pick">${[0,1,2,3].map((n,i)=>`<label class="chip-pick"><input type="radio" name="st" value="${n}"${i===0?' checked':''}> ${n===3?'3+':n}</label>`).join('')}</div>
  <label class="f">Best line from the card (saved as a book insight)<input type="text" name="line" maxlength="240"></label>
  <label class="chip-pick"><input type="checkbox" name="fin"> I finished the book</label>
  <button class="btn" type="submit">Log it</button><button class="btn ghost small" type="button" id="heX">Discard this session</button></form>`);
  const f=$('#heForm');
  $('#heX').addEventListener('click',()=>{delete H.cur;save();closeSheet();render()});
  f.addEventListener('submit',ev=>{ev.preventDefault();const p1=+f.p1.value||0,st=+f.st.value,m=+f.min.value||min,line=f.line.value.trim();const pages=Math.max(0,p1-(c.p0||0));
    H.sessions.push({date:c.date,start:c.start,min:m,book:c.book,p0:c.p0,p1,students:st,line});delete H.cur;
    const bk=hlBook(c.book);if(bk){if(line){bk.insights=bk.insights||[];bk.insights.push({date:today(),text:line,use:'Study hall'})}if(f.fin.checked)bk.status='Finished'}
    addEntry({title:'Study hall: showed up'+(st?' · '+(st===3?'3+':st)+' student'+(st===1?'':'s'):''),skill:'life_promise',skill2:'ld_motiv',mode:'directed',points:2});
    const rp=pages>=30?3:pages>=10?2:pages>0||m>=20?1:0;if(rp)addEntry({title:'Read on the call: '+(bk?bk.title:'book')+(pages?' · '+pages+' pages':''),skill:'mind_read',mode:'read',points:rp});
    toast('+'+(2+rp)+' φόρα · you showed up');closeSheet();render()})}
function openHallSet(first){const H=hlInit();openSheet('Study hall setup',`<form class="form" id="hcForm">${first?'<p class="small">Set it once. After this, the card appears on Today on study hall days.</p>':''}
  <label class="f">Google Meet link<input type="url" name="meet" placeholder="https://meet.google.com/..." value="${esc(H.meet)}"></label>
  <span class="small">Days</span><div class="treat-pick">${MONEY.days.map((d,i)=>`<label class="chip-pick"><input type="checkbox" name="d" value="${i}"${H.days.includes(i)?' checked':''}> ${d.slice(0,3)}</label>`).join('')}</div>
  <label class="f">Time (just a label)<input type="text" name="time" maxlength="20" placeholder="4:00 PM" value="${esc(H.time)}"></label><button class="btn" type="submit">Save</button></form>`);
  $('#hcForm').addEventListener('submit',ev=>{ev.preventDefault();const fd=new FormData(ev.target);H.meet=(fd.get('meet')||'').trim();H.days=fd.getAll('d').map(Number);H.time=(fd.get('time')||'').trim();save();closeSheet();render();if(first)openHall()})}
function bindHall(v){v.querySelectorAll('[data-hl]').forEach(b=>b.addEventListener('click',()=>({go:openHall,set:()=>openHallSet(false)})[b.dataset.hl]()))}
/* ---------- distill: how? down to a step, why? up to a maxim ---------- */
function dsInit(){S.distill=S.distill||{};const D=S.distill;D.maxims=D.maxims||[];D.goals=D.goals||[];D.skip=D.skip||[];
  if(!D.seeded){D.seeded=1;const sd=DISTILL.seed;const lib=dsLib(sd.maxim);D.maxims.push({id:sd.maxim,lib:sd.maxim,text:lib.text,lede:lib.lede,evidence:sd.evidence.map(t=>({text:t,date:today()})),created:today()});
    if(!D.maxims.some(m=>m.id==='test')){const l=dsLib('test');D.maxims.push({id:'test',lib:'test',text:l.text,lede:l.lede,evidence:[],created:today()})}
    D.goals.push({id:uid(),text:sd.goal.text,date:today(),maxims:sd.goal.maxims.slice(),rungs:sd.goal.rungs.map(t=>({t,done:false}))});save()}
  return D}
function dsLib(id){return DISTILL.maxims.find(m=>m.id===id)}
const DS_STOP=new Set(DISTILL.stop.split(' '));
function dsWords(t){return (t||'').toLowerCase().replace(/[’']/g,'').split(/[^a-z0-9]+/).filter(w=>w.length>2&&!DS_STOP.has(w))}
function dsMax(id){return dsInit().maxims.find(m=>m.id===id)}
function dsAllMax(){const D=dsInit();const own=D.maxims;const lib=DISTILL.maxims.filter(l=>!own.some(m=>m.lib===l.id||m.id===l.id)).map(l=>Object.assign({libOnly:1},l));return own.concat(lib)}
function dsCues(m){const D=dsInit();const l=dsLib(m.lib||m.id);const c=new Set((l?l.cues:[]).concat(dsWords(m.text)));D.goals.filter(g=>g.maxims.includes(m.id)).forEach(g=>dsWords(g.text).forEach(w=>c.add(w)));return c}
function dsMatch(text){const w=new Set(dsWords(text));return dsAllMax().map(m=>{const c=dsCues(m);let n=0;w.forEach(x=>{if(c.has(x)||[...c].some(y=>y.length>4&&(x.startsWith(y)||y.startsWith(x))))n++});return {m,n}}).filter(x=>x.n>0).sort((a,b)=>b.n-a.n)}
function dsStrength(m){const D=dsInit();return (m.evidence||[]).length+D.goals.filter(g=>g.maxims.includes(m.id)).length}
function dsLevel(n){let l='Hunch';DISTILL.levels.forEach(([k,t])=>{if(n>=k)l=t});return l}
function dsCur(g){return g.rungs.findIndex(r=>!r.done)}
function dsThreads(g){const D=dsInit(),w=new Set(dsWords(g.text));return D.goals.filter(o=>o.id!==g.id&&(o.maxims.some(x=>g.maxims.includes(x))||dsWords(o.text).some(x=>w.has(x))))}
function dsIncoming(){const D=dsInit();const have=new Set(D.goals.map(g=>g.text.toLowerCase()).concat(D.skip));const out=[];
  (S.promises||[]).filter(p=>p.kind==='once'&&!p.kept).forEach(p=>out.push(p.text));
  if(S.shop&&S.shop.projects)S.shop.projects.filter(p=>!p.done).forEach(p=>out.push(p.name));
  if(S.clip&&S.clip.goal)out.push(S.clip.goal);
  return [...new Set(out.filter(Boolean))].filter(t=>!have.has(t.toLowerCase())).slice(0,4)}
function dsActive(){return dsInit().goals.filter(g=>dsCur(g)>=0)}
function distillMini(){const g=dsActive().slice(-1)[0];if(!g)return `<button class="mini" data-open="distill"><span class="eyebrow">Distill</span><h4>Shrink a big goal</h4><p>Ask how? until the step fits in today.</p></button>`;
  const i=dsCur(g),m=dsMax(g.maxims[0]);return `<button class="mini" data-ds-go="${g.id}"><span class="eyebrow">Distill${m?' · '+esc(m.text):''}</span><h4>${esc(g.rungs[i].t)}</h4><p>Step ${i+1} of ${g.rungs.length} toward ${esc(g.text)}.</p></button>`}
function distillHtml(){const D=dsInit();const own=D.maxims.slice().sort((a,b)=>dsStrength(b)-dsStrength(a));const inc=dsIncoming();
  return `<h2 class="sub-title">Distill</h2><p class="small muted" style="margin-bottom:var(--space-3)">${esc(DISTILL.lede)}</p>
  <div class="card"><span class="eyebrow">Your principles</span>${own.length?own.map(m=>{const n=dsStrength(m);const gs=D.goals.filter(g=>g.maxims.includes(m.id));return `<div class="ds-row"><div class="ds-t">${esc(m.text)}</div><div class="xs muted"><span>${dsLevel(n)} · shows up in ${n} place${n===1?'':'s'}</span></div>${gs.length?`<div class="chain">${gs.map(g=>`<span class="link-chip">${esc(g.text)}</span>`).join('')}</div>`:''}<div class="row" style="margin-top:var(--space-2)"><button class="btn ghost small" data-ds-apply="${m.id}">Apply it to something</button><button class="linkish xs" data-ds-ev="${m.id}">+ Where else I’ve seen it</button></div></div>`}).join(''):'<p class="small">None yet. Distill a goal and name the lesson.</p>'}</div>
  ${D.goals.map(g=>{const i=dsCur(g);const th=dsThreads(g);return `<div class="card${i<0?' kept':''}" style="margin-top:var(--space-3)"><span class="eyebrow">${i<0?'Done':'Step '+(i+1)+' of '+g.rungs.length}${g.maxims.length?' · '+g.maxims.map(x=>(dsMax(x)||{}).text).filter(Boolean).map(esc).join(' · '):''}</span><h4>${esc(g.text)}</h4>
   <div class="chain">${g.rungs.map((r,k)=>`<span class="link-chip${k===i?' now':''}${r.done?' done':''}">${esc(r.t)}</span>`).join('<span class="arr">→</span>')}</div>
   ${i>=0?`<div class="row" style="margin-top:var(--space-3)"><button class="btn small" data-ds-done="${g.id}">Did it: ${esc(g.rungs[i].t.slice(0,40))}${g.rungs[i].t.length>40?'…':''} (+${i===g.rungs.length-1?5:1})</button><button class="btn ghost small" data-ds-shrink="${g.id}">Too big? Shrink it</button></div>`:''}
   ${th.length?`<p class="xs muted" style="margin-top:var(--space-2)">Same thread as: ${th.map(o=>esc(o.text)).join(', ')}</p>`:''}<button class="linkish xs" data-ds-del="${g.id}">Remove</button></div>`}).join('')}
  ${inc.length?`<div class="card" style="margin-top:var(--space-3)"><span class="eyebrow">Goals you’ve entered elsewhere</span>${inc.map(t=>{const mm=dsMatch(t)[0];return `<div class="ds-row"><div class="ds-t">${esc(t)}</div><div class="xs muted"><span>${mm?'Looks like: '+esc(mm.m.text):'No thread yet'}</span></div><div class="row"><button class="btn ghost small" data-ds-new="${esc(t)}">Distill it</button><button class="linkish xs" data-ds-skip="${esc(t)}">Not now</button></div></div>`}).join('')}</div>`:''}
  <div class="row" style="margin-top:var(--space-3)"><button class="btn small" data-ds-new="">+ Distill a goal</button></div>
  <p class="xs" style="margin-top:var(--space-2)">${DISTILL.src.map(x=>`<a href="${x[1]}" target="_blank" rel="noopener">${esc(x[0])}</a>`).join(' · ')}</p>`}
function openDistill(pre){const st={text:pre||'',rungs:[]};
  const one=()=>{openSheet('Distill: what do you want?',`<form class="form" id="dsA"><p class="small muted">Write it as big as it really is. We’ll shrink it next.</p><label class="f">The goal<input type="text" name="t" required maxlength="140" value="${esc(st.text)}" placeholder="Import my family’s olive oil"></label><button class="btn" type="submit">Next: how?</button></form>`);
    $('#dsA').addEventListener('submit',ev=>{ev.preventDefault();st.text=ev.target.t.value.trim();if(st.text){st.match=dsMatch(st.text);two()}})};
  const two=()=>{const top=st.match[0];const asks=(top?dsLib(top.m.lib||top.m.id)||dsLib('boring'):dsLib('boring')).ask.concat(dsLib('boring').ask);const q=asks[st.rungs.length%asks.length];const above=st.rungs.length?st.rungs[st.rungs.length-1]:st.text;
    openSheet('Distill: how?',`<form class="form" id="dsB">${top?`<p class="small">This looks like <b>${esc(top.m.text)}</b>.</p>`:''}
    <div class="chain"><span class="link-chip">${esc(st.text)}</span>${st.rungs.slice().reverse().map(r=>`<span class="arr">←</span><span class="link-chip">${esc(r)}</span>`).join('')}</div>
    <label class="f">How? One size smaller than “${esc(above)}”<input type="text" name="r" required maxlength="120"></label><p class="xs muted">${esc(q)}</p>
    <p class="small">${esc(DISTILL.today)}</p><div class="row"><button class="btn" type="submit" name="go" value="yes">Yes, I can do it today</button><button class="btn ghost" type="submit" name="go" value="no">No, go smaller</button></div></form>`);
    const f=$('#dsB');let go='no';f.querySelectorAll('button[name=go]').forEach(b=>b.addEventListener('click',()=>{go=b.value}));
    f.addEventListener('submit',ev=>{ev.preventDefault();const r=f.r.value.trim();if(!r)return;st.rungs.push(r);if(go==='yes'||st.rungs.length>=7)three();else two()})};
  const three=()=>{const sug=st.match.map(x=>x.m);dsInit().maxims.forEach(m=>{if(!sug.includes(m))sug.push(m)});if(!sug.some(m=>m.id==='boring'))sug.push(dsLib('boring'));
    openSheet('Distill: why?',`<form class="form" id="dsC"><p class="small">Why does starting with “${esc(st.rungs[st.rungs.length-1])}” make sense? Name the principle. The same one probably runs through other goals too.</p>
    <div class="stack">${sug.slice(0,6).map((m,i)=>`<label class="chip-pick"><input type="checkbox" name="m" value="${m.id}"${i===0&&st.match.length?' checked':''}> ${esc(m.text)}${m.libOnly||!dsMax(m.id)?' <span class="xs muted">(new for you)</span>':' <span class="xs muted">· '+dsLevel(dsStrength(m))+'</span>'}</label>`).join('')}</div>
    <label class="f">Or say it in your own words<input type="text" name="own" maxlength="80" placeholder="Sell something small"></label><button class="btn" type="submit">Save (+2)</button></form>`);
    $('#dsC').addEventListener('submit',ev=>{ev.preventDefault();const fd=new FormData(ev.target);const D=dsInit();const ids=fd.getAll('m');
      ids.forEach(id=>{if(!dsMax(id)){const l=dsLib(id);if(l)D.maxims.push({id,lib:id,text:l.text,lede:l.lede,evidence:[],created:today()})}});
      const own=(fd.get('own')||'').trim();if(own){const ex=D.maxims.find(m=>m.text.toLowerCase()===own.toLowerCase());if(ex)ids.push(ex.id);else{const id=uid();D.maxims.push({id,text:own,lede:'',evidence:[],created:today()});ids.push(id)}}
      const g={id:uid(),text:st.text,date:today(),maxims:[...new Set(ids)],rungs:st.rungs.slice().reverse().map(t=>({t,done:false})).concat([{t:st.text,done:false}])};D.goals.push(g);
      addEntry({title:'Distilled: '+st.text+' → '+g.rungs[0].t,skill:'mind_distill',mode:'think',points:2});
      const m=dsMax(g.maxims[0]);closeSheet();render();toast(m?m.text+' · '+dsLevel(dsStrength(m))+' ('+dsStrength(m)+')':'+2 φόρα')})};
  one()}
function openDsShrink(gid,step){const g=dsInit().goals.find(x=>x.id===gid);const i=dsCur(g);const m=dsMax(g.maxims[0]);const asks=((m&&dsLib(m.lib||m.id))||dsLib('boring')).ask;
  openSheet('Shrink it',`<form class="form" id="dsS">${step?`<p class="small">${esc(step)}</p>`:''}<label class="f">One size smaller than “${esc(g.rungs[i].t)}”<input type="text" name="r" required maxlength="120"></label><p class="xs muted">${esc(asks[0])} ${esc(dsLib('boring').ask[0])}</p><button class="btn" type="submit">That’s the new next step</button></form>`);
  $('#dsS').addEventListener('submit',ev=>{ev.preventDefault();const r=ev.target.r.value.trim();if(!r)return;g.rungs.splice(i,0,{t:r,done:false});save();closeSheet();render();toast('Smaller is better')})}
function openDsApply(mid){const D=dsInit();const m=dsMax(mid)||dsLib(mid);const l=dsLib(m.lib||m.id);const asks=(l?l.ask:[]).concat(dsLib('boring').ask.slice(0,1));const act=dsActive();
  openSheet('Apply: '+m.text,`<form class="form" id="dsP">${m.lede?`<p class="small muted">${esc(m.lede)}</p>`:''}
  <label class="f">Where?<select name="g">${act.map(g=>`<option value="${g.id}">${esc(g.text)}</option>`).join('')}<option value="__new">Something new</option></select></label>
  <label class="f" id="dsPn"${act.length?' hidden':''}>The goal or area<input type="text" name="area" maxlength="140" placeholder="Get my first chef client"></label>
  <div class="card"><span class="eyebrow">Ask yourself</span><ol class="tight small">${asks.map(a=>`<li>${esc(a)}</li>`).join('')}</ol></div>
  <label class="f">So my next specific step is…<input type="text" name="r" required maxlength="120"></label><button class="btn" type="submit">Make it the next step (+1)</button></form>`);
  const f=$('#dsP');f.g.addEventListener('change',()=>{$('#dsPn').hidden=f.g.value!=='__new'});
  f.addEventListener('submit',ev=>{ev.preventDefault();const r=f.r.value.trim();if(!r)return;if(!dsMax(m.id)&&l)D.maxims.push({id:l.id,lib:l.id,text:l.text,lede:l.lede,evidence:[],created:today()});
    let g;if(f.g.value==='__new'){const a=f.area.value.trim();if(!a){toast('Name the goal first.');return}g={id:uid(),text:a,date:today(),maxims:[m.id],rungs:[{t:r,done:false},{t:a,done:false}]};D.goals.push(g)}
    else{g=D.goals.find(x=>x.id===f.g.value);g.rungs.splice(dsCur(g),0,{t:r,done:false});if(!g.maxims.includes(m.id))g.maxims.push(m.id)}
    addEntry({title:'Applied “'+m.text+'”: '+r,skill:'mind_distill',mode:'think',points:1});closeSheet();render();toast('+1 φόρα · principle made specific')})}
function openDsEv(mid){const m=dsMax(mid);openSheet('Where else I’ve seen it',`<form class="form" id="dsE"><p class="small">${esc(m.text)}</p>${(m.evidence||[]).length?`<ul class="tight small">${m.evidence.map(e=>`<li>${esc(e.text)}</li>`).join('')}</ul>`:''}<label class="f">Another time this was true<input type="text" name="t" required maxlength="160"></label><button class="btn" type="submit">Add (+1)</button></form>`);
  $('#dsE').addEventListener('submit',ev=>{ev.preventDefault();const t=ev.target.t.value.trim();if(!t)return;m.evidence=m.evidence||[];m.evidence.push({text:t,date:today()});addEntry({title:'Thread for “'+m.text+'”: '+t,skill:'mind_distill',mode:'think',points:1});closeSheet();render();toast(dsLevel(dsStrength(m))+' · '+dsStrength(m)+' places')})}
function dsDone(gid){const D=dsInit();const g=D.goals.find(x=>x.id===gid);const i=dsCur(g);if(i<0)return;g.rungs[i].done=today();const last=i===g.rungs.length-1;
  if(last){g.done=today();g.maxims.forEach(id=>{const m=dsMax(id);if(m){m.evidence=m.evidence||[];m.evidence.push({text:'Did it: '+g.text,date:today()})}});addEntry({title:'Reached the goal: '+g.text,skill:'mind_distill',skill2:'life_promise',mode:'handson',points:5});toast('Goal reached · +5 φόρα')}
  else{addEntry({title:'Step done: '+g.rungs[i].t,skill:'mind_distill',mode:'handson',points:1});toast('+1 φόρα · next: '+g.rungs[i+1].t)}render()}
function bindDistill(v){
  v.querySelectorAll('[data-ds-new]').forEach(b=>b.addEventListener('click',()=>openDistill(b.dataset.dsNew)));
  v.querySelectorAll('[data-ds-go]').forEach(b=>b.addEventListener('click',()=>{const g=dsInit().goals.find(x=>x.id===b.dataset.dsGo);const i=dsCur(g);
    openSheet('Next step',`<div class="stack"><p class="small muted">Toward: ${esc(g.text)}</p><h3>${esc(g.rungs[i].t)}</h3><p class="small">${esc(DISTILL.today)}</p><div class="row"><button class="btn" id="dsY">Did it (+${i===g.rungs.length-1?5:1})</button><button class="btn ghost" id="dsN">Too big? Shrink it</button></div></div>`);
    $('#dsY').addEventListener('click',()=>{closeSheet();dsDone(g.id)});$('#dsN').addEventListener('click',()=>openDsShrink(g.id))}));
  v.querySelectorAll('[data-ds-done]').forEach(b=>b.addEventListener('click',()=>dsDone(b.dataset.dsDone)));
  v.querySelectorAll('[data-ds-shrink]').forEach(b=>b.addEventListener('click',()=>openDsShrink(b.dataset.dsShrink)));
  v.querySelectorAll('[data-ds-apply]').forEach(b=>b.addEventListener('click',()=>openDsApply(b.dataset.dsApply)));
  v.querySelectorAll('[data-ds-ev]').forEach(b=>b.addEventListener('click',()=>openDsEv(b.dataset.dsEv)));
  v.querySelectorAll('[data-ds-skip]').forEach(b=>b.addEventListener('click',()=>{dsInit().skip.push(b.dataset.dsSkip.toLowerCase());save();render()}));
  v.querySelectorAll('[data-ds-del]').forEach(b=>b.addEventListener('click',()=>{if(confirm('Remove this goal?')){const D=dsInit();D.goals=D.goals.filter(g=>g.id!==b.dataset.dsDel);save();render()}}))}
/* ---------- starting muscles ---------- */
function stInit(){S.start=S.start||{};const T=S.start;T.reps=T.reps||{};T.log=T.log||[];T.dump=T.dump||[];return T}
function stB(id){return START.blocks.find(b=>b.id===id)}
function stLevel(id){return Math.min(5,Math.floor((stInit().reps[id]||0)/START.per)+1)}
function stInto(id){const r=stInit().reps[id]||0;return r>=START.per*5?START.per:r%START.per}
let stTimer=null;function stStop(){if(stTimer){clearInterval(stTimer);stTimer=null}}
function stBeep(n){try{const a=new (window.AudioContext||window.webkitAudioContext)();for(let i=0;i<(n||1);i++){const o=a.createOscillator(),g=a.createGain();o.frequency.value=880;o.connect(g);g.connect(a.destination);g.gain.setValueAtTime(.2,a.currentTime+i*.35);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+i*.35+.3);o.start(a.currentTime+i*.35);o.stop(a.currentTime+i*.35+.3)}}catch(e){}if(navigator.vibrate)navigator.vibrate(200)}
function stClock(s){s=Math.max(0,Math.round(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
function stFix(id,note,extra){const T=stInit();T.log.push(Object.assign({date:today(),b:id,kind:'fix',note:note||''},extra||{}));const b=stB(id);addEntry({title:b.fix+': '+(note||b.name),skill:'psych_start',mode:'practice',points:id==='reward'?2:1})}
function startMini(){return `<button class="mini" data-open="start"><span class="eyebrow">Can’t start?</span><h4>Name what’s in the way</h4><p>Six quick fixes, one for each kind of stuck.</p></button>`}
function startHtml(){const T=stInit();const tot=Object.values(T.reps).reduce((a,b)=>a+b,0);
  return `<h2 class="sub-title">Starting muscles</h2><p class="small muted" style="margin-bottom:var(--space-3)">${esc(START.lede)}</p>
  <div class="card">${START.blocks.map(b=>{const L=stLevel(b.id),n=stInto(b.id),done=(T.reps[b.id]||0)>=START.per*5;return `<div class="ds-row"><div class="ds-t">${esc(b.name)}</div><div class="xs muted">${esc(b.sci)} · level ${L} of 5 · ${done?'all levels done':n+' of '+START.per+' reps'}</div><div class="bar-s"><i style="width:${Math.round((done?1:n/START.per)*100)}%"></i></div><p class="small" style="margin:var(--space-1) 0">Next rep: ${esc(b.levels[L-1])}</p><div class="row"><button class="btn small" data-st-fix="${b.id}">${esc(b.fix)}</button><button class="btn ghost small" data-st-rep="${b.id}">I did the rep (+2)</button></div></div>`}).join('')}</div>
  <p class="xs muted" style="margin-top:var(--space-2)">${tot} reps so far. ${START.blocks.map(b=>`<a href="${b.src[1]}" target="_blank" rel="noopener">${esc(b.src[0])}</a>`).join(' · ')}</p>`}
function openStart(){stStop();openSheet('Can’t start?',`<div class="stack"><p class="small muted">What is in the way right now? Pick the closest one.</p>${START.blocks.map(b=>`<button class="btn ghost wide-l" data-st-pick="${b.id}"><b>${esc(b.name)}</b><span class="xs muted"> · ${esc(b.fix)}</span></button>`).join('')}</div>`);
  $('#sheetBody').querySelectorAll('[data-st-pick]').forEach(x=>x.addEventListener('click',()=>openStFix(x.dataset.stPick)))}
function stNext(){const D=typeof dsActive==='function'?dsActive().slice(-1)[0]:null;return D?D.rungs[dsCur(D)].t:''}
function openStFix(id){stStop();({init:stInitFix,wm:stWm,decide:stDecide,reward:stReward,trans:stTrans,perfect:stPerfect})[id]()}
function stHead(b){return `<p class="small">${esc(b.fixHow)}</p>${b.note?`<p class="xs muted">${esc(b.note)}</p>`:''}`}
function stInitFix(){const b=stB('init');openSheet(b.fix,`<form class="form" id="stI">${stHead(b)}<label class="f">The task<input type="text" name="t" maxlength="100" value="${esc(stNext())}"></label><label class="f">The very first physical motion<input type="text" name="m" required maxlength="100" placeholder="Stand up and pick up the sponge"></label><button class="btn" type="submit">Count me down</button></form>`);
  $('#stI').addEventListener('submit',ev=>{ev.preventDefault();const t=ev.target.t.value.trim(),m=ev.target.m.value.trim();let n=5;
    const show=()=>{$('#sheetBody').innerHTML=`<div class="stack st-big"><p class="small muted">${esc(m)}</p><div class="st-count">${n>0?n:'Go'}</div></div>`};show();
    stTimer=setInterval(()=>{n--;show();if(n<=0){stStop();stBeep(2);let s=120;const t0=Date.now();
      $('#sheetBody').innerHTML=`<div class="stack st-big"><h3>${esc(m)}</h3><div class="st-count" id="stC">2:00</div><p class="small muted">You may stop when this hits zero. Keep going if you want.</p><button class="btn" id="stDone">I started (+1)</button></div>`;
      $('#stDone').addEventListener('click',()=>{stStop();stFix('init',t||m,{secs:Math.round((Date.now()-t0)/1000)});closeSheet();render();toast('Started · +1 φόρα')});
      stTimer=setInterval(()=>{s--;const c=$('#stC');if(!c){stStop();return}c.textContent=stClock(s);if(s<=0){stStop();stBeep(1);c.textContent='Free to stop'}},1000)}},1000)})}
function stWm(){const b=stB('wm'),T=stInit();openSheet(b.fix,`<form class="form" id="stW">${stHead(b)}<label class="f">Everything in your head, one per line<textarea name="d" rows="7" required>${esc(T.dump.join('\n'))}</textarea></label><button class="btn" type="submit">Hide all but one</button></form>`);
  $('#stW').addEventListener('submit',ev=>{ev.preventDefault();T.dump=ev.target.d.value.split('\n').map(x=>x.trim()).filter(Boolean);save();let done=0;
    const one=()=>{if(!T.dump.length){closeSheet();render();toast('Head empty · '+done+' done');return}
      $('#sheetBody').innerHTML=`<div class="stack st-big"><p class="xs muted">${T.dump.length} on the list. You only see this one.</p><h3>${esc(T.dump[0])}</h3><div class="row"><button class="btn" id="stWd">Done (+1)</button><button class="btn ghost" id="stWs">Not now, next</button><button class="btn ghost small" id="stWx">Stop here</button></div></div>`;
      $('#stWd').addEventListener('click',()=>{const x=T.dump.shift();done++;stFix('wm',x);one()});
      $('#stWs').addEventListener('click',()=>{T.dump.push(T.dump.shift());save();one()});
      $('#stWx').addEventListener('click',()=>{save();closeSheet();render()})};one()})}
function stDecide(){const b=stB('decide'),T=stInit();openSheet(b.fix,`<form class="form" id="stD">${stHead(b)}<label class="f">Options, one per line<textarea name="o" rows="5" required>${esc(T.dump.slice(0,6).join('\n'))}</textarea></label><button class="btn" type="submit">Pick for me</button></form>`);
  $('#stD').addEventListener('submit',ev=>{ev.preventDefault();const o=ev.target.o.value.split('\n').map(x=>x.trim()).filter(Boolean);if(o.length<2){toast('Give it at least two.');return}
    const pick=o[Math.floor(Math.random()*o.length)];
    $('#sheetBody').innerHTML=`<div class="stack st-big"><p class="xs muted">The die picked</p><h3>${esc(pick)}</h3><p class="small">Do it for 10 minutes. Felt relief at a different one? Tap it: that was your answer.</p><div class="treat-pick">${o.filter(x=>x!==pick).map(x=>`<button class="chip-pick" data-alt="${esc(x)}">${esc(x)}</button>`).join('')}</div><button class="btn" id="stDk">Doing it (+1)</button></div>`;
    const go=x=>{stFix('decide',x);closeSheet();render();toast('Decided · +1 φόρα')};
    $('#stDk').addEventListener('click',()=>go(pick));$('#sheetBody').querySelectorAll('[data-alt]').forEach(x=>x.addEventListener('click',()=>go(x.dataset.alt)))})}
function stReward(){const b=stB('reward');openSheet(b.fix,`<form class="form" id="stR">${stHead(b)}<label class="f">The task<input type="text" name="t" maxlength="100" value="${esc(stNext())}"></label><span class="small">Only while I do it</span><div class="treat-pick">${START.sweet.map((x,i)=>`<label class="chip-pick"><input type="radio" name="s" value="${esc(x)}"${i===0?' checked':''}> ${esc(x)}</label>`).join('')}</div><button class="btn" type="submit">Starting now (+2)</button>${typeof openTreat==='function'?'<button class="btn ghost small" type="button" id="stRt">Open Treats</button>':''}</form>`);
  const rt=$('#stRt');if(rt)rt.addEventListener('click',()=>openTreat());
  $('#stR').addEventListener('submit',ev=>{ev.preventDefault();const t=ev.target.t.value.trim(),s=ev.target.s.value;stFix('reward',(t||'Task')+' + '+s);closeSheet();render();toast('+2 φόρα for starting · enjoy the '+s.toLowerCase())})}
function stTrans(){const b=stB('trans');openSheet(b.fix,`<form class="form" id="stT">${stHead(b)}<label class="f">What you’re doing now<input type="text" name="now" maxlength="80"></label><label class="f">What’s next<input type="text" name="nx" maxlength="80" value="${esc(stNext())}"></label><span class="small">Land in</span><div class="treat-pick">${[5,10,15,25].map((m,i)=>`<label class="chip-pick"><input type="radio" name="m" value="${m}"${i===1?' checked':''}> ${m} min</label>`).join('')}</div><button class="btn" type="submit">Start the landing</button><p class="xs muted">Keep this screen open. You’ll hear a beep at 5 minutes and 1 minute.</p></form>`);
  $('#stT').addEventListener('submit',ev=>{ev.preventDefault();const f=ev.target,now=f.now.value.trim(),nx=f.nx.value.trim();const end=Date.now()+(+f.m.value)*60000;
    $('#sheetBody').innerHTML=`<div class="stack st-big"><p class="xs muted">Landing from ${esc(now||'this')} into ${esc(nx||'the next thing')}</p><div class="st-count" id="stC"></div><p class="small" id="stM">Keep going. Nothing to do yet.</p><button class="btn ghost small" id="stTn">Land now</button></div>`;
    let w5=false,w1=false;const land=()=>{stStop();stBeep(3);$('#sheetBody').innerHTML=`<form class="form" id="stP"><h3>Land</h3><label class="f">Parking line: where you stopped and what’s next there<input type="text" name="p" required maxlength="140"></label><ol class="tight small">${START.bridge.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><p class="small">Then the first motion of: <b>${esc(nx||'the next thing')}</b></p><button class="btn" type="submit">Landed (+1)</button></form>`;
      $('#stP').addEventListener('submit',e2=>{e2.preventDefault();stFix('trans',(now||'this')+' → '+(nx||'next'),{park:e2.target.p.value.trim()});closeSheet();render();toast('Landed · +1 φόρα')})};
    const tick=()=>{const c=$('#stC');if(!c){stStop();return}const s=(end-Date.now())/1000;c.textContent=stClock(s);if(s<=300&&!w5){w5=true;stBeep(1);$('#stM').textContent='5 minutes. Start finding a stopping place.'}if(s<=60&&!w1){w1=true;stBeep(2);$('#stM').textContent='1 minute. Finish the sentence you are on.'}if(s<=0)land()};
    tick();stTimer=setInterval(tick,1000);$('#stTn').addEventListener('click',land)})}
function stPerfect(){const b=stB('perfect');openSheet(b.fix,`<form class="form" id="stF">${stHead(b)}<label class="f">The task<input type="text" name="t" required maxlength="100" value="${esc(stNext())}"></label><label class="f">What would a C+ version look like?<input type="text" name="c" maxlength="120" placeholder="Bullet points, no polish, typos allowed"></label><label class="f">How bad will it feel to do it at C+? (0 to 10)<input type="range" name="p" min="0" max="10" value="6"></label><span class="small">Timer</span><div class="treat-pick">${[10,15,25].map((m,i)=>`<label class="chip-pick"><input type="radio" name="m" value="${m}"${i===0?' checked':''}> ${m} min</label>`).join('')}</div><button class="btn" type="submit">Start the ugly draft</button></form>`);
  $('#stF').addEventListener('submit',ev=>{ev.preventDefault();const f=ev.target,t=f.t.value.trim(),c=f.c.value.trim(),p=+f.p.value;let s=(+f.m.value)*60;
    $('#sheetBody').innerHTML=`<div class="stack st-big"><p class="xs muted">C+ on purpose${c?': '+esc(c):''}</p><h3>${esc(t)}</h3><div class="st-count" id="stC">${stClock(s)}</div><button class="btn" id="stFd">Done</button></div>`;
    const end=()=>{stStop();$('#sheetBody').innerHTML=`<form class="form" id="stF2"><h3>How bad was it really?</h3><p class="small muted">You guessed ${p} of 10.</p><label class="f">Actual (0 to 10)<input type="range" name="a" min="0" max="10" value="${Math.max(0,p-2)}"></label><button class="btn" type="submit">Log it (+1)</button></form>`;
      $('#stF2').addEventListener('submit',e2=>{e2.preventDefault();const a=+e2.target.a.value;stFix('perfect',t,{pred:p,act:a});closeSheet();render();toast(a<p?'Easier than predicted by '+(p-a)+' · +1':'Logged · +1 φόρα')})};
    stTimer=setInterval(()=>{s--;const el=$('#stC');if(!el){stStop();return}el.textContent=stClock(s);if(s<=0){stBeep(2);end()}},1000);$('#stFd').addEventListener('click',end)})}
function stRep(id){const b=stB(id),L=stLevel(id);openSheet('Rep: '+b.sci,`<form class="form" id="stX"><p class="small">Level ${L}: <b>${esc(b.levels[L-1])}</b></p><label class="f">How it went (optional)<input type="text" name="n" maxlength="140"></label><button class="btn" type="submit">I did it (+2)</button></form>`);
  $('#stX').addEventListener('submit',ev=>{ev.preventDefault();const T=stInit();T.reps[id]=(T.reps[id]||0)+1;T.log.push({date:today(),b:id,kind:'rep',lvl:L,note:ev.target.n.value.trim()});
    addEntry({title:b.sci+' rep, level '+L+': '+b.levels[L-1],skill:'psych_start',mode:'handson',points:2});
    const up=stLevel(id)>L;if(up)addEntry({title:b.sci+' muscle: level '+stLevel(id),skill:'psych_start',mode:'handson',points:5});
    closeSheet();render();toast(up?'Level '+stLevel(id)+' · +7 φόρα':'+2 φόρα · '+stInto(id)+' of '+START.per)})}
function bindStart(v){v.querySelectorAll('[data-st-fix]').forEach(b=>b.addEventListener('click',()=>openStFix(b.dataset.stFix)));v.querySelectorAll('[data-st-rep]').forEach(b=>b.addEventListener('click',()=>stRep(b.dataset.stRep)))}
/* ---------- bind ---------- */
function bindView(){
  const v=$('#view');bindWrite(v);bindSell(v);bindJobs(v);bindLife(v);bindCompact(v);bindUnstuck(v);bindMoney(v);bindHall(v);bindDistill(v);bindStart(v);
  v.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>({think:openThink,feel:()=>openFeel(),inv:openInv,read:openRead,warm:openWarm,move:openMove,treat:openTreat,shop:()=>openShop(),money:openMoney,hall:openHall,distill:()=>openDistill(''),start:openStart,good:openGood,seen:openSeen,card:()=>openCard(cardOfDay().m.id),shelf:openCardShelf})[b.dataset.open]()));
  v.querySelectorAll('[data-gotab]').forEach(b=>b.addEventListener('click',()=>{document.querySelector(`.tabs [data-tab=${b.dataset.gotab}]`).click()}));
  v.querySelectorAll('[data-skill]').forEach(b=>b.addEventListener('click',()=>openSkill(b.dataset.skill)));
  v.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{logFilter=b.dataset.filter;render()}));
  v.querySelectorAll('[data-sort]').forEach(b=>b.addEventListener('click',()=>{logSort=b.dataset.sort;render()}));
  v.querySelectorAll('[data-star]').forEach(bindStar);
  v.querySelectorAll('[data-quick]').forEach(x=>x.addEventListener('click',()=>quickLog(x.dataset.quick,x.dataset.mode,x.dataset.title)));
  const af=$('#addForm');if(af)af.addEventListener('submit',ev=>{ev.preventDefault();const f=new FormData(af);const e={title:f.get('title'),skill:f.get('skill'),mode:f.get('mode'),diff:+f.get('diff')};addEntry(e);toast(`+${pts(e)} φόρα`);render()});
  const ex=$('#exportBtn');if(ex)ex.addEventListener('click',()=>{const blob=new Blob([JSON.stringify(S,null,1)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='skill-tree-backup-'+today()+'.json';document.body.appendChild(a);a.click();a.remove();toast('Backup saved')});
  const im=$('#importFile');if(im)im.addEventListener('change',async()=>{try{const d=JSON.parse(await im.files[0].text());if(!Array.isArray(d.entries))throw 0;S=Object.assign({entries:[],think:[],feelings:[],inventory:[],stars:{},focusTarget:10,chars:[],people:[],books:[],writing:[],drafts:[],blockHits:{},leads:[],sales:[],bizSteps:{},cardm:{},promises:[],clip:{goal:'',trades:[],offers:[]},identity:'',shelf:[],compacts:[],run:{week:0,logs:[]},treats:{cur:null,log:[],claimed:[]},jobs:[],jobPrefs:['q','c','p'],shop:{projects:[],seeded:true},unstuck:{},sellPhone:'+18033990665'},d);save();renderHeader();render();toast('Backup restored')}catch(e){toast('That file is not a Skill Tree backup.')}});
}
renderHeader();render();
})();
