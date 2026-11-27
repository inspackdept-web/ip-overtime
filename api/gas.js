// Vercel Serverless Function Proxy -> Cloudflare Worker (D1) atau Google Apps Script (Fallback/Rollback)
// Atur Environment Variable di Vercel:
//   DB_TARGET      = "cloudflare" (atau "gas" untuk rollback instan ke Google Sheets)
//   CF_WORKER_URL  = URL Cloudflare Worker (contoh: https://ip-overtime-api.xxxx.workers.dev)
//   CF_API_SECRET  = Secret yang sama dengan CF_API_SECRET di Cloudflare Worker
//   GAS_WEBAPP_URL = URL Web App Apps Script (opsional, punya default URL proyek saat ini)

const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbzN0i_ZBTd2ImiwzSo2VQpMKrxUchjMgqjTJmRUfpnk0NHhDUZymWnUxEbwNwCy2MgP/exec';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method Not Allowed. Gunakan POST.' });

  const dbTarget = String(process.env.DB_TARGET || 'gas').toLowerCase().trim();
  const useCloudflare = dbTarget === 'cloudflare' && Boolean(process.env.CF_WORKER_URL);

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const fn = String(body.fn || body.action || '').trim();
    const args = Array.isArray(body.args) ? body.args : [];

    if (!fn) {
      return res.status(400).json({ ok: false, error: 'Parameter fn wajib diisi.' });
    }

    if (useCloudflare) {
      const cfUrl = process.env.CF_WORKER_URL;
      const cfSecret = process.env.CF_API_SECRET || '';
      const upstreamRes = await fetch(cfUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-API-Secret': cfSecret
        },
        body: JSON.stringify({ fn, args })
      });

      const text = await upstreamRes.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (_) {
        return res.status(502).json({ ok: false, error: 'Respon dari Cloudflare Worker bukan JSON valid.' });
      }
      return res.status(upstreamRes.ok ? 200 : upstreamRes.status).json(data);
    }

    // Mode GAS (default / rollback instan)
    const gasUrl = process.env.GAS_WEBAPP_URL || DEFAULT_GAS_URL;
    const upstreamRes = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ fn, args }),
      redirect: 'follow'
    });

    const text = await upstreamRes.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (_) {
      return res.status(502).json({ ok: false, error: 'Respon dari Google Apps Script bukan JSON valid.' });
    }
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ ok: false, error: (err && err.message) ? err.message : String(err) });
  }
}
