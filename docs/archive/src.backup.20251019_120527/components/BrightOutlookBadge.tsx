import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Star, Sparkles } from 'lucide-react';
import { getBrightOutlookBadgeColor } from '@/types/onet-enrichment';
import { motion } from 'framer-motion';

interface BrightOutlookBadgeProps {
  hasBrightOutlook: boolean;
  category?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  animated?: boolean;
}

export const BrightOutlookBadge: React.FC<BrightOutlookBadgeProps> = ({
  hasBrightOutlook,
  category,
  size = 'md',
  showIcon = true,
  animated = true,
}) => {
  if (!hasBrightOutlook) return null;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const getIcon = () => {
    if (!showIcon) return null;
    
    if (category?.includes('Rapid Growth')) return <TrendingUp className={iconSizes[size]} />;
    if (category?.includes('Numerous Openings')) return <Star className={iconSizes[size]} />;
    if (category?.includes('New & Emerging')) return <Sparkles className={iconSizes[size]} />;
    return <Star className={iconSizes[size]} />;
  };

  const badge = (
    <Badge 
      className={`
        ${getBrightOutlookBadgeColor(category)} 
        ${sizeClasses[size]}
        border font-semibold flex items-center gap-1.5
        shadow-sm hover:shadow-md transition-shadow
      `}
      aria-label={`Bright Outlook${category ? ` - ${category}` : ''}`}
    >
      {getIcon()}
      <span>Bright Outlook</span>
      {category && size !== 'sm' && (
        <span className="hidden sm:inline font-normal opacity-90">
          • {category}
        </span>
      )}
    </Badge>
  );

  if (!animated) return badge;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.05 }}
    >
      {badge}
    </motion.div>
  );
};
