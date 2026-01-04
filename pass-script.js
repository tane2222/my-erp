window.onload = async function() {
    try {
        // 1. 環境変数からIDを取得（ここが抜けていると400エラーになりやすい）
        const configRes = await fetch("/api/config");
        const config = await configRes.json();

        // 2. LIFF初期化
        await liff.init({ liffId: config.liffId });

        if (!liff.isLoggedIn()) {
            liff.login();
            return;
        }

        // 3. 本人確認（OWNER_IDチェック）
        const profile = liff.getContext();
        const authRes = await fetch(`/api/config?userId=${profile.userId}`);
        const auth = await authRes.json();

        if (!auth.isOwner) {
            document.body.innerHTML = "<h1>閲覧権限がありません</h1>";
            return;
        }
        console.log("認証成功");
    } catch (e) {
        console.error("LIFF Init Error:", e);
    }
};

// 保存処理：暗号化してから送信
async function savePassword() {
    const masterKey = document.getElementById('master-key').value;
    const pass = document.getElementById('pass').value;
    
    if (!masterKey || !pass) return alert("マスターパスワードと保存するパスワードが必要です");

    // AES方式で暗号化
    const encrypted = CryptoJS.AES.encrypt(pass, masterKey).toString();

    const response = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "addPassword",
            service: document.getElementById('service').value,
            loginId: document.getElementById('loginId').value,
            encryptedPass: encrypted,
            memo: ""
        })
    });

    const result = await response.json();
    if (result.status === "success") {
        alert("暗号化して保存しました");
        document.getElementById('pass').value = "";
    }
}

// 取得処理：取得してから復号（デコード）
async function loadPasswords() {
    const masterKey = document.getElementById('master-key').value;
    if (!masterKey) return alert("復号のためにマスターパスワードを入力してください");

    const response = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getPasswords" })
    });

    const result = await response.json();
    const listDiv = document.getElementById('password-list');
    listDiv.innerHTML = "";

    result.data.forEach(row => {
        let decrypted = "❌ 復号失敗";
        try {
            // 復号処理
            const bytes = CryptoJS.AES.decrypt(row[2], masterKey);
            decrypted = bytes.toString(CryptoJS.enc.Utf8) || "❌ 鍵が違います";
        } catch (e) { console.error(e); }

        listDiv.innerHTML += `
            <div style="border-bottom:1px solid #eee; padding:10px;">
                <strong>${row[0]}</strong><br>
                ID: ${row[1]}<br>
                PASS: <code style="background:#eee">${decrypted}</code>
            </div>
        `;
    });
}
