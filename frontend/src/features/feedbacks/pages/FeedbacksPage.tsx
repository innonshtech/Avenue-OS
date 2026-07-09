import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import { useAuthStore } from '@/features/auth/store/authStore';
import MemberFeedbacksPage from '../../member/feedbacks/pages/MemberFeedbacksPage';

export default function FeedbacksPage() {
  const { user } = useAuthStore();
  const isPM = user?.role === 'PROJECT_MANAGER' || user?.role === 'ADMIN';
  
  if (!isPM) {
    return <MemberFeedbacksPage />;
  }

  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [comparison, setComparison] = useState<any>(null);
  const [targets, setTargets] = useState<any[]>([]);
  
  // Form state
  const [selectedTarget, setSelectedTarget] = useState('');
  const [category, setCategory] = useState('TARGET');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fb, comp, sp] = await Promise.all([
          api.get('/feedbacks').then(res => res.data).catch(() => []),
          api.get('/feedbacks/comparison').then(res => res.data).catch(() => null),
          api.get('/targets').then(res => res.data).catch(() => []),
        ]);
        setFeedbacks(fb);
        setComparison(comp);
        setTargets(sp);
      } catch (error) {
        console.error('Failed to fetch feedback data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTarget || !content) return;
    try {
      const newFb = await api.post('/feedbacks', {
        targetId: selectedTarget,
        category,
        content
      });
      setFeedbacks([newFb.data, ...feedbacks]);
      setContent('');
      alert('Feedback submitted!');
    } catch (error) {
      console.error('Failed to submit feedback');
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading feedback system...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Retrospectives & Feedback</h1>
        <p className="text-muted-foreground mt-2">Continuous improvement and target analysis.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Comparison Engine - Only for PM */}
        {isPM && comparison && !comparison.message && (
          <div className="lg:col-span-3">
            <Card className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border-indigo-500/20">
              <CardHeader>
                <CardTitle className="text-xl">Retrospective Comparison Engine</CardTitle>
                <CardDescription>
                  Comparing {comparison.currentSprintData?.name} vs {comparison.previousSprintData?.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-background/50 rounded-lg backdrop-blur-sm border">
                    <p className="text-sm text-muted-foreground mb-1">Improved Areas</p>
                    <div className="flex flex-wrap gap-1">
                      {comparison.improvedAreas?.map((area: string) => (
                        <span key={area} className="text-xs bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-full">{area}</span>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 bg-background/50 rounded-lg backdrop-blur-sm border">
                    <p className="text-sm text-muted-foreground mb-1">Recurring Problems</p>
                    <div className="flex flex-wrap gap-1">
                      {comparison.recurringProblems?.map((prob: string) => (
                        <span key={prob} className="text-xs bg-rose-500/10 text-rose-600 px-2 py-1 rounded-full">{prob}</span>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 bg-background/50 rounded-lg backdrop-blur-sm border">
                    <p className="text-sm text-muted-foreground mb-1">Deadline Issues</p>
                    <p className="font-semibold text-emerald-600">{comparison.deadlineIssues}</p>
                  </div>
                  <div className="p-4 bg-background/50 rounded-lg backdrop-blur-sm border">
                    <p className="text-sm text-muted-foreground mb-1">Target Health</p>
                    <p className="font-semibold text-indigo-600">{comparison.sprintHealthChanges}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Feedback Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Submit Feedback</CardTitle>
              <CardDescription>Share your thoughts on the target</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Target</label>
                  <Select value={selectedTarget} onValueChange={setSelectedTarget}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Target" />
                    </SelectTrigger>
                    <SelectContent>
                      {targets.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TARGET">Target Overall</SelectItem>
                      <SelectItem value="TASK_ASSIGNMENT">Task Assignment</SelectItem>
                      <SelectItem value="DEADLINE">Deadlines</SelectItem>
                      <SelectItem value="COMMUNICATION">Communication</SelectItem>
                      <SelectItem value="TEAM_COLLABORATION">Team Collaboration</SelectItem>
                      <SelectItem value="PROCESS_IMPROVEMENT">Process Improvement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Feedback</label>
                  <Textarea 
                    placeholder="What went well? What could improve?"
                    className="min-h-[120px]"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full">Submit Feedback</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Feedback List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-semibold">Recent Feedbacks</h3>
          {feedbacks.length === 0 ? (
            <div className="p-8 text-center border border-dashed rounded-lg text-muted-foreground">
              No feedbacks available.
            </div>
          ) : (
            <div className="grid gap-4">
              {feedbacks.map(fb => (
                <Card key={fb.id}>
                  <CardContent className="p-4 flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
                      {fb.user?.name?.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{fb.user?.name}</span>
                        <span className="text-xs text-muted-foreground">• {fb.target?.name}</span>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{fb.category}</span>
                      </div>
                      <p className="text-sm">{fb.content}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
