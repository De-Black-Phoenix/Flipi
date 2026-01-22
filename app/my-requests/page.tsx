"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

  useEffect(() => {
    if (!user) {
      setLoading(false);
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
  const handleConversationOpen = (conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, requester_unread_count: 0 } : conv
      )
    );
  };

  useEffect(() => {
    if (conversations.length === 0) return;

    const loadLastMessages = async () => {
      const messagePromises = conversations.map(async (conv: any) => {
        const { data } = await supabase
          .from("messages")
          .select("content, created_at, sender_id")
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

  const isSystemMessage = (conversation: any, lastMessage?: any) => {
    if (!lastMessage) return false;
    const itemTitle = conversation?.items?.title;
    if (itemTitle === "Flipi Moderation Notice") return true;
    const content = String(lastMessage.content || "");
    return content.startsWith("Warning from Flipi Moderation");
  };

  const groupConversationsByDate = (items: any[]) => {
    const groups: Record<string, any[]> = {};
    items.forEach((conv) => {
      const lastMessage = lastMessages[conv.id];
      const ts = lastMessage?.created_at || conv.last_message_at || conv.created_at;
      const date = ts ? new Date(ts) : new Date();
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const isSameDay = (a: Date, b: Date) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();

      let label = "Earlier";
      if (isSameDay(date, today)) label = "Today";
      else if (isSameDay(date, yesterday)) label = "Yesterday";
      else label = date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

      if (!groups[label]) groups[label] = [];
      groups[label].push(conv);
    });
    return groups;
  };

  // Render immediately with skeleton while loading
  if (loading) {
    return (
      <div className="h-full overflow-y-auto custom-scrollbar bg-background">
        <div className="max-w-6xl mx-auto px-4 md:px-6 pt-2 md:pt-6 pb-20 md:pb-6">
          <div className="space-y-3 md:space-y-4">
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
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-2 md:pt-6 pb-20 md:pb-6">
        {/* Back Button - Fixed at top (desktop) */}
        <div className="hidden md:block sticky top-12 md:top-0 z-50 bg-background/95 backdrop-blur-sm py-3 md:py-4 -mx-4 md:-mx-6 px-4 md:px-6 border-b border-border/40 mb-4 md:mb-6">
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

        <div className="hidden md:block pb-4 md:pb-6">
          <h1 className="text-xl md:text-3xl font-bold mb-2">My Requests</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Track your item requests and conversations
          </p>
        </div>

        {conversations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4 hidden md:block" />
              <p className="text-gray-500 mb-4">You haven&apos;t requested any items yet.</p>
              <Button asChild>
                <Link href="/find">Browse Items</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5 md:space-y-6">
            {Object.entries(groupConversationsByDate(conversations)).map(([groupLabel, groupItems]) => (
              <div key={groupLabel} className="space-y-3 md:space-y-4">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {groupLabel}
                </div>
                {groupItems.map((conversation: any) => {
                  const item = conversation.items;
                  const owner = conversation.profiles;
                  const isSystemChat = item?.title === "Flipi Moderation Notice";
                  const cardTitle = isSystemChat ? "Flipi Team" : (item?.title || "Item");
                  const ownerInitial = owner?.full_name?.charAt(0) || "U";
                  const lastMessage = lastMessages[conversation.id];

                  const hasUnread = conversation.requester_unread_count > 0;
                  const systemMessage = isSystemMessage(conversation, lastMessage);

                  return (
                    <Link
                      key={conversation.id}
                      href={`/chat/${conversation.id}`}
                      onClick={() => handleConversationOpen(conversation.id)}
                      className="block py-3 md:py-4 border-b border-border/60 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex gap-3">
                        {/* Account Avatar */}
                        <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border bg-gray-100 flex-shrink-0">
                          {owner?.avatar_url ? (
                            <Image
                              src={owner.avatar_url}
                              alt={owner?.full_name || "User"}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-muted-foreground">
                              {ownerInitial}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-semibold text-sm truncate">
                                {cardTitle}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-xs flex-1 min-w-0 text-muted-foreground">
                              <span className={`truncate ${hasUnread ? "font-semibold text-foreground" : ""}`}>
                                {lastMessage ? (
                                  <>
                                    {lastMessage.content.substring(0, 60)}
                                    {lastMessage.content.length > 60 ? "..." : ""}
                                  </>
                                ) : (
                                  "No messages yet"
                                )}
                              </span>
                              {systemMessage && (
                                <span className="ml-1 text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                  System
                                </span>
                              )}
                            </div>
                            {hasUnread && (
                              <span className="bg-blue-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">
                                {conversation.requester_unread_count > 9 ? "9+" : conversation.requester_unread_count}
                              </span>
                            )}
                          </div>

                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

