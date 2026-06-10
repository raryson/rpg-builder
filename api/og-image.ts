function textValue(value: unknown, fallback: string) {
  if (Array.isArray(value)) return String(value[0] ?? fallback).slice(0, 90);
  return String(value ?? fallback).slice(0, 90);
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default function handler(req: any, res: any) {
  const title = escapeXml(textValue(req.query?.title, 'RPG Builder'));
  const subtitle = escapeXml(textValue(req.query?.subtitle, 'Star Wars Saga Edition'));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#101827"/>
      <stop offset="0.58" stop-color="#172554"/>
      <stop offset="1" stop-color="#111827"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1020" cy="120" r="150" fill="#facc15" opacity="0.12"/>
  <circle cx="190" cy="520" r="220" fill="#38bdf8" opacity="0.12"/>
  <rect x="72" y="72" width="1056" height="486" rx="34" fill="rgba(15,23,42,0.72)" stroke="rgba(255,255,255,0.16)" stroke-width="2"/>
  <text x="110" y="160" fill="#facc15" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" letter-spacing="3">RPG BUILDER</text>
  <text x="110" y="310" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="800">${title}</text>
  <text x="114" y="390" fill="#cbd5e1" font-family="Arial, Helvetica, sans-serif" font-size="34">${subtitle}</text>
  <text x="110" y="492" fill="#93c5fd" font-family="Arial, Helvetica, sans-serif" font-size="28">Wiki e fichas para Star Wars Saga Edition</text>
</svg>`;

  res.setHeader('content-type', 'image/svg+xml; charset=utf-8');
  res.setHeader('cache-control', 'public, max-age=86400, s-maxage=604800');
  res.status(200).send(svg);
}
