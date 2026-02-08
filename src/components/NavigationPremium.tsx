import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Shield, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";
import { useAuthMode } from "@/contexts/WhopAppContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function NavigationPremium() {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSession();
  const { isWhopMode } = useAuthMode();

  React.useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const mainLinks = [
    { to: "/", label: "Home" },
    { to: "/ai-impact-planner", label: "Planner" },
    { to: "/work-dimensions", label: "Dimensions" },
  ];

  const evidenceLinks = [
    { to: "/validation", label: "Validation" },
    { to: "/outcomes", label: "Market Signals" },
    { to: "/responsible-ai", label: "Responsible AI" },
    { to: "/quality", label: "Quality" },
  ];

  return (
    <>
    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:bg-[var(--accent-primary)] focus:text-[var(--bg-primary)] focus:rounded-lg focus:font-medium focus:text-sm">
      Skip to main content
    </a>
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? "bg-[var(--bg-secondary)]/95 backdrop-blur-xl shadow-lg shadow-[var(--accent-primary)]/5 border-b border-[var(--accent-primary)]/10" 
        : "bg-transparent"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className={`p-1.5 rounded-lg transition-colors ${isScrolled ? "bg-[var(--accent-primary)]/10" : "bg-white/10"}`}>
              <Shield className={`h-5 w-5 transition-colors ${isScrolled ? "text-[var(--accent-primary)]" : "text-[var(--accent-secondary)]"} group-hover:text-[var(--accent-secondary)]`} />
            </div>
            <span className={`text-lg font-semibold transition-colors ${isScrolled ? "text-slate-100" : "text-white"}`}>
              Automation Insights
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {mainLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === l.to
                    ? "bg-[var(--accent-primary)]/15 text-[var(--accent-secondary)]"
                    : isScrolled 
                      ? "text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-hover)]" 
                      : "text-[var(--text-secondary)] hover:text-white hover:bg-white/10"
                }`}
              >
                {l.label}
              </Link>
            ))}

            {/* Evidence Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  evidenceLinks.some(l => location.pathname === l.to)
                    ? "bg-[var(--accent-primary)]/15 text-[var(--accent-secondary)]"
                    : isScrolled 
                      ? "text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-hover)]" 
                      : "text-[var(--text-secondary)] hover:text-white hover:bg-white/10"
                }`}>
                  Evidence
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[var(--bg-elevated)] backdrop-blur-xl border-[hsl(var(--border))] min-w-[160px]">
                {evidenceLinks.map((l) => (
                  <DropdownMenuItem
                    key={l.to}
                    onClick={() => navigate(l.to)}
                    className={`cursor-pointer text-sm ${
                      location.pathname === l.to 
                        ? "text-[var(--accent-secondary)] bg-[var(--accent-primary)]/10" 
                        : "text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-hover)]"
                    }`}
                  >
                    {l.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              to="/help"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                location.pathname === "/help"
                  ? "bg-[var(--accent-primary)]/15 text-[var(--accent-secondary)]"
                  : isScrolled 
                    ? "text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-hover)]" 
                    : "text-[var(--text-secondary)] hover:text-white hover:bg-white/10"
              }`}
            >
              Help
            </Link>

            <div className="w-px h-6 bg-[hsl(var(--border))] mx-2" />

            {/* Auth Section */}
            {isWhopMode ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)]/15 text-[var(--accent-secondary)]">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">Whop Member</span>
              </div>
            ) : user ? (
              <Button 
                onClick={() => navigate("/dashboard")} 
                className="bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white rounded-lg px-4 py-2 text-sm font-medium transition-all hover:scale-105"
              >
                Dashboard
              </Button>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => navigate("/auth")} 
                className="border-[hsl(var(--border))] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-white hover:border-[var(--accent-primary)]/50 rounded-lg px-4 py-2 text-sm font-medium transition-all"
              >
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsOpen((v) => !v)} 
            className={`md:hidden p-2 rounded-lg transition-colors ${
              isScrolled ? "text-slate-200 hover:bg-slate-800/50" : "text-white hover:bg-white/10"
            }`}
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
      {isOpen && (
        <motion.div
          className="md:hidden"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ overflow: 'hidden' }}
        >
          <div className="px-4 pt-2 pb-4 bg-[var(--bg-secondary)]/98 backdrop-blur-xl border-b border-[hsl(var(--border))] shadow-2xl">
            <div className="space-y-1">
              {mainLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                    location.pathname === l.to 
                      ? "bg-[var(--accent-primary)]/15 text-[var(--accent-secondary)]" 
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-white"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
              
              {/* Evidence section in mobile */}
              <div className="pt-2 pb-1">
                <span className="px-4 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Evidence</span>
              </div>
              {evidenceLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                    location.pathname === l.to 
                      ? "bg-[var(--accent-primary)]/15 text-[var(--accent-secondary)]" 
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-white"
                  }`}
                >
                  {l.label}
                </Link>
              ))}

              <Link
                to="/help"
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                  location.pathname === "/help" 
                    ? "bg-[var(--accent-primary)]/15 text-[var(--accent-secondary)]" 
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-white"
                }`}
              >
                Help
              </Link>

              <div className="pt-3 border-t border-[hsl(var(--border))] mt-3">
                {isWhopMode ? (
                  <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[var(--accent-primary)]/15 text-[var(--accent-secondary)]">
                    <User className="h-4 w-4" />
                    <span className="font-medium">Whop Member</span>
                  </div>
                ) : user ? (
                  <Button 
                    onClick={() => { navigate('/dashboard'); setIsOpen(false); }} 
                    className="w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white rounded-lg"
                  >
                    Dashboard
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={() => { navigate('/auth'); setIsOpen(false); }} 
                    className="w-full border-[hsl(var(--border))] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-white rounded-lg"
                  >
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </nav>
    </>
  );
}
