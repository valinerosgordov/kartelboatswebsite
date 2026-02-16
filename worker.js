/**
 * KARTEL BOATS — Test-Drive Form → Telegram
 * Cloudflare Worker (serverless proxy)
 *
 * ENV variables (set in Cloudflare dashboard):
 *   TELEGRAM_BOT_TOKEN  — from @BotFather
 *   TELEGRAM_CHAT_ID    — target chat / group id
 */

const ALLOWED_ORIGINS = [
  'https://kartelboats.ru',
  'https://www.kartelboats.ru',
];

// Simple in-memory rate limiter (per isolate, resets on cold start)
const rateMap = new Map();
const RATE_LIMIT = 5;       // requests
const RATE_WINDOW = 60_000; // per 1 minute

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.start > RATE_WINDOW) {
    rateMap.set(ip, { start: now, count: 1 });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const headers = corsHeaders(origin);

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    // Only POST /submit
    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/submit') {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // Rate limit
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (isRateLimited(ip)) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // Parse body
    let data;
    try {
      data = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // Validate
    const { name, phone, email, city, model, contact_method } = data;
    if (!name || !phone || !email || !city || !model) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // Build Telegram message
    const now = new Date();
    const dateStr = now.toLocaleDateString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      timeZone: 'Europe/Moscow',
    });
    const timeStr = now.toLocaleTimeString('ru-RU', {
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Europe/Moscow',
    });

    const text = [
      '🚤 <b>НОВАЯ ЗАЯВКА НА ТЕСТ-ДРАЙВ</b>',
      '',
      `👤 Имя: ${escapeHtml(name)}`,
      `📱 Телефон: ${escapeHtml(phone)}`,
      `📧 Email: ${escapeHtml(email)}`,
      `🏙 Город: ${escapeHtml(city)}`,
      `⚓️ Модель: ${escapeHtml(model)}`,
      `💬 Способ связи: ${escapeHtml(contact_method || 'Звонок')}`,
      '',
      `⏰ ${dateStr}, ${timeStr} (МСК)`,
      '',
      '<i>// KARTEL BOATS</i>',
    ].join('\n');

    // Send to Telegram
    const tgUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const tgRes = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'HTML',
      }),
    });

    if (!tgRes.ok) {
      const err = await tgRes.text();
      console.error('Telegram error:', err);
      return new Response(JSON.stringify({ error: 'Delivery failed' }), {
        status: 502,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  },
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
