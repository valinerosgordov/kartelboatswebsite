// ===== ADMIN PANEL =====
(function() {
    const API = '/api/admin';
    let currentArticlePage = 1;

    // ===== TABS =====
    document.getElementById('adminTabs').addEventListener('click', function(e) {
        var tab = e.target.closest('.admin-tab');
        if (!tab) return;

        document.querySelectorAll('.admin-tab').forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');

        var name = tab.dataset.tab;
        document.getElementById('tabArticles').style.display = name === 'articles' ? '' : 'none';
        document.getElementById('tabSources').style.display = name === 'sources' ? '' : 'none';

        if (name === 'sources') loadSources();
    });

    // ===== ARTICLES =====
    function loadArticles(page) {
        currentArticlePage = page || 1;
        fetch(API + '/articles?page=' + currentArticlePage + '&pageSize=20')
            .then(function(r) { return r.json(); })
            .then(function(data) {
                document.getElementById('articleCount').textContent = data.totalCount + ' статей';
                var tbody = document.getElementById('articlesBody');
                tbody.innerHTML = '';

                data.articles.forEach(function(a) {
                    var tr = document.createElement('tr');
                    var isPublished = !!a.publishedAt;
                    tr.innerHTML =
                        '<td><span class="status-badge ' + (isPublished ? 'status-badge--published' : 'status-badge--draft') + '">' +
                            (isPublished ? 'ОПУБЛ.' : 'ЧЕРНОВИК') + '</span></td>' +
                        '<td title="' + a.title + '">' + a.title + '</td>' +
                        '<td>' + a.sourceName + '</td>' +
                        '<td class="mono">' + a.category + '</td>' +
                        '<td class="mono">' + formatDate(a.createdAt) + '</td>' +
                        '<td>' +
                            (isPublished
                                ? '<button class="action-btn" onclick="adminAction(\'unpublish\',\'' + a.id + '\')">СНЯТЬ</button>'
                                : '<button class="action-btn" onclick="adminAction(\'publish\',\'' + a.id + '\')">ОПУБЛ.</button>') +
                            '<button class="action-btn action-btn--danger" onclick="adminAction(\'delete\',\'' + a.id + '\')">УДАЛ.</button>' +
                        '</td>';
                    tbody.appendChild(tr);
                });

                renderPagination(data.totalCount, data.page, data.pageSize);
            });
    }

    function renderPagination(total, page, pageSize) {
        var pages = Math.ceil(total / pageSize);
        var container = document.getElementById('articlesPagination');
        container.innerHTML = '';
        for (var i = 1; i <= pages; i++) {
            var btn = document.createElement('button');
            btn.className = 'page-btn mono' + (i === page ? ' active' : '');
            btn.textContent = i;
            btn.dataset.page = i;
            btn.addEventListener('click', function() { loadArticles(parseInt(this.dataset.page)); });
            container.appendChild(btn);
        }
    }

    // ===== ARTICLE ACTIONS =====
    window.adminAction = function(action, id) {
        var url, method;
        if (action === 'publish') {
            url = API + '/articles/' + id + '/publish';
            method = 'POST';
        } else if (action === 'unpublish') {
            url = API + '/articles/' + id + '/unpublish';
            method = 'POST';
        } else if (action === 'delete') {
            if (!confirm('Удалить статью?')) return;
            url = API + '/articles/' + id;
            method = 'DELETE';
        }

        fetch(url, { method: method })
            .then(function() { loadArticles(currentArticlePage); });
    };

    // ===== SOURCES =====
    function loadSources() {
        fetch(API + '/sources')
            .then(function(r) { return r.json(); })
            .then(function(sources) {
                var tbody = document.getElementById('sourcesBody');
                tbody.innerHTML = '';

                sources.forEach(function(s) {
                    var tr = document.createElement('tr');
                    tr.innerHTML =
                        '<td><span class="status-badge ' + (s.isEnabled ? 'status-badge--enabled' : 'status-badge--disabled') + '">' +
                            (s.isEnabled ? 'ВКЛ' : 'ВЫКЛ') + '</span></td>' +
                        '<td>' + s.name + '</td>' +
                        '<td class="mono" style="font-size:10px">' + s.rssUrl + '</td>' +
                        '<td class="mono">' + s.defaultCategory + '</td>' +
                        '<td class="mono">' + (s.lastParsedAt ? formatDate(s.lastParsedAt) : '—') + '</td>' +
                        '<td>' +
                            '<button class="action-btn" onclick="toggleSource(\'' + s.id + '\')">' + (s.isEnabled ? 'ВЫКЛ' : 'ВКЛ') + '</button>' +
                            '<button class="action-btn action-btn--danger" onclick="deleteSource(\'' + s.id + '\')">УДАЛ.</button>' +
                        '</td>';
                    tbody.appendChild(tr);
                });
            });
    }

    window.toggleSource = function(id) {
        fetch(API + '/sources/' + id + '/toggle', { method: 'POST' })
            .then(function() { loadSources(); });
    };

    window.deleteSource = function(id) {
        if (!confirm('Удалить источник?')) return;
        fetch(API + '/sources/' + id, { method: 'DELETE' })
            .then(function() { loadSources(); });
    };

    document.getElementById('addSourceBtn').addEventListener('click', function() {
        var name = prompt('Название источника:');
        if (!name) return;
        var rssUrl = prompt('RSS URL:');
        if (!rssUrl) return;
        var category = prompt('Категория (IndustryNews / Reviews / Lifestyle / Events / Safety):') || 'IndustryNews';

        fetch(API + '/sources', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, rssUrl: rssUrl, defaultCategory: category })
        })
        .then(function() { loadSources(); });
    });

    // ===== HELPERS =====
    function formatDate(dateStr) {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    }

    // ===== INIT =====
    loadArticles(1);
})();
