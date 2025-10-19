import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Eye, Scale, Lock, FileText, Users, AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ResponsibleAI() {
  const principles = [
    {
      icon: Shield,
      title: "Transparency",
      description: "All AI predictions include confidence scores, data sources, and explainability artifacts. Users can inspect how decisions are made.",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: Scale,
      title: "Fairness & Bias Mitigation",
      description: "Regular bias audits across demographics. Calibration plots and fairness metrics published quarterly.",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      icon: Lock,
      title: "Privacy & Security",
      description: "User data encrypted at rest and in transit. No PII shared with third parties. GDPR and SOC 2 compliant.",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: Eye,
      title: "Human Oversight",
      description: "AI recommendations are advisory only. Final career decisions remain with users. Human review for edge cases.",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const dataSources = [
    { name: "O*NET Database", version: "28.2", update: "Quarterly", coverage: "1,000+ occupations" },
    { name: "Bureau of Labor Statistics", version: "2024", update: "Monthly", coverage: "Wage & employment data" },
    { name: "Academic Research", version: "Ongoing", update: "Continuous", coverage: "Automation studies" },
    { name: "Industry Reports", version: "2024", update: "Annual", coverage: "Technology trends" },
  ];

  const governance = [
    {
      area: "Model Updates",
      process: "Quarterly review and retraining with new O*NET data. A/B testing before deployment.",
    },
    {
      area: "Bias Audits",
      process: "Monthly fairness metrics across gender, age, education. Disparate impact analysis.",
    },
    {
      area: "User Feedback",
      process: "In-app feedback loops. Quarterly user surveys. Continuous improvement cycle.",
    },
    {
      area: "Incident Response",
      process: "24-hour response for critical issues. Root cause analysis and remediation plan.",
    },
  ];

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-indigo-600" />
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Responsible AI</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Our commitment to ethical, transparent, and accountable AI systems
        </p>
      </div>

      {/* Core Principles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {principles.map((principle, index) => (
          <motion.div
            key={principle.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6 h-full">
              <div className={`inline-flex p-3 rounded-lg ${principle.bgColor} mb-4`}>
                <principle.icon className={`h-6 w-6 ${principle.color}`} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{principle.title}</h3>
              <p className="text-sm text-muted-foreground">{principle.description}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Data Sources */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-indigo-600" />
          <h2 className="text-2xl font-semibold">Data Sources & Provenance</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dataSources.map((source, index) => (
            <motion.div
              key={source.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 border rounded-lg space-y-2"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">{source.name}</h4>
                <Badge variant="outline">{source.version}</Badge>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Update Frequency: {source.update}</p>
                <p>Coverage: {source.coverage}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900">
            <CheckCircle2 className="inline h-4 w-4 mr-1" />
            All data sources are publicly available, peer-reviewed, or from official government agencies. No proprietary or biased datasets used.
          </p>
        </div>
      </Card>

      {/* Privacy Practices */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-5 w-5 text-green-600" />
          <h2 className="text-2xl font-semibold">Privacy & Data Protection</h2>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">What We Collect</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Search queries and filter preferences</li>
                <li>• Occupation and skill selections</li>
                <li>• Anonymous usage analytics</li>
                <li>• Feedback and survey responses</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">What We Don't Collect</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Personal identification (name, email)</li>
                <li>• Financial information</li>
                <li>• Precise location data</li>
                <li>• Biometric data</li>
              </ul>
            </div>
          </div>
          <div className="p-4 border-l-4 border-green-500 bg-green-50">
            <p className="text-sm text-green-900">
              <strong>User Control:</strong> You can request data export or deletion at any time. Contact us at privacy@example.com
            </p>
          </div>
        </div>
      </Card>

      {/* Governance & Oversight */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-purple-600" />
          <h2 className="text-2xl font-semibold">Governance & Oversight</h2>
        </div>
        <div className="space-y-3">
          {governance.map((item, index) => (
            <motion.div
              key={item.area}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 border rounded-lg"
            >
              <h4 className="font-semibold mb-1">{item.area}</h4>
              <p className="text-sm text-muted-foreground">{item.process}</p>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Limitations & Disclaimers */}
      <Card className="p-6 border-orange-200 bg-orange-50">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-semibold text-orange-900">Known Limitations</h3>
            <ul className="text-sm text-orange-800 space-y-1">
              <li>• Automation predictions are probabilistic, not deterministic. Actual outcomes may vary.</li>
              <li>• Data reflects historical trends and may not capture emerging occupations or rapid technological shifts.</li>
              <li>• Skill recommendations are generalized and may not account for individual circumstances or regional variations.</li>
              <li>• Users should consult with career counselors or domain experts for personalized advice.</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Compliance & Certifications */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Compliance & Standards</h2>
        <div className="flex flex-wrap gap-3">
          {[
            "O*NET Terms of Service",
            "BLS Data Usage Policy",
            "GDPR Compliant",
            "ISO 27001 (Planned)",
            "SOC 2 Type II (Planned)",
            "WCAG 2.1 AA Accessibility",
          ].map((cert, index) => (
            <Badge key={cert} variant="secondary" className="text-xs">
              {cert}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Contact */}
      <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50">
        <h3 className="text-lg font-semibold mb-2">Questions or Concerns?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          We're committed to continuous improvement. If you have questions about our AI practices or want to report an issue:
        </p>
        <div className="flex gap-4 text-sm">
          <a href="mailto:ai-ethics@example.com" className="text-indigo-600 hover:underline">
            ai-ethics@example.com
          </a>
          <span className="text-muted-foreground">|</span>
          <a href="mailto:privacy@example.com" className="text-indigo-600 hover:underline">
            privacy@example.com
          </a>
        </div>
      </Card>
    </div>
  );
}
