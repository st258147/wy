
// --- Icons (SVG Strings) ---
const Icons = {
    GraduationCap: `<svg class="icon icon-lg" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
    User: `<svg class="icon" viewBox="0 0 24 24"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    LogOut: `<svg class="icon" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
    PlusCircle: `<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
    Shield: `<svg class="icon" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    Search: `<svg class="icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    Clock: `<svg class="icon icon-sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    MessageSquare: `<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    Heart: `<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
    Eye: `<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
    ArrowLeft: `<svg class="icon" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
    Trash2: `<svg class="icon" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
    Edit: `<svg class="icon" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`
};

// --- API Service ---
const API_URL = './api/index.php';

async function apiRequest(action, method = 'GET', data = null, params = {}) {
    let url = `${API_URL}?action=${action}`;
    Object.keys(params).forEach(key => url += `&${key}=${params[key]}`);
    
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (data) options.body = JSON.stringify(data);
    
    const res = await fetch(url, options);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Request failed');
    return json;
}

const api = {
    users: {
        login: (identifier, password) => apiRequest('login', 'POST', { identifier, password }),
        register: (username, email, password) => apiRequest('register', 'POST', { username, email, password }),
        getById: (id) => apiRequest('users', 'GET', null, { id }),
        getAll: () => apiRequest('users', 'GET'),
        delete: (id) => apiRequest('users', 'DELETE', null, { id }),
        updateRole: (id, role) => apiRequest('users', 'PUT', { role }, { id }),
    },
    articles: {
        getAll: (search = '', tag = '', userId = '', feedFor = '') => apiRequest('articles', 'GET', null, { user_id: userId, feed_for: feedFor }),
        getById: (id, currentUserId) => apiRequest('articles', 'GET', null, { id, current_user_id: currentUserId }),
        create: (data) => apiRequest('articles', 'POST', data),
        update: (id, data) => apiRequest('articles', 'PUT', data, { id }),
        delete: (id) => apiRequest('articles', 'DELETE', null, { id }),
        toggleLike: (articleId, userId) => apiRequest('likes', 'POST', { article_id: articleId, user_id: userId }),
    },
    comments: {
        getByArticleId: (articleId) => apiRequest('comments', 'GET', null, { article_id: articleId }),
        create: (data) => apiRequest('comments', 'POST', data),
        delete: (id) => apiRequest('comments', 'DELETE', null, { id }),
    }
};

// --- State Management ---
const App = {
    user: JSON.parse(localStorage.getItem('session_user')) || null,
    
    login(user) {
        this.user = user;
        localStorage.setItem('session_user', JSON.stringify(user));
        this.renderNavbar();
        Router.navigate('/');
    },
    
    logout() {
        this.user = null;
        localStorage.removeItem('session_user');
        this.renderNavbar();
        Router.navigate('/login');
    },

    init() {
        this.renderNavbar();
        Router.init();
    },

    renderNavbar() {
        const nav = document.getElementById('navbar-actions');
        if (this.user) {
            const isAdmin = this.user.role === 'admin' || this.user.role === 'manager';
            nav.innerHTML = `
                <a href="#create" class="btn btn-primary rounded-full px-4 py-2 text-sm text-white" style="text-decoration:none">
                    ${Icons.PlusCircle} <span style="margin-left:4px">发帖</span>
                </a>
                ${isAdmin ? `<a href="#admin" class="btn btn-ghost p-2" title="管理后台">${Icons.Shield}</a>` : ''}
                <div class="flex items-center gap-2">
                   <div style="width:32px;height:32px;background:#dbeafe;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#2563eb;font-weight:bold">
                      ${this.user.username[0].toUpperCase()}
                   </div>
                   <span class="text-sm font-medium hidden sm:block">${this.user.username}</span>
                </div>
                <button onclick="App.logout()" class="btn btn-ghost p-2 text-red-500" title="退出">${Icons.LogOut}</button>
            `;
        } else {
            nav.innerHTML = `
                <a href="#login" class="nav-link">登录</a>
                <a href="#register" class="btn btn-primary rounded-md px-4 py-2 text-white" style="text-decoration:none">注册</a>
            `;
        }
    }
};

// --- Router ---
const Router = {
    routes: {
        '': Pages.Home,
        'login': Pages.Login,
        'register': Pages.Register,
        'article': Pages.ArticleView,
        'create': Pages.Editor,
        'edit': Pages.Editor,
        'admin': Pages.Admin
    },

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    },

    handleRoute() {
        const hash = window.location.hash.slice(1);
        const [path, param] = hash.split('/');
        
        const pageFunc = this.routes[path] || Pages.Home;
        document.getElementById('root').innerHTML = ''; // Clear
        pageFunc(param);
    },

    navigate(path) {
        window.location.hash = path;
    }
};

// --- Pages Logic ---
const Pages = {
    async Home() {
        const root = document.getElementById('root');
        root.innerHTML = `
            <div class="grid grid-cols-4">
                <div class="space-y-6">
                    <div class="card p-6">
                       <h3 class="font-bold mb-4">搜索</h3>
                       <input type="text" id="search-input" class="input mb-4" placeholder="关键词...">
                       <button onclick="Pages.HomeSearch()" class="btn btn-primary w-full rounded-md py-2">搜索</button>
                    </div>
                </div>
                <div class="col-span-3 space-y-4" id="article-list">
                    <div class="text-center p-8">加载中...</div>
                </div>
            </div>
        `;
        
        try {
            const articles = await api.articles.getAll();
            Pages.renderArticleList(articles);
        } catch (e) {
            document.getElementById('article-list').innerHTML = `<div class="text-center text-red-500">${e.message}</div>`;
        }
    },

    HomeSearch() {
        const query = document.getElementById('search-input').value.toLowerCase();
        api.articles.getAll().then(articles => {
            const filtered = articles.filter(a => a.title.toLowerCase().includes(query) || a.content.toLowerCase().includes(query));
            Pages.renderArticleList(filtered);
        });
    },

    renderArticleList(articles) {
        const list = document.getElementById('article-list');
        if (articles.length === 0) {
            list.innerHTML = '<div class="card p-8 text-center text-slate-500">暂无文章</div>';
            return;
        }
        list.innerHTML = articles.map(a => `
            <div class="card p-6 hover:shadow-md transition">
                <div class="flex items-center gap-2 text-sm text-slate-500 mb-2">
                    <span class="font-medium text-brand-600">@${a.author.username}</span>
                    <span>•</span>
                    <span>${new Date(a.created_at).toLocaleDateString()}</span>
                </div>
                <a href="#article/${a.id}" class="block mb-4" style="text-decoration:none">
                    <h2 class="text-xl font-bold text-slate-900 mb-2">${a.title}</h2>
                    <p class="text-slate-600" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${a.content}</p>
                </a>
                <div class="flex items-center gap-4 text-sm text-slate-500 border-t pt-4">
                    <span class="flex items-center gap-1">${Icons.Eye} ${a.views || 0}</span>
                    <span class="flex items-center gap-1">${Icons.Heart} ${a.likes_count}</span>
                    <span class="flex items-center gap-1">${Icons.MessageSquare} ${a.comments_count}</span>
                    <div class="flex gap-2 ml-auto">
                        ${a.tags.map(t => `<span class="bg-slate-100 px-2 py-1 rounded-full text-xs">#${t}</span>`).join('')}
                    </div>
                </div>
            </div>
        `).join('');
    },

    async ArticleView(id) {
        const root = document.getElementById('root');
        root.innerHTML = '<div class="text-center p-8">加载中...</div>';
        
        try {
            const article = await api.articles.getById(id, App.user?.id);
            const comments = await api.comments.getByArticleId(id);
            const canManage = App.user && (App.user.id === article.user_id || App.user.role === 'admin' || App.user.role === 'manager');

            root.innerHTML = `
                <div class="container" style="max-width:800px">
                    <button onclick="history.back()" class="btn btn-ghost mb-4">${Icons.ArrowLeft} 返回</button>
                    <div class="card p-8 mb-6">
                        <h1 class="text-3xl font-bold mb-4">${article.title}</h1>
                        <div class="flex justify-between items-center mb-6 border-b pb-6">
                            <div class="flex items-center gap-3">
                                <div style="width:40px;height:40px;background:#dbeafe;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#2563eb;font-weight:bold">
                                    ${article.author.username[0].toUpperCase()}
                                </div>
                                <div>
                                    <div class="font-bold">${article.author.username}</div>
                                    <div class="text-xs text-slate-500">${new Date(article.created_at).toLocaleString()}</div>
                                </div>
                            </div>
                            ${canManage ? `
                                <div class="flex gap-2">
                                    <button onclick="Router.navigate('edit/${article.id}')" class="btn btn-ghost text-brand-600">${Icons.Edit} 编辑</button>
                                    <button onclick="Pages.handleDeleteArticle(${article.id})" class="btn btn-ghost text-red-500">${Icons.Trash2} 删除</button>
                                </div>
                            ` : ''}
                        </div>
                        <div class="text-lg text-slate-800 mb-8" style="white-space:pre-wrap">${article.content}</div>
                        <div class="flex gap-4">
                            <button onclick="Pages.handleLike(${article.id})" ${!App.user ? 'disabled' : ''} class="btn px-4 py-2 rounded-md ${article.is_liked ? 'bg-red-50 text-red-500' : 'bg-slate-50'}">
                                ${Icons.Heart} ${article.likes_count} 点赞
                            </button>
                        </div>
                    </div>

                    <div class="card p-8">
                        <h3 class="font-bold text-xl mb-6">评论</h3>
                        ${App.user ? `
                            <div class="mb-8">
                                <textarea id="comment-input" class="input mb-2" rows="3" placeholder="写下你的评论..."></textarea>
                                <button onclick="Pages.handleComment(${article.id})" class="btn btn-primary rounded-md px-4 py-2">发表评论</button>
                            </div>
                        ` : '<div class="text-center p-4 bg-slate-50 rounded mb-6">请登录后评论</div>'}
                        
                        <div class="space-y-6" id="comments-list">
                            ${comments.map(c => `
                                <div class="flex gap-4">
                                    <div style="width:32px;height:32px;background:#e2e8f0;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px">
                                        ${c.author.username[0].toUpperCase()}
                                    </div>
                                    <div class="bg-slate-50 p-4 rounded-lg flex-grow">
                                        <div class="flex justify-between mb-2">
                                            <span class="font-bold text-sm">${c.author.username}</span>
                                            <span class="text-xs text-slate-500">${new Date(c.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p class="text-sm">${c.content}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        } catch (e) {
            root.innerHTML = `<div class="text-center text-red-500">${e.message}</div>`;
        }
    },

    async handleLike(id) {
        await api.articles.toggleLike(id, App.user.id);
        Pages.ArticleView(id); // Reload
    },

    async handleComment(id) {
        const content = document.getElementById('comment-input').value;
        if (!content.trim()) return;
        await api.comments.create({ article_id: id, user_id: App.user.id, content });
        Pages.ArticleView(id);
    },

    async handleDeleteArticle(id) {
        if (confirm('确定要删除吗？')) {
            await api.articles.delete(id);
            Router.navigate('/');
        }
    },

    async Editor(id) {
        if (!App.user) return Router.navigate('login');
        
        let article = { title: '', content: '', tags: '' };
        if (id) {
            article = await api.articles.getById(id);
            article.tags = article.tags.join(', ');
        }

        document.getElementById('root').innerHTML = `
            <div class="container" style="max-width:800px">
                <div class="card p-8">
                    <h2 class="text-2xl font-bold mb-6">${id ? '编辑文章' : '发布新帖'}</h2>
                    <input type="text" id="title" class="input text-2xl font-bold mb-4 border-none px-0" placeholder="文章标题" value="${article.title}">
                    <input type="text" id="tags" class="input mb-4" placeholder="标签 (逗号分隔)" value="${article.tags}">
                    <textarea id="content" class="input mb-6 text-lg border-none px-0" style="min-height:300px;resize:none" placeholder="正文内容...">${article.content}</textarea>
                    <div class="flex justify-end gap-4">
                        <button onclick="history.back()" class="btn btn-ghost">取消</button>
                        <button onclick="Pages.saveArticle('${id || ''}')" class="btn btn-primary rounded-full px-8 py-2">保存</button>
                    </div>
                </div>
            </div>
        `;
    },

    async saveArticle(id) {
        const title = document.getElementById('title').value;
        const content = document.getElementById('content').value;
        const tags = document.getElementById('tags').value.split(',').map(t => t.trim()).filter(Boolean);
        
        try {
            if (id) {
                await api.articles.update(id, { title, content, tags });
            } else {
                await api.articles.create({ user_id: App.user.id, title, content, tags });
            }
            Router.navigate('/');
        } catch (e) {
            alert('保存失败: ' + e.message);
        }
    },

    Login() {
        document.getElementById('root').innerHTML = `
            <div class="flex justify-center items-center h-screen" style="margin-top:-64px">
                <div class="card p-8 w-full" style="max-width:400px">
                    <h2 class="text-2xl font-bold text-center mb-6">欢迎回来</h2>
                    <form onsubmit="event.preventDefault(); Pages.handleLogin()">
                        <div class="mb-4">
                            <label class="block text-sm font-medium mb-1">账号</label>
                            <input type="text" id="login-id" class="input" required>
                        </div>
                        <div class="mb-6">
                            <label class="block text-sm font-medium mb-1">密码</label>
                            <input type="password" id="login-pass" class="input" required>
                        </div>
                        <button type="submit" class="btn btn-primary w-full rounded-md py-2">登录</button>
                    </form>
                    <div class="mt-4 text-center text-sm">
                        <a href="#register" class="text-brand-600">没有账号？去注册</a>
                    </div>
                    <div class="mt-4 p-2 bg-slate-100 text-xs text-slate-500 rounded">
                        演示账号: admin / 123456
                    </div>
                </div>
            </div>
        `;
    },

    async handleLogin() {
        const id = document.getElementById('login-id').value;
        const pass = document.getElementById('login-pass').value;
        try {
            const user = await api.users.login(id, pass);
            App.login(user);
        } catch (e) {
            alert(e.message);
        }
    },

    Register() {
        document.getElementById('root').innerHTML = `
            <div class="flex justify-center items-center h-screen" style="margin-top:-64px">
                <div class="card p-8 w-full" style="max-width:400px">
                    <h2 class="text-2xl font-bold text-center mb-6">创建账号</h2>
                    <form onsubmit="event.preventDefault(); Pages.handleRegister()">
                        <div class="mb-4">
                            <label class="block text-sm font-medium mb-1">用户名</label>
                            <input type="text" id="reg-name" class="input" required>
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium mb-1">邮箱</label>
                            <input type="email" id="reg-email" class="input" required>
                        </div>
                        <div class="mb-6">
                            <label class="block text-sm font-medium mb-1">密码</label>
                            <input type="password" id="reg-pass" class="input" required>
                        </div>
                        <button type="submit" class="btn btn-primary w-full rounded-md py-2">注册</button>
                    </form>
                    <div class="mt-4 text-center text-sm">
                        <a href="#login" class="text-brand-600">已有账号？去登录</a>
                    </div>
                </div>
            </div>
        `;
    },

    async handleRegister() {
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const pass = document.getElementById('reg-pass').value;
        try {
            const user = await api.users.register(name, email, pass);
            App.login(user);
        } catch (e) {
            alert(e.message);
        }
    },

    async Admin() {
        if (!App.user || (App.user.role !== 'admin' && App.user.role !== 'manager')) return Router.navigate('/');
        
        const root = document.getElementById('root');
        root.innerHTML = '<div class="text-center p-8">加载数据...</div>';

        const users = await api.users.getAll();
        const articles = await api.articles.getAll();

        root.innerHTML = `
            <div class="container grid grid-cols-2 gap-8">
                <div class="card p-6">
                    <h2 class="font-bold text-xl mb-4">用户管理</h2>
                    <div style="max-height:500px;overflow-y:auto">
                        ${users.map(u => `
                            <div class="flex justify-between items-center py-2 border-b">
                                <div>
                                    <div class="font-medium">${u.username} <span class="text-xs bg-slate-100 px-1 rounded">${u.role}</span></div>
                                    <div class="text-xs text-slate-500">${u.email}</div>
                                </div>
                                <div class="flex gap-2">
                                    ${App.user.role === 'admin' && u.role !== 'admin' ? `
                                        <button onclick="Pages.changeRole(${u.id}, '${u.role === 'user' ? 'manager' : 'user'}')" class="btn btn-ghost text-xs">
                                            ${u.role === 'user' ? '提权' : '降权'}
                                        </button>
                                        <button onclick="Pages.deleteUser(${u.id})" class="btn btn-ghost text-red-500 text-xs">删除</button>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="card p-6">
                    <h2 class="font-bold text-xl mb-4">文章管理</h2>
                    <div style="max-height:500px;overflow-y:auto">
                        ${articles.map(a => `
                            <div class="flex justify-between items-center py-2 border-b">
                                <div class="truncate w-64">${a.title}</div>
                                <button onclick="Pages.deleteArticle(${a.id})" class="btn btn-ghost text-red-500 text-xs">删除</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    async changeRole(id, role) {
        await api.users.updateRole(id, role);
        Pages.Admin();
    },

    async deleteUser(id) {
        if (confirm('确定删除用户？')) {
            await api.users.delete(id);
            Pages.Admin();
        }
    },
    
    async deleteArticle(id) {
        if (confirm('确定删除文章？')) {
            await api.articles.delete(id);
            Pages.Admin();
        }
    }
};

window.App = App;
window.Router = Router;
window.Pages = Pages;

// Start
App.init();
