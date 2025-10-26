import React, { useEffect, useRef } from "react";
import { ArrowRight, Sparkles, Shield, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const node = heroRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in");
          }
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-[90vh] md:min-h-screen flex items-center justify-center overflow-hidden opacity-0 transition-opacity duration-1000"
    >
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          filter: "brightness(0.45)",
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 via-purple-900/30 to-blue-900/50 z-0 animate-gradient" />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 md:p-14 shadow-2xl border border-white/20">
          <div className="flex justify-center mb-7">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
              <Sparkles className="h-4 w-4 text-yellow-300" />
              <span className="text-sm font-medium text-white">AI‑Powered Career Intelligence</span>
            </div>
          </div>

          <h1 className="text-center text-white mb-5">
            <span className="block text-4xl md:text-6xl lg:text-7xl font-serif font-bold leading-tight tracking-tight">
              Navigate the Future
            </span>
            <span className="block text-3xl md:text-5xl lg:text-6xl font-serif font-light mt-3 bg-gradient-to-r from-blue-200 via-purple-200 to-blue-200 bg-clip-text text-transparent">
              of Your Career
            </span>
          </h1>

          <p className="text-center text-lg md:text-xl text-gray-100/90 max-w-3xl mx-auto mb-10 leading-relaxed font-light">
            Quantify automation risk across 1,000+ occupations. Get learning pathways with ROI and make informed career decisions backed by data.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={() => navigate("/ai-impact-planner")}
              className="group relative overflow-hidden bg-white text-blue-900 hover:bg-blue-50 px-7 py-6 text-base md:text-lg font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.03]"
            >
              <span className="relative z-10 flex items-center gap-2">
                Analyze Your Career
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/validation")}
              className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/20 px-7 py-6 text-base md:text-lg font-semibold rounded-2xl transition-all duration-300 hover:scale-[1.03]"
            >
              Learn How It Works
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 pt-10 border-t border-white/20">
            <div className="flex flex-col items-center text-center group">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl mb-3 group-hover:bg-white/30 transition-colors">
                <Shield className="h-7 w-7 text-green-300" />
              </div>
              <h3 className="text-white font-semibold text-base md:text-lg mb-1">Evidence‑Driven</h3>
              <p className="text-gray-300 text-sm">Validated against public datasets and methods</p>
            </div>
            <div className="flex flex-col items-center text-center group">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl mb-3 group-hover:bg-white/30 transition-colors">
                <TrendingUp className="h-7 w-7 text-blue-300" />
              </div>
              <h3 className="text-white font-semibold text-base md:text-lg mb-1">ROI‑Aware</h3>
              <p className="text-gray-300 text-sm">Payback timelines and sector economics</p>
            </div>
            <div className="flex flex-col items-center text-center group">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl mb-3 group-hover:bg-white/30 transition-colors">
                <Sparkles className="h-7 w-7 text-purple-300" />
              </div>
              <h3 className="text-white font-semibold text-base md:text-lg mb-1">Actionable</h3>
              <p className="text-gray-300 text-sm">Clear steps to reduce risk and upskill</p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full p-1">
          <div className="w-1.5 h-3 bg-white/70 rounded-full mx-auto animate-scroll-down" />
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
