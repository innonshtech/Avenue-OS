import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AuthApi } from '../authApi';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { toast } = useToast();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast({ variant: 'destructive', title: 'Error', description: 'Invalid or missing token.' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'Passwords do not match.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await AuthApi.resetPassword(token, password);
      toast({
        title: 'Success',
        description: 'Password reset successfully. You can now log in.',
      });
      navigate('/signin');
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.response?.data?.message || 'Failed to reset password.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 text-center space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Invalid Link</h2>
          <p className="text-sm font-medium text-slate-500 pb-2">This password reset link is invalid or missing the token. Please request a new one.</p>
          <Button onClick={() => navigate('/forgot-password')} className="h-10 bg-[#564de6] hover:bg-[#4a40cc] text-white shadow-sm transition-all text-sm font-bold tracking-wide rounded-lg">Request New Link</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden p-4">
      {/* Background radial gradient to mimic the soft glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[800px] bg-[#564de6]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-[480px] flex flex-col items-center">
        {/* Header Section */}
        <div className="text-center mb-6 space-y-2">
          <img src="/logo.png" alt="SprintOS Logo" className="h-10 w-auto object-contain mx-auto mb-1" />
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Set New Password</h1>
          <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Internal Engineering Management Hub</p>
        </div>

        {/* Auth Card */}
        <div className="w-full bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 sm:p-8">
          <div className="text-center md:text-left space-y-2 mb-6">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Reset Password</h2>
            <p className="text-sm font-medium text-slate-500">
              Please enter a strong, secure password for your account.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="h-10 bg-slate-50/50 border-slate-200 focus-visible:ring-[#564de6] font-medium text-slate-700 tracking-widest placeholder:tracking-normal"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="h-10 bg-slate-50/50 border-slate-200 focus-visible:ring-[#564de6] font-medium text-slate-700 tracking-widest placeholder:tracking-normal"
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full h-10 bg-[#564de6] hover:bg-[#4a40cc] text-white shadow-sm transition-all text-sm font-bold tracking-wide flex items-center justify-center gap-2 rounded-lg">
              {isSubmitting ? 'Resetting...' : 'Set Password'}
              {!isSubmitting && <ChevronRight className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
