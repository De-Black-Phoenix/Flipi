"use client";

/**
 * RequestItemButton Component
 * 
 * Handles item request creation:
 * 1. Checks if user is authenticated (redirects to signup if not)
 * 2. Creates or retrieves conversation for the item
 * 3. Inserts delivery note as system message (appears in every new conversation)
 * 4. Inserts optional initial message from requester
 * 5. Marks conversation as unread for owner
 * 
 * System Messages:
 * - Delivery note is automatically inserted when conversation is created
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function RequestItemButton({ itemId }: { itemId: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const handleButtonClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Check authentication before opening dialog
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Redirect to signup immediately if not authenticated
      router.push("/signup");
      return;
    }

    // User is authenticated, open the dialog
    setOpen(true);
  };

  const handleRequest = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      router.push("/signup");
      return;
    }

    // Ensure profile exists before creating request
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      // Profile doesn't exist, create it
      const { error: createProfileError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email || "",
          full_name: user.user_metadata?.full_name || "",
        });

      if (createProfileError) {
        toast({
          title: "Error",
          description: "Failed to create profile. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    }

    // Get item to find owner_id
    const { data: item, error: itemError } = await supabase
      .from("items")
      .select("owner_id")
      .eq("id", itemId)
      .single();

    if (itemError || !item) {
      toast({
        title: "Error",
        description: "Item not found.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Check if conversation already exists
    const { data: existingConv } = await supabase
      .from("conversations")
      .select("id")
      .eq("item_id", itemId)
      .eq("requester_id", user.id)
      .single();

    let conversationId: string;

    if (existingConv) {
      // Conversation already exists, use it
      conversationId = existingConv.id;
      toast({
        title: "Already requested",
        description: "You've already requested this item.",
        variant: "destructive",
      });
      router.push(`/chat/${conversationId}`);
      setLoading(false);
      return;
    }

    // Create new conversation
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .insert({
        item_id: itemId,
        requester_id: user.id,
        owner_id: item.owner_id,
        status: "pending",
        is_read_by_owner: false, // Mark as unread for owner
        is_read_by_requester: true, // Requester just created it, so it's read for them
      })
      .select()
      .single();

    if (convError || !conversation) {
      toast({
        title: "Error",
        description: convError?.message || "Failed to create conversation.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    conversationId = conversation.id;

    // Insert delivery note as system message (appears in every new conversation)
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: null, // System message
      content: "📦 Delivery Note:\nFeel free to discuss pickup or delivery details here.\nPlease meet in safe, public locations whenever possible.",
    });

    // Create initial message if provided
    if (message.trim()) {
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: message.trim(),
      });
    }

    toast({
      title: "Request sent!",
      description: "The owner will be notified.",
    });
    setOpen(false);
    setMessage("");
    router.push(`/chat/${conversation.id}`);
    setLoading(false);
  };

  return (
    <>
      <Button size="lg" className="w-full" onClick={handleButtonClick}>
        Request This Item
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Item</DialogTitle>
            <DialogDescription>
              Send a friendly message to the owner explaining why you need this item.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message">Message (optional)</Label>
              <Textarea
                id="message"
                placeholder="Hi! I would love to have this item because..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-gray-500">
                A short message helps the owner understand your need.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRequest} disabled={loading}>
                {loading ? (
                  <span>Sending...</span>
                ) : (
                  "Send Request"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
