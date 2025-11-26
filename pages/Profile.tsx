import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/mockApi';
import { Article, Comment, User } from '../types';
import { FileText, MessageSquare, Clock, Eye, Heart, Fingerprint, UserPlus, UserCheck, Users, X } from 'lucide-react';

interface CommentWithTitle extends Comment {
  article_title?: string;
}

interface UserStats {
  articleCount: number;
  totalLikes: number;
  followingCount: number;
  followersCount: number;
}

export const Profile: React.FC = () => {
  const { user: currentUser, login } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isMe, setIsMe] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data states
  const [bio, setBio] = useState('');
  const [msg, setMsg] = useState('');
  const [myArticles, setMyArticles] = useState<Article[]>([]);
  const [myComments, setMyComments] = useState<CommentWithTitle[]>([]);
  const [stats, setStats] = useState<UserStats>({ articleCount: 0, totalLikes: 0, followingCount: 0, followersCount: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  
  // UI States
  const [activeTab, setActiveTab] = useState<'articles' | 'comments' | 'info'>('articles');
  
  // Modal States
  const [modalType, setModalType] = useState<'followers' | 'following' | null>(null);
  const [userList, setUserList] = useState<User[]>([]);

  useEffect(() => {
    loadProfile();
  }, [id, currentUser]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      let targetUser: User | null = null;

      if (id) {
        // Viewing someone by ID
        targetUser = await api.users.getById(parseInt(id));
      } else {
        // Viewing own profile via /profile route
        targetUser = currentUser;
      }

      if (!targetUser) {
        if (!currentUser && !id) {
            navigate('/login');
            return;
        }
        setProfileUser(null);
        return;
      }

      setProfileUser(targetUser);
      setIsMe(currentUser?.id === targetUser.id);
      setBio(targetUser.bio || '');

      // Load Articles
      const articles = await api.articles.getByAuthorId(targetUser.id);
      setMyArticles(articles);

      // Load Comments (Show comments if it's me, or if we decide to show public comments later)
      // For now, let's allow seeing everyone's comments as per forum standard
      const comments = await api.comments.getUserComments(targetUser.id);
      setMyComments(comments);

      // Load Stats
      const s = await api.users.getStats(targetUser.id);
      setStats(s);

      // Check Follow Status
      if (currentUser && currentUser.id !== targetUser.id) {
        const following = await api.follows.checkIsFollowing(currentUser.id, targetUser.id);
        setIsFollowing(following);
      }

      // Set default tab logic: If me -> info, else -> articles
      if (!id && activeTab === 'articles') setActiveTab('info');

    } catch (e) {
      console.error(e);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileUser) return;
    try {
      const updated = await api.users.updateProfile(profileUser.id, { bio });
      if (isMe) login(updated); 
      setMsg('个人资料更新成功！');
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      setMsg('更新失败');
    }
  };

  const handleToggleFollow = async () => {
    if (!currentUser || !profileUser) return;
    try {
      const result = await api.follows.toggle(currentUser.id, profileUser.id);
      setIsFollowing(result);
      setStats(prev => ({
        ...prev,
        followersCount: prev.followersCount + (result ? 1 : -1)
      }));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const openUserList = async (type: 'followers' | 'following') => {
    if (!profileUser) return;
    setModalType(type);
    setUserList([]); // Clear previous
    try {
      let users = [];
      if (type === 'followers') {
        users = await api.follows.getFollowers(profileUser.id);
      } else {
        users = await api.follows.getFollowing(profileUser.id);
      }
      setUserList(users);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="text-center p-8">加载中...</div>;
  if (!profileUser) return <div className="text-center p-8">用户不存在</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      {/* Profile Header Card */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-brand-600 h-32"></div>
        <div className="px-8 pb-8">
          <div className="flex justify-between items-end -mt-12 mb-6">
             <div className="relative">
                <div className="h-32 w-32 rounded-full border-4 border-white bg-slate-200 flex items-center justify-center text-4xl font-bold text-slate-500">
                   {profileUser.avatar_url ? (
                      <img src={profileUser.avatar_url} alt="" className="h-full w-full rounded-full object-cover"/>
                   ) : (
                      profileUser.username.charAt(0).toUpperCase()
                   )}
                </div>
             </div>
             
             {/* Action Buttons */}
             <div className="mb-4">
               {isMe ? (
                 <button 
                   onClick={() => setActiveTab('info')}
                   className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-full text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
                 >
                   编辑资料
                 </button>
               ) : (
                 currentUser ? (
                    <button 
                      onClick={handleToggleFollow}
                      className={`px-6 py-2 rounded-full text-sm font-medium transition-colors shadow-sm flex items-center gap-2 ${isFollowing 
                        ? 'bg-white border border-slate-300 text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200' 
                        : 'bg-brand-600 text-white hover:bg-brand-700'}`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-4 h-4" />
                          已关注
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          关注
                        </>
                      )}
                    </button>
                 ) : null
               )}
             </div>
          </div>
          
          <div>
              <div className="flex items-center gap-3 mb-2">
                 <h1 className="text-2xl font-bold text-slate-900">{profileUser.username}</h1>
                 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200" title="用户UID">
                    <Fingerprint className="w-3 h-3" />
                    UID: {profileUser.uid}
                 </span>
                 <span className={`px-2 py-0.5 rounded text-xs font-medium border uppercase tracking-wider
                    ${profileUser.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                      profileUser.role === 'manager' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                      'bg-slate-50 text-slate-600 border-slate-200'}`}>
                    {profileUser.role}
                 </span>
              </div>
              
              {/* Stats Row */}
              <div className="flex items-center gap-6 mb-4 text-sm">
                 <button onClick={() => openUserList('following')} className="hover:text-brand-600 transition-colors cursor-pointer">
                    <span className="font-bold text-slate-900">{stats.followingCount}</span> <span className="text-slate-500">关注</span>
                 </button>
                 <button onClick={() => openUserList('followers')} className="hover:text-brand-600 transition-colors cursor-pointer">
                    <span className="font-bold text-slate-900">{stats.followersCount}</span> <span className="text-slate-500">粉丝</span>
                 </button>
                 <div>
                    <span className="font-bold text-slate-900">{stats.totalLikes}</span> <span className="text-slate-500">获赞</span>
                 </div>
              </div>

              {profileUser.bio && (
                 <p className="text-slate-600 max-w-2xl">{profileUser.bio}</p>
              )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <button 
          onClick={() => setActiveTab('articles')}
          className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'articles' ? 'border-brand-600 text-brand-600 bg-brand-50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
        >
          文章 ({myArticles.length})
        </button>
        <button 
          onClick={() => setActiveTab('comments')}
          className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'comments' ? 'border-brand-600 text-brand-600 bg-brand-50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
        >
          评论 ({myComments.length})
        </button>
        {isMe && (
          <button 
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info' ? 'border-brand-600 text-brand-600 bg-brand-50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            编辑资料
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 min-h-[300px]">
        
        {/* Articles Tab */}
        {activeTab === 'articles' && (
          <div className="space-y-4">
            {myArticles.length > 0 ? (
              myArticles.map(article => (
                <div key={article.id} className="p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <Link to={`/article/${article.id}`} className="block flex-grow">
                      <h3 className="font-bold text-lg text-slate-800 mb-1 hover:text-brand-600">{article.title}</h3>
                      <p className="text-slate-500 text-sm line-clamp-1 mb-2">{article.content}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                         <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {new Date(article.created_at).toLocaleDateString()}</span>
                         <span className="flex items-center gap-1"><Eye className="w-3 h-3"/> {article.views}</span>
                         <span className="flex items-center gap-1"><Heart className="w-3 h-3"/> {article.likes_count}</span>
                         <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3"/> {article.comments_count}</span>
                      </div>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>暂无文章。</p>
              </div>
            )}
          </div>
        )}

        {/* Comments Tab */}
        {activeTab === 'comments' && (
          <div className="space-y-4">
             {myComments.length > 0 ? (
              myComments.map(comment => (
                <div key={comment.id} className="p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                  <p className="text-slate-800 mb-2">{comment.content}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2 mt-2">
                     <span className="flex items-center gap-1">
                        评论于: <Link to={`/article/${comment.article_id}`} className="text-brand-600 hover:underline">{comment.article_title}</Link>
                     </span>
                     <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>暂无评论。</p>
              </div>
            )}
          </div>
        )}

        {/* Edit Info Tab */}
        {activeTab === 'info' && isMe && (
          <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
            <h2 className="text-lg font-bold text-slate-800 mb-4">个人信息</h2>
            {msg && <p className={`text-sm ${msg.includes('失败') ? 'text-red-600' : 'text-green-600'}`}>{msg}</p>}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">个人简介</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 h-32 placeholder-slate-400"
                placeholder="介绍一下你自己..."
              />
            </div>
            
            <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded-md hover:bg-brand-700">
              保存修改
            </button>
          </form>
        )}

      </div>

      {/* User List Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
               <h3 className="font-bold text-lg text-slate-800">
                 {modalType === 'following' ? '关注列表' : '粉丝列表'}
               </h3>
               <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600">
                 <X className="w-5 h-5" />
               </button>
            </div>
            <div className="overflow-y-auto p-2 flex-grow">
               {userList.length > 0 ? (
                 userList.map(u => (
                   <Link 
                     key={u.id} 
                     to={`/user/${u.id}`} 
                     onClick={() => setModalType(null)}
                     className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors"
                   >
                      <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{u.username}</div>
                        <div className="text-xs text-slate-500">UID: {u.uid}</div>
                      </div>
                   </Link>
                 ))
               ) : (
                 <div className="p-8 text-center text-slate-500 text-sm">
                   暂无用户
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};