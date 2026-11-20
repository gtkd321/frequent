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
  <div class="practice-row">${others.map(k=>`<button class="mini" data-open="${P[k].fn}"><span class="eyebrow">${doneToday[k]?'Done today':'Also today'}</span><h4>${P[k].t}</h4><p>${P[k].d}</p></button>`).join('')}
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
  const order=BRANCHES.slice().sort((a,b)=>b.skills.reduce((s,[id])=>s+(p[id]||0),0)-a.skills.reduce((s,[id])=>s+(p[id]||0),0));
  return `<h1 class="section-title">Your skill tree</h1>
  <p class="lede">Levels follow Greekquent’s olive path: Seed, Sapling, Tree, Harvest, Lamp. Work skills stop at Tree until you log a hands-on rep, something you did yourself without AI, or a test with real people.</p>
  <div class="grid2">${order.map(b=>{
    const bp=b.skills.reduce((s,[id])=>s+(p[id]||0),0);
    return `<article class="card branch"><div class="branch-head"><h3>${esc(b.name)}</h3><span class="pts">${bp}</span></div>
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
function closeSheet(){if(sheetCleanup){sheetCleanup();sheetCleanup=null}$('#sheetWrap').hidden=true;document.body.style.overflow='';render()}
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
function viewSell(){
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
  <div class="seg" style="margin-bottom:var(--space-4)">${BIZ.map(x=>`<button data-biz="${x.id}" aria-pressed="${x.id===b.id}">${esc(x.short)}</button>`).join('')}</div>
  <article class="card up-next">${top}</article>
  <div class="stats"><div class="stat"><b>${done}/${b.steps.length}</b><span>steps done</span></div><div class="stat"><b>${leads.filter(l=>!['Won','Not now'].includes(l.stage)).length}</b><span>open leads</span></div><div class="stat"><b>${b.id==='ride'?'$'+rev.toFixed(0):wk}</b><span>${b.id==='ride'?'sales, last 30 days':'follow-ups this week'}</span></div></div>
  <p class="small muted">${esc(b.lede)}</p>
  ${b.rules?`<div class="safety" style="margin-top:var(--space-3)">${esc(b.rules)} <a href="${b.rulesUrl}" target="_blank" rel="noopener">Source</a></div>`:''}
  <div class="row" style="margin-top:var(--space-4)"><button class="btn" data-newlead>+ Add a lead</button>${b.id==='ride'?'<button class="btn ghost" data-sale>+ Log a sale</button>':''}<button class="btn ghost small" data-carcard>Car card with QR</button></div>
  <h2 class="sub-title">Pipeline</h2>
  <div class="filters">${stageCount.map(([s,n])=>`<span class="chip" aria-pressed="false">${s} ${n}</span>`).join('')}</div>
  <div class="card">${leads.length?leads.sort((x,y)=>(x.nextDate||'9').localeCompare(y.nextDate||'9')).map(l=>`<button class="entry lead-row" data-lead="${l.id}"><div><div class="entry-title">${esc(l.name)}</div><div class="entry-meta"><span class="badge ${l.stage==='Won'?'hands':''}">${esc(l.stage)}</span>${l.source?`<span>${esc(l.source)}</span>`:''}${l.nextDate?`<span>${l.nextDate<=today()?'Due ':''}${fmtDate(l.nextDate)}</span>`:''}</div></div><span class="xs muted">${(l.touches||[]).length} touches</span></button>`).join(''):'<p class="empty">No leads yet. Add the first person who showed interest.</p>'}</div>
  <h2 class="sub-title">Concrete steps</h2>
  <div class="card">${b.steps.map(([t,u],i)=>`<label class="entry step-row"><span class="row" style="flex-wrap:nowrap;align-items:flex-start;gap:var(--space-3)"><input type="checkbox" data-bstepchk="${i}" ${d[i]?'checked':''}><span class="small">${esc(t)}${u?` <a href="${u}" target="_blank" rel="noopener">Link</a>`:''}${d[i]?` <span class="xs muted">· ${fmtDate(d[i])}</span>`:''}</span></span></label>`).join('')}</div>
  <h2 class="sub-title">Scripts</h2>
  <div class="stack">${b.scripts.map(([h,t])=>`<div class="card"><span class="eyebrow">${esc(h)}</span><p class="small" style="margin-top:var(--space-2)">${esc(t)}</p><button class="btn ghost small" style="margin-top:var(--space-2)" data-copy="${esc(t)}">Copy</button></div>`).join('')}</div>`;
}
function stepDone(bid,i){S.bizSteps[bid]=S.bizSteps[bid]||{};S.bizSteps[bid][i]=today();const b=BIZ.find(x=>x.id===bid);addEntry({title:b.short+' step: '+b.steps[i][0].slice(0,90),skill:bid==='tour'?'xp_course':'biz_offer',skill2:'biz_sales',mode:'handson',points:3});toast('+3 φόρα')}
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
  v.querySelectorAll('[data-newlead]').forEach(b=>b.addEventListener('click',()=>editLead(null)));
  v.querySelectorAll('[data-sale]').forEach(b=>b.addEventListener('click',logSale));
  v.querySelectorAll('[data-carcard]').forEach(b=>b.addEventListener('click',carCard));
  v.querySelectorAll('[data-bstep]').forEach(b=>b.addEventListener('click',()=>{stepDone(bizTab,+b.dataset.bstep);render()}));
  v.querySelectorAll('[data-bstepchk]').forEach(c=>c.addEventListener('change',()=>{const i=+c.dataset.bstepchk;if(c.checked)stepDone(bizTab,i);else{delete S.bizSteps[bizTab][i];save()}render()}));
  v.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(b.dataset.copy);toast('Copied')}catch(e){toast('Copy failed on this browser.')}}));
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
function lifeInit(){S.promises=S.promises||[];S.clip=S.clip||{goal:'',trades:[],offers:[]};S.identity=S.identity||''}
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
  <article class="card up-next">${game}</article>
  <h2 class="sub-title">Daily promises</h2>
  <p class="small muted" style="margin-bottom:var(--space-3)">${esc(CLIP_JAR.what)} <a href="${CLIP_JAR.link.u}" target="_blank" rel="noopener">${esc(CLIP_JAR.link.t)}</a></p>
  ${daily.length?`<div class="grid2">${daily.map(p=>{const m=(p.log||{})[today()]||0;const full=m>=p.clips;return `<div class="card promise${full?' kept':''}"><div class="jars"><button class="jar-btn" data-clip="${p.id}" ${full?'disabled':''} aria-label="Move one clip for ${esc(p.text)}">${jarSvg(p.clips-m,'#8a8670')}<span class="xs">to go</span></button><span class="arr">→</span><span class="jar-btn">${jarSvg(m,'#b5523b')}<span class="xs">done</span></span></div><div class="p-body"><h4>${esc(p.text)}</h4><p class="xs muted">${full?'Kept today':m+' of '+p.clips+' today'} · ${promiseStreak(p)} day streak</p>${p.why?`<p class="small">${esc(p.why)}</p>`:''}<button class="linkish xs" data-pdel="${p.id}">Remove</button></div></div>`}).join('')}</div>`:`<div class="card"><p class="small">No daily promises yet. Start with the three minimums you already chose.</p><div class="row" style="margin-top:var(--space-3)"><button class="btn small" id="seedMins">Add chant, practice and workout</button></div></div>`}
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
  on('clipTrade',()=>{openSheet('Log a trade',`<form class="form" id="ctForm"><label class="f">You gave<input type="text" name="gave" required maxlength="80" value="${esc(clipNow())}"></label><label class="f">You got<input type="text" name="got" required maxlength="80"></label><label class="f">Who (first name)<input type="text" name="who" maxlength="40"></label><label class="f">Where you met<input type="text" name="where" maxlength="80"></label><label class="f">What did they care about? One detail about them.<textarea name="lesson" rows="3"></textarea></label><button class="btn" type="submit">Save trade</button></form>`);
   $('#ctForm').addEventListener('submit',ev=>{ev.preventDefault();const f=Object.fromEntries(new FormData(ev.target));f.date=today();S.clip.trades.push(f);addEntry({title:'Paper clip trade: '+f.gave+' → '+f.got,skill:'life_trade',skill2:'biz_sales',mode:'tested',points:5});toast('+5 φόρα');closeSheet();render()})});
  on('clipOffer',()=>{S.clip.offers.push({date:today(),item:clipNow()});addEntry({title:'Offered '+clipNow()+' for trade',skill:'life_trade',mode:'practice',points:1});toast('+1 φόρα · a no still counts');render()});
  on('clipPost',()=>{const t=CLIP_GAME.post.replace('[ITEM]',clipNow());navigator.clipboard&&navigator.clipboard.writeText(t).then(()=>toast('Post copied'),()=>toast('Copy failed'));});
  on('idEdit',()=>{openSheet('Who I’m becoming',`<form class="form" id="idForm"><p class="small muted">James Clear’s idea: every kept promise is a vote for the person you want to be.</p><label class="f">I am someone who…<input type="text" name="t" maxlength="120" value="${esc(S.identity)}" placeholder="keeps small promises to himself"></label><button class="btn" type="submit">Save</button></form>`);$('#idForm').addEventListener('submit',ev=>{ev.preventDefault();S.identity=new FormData(ev.target).get('t').trim();save();closeSheet();render()})});
  on('seedMins',()=>{[['Chant','Morning, before anything else'],['Practice','My daily practice rep'],['Workout','9 AM, phone stays in the car']].forEach(([t,w])=>S.promises.push({id:uid(),kind:'daily',text:t,why:w,clips:1,log:{},created:today()}));save();render()});
  on('pNew',()=>{openSheet('New promise',`<form class="form" id="pForm"><label class="f">I promise myself I will…<input type="text" name="text" required maxlength="100"></label><label class="f">Kind<select name="kind"><option value="daily">Every day (paper clip jar)</option><option value="once">Once (life to-do)</option></select></label><label class="f">Clips per day (daily only)<input type="number" name="clips" min="1" max="120" value="1"></label><label class="f">Why it matters<input type="text" name="why" maxlength="120"></label><button class="btn" type="submit">Make the promise</button></form>`);
   $('#pForm').addEventListener('submit',ev=>{ev.preventDefault();const f=Object.fromEntries(new FormData(ev.target));S.promises.push({id:uid(),kind:f.kind,text:f.text.trim(),why:f.why.trim(),clips:Math.max(1,Math.min(120,+f.clips||1)),log:{},created:today()});save();closeSheet();render()})});
  v.querySelectorAll('[data-clip]').forEach(b=>b.addEventListener('click',()=>{const p=S.promises.find(x=>x.id===b.dataset.clip);p.log=p.log||{};const m=(p.log[today()]||0)+1;p.log[today()]=m;
    if(m===p.clips){addEntry({title:'Promise kept: '+p.text,skill:'life_promise',mode:'practice',points:2});toast('Kept · +2 φόρα')}else{save();toast((p.clips-m)+' to go')}render()}));
  v.querySelectorAll('[data-keep]').forEach(b=>b.addEventListener('change',()=>{const p=S.promises.find(x=>x.id===b.dataset.keep);p.kept=today();addEntry({title:'Kept a promise: '+p.text,skill:'life_promise',mode:'handson',points:3});toast('Promise kept · +3 φόρα');render()}));
  v.querySelectorAll('[data-pdel]').forEach(b=>b.addEventListener('click',()=>{if(confirm('Remove this promise?')){S.promises=S.promises.filter(x=>x.id!==b.dataset.pdel);save();render()}}));
}
/* ---------- bind ---------- */
function bindView(){
  const v=$('#view');bindWrite(v);bindSell(v);bindLife(v);
  v.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>({think:openThink,feel:()=>openFeel(),inv:openInv,read:openRead,card:()=>openCard(cardOfDay().m.id),shelf:openCardShelf})[b.dataset.open]()));
  v.querySelectorAll('[data-gotab]').forEach(b=>b.addEventListener('click',()=>{document.querySelector(`.tabs [data-tab=${b.dataset.gotab}]`).click()}));
  v.querySelectorAll('[data-skill]').forEach(b=>b.addEventListener('click',()=>openSkill(b.dataset.skill)));
  v.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{logFilter=b.dataset.filter;render()}));
  v.querySelectorAll('[data-sort]').forEach(b=>b.addEventListener('click',()=>{logSort=b.dataset.sort;render()}));
  v.querySelectorAll('[data-star]').forEach(bindStar);
  v.querySelectorAll('[data-quick]').forEach(x=>x.addEventListener('click',()=>quickLog(x.dataset.quick,x.dataset.mode,x.dataset.title)));
  const af=$('#addForm');if(af)af.addEventListener('submit',ev=>{ev.preventDefault();const f=new FormData(af);const e={title:f.get('title'),skill:f.get('skill'),mode:f.get('mode'),diff:+f.get('diff')};addEntry(e);toast(`+${pts(e)} φόρα`);render()});
  const ex=$('#exportBtn');if(ex)ex.addEventListener('click',()=>{const blob=new Blob([JSON.stringify(S,null,1)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='skill-tree-backup-'+today()+'.json';document.body.appendChild(a);a.click();a.remove();toast('Backup saved')});
  const im=$('#importFile');if(im)im.addEventListener('change',async()=>{try{const d=JSON.parse(await im.files[0].text());if(!Array.isArray(d.entries))throw 0;S=Object.assign({entries:[],think:[],feelings:[],inventory:[],stars:{},focusTarget:10,chars:[],people:[],books:[],writing:[],drafts:[],blockHits:{},leads:[],sales:[],bizSteps:{},cardm:{},promises:[],clip:{goal:'',trades:[],offers:[]},identity:'',sellPhone:'+18033990665'},d);save();renderHeader();render();toast('Backup restored')}catch(e){toast('That file is not a Skill Tree backup.')}});
}
renderHeader();render();
})();
