// ===== BLOG: Load articles from API =====
(function() {
    const API = '/api/blog';
    const grid = document.getElementById('blogGrid');
    const loadMoreWrap = document.getElementById('blogLoadMore');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const emptyState = document.getElementById('blogEmpty');
    const filters = document.getElementById('blogFilters');

    let currentPage = 1;
    let currentCategory = '';
    let totalCount = 0;
    const pageSize = 12;

    const categoryLabels = {
        IndustryNews: 'Новости',
        Reviews: 'Обзоры',
        Lifestyle: 'Образ жизни',
        Events: 'События',
        Safety: 'Безопасность'
    };

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function createArticleCard(article) {
        const card = document.createElement('article');
        card.className = 'article-card';

        const imgHtml = article.imageUrl
            ? '<img class="article-img" src="' + article.imageUrl + '" alt="' + article.title + '" loading="lazy">'
            : '<div class="article-img-placeholder">KARTEL BOATS</div>';

        card.innerHTML =
            imgHtml +
            '<div class="article-body">' +
                '<div class="article-meta">' +
                    '<span class="article-category">' + (categoryLabels[article.category] || article.category) + '</span>' +
                    '<span class="article-date">' + formatDate(article.publishedAt || article.createdAt) + '</span>' +
                '</div>' +
                '<h3 class="article-title">' + article.title + '</h3>' +
                '<p class="article-summary">' + article.summary + '</p>' +
                '<div class="article-footer">' +
                    '<span class="article-source">' + article.sourceName + '</span>' +
                    '<a href="' + article.sourceUrl + '" target="_blank" rel="noopener" class="article-link">ЧИТАТЬ →</a>' +
                '</div>' +
            '</div>';

        return card;
    }

    function loadArticles(page, append) {
        var url = API + '/articles?page=' + page + '&pageSize=' + pageSize;
        if (currentCategory) url += '&category=' + currentCategory;

        fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (!append) grid.innerHTML = '';

                totalCount = data.totalCount;

                if (data.articles.length === 0 && !append) {
                    emptyState.style.display = 'block';
                    loadMoreWrap.style.display = 'none';
                    return;
                }

                emptyState.style.display = 'none';

                data.articles.forEach(function(article) {
                    grid.appendChild(createArticleCard(article));
                });

                var loaded = page * pageSize;
                if (loaded < totalCount) {
                    loadMoreWrap.style.display = 'block';
                } else {
                    loadMoreWrap.style.display = 'none';
                }
            })
            .catch(function(err) {
                console.error('Blog load error:', err);
                if (!append) {
                    grid.innerHTML = '<div class="blog-loading">ОШИБКА ЗАГРУЗКИ</div>';
                }
            });
    }

    // Category filters
    filters.addEventListener('click', function(e) {
        var btn = e.target.closest('.filter-btn');
        if (!btn) return;

        filters.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');

        currentCategory = btn.dataset.category || '';
        currentPage = 1;
        loadArticles(1, false);
    });

    // Load more
    loadMoreBtn.addEventListener('click', function() {
        currentPage++;
        loadArticles(currentPage, true);
    });

    // Initial load
    loadArticles(1, false);
})();
