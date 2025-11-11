import { AuthForm } from "@/components/auth/AuthForm";
import { Link } from "react-router-dom";
import kayaLogo from "@/assets/kaya-logo.png";
const Auth = () => {
  return <div className="min-h-screen bg-gradient-to-br from-background via-accent/30 to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Logo and Header */}
        <div className="text-center space-y-2">
          <img src={kayaLogo} alt="Kaya Logo" className="h-16 mx-auto animate-scale-in" />
          
          <p className="text-sm text-muted-foreground" lang="hi">काय - आयुर्वेदिक आभासी परीक्षा</p>
        </div>

        <AuthForm />

        <div className="text-center text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>;
};
export default Auth;