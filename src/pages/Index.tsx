import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, BarChart3, Brain } from "lucide-react";
import { Link } from "react-router-dom";
import kayaLogo from "@/assets/kaya-logo.png";
const Index = () => {
  return <div className="min-h-screen bg-gradient-to-br from-background via-accent/30 to-secondary/20">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <img src={kayaLogo} alt="Kaya Logo" className="h-12 w-auto" />
            <div>
              
              
            </div>
          </div>
          <Button asChild className="rounded-2xl">
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-4 text-5xl font-bold text-foreground">
            AI-Powered Virtual OSCE for Ayurvedic Education
          </h2>
          <p className="mb-2 text-sm text-secondary font-medium" lang="hi">
            आयुर्वेदिक शिक्षा के लिए एआई-संचालित आभासी परीक्षा
          </p>
          <p className="mb-8 text-xl text-muted-foreground">
            NCISM CBDC-aligned virtual patient assessments for BAMS students with Gemini-powered case generation
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild className="rounded-2xl bg-gradient-to-r from-primary to-[#7AA86E] text-white">
              <Link to="/auth">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="rounded-2xl border-secondary text-foreground hover:bg-secondary/10">
              <a href="#features">Learn More</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-16">
        <h3 className="mb-12 text-center text-3xl font-bold text-foreground">Platform Features</h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-primary/20 transition-all hover:shadow-lg">
            <CardHeader>
              <Brain className="mb-2 h-10 w-10 text-primary" />
              <CardTitle>AI Case Generation</CardTitle>
              <CardDescription>
                Generate CBDC-aligned OSCE cases using Gemini 2.5 Pro with competency tagging
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-primary/20 transition-all hover:shadow-lg">
            <CardHeader>
              <Users className="mb-2 h-10 w-10 text-primary" />
              <CardTitle>Virtual Patient Simulation</CardTitle>
              <CardDescription>
                Interactive low-latency conversations with AI-powered virtual patients
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-primary/20 transition-all hover:shadow-lg">
            <CardHeader>
              <BookOpen className="mb-2 h-10 w-10 text-primary" />
              <CardTitle>Auto-Scoring</CardTitle>
              <CardDescription>
                Automated rubric and MCQ scoring using Bloom & Miller frameworks
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-primary/20 transition-all hover:shadow-lg">
            <CardHeader>
              <BarChart3 className="mb-2 h-10 w-10 text-primary" />
              <CardTitle>Analytics & Feedback</CardTitle>
              <CardDescription>
                Comprehensive dashboards for faculty and personalized student feedback
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Roles Section */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="mb-12 text-center text-3xl font-bold text-foreground">Built for Every Role</h3>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-xl">Faculty</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Generate competency-linked cases</li>
                <li>• Configure assessment rubrics</li>
                <li>• Review student performance</li>
                <li>• Access detailed analytics</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-xl">Students</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Take virtual OSCE assessments</li>
                <li>• Interact with AI patients</li>
                <li>• Receive instant feedback</li>
                <li>• Track competency progress</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-xl">Administrators</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Manage users and roles</li>
                <li>• Monitor system usage</li>
                <li>• Generate compliance reports</li>
                <li>• Configure institutional settings</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2025 Kaya CBDC V-OSCE. Aligned with NCH CBDC Standards.</p>
        </div>
      </footer>
    </div>;
};
export default Index;