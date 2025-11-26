import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/mockApi';
import { Article, Comment } from '../types';
import { useAuth } from '../context/AuthContext';
import { Clock, MessageSquare, ThumbsUp, Tag, Trash2, Edit, Save } from 'lucide-react';

export const ArticleView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit Comment State
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (id) loadData(parseInt(id));
  }, [id, user]);

  const loadData = async (articleId: number) => {
    try {
      const art = await api.articles.getById(articleId, user?.id);
      setArticle(art);
      const comms = await api.comments.getByArticleId(articleId);
      setComments(comms);
    } catch (error) {
      console.error(error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user || !article) return;
    const liked = await api.articles.toggleLike(article.id, user.id);
    setArticle(prev => prev ? {
      ...prev,
      is_liked: liked,
      likes_count: (prev.likes_count || 0) + (liked ? 1 : -1)
    } : null);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !article || !newComment.trim()) return;
    
    await api.comments.create({
      article_id: article.id,
      user_id: user.id,
      content: newComment,
      parent_id: null
    });
    setNewComment('');
    loadData(article.id); // Reload to get populated user info
  };

  const handleDelete = async () => {
    if(!article) return;
    if(window.confirm('确定要删除这篇文章吗？')) {
        try {
            await api.articles.delete(article.id);
            navigate('/');
        } catch (e) {
            console.error("Failed to delete article", e);
            alert("删除失败，请重试");
        }
    }
  }

  const handleEdit = () => {
    if(!article) return;
    navigate(`/edit/${article.id}`);
  }

  const handleDeleteComment = async (commentId: number) => {
    if (window.confirm('确定要删除这条评论吗？')) {
      try {
        await api.comments.delete(commentId);
        setComments(comments.filter(c => c.id !== commentId));
      } catch (e) {
        console.error('Failed to delete comment', e);
        alert("删除评论失败");
      }
    }
  };

  const startEditingComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEditingComment = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  const handleUpdateComment = async (commentId: number) => {
    if (!editContent.trim()) return;
    try {
      await api.comments.update(commentId, editContent);
      setComments(comments.map(c => c.id === commentId ? { ...c, content: editContent } : c));
      setEditingCommentId(null);
    } catch (e) {
      console.error('Failed to update comment', e);
    }
  };

  const canManageArticle = user?.id === article?.user_id || user?.role === 'admin' || user?.role === 'manager';

  if (loading) return <div className="p-8 text-center">加载中...</div>;
  if (!article) return <div className="p-8 text-center">文章未找到</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-0">
      <article className="bg-white p-8 rounded-lg shadow-sm border border-slate-100">
        <div className="mb-6 border-b border-slate-100 pb-6">
          <div className="flex flex-wrap gap-2 mb-4">
             {article.tags.map(t => (
               <span key={t} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand-700">
                 <Tag className="w-3 h-3" /> {t}
               </span>
             ))}
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-4">{article.title}</h1>
          <div className="flex items-center justify-between">
            <Link to={`/user/${article.user_id}`} className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold group-hover:ring-2 group-hover:ring-brand-300 transition-all">
                {article.author?.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 group-hover:text-brand-600 transition-colors">{article.author?.username}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {new Date(article.created_at).toLocaleString()}
                </p>
              </div>
            </Link>
            {canManageArticle && (
                <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={handleEdit} 
                      className="text-brand-600 hover:bg-brand-50 p-2 rounded transition-colors flex items-center gap-1 text-sm font-medium"
                      title="编辑文章"
                    >
                      <Edit className="w-5 h-5"/>
                      <span className="hidden sm:inline">编辑</span>
                    </button>
                    <button 
                      type="button"
                      onClick={handleDelete} 
                      className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors flex items-center gap-1 text-sm font-medium"
                      title="删除文章"
                    >
                      <Trash2 className="w-5 h-5"/>
                      <span className="hidden sm:inline">删除</span>
                    </button>
                </div>
            )}
          </div>
        </div>

        <div className="prose max-w-none text-slate-700 mb-8 whitespace-pre-wrap">
          {article.content}
        </div>

        <div className="flex items-center gap-6 pt-6 border-t border-slate-100">
          <button 
            type="button"
            onClick={handleLike}
            disabled={!user}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${article.is_liked ? 'bg-pink-100 text-pink-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
          >
            <ThumbsUp className={`w-5 h-5 ${article.is_liked ? 'fill-current' : ''}`} />
            <span className="font-bold">{article.likes_count}</span> 点赞
          </button>
          <div className="flex items-center gap-2 text-slate-500">
            <MessageSquare className="w-5 h-5" />
            <span className="font-bold">{article.comments_count}</span> 评论
          </div>
        </div>
      </article>

      <section className="bg-white p-8 rounded-lg shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold text-slate-900 mb-6">评论</h3>
        
        {user ? (
          <form onSubmit={handleComment} className="mb-8">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="分享你的看法..."
              className="w-full p-3 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-y min-h-[100px] placeholder-slate-400"
              required
            />
            <div className="mt-2 text-right">
              <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded-md hover:bg-brand-700 font-medium">
                发表评论
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-slate-50 p-4 rounded-md text-center text-slate-600 mb-8">
            请 <a href="/login" className="text-brand-600 underline">登录</a> 参与讨论。
          </div>
        )}

        <div className="space-y-6">
          {comments.map(comment => {
            const isAuthor = user?.id === comment.user_id;
            const canDeleteComment = isAuthor || user?.role === 'admin' || user?.role === 'manager';
            
            return (
              <div key={comment.id} className="flex gap-4 group">
                <Link to={`/user/${comment.user_id}`} className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold hover:ring-2 hover:ring-brand-300 transition-all">
                     {comment.author?.username.charAt(0).toUpperCase()}
                  </div>
                </Link>
                <div className="flex-grow">
                  <div className="bg-slate-50 p-4 rounded-lg relative">
                    <div className="flex items-center justify-between mb-2">
                      <Link to={`/user/${comment.user_id}`} className="font-bold text-sm text-slate-900 hover:text-brand-600">{comment.author?.username}</Link>
                      <span className="text-xs text-slate-500">{new Date(comment.created_at).toLocaleDateString()}</span>
                    </div>

                    {editingCommentId === comment.id ? (
                      <div className="space-y-2">
                        <textarea 
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full p-2 text-sm bg-white border border-slate-300 rounded focus:ring-1 focus:ring-brand-500 outline-none"
                          rows={3}
                        />
                        <div className="flex justify-end gap-2">
                          <button 
                            type="button"
                            onClick={cancelEditingComment}
                            className="text-xs px-3 py-1 bg-white border border-slate-300 rounded text-slate-600 hover:bg-slate-50"
                          >
                            取消
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleUpdateComment(comment.id)}
                            className="text-xs px-3 py-1 bg-brand-600 text-white rounded hover:bg-brand-700 flex items-center gap-1"
                          >
                            <Save className="w-3 h-3" /> 保存
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-slate-700 text-sm whitespace-pre-wrap">{comment.content}</p>
                        
                        {(isAuthor || canDeleteComment) && (
                          <div className="absolute top-4 right-4 flex gap-2">
                            {isAuthor && (
                              <button 
                                type="button"
                                onClick={() => startEditingComment(comment)}
                                className="text-slate-400 hover:text-brand-600 p-1 rounded transition-colors"
                                title="编辑评论"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            {canDeleteComment && (
                              <button 
                                type="button"
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                                title="删除评论"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {comments.length === 0 && (
            <p className="text-slate-500 text-center italic">暂无评论。</p>
          )}
        </div>
      </section>
    </div>
  );
};