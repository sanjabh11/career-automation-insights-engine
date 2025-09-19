import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface HeroProps {
  backgroundUrl?: string;
}

export const Hero: React.FC<HeroProps> = ({
  backgroundUrl = 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=2100&auto=format&fit=crop',
}) => {
  return (
    <section className="relative min-h-[78vh] w-full overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{ backgroundImage: `url(${backgroundUrl})` }}
        aria-hidden="true"
      />
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex h-full max-w-6xl items-center justify-center px-4 py-24 sm:py-28">
        <motion.div
          className="w-full max-w-3xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.7 }}
        >
          <div className="mx-auto rounded-2xl border border-white/15 bg-white/10 p-8 backdrop-blur-md shadow-xl">
            <h1
              className="mb-4 font-serif text-4xl leading-tight text-white drop-shadow md:text-5xl"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}
            >
              AI-Powered Career Automation Insights
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-base text-white/90 md:text-lg">
              Analyze automation potential for occupations using live O*NET data and structured AI. Search, assess tasks, compare analyses, and export your insights.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-white/90 transition-colors">
                <Link to="/ai-impact-planner">Open AI Impact Planner</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/60 text-white hover:bg-white/10">
                <Link to="/compare">Compare Analyses</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
