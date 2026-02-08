import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SoftSkillBuilderPanel from "@/components/SoftSkillBuilderPanel";
import { GraduationCap, Sparkles, Loader2, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function SkillsBuilderPage() {
  const [isLoadingCourses, setIsLoadingCourses] = React.useState(false);
  const [suggestedCourses, setSuggestedCourses] = React.useState<Array<{ id: string; title: string; provider: string; url: string; duration: string; level: string; price: string }>>([]);
  const [lastSkills, setLastSkills] = React.useState<string[]>([]);

  React.useEffect(() => {
    const tryRecommend = async () => {
      try {
        const raw = localStorage.getItem('softSkillRatingsV1');
        const ratings = raw ? JSON.parse(raw) as Record<string, { rating: number; weight: number }> : {};
        const entries = Object.entries(ratings)
          .map(([id, v]) => ({ id, rating: Number(v?.rating ?? 0), weight: Number(v?.weight ?? 0) }))
          .filter(e => e.weight >= 60 && e.rating < 60)
          .sort((a, b) => (b.weight - a.weight) || (a.rating - b.rating))
          .slice(0, 3);

        // Fallback exemplars if user hasn't saved any ratings yet
        const skills = entries.length > 0 ? entries.map(e => e.id.replace(/[-_]/g, ' ')) : ["communication", "critical thinking", "time management"];
        setLastSkills(skills);
        setIsLoadingCourses(true);
        const { data, error } = await supabase.functions.invoke('course-search', {
          body: { skills, level: 'any', budget: 'any', duration: 'any' }
        });
        if (error) throw error;
        const courses = (data?.courses || []).map((c: any) => ({ id: String(c.id), title: c.title, provider: c.provider, url: c.url, duration: c.duration, level: c.level, price: c.price }));
        setSuggestedCourses(courses.slice(0, 6));
      } catch (e) {
        setSuggestedCourses([]);
      } finally {
        setIsLoadingCourses(false);
      }
    };
    // Run once on mount; user can click Save in the panel and refresh to update suggestions
    tryRecommend();
  }, []);
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-8 w-8 text-purple-600" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Skills Builder</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Self-rate soft skills and set their importance. Use this profile to guide occupation matching and learning paths.
        </p>
      </div>

      <Card className="p-4">
        <SoftSkillBuilderPanel />
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold">Recommended Courses</h3>
          </div>
          {isLoadingCourses && <Loader2 className="h-4 w-4 animate-spin text-purple-600" />}
        </div>
        <div className="text-xs text-muted-foreground mb-3">Based on your highest-weight skill gaps: {lastSkills.join(', ')}</div>
        {suggestedCourses.length === 0 && !isLoadingCourses ? (
          <div className="text-sm text-muted-foreground">No suggestions yet. Adjust ratings/weights above and click Save, then refresh this page.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestedCourses.map((c) => (
              <Card key={c.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="space-y-1">
                  <div className="font-medium text-sm truncate">{c.title}</div>
                  <div className="text-xs text-muted-foreground">{c.provider} • {c.level} • {c.duration}</div>
                  <div className="text-xs text-green-700">{c.price}</div>
                  <Button asChild variant="link" className="h-auto p-0 text-xs">
                    <a href={c.url} target="_blank" rel="noreferrer">Open Course →</a>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6 bg-purple-50 border-purple-200">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-purple-700 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-purple-900 mb-2">Next</h3>
            <p className="text-sm text-purple-800 mb-3">
              Use this profile to explore occupations and learning paths that best fit your strengths and goals.
            </p>
            <Button asChild variant="outline">
              <a href="/?useSkillsProfile=true">Explore Matching Occupations →</a>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
