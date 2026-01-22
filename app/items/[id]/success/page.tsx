"use client";

import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PartyPopper, Heart, Star } from "lucide-react";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const receiverId = searchParams.get("receiver");
  const itemId = params.id as string;
  const [showDonation, setShowDonation] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [giverId, setGiverId] = useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id === receiverId && itemId) {
        // Fetch item to get giver_id
        const { data: item } = await supabase
          .from("items")
          .select("owner_id")
          .eq("id", itemId)
          .single();
        
        if (item) {
          setGiverId(item.owner_id);
          setShowReview(true);
        }
      }
    };

    checkUser();
  }, [receiverId, itemId, supabase]);

  const handleDonate = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    // Initialize Paystack
    if (typeof window === "undefined" || !(window as any).PaystackPop) {
      toast({
        title: "Payment system not ready",
        description: "Please refresh the page and try again.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const handler = (window as any).PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
      email: user.email || "",
      amount: 100, // GH₵1 = 100 pesewas
      currency: "GHS",
      ref: `flipi_${Date.now()}`,
      callback: async (response: any) => {
        const { error } = await supabase.from("donations").insert({
          user_id: user.id,
          amount: 1.0,
          paystack_reference: response.reference,
          status: "completed",
        });

        if (error) {
          console.error("Donation record error:", error);
        }

        toast({
          title: "Thank you! 🎉",
          description: "Your support helps Flipi grow.",
        });

        setShowDonation(false);
        router.push("/dashboard");
      },
      onClose: () => {
        setShowDonation(false);
        router.push("/dashboard");
      },
    });

    handler.openIframe();
    setLoading(false);
  };

  const handleSkip = () => {
    setShowDonation(false);
    router.push("/dashboard");
  };

  const handleSubmitReview = async () => {
    if (!reviewText.trim() || !giverId || !itemId || !receiverId) {
      toast({
        title: "Error",
        description: "Please enter a review.",
        variant: "destructive",
      });
      return;
    }

    setSubmittingReview(true);

    try {
      const { error } = await supabase
        .from("giver_reviews")
        .insert({
          giver_id: giverId,
          receiver_id: receiverId,
          item_id: itemId,
          review_text: reviewText.trim(),
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Thank you!",
        description: "Your review has been submitted.",
      });

      setShowReview(false);
      setReviewText("");
      
      // Show donation modal after review
      setShowDonation(true);
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit review.",
        variant: "destructive",
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSkipReview = () => {
    setShowReview(false);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-blue-50 to-white">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PartyPopper className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-3xl">Congratulations! 🎉</CardTitle>
          <CardDescription className="text-base">
            The owner has given you this item!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-600 mb-6">
            You can now coordinate pickup or drop-off with the owner through your chat.
          </p>
          <Button onClick={() => router.push("/dashboard")} className="w-auto">
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showReview} onOpenChange={setShowReview}>
        <DialogContent className="dialog-success">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Leave a Review
            </DialogTitle>
            <DialogDescription>
              Share your experience with the giver. Your feedback helps build trust in our community.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Write your review here..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleSkipReview} className="flex-1" disabled={submittingReview}>
                Skip
              </Button>
              <Button onClick={handleSubmitReview} disabled={submittingReview || !reviewText.trim()} className="flex-1">
                {submittingReview ? (
                  <span>Submitting...</span>
                ) : (
                  "Submit Review"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDonation} onOpenChange={setShowDonation}>
        <DialogContent className="dialog-success">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              Support Flipi
            </DialogTitle>
            <DialogDescription>
              Would you like to support Flipi with GH₵1? This helps us keep the platform running and free for everyone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleSkip} className="flex-1">
              Skip
            </Button>
            <Button onClick={handleDonate} disabled={loading} className="flex-1">
              {loading ? (
                <span>Processing...</span>
              ) : (
                "Support with GH₵1"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

