import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Save } from 'lucide-react';
import { useCareerPlanningStorage } from '@/hooks/useCareerPlanningStorage';

// 34 Employability (soft) skills (grouped) — static list, can be refined per O*NET guidance
const SOFT_SKILLS: { id: string; name: string; group: string; description: string }[] = [
  { id: 'active-listening', name: 'Active Listening', group: 'Communication', description: 'Give full attention to speakers and understand points made.' },
  { id: 'speaking', name: 'Speaking', group: 'Communication', description: 'Convey information effectively to individuals or groups.' },
  { id: 'writing', name: 'Writing', group: 'Communication', description: 'Communicate effectively in writing as appropriate for the audience.' },
  { id: 'reading-comp', name: 'Reading Comprehension', group: 'Communication', description: 'Understand work-related written sentences and paragraphs.' },

  { id: 'critical-thinking', name: 'Critical Thinking', group: 'Problem Solving', description: 'Use logic and reasoning to identify strengths and weaknesses of solutions.' },
  { id: 'complex-problem-solving', name: 'Complex Problem Solving', group: 'Problem Solving', description: 'Identify complex problems and review related information to develop options.' },
  { id: 'judgment-decision', name: 'Judgment & Decision Making', group: 'Problem Solving', description: 'Consider relative costs and benefits to choose appropriate actions.' },
  { id: 'active-learning', name: 'Active Learning', group: 'Problem Solving', description: 'Understand implications of new information for current and future problem-solving.' },

  { id: 'coordination', name: 'Coordination', group: 'Collaboration', description: 'Adjust actions in relation to others’ actions.' },
  { id: 'social-perceptiveness', name: 'Social Perceptiveness', group: 'Collaboration', description: 'Be aware of others’ reactions and understand why they react as they do.' },
  { id: 'negotiation', name: 'Negotiation', group: 'Collaboration', description: 'Bring others together and reconcile differences.' },
  { id: 'persuasion', name: 'Persuasion', group: 'Collaboration', description: 'Persuade others to change their minds or behavior.' },

  { id: 'time-management', name: 'Time Management', group: 'Execution', description: 'Manage one’s own time and the time of others.' },
  { id: 'monitoring', name: 'Monitoring', group: 'Execution', description: 'Monitor/assess performance to make improvements or take corrective action.' },
  { id: 'service-orientation', name: 'Service Orientation', group: 'Execution', description: 'Actively look for ways to help people.' },
  { id: 'dependability', name: 'Dependability', group: 'Execution', description: 'Reliable, responsible, and fulfill obligations.' },

  { id: 'adaptability', name: 'Adaptability/Flexibility', group: 'Work Styles', description: 'Open to change and variety in the workplace.' },
  { id: 'initiative', name: 'Initiative', group: 'Work Styles', description: 'Willingness to take on responsibilities and challenges.' },
  { id: 'persistence', name: 'Persistence', group: 'Work Styles', description: 'Persistence in the face of obstacles.' },
  { id: 'integrity', name: 'Integrity', group: 'Work Styles', description: 'Honest and ethical.' },

  { id: 'learning-strategies', name: 'Learning Strategies', group: 'Growth', description: 'Select and use training/instructional methods appropriate for the situation.' },
  { id: 'metacognition', name: 'Metacognition', group: 'Growth', description: 'Reflect on how you learn and improve learning effectiveness.' },
  { id: 'stress-tolerance', name: 'Stress Tolerance', group: 'Growth', description: 'Accept criticism and deal calmly and effectively with high stress situations.' },
  { id: 'attention-to-detail', name: 'Attention to Detail', group: 'Growth', description: 'Careful about detail and thorough in completing work tasks.' },

  { id: 'creativity', name: 'Creativity', group: 'Innovation', description: 'Develop, design, or create new ideas and relationships.' },
  { id: 'analytical-thinking', name: 'Analytical Thinking', group: 'Innovation', description: 'Analyze information and use logic to address work-related issues.' },
  { id: 'systems-thinking', name: 'Systems Thinking', group: 'Innovation', description: 'Determine how a system should work and how changes affect outcomes.' },
  { id: 'ai-collaboration', name: 'AI Collaboration', group: 'Innovation', description: 'Work effectively with AI tools: prompting, validating, and integrating outputs.' },

  { id: 'leadership', name: 'Leadership', group: 'Leadership', description: 'Lead, take charge, and offer opinions and direction.' },
  { id: 'teamwork', name: 'Teamwork', group: 'Leadership', description: 'Work well with others toward a common goal.' },
  { id: 'mentoring', name: 'Mentoring', group: 'Leadership', description: 'Teach and help others to learn or improve.' },
  { id: 'conflict-resolution', name: 'Conflict Resolution', group: 'Leadership', description: 'Handle complaints, settle disputes, and resolve grievances.' },

  { id: 'professionalism', name: 'Professionalism', group: 'Professional', description: 'Exhibit good judgment, personal responsibility, and workplace etiquette.' },
  { id: 'ethics', name: 'Ethics', group: 'Professional', description: 'Understand and apply ethical considerations in work contexts.' },
];

// Local storage key to persist user self-ratings/weights
const STORAGE_KEY = 'softSkillRatingsV1';

interface RatingsMap { [skillId: string]: { rating: number; weight: number }; }

export default function SoftSkillBuilderPanel() {
  const { saveSkillGaps } = useCareerPlanningStorage(); // optional downstream integration
  const [ratings, setRatings] = useState<RatingsMap>({});
  const [saving, setSaving] = useState(false);

  // load persisted
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setRatings(JSON.parse(raw));
    } catch {}
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, typeof SOFT_SKILLS>();
    SOFT_SKILLS.forEach((s) => {
      const arr = (map.get(s.group) || []);
      arr.push(s);
      map.set(s.group, arr);
    });
    return Array.from(map.entries());
  }, []);

  const handleChange = (id: string, key: 'rating' | 'weight', val: number[]) => {
    setRatings((prev) => ({
      ...prev,
      [id]: { rating: val[0], weight: (prev[id]?.weight ?? 50) },
      ...(key === 'weight' ? { [id]: { rating: (prev[id]?.rating ?? 50), weight: val[0] } } : {}),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings));
    // Optional: derive simple gap insights and persist to planning storage
    try {
      const gaps = Object.entries(ratings)
        .filter(([, v]) => (v.rating < 60 && v.weight >= 60))
        .map(([skillId, v]) => ({
          skillId,
          skillName: SOFT_SKILLS.find(s => s.id === skillId)?.name || skillId,
          gapSize: Math.round((60 - v.rating) / 10) || 1,
          priority: v.weight >= 80 ? 'high' : v.weight >= 60 ? 'medium' : 'low',
        }));
      // save only if any
      if (gaps.length) {
        // @ts-ignore saveSkillGaps signature accepts array from useCareerPlanningStorage
        saveSkillGaps(gaps as any);
      }
    } catch {}
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Soft-Skill Builder</CardTitle>
            <p className="text-sm text-muted-foreground">Self-rate 34 employability skills and set their importance to influence planning.</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {groups.map(([group, items]) => (
          <div key={group} className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{group}</Badge>
              <span className="text-sm text-muted-foreground">Rate (0-100) and Weight (0-100)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {items.map((s) => {
                const r = ratings[s.id]?.rating ?? 50;
                const w = ratings[s.id]?.weight ?? 50;
                return (
                  <div key={s.id} className="border rounded-lg p-4 space-y-3">
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-sm text-muted-foreground">{s.description}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs">Rating: {r}</div>
                      <Slider value={[r]} onValueChange={(v) => handleChange(s.id, 'rating', v)} max={100} step={1} />
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs">Weight: {w}</div>
                      <Slider value={[w]} onValueChange={(v) => handleChange(s.id, 'weight', v)} max={100} step={1} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
