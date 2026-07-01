import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function OnboardEmployeeModal({ open, onOpenChange, onSuccess }: { open: boolean, onOpenChange: (open: boolean) => void, onSuccess?: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'ENGINEER',
    department: '',
    password: '',
    avatar: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/team-members', formData);
      toast({
        title: "Employee Onboarded",
        description: `${formData.name} has been successfully added to the team.`,
      });
      onOpenChange(false);
      if (onSuccess) onSuccess();
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        role: 'ENGINEER',
        department: '',
        password: '',
        avatar: ''
      });
    } catch (err: any) {
      console.error('Failed to create member', err);
      if (err.response?.data?.errors) {
        const errMsgs = err.response.data.errors.map((e: any) => e.message).join(', ');
        setError(errMsgs);
      } else if (err.response?.data?.error || err.response?.data?.message) {
        setError(err.response.data.error || err.response.data.message);
      } else {
        setError('Failed to onboard employee. Please check your inputs and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Onboard New Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <div className="p-3 rounded-md bg-red-500/15 text-red-500 text-sm font-medium border border-red-500/20">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(val) => setFormData({...formData, role: val})}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROJECT_MANAGER">Project Manager</SelectItem>
                <SelectItem value="PRINCIPAL_ENGINEER">Principal Engineer</SelectItem>
                <SelectItem value="ENGINEER">Engineer</SelectItem>
                <SelectItem value="DRAFTSMAN">Draftsman</SelectItem>
                <SelectItem value="ARCHITECT">Architect</SelectItem>
                <SelectItem value="CLIENT">Client</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input id="department" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} required />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Onboard Employee'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
