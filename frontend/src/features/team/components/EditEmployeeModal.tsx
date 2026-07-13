import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function EditEmployeeModal({ open, onOpenChange, onSuccess, employee }: { open: boolean, onOpenChange: (open: boolean) => void, onSuccess?: () => void, employee: any }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<{name: string}[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    department: '',
    avatar: ''
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || '',
        email: employee.email || '',
        password: '', // Password is not returned from API, leave blank
        role: employee.role || 'ENGINEER',
        department: employee.department || '',
        avatar: employee.avatar || ''
      });
    }
  }, [employee]);

  useEffect(() => {
    if (open) {
      fetchRoles();
    }
  }, [open]);

  const fetchRoles = async () => {
    try {
      const res = await api.get('/roles');
      if (res.data.success) {
        setRoles(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch roles', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.put(`/team-members/${employee.id}`, formData);
      toast({
        title: "Employee Updated",
        description: `${formData.name}'s details have been successfully updated.`,
      });
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Failed to update member', err);
      if (err.response?.data?.errors) {
        const errMsgs = err.response.data.errors.map((e: any) => e.message).join(', ');
        setError(errMsgs);
      } else if (err.response?.data?.error || err.response?.data?.message) {
        setError(err.response.data.error || err.response.data.message);
      } else {
        setError('Failed to update employee. Please check your inputs and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <div className="p-3 rounded-md bg-red-500/15 text-red-500 text-sm font-medium border border-red-500/20">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="edit-name">Full Name</Label>
            <Input id="edit-name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input id="edit-email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-password">New Password (Optional)</Label>
            <div className="relative">
              <Input id="edit-password" type={showPassword ? "text" : "password"} placeholder="Leave blank to keep current" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="pr-10" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-role">Role</Label>
            <Select value={formData.role} onValueChange={(val) => setFormData({...formData, role: val})}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roles.length > 0 ? roles.map(r => (
                  <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>
                )) : (
                  <SelectItem value="ENGINEER">ENGINEER</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-department">Department</Label>
            <Input id="edit-department" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} />
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
