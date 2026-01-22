"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApproveNGOButton } from "@/components/approve-ngo-button";
import { createClient } from "@/lib/supabase/client";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { ListSkeleton } from "@/components/skeletons/list-skeleton";

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [ngos, setNgos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();
  const { user, loading: authLoading } = useAuthGuard({ requireAuth: true });

  useEffect(() => {
    if (!user) {
      if (!authLoading) {
        setLoading(false);
      }
      return;
    }

    // Load data immediately when user is available
    const loadData = async () => {
      const [profileResult, usersResult, ngosResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single(),
        supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("ngos")
          .select(`
            *,
            profiles!ngos_admin_id_fkey (
              full_name,
              email
            )
          `)
          .order("created_at", { ascending: false }),
      ]);

      const profile = profileResult.data;
      if (!profile || (profile?.role !== "platform_admin" && profile?.user_type !== "platform_admin")) {
        router.replace("/");
        return;
      }

      if (usersResult.data) {
        setUsers(usersResult.data);
      }

      if (ngosResult.data) {
        setNgos(ngosResult.data);
      }

      setLoading(false);
    };

    loadData();
  }, [user, authLoading, supabase, router]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-3 md:pt-8 pb-20 md:pb-12 animate-in fade-in duration-300">
        <div className="mb-4 md:mb-8 hidden md:block">
        <div className="flex items-center justify-between">
          <div>
              <h1 className="text-lg md:text-4xl font-bold mb-2">Admin Panel</h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Manage users, NGOs, and platform content
              </p>
          </div>
          <Button asChild>
            <Link href="/admin/settings">Platform Settings</Link>
          </Button>
        </div>
      </div>

        <Tabs defaultValue="ngos" className="space-y-6">
        <TabsList>
          <TabsTrigger value="ngos">NGOs</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="ngos" className="space-y-4">
          {authLoading || loading ? (
            <ListSkeleton count={5} />
          ) : !ngos || ngos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">No NGOs registered yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {ngos.map((ngo: any) => (
                <Card key={ngo.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{ngo.name}</CardTitle>
                        <CardDescription>
                          Admin: <span className="user-name">{ngo.profiles?.full_name || ngo.profiles?.email}</span>
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            ngo.status === "approved"
                              ? "bg-green-100 text-green-700"
                              : ngo.status === "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {ngo.status}
                        </span>
                        {ngo.status === "pending" && (
                          <ApproveNGOButton ngoId={ngo.id} />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">{ngo.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          {authLoading || loading ? (
            <ListSkeleton count={10} />
          ) : !users || users.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">No users found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {users.map((user: any) => (
                <Card key={user.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="user-name">{user.full_name || "Anonymous"}</CardTitle>
                        <CardDescription>{user.email}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">
                          {user.user_type}
                        </span>
                        <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
                          {user.rank} ({user.points} pts)
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      {user.region && user.town
                        ? `${user.town}, ${user.region}`
                        : "Location not set"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
