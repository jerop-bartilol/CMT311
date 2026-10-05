const K='clinic_mgmt_v1';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const iso=d=>d.toISOString().slice(0,10);
const today=()=>iso(new Date());
const plus=n=>{const d=new Date();d.setDate(d.getDate()+n);return iso(d)};
const days=d=>Math.round((new Date(d)-new Date(today()))/864e5);
const money=n=>'$'+Number(n).toFixed(2);
const uid=()=>Math.random().toString(36).slice(2,9);

function seed(){
  const p=[{id:'p1',name:'Amina Okafor',phone:'0700 111 222',dob:'1994-03-12'},{id:'p2',name:'David Mensah',phone:'0700 333 444',dob:'1981-07-30'},{id:'p3',name:'Grace Wanjiru',phone:'0700 555 666',dob:'2010-11-02'}];
  const s=[{id:'d1',name:'Paracetamol 500mg',qty:120,price:0.5,expiry:plus(400),reorder:30},
    {id:'d2',name:'Amoxicillin 250mg',qty:18,price:1.2,expiry:plus(20),reorder:25},
    {id:'d3',name:'Ibuprofen 200mg',qty:60,price:0.8,expiry:plus(-10),reorder:20},
    {id:'d4',name:'Oral Rehydration Salts',qty:45,price:0.9,expiry:plus(150),reorder:15}];
  return{patients:p,appts:[{id:'a1',pid:'p1',date:today(),time:'10:00',reason:'Fever and headache',status:'Scheduled'},{id:'a2',pid:'p2',date:plus(1),time:'14:30',reason:'Follow-up',status:'Scheduled'}],stock:s,rx:[{id:'r1',pid:'p1',did:'d1',dosage:'1 tablet, 3 times a day',qty:15,date:today(),done:false}],sales:[]};
}
let db;try{db=JSON.parse(localStorage.getItem(K))}catch(e){}
if(!db||!db.patients)db=seed();
function save(){try{localStorage.setItem(K,JSON.stringify(db))}catch(e){}}
function toast(m){const t=$('#toast');t.textContent=m;t.style.display='block';clearTimeout(toast.h);toast.h=setTimeout(()=>t.style.display='none',2600)}

const pName=id=>(db.patients.find(x=>x.id===id)||{name:'Walk-in'}).name;
const drug=id=>db.stock.find(x=>x.id===id);
const opts=(list,f,sel)=>list.map(x=>`<option value="${x.id}" ${x.id===sel?'selected':''}>${esc(f(x))}</option>`).join('');
const expTag=d=>{const n=days(d);return n<0?`<span class="tag t-bad">Expired ${-n}d ago</span>`:n<=30?`<span class="tag t-warn">Expires in ${n}d</span>`:`<span class="tag t-ok">In date</span>`};
const tbl=(head,rows,msg)=>rows.length?`<div class="wrap"><table><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr>${rows.join('')}</table></div>`:`<div class="empty">${msg}</div>`;
const val=(f,n)=>f.elements[n].value.trim();

const pages={
Home(){
  const F=[['Patients','Patients','Register patients and keep their contact details and visit history in one place.'],['Appointments','Appointments','Book visits, avoid double-booked slots and mark who was seen.'],['Prescriptions','Prescriptions','Write prescriptions and dispense them straight from stock.'],['Stock','Stock','See what is on the shelf and get flagged when it runs low.'],['Sales','Sales','Record over-the-counter sales and follow revenue as it comes in.'],['Expiry','Expiry dates','Catch expired or soon-to-expire drugs before they reach a patient.']];
  const S=[['Register','Add the patient with their contact details.'],['Book','Schedule the appointment for a free time slot.'],['Prescribe','Record the drug, dosage and quantity.'],['Dispense','Stock drops and a sale is recorded automatically.'],['Monitor','Watch low stock and expiry dates on the dashboard.']];
  return`<section class="hero"><h1>Look after patients. Keep the pharmacy in order.</h1><p>Clinic Manager brings appointments, prescriptions, stock, sales and expiry tracking into one simple system, so nothing runs out or gets past its date unnoticed.</p><button class="p" onclick="go('Dashboard')">Open dashboard</button></section>
  <h2>What you can do</h2><div class="feat">${F.map(f=>`<button onclick="go('${f[0]}')"><b>${f[1]}</b><span>${f[2]}</span></button>`).join('')}</div>
  <div class="card"><h3>How a visit flows through the system</h3><ol class="flow">${S.map(x=>`<li><b>${x[0]}</b>${x[1]}</li>`).join('')}</ol></div>
  <div class="foot">Clinic Manager, a third-year computer science project. Data is saved in this browser.</div>`;
},
Dashboard(){
  const low=db.stock.filter(s=>s.qty<=s.reorder),exp=db.stock.filter(s=>days(s.expiry)<=30);
  const ta=db.appts.filter(a=>a.date===today()&&a.status==='Scheduled');
  const rev=db.sales.filter(s=>s.date===today()).reduce((a,s)=>a+s.total,0);
  return`<h2>Dashboard</h2><div class="stats">
  <div class="stat"><b>${db.patients.length}</b><span>Patients</span></div>
  <div class="stat"><b>${ta.length}</b><span>Appointments today</span></div>
  <div class="stat ${low.length?'alert':''}"><b>${low.length}</b><span>Low stock items</span></div>
  <div class="stat ${exp.length?'alert':''}"><b>${exp.length}</b><span>Expired or expiring soon</span></div>
  <div class="stat"><b>${money(rev)}</b><span>Sales today</span></div></div>
  <div class="two"><div class="card"><h3>Today's appointments</h3>${tbl(['Time','Patient','Reason'],ta.sort((a,b)=>a.time.localeCompare(b.time)).map(a=>`<tr><td>${a.time}</td><td>${esc(pName(a.pid))}</td><td>${esc(a.reason)}</td></tr>`),'No appointments scheduled for today.')}</div>
  <div class="card"><h3>Needs attention</h3>${tbl(['Drug','Issue'],[...low.map(s=>`<tr><td>${esc(s.name)}</td><td><span class="tag t-warn">Low: ${s.qty} left</span></td></tr>`),...exp.map(s=>`<tr><td>${esc(s.name)}</td><td>${expTag(s.expiry)}</td></tr>`)],'Stock levels and expiry dates look fine.')}</div></div>`;
},
Patients(){
  return`<h2>Patients</h2><div class="card"><form onsubmit="addPatient(event)"><label>Full name<input name="n" required></label><label>Phone<input name="p" required></label><label>Date of birth<input name="d" type="date" required></label><button class="p">Add patient</button></form></div>
  <div class="card">${tbl(['Name','Phone','Date of birth','Visits',''],db.patients.map(p=>`<tr><td>${esc(p.name)}</td><td>${esc(p.phone)}</td><td>${p.dob}</td><td>${db.appts.filter(a=>a.pid===p.id).length}</td><td><button class="s d" onclick="del('patients','${p.id}')">Delete</button></td></tr>`),'No patients yet. Add the first one above.')}</div>`;
},
Appointments(){
  const st=['Scheduled','Completed','Cancelled'];
  return`<h2>Appointments</h2><div class="card"><form onsubmit="addAppt(event)"><label>Patient<select name="p" required>${opts(db.patients,p=>p.name)}</select></label><label>Date<input name="d" type="date" value="${today()}" required></label><label>Time<input name="t" type="time" required></label><label>Reason<input name="r" required></label><button class="p">Book appointment</button></form></div>
  <div class="card">${tbl(['Date','Time','Patient','Reason','Status',''],[...db.appts].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).map(a=>`<tr><td>${a.date}</td><td>${a.time}</td><td>${esc(pName(a.pid))}</td><td>${esc(a.reason)}</td><td><select onchange="setStatus('${a.id}',this.value)">${st.map(s=>`<option ${s===a.status?'selected':''}>${s}</option>`).join('')}</select></td><td><button class="s d" onclick="del('appts','${a.id}')">Delete</button></td></tr>`),'No appointments booked.')}</div>`;
},
Prescriptions(){
  return`<h2>Prescriptions</h2><div class="card"><form onsubmit="addRx(event)"><label>Patient<select name="p" required>${opts(db.patients,p=>p.name)}</select></label><label>Drug<select name="d" required>${opts(db.stock,s=>s.name)}</select></label><label>Dosage<input name="o" placeholder="e.g. 1 tablet twice daily" required></label><label>Quantity<input name="q" type="number" min="1" value="1" required></label><button class="p">Write prescription</button></form></div>
  <div class="card">${tbl(['Date','Patient','Drug','Dosage','Qty','Status',''],[...db.rx].reverse().map(r=>`<tr><td>${r.date}</td><td>${esc(pName(r.pid))}</td><td>${esc((drug(r.did)||{name:'(removed)'}).name)}</td><td>${esc(r.dosage)}</td><td>${r.qty}</td><td>${r.done?'<span class="tag t-ok">Dispensed</span>':'<span class="tag t-warn">Pending</span>'}</td><td>${r.done?'':`<button class="s" onclick="dispense('${r.id}')">Dispense</button> `}<button class="s d" onclick="del('rx','${r.id}')">Delete</button></td></tr>`),'No prescriptions written yet.')}<p class="empty">Dispensing removes the quantity from stock and records a sale.</p></div>`;
},
Stock(){
  return`<h2>Stock</h2><div class="card"><form onsubmit="addStock(event)"><label>Drug name<input name="n" required></label><label>Quantity<input name="q" type="number" min="0" required></label><label>Unit price ($)<input name="pr" type="number" step="0.01" min="0" required></label><label>Expiry date<input name="e" type="date" required></label><label>Reorder level<input name="r" type="number" min="0" value="10" required></label><button class="p">Add to stock</button></form></div>
  <div class="card">${tbl(['Drug','In stock','Unit price','Expiry','Level',''],db.stock.map(s=>`<tr><td>${esc(s.name)}</td><td>${s.qty}</td><td>${money(s.price)}</td><td>${s.expiry}</td><td>${s.qty<=s.reorder?'<span class="tag t-warn">Reorder</span>':'<span class="tag t-ok">OK</span>'}</td><td><button class="s" onclick="restock('${s.id}')">Restock</button> <button class="s d" onclick="del('stock','${s.id}')">Delete</button></td></tr>`),'No stock recorded. Add a drug above.')}</div>`;
},
Sales(){
  const tot=db.sales.reduce((a,s)=>a+s.total,0);
  const ok=db.stock.filter(s=>s.qty>0&&days(s.expiry)>=0);
  return`<h2>Sales</h2><div class="card"><form onsubmit="addSale(event)"><label>Drug<select name="d" required>${opts(ok,s=>`${s.name} (${s.qty} left, ${money(s.price)})`)}</select></label><label>Quantity<input name="q" type="number" min="1" value="1" required></label><label>Patient (optional)<select name="p"><option value="">Walk-in</option>${opts(db.patients,p=>p.name)}</select></label><button class="p">Record sale</button></form></div>
  <div class="stats"><div class="stat"><b>${money(tot)}</b><span>Total revenue</span></div><div class="stat"><b>${db.sales.length}</b><span>Sales recorded</span></div></div>
  <div class="card">${tbl(['Date','Drug','Qty','Customer','Total'],[...db.sales].reverse().map(s=>`<tr><td>${s.date}</td><td>${esc(s.name)}</td><td>${s.qty}</td><td>${esc(pName(s.pid))}</td><td>${money(s.total)}</td></tr>`),'No sales yet.')}</div>`;
},
Expiry(){
  const f=window.expF||'all';
  let l=[...db.stock].sort((a,b)=>a.expiry.localeCompare(b.expiry));
  if(f==='expired')l=l.filter(s=>days(s.expiry)<0);
  if(f==='soon')l=l.filter(s=>days(s.expiry)>=0&&days(s.expiry)<=30);
  return`<h2>Expiry dates</h2><div class="card"><label>Show<select onchange="expF=this.value;go('Expiry')"><option value="all" ${f==='all'?'selected':''}>All drugs</option><option value="soon" ${f==='soon'?'selected':''}>Expiring within 30 days</option><option value="expired" ${f==='expired'?'selected':''}>Already expired</option></select></label></div>
  <div class="card">${tbl(['Drug','Expiry date','In stock','Status',''],l.map(s=>`<tr><td>${esc(s.name)}</td><td>${s.expiry}</td><td>${s.qty}</td><td>${expTag(s.expiry)}</td><td>${days(s.expiry)<0&&s.qty>0?`<button class="s d" onclick="writeOff('${s.id}')">Write off ${s.qty}</button>`:''}</td></tr>`),'No drugs match this filter.')}</div>`;
}};

let cur='Home';
function go(p){cur=p;$('#main').innerHTML=pages[p]();document.querySelectorAll("nav button").forEach(b=>b.classList.toggle('on',b.textContent===p))}
Object.keys(pages).forEach(p=>{const b=document.createElement('button');b.textContent=p;b.onclick=()=>go(p);$('#nav').appendChild(b)});

function del(t,id){if(!confirm('Delete this record?'))return;db[t]=db[t].filter(x=>x.id!==id);save();go(cur)}
function addPatient(e){e.preventDefault();const f=e.target;db.patients.push({id:uid(),name:val(f,'n'),phone:val(f,'p'),dob:val(f,'d')});save();go(cur);toast('Patient added')}
function addAppt(e){e.preventDefault();const f=e.target;if(!db.patients.length)return toast('Add a patient first');
  const d=val(f,'d'),t=val(f,'t');
  if(db.appts.some(a=>a.date===d&&a.time===t&&a.status==='Scheduled'))return toast('That time slot is already booked');
  db.appts.push({id:uid(),pid:val(f,'p'),date:d,time:t,reason:val(f,'r'),status:'Scheduled'});save();go(cur);toast('Appointment booked')}
function setStatus(id,s){db.appts.find(a=>a.id===id).status=s;save();toast('Status updated')}
function addRx(e){e.preventDefault();const f=e.target;if(!db.patients.length||!db.stock.length)return toast('You need at least one patient and one drug');
  db.rx.push({id:uid(),pid:val(f,'p'),did:val(f,'d'),dosage:val(f,'o'),qty:+val(f,'q'),date:today(),done:false});save();go(cur);toast('Prescription saved')}
function sell(did,qty,pid){const d=drug(did);
  if(!d)return'Drug no longer exists';
  if(days(d.expiry)<0)return d.name+' is expired and cannot be sold';
  if(d.qty<qty)return`Only ${d.qty} of ${d.name} in stock`;
  d.qty-=qty;db.sales.push({id:uid(),date:today(),did,name:d.name,qty,pid,total:qty*d.price});return null}
function dispense(id){const r=db.rx.find(x=>x.id===id);const err=sell(r.did,r.qty,r.pid);
  if(err)return toast(err);r.done=true;save();go(cur);toast('Dispensed and sale recorded')}
function addStock(e){e.preventDefault();const f=e.target;
  db.stock.push({id:uid(),name:val(f,'n'),qty:+val(f,'q'),price:+val(f,'pr'),expiry:val(f,'e'),reorder:+val(f,'r')});save();go(cur);toast('Drug added')}
function restock(id){const n=parseInt(prompt('How many units are you adding?'),10);if(!(n>0))return;drug(id).qty+=n;save();go(cur);toast('Stock updated')}
function writeOff(id){const d=drug(id);if(!confirm(`Remove ${d.qty} expired units of ${d.name}?`))return;d.qty=0;save();go(cur);toast('Expired stock written off')}
function addSale(e){e.preventDefault();const f=e.target;const err=sell(val(f,'d'),+val(f,'q'),val(f,'p'));
  if(err)return toast(err);save();go(cur);toast('Sale recorded')}
go('Home');