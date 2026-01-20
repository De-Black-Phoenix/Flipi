"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Calendar, MapPin, Gift } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { NGODashboardSkeleton } from "@/components/skeletons/ngo-dashboard-skeleton";

export default function NGODashboardPage() {
  const [ngo, setNgo] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
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

    // Load data in parallel for faster loading
    const loadData = async () => {
      const [profileResult, ngoResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single(),
        supabase
          .from("ngos")
          .select("*")
          .eq("admin_id", user.id)
          .single(),
      ]);

      const profile = profileResult.data;
      if (!profile || profile.user_type !== "ngo_admin") {
        router.replace("/dashboard");
        return;
      }

      const ngoData = ngoResult.data;
      if (!ngoData) {
        router.replace("/ngo/register");
        return;
      }

      setNgo(ngoData);

      // Load campaigns after NGO is set
      const { data: campaignsData } = await supabase
        .from("campaigns")
        .select(`
          *,
          items (
            id,
            title,
            status
          )
        `)
        .eq("ngo_id", ngoData.id)
        .order("created_at", { ascending: false });

      if (campaignsData) {
        setCampaigns(campaignsData);
      }

      setLoading(false);
    };

    loadData();
  }, [user, authLoading, supabase, router]);

  if (authLoading || loading || !ngo) {
    return <NGODashboardSkeleton />;
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-6xl mx-auto animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{ngo.name} Dashboard</h1>
        <p className="text-gray-600">Manage your campaigns and donations</p>
      </div>

      <div className="mb-6">
        <Button asChild>
          <Link href="/ngo/campaigns/new">
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Link>
        </Button>
      </div>

      {!campaigns || campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">You haven't created any campaigns yet.</p>
            <Button asChild>
              <Link href="/ngo/campaigns/new">Create Your First Campaign</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {campaigns.map((campaign: any) => {
            const donatedItems = campaign.items?.filter((item: any) => item.status === "available" || item.status === "given") || [];
            const receivedItems = campaign.items?.filter((item: any) => item.status === "given") || [];

            return (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">{campaign.title}</CardTitle>
                      <CardDescription className="mt-2">{campaign.description}</CardDescription>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/ngo/campaigns/${campaign.id}`}>Manage</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{campaign.region}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Ends {new Date(campaign.end_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Gift className="w-4 h-4" />
                      <span>{donatedItems.length} items donated</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Items received: {receivedItems.length} / {donatedItems.length}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${donatedItems.length > 0 ? (receivedItems.length / donatedItems.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
