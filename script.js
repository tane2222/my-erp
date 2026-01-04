// LIFFの初期化（LIFF IDが必要な場合は後で追加）
window.onload = function() {
    liff.init({ liffId: "2008812966-5qG4iaar" })
        .then(() => {
            console.log("LIFF初期化完了");
        });
};

async function sendData() {
    const amount = document.getElementById('amount').value;
    const category = document.getElementById('category').value;
    const method = document.getElementById('method').value;

    if (!amount) return alert("金額を入力してください");

    const btn = document.getElementById('submit-btn');
    btn.innerText = "保存中...";
    btn.disabled = true;

    try {
        await fetch(GAS_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "addExpense",
                apiKey: "your-very-secret-key-123", // GASと同じ合言葉を送る
                date: new Date().toLocaleDateString(),
                amount: amount,
                category: category,
                paymentMethod: method,
                memo: ""
            })
        });
        alert("保存しました！");
        document.getElementById('amount').value = "";
    } catch (e) {
        alert("エラーが発生しました");
    } finally {
        btn.innerText = "保存する";
        btn.disabled = false;
    }
}
