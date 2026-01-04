// ★★★ GASのWebアプリURLとLIFF IDをここに設定 ★★★★
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbwyKAZqLjwcc_Z_8ZLinHOhaGFcUPd9n_Asjf52oYbVpX3Kj3XYTT5cTiyO3luxiHGL3Q/exec";
const LIFF_ID = "2008378264-4O97qRYQ";

let currentUser = null; // グローバル変数として定義

// ▼▼▼ ステップ定義（順番管理用） ▼▼▼
const REGISTRATION_STEPS = [
    'gender-selection-page',   // Step 1
    'name-input-page',         // Step 2
    'nickname-input-page',     // Step 3
    'employee-id-input-page',  // Step 4
    'age-input-page',          // Step 5
    'department-input-page'    // Step 6
];

// ▼▼▼ 戻るボタンの処理関数 (新規追加) ▼▼▼
function goBackStep() {
    // 現在表示されているページIDを探す
    const currentPageId = REGISTRATION_STEPS.find(id => {
        const el = document.getElementById(id);
        return el && el.style.display === 'block';
    });

    if (!currentPageId) return;

    // 現在のインデックスを取得
    const currentIndex = REGISTRATION_STEPS.indexOf(currentPageId);

    // 最初のページ(0)でなければ、一つ前のページに戻る
    if (currentIndex > 0) {
        const prevPageId = REGISTRATION_STEPS[currentIndex - 1];
        showPage(prevPageId);
    }
}

// ▼▼▼ グローバルヘルパー関数 (どこからでも呼べるように外に出しました) ▼▼▼

// ページ切り替え関数
function showPage(pageId) {
    // ページ要素を都度取得して切り替え
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.style.display = (page.id === pageId) ? 'block' : 'none';
    });
    // スクロールを一番上に戻す
    window.scrollTo(0, 0);

    // ★★★ プログレスバーとロゴの表示制御 ★★★
    updateRegistrationHeader(pageId);
}

// ▼▼▼ 画像プリロードとアニメーション制御関数（修正版） ▼▼▼
function startMatchSequence(myImgUrl, partnerImgUrl, partnerName) {
    // 1. 画面要素の初期化
    showPage('match-success-page');
    document.getElementById('match-success-page').style.display = 'flex'; // 中央寄せ維持
    
    // 要素取得
    const loader = document.getElementById('heartbeat-loader');
    const animationArea = document.querySelector('.match-animation-area');
    const myImgElement = document.getElementById('match-my-img');
    const partnerImgElement = document.getElementById('match-partner-img');
    const partnerNameElem = document.getElementById('match-partner-name');

    // リセット
    animationArea.classList.remove('animate');
    loader.style.display = 'block'; // 心電図表示
    
    // 親要素(match-user)を透明にする（画像読み込みまで隠す）
    if(myImgElement.parentElement) myImgElement.parentElement.style.opacity = '0';
    if(partnerImgElement.parentElement) partnerImgElement.parentElement.style.opacity = '0';

    // 名前セット
    partnerNameElem.innerText = partnerName;

    // 2. 画像の先読み込み処理
    const loadImg = (url) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = url;
            img.onload = () => resolve(url);
            img.onerror = () => resolve('https://placehold.jp/150x150.png'); // エラー時はダミー
        });
    };

    // 2枚とも読み込み終わるのを待つ
    Promise.all([loadImg(myImgUrl), loadImg(partnerImgUrl)]).then((urls) => {
        // 画像セット（DOM要素のsrcに反映）
        myImgElement.src = urls[0];
        partnerImgElement.src = urls[1];

        // 少しだけ「溜め」を作る（心電図を見せるため）
        setTimeout(() => {
            // 3. アニメーション開始
            loader.style.display = 'none'; // 心電図消す

            // ★★★ 修正箇所：インラインスタイルの opacity: 0 を解除して見えるようにする ★★★
            // これがないと、CSSクラスをつけても opacity:0 のままになってしまいます
            if(myImgElement.parentElement) myImgElement.parentElement.style.opacity = '1';
            if(partnerImgElement.parentElement) partnerImgElement.parentElement.style.opacity = '1';
            
            // CSSの transition が効くように少しタイムラグを入れる
            requestAnimationFrame(() => {
                animationArea.classList.add('animate');
            });

        }, 1500); // 1.5秒間は心電図を見せる
    });
}

// ▼▼▼ サイドメニュー開閉ロジック (新規追加) ▼▼▼
function toggleSideMenu() {
    const menu = document.getElementById('side-menu');
    const overlay = document.getElementById('menu-overlay');
    
    // クラスの付け外しで表示/非表示を切り替え
    menu.classList.toggle('is-active');
    overlay.classList.toggle('is-active');
}
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

// ▼▼▼ 新規追加: ヘッダー更新ロジック ▼▼▼
function updateRegistrationHeader(pageId) {
    const header = document.getElementById('registration-header');
    const stepNumElem = document.getElementById('current-step-num');
    const barFillElem = document.getElementById('progress-bar-fill');
    const backBtn = document.getElementById('reg-back-btn'); // ボタン要素取得
    
    // ステップごとの設定
    const steps = {
        'gender-selection-page':  { num: 1, percent: 16 },
        'name-input-page':        { num: 2, percent: 33 },
        'nickname-input-page':    { num: 3, percent: 50 },
        'employee-id-input-page': { num: 4, percent: 66 },
        'age-input-page':         { num: 5, percent: 83 },
        'department-input-page':  { num: 6, percent: 100 }
    };

    if (steps[pageId]) {
        // --- 登録画面の場合 ---
        header.style.display = 'block';
        stepNumElem.innerText = steps[pageId].num;
        barFillElem.style.width = steps[pageId].percent + '%';

        // ★★★ 戻るボタンの表示制御 ★★★
        if (steps[pageId].num === 1) {
            // Step 1 (性別選択) では戻るボタンを隠す
            backBtn.style.display = 'none';
        } else {
            // Step 2以降は表示する
            backBtn.style.display = 'block';
        }

    } else {
        // --- それ以外の画面の場合 ---
        header.style.display = 'none';
    }
}
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

// ▼▼▼ キュン詳細モーダル制御 (新規追加) ▼▼▼
function openKyunDetailModal() {
    const modal = document.getElementById('kyun-detail-modal');
    
    // 現在表示されているポイント数を取得してモーダルに反映（見た目の同期）
    const currentPointsElem = document.getElementById('kyun-points');
    const modalTotalElem = document.getElementById('modal-kyun-total');
    
    // 要素が存在する場合のみ値をコピー
    if (currentPointsElem && modalTotalElem) {
        modalTotalElem.innerText = currentPointsElem.innerText;
    }

    // クラスを付与して表示
    modal.classList.add('is-open');
}

function closeKyunDetailModal() {
    const modal = document.getElementById('kyun-detail-modal');
    modal.classList.remove('is-open');
}

// モーダルの背景（黒い部分）をタップしても閉じるようにする
window.addEventListener('click', function(e) {
    const modal = document.getElementById('kyun-detail-modal');
    if (e.target === modal) {
        closeKyunDetailModal();
    }
});
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

// ... (既存のコード) ...

// ▼▼▼ 診断チャートモーダル制御（自分・他人 兼用版） ▼▼▼
let myRadarChart = null; 

// ★新規追加: スワイプ画面のボタンから呼ばれる関数
function openOtherUserDiagnosis(index) {
    // 保存しておいたユーザーリストからデータを取得
    const targetUser = loadedSwipeUsers[index];
    if (!targetUser) return;

    // データを使ってモーダルを開く（第2引数にユーザー情報を渡す）
    openDiagnosisModal(targetUser);
}

// 既存の関数を修正: user 引数を受け取れるように変更
// 引数がない場合は、自分のデータ(currentUser)を使用
function openDiagnosisModal(targetUser = null) {
    const modal = document.getElementById('diagnosis-modal');
    modal.classList.add('is-open');

    // 表示対象のデータを決定（引数がなければ自分）
    const isMe = !targetUser;
    const userData = targetUser || currentUser;
    
    // タイトルの変更（誰のデータかわかるように）
    const headerTitle = modal.querySelector('.modal-header h3');
    if (headerTitle) {
        headerTitle.innerText = isMe ? '診断ステータス' : `${userData.nickname || '相手'}の診断`;
    }

    const ctx = document.getElementById('radarChart').getContext('2d');

    if (myRadarChart) {
        myRadarChart.destroy();
    }

    const labels = ['素直さ', '想像力', '論理思考', '独占欲', '競争心', '愛情'];
    let dataValues = [0, 0, 0, 0, 0, 0]; 

    if (userData) {
        // ※注意: GASの `getUsersForLiff` が診断スコアを返していない場合、
        // スワイプ画面のユーザーデータには honest 等が含まれていません。
        // その場合は、デモ用にランダムな値を生成して表示します。
        
        if (userData.honest !== undefined) {
            // データが存在する場合（自分のデータなど）
            dataValues = [
                Number(userData.honest) || 0,
                Number(userData.imagin) || 0,
                Number(userData.logic) || 0,
                Number(userData.possessive) || 0,
                Number(userData.battle) || 0,
                Number(userData.love) || 0
            ];
        } else {
            // データがない場合（他人のデータでAPI未実装の場合）→ デモ表示
            // ★本番環境ではAPI修正後にここを削除してください
            dataValues = [
                Math.floor(Math.random() * 60) + 40,
                Math.floor(Math.random() * 60) + 40,
                Math.floor(Math.random() * 60) + 40,
                Math.floor(Math.random() * 60) + 40,
                Math.floor(Math.random() * 60) + 40,
                Math.floor(Math.random() * 60) + 40
            ];
        }
    }

    // チャート作成
    myRadarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'ステータス',
                data: dataValues,
                // 他人の場合は色を少し変える（青っぽく）か、同じにするか。今回は同じにします。
                backgroundColor: 'rgba(246, 23, 140, 0.2)',
                borderColor: 'rgba(246, 23, 140, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(246, 23, 140, 1)',
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    min: 0,
                    max: 100,
                    ticks: { stepSize: 20, display: false },
                    pointLabels: {
                        font: { size: 12, family: "'Helvetica Neue', 'Arial', sans-serif" },
                        color: '#666'
                    },
                    grid: { color: '#eee' },
                    angleLines: { color: '#eee' }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function closeDiagnosisModal() {
    const modal = document.getElementById('diagnosis-modal');
    modal.classList.remove('is-open');
}

// モーダル背景クリックで閉じる
window.addEventListener('click', function(e) {
    const modal = document.getElementById('diagnosis-modal');
    if (e.target === modal) {
        closeDiagnosisModal();
    }
});
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

// 裏側でデータを送信する共通関数 (Fire-and-forget)
function sendDataBackground(action, payload) {
    if (!liff.isLoggedIn()) {
        console.error("LIFF is not logged in");
        return;
    }
    const liffUserId = liff.getContext().userId;
    
    const bodyData = {
        source: 'liff_app',
        action: action,
        liffUserId: liffUserId,
        ...payload
    };

    // 完了を待たずに送信 (catchだけしておく)
    fetch(GAS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(bodyData)
    }).then(response => {
        console.log(`${action} sent successfully`);
    }).catch(error => {
        console.error(`${action} failed`, error);
    });
}

// ▼▼▼ 各ステップのアクション関数 (HTMLのonclickから呼ばれるもの) ▼▼▼

// Step 1: 性別選択 (即時遷移)
function selectGender(gender) {
    if (!confirm(`「${gender}」で間違いないですか？`)) { return; }
    
    showPage('name-input-page'); // 次へ
    sendDataBackground('registerUserGender', { gender: gender }); // 送信
}

// Step 2: 本名入力 (即時遷移)
function submitName() {
    const nameInput = document.getElementById("user-name-input");
    const name = nameInput.value.trim();

    if (!name) { alert("お名前を入力してください。"); return; }

    showPage('nickname-input-page'); // 次へ
    sendDataBackground('registerUserName', { name: name }); // 送信
}

// Step 3: ニックネーム入力 (即時遷移)
function submitNickname() {
    const input = document.getElementById("user-nickname-input");
    const nickname = input.value.trim();

    if (!nickname) { alert("ニックネームを入力してください。"); return; }

    showPage('employee-id-input-page'); // 次へ
    sendDataBackground('registerUserNickname', { nickname: nickname }); // 送信
}

// Step 4: 従業員番号入力 (即時遷移)
function submitEmployeeId() {
    const input = document.getElementById("user-employee-id-input");
    const employeeId = input.value.trim();

    if (!employeeId) { alert("従業員番号を入力してください。"); return; }
    if (!/^[a-zA-Z0-9]+$/.test(employeeId)) { alert("従業員番号は半角英数字のみで入力してください。"); return; }

    showPage('age-input-page'); // 次へ
    sendDataBackground('registerUserEmployeeId', { employeeId: employeeId }); // 送信
}

// Step 5: 年齢入力 (即時遷移)
function submitAge() {
    const input = document.getElementById("user-age-input");
    const age = input.value.trim();

    if (!age) { alert("年齢を入力してください。"); return; }
    if (!/^[0-9]{1,3}$/.test(age)) { alert("年齢は半角数字で入力してください。"); return; }

    showPage('department-input-page'); // 次へ
    sendDataBackground('registerUserAge', { age: age }); // 送信
}

// Step 6: 所属選択 (ここだけは完了を待つ)
async function submitDepartment(selectedDept) {
    if (!selectedDept) { alert("所属領域を選択してください。"); return; }
    
    if (!confirm(`「${selectedDept}」で登録しますか？`)) { return; }

    // ローディング表示
    document.getElementById("loader-wrapper").classList.remove('is-hidden');
    
    const liffUserId = liff.getContext().userId;
    
    try {
        const response = await fetch(GAS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ 
                source: 'liff_app', 
                action: 'registerUserDepartment', 
                liffUserId: liffUserId, 
                department: selectedDept 
            })
        });
        const result = await response.json();
        
        if (result.success) {
            // リロードせず、案内ページを表示
            document.getElementById("loader-wrapper").classList.add('is-hidden');
            showPage('onboarding-page');
            // 案内ページ用のSwiperを初期化
            initOnboardingSwiper();
        } else {
            alert("エラー: " + result.message);
            document.getElementById("loader-wrapper").classList.add('is-hidden');
        }
    } catch (e) {
        alert("通信エラー: " + e.message);
        document.getElementById("loader-wrapper").classList.add('is-hidden');
    }
}

// --- アカウント連携の処理 (グローバルに配置) ---
async function syncAccount() {
    const syncButton = document.getElementById("sync-button");
    const errorMessage = document.getElementById("error-message");
    
    syncButton.innerText = "連携処理中...";
    syncButton.disabled = true;
    
    try {
        const liffUserId = liff.getContext().userId;
        const nonce = Math.random().toString(36).substring(2);

        const result = await (await fetch(GAS_API_URL, { 
            method: 'POST', 
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }, 
            body: JSON.stringify({ 
                source: 'liff_app', 
                action: 'storeLiffIdWithNonce', 
                liffUserId: liffUserId, 
                nonce: nonce 
            }) 
        })).json();

        if (result.success) {
            await liff.sendMessages([{ type: 'text', text: `/sync ${nonce}` }]);
            errorMessage.innerText = "連携メッセージを送信しました。ボットが「連携完了」と返信したら、アプリを再読み込みします。";
            errorMessage.style.color = "#28a745"; 
            syncButton.style.display = 'none'; 

            setTimeout(() => { location.reload(); }, 4000);
        } else {
            errorMessage.innerText = '連携処理に失敗しました: ' + result.message;
            syncButton.innerText = "アカウントを連携する";
            syncButton.disabled = false;
        }
    } catch (error) {
        errorMessage.innerText = 'エラー: ' + error.message;
        syncButton.innerText = "アカウントを連携する";
        syncButton.disabled = false;
    }
}

// ▼▼▼ 【新規追加】案内ページ用 Swiper のロジック ▼▼▼
let onboardingSwiperInstance = null;

function initOnboardingSwiper() {
    const nextBtn = document.getElementById('onboarding-next-btn');
    
    // 既にインスタンスがあれば破棄（再表示時用）
    if (onboardingSwiperInstance) { onboardingSwiperInstance.destroy(true, true); }

    onboardingSwiperInstance = new Swiper('.onboarding-swiper', {
        slidesPerView: 1,
        spaceBetween: 0,
        pagination: {
            el: '.onboarding-pagination',
            clickable: true,
        },
        on: {
            // スライドが変わった時の処理
            slideChange: function () {
                // 最後のスライドかどうかでボタンのテキストを変える
                if (this.isEnd) {
                    nextBtn.innerText = "始める";
                } else {
                    nextBtn.innerText = "次へ";
                }
            }
        }
    });

    // ボタンクリック時の処理を設定（重複登録を防ぐため一旦解除してから）
    nextBtn.onclick = null; 
    nextBtn.onclick = function() {
        if (onboardingSwiperInstance.isEnd) {
            // 最後のスライドでボタンを押したら、アシスタント選択画面へ遷移
            showPage('assistant-selection-page');
        } else {
            // それ以外は次のスライドへ
            onboardingSwiperInstance.slideNext();
        }
    };
    
    // 初期状態のボタンテキスト設定
    nextBtn.innerText = (onboardingSwiperInstance.isEnd) ? "始める" : "次へ";
}
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

// ▼▼▼ アシスタント選択送信処理 (新規追加) ▼▼▼
async function submitAssistant(type) {
    const assistantName = (type === 'butler') ? '執事 真田くん' : 'メイド ココちゃん';
    
    if (!confirm(`「${assistantName}」を選択しますか？\n（LINEに挨拶メッセージが届きます）`)) {
        return;
    }

    document.getElementById("loader-wrapper").classList.remove('is-hidden');
    
    const liffUserId = liff.getContext().userId;
    
    try {
        const response = await fetch(GAS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ 
                source: 'liff_app', 
                action: 'registerUserAssistant', 
                liffUserId: liffUserId, 
                assistantType: type 
            })
        });
        const result = await response.json();
        
        if (result.success) {
            // 完了したらリロードしてマイページへ
            // (GAS側でLINEプッシュ通知も送信済み)
            alert("設定しました！\nLINEのトークルームに挨拶が届いています。");
            location.reload(); 
        } else {
            alert("エラー: " + result.message);
            document.getElementById("loader-wrapper").classList.add('is-hidden');
        }
    } catch (e) {
        alert("通信エラー: " + e.message);
        document.getElementById("loader-wrapper").classList.add('is-hidden');
    }
}
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

// ▼▼▼ メイン処理 (DOM読み込み後) ▼▼▼
window.addEventListener('DOMContentLoaded', () => {

    // --- 内部ヘルパー関数（修正版） ---
    async function callGasApi(action, payload) {
        // ★修正: 送信者のLIFF IDを自動で取得してセットする
        // (payloadの中に既に liffUserId があればそれを優先、なければ liff.getContext().userId を使う)
        const currentLiffId = (payload && payload.liffUserId) ? payload.liffUserId : liff.getContext().userId;

        const response = await fetch(GAS_API_URL, { 
            method: 'POST', 
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }, 
            body: JSON.stringify({ 
                source: 'liff_app', 
                action: action, 
                liffUserId: currentLiffId, // ★ここで確実にIDを送る！
                ...payload 
            }) 
        });
        
        if (!response.ok) throw new Error('APIサーバーとの通信に失敗しました。');
        return response.json();
    }

    // ▼▼▼ 【修正版】さがすページ（スワイプ/グリッド）制御ロジック ▼▼▼

    // 1. さがすページへ移動する関数（初期表示はスワイプ）
    function goToSearchPage(e) {
        if (e) e.preventDefault();
        
        // 統合されたページを表示
        showPage('search-page');

        // 強制的にスワイプモードにリセットする
        const swipeArea = document.getElementById('swipe-view-area');
        const gridArea = document.getElementById('grid-view-area');
        if(swipeArea) swipeArea.style.display = 'block';
        if(gridArea) gridArea.style.display = 'none';
        
        // アイコンをグリッド用にセット（「次はグリッドにできるよ」という意味）
        const icon = document.getElementById('toggle-view-icon');
        if(icon) icon.className = 'fas fa-th-large';

        // スワイプデータをロード
        loadNewUserListPage(); 
    }

    // 2. 表示モード切り替えボタンの処理（スワイプ ⇔ グリッド）
    const toggleViewBtn = document.getElementById('toggle-view-mode-btn');
    if (toggleViewBtn) {
        toggleViewBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            const swipeArea = document.getElementById('swipe-view-area');
            const gridArea = document.getElementById('grid-view-area');
            const icon = document.getElementById('toggle-view-icon');

            // 現在スワイプが表示されている場合 -> グリッドへ切り替え
            if (swipeArea.style.display !== 'none') {
                swipeArea.style.display = 'none';
                gridArea.style.display = 'grid'; // CSSに合わせて grid か block
                
                // アイコンを「戻る（重なり）」に変更
                icon.className = 'fas fa-layer-group';
                
                // グリッドデータをロード（ここに追加した loadUserGridPage を呼び出し）
                loadUserGridPage();
            } 
            // 現在グリッドが表示されている場合 -> スワイプへ切り替え
            else {
                swipeArea.style.display = 'block';
                gridArea.style.display = 'none';
                
                // アイコンを「グリッド」に変更
                icon.className = 'fas fa-th-large';
            }
        });
    }

    // 3. イベントリスナーの設定

    // ホーム画面から「さがす（診断）」への遷移
    const btnSwipeHome = document.getElementById('go-to-swipe-from-home'); 
    if(btnSwipeHome) btnSwipeHome.addEventListener('click', goToSearchPage);

    // さがすページ内のフッター：中央ボタン（リロードまたはスワイプへ戻す）
    const btnSearchRefresh = document.getElementById('go-to-search-refresh');
    if(btnSearchRefresh) btnSearchRefresh.addEventListener('click', goToSearchPage);

    // さがすページ内のフッター：ホームへ
    const btnHomeSearch = document.getElementById('go-to-home-from-search');
    if(btnHomeSearch) btnHomeSearch.addEventListener('click', goToHomePage);

    // ホーム画面への遷移（既存）
    function goToHomePage(e) {
        if (e) e.preventDefault();
        showPage('my-page'); 
    }
    const btnHomeHome = document.getElementById('go-to-home-from-home');
    if(btnHomeHome) btnHomeHome.addEventListener('click', (e) => { e.preventDefault(); });


    // ダミーボタン類（実装準備中）
    const dummyIds = [
        'go-to-diagnosis-from-home', 
        'go-to-diagnosis-from-search', 
        'go-to-messages-from-home', 
        'go-to-messages-from-search', 
        'go-to-assistant-from-home',
        'go-to-assistant-from-search'
    ];
    dummyIds.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('click', showNotImplemented);
    });

    // ダミーボタンのアラート関数
    function showNotImplemented(e) {
        e.preventDefault();
        alert('この機能は現在準備中です。');
    }

    // 共通：戻るボタン
    document.querySelectorAll('.back-button').forEach(btn => {
        btn.addEventListener('click', (e) => { 
            e.preventDefault(); 
            const targetPage = e.currentTarget.getAttribute('data-target') || 'my-page';
            showPage(targetPage); 
        });
    });
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    // --- データ表示ロジック ---
    function showProfile(data) {
        if (data.success) {
            document.getElementById("app").style.display = 'block';
            document.getElementById("loader-wrapper").classList.add('is-hidden');
            
            // ステップ分岐
            if (data.step === "follow-1") {
                showPage('gender-selection-page');
            } else if (data.step === "S-2") {
                showPage('name-input-page');
            } else if (data.step === "S-3") {
                showPage('nickname-input-page');
            } else if (data.step === "S-4") {
                showPage('employee-id-input-page');
            } else if (data.step === "S-5") {
                showPage('age-input-page');
            } else if (data.step === "S-6") {
                showPage('department-input-page');
            } else {
                // 完了済み -> マイページへ
                document.getElementById("nickname").innerText = data.nickname || '未設定';
                document.getElementById("user-details").innerText = `${data.age || '--'}歳・${data.job || '--'}領域`;
                
                const profileImgElem = document.getElementById("profile-image");
                profileImgElem.src = data.profileImageUrl || 'https://placehold.jp/150x150.png'; // 画像がない場合のフォールバック

                document.getElementById("kyun-points").innerText = data.totalKyun;
                const progressPercent = Math.round((data.diagnosisProgress / 6) * 100);
                document.getElementById("diagnosis-progress").innerText = `${progressPercent}%`;
                
                // ▼▼▼ 【修正】プロフィール画像登録促進エリアの表示制御 ▼▼▼
                const promoSection = document.getElementById('photo-upload-promo');
                const currentImgUrl = data.profileImageUrl || "";
                 // 画像が未設定、または placehold.jp などのデフォルト画像の場合に表示
                // ※正規表現でチェック
                const defaultImageUrls = [
                    'https://drive.google.com/thumbnail?id=12DqJms_8Fr8BTYzCaGlFFW82Nmf3B4Q0',
                    'https://drive.google.com/thumbnail?id=1_4VVriM9WPIj6j8nKyQhE9HJ6hl_QsX8',
                    'https://placehold.jp/150x150.png?text=?'
                ];

                const isDefault = !currentImgUrl || 
                                  defaultImageUrls.includes(currentImgUrl) || 
                                  currentImgUrl.includes('placehold.jp');
                
                if (isDefault) {
                      promoSection.style.display = 'block';
                } else {
                      promoSection.style.display = 'none';
                }
                // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

                document.getElementById("app").style.display = 'block';
                document.getElementById("loader-wrapper").classList.add('is-hidden');
                showPage('my-page');
            } 
        } else {
            showError(data);
        }
    }

    function showError(error, liffUserId = '不明') {
        document.getElementById("loader-wrapper").classList.add('is-hidden');
        document.getElementById("app").style.display = "none";
        
        const errorMessageText = error.message || "原因不明のエラーが発生しました。";
        
        alert("GASからの応答:\n" + errorMessageText + "\n\n" + "送信したLIFF ID:\n" + liffUserId);

        document.getElementById("error-message").innerHTML = `${errorMessageText}<br><span style="font-size: 10px; color: #888;">(デバッグ情報: ${liffUserId})</span>`;
        document.getElementById("sync-button-container").style.display = "block";
    }

    // ▼▼▼ 【新規追加】グリッド画面読み込み関数 ▼▼▼
    async function loadUserGridPage() {
        const gridContainer = document.getElementById('user-grid-container');
        // ローディング表示
        gridContainer.innerHTML = '<p style="text-align:center; width:100%; margin-top:20px;">読み込み中...</p>';
        
        try {
            // スワイプ画面と同じAPIを使ってユーザーリストを取得
            const result = await callGasApi('getUsersForLiff', { liffUserId: liff.getContext().userId });
            
            if (result.success && result.users.length > 0) {
                gridContainer.innerHTML = ''; // ローディング表示を消す
                
                result.users.forEach(user => {
                    // ランダムな場所（デモ用）
                    const locations = ['東京', '神奈川', '大阪', '北海道'];
                    const randomLoc = locations[Math.floor(Math.random() * locations.length)];

                    // グリッド用のカードHTMLを作成
                    // ※style.cssで .grid-user-card 等のスタイル定義が必要です
                    const cardHtml = `
                        <div class="grid-user-card">
                            <img src="${user.profileImageUrl || 'https://placehold.jp/150x150.png'}" class="grid-user-image" alt="${user.nickname}">
                            <div class="grid-user-info-overlay">
                                <p class="grid-user-name">${user.nickname || 'No Name'} (${user.age || '?'})</p>
                                <p class="grid-user-meta">${user.job || '未設定'}・${randomLoc}</p>
                            </div>
                        </div>
                    `;
                    gridContainer.innerHTML += cardHtml;
                });
            } else {
                gridContainer.innerHTML = '<p style="text-align:center; width:100%;">表示できるユーザーがいません。</p>';
            }
        } catch (error) {
            gridContainer.innerHTML = `<p style="color: red; text-align:center;">エラー: ${error.message}</p>`;
        }
    }
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    // ▼▼▼ 【修正】変数を外に出してグローバル化 ▼▼▼
    // ※これらは window.addEventListener の中ではなく、script.jsのトップレベル（一番上など）に書くのが理想ですが、
    // 既存のコードを崩さないよう、windowオブジェクトに紐付ける形で解決します。

    window.loadedSwipeUsers = []; // windowオブジェクトに保存してどこからでもアクセス可能に

    window.openOtherUserDiagnosis = function(index) {
        const targetUser = window.loadedSwipeUsers[index];
        if (!targetUser) {
            console.error("User not found at index:", index);
            return;
        }
        openDiagnosisModal(targetUser);
    };
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    // ▼▼▼ 【修正版】キュン送信関数（マッチング自動遷移付き） ▼▼▼
    window.sendKyun = async function(index) {
        const targetUser = window.loadedSwipeUsers[index];
        if (!targetUser) return;

        if (!confirm(`${targetUser.nickname}さんに「キュン」を送りますか？`)) {
            return;
        }

        document.getElementById("loader-wrapper").classList.remove('is-hidden');

        try {
            const result = await callGasApi('sendKyun', { 
                targetLiffUserId: targetUser.liffUserId 
            });

            document.getElementById("loader-wrapper").classList.add('is-hidden');

            if (result.success) {
                
                // ★★★ ここで分岐：マッチング成立なら演出画面へ！ ★★★
                if (result.isMatch) {
                    
                    // 1. 自分のプロフィール画像URLを取得
                    const myProfile = await liff.getProfile();
                    const myImgUrl = myProfile.pictureUrl || 'https://placehold.jp/150x150.png';
                    
                    // 2. 相手の画像URL
                    let partnerImgUrl = targetUser.profileImageUrl;
                    if (!partnerImgUrl || partnerImgUrl.includes('thumbnail')) {
                        partnerImgUrl = 'https://placehold.jp/150x150.png';
                    }
                    
                    // ★★★ 関数呼び出し（重複処理を削除） ★★★
                    startMatchSequence(myImgUrl, partnerImgUrl, targetUser.nickname);

                } else {
                    // 通常の成功時（片思い）
                    alert(`「キュン」を送りました！\n相手に通知が届きます。`);
                    
                    const btn = document.getElementById(`kyun-btn-${index}`);
                    if(btn) {
                        btn.disabled = true;
                        btn.innerHTML = '<i class="fas fa-check"></i> 送信済';
                        btn.style.background = "#ccc";
                        btn.style.boxShadow = "none";
                    }
                }

            } else {
                alert("送信エラー: " + result.message);
            }
        } catch (error) {
            document.getElementById("loader-wrapper").classList.add('is-hidden');
            alert("通信エラーが発生しました。");
            console.error(error);
        }
    };

    
    // --- スワイプ画面ロジック ---
    let swiperInstance = null;
    // let loadedSwipeUsers = []; // ←【削除】ここは削除（window.loadedSwipeUsersを使います）

    async function loadNewUserListPage() {
        const swipeDeck = document.getElementById('swipe-deck');
        // ▼ 修正: 文字を出さずに空にする
        swipeDeck.innerHTML = '';
        
        try {
            const result = await callGasApi('getUsersForLiff', { liffUserId: liff.getContext().userId });
            if (result.success && result.users.length > 0) {
                
                window.loadedSwipeUsers = result.users; // ★【修正】windowオブジェクトに保存
                
                // ユーザーごとにループ処理（indexを利用）
                result.users.forEach((user, index) => {
                    const locations = ['東京', '神奈川', '大阪', '北海道'];
                    const randomLoc = locations[Math.floor(Math.random() * locations.length)];

                    // 画像URLの決定
                    let displayImgUrl = user.profileImageUrl;
                    const isDefault = !displayImgUrl || displayImgUrl.includes('thumbnail'); 
                    if (!displayImgUrl) {
                        displayImgUrl = 'https://placehold.jp/400x500.png?text=No+Image';
                    }

                    const cardSlide = `
                        <div class="swiper-slide">
                            <div class="profile-card">
                                <div class="profile-image">
                                    <img src="${displayImgUrl}" alt="${user.nickname}">
                                    
                                    <div class="age-tags">
                                        <span><i class="fas fa-leaf"></i> 本日入会</span>
                                    </div>

                                    <button class="profile-detail-btn" onclick="window.openOtherUserDiagnosis(${index})">
                                        <i class="fas fa-id-card"></i> プロフィール
                                    </button>
                                    <button id="kyun-btn-${index}" class="more-btn" onclick="window.sendKyun(${index})">
                                        <i class="fas fa-heart"></i> キュンする
                                    </button>
                                </div>

                                <div class="profile-info">
                                    <div class="name-row">
                                        <h2>${user.nickname || 'No Name'}</h2>
                                        <span class="age-text">${user.age || '20'}歳</span>
                                        <span class="job-tag">${user.job || '未設定'}</span>
                                        <span class="location-text">${randomLoc}</span>
                                    </div>

                                    <div class="status-row">
                                        <span class="status-dot"></span>
                                        <span>オンライン</span>
                                    </div>

                                    <p class="bio-text">
                                        ${user.job ? user.job + 'をしています。' : ''}
                                        休日はカフェ巡りをしたり、映画を見たりして過ごすのが好きです☕️
                                    </p>
                                </div>

                                <div class="interest-icons">
                                    <span class="common-points-label">共通点 5個</span>
                                    <div class="icon-circle"><i class="fas fa-camera"></i></div>
                                    <div class="icon-circle"><i class="fas fa-utensils"></i></div>
                                    <div class="icon-circle"><i class="fas fa-plane"></i></div>
                                </div>
                            </div>
                        </div>`;
                    
                    swipeDeck.innerHTML += cardSlide;
                });
                initializeSwiper();
            } else { swipeDeck.innerHTML = '<p>表示できるユーザーがいません。</p>'; }
        } catch (error) { swipeDeck.innerHTML = `<p style="color: red;">エラー: ${error.message}</p>`; }
    }

    function initializeSwiper() {
        if (swiperInstance) { swiperInstance.destroy(true, true); }
        swiperInstance = new Swiper('.swiper', {
            effect: 'cards',
            grabCursor: true,
            loop: false,
            cardsEffect: {
                rotate: true,
                perSlideRotate: 2,
                perSlideOffset: 8,
                slideShadows: true,
            },
        });
    }

    // --- メイン実行 (修正版) ---
    async function main() {
        let liffUserId = 'ID取得前';
        try {
            await liff.init({ liffId: LIFF_ID });
            if (!liff.isLoggedIn()) { liff.login(); return; }

            // URLパラメータのチェック (マッチング演出用)
            const urlParams = new URLSearchParams(window.location.search);
            const mode = urlParams.get('mode');
            const partnerLiffId = urlParams.get('partnerLiffId');

            // ▼▼▼ マッチング成立モードの場合 ▼▼▼
            if (mode === 'match_success' && partnerLiffId) {
                // ローディング消去
                document.getElementById("loader-wrapper").classList.add('is-hidden');
                document.getElementById("app").style.display = 'block';
                
                // 1. 自分のプロフィール取得
                const myProfile = await liff.getProfile();
                const myImgUrl = myProfile.pictureUrl || 'https://placehold.jp/150x150.png';

                // 2. 相手のプロフィール取得
                const partnerData = await callGasApi('getMyProfileData', { liffUserId: partnerLiffId });
                const partnerImgUrl = (partnerData.success && partnerData.profileImageUrl) ? partnerData.profileImageUrl : 'https://placehold.jp/150x150.png';
                const partnerName = (partnerData.success) ? partnerData.nickname : '相手';
                
                // ★★★ 関数呼び出し（重複処理を削除） ★★★
                startMatchSequence(myImgUrl, partnerImgUrl, partnerName);

                return; // ここで処理終了（マイページには行かない）
            }
            // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

            // --- 以下、通常起動時の処理 ---
            const profile = await liff.getProfile();
            liffUserId = profile.userId; 

            if (!liffUserId) { throw new Error("LINEユーザーIDが取得できませんでした。"); }

            const profileData = await callGasApi('getMyProfileData', { liffUserId: liffUserId });
            
            if (profileData.success) {
                currentUser = profileData;
                showProfile(profileData);
            } else {
                showError(profileData, liffUserId);
            }
        } catch (error) { 
            showError(error, liffUserId); 
        }
    }
    main();
});


// ▼▼▼ script.js の一番最後に追加してください ▼▼▼

// Vue.jsの初期化
var vueApp = new Vue({
  el: '#app', // index.htmlの <div id="app"> を制御範囲にする
  data: {
    currentView: '', // Vueで表示制御する画面名
    
    // ヒミツの質問用データ
    secretTopics: [
      '仕事の価値観', '恋愛のスタンス', 'お金の使い方', 
      '休日の過ごし方', '食の好み', '譲れないコト', 'その他'
    ],
    selectedTopics: [],   // 選択されたトピック
    questionInputs: {},   // 質問文の入力内容
    
    // マッチングIDなどの保持用
    currentMatchId: null 
  },
  computed: {
    // 2つ選択され、かつ両方にテキストが入力されているかチェック
    isFormValid: function() {
      if (this.selectedTopics.length !== 2) return false;
      var self = this;
      return this.selectedTopics.every(function(topic) {
        var text = self.questionInputs[topic];
        return text && text.trim().length > 0;
      });
    }
  },
  methods: {
    // トピックボタンが押された時の処理
    toggleTopic: function(topic) {
      var idx = this.selectedTopics.indexOf(topic);
      if (idx >= 0) {
        // 選択解除
        this.selectedTopics.splice(idx, 1);
      } else {
        // 追加（2つ未満の場合のみ）
        if (this.selectedTopics.length < 2) {
          this.selectedTopics.push(topic);
          // 入力欄初期化（Vue2の書き方）
          if (!this.questionInputs[topic]) {
            this.$set(this.questionInputs, topic, '');
          }
        }
      }
    },
    
    // 選択状態かどうか
    isTopicSelected: function(topic) {
      return this.selectedTopics.indexOf(topic) !== -1;
    },

    // マッチング画面から質問画面へ遷移する処理
    goToSecretQuestionPhase: function() {
      // 既存のVanilla JS（jQuery等）で表示されている画面を隠す
      var matchPage = document.getElementById('match-success-page');
      if (matchPage) matchPage.style.display = 'none';

      // Vueの画面を表示する
      this.currentView = 'match-question';
      
      // 必要であればここで currentMatchId をセット
      // this.currentMatchId = "ここでIDを取得してセット";
    },
      // script.js の methods に追加するとより親切なプレースホルダーが出せます
     getPlaceholder: function(topic) {
       var examples = {
    '仕事の価値観': '今の仕事で一番やりがいを感じる時は？',
    '恋愛のスタンス': '連絡頻度はどれくらいが理想？',
    'お金の使い方': '自己投資で一番使っているものは？',
    '休日の過ごし方': 'インドア派？アウトドア派？',
    '食の好み': '一番好きな手料理は何ですか？',
    '譲れないコト': 'これだけは許せない！という事は？',
    'その他': '自由に質問を入力してください'
     };
     return examples[topic] || '質問を入力してください';
    },

    // GASへ送信する処理
    submitSecretQuestions: function() {
      var self = this;
      
      // LIFFからLINEユーザーIDを取得
      var liffUserId = null;
      if (typeof liff !== 'undefined' && liff.getDecodedIDToken()) {
          liffUserId = liff.getDecodedIDToken().sub;
      }

      var payload = {
        action: 'submitSecretQuestions',
        liffUserId: liffUserId, 
        matchId: this.currentMatchId, 
        questions: this.selectedTopics.map(function(topic) {
          return {
            topic: topic,
            text: self.questionInputs[topic]
          };
        })
      };

// ★★★注意：以下のURLはあなたのGASデプロイURLに書き換えてください★★★
     var GAS_API_URL = 'https://script.google.com/macros/s/AKfycbwyKAZqLjwcc_Z_8ZLinHOhaGFcUPd9n_Asjf52oYbVpX3Kj3XYTT5cTiyO3luxiHGL3Q/exec'; 
        
       fetch(GAS_API_URL,  {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      .then(function(response) { return response.json(); })
      .then(function(data) {
        if (data.success) {
          alert("質問を送信しました！トーク画面に戻って結果をお待ちください。");
          liff.closeWindow(); 
        } else {
          alert("送信エラー: " + (data.message || "不明なエラー"));
        }
      })
      .catch(function(error) {
        alert("通信エラーが発生しました: " + error);
      });
    }
  }
});
