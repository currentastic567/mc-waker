const http = require('http');

const ACCOUNTS = [
  { token: (process.env.GH_TOKEN_1 || '').trim(), name: (process.env.CS_NAME_1 || '').trim(), label: "Account 1" },
  { token: (process.env.GH_TOKEN_2 || '').trim(), name: (process.env.CS_NAME_2 || '').trim(), label: "Account 2" }
];

let currentBackendAddress = "127.0.0.1:25565";
let tailscaleAddress = "none";

async function wakeAccount(acc) {
  if (!acc.token) return { ok: false, msg: `${acc.label}: Missing token` };
  const headers = {
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${acc.token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'MC-Cluster-Waker'
  };

  try {
    let csName = acc.name;
    const listRes = await fetch('https://api.github.com/user/codespaces', { headers });
    const listData = await listRes.json();
    if (listRes.ok && listData.codespaces && listData.codespaces.length > 0) {
      csName = listData.codespaces[0].name;
    }
    if (!csName) return { ok: false, msg: `${acc.label}: No Codespace found` };

    const res = await fetch(`https://api.github.com/user/codespaces/${csName}/start`, {
      method: 'POST',
      headers
    });
    return { ok: res.ok, msg: res.ok ? `Waking ${csName} on ${acc.label}` : `${acc.label} error ${res.status}` };
  } catch (e) {
    return { ok: false, msg: e.message };
  }
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/set-ip') {
    const addr = url.searchParams.get('addr');
    const ts = url.searchParams.get('ts');
    if (addr) currentBackendAddress = addr.trim();
    if (ts) tailscaleAddress = ts.trim();
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end(`Saved backend address: ${currentBackendAddress}\n`);
  }

  if (url.pathname === '/get-ip') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end(currentBackendAddress);
  }

  if (url.pathname === '/wake') {
    const logs = [];
    for (const acc of ACCOUNTS) {
      const r = await wakeAccount(acc);
      logs.push(r.msg);
      if (r.ok) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        return res.end(logs.join('\n'));
      }
    }
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    return res.end("Failed:\n" + logs.join('\n'));
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(`Waker Online!\nVelocity Tunnel IP: ${currentBackendAddress}\nTailscale IP: ${tailscaleAddress}\n`);
}).listen(process.env.PORT || 3000);
