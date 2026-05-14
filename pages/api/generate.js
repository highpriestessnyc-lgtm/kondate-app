export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { ingredients } = req.body;
  if (!ingredients) return res.status(400).json({ error: 'ingredients required' });

  const SEASONINGS = '醤油、味噌、みりん、料理酒、砂糖、塩、こしょう、酢、サラダ油、ごま油、オリーブオイル、バター、にんにく、しょうが、マヨネーズ、ケチャップ、ポン酢、オイスターソース、めんつゆ、和風だし、コンソメ、鶏がらスープの素、一味唐辛子、ごま、片栗粉、小麦粉、ウスターソース、バルサミコ酢、ディジョンマスタード、ハーブ各種、レモン汁';

  const prompt = `プロのシェフとして、以下の食材で今日の朝昼夜の献立と、フランス料理を含むソース3種を提案してください。

食材: ${ingredients}
常備調味料: ${SEASONINGS}

必ず以下のJSON形式だけで答えてください。前後に文章やバッククォートは一切不要です:

{"meals":[{"type":"朝食","name":"料理名","desc":"説明","ingredients":["食材"],"steps":["手順1","手順2","手順3"]},{"type":"昼食","name":"料理名","desc":"説明","ingredients":[],"steps":[]},{"type":"夕食","name":"料理名","desc":"説明","ingredients":[],"steps":[]}],"sauces":[{"name":"ソース名","category":"フランス風","desc":"説明","ingredients":[],"steps":[]},{"name":"ソース名","category":"和風","desc":"説明","ingredients":[],"steps":[]},{"name":"ソース名","category":"イタリアン","desc":"説明","ingredients":[],"steps":[]}],"tip":"一言アドバイス"}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    const aiText = (data.content || []).map(b => b.text || '').join('').trim();
    let parsed;
    const attempts = [
      () => JSON.parse(aiText),
      () => JSON.parse(aiText.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '')),
      () => { const s = aiText.indexOf('{'), e = aiText.lastIndexOf('}'); return JSON.parse(aiText.slice(s, e + 1)); },
    ];
    for (const fn of attempts) { try { parsed = fn(); break; } catch (e) {} }
    if (!parsed) return res.status(500).json({ error: 'JSONパース失敗', raw: aiText.slice(0, 300) });

    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
