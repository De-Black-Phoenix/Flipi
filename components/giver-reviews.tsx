"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
// Simple date formatting without external dependency
const formatTimeAgo = (date: string) => {
  const now = new Date();
  const past = new Date(date);
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? "s" : ""} ago`;
};

interface GiverReviewsProps {
  giverId: string;
}

interface Review {
  id: string;
  review_text: string;
  created_at: string;
  receiver: {
    full_name: string;
    avatar_url: string;
  };
}

export function GiverReviews({ giverId }: GiverReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const { data, error } = await supabase
          .from("giver_reviews")
          .select(`
            id,
            review_text,
            created_at,
            profiles!giver_reviews_receiver_id_fkey (
              full_name,
              avatar_url
            )
          `)
          .eq("giver_id", giverId)
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) {
          console.error("Error loading reviews:", error);
          return;
        }

        if (data) {
          setReviews(
            data.map((review: any) => ({
              id: review.id,
              review_text: review.review_text,
              created_at: review.created_at,
              receiver: review.profiles,
            }))
          );
        }
      } catch (err) {
        console.error("Error loading reviews:", err);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [giverId, supabase]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading reviews...</p>
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          Reviews ({reviews.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="flex gap-3 pb-4 border-b last:border-0 last:pb-0">
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarImage src={review.receiver.avatar_url} />
              <AvatarFallback>
                {review.receiver.full_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm user-name">
                  {review.receiver.full_name || "Anonymous"}
                </p>
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(review.created_at)}
                </span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                {review.review_text}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

