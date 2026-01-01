"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const supabase = createClient();
  const router = useRouter();
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (!error) {
      await supabase.removeAllChannels();

      window.location.href = "/auth/login";
      router.refresh();
    } else {
      console.error("Lỗi đăng xuất:", error.message);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleLogout}>
      Logout
    </Button>
  );
}
