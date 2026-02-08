import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, XCircle, Clock, FileText, MessageSquare, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Submission {
    id: string;
    studentName: string;
    studentAvatar?: string;
    assignmentTitle: string;
    submittedAt: string;
    status: 'pending' | 'graded' | 'late';
    content: string;
    grade?: number;
    feedback?: string;
}

const MOCK_SUBMISSIONS: Submission[] = [
    {
        id: '1',
        studentName: 'Alice Johnson',
        assignmentTitle: 'Career Path Analysis',
        submittedAt: '2025-11-18T14:30:00Z',
        status: 'pending',
        content: 'Here is my analysis of the Data Scientist career path...',
    },
    {
        id: '2',
        studentName: 'Bob Smith',
        assignmentTitle: 'Resume Optimization',
        submittedAt: '2025-11-19T09:15:00Z',
        status: 'pending',
        content: 'I have updated my resume based on the AI feedback...',
    },
    {
        id: '3',
        studentName: 'Charlie Brown',
        assignmentTitle: 'Interview Prep Reflection',
        submittedAt: '2025-11-17T16:45:00Z',
        status: 'graded',
        content: 'The mock interview was challenging but helpful...',
        grade: 85,
        feedback: 'Good reflection, try to be more specific about technical questions.',
    },
];

interface InstructorGradingUIProps {
    cohortId?: string;
}

export function InstructorGradingUI({ cohortId }: InstructorGradingUIProps) {
    const { toast } = useToast();
    const [submissions, setSubmissions] = useState<Submission[]>(MOCK_SUBMISSIONS);
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
    const [grade, setGrade] = useState<string>('');
    const [feedback, setFeedback] = useState<string>('');

    const handleSelectSubmission = (submission: Submission) => {
        setSelectedSubmission(submission);
        setGrade(submission.grade?.toString() || '');
        setFeedback(submission.feedback || '');
    };

    const handleSubmitGrade = () => {
        if (!selectedSubmission) return;

        const updatedSubmissions = submissions.map((s) =>
            s.id === selectedSubmission.id
                ? { ...s, status: 'graded' as const, grade: Number(grade), feedback }
                : s
        );

        setSubmissions(updatedSubmissions);
        setSelectedSubmission({ ...selectedSubmission, status: 'graded', grade: Number(grade), feedback });

        toast({
            title: 'Grade Submitted',
            description: `Graded ${selectedSubmission.studentName}'s assignment.`,
        });
    };

    return (
        <div className="grid md:grid-cols-3 gap-6 h-[600px]">
            {/* Submission List */}
            <Card className="md:col-span-1 overflow-hidden flex flex-col">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Submissions</CardTitle>
                    <CardDescription>
                        {submissions.filter(s => s.status === 'pending').length} pending review
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-0">
                    <div className="divide-y">
                        {submissions.map((submission) => (
                            <div
                                key={submission.id}
                                className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${selectedSubmission?.id === submission.id ? 'bg-blue-50 hover:bg-blue-50' : ''
                                    }`}
                                onClick={() => handleSelectSubmission(submission)}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback>{submission.studentName[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">{submission.studentName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(submission.submittedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    {submission.status === 'graded' ? (
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <Clock className="h-4 w-4 text-amber-500" />
                                    )}
                                </div>
                                <p className="text-sm font-medium text-slate-700 truncate">
                                    {submission.assignmentTitle}
                                </p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Grading Area */}
            <Card className="md:col-span-2 flex flex-col">
                {selectedSubmission ? (
                    <>
                        <CardHeader className="border-b pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>{selectedSubmission.assignmentTitle}</CardTitle>
                                    <CardDescription>
                                        Submitted by {selectedSubmission.studentName} on{' '}
                                        {new Date(selectedSubmission.submittedAt).toLocaleString()}
                                    </CardDescription>
                                </div>
                                <Badge variant={selectedSubmission.status === 'graded' ? 'secondary' : 'outline'}>
                                    {selectedSubmission.status.toUpperCase()}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Student Content */}
                            <div className="bg-slate-50 p-4 rounded-lg border">
                                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Submission Content
                                </h4>
                                <p className="text-sm text-slate-600 whitespace-pre-wrap">
                                    {selectedSubmission.content}
                                </p>
                            </div>

                            {/* Grading Form */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="col-span-1">
                                        <label className="text-sm font-medium mb-1.5 block">Grade (0-100)</label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={grade}
                                            onChange={(e) => setGrade(e.target.value)}
                                            placeholder="Score"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">Feedback</label>
                                    <Textarea
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        placeholder="Provide constructive feedback..."
                                        className="min-h-[100px]"
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <div className="p-4 border-t bg-slate-50 rounded-b-lg flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setSelectedSubmission(null)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSubmitGrade}>
                                <Send className="h-4 w-4 mr-2" />
                                Submit Grade
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
                        <p>Select a submission to start grading</p>
                    </div>
                )}
            </Card>
        </div>
    );
}
