"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Calendar, User, Gift } from "lucide-react";
import { RequestItemButton } from "@/components/request-item-button";
import { ItemDetailSkeleton } from "@/components/skeletons/item-detail-skeleton";
import { GiverReviews } from "@/components/giver-reviews";

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<any>(null);
  const [owner, setOwner] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [hasRequested, setHasRequested] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      // Get current user
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);

      // Fetch item and check for existing conversation
      const [itemResult, conversationResult] = await Promise.all([
        supabase
          .from("items")
          .select("*")
          .eq("id", params.id)
          .single(),
        currentUser
          ? supabase
              .from("conversations")
              .select("id")
              .eq("item_id", params.id)
              .eq("requester_id", currentUser.id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      if (itemResult.error || !itemResult.data) {
        setLoading(false);
        return;
      }

      const itemData = itemResult.data;
      setItem(itemData);

      // Fetch owner profile
      const { data: ownerData } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, region, town, created_at")
        .eq("id", itemData.owner_id)
        .single();

      setOwner(ownerData);

      // Check if user has already requested
      if (conversationResult.data) {
        setHasRequested(true);
        setConversationId(conversationResult.data.id);
      }

      setLoading(false);
    };

    if (params.id) {
      loadData();
    }
  }, [params.id, supabase]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? "s" : ""} ago`;
  };

  const getMemberSince = (createdAt: string) => {
    const date = new Date(createdAt);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  if (loading) {
    return <ItemDetailSkeleton />;
  }

  if (!item) {
    return (
      <div className="h-full overflow-y-auto custom-scrollbar bg-background">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Card>
            <CardContent className="py-12 text-center">
              <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Item not found</h2>
              <p className="text-gray-500 mb-4">This item may have been removed or doesn&apos;t exist.</p>
              <Button asChild>
                <Link href="/find">Back to Find Items</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === item.owner_id;
  const images = item.images || [];
  const currentImage = images[selectedImageIndex] || null;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6">
      <Link
        href="/find"
        className="text-blue-500 hover:underline mb-4 inline-flex items-center gap-2"
      >
        ← Back to items
      </Link>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Image Gallery */}
        <div className="space-y-3">
          <div className="relative aspect-square rounded-lg overflow-hidden border bg-gray-100">
            {currentImage ? (
              <Image
                src={currentImage}
                alt={item.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Gift className="w-16 h-16 text-gray-300" />
              </div>
            )}
          </div>
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImageIndex === index
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${item.title} ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 25vw, 12.5vw"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Item Summary */}
        <div className="space-y-4">
          <div>
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-1.5">{item.title}</h1>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                    {item.category}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
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
                      : "Given out"}
                  </span>
                </div>
              </div>
            </div>
            {item.created_at && (
              <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                <Calendar className="w-4 h-4" />
                <span>Posted {formatDate(item.created_at)}</span>
              </div>
            )}
          </div>

          {/* Owner Information (Trust Signal) */}
          {owner && (
            <>
              <Card className="bg-blue-50/50 border-blue-100">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={owner.avatar_url} />
                      <AvatarFallback>
                        {owner.full_name?.charAt(0) || <User className="w-5 h-5" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">
                        {owner.full_name || "Community Member"}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-600 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        <span>
                          {owner.town || owner.region || "Ghana"}
                        </span>
                      </div>
                      {owner.created_at && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Member since {getMemberSince(owner.created_at)}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Giver Reviews */}
              <GiverReviews giverId={owner.id} />
            </>
          )}

          {/* Item Description */}
          <div>
            <h2 className="font-semibold text-base mb-2">Description</h2>
            <div className="prose prose-sm max-w-none">
              {item.description ? (
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">
                  {item.description}
                </p>
              ) : (
                <p className="text-gray-400 italic text-sm">
                  No description provided for this item.
                </p>
              )}
            </div>
          </div>

          {/* Item Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Category</p>
              <p className="font-medium text-sm">{item.category}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Condition</p>
              <p className="font-medium text-sm capitalize">
                {item.condition.replace("_", " ")}
              </p>
            </div>
          </div>

          {/* Location Info */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin className="w-4 h-4 text-gray-500" />
              <div>
                <p className="font-medium text-sm">{item.town}, {item.region}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Location shared for community connection. Exact address kept private for safety.
                </p>
              </div>
            </div>
          </div>

          {/* Primary CTA */}
          <div className="pt-3 border-t">
            {isOwner ? (
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-gray-600 mb-3">
                    This is your item. You can manage requests from your dashboard.
                  </p>
                  <Button asChild variant="outline" className="w-auto">
                    <Link href="/my-items">Manage Item</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : item.status === "available" ? (
              hasRequested && conversationId ? (
                <Button asChild className="w-auto" size="lg">
                  <Link href={`/chat/${conversationId}`}>View Chat</Link>
                </Button>
              ) : (
                <RequestItemButton itemId={item.id} />
              )
            ) : (
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-gray-600 mb-3">
                    This item is no longer available.
                  </p>
                  <Button asChild variant="outline" className="w-auto">
                    <Link href="/find">Browse More Items</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Sticky CTA on Mobile */}
      {!isOwner && item.status === "available" && !hasRequested && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg z-50">
          <RequestItemButton itemId={item.id} />
        </div>
      )}

      {/* Spacer for mobile sticky button */}
      {!isOwner && item.status === "available" && !hasRequested && (
        <div className="md:hidden h-20" />
      )}
      </div>
    </div>
  );
}
