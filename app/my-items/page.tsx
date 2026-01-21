"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Gift, Edit2, Check, X, MapPin, Calendar, Trash2, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { MyItemsSkeleton } from "@/components/skeletons/my-items-skeleton";
import { ChatSection } from "@/components/chat-section";
import { GiveItemDialog } from "@/components/give-item-dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES = [
  "Electronics",
  "Clothing",
  "Furniture",
  "Books",
  "Toys",
  "Sports",
  "Home & Garden",
  "Other",
  "Arts",
];

const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

export default function MyItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingItem, setLoadingItem] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const hasAutoSelectedRef = useRef(false);
  const router = useRouter();
  const supabase = createClient();
  const { user, loading: authLoading } = useAuthGuard({ requireAuth: true });
  const { toast } = useToast();

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editCondition, setEditCondition] = useState("");
  const [editRegion, setEditRegion] = useState("");
  const [editTown, setEditTown] = useState("");
  const [saving, setSaving] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
      // Try to find the scroll container - check for AppShell's scroll container first, then the page's own container
      scrollContainer = document.querySelector('main div.overflow-y-auto') as HTMLElement;
      if (!scrollContainer) {
        scrollContainer = document.querySelector('.h-full.overflow-y-auto.custom-scrollbar') as HTMLElement;
      }
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

  // Load items list
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadItems = async () => {
      const { data } = await supabase
        .from("items")
        .select(`
          *,
          conversations (
            id,
            requester_id,
            owner_unread_count,
            last_message_at,
            profiles!conversations_requester_id_fkey (
              full_name,
              avatar_url
            )
          )
        `)
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setItems(data);
        // Auto-select first item on desktop (only once)
        if (data.length > 0 && !isMobile && !hasAutoSelectedRef.current) {
          setSelectedItemId(data[0].id);
          hasAutoSelectedRef.current = true;
        }
      }
      setLoading(false);
    };

    loadItems();
  }, [user, authLoading, supabase, isMobile]);

  // Load selected item details
  useEffect(() => {
    if (!selectedItemId || !user) return;

    const loadItemDetails = async () => {
      setLoadingItem(true);
      setIsEditing(false);

      const [itemResult, conversationsResult] = await Promise.all([
        supabase
          .from("items")
          .select("*")
          .eq("id", selectedItemId)
          .single(),
        supabase
          .from("conversations")
          .select(`
            *,
            profiles!conversations_requester_id_fkey (
              id,
              full_name,
              avatar_url
            )
          `)
          .eq("item_id", selectedItemId)
          .order("last_message_at", { ascending: false }),
      ]);

      if (itemResult.data) {
        setSelectedItem(itemResult.data);
        setEditTitle(itemResult.data.title);
        setEditDescription(itemResult.data.description);
        setEditCategory(itemResult.data.category);
        setEditCondition(itemResult.data.condition);
        setEditRegion(itemResult.data.region);
        setEditTown(itemResult.data.town);
      }

      if (conversationsResult.data) {
        setConversations(conversationsResult.data);
      }

      setLoadingItem(false);
    };

    loadItemDetails();

    // Subscribe to real-time updates for conversations
    if (selectedItemId) {
      const channel = supabase
        .channel(`my-items-conversations-${selectedItemId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "conversations",
            filter: `item_id=eq.${selectedItemId}`,
          },
          () => {
            loadItemDetails();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedItemId, user, supabase]);

  const handleItemClick = (itemId: string) => {
    if (isMobile) {
      router.push(`/items/${itemId}`);
    } else {
      setSelectedItemId(itemId);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedItemId || !editTitle || !editDescription || !editCategory || !editCondition || !editRegion || !editTown) {
      toast({
        title: "Please fill all fields",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("items")
      .update({
        title: editTitle,
        description: editDescription,
        category: editCategory,
        condition: editCondition,
        region: editRegion,
        town: editTown,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedItemId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    // Update local state
    setSelectedItem({
      ...selectedItem,
      title: editTitle,
      description: editDescription,
      category: editCategory,
      condition: editCondition,
      region: editRegion,
      town: editTown,
    });

    // Update items list
    setItems((prev) =>
      prev.map((item) =>
        item.id === selectedItemId
          ? {
              ...item,
              title: editTitle,
              description: editDescription,
              category: editCategory,
              condition: editCondition,
              region: editRegion,
              town: editTown,
            }
          : item
      )
    );

    setIsEditing(false);
    setSaving(false);
    toast({
      title: "Item updated",
      description: "Your item has been updated successfully.",
    });
  };

  const handleMarkAsGiven = async () => {
    if (!selectedItemId) return;

    const { error } = await supabase
      .from("items")
      .update({
        status: "given",
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedItemId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Award points via API
    try {
      const pointsResponse = await fetch("/api/points/award-item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId: selectedItemId }),
      });

      if (!pointsResponse.ok) {
        console.error("Failed to award points");
      }
    } catch (err) {
      console.error("Error awarding points:", err);
    }

    // Update local state
    setSelectedItem({ ...selectedItem, status: "given" });
    setItems((prev) =>
      prev.map((item) =>
        item.id === selectedItemId ? { ...item, status: "given" } : item
      )
    );

    toast({
      title: "Item marked as given",
      description: "This item has been marked as given.",
    });
  };

  const handleDelete = async () => {
    if (!selectedItemId || !confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      return;
    }

    const { error } = await supabase
      .from("items")
      .delete()
      .eq("id", selectedItemId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Remove from items list
    setItems((prev) => prev.filter((item) => item.id !== selectedItemId));
    setSelectedItemId(null);
    setSelectedItem(null);
    setConversations([]);

    toast({
      title: "Item deleted",
      description: "Your item has been deleted.",
    });
  };

  // Render immediately with skeleton while loading
  if (loading) {
    return <MyItemsSkeleton />;
  }

  if (!items || items.length === 0) {
    return (
      <div className="min-h-screen px-4 py-8 max-w-6xl mx-auto animate-in fade-in duration-300">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Items</h1>
          <p className="text-gray-600">Manage your listings and conversations</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">You haven&apos;t listed any items yet.</p>
            <Button asChild>
              <a href="/give">List Your First Item</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-background">
      <div className="max-w-6xl mx-auto h-full">
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
              My Items
            </h1>
          )}
        </div>
      </div>
      
      {/* Header - only on desktop */}
      {!isMobile && (
        <div className="px-4 py-6">
          <h1 className="text-2xl font-bold">My Items</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your listings and conversations</p>
        </div>
      )}

      {/* Mobile header */}
      {isMobile && (
        <div className="px-4 py-6">
          <h1 className="text-3xl font-bold mb-2">My Items</h1>
          <p className="text-gray-600">Manage your listings and conversations</p>
        </div>
      )}

      {/* Split view - desktop only */}
      {!isMobile ? (
        <div className="flex h-full">
          {/* Left Panel - Items List */}
          <div className="w-[35%] flex-shrink-0 border-r border-border overflow-y-auto">
            <div className="p-4 space-y-2">
              {items.map((item: any) => {
                const conversations = item.conversations || [];
                const totalUnread = conversations.reduce(
                  (sum: number, conv: any) => sum + (conv.owner_unread_count || 0),
                  0
                );
                const isSelected = selectedItemId === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      isSelected
                        ? "bg-blue-50 border-2 border-blue-200"
                        : "bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Thumbnail */}
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border bg-gray-100 flex-shrink-0">
                        {item.images && item.images.length > 0 ? (
                          <Image
                            src={item.images[0]}
                            alt={item.title}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Gift className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-1 line-clamp-1">{item.title}</h3>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              item.status === "available"
                                ? "bg-green-100 text-green-700"
                                : item.status === "reserved"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {item.status === "available"
                              ? "Available"
                              : item.status === "reserved"
                              ? "Requested"
                              : "Given"}
                          </span>
                          {conversations.length > 0 && (
                            <span className="text-xs text-gray-500">
                              Requests: {conversations.length}
                            </span>
                          )}
                        </div>
                        {totalUnread > 0 && (
                          <div className="flex items-center gap-1 text-xs text-blue-600">
                            <MessageSquare className="w-3 h-3" />
                            {totalUnread} unread
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Panel - Item Preview/Edit */}
          <div className="flex-1 min-w-0 overflow-y-auto">
            {loadingItem ? (
              <div className="p-6 space-y-6">
                <Skeleton className="aspect-[4/3] max-w-md mx-auto rounded-lg" />
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : selectedItem ? (
              <div className="p-6 space-y-6">
                {/* Image Gallery */}
                {selectedItem.images && selectedItem.images.length > 0 ? (
                  <div className="relative aspect-[4/3] max-w-md mx-auto rounded-lg overflow-hidden border bg-gray-100">
                    <Image
                      src={selectedItem.images[0]}
                      alt={selectedItem.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 400px"
                    />
                  </div>
                ) : (
                  <div className="aspect-[4/3] max-w-md mx-auto rounded-lg border bg-gray-100 flex items-center justify-center">
                    <Gift className="w-12 h-12 text-gray-300" />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </Button>
                      {selectedItem.status !== "given" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleMarkAsGiven}
                          className="flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Mark as Given
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDelete}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={saving}
                        className="flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        {saving ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsEditing(false);
                          setEditTitle(selectedItem.title);
                          setEditDescription(selectedItem.description);
                          setEditCategory(selectedItem.category);
                          setEditCondition(selectedItem.condition);
                          setEditRegion(selectedItem.region);
                          setEditTown(selectedItem.town);
                        }}
                        className="flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    </>
                  )}
                </div>

                {/* Edit Form */}
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="mt-1"
                        rows={4}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select value={editCategory} onValueChange={setEditCategory}>
                          <SelectTrigger id="category" className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="condition">Condition</Label>
                        <Select value={editCondition} onValueChange={setEditCondition}>
                          <SelectTrigger id="condition" className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CONDITIONS.map((cond) => (
                              <SelectItem key={cond.value} value={cond.value}>
                                {cond.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="region">Region</Label>
                        <Input
                          id="region"
                          value={editRegion}
                          onChange={(e) => setEditRegion(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="town">Town</Label>
                        <Input
                          id="town"
                          value={editTown}
                          onChange={(e) => setEditTown(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <>
                    <div>
                      <h2 className="text-2xl font-bold mb-2">{selectedItem.title}</h2>
                      <div className="flex items-center gap-2 mb-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            selectedItem.status === "available"
                              ? "bg-green-100 text-green-700"
                              : selectedItem.status === "reserved"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {selectedItem.status === "available"
                            ? "Available"
                            : selectedItem.status === "reserved"
                            ? "Requested"
                            : "Given"}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                          {selectedItem.category}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-4">{selectedItem.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>
                            {selectedItem.town}, {selectedItem.region}
                          </span>
                        </div>
                        {selectedItem.created_at && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Posted {new Date(selectedItem.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Requests */}
                    {conversations.length > 0 ? (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">
                          Requests ({conversations.length})
                        </h3>
                        {conversations.map((conversation: any) => {
                          const getStatusBadge = () => {
                            if (conversation.status === "accepted") {
                              return (
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                  Selected
                                </span>
                              );
                            }
                            if (conversation.status === "rejected") {
                              return (
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                                  Not selected
                                </span>
                              );
                            }
                            return (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                                Pending
                              </span>
                            );
                          };

                          const hasUnread = conversation.owner_unread_count > 0;

                          return (
                            <Card 
                              key={conversation.id}
                              className={`transition-all ${
                                hasUnread 
                                  ? "bg-blue-50/70 border-blue-300 border-2 shadow-md" 
                                  : ""
                              }`}
                            >
                              <CardContent className="pt-4">
                                <div className="flex items-center gap-3 mb-4">
                                  <Avatar>
                                    <AvatarImage src={conversation.profiles?.avatar_url} />
                                    <AvatarFallback>
                                      {conversation.profiles?.full_name?.charAt(0) || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className={`${hasUnread ? "font-bold" : "font-semibold"}`}>
                                        {conversation.profiles?.full_name || "Anonymous"}
                                      </p>
                                      {getStatusBadge()}
                                      {hasUnread && (
                                        <span className="bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ml-auto">
                                          {conversation.owner_unread_count > 9 ? "9+" : conversation.owner_unread_count}
                                        </span>
                                      )}
                                    </div>
                                    {hasUnread && (
                                      <p className="text-sm text-blue-600 font-medium">
                                        {conversation.owner_unread_count} unread message
                                        {conversation.owner_unread_count !== 1 ? "s" : ""}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button asChild variant="outline" size="sm" className="flex-1">
                                    <Link href={`/chat/${conversation.id}`}>Open Chat</Link>
                                  </Button>
                                  {selectedItem.status === "available" &&
                                    conversation.status === "pending" && (
                                      <GiveItemDialog
                                        itemId={selectedItem.id}
                                        requesterId={conversation.requester_id}
                                        requesterName={conversation.profiles?.full_name || "User"}
                                      />
                                    )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="py-8 text-center">
                          <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500">No requests yet for this item.</p>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>
            ) : (
              /* Empty State */
              <div className="h-full flex items-center justify-center p-6">
                <div className="text-center">
                  <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-1">Select an item</h3>
                  <p className="text-sm text-gray-500">
                    Click on an item on the left to preview or manage it here.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Mobile List View */
        <div className="px-4 space-y-4 pb-8">
          {items.map((item: any) => {
            const conversations = item.conversations || [];
            const totalUnread = conversations.reduce(
              (sum: number, conv: any) => sum + (conv.owner_unread_count || 0),
              0
            );

            return (
              <Card key={item.id} className="cursor-pointer" onClick={() => handleItemClick(item.id)}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border bg-gray-100 flex-shrink-0">
                      {item.images && item.images.length > 0 ? (
                        <Image
                          src={item.images[0]}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Gift className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 line-clamp-1">{item.title}</h3>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.status === "available"
                              ? "bg-green-100 text-green-700"
                              : item.status === "reserved"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {item.status === "available"
                            ? "Available"
                            : item.status === "reserved"
                            ? "Requested"
                            : "Given"}
                        </span>
                        {conversations.length > 0 && (
                          <span className="text-xs text-gray-500">
                            {conversations.length} request{conversations.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      {totalUnread > 0 && (
                        <div className="flex items-center gap-1 text-xs text-blue-600">
                          <MessageSquare className="w-3 h-3" />
                          {totalUnread} unread
                        </div>
                      )}
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
