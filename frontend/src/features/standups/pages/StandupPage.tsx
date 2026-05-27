import { useState, useMemo, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useStandups, useCreateStandup, useTeamStandups, useMyStandups } from '../api/standupApi';
import { useToast } from '@/hooks/use-toast';
import { useSprints } from '@/features/sprints/api/sprintApi';
import { useProjects } from '@/features/projects/api/projectApi';
import { useTasks } from '@/features/tasks/api/taskApi';
import { TEAM_MEMBERS } from '@/constants/teamMembers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Plus, MessagesSquare, CheckCircle2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { BlockerType, BlockerSeverity } from '@/types/core';

export default function StandupPage() {
  const { user } = useAuthStore();
  const { data: sprints = [] } = useSprints();
  const { data: projects = [] } = useProjects();
  const activeSprintId = sprints.find((s: any) => s.status === 'ACTIVE')?.id;
  
  const { toast } = useToast();
  const isPM = user?.role === 'PRODUCT_MANAGER';
  const [timeRange, setTimeRange] = useState<'sprint' | 'month' | 'year'>('sprint');

  const [selectedSprintId, setSelectedSprintId] = useState<string | undefined>(activeSprintId || sprints[0]?.id);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [formSprintId, setFormSprintId] = useState<string>('');

  useEffect(() => {
    if (sprints.length > 0 && !selectedProjectId) {
      const activeSprint = sprints.find((s: any) => s.status === 'ACTIVE');
      if (activeSprint) {
        setSelectedProjectId(activeSprint.projectId);
        setFormSprintId(activeSprint.id);
      } else {
        setSelectedProjectId(sprints[0].projectId);
        setFormSprintId(sprints[0].id);
      }
    }
  }, [sprints, selectedProjectId]);

  const filteredSprintsForForm = useMemo(() => {
    if (!selectedProjectId) return [];
    return sprints.filter((s: any) => s.projectId === selectedProjectId);
  }, [sprints, selectedProjectId]);

  // Update selectedSprintId if sprints load later
  if (!selectedSprintId && sprints.length > 0) {
    setSelectedSprintId(activeSprintId || sprints[0]?.id);
  }

  const { data: myStandups = [], isLoading: isLoadingUser } = useMyStandups(selectedSprintId, { enabled: !isPM });
  const { data: teamStandups = [], isLoading: isLoadingTeam } = useTeamStandups(timeRange === 'sprint' ? selectedSprintId : undefined, { enabled: isPM });
  const createStandup = useCreateStandup(isPM);
  const { data: tasks = [] } = useTasks(selectedSprintId ? { sprintId: selectedSprintId } : undefined);

  const standups = isPM ? teamStandups : myStandups;
  const isLoadingStandups = isPM ? isLoadingTeam : isLoadingUser;

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [yesterday, setYesterday] = useState('');
  const [today, setToday] = useState('');
  const [hasBlocker, setHasBlocker] = useState(false);
  const [blockerDesc, setBlockerDesc] = useState('');
  const [blockerTaskId, setBlockerTaskId] = useState('');
  const [blockerType, setBlockerType] = useState<BlockerType>('TECHNICAL');
  const [blockerSeverity, setBlockerSeverity] = useState<BlockerSeverity>('MEDIUM');
  const [blockerHelper, setBlockerHelper] = useState('');

  const visibleStandups = useMemo(() => {
    if (!isPM) return standups;
    
    // Filter PM standups locally based on timeRange if needed
    const now = new Date();
    return standups.filter((s: any) => {
      const sDate = new Date(s.date);
      if (timeRange === 'month') {
        return sDate.getMonth() === now.getMonth() && sDate.getFullYear() === now.getFullYear();
      }
      if (timeRange === 'year') {
        return sDate.getFullYear() === now.getFullYear();
      }
      return true; // 'sprint' is handled by API query
    });
  }, [standups, isPM, timeRange]);

  // Group standups by Member for display
  const groupedStandupsByMember = useMemo(() => {
    const sorted = [...visibleStandups].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sorted.reduce((acc, standup) => {
      const memberId = standup.userId;
      if (!acc[memberId]) acc[memberId] = [];
      acc[memberId].push(standup);
      return acc;
    }, {} as Record<string, any[]>);
  }, [visibleStandups]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!formSprintId) {
      toast({
        title: "No Sprint Selected",
        description: "Please select a project and sprint before submitting an update.",
        variant: "destructive"
      });
      return;
    }

    await createStandup.mutateAsync({
      yesterday,
      today,
      blockers: hasBlocker ? blockerDesc : null,
      userId: user.id,
      sprintId: formSprintId,
      blockerDetails: hasBlocker && blockerTaskId ? {
        description: blockerDesc,
        severity: blockerSeverity,
        type: blockerType,
        estimatedResolutionDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        helperId: blockerHelper || null,
        taskId: blockerTaskId,
      } : undefined
    });

    setYesterday('');
    setToday('');
    setHasBlocker(false);
    setBlockerDesc('');
    setIsSubmitting(false);
    
    toast({
      title: "Update submitted",
      description: "Your daily standup has been saved to your history.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daily Standup</h1>
          <p className="text-muted-foreground">Sync with the team and escalate blockers immediately.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedSprintId} onValueChange={setSelectedSprintId}>
            <SelectTrigger className="w-[200px] bg-background">
              <SelectValue placeholder="Select Sprint" />
            </SelectTrigger>
            <SelectContent>
              {sprints.map((s: any, idx: number) => (
                <SelectItem key={s.id} value={s.id}>
                  Sprint {idx + 1}: {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {!isPM && !isSubmitting && (
            <Button onClick={() => setIsSubmitting(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-soft">
              <Plus className="w-4 h-4 mr-2" />
              Submit Update
            </Button>
          )}
        </div>
      </div>

      {sprints.length === 0 && (
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold">No Sprints Found</h4>
              <p className="text-sm mt-1">There are no sprints available to submit a standup for. Please ask the Product Manager to create a sprint.</p>
            </div>
          </div>
        </div>
      )}

      {isSubmitting && sprints.length > 0 && (
        <Card className="bg-card shadow-soft border-indigo-500/20 ring-1 ring-indigo-500/20">
          <CardHeader>
            <CardTitle>Submit Daily Update</CardTitle>
            <CardDescription>What did you accomplish and what's next?</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border border-border/50">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Project</label>
                  <Select value={selectedProjectId} onValueChange={(val) => {
                    setSelectedProjectId(val);
                    const firstSprintOfProject = sprints.find((s: any) => s.projectId === val);
                    setFormSprintId(firstSprintOfProject?.id || '');
                  }}>
                    <SelectTrigger className="w-full bg-background border-border">
                      <SelectValue placeholder="Select Project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Sprint</label>
                  <Select value={formSprintId} onValueChange={setFormSprintId}>
                    <SelectTrigger className="w-full bg-background border-border">
                      <SelectValue placeholder="Select Sprint" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSprintsForForm.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">What did you complete yesterday?</label>
                <Textarea 
                  required
                  placeholder="e.g. Finished the auth flow and merged PR #45" 
                  value={yesterday}
                  onChange={e => setYesterday(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">What are you working on today?</label>
                <Textarea 
                  required
                  placeholder="e.g. Starting on the Kanban board drag-and-drop feature" 
                  value={today}
                  onChange={e => setToday(e.target.value)}
                />
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-semibold flex items-center text-foreground">
                      <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                      Are you blocked on anything?
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">Escalate immediately so Saket and the team can assist.</p>
                  </div>
                  <Button type="button" variant={hasBlocker ? "destructive" : "outline"} onClick={() => setHasBlocker(!hasBlocker)}>
                    {hasBlocker ? 'Yes, I am blocked' : 'No blockers'}
                  </Button>
                </div>

                {hasBlocker && (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-red-500">Blocker Description</label>
                      <Textarea 
                        required
                        placeholder="Explain the blocker in detail..." 
                        value={blockerDesc}
                        onChange={(e: any) => setBlockerDesc(e.target.value)}
                        className="border-red-500/30 focus-visible:ring-red-500/20"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Which Task?</label>
                        <Select value={blockerTaskId} onValueChange={setBlockerTaskId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select task..." />
                          </SelectTrigger>
                          <SelectContent>
                            {tasks.filter((t: any) => t.assigneeId === user?.id).map((t: any) => (
                              <SelectItem key={t.id} value={t.id}>{t.key} - {t.title.substring(0, 20)}...</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Blocker Type</label>
                        <Select value={blockerType} onValueChange={(v) => setBlockerType(v as BlockerType)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TECHNICAL">Technical Issue</SelectItem>
                            <SelectItem value="DEPENDENCY">Dependency Delay</SelectItem>
                            <SelectItem value="INFRASTRUCTURE">Infrastructure</SelectItem>
                            <SelectItem value="COMMUNICATION">Communication / Pending Reply</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsSubmitting(false)}>Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={createStandup.isPending}>
                  {createStandup.isPending ? 'Submitting...' : 'Submit Update'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center">
            <MessagesSquare className="w-5 h-5 mr-2 text-indigo-500" />
            {isPM ? "Team Standups Timeline" : "My Recent Standups"}
          </h2>
          
          {isPM && (
            <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
              <SelectTrigger className="w-40 h-9 text-sm">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sprint">Active Sprint</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        
        {isLoadingStandups ? (
          <div className="flex justify-center p-10">Loading standups...</div>
        ) : visibleStandups.length === 0 ? (
          <div className="p-12 text-center border border-dashed rounded-lg bg-card/50">
            <CheckCircle2 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground">No standups yet</h3>
            <p className="text-muted-foreground mt-1">Updates will appear here once submitted.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedStandupsByMember).map(([memberId, memberStandups]) => {
              const member = TEAM_MEMBERS.find(m => m.id === memberId);
              return (
                <div key={memberId} className="space-y-4">
                  <div className="flex items-center gap-3 sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10 border-b border-border/50">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarImage src={member?.avatar} />
                      <AvatarFallback>{member?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h3 className="text-sm font-semibold text-foreground tracking-wide">
                      {member?.name || 'Unknown Member'}'s Standups
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {(memberStandups as any[]).map((standup: any) => (
                      <Card key={standup.id} className={`bg-card shadow-sm hover:shadow-md transition-shadow border-l-4 ${standup.blockers ? 'border-l-red-500 border-red-500/20' : 'border-border'}`}>
                        <CardHeader className="pb-3 flex flex-row items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-semibold text-muted-foreground">
                                {new Date(standup.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(standup.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                              {standup.sprint && (
                                <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200/50">
                                  {standup.sprint.project?.name || 'Smart Parking System'} — {standup.sprint.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {standup.blockers && (
                            <div className="flex flex-col items-end gap-1">
                              <Badge variant="destructive" className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/50 uppercase tracking-wider text-[10px] flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                BLOCKED
                              </Badge>
                            </div>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">What did you complete yesterday?</h5>
                            <p className="text-sm font-medium text-foreground">{standup.yesterday}</p>
                          </div>
                          <div>
                            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">What are you working on today?</h5>
                            <p className="text-sm font-medium text-foreground">{standup.today}</p>
                          </div>
                          {standup.blockers && (
                            <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-md">
                              <h5 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1 flex items-center">
                                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                                Blocker
                              </h5>
                              <p className="text-sm text-red-600/90 dark:text-red-400/90">{standup.blockers}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
