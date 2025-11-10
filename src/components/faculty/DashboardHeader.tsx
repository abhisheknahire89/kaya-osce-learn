import { Button } from "@/components/ui/button";
import { Settings, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import kayaLogo from "@/assets/kaya-logo.png";

export const DashboardHeader = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <header className="border-b bg-card sticky top-0 z-50 w-full" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="flex items-center justify-between px-4 py-4 max-w-full">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <img src={kayaLogo} alt="Kaya Logo" className="h-10 w-auto flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-foreground truncate">
              Namaste, Dr. {user?.user_metadata?.name || "Faculty"}
            </h1>
            <p className="text-xs text-muted-foreground truncate" lang="hi">
              काय चिकित्सक शिक्षण कक्ष
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0 ml-2">
          <Button variant="outline" size="sm" className="rounded-xl">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
};
