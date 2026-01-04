// メモしたGASのURLをここに貼り付けてください
const GAS_URL = "https://script.google.com/macros/library/d/15fE4FW9mDMUVq3SKhECJ0nbA19ohkywo4AF1_8_hkvVxZdgPxEhWwRas/3";

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
