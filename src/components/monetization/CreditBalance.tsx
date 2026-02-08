import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Coins, Plus, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CreditBalanceProps {
  compact?: boolean;
  showBuyButton?: boolean;
}

export const CreditBalance: React.FC<CreditBalanceProps> = ({
  compact = false,
  showBuyButton = true
}) => {
  const navigate = useNavigate();

  const { data: credits, isLoading } = useQuery({
    queryKey: ['user-credits'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Return demo data for anonymous users
        return { report_credits: 3, subscription_tier: 'free', monthly_credit_allowance: 3, isDemo: true };
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('report_credits, subscription_tier, monthly_credit_allowance')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching credits:', error);
        return { report_credits: 3, subscription_tier: 'free', monthly_credit_allowance: 3, isDemo: false };
      }

      return { ...data, isDemo: false };
    },
  });

  const getCreditColor = (credits: number) => {
    if (credits <= 0) return 'bg-red-500/10 text-red-500 border-red-500/20';
    if (credits <= 2) return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'pro_authority':
        return { label: 'Pro', color: 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' };
      case 'agency':
        return { label: 'Agency', color: 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' };
      case 'solo_starter':
        return { label: 'Starter', color: 'bg-green-500/10 text-green-500' };
      default:
        return { label: 'Free', color: 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]' };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-pulse bg-muted rounded h-6 w-16" />
      </div>
    );
  }

  const creditCount = credits?.report_credits ?? 3;
  const tier = credits?.subscription_tier ?? 'free';
  const tierInfo = getTierBadge(tier);

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={`${getCreditColor(creditCount)} cursor-pointer`}
              onClick={() => navigate('/pricing')}
            >
              <Coins className="h-3 w-3 mr-1" />
              {creditCount}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{creditCount} report credits remaining</p>
            <p className="text-xs text-muted-foreground">Click to buy more</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
      <div className="flex items-center gap-2">
        <div className={`p-2 rounded-full ${getCreditColor(creditCount)}`}>
          <Coins className="h-4 w-4" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">{creditCount}</span>
            <span className="text-sm text-muted-foreground">credits</span>
            <Badge variant="outline" className={tierInfo.color}>
              {tierInfo.label}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            Each report uses 1 credit
          </span>
        </div>
      </div>

      {showBuyButton && (
        <Button
          size="sm"
          variant="outline"
          className="ml-auto"
          onClick={() => navigate('/pricing')}
        >
          <Plus className="h-4 w-4 mr-1" />
          Buy Credits
        </Button>
      )}

      {creditCount <= 2 && (
        <div className="flex items-center gap-1 text-amber-500 text-xs">
          <AlertTriangle className="h-3 w-3" />
          Low credits!
        </div>
      )}
    </div>
  );
};

export default CreditBalance;
