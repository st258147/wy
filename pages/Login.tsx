import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/mockApi';

export const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const user = await api.users.login(identifier, password);
      login(user);
      navigate('/');
    } catch (err: any) {
      setError(err.message || '登录失败');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <div className="bg-white p-8 rounded-lg shadow-md border border-slate-200 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">欢迎回来</h2>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">用户名或邮箱</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 placeholder-slate-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500 placeholder-slate-400"
              required
            />
          </div>
          <button type="submit" className="w-full bg-brand-600 text-white py-2 rounded-md hover:bg-brand-700 font-medium">
            登录
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          还没有账号？ <Link to="/register" className="text-brand-600 hover:underline">立即注册</Link>
        </p>
        <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-xs rounded leading-relaxed">
          <strong>演示账号 (密码任意):</strong><br/>
          用户: student1<br/>
          管理者: manager1<br/>
          管理员: admin
        </div>
      </div>
    </div>
  );
};