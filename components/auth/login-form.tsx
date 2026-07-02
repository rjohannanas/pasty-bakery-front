'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function LoginForm() {
  const router = useRouter();
  const setUser = useAppStore((state) => state.setUser);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Implement Supabase authentication
      // For now, we'll use a demo login
      const user = {
        id: '1',
        email: email || 'demo@pasty.com',
        name: (email || 'Demo User').split('@')[0].charAt(0).toUpperCase() + (email || 'Demo User').split('@')[0].slice(1),
        role: 'operator' as const,
      };
      
      setUser(user);
      localStorage.setItem('pasty_user', JSON.stringify(user));
      toast.success('Logged in successfully!');
      router.push('/dashboard');
    } catch (error) {
      toast.error('Login failed. Please try again.');
      console.error('[v0] Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-lg bg-primary flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-2xl">PB</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Pasty Bakery</h1>
            <p className="text-muted-foreground">Production Optimization System</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading ? 'Logging in...' : 'Sign In'}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            <p>Demo credentials:</p>
            <p>Any email • Any password</p>
          </div>
        </div>
      </div>
    </div>
  );
}
