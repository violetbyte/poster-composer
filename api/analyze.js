module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'missing key' });
  const text = String((req.body && req.body.text) || '').slice(0, 140);
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return res.status(400).json({ error: 'empty' });
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-5-5',
        max_tokens: 100,
        system: 'You help design typographic posters. The user gives a line of text as numbered words. Reply with ONLY JSON: {"tone":"bold"|"calm"|"playful","key":<index of the single word to emphasize most>}. Bold means urgent, motivational or direct. Calm means reflective, gentle or quiet. Playful means light, funny or curious.',
        messages: [{ role: 'user', content: words.map((w, i) => i + ':' + w).join(' ') }]
      })
    });
    const d = await r.json();
    const j = JSON.parse((d.content[0].text.match(/\{[\s\S]*\}/) || ['{}'])[0]);
    const tone = ['bold', 'calm', 'playful'].includes(j.tone) ? j.tone : null;
    const key = Number.isInteger(j.key) && j.key >= 0 && j.key < words.length ? j.key : null;
    res.status(200).json({ tone, key });
  } catch (e) {
    res.status(502).json({ error: 'failed' });
  }
};
