import React, { useState } from 'react';
import { User } from '../types';
import { LogIn, Loader2, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!isSignup) {
        // Client-side fallback for demo credentials (useful for Vercel/Static deployments)
        if (username === 'bit197' && password === '1234') {
          onLogin({ id: 'bit197', name: 'User 197' });
          return;
        }

        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        const contentType = response.headers.get('content-type');
        if (response.ok) {
          const data = await response.json();
          onLogin(data.user);
        } else {
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            setError(data.message || 'Invalid username or password');
          } else {
            setError(`Server error: ${response.status} ${response.statusText}`);
          }
        }
      } else {
        const response = await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, name, password }),
        });

        const contentType = response.headers.get('content-type');
        if (response.ok) {
          const data = await response.json();
          onLogin(data.user);
        } else {
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            setError(data.message || 'Signup failed');
          } else {
            setError(`Server error: ${response.status} ${response.statusText}`);
          }
        }
      }
    } catch (err: any) {
      setError(`Connection error: ${err.message || 'Please check your internet'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl shadow-zinc-200/50 p-8 md:p-12 border border-zinc-100"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-200">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-zinc-500 text-center">
            {isSignup ? 'Join us for a seamless shopping experience' : 'Login to start your seamless shopping experience'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2 ml-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              placeholder="Choose a username"
              required
            />
          </div>

          {isSignup && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2 ml-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                placeholder="Enter your full name"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2 ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm font-medium text-center bg-red-50 py-2 rounded-xl border border-red-100">
              {error}
            </p>
          )}

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all flex items-center justify-center space-x-2 disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>{isSignup ? 'Sign Up' : 'Sign In'}</span>
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setIsSignup(!isSignup);
              setError('');
            }}
            className="text-emerald-600 font-bold text-sm hover:underline"
          >
            {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>

        {!isSignup && (
          <div className="mt-10 pt-8 border-t border-zinc-100 text-center">
            <p className="text-zinc-400 text-sm">
              Demo Credentials: <span className="font-mono text-zinc-600">bit197 / 1234</span>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
