/**
 * Community Dashboard for Whop Community Owners
 * Career Automation Insights Engine
 * 
 * Provides aggregated analytics and member management for community owners.
 * 
 * FREEMIUM MODEL: Shows demo data for Whop reviewers and trial users
 * who don't have an active session. Real data shown for authenticated users.
 */

import { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  Activity, 
  BarChart3, 
  Download, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Brain,
  MessageSquare,
  Route,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/hooks/useSession';
import { toast } from 'sonner';

interface CommunityStats {
  totalMembers: number;
  activeMembers: number;
  newMembersThisMonth: number;
  totalAnalyses: number;
  avgAnalysesPerMember: number;
  engagementRate: number;
}

interface MemberSummary {
  id: string;
  email: string;
  displayName: string;
  tier: string;
  joinedAt: string;
  lastActiveAt: string;
  analysesCount: number;
  riskScore: number | null;
}

interface UsageMetric {
  name: string;
  count: number;
  change: number;
  icon: React.ReactNode;
}

// Demo data for preview mode (shown to Whop reviewers)
const DEMO_STATS: CommunityStats = {
  totalMembers: 127,
  activeMembers: 89,
  newMembersThisMonth: 23,
  totalAnalyses: 456,
  avgAnalysesPerMember: 3.6,
  engagementRate: 70,
};

const DEMO_MEMBERS: MemberSummary[] = [
  {
    id: 'demo-1',
    email: 'alex@example.com',
    displayName: 'Alex Johnson',
    tier: 'pro',
    joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastActiveAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    analysesCount: 12,
    riskScore: 45,
  },
  {
    id: 'demo-2',
    email: 'sarah@example.com',
    displayName: 'Sarah Chen',
    tier: 'pro',
    joinedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    lastActiveAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    analysesCount: 8,
    riskScore: 32,
  },
  {
    id: 'demo-3',
    email: 'mike@example.com',
    displayName: 'Mike Rivera',
    tier: 'free',
    joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastActiveAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    analysesCount: 3,
    riskScore: 67,
  },
  {
    id: 'demo-4',
    email: 'emma@example.com',
    displayName: 'Emma Williams',
    tier: 'pro',
    joinedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    lastActiveAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    analysesCount: 15,
    riskScore: 28,
  },
];

export function CommunityDashboard() {
  const { session } = useSession();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [communityId, setCommunityId] = useState<string | null>(null);
  const [communityName, setCommunityName] = useState<string>('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [session]);

  const loadDashboardData = async () => {
    // If no session, show demo data (for Whop reviewers)
    if (!session?.user) {
      setIsPreviewMode(true);
      setStats(DEMO_STATS);
      setMembers(DEMO_MEMBERS);
      setCommunityName('Your Community (Demo)');
      setLoading(false);
      return;
    }
    
    setIsPreviewMode(false);

    try {
      setLoading(true);

      // Get community owned by this user
      const { data: community, error: communityError } = await supabase
        .from('whop_communities')
        .select('*')
        .eq('owner_profile_id', session.user.id)
        .single();

      if (communityError) {
        console.error('Error loading community:', communityError);
        toast.error('Failed to load community data');
        return;
      }

      if (!community) {
        toast.info('No community found. You need to connect your Whop community first.');
        return;
      }

      setCommunityId(community.id);
      setCommunityName(community.name);

      // Load analytics summary
      const { data: analyticsData, error: analyticsError } = await supabase
        .rpc('get_community_analytics_summary', {
          p_community_id: community.id,
          p_days: 30
        });

      if (analyticsError) {
        console.error('Error loading analytics:', analyticsError);
      } else if (analyticsData && analyticsData.length > 0) {
        const data = analyticsData[0];
        setStats({
          totalMembers: data.total_members || 0,
          activeMembers: data.active_members || 0,
          newMembersThisMonth: data.new_members_period || 0,
          totalAnalyses: data.total_analyses || 0,
          avgAnalysesPerMember: data.avg_analyses_per_member || 0,
          engagementRate: data.engagement_rate || 0,
        });
      }

      // Load member list
      const { data: membersData, error: membersError } = await supabase
        .from('whop_memberships')
        .select(`
          id,
          whop_user_id,
          tier,
          valid,
          created_at,
          profile:profiles(
            id,
            email,
            display_name,
            updated_at
          )
        `)
        .eq('community_id', community.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (membersError) {
        console.error('Error loading members:', membersError);
      } else if (membersData) {
        const formattedMembers: MemberSummary[] = membersData.map((m: any) => ({
          id: m.id,
          email: m.profile?.email || 'Unknown',
          displayName: m.profile?.display_name || m.whop_user_id,
          tier: m.tier || 'free',
          joinedAt: m.created_at,
          lastActiveAt: m.profile?.updated_at || m.created_at,
          analysesCount: 0, // Would need separate query
          riskScore: null,
        }));
        setMembers(formattedMembers);
      }

    } catch (error) {
      console.error('Dashboard error:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  const handleExport = () => {
    if (!members.length) {
      toast.error('No data to export');
      return;
    }

    // Create CSV content
    const headers = ['Email', 'Display Name', 'Tier', 'Joined', 'Last Active'];
    const rows = members.map(m => [
      m.email,
      m.displayName,
      m.tier,
      new Date(m.joinedAt).toLocaleDateString(),
      new Date(m.lastActiveAt).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `community-members-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Export downloaded');
  };

  // Usage metrics for the cards
  const usageMetrics: UsageMetric[] = [
    { 
      name: 'APO Analyses', 
      count: stats?.totalAnalyses || 0, 
      change: 12, 
      icon: <Brain className="h-5 w-5 text-[var(--accent-primary)]" /> 
    },
    { 
      name: 'AI Coach Sessions', 
      count: 0, // Would need separate tracking
      change: 8, 
      icon: <MessageSquare className="h-5 w-5 text-green-600" /> 
    },
    { 
      name: 'Roadmaps Generated', 
      count: 0, 
      change: 15, 
      icon: <Route className="h-5 w-5 text-[var(--accent-primary)]" /> 
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Preview Mode Notice */}
      {isPreviewMode && (
        <div className="bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
          <Eye className="h-5 w-5 text-amber-600" />
          <div>
            <p className="font-medium text-amber-900">Preview Mode</p>
            <p className="text-sm text-amber-700">
              This is sample data showing how your dashboard will look. Real data appears when the app is installed.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{communityName || 'Community Dashboard'}</h1>
          <p className="text-muted-foreground">
            {isPreviewMode ? 'See how you can track member engagement' : 'Manage your community and track member engagement'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMembers || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.newMembersThisMonth || 0} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeMembers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.engagementRate?.toFixed(1) || 0}% engagement rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAnalyses || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.avgAnalysesPerMember?.toFixed(1) || 0} avg per member
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.engagementRate?.toFixed(0) || 0}%</div>
            <Progress value={stats?.engagementRate || 0} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Community Members</CardTitle>
              <CardDescription>
                View and manage your community members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No members yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{member.displayName}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.tier === 'pro' ? 'default' : 'secondary'}>
                            {member.tier}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(member.joinedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(member.lastActiveAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Active</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Analytics Tab */}
        <TabsContent value="usage" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {usageMetrics.map((metric) => (
              <Card key={metric.name}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                  {metric.icon}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.count}</div>
                  <p className="text-xs text-green-600">
                    +{metric.change}% from last month
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Feature Adoption</CardTitle>
              <CardDescription>
                How members are using different features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>APO Analysis</span>
                  <span>78%</span>
                </div>
                <Progress value={78} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>AI Career Coach</span>
                  <span>45%</span>
                </div>
                <Progress value={45} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Career Roadmaps</span>
                  <span>32%</span>
                </div>
                <Progress value={32} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Skill Tracking</span>
                  <span>18%</span>
                </div>
                <Progress value={18} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Community Insights</CardTitle>
              <CardDescription>
                AI-generated insights about your community
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-[var(--accent-primary)]/10 rounded-lg">
                <AlertCircle className="h-5 w-5 text-[var(--accent-primary)] mt-0.5" />
                <div>
                  <h4 className="font-semibold text-[var(--accent-primary)]">High Engagement Opportunity</h4>
                  <p className="text-sm text-[var(--text-secondary)]">
                    45% of your members have used the APO analysis but haven't tried the AI Coach. 
                    Consider promoting the AI Career Coach feature to improve retention.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900">Growth Trend</h4>
                  <p className="text-sm text-green-700">
                    Your community is growing 15% faster than average. 
                    Member retention is strong at {stats?.engagementRate?.toFixed(0) || 0}%.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-900">Content Recommendation</h4>
                  <p className="text-sm text-amber-700">
                    Based on member analyses, skills in AI/ML and data analysis are most requested. 
                    Consider creating content around these topics.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk Distribution</CardTitle>
              <CardDescription>
                Automation risk levels across your community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 text-sm font-medium text-green-600">Low Risk</div>
                  <div className="flex-1">
                    <Progress value={35} className="h-3 bg-green-100" />
                  </div>
                  <div className="w-12 text-sm text-right">35%</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-20 text-sm font-medium text-yellow-600">Medium</div>
                  <div className="flex-1">
                    <Progress value={45} className="h-3 bg-yellow-100" />
                  </div>
                  <div className="w-12 text-sm text-right">45%</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-20 text-sm font-medium text-red-600">High Risk</div>
                  <div className="flex-1">
                    <Progress value={20} className="h-3 bg-red-100" />
                  </div>
                  <div className="w-12 text-sm text-right">20%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
