"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface GiveItemButtonProps {
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
  children: React.ReactNode;
}

export function GiveItemButton({ 
  size = "lg", 
  variant = "default",
  className = "",
  children 
}: GiveItemButtonProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Check authentication before navigating
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
      // Redirect to signup if not authenticated
      router.push("/signup");
    } else {
      // Navigate to give page if authenticated
      router.push("/give");
    }
  };

  return (
    <Button size={size} variant={variant} className={className} onClick={handleClick}>
      {children}
    </Button>
  );
}

