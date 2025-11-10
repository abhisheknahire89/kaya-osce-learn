import { Home, Clipboard, PlusCircle, BarChart3, User, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const studentNavItems = [
  { key: "home", label: "Home", icon: Home, route: "/student" },
  { key: "assigned", label: "Assigned", icon: Clipboard, route: "/student/assigned" },
  { key: "remediation", label: "MCQs", icon: PlusCircle, route: "/student/remediation" },
  { key: "progress", label: "Progress", icon: BarChart3, route: "/student/progress" },
  { key: "profile", label: "Profile", icon: User, route: "/student/profile" },
];

const facultyNavItems = [
  { key: "home", label: "Home", icon: Home, route: "/faculty" },
  { key: "library", label: "Library", icon: Clipboard, route: "/faculty/library" },
  { key: "create", label: "Create", icon: PlusCircle, route: "/faculty/generate-case" },
  { key: "analytics", label: "Analytics", icon: BarChart3, route: "/faculty/analytics" },
  { key: "profile", label: "Profile", icon: User, route: "/faculty/profile" },
];

const adminNavItems = [
  { key: "home", label: "Dashboard", icon: Home, route: "/admin" },
  { key: "cases", label: "Cases", icon: Clipboard, route: "/faculty" },
  { key: "analytics", label: "Analytics", icon: BarChart3, route: "/admin/analytics" },
  { key: "profile", label: "Profile", icon: User, route: "/admin/profile" },
];

export const BottomNav = () => {
  const location = useLocation();
  const { role } = useAuth();
  
  const navItems = role === "admin" ? adminNavItems : role === "faculty" ? facultyNavItems : studentNavItems;
  
  // Don't show bottom nav on auth pages or simulation screens
  if (location.pathname === "/" || location.pathname === "/auth" || location.pathname.includes("/simulation/")) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.route;
          
          return (
            <Link
              key={item.key}
              to={item.route}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] rounded-lg transition-colors px-3",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
              <span className={cn(
                "text-[10px] font-medium",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
