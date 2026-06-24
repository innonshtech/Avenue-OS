import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AuthApi } from '../authApi';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    try {
      await AuthApi.forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.response?.data?.message || 'Failed to send reset link.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Account Recovery</h1>
          <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Internal Engineering Management Hub</p>
        </div>

        {/* Auth Card */}
        <div className="w-full bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 sm:p-8">
          <div className="text-center md:text-left space-y-2 mb-6">
            <button onClick={() => navigate('/signin')} className="flex items-center text-sm font-semibold text-slate-400 hover:text-[#564de6] transition-colors mb-4">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Sign In
            </button>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Forgot Password</h2>
            <p className="text-sm font-medium text-slate-500">
              {submitted ? "Check your email for a link to reset your password." : "We'll send you an email with a link to reset your password."}
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Work Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@innonsh.com"
                  className="h-10 bg-slate-50/50 border-slate-200 focus-visible:ring-[#564de6] font-medium text-slate-700"
                  required
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full h-10 bg-[#564de6] hover:bg-[#4a40cc] text-white shadow-sm transition-all text-sm font-bold tracking-wide flex items-center justify-center gap-2 rounded-lg">
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                {!isSubmitting && <ChevronRight className="w-4 h-4" />}
              </Button>
            </form>
          ) : (
            <div className="bg-[#564de6]/10 border border-[#564de6]/20 p-6 rounded-xl text-center">
              <p className="text-[#564de6] font-medium text-sm">A password reset link has been successfully sent to your email. Please check your inbox to proceed.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
