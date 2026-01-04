export default async function handler(req, res) {
  const { userId } = req.query; // ブラウザから送られてきたID

  res.status(200).json({
    liffId: process.env.LIFF_ID,
    // 送られてきたIDが、環境変数のOWNER_IDと一致するか判定した結果だけを返す
    isOwner: userId === process.env.OWNER_ID
  });
}
