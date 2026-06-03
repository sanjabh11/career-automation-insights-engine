/**
 * SEO Occupation Data - 50 High-Traffic Occupations for Landing Pages
 * Based on bounded programmatic SEO for source-labeled automation-defense estimates
 * 
 * URL Pattern: /automation-risk/{occupation-slug}
 * Title: "{Job} Automation Defense Estimate"
 */

export interface OccupationRiskData {
    title: string;
    code: string;
    overallRisk: number;
    industry: string;
    averageSalary: string;
    jobGrowth: string;
    highRiskTasks: string[];
    safeSkills: string[];
    reskillingSuggestions: string[];
    bridgeRole: string;
    bridgeRoleRisk: number;
    seoDescription: string;
}

export const occupationRiskData: Record<string, OccupationRiskData> = {
    // ============================================================================
    // HIGH RISK (60%+) - 15 occupations
    // ============================================================================
    'data-entry-clerk': {
        title: 'Data Entry Clerk',
        code: '43-9021.00',
        overallRisk: 92,
        industry: 'Administrative',
        averageSalary: '$35,930',
        jobGrowth: '-25%',
        highRiskTasks: [
            'Keyboard data input (95% automatable)',
            'Form processing (90%)',
            'Database updates (88%)',
            'Document scanning (85%)'
        ],
        safeSkills: [
            'Data quality verification',
            'Exception handling',
            'Process improvement'
        ],
        reskillingSuggestions: [
            'Database administration',
            'Business analysis fundamentals',
            'RPA (Robotic Process Automation)',
            'Data analytics certification'
        ],
        bridgeRole: 'Business Analyst',
        bridgeRoleRisk: 35,
        seoDescription: 'Data entry has a high decision-support exposure estimate. Review which skills transfer to analyst roles and where human review remains important.'
    },
    'telemarketer': {
        title: 'Telemarketer',
        code: '41-9041.00',
        overallRisk: 88,
        industry: 'Sales',
        averageSalary: '$29,950',
        jobGrowth: '-18%',
        highRiskTasks: [
            'Cold calling scripts (92% automatable)',
            'Lead qualification (85%)',
            'Appointment scheduling (90%)',
            'Follow-up calls (80%)'
        ],
        safeSkills: [
            'Complex objection handling',
            'Enterprise sales conversations',
            'Relationship building'
        ],
        reskillingSuggestions: [
            'Inside sales specialist training',
            'CRM administration',
            'Sales enablement',
            'Customer success management'
        ],
        bridgeRole: 'Sales Development Rep',
        bridgeRoleRisk: 45,
        seoDescription: 'Telemarketing faces 88% automation risk. Transition strategies and bridge roles for telemarketers in the AI age.'
    },
    'bookkeeper': {
        title: 'Bookkeeper',
        code: '43-3031.00',
        overallRisk: 85,
        industry: 'Finance',
        averageSalary: '$45,860',
        jobGrowth: '-3%',
        highRiskTasks: [
            'Transaction recording (92% automatable)',
            'Bank reconciliation (88%)',
            'Invoice processing (90%)',
            'Payroll data entry (85%)'
        ],
        safeSkills: [
            'Financial analysis interpretation',
            'Client advisory services',
            'Complex compliance issues'
        ],
        reskillingSuggestions: [
            'Management accounting certification',
            'Financial planning and analysis',
            'QuickBooks/Xero administration',
            'Controller career path'
        ],
        bridgeRole: 'Staff Accountant',
        bridgeRoleRisk: 52,
        seoDescription: 'Bookkeeping has a high decision-support exposure estimate. See career bridge options toward accounting and controller responsibilities that require review.'
    },
    'loan-officer': {
        title: 'Loan Officer',
        code: '13-2072.00',
        overallRisk: 78,
        industry: 'Banking',
        averageSalary: '$65,740',
        jobGrowth: '-3%',
        highRiskTasks: [
            'Credit scoring (90% automatable)',
            'Document verification (85%)',
            'Standard loan processing (80%)',
            'Rate comparison (92%)'
        ],
        safeSkills: [
            'Complex commercial lending',
            'Relationship banking',
            'Risk exception handling'
        ],
        reskillingSuggestions: [
            'Commercial lending specialization',
            'Private wealth management',
            'FinTech implementation',
            'Mortgage technology expertise'
        ],
        bridgeRole: 'Commercial Banker',
        bridgeRoleRisk: 32,
        seoDescription: 'AI is transforming lending. See which loan officer tasks remain human and career paths to relationship banking.'
    },
    'paralegal': {
        title: 'Paralegal',
        code: '23-2011.00',
        overallRisk: 72,
        industry: 'Legal',
        averageSalary: '$59,200',
        jobGrowth: '+4%',
        highRiskTasks: [
            'Document review (85% automatable)',
            'Legal research compilation (75%)',
            'Contract clause extraction (80%)',
            'File organization (70%)'
        ],
        safeSkills: [
            'Complex litigation support',
            'Client interaction',
            'Trial preparation'
        ],
        reskillingSuggestions: [
            'Legal technology specialist',
            'E-discovery management',
            'Compliance officer path',
            'Contract management expertise'
        ],
        bridgeRole: 'Legal Operations Manager',
        bridgeRoleRisk: 28,
        seoDescription: 'Paralegals face 72% automation risk in document review. Learn which legal skills remain valuable and how to advance.'
    },
    'fast-food-cook': {
        title: 'Fast Food Cook',
        code: '35-2011.00',
        overallRisk: 81,
        industry: 'Food Service',
        averageSalary: '$27,530',
        jobGrowth: '+6%',
        highRiskTasks: [
            'Order assembly (90% automatable)',
            'Frying and grilling (75%)',
            'Drink preparation (85%)',
            'Inventory counting (80%)'
        ],
        safeSkills: [
            'Quality control and food safety',
            'Customer complaint handling',
            'Kitchen supervision'
        ],
        reskillingSuggestions: [
            'Culinary management certification',
            'Food safety certification',
            'Restaurant supervision',
            'Hospitality management'
        ],
        bridgeRole: 'Kitchen Supervisor',
        bridgeRoleRisk: 35,
        seoDescription: 'Fast food automation is coming. See the career paths from cook to kitchen management and hospitality roles.'
    },
    'cashier': {
        title: 'Cashier',
        code: '41-2011.00',
        overallRisk: 85,
        industry: 'Retail',
        averageSalary: '$29,120',
        jobGrowth: '-10%',
        highRiskTasks: [
            'Payment processing (95% automatable)',
            'Receipt generation (98%)',
            'Price lookups (90%)',
            'Basic customer queries (70%)'
        ],
        safeSkills: [
            'Complex returns handling',
            'Loss prevention judgment',
            'Customer relationship building'
        ],
        reskillingSuggestions: [
            'Retail management training',
            'Customer service specialist',
            'Sales associate advancement',
            'E-commerce fulfillment'
        ],
        bridgeRole: 'Customer Service Lead',
        bridgeRoleRisk: 42,
        seoDescription: 'Self-checkout is replacing cashiers. Discover bridge roles in retail that AI cannot easily automate.'
    },
    'pharmacy-technician': {
        title: 'Pharmacy Technician',
        code: '29-2052.00',
        overallRisk: 68,
        industry: 'Healthcare',
        averageSalary: '$37,790',
        jobGrowth: '+6%',
        highRiskTasks: [
            'Pill counting (90% automatable)',
            'Label generation (95%)',
            'Inventory management (75%)',
            'Insurance verification (70%)'
        ],
        safeSkills: [
            'Patient counseling support',
            'Complex medication issues',
            'Compounding'
        ],
        reskillingSuggestions: [
            'Pharmacy technician certification',
            'Compounding specialization',
            'Pharmacy informatics',
            'Clinical pharmacy technician'
        ],
        bridgeRole: 'Clinical Pharmacy Technician',
        bridgeRoleRisk: 28,
        seoDescription: 'Pharmacy automation is expanding. See which technician roles remain essential and how to specialize.'
    },
    'mail-carrier': {
        title: 'Mail Carrier',
        code: '43-5052.00',
        overallRisk: 70,
        industry: 'Logistics',
        averageSalary: '$53,440',
        jobGrowth: '-8%',
        highRiskTasks: [
            'Route optimization (85% automatable)',
            'Package sorting (90%)',
            'Standard delivery (65%)',
            'Tracking updates (95%)'
        ],
        safeSkills: [
            'Complex delivery scenarios',
            'Customer interaction',
            'Problem resolution'
        ],
        reskillingSuggestions: [
            'Logistics coordination',
            'Last-mile delivery management',
            'Postal operations supervision',
            'Fleet management'
        ],
        bridgeRole: 'Logistics Coordinator',
        bridgeRoleRisk: 38,
        seoDescription: 'Drone and autonomous delivery threaten mail carriers. See bridge roles in logistics management.'
    },
    'insurance-underwriter': {
        title: 'Insurance Underwriter',
        code: '13-2053.00',
        overallRisk: 75,
        industry: 'Insurance',
        averageSalary: '$77,860',
        jobGrowth: '-4%',
        highRiskTasks: [
            'Risk scoring (88% automatable)',
            'Policy processing (85%)',
            'Premium calculation (92%)',
            'Standard claims review (75%)'
        ],
        safeSkills: [
            'Complex risk evaluation',
            'Specialty insurance',
            'Client relationships'
        ],
        reskillingSuggestions: [
            'Specialty lines underwriting',
            'Risk management certification',
            'InsurTech products',
            'Claims investigation'
        ],
        bridgeRole: 'Risk Manager',
        bridgeRoleRisk: 28,
        seoDescription: 'AI is transforming insurance underwriting. Learn which specialty skills protect underwriter careers.'
    },

    // ============================================================================
    // MEDIUM RISK (30-60%) - 20 occupations
    // ============================================================================
    'graphic-designer': {
        title: 'Graphic Designer',
        code: '27-1024.00',
        overallRisk: 35,
        industry: 'Creative & Design',
        averageSalary: '$57,990',
        jobGrowth: '+3%',
        highRiskTasks: [
            'Basic logo generation (72% automatable)',
            'Social media graphic templates (65%)',
            'Banner ad creation (58%)',
            'Image resizing and formatting (85%)'
        ],
        safeSkills: [
            'Brand strategy development',
            'Client relationship management',
            'Creative direction',
            'User experience design thinking'
        ],
        reskillingSuggestions: [
            'Motion graphics and video editing',
            'UX/UI design certification',
            'Brand strategy consulting',
            'AI tool mastery (Midjourney, DALL-E)'
        ],
        bridgeRole: 'UX Designer',
        bridgeRoleRisk: 22,
        seoDescription: 'Detailed automation-defense estimate for graphic designers. Review which design tasks may face AI assistance pressure and which skills support resilience.'
    },
    'accountant': {
        title: 'Accountant',
        code: '13-2011.00',
        overallRisk: 52,
        industry: 'Finance & Accounting',
        averageSalary: '$78,000',
        jobGrowth: '+4%',
        highRiskTasks: [
            'Data entry and bookkeeping (92% automatable)',
            'Bank reconciliation (78%)',
            'Invoice processing (85%)',
            'Standard tax return preparation (70%)'
        ],
        safeSkills: [
            'Strategic tax planning',
            'Complex financial advisory',
            'Audit judgment and investigation',
            'Client relationship management'
        ],
        reskillingSuggestions: [
            'Financial planning certification (CFP)',
            'Data analytics and visualization',
            'Forensic accounting specialization',
            'AI-assisted audit methodologies'
        ],
        bridgeRole: 'Financial Analyst',
        bridgeRoleRisk: 28,
        seoDescription: 'Is your accounting job at risk from AI? See which accounting tasks are most automatable and learn how to transition to higher-value advisory roles.'
    },
    'marketing-manager': {
        title: 'Marketing Manager',
        code: '11-2021.00',
        overallRisk: 38,
        industry: 'Marketing & Advertising',
        averageSalary: '$142,170',
        jobGrowth: '+10%',
        highRiskTasks: [
            'Ad copy generation (78% automatable)',
            'Performance reporting (71%)',
            'A/B testing analysis (68%)',
            'Social media scheduling (80%)'
        ],
        safeSkills: [
            'Brand strategy and positioning',
            'Team leadership and coaching',
            'Stakeholder management',
            'Market research interpretation'
        ],
        reskillingSuggestions: [
            'AI marketing tool expertise',
            'Customer experience strategy',
            'Data-driven decision making',
            'Product marketing specialization'
        ],
        bridgeRole: 'Chief Marketing Officer',
        bridgeRoleRisk: 18,
        seoDescription: 'Marketing managers face moderate AI disruption. Discover which marketing tasks are at risk and how to lead AI-augmented marketing teams.'
    },
    'software-developer': {
        title: 'Software Developer',
        code: '15-1252.00',
        overallRisk: 28,
        industry: 'Technology',
        averageSalary: '$127,260',
        jobGrowth: '+25%',
        highRiskTasks: [
            'Boilerplate code generation (75% automatable)',
            'Basic debugging (55%)',
            'Documentation writing (65%)',
            'Simple unit test creation (60%)'
        ],
        safeSkills: [
            'System architecture design',
            'Complex problem solving',
            'Cross-functional collaboration',
            'Technical leadership'
        ],
        reskillingSuggestions: [
            'AI/ML engineering specialization',
            'System design and architecture',
            'Cloud infrastructure expertise',
            'AI pair programming proficiency'
        ],
        bridgeRole: 'Software Architect',
        bridgeRoleRisk: 15,
        seoDescription: 'Software developers have lower automation risk but face significant workflow changes. Learn how AI coding assistants are reshaping development careers.'
    },
    'financial-analyst': {
        title: 'Financial Analyst',
        code: '13-2051.00',
        overallRisk: 45,
        industry: 'Finance',
        averageSalary: '$95,570',
        jobGrowth: '+9%',
        highRiskTasks: [
            'Data aggregation (85% automatable)',
            'Standard financial modeling (65%)',
            'Report generation (75%)',
            'Ratio calculations (90%)'
        ],
        safeSkills: [
            'Strategic recommendations',
            'Executive presentations',
            'Scenario planning',
            'Stakeholder management'
        ],
        reskillingSuggestions: [
            'Investment banking skills',
            'Private equity modeling',
            'Python for finance',
            'CFA certification'
        ],
        bridgeRole: 'Finance Director',
        bridgeRoleRisk: 22,
        seoDescription: 'Financial analysts face moderate AI risk in modeling tasks. Learn which analytical skills remain essential and career paths to leadership.'
    },
    'human-resources-manager': {
        title: 'Human Resources Manager',
        code: '11-3121.00',
        overallRisk: 42,
        industry: 'Human Resources',
        averageSalary: '$130,000',
        jobGrowth: '+7%',
        highRiskTasks: [
            'Resume screening (88% automatable)',
            'Payroll processing (85%)',
            'Benefits administration (70%)',
            'Standard policy queries (75%)'
        ],
        safeSkills: [
            'Employee relations',
            'Culture development',
            'Complex negotiations',
            'Leadership coaching'
        ],
        reskillingSuggestions: [
            'People analytics',
            'DEIB specialization',
            'HR technology leadership',
            'Organizational development'
        ],
        bridgeRole: 'Chief People Officer',
        bridgeRoleRisk: 18,
        seoDescription: 'HR faces automation in admin tasks but leadership remains human. See the path from HR manager to strategic people leadership.'
    },
    'customer-service-representative': {
        title: 'Customer Service Representative',
        code: '43-4051.00',
        overallRisk: 55,
        industry: 'Customer Service',
        averageSalary: '$37,780',
        jobGrowth: '-5%',
        highRiskTasks: [
            'FAQ responses (90% automatable)',
            'Order status inquiries (88%)',
            'Password resets (95%)',
            'Basic troubleshooting (70%)'
        ],
        safeSkills: [
            'Complex issue resolution',
            'Emotional intelligence',
            'Escalation handling',
            'Customer retention'
        ],
        reskillingSuggestions: [
            'Customer success management',
            'Technical support specialization',
            'Sales development',
            'Training and quality assurance'
        ],
        bridgeRole: 'Customer Success Manager',
        bridgeRoleRisk: 25,
        seoDescription: 'Chatbots are replacing basic customer service. Learn which CS skills remain valuable and paths to customer success.'
    },
    'project-manager': {
        title: 'Project Manager',
        code: '13-1082.00',
        overallRisk: 32,
        industry: 'Management',
        averageSalary: '$95,370',
        jobGrowth: '+7%',
        highRiskTasks: [
            'Status reporting (75% automatable)',
            'Schedule generation (70%)',
            'Resource allocation optimization (65%)',
            'Meeting scheduling (85%)'
        ],
        safeSkills: [
            'Stakeholder management',
            'Risk mitigation strategy',
            'Team motivation',
            'Cross-functional leadership'
        ],
        reskillingSuggestions: [
            'Agile coaching certification',
            'Strategic program management',
            'AI project implementation',
            'Executive leadership'
        ],
        bridgeRole: 'Program Director',
        bridgeRoleRisk: 18,
        seoDescription: 'Project managers face moderate AI risk in reporting. Learn how to evolve from task management to strategic program leadership.'
    },
    'real-estate-agent': {
        title: 'Real Estate Agent',
        code: '41-9022.00',
        overallRisk: 48,
        industry: 'Real Estate',
        averageSalary: '$61,480',
        jobGrowth: '+5%',
        highRiskTasks: [
            'Property matching (75% automatable)',
            'Market analysis reports (70%)',
            'Lead qualification (65%)',
            'Listing descriptions (80%)'
        ],
        safeSkills: [
            'Negotiation and closing',
            'Client relationship building',
            'Local market expertise',
            'Property staging advice'
        ],
        reskillingSuggestions: [
            'Commercial real estate certification',
            'Property investment consulting',
            'Real estate technology specialist',
            'Luxury market specialization'
        ],
        bridgeRole: 'Real Estate Broker',
        bridgeRoleRisk: 32,
        seoDescription: 'PropTech is changing real estate. Learn which agent skills remain valuable and how to specialize in high-value transactions.'
    },
    'technical-writer': {
        title: 'Technical Writer',
        code: '27-3042.00',
        overallRisk: 58,
        industry: 'Technology',
        averageSalary: '$79,960',
        jobGrowth: '+7%',
        highRiskTasks: [
            'API documentation (72% automatable)',
            'Template-based content (75%)',
            'Changelog generation (85%)',
            'Basic tutorials (65%)'
        ],
        safeSkills: [
            'Information architecture',
            'User experience writing',
            'Complex concept simplification',
            'Developer relations'
        ],
        reskillingSuggestions: [
            'UX writing specialization',
            'Developer advocacy',
            'Content strategy',
            'Video documentation'
        ],
        bridgeRole: 'Developer Advocate',
        bridgeRoleRisk: 22,
        seoDescription: 'AI is generating basic documentation. Learn which technical writing skills remain valuable and paths to developer relations.'
    },
    'journalist': {
        title: 'Journalist',
        code: '27-3023.00',
        overallRisk: 48,
        industry: 'Media',
        averageSalary: '$55,960',
        jobGrowth: '-9%',
        highRiskTasks: [
            'Press release rewrites (85% automatable)',
            'Sports/finance summaries (80%)',
            'SEO headline optimization (75%)',
            'Social media posts (70%)'
        ],
        safeSkills: [
            'Investigative reporting',
            'Source relationship building',
            'Complex narrative storytelling',
            'Video journalism'
        ],
        reskillingSuggestions: [
            'Data journalism',
            'Podcast/video production',
            'Newsletter publishing',
            'Investigative specialization'
        ],
        bridgeRole: 'Investigative Reporter',
        bridgeRoleRisk: 22,
        seoDescription: 'AI is writing basic news articles. Learn which journalism skills remain essential and how to differentiate.'
    },
    'web-developer': {
        title: 'Web Developer',
        code: '15-1254.00',
        overallRisk: 42,
        industry: 'Technology',
        averageSalary: '$80,730',
        jobGrowth: '+16%',
        highRiskTasks: [
            'Landing page generation (80% automatable)',
            'Basic CSS styling (70%)',
            'Template customization (75%)',
            'Form creation (85%)'
        ],
        safeSkills: [
            'Full-stack architecture',
            'Performance optimization',
            'Accessibility expertise',
            'Complex integrations'
        ],
        reskillingSuggestions: [
            'React/Next.js specialization',
            'Cloud architecture',
            'DevOps and deployment',
            'Web security'
        ],
        bridgeRole: 'Full-Stack Engineer',
        bridgeRoleRisk: 28,
        seoDescription: 'No-code tools are replacing basic websites. Learn which web development skills remain valuable and paths to full-stack.'
    },
    'sales-representative': {
        title: 'Sales Representative',
        code: '41-4012.00',
        overallRisk: 38,
        industry: 'Sales',
        averageSalary: '$65,630',
        jobGrowth: '+5%',
        highRiskTasks: [
            'Lead qualification (70% automatable)',
            'Email outreach (65%)',
            'CRM data entry (90%)',
            'Proposal generation (60%)'
        ],
        safeSkills: [
            'Complex deal negotiation',
            'Executive relationships',
            'Solution selling',
            'Account management'
        ],
        reskillingSuggestions: [
            'Enterprise sales certification',
            'Solution engineering',
            'Sales leadership',
            'Revenue operations'
        ],
        bridgeRole: 'Account Executive',
        bridgeRoleRisk: 28,
        seoDescription: 'Sales automation is changing prospecting. Learn which sales skills remain valuable and paths to enterprise selling.'
    },
    'teacher': {
        title: 'Teacher (K-12)',
        code: '25-2021.00',
        overallRisk: 22,
        industry: 'Education',
        averageSalary: '$60,660',
        jobGrowth: '+4%',
        highRiskTasks: [
            'Grading multiple choice (90% automatable)',
            'Lesson plan templates (55%)',
            'Progress reporting (60%)',
            'Administrative paperwork (75%)'
        ],
        safeSkills: [
            'Student engagement and motivation',
            'Classroom management',
            'Individualized instruction',
            'Parent relationships'
        ],
        reskillingSuggestions: [
            'EdTech integration specialist',
            'Special education certification',
            'Curriculum development',
            'Instructional coaching'
        ],
        bridgeRole: 'Instructional Coach',
        bridgeRoleRisk: 15,
        seoDescription: 'Teaching remains highly human despite EdTech. Learn how teachers can leverage AI for better student outcomes.'
    },
    'lawyer': {
        title: 'Lawyer',
        code: '23-1011.00',
        overallRisk: 35,
        industry: 'Legal',
        averageSalary: '$145,760',
        jobGrowth: '+8%',
        highRiskTasks: [
            'Document review (75% automatable)',
            'Case law research (70%)',
            'Contract drafting templates (65%)',
            'Due diligence checklists (72%)'
        ],
        safeSkills: [
            'Courtroom advocacy',
            'Complex negotiation',
            'Client counseling',
            'Strategic judgment'
        ],
        reskillingSuggestions: [
            'Legal tech leadership',
            'Alternative dispute resolution',
            'Specialty practice areas',
            'Business development'
        ],
        bridgeRole: 'General Counsel',
        bridgeRoleRisk: 18,
        seoDescription: 'LegalTech is automating research and review. Learn which legal skills remain essential and paths to leadership.'
    },

    // ============================================================================
    // LOW RISK (<30%) - 15 occupations
    // ============================================================================
    'nurse': {
        title: 'Registered Nurse',
        code: '29-1141.00',
        overallRisk: 12,
        industry: 'Healthcare',
        averageSalary: '$81,220',
        jobGrowth: '+6%',
        highRiskTasks: [
            'Administrative documentation (45% automatable)',
            'Vital sign data entry (60%)',
            'Scheduling and logistics (55%)'
        ],
        safeSkills: [
            'Patient care and empathy',
            'Clinical judgment and assessment',
            'Emergency response',
            'Patient education and advocacy'
        ],
        reskillingSuggestions: [
            'Telehealth technology proficiency',
            'AI-assisted diagnostics familiarity',
            'Specialized certifications (ICU, OR)',
            'Healthcare informatics'
        ],
        bridgeRole: 'Nurse Practitioner',
        bridgeRoleRisk: 8,
        seoDescription: 'Nursing remains one of the most AI-resistant careers. But some admin tasks are changing. See how nurses can leverage AI to improve patient care.'
    },
    'physical-therapist': {
        title: 'Physical Therapist',
        code: '29-1123.00',
        overallRisk: 15,
        industry: 'Healthcare',
        averageSalary: '$97,720',
        jobGrowth: '+17%',
        highRiskTasks: [
            'Exercise video generation (60% automatable)',
            'Progress documentation (45%)',
            'Scheduling optimization (70%)'
        ],
        safeSkills: [
            'Hands-on treatment',
            'Patient motivation',
            'Complex assessment',
            'Treatment plan adaptation'
        ],
        reskillingSuggestions: [
            'Sports medicine specialization',
            'Telehealth PT delivery',
            'Specialized certifications (orthopedic, neuro)',
            'Clinic management'
        ],
        bridgeRole: 'PT Clinical Director',
        bridgeRoleRisk: 10,
        seoDescription: 'Physical therapy is highly AI-resistant due to hands-on nature. Learn how PTs can leverage technology for better outcomes.'
    },
    'electrician': {
        title: 'Electrician',
        code: '47-2111.00',
        overallRisk: 18,
        industry: 'Construction',
        averageSalary: '$60,240',
        jobGrowth: '+9%',
        highRiskTasks: [
            'Schematic reading (35% automatable)',
            'Permit documentation (50%)',
            'Material estimation (45%)'
        ],
        safeSkills: [
            'Complex troubleshooting',
            'Physical installation',
            'Code compliance judgment',
            'Safety assessment'
        ],
        reskillingSuggestions: [
            'Solar installation certification',
            'EV charging infrastructure',
            'Smart home systems',
            'Master electrician license'
        ],
        bridgeRole: 'Electrical Contractor',
        bridgeRoleRisk: 12,
        seoDescription: 'Electricians face low automation risk due to physical work. Learn how to specialize in high-demand renewable energy systems.'
    },
    'plumber': {
        title: 'Plumber',
        code: '47-2152.00',
        overallRisk: 15,
        industry: 'Construction',
        averageSalary: '$59,880',
        jobGrowth: '+5%',
        highRiskTasks: [
            'Bid estimation (45% automatable)',
            'Permit paperwork (50%)',
            'Inventory tracking (60%)'
        ],
        safeSkills: [
            'Complex installation',
            'Emergency repairs',
            'Problem diagnosis',
            'Building code expertise'
        ],
        reskillingSuggestions: [
            'Master plumber certification',
            'Commercial plumbing',
            'Green building systems',
            'Business ownership'
        ],
        bridgeRole: 'Plumbing Contractor',
        bridgeRoleRisk: 10,
        seoDescription: 'Plumbing is highly AI-resistant. See how plumbers can expand into commercial and green building specializations.'
    },
    'chef': {
        title: 'Head Chef',
        code: '35-1011.00',
        overallRisk: 22,
        industry: 'Hospitality',
        averageSalary: '$56,520',
        jobGrowth: '+11%',
        highRiskTasks: [
            'Recipe scaling (65% automatable)',
            'Inventory ordering (70%)',
            'Nutritional calculations (75%)'
        ],
        safeSkills: [
            'Creative menu development',
            'Kitchen leadership',
            'Quality control',
            'Guest experience'
        ],
        reskillingSuggestions: [
            'Executive chef certification',
            'Restaurant management',
            'Personal chef business',
            'Culinary media'
        ],
        bridgeRole: 'Executive Chef',
        bridgeRoleRisk: 15,
        seoDescription: 'Culinary creativity remains highly human. Learn how chefs can leverage technology while maintaining the art of cooking.'
    },
    'psychologist': {
        title: 'Psychologist',
        code: '19-3031.00',
        overallRisk: 12,
        industry: 'Healthcare',
        averageSalary: '$85,330',
        jobGrowth: '+6%',
        highRiskTasks: [
            'Assessment scoring (70% automatable)',
            'Session scheduling (80%)',
            'Progress note templates (45%)'
        ],
        safeSkills: [
            'Therapeutic relationship',
            'Complex diagnosis',
            'Crisis intervention',
            'Treatment adaptation'
        ],
        reskillingSuggestions: [
            'Teletherapy expertise',
            'Specialty certifications',
            'Clinical supervision',
            'Private practice development'
        ],
        bridgeRole: 'Clinical Director',
        bridgeRoleRisk: 8,
        seoDescription: 'Psychology is highly AI-resistant due to human connection needs. Learn how psychologists can leverage AI for better patient outcomes.'
    },
    'dentist': {
        title: 'Dentist',
        code: '29-1021.00',
        overallRisk: 18,
        industry: 'Healthcare',
        averageSalary: '$163,220',
        jobGrowth: '+4%',
        highRiskTasks: [
            'X-ray analysis assistance (55% automatable)',
            'Scheduling optimization (75%)',
            'Insurance processing (70%)'
        ],
        safeSkills: [
            'Complex procedures',
            'Patient rapport',
            'Diagnosis judgment',
            'Surgical skill'
        ],
        reskillingSuggestions: [
            'Specialty certifications (orthodontics, implants)',
            'Dental technology integration',
            'Practice management',
            'Cosmetic dentistry'
        ],
        bridgeRole: 'Dental Specialist',
        bridgeRoleRisk: 12,
        seoDescription: 'Dentistry remains highly AI-resistant. Learn how dentists can leverage AI diagnostics while maintaining patient relationships.'
    },
    'social-worker': {
        title: 'Social Worker',
        code: '21-1022.00',
        overallRisk: 15,
        industry: 'Social Services',
        averageSalary: '$55,350',
        jobGrowth: '+9%',
        highRiskTasks: [
            'Documentation and forms (55% automatable)',
            'Resource database searches (65%)',
            'Appointment scheduling (75%)'
        ],
        safeSkills: [
            'Client relationships',
            'Crisis intervention',
            'Advocacy',
            'Community coordination'
        ],
        reskillingSuggestions: [
            'Clinical social work licensure',
            'Specialty certifications (substance abuse, trauma)',
            'Supervision and management',
            'Policy advocacy'
        ],
        bridgeRole: 'Clinical Social Work Director',
        bridgeRoleRisk: 10,
        seoDescription: 'Social work requires human empathy and judgment. Learn how social workers can leverage technology for better client outcomes.'
    },
    'mechanical-engineer': {
        title: 'Mechanical Engineer',
        code: '17-2141.00',
        overallRisk: 25,
        industry: 'Engineering',
        averageSalary: '$96,310',
        jobGrowth: '+10%',
        highRiskTasks: [
            'CAD drafting basics (65% automatable)',
            'Simulation setup (55%)',
            'Documentation (60%)'
        ],
        safeSkills: [
            'Complex problem solving',
            'System integration',
            'Innovation and design',
            'Project leadership'
        ],
        reskillingSuggestions: [
            'AI/ML for engineering',
            'Sustainability engineering',
            'Systems engineering',
            'Technical management'
        ],
        bridgeRole: 'Engineering Director',
        bridgeRoleRisk: 15,
        seoDescription: 'Engineering faces moderate AI assistance in design. Learn which engineering skills remain essential and paths to leadership.'
    },
    'data-scientist': {
        title: 'Data Scientist',
        code: '15-2051.00',
        overallRisk: 28,
        industry: 'Technology',
        averageSalary: '$103,500',
        jobGrowth: '+35%',
        highRiskTasks: [
            'Feature engineering (50% automatable)',
            'Model hyperparameter tuning (55%)',
            'Basic EDA (60%)',
            'Report generation (65%)'
        ],
        safeSkills: [
            'Business problem framing',
            'Complex model selection',
            'Stakeholder communication',
            'Strategic insights'
        ],
        reskillingSuggestions: [
            'ML engineering',
            'AI strategy consulting',
            'MLOps and deployment',
            'Domain specialization'
        ],
        bridgeRole: 'Head of Data Science',
        bridgeRoleRisk: 18,
        seoDescription: 'Data science faces AutoML disruption in basic tasks. Learn which DS skills remain valuable and paths to leadership.'
    }
};

// Export list of all occupation slugs for routing
export const occupationSlugs = Object.keys(occupationRiskData);

// Get occupations by risk level
export const getHighRiskOccupations = () =>
    Object.entries(occupationRiskData)
        .filter(([_, data]) => data.overallRisk >= 60)
        .map(([slug, data]) => ({ slug, ...data }));

export const getMediumRiskOccupations = () =>
    Object.entries(occupationRiskData)
        .filter(([_, data]) => data.overallRisk >= 30 && data.overallRisk < 60)
        .map(([slug, data]) => ({ slug, ...data }));

export const getLowRiskOccupations = () =>
    Object.entries(occupationRiskData)
        .filter(([_, data]) => data.overallRisk < 30)
        .map(([slug, data]) => ({ slug, ...data }));
