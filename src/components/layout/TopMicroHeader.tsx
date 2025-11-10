import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface TopMicroHeaderProps {
  title: string;
  subtitle?: string;
  subtitleHindi?: string;
  onBack?: () => void;
  rightAction?: ReactNode;
  showBack?: boolean;
}

export const TopMicroHeader = ({
  title,
  subtitle,
  subtitleHindi,
  onBack,
  rightAction,
  showBack = true,
}: TopMicroHeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left: Back button */}
        <div className="flex items-center gap-3">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          
          {/* Center: Title with subtitle */}
          <div className="flex flex-col">
            <h1 className="text-base font-semibold text-foreground leading-tight">
              {title}
            </h1>
            {(subtitle || subtitleHindi) && (
              <p className="text-xs text-muted-foreground leading-tight" lang="hi">
                {subtitleHindi || subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: Contextual action */}
        {rightAction && (
          <div className="flex items-center">
            {rightAction}
          </div>
        )}
      </div>
    </header>
  );
};
