const http = require('http');

const ACCOUNTS = [
  { token: process.env.GH_TOKEN_1, codespace: process.env.CS_NAME_1, label: "Account 1" },
  { token: process.env.GH_TOKEN_2, codespace: process.env.CS_NAME_2, label: "Account 2" }
];

async function wakeCodespace(acc) {
  if (!acc.token || !acc.codespace) return false;
  const res = await fetch(`https://api.github.com/user/codespaces/${acc.codespace}/start`, {
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
  if (req.url === '/wake') {
    for (const acc of ACCOUNTS) {
      if (await wakeCodespace(acc)) {
        res.writeHead(200);
        return res.end(`Waking 8GB Server on ${acc.label}`);
      }
    }
    res.writeHead(500);
    return res.end("Failed to wake either account.");
  }
  res.writeHead(200);
  res.end("Waker Ready");
}).listen(process.env.PORT || 3000);
