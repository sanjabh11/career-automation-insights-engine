import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";

export default function NavigationPremium() {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSession();

  React.useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { to: "/", label: "Home" },
    { to: "/ai-impact-planner", label: "Planner" },
    { to: "/work-dimensions", label: "Dimensions" },
    { to: "/validation", label: "Validation" },
    { to: "/help", label: "Help" },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? "bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-200" : "bg-transparent"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className={`${isScrolled ? "text-blue-600" : "text-white"} h-6 w-6`} />
            <span className={`font-serif text-xl font-bold ${isScrolled ? "text-gray-900" : "text-white"}`}>Automation Insights</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === l.to
                    ? isScrolled ? "text-blue-600" : "text-white"
                    : isScrolled ? "text-gray-700 hover:text-blue-600" : "text-gray-200 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              <Button onClick={() => navigate("/dashboard")} className="rounded-xl">Dashboard</Button>
            ) : (
              <Button variant="outline" onClick={() => navigate("/auth")} className={`${isScrolled ? "" : "text-white border-white/70"} rounded-xl`}>
                Sign In
              </Button>
            )}
          </div>

          <button onClick={() => setIsOpen((v) => !v)} className={`md:hidden p-2 ${isScrolled ? "text-gray-800" : "text-white"}`}>
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden">
          <div className="px-4 pt-2 pb-4 bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-2xl">
            <div className="space-y-2">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-base font-medium ${
                    location.pathname === l.to ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
              {user ? (
                <Button onClick={() => { navigate('/dashboard'); setIsOpen(false); }} className="w-full rounded-xl">Dashboard</Button>
              ) : (
                <Button variant="outline" onClick={() => { navigate('/auth'); setIsOpen(false); }} className="w-full rounded-xl">Sign In</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
