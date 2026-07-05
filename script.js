const STORAGE_KEY="factoryMaintenanceDataV2";let data=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{"devices":[],"parts":[],"records":[]}');let selectedDeviceId="";
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(data))}function esc(s){return String(s||"").replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}function today(){return new Date().toISOString().slice(0,10)}function addDays(d,n){const x=new Date(d+"T00:00:00");x.setDate(x.getDate()+Number(n||0));return x.toISOString().slice(0,10)}function diffDays(d){return Math.ceil((new Date(d+"T00:00:00")-new Date(today()+"T00:00:00"))/86400000)}function deviceName(id){return data.devices.find(x=>x.id===id)?.name||"未指定設備"}function partName(id){return data.parts.find(x=>x.id===id)?.name||"未指定零件"}
function getEl(id){return document.getElementById(id)}
function saveDevice(){
  const id=getEl("deviceEditId").value;
  const name=getEl("deviceName").value.trim();
  if(!name){alert("請輸入設備名稱");return}
  const item={
    id:id||uid(),
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
  resetDeviceForm();save();render();openDeviceParts(item.id)
}
function resetDeviceForm(){getEl("deviceFormTitle").textContent="新增設備";["deviceEditId","deviceName","deviceCode","deviceLocation","deviceBrand","deviceModel","deviceSerial","deviceNote"].forEach(id=>getEl(id).value="")}
function editDevice(id){
  const d=data.devices.find(x=>x.id===id);
  if(!d)return;
  showMainTab("devices");
  showDeviceSubTab("device-form");
  getEl("deviceFormTitle").textContent="編輯設備";
  getEl("deviceEditId").value=d.id||"";
  getEl("deviceName").value=d.name||"";
  getEl("deviceCode").value=d.code||"";
  getEl("deviceLocation").value=d.location||"";
  getEl("deviceBrand").value=d.brand||"";
  getEl("deviceModel").value=d.model||"";
  getEl("deviceSerial").value=d.serial||"";
  getEl("deviceNote").value=d.note||"";
  window.scrollTo({top:0,behavior:"smooth"})
}
function editSelectedDevice(){const id=selectedDeviceId||partDevice.value;if(!id){alert("請先選擇設備");return}editDevice(id)}
function deleteDevice(id,event){if(event)event.stopPropagation();if(!confirm("確定刪除此設備？相關零件與維護紀錄也會刪除。"))return;data.devices=data.devices.filter(x=>x.id!==id);const partIds=data.parts.filter(p=>p.deviceId===id).map(p=>p.id);data.parts=data.parts.filter(p=>p.deviceId!==id);data.records=data.records.filter(r=>r.deviceId!==id&&!partIds.includes(r.partId));if(selectedDeviceId===id)selectedDeviceId="";save();render()}
function openDeviceParts(id){selectedDeviceId=id;showMainTab("devices");showDeviceSubTab("part-list");partDevice.value=id;render()}
function backToDeviceList(){selectedDeviceId="";showDeviceSubTab("device-list")}
function savePart(){const editId=partEditId.value,deviceId=partDevice.value,name=partNameInput().trim();if(!deviceId){alert("請先新增或選擇設備");return}if(!name){alert("請輸入零件名稱");return}const item={id:editId||uid(),deviceId,name,number:partNumber.value.trim(),cycle:Number(partCycle.value||0)};if(editId){const i=data.parts.findIndex(x=>x.id===editId);if(i>=0)data.parts[i]=item}else data.parts.push(item);selectedDeviceId=deviceId;resetPartForm(false);save();render()}function partNameInput(){return document.getElementById("partName").value}
function editPart(id){const p=data.parts.find(x=>x.id===id);if(!p)return;selectedDeviceId=p.deviceId;showMainTab("devices");showDeviceSubTab("part-list");partEditId.value=p.id;partDevice.value=p.deviceId||"";partName.value=p.name||"";partNumber.value=p.number||"";partCycle.value=p.cycle||"";renderPartTitle()}function resetPartForm(clearDevice=true){["partEditId","partName","partNumber","partCycle"].forEach(id=>document.getElementById(id).value="");if(clearDevice&&!selectedDeviceId)partDevice.selectedIndex=0}
function deletePart(id){if(!confirm("確定刪除此零件？相關維護紀錄也會刪除。"))return;data.parts=data.parts.filter(x=>x.id!==id);data.records=data.records.filter(x=>x.partId!==id);save();render()}
function saveRecord(){const deviceId=recordDevice.value,partId=recordPart.value,desc=recordDesc.value.trim();if(!deviceId){alert("請先選擇設備");return}if(!desc){alert("請輸入維護內容");return}data.records.push({id:uid(),deviceId,partId,date:recordDate.value||today(),owner:recordOwner.value.trim(),desc});recordDate.value=today();recordOwner.value="";recordDesc.value="";save();render()}function deleteRecord(id){if(!confirm("確定刪除此維護紀錄？"))return;data.records=data.records.filter(x=>x.id!==id);save();render()}
function refreshSelects(){const opts=data.devices.map(d=>`<option value="${d.id}">${esc(d.name)}${d.code?" / "+esc(d.code):""}</option>`).join("");partDevice.innerHTML=opts||'<option value="">尚無設備</option>';recordDevice.innerHTML=opts||'<option value="">尚無設備</option>';if(selectedDeviceId&&data.devices.some(d=>d.id===selectedDeviceId))partDevice.value=selectedDeviceId;refreshRecordParts()}function refreshRecordParts(){const id=recordDevice.value;const ps=data.parts.filter(p=>p.deviceId===id);recordPart.innerHTML='<option value="">不指定零件</option>'+ps.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("")}
function renderDevices(){const q=(deviceSearch?.value||"").toLowerCase();const list=data.devices.filter(d=>[d.name,d.code,d.location,d.brand,d.model,d.serial].join(" ").toLowerCase().includes(q));if(!list.length){deviceList.innerHTML='<div class="empty">目前沒有設備資料</div>';return}deviceList.innerHTML=`<table><thead><tr><th>設備</th><th>位置</th><th>型號 / 序號</th><th>零件</th><th>操作</th></tr></thead><tbody>${list.map(d=>`<tr class="clickable-row" onclick="openDeviceParts('${d.id}')"><td><b>${esc(d.name)}</b><br><span class="note">${esc(d.code||"-")}</span></td><td>${esc(d.location||"-")}</td><td>${esc([d.brand,d.model].filter(Boolean).join(" ")||"-")}<br><span class="note">${esc(d.serial||"")}</span></td><td>${data.parts.filter(p=>p.deviceId===d.id).length}</td><td><button class="small danger" onclick="deleteDevice('${d.id}',event)">刪除</button></td></tr>`).join("")}</tbody></table>`}
function renderPartTitle(){const d=data.devices.find(x=>x.id===selectedDeviceId);selectedDeviceTitle.textContent=d?`${d.name} 的零件清單`:"零件管理"}
function renderParts(){renderPartTitle();const current=selectedDeviceId||partDevice.value;const list=current?data.parts.filter(p=>p.deviceId===current):data.parts;if(!list.length){partList.innerHTML='<div class="empty" style="margin-top:14px">目前沒有零件資料</div>';return}partList.innerHTML=`<table style="margin-top:14px"><thead><tr><th>設備</th><th>零件</th><th>Part Number</th><th>週期</th><th>操作</th></tr></thead><tbody>${list.map(p=>`<tr><td>${esc(deviceName(p.deviceId))}</td><td><b>${esc(p.name)}</b></td><td>${esc(p.number||"-")}</td><td>${p.cycle?p.cycle+" 天":"-"}</td><td><button class="small primary" onclick="editPart('${p.id}')">編輯</button> <button class="small danger" onclick="deletePart('${p.id}')">刪除</button></td></tr>`).join("")}</tbody></table>`}
function renderRecords(){if(!data.records.length){recordList.innerHTML='<div class="empty">目前沒有維護紀錄</div>';return}const s=[...data.records].sort((a,b)=>(b.date||"").localeCompare(a.date||""));recordList.innerHTML=recordsTable(s,true)}function recordsTable(list,ops){return`<table><thead><tr><th>日期</th><th>設備 / 零件</th><th>內容</th><th>人員</th>${ops?"<th>操作</th>":""}</tr></thead><tbody>${list.map(r=>`<tr><td>${esc(r.date||"-")}</td><td><b>${esc(deviceName(r.deviceId))}</b><br><span class="note">${esc(r.partId?partName(r.partId):"未指定零件")}</span></td><td>${esc(r.desc)}</td><td>${esc(r.owner||"-")}</td>${ops?`<td><button class="small danger" onclick="deleteRecord('${r.id}')">刪除</button></td>`:""}</tr>`).join("")}</tbody></table>`}
function getDueItems(){return data.parts.filter(p=>p.cycle>0).map(p=>{const rs=data.records.filter(r=>r.partId===p.id).sort((a,b)=>(b.date||"").localeCompare(a.date||""));const lastDate=rs[0]?.date||"",nextDate=lastDate?addDays(lastDate,p.cycle):"",remain=nextDate?diffDays(nextDate):null;return{...p,lastDate,nextDate,remain}}).filter(x=>x.remain===null||x.remain<=30).sort((a,b)=>(a.remain??-9999)-(b.remain??-9999))}function dueTable(items){return`<table><thead><tr><th>狀態</th><th>設備</th><th>零件</th><th>最後維護</th><th>下次保養</th></tr></thead><tbody>${items.map(p=>{let b='<span class="badge due">未維護</span>';if(p.remain!==null&&p.remain<0)b=`<span class="badge overdue">逾期 ${Math.abs(p.remain)} 天</span>`;else if(p.remain!==null)b=`<span class="badge due">剩 ${p.remain} 天</span>`;return`<tr><td>${b}</td><td>${esc(deviceName(p.deviceId))}</td><td><b>${esc(p.name)}</b><br><span class="note">${esc(p.number||"")}</span></td><td>${esc(p.lastDate||"尚無紀錄")}</td><td>${esc(p.nextDate||"請新增維護紀錄")}</td></tr>`}).join("")}</tbody></table>`}function renderDue(){const items=getDueItems();dueList.innerHTML=items.length?dueTable(items):'<div class="empty">目前沒有 30 天內到期的保養項目</div>'}
function renderStats(){statDevices.textContent=data.devices.length;statParts.textContent=data.parts.length;statRecords.textContent=data.records.length;statDue.textContent=getDueItems().length}function renderHome(){const recent=[...data.records].sort((a,b)=>(b.date||"").localeCompare(a.date||"")).slice(0,5);homeRecentRecords.innerHTML=recent.length?recordsTable(recent,false):'<div class="empty">目前沒有維護紀錄</div>';const due=getDueItems().slice(0,5);homeDueList.innerHTML=due.length?dueTable(due):'<div class="empty">目前沒有 30 天內到期的保養項目</div>'}
function render(){save();renderStats();refreshSelects();renderDevices();renderParts();renderRecords();renderDue();renderHome()}
function showMainTab(name,btn){["home","devices","records","due"].forEach(t=>document.getElementById("page-"+t).classList.add("hidden"));document.getElementById("page-"+name).classList.remove("hidden");document.querySelectorAll("main > .tabs .tab").forEach(x=>x.classList.remove("active"));const map={home:0,devices:1,records:2,due:3};(btn||document.querySelectorAll("main > .tabs .tab")[map[name]]).classList.add("active");render()}function showDeviceSubTab(name,btn){["device-list","device-form","part-list"].forEach(t=>document.getElementById("device-sub-"+t).classList.add("hidden"));document.getElementById("device-sub-"+name).classList.remove("hidden");document.querySelectorAll(".subtab").forEach(x=>x.classList.remove("active"));const map={"device-list":0,"device-form":1,"part-list":2};(btn||document.querySelectorAll(".subtab")[map[name]]).classList.add("active");render()}
function exportData(){const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="factory-maintenance-backup.json";a.click();URL.revokeObjectURL(a.href)}function importData(e){const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=x=>{try{const imported=JSON.parse(x.target.result);if(!imported.devices||!imported.parts||!imported.records)throw new Error();data=imported;save();render();alert("匯入完成")}catch(err){alert("匯入失敗，請確認 JSON 格式是否正確")}};reader.readAsText(file);e.target.value=""}function clearAll(){if(!confirm("確定清空全部資料？此動作無法復原。"))return;data={devices:[],parts:[],records:[]};selectedDeviceId="";save();resetDeviceForm();resetPartForm();render()}
recordDate.value=today();render();