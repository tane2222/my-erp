// あなたのLINEユーザーID（LINE Developersの「自分の利用者の識別子」などで確認できます）
const OWNER_ID = "U7c1dce9de17d79f1bab98b9ad1604722"; 

window.onload = function() {
    liff.init({ liffId: "2008812966-5qG4iaar" })
        .then(() => {
            if (!liff.isLoggedIn()) {
                liff.login(); // ログインしていなければ強制ログイン
                return;
            }
            const profile = liff.getContext();
            // 自分のIDと一致しない場合は、アプリを停止させる
            if (profile.userId !== OWNER_ID) {
                document.body.innerHTML = "<h1>閲覧権限がありません</h1>";
                return;
            }
            console.log("認証成功");
        });
};

// 【重要】GAS_URLやapiKeyの記述はすべて削除します！

async function sendData() {
    const amount = document.getElementById('amount').value;
    const category = document.getElementById('category').value;
    const method = document.getElementById('method').value;

    if (!amount) return alert("金額を入力してください");

    const btn = document.getElementById('submit-btn');
    btn.innerText = "保存中...";
    btn.disabled = true;

    try {
        // GAS_URLではなく、自分のサイト内の "/api/save" を叩く
        const response = await fetch("/api/save", {
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


