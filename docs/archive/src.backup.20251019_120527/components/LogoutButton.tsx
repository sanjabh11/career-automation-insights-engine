
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut({ scope: "global" });
    } catch (e) {
      // ignore errors
    }
    // Force full reload for clean state
    window.location.href = "/auth";
  };

  return (
    <Button size="sm" variant="outline" onClick={handleLogout} className="gap-1">
      <LogOut className="w-4 h-4" />
      Log out
    </Button>
  );
}
