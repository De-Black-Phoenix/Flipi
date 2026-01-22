"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useToast } from "@/hooks/use-toast";
import { ProfileSkeleton } from "@/components/skeletons/profile-skeleton";
import { Mail, Lock, Trash2, Moon, Sun, Monitor, Eye, EyeOff } from "lucide-react";

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Privacy settings
  const [showRank, setShowRank] = useState(true);
  const [showItemsGiven, setShowItemsGiven] = useState(true);
  
  // Notification settings
  const [requestNotifications, setRequestNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  
  // Account management dialogs
  const [changeEmailOpen, setChangeEmailOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  
  // Password visibility toggles
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Password verification state
  const [currentPasswordVerified, setCurrentPasswordVerified] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuthGuard({ requireAuth: true });
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        setProfile(data);
        setShowRank(data.show_rank !== false);
        setShowItemsGiven(data.show_items_given !== false);
        setRequestNotifications(data.request_notifications !== false);
        setMessageNotifications(data.message_notifications !== false);
      } catch (err) {
        console.error("Error loading profile:", err);
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, supabase, toast]);

  const handleSavePrivacy = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          show_rank: showRank,
          show_items_given: showItemsGiven,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Privacy settings updated",
      });
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to update privacy settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          request_notifications: requestNotifications,
          message_notifications: messageNotifications,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Notification settings updated",
      });
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!user || !newEmail) return;

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;

      toast({
        title: "Success",
        description: "Please check your new email for a confirmation link",
      });
      setChangeEmailOpen(false);
      setNewEmail("");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to change email",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyCurrentPassword = async () => {
    if (!user || !currentPassword) {
      toast({
        title: "Error",
        description: "Please enter your current password",
        variant: "destructive",
      });
      return;
    }

    setVerifyingPassword(true);
    try {
      // Verify current password by attempting to sign in
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      });

      if (error) {
        throw new Error("Current password is incorrect");
      }

      // Password is correct, allow password change
      setCurrentPasswordVerified(true);
      setCurrentPassword(""); // Clear password immediately after verification
      toast({
        title: "Verified",
        description: "Current password verified. You can now set a new password.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to verify password",
        variant: "destructive",
      });
      setCurrentPassword(""); // Clear password on error
    } finally {
      setVerifyingPassword(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user || !currentPasswordVerified || !newPassword) return;

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Update password
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast({
        title: "Success",
        description: "Password updated successfully",
      });
      setChangePasswordOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setCurrentPasswordVerified(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirm !== "DELETE") return;

    setSaving(true);
    try {
      // Call API route to delete account
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete account");
      }

      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted",
      });
      
      // Sign out and redirect
      await supabase.auth.signOut();
      router.push("/");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete account. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Render immediately with skeleton while loading
  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 md:px-6 pt-4 md:pt-8 pb-20 md:pb-12">
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 md:px-6 pt-3 md:pt-8 pb-20 md:pb-12">
        {/* Header */}
        <div className="mb-4 md:mb-8">
          <h1 className="text-lg md:text-3xl font-bold mb-2">Settings</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        {/* App Preferences */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>App Preferences</CardTitle>
            <CardDescription>Customize your app experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Theme</Label>
                <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
              </div>
              {mounted && (
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="w-4 h-4" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        System
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Notifications */}
            <div className="space-y-4">
              <div className="space-y-0.5">
                <Label>Notifications</Label>
                <p className="text-sm text-muted-foreground">Manage your notification preferences</p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-normal">Request notifications</Label>
                  <p className="text-xs text-muted-foreground">Get notified when someone requests your items</p>
                </div>
                <Switch
                  checked={requestNotifications}
                  onCheckedChange={(checked) => {
                    setRequestNotifications(checked);
                    handleSaveNotifications();
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-normal">Message notifications</Label>
                  <p className="text-xs text-muted-foreground">Get notified when you receive new messages</p>
                </div>
                <Switch
                  checked={messageNotifications}
                  onCheckedChange={(checked) => {
                    setMessageNotifications(checked);
                    handleSaveNotifications();
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Privacy</CardTitle>
            <CardDescription>Control what others can see about you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-normal">Show my rank</Label>
                <p className="text-xs text-muted-foreground">Display your rank on your profile</p>
              </div>
              <Switch
                checked={showRank}
                onCheckedChange={(checked) => {
                  setShowRank(checked);
                  handleSavePrivacy();
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-normal">Show my items given</Label>
                <p className="text-xs text-muted-foreground">Display your items given count on your profile</p>
              </div>
              <Switch
                checked={showItemsGiven}
                onCheckedChange={(checked) => {
                  setShowItemsGiven(checked);
                  handleSavePrivacy();
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="flex items-center gap-2">
                <Input value={user?.email || ""} disabled className="flex-1 bg-muted" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setChangeEmailOpen(true)}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Change
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="password"
                  value="••••••••"
                  disabled
                  className="flex-1 bg-muted"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setChangePasswordOpen(true)}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Change
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                variant="destructive"
                className="w-auto"
                onClick={() => setDeleteAccountOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                This action cannot be undone. All your data will be permanently deleted.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Change Email Dialog */}
      <Dialog open={changeEmailOpen} onOpenChange={setChangeEmailOpen}>
        <DialogContent className="rounded-[24px]">
          <DialogHeader>
            <DialogTitle>Change Email</DialogTitle>
            <DialogDescription>
              Enter your new email address. You'll receive a confirmation link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newEmail">New Email</Label>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new@example.com"
                className="mt-1"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setChangeEmailOpen(false)}
                className="border-transparent hover:bg-transparent hover:border hover:border-primary/20 hover:text-foreground"
              >
                Cancel
              </Button>
              <Button onClick={handleChangeEmail} disabled={saving || !newEmail}>
                {saving ? "Saving..." : "Change Email"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={(open) => {
        setChangePasswordOpen(open);
        if (!open) {
          // Reset all states when modal closes
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setShowNewPassword(false);
          setShowConfirmPassword(false);
          setCurrentPasswordVerified(false);
        }
      }}>
        <DialogContent className="rounded-[24px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              {currentPasswordVerified
                ? "Enter your new password below."
                : "First, verify your current password to continue."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!currentPasswordVerified ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="mt-1"
                      autoComplete="current-password"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleVerifyCurrentPassword();
                        }
                      }}
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 justify-end pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setChangePasswordOpen(false)}
                    className="border-transparent hover:bg-transparent hover:border hover:border-primary/20 hover:text-foreground"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleVerifyCurrentPassword}
                    disabled={verifyingPassword || !currentPassword}
                  >
                    {verifyingPassword ? "Verifying..." : "Verify Password"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter your new password"
                      className="mt-1 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {newPassword && newPassword.length < 6 && (
                    <p className="text-xs text-destructive mt-1">
                      Password must be at least 6 characters
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      className="mt-1 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-destructive mt-1">
                      Passwords do not match
                    </p>
                  )}
                </div>
                
                <div className="flex gap-3 justify-end pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentPasswordVerified(false);
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    className="border-transparent hover:bg-transparent hover:border hover:border-primary/20 hover:text-foreground"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleChangePassword}
                    disabled={saving || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
                  >
                    {saving ? "Saving..." : "Change Password"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
        <DialogContent className="rounded-[24px]">
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account and all associated data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="deleteConfirm">
                Type <span className="font-bold">DELETE</span> to confirm
              </Label>
              <Input
                id="deleteConfirm"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="mt-1"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteAccountOpen(false)}
                className="border-transparent hover:bg-transparent hover:border hover:border-primary/20 hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={saving || deleteConfirm !== "DELETE"}
              >
                {saving ? "Deleting..." : "Delete Account"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
