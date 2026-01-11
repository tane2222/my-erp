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

// パスワード一覧取得（データ取得と表示を分離）
async function loadPasswords() {
    const masterKey = document.getElementById('master-key').value;
    if (!masterKey) return alert("復号のためにマスターパスワードを入力してください");

    const btn = document.querySelector('button[onclick="loadPasswords()"]');
    if(btn) { btn.innerText = "LOADING..."; btn.disabled = true; }

    try {
        const response = await fetch("/api/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "getPasswords" })
        });
        const result = await response.json();
        
        // データを加工して保存（検索しても行番号がずれないようにoriginalIndexを持たせる）
        allPasswordsData = result.data.map((row, index) => ({
            originalIndex: index, // スプレッドシート上の行番号用
            service: row[0],
            id: row[1],
            pass: row[2], // 暗号文 or 平文
            memo: row[3],
            updated: row[4]
        }));

        // 検索ボックスをクリアして全表示
        document.getElementById('pass-search').value = "";
        renderPasswordList(allPasswordsData);

    } catch (e) { 
        console.error(e); 
        alert("読み込みに失敗しました");
    } finally {
        if(btn) { btn.innerText = "FETCH LIST"; btn.disabled = false; }
    }
}

// 検索フィルター機能 (New!)
function filterPasswords() {
    const keyword = document.getElementById('pass-search').value.toLowerCase();
    
    // サービス名 または ID にキーワードが含まれるものを抽出
    const filtered = allPasswordsData.filter(item => {
        const s = String(item.service).toLowerCase();
        const i = String(item.id).toLowerCase();
        return s.includes(keyword) || i.includes(keyword);
    });

    renderPasswordList(filtered);
}

// リスト描画関数 (編集機能付き)
function renderPasswordList(listData) {
    const listDiv = document.getElementById('password-list');
    const masterKey = document.getElementById('master-key').value;
    listDiv.innerHTML = "";

    if (listData.length === 0) {
        listDiv.innerHTML = `<p style="text-align:center; opacity:0.6;">見つかりません</p>`;
        return;
    }

    listData.forEach((item, index) => {
        // IDを一意にする
        const detailId = `pass-detail-${index}`;
        const viewId = `pass-view-${index}`;
        const editId = `pass-edit-${index}`;
        
        const rawPass = String(item.pass);
        let decryptedPass = ""; // 復号後のパスワード（編集フォーム初期値用）
        let displayPassHtml = "";
        
        // 更新日の整形
        let updatedDate = "-";
        if (item.updated) {
            try { updatedDate = new Date(item.updated).toLocaleDateString('ja-JP'); } catch(e) {}
        }

        // 復号処理
        if (rawPass.startsWith('U2FsdGVkX1')) {
            try {
                const bytes = CryptoJS.AES.decrypt(rawPass, masterKey);
                const val = bytes.toString(CryptoJS.enc.Utf8);
                decryptedPass = val ? val : ""; // 編集用に保持
                displayPassHtml = val ? val : "❌ 鍵違い";
            } catch (e) { displayPassHtml = "❌ 復号エラー"; }
        } else {
            decryptedPass = rawPass; // 未暗号化ならそのまま
            displayPassHtml = `<span style="color:#ffcc00;">${rawPass}</span> <span style="font-size:0.7rem;">(未暗号化)</span>`;
        }

        // HTML生成
        listDiv.innerHTML += `
            <div class="pass-item" onclick="togglePassDetail('${detailId}')">
                <div class="pass-header">
                    <div>
                        <strong id="title-${index}" style="font-size:1.1rem; display:block; margin-bottom:4px;">${item.service}</strong>
                        <span style="font-size:0.8rem; opacity:0.8;"><i data-lucide="user" style="width:12px; vertical-align:middle;"></i> ${item.id}</span>
                    </div>
                    <i data-lucide="chevron-down" style="opacity:0.5; width:20px;"></i>
                </div>
                
                <div id="${detailId}" class="pass-detail">
                    <div id="${viewId}">
                        <span class="pass-label">PASSWORD</span>
                        <div class="pass-value">
                            <code style="background:rgba(0,0,0,0.3); padding:6px 10px; border-radius:6px; font-size:1.1rem; user-select:all;">${displayPassHtml}</code>
                        </div>

                        <span class="pass-label">MEMO</span>
                        <div class="pass-value" style="white-space: pre-wrap;">${item.memo || "(なし)"}</div>

                        <div style="display:flex; justify-content:space-between; align-items:end;">
                            <div>
                                <span class="pass-label">UPDATED</span>
                                <div class="pass-value" style="margin-bottom:0;">${updatedDate}</div>
                            </div>
                            <button onclick="event.stopPropagation(); enableEdit('${index}')" 
                                style="width:auto; padding:8px 15px; font-size:0.8rem; background:rgba(255,255,255,0.2);">
                                ✏️ 編集
                            </button>
                        </div>
                    </div>

                    <div id="${editId}" class="hidden" onclick="event.stopPropagation();">
                        <div class="form-group">
                            <label>Service Name</label>
                            <input type="text" id="edit-service-${index}" value="${item.service}">
                        </div>
                        <div class="form-group">
                            <label>ID / Mail</label>
                            <input type="text" id="edit-id-${index}" value="${item.id}">
                        </div>
                        <div class="form-group">
                            <label>Password (変更する場合のみ入力)</label>
                            <input type="text" id="edit-pass-${index}" value="${decryptedPass}" placeholder="パスワード">
                        </div>
                        <div class="form-group">
                            <label>Memo</label>
                            <textarea id="edit-memo-${index}" rows="2" 
                                style="width:100%; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.3); border-radius:12px; color:white; padding:10px;">${item.memo}</textarea>
                        </div>
                        <div style="display:flex; gap:10px;">
                            <button onclick="cancelEdit('${index}');" style="background:rgba(255,255,255,0.1);">キャンセル</button>
                            <button onclick="updatePasswordEntry('${index}', ${item.originalIndex})" style="background:rgba(0,255,100,0.3); border-color:#0f0;">保存</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    if(window.lucide) lucide.createIcons();
}

// アコーディオン開閉
function togglePassDetail(id) {
    const el = document.getElementById(id);
    // 編集モード中に閉じようとした場合は何もしない（誤操作防止）
    if(el.querySelector('.hidden') === null) return; 
    
    document.querySelectorAll('.pass-detail.open').forEach(opened => {
        if(opened.id !== id) opened.classList.remove('open');
    });
    el.classList.toggle('open');
}

// 編集モード開始
function enableEdit(index) {
    document.getElementById(`pass-view-${index}`).classList.add('hidden');
    document.getElementById(`pass-edit-${index}`).classList.remove('hidden');
}

// 編集キャンセル
function cancelEdit(index) {
    document.getElementById(`pass-edit-${index}`).classList.add('hidden');
    document.getElementById(`pass-view-${index}`).classList.remove('hidden');
}

// 編集保存処理 (New!)
async function updatePasswordEntry(localIndex, originalRowIndex) {
    const masterKey = document.getElementById('master-key').value;
    if (!masterKey) return alert("マスターパスワードが必要です");

    const newService = document.getElementById(`edit-service-${localIndex}`).value;
    const newId = document.getElementById(`edit-id-${localIndex}`).value;
    const newPassPlain = document.getElementById(`edit-pass-${localIndex}`).value;
    const newMemo = document.getElementById(`edit-memo-${localIndex}`).value;

    if(!newService || !newPassPlain) return alert("サービス名とパスワードは必須です");

    // 保存時は必ず暗号化する
    const encrypted = CryptoJS.AES.encrypt(newPassPlain, masterKey).toString();

    // UIを保存中表示に
    const btn = event.target;
    const originalText = btn.innerText;
    btn.innerText = "保存中...";
    btn.disabled = true;

    try {
        const response = await fetch("/api/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "editPassword",
                row: originalRowIndex,
                service: newService,
                loginId: newId,
                encryptedPass: encrypted,
                memo: newMemo
            })
        });
        
        const result = await response.json();
        if (result.status === "success") {
            alert("更新しました！");
            loadPasswords(); // 一覧を再読み込みして反映
        } else {
            alert("エラー: " + result.message);
            btn.innerText = originalText;
            btn.disabled = false;
        }
    } catch (e) {
        alert("通信エラー");
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// 暗号化更新処理 (前回のまま)
async function encryptLegacyPassword(rowIndex, plainPass) {
    // ... (前回のencryptLegacyPasswordの中身と同じです) ...
    const masterKey = document.getElementById('master-key').value;
    if (!masterKey) return alert("マスターパスワードが必要です");
    if (!confirm(`「${plainPass}」を現在のマスターキーで暗号化して上書きしますか？`)) return;

    const encrypted = CryptoJS.AES.encrypt(plainPass, masterKey).toString();
    const btns = document.querySelectorAll('button');
    btns.forEach(b => b.disabled = true);

    try {
        const response = await fetch("/api/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "updatePassword",
                row: rowIndex, 
                encryptedPass: encrypted
            })
        });
        
        const result = await response.json();
        if (result.status === "success") {
            alert("暗号化して更新しました！");
            loadPasswords(); // 再読み込み
        } else {
            alert("更新エラー: " + result.message);
        }
    } catch (e) {
        alert("通信エラーが発生しました");
    } finally {
        btns.forEach(b => b.disabled = false);
    }
}
