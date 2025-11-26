import { User, Article, Comment, Like, Follow } from '../types';

// Initial Mock Data
const MOCK_USERS: User[] = [
  { id: 1, uid: '10000001', username: 'admin', email: 'admin@school.edu', role: 'admin', bio: '系统管理员', created_at: new Date().toISOString() },
  { id: 2, uid: '10000002', username: 'student1', email: 'student1@school.edu', role: 'user', bio: '计算机科学专业', created_at: new Date().toISOString() },
  { id: 3, uid: '10000003', username: 'manager1', email: 'manager@school.edu', role: 'manager', bio: '论坛版主', created_at: new Date().toISOString() },
];

const MOCK_ARTICLES: Article[] = [
  { id: 1, user_id: 1, title: '欢迎来到校园论坛', content: '这是学生讨论的官方论坛。请保持文明发言，共同维护良好的社区环境。', tags: ['公告', '综合'], views: 120, created_at: new Date().toISOString() },
  { id: 2, user_id: 2, title: '微积分课程求助', content: '这个周二有人有空一起去图书馆复习微积分吗？我有些问题没搞懂。', tags: ['数学', '学习小组'], views: 45, created_at: new Date(Date.now() - 86400000).toISOString() },
];

const MOCK_COMMENTS: Comment[] = [
  { id: 1, article_id: 2, user_id: 1, content: '我可以帮忙！图书馆见？', parent_id: null, created_at: new Date().toISOString() }
];

const MOCK_LIKES: Like[] = [
  { id: 1, user_id: 2, article_id: 1 }
];

const MOCK_FOLLOWS: Follow[] = [
  { id: 1, follower_id: 2, following_id: 1, created_at: new Date().toISOString() } // Student1 follows Admin
];

// Helper to simulate local storage DB
const get = <T>(key: string, def: T): T => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : def;
};

const set = (key: string, val: any) => {
  localStorage.setItem(key, JSON.stringify(val));
};

// Initialize DB if empty
if (!localStorage.getItem('users')) {
  set('users', MOCK_USERS);
  set('articles', MOCK_ARTICLES);
  set('comments', MOCK_COMMENTS);
  set('likes', MOCK_LIKES);
  set('follows', MOCK_FOLLOWS);
}

// API Services
export const api = {
  users: {
    login: async (identifier: string, password: string): Promise<User> => {
      await new Promise(r => setTimeout(r, 500));
      const users = get<User[]>('users', []);
      const user = users.find(u => (u.email === identifier || u.username === identifier || u.uid === identifier));
      if (!user) throw new Error("用户名或密码错误");
      if (password === 'error') throw new Error("密码错误"); 
      return user;
    },
    register: async (username: string, email: string, password: string): Promise<User> => {
      await new Promise(r => setTimeout(r, 500));
      const users = get<User[]>('users', []);
      if (users.find(u => u.username === username || u.email === email)) {
        throw new Error("用户已存在");
      }
      const maxUid = users.reduce((max, user) => Math.max(max, parseInt(user.uid || '10000000')), 10000000);
      const newUid = (maxUid + 1).toString();
      const newUser: User = {
        id: Date.now(),
        uid: newUid,
        username,
        email,
        role: 'user',
        created_at: new Date().toISOString()
      };
      users.push(newUser);
      set('users', users);
      return newUser;
    },
    getById: async (id: number) => {
      const users = get<User[]>('users', []);
      const user = users.find(u => u.id === id);
      if (!user) throw new Error("用户未找到");
      return user;
    },
    updateProfile: async (id: number, data: Partial<User>) => {
      const users = get<User[]>('users', []);
      const idx = users.findIndex(u => u.id === id);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...data };
        set('users', users);
        return users[idx];
      }
      throw new Error("用户未找到");
    },
    updateRole: async (id: number, role: 'user' | 'manager') => {
      const users = get<User[]>('users', []);
      const idx = users.findIndex(u => u.id === id);
      if (idx !== -1) {
        if (users[idx].role === 'admin') throw new Error("无法修改系统管理员权限");
        users[idx] = { ...users[idx], role };
        set('users', users);
        return users[idx];
      }
      throw new Error("用户未找到");
    },
    getAll: async () => get<User[]>('users', []),
    delete: async (id: number) => {
      const users = get<User[]>('users', []).filter(u => u.id !== id);
      set('users', users);
    },
    getStats: async (userId: number) => {
      const articles = get<Article[]>('articles', []);
      const follows = get<Follow[]>('follows', []);
      const likes = get<Like[]>('likes', []);
      
      const userArticles = articles.filter(a => a.user_id === userId);
      const articleCount = userArticles.length;
      
      // Calculate total likes received across all articles
      const totalLikes = userArticles.reduce((sum, article) => {
        return sum + likes.filter(l => l.article_id === article.id).length;
      }, 0);

      const followingCount = follows.filter(f => f.follower_id === userId).length;
      const followersCount = follows.filter(f => f.following_id === userId).length;

      return {
        articleCount,
        totalLikes,
        followingCount,
        followersCount
      };
    }
  },
  follows: {
    toggle: async (followerId: number, followingId: number) => {
      if (followerId === followingId) throw new Error("不能关注自己");
      const follows = get<Follow[]>('follows', []);
      const existing = follows.find(f => f.follower_id === followerId && f.following_id === followingId);
      if (existing) {
        set('follows', follows.filter(f => f.id !== existing.id));
        return false; // Unfollowed
      } else {
        follows.push({ id: Date.now(), follower_id: followerId, following_id: followingId, created_at: new Date().toISOString() });
        set('follows', follows);
        return true; // Followed
      }
    },
    checkIsFollowing: async (followerId: number, followingId: number) => {
       const follows = get<Follow[]>('follows', []);
       return !!follows.find(f => f.follower_id === followerId && f.following_id === followingId);
    },
    getFollowers: async (userId: number) => {
      const follows = get<Follow[]>('follows', []);
      const users = get<User[]>('users', []);
      const followerIds = follows.filter(f => f.following_id === userId).map(f => f.follower_id);
      return users.filter(u => followerIds.includes(u.id));
    },
    getFollowing: async (userId: number) => {
      const follows = get<Follow[]>('follows', []);
      const users = get<User[]>('users', []);
      const followingIds = follows.filter(f => f.follower_id === userId).map(f => f.following_id);
      return users.filter(u => followingIds.includes(u.id));
    }
  },
  articles: {
    getAll: async (search?: string, tag?: string) => {
      const articles = get<Article[]>('articles', []);
      const users = get<User[]>('users', []);
      const likes = get<Like[]>('likes', []);
      const comments = get<Comment[]>('comments', []);

      let filtered = articles.map(a => ({
        ...a,
        author: users.find(u => u.id === a.user_id),
        likes_count: likes.filter(l => l.article_id === a.id).length,
        comments_count: comments.filter(c => c.article_id === a.id).length
      }));

      if (tag) {
        filtered = filtered.filter(a => a.tags.includes(tag));
      }

      if (search) {
        const lowerSearch = search.toLowerCase();
        filtered = filtered.filter(a => 
          a.title.toLowerCase().includes(lowerSearch) || 
          a.content.toLowerCase().includes(lowerSearch) ||
          a.tags.some(t => t.toLowerCase().includes(lowerSearch))
        );
      }

      return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    getFeed: async (userId: number) => {
      const follows = get<Follow[]>('follows', []);
      const followingIds = follows.filter(f => f.follower_id === userId).map(f => f.following_id);
      
      // Reuse getAll logic but filter by user_id
      const articles = await api.articles.getAll();
      return articles.filter(a => followingIds.includes(a.user_id));
    },
    getByAuthorId: async (userId: number) => {
      const articles = get<Article[]>('articles', []);
      const likes = get<Like[]>('likes', []);
      const comments = get<Comment[]>('comments', []);
      
      return articles
        .filter(a => a.user_id === userId)
        .map(a => ({
          ...a,
          likes_count: likes.filter(l => l.article_id === a.id).length,
          comments_count: comments.filter(c => c.article_id === a.id).length
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    getById: async (id: number, currentUserId?: number) => {
      const articles = get<Article[]>('articles', []);
      const article = articles.find(a => a.id === id);
      if (!article) throw new Error("文章未找到");
      
      const users = get<User[]>('users', []);
      const likes = get<Like[]>('likes', []);
      const comments = get<Comment[]>('comments', []);
      
      article.views = (article.views || 0) + 1;
      set('articles', articles);

      return {
        ...article,
        author: users.find(u => u.id === article.user_id),
        likes_count: likes.filter(l => l.article_id === id).length,
        comments_count: comments.filter(c => c.article_id === id).length,
        is_liked: currentUserId ? !!likes.find(l => l.article_id === id && l.user_id === currentUserId) : false
      };
    },
    create: async (data: Omit<Article, 'id' | 'created_at' | 'views'>) => {
      const articles = get<Article[]>('articles', []);
      const newArticle: Article = {
        ...data,
        id: Date.now(),
        views: 0,
        created_at: new Date().toISOString()
      };
      articles.push(newArticle);
      set('articles', articles);
      return newArticle;
    },
    update: async (id: number, data: Partial<Omit<Article, 'id' | 'created_at' | 'views'>>) => {
      const articles = get<Article[]>('articles', []);
      const idx = articles.findIndex(a => a.id === id);
      if (idx !== -1) {
        articles[idx] = { ...articles[idx], ...data };
        set('articles', articles);
        return articles[idx];
      }
      throw new Error("文章未找到");
    },
    delete: async (id: number) => {
      const articles = get<Article[]>('articles', []).filter(a => a.id !== id);
      set('articles', articles);
    },
    toggleLike: async (articleId: number, userId: number) => {
      const likes = get<Like[]>('likes', []);
      const existing = likes.find(l => l.article_id === articleId && l.user_id === userId);
      if (existing) {
        set('likes', likes.filter(l => l.id !== existing.id));
        return false;
      } else {
        likes.push({ id: Date.now(), article_id: articleId, user_id: userId });
        set('likes', likes);
        return true;
      }
    }
  },
  comments: {
    getByArticleId: async (articleId: number) => {
      const comments = get<Comment[]>('comments', []);
      const users = get<User[]>('users', []);
      return comments
        .filter(c => c.article_id === articleId)
        .map(c => ({ ...c, author: users.find(u => u.id === c.user_id) }))
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    },
    getUserComments: async (userId: number) => {
      const comments = get<Comment[]>('comments', []);
      const articles = get<Article[]>('articles', []);
      return comments
        .filter(c => c.user_id === userId)
        .map(c => ({
           ...c,
           article_title: articles.find(a => a.id === c.article_id)?.title || '未知文章'
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    create: async (data: Omit<Comment, 'id' | 'created_at'>) => {
      const comments = get<Comment[]>('comments', []);
      const newComment = { ...data, id: Date.now(), created_at: new Date().toISOString() };
      comments.push(newComment);
      set('comments', comments);
      return newComment;
    },
    update: async (id: number, content: string) => {
      const comments = get<Comment[]>('comments', []);
      const idx = comments.findIndex(c => c.id === id);
      if (idx !== -1) {
        comments[idx].content = content;
        set('comments', comments);
        return comments[idx];
      }
      throw new Error("评论未找到");
    },
    delete: async (id: number) => {
      const comments = get<Comment[]>('comments', []).filter(c => c.id !== id);
      set('comments', comments);
    }
  }
};