/**
 * Bootcamp Student Dashboard
 * Phase 3 - Student portal for bootcamp participants
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
  User,
  Video,
  FileText,
  Target,
  Briefcase,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Enrollment {
  id: string;
  cohort: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
  };
  progress_percentage: number;
  pre_bootcamp_apo_score: number | null;
  post_bootcamp_apo_score: number | null;
  completion_status: string;
}

interface Module {
  id: string;
  week_number: number;
  title: string;
  description: string;
  content_url: string | null;
  estimated_hours: number;
}

interface Assignment {
  id: string;
  title: string;
  assignment_type: string;
  due_date: string;
  points_possible: number;
  submission: {
    status: string;
    points_earned: number | null;
  } | null;
}

interface LiveSession {
  id: string;
  title: string;
  session_type: string;
  scheduled_at: string;
  duration_minutes: number;
  zoom_meeting_url: string | null;
  recording_url: string | null;
}

const BootcampDashboardPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to access your bootcamp dashboard',
          variant: 'destructive',
        });
        return;
      }

      setUserId(user.id);

      // Load enrollment
      const { data: enrollmentData, error: enrollError } = await supabase
        .from('bootcamp_enrollments')
        .select(`
          *,
          cohort:cohort_id(id, name, start_date, end_date)
        `)
        .eq('user_id', user.id)
        .eq('completion_status', 'in_progress')
        .single();

      if (enrollError) throw enrollError;

      setEnrollment(enrollmentData as any);

      // Load modules for cohort
      const { data: modulesData } = await supabase
        .from('bootcamp_modules')
        .select('*')
        .eq('cohort_id', enrollmentData.cohort_id)
        .eq('is_published', true)
        .order('week_number');

      setModules(modulesData || []);

      // Load assignments with submission status
      const { data: assignmentsData } = await supabase
        .from('bootcamp_assignments')
        .select(`
          *,
          submission:bootcamp_submissions(status, points_earned)
        `)
        .in('module_id', modulesData?.map((m: any) => m.id) || [])
        .order('due_date');

      setAssignments(assignmentsData as any || []);

      // Load upcoming live sessions
      const { data: sessionsData } = await supabase
        .from('bootcamp_live_sessions')
        .select('*')
        .eq('cohort_id', enrollmentData.cohort_id)
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at')
        .limit(5);

      setLiveSessions(sessionsData || []);

      // Update progress
      await supabase.rpc('calculate_student_progress', {
        p_enrollment_id: enrollmentData.id,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to load bootcamp dashboard',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="secondary">Submitted</Badge>;
      case 'graded':
        return <Badge variant="default">Graded</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  const pendingAssignments = assignments.filter(
    (a) => !a.submission || a.submission.status === 'draft'
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>No Active Enrollment</CardTitle>
            <CardDescription>
              You are not currently enrolled in a bootcamp cohort.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/pricing'}>
              View Bootcamp Options
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{enrollment.cohort.name}</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's your progress overview.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold">{enrollment.progress_percentage}%</p>
              </div>
            </div>
            <Progress value={enrollment.progress_percentage} className="mt-4" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                <FileText className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingAssignments.length}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">assignments due</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">APO Improvement</p>
                <p className="text-2xl font-bold">
                  {enrollment.pre_bootcamp_apo_score && enrollment.post_bootcamp_apo_score
                    ? `-${(enrollment.pre_bootcamp_apo_score - enrollment.post_bootcamp_apo_score).toFixed(0)} pts`
                    : 'TBD'}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">automation risk reduced</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Session</p>
                <p className="text-lg font-bold">
                  {liveSessions.length > 0
                    ? formatDistanceToNow(new Date(liveSessions[0].scheduled_at), {
                        addSuffix: true,
                      })
                    : 'None'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="curriculum" className="space-y-6">
        <TabsList>
          <TabsTrigger value="curriculum">
            <BookOpen className="w-4 h-4 mr-2" />
            Curriculum
          </TabsTrigger>
          <TabsTrigger value="assignments">
            <FileText className="w-4 h-4 mr-2" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="live-sessions">
            <Video className="w-4 h-4 mr-2" />
            Live Sessions
          </TabsTrigger>
          <TabsTrigger value="job-search">
            <Briefcase className="w-4 h-4 mr-2" />
            Job Search
          </TabsTrigger>
        </TabsList>

        {/* Curriculum Tab */}
        <TabsContent value="curriculum" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Modules</CardTitle>
              <CardDescription>
                Complete modules at your own pace following the schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {modules.map((module) => (
                  <div
                    key={module.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-lg font-bold text-primary">
                        W{module.week_number}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{module.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {module.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {module.estimated_hours}h
                        </span>
                      </div>
                    </div>
                    {module.content_url && (
                      <Button
                        variant="outline"
                        onClick={() => window.open(module.content_url!, '_blank')}
                      >
                        Watch Lecture
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Assignments</CardTitle>
              <CardDescription>
                Complete assignments to progress through the bootcamp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-start gap-4">
                      <CheckCircle className="w-5 h-5 text-muted-foreground mt-1" />
                      <div>
                        <h4 className="font-semibold">{assignment.title}</h4>
                        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                          <Badge variant="outline">{assignment.assignment_type}</Badge>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Due {new Date(assignment.due_date).toLocaleDateString()}
                          </span>
                          <span>{assignment.points_possible} points</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(assignment.submission?.status || 'not_started')}
                      {assignment.submission?.points_earned !== null && (
                        <Badge variant="default">
                          {assignment.submission.points_earned}/{assignment.points_possible}
                        </Badge>
                      )}
                      <Button variant="outline" size="sm">
                        {assignment.submission ? 'View Submission' : 'Start Assignment'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Sessions Tab */}
        <TabsContent value="live-sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Live Sessions</CardTitle>
              <CardDescription>
                Join live sessions for lectures, office hours, and workshops
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {liveSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-start gap-4 p-4 border rounded-lg"
                  >
                    <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center shrink-0">
                      <Video className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{session.title}</h4>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <Badge variant="outline">{session.session_type}</Badge>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(session.scheduled_at).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {session.duration_minutes} min
                        </span>
                      </div>
                    </div>
                    {session.zoom_meeting_url && (
                      <Button
                        onClick={() => window.open(session.zoom_meeting_url!, '_blank')}
                      >
                        Join Session
                      </Button>
                    )}
                    {session.recording_url && (
                      <Button
                        variant="outline"
                        onClick={() => window.open(session.recording_url!, '_blank')}
                      >
                        Watch Recording
                      </Button>
                    )}
                  </div>
                ))}

                {liveSessions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No upcoming sessions scheduled
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Job Search Tab */}
        <TabsContent value="job-search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Search Tools</CardTitle>
              <CardDescription>
                Resources to help you land your next role
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full justify-start" variant="outline">
                <User className="w-4 h-4 mr-2" />
                Build Your Portfolio
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Resume Review
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Video className="w-4 h-4 mr-2" />
                Mock Interview Practice
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Briefcase className="w-4 h-4 mr-2" />
                Track Job Applications
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BootcampDashboardPage;
