import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { BottomNav } from "@/components/layout/BottomNav";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import FacultyDashboard from "./pages/FacultyDashboard";
import FacultyLibrary from "./pages/FacultyLibrary";
import StudentDashboard from "./pages/StudentDashboard";
import StudentRemediation from "./pages/StudentRemediation";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLeaderboard from "./pages/AdminLeaderboard";
import GenerateCase from "./pages/GenerateCase";
import Simulation from "./pages/Simulation";
import DiagnosisSelection from "./pages/DiagnosisSelection";
import ManagementPlan from "./pages/ManagementPlan";
import Debrief from "./pages/Debrief";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen pb-20 md:pb-0">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route 
              path="/faculty" 
              element={
                <ProtectedRoute requiredRole="faculty">
                  <FacultyDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/faculty/generate-case" 
              element={
                <ProtectedRoute requiredRole="faculty">
                  <GenerateCase />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/faculty/library" 
              element={
                <ProtectedRoute requiredRole="faculty">
                  <FacultyLibrary />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student" 
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/remediation" 
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentRemediation />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/leaderboard" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLeaderboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/assessment" 
              element={
                <ProtectedRoute requiredRole="student">
                  <Simulation />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/simulation/:runId" 
              element={
                <ProtectedRoute requiredRole="student">
                  <Simulation />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/diagnosis/:runId" 
              element={
                <ProtectedRoute requiredRole="student">
                  <DiagnosisSelection />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/management/:runId" 
              element={
                <ProtectedRoute requiredRole="student">
                  <ManagementPlan />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/debrief/:runId" 
              element={
                <ProtectedRoute requiredRole="student">
                  <Debrief />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNav />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
