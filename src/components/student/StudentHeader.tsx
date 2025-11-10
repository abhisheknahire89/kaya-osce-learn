import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import kayaLogo from "@/assets/kaya-logo.png";

export const StudentHeader = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <header className="border-b bg-card sticky top-0 z-50 w-full" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="flex items-center justify-between px-3 py-3 md:px-4 md:py-4 max-w-full">
        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
          <img src={kayaLogo} alt="Kaya Logo" className="h-8 md:h-10 w-auto flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <h1 className="text-sm md:text-xl font-bold text-foreground truncate">
              स्वागतम्, {user?.user_metadata?.name || "Student"}
            </h1>
            <p className="text-xs text-muted-foreground truncate" lang="hi">
              शिक्षार्थी मंच
            </p>
          </div>
        </div>
        <div className="flex gap-1.5 md:gap-2 flex-shrink-0 ml-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-xl h-8 md:h-9 px-2 md:px-3"
            onClick={() => navigate("/student/dashboard")}
          >
            <User className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Dashboard</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-xl h-8 md:h-9 px-2 md:px-3" 
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
