import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, GraduationCap, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface CipProgram {
  id: string;
  cip_code: string;
  title: string;
  provider: string;
  modality: string;
  duration_weeks: number;
  cost_min: number;
  cost_max: number;
  url: string;
}

interface EducationPathway {
  id: string;
  soc_code: string;
  cip_code: string;
  source: string;
  confidence: number;
  notes: string;
}

interface CipMappingCardProps {
  socCode: string;
}

export function CipMappingCard({ socCode }: CipMappingCardProps) {
  const [programs, setPrograms] = useState<CipProgram[]>([]);
  const [pathways, setPathways] = useState<EducationPathway[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!socCode) return;

      try {
        // Get pathways for this SOC
        const { data: pathwaysData, error: pathwaysError } = await supabase
          .from('education_pathways')
          .select('*')
          .eq('soc_code', socCode)
          .order('confidence', { ascending: false });

        if (pathwaysError) throw pathwaysError;
        setPathways(pathwaysData || []);

        // Get CIP programs for matching CIP codes
        if (pathwaysData && pathwaysData.length > 0) {
          const cipCodes = pathwaysData.map(p => p.cip_code);
          const { data: programsData, error: programsError } = await supabase
            .from('cip_programs')
            .select('*')
            .in('cip_code', cipCodes)
            .order('cost_min', { ascending: true });

          if (programsError) throw programsError;
          setPrograms(programsData || []);
        } else {
          setPrograms([]);
        }
      } catch (error) {
        console.error('Error fetching CIP data:', error);
        setPrograms([]);
        setPathways([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [socCode]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getCostRange = (min: number, max: number) => {
    if (min === max) return `$${min.toLocaleString()}`;
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  };

  if (loading) {
    return (
      <Card className="mt-6">
        <CardContent className="p-6">
          <LoadingSpinner size="sm" text="Loading education pathways..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-blue-600" />
          Education Pathways & CIP Programs
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pathways.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No education pathways found for this occupation.</p>
            <p className="text-sm">CIP programs and training recommendations will appear here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3">Recommended Programs</h4>
              <div className="space-y-3">
                {programs.map((program) => {
                  const pathway = pathways.find(p => p.cip_code === program.cip_code);
                  return (
                    <div key={program.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h5 className="font-medium text-sm mb-1">{program.title}</h5>
                          <p className="text-xs text-gray-600 mb-2">
                            {program.provider} • {program.modality} • {program.duration_weeks} weeks
                          </p>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              CIP {program.cip_code}
                            </Badge>
                            {pathway && (
                              <Badge className={`text-xs ${getConfidenceColor(pathway.confidence)}`}>
                                {(pathway.confidence * 100).toFixed(0)}% match
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mb-2">
                            Cost: {getCostRange(program.cost_min, program.cost_max)}
                          </p>
                          {pathway?.notes && (
                            <p className="text-xs text-gray-700">{pathway.notes}</p>
                          )}
                        </div>
                        {program.url && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(program.url, '_blank')}
                            className="ml-2"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {pathways.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Pathway Details</h4>
                <div className="space-y-2">
                  {pathways.map((pathway) => (
                    <div key={pathway.id} className="p-3 bg-gray-50 rounded text-sm">
                      <div className="flex items-center justify-between">
                        <span>CIP {pathway.cip_code}</span>
                        <div className="flex items-center gap-2">
                          <Badge className={getConfidenceColor(pathway.confidence)}>
                            {Math.round(pathway.confidence * 100)}% confidence
                          </Badge>
                          <span className="text-xs text-gray-500">Source: {pathway.source}</span>
                        </div>
                      </div>
                      {pathway.notes && (
                        <p className="text-xs text-gray-600 mt-1">{pathway.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-2">About CIP Programs</h5>
          <p className="text-sm text-blue-700">
            CIP (Classification of Instructional Programs) codes categorize educational programs.
            These recommendations show relevant training programs that can help bridge skill gaps
            for career transitions in this occupation.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
