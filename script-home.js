// モードごとのメニュー定義
const menus = {
    life: [
        { icon: 'wallet', name: '家計簿', link: 'index.html' },
        { icon: 'key-round', name: 'パスワード', link: 'passwords.html' },
        { icon: 'lightbulb', name: 'アイデア' },
        { icon: 'calendar', name: '予定' },
        { icon: 'shopping-cart', name: '買い物' },
        { icon: 'music', name: '音楽' },
        { icon: 'camera', name: '写真' },
        { icon: 'heart', name: '健康' }
    ],
    work: [
        { icon: 'briefcase', name: '仕事' },
        { icon: 'trending-up', name: '転職' }, // 新規追加
        { icon: 'layers', name: '案件管理' },
        { icon: 'mail', name: 'メール' },
        { icon: 'file-text', name: '経費精算' },
        { icon: 'users', name: '連絡先' },
        { icon: 'clock', name: '勤怠' },
        { icon: 'terminal', name: '開発' }
    ],
    other: [
        { icon: 'smile', name: 'その他' }, // 新規追加
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
    // 1. bodyのクラスを切り替えて色を変える
    document.body.className = `mode-${mode}`;
    
    // 2. メニューを生成
    const grid = document.getElementById('menu-grid');
    grid.innerHTML = ''; // 一旦空にする
    
    menus[mode].forEach(item => {
        const div = document.createElement('div');
        div.className = 'app-item';
        if(item.link) div.onclick = () => navigate(item.link);
        
        div.innerHTML = `
            <div class="icon-box"><i data-lucide="${item.icon}"></i></div>
            <span>${item.name}</span>
        `;
        grid.appendChild(div);
    });
    
    // 3. アイコンを再レンダリング
    lucide.createIcons();
}

function navigate(page) {
    window.location.href = `${window.location.origin}/${page}`;
}

// 起動時にLIFEを表示
window.onload = function() {
    switchMode('life');
    // 必要に応じてLIFFの初期化コードをここに追加
};
