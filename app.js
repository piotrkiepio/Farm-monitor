const K='farm_osi_v3';
let D=JSON.parse(localStorage.getItem(K)||'{"farms":[],"houses":[],"cycles":[],"daily":[],"tx":[]}');

const $=x=>document.getElementById(x);
const id=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const esc=s=>String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const save=()=>localStorage.setItem(K,JSON.stringify(D));
const fname=x=>D.farms.find(a=>a.id===x)?.name||'-';
const hname=x=>D.houses.find(a=>a.id===x)?.name||'-';
const cname=x=>D.cycles.find(a=>a.id===x)?.name||'-';

function go(p){
 document.querySelectorAll('.page').forEach(x=>x.classList.add('hidden'));
 $(p).classList.remove('hidden');
 document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('active',x.dataset.page===p));
 render();
}

document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>go(b.dataset.page));

function opts(s,a,t){
 $(s).innerHTML='<option value="">Wybierz...</option>'+a.map(x=>`<option value="${x.id}">${esc(t(x))}</option>`).join('');
}

function sync(fs,hs,cs){
 const f=$(fs).value||D.farms[0]?.id;
 $(fs).value=f||'';
 opts(hs,D.houses.filter(x=>x.farmId===f),x=>x.name);
 const h=$(hs).value||D.houses.find(x=>x.farmId===f)?.id;
 $(hs).value=h||'';
 opts(cs,D.cycles.filter(x=>x.farmId===f && x.houseId===h),x=>x.name);
}

function selectors(){
 opts('farm',D.farms,x=>x.name); sync('farm','house','cycle');
 opts('txFarm',D.farms,x=>x.name); sync('txFarm','txHouse','txCycle');
 opts('osiFarm',D.farms,x=>x.name); sync('osiFarm','osiHouse','osiCycle');
 opts('houseFarm',D.farms,x=>x.name);
 opts('cycleFarm',D.farms,x=>x.name);
 opts('cycleHouse',D.houses.filter(x=>x.farmId===$('cycleFarm').value),x=>x.name);
}

['farm','txFarm','osiFarm'].forEach(x=>$(`${x}`).onchange=()=>{
 const m=x==='farm'?['farm','house','cycle']:x==='txFarm'?['txFarm','txHouse','txCycle']:['osiFarm','osiHouse','osiCycle'];
 sync(...m);
});
$('cycleFarm').onchange=()=>opts('cycleHouse',D.houses.filter(x=>x.farmId===$('cycleFarm').value),x=>x.name);

$('demoBtn').onclick=()=>{
 if(!D.farms.length){
  const f={id:id(),name:'Demo Ferma',code:'DEMO-001',farmer:'Hodowca demo',address:'Polska'};
  const h={id:id(),farmId:f.id,name:'K1',area:2500,sectionCount:1};
  D.farms=[f]; D.houses=[h];
  D.cycles=[{id:id(),farmId:f.id,houseId:h.id,name:'Cykl 1',placementDate:'2026-11-01',inserted:30000,delivered:28500,deliveryWeight:2.15,hatchery:'Demo',standard:'OSI'}];
  save();
 }
 loginOk('Tryb demo lokalny');
};

$('loginBtn').onclick=()=>loginOk('Tryb lokalny — centralną bazę można podłączyć później');
$('logout').onclick=()=>{sessionStorage.removeItem('ok');location.reload()};

function loginOk(msg){
 sessionStorage.setItem('ok','1');
 $('login').classList.add('hidden');
 $('app').classList.remove('hidden');
 $('mode').textContent=msg;
 render();
}
if(sessionStorage.getItem('ok')) loginOk('Tryb lokalny');

$('farmForm').onsubmit=e=>{
 e.preventDefault();
 D.farms.push({id:id(),name:$('farmName').value.trim(),code:$('farmCode').value.trim(),farmer:$('farmFarmer').value.trim(),address:$('farmAddress').value.trim()});
 save(); e.target.reset(); render(); go('farms'); alert('Dodano fermę.');
};

$('houseForm').onsubmit=e=>{
 e.preventDefault();
 D.houses.push({id:id(),farmId:$('houseFarm').value,name:$('houseName').value.trim(),area:+$('houseArea').value,sectionCount:+$('houseSection').value||1});
 save(); e.target.reset(); render(); go('farms'); alert('Dodano kurnik.');
};

$('cycleForm').onsubmit=e=>{
 e.preventDefault();
 D.cycles.push({
  id:id(),farmId:$('cycleFarm').value,houseId:$('cycleHouse').value,name:$('cycleName').value.trim(),
  placementDate:$('placementDate').value,inserted:+$('inserted').value,hatchery:$('hatchery').value.trim(),
  standard:$('standard').value.trim(),delivered:+$('delivered').value||0,deliveryWeight:+$('deliveryWeight').value||0
 });
 save(); e.target.reset(); render(); go('farms'); alert('Dodano cykl.');
};

$('dailyForm').onsubmit=e=>{
 e.preventDefault();
 D.daily.push({
  id:id(),farmId:$('farm').value,houseId:$('house').value,cycleId:$('cycle').value,date:$('date').value,
  age:+$('age').value,mort:+$('mort').value||0,sel:+$('sel').value||0,lam:+$('lam').value||0,
  water:+$('water').value||0,weight:+$('weight').value||0,note:$('note').value.trim()
 });
 save(); e.target.reset(); $('date').value=new Date().toISOString().slice(0,10); render();
 alert('Zapisano raport dzienny.');
};

$('txForm').onsubmit=e=>{
 e.preventDefault();
 D.tx.push({
  id:id(),farmId:$('txFarm').value,houseId:$('txHouse').value,cycleId:$('txCycle').value,
  start:$('txStart').value,end:$('txEnd').value,
  drug:$('drug').value==='Inny preparat'?$('drugCustom').value:$('drug').value,
  qty:+$('qty').value||0,unit:$('unit').value.trim(),reason:$('reason').value.trim(),
  withdrawal:$('withdrawal').value,note:$('txNote').value.trim()
 });
 save(); e.target.reset(); render(); alert('Zapisano leczenie.');
};

function met(c){
 const r=D.daily.filter(x=>x.cycleId===c.id);
 const n=c.inserted||0;
 const m=r.reduce((a,x)=>a+x.mort,0);
 const s=r.reduce((a,x)=>a+x.sel,0);
 const l=r.reduce((a,x)=>a+x.lam,0);
 const d7=r.filter(x=>x.age<=7).reduce((a,x)=>a+x.mort+x.sel,0);
 const h=D.houses.find(x=>x.id===c.houseId);
 const latest=r.filter(x=>x.weight>0).sort((a,b)=>b.age-a.age)[0]?.weight||0;
 const finalWeight=c.deliveryWeight||latest;
 const delivered=c.delivered||0;
 return {
  n,m,s,l,d7,d7p:n?100*d7/n:0,mp:n?100*m/n:0,sp:n?100*s/n:0,lp:n?100*l/n:0,
  area:h?.area||0,dens:h?.area?(n-m)/h.area:0,
  kgSlaughter:h?.area?(n-m)*latest/h.area:0,
  kgFinal:h?.area?delivered*finalWeight/h.area:0,
  water:r.reduce((a,x)=>a+x.water,0)/Math.max(1,n-m)
 };
}

function render(){
 selectors();

 $('cards').innerHTML=[
  ['Fermy',D.farms.length],['Kurniki',D.houses.length],['Cykle',D.cycles.length],
  ['Raporty',D.daily.length],['Leczenia',D.tx.length]
 ].map(x=>`<div class="card">${x[0]}<b>${x[1]}</b></div>`).join('');

 const today=new Date().toISOString().slice(0,10);
 const alerts=D.tx.filter(x=>x.withdrawal&&x.withdrawal>=today)
   .map(x=>`<div class="alert">💊 ${esc(x.drug)} — karencja do ${x.withdrawal}</div>`).join('');
 $('alerts').innerHTML=alerts||'<div class="ok">Brak aktywnych alertów.</div>';

 $('recent').innerHTML=D.daily.slice(-8).reverse()
   .map(x=>`<span class="pill">${x.date} • ${fname(x.farmId)} • ${hname(x.houseId)} • dzień ${x.age} • padnięcia ${x.mort}</span>`).join('')||'Brak danych.';

 $('farmList').innerHTML=D.farms.map(f=>{
   const houses=D.houses.filter(h=>h.farmId===f.id);
   const cycles=D.cycles.filter(c=>c.farmId===f.id);
   return `<div class="farmbox">
    <h3>${esc(f.name)}</h3>
    <div class="meta">Kod: ${esc(f.code||'-')} • Hodowca: ${esc(f.farmer||'-')} • ${esc(f.address||'')}</div>
    <h4>Kurniki</h4>
    ${houses.map(h=>`<div class="rowline"><span><b>${esc(h.name)}</b> — ${h.area} m² • sekcje: ${h.sectionCount}</span>
      <button class="mini dangerBtn" onclick="delHouse('${h.id}')">Usuń</button></div>`).join('')||'<div>Brak kurników.</div>'}
    <h4>Cykle</h4>
    ${cycles.map(c=>`<div class="cyclebox"><b>${esc(c.name)}</b> • wstawienie ${c.placementDate||'-'} • ${c.inserted} szt.
      <br>Wylęgarnia: ${esc(c.hatchery||'-')} • Standard: ${esc(c.standard||'-')}
      <br>Zdanie: ${c.delivered||0} szt. • śr. masa: ${c.deliveryWeight||0} kg
      <br><button class="mini dangerBtn" onclick="delCycle('${c.id}')">Usuń cykl</button></div>`).join('')||'<div>Brak cykli.</div>'}
    <br><button class="mini dangerBtn" onclick="delFarm('${f.id}')">Usuń fermę</button>
   </div>`;
 }).join('')||'Brak ferm.';

 $('dailyList').innerHTML=D.daily.slice().reverse().slice(0,40)
   .map(x=>`<div class="panel"><b>${x.date}</b> — ${fname(x.farmId)} / ${hname(x.houseId)} / ${cname(x.cycleId)}
    <br>Dzień ${x.age} • padnięcia ${x.mort} • selekcja ${x.sel} • kulawizny ${x.lam} • woda ${x.water} l • masa ${x.weight||'-'} kg
    ${x.note?'<br>Uwagi: '+esc(x.note):''}</div>`).join('')||'Brak wpisów.';

 $('txList').innerHTML=D.tx.slice().reverse()
   .map(x=>`<div class="panel"><b>${esc(x.drug)}</b> — ${fname(x.farmId)} / ${hname(x.houseId)}
    <br>${x.start||''} → ${x.end||''}; ${x.qty||0} ${esc(x.unit)}
    <br>Karencja: ${x.withdrawal||'-'}<br>Powód: ${esc(x.reason||'-')}</div>`).join('')||'Brak leczeń.';
}

window.delFarm=function(fid){
 if(!confirm('Usunąć fermę wraz z kurnikami i cyklami?')) return;
 const hs=D.houses.filter(h=>h.farmId===fid).map(h=>h.id);
 const cs=D.cycles.filter(c=>c.farmId===fid).map(c=>c.id);
 D.farms=D.farms.filter(f=>f.id!==fid);
 D.houses=D.houses.filter(h=>h.farmId!==fid);
 D.cycles=D.cycles.filter(c=>c.farmId!==fid);
 D.daily=D.daily.filter(x=>!cs.includes(x.cycleId));
 D.tx=D.tx.filter(x=>!cs.includes(x.cycleId));
 save(); render();
};
window.delHouse=function(hid){
 if(!confirm('Usunąć kurnik i jego cykle?')) return;
 const cs=D.cycles.filter(c=>c.houseId===hid).map(c=>c.id);
 D.houses=D.houses.filter(h=>h.id!==hid);
 D.cycles=D.cycles.filter(c=>c.houseId!==hid);
 D.daily=D.daily.filter(x=>!cs.includes(x.cycleId));
 D.tx=D.tx.filter(x=>!cs.includes(x.cycleId));
 save(); render();
};
window.delCycle=function(cid){
 if(!confirm('Usunąć cykl i jego raporty?')) return;
 D.cycles=D.cycles.filter(c=>c.id!==cid);
 D.daily=D.daily.filter(x=>x.cycleId!==cid);
 D.tx=D.tx.filter(x=>x.cycleId!==cid);
 save(); render();
};

$('osiBtn').onclick=()=>{
 const c=D.cycles.find(x=>x.id===$('osiCycle').value);
 if(!c) return;
 const m=met(c);
 $('osiResult').innerHTML=`<div class="panel">
 <h3>${esc(fname(c.farmId))} — ${esc(hname(c.houseId))} — ${esc(c.name)}</h3>
 <div class="tablewrap"><table class="table">
 <tr><th>Wskaźnik</th><th>Na dzień ubiórki</th><th>Na dzień końcowego zdania</th></tr>
 <tr><td>Śmiertelność 1–7 doby + selekcja</td><td>${m.d7p.toFixed(2)}%</td><td>${m.d7p.toFixed(2)}%</td></tr>
 <tr><td>Śmiertelność całkowita</td><td>${m.mp.toFixed(2)}%</td><td>${m.mp.toFixed(2)}%</td></tr>
 <tr><td>Selekcja całkowita</td><td>${m.sp.toFixed(2)}%</td><td>${m.sp.toFixed(2)}%</td></tr>
 <tr><td>Selekcja kulawizn</td><td>${m.lp.toFixed(2)}%</td><td>${m.lp.toFixed(2)}%</td></tr>
 <tr><td>Obsada</td><td>${m.dens.toFixed(3)} szt./m²</td><td>—</td></tr>
 <tr><td>kg żywca/m²</td><td>${m.kgSlaughter.toFixed(2)}</td><td>${m.kgFinal.toFixed(2)}</td></tr>
 <tr><td>Woda / szt.</td><td>${m.water.toFixed(3)} l</td><td>—</td></tr>
 </table></div>
 <div class="note">Dla końcowego zdania kg żywca/m² = liczba zdanych sztuk × średnia masa przy zdaniu ÷ powierzchnia kurnika.</div>
 </div>`;
};

$('csvBtn').onclick=()=>{
 const c=D.cycles.find(x=>x.id===$('osiCycle').value); if(!c)return;
 const m=met(c);
 const rows=[
 ['Wskaźnik','Wartość'],
 ['Śmiertelność 1-7 + selekcja',m.d7p.toFixed(2)+'%'],
 ['Śmiertelność całkowita',m.mp.toFixed(2)+'%'],
 ['Selekcja całkowita',m.sp.toFixed(2)+'%'],
 ['Kulawizny',m.lp.toFixed(2)+'%'],
 ['Obsada',m.dens.toFixed(3)],
 ['kg żywca/m² – ubiórka',m.kgSlaughter.toFixed(2)],
 ['kg żywca/m² – końcowe zdanie',m.kgFinal.toFixed(2)]
 ];
 const a=document.createElement('a');
 a.href=URL.createObjectURL(new Blob(['\ufeff'+rows.map(r=>r.join(';')).join('\n')],{type:'text/csv'}));
 a.download='raport_OSI.csv'; a.click();
};

$('exportBtn').onclick=()=>{
 const a=document.createElement('a');
 a.href=URL.createObjectURL(new Blob([JSON.stringify(D,null,2)],{type:'application/json'}));
 a.download='farm_osi_backup.json'; a.click();
};
$('restore').onchange=e=>{
 const r=new FileReader();
 r.onload=()=>{D=JSON.parse(r.result);save();render();alert('Przywrócono dane.');};
 r.readAsText(e.target.files[0]);
};
$('clearBtn').onclick=()=>{
 if(confirm('Usunąć wszystkie dane lokalne?')){localStorage.removeItem(K);location.reload();}
};

$('date').value=new Date().toISOString().slice(0,10);
go('dashboard');
