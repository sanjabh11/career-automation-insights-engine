import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lightbulb } from 'lucide-react';
import { useRoadmaps } from '@/hooks/useRoadmaps';

interface RoadmapGeneratorProps {
    onRoadmapGenerated?: (roadmapId: string) => void;
}

export function RoadmapGenerator({ onRoadmapGenerated }: RoadmapGeneratorProps) {
    const { generateRoadmap, generating } = useRoadmaps();
    const [targetRole, setTargetRole] = useState('');
    const [currentRole, setCurrentRole] = useState('');

    const handleGenerate = async () => {
        if (!targetRole || !currentRole) return;
        try {
            const roadmapId = await generateRoadmap(targetRole, currentRole);
            if (roadmapId && onRoadmapGenerated) {
                onRoadmapGenerated(roadmapId);
            }
        } catch (error) {
            // Error handled in hook
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto border-[var(--accent-primary)]/20 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[var(--accent-primary)]/10 to-[var(--accent-amber)]/10 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-[var(--accent-primary)]">
                    <Lightbulb className="w-5 h-5" />
                    AI Career Roadmap Generator
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentRole">Current Role</Label>
                            <Input
                                id="currentRole"
                                placeholder="e.g. Retail Manager"
                                value={currentRole}
                                onChange={(e) => setCurrentRole(e.target.value)}
                                disabled={generating}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="targetRole">Target Role</Label>
                            <Input
                                id="targetRole"
                                placeholder="e.g. Data Analyst"
                                value={targetRole}
                                onChange={(e) => setTargetRole(e.target.value)}
                                disabled={generating}
                            />
                        </div>
                    </div>

                    <Button
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md transition-all duration-200"
                        size="lg"
                        onClick={handleGenerate}
                        disabled={generating || !targetRole || !currentRole}
                    >
                        {generating ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Generating Personalized Plan...
                            </>
                        ) : (
                            <>
                                <Lightbulb className="w-5 h-5 mr-2" />
                                Generate My Roadmap
                            </>
                        )}
                    </Button>

                    <p className="text-xs text-center text-[var(--text-tertiary)]">
                        Powered by Gemini AI. Takes approx. 10-15 seconds.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
