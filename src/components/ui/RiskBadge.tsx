import React from 'react';

interface RiskBadgeProps {
    risk: number;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
    risk,
    size = 'md',
    showLabel = true
}) => {
    const getRiskLevel = (apo: number) => {
        if (apo >= 67) return 'high';
        if (apo >= 34) return 'medium';
        return 'low';
    };

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'high': return 'bg-red-100 text-red-700 border-red-300';
            case 'medium': return 'bg-amber-100 text-amber-700 border-amber-300';
            case 'low': return 'bg-green-100 text-green-700 border-green-300';
            default: return 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[hsl(var(--border))]';
        }
    };

    const getRiskIcon = (level: string) => {
        switch (level) {
            case 'high': return '🔴';
            case 'medium': return '🟡';
            case 'low': return '🟢';
            default: return '⚪';
        }
    };

    const getRiskText = (level: string) => {
        switch (level) {
            case 'high': return 'High Risk';
            case 'medium': return 'Medium Risk';
            case 'low': return 'Low Risk';
            default: return 'Unknown';
        }
    };

    const getSizeClasses = () => {
        switch (size) {
            case 'sm': return 'text-xs px-2 py-0.5';
            case 'lg': return 'text-base px-3 py-1.5';
            default: return 'text-sm px-2.5 py-1';
        }
    };

    const level = getRiskLevel(risk);
    const colorClasses = getRiskColor(level);
    const sizeClasses = getSizeClasses();

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-md border font-medium ${colorClasses} ${sizeClasses}`}
            title={`Automation potential: ${risk}%`}
        >
            <span>{getRiskIcon(level)}</span>
            {showLabel && (
                <>
                    <span>{getRiskText(level)}</span>
                    <span className="font-semibold">({risk}%)</span>
                </>
            )}
            {!showLabel && <span className="font-semibold">{risk}%</span>}
        </span>
    );
};
