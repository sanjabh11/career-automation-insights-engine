import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, Cpu, Shield, TrendingUp, Search, Zap, Target, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { trackAnalyticsEvent } from "@/hooks/useAnalyticsEvents";

export function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = heroRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const handleSearch = () => {
    const trimmed = searchQuery.trim();
    if (trimmed) {
      try {
        localStorage.setItem('planner:lastSearch', trimmed);
      } catch { }
    }
    trackAnalyticsEvent({
      event_name: 'hero_search_submit',
      event_category: 'cta',
      event_data: { query: trimmed, queryLength: trimmed.length }
    });
    navigate('/ai-impact-planner');
  };

  const quickFilters = [
    { label: "Bright Outlook", path: "/browse/bright-outlook", icon: Zap },
    { label: "STEM Careers", path: "/browse/stem", icon: Target },
    { label: "Tech Skills", path: "/tech-skills", icon: Cpu },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } }
  };

  const featureVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } }
  };

  return (
    <section
      ref={heroRef}
      className="relative min-h-[70vh] md:min-h-[85vh] flex items-center justify-center overflow-hidden"
    >
      {/* Cosmic Background */}
      <div className="absolute inset-0 z-0" style={{ background: 'var(--bg-primary)' }}>
        {/* Warm ambient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: 'rgba(45, 212, 168, 0.06)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl" style={{ background: 'rgba(229, 165, 75, 0.04)' }} />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: `linear-gradient(rgba(45, 212, 168, 0.15) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(45, 212, 168, 0.15) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--bg-primary)]/50 to-[var(--bg-primary)] z-[1]" />

      <motion.div
        className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
        variants={containerVariants}
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
      >
        <div className="rounded-3xl p-6 sm:p-8 md:p-12 lg:p-14 bg-[var(--bg-secondary)]/60 backdrop-blur-sm border border-[hsl(var(--border))] shadow-2xl">
          {/* Badge */}
          <motion.div variants={itemVariants} className="flex justify-center mb-6 md:mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/25 hover:bg-[var(--accent-primary)]/15 transition-colors cursor-default">
              <Shield className="h-4 w-4 text-[var(--accent-primary)]" />
              <span className="text-sm font-medium text-[var(--accent-secondary)]">Career Defense Platform</span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={itemVariants} className="text-center mb-4 md:mb-6">
            <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>
              Stay Indispensable
            </span>
            <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mt-2 md:mt-3 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-amber)] bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-display)' }}>
              in the AI Era.
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p variants={itemVariants} className="text-center text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-6 leading-relaxed">
            Know your automation risk score. Build the skills AI can't replicate. Plan your next career move with data from 1,016+ O*NET occupations.
          </motion.p>

          {/* Data Proof — Real Stats */}
          <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-4 sm:gap-8 mb-8 md:mb-10">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-[var(--accent-primary)]" style={{ fontFamily: 'var(--font-mono)' }}>1,016+</div>
              <div className="text-xs sm:text-sm text-slate-400">O*NET Occupations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-[var(--accent-amber)]" style={{ fontFamily: 'var(--font-mono)' }}>57%</div>
              <div className="text-xs sm:text-sm text-slate-400">Work Hours Automatable<sup className="text-[10px]">McKinsey&nbsp;2025</sup></div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-[var(--accent-info)]" style={{ fontFamily: 'var(--font-mono)' }}>78M</div>
              <div className="text-xs sm:text-sm text-slate-400">Net New Jobs by 2030<sup className="text-[10px]">WEF&nbsp;2025</sup></div>
            </div>
          </motion.div>

          {/* Search Bar */}
          <motion.div variants={itemVariants} className="max-w-2xl mx-auto mb-6">
            <div className="relative" role="search" aria-label="Search occupations">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" aria-hidden="true" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                placeholder="Search occupations or skills (e.g., Software Developer, Nursing)"
                className="w-full pl-12 pr-4 py-4 h-14 text-base bg-[var(--bg-tertiary)] border-[hsl(var(--border))] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] rounded-xl focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all"
                aria-label="Search occupations or skills"
              />
              <Button
                onClick={handleSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white px-4 sm:px-6 py-2 rounded-lg font-medium transition-all hover:scale-105"
              >
                <span className="hidden sm:inline">Analyze</span>
                <ArrowRight className="h-4 w-4 sm:ml-2" />
              </Button>
            </div>
          </motion.div>

          {/* Quick Filter Chips */}
          <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 md:mb-10">
            {quickFilters.map((filter) => (
              <Button
                key={filter.path}
                variant="outline"
                size="sm"
                onClick={() => {
                  trackAnalyticsEvent({ event_name: 'hero_filter_click', event_category: 'cta', event_data: { filter: filter.label } });
                  navigate(filter.path);
                }}
                className="bg-[var(--bg-tertiary)]/60 border-[hsl(var(--border))] text-[var(--text-secondary)] hover:bg-[var(--accent-primary)]/15 hover:border-[var(--accent-primary)]/40 hover:text-white px-4 py-2 h-10 rounded-lg transition-all hover:scale-105"
              >
                <filter.icon className="h-4 w-4 mr-2 text-[var(--accent-primary)]" />
                {filter.label}
              </Button>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-10 md:mb-12">
            <Button
              size="lg"
              onClick={() => {
                trackAnalyticsEvent({ event_name: 'hero_primary_cta', event_category: 'cta' });
                navigate("/ai-impact-planner");
              }}
              className="group relative overflow-hidden bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white px-6 sm:px-8 py-5 sm:py-6 text-base md:text-lg font-semibold rounded-xl shadow-lg shadow-[var(--accent-primary)]/25 hover:shadow-xl hover:shadow-[var(--accent-primary)]/30 transition-all duration-300 hover:scale-[1.03] w-full sm:w-auto"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Calculate My Risk Score
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                trackAnalyticsEvent({ event_name: 'hero_secondary_cta', event_category: 'cta' });
                navigate("/tools/skill-adjacency");
              }}
              className="bg-[var(--bg-tertiary)]/40 backdrop-blur-sm border-2 border-[var(--accent-success)]/40 text-[var(--accent-success)] hover:bg-[var(--accent-success)]/10 hover:border-[var(--accent-success)]/60 px-6 sm:px-8 py-5 sm:py-6 text-base md:text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-[1.03] w-full sm:w-auto"
            >
              Find My Ghost Paths
            </Button>
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 pt-8 md:pt-10 border-t border-[hsl(var(--border))]"
          >
            {[
              { icon: Shield, color: "text-emerald-400", bgColor: "bg-emerald-500/10 group-hover:bg-emerald-500/20", title: "Evidence‑Driven", desc: "Validated against public datasets and methods" },
              { icon: TrendingUp, color: "text-[var(--accent-primary)]", bgColor: "bg-[var(--accent-primary)]/10 group-hover:bg-[var(--accent-primary)]/20", title: "ROI‑Aware", desc: "Payback timelines and sector economics" },
              { icon: Lightbulb, color: "text-[var(--accent-amber)]", bgColor: "bg-[var(--accent-amber)]/10 group-hover:bg-[var(--accent-amber)]/20", title: "Actionable", desc: "Clear steps to reduce risk and upskill" },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={featureVariants}
                className="flex flex-col items-center text-center group cursor-default p-4 rounded-xl hover:bg-[var(--bg-hover)]/50 transition-all"
              >
                <div className={`${feature.bgColor} backdrop-blur-sm p-3 md:p-4 rounded-xl mb-3 transition-colors`}>
                  <feature.icon className={`h-6 w-6 md:h-7 md:w-7 ${feature.color}`} />
                </div>
                <h3 className="text-white font-semibold text-sm md:text-base lg:text-lg mb-1">{feature.title}</h3>
                <p className="text-[var(--text-tertiary)] text-xs md:text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-10 hidden sm:block"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
      >
        <div className="w-6 h-10 border-2 border-[var(--text-tertiary)]/50 rounded-full p-1 hover:border-[var(--accent-primary)]/50 transition-colors cursor-pointer" role="button" aria-label="Scroll down" tabIndex={0} onClick={() => window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' })} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' }); } }}>
          <div className="w-1.5 h-3 bg-[var(--accent-primary)]/70 rounded-full mx-auto animate-bounce" />
        </div>
      </motion.div>
    </section>
  );
}

export default HeroSection;
