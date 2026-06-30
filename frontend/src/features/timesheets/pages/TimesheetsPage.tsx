import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Send, FileText, CheckCircle2, CalendarDays, Calendar as CalendarIcon, History } from 'lucide-react';

import { getTimesheets, createTimesheet, type Timesheet } from '../api/timesheetApi';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const formSchema = z.object({
  tasksWorkedOn: z.string().min(5, 'Please provide more details on what you worked on.'),
  hoursWorked: z.coerce.number().min(0.5, 'Minimum 0.5 hours').max(24, 'Maximum 24 hours'),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;
type FilterType = 'all' | 'today' | 'week' | 'month';

export const TimesheetsPage = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [activeTab, setActiveTab] = useState('log');

  const { data: timesheets = [], isLoading } = useQuery({
    queryKey: ['timesheets'],
    queryFn: getTimesheets,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { hoursWorked: 8 },
  });

  const mutation = useMutation({
    mutationFn: createTimesheet,
    onSuccess: () => {
      toast({ title: 'Success!', description: 'Your timesheet has been submitted.' });
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      reset();
      setIsSubmitting(false);
      setActiveTab('history'); // Switch to history tab to see the new entry
      setFilter('today'); // Show today's entry
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error?.response?.data?.error || 'Something went wrong.',
      });
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: FormValues) => {
    setIsSubmitting(true);
    mutation.mutate(data);
  };

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

  const filteredTimesheets = useMemo(() => {
    return timesheets.filter((ts: Timesheet) => {
      const date = new Date(ts.createdAt);
      if (filter === 'today') return isToday(date);
      if (filter === 'week') return isThisWeek(date);
      if (filter === 'month') return isThisMonth(date);
      return true;
    });
  }, [timesheets, filter]);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto font-sans text-slate-800 dark:text-slate-100">
      
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center text-center mb-4"
      >
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-2xl shadow-sm mb-2 inline-block">
          <Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1">
          Timesheets
        </h1>
        <p className="text-muted-foreground text-sm max-w-lg">
          Keep track of your daily work hours and browse the team's historical progress.
        </p>
      </motion.div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12 bg-slate-100/80 dark:bg-slate-900/50 rounded-2xl p-1 mb-4">
          <TabsTrigger value="log" className="rounded-xl text-base font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-white data-[state=active]:shadow-sm">
            <FileText className="w-4 h-4 mr-2" /> Log Work
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl text-base font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-white data-[state=active]:shadow-sm">
            <History className="w-4 h-4 mr-2" /> History & Feed
          </TabsTrigger>
        </TabsList>

        {/* --- LOG WORK TAB --- */}
        <TabsContent value="log" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border border-slate-200/50 dark:border-slate-800 shadow-2xl shadow-indigo-100/50 dark:shadow-none overflow-hidden rounded-3xl relative max-w-3xl mx-auto bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
            <CardHeader className="text-center pt-6 pb-4">
              <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Submit Today's Log
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                What did you accomplish today? Be specific!
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 md:px-8 pb-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                
                <div className="space-y-3">
                  <Label htmlFor="hoursWorked" className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Hours Worked
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      id="hoursWorked" 
                      type="number" 
                      step="0.5" 
                      {...register('hoursWorked')} 
                      className="h-11 pl-10 text-base rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                  </div>
                  {errors.hoursWorked && (
                    <p className="text-sm text-red-500 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"/> {errors.hoursWorked.message}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="tasksWorkedOn" className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Tasks / Activities Completed
                  </Label>
                  <Textarea 
                    id="tasksWorkedOn" 
                    placeholder="e.g. Developed the new Timesheets UI, fixed the auth bug, reviewed PRs..." 
                    {...register('tasksWorkedOn')}
                    className="min-h-[80px] p-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-all"
                  />
                  {errors.tasksWorkedOn && (
                    <p className="text-sm text-red-500 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"/> {errors.tasksWorkedOn.message}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="notes" className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex justify-between">
                    <span>Additional Notes</span>
                    <span className="text-xs text-slate-400 font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">Optional</span>
                  </Label>
                  <Input 
                    id="notes" 
                    {...register('notes')} 
                    placeholder="Any blockers, ideas, or comments?"
                    className="h-11 px-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-11 mt-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 group text-base font-bold"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Timesheet'}
                  {!isSubmitting && <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- HISTORY & FEED TAB --- */}
        <TabsContent value="history" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-950 p-4 rounded-2xl border shadow-sm mb-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="font-bold text-slate-700 dark:text-slate-200">View History</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl">
              <Button 
                variant={filter === 'today' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setFilter('today')}
                className={`rounded-lg h-8 text-xs font-semibold ${filter === 'today' ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Today
              </Button>
              <Button 
                variant={filter === 'week' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setFilter('week')}
                className={`rounded-lg h-8 text-xs font-semibold ${filter === 'week' ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700'}`}
              >
                This Week
              </Button>
              <Button 
                variant={filter === 'month' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setFilter('month')}
                className={`rounded-lg h-8 text-xs font-semibold ${filter === 'month' ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700'}`}
              >
                This Month
              </Button>
              <Button 
                variant={filter === 'all' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setFilter('all')}
                className={`rounded-lg h-8 text-xs font-semibold ${filter === 'all' ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700'}`}
              >
                All Time
              </Button>
            </div>
          </div>

          <div className="mb-4 text-center">
            <span className="text-xs px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-100 dark:border-indigo-800">
              {user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER' ? 'Viewing All Team Logs' : 'Viewing Your Logs & Project Manager\'s Logs'}
            </span>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredTimesheets.length === 0 ? (
            <div className="text-center py-24 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 backdrop-blur-sm">
              <CalendarDays className="w-14 h-14 text-slate-300 mx-auto mb-4" />
              <p className="text-xl font-bold text-slate-600 dark:text-slate-300 mb-2">No timesheets found.</p>
              <p className="text-sm text-slate-400 max-w-sm mx-auto">
                {filter === 'all' 
                  ? "Nobody has submitted any timesheets yet." 
                  : `There are no timesheets recorded for ${filter}.`}
              </p>
              {filter !== 'all' && (
                <Button variant="link" onClick={() => setFilter('all')} className="mt-4 text-indigo-600">
                  Clear Filter
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <AnimatePresence>
                {filteredTimesheets.map((ts: Timesheet, index: number) => (
                  <motion.div
                    key={ts.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-6 rounded-3xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex flex-col sm:flex-row gap-5 sm:items-start">
                      <Avatar className="w-14 h-14 border-2 border-white shadow-sm ring-2 ring-slate-100 dark:ring-slate-800 flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 font-bold text-lg">
                          {getInitials(ts.user.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 space-y-2 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-50 dark:border-slate-800/50 pb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-lg text-slate-800 dark:text-slate-100">{ts.user.name}</span>
                            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                              {ts.user.role.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg text-xs text-slate-500 dark:text-slate-400 font-semibold whitespace-nowrap">
                            <CalendarIcon className="w-3.5 h-3.5 text-indigo-500" />
                            {format(new Date(ts.createdAt), 'MMM d, yyyy')} 
                            <span className="px-1 text-slate-300 dark:text-slate-600">•</span>
                            {format(new Date(ts.createdAt), 'h:mm a')}
                          </div>
                        </div>
                        
                        <div className="pt-2">
                          <div className="inline-flex items-center gap-1.5 mb-3 px-2.5 py-1 rounded-md bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-bold border border-green-100 dark:border-green-800/30">
                            <Clock className="w-3.5 h-3.5" />
                            Logged {ts.hoursWorked} hours
                          </div>
                          <p className="text-slate-700 dark:text-slate-200 text-base leading-relaxed whitespace-pre-wrap font-medium">
                            {ts.tasksWorkedOn}
                          </p>
                        </div>

                        {ts.notes && (
                          <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400">
                            <strong className="text-slate-800 dark:text-slate-200 mr-2 flex items-center gap-1.5 mb-1"><FileText className="w-4 h-4"/> Additional Notes:</strong>
                            {ts.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
