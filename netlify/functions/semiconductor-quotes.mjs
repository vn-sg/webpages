const symbols = ["NVDA","TSM","ASML","AVGO"];

async function quote(symbol) {
  const url = new URL("https://query1.finance.yahoo.com/v8/finance/chart/" + symbol);
  url.searchParams.set("range","1d");
  url.searchParams.set("interval","5m");
  const response = await fetch(url,{signal:AbortSignal.timeout(5000)});
  if (!response.ok) return null;
  const result = await response.json();
  const meta = result.chart?.result?.[0]?.meta;
  if (meta?.currency !== "USD" || !(meta.regularMarketPrice > 0) || !Number.isFinite(meta.regularMarketTime)) return null;
  return {symbol,price:meta.regularMarketPrice,time:meta.regularMarketTime*1000};
}

export default async function handler(request) {
  if (request.method !== "GET") return new Response(null,{status:405,headers:{Allow:"GET"}});
  const quotes = (await Promise.allSettled(symbols.map(quote))).flatMap(result => result.status==="fulfilled" && result.value ? [result.value] : []);
  return Response.json({quotes},{
    status:quotes.length ? 200 : 503,
    headers:{"Cache-Control":quotes.length ? "public, max-age=60" : "no-store"}
  });
}
