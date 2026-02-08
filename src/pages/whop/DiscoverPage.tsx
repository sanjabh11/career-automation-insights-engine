/**
 * Whop Discover Page
 * Career Automation Insights Engine
 * 
 * This is the app store preview page shown to potential customers
 * before they purchase access. It showcases features and value prop.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  Route, 
  MessageSquare, 
  Shield, 
  Zap,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Risk Scoring',
    description: 'Get your personalized Automation Potential Overview (APO) score based on real O*NET data and cutting-edge AI analysis.',
    color: 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/20',
  },
  {
    icon: MessageSquare,
    title: 'AI Career Coach',
    description: '24/7 access to an AI career advisor that understands your unique situation and provides personalized guidance.',
    color: 'text-green-600 bg-green-100',
  },
  {
    icon: Route,
    title: 'Personalized Roadmaps',
    description: 'Get a step-by-step career transition plan with skill gap analysis, learning resources, and timeline estimates.',
    color: 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10',
  },
  {
    icon: TrendingUp,
    title: 'Skill Half-Life Tracking',
    description: 'Track skill relevance over time and get proactive alerts when it\'s time to upskill.',
    color: 'text-orange-600 bg-orange-100',
  },
];

const benefits = [
  'Understand your automation risk in minutes',
  'Get personalized career recommendations',
  'Access exclusive upskilling resources',
  'Connect with like-minded professionals',
  'Stay ahead of industry changes',
  'Data-driven career decisions',
];

export default function WhopDiscoverPage() {
  return (
    <motion.div 
      className="min-h-screen" style={{ background: 'var(--bg-primary)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
        
        <div className="relative max-w-6xl mx-auto px-6 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Badge variant="outline" className="mb-4 text-[var(--accent-primary)] border-[var(--accent-primary)]/50">
              <Zap className="h-3 w-3 mr-1" />
              Data-Driven Career Intelligence
            </Badge>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Stay Indispensable <span className="text-[var(--accent-primary)]">in the AI Era</span>
            </h1>
            
            <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
              Get your personalized Automation Risk Score and a roadmap to future-proof 
              your career. Powered by real labor market data and advanced AI.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white">
                <Shield className="h-5 w-5 mr-2" />
                Get Your Risk Score
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-white text-center mb-12">
          Everything You Need to Stay Ahead
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="bg-slate-800/50 border-slate-700 h-full">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${feature.color}`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-slate-400">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Benefits List */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <Card className="bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-amber)]/20 border-[var(--accent-primary)]/30">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              Why Join This Community?
            </h2>
            
            <div className="grid sm:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-slate-200">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Section */}
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="grid grid-cols-3 gap-8">
          <div>
            <div className="text-4xl font-bold text-[var(--accent-primary)]">500+</div>
            <div className="text-slate-400">Occupations Analyzed</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-green-400">24/7</div>
            <div className="text-slate-400">AI Coach Access</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-[var(--accent-primary)]">Real-time</div>
            <div className="text-slate-400">Market Data</div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-slate-800/50 border-t border-slate-700 px-6 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-slate-400 mb-4">
            Join thousands of professionals who are taking control of their career future.
          </p>
          <Button size="lg" className="bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[var(--bg-primary)]">
            Get Started Now
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
