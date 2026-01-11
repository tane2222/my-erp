/* =========================================
   共通: ページ切り替えと初期化
   ========================================= */
let currentLiffId = "";

window.onload = async function() {
    try {
        // 1. 設定取得
        const configRes = await fetch("/api/config");
        const config = await configRes.json();
        currentLiffId = config.liffId;

        // 2. LIFF初期化
        if (!liff.id) {
            await liff.init({ liffId: currentLiffId });
        }
        if (!liff.isLoggedIn()) {
            liff.login({ redirectUri: window.location.href });
            return;
        }

        // 3. 本人確認
        const profile = liff.getContext();
        const authRes = await fetch(`/api/config?userId=${profile.userId}`);
        const auth = await authRes.json();
        if (!auth.isOwner) {
            document.body.innerHTML = "<h1>閲覧権限がありません</h1>";
            return;
        }

        // 4. 初期表示 (ホーム画面・LIFEモード)
        switchMode('life');
        showPage('home'); 
        lucide.createIcons(); // アイコン描画

        // 起動時にメモ一覧も裏で読み込んでおく
        loadMemos(); 

    } catch (e) {
        console.error("Init Error", e);
    }
};

// 画面切り替え（SPAの核となる関数）
function showPage(pageId) {
    // 全ページを非表示
    document.querySelectorAll('.page-section').forEach(el => el.classList.add('hidden'));
    
    // 指定ページを表示
    document.getElementById(`page-${pageId}`).classList.remove('hidden');

    // ドックの選択状態を更新
    document.querySelectorAll('.dock-item').forEach(el => el.classList.remove('active'));
    
    // Home以外のページIDは "spending" などを想定しているが、ドックにあるのは home, memo, passwords
    const dockId = `dock-${pageId}`;
    const dockBtn = document.getElementById(dockId);
    if (dockBtn) {
        dockBtn.classList.add('active');
    } else {
        // spendingなどドックにないページの場合はHomeをアクティブにしておく等の処理
        document.getElementById('dock-home').classList.remove('active');
    }

    // アイコン再描画
    lucide.createIcons();
}

/* =========================================
   ホーム画面: モード切替
   ========================================= */
const menus = {
    life: [
        { icon: 'wallet', name: '家計簿', action: "showPage('spending')" },
        { icon: 'key-round', name: 'パスワード', action: "showPage('passwords')" },
        { icon: 'lightbulb', name: 'アイデア' },
        { icon: 'calendar', name: '予定' },
        { icon: 'shopping-cart', name: '買い物' },
        { icon: 'music', name: '音楽' },
        { icon: 'camera', name: '写真' },
        { icon: 'heart', name: '健康' }
    ],
    work: [
        { icon: 'briefcase', name: '仕事' },
        { icon: 'trending-up', name: '転職' },
        { icon: 'layers', name: '案件管理' },
        { icon: 'mail', name: 'メール' },
        { icon: 'file-text', name: '経費精算' },
        { icon: 'users', name: '連絡先' },
        { icon: 'clock', name: '勤怠' },
        { icon: 'terminal', name: '開発' }
    ],
    other: [
        { icon: 'smile', name: 'その他' },
        { icon: 'dumbbell', name: '筋トレ' },
        { icon: 'plane', name: '旅行' },
        { icon: 'gamepad-2', name: '趣味' },
        { icon: 'book-open', name: '読書' },
        { icon: 'coffee', name: 'カフェ' },
        { icon: 'car', name: 'ドライブ' },
        { icon: 'gift', name: 'ほしい物' }
    ]
};

function switchMode(mode) {
    document.body.className = `mode-${mode}`;
    const grid = document.getElementById('menu-grid');
    grid.innerHTML = '';
    
    menus[mode].forEach(item => {
        const div = document.createElement('div');
        div.className = 'app-item';
        // リンク遷移ではなく、JS関数の実行または何もしない
        if (item.action) {
            div.setAttribute('onclick', item.action);
        }
        div.innerHTML = `
            <div class="icon-box"><i data-lucide="${item.icon}"></i></div>
            <span>${item.name}</span>
        `;
        grid.appendChild(div);
    });
    lucide.createIcons();
}

/* =========================================
   機能1: 家計簿 (Spending)
   ========================================= */
async function sendSpendingData() {
    const amount = document.getElementById('amount').value;
    const category = document.getElementById('category').value;
    const method = document.getElementById('method').value;

    if (!amount) return alert("金額を入力してください");

    const btn = document.getElementById('submit-btn');
    btn.innerText = "SAVING...";
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
            alert("記録しました！");
            document.getElementById('amount').value = "";
            showPage('home'); // 保存完了したらホームに戻る
        }
    } catch (e) {
        alert("エラー: " + e.message);
    } finally {
        btn.innerText = "SAVE";
        btn.disabled = false;
    }
}

/* =========================================
   機能2: メモ (Memo)
   ========================================= */
async function saveMemo() {
    const content = document.getElementById('memo-input').value;
    if (!content) return alert("内容を入力してください");

    const btn = document.getElementById('memo-save-btn');
    btn.innerText = "SAVING...";
    btn.disabled = true;

    try {
        await fetch("/api/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "addMemo",
                content: content,
                date: new Date().toLocaleDateString() // 表示用日付
            })
        });
        document.getElementById('memo-input').value = "";
        loadMemos();
    } catch (e) {
        alert("エラーが発生しました");
    } finally {
        btn.innerText = "SAVE";
        btn.disabled = false;
    }
}

// メモ一覧取得（削除ボタン付きに更新）
// メモ一覧取得（時間をタイムスタンプから生成するように修正）
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

        if(result.data && result.data.length > 0) {
            result.data.forEach(row => {
                // row[0] はタイムスタンプ
                const rawDate = row[0]; 
                
                // タイムスタンプを「2026/01/11 15:30」のような形式に変換
                const dateObj = new Date(rawDate);
                const dateStr = dateObj.toLocaleString('ja-JP', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                listDiv.innerHTML += `
                    <div class="glass-card" style="margin-bottom:10px; padding:15px; position: relative;">
                        <div style="font-size:0.6rem; opacity:0.6; margin-bottom:5px; display:flex; justify-content:space-between;">
                            <span>${dateStr}</span>
                            <button onclick="deleteMemo('${rawDate}')" class="delete-btn">
                                <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
                            </button>
                        </div>
                        <div style="font-size:0.9rem; line-height:1.4; padding-right:20px;">
                            ${row[1].replace(/\n/g, '<br>')}
                        </div>
                    </div>
                `;
            });
            lucide.createIcons();
        } else {
            listDiv.innerHTML = `<p style="text-align:center; opacity:0.5; font-size:0.8rem;">メモはありません</p>`;
        }
    } catch (e) { console.error(e); }
}

// 削除機能 (New!)
async function deleteMemo(timestamp) {
    if (!confirm("このメモを削除しますか？")) return;

    try {
        // UI上で仮削除（反応を良く見せるため）
        const tempBtn = event.target.closest('button');
        if(tempBtn) tempBtn.innerText = "...";

        await fetch("/api/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "deleteMemo",
                timestamp: timestamp
            })
        });
        
        loadMemos(); // 一覧再読み込み
    } catch (e) {
        alert("削除に失敗しました: " + e.message);
    }
}

/* =========================================
   機能3: パスワード (Passwords)
   ========================================= */
async function savePassword() {
    const masterKey = document.getElementById('master-key').value;
    const pass = document.getElementById('pass').value;
    
    if (!masterKey || !pass) return alert("マスターパスワードとパスワードを入力してください");

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
        loadPasswords();
    }
}

async function loadPasswords() {
    const masterKey = document.getElementById('master-key').value;
    if (!masterKey) return alert("復号のためにマスターパスワードを入力してください");

    try {
        const response = await fetch("/api/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "getPasswords" })
        });
        const result = await response.json();
        const listDiv = document.getElementById('password-list');
        listDiv.innerHTML = "";

        // 行インデックス(index)を使って更新対象を特定する
        result.data.forEach((row, index) => {
            const rawPass = String(row[2]); // スプレッドシートの生のパスワード
            let displayPass = "";
            let actionHtml = "";

            // 暗号化されているかチェック (CryptoJSの暗号文は "U2FsdGVkX1" で始まる)
            if (rawPass.startsWith('U2FsdGVkX1')) {
                // ■ 暗号化済みの場合 -> 復号して表示
                try {
                    const bytes = CryptoJS.AES.decrypt(rawPass, masterKey);
                    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
                    displayPass = decrypted ? decrypted : "❌ 鍵違い";
                } catch (e) { 
                    displayPass = "❌ 復号エラー"; 
                }
            } else {
                // ■ 未暗号化（平文）の場合 -> そのまま表示 ＋ 暗号化ボタン
                displayPass = `<span style="color:#ffcc00;">⚠️ ${rawPass} (未暗号化)</span>`;
                actionHtml = `
                    <button onclick="encryptLegacyPassword(${index}, '${rawPass}')" 
                        style="margin-top:5px; padding:5px 10px; font-size:0.8rem; background:rgba(255,200,0,0.3); border:1px solid #ffcc00;">
                        🔒 暗号化する
                    </button>`;
            }

            listDiv.innerHTML += `
                <div style="border-bottom:1px solid rgba(255,255,255,0.2); padding:10px;">
                    <strong>${row[0]}</strong><br>
                    <span style="font-size:0.8rem; opacity:0.8;">ID: ${row[1]}</span><br>
                    PASS: <code style="background:rgba(0,0,0,0.2); padding:2px 5px; border-radius:4px;">${displayPass}</code>
                    ${actionHtml}
                </div>
            `;
        });
    } catch (e) { console.error(e); }
}

// 既存の平文パスワードを暗号化して更新する関数 (New!)
async function encryptLegacyPassword(rowIndex, plainPass) {
    const masterKey = document.getElementById('master-key').value;
    if (!masterKey) return alert("マスターパスワードが必要です");
    if (!confirm(`「${plainPass}」を現在のマスターキーで暗号化して上書きしますか？`)) return;

    // 暗号化
    const encrypted = CryptoJS.AES.encrypt(plainPass, masterKey).toString();

    // 更新処理中の表示
    const btns = document.querySelectorAll('button');
    btns.forEach(b => b.disabled = true);

    try {
        const response = await fetch("/api/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "updatePassword",
                row: rowIndex, // 何行目を更新するか
                encryptedPass: encrypted
            })
        });
        
        const result = await response.json();
        if (result.status === "success") {
            alert("暗号化して更新しました！");
            loadPasswords(); // リスト再読み込み
        } else {
            alert("更新エラー: " + result.message);
        }
    } catch (e) {
        alert("通信エラーが発生しました");
    } finally {
        btns.forEach(b => b.disabled = false);
    }
}
