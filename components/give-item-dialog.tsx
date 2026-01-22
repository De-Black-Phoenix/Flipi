"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Gift } from "lucide-react";

export function GiveItemDialog({
  itemId,
  requesterId,
  requesterName,
}: {
  itemId: string;
  requesterId: string;
  requesterName: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const handleGiveItem = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      router.push("/login");
      return;
    }

    // Find the conversation for this item and requester
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id")
      .eq("item_id", itemId)
      .eq("requester_id", requesterId)
      .eq("owner_id", user.id)
      .single();

    if (convError || !conversation) {
      toast({
        title: "Error",
        description: "Conversation not found.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Update conversation status to accepted
    const { error: convUpdateError } = await supabase
      .from("conversations")
      .update({ status: "accepted" })
      .eq("id", conversation.id);

    if (convUpdateError) {
      toast({
        title: "Error",
        description: convUpdateError.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Update item status
    const { error: itemError } = await supabase
      .from("items")
      .update({
        status: "given",
        selected_requester_id: requesterId,
      })
      .eq("id", itemId);

    if (itemError) {
      toast({
        title: "Error",
        description: itemError.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Reject all other conversations for this item
    await supabase
      .from("conversations")
      .update({ status: "rejected" })
      .eq("item_id", itemId)
      .neq("id", conversation.id);

    // Award points to giver via API
    const pointsResponse = await fetch("/api/points/award-item", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ itemId }),
    });

    if (!pointsResponse.ok) {
      console.error("Failed to award points");
      // Don't fail the whole operation if points fail
    }

    setOpen(false);
    toast({
      title: "Success!",
      description: `You've given the item to ${requesterName}.`,
    });

    // Redirect to donation prompt for receiver
    router.push(`/items/${itemId}/success?receiver=${requesterId}`);
    router.refresh();
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="default">
          <Gift className="w-4 h-4 mr-2" />
          Give item to <span className="user-name">{requesterName}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Give Item</DialogTitle>
          <DialogDescription>
            Are you sure you want to give this item to <span className="user-name">{requesterName}</span>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleGiveItem} disabled={loading}>
            {loading ? (
              <span>Processing...</span>
            ) : (
              "Yes, Give Item"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

