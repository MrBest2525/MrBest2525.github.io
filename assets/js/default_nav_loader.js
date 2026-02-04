(function() {
    document.addEventListener("DOMContentLoaded", () => {
        const navContainer = document.querySelector('#nav');
        if (!navContainer) return;

        // 1. サイトのルートURLを取得
        const baseUrl = location.origin;
        const presetUrl = new URL('assets/preset/', baseUrl).href;

        // 2. nav.html を取得
        fetch(presetUrl + 'nav.html')
            .then(res => {
                if (!res.ok) throw new Error("Nav file not found at " + presetUrl);
                return res.text();
            })
            .then(html => {
                // 3. ナビゲーションを挿入
                navContainer.innerHTML = html;

                // 4. パスの自動修正（どの階層のHTMLから呼んでも動くようにする）
                
                // aタグの調整
                navContainer.querySelectorAll('a').forEach(a => {
                    const href = a.getAttribute('href');
                    if (href && !href.startsWith('http') && !href.startsWith('#')) {
                        a.href = new URL(href, baseUrl).href;
                    }
                });

                // linkタグ（CSS）の調整
                navContainer.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
                    const href = link.getAttribute('href');
                    if (href && !href.startsWith('http')) {
                        // nav.htmlと同じ階層(assets/preset/)にあるnav.cssを指すように修正
                        link.href = new URL(href, presetUrl).href;
                    }
                });

                // 5. アニメーション適用（リロード時も発動）
                applyAnimation(navContainer);
            })
            .catch(err => console.error("Navigation load failed:", err));
    });

    /**
     * 上からスッと降りてくる演出
     */
    function applyAnimation(el) {
        
        // 1. まず「アニメーションなし」で今の状態を確定させる
        el.style.transition = "none";
        el.style.opacity = "0";
        el.style.transform = "translateY(-20px)";

        // 2. ブラウザが「よし、最初は透明で上だな」と理解した直後にアニメーションをONにする
        requestAnimationFrame(() => {
            // さらに次のフレームで実行することで、質感（blur）が置いていかれるのを防ぐ
            requestAnimationFrame(() => {
                el.style.transition = "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s linear";
                el.style.opacity = "1";
                el.style.transform = "translateY(0)";
            });
        });
    }
    
})();