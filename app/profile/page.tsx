"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { createClient } from "@/lib/supabase/client";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useToast } from "@/hooks/use-toast";
import { Trophy, MapPin, Calendar, Edit, Star, Save, ImageIcon } from "lucide-react";
import { GiverReviews } from "@/components/giver-reviews";
import { ProfileSkeleton } from "@/components/skeletons/profile-skeleton";

const REGIONS = [
  "Greater Accra", "Ashanti", "Western", "Eastern", "Central", 
  "Northern", "Upper East", "Upper West", "Volta", "Brong Ahafo",
  "Western North", "Ahafo", "Bono", "Bono East", "Oti", "Savannah", "North East"
];

const REGION_TOWNS: Record<string, string[]> = {
  "Greater Accra": ["Accra", "Tema", "Madina", "Adenta", "Dansoman", "Other"],
  "Ashanti": ["Kumasi", "Obuasi", "Ejisu", "Mampong", "Other"],
  "Western": ["Takoradi", "Sekondi", "Tarkwa", "Other"],
  "Eastern": ["Koforidua", "Nsawam", "Suhum", "Other"],
  "Central": ["Cape Coast", "Kasoa", "Winneba", "Other"],
  "Northern": ["Tamale", "Yendi", "Savelugu", "Other"],
  "Upper East": ["Bolgatanga", "Navrongo", "Bawku", "Other"],
  "Upper West": ["Wa", "Lawra", "Tumu", "Other"],
  "Volta": ["Ho", "Hohoe", "Keta", "Other"],
  "Brong Ahafo": ["Sunyani", "Techiman", "Wenchi", "Other"],
  "Western North": ["Sefwi Wiawso", "Bibiani", "Other"],
  "Ahafo": ["Goaso", "Kenyasi", "Other"],
  "Bono": ["Sunyani", "Dormaa", "Other"],
  "Bono East": ["Techiman", "Kintampo", "Other"],
  "Oti": ["Dambai", "Jasikan", "Other"],
  "Savannah": ["Damongo", "Bole", "Other"],
  "North East": ["Nalerigu", "Gambaga", "Walewale", "Other"],
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [region, setRegion] = useState("");
  const [town, setTown] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuthGuard({ requireAuth: true });

  // Handle avatar image upload
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setAvatarUrl(data.secure_url);
      toast({
        title: "Success!",
        description: "Profile picture uploaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
    }

    setUploading(false);
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxFiles: 1,
    multiple: false,
  });

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        setProfile(data);
        // Initialize form fields when profile loads
        setFullName(data.full_name || "");
        setRegion(data.region || "");
        setTown(data.town || "");
        setAvatarUrl(data.avatar_url || "");
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, supabase]);

  // Update form fields when profile changes
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setRegion(profile.region || "");
      setTown(profile.town || "");
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [profile]);

  const handleOpenEditModal = () => {
    if (profile) {
      setFullName(profile.full_name || "");
      setRegion(profile.region || "");
      setTown(profile.town || "");
      setAvatarUrl(profile.avatar_url || "");
    }
    setEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          region: region || null,
          town: town || null,
          avatar_url: avatarUrl || null,
        })
        .eq("id", user.id);

      if (error) throw error;

      // Update local profile state
      setProfile({
        ...profile,
        full_name: fullName,
        region: region || null,
        town: town || null,
        avatar_url: avatarUrl || null,
      });

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      setEditModalOpen(false);
      router.refresh();
    } catch (err: any) {
      console.error("Error updating profile:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getRankInfo = (points: number) => {
    const tiers = [
      { name: "Seed", emoji: "🌱", min: 0, max: 4 },
      { name: "Helper", emoji: "🤝", min: 5, max: 14 },
      { name: "Giver", emoji: "🎁", min: 15, max: 29 },
      { name: "Hero", emoji: "⭐", min: 30, max: 59 },
      { name: "Champion", emoji: "🏅", min: 60, max: 99 },
      { name: "Guardian", emoji: "🕊", min: 100, max: Infinity },
    ];

    for (const tier of tiers) {
      if (points >= tier.min && points <= tier.max) {
        return tier;
      }
    }
    return tiers[0];
  };

  // Render immediately with skeleton while loading
  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 pt-8 md:pt-12 pb-8 md:pb-12">
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  const rankInfo = getRankInfo(profile.points || 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-3 md:pt-8 pb-20 md:pb-12">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <Avatar className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 border-4 border-primary/20">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl md:text-2xl font-bold">
              {profile.full_name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-xl md:text-3xl font-bold mb-2 user-name">{profile.full_name || "User"}</h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{profile.town || profile.region || "Ghana"}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-normal text-muted-foreground uppercase tracking-wider">Rank</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{rankInfo.emoji}</span>
                <div>
                  <p className="text-xl font-bold">{profile.rank || "Seed"}</p>
                  <p className="text-xs text-muted-foreground">{profile.points || 0} points</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-normal text-muted-foreground uppercase tracking-wider">Items Given</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xl font-bold">{profile.items_given || 0}</p>
                  <p className="text-xs text-muted-foreground">Regular items</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-normal text-muted-foreground uppercase tracking-wider">Campaign Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xl font-bold">{profile.campaign_items || 0}</p>
                  <p className="text-xs text-muted-foreground">Campaign items</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Details */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Your account details and activity</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenEditModal}
                className="border-transparent hover:bg-transparent hover:border hover:border-primary/20 hover:text-foreground"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Member Since</p>
                <p className="text-sm text-muted-foreground">
                  {profile.created_at 
                    ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                    : 'Recently'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-muted-foreground">
                  {profile.town && profile.region 
                    ? `${profile.town}, ${profile.region}`
                    : profile.region || profile.town || 'Not specified'}
                </p>
              </div>
            </div>
            {profile.email && (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reviews */}
        {user && <GiverReviews giverId={user.id} />}
      </div>

      {/* Edit Profile Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-[24px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-primary/20">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                    {fullName?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div
                  {...getRootProps()}
                  className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors shadow-lg border-2 border-background"
                >
                  <input {...getInputProps()} />
                  {uploading ? (
                    <span className="text-xs">Uploading...</span>
                  ) : (
                    <ImageIcon className="w-5 h-5" />
                  )}
                </div>
              </div>
              <div className="text-center">
                <Label className="text-sm font-medium">Profile Picture</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Click the icon to upload or replace
                </p>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="mt-1"
              />
            </div>

            {/* Region */}
            <div>
              <Label htmlFor="region">Region</Label>
              <SearchableSelect
                options={REGIONS}
                value={region}
                onValueChange={(value) => {
                  setRegion(value);
                  setTown(""); // Reset town when region changes
                }}
                placeholder="Search or select region"
                emptyMessage="No regions found"
                className="mt-1"
              />
            </div>

            {/* Town */}
            {region && REGION_TOWNS[region] && (
              <div>
                <Label htmlFor="town">Town/City</Label>
                <SearchableSelect
                  options={REGION_TOWNS[region]}
                  value={town}
                  onValueChange={setTown}
                  placeholder="Search or select your town/city"
                  emptyMessage="No towns found"
                  className="mt-1"
                />
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

