export default async function handler(req, res) {
  // Vercelに設定した環境変数を読み込む（ブラウザからは見えません）
  const GAS_URL = process.env.GAS_URL;
  const API_KEY = process.env.GAS_API_KEY;

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // フロントから届いたデータに、秘密のAPIキーを合体させる
    const body = JSON.parse(req.body);
    body.apiKey = API_KEY;

    // VercelのサーバーからGASへデータを投げる
    const response = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    // GASからの返答をそのままフロントに返す
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
}
