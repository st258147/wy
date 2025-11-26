import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/mockApi';
import { User, Article } from '../types';
import { Trash, Ban, Search, Shield, ShieldAlert, ArrowUpCircle, ArrowDownCircle, Fingerprint } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Admin: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  
  // Search states
  const [userSearch, setUserSearch] = useState('');
  const [articleSearch, setArticleSearch] = useState('');

  useEffect(() => {
    // Both admin and manager can access this page
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      navigate('/');
      return;
    }
    
    loadData();
  }, [user, navigate]);

  const loadData = () => {
    Promise.all([
      api.users.getAll(),
      api.articles.getAll()
    ]).then(([u, a]) => {
      setUsers(u);
      setArticles(a);
    });
  };

  const handleDeleteUser = async (id: number) => {
    if (window.confirm('确定删除该用户？操作不可撤销。')) {
      await api.users.delete(id);
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const handleDeleteArticle = async (id: number) => {
     if (window.confirm('确定删除该文章？')) {
      await api.articles.delete(id);
      setArticles(articles.filter(a => a.id !== id));
    }
  };

  const handleRoleChange = async (userId: number, newRole: 'user' | 'manager') => {
    try {
      await api.users.updateRole(userId, newRole);
      // Refresh local state
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (e: any) {
      alert(e.message || '权限修改失败');
    }
  };

  // Filter Logic
  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.uid && u.uid.includes(userSearch))
  );

  const filteredArticles = articles.filter(a => 
    a.title.toLowerCase().includes(articleSearch.toLowerCase()) ||
    (a.author?.username || '').toLowerCase().includes(articleSearch.toLowerCase()) ||
    a.tags.some(t => t.toLowerCase().includes(articleSearch.toLowerCase()))
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-800">管理后台</h1>
        <div className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-sm font-medium flex items-center gap-2">
          {user?.role === 'admin' ? <ShieldAlert className="w-4 h-4"/> : <Shield className="w-4 h-4"/>}
          当前权限: {user?.role === 'admin' ? '系统管理员' : '管理者'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Management */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col h-[600px]">
          <h2 className="text-xl font-bold mb-4 flex items-center justify-between flex-shrink-0">
            <span>用户管理</span>
            <span className="text-sm font-normal bg-slate-100 px-2 py-1 rounded text-slate-500">{filteredUsers.length} 位用户</span>
          </h2>
          
          <div className="relative mb-4 flex-shrink-0">
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="搜索 UID, 用户名或邮箱..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          </div>

          <div className="overflow-auto flex-grow pr-1">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                <tr className="bg-slate-50 text-left text-slate-500">
                  <th className="p-3 font-medium rounded-tl-lg">用户 / UID</th>
                  <th className="p-3 font-medium">角色</th>
                  <th className="p-3 font-medium text-right rounded-tr-lg">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <div className="font-medium text-slate-900">{u.username}</div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200" title="用户UID">
                          UID: {u.uid}
                        </span>
                        <div className="text-xs text-slate-500 truncate max-w-[120px]" title={u.email}>{u.email}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border
                        ${u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                          u.role === 'manager' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                          'bg-slate-50 text-slate-600 border-slate-200'}`}>
                        {u.role === 'admin' ? '管理员' : u.role === 'manager' ? '管理者' : '用户'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        {/* Role Management: Only Admin can change roles */}
                        {user?.role === 'admin' && u.role !== 'admin' && (
                          <>
                            {u.role === 'user' && (
                              <button 
                                type="button"
                                onClick={() => handleRoleChange(u.id, 'manager')}
                                className="text-orange-600 hover:bg-orange-50 p-1.5 rounded transition-colors"
                                title="提升为管理者"
                              >
                                <ArrowUpCircle className="w-4 h-4" />
                              </button>
                            )}
                            {u.role === 'manager' && (
                              <button 
                                type="button"
                                onClick={() => handleRoleChange(u.id, 'user')}
                                className="text-slate-500 hover:bg-slate-100 p-1.5 rounded transition-colors"
                                title="降级为普通用户"
                              >
                                <ArrowDownCircle className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}

                        {/* Delete User: Admin can delete anyone (except admins), Manager can delete Users */}
                        {u.role !== 'admin' && (
                          <button 
                            type="button"
                            onClick={() => handleDeleteUser(u.id)} 
                            className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors" 
                            title="删除账号"
                            disabled={user?.role === 'manager' && u.role === 'manager'} // Manager cannot delete another Manager
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-slate-500">无匹配用户</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Article Management */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col h-[600px]">
          <h2 className="text-xl font-bold mb-4 flex items-center justify-between flex-shrink-0">
            <span>文章管理</span>
            <span className="text-sm font-normal bg-slate-100 px-2 py-1 rounded text-slate-500">{filteredArticles.length} 篇帖子</span>
          </h2>

          <div className="relative mb-4 flex-shrink-0">
            <input
              type="text"
              value={articleSearch}
              onChange={(e) => setArticleSearch(e.target.value)}
              placeholder="搜索标题、作者或标签..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          </div>

           <div className="overflow-auto flex-grow pr-1">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                <tr className="bg-slate-50 text-left text-slate-500">
                  <th className="p-3 font-medium rounded-tl-lg">文章信息</th>
                  <th className="p-3 font-medium text-right rounded-tr-lg">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredArticles.map(a => (
                  <tr key={a.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <div className="font-medium text-slate-900 line-clamp-1" title={a.title}>{a.title}</div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <span>@{a.author?.username || '未知'}</span>
                        <span>•</span>
                        <span>{new Date(a.created_at).toLocaleDateString()}</span>
                        {a.tags.length > 0 && (
                           <span className="ml-1 text-[10px] text-slate-400">[{a.tags.join(', ')}]</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right align-middle">
                      <button 
                        type="button"
                        onClick={() => handleDeleteArticle(a.id)} 
                        className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors inline-flex items-center gap-1"
                        title="删除文章"
                      >
                         <Trash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                 {filteredArticles.length === 0 && (
                  <tr>
                    <td colSpan={2} className="p-4 text-center text-slate-500">无匹配文章</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};