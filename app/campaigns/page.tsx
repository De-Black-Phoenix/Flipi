import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calendar, MapPin } from "lucide-react";

export default async function CampaignsPage() {
  const supabase = await createClient();
  
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select(`
      *,
      ngos (
        name,
        description
      )
    `)
    .order("created_at", { ascending: false });

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-background">
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-2 md:pt-6 pb-20 md:pb-6">

      {!campaigns || campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">No active campaigns yet.</p>
            <p className="text-sm text-gray-400">Check back soon for new opportunities to help!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {campaigns.map((campaign: any) => (
            <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{campaign.title}</CardTitle>
                <CardDescription>{campaign.ngos?.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {campaign.description}
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="w-4 h-4" />
                    {campaign.region}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    Ends {new Date(campaign.end_date).toLocaleDateString()}
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Items needed:</p>
                  <div className="flex flex-wrap gap-1">
                    {campaign.items_needed?.slice(0, 3).map((item: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                      >
                        {item}
                      </span>
                    ))}
                    {campaign.items_needed?.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{campaign.items_needed.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                <Button asChild className="w-auto">
                  <Link href={`/campaigns/${campaign.id}`}>View Campaign</Link>
                </Button>
            </CardContent>
          </Card>
        ))}
        </div>
      )}
      </div>
    </div>
  );
}

