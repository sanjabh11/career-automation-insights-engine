/**
 * Workshop Booking Page
 * Phase 1 Priority - Corporate Workshop Booking System
 * Based on PRD Section 3.3 (B2B Corporate Workshops)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import {
  Building2,
  Users,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileText,
  Video,
  Shield,
} from 'lucide-react';
import { WORKSHOP_PRICING } from '@/lib/stripe';

interface WorkshopForm {
  company_name: string;
  industry: string;
  employee_count: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  workshop_type: 'half_day' | 'full_day' | 'two_day' | 'custom';
  delivery_mode: 'virtual' | 'in_person' | 'hybrid';
  preferred_dates: string;
  location_address: string;
  participant_count: string;
  specific_challenges: string;
  goals: string;
}

const WorkshopBookingPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'info' | 'submitted'>('info');

  const [formData, setFormData] = useState<WorkshopForm>({
    company_name: '',
    industry: '',
    employee_count: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    workshop_type: 'full_day',
    delivery_mode: 'virtual',
    preferred_dates: '',
    location_address: '',
    participant_count: '',
    specific_challenges: '',
    goals: '',
  });

  const calculatePrice = (): number => {
    const empCount = parseInt(formData.employee_count) || 0;
    const companySize = empCount < 500 ? 'small' : empCount < 2000 ? 'medium' : 'large';
    const workshopType = formData.workshop_type;

    if (workshopType === 'custom') return 0;

    const pricing = WORKSHOP_PRICING[workshopType];
    return pricing ? pricing[companySize] : 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const price = calculatePrice();

      // Insert workshop inquiry into database
      const { error } = await supabase.from('workshops').insert({
        company_name: formData.company_name,
        industry: formData.industry,
        employee_count: parseInt(formData.employee_count) || null,
        contact_name: formData.contact_name,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        workshop_type: formData.workshop_type,
        delivery_mode: formData.delivery_mode,
        participant_count: parseInt(formData.participant_count) || null,
        location_address: formData.delivery_mode !== 'virtual' ? formData.location_address : null,
        price_quoted: price,
        final_price: price,
        status: 'inquiry',
        intake_questionnaire: {
          preferred_dates: formData.preferred_dates,
          specific_challenges: formData.specific_challenges,
          goals: formData.goals,
        },
      });

      if (error) throw error;

      // Send notification email (would be done via Supabase Edge Function in production)
      toast({
        title: 'Inquiry Submitted!',
        description: "We'll contact you within 24 hours to schedule your consultation.",
      });

      setStep('submitted');
    } catch (error) {
      console.error('Error submitting workshop inquiry:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit inquiry. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof WorkshopForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (step === 'submitted') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-3xl">Thank You!</CardTitle>
            <CardDescription className="text-lg mt-2">
              Your workshop inquiry has been received
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 p-6 rounded-lg space-y-4">
              <h3 className="font-semibold text-lg">What happens next?</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">24-Hour Response</p>
                    <p className="text-sm text-muted-foreground">
                      We'll review your inquiry and reach out within one business day
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Consultation Call</p>
                    <p className="text-sm text-muted-foreground">
                      30-minute discovery call to understand your needs and customize the workshop
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Custom Proposal</p>
                    <p className="text-sm text-muted-foreground">
                      Detailed proposal with agenda, pricing, and sample deliverables
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                A confirmation email has been sent to <strong>{formData.contact_email}</strong>
              </p>
              <Button onClick={() => navigate('/')} variant="outline">
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const estimatedPrice = calculatePrice();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Automation Readiness Workshop
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Data-driven automation strategy for your organization
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Badge variant="secondary" className="text-sm py-1.5">
              <Shield className="w-4 h-4 mr-1" />
              Customized Analysis
            </Badge>
            <Badge variant="secondary" className="text-sm py-1.5">
              <FileText className="w-4 h-4 mr-1" />
              Detailed Report Included
            </Badge>
            <Badge variant="secondary" className="text-sm py-1.5">
              <Video className="w-4 h-4 mr-1" />
              Virtual or In-Person
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Left Column - Benefits */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>What's Included</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">APO Analysis</p>
                    <p className="text-sm text-muted-foreground">
                      Department-by-department automation risk scoring
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Role-by-Role Assessment</p>
                    <p className="text-sm text-muted-foreground">
                      Identify which roles to automate vs. upskill
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">40-Page Report</p>
                    <p className="text-sm text-muted-foreground">
                      Executive summary + 3-year transformation roadmap
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Interactive Exercises</p>
                    <p className="text-sm text-muted-foreground">
                      Hands-on decision frameworks for your team
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Half-Day Workshop</span>
                    <span className="font-medium">$10K - $25K</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Full-Day Workshop</span>
                    <span className="font-medium">$20K - $50K</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Two-Day Workshop</span>
                    <span className="font-medium">$35K - $85K</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Pricing based on company size and workshop type. Custom packages available.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Request a Workshop</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll contact you within 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Company Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Company Information
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="company_name">Company Name *</Label>
                        <Input
                          id="company_name"
                          required
                          value={formData.company_name}
                          onChange={(e) => updateFormData('company_name', e.target.value)}
                          placeholder="Acme Corporation"
                        />
                      </div>
                      <div>
                        <Label htmlFor="industry">Industry *</Label>
                        <Select value={formData.industry} onValueChange={(val) => updateFormData('industry', val)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="energy">Energy</SelectItem>
                            <SelectItem value="manufacturing">Manufacturing</SelectItem>
                            <SelectItem value="healthcare">Healthcare</SelectItem>
                            <SelectItem value="technology">Technology</SelectItem>
                            <SelectItem value="finance">Financial Services</SelectItem>
                            <SelectItem value="retail">Retail</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="employee_count">Number of Employees *</Label>
                      <Select value={formData.employee_count} onValueChange={(val) => updateFormData('employee_count', val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select company size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="50">1-50</SelectItem>
                          <SelectItem value="250">51-500</SelectItem>
                          <SelectItem value="1000">501-2,000</SelectItem>
                          <SelectItem value="5000">2,001-10,000</SelectItem>
                          <SelectItem value="10000">10,000+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Contact Information
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contact_name">Your Name *</Label>
                        <Input
                          id="contact_name"
                          required
                          value={formData.contact_name}
                          onChange={(e) => updateFormData('contact_name', e.target.value)}
                          placeholder="John Smith"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact_email">Email *</Label>
                        <Input
                          id="contact_email"
                          type="email"
                          required
                          value={formData.contact_email}
                          onChange={(e) => updateFormData('contact_email', e.target.value)}
                          placeholder="john@company.com"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="contact_phone">Phone Number (Optional)</Label>
                      <Input
                        id="contact_phone"
                        type="tel"
                        value={formData.contact_phone}
                        onChange={(e) => updateFormData('contact_phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>

                  {/* Workshop Details */}
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Workshop Details
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="workshop_type">Workshop Type *</Label>
                        <Select value={formData.workshop_type} onValueChange={(val: any) => updateFormData('workshop_type', val)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="half_day">Half-Day (4 hours)</SelectItem>
                            <SelectItem value="full_day">Full-Day (8 hours)</SelectItem>
                            <SelectItem value="two_day">Two-Day</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="delivery_mode">Delivery Mode *</Label>
                        <Select value={formData.delivery_mode} onValueChange={(val: any) => updateFormData('delivery_mode', val)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="virtual">Virtual (Zoom)</SelectItem>
                            <SelectItem value="in_person">In-Person</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="participant_count">Expected Participants *</Label>
                        <Input
                          id="participant_count"
                          type="number"
                          required
                          value={formData.participant_count}
                          onChange={(e) => updateFormData('participant_count', e.target.value)}
                          placeholder="15"
                        />
                      </div>
                      <div>
                        <Label htmlFor="preferred_dates">Preferred Dates</Label>
                        <Input
                          id="preferred_dates"
                          value={formData.preferred_dates}
                          onChange={(e) => updateFormData('preferred_dates', e.target.value)}
                          placeholder="Q1 2026"
                        />
                      </div>
                    </div>

                    {formData.delivery_mode !== 'virtual' && (
                      <div>
                        <Label htmlFor="location_address">
                          <MapPin className="w-4 h-4 inline mr-1" />
                          Location Address *
                        </Label>
                        <Input
                          id="location_address"
                          required={formData.delivery_mode !== 'virtual'}
                          value={formData.location_address}
                          onChange={(e) => updateFormData('location_address', e.target.value)}
                          placeholder="123 Main St, Calgary, AB"
                        />
                      </div>
                    )}
                  </div>

                  {/* Challenges & Goals */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="specific_challenges">Specific Challenges (Optional)</Label>
                      <Textarea
                        id="specific_challenges"
                        value={formData.specific_challenges}
                        onChange={(e) => updateFormData('specific_challenges', e.target.value)}
                        placeholder="What automation challenges is your organization facing?"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="goals">Goals for Workshop (Optional)</Label>
                      <Textarea
                        id="goals"
                        value={formData.goals}
                        onChange={(e) => updateFormData('goals', e.target.value)}
                        placeholder="What would you like to achieve from this workshop?"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Estimated Price */}
                  {estimatedPrice > 0 && (
                    <div className="bg-primary/10 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Estimated Investment:</span>
                        <span className="text-2xl font-bold text-primary">
                          ${(estimatedPrice / 1000).toFixed(0)}K
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Final pricing will be confirmed after consultation
                      </p>
                    </div>
                  )}

                  <Button type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? 'Submitting...' : 'Request Consultation'}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    By submitting, you agree to our terms and conditions. We'll never share your information.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkshopBookingPage;
