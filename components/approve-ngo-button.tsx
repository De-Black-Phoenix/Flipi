"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function ApproveNGOButton({ ngoId }: { ngoId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const handleApprove = async () => {
    setLoading(true);

    const { error } = await supabase
      .from("ngos")
      .update({ status: "approved" })
      .eq("id", ngoId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "NGO approved successfully.",
      });
      router.refresh();
    }

    setLoading(false);
  };

  return (
    <Button onClick={handleApprove} disabled={loading} size="sm">
      {loading ? "Approving..." : "Approve"}
    </Button>
  );
}

