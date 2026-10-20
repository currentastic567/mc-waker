const http = require('http');

const ACCOUNTS = [
  { token: (process.env.GH_TOKEN_1 || '').trim(), name: (process.env.CS_NAME_1 || '').trim(), label: "Account 1" },
  { token: (process.env.GH_TOKEN_2 || '').trim(), name: (process.env.CS_NAME_2 || '').trim(), label: "Account 2" }
];

let currentBackendAddress = "127.0.0.1:25565";

async function wakeAccount(acc) {
  if (!acc.token || !acc.name) return false;
  const res = await fetch(`https://api.github.com/user/codespaces/${acc.name}/start`, {
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${acc.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'MC-Cluster-Waker'
    }
  });
  return res.ok;
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // 1. Codespace calls /set-ip?addr=bore.pub:12345 when it boots
  if (url.pathname === '/set-ip') {
    const addr = url.searchParams.get('addr');
    if (addr) currentBackendAddress = addr.trim();
    res.writeHead(200);
    return res.end(`Saved backend address: ${currentBackendAddress}`);
  }

  // 2. FreeGameHost checks /get-ip to update velocity.toml automatically
  if (url.pathname === '/get-ip') {
    res.writeHead(200);
    return res.end(currentBackendAddress);
  }

  // 3. Wake trigger
  if (url.pathname === '/wake') {
    for (const acc of ACCOUNTS) {
      if (await wakeAccount(acc)) {
        res.writeHead(200);
        return res.end(`Waking 8GB Server on ${acc.label}`);
      }
    }
    res.writeHead(500);
    return res.end("Failed to wake either account.");
  }

  res.writeHead(200);
  res.end(`Waker Online! Current Backend: ${currentBackendAddress}`);
}).listen(process.env.PORT || 3000);
