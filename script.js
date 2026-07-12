const STORAGE_KEY="factoryMaintenanceDataV2";let data=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{"devices":[],"parts":[],"records":[]}');let selectedDeviceId="";
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(data))}function esc(s){return String(s||"").replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}function today(){return new Date().toISOString().slice(0,10)}function addDays(d,n){const x=new Date(d+"T00:00:00");x.setDate(x.getDate()+Number(n||0));return x.toISOString().slice(0,10)}function diffDays(d){return Math.ceil((new Date(d+"T00:00:00")-new Date(today()+"T00:00:00"))/86400000)}function deviceName(id){return data.devices.find(x=>x.id===id)?.name||"未指定設備"}function partName(id){return data.parts.find(x=>x.id===id)?.name||"未指定零件"}
function getEl(id){return document.getElementById(id)}
function nextDeviceCode(){
  const nums=data.devices.map(d=>{
    const m=String(d.uniqueCode||"").match(/^EQ(\d+)$/);
    return m?Number(m[1]):0
  });
  const next=(Math.max(0,...nums)+1).toString().padStart(6,"0");
  return "EQ"+next
}
function migrateDeviceUniqueCodes(){
  let changed=false;
  data.devices.forEach((d,idx)=>{
    if(!d.uniqueCode){
      d.uniqueCode="EQ"+String(idx+1).padStart(6,"0");
      changed=true
    }
  });
  if(changed)save()
}
function saveDevice(){
  const id=getEl("deviceEditId").value;
  const name=getEl("deviceName").value.trim();
  if(!name){alert("請輸入設備名稱");return}
  const oldItem=id?data.devices.find(x=>x.id===id):null;
  const item={
    id:id||uid(),
    uniqueCode:oldItem?.uniqueCode||getEl("deviceUniqueCode").value||nextDeviceCode(),
    name,
    code:getEl("deviceCode").value.trim(),
    location:getEl("deviceLocation").value.trim(),
    brand:getEl("deviceBrand").value.trim(),
    model:getEl("deviceModel").value.trim(),
    serial:getEl("deviceSerial").value.trim(),
    note:getEl("deviceNote").value.trim()
  };
  if(id){
    const i=data.devices.findIndex(x=>x.id===id);
    if(i>=0)data.devices[i]=item
  }else data.devices.push(item);
  selectedDeviceId=item.id;
  closeDeviceDialog();
  resetDeviceForm();
  save();
  render();
}
function resetDeviceForm(){getEl("deviceFormTitle").textContent="新增設備";["deviceEditId","deviceName","deviceCode","deviceLocation","deviceBrand","deviceModel","deviceSerial","deviceNote"].forEach(id=>getEl(id).value="");getEl("deviceUniqueCode").value=nextDeviceCode()}
function openDeviceDialog(){getEl("deviceModal").classList.remove("hidden");document.body.classList.add("modal-open");setTimeout(()=>getEl("deviceName")?.focus(),0)}
function closeDeviceDialog(){getEl("deviceModal")?.classList.add("hidden");document.body.classList.remove("modal-open")}
function openNewDeviceDialog(){resetDeviceForm();openDeviceDialog()}
function editDevice(id){
  const d=data.devices.find(x=>x.id===id);
  if(!d)return;
  showMainTab("devices");
  openDeviceDialog();
  getEl("deviceFormTitle").textContent="編輯設備";
  getEl("deviceEditId").value=d.id||"";
  getEl("deviceUniqueCode").value=d.uniqueCode||d.id||"";
  getEl("deviceName").value=d.name||"";
  getEl("deviceCode").value=d.code||"";
  getEl("deviceLocation").value=d.location||"";
  getEl("deviceBrand").value=d.brand||"";
  getEl("deviceModel").value=d.model||"";
  getEl("deviceSerial").value=d.serial||"";
  getEl("deviceNote").value=d.note||"";
}

function editSelectedDevice(){const id=selectedDeviceId||partDevice.value;if(!id){alert("請先選擇設備");return}editDevice(id)}
function deleteDevice(id,event){if(event)event.stopPropagation();if(!confirm("確定刪除此設備？相關零件與維護紀錄也會刪除。"))return;data.devices=data.devices.filter(x=>x.id!==id);const partIds=data.parts.filter(p=>p.deviceId===id).map(p=>p.id);data.parts=data.parts.filter(p=>p.deviceId!==id);data.records=data.records.filter(r=>r.deviceId!==id&&!partIds.includes(r.partId));if(selectedDeviceId===id)selectedDeviceId="";save();render()}
function openDeviceParts(id){selectedDeviceId=id;showMainTab("devices");showDeviceSubTab("part-list");partDevice.value=id;render()}
function backToDeviceList(){selectedDeviceId="";showDeviceSubTab("device-list")}
function changePartDevice(){
  selectedDeviceId=partDevice.value||"";
  resetPartForm(false);
  renderParts();
}
function openPartDialog(){document.getElementById("partModal").classList.remove("hidden");document.body.classList.add("modal-open");document.getElementById("partFormTitle").textContent="新增零件";resetPartForm(false)}function closePartDialog(){document.getElementById("partModal").classList.add("hidden");document.body.classList.remove("modal-open")}function savePart(){const editId=partEditId.value,deviceId=partDevice.value,name=partNameInput().trim();if(!deviceId){alert("請先新增或選擇設備");return}if(!name){alert("請輸入零件名稱");return}const item={id:editId||uid(),deviceId,name,number:partNumber.value.trim(),cycle:Number(partCycle.value||0)};if(editId){const i=data.parts.findIndex(x=>x.id===editId);if(i>=0)data.parts[i]=item}else data.parts.push(item);selectedDeviceId=deviceId;closePartDialog();resetPartForm(false);save();render()}function partNameInput(){return document.getElementById("partName").value}
function editPart(id){const p=data.parts.find(x=>x.id===id);if(!p)return;selectedDeviceId=p.deviceId;showMainTab("devices");showDeviceSubTab("part-list");openPartDialog();document.getElementById("partFormTitle").textContent="編輯零件";partEditId.value=p.id;partDevice.value=p.deviceId||"";document.getElementById("partName").value=p.name||"";partNumber.value=p.number||"";partCycle.value=p.cycle||"";renderPartTitle()}function resetPartForm(clearDevice=true){["partEditId","partName","partNumber","partCycle"].forEach(id=>document.getElementById(id).value="");if(clearDevice&&!selectedDeviceId)partDevice.selectedIndex=0}
function deletePart(id){if(!confirm("確定刪除此零件？相關維護紀錄也會刪除。"))return;data.parts=data.parts.filter(x=>x.id!==id);data.records=data.records.filter(x=>x.partId!==id);save();render()}
function saveRecord(){const deviceId=recordDevice.value,partId=recordPart.value,desc=recordDesc.value.trim();if(!deviceId){alert("請先選擇設備");return}if(!desc){alert("請輸入維護內容");return}data.records.push({id:uid(),deviceId,partId,date:recordDate.value||today(),owner:recordOwner.value.trim(),desc});recordDate.value=today();recordOwner.value="";recordDesc.value="";save();render()}function openDueRecord(partId){const p=data.parts.find(x=>x.id===partId);if(!p)return;showMainTab("records");recordDevice.value=p.deviceId;refreshRecordParts();recordPart.value=p.id;recordDate.value=today();document.getElementById("page-records").scrollIntoView({behavior:"smooth",block:"start"});setTimeout(()=>recordDesc.focus(),0)}function deleteRecord(id){if(!confirm("確定刪除此維護紀錄？"))return;data.records=data.records.filter(x=>x.id!==id);save();render()}
function refreshSelects(){const opts=data.devices.map(d=>`<option value="${d.id}">${esc(d.name)}${d.code?" / "+esc(d.code):""}</option>`).join("");partDevice.innerHTML=opts||'<option value="">尚無設備</option>';recordDevice.innerHTML=opts||'<option value="">尚無設備</option>';if(selectedDeviceId&&data.devices.some(d=>d.id===selectedDeviceId))partDevice.value=selectedDeviceId;refreshRecordParts()}function refreshRecordParts(){const id=recordDevice.value;const ps=data.parts.filter(p=>p.deviceId===id);recordPart.innerHTML='<option value="">不指定零件</option>'+ps.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("")}
function renderDevices(){
  const q=(deviceSearch?.value||"").toLowerCase().trim();
  const list=data.devices.filter(d=>[d.uniqueCode,d.name,d.code,d.location,d.brand,d.model,d.serial].join(" ").toLowerCase().includes(q));
  if(!list.length){
    deviceList.innerHTML=`<div class="empty">${q?"目前沒有符合搜尋條件的設備":"目前沒有設備資料"}</div>`;
    return
  }
  deviceList.innerHTML=`<div class="device-card-list">${list.map(d=>{
    const unique=esc(d.uniqueCode||d.id||"-");
    const partCount=data.parts.filter(p=>p.deviceId===d.id).length;
    return `<article class="device-card-item" onclick="openDeviceParts('${d.id}')">
      <div class="device-card-head">
        <div>
          <div class="device-uid">${unique}</div>
          <div class="device-card-title">${esc(d.name||"未命名設備")}</div>
        </div>
        <span class="device-card-count">${partCount} 個零件</span>
      </div>
      <div class="device-card-info">
        <div class="info-row"><span>設備編號</span><strong>${esc(d.code||"-")}</strong></div>
        <div class="info-row"><span>位置</span><strong>${esc(d.location||"-")}</strong></div>
        <div class="info-row"><span>廠牌</span><strong>${esc(d.brand||"-")}</strong></div>
        <div class="info-row"><span>型號</span><strong>${esc(d.model||"-")}</strong></div>
        <div class="info-row"><span>序號</span><strong>${esc(d.serial||"-")}</strong></div>
        <div class="info-row note-row"><span>備註</span><strong>${esc(d.note||"-").replace(/\n/g,'<br>')}</strong></div>
      </div>
      <div class="device-card-actions">
        <button class="small danger" onclick="deleteDevice('${d.id}',event)">刪除</button>
      </div>
    </article>`
  }).join("")}</div>`
}
function renderPartTitle(){const current=selectedDeviceId||partDevice.value;const d=data.devices.find(x=>x.id===current);selectedDeviceTitle.textContent=d?`${d.name} 的零件清單`:"零件管理"}
function renderParts(){const current=partDevice.value||selectedDeviceId;selectedDeviceId=current;renderPartTitle();const q=((document.getElementById("partSearch")?.value)||"").toLowerCase().trim();let list=current?data.parts.filter(p=>p.deviceId===current):data.parts;if(q){list=list.filter(p=>[p.name,p.number,deviceName(p.deviceId)].join(" ").toLowerCase().includes(q));}if(!list.length){partList.innerHTML=`<div class="empty" style="margin-top:14px">${q?"目前沒有符合搜尋條件的零件":"目前沒有零件資料"}</div>`;return}partList.innerHTML=`<div class="device-card-list">${list.map(p=>`<div class="device-card-item" onclick="editPart('${p.id}')"><div class="device-card-head"><div><div class="device-card-title">${esc(p.name)}</div><div class="device-card-code">${esc(p.number||"無 Part Number")}</div></div><div class="device-card-count">${p.cycle?p.cycle+" 天":"-"}</div></div><div class="device-card-info"><div class="info-row"><span>設備</span><strong>${esc(deviceName(p.deviceId))}</strong></div><div class="info-row"><span>週期</span><strong>${p.cycle?p.cycle+" 天":"未設定"}</strong></div></div><div class="device-card-actions"><button class="small danger" onclick="event.stopPropagation();deletePart('${p.id}')">刪除</button></div></div>`).join("")}</div>`}
function renderRecords(){const q=((document.getElementById("recordSearch")?.value)||"").toLowerCase().trim();let list=[...data.records];if(q){list=list.filter(r=>[deviceName(r.deviceId),r.partId?partName(r.partId):"未指定零件",r.owner,r.date,r.desc].join(" ").toLowerCase().includes(q));}if(!list.length){recordList.innerHTML=`<div class="empty">${q?"目前沒有符合搜尋條件的維護紀錄":"目前沒有維護紀錄"}</div>`;return}const s=list.sort((a,b)=>(b.date||"").localeCompare(a.date||""));recordList.innerHTML=recordsTable(s,true)}function recordsTable(list,ops){return `<div class="device-card-list">`+list.map(r=>`<div class="device-card-item"><div class="device-card-head"><div><div class="device-card-title">${esc(deviceName(r.deviceId))}</div><div class="device-card-code">${esc(r.date||"-")}</div></div>${ops?`<button class="small danger" onclick="deleteRecord('${r.id}')">刪除</button>`:""}</div><div class="device-card-info"><div class="info-row"><span>零件</span><strong>${esc(r.partId?partName(r.partId):"未指定零件")}</strong></div><div class="info-row"><span>人員</span><strong>${esc(r.owner||"-")}</strong></div><div class="info-row"><span>內容</span><strong>${esc(r.desc).replace(/\n/g,'<br>')}</strong></div></div></div>`).join("")+`</div>`}
function getDueItems(){return data.parts.filter(p=>p.cycle>0).map(p=>{const rs=data.records.filter(r=>r.partId===p.id).sort((a,b)=>(b.date||"").localeCompare(a.date||""));const lastDate=rs[0]?.date||"",nextDate=lastDate?addDays(lastDate,p.cycle):"",remain=nextDate?diffDays(nextDate):null;return{...p,lastDate,nextDate,remain}}).filter(x=>x.remain===null||x.remain<=30).sort((a,b)=>(a.remain??-9999)-(b.remain??-9999))}function dueTable(items){return`<div class="due-card-list">${items.map(p=>{let b='<span class="badge due">未維護</span>',stateClass='unmaintained';if(p.remain!==null&&p.remain<0){b=`<span class="badge overdue">逾期 ${Math.abs(p.remain)} 天</span>`;stateClass='overdue'}else if(p.remain!==null){b=`<span class="badge due">剩 ${p.remain} 天</span>`;stateClass='upcoming'}return`<article class="due-card-item ${stateClass}" onclick="openDueRecord('${p.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openDueRecord('${p.id}')}" role="button" tabindex="0" aria-label="新增 ${esc(p.name)} 的維護紀錄"><div class="due-card-head"><div><div class="due-card-title">${esc(p.name)}</div>${p.number?`<div class="due-card-code">${esc(p.number)}</div>`:''}</div>${b}</div><div class="due-card-info"><div class="due-info-row"><span>設備</span><strong>${esc(deviceName(p.deviceId))}</strong></div><div class="due-info-row"><span>最後維護</span><strong>${esc(p.lastDate||"尚無紀錄")}</strong></div><div class="due-info-row"><span>下次保養</span><strong>${esc(p.nextDate||"請新增維護紀錄")}</strong></div></div></article>`}).join("")}</div>`}function renderDue(){const items=getDueItems();dueList.innerHTML=items.length?dueTable(items):'<div class="empty">目前沒有 30 天內到期的保養項目</div>'}
function renderStats(){statDevices.textContent=data.devices.length;statParts.textContent=data.parts.length;statRecords.textContent=data.records.length;statDue.textContent=getDueItems().length}function renderHome(){const recent=[...data.records].sort((a,b)=>(b.date||"").localeCompare(a.date||"")).slice(0,5);homeRecentRecords.innerHTML=recent.length?recordsTable(recent,false):'<div class="empty">目前沒有維護紀錄</div>';const due=getDueItems().slice(0,5);homeDueList.innerHTML=due.length?dueTable(due):'<div class="empty">目前沒有 30 天內到期的保養項目</div>'}
function render(){save();renderStats();refreshSelects();renderDevices();renderParts();renderRecords();renderDue();renderHome();toggleSearchClear();togglePartSearchClear();toggleRecordSearchClear()}
function clearPartSearch(){const e=document.getElementById("partSearch");if(!e)return;e.value="";togglePartSearchClear();render();e.focus();}
function togglePartSearchClear(){const b=document.getElementById("partSearchClear"),e=document.getElementById("partSearch");if(b&&e)b.classList.toggle("hidden",!e.value);}
function clearRecordSearch(){const e=document.getElementById("recordSearch");if(!e)return;e.value="";toggleRecordSearchClear();render();e.focus();}
function toggleRecordSearchClear(){const b=document.getElementById("recordSearchClear"),e=document.getElementById("recordSearch");if(b&&e)b.classList.toggle("hidden",!e.value);}
function showMainTab(name,btn){["home","devices","records","due"].forEach(t=>document.getElementById("page-"+t).classList.add("hidden"));document.getElementById("page-"+name).classList.remove("hidden");document.querySelectorAll("main > .tabs .tab").forEach(x=>x.classList.remove("active"));const map={home:0,devices:1,records:2,due:3};(btn||document.querySelectorAll("main > .tabs .tab")[map[name]]).classList.add("active");render()}function showDeviceSubTab(name,btn){["device-list","part-list"].forEach(t=>document.getElementById("device-sub-"+t).classList.add("hidden"));document.getElementById("device-sub-"+name).classList.remove("hidden");document.querySelectorAll(".subtab").forEach(x=>x.classList.remove("active"));const map={"device-list":0,"part-list":1};(btn||document.querySelectorAll(".subtab")[map[name]]).classList.add("active");render()}
function exportData(){const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="factory-maintenance-backup.json";a.click();URL.revokeObjectURL(a.href)}function importData(e){const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=x=>{try{const imported=JSON.parse(x.target.result);if(!imported.devices||!imported.parts||!imported.records)throw new Error();data=imported;save();render();alert("匯入完成")}catch(err){alert("匯入失敗，請確認 JSON 格式是否正確")}};reader.readAsText(file);e.target.value=""}function clearAll(){if(!confirm("確定清空全部資料？此動作無法復原。"))return;data={devices:[],parts:[],records:[]};selectedDeviceId="";save();resetDeviceForm();resetPartForm();render()}
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeDeviceDialog()});

migrateDeviceUniqueCodes();recordDate.value=today();resetDeviceForm();render();
function toggleSearchClear(){
 const el=getEl('deviceSearch'),btn=getEl('deviceSearchClear');
 if(!el||!btn)return;
 btn.classList.toggle('hidden',!el.value);
}
function clearDeviceSearch(){
 const el=getEl('deviceSearch');
 if(!el)return;
 el.value='';
 toggleSearchClear();
 render();
 el.focus();
}
document.addEventListener('DOMContentLoaded',()=>{toggleSearchClear();togglePartSearchClear();toggleRecordSearchClear();});

getEl('deviceSearchClear')?.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();clearDeviceSearch();}});
getEl('partSearchClear')?.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();clearPartSearch();}});
getEl('recordSearchClear')?.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();clearRecordSearch();}});
