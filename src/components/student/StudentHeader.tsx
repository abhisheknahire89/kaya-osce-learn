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
    <header className="border-b bg-card sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <img src={kayaLogo} alt="Kaya Logo" className="h-10 w-auto" />
          <div>
            <h1 className="text-xl font-bold text-foreground">
              स्वागतम्, {user?.user_metadata?.name || "Student"}
            </h1>
            <p className="text-xs text-muted-foreground" lang="hi">
              शिक्षार्थी मंच
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl">
            <User className="mr-2 h-4 w-4" />
            Profile
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
