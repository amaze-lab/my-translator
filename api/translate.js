// api/translate.js
export default async function handler(req, res) {
  // CORS 에러 방지를 위한 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { text } = req.body;
  const apiKey = process.env.GEMINI_API_KEY; // Vercel 대시보드에 등록할 키

  if (!text) {
    return res.status(400).json({ error: '번역할 원문이 없습니다.' });
  }

  try {
    // Gemini 1.5 Flash API 호출 (속도가 빠르고 비용이 효율적입니다)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `너는 웹소설 전문 번역가야. 다음 원문을 문맥과 어조를 살려 자연스러운 한국어로 번역해줘. 대사나 관용구는 자연스럽게 의역하고, 소설 특유의 가독성을 위해 줄바꿈을 잘 유지해줘.\n\n원문:\n${text}`
          }]
        }]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Gemini 호출 실패' });
    }

    const translatedText = data.candidates[0].content.parts[0].text;
    res.status(200).json({ translated: translatedText });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
}
