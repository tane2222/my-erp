let currentLiffId = "";

window.onload = async function() {
    try {
        const configRes = await fetch("/api/config");
        const config = await configRes.json();
        currentLiffId = config.liffId;

        // 400エラー対策：二重初期化を防ぎつつ確実に初期化
        if (!liff.id) {
            await liff.init({ liffId: currentLiffId });
        }

        if (!liff.isLoggedIn()) {
            liff.login({ redirectUri: window.location.href });
            return;
        }

        const profile = liff.getContext();
        const authRes = await fetch(`/api/config?userId=${profile.userId}`);
        const auth = await authRes.json();

        if (!auth.isOwner) {
            document.body.innerHTML = "<h1>閲覧権限がありません</h1>";
            return;
        }
    } catch (e) {
        console.error("Init Error", e);
    }
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
        const response = await fetch("/api/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "addExpense",
                date: new Date().toLocaleDateString(),
                amount: amount,
                category: category,
                paymentMethod: method,
                memo: ""
            })
        });

        const result = await response.json();
        if (result.status === "success") {
            alert("保存しました！");
            document.getElementById('amount').value = "";
        } else {
            throw new Error(result.message);
        }
    } catch (e) {
        console.error(e);
        alert("エラーが発生しました: " + e.message);
    } finally {
        btn.innerText = "保存する";
        btn.disabled = false;
    }
}


