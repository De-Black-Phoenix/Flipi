"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Gift, CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyRequestsPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { user, loading: authLoading } = useAuthGuard({ requireAuth: true });

  // Find the return statement to add bg-cream

  useEffect(() => {
    if (!user) {
      if (!authLoading) {
        setLoading(false);
      }
      return;
    }

    const loadConversations = async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          items (
            id,
            title,
            images,
            status,
            owner_id,
            profiles!items_owner_id_fkey (
              full_name,
              avatar_url
            )
          ),
          profiles!conversations_owner_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq("requester_id", user.id)
        .order("last_message_at", { ascending: false });

      if (error) {
        console.error("Error loading conversations:", error);
      } else {
        setConversations(data || []);
      }
      setLoading(false);
    };

    loadConversations();

    // Subscribe to real-time updates for conversation changes
    const channel = supabase
      .channel(`my-requests-conversations-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `requester_id=eq.${user.id}`,
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, authLoading, supabase]);

  // Scroll detection for sticky title
  useEffect(() => {
    let scrollContainer: HTMLElement | null = null;
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      if (scrollContainer) {
        setIsScrolled(scrollContainer.scrollTop > 100);
      } else {
        setIsScrolled(window.scrollY > 100);
      }
    };

    timeoutId = setTimeout(() => {
      scrollContainer = document.querySelector('main div.overflow-y-auto') as HTMLElement;
      const target = scrollContainer || window;
      
      target.addEventListener("scroll", handleScroll, { passive: true });
      handleScroll();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      } else {
        window.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  const getStatusBadge = (status: string, itemStatus: string) => {
    if (itemStatus === "given") {
      if (status === "accepted") {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            <CheckCircle className="w-3 h-3" />
            Selected 🎉
          </span>
        );
      } else {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
            <XCircle className="w-3 h-3" />
            Not selected
          </span>
        );
      }
    }

    if (status === "accepted") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
          <CheckCircle className="w-3 h-3" />
          Accepted
        </span>
      );
    }

    if (status === "rejected") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
          <XCircle className="w-3 h-3" />
          Rejected
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
        <Clock className="w-3 h-3" />
        Pending
      </span>
    );
  };

  const [lastMessages, setLastMessages] = useState<Record<string, any>>({});

  useEffect(() => {
    if (conversations.length === 0) return;

    const loadLastMessages = async () => {
      const messagePromises = conversations.map(async (conv: any) => {
        const { data } = await supabase
          .from("messages")
          .select("content, created_at")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        return { conversationId: conv.id, message: data };
      });

      const results = await Promise.all(messagePromises);
      const messagesMap: Record<string, any> = {};
      results.forEach(({ conversationId, message }) => {
        messagesMap[conversationId] = message;
      });
      setLastMessages(messagesMap);
    };

    loadLastMessages();
  }, [conversations, supabase]);

  if (authLoading || loading) {
    return (
      <div className="h-full overflow-y-auto custom-scrollbar bg-background">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="mb-3">
            <Skeleton className="h-7 w-32" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="w-20 h-20 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Back Button - Fixed at top */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm py-4 -mx-4 px-4 border-b border-border/40 mb-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="border-transparent hover:bg-transparent hover:border hover:border-primary/20 hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          {isScrolled && (
            <h1 className="text-lg font-semibold text-foreground transition-opacity duration-200">
              My Requests
            </h1>
          )}
        </div>
      </div>
      
      <div className="mb-8 mt-4">
        <h1 className="text-4xl font-bold mb-2">My Requests</h1>
        <p className="text-gray-600">View and manage your item requests</p>
      </div>

      {conversations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">You haven&apos;t requested any items yet.</p>
            <Button asChild>
              <Link href="/find">Browse Items</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {conversations.map((conversation: any) => {
            const item = conversation.items;
            const owner = conversation.profiles;
            const lastMessage = lastMessages[conversation.id];

            const hasUnread = conversation.requester_unread_count > 0;

            return (
              <Card 
                key={conversation.id} 
                className={`hover:shadow-md transition-all ${
                  hasUnread 
                    ? "bg-blue-50/70 border-blue-300 border-2 shadow-md" 
                    : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Item Image */}
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border bg-gray-100 flex-shrink-0">
                      {item?.images && item.images.length > 0 ? (
                        <Image
                          src={item.images[0]}
                          alt={item?.title || "Item"}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Gift className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                            {item?.title || "Item"}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            Owner: {owner?.full_name || "Community Member"}
                          </p>
                        </div>
                        {getStatusBadge(conversation.status, item?.status || "available")}
                      </div>

                      {/* Last Message Preview */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-sm flex-1 min-w-0">
                          <MessageSquare className={`w-4 h-4 flex-shrink-0 ${hasUnread ? "text-blue-600" : "text-gray-500"}`} />
                          <span className={`truncate ${hasUnread ? "font-semibold text-gray-900" : "text-gray-500"}`}>
                          {lastMessage ? (
                            <>
                              {lastMessage.content.substring(0, 60)}
                              {lastMessage.content.length > 60 ? "..." : ""}
                            </>
                          ) : (
                            "No messages yet"
                          )}
                        </span>
                        </div>
                        {hasUnread && (
                          <span className="bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ml-2">
                            {conversation.requester_unread_count > 9 ? "9+" : conversation.requester_unread_count}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/chat/${conversation.id}`}>Open Chat</Link>
                        </Button>
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/items/${item?.id}`}>View Item</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}

