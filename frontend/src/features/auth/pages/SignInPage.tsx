import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Code2, Target, Users, Zap, Briefcase, ChevronRight, Activity, LayoutDashboard, Shield, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { signInSchema } from '../validations/auth.schema';
import type { SignInFormValues } from '../validations/auth.schema';
import { TEAM_MEMBERS, ROLE_COLORS } from '@/constants/teamMembers';

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
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
      role: '',
      department: '',
      rememberMe: false,
    },
  });

  const selectedEmail = watch('email');
  const selectedRole = watch('role');
  const selectedDepartment = watch('department');
  
  // Track selected member from the dropdown (we'll just use ID to track selection)
  const selectedMemberId = TEAM_MEMBERS.find(m => m.email === selectedEmail)?.id || '';

  const handleMemberSelect = (id: string) => {
    const member = TEAM_MEMBERS.find((m) => m.id === id);
    if (member) {
      setValue('email', member.email, { shouldValidate: true });
      setValue('role', member.role, { shouldValidate: true });
      setValue('department', member.department, { shouldValidate: true });
    }
  };

  const onSubmit = async (data: SignInFormValues) => {
    try {
      const response = await AuthApi.login({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      });

      if (response.success && response.user) {
        // Placeholders token since session is fully cookie-based
        login(response.user, 'sprintos-cookie-token', data.rememberMe);

        toast({
          title: `Welcome back, ${response.user.name}`,
          description: `Successfully authenticated into Innonsh SprintOS.`,
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
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-background">
      {/* Left Panel - Enterprise Overview */}
      <div className="hidden md:flex md:w-1/2 lg:w-5/12 bg-zinc-950 p-10 lg:p-14 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-zinc-950 to-zinc-950 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div>
            <div className="flex items-center gap-3 mb-16">
              <div className="bg-indigo-600 p-2 rounded-xl">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">Innonsh SprintOS</span>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-5xl font-bold text-white leading-[1.1]">
                  Internal Engineering<br />Management Hub
                </h1>
                <p className="text-zinc-400 text-lg leading-relaxed max-w-md">
                  Innonsh Technologies secure portal for agile tracking, sprint analytics, and cross-team collaboration.
                </p>
              </div>

              {/* Live Overview Cards */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-zinc-400 mb-2">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-medium uppercase tracking-wider">Active Members</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-white">8</span>
                    <span className="text-emerald-400 text-sm font-medium mb-1 flex items-center"><Activity className="w-3 h-3 mr-1"/> Online</span>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-zinc-400 mb-2">
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="text-sm font-medium uppercase tracking-wider">Active Sprint</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-white">42</span>
                    <span className="text-indigo-400 text-sm font-medium mb-1 ml-1 flex items-center">In Progress</span>
                  </div>
                </div>
              </div>

              {/* Department Indicators */}
              <div className="space-y-4 pt-6">
                <h4 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest">Departments Integrated</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                    <div className="flex items-center gap-3">
                      <Target className="w-5 h-5 text-indigo-400" />
                      <span className="text-indigo-100 font-medium">Product Management</span>
                    </div>
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-full">1 Member</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-3">
                      <Code2 className="w-5 h-5 text-blue-400" />
                      <span className="text-blue-100 font-medium">Engineering Team</span>
                    </div>
                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">4 Members</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-5 h-5 text-emerald-400" />
                      <span className="text-emerald-100 font-medium">Marketing Team</span>
                    </div>
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full">3 Members</span>
                  </div>
                </div>
              </div>

            </motion.div>
          </div>

          <div className="relative z-10 flex items-center justify-between mt-12 text-sm text-zinc-500 font-medium">
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-500" />
              Secure Innonsh Network
            </span>
            <span>&copy; {new Date().getFullYear()} Innonsh Tech</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full md:w-1/2 lg:w-7/12 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-background">
        <div className="w-full max-w-[440px] space-y-8">
          
          <div className="text-center md:text-left space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Portal Access</h2>
            <p className="text-muted-foreground">
              Select your profile to authenticate into the system.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-5">
              
              {/* Team Member Selector */}
              <div className="space-y-2">
                <Label htmlFor="memberSelect">Team Member Profile</Label>
                <Select
                  value={selectedMemberId}
                  onValueChange={handleMemberSelect}
                >
                  <SelectTrigger className="h-14 bg-muted/30 border-border focus-visible:ring-indigo-500 transition-all">
                    <SelectValue placeholder="Select your team member profile..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {TEAM_MEMBERS.map((member) => (
                      <SelectItem key={member.id} value={member.id} className="py-3 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col text-left">
                            <span className="font-semibold">{member.name}</span>
                            <span className="text-xs text-muted-foreground">{member.role.replace('_', ' ')} • {member.department}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected User Overview (Auto-filled) */}
              {selectedEmail && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-muted/30 border border-border/50 rounded-xl p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Auto-filled Configuration</span>
                    {/* Role Badge */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${ROLE_COLORS[selectedRole as keyof typeof ROLE_COLORS] || 'bg-muted text-foreground'}`}>
                      {selectedRole?.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs text-muted-foreground">Work Email (Auto-filled)</Label>
                      <Input
                        id="email"
                        type="email"
                        className="h-10 bg-background border-border/50 focus-visible:ring-indigo-500 font-medium"
                        {...register('email')}
                        readOnly // We can allow typing, but requirement said auto-fill. Let's make it editable if user wants manual, but requirement said "Allow email typing manually too". So we keep it editable.
                      />
                      {errors.email && (
                        <p className="text-xs text-destructive">{errors.email.message as string}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-medium text-muted-foreground">Department:</span>
                      <span className="text-sm font-semibold text-foreground">{selectedDepartment}</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Password Field */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {selectedEmail && (
                    <Link to={`/forgot-password?email=${encodeURIComponent(selectedEmail)}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                      Forgot Password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your internal password"
                    className="h-12 bg-muted/50 border-muted focus-visible:ring-indigo-500 pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message as string}</p>
                )}
              </div>

            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={watch('rememberMe')}
                  onCheckedChange={(checked) => 
                    setValue('rememberMe', checked as boolean)
                  }
                  className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                />
                <label
                  htmlFor="rememberMe"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none"
                >
                  Remember session
                </label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white shadow-soft transition-all text-base font-medium flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In'}
              {!isSubmitting && <ChevronRight className="w-4 h-4" />}
            </Button>
          </form>

        </div>
      </div>
    </div>
  );
}
