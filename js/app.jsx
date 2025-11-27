
const { useState, useEffect, createContext, useContext } = React;
const { HashRouter, Routes, Route, Navigate, Link, useNavigate, useParams } = ReactRouterDOM;
const { 
  LogOut, User, PlusCircle, Shield, Menu, X, GraduationCap, Settings, ChevronDown,
  Search, Hash, Clock, MessageSquare, Heart, Eye, Users, Trash2, Edit, Save,
  ArrowLeft, Bold, Italic, Quote, List, Image: ImageIcon, Link: LinkIcon,
  Fingerprint, UserPlus, UserCheck, ShieldAlert, Trash, Ban, ArrowUpCircle, ArrowDownCircle
} = LucideReact;

// --- API Service ---
// 指向您的 PHP 接口文件
const API_URL = './api/index.php';

const api = {
  request: async (action, method = 'GET', data = null, params = {}) => {
    let url = `${API_URL}?action=${action}`;
    Object.keys(params).forEach(key => url += `&${key}=${params[key]}`);
    
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (data) options.body = JSON.stringify(data);
    
    const res = await fetch(url, options);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Request failed');
    return json;
  },
  
  users: {
    login: (identifier, password) => api.request('login', 'POST', { identifier, password }),
    register: (username, email, password) => api.request('register', 'POST', { username, email, password }),
    getById: (id) => api.request('users', 'GET', null, { id }),
    updateProfile: (id, data) => api.request('users', 'PUT', data, { id }),
    updateRole: (id, role) => api.request('users', 'PUT', { role }, { id }),
    getAll: () => api.request('users', 'GET'),
    delete: (id) => api.request('users', 'DELETE', null, { id }),
    getStats: (userId) => api.request('stats', 'GET', null, { user_id: userId }),
  },
  articles: {
    getAll: async (search = '', tag = '') => {
        let articles = await api.request('articles', 'GET');
        if (tag) articles = articles.filter(a => a.tags && a.tags.includes(tag));
        if (search) {
            const lower = search.toLowerCase();
            articles = articles.filter(a => 
                a.title.toLowerCase().includes(lower) || 
                a.content.toLowerCase().includes(lower) ||
                (a.tags && a.tags.some(t => t.toLowerCase().includes(lower)))
            );
        }
        return articles;
    },
    getFeed: (userId) => api.request('articles', 'GET', null, { feed_for: userId }),
    getByAuthorId: (userId) => api.request('articles', 'GET', null, { user_id: userId }),
    getById: (id, currentUserId) => api.request('articles', 'GET', null, { id, current_user_id: currentUserId }),
    create: (data) => api.request('articles', 'POST', data),
    update: (id, data) => api.request('articles', 'PUT', data, { id }),
    delete: (id) => api.request('articles', 'DELETE', null, { id }),
    toggleLike: (articleId, userId) => api.request('likes', 'POST', { article_id: articleId, user_id: userId }),
  },
  comments: {
    getByArticleId: (articleId) => api.request('comments', 'GET', null, { article_id: articleId }),
    getUserComments: (userId) => api.request('comments', 'GET', null, { user_id: userId }),
    create: (data) => api.request('comments', 'POST', data),
    update: (id, content) => api.request('comments', 'PUT', { content }, { id }),
    delete: (id) => api.request('comments', 'DELETE', null, { id }),
  },
  follows: {
    toggle: (followerId, followingId) => api.request('follows', 'POST', { follower_id: followerId, following_id: followingId }),
    checkIsFollowing: (followerId, followingId) => api.request('follows', 'GET', null, { type: 'check', user_id: followerId, target_id: followingId }).then(r => r.isFollowing),
    getFollowers: (userId) => api.request('follows', 'GET', null, { type: 'followers', user_id: userId }),
    getFollowing: (userId) => api.request('follows', 'GET', null, { type: 'following', user_id: userId }),
  }
};

// --- Auth Context ---
const AuthContext = createContext();
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('session_user');
    if (stored) setUser(JSON.parse(stored));
    setIsLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('session_user', JSON.stringify(userData));
  };
  const logout = () => {
    setUser(null);
    localStorage.removeItem('session_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
const useAuth = () => useContext(AuthContext);

// --- Layout Component ---
const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const canAccessAdmin = user?.role === 'admin' || user?.role === 'manager';

  const getRoleBadge = (role) => {
    if (role === 'admin') return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">管理员</span>;
    if (role === 'manager') return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200">管理者</span>;
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">学生</span>;
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex-shrink-0 flex items-center gap-2 text-brand-600 hover:opacity-80">
                <GraduationCap className="h-8 w-8" />
                <span className="font-bold text-xl tracking-tight">校园论坛</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
              <Link to="/" className="text-slate-600 hover:text-brand-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">首页</Link>
              {user ? (
                <>
                  <Link to="/create" className="flex items-center gap-1 bg-brand-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm hover:shadow">
                    <PlusCircle className="h-4 w-4" /> <span>发布帖子</span>
                  </Link>
                  {canAccessAdmin && (
                     <Link to="/admin" className="text-slate-600 hover:text-brand-600 p-2 transition-colors" title="管理后台"><Shield className="h-5 w-5" /></Link>
                  )}
                  <div className="relative ml-3 group">
                    <button className="flex items-center gap-2 max-w-xs bg-white rounded-full p-1 pr-2 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
                      <div className="h-8 w-8 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shadow-sm">
                          {user.avatar_url ? <img className="h-full w-full rounded-full object-cover" src={user.avatar_url} /> : <User className="h-5 w-5" />}
                      </div>
                      <span className="text-sm font-medium text-slate-700 max-w-[100px] truncate">{user.username}</span>
                      <ChevronDown className="h-3 w-3 text-slate-400 group-hover:rotate-180 transition-transform" />
                    </button>
                    <div className="absolute right-0 top-full h-3 w-full bg-transparent"></div>
                    <div className="origin-top-right absolute right-0 mt-3 w-72 rounded-xl shadow-2xl bg-white ring-1 ring-black ring-opacity-5 invisible opacity-0 translate-y-2 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all z-50 overflow-hidden">
                      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-4">
                           <div className="h-12 w-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-lg font-bold shadow-inner">
                              {user.avatar_url ? <img className="h-full w-full rounded-full object-cover" src={user.avatar_url} /> : user.username.charAt(0).toUpperCase()}
                           </div>
                           <div className="overflow-hidden">
                             <div className="font-bold text-slate-900 truncate text-base">{user.username}</div>
                             <div className="text-xs text-slate-500 truncate mb-1">{user.email}</div>
                             {getRoleBadge(user.role)}
                           </div>
                        </div>
                      </div>
                      <div className="py-2">
                        <Link to={`/user/${user.id}`} className="flex items-center gap-3 px-6 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-colors"><User className="h-4 w-4" /> 个人中心</Link>
                        {canAccessAdmin && <Link to="/admin" className="flex items-center gap-3 px-6 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-colors"><Shield className="h-4 w-4" /> 管理后台</Link>}
                        <div className="border-t border-slate-100 my-1"></div>
                        <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-6 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"><LogOut className="h-4 w-4" /> 退出登录</button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex space-x-2">
                   <Link to="/login" className="text-brand-600 hover:text-brand-800 px-3 py-2 rounded-md text-sm font-medium transition-colors">登录</Link>
                   <Link to="/register" className="bg-brand-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-brand-700 shadow-sm transition-colors">注册</Link>
                </div>
              )}
            </div>
            <div className="-mr-2 flex items-center sm:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="bg-white p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100"><Menu className="h-6 w-6" /></button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-grow bg-slate-50"><div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</div></main>
      <footer className="bg-white border-t border-slate-200 py-6"><div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">&copy; {new Date().getFullYear()} 校园论坛</div></footer>
    </div>
  );
};

// --- Pages ---

const Home = () => {
  const { user } = useAuth();
  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const fetchArticles = async () => {
    setLoading(true);
    try {
      let data = [];
      if (activeTab === 'following' && user) {
        data = await api.articles.getFeed(user.id);
        if (tag) data = data.filter(a => a.tags.includes(tag));
        if (search) {
          const lower = search.toLowerCase();
          data = data.filter(a => a.title.toLowerCase().includes(lower) || a.content.toLowerCase().includes(lower));
        }
      } else {
        data = await api.articles.getAll(search, tag);
      }
      setArticles(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchArticles(); }, [search, tag, activeTab, user]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 px-4 sm:px-0">
      <div className="space-y-6 order-1 lg:order-2">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 sticky top-24">
          <h3 className="text-lg font-bold text-slate-800 mb-4">搜索</h3>
          <form onSubmit={(e) => {e.preventDefault(); fetchArticles();}} className="space-y-4">
            <div className="relative">
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="关键词或标签..." className="w-full pl-10 pr-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-slate-400" />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
            </div>
            <button type="submit" className="w-full bg-brand-600 text-white py-2 rounded-md font-medium hover:bg-brand-700 transition-colors">搜索</button>
          </form>
          <div className="mt-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4">热门标签</h3>
            <div className="flex flex-wrap gap-2">
              {['综合', '数学', '科学', '活动', '编程', '求助'].map(t => (
                <button key={t} onClick={() => setTag(t)} className={`px-3 py-1 text-sm rounded-full transition-colors ${tag === t ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>#{t}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="lg:col-span-3 space-y-6 order-2 lg:order-1">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
           <div className="flex items-center justify-between mb-2">
               <h1 className="text-2xl font-bold text-slate-800">最新动态</h1>
               {tag && <button onClick={() => setTag('')} className="text-sm text-red-500 hover:underline">清除标签: #{tag}</button>}
           </div>
           <div className="flex gap-4 border-b border-slate-100">
             <button onClick={() => setActiveTab('all')} className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'all' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500'}`}>全部</button>
             {user && <button onClick={() => setActiveTab('following')} className={`pb-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${activeTab === 'following' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500'}`}><Users className="w-3 h-3" /> 关注</button>}
           </div>
        </div>
        {loading ? <div className="text-center p-8">加载中...</div> : articles.length > 0 ? articles.map(article => (
            <div key={article.id} className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                <Link to={`/user/${article.user_id}`} onClick={(e)=>e.stopPropagation()} className="font-medium text-brand-600 hover:underline">@{article.author?.username}</Link>
                <span>•</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(article.created_at).toLocaleDateString()}</span>
              </div>
              <Link to={`/article/${article.id}`} className="block">
                <h2 className="text-xl font-bold text-slate-900 mb-2 hover:text-brand-600 transition-colors">{article.title}</h2>
                <p className="text-slate-600 line-clamp-2 mb-4">{article.content}</p>
              </Link>
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2">
                  {article.tags && article.tags.map(t => (
                    <button key={t} onClick={() => setTag(t)} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full hover:bg-slate-200 flex items-center gap-1"><Hash className="w-3 h-3" /> {t}</button>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {article.views}</span>
                  <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> {article.likes_count}</span>
                  <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4" /> {article.comments_count}</span>
                </div>
              </div>
            </div>
        )) : <div className="text-center py-12 text-slate-500">暂无文章</div>}
      </div>
    </div>
  );
};

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await api.users.login(identifier, password);
      login(user); navigate('/');
    } catch (err) { setError(err.message || '登录失败'); }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <div className="bg-white p-8 rounded-lg shadow-md border border-slate-200 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">欢迎回来</h2>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">用户名或邮箱</label><input type="text" value={identifier} onChange={e=>setIdentifier(e.target.value)} className="w-full px-4 py-2 border rounded-md" required /></div>
          <div><label className="block text-sm font-medium mb-1">密码</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-md" required /></div>
          <button type="submit" className="w-full bg-brand-600 text-white py-2 rounded-md hover:bg-brand-700">登录</button>
        </form>
        <div className="mt-4 text-xs bg-blue-50 p-3 text-blue-800 rounded">初始账号: admin / 123456</div>
      </div>
    </div>
  );
};

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await api.users.register(username, email, password);
      login(user); navigate('/');
    } catch (err) { setError(err.message || '注册失败'); }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <div className="bg-white p-8 rounded-lg shadow-md border border-slate-200 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">创建账号</h2>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">用户名</label><input type="text" value={username} onChange={e=>setUsername(e.target.value)} className="w-full px-4 py-2 border rounded-md" required /></div>
          <div><label className="block text-sm font-medium mb-1">邮箱</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-md" required /></div>
          <div><label className="block text-sm font-medium mb-1">密码</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-md" required /></div>
          <button type="submit" className="w-full bg-brand-600 text-white py-2 rounded-md hover:bg-brand-700">注册</button>
        </form>
      </div>
    </div>
  );
};

const ArticleView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [article, setArticle] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => { if (id) loadData(id); }, [id, user]);

  const loadData = async (aid) => {
    try {
      const art = await api.articles.getById(aid, user?.id);
      setArticle(art);
      const comms = await api.comments.getByArticleId(aid);
      setComments(comms);
    } catch (error) { console.error(error); navigate('/'); }
  };

  const handleLike = async () => {
    if (!user || !article) return;
    const res = await api.articles.toggleLike(article.id, user.id);
    setArticle(prev => ({...prev, is_liked: res.liked, likes_count: (prev.likes_count || 0) + (res.liked ? 1 : -1)}));
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!user || !article || !newComment.trim()) return;
    await api.comments.create({ article_id: article.id, user_id: user.id, content: newComment });
    setNewComment(''); loadData(article.id);
  };

  const handleDelete = async () => {
    if(window.confirm('确定要删除?')) { await api.articles.delete(article.id); navigate('/'); }
  };

  const handleUpdateComment = async (cid) => {
    await api.comments.update(cid, editContent);
    setComments(comments.map(c => c.id === cid ? { ...c, content: editContent } : c));
    setEditingCommentId(null);
  };

  if (!article) return <div>Loading...</div>;
  const canManage = user?.id === article.user_id || user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-0">
      <article className="bg-white p-8 rounded-lg shadow-sm border border-slate-100">
        <div className="mb-6 border-b border-slate-100 pb-6">
          <div className="flex flex-wrap gap-2 mb-4">{article.tags && article.tags.map(t => <span key={t} className="px-3 py-1 bg-brand-50 text-brand-700 text-xs rounded-full">#{t}</span>)}</div>
          <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
          <div className="flex justify-between items-center">
             <Link to={`/user/${article.user_id}`} className="flex items-center gap-2">
                <div className="h-10 w-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold">{article.author?.username[0]}</div>
                <div><div className="font-bold">{article.author?.username}</div><div className="text-xs text-slate-500">{new Date(article.created_at).toLocaleString()}</div></div>
             </Link>
             {canManage && <div className="flex gap-2"><button type="button" onClick={()=>navigate(`/edit/${article.id}`)} className="text-brand-600 flex items-center gap-1"><Edit className="w-5 h-5"/> 编辑</button><button type="button" onClick={handleDelete} className="text-red-500 flex items-center gap-1"><Trash2 className="w-5 h-5"/> 删除</button></div>}
          </div>
        </div>
        <div className="prose max-w-none text-slate-700 mb-8 whitespace-pre-wrap">{article.content}</div>
        <div className="flex gap-6 pt-6 border-t border-slate-100">
          <button type="button" onClick={handleLike} disabled={!user} className={`flex gap-2 px-4 py-2 rounded-md ${article.is_liked ? 'bg-pink-100 text-pink-600' : 'bg-slate-50'}`}><ThumbsUp className="w-5 h-5" /> {article.likes_count}</button>
          <div className="flex gap-2 text-slate-500"><MessageSquare className="w-5 h-5" /> {article.comments_count}</div>
        </div>
      </article>
      <section className="bg-white p-8 rounded-lg shadow-sm border border-slate-100">
         <h3 className="font-bold text-xl mb-6">评论</h3>
         {user ? <form onSubmit={handleComment} className="mb-8"><textarea value={newComment} onChange={e=>setNewComment(e.target.value)} className="w-full p-3 border rounded-md" placeholder="发表评论..." /><button type="submit" className="mt-2 bg-brand-600 text-white px-4 py-2 rounded">发表</button></form> : <div className="text-center mb-8">请登录</div>}
         <div className="space-y-6">
            {comments.map(c => (
                <div key={c.id} className="flex gap-4">
                    <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center font-bold">{c.author?.username[0]}</div>
                    <div className="flex-grow bg-slate-50 p-4 rounded-lg relative">
                        <div className="flex justify-between mb-2"><span className="font-bold">{c.author?.username}</span><span className="text-xs text-slate-500">{new Date(c.created_at).toLocaleDateString()}</span></div>
                        {editingCommentId === c.id ? (
                            <div><textarea value={editContent} onChange={e=>setEditContent(e.target.value)} className="w-full p-2 border rounded"/><button type="button" onClick={()=>handleUpdateComment(c.id)} className="text-xs bg-brand-600 text-white px-2 py-1 rounded mt-1">保存</button></div>
                        ) : (
                            <>
                                <p>{c.content}</p>
                                {(user?.id === c.user_id || user?.role === 'admin' || user?.role === 'manager') && (
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        {user?.id === c.user_id && <button type="button" onClick={()=>{setEditingCommentId(c.id); setEditContent(c.content)}}><Edit className="w-4 h-4"/></button>}
                                        <button type="button" onClick={async ()=>{if(confirm('删除?')) {await api.comments.delete(c.id); setComments(comments.filter(x=>x.id!==c.id))}}}><Trash2 className="w-4 h-4 text-red-500"/></button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            ))}
         </div>
      </section>
    </div>
  );
};

const Editor = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  
  useEffect(() => {
    if (id && user) {
        api.articles.getById(id).then(res => {
            setTitle(res.title); setContent(res.content); setTags(res.tags.join(', '));
        });
    }
  }, [id, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tagArray = tags.split(/[,，]/).map(t => t.trim()).filter(Boolean);
    const payload = { title, content, tags: tagArray, user_id: user.id };
    if (id) await api.articles.update(id, payload);
    else await api.articles.create(payload);
    navigate('/');
  };

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="max-w-4xl mx-auto py-6">
       <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
             <input type="text" value={title} onChange={e=>setTitle(e.target.value)} className="text-4xl font-bold border-none focus:ring-0 p-0" placeholder="标题..." required />
             <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg"><Hash className="text-slate-400"/><input type="text" value={tags} onChange={e=>setTags(e.target.value)} className="bg-transparent border-none w-full focus:ring-0" placeholder="标签..." /></div>
             <textarea value={content} onChange={e=>setContent(e.target.value)} className="min-h-[400px] border-none focus:ring-0 text-lg resize-none" placeholder="正文..." required />
             <div className="flex justify-end gap-4"><button type="button" onClick={()=>navigate(-1)} className="px-4 py-2 text-slate-600">取消</button><button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-full font-bold">保存</button></div>
          </form>
       </div>
    </div>
  );
};

const Profile = () => {
    const { user: currentUser, login } = useAuth();
    const { id } = useParams();
    const [profileUser, setProfileUser] = useState(null);
    const [myArticles, setArticles] = useState([]);
    const [myComments, setComments] = useState([]);
    const [stats, setStats] = useState({});
    const [isFollowing, setIsFollowing] = useState(false);
    const [activeTab, setActiveTab] = useState('articles');
    const [bio, setBio] = useState('');

    useEffect(() => {
        const fetchP = async () => {
            let u = id ? await api.users.getById(id) : currentUser;
            if(!u) return;
            setProfileUser(u); setBio(u.bio||'');
            const [arts, coms, st, following] = await Promise.all([
                api.articles.getByAuthorId(u.id),
                api.comments.getUserComments(u.id),
                api.users.getStats(u.id),
                currentUser && currentUser.id !== u.id ? api.follows.checkIsFollowing(currentUser.id, u.id) : false
            ]);
            setArticles(arts); setComments(coms); setStats(st); setIsFollowing(following);
        };
        fetchP();
    }, [id, currentUser]);

    const handleFollow = async () => {
        const res = await api.follows.toggle(currentUser.id, profileUser.id);
        setIsFollowing(res.followed);
        setStats(p => ({...p, followersCount: p.followersCount + (res.followed ? 1 : -1)}));
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const updated = await api.users.updateProfile(profileUser.id, { bio });
        if(currentUser.id === profileUser.id) login(updated);
        alert('更新成功');
    };

    if(!profileUser) return <div>Loading...</div>;
    const isMe = currentUser?.id === profileUser.id;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-8">
                <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                        <div className="h-20 w-20 bg-brand-200 rounded-full flex items-center justify-center text-2xl font-bold text-brand-700">{profileUser.username[0]}</div>
                        <div>
                            <h1 className="text-2xl font-bold">{profileUser.username} <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">UID: {profileUser.uid}</span></h1>
                            <div className="flex gap-4 mt-2 text-sm text-slate-600"><span>关注 {stats.followingCount}</span><span>粉丝 {stats.followersCount}</span><span>获赞 {stats.totalLikes}</span></div>
                            <p className="mt-2 text-slate-600">{profileUser.bio}</p>
                        </div>
                    </div>
                    {isMe ? <button onClick={()=>setActiveTab('info')} className="border px-4 py-1 rounded-full text-sm">编辑</button> : (currentUser && <button onClick={handleFollow} className={`px-4 py-1 rounded-full text-sm ${isFollowing ? 'border' : 'bg-brand-600 text-white'}`}>{isFollowing ? '已关注' : '关注'}</button>)}
                </div>
            </div>
            <div className="flex bg-white rounded-lg border">
                {['articles', 'comments', 'info'].map(t => (
                    (!isMe && t === 'info') ? null :
                    <button key={t} onClick={()=>setActiveTab(t)} className={`flex-1 py-3 border-b-2 ${activeTab===t ? 'border-brand-600 text-brand-600' : 'border-transparent'}`}>{t==='articles'?'文章':t==='comments'?'评论':'资料'}</button>
                ))}
            </div>
            <div className="bg-white p-6 rounded-lg border min-h-[300px]">
                {activeTab === 'articles' && myArticles.map(a => <div key={a.id} className="border-b py-3"><Link to={`/article/${a.id}`} className="font-bold hover:text-brand-600">{a.title}</Link></div>)}
                {activeTab === 'comments' && myComments.map(c => <div key={c.id} className="border-b py-3"><p>{c.content}</p><div className="text-xs text-slate-400">评论于 {c.article_title}</div></div>)}
                {activeTab === 'info' && isMe && (
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <textarea value={bio} onChange={e=>setBio(e.target.value)} className="w-full border p-2 rounded" placeholder="简介..." />
                        <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded">保存</button>
                    </form>
                )}
            </div>
        </div>
    );
};

const Admin = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [articles, setArts] = useState([]);
    
    useEffect(() => {
        if(!user || (user.role!=='admin' && user.role!=='manager')) navigate('/');
        api.users.getAll().then(setUsers);
        api.articles.getAll().then(setArts);
    }, [user]);

    const delUser = async (id) => { if(confirm('删?')) { await api.users.delete(id); setUsers(users.filter(u=>u.id!==id)); }};
    const delArt = async (id) => { if(confirm('删?')) { await api.articles.delete(id); setArts(articles.filter(a=>a.id!==id)); }};
    const changeRole = async (id, role) => { await api.users.updateRole(id, role); setUsers(users.map(u=>u.id===id?{...u, role}:u)); };

    return (
        <div className="grid grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded shadow border">
                <h2 className="font-bold mb-4">用户</h2>
                <div className="space-y-2 max-h-[500px] overflow-auto">
                    {users.map(u => (
                        <div key={u.id} className="flex justify-between items-center text-sm border-b pb-2">
                            <div>{u.username} <span className="text-xs text-slate-400">{u.role}</span></div>
                            <div className="flex gap-2">
                                {user.role === 'admin' && u.role !== 'admin' && (
                                    u.role === 'user' ? <button type="button" onClick={()=>changeRole(u.id, 'manager')} className="text-orange-500"><ArrowUpCircle className="w-4 h-4"/></button> :
                                    <button type="button" onClick={()=>changeRole(u.id, 'user')} className="text-slate-500"><ArrowDownCircle className="w-4 h-4"/></button>
                                )}
                                {u.role !== 'admin' && <button type="button" onClick={()=>delUser(u.id)} className="text-red-500"><Ban className="w-4 h-4"/></button>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-white p-6 rounded shadow border">
                <h2 className="font-bold mb-4">文章</h2>
                <div className="space-y-2 max-h-[500px] overflow-auto">
                    {articles.map(a => (
                        <div key={a.id} className="flex justify-between items-center text-sm border-b pb-2">
                            <div className="truncate w-64">{a.title}</div>
                            <button type="button" onClick={()=>delArt(a.id)} className="text-red-500"><Trash className="w-4 h-4"/></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- App Entry ---
const App = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/article/:id" element={<ArticleView />} />
            <Route path="/create" element={<Editor />} />
            <Route path="/edit/:id" element={<Editor />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/user/:id" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </HashRouter>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
