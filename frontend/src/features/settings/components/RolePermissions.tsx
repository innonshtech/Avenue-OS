import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import type { SystemRole, FeatureFlag } from '@/types/user';
import { ShieldAlert, ShieldCheck, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

const ACTION_FLAGS: { key: FeatureFlag; label: string; desc: string }[] = [
  { key: 'CREATE_PROJECT', label: 'Create Projects', desc: 'Can create new projects' },
  { key: 'EDIT_PROJECT', label: 'Edit Projects', desc: 'Can edit existing project details' },
  { key: 'DELETE_PROJECT', label: 'Delete Projects', desc: 'Can archive or delete projects' },
  { key: 'CREATE_TASK', label: 'Create Tasks', desc: 'Can create and assign new tasks' },
  { key: 'ASSIGN_TASK', label: 'Assign Tasks', desc: 'Can assign tasks to other users' },
  { key: 'DELETE_TASK', label: 'Delete Tasks', desc: 'Can permanently delete tasks' },
  { key: 'RESOLVE_RFI', label: 'Resolve RFIs', desc: 'Can close or resolve RFI queries' },
  { key: 'MANAGE_USERS', label: 'Manage Users', desc: 'Can invite or remove team members' },
];

const SIDEBAR_FLAGS: { key: FeatureFlag; label: string; desc: string }[] = [
  { key: 'VIEW_PROJECTS', label: 'Projects', desc: 'Access Projects directory' },
  { key: 'VIEW_TARGETS', label: 'Targets', desc: 'Access active Targets' },
  { key: 'VIEW_TARGET_REPORTS', label: 'Target Reports', desc: 'Access Target Reports' },
  { key: 'VIEW_ALL_TASKS', label: 'All Tasks (Org)', desc: 'View all organizational tasks' },
  { key: 'VIEW_MY_TASKS', label: 'My Tasks', desc: 'View assigned personal tasks' },
  { key: 'VIEW_BOARDS', label: 'Kanban Boards', desc: 'Access agile boards' },
  { key: 'VIEW_CHAT', label: 'Chat', desc: 'Access team messaging' },
  { key: 'VIEW_PROGRESS_REPORTS', label: 'Progress Reports', desc: 'View daily standups' },
  { key: 'VIEW_TIMESHEETS', label: 'Timesheets', desc: 'View and log timesheets' },
  { key: 'VIEW_ACTIVITY_LOG', label: 'Activity Log', desc: 'View personal activity history' },
  { key: 'VIEW_ANALYTICS', label: 'Analytics', desc: 'View high-level analytics' },
  { key: 'VIEW_REPORTS', label: 'Reports', desc: 'View generic reports' },
  { key: 'VIEW_AUDIT_LOG', label: 'Audit Log', desc: 'View org audit logs' },
  { key: 'VIEW_FEEDBACKS', label: 'Feedbacks', desc: 'View and give feedback' },
  { key: 'VIEW_TEAM', label: 'Team Management', desc: 'View team directory/org chart' },
  { key: 'VIEW_CALENDAR', label: 'Calendar', desc: 'Access the calendar' },
  { key: 'VIEW_SETTINGS', label: 'Settings', desc: 'Access user/org settings' },
];

export default function RolePermissions() {
  const [roles, setRoles] = useState<SystemRole[]>([]);
  const [selectedRoleName, setSelectedRoleName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await api.get('/roles');
      if (res.data.success) {
        setRoles(res.data.data);
        if (res.data.data.length > 0 && !selectedRoleName) {
          // Default to the first non-admin role if possible
          const nonAdmin = res.data.data.find((r: SystemRole) => r.name !== 'ADMIN');
          setSelectedRoleName(nonAdmin ? nonAdmin.name : res.data.data[0].name);
        }
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load system roles',
      });
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    
    // Convert to upper snake case for internal consistency if desired, but user can just type it
    const formattedName = newRoleName.trim().toUpperCase().replace(/\s+/g, '_');

    try {
      setIsCreating(true);
      const res = await api.post('/roles', {
        name: formattedName,
        description: newRoleDesc,
        permissions: []
      });
      
      if (res.data.success) {
        toast({ title: 'Role Created', description: `${formattedName} has been created successfully.` });
        setIsCreateModalOpen(false);
        setNewRoleName('');
        setNewRoleDesc('');
        fetchRoles();
        setSelectedRoleName(formattedName);
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error Creating Role',
        description: err.response?.data?.message || 'Failed to create role'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggle = async (flag: FeatureFlag, checked: boolean) => {
    if (selectedRoleName === 'ADMIN') {
      toast({ variant: 'destructive', title: 'Action Denied', description: 'Admin permissions cannot be modified.' });
      return;
    }

    const role = roles.find(r => r.name === selectedRoleName);
    if (!role) return;

    let updatedPermissions = [...role.permissions];
    if (checked && !updatedPermissions.includes(flag)) {
      updatedPermissions.push(flag);
    } else if (!checked && updatedPermissions.includes(flag)) {
      updatedPermissions = updatedPermissions.filter(p => p !== flag);
    }

    // Optimistic update
    setRoles(roles.map(r => r.name === selectedRoleName ? { ...r, permissions: updatedPermissions } : r));

    try {
      setIsLoading(true);
      await api.put(`/roles/${selectedRoleName}/permissions`, { permissions: updatedPermissions });
      toast({
        title: 'Permissions Updated',
        description: `Updated permissions for ${selectedRoleName}`,
      });
    } catch (err: any) {
      // Revert on failure
      fetchRoles();
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: err.response?.data?.message || 'Failed to update permissions',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRole = roles.find(r => r.name === selectedRoleName);

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardContent className="p-0">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 text-rose-600">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-bold text-sm tracking-widest uppercase">Feature Flags & Access Control</h3>
          </div>

          <div className="h-px bg-border w-full -mt-4" />

          <div className="flex items-end justify-between max-w-md">
            <div className="space-y-2 flex-1 mr-4">
              <Label>Select Role to Configure</Label>
              <Select value={selectedRoleName} onValueChange={setSelectedRoleName}>
                <SelectTrigger className="bg-muted/30">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.name} value={role.name}>
                      {role.name} {role.name === 'ADMIN' && '(Full Access)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={() => setIsCreateModalOpen(true)} variant="outline" className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Role
            </Button>
          </div>

          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Custom Role</DialogTitle>
                <DialogDescription>Define a new organizational role. You can configure its permissions after creation.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateRole} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Role Name</Label>
                  <Input 
                    placeholder="e.g. ASSOCIATE_DIRECTOR" 
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Name will automatically be formatted (e.g. UPPER_SNAKE_CASE).</p>
                </div>
                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Input 
                    placeholder="Brief description of responsibilities"
                    value={newRoleDesc}
                    onChange={(e) => setNewRoleDesc(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isCreating}>{isCreating ? 'Creating...' : 'Create Role'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {selectedRole && (
            <div className="mt-4 grid gap-6 max-w-3xl">
              {selectedRole.name === 'ADMIN' ? (
                <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-4">
                  <ShieldAlert className="w-6 h-6 text-rose-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-rose-600">System Administrator</h4>
                    <p className="text-sm text-rose-600/80 mt-1">
                      The ADMIN role has hardcoded full system access. Feature flags cannot be disabled for this role to prevent system lockout.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div>
                    <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-primary">Sidebar Navigation Access</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 bg-card border rounded-lg p-6 shadow-sm">
                      {SIDEBAR_FLAGS.map((flag) => {
                        const isEnabled = selectedRole.permissions.includes(flag.key);
                        return (
                          <div key={flag.key} className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-sm font-medium">{flag.label}</Label>
                              <p className="text-xs text-muted-foreground">{flag.desc}</p>
                            </div>
                            <Switch checked={isEnabled} onCheckedChange={(c) => handleToggle(flag.key, c)} disabled={isLoading} />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-primary">Action & Data Permissions</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 bg-card border rounded-lg p-6 shadow-sm">
                      {ACTION_FLAGS.map((flag) => {
                        const isEnabled = selectedRole.permissions.includes(flag.key);
                        return (
                          <div key={flag.key} className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-sm font-medium">{flag.label}</Label>
                              <p className="text-xs text-muted-foreground">{flag.desc}</p>
                            </div>
                            <Switch checked={isEnabled} onCheckedChange={(c) => handleToggle(flag.key, c)} disabled={isLoading} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
