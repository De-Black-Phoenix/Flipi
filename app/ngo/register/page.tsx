"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function RegisterNGOPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !description) {
      toast({
        title: "Please fill all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    // Update user type to ngo_admin
    await supabase
      .from("profiles")
      .update({ user_type: "ngo_admin" })
      .eq("id", user.id);

    // Create NGO
    const { error } = await supabase.from("ngos").insert({
      name,
      description,
      admin_id: user.id,
      status: "pending",
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Your NGO registration is pending approval.",
      });
      router.push("/ngo/dashboard");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-blue-50 to-white animate-in fade-in duration-300">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl">Register Your NGO</CardTitle>
          <CardDescription>
            Register your organization to start creating campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">NGO Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Community Help Foundation"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Tell us about your organization..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span>Registering...</span>
              ) : (
                "Register NGO"
              )}
            </Button>
            <p className="text-xs text-gray-500 text-center">
              Your registration will be reviewed by an admin before approval.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

