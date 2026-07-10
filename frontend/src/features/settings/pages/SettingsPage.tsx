import React from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Bell, Shield, User, Palette, Save, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { AuthApi } from '@/features/auth/authApi';
import { useUIStore } from '@/store/uiStore';
import { Slider } from '@/components/ui/slider';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { zoomLevel, setZoomLevel } = useUIStore();
  const { toast } = useToast();

  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || 
             localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  const toggleDarkMode = (checked: boolean) => {
    setIsDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "New passwords do not match.",
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password must be at least 6 characters.",
      });
      return;
    }
    
    try {
      await AuthApi.changePassword(currentPassword, newPassword);
      toast({
        title: "Success",
        description: "Your security credentials have been updated.",
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to update password.",
      });
    }
  };

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your preferences have been successfully updated.",
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences, notifications, and profile details.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" /> <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="w-4 h-4" /> <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" /> <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" /> <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal details. Some fields are managed by your organization.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" defaultValue={user?.name} readOnly className="bg-muted/50 cursor-not-allowed" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" defaultValue={user?.email} readOnly className="bg-muted/50 cursor-not-allowed" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">System Role</Label>
                    <Input id="role" defaultValue={user?.role?.replace('_', ' ')} readOnly className="bg-muted/50 cursor-not-allowed" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input id="department" defaultValue={user?.department} readOnly className="bg-muted/50 cursor-not-allowed" />
                  </div>
                </div>
                


                <Button onClick={handleSave} className="flex items-center gap-2 mt-4">
                  <Save className="w-4 h-4" /> Save Profile
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how SprintOS looks on your device.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Toggle the dark theme for the application.
                    </p>
                  </div>
                  <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Compact View</Label>
                    <p className="text-sm text-muted-foreground">
                      Reduce spacing in tables and lists to fit more content.
                    </p>
                  </div>
                  <Switch defaultChecked={false} />
                </div>
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Application Zoom</Label>
                      <p className="text-sm text-muted-foreground">
                        Scale the entire application interface. Default is 90%.
                      </p>
                    </div>
                    <span className="font-bold text-lg text-primary">{zoomLevel}%</span>
                  </div>
                  <Slider 
                    value={[zoomLevel]} 
                    min={50} 
                    max={150} 
                    step={5} 
                    onValueChange={(vals) => setZoomLevel(vals[0])}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Configure how you receive alerts and updates.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive daily summaries and critical alerts via email.
                    </p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive browser push notifications for real-time updates.
                    </p>
                  </div>
                  <Switch defaultChecked={false} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Task Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when tasks assigned to you are modified.
                    </p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="pt-2">
            <Card className="border-0 shadow-none bg-transparent">
              <CardContent className="p-0">
                <div className="flex flex-col gap-8">
                  <div className="flex items-center gap-2 text-rose-600">
                    <Shield className="w-5 h-5" />
                    <h3 className="font-bold text-sm tracking-widest uppercase">Security & Password Manager</h3>
                  </div>

                  <div className="h-px bg-border w-full -mt-4" />

                  <div className="space-y-6 max-w-3xl">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold tracking-widest uppercase text-foreground">Current Password</Label>
                      <div className="relative max-w-md">
                        <Input 
                          type={showCurrentPassword ? "text" : "password"} 
                          placeholder="Enter current password" 
                          className="bg-muted/30 pr-10 border-muted-foreground/20 focus-visible:ring-rose-500" 
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                        <button 
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                           {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold tracking-widest uppercase text-foreground">New Password</Label>
                        <div className="relative">
                          <Input 
                            type={showNewPassword ? "text" : "password"} 
                            placeholder="Write new password" 
                            className="bg-muted/30 pr-10 border-muted-foreground/20 focus-visible:ring-rose-500" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                          />
                          <button 
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                             {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold tracking-widest uppercase text-foreground">Confirm New Password</Label>
                        <div className="relative">
                          <Input 
                            type={showConfirmPassword ? "text" : "password"} 
                            placeholder="Repeat new password" 
                            className="bg-muted/30 pr-10 border-muted-foreground/20 focus-visible:ring-rose-500" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                          <button 
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                             {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={handlePasswordUpdate}
                      disabled={!currentPassword || !newPassword || !confirmPassword}
                      className="bg-[#e10b41] hover:bg-[#c00a37] text-white px-6 font-semibold shadow-md rounded-md mt-4"
                    >
                      Update Security Credentials
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
