import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, LogOut, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TopMicroHeader } from "@/components/layout/TopMicroHeader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const StudentProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [selectedCohort, setSelectedCohort] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchCohorts();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
      const metadata = data?.metadata as { cohort_id?: string } | null;
      setSelectedCohort(metadata?.cohort_id || "");
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchCohorts = async () => {
    try {
      const { data, error } = await supabase
        .from('cohorts')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCohorts(data || []);
    } catch (error) {
      console.error('Error fetching cohorts:', error);
    }
  };

  const handleCohortUpdate = async () => {
    if (!selectedCohort) {
      toast.error("Please select a cohort");
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          metadata: { cohort_id: selectedCohort }
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast.success("Cohort updated successfully");
      fetchProfile();
    } catch (error: any) {
      toast.error(error.message || "Error updating cohort");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate("/auth");
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopMicroHeader
        title="My Profile"
        subtitleHindi="मेरी प्रोफ़ाइल"
        showBack={false}
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-6 w-6 text-primary" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Manage your account settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center py-8">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-12 w-12 text-primary" />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{profile?.name || "Student"}</p>
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>

              <div className="pt-4 border-t">
                <Label htmlFor="cohort" className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-primary" />
                  Your Cohort / आपका समूह
                </Label>
                <Select value={selectedCohort} onValueChange={setSelectedCohort}>
                  <SelectTrigger id="cohort" className="rounded-xl">
                    <SelectValue placeholder="Select your cohort" />
                  </SelectTrigger>
                  <SelectContent>
                    {cohorts.map((cohort) => (
                      <SelectItem key={cohort.id} value={cohort.id}>
                        {cohort.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(() => {
                  const metadata = profile?.metadata as { cohort_id?: string } | null;
                  return selectedCohort !== metadata?.cohort_id && (
                    <Button
                      onClick={handleCohortUpdate}
                      disabled={isUpdating}
                      className="w-full mt-3 rounded-xl"
                    >
                      {isUpdating ? "Updating..." : "Update Cohort"}
                    </Button>
                  );
                })()}
              </div>
            </div>

            <div className="pt-2">
              <Button 
                onClick={handleSignOut}
                variant="outline" 
                className="w-full rounded-xl"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentProfile;
