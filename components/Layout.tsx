import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, PlusCircle, Shield, Menu, X, GraduationCap, Settings, ChevronDown } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const canAccessAdmin = user?.role === 'admin' || user?.role === 'manager';

  // Helper for role badge in dropdown
  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'admin': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">管理员</span>;
      case 'manager': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200">管理者</span>;
      default: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">学生</span>;
    }
  };

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
                    <PlusCircle className="h-4 w-4" />
                    <span>发布帖子</span>
                  </Link>
                  
                  {canAccessAdmin && (
                     <Link to="/admin" className="text-slate-600 hover:text-brand-600 p-2 transition-colors" title="管理后台">
                       <Shield className="h-5 w-5" />
                     </Link>
                  )}

                  {/* Enhanced Dropdown */}
                  <div className="relative ml-3 group">
                    <button className="flex items-center gap-2 max-w-xs bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 p-1 pr-2 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
                      {user.avatar_url ? (
                        <img className="h-8 w-8 rounded-full object-cover shadow-sm" src={user.avatar_url} alt="" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shadow-sm">
                          <UserIcon className="h-5 w-5" />
                        </div>
                      )}
                      <span className="text-sm font-medium text-slate-700 max-w-[100px] truncate">{user.username}</span>
                      <ChevronDown className="h-3 w-3 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 group-hover:rotate-180" />
                    </button>
                    
                    {/* Invisible bridge to prevent menu from closing when moving mouse */}
                    <div className="absolute right-0 top-full h-3 w-full bg-transparent"></div>

                    {/* Dropdown Menu */}
                    <div className="origin-top-right absolute right-0 mt-3 w-72 rounded-xl shadow-2xl bg-white ring-1 ring-black ring-opacity-5 focus:outline-none invisible opacity-0 translate-y-2 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 ease-out z-50 overflow-hidden">
                      
                      {/* User Info Header */}
                      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-4">
                           <div className="h-12 w-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-lg font-bold shadow-inner">
                              {user.avatar_url ? (
                                <img className="h-12 w-12 rounded-full object-cover" src={user.avatar_url} alt="" />
                              ) : (
                                user.username.charAt(0).toUpperCase()
                              )}
                           </div>
                           <div className="overflow-hidden">
                             <div className="font-bold text-slate-900 truncate text-base">{user.username}</div>
                             <div className="text-xs text-slate-500 truncate mb-1">{user.email}</div>
                             {getRoleBadge(user.role)}
                           </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <Link to={`/user/${user.id}`} className="flex items-center gap-3 px-6 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-colors">
                          <UserIcon className="h-4 w-4" />
                          个人中心
                        </Link>
                        {canAccessAdmin && (
                           <Link to="/admin" className="flex items-center gap-3 px-6 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-colors">
                            <Shield className="h-4 w-4" />
                            管理后台
                          </Link>
                        )}
                        <div className="border-t border-slate-100 my-1"></div>
                        <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-6 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors">
                          <LogOut className="h-4 w-4" />
                          退出登录
                        </button>
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
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="bg-white p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none transition-colors">
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="sm:hidden border-t border-slate-200 bg-white">
            <div className="pt-2 pb-3 space-y-1">
              <Link to="/" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-slate-600 hover:bg-slate-50 hover:border-brand-300 hover:text-brand-700">首页</Link>
              {user ? (
                <>
                  <Link to="/create" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-slate-600 hover:bg-slate-50 hover:border-brand-300 hover:text-brand-700">发布帖子</Link>
                  <Link to={`/user/${user.id}`} className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-slate-600 hover:bg-slate-50 hover:border-brand-300 hover:text-brand-700">个人中心</Link>
                  {canAccessAdmin && (
                     <Link to="/admin" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-slate-600 hover:bg-slate-50 hover:border-brand-300 hover:text-brand-700">管理后台</Link>
                  )}
                  <button onClick={handleLogout} className="w-full text-left block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-red-600 hover:bg-slate-50 hover:border-red-300">退出登录</button>
                </>
              ) : (
                 <>
                  <Link to="/login" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-slate-600 hover:bg-slate-50 hover:border-brand-300 hover:text-brand-700">登录</Link>
                  <Link to="/register" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-slate-600 hover:bg-slate-50 hover:border-brand-300 hover:text-brand-700">注册</Link>
                 </>
              )}
            </div>
          </div>
        )}
      </header>
      <main className="flex-grow bg-slate-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
           {children}
        </div>
      </main>
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} 校园论坛. 用于教学演示。
        </div>
      </footer>
    </div>
  );
};