/**
 * Whop Hero Section
 * Career Automation Insights Engine
 * 
 * Community-focused hero section for Whop embedded experience.
 * Messaging is optimized for creators who want to add value to their communities.
 */

import React from "react";
import { ArrowRight, MessageSquare, Users, TrendingUp, Brain, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function WhopHeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
            <Users className="h-4 w-4 text-[var(--accent-primary)]" />
            <span className="text-sm font-medium text-white">For Your Community</span>
          </div>

          {/* Main headline - Community focused */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
            Career Insights for
            <span className="block bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-amber)] to-[var(--accent-primary)] bg-clip-text text-transparent">
              Your Community
            </span>
          </h1>

          {/* Subtitle - Value prop for creators */}
          <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto mb-8 leading-relaxed">
            Give your members AI-powered career automation risk analysis, 
            personalized roadmaps, and 24/7 AI coaching to future-proof their careers.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button
              size="lg"
              onClick={() => navigate("/ai-impact-planner")}
              className="group bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] px-8 py-6 text-lg font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all"
            >
              <span className="flex items-center gap-2">
                Analyze Career Risks
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/browse/bright-outlook")}
              className="text-white border-white/40 hover:bg-white/10 px-8 py-6 text-lg rounded-2xl"
            >
              Browse Occupations
            </Button>
          </div>

          {/* Feature highlights - Community benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="flex flex-col items-center p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="p-3 bg-[var(--accent-primary)]/20 rounded-xl mb-3">
                <Brain className="h-6 w-6 text-[var(--accent-primary)]" />
              </div>
              <h3 className="font-semibold text-white mb-1">AI Risk Scoring</h3>
              <p className="text-sm text-gray-400 text-center">Personalized automation risk for 1,000+ occupations</p>
            </div>
            
            <div className="flex flex-col items-center p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="p-3 bg-[var(--accent-primary)]/20 rounded-xl mb-3">
                <TrendingUp className="h-6 w-6 text-[var(--accent-primary)]" />
              </div>
              <h3 className="font-semibold text-white mb-1">Career Roadmaps</h3>
              <p className="text-sm text-gray-400 text-center">Step-by-step upskilling paths with ROI estimates</p>
            </div>
            
            <div className="flex flex-col items-center p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="p-3 bg-green-500/20 rounded-xl mb-3">
                <MessageSquare className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="font-semibold text-white mb-1">AI Career Coach</h3>
              <p className="text-sm text-gray-400 text-center">24/7 personalized guidance for your members</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default WhopHeroSection;
