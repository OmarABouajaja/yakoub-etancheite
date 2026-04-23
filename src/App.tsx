import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import RequireAuth from "./components/auth/RequireAuth";
import { Loader2 } from "lucide-react";

// Lazy Loaded Pages (Code Splitting for Performance)
const NotFound = lazy(() => import("./pages/NotFound"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const ServicesList = lazy(() => import("./pages/ServicesList"));
const Contact = lazy(() => import("./pages/Contact"));
const BlogList = lazy(() => import("./pages/BlogList"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const BlogManagement = lazy(() => import("./pages/dashboard/BlogManagement"));
const LeadsManagement = lazy(() => import("./pages/dashboard/LeadsManagement"));
const ProjectsManagement = lazy(() => import("./pages/dashboard/ProjectsManagement"));
const TestimonialsManagement = lazy(() => import("./pages/dashboard/TestimonialsManagement"));
const TeamManagement = lazy(() => import("./pages/dashboard/TeamManagement"));
const SettingsManagement = lazy(() => import("./pages/dashboard/SettingsManagement"));
const PartnersManagement = lazy(() => import("./pages/dashboard/PartnersManagement"));
const FinanceManagement = lazy(() => import("./pages/dashboard/FinanceManagement"));
const MailboxManagement = lazy(() => import("./pages/dashboard/MailboxManagement"));
const UpdatePassword = lazy(() => import("./pages/auth/UpdatePassword"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
      <Toaster />
      <Sonner />
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about-us" element={<AboutUs />} />
              <Route path="/services" element={<ServicesList />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/blog" element={<BlogList />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/login" element={<Login />} />
              <Route path="/update-password" element={<UpdatePassword />} />
              <Route path="/reset-password" element={<UpdatePassword />} />

              {/* Protected Dashboard Routes */}
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <Dashboard />
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard/leads"
                element={
                  <RequireAuth>
                    <LeadsManagement />
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard/projects"
                element={
                  <RequireAuth>
                    <ProjectsManagement />
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard/finance"
                element={
                  <RequireAuth>
                    <FinanceManagement />
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard/mailbox"
                element={
                  <RequireAuth>
                    <MailboxManagement />
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard/blog"
                element={
                  <RequireAuth>
                    <BlogManagement />
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard/testimonials"
                element={
                  <RequireAuth>
                    <TestimonialsManagement />
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard/team"
                element={
                  <RequireAuth>
                    <TeamManagement />
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard/settings"
                element={
                  <RequireAuth>
                    <SettingsManagement />
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard/partners"
                element={
                  <RequireAuth>
                    <PartnersManagement />
                  </RequireAuth>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
