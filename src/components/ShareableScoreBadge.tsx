import React, { useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Share2 } from 'lucide-react';
import { trackEvent } from '@/lib/posthog';

interface ShareableScoreBadgeProps {
  score: number; // 0-100 AI-Proof score (inverse of risk)
  onShareTwitter?: () => void;
  onShareLinkedIn?: () => void;
}

function getScoreColor(score: number): string {
  if (score >= 70) return '#10b981'; // emerald
  if (score >= 40) return '#f59e0b'; // amber
  return '#ef4444'; // red
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Highly Resilient';
  if (score >= 60) return 'Well Positioned';
  if (score >= 40) return 'Moderate Risk';
  if (score >= 20) return 'Needs Attention';
  return 'High Risk';
}

export function ShareableScoreBadge({ score, onShareTwitter, onShareLinkedIn }: ShareableScoreBadgeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  const generateBadgeImage = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 340;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(null); return; }

      // Background
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(0, 0, 600, 340, 16);
      ctx.fill();

      // Border accent
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(1.5, 1.5, 597, 337, 16);
      ctx.stroke();

      // Score circle background
      ctx.beginPath();
      ctx.arc(140, 170, 80, 0, Math.PI * 2);
      ctx.fillStyle = '#1e293b';
      ctx.fill();

      // Score arc (progress)
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (score / 100) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(140, 170, 80, startAngle, endAngle);
      ctx.strokeStyle = color;
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Score text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 42px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${score}`, 140, 160);
      ctx.font = '14px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('out of 100', 140, 195);

      // Right side text
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Inter, system-ui, sans-serif';
      ctx.fillText('My AI-Proof Score', 260, 100);

      ctx.fillStyle = color;
      ctx.font = 'bold 28px Inter, system-ui, sans-serif';
      ctx.fillText(label, 260, 145);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px Inter, system-ui, sans-serif';
      ctx.fillText('How resilient is your resume to AI', 260, 190);
      ctx.fillText('automation? Get your score free at:', 260, 210);

      ctx.fillStyle = '#2dd4a8';
      ctx.font = 'bold 14px Inter, system-ui, sans-serif';
      ctx.fillText('automationinsights.app/resume', 260, 240);

      // Footer
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 290, 600, 50);
      ctx.fillStyle = '#64748b';
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Powered by Automation Insights — O*NET data + Gemini AI analysis', 300, 318);

      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  }, [score, color, label]);

  const handleDownloadBadge = async () => {
    trackEvent('score_badge_downloaded', { score, label });
    const blob = await generateBadgeImage();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-proof-score-${score}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShareTwitter = () => {
    trackEvent('score_badge_shared', { platform: 'twitter', score });
    if (onShareTwitter) { onShareTwitter(); return; }
    const text = `My AI-Proof Score is ${score}/100 — ${label}. How resilient is YOUR resume to AI automation? Find out free:`;
    const url = window.location.origin + '/tools/resume-analyzer';
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const handleShareLinkedIn = () => {
    trackEvent('score_badge_shared', { platform: 'linkedin', score });
    if (onShareLinkedIn) { onShareLinkedIn(); return; }
    const url = window.location.origin + '/tools/resume-analyzer';
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
  };

  // SVG badge for inline display
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <Card className="border-2 border-slate-700 bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* SVG Score Ring */}
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Background ring */}
              <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="6" />
              {/* Progress ring */}
              <circle
                cx="50" cy="50" r="45"
                fill="none"
                stroke={color}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform="rotate(-90 50 50)"
                style={{ transition: 'stroke-dashoffset 1s ease-out' }}
              />
              {/* Score text */}
              <text x="50" y="46" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontFamily="Inter, system-ui">{score}</text>
              <text x="50" y="62" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="Inter, system-ui">out of 100</text>
            </svg>
          </div>

          {/* Score details */}
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-lg font-bold text-white mb-1">My AI-Proof Score</h3>
            <p className="text-2xl font-bold mb-2" style={{ color }}>{label}</p>
            <p className="text-sm text-slate-400 mb-4">
              Download your badge and share it — challenge your network!
            </p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <Button size="sm" onClick={handleDownloadBadge} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                <Download className="h-4 w-4 mr-1" />
                Save Badge
              </Button>
              <Button size="sm" onClick={handleShareTwitter} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                𝕏 Share
              </Button>
              <Button size="sm" onClick={handleShareLinkedIn} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                <Share2 className="h-4 w-4 mr-1" />
                LinkedIn
              </Button>
            </div>
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  );
}
