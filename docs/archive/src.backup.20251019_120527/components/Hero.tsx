import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ShieldCheck, Sparkles, Lightbulb, FileCheck, BadgeCheck } from 'lucide-react';
import { trackAnalyticsEvent } from '@/hooks/useAnalyticsEvents';

export const Hero: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [headline, setHeadline] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('utm_params');
      if (raw) {
        const u = JSON.parse(raw) as Record<string, string | undefined>;
        const term = (u.utm_term || u.utm_content || u.utm_campaign || '').trim();
        if (term) {
          setHeadline(`See how AI changes ${term} tasks`);
        }
      }
    } catch {}
  }, []);

  const handleAnalyze = () => {
    const trimmed = query.trim();
    if (trimmed) {
      try {
        localStorage.setItem('planner:lastSearch', trimmed);
      } catch {}
    }
    // Analytics: hero analyze CTA click
    trackAnalyticsEvent({
      event_name: 'hero_analyze_click',
      event_category: 'cta',
      event_data: { hadQuery: Boolean(trimmed), queryLength: trimmed.length }
    });
    navigate('/ai-impact-planner');
  };

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-7xl px-4 py-10 md:py-12 lg:py-14">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Left: Search-first */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
              {headline ?? 'Find your occupation and see how AI changes the tasks'}
            </h1>
            <p className="mt-2 text-gray-600 text-sm md:text-base">
              Search occupations or skills. Get task-level automation, augmentation guidance, and learning path ROI.
            </p>

            <div className="mt-5" role="search" aria-label="Occupation search">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" aria-hidden="true" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { 
                    trackAnalyticsEvent({ event_name: 'hero_enter_submit', event_category: 'cta', event_data: { queryLength: query.trim().length } });
                    handleAnalyze();
                  } }}
                  placeholder="e.g., Software Developer, Nursing, Excel, AutoCAD"
                  aria-label="Search occupations or skills"
                  className="pl-10 h-12 text-base"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => navigate('/browse/bright-outlook')} className="h-11">
                  Bright Outlook
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate('/browse/stem')} className="h-11">
                  STEM
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate('/tech-skills')} className="h-11">
                  Tech Skills
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate('/browse/job-zones')} className="h-11">
                  Job Zones
                </Button>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <Button onClick={handleAnalyze} className="h-12 text-base">
                  Analyze my role
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => { 
                    trackAnalyticsEvent({ event_name: 'hero_browse_click', event_category: 'cta' });
                    navigate('/browse/bright-outlook');
                  }} 
                  className="h-12 text-base"
                >
                  Show me occupations
                </Button>
              </div>

              <div className="mt-3 text-xs text-gray-500">Examples: "Registered Nurse", "Data Analyst", "Welding", "Excel"</div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                <Link to="/responsible-ai" className="inline-flex items-center gap-1 hover:text-gray-900">
                  <FileCheck className="h-4 w-4 text-green-600" /> Responsible AI
                </Link>
                <Link to="/quality" className="inline-flex items-center gap-1 hover:text-gray-900">
                  <ShieldCheck className="h-4 w-4 text-green-600" /> Quality
                </Link>
                <Link to="/validation" className="inline-flex items-center gap-1 hover:text-gray-900">
                  <BadgeCheck className="h-4 w-4 text-green-600" /> Validation
                </Link>
              </div>
            </div>
          </div>

          {/* Right: Value chips */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-900 font-medium">
                <Sparkles className="h-4 w-4 text-purple-600" />
                Task-level automation
              </div>
              <p className="mt-1 text-sm text-gray-600">See which tasks automate vs. augment for your role.</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-900 font-medium">
                <Lightbulb className="h-4 w-4 text-amber-600" />
                GenAI augmentation guidance
              </div>
              <p className="mt-1 text-sm text-gray-600">Practical tips to work with AI, not against it.</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-900 font-medium">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                Learning path ROI
              </div>
              <p className="mt-1 text-sm text-gray-600">Prioritized skills and resources with payoff.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
