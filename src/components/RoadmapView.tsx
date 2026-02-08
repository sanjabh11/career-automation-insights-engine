import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Download, Map, ArrowRight } from 'lucide-react';
import { Roadmap, useRoadmaps } from '@/hooks/useRoadmaps';
import { cn } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface RoadmapViewProps {
    roadmap: Roadmap;
}

export function RoadmapView({ roadmap }: RoadmapViewProps) {
    const { updateMilestoneStatus } = useRoadmaps();

    const handleExportPDF = async () => {
        const element = document.getElementById('roadmap-content');
        if (!element) return;

        try {
            const canvas = await html2canvas(element);
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`roadmap-${roadmap.target_role.toLowerCase().replace(/\s+/g, '-')}.pdf`);
        } catch (error) {
            console.error('Error exporting PDF:', error);
        }
    };

    const completedCount = roadmap.milestones?.filter(m => m.status === 'completed').length || 0;
    const totalCount = roadmap.milestones?.length || 0;
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return (
        <div className="space-y-6">
            <Card className="border-0 shadow-lg bg-[var(--bg-secondary)]" id="roadmap-content">
                <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-t-lg p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2 text-[var(--accent-primary)]/60">
                                <Map className="w-4 h-4" />
                                <span className="text-sm font-medium uppercase tracking-wider">Career Roadmap</span>
                            </div>
                            <CardTitle className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                                {roadmap.current_role && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-gray-300">{roadmap.current_role}</span>
                                        <ArrowRight className="w-6 h-6 text-[var(--accent-primary)]" />
                                    </div>
                                )}
                                <span className="text-[var(--accent-primary)]/40">{roadmap.target_role}</span>
                            </CardTitle>
                            <p className="text-slate-400 text-sm mt-2">
                                Generated on {new Date(roadmap.generated_at).toLocaleDateString()}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            className="bg-[var(--bg-secondary)]/10 text-white border-white/20 hover:bg-[var(--bg-secondary)]/20 hover:text-white"
                            onClick={handleExportPDF}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export PDF
                        </Button>
                    </div>

                    <div className="mt-6">
                        <div className="flex justify-between text-sm mb-2 text-slate-300">
                            <span>Progress</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[var(--accent-primary)] transition-all duration-500 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-6 md:p-8">
                    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                        {roadmap.milestones?.map((milestone, index) => (
                            <div key={milestone.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">

                                {/* Icon */}
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                    {milestone.status === 'completed' ? (
                                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                                    ) : (
                                        <Circle className="w-6 h-6 text-slate-300" />
                                    )}
                                </div>

                                {/* Content Card */}
                                <Card className={cn(
                                    "w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 border transition-all duration-200 hover:shadow-md",
                                    milestone.status === 'completed' ? "bg-green-50 border-green-100" : "bg-[var(--bg-secondary)]"
                                )}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-mono text-xs text-slate-400">Step {index + 1}</span>
                                        <Badge
                                            variant={milestone.status === 'completed' ? 'default' : 'secondary'}
                                            className={milestone.status === 'completed' ? 'bg-green-500 hover:bg-green-600' : ''}
                                        >
                                            {milestone.status === 'completed' ? 'Completed' : 'Pending'}
                                        </Badge>
                                    </div>
                                    <h3 className={cn(
                                        "font-bold text-lg mb-2",
                                        milestone.status === 'completed' ? "text-green-900" : "text-slate-800"
                                    )}>
                                        {milestone.title}
                                    </h3>
                                    <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                                        {milestone.description}
                                    </p>

                                    {milestone.status !== 'completed' && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                                            onClick={() => updateMilestoneStatus(milestone.id, 'completed')}
                                        >
                                            Mark as Complete
                                        </Button>
                                    )}
                                </Card>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
