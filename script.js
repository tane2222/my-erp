window.onload = async function() {
    try {
        // 1. まずはliffIdを取得するためにAPIを叩く
        const configRes = await fetch("/api/config");
        const config = await configRes.json();

        // 2. LIFFの初期化
        await liff.init({ liffId: config.liffId });

        if (!liff.isLoggedIn()) {
            liff.login();
            return;
        }

        // 3. ログインできたら、自分のIDが本人かAPIに確認する
        const profile = liff.getContext();
        const authRes = await fetch(`/api/config?userId=${profile.userId}`);
        const auth = await authRes.json();

        if (!auth.isOwner) {
            document.body.innerHTML = "<h1>閲覧権限がありません</h1>";
            return;
        }

        console.log("認証成功：個人ERPへようこそ");
    } catch (e) {
        console.error("起動エラー:", e);
        document.body.innerHTML = "<h1>システム起動エラー</h1>";
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


