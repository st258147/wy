import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/mockApi';
import { Article } from '../types';
import { Search, Hash, Clock, MessageSquare, Heart, Eye, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Home: React.FC = () => {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'following'>('all');

  const fetchArticles = async () => {
    setLoading(true);
    try {
      let data = [];
      if (activeTab === 'following' && user) {
        data = await api.articles.getFeed(user.id);
        // Apply search/tag filtering client-side for feed for simplicity
        if (tag) data = data.filter(a => a.tags.includes(tag));
        if (search) {
          const lower = search.toLowerCase();
          data = data.filter(a => 
            a.title.toLowerCase().includes(lower) || 
            a.content.toLowerCase().includes(lower) ||
            a.tags.some(t => t.toLowerCase().includes(lower))
          );
        }
      } else {
        data = await api.articles.getAll(search, tag);
      }
      setArticles(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [search, tag, activeTab, user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchArticles();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 px-4 sm:px-0">
      {/* 侧边栏/搜索栏：移动端显示在最上方 (order-1)，桌面端显示在右侧 (lg:order-2) */}
      <div className="space-y-6 order-1 lg:order-2">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 sticky top-24">
          <h3 className="text-lg font-bold text-slate-800 mb-4">搜索</h3>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="关键词或标签..."
                className="w-full pl-10 pr-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder-slate-400"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
            </div>
            <button type="submit" className="w-full bg-brand-600 text-white py-2 rounded-md font-medium hover:bg-brand-700 transition-colors">
              搜索
            </button>
          </form>

          <div className="mt-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4">热门标签</h3>
            <div className="flex flex-wrap gap-2">
              {['综合', '数学', '科学', '活动', '编程', '求助'].map(t => (
                <button
                  key={t}
                  onClick={() => setTag(t)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${tag === t ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  #{t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 文章列表：移动端显示在下方 (order-2)，桌面端显示在左侧 (lg:order-1) */}
      <div className="lg:col-span-3 space-y-6 order-2 lg:order-1">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
           <div className="flex items-center justify-between mb-2">
               <h1 className="text-2xl font-bold text-slate-800">最新动态</h1>
               {tag && (
                <button onClick={() => setTag('')} className="text-sm text-red-500 hover:underline flex items-center gap-1">
                    清除标签: #{tag}
                </button>
                )}
           </div>
           
           <div className="flex gap-4 border-b border-slate-100">
             <button 
               onClick={() => setActiveTab('all')}
               className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'all' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
             >
               全部
             </button>
             {user && (
               <button 
                 onClick={() => setActiveTab('following')}
                 className={`pb-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${activeTab === 'following' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
               >
                 <Users className="w-3 h-3" />
                 关注
               </button>
             )}
           </div>
        </div>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-slate-200 rounded-lg"></div>
            ))}
          </div>
        ) : articles.length > 0 ? (
          articles.map(article => (
            <div key={article.id} className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                <Link 
                  to={`/user/${article.user_id}`} 
                  onClick={(e) => e.stopPropagation()} 
                  className="font-medium text-brand-600 hover:underline z-10"
                >
                  @{article.author?.username}
                </Link>
                <span>•</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(article.created_at).toLocaleDateString()}</span>
              </div>
              <Link to={`/article/${article.id}`} className="block">
                <h2 className="text-xl font-bold text-slate-900 mb-2 hover:text-brand-600 transition-colors">{article.title}</h2>
                <p className="text-slate-600 line-clamp-2 mb-4">{article.content}</p>
              </Link>
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2">
                  {article.tags.map(t => (
                    <button key={t} onClick={() => setTag(t)} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full hover:bg-slate-200 flex items-center gap-1">
                      <Hash className="w-3 h-3" /> {t}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {article.views}</span>
                  <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> {article.likes_count}</span>
                  <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4" /> {article.comments_count}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-slate-500 bg-white rounded-lg">
            {activeTab === 'following' ? '你关注的人还没有发布新内容。' : '暂无文章，快来抢沙发吧！'}
          </div>
        )}
      </div>
    </div>
  );
};