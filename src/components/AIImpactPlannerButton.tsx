import React from 'react';
import { Button } from '@/components/ui/button';
import { Notebook as Robot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export function AIImpactPlannerButton() {
  const navigate = useNavigate();

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <Button
        onClick={() => navigate('/ai-impact-planner')}
        className="bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[var(--bg-primary)] shadow-md hover:shadow-lg transition-all duration-300"
      >
        <Robot className="mr-2 h-4 w-4" />
        Career Impact Planner
      </Button>
    </motion.div>
  );
}