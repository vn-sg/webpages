const id = name => document.getElementById(name);
const snapshot = 173.73;
const snapshotTime = Date.parse("2026-11-11T21:00:00Z");
const ebit = 197.579, shares = 24.15, netCash = 23.609;
const cashPerShare = (127.006 - 7.241) / 24.3975;
const fmt = (value,digits=1) => value.toFixed(digits);
const dollars = value => "$" + fmt(value,2);
const scenarioGrowth = [["悲观",.16],["基准",.19],["乐观",.22]];
const bridge = [
  ["GAAP 净利润",59.688,true],["非现金调整净额",-4.904],["应收账款",-22.346],
  ["库存",-5.784],["预付及其他资产",-5.497],["经营负债合计",2.920],
  ["经营现金流",24.077,true],["资本开支及本金",-2.736],["公司披露 FCF",21.341,true]
];
let series = [];
let timestamp = snapshotTime;
let manual = false;

function reverseGrowth(price, discount, terminal) {
  if (!(price>0 && discount>terminal && discount>=.01 && discount<=.5 && terminal>=-.05 && terminal<=.15)) return null;
  const ratio=price/cashPerShare;
  const value=g=>{
    const q=(1+g)/(1+discount);
    return [1,2,3,4,5].reduce((sum,t)=>sum+q**t,0)+q**5*(1+terminal)/(discount-terminal);
  };
  let a=-1,b=1;
  while(value(b)<ratio && b<1024)b=(b+1)*2-1;
  if(value(b)<ratio)return null;
  for(let i=0;i<70;i++){const m=(a+b)/2;if(value(m)<ratio)a=m;else b=m;}
  return (a+b)/2;
}

function fairPrice(growth) {
  const q=(1+growth)/1.12;
  const value=ebit*([1,2,3,4,5].reduce((sum,t)=>sum+.60*q**t,0)+20*q**5);
  return (value+netCash)/shares;
}

function drawBridge() {
  let running=0;
  id("bridge").innerHTML=bridge.map(([name,value,total])=>{
    const start=total?0:running;
    const end=total?value:running+value;
    running=end;
    const direction=total?"total":value<0?"down":"up";
    return `<div class="bridge-row" role="listitem"><span>${name}</span><div class="track" aria-hidden="true"><i class="${direction}" style="left:${Math.min(start,end)/60*100}%;width:${Math.abs(end-start)/60*100}%"></i></div><span>${!total&&value>0?"+":""}${fmt(value,3)}</span></div>`;
  }).join("");
}

function drawTrend() {
  const canvas=id("trend");
  if(!series.length||!canvas.clientWidth)return;
  const width=canvas.clientWidth,height=canvas.clientHeight,dpr=devicePixelRatio||1;
  canvas.width=width*dpr;canvas.height=height*dpr;
  const c=canvas.getContext("2d");
  c.scale(dpr,dpr);
  const left=34,right=width-17,top=13,bottom=height-30;
  const x=i=>left+(right-left)*i/(series.length-1), y=n=>bottom-(bottom-top)*n/80;
  c.font="11px system-ui";
  c.fillStyle="#52665f";
  for(let tick=0;tick<=80;tick+=20){
    c.strokeStyle="#dbe4d8";c.beginPath();c.moveTo(left,y(tick));c.lineTo(right,y(tick));c.stroke();
    c.fillText(tick+"%",0,y(tick)+4);
  }
  for(const [column,color] of [[3,"#12644d"],[4,"#27609a"]]){
    c.strokeStyle=c.fillStyle=color;c.lineWidth=2.5;c.beginPath();
    series.forEach((row,i)=>i?c.lineTo(x(i),y(row[column])):c.moveTo(x(i),y(row[column])));
    c.stroke();
    series.forEach((row,i)=>{c.beginPath();c.arc(x(i),y(row[column]),2.5,0,Math.PI*2);c.fill();});
  }
  c.fillStyle="#52665f";
  for(const i of [0,4,8,11])c.fillText(series[i][0].replace(" ",""),Math.min(x(i)-12,right-36),height-8);
}

function update() {
  const price=id("price").valueAsNumber;
  const implied=reverseGrowth(price,id("discount").valueAsNumber/100,id("terminal").valueAsNumber/100);
  const priceValid=Number.isFinite(price)&&price>0;
  id("hero-price").textContent=priceValid?dollars(price):"—";
  id("hero-multiple").textContent=priceValid?fmt((price*shares-netCash)/ebit)+"×":"—";
  id("implied").textContent=id("hero-growth").textContent=implied===null?"—":fmt(implied*100)+"%";
  id("model-status").textContent=implied===null?"请输入有效股价和增长假设，折现率须高于永续增速。":"基期为每股 $4.91。采用 TTM FCF 减股权薪酬，保留实际营运资金变动。";
  const max=Math.max(...scenarioGrowth.map(([,g])=>fairPrice(g)),priceValid?price:0)*1.1;
  id("scenarios").innerHTML=scenarioGrowth.map(([name,g])=>{
    const value=fairPrice(g);
    return `<div class="scenario"><p><span>${name} · EBIT 年增 ${fmt(g*100,0)}%</span><strong>${dollars(value)}</strong></p><div class="track" aria-hidden="true"><i style="width:${value/max*100}%"></i>${priceValid?`<b style="left:${price/max*100}%"></b>`:""}</div></div>`;
  }).join("")+(priceValid?`<p class="note">竖线为输入股价 ${dollars(price)}。</p>`:"");
}

async function refresh(replaceManual=false) {
  const button=id("refresh");
  button.disabled=true;
  id("quote-status").textContent="正在刷新报价…";
  try {
    const response=await fetch("/.netlify/functions/semiconductor-quotes",{cache:"no-store",signal:AbortSignal.timeout(8000)});
    if(!response.ok)throw Error("unavailable");
    const {quotes}=await response.json();
    const quote=quotes?.find(q=>q.symbol==="NVDA"&&Number.isFinite(q.price)&&q.price>0&&Number.isFinite(q.time)&&q.time>=timestamp&&q.time<=Date.now()+300000);
    if(!quote)throw Error("no valid quote");
    if(manual&&!replaceManual){id("quote-status").textContent="已保留手动输入，点击刷新可替换。";return;}
    timestamp=quote.time;manual=false;id("price").value=fmt(quote.price,2);
    const time=new Date(timestamp).toLocaleString("zh-CN",{timeZone:"America/New_York",month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"});
    id("quote-status").textContent=time+" 美东 · Yahoo Finance，报价可能延迟。";
    id("hero-date").textContent=time+" 美东报价 · 财务基期截至 FY27 Q2";
    update();
  } catch {id("quote-status").textContent="自动报价暂不可用。保留当前值，可参考 TradingView 后手动输入。";}
  finally{button.disabled=false;}
}

id("price").addEventListener("input",()=>{
  manual=true;
  id("quote-status").textContent="当前为手动输入。";
  id("hero-date").textContent="手动股价 · 财务基期截至 FY27 Q2";
  update();
});
for(const name of ["discount","terminal"])id(name).addEventListener("input",update);
id("refresh").addEventListener("click",()=>refresh(true));
drawBridge();update();void refresh();
new ResizeObserver(drawTrend).observe(id("trend"));
try{
  const response=await fetch(new URL("../semiconductor/series.json",import.meta.url));
  if(!response.ok)throw Error("series unavailable");
  const data=await response.json();
  if(!Array.isArray(data.NVDA)||data.NVDA.length!==12)throw Error("invalid series");
  series=data.NVDA;
  id("series").innerHTML=[...series].reverse().map(row=>`<tr><th scope="row">${row[0]}</th><td>${fmt(row[1],2)}</td><td>${fmt(row[3])}%</td><td>${fmt(row[4])}%</td></tr>`).join("");
  drawTrend();
}catch{id("series").innerHTML='<tr><td colspan="4">季度数据暂不可用。</td></tr>';}
