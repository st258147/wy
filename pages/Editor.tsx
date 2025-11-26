import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/mockApi';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Save, Hash, Image as ImageIcon, Quote, List, Bold, Italic, Link as LinkIcon } from 'lucide-react';

export const Editor: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (id && user) {
      setLoading(true);
      api.articles.getById(parseInt(id))
        .then(article => {
          // Check if user is authorized to edit
          if (article.user_id !== user.id && user.role !== 'admin' && user.role !== 'manager') {
            navigate('/');
            return;
          }
          setTitle(article.title);
          setContent(article.content);
          setTags(article.tags.join(', '));
        })
        .catch(err => {
          console.error(err);
          navigate('/');
        })
        .finally(() => setLoading(false));
    }
  }, [id, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const tagArray = tags.split(/[,，]/).map(t => t.trim().toLowerCase()).filter(t => t);
      const articleData = {
        title,
        content,
        tags: tagArray
      };

      if (id) {
        await api.articles.update(parseInt(id), articleData);
        navigate(`/article/${id}`);
      } else {
        await api.articles.create({
          ...articleData,
          user_id: user.id
        });
        navigate('/');
      }
    } catch (error) {
      console.error("Failed to save post", error);
    }
  };

  if (!user) {
      navigate('/login');
      return null;
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-brand-600 font-medium animate-pulse">正在加载文章内容...</div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <button 
        onClick={() => navigate(-1)} 
        className="group flex items-center text-slate-500 hover:text-brand-600 mb-6 transition-colors"
      >
        <div className="p-1 rounded-full group-hover:bg-brand-50 mr-1 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </div>
        <span className="font-medium">返回</span>
      </button>

      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col min-h-[75vh]">
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
          
          {/* Header Section: Title */}
          <div className="px-8 pt-10 pb-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-4xl font-extrabold text-slate-900 placeholder-slate-300 border-none focus:ring-0 p-0 bg-transparent leading-tight"
              placeholder="请输入文章标题..."
              required
              autoFocus
            />
          </div>

          {/* Metadata Section: Tags */}
          <div className="px-8 py-4 flex items-center bg-white">
            <div className="flex items-center w-full px-4 py-3 bg-slate-50 rounded-lg border border-slate-100 focus-within:ring-2 focus-within:ring-brand-100 focus-within:border-brand-300 transition-all">
              <Hash className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 text-slate-700 placeholder-slate-400 text-sm font-medium p-0"
                placeholder="添加标签 (例如: 数学, 校园活动)..."
              />
            </div>
          </div>

          {/* Toolbar (Visual Only) */}
          <div className="px-8 py-3 border-y border-slate-100 flex items-center gap-1 bg-slate-50/50 text-slate-500 overflow-x-auto">
            <button type="button" className="p-2 hover:bg-slate-200 rounded transition-colors" title="加粗">
              <Bold className="w-4 h-4" />
            </button>
            <button type="button" className="p-2 hover:bg-slate-200 rounded transition-colors" title="斜体">
              <Italic className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-300 mx-2"></div>
            <button type="button" className="p-2 hover:bg-slate-200 rounded transition-colors" title="引用">
              <Quote className="w-4 h-4" />
            </button>
            <button type="button" className="p-2 hover:bg-slate-200 rounded transition-colors" title="列表">
              <List className="w-4 h-4" />
            </button>
            <button type="button" className="p-2 hover:bg-slate-200 rounded transition-colors" title="链接">
              <LinkIcon className="w-4 h-4" />
            </button>
            <button type="button" className="p-2 hover:bg-slate-200 rounded transition-colors" title="图片">
              <ImageIcon className="w-4 h-4" />
            </button>
            <div className="flex-grow"></div>
            <span className="text-xs text-slate-400 hidden sm:block font-mono">Markdown Supported</span>
          </div>

          {/* Editor Area */}
          <div className="flex-grow bg-white relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full p-8 text-lg text-slate-800 leading-relaxed border-none focus:ring-0 resize-none font-sans min-h-[400px] placeholder-slate-300"
              placeholder="在这里开始撰写正文..."
              required
            />
          </div>

          {/* Footer Action Bar */}
          <div className="bg-white px-8 py-5 border-t border-slate-100 flex justify-between items-center sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="text-sm text-slate-500 font-medium">
              {id ? '编辑模式' : '草稿'}
            </div>
            <div className="flex gap-4">
              <button 
                type="button" 
                onClick={() => navigate(-1)}
                className="px-5 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors font-medium text-sm"
              >
                取消
              </button>
              <button 
                type="submit" 
                className="flex items-center gap-2 bg-brand-600 text-white px-8 py-2.5 rounded-full font-bold shadow-md hover:bg-brand-700 hover:shadow-lg transition-all transform active:scale-95 text-sm"
              >
                <Save className="w-4 h-4" />
                {id ? '保存修改' : '立即发布'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};