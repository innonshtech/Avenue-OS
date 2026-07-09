import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTargets } from '@/features/targets/api/targetApi';
import { useMyFeedbacks, useSubmitFeedback, useDeleteFeedback } from '../api/memberFeedbacksApi';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageSquare, Trash2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function MemberFeedbacksPage() {
  const { data: targets = [] } = useTargets();
  const { data: feedbacks = [] } = useMyFeedbacks();
  const submitFeedback = useSubmitFeedback();
  const deleteFeedback = useDeleteFeedback();
  const { toast } = useToast();
  
  const [selectedTarget, setSelectedTarget] = useState('');
  const [category, setCategory] = useState('TARGET');
  const [content, setContent] = useState('');
  const [wentWell, setWentWell] = useState('');
  const [wentWrong, setWentWrong] = useState('');
  const [improvement, setImprovement] = useState('');
  const [blockerPatterns, setBlockerPatterns] = useState('');
  
  const [realisticPlanning, setRealisticPlanning] = useState(true);
  const [achievableDeadlines, setAchievableDeadlines] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTarget || !content) return;

    submitFeedback.mutate({
      targetId: selectedTarget,
      category,
      content,
      wentWell,
      wentWrong,
      improvement,
      blockerPatterns,
      realisticPlanning,
      achievableDeadlines,
    }, {
      onSuccess: () => {
        toast({ title: 'Feedback Submitted', description: 'Thank you for your insights!' });
        setContent('');
        setWentWell('');
        setWentWrong('');
        setImprovement('');
        setBlockerPatterns('');
      }
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this feedback?')) {
      deleteFeedback.mutate(id);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Personal Retrospectives</h1>
        <p className="text-muted-foreground mt-2">Submit your feedback. This is private to you and the Project Manager / Administrator.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Feedback Form */}
        <div className="lg:col-span-2">
          <Card className="shadow-soft border-indigo-500/20 ring-1 ring-indigo-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-500" />
                Target Feedback Form
              </CardTitle>
              <CardDescription>Share your thoughts on the target execution, planning, and team collaboration.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Target</label>
                    <Select value={selectedTarget} onValueChange={setSelectedTarget}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Target" />
                      </SelectTrigger>
                      <SelectContent>
                        {targets.map((s: any) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Primary Category</label>
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
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Overall Summary <span className="text-red-500">*</span></label>
                    <Textarea 
                      placeholder="General thoughts about the target..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">What went well?</label>
                    <Textarea 
                      placeholder="Wins, successful deliveries, good teamwork..."
                      value={wentWell}
                      onChange={(e) => setWentWell(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">What went wrong?</label>
                    <Textarea 
                      placeholder="Bottlenecks, miscommunications, site issues..."
                      value={wentWrong}
                      onChange={(e) => setWentWrong(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Suggestions for Improvement</label>
                    <Textarea 
                      placeholder="How can we do better next target?"
                      value={improvement}
                      onChange={(e) => setImprovement(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Did you notice any RFI/blocker patterns?</label>
                    <Textarea 
                      placeholder="e.g., Frequently waiting on architect details, slow approval reviews..."
                      value={blockerPatterns}
                      onChange={(e) => setBlockerPatterns(e.target.value)}
                    />
                  </div>

                </div>

                <div className="flex gap-6 p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="realisticPlanning" checked={realisticPlanning} onCheckedChange={(c) => setRealisticPlanning(c as boolean)} />
                    <label htmlFor="realisticPlanning" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Planning was realistic
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="achievableDeadlines" checked={achievableDeadlines} onCheckedChange={(c) => setAchievableDeadlines(c as boolean)} />
                    <label htmlFor="achievableDeadlines" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Deadlines were achievable
                    </label>
                  </div>
                </div>

                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={submitFeedback.isPending || !content || !selectedTarget}>
                  <Send className="w-4 h-4 mr-2" />
                  {submitFeedback.isPending ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Feedback List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xl font-semibold">My Previous Feedbacks</h3>
          {feedbacks.length === 0 ? (
            <div className="p-8 text-center border border-dashed rounded-lg text-muted-foreground">
              You haven't submitted any feedback yet.
            </div>
          ) : (
            <div className="grid gap-4">
              {feedbacks.map((fb: any) => (
                <Card key={fb.id} className="shadow-sm">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">{fb.target?.name}</div>
                        <div className="text-xs bg-muted px-2 py-0.5 rounded-full inline-block">{fb.category}</div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-rose-500" onClick={() => handleDelete(fb.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <p className="text-sm text-foreground mb-2">{fb.content}</p>
                    {fb.wentWell && (
                      <div className="mt-2 text-xs border-l-2 border-emerald-500 pl-2 text-muted-foreground">
                        <strong className="text-emerald-600">Went well:</strong> {fb.wentWell}
                      </div>
                    )}
                    {fb.wentWrong && (
                      <div className="mt-2 text-xs border-l-2 border-rose-500 pl-2 text-muted-foreground">
                        <strong className="text-rose-600">Went wrong:</strong> {fb.wentWrong}
                      </div>
                    )}
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
