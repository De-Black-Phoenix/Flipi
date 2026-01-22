"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatSection } from "@/components/chat-section";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { ItemDetailSkeleton } from "@/components/skeletons/item-detail-skeleton";

export default function ItemManagementPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { user, loading: authLoading } = useAuthGuard({ requireAuth: true });

  useEffect(() => {
    if (!user || !params.id) return;

    const loadData = async () => {
      const { data: itemData } = await supabase
        .from("items")
        .select("*")
        .eq("id", params.id)
        .single();

      if (!itemData) {
        router.replace("/my-items");
        return;
      }

      if (itemData.owner_id !== user.id) {
        router.replace("/my-items");
        return;
      }

      setItem(itemData);

      const { data: conversationsData } = await supabase
        .from("conversations")
        .select(`
          *,
          profiles!conversations_requester_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq("item_id", params.id)
        .order("last_message_at", { ascending: false });

      if (conversationsData) {
        setConversations(conversationsData);
      }

      setLoading(false);
    };

    loadData();
  }, [user, params.id, supabase, router]);

  if (authLoading || loading) {
    return <ItemDetailSkeleton />;
  }

  if (!item) {
    return null;
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-6xl mx-auto animate-in fade-in duration-300">
      <Link href="/my-items" className="text-blue-500 hover:underline mb-4 inline-block">
        ← Back to my items
      </Link>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div>
          {item.images && item.images.length > 0 ? (
            <div className="relative aspect-square rounded-lg overflow-hidden border">
              <Image
                src={item.images[0]}
                alt={item.title}
                fill
                className="object-cover transition-opacity duration-300"
                loading="lazy"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ) : (
            <div className="aspect-square rounded-lg border bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400">No image</span>
            </div>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-2">{item.title}</h1>
          <p className="text-gray-700 mb-4">{item.description}</p>
          <div className="flex items-center gap-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm ${
              item.status === "available"
                ? "bg-green-100 text-green-700"
                : item.status === "reserved"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-gray-100 text-gray-700"
            }`}>
              {item.status}
            </span>
          </div>
        </div>
      </div>

      {!conversations || conversations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No requests yet for this item.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Requests ({conversations.length})</h2>
          {conversations.map((conversation: any) => (
            <Card key={conversation.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={conversation.profiles?.avatar_url} />
                      <AvatarFallback>
                        {conversation.profiles?.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg user-name">
                        {conversation.profiles?.full_name || "Anonymous"}
                      </CardTitle>
                      {conversation.owner_unread_count > 0 && (
                        <p className="text-sm text-blue-600">
                          {conversation.owner_unread_count} unread message
                          {conversation.owner_unread_count !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ChatSection
                  conversationId={conversation.id}
                  itemId={item.id}
                  requesterId={conversation.requester_id}
                  requesterName={conversation.profiles?.full_name || "User"}
                  itemStatus={item.status}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
