const companies = [
  {id:"NVDA", name:"英伟达", price:173.73, shares:24.15, debt:-23.609, ebit:197.579, capex:2.4, range:[27,35], growth:"16–22%", conversion:60, rate:12, exit:20, period:"FY27 Q2", unit:"美元", oeps:6.3447, cash:(127.006-7.241)/24.3975,
    thesis:"CUDA、网络与低资本开支支撑优先级。FY28 营收初步展望约 +70%，以供应能否跟上为关键。",
    note:"FY27 Q2 EBIT率 66.2%，FCF率仅 22.2%。应收及库存占用现金，跟踪回款和备货节奏。", method:"维护开支以折旧摊销估算，营运资金替换为三年中位数。"},
  {id:"TSM", name:"台积电", price:413.35, shares:25.93/5, debt:-3198.6/32.86, ebit:2866.026/32.86, capex:33.3, range:[19,25], growth:"13–19%", conversion:45, rate:14, exit:18, period:"2026 Q3", unit:"台币", oeps:8.6849, cash:(1480.739-.41006)/(25.9315/5)/32.865,
    thesis:"先进制程代工规模领先。2026 美元营收约 +44%，但扩产支出和台海风险压低合理倍数。",
    note:"近12个月营业利润率 58.0%，FCF率 29.9%。扩产耗资意味着经营现金流与可分配现金相差很大。", method:"扣全额资本开支，保留当期营运资金。每份 ADR 对应 5 股。"},
  {id:"ASML", name:"阿斯麦", price:1534.42, shares:.3831, debt:-10.772*1.1127, ebit:15.2178*1.1127, capex:4.0, range:[25,31], growth:"12–17%", conversion:65, rate:12, exit:22, period:"2026 Q3", unit:"欧元", oeps:37.9876, cash:(21.162-.2184-7.8769)/.385275*1.1214,
    thesis:"EUV 护城河最强，模型给最高退出倍数。2027–28 年预计供应不足，成长受交付产能约束。",
    note:"2026 Q3 FCF率 97.6%，剔除经营资产负债净流入后约 37.5%。预收款造成现金流季节性波动。", method:"剔除营运资金净流入及税后投资收益，维护开支取估算。"},
  {id:"AVGO", name:"博通", price:345.22, shares:4.77, debt:35.44, ebit:42.814, capex:1.4, range:[24,32], growth:"18–25%", conversion:55, rate:13, exit:17, period:"FY26 Q3", unit:"美元", oeps:7.6944, cash:(39.403-8.482)/4.88525,
    thesis:"定制芯片与网络弹性大。FY27／FY28 AI 芯片收入展望 $115B／$230B，关键看大客户按期部署。",
    note:"最新季 EBIT率 53.9%，FCF率 46.2%。并购摊销、现金收付时点和客户集中度需要分别跟踪。", method:"扣全额资本开支，营运资金替换为三年中位数。"}
];
const byId = id => document.getElementById(id);
const pct = value => value.toFixed(1) + "%";
const multiple = (c, price = c.price) => (price * c.shares + c.debt) / c.ebit;
const bounds = ([lo, hi]) => `${lo}–${hi}×`;
const snapshotDate = "2026-11-11";
const snapshotTime = Date.parse(snapshotDate + "T21:00:00Z");
const quoteTimes = new Map();
const current = new Map(companies.map(c => [c.id, c.price]));
const manual = new Set();
const money = new Intl.NumberFormat("en-US",{maximumFractionDigits:2});
const series = new Map();
let selected = companies[0];
let loaded = false;

function reverseGrowth(target, discount, terminal) {
  if (!(target > 0 && discount > terminal && discount > -1 && terminal > -1)) return null;
  const value = g => {
    const q = (1 + g) / (1 + discount);
    return [1,2,3,4,5].reduce((sum,t) => sum + q ** t, 0) + q ** 5 * (1 + terminal) / (discount - terminal);
  };
  let low = -1, high = 1;
  while (value(high) < target && high < 1024) high = (high + 1) * 2 - 1;
  if (value(high) < target) return null;
  for (let i = 0; i < 75; i++) {
    const middle = (low + high) / 2;
    if (value(middle) < target) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}

function renderComparison() {
  const scale = n => n / 42 * 100;
  byId("ranges").innerHTML = companies.map(c => {
    const [a,b] = c.range;
    const m = multiple(c);
    return `<div class="range-row"><strong>${c.id}</strong><div class="track" aria-hidden="true"><i style="left:${scale(a)}%;width:${scale(b-a)}%"></i><b style="left:${scale(m)}%"></b></div><span>${m.toFixed(1)}× ／ ${bounds(c.range)}</span></div>`;
  }).join("");
  byId("capex").innerHTML = [...companies].sort((a,b) => b.capex-a.capex).map(c => `<div class="bar-row"><strong>${c.id}</strong><div class="track" aria-hidden="true"><i style="width:${c.capex / 35 * 100}%"></i></div><span>${pct(c.capex)}</span></div>`).join("");
  byId("theses").innerHTML = companies.map(c => `<article class="thesis-card" id="${c.id.toLowerCase()}"><strong>${c.id} · ${c.name}</strong><p>${c.thesis}</p></article>`).join("");
  byId("assumptions").innerHTML = companies.map(c => `<tr><th scope="row">${c.id}</th><td>${c.growth}</td><td>${c.conversion}%</td><td>${c.rate}%</td><td>${c.exit}×</td></tr>`).join("");
  byId("methods").innerHTML = companies.map(c => `<tr><th scope="row">${c.id}</th><td>${c.period}</td><td>${c.oeps.toFixed(2)}</td><td>${c.cash.toFixed(2)} 美元</td><td>${c.method}</td></tr>`).join("");
}

function drawTrend() {
  const data = series.get(selected.id);
  const canvas = byId("trend");
  if (!data || !canvas.clientWidth) return;
  const width = canvas.clientWidth, height = canvas.clientHeight, dpr = devicePixelRatio || 1;
  canvas.width = width*dpr;
  canvas.height = height*dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr,dpr);
  const left = 42, right = width - 14, top = 13, bottom = height - 31;
  const low = Math.min(0, Math.floor(Math.min(...data.map(row => row[4]))/20)*20);
  const high = Math.ceil(Math.max(...data.flatMap(row => row.slice(3,5)))/20)*20;
  const x = i => left + (right-left)*i/(data.length-1);
  const y = value => top + (high-value)/(high-low)*(bottom-top);
  ctx.font = "11px system-ui";
  for (let tick=low; tick<=high; tick+=20) {
    ctx.strokeStyle = tick === 0 ? "#a0b5ab" : "#e4ebe3";
    ctx.fillStyle = "#52665f";
    ctx.beginPath(); ctx.moveTo(left,y(tick)); ctx.lineTo(right,y(tick)); ctx.stroke();
    ctx.fillText(tick+"%",0,y(tick)+4);
  }
  for (const [index,color] of [[3,"#12644d"],[4,"#27609a"]]) {
    ctx.strokeStyle = ctx.fillStyle = color;
    ctx.lineWidth=2.4;
    ctx.beginPath();
    data.forEach((row,i) => i ? ctx.lineTo(x(i),y(row[index])) : ctx.moveTo(x(i),y(row[index])));
    ctx.stroke();
    data.forEach((row,i) => {ctx.beginPath();ctx.arc(x(i),y(row[index]),2.6,0,2*Math.PI);ctx.fill();});
  }
  ctx.fillStyle="#52665f";
  for (const i of [0,4,8,11]) {
    const label=data[i][0].replace("20","").replace(" ","");
    ctx.fillText(label,Math.max(left-7,Math.min(x(i)-13,right-30)),height-7);
  }
}

function select(c) {
  selected = c;
  for (const button of byId("tabs").querySelectorAll("button")) button.setAttribute("aria-pressed",String(button.value===c.id));
  const data = series.get(c.id) || [];
  byId("trend-note").textContent = loaded ? c.note : "季度数据载入中。";
  byId("series").innerHTML = [...data].reverse().map(row => `<tr><th scope="row">${row[0]}</th><td>${money.format(row[1])} 十亿${c.unit}（${row[2]>=0?"+":""}${row[2]}%）</td><td>${pct(row[3])}</td><td>${pct(row[4])}</td></tr>`).join("");
  drawTrend();
}

function calc() {
  const r = byId("discount").valueAsNumber / 100;
  const g = byId("terminal").valueAsNumber / 100;
  const valid = Number.isFinite(r) && Number.isFinite(g) && r > g && r >= .01 && r <= .5 && g >= -.05 && g <= .15;
  byId("model-status").textContent = valid ? "" : "请输入有效税后折现率和永续增长率，且折现率须高于永续增长率。";
  for (const c of companies) {
    const p = current.get(c.id);
    const implied = valid && p>0 ? reverseGrowth(p / c.cash,r,g) : null;
    byId("m-"+c.id).textContent = p>0 ? multiple(c,p).toFixed(1)+"×" : "—";
    byId("g-"+c.id).textContent = implied===null ? "—" : pct(implied*100);
  }
}

function mountPricing() {
  byId("calc").innerHTML=companies.map(c => `<article class="calc-card"><strong>${c.id}</strong><label for="p-${c.id}">股价（美元）</label><input id="p-${c.id}" type="number" min=".01" step=".01" value="${c.price.toFixed(2)}"><small id="t-${c.id}">${snapshotDate} 收盘</small><dl><dt>EV/EBIT</dt><dd id="m-${c.id}"></dd><dt>隐含现金流年增</dt><dd id="g-${c.id}"></dd></dl></article>`).join("");
  for(const c of companies) byId("p-"+c.id).addEventListener("input",e => {
    manual.add(c.id);current.set(c.id,e.target.valueAsNumber);byId("t-"+c.id).textContent="手动输入";calc();
  });
  for(const id of ["discount","terminal"]) byId(id).addEventListener("input",calc);
  byId("refresh").addEventListener("click",() => refresh(true));
  calc();
}

async function refresh(replaceManual = false) {
  const button=byId("refresh");
  button.disabled=true;
  byId("quote-status").textContent="正在刷新报价…";
  try {
    const endpoint=new URL("/.netlify/functions/semiconductor-quotes",location.origin);
    const response=await fetch(endpoint,{cache:"no-store",signal:AbortSignal.timeout(8000)});
    if (!response.ok) throw Error("quotes unavailable");
    const {quotes}=await response.json();
    if (!Array.isArray(quotes)) throw Error("invalid quotes");
    const validQuotes=quotes.filter(q => companies.some(c => c.id===q.symbol) && q.price>0 && Number.isFinite(q.price) && Number.isFinite(q.time) && q.time >= (quoteTimes.get(q.symbol) ?? snapshotTime) && q.time<=Date.now()+300000);
    if (!validQuotes.length) throw Error("no current quotes");
    for (const q of validQuotes) {
      if (manual.has(q.symbol) && !replaceManual) continue;
      manual.delete(q.symbol); current.set(q.symbol,q.price); quoteTimes.set(q.symbol,q.time);
      byId("p-"+q.symbol).value=q.price.toFixed(2);
      byId("t-"+q.symbol).textContent=new Date(q.time).toLocaleString("zh-CN",{timeZone:"America/New_York",month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"})+" 美东 · Yahoo";
    }
    byId("quote-status").textContent=`收到 ${validQuotes.length}/4 个报价。行情可能延迟，未返回的价格保留原值。`;
    calc();
  } catch {
    byId("quote-status").textContent="自动报价暂不可用。各卡片保留已标注的快照或输入值，可参考下方行情手动更新。";
  } finally {button.disabled=false;}
}

renderComparison();
mountPricing();
byId("tabs").innerHTML=companies.map(c => `<button type="button" value="${c.id}" aria-pressed="false">${c.id}</button>`).join("");
byId("tabs").addEventListener("click",e => {
  const c=companies.find(item => item.id===e.target.value);
  if(c) select(c);
});
new ResizeObserver(drawTrend).observe(byId("trend"));
select(selected);
try {
  const response=await fetch(new URL("./series.json",import.meta.url));
  if (!response.ok) throw Error("series unavailable");
  const all=await response.json();
  if (companies.some(c => !Array.isArray(all[c.id]) || all[c.id].length !== 12)) throw Error("invalid series");
  companies.forEach(c => series.set(c.id,all[c.id]));
  loaded=true;
  select(selected);
} catch {byId("trend-note").textContent="季度数据暂不可用。";}
void refresh();
