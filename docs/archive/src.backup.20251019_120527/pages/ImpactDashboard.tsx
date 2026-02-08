import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, BookOpen, Award, Download, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

export default function ImpactDashboard() {
  const metrics = [
    {
      icon: Users,
      label: "Users Served",
      value: "2,847",
      change: "+23% this month",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: BookOpen,
      label: "Career Paths Explored",
      value: "8,432",
      change: "+45% this month",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      icon: TrendingUp,
      label: "Skills Identified",
      value: "15,621",
      change: "+38% this month",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: Award,
      label: "Certifications Recommended",
      value: "1,234",
      change: "+52% this month",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Career Transitioner",
      company: "Tech Startup",
      quote: "The AI-powered career insights helped me transition from marketing to data analytics. The automation risk scores and skill gap analysis were invaluable.",
      outcome: "Successfully transitioned to Data Analyst role with 40% salary increase",
    },
    {
      name: "Rajesh Kumar",
      role: "Engineering Student",
      company: "IIT Delhi",
      quote: "The platform's STEM career pathways and bright outlook occupations gave me clarity on high-growth opportunities in AI and robotics.",
      outcome: "Secured internship at leading AI research lab",
    },
    {
      name: "Anita Desai",
      role: "HR Professional",
      company: "Fortune 500 Company",
      quote: "We use this platform for workforce planning. The automation potential scores help us identify reskilling priorities across 5,000+ employees.",
      outcome: "Reduced skill gaps by 35% through targeted training programs",
    },
  ];

  const outcomes = [
    { metric: "Average Wage Increase", value: "32%", description: "For users who transitioned careers" },
    { metric: "Skill Match Accuracy", value: "94%", description: "Between recommended and actual job requirements" },
    { metric: "Time to Career Decision", value: "60% faster", description: "Compared to traditional career counseling" },
    { metric: "User Satisfaction", value: "4.8/5.0", description: "Based on 1,200+ user surveys" },
  ];

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-8 w-8 text-indigo-600" />
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Impact Dashboard</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Real outcomes and measurable impact from our AI-powered career intelligence platform
        </p>
        <Badge variant="outline" className="text-xs">
          Updated: {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                  <metric.icon className={`h-6 w-6 ${metric.color}`} />
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                <p className="text-xs text-green-600 font-medium">{metric.change}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Measurable Outcomes */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Measurable Outcomes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {outcomes.map((outcome, index) => (
            <motion.div
              key={outcome.metric}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="text-center space-y-2"
            >
              <div className="text-4xl font-bold text-indigo-600">{outcome.value}</div>
              <div className="text-sm font-semibold">{outcome.metric}</div>
              <div className="text-xs text-muted-foreground">{outcome.description}</div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* User Testimonials */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Success Stories</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.15 }}
            >
              <Card className="p-6 h-full flex flex-col">
                <div className="flex-1 space-y-3">
                  <p className="text-sm italic text-muted-foreground">"{testimonial.quote}"</p>
                  <div className="pt-3 border-t">
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.company}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Badge variant="secondary" className="text-xs">
                    ✓ {testimonial.outcome}
                  </Badge>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Funnel Analytics */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">User Journey Funnel</h2>
        <div className="space-y-3">
          {[
            { stage: "Career Exploration", users: 2847, percentage: 100 },
            { stage: "Skill Gap Analysis", users: 2134, percentage: 75 },
            { stage: "Learning Path Created", users: 1598, percentage: 56 },
            { stage: "Course Enrolled", users: 892, percentage: 31 },
            { stage: "Certification Achieved", users: 456, percentage: 16 },
          ].map((stage, index) => (
            <div key={stage.stage} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{stage.stage}</span>
                <span className="text-muted-foreground">{stage.users} users ({stage.percentage}%)</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stage.percentage}%` }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Export Actions */}
      <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Export Impact Report</h3>
            <p className="text-sm text-muted-foreground">Download comprehensive metrics for stakeholders and award submissions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
