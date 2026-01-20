import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calendar, MapPin, Gift } from "lucide-react";
import { DonateItemButton } from "@/components/donate-item-button";

export default async function CampaignDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select(`
      *,
      ngos (
        name,
        description
      )
    `)
    .eq("id", params.id)
    .single();

  if (!campaign) {
    notFound();
  }

  const { data: items } = await supabase
    .from("items")
    .select("*")
    .eq("campaign_id", params.id)
    .eq("status", "available");

  return (
    <div className="min-h-screen px-4 py-8 max-w-4xl mx-auto animate-in fade-in duration-300">
      <Link href="/campaigns" className="text-blue-500 hover:underline mb-4 inline-block">
        ← Back to campaigns
      </Link>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl">{campaign.title}</CardTitle>
          <CardDescription className="text-base">
            by {campaign.ngos?.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-6">{campaign.description}</p>
          
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-5 h-5" />
              <span>{campaign.region}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-5 h-5" />
              <span>Ends {new Date(campaign.end_date).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-2">Items Needed:</h3>
            <div className="flex flex-wrap gap-2">
              {campaign.items_needed?.map((item: string, idx: number) => (
                <span
                  key={idx}
                  className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <DonateItemButton campaignId={params.id} />
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold mb-4">Donated Items ({items?.length || 0})</h2>
        {!items || items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No items donated yet. Be the first!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {items.map((item: any) => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="w-4 h-4" />
                    {item.town}, {item.region}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

