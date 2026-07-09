import { useState, useMemo, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useMyProgressReports, useCreateProgressReport, useTeamProgressReports } from '../api/progressReportApi';
import { useToast } from '@/hooks/use-toast';
import { useTargets } from '@/features/targets/api/targetApi';
import { useProjects } from '@/features/projects/api/projectApi';
import { useTasks } from '@/features/tasks/api/taskApi';
import { TEAM_MEMBERS } from '@/constants/teamMembers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Plus, MessagesSquare, CheckCircle2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { RFIType, RFISeverity } from '@/types/core';

export default function ProgressReportPage() {
  const { user } = useAuthStore();
  const { data: targets = [] } = useTargets();
  const { data: projects = [] } = useProjects();
  const activeTargetId = targets.find((s: any) => s.status === 'ACTIVE')?.id;
  
  const { toast } = useToast();
  const isPM = user?.role === 'PROJECT_MANAGER' || user?.role === 'ADMIN';
  const [timeRange, setTimeRange] = useState<'target' | 'month' | 'year'>('target');

  const [selectedTargetId, setSelectedTargetId] = useState<string | undefined>(activeTargetId || targets[0]?.id);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [formTargetId, setFormTargetId] = useState<string>('');

  useEffect(() => {
    if (targets.length > 0 && !selectedProjectId) {
      const activeTarget = targets.find((s: any) => s.status === 'ACTIVE');
      if (activeTarget) {
        setSelectedProjectId(activeTarget.projectId);
        setFormTargetId(activeTarget.id);
      } else {
        setSelectedProjectId(targets[0].projectId);
        setFormTargetId(targets[0].id);
      }
    }
  }, [targets, selectedProjectId]);

  const filteredTargetsForForm = useMemo(() => {
    if (!selectedProjectId) return [];
    return targets.filter((s: any) => s.projectId === selectedProjectId);
  }, [targets, selectedProjectId]);

  // Update selectedTargetId if targets load later
  if (!selectedTargetId && targets.length > 0) {
    setSelectedTargetId(activeTargetId || targets[0]?.id);
  }

  const { data: myReports = [], isLoading: isLoadingUser } = useMyProgressReports(selectedTargetId, { enabled: !isPM });
  const { data: teamReports = [], isLoading: isLoadingTeam } = useTeamProgressReports(timeRange === 'target' ? selectedTargetId : undefined, { enabled: isPM });
  const createReport = useCreateProgressReport(isPM);
  const { data: tasks = [] } = useTasks(selectedTargetId ? { targetId: selectedTargetId } : undefined);

  const reports = isPM ? teamReports : myReports;
  const isLoadingReports = isPM ? isLoadingTeam : isLoadingUser;

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [yesterday, setYesterday] = useState('');
  const [today, setToday] = useState('');
  const [hasBlocker, setHasBlocker] = useState(false);
  const [blockerDesc, setBlockerDesc] = useState('');
  const [blockerTaskId, setBlockerTaskId] = useState('');
  const [blockerType, setBlockerType] = useState<RFIType>('ARCHITECTURAL_CLARIFICATION');
  const [blockerSeverity, setBlockerSeverity] = useState<RFISeverity>('MEDIUM');
  const [blockerHelper, setBlockerHelper] = useState('');

  const visibleReports = useMemo(() => {
    if (!isPM) return reports;
    
    const now = new Date();
    return reports.filter((s: any) => {
      const sDate = new Date(s.date);
      if (timeRange === 'month') {
        return sDate.getMonth() === now.getMonth() && sDate.getFullYear() === now.getFullYear();
      }
      if (timeRange === 'year') {
        return sDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [reports, isPM, timeRange]);

  // Group reports by Member for display
  const groupedReportsByMember = useMemo(() => {
    const sorted = [...visibleReports].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sorted.reduce((acc, report) => {
      const memberId = report.userId;
      if (!acc[memberId]) acc[memberId] = [];
      acc[memberId].push(report);
      return acc;
    }, {} as Record<string, any[]>);
  }, [visibleReports]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!formTargetId) {
      toast({
        title: "No Target Selected",
        description: "Please select a project and target before submitting an update.",
        variant: "destructive"
      });
      return;
    }

    await createReport.mutateAsync({
      yesterday,
      today,
      blockers: hasBlocker ? blockerDesc : null,
      userId: user.id,
      targetId: formTargetId,
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
    setBlockerHelper('');
    setBlockerTaskId('');
    setIsSubmitting(false);
    
    toast({
      title: "Update submitted",
      description: "Your daily progress report has been saved to your history.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daily Progress Reports</h1>
          <p className="text-muted-foreground">Sync with the project team, record tasks worked, and raise RFIs.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedTargetId} onValueChange={setSelectedTargetId}>
            <SelectTrigger className="w-[200px] bg-background">
              <SelectValue placeholder="Select Target" />
            </SelectTrigger>
            <SelectContent>
              {targets.map((s: any, idx: number) => (
                <SelectItem key={s.id} value={s.id}>
                  Target {idx + 1}: {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {!isPM && !isSubmitting && (
            <Button onClick={() => setIsSubmitting(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-soft">
              <Plus className="w-4 h-4 mr-2" />
              Submit Report
            </Button>
          )}
        </div>
      </div>

      {targets.length === 0 && (
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold">No Targets Found</h4>
              <p className="text-sm mt-1">There are no targets available to submit a report for. Please ask the Project Manager to set up a project target.</p>
            </div>
          </div>
        </div>
      )}

      {isSubmitting && targets.length > 0 && (
        <Card className="bg-card shadow-soft border-indigo-500/20 ring-1 ring-indigo-500/20">
          <CardHeader>
            <CardTitle>Submit Progress Report</CardTitle>
            <CardDescription>What did you accomplish and what's next?</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border border-border/50">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Project</label>
                  <Select value={selectedProjectId} onValueChange={(val) => {
                    setSelectedProjectId(val);
                    const firstTargetOfProject = targets.find((s: any) => s.projectId === val);
                    setFormTargetId(firstTargetOfProject?.id || '');
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
                  <label className="text-sm font-semibold">Target</label>
                  <Select value={formTargetId} onValueChange={setFormTargetId}>
                    <SelectTrigger className="w-full bg-background border-border">
                      <SelectValue placeholder="Select Target" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredTargetsForForm.map((s: any) => (
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
                  placeholder="e.g. Completed framing analysis on standard column C1" 
                  value={yesterday}
                  onChange={e => setYesterday(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">What are you working on today?</label>
                <Textarea 
                  required
                  placeholder="e.g. Drafting reinforcement details for C1 on drawing D-101" 
                  value={today}
                  onChange={e => setToday(e.target.value)}
                />
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-semibold flex items-center text-foreground">
                      <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                      Do you want to raise an RFI? (Query / Blocker)
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">Escalate clarification queries to the architect, client, or team.</p>
                  </div>
                  <Button type="button" variant={hasBlocker ? "destructive" : "outline"} onClick={() => setHasBlocker(!hasBlocker)}>
                    {hasBlocker ? 'Yes, raise RFI' : 'No RFI'}
                  </Button>
                </div>

                {hasBlocker && (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-red-500">RFI Description / Query details</label>
                      <Textarea 
                        required
                        placeholder="Explain the clarification or block in detail..." 
                        value={blockerDesc}
                        onChange={(e: any) => setBlockerDesc(e.target.value)}
                        className="border-red-500/30 focus-visible:ring-red-500/20"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-medium">Select Associated Task</label>
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
                        <label className="text-xs font-medium">RFI Type</label>
                        <Select value={blockerType} onValueChange={(v) => setBlockerType(v as RFIType)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ARCHITECTURAL_CLARIFICATION">Architectural Clarification</SelectItem>
                            <SelectItem value="CLIENT_APPROVAL_PENDING">Client Approval Pending</SelectItem>
                            <SelectItem value="SITE_DISCREPANCY">Site Discrepancy</SelectItem>
                            <SelectItem value="RESOURCE_UNAVAILABLE">Resource Unavailable</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium">RFI Severity</label>
                        <Select value={blockerSeverity} onValueChange={(v) => setBlockerSeverity(v as RFISeverity)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LOW">Low</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                            <SelectItem value="CRITICAL">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium">Assign Helper / Reviewer</label>
                      <Select value={blockerHelper} onValueChange={setBlockerHelper}>
                        <SelectTrigger>
                          <SelectValue placeholder="Assign teammate to resolve..." />
                        </SelectTrigger>
                        <SelectContent>
                          {TEAM_MEMBERS.map((m: any) => (
                            <SelectItem key={m.id} value={m.id}>{m.name} ({m.role.replace('_', ' ')})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsSubmitting(false)}>Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={createReport.isPending}>
                  {createReport.isPending ? 'Submitting...' : 'Submit Update'}
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
            {isPM ? "Team Progress Timeline" : "My Recent Updates"}
          </h2>
          
          {isPM && (
            <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
              <SelectTrigger className="w-40 h-9 text-sm">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="target">Active Target</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        
        {isLoadingReports ? (
          <div className="flex justify-center p-10">Loading updates...</div>
        ) : visibleReports.length === 0 ? (
          <div className="p-12 text-center border border-dashed rounded-lg bg-card/50">
            <CheckCircle2 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground">No reports yet</h3>
            <p className="text-muted-foreground mt-1">Updates will appear here once submitted.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedReportsByMember).map(([memberId, memberReports]) => {
              const member = TEAM_MEMBERS.find(m => m.id === memberId);
              return (
                <div key={memberId} className="space-y-4">
                  <div className="flex items-center gap-3 sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10 border-b border-border/50">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarImage src={member?.avatar} />
                      <AvatarFallback>{member?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h3 className="text-sm font-semibold text-foreground tracking-wide">
                      {member?.name || 'Unknown Member'}'s Updates
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {(memberReports as any[]).map((report: any) => (
                      <Card key={report.id} className={`bg-card shadow-sm hover:shadow-md transition-shadow border-l-4 ${report.blockers ? 'border-l-red-500 border-red-500/20' : 'border-border'}`}>
                        <CardHeader className="pb-3 flex flex-row items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-semibold text-muted-foreground">
                                {new Date(report.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(report.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                              {report.target && (
                                <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200/50">
                                  {report.target.project?.name} — {report.target.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {report.blockers && (
                            <div className="flex flex-col items-end gap-1">
                              <Badge variant="destructive" className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/55 uppercase tracking-wider text-[10px] flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                RFI
                              </Badge>
                            </div>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">What did you complete yesterday?</h5>
                            <p className="text-sm font-medium text-foreground">{report.yesterday}</p>
                          </div>
                          <div>
                            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">What are you working on today?</h5>
                            <p className="text-sm font-medium text-foreground">{report.today}</p>
                          </div>
                          {report.blockers && (
                            <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-md">
                              <h5 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1 flex items-center">
                                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                                RFI raised
                              </h5>
                              <p className="text-sm text-red-600/90 dark:text-red-400/90">{report.blockers}</p>
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
