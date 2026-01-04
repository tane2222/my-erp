window.onload = async function() {
    try {
        const configRes = await fetch("/api/config");
        const config = await configRes.json();
        if (!liff.id) await liff.init({ liffId: config.liffId });

        if (!liff.isLoggedIn()) {
            liff.login();
            return;
        }
        
        // 本人確認 (省略可。必要なら以前のコードを追加)
        
        loadMemos(); // 起動時に一覧を読み込む
    } catch (e) { console.error(e); }
};

// メモ保存
async function saveMemo() {
    const content = document.getElementById('memo-input').value;
    if (!content) return alert("内容を入力してください");

    const btn = document.getElementById('save-btn');
    btn.innerText = "SAVING...";
    btn.disabled = true;

    try {
        await fetch("/api/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "addMemo",
                content: content,
                date: new Date().toLocaleDateString()
            })
        });
        document.getElementById('memo-input').value = "";
        loadMemos(); // 一覧を再読み込み
    } catch (e) {
        alert("エラーが発生しました");
    } finally {
        btn.innerText = "SAVE";
        btn.disabled = false;
    }
}

// メモ取得
async function loadMemos() {
    try {
        const response = await fetch("/api/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "getMemos" })
        });
        const result = await response.json();
        const listDiv = document.getElementById('memo-list');
        listDiv.innerHTML = "";

        result.data.forEach(row => {
            listDiv.innerHTML += `
                <div class="glass-card" style="margin-bottom:10px; padding:15px;">
                    <div style="font-size:0.6rem; opacity:0.6; margin-bottom:5px;">${row[2]}</div>
                    <div style="font-size:0.9rem; line-height:1.4;">${row[1].replace(/\n/g, '<br>')}</div>
                </div>
            `;
        });
    } catch (e) { console.error(e); }
}
