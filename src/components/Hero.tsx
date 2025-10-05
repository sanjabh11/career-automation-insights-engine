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
    <section className="relative min-h-[85vh] sm:min-h-[80vh] md:min-h-[78vh] w-full overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{ backgroundImage: `url(${backgroundUrl})` }}
        aria-hidden="true"
      />
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex h-full max-w-6xl items-center justify-center px-4 py-20 sm:py-24 md:py-28">
        <motion.div
          className="w-full max-w-3xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.7 }}
        >
          <div className="mx-auto rounded-2xl border border-white/15 bg-white/10 p-6 sm:p-8 md:p-10 backdrop-blur-md shadow-2xl hover:shadow-3xl transition-shadow duration-300">
            <h1
              className="mb-4 sm:mb-5 md:mb-6 font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight text-white drop-shadow-lg tracking-tight"
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}
            >
              AI-Powered Career Automation Insights
            </h1>
            <p className="mx-auto mb-6 sm:mb-8 md:mb-10 max-w-2xl text-sm sm:text-base md:text-lg leading-relaxed text-white/90">
              Analyze automation potential for occupations using live O*NET data and structured AI. Search, assess tasks, compare analyses, and export your insights.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-4">
              <Button asChild size="lg" className="w-full sm:w-auto bg-white text-slate-900 hover:bg-white/90 hover:scale-105 transition-all duration-200 shadow-lg">
                <Link to="/ai-impact-planner">Open AI Impact Planner</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white/70 text-white hover:bg-white/10 hover:border-white hover:scale-105 transition-all duration-200">
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
