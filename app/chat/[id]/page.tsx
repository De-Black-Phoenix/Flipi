"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { Send, ArrowLeft, CheckCircle, Gift, MessageSquare } from "lucide-react";
import { GiveItemDialog } from "@/components/give-item-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;
  const [conversation, setConversation] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);
  const { user, loading: authLoading } = useAuthGuard({ requireAuth: true });
  const { toast } = useToast();

  useEffect(() => {
    if (!user || !conversationId) {
      if (!authLoading) {
        setLoading(false);
      }
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);

        // Get current user
        const {
          data: { user: currentUserData },
        } = await supabase.auth.getUser();
        setCurrentUser(currentUserData);

        if (!currentUserData) {
          router.push("/login");
          return;
        }

        // Load conversation
        const { data: convData, error: convError } = await supabase
          .from("conversations")
          .select("*")
          .eq("id", conversationId)
          .single();

        if (convError || !convData) {
          toast({
            title: "Error",
            description: "Conversation not found.",
            variant: "destructive",
          });
          router.push("/my-requests");
          return;
        }

        // Verify user is part of conversation
        const isRequester = convData.requester_id === currentUserData.id;
        const isOwner = convData.owner_id === currentUserData.id;

        if (!isRequester && !isOwner) {
          toast({
            title: "Error",
            description: "You don't have access to this conversation.",
            variant: "destructive",
          });
          router.push(isOwner ? "/my-items" : "/my-requests");
          return;
        }

        // Load item
        const { data: itemData } = await supabase
          .from("items")
          .select("id, title, images, status, owner_id")
          .eq("id", convData.item_id)
          .single();

        // Load profiles
        const [requesterResult, ownerResult] = await Promise.all([
          supabase.from("profiles").select("id, full_name, avatar_url").eq("id", convData.requester_id).single(),
          supabase.from("profiles").select("id, full_name, avatar_url").eq("id", convData.owner_id).single(),
        ]);

        const fullConversation = {
          ...convData,
          items: itemData,
          profiles_conversations_requester_id_fkey: requesterResult.data,
          profiles_conversations_owner_id_fkey: ownerResult.data,
        };
        setConversation(fullConversation);
        
        // Also add to conversations list if not already there
        setConversations(prev => {
          const exists = prev.find(c => c.id === convData.id);
          if (!exists && itemData) {
            return [fullConversation, ...prev];
          }
          return prev;
        });

        // Load messages
        const { data: messagesData } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (messagesData) {
          // Load profiles for messages with sender_id
          const messagesWithProfiles = await Promise.all(
            messagesData.map(async (msg) => {
              if (!msg.sender_id) {
                return { ...msg, profiles: null };
              }
              const { data: profileData } = await supabase
                .from("profiles")
                .select("id, full_name, avatar_url")
                .eq("id", msg.sender_id)
                .single();
              return { ...msg, profiles: profileData };
            })
          );
          setMessages(messagesWithProfiles);
        }

        // Mark conversation as read
        if (isOwner) {
          await supabase
            .from("conversations")
            .update({ 
              owner_unread_count: 0,
              is_read_by_owner: true 
            })
            .eq("id", conversationId);
        } else {
          await supabase
            .from("conversations")
            .update({ 
              requester_unread_count: 0,
              is_read_by_requester: true 
            })
            .eq("id", conversationId);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading chat:", error);
        toast({
          title: "Error",
          description: "Failed to load conversation.",
          variant: "destructive",
        });
        router.push("/my-requests");
        setLoading(false);
      }
    };

    loadData();

    // Subscribe to new messages and conversation status changes
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMsg = payload.new as any;
          if (newMsg.sender_id) {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("id, full_name, avatar_url")
              .eq("id", newMsg.sender_id)
              .single();
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, { ...newMsg, profiles: profileData }];
            });
          } else {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, { ...newMsg, profiles: null }];
            });
          }
          setTimeout(() => scrollToBottom(), 100);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `id=eq.${conversationId}`,
        },
        async (payload) => {
          // Update conversation state when status changes (e.g., accepted/rejected)
          const updatedConv = payload.new as any;
          
          // Reload item data to get updated status
          if (updatedConv.item_id) {
            const { data: itemData } = await supabase
              .from("items")
              .select("id, title, images, status, owner_id")
              .eq("id", updatedConv.item_id)
              .single();
            
            setConversation((prev: any) => ({
              ...prev,
              ...updatedConv,
              items: itemData || prev.items,
            }));
          } else {
          setConversation((prev: any) => ({ ...prev, ...updatedConv }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, conversationId, authLoading]);

  // Subscribe to item status changes for realtime updates
  useEffect(() => {
    if (!conversation?.item_id) return;

    const channel = supabase
      .channel(`item:${conversation.item_id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "items",
          filter: `id=eq.${conversation.item_id}`,
        },
        (payload) => {
          // Update item status when it changes (e.g., from "available" to "given")
          const updatedItem = payload.new as any;
          setConversation((prev: any) => ({
            ...prev,
            items: updatedItem || prev.items,
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation?.item_id, supabase]);

  // Load all conversations for the sidebar
  useEffect(() => {
    if (!user) return;

    const loadConversations = async () => {
      try {
        const { data, error } = await supabase
          .from("conversations")
          .select(`
            *,
            items (
              id,
              title,
              images,
              status
            ),
            profiles!conversations_requester_id_fkey (
              id,
              full_name,
              avatar_url
            ),
            profiles!conversations_owner_id_fkey (
              id,
              full_name,
              avatar_url
            )
          `)
          .or(`owner_id.eq.${user.id},requester_id.eq.${user.id}`)
          .order("last_message_at", { ascending: false });

        if (error) {
          console.error("Error loading conversations:", error);
          return;
        }

        if (data) {
          console.log("Loaded conversations:", data.length, data);
          // Filter out any conversations without items (shouldn't happen, but safety check)
          let validConversations = data.filter(conv => conv.items !== null);
          
          // Ensure current conversation is in the list if it exists
          if (conversation && conversation.id && !validConversations.find(c => c.id === conversation.id)) {
            console.log("Adding current conversation to list:", conversation);
            validConversations = [conversation, ...validConversations];
          }
          
          setConversations(validConversations);
        } else {
          console.log("No conversations data returned");
          // If we have a current conversation, show at least that
          if (conversation && conversation.id) {
            console.log("No data but have current conversation, showing it:", conversation);
            setConversations([conversation]);
          } else {
            setConversations([]);
          }
        }
      } catch (err) {
        console.error("Exception loading conversations:", err);
      }
    };

    loadConversations();

    // Subscribe to conversation updates
    const channel = supabase
      .channel(`user-conversations-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `owner_id=eq.${user.id}`,
        },
        () => {
          loadConversations();
        }
      )
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
  }, [user, supabase]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;

    setSending(true);
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: currentUser.id,
      content: newMessage.trim(),
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setNewMessage("");
    }
    setSending(false);
  };

  if (authLoading || loading) {
    return (
      <div className="h-full overflow-y-auto bg-background">
        <div className="max-w-7xl mx-auto px-4 py-4">
        <Skeleton className="h-10 w-32 mb-4" />
          <Card className="h-[calc(100vh-12rem)]">
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full rounded-lg mb-4" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return null;
  }

  const item = conversation.items;
  const requester = conversation.profiles_conversations_requester_id_fkey;
  const owner = conversation.profiles_conversations_owner_id_fkey;
  const isOwner = currentUser?.id === conversation.owner_id;
  const isRequester = currentUser?.id === conversation.requester_id;
  const otherParticipant = isOwner ? requester : owner;
  
  /**
   * Chat Lock/Unlock Rules:
   * 
   * System Messages:
   * - Delivery note: Automatically inserted when conversation is created (in request-item-button.tsx)
   * - Congratulations: Sent to receiver when selected (in give-item-dialog.tsx)
   * - Thank you: Sent to giver when item is given (in give-item-dialog.tsx)
   * - Rejection: Sent to rejected requesters (in give-item-dialog.tsx)
   * 
   * BEFORE Selection (conversation.status === "pending"):
   * - All requesters can chat with owner → UNLOCKED
   * - Owner can chat with all requesters → UNLOCKED
   * 
   * AFTER Selection:
   * - Owner and selected requester (conversation.status === "accepted") → conversation stays UNLOCKED
   *   Both can continue coordinating pickup/delivery
   * - All other requesters (conversation.status === "rejected") → conversation becomes LOCKED
   *   Message input is disabled, rejection message is shown
   * 
   * Lock conditions:
   * - conversation.status === "rejected" → LOCKED (for rejected requesters)
   * - conversation.status === "accepted" but current user is NOT the requester AND NOT the owner → LOCKED
   * - item.status === "given" and conversation.status !== "accepted" → LOCKED
   * 
   * Unlock conditions:
   * - conversation.status === "pending" → UNLOCKED (both owner and requester can chat)
   * - conversation.status === "accepted" AND (isRequester OR isOwner) → UNLOCKED (selected requester and owner can still chat)
   */
  const isConversationLocked = 
    conversation.status === "rejected" ||
    (conversation.status === "accepted" && !isRequester && !isOwner) ||
    (item?.status === "given" && conversation.status !== "accepted");
  
  const canSendMessages = !isConversationLocked;

  // Get last message for preview
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Conversations List (X DMs style) */}
        <div className="hidden lg:flex flex-col w-80 border-r border-border overflow-hidden h-full">
          <div className="flex-shrink-0 px-4 py-3 border-b border-border">
            <h2 className="text-lg font-bold">Messages</h2>
            <p className="text-xs text-muted-foreground mt-1">Your conversations</p>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Conversation list */}
            {conversations.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">No conversations yet</p>
              </div>
            ) : (
              <div>
                {conversations.map((conv, index) => {
                  // Safety checks
                  if (!conv || !conv.id) {
                    console.warn("Invalid conversation:", conv);
                    return null;
                  }

                  const convItem = conv.items;
                  const isOwner = user?.id === conv.owner_id;
                  const otherParticipant = isOwner 
                    ? conv.profiles_conversations_requester_id_fkey 
                    : conv.profiles_conversations_owner_id_fkey;
                  const unreadCount = isOwner 
                    ? (conv.owner_unread_count || 0) 
                    : (conv.requester_unread_count || 0);
                  const isActive = conv.id === conversationId;

                  // Debug log for skateboard
                  if (convItem?.title?.toLowerCase().includes("skateboard")) {
                    console.log("Skateboard conversation found:", {
                      convId: conv.id,
                      item: convItem,
                      otherParticipant,
                      isActive,
                      unreadCount
                    });
                  }

                  return (
                    <div key={conv.id}>
                      <Link href={`/chat/${conv.id}`}>
                        <div
                          className={`px-4 py-3 cursor-pointer transition-colors ${
                            isActive 
                              ? "bg-primary/5" 
                              : "hover:bg-neutral-100"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Item Image / Avatar */}
                            {convItem?.images && convItem.images.length > 0 ? (
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                <Image
                                  src={convItem.images[0]}
                                  alt={convItem?.title || "Item"}
                                  fill
                                  className="object-cover"
                                  sizes="48px"
                                />
                              </div>
                            ) : (
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                                <Gift className="w-6 h-6 text-gray-300" />
                              </div>
                            )}

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h3 className="font-semibold text-sm line-clamp-1 text-foreground">
                                  {convItem?.title || "Item"}
                                </h3>
                                {unreadCount > 0 && (
                                  <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex-shrink-0">
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                <span className="user-name">{otherParticipant?.full_name || "User"}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                      {index < conversations.length - 1 && (
                        <div className="h-[1px] w-full bg-neutral-200" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Active Chat */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden h-full">
          <div className="max-w-4xl mx-auto w-full flex flex-col h-full">
            {/* Chat Header */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-border flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild className="lg:hidden">
          <Link href={isOwner ? "/my-items" : "/my-requests"}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>
              <Avatar className="w-10 h-10">
                <AvatarImage src={otherParticipant?.avatar_url} />
                <AvatarFallback>
                  {otherParticipant?.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="text-base text-foreground user-name">{otherParticipant?.full_name || "User"}</h2>
                <p className="text-xs text-muted-foreground line-clamp-1">{item?.title || "Item"}</p>
              </div>
              {conversation.status === "accepted" && (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  <CheckCircle className="w-3 h-3" />
                  Selected
                </div>
              )}
      </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-4 px-4 py-4 bg-background min-h-0">
            {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-center text-muted-foreground">No messages yet. Start the conversation!</p>
                </div>
            ) : (
                <div className="space-y-3">
                  {messages.map((message) => {
                const isSystemMessage = message.sender_id === null;
                const isOwnMessage = message.sender_id === currentUser?.id;

                if (isSystemMessage) {
                  return (
                    <div key={message.id} className="flex justify-center my-2">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 max-w-md">
                            <p className="text-sm text-blue-800 text-center whitespace-pre-line">{message.content}</p>
                        <p className="text-xs text-blue-600 text-center mt-1">
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={message.id} className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}>
                        {!isOwnMessage && (
                          <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={message.profiles?.avatar_url} />
                      <AvatarFallback>{message.profiles?.full_name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                        )}
                        <div className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"} max-w-[70%]`}>
                      <div
                            className={`rounded-lg px-4 py-2 ${
                              isOwnMessage ? "bg-blue-500 text-white" : "bg-card text-card-foreground border border-border"
                        }`}
                      >
                            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                      </div>
                          <p className={`text-xs text-muted-foreground mt-1 ${isOwnMessage ? "text-right" : "text-left"}`}>
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
                  })}
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>

            {/* Message Input Area - Fixed Bottom */}
          {isOwner && item?.status === "available" && conversation.status === "pending" && (
              <div className="flex-shrink-0 px-4 pt-2 pb-2 border-t border-border">
              <GiveItemDialog
                itemId={item.id}
                requesterId={conversation.requester_id}
                requesterName={requester?.full_name || "User"}
              />
            </div>
          )}

          {canSendMessages ? (
              <div className="flex-shrink-0 flex gap-2 px-4 py-3 border-t border-border bg-background">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type a message..."
                disabled={sending}
                  className="flex-1"
              />
              <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          ) : (
              <div className="flex-shrink-0 text-center text-sm text-muted-foreground py-3 border-t border-border bg-background">
              {conversation.status === "rejected" ? (
                <p>❌ This item has been given to someone else.<br />Best of luck next time.</p>
                ) : conversation.status === "accepted" && !isRequester && !isOwner ? (
                <p>❌ This item has been given to someone else.<br />Best of luck next time.</p>
                ) : item?.status === "given" && conversation.status !== "accepted" ? (
                <p>This conversation is now closed.</p>
              ) : (
                <p>This conversation is closed.</p>
              )}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
