import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Library, Search, Eye, Edit, Trash2 } from "lucide-react";
import { DashboardHeader } from "@/components/faculty/DashboardHeader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const FacultyLibrary = () => {
  const { toast } = useToast();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCases(data || []);
    } catch (error: any) {
      console.error("Error fetching cases:", error);
      toast({
        title: "Failed to load cases",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = cases.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Library className="h-8 w-8 text-primary" />
            Case Library
          </h1>
          <p className="text-muted-foreground mt-1">Browse and manage all OSCE cases</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search cases by title or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
        </div>

        {/* Cases Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <p className="text-muted-foreground col-span-full text-center py-12">Loading cases...</p>
          ) : filteredCases.length === 0 ? (
            <Card className="col-span-full rounded-2xl">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">No cases found</p>
                <Button asChild className="rounded-xl">
                  <Link to="/faculty/generate-case">Generate New Case</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredCases.map((c) => (
              <Card key={c.id} className="rounded-2xl border-primary/10 hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base flex-1">{c.title}</CardTitle>
                    <Badge variant={c.status === 'approved' ? 'default' : 'secondary'} className="rounded-full">
                      {c.status}
                    </Badge>
                  </div>
                  <CardDescription>{c.subject}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 rounded-xl">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button variant="ghost" size="sm" className="rounded-xl">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FacultyLibrary;
