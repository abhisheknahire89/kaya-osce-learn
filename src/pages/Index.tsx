import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, BarChart3, Brain, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import kayaLogo from "@/assets/kaya-logo.png";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-md shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <img src={kayaLogo} alt="Kaya Logo" className="h-12 w-auto" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-[#7AA86E] bg-clip-text text-transparent">Kaya CBDC V-OSCE</h1>
              <p className="text-xs text-muted-foreground" lang="hi">काय - आयुर्वेदिक आभासी परीक्षा</p>
            </div>
          </div>
          <Button asChild size="lg" className="rounded-full">
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/10 to-secondary/5" />
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-4xl text-center relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-fade-in">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">NCISM CBDC-Aligned Platform</span>
            </div>
            
            <h2 className="mb-6 text-4xl md:text-6xl font-bold text-foreground leading-tight animate-fade-in">
              Transform Ayurvedic Education with{" "}
              <span className="bg-gradient-to-r from-primary via-[#7AA86E] to-secondary bg-clip-text text-transparent">
                AI-Powered Virtual OSCE
              </span>
            </h2>
            
            <p className="mb-3 text-base text-secondary font-semibold" lang="hi">
              आयुर्वेदिक शिक्षा के लिए एआई-संचालित आभासी परीक्षा
            </p>
            
            <p className="mb-10 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Gemini-powered case generation for BAMS students with intelligent virtual patient assessments and instant feedback
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in">
              <Button size="lg" asChild className="rounded-full bg-gradient-to-r from-primary to-[#7AA86E] text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 group">
                <Link to="/auth">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-full border-2 border-primary/30 hover:bg-primary/5">
                <a href="#features">Explore Features</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Powerful Features for Modern Education
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to deliver world-class virtual OSCE assessments
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <Card className="group border-2 border-border hover:border-primary/50 transition-all hover:shadow-xl hover:-translate-y-1 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="mb-4 h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-[#7AA86E] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Brain className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-xl">AI Case Generation</CardTitle>
              <CardDescription className="text-base">
                Generate CBDC-aligned OSCE cases using Gemini 2.5 Pro with automatic competency tagging
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group border-2 border-border hover:border-primary/50 transition-all hover:shadow-xl hover:-translate-y-1 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="mb-4 h-14 w-14 rounded-2xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-xl">Virtual Patients</CardTitle>
              <CardDescription className="text-base">
                Interactive low-latency conversations with AI-powered virtual patients for realistic simulations
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group border-2 border-border hover:border-primary/50 transition-all hover:shadow-xl hover:-translate-y-1 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="mb-4 h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-xl">Auto-Scoring</CardTitle>
              <CardDescription className="text-base">
                Automated rubric and MCQ scoring using Bloom & Miller frameworks for instant assessment
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group border-2 border-border hover:border-primary/50 transition-all hover:shadow-xl hover:-translate-y-1 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="mb-4 h-14 w-14 rounded-2xl bg-gradient-to-br from-accent to-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-xl">Analytics & Insights</CardTitle>
              <CardDescription className="text-base">
                Comprehensive dashboards for faculty and personalized student feedback with competency tracking
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Roles Section */}
      <section className="bg-gradient-to-br from-primary/5 to-secondary/5 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Designed for Every Stakeholder
            </h3>
            <p className="text-lg text-muted-foreground">
              Tailored experiences for faculty, students, and administrators
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            <Card className="border-2 border-border hover:border-primary/50 transition-all hover:shadow-lg bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl text-primary">Faculty</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Generate competency-linked cases instantly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Configure custom assessment rubrics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Review student performance in detail</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Access comprehensive analytics dashboards</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-border hover:border-primary/50 transition-all hover:shadow-lg bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl text-primary">Students</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Take virtual OSCE assessments anytime</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Interact with realistic AI patients</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Receive instant detailed feedback</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Track competency progress over time</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-border hover:border-primary/50 transition-all hover:shadow-lg bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl text-primary">Administrators</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Manage users and role assignments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Monitor system usage and performance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Generate compliance and audit reports</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Configure institutional settings</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-primary via-[#7AA86E] to-secondary rounded-3xl p-12 md:p-16 shadow-2xl">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Ayurvedic Education?
          </h3>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Join leading institutions using Kaya CBDC V-OSCE for next-generation virtual patient assessments
          </p>
          <Button size="lg" asChild className="rounded-full bg-white text-primary hover:bg-white/90 shadow-lg text-lg px-8 group">
            <Link to="/auth">
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={kayaLogo} alt="Kaya Logo" className="h-10 w-auto" />
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">Kaya CBDC V-OSCE</p>
                <p className="text-xs text-muted-foreground">Aligned with NCH CBDC Standards</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Kaya CBDC V-OSCE. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
