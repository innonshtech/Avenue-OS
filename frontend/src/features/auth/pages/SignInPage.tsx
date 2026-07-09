import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Code2, Target, Users, Briefcase, ChevronRight, Activity, LayoutDashboard, Shield, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { signInSchema } from '../validations/auth.schema';
import type { SignInFormValues } from '../validations/auth.schema';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

import { AuthApi } from '../authApi';

export default function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const selectedEmail = watch('email');

  const onSubmit = async (data: SignInFormValues) => {
    try {
      const response = await AuthApi.login({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      });

      if (response.success && response.user) {
        login(response.user, response.accessToken || 'sprintos-cookie-token', response.refreshToken || null, data.rememberMe);

        toast({
          title: `Welcome back, ${response.user.name}`,
          description: `Successfully authenticated into Avenue Projects.`,
        });

        const from = (location.state as any)?.from?.pathname || (response.user.role === 'ADMIN' ? '/admin' : '/dashboard');
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: err.response?.data?.message || 'Invalid password or configuration. Please check your credentials.',
      });
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
          <img src="/logo.png" alt="Avenue Logo" className="h-10 w-auto object-contain mx-auto mb-1" />
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Welcome to Avenue Projects</h1>
          <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Internal Engineering Management Hub</p>
        </div>

        {/* Auth Card */}
        <div className="w-full bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="h-10 bg-slate-50/50 border-slate-200 focus-visible:ring-[#564de6] font-medium text-slate-700"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message as string}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</Label>
                <Link to={`/forgot-password${selectedEmail ? `?email=${encodeURIComponent(selectedEmail)}` : ''}`} className="text-xs font-bold text-slate-600 hover:text-[#564de6] transition-colors">
                  FORGOT PASSWORD?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  className="h-10 bg-slate-50/50 border-slate-200 focus-visible:ring-[#564de6] pr-10 font-medium text-slate-700 tracking-widest placeholder:tracking-normal"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message as string}</p>
              )}
            </div>

            <div className="flex items-center space-x-2 pt-1 pb-2">
              <Checkbox
                id="rememberMe"
                checked={watch('rememberMe')}
                onCheckedChange={(checked) => 
                  setValue('rememberMe', checked as boolean)
                }
                className="data-[state=checked]:bg-[#564de6] data-[state=checked]:border-[#564de6] border-slate-300"
              />
              <label
                htmlFor="rememberMe"
                className="text-sm font-medium text-slate-600 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none"
              >
                Remember session
              </label>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 bg-[#564de6] hover:bg-[#4a40cc] text-white shadow-sm transition-all text-sm font-bold tracking-wide flex items-center justify-center gap-2 rounded-lg"
            >
              {isSubmitting ? 'Authenticating...' : 'Enter Dashboard'}
              {!isSubmitting && <ChevronRight className="w-4 h-4" />}
            </Button>
          </form>
        </div>

        {/* Footer text if needed */}
        <p className="mt-8 text-sm text-slate-400 font-medium text-center">
          First time running the application? <a href="#" className="text-[#564de6] hover:underline">Initialize Database Seeder</a>
        </p>
      </div>
    </div>
  );
}
