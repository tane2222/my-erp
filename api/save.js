export default async function handler(req, res) {
  const GAS_URL = process.env.GAS_URL;
  const API_KEY = process.env.GAS_API_KEY;

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // すでに解析済み（オブジェクト）として受け取る。解析不要。
    const body = req.body;
    
    // 合言葉を追加
    body.apiKey = API_KEY;

    // GASへ送信
    const response = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    // GASからの応答がJSONでない（エラー画面など）場合を考慮
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      const data = await response.json();
      res.status(200).json(data);
    } else {
      const text = await response.text();
      throw new Error("GASがJSON以外の応答を返しました: " + text.substring(0, 100));
    }

  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ status: 'error', message: error.message });
  }
}
