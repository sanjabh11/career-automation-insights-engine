import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCrosswalk } from "@/hooks/useCrosswalk";
import { Loader2, Shield, ArrowRight, BookOpen, Briefcase } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnetEnrichment } from "@/hooks/useOnetEnrichment";

const MILITARY_BRANCHES = [
  { id: "army", name: "U.S. Army" },
  { id: "navy", name: "U.S. Navy" },
  { id: "marines", name: "U.S. Marine Corps" },
  { id: "airforce", name: "U.S. Air Force" },
  { id: "spaceforce", name: "U.S. Space Force" },
  { id: "coastguard", name: "U.S. Coast Guard" },
];

export default function VeteransPage() {
  const [branch, setBranch] = useState("");
  const [mocCode, setMocCode] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const crosswalkQuery = useCrosswalk<any>({
    from: "MOC",
    code: mocCode,
    enabled: submitted && !!mocCode,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mocCode.trim()) {
      setSubmitted(true);
    }
  };

  const handleReset = () => {
    setBranch("");
    setMocCode("");
    setSubmitted(false);
  };

  // Parse crosswalk results
  const civilianOccupations = React.useMemo(() => {
    if (!crosswalkQuery.data) return [];
    
    // Handle different response structures
    let occupations: any[] = [];
    if (Array.isArray(crosswalkQuery.data)) {
      occupations = crosswalkQuery.data;
    } else if (crosswalkQuery.data.occupation) {
      occupations = Array.isArray(crosswalkQuery.data.occupation)
        ? crosswalkQuery.data.occupation
        : [crosswalkQuery.data.occupation];
    } else if (crosswalkQuery.data.results) {
      occupations = Array.isArray(crosswalkQuery.data.results)
        ? crosswalkQuery.data.results
        : [crosswalkQuery.data.results];
    }

    return occupations.map((occ: any) => ({
      code: occ.code || occ.onetsoc_code || occ.soc_code,
      title: occ.title || occ.name,
    }));
  }, [crosswalkQuery.data]);

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Veterans Career Transition
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Translate your military occupation code (MOC) to civilian career opportunities with personalized guidance.
        </p>
      </div>

      {/* Input Form */}
      <Card className="p-6 shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Branch Selection */}
            <div className="space-y-2">
              <Label htmlFor="branch" className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                Military Branch
              </Label>
              <Select value={branch} onValueChange={setBranch}>
                <SelectTrigger id="branch">
                  <SelectValue placeholder="Select your branch" />
                </SelectTrigger>
                <SelectContent>
                  {MILITARY_BRANCHES.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* MOC Code Input */}
            <div className="space-y-2">
              <Label htmlFor="moc" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-blue-600" />
                Military Occupation Code (MOC)
              </Label>
              <Input
                id="moc"
                placeholder="e.g., 11B, 68W, AE"
                value={mocCode}
                onChange={(e) => setMocCode(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={!mocCode.trim() || crosswalkQuery.isFetching}
              className="flex-1"
            >
              {crosswalkQuery.isFetching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Finding Matches...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Find Civilian Careers
                </>
              )}
            </Button>
            {submitted && (
              <Button type="button" variant="outline" onClick={handleReset}>
                Reset
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Results */}
      <AnimatePresence>
        {submitted && (
          <>
            {crosswalkQuery.isError && (
              <Card className="p-6 border-red-200 bg-red-50">
                <p className="text-sm text-red-800">
                  Unable to find matches for MOC code "{mocCode}". Please verify the code and try again.
                </p>
              </Card>
            )}

            {crosswalkQuery.isSuccess && civilianOccupations.length === 0 && (
              <Card className="p-6 border-yellow-200 bg-yellow-50">
                <p className="text-sm text-yellow-800">
                  No direct civilian matches found for MOC code "{mocCode}". Consider exploring related occupations or contact a career counselor.
                </p>
              </Card>
            )}

            {crosswalkQuery.isSuccess && civilianOccupations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <Card className="p-6 bg-blue-50 border-blue-200">
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-900 mb-2">
                        Transition Guidance
                      </h3>
                      <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                        <li>Review each civilian occupation to understand role requirements</li>
                        <li>Identify transferable skills from your military experience</li>
                        <li>Consider additional certifications or training if needed</li>
                        <li>Connect with veteran employment resources and networks</li>
                        <li>Explore learning paths to bridge any skill gaps</li>
                      </ul>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-bold text-lg mb-4">
                    Civilian Career Matches ({civilianOccupations.length})
                  </h3>
                  <div className="space-y-3">
                    {civilianOccupations.map((occ, index) => (
                      <CivilianOccupationCard
                        key={occ.code || index}
                        occupation={occ}
                        index={index}
                      />
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

interface CivilianOccupationCardProps {
  occupation: { code: string; title: string };
  index: number;
}

function CivilianOccupationCard({ occupation, index }: CivilianOccupationCardProps) {
  const { enrichmentData, isLoading } = useOnetEnrichment(occupation.code);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="p-4 hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-gray-900">{occupation.title}</h4>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              SOC Code: {occupation.code}
            </p>
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading details...
            </div>
          )}

          {enrichmentData && (
            <div className="flex flex-wrap gap-2">
              {enrichmentData.bright_outlook && (
                <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  Bright Outlook
                </Badge>
              )}
              {enrichmentData.is_stem && (
                <Badge variant="secondary">STEM</Badge>
              )}
              {enrichmentData.job_zone && (
                <Badge variant="outline">
                  Education: Zone {enrichmentData.job_zone}
                </Badge>
              )}
              {enrichmentData.median_wage_annual && (
                <Badge variant="outline" className="text-green-700">
                  ${(enrichmentData.median_wage_annual / 1000).toFixed(0)}K/year
                </Badge>
              )}
            </div>
          )}

          <div className="pt-2 border-t">
            <Button variant="link" className="h-auto p-0 text-sm" asChild>
              <a href={`/?search=${encodeURIComponent(occupation.title)}`}>
                View Full Analysis & Learning Paths →
              </a>
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
