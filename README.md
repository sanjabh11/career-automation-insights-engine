# 🚀 APO Dashboard - AI-Powered Career Automation Analysis

![APO Dashboard](https://img.shields.io/badge/Status-Production%20Ready-green)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green)
![Tailwind](https://img.shields.io/badge/Tailwind%20CSS-3.0-blue)

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [API Integrations](#api-integrations)
- [Deployment](#deployment)
- [Development](#development)
- [Contributing](#contributing)

## 🎯 Overview

**APO Dashboard** (Automation Potential Overview) is a cutting-edge web application that leverages AI to analyze career automation potential. Built with React, TypeScript, and Supabase, it provides professionals, researchers, and career counselors with data-driven insights about how AI and automation might impact different occupations.

### 🔑 Key Value Propositions
- **AI-Powered Analysis**: Advanced automation scoring using Google's Gemini AI
- **Real-time Data**: Live integration with O*NET occupation database
- **Comprehensive Insights**: Multi-dimensional analysis across skills, tasks, and abilities
- **Professional Reports**: Export-ready CSV and PDF documentation
- **Collaborative Features**: Share analyses with teams and clients

## ✨ Features

### 🔍 **Core Analysis Engine**
- **Intelligent Career Search**: Real-time search through 1000+ O*NET occupations
- **Multi-Factor APO Scoring**: Analysis across:
  - Work Tasks & Activities
  - Required Knowledge Areas
  - Essential Skills & Abilities
  - Technology Requirements
- **Confidence Metrics**: AI-generated reliability scores
- **Timeline Forecasting**: Automation timeline predictions (2-15+ years)
- **Risk Classification**: Color-coded automation risk levels

### 📊 **Advanced Visualizations**
- **Interactive Charts**: Dynamic data visualization with Recharts
- **Category Breakdowns**: Detailed skill/knowledge analysis
- **Comparison Tools**: Side-by-side occupation comparisons
- **Trend Analysis**: Historical and projected automation trends

### 👤 **User Management & Personalization**
- **Secure Authentication**: Supabase Auth with email/password
- **Personal Dashboard**: Comprehensive user management interface
- **Profile Management**: Customizable user profiles and preferences
- **Usage Analytics**: Personal usage statistics and insights

### 💾 **Data Management**
- **Persistent Storage**: User-specific data with Row Level Security
- **Smart Caching**: Optimized API response caching
- **Export Capabilities**: 
  - **CSV Export**: Excel/Google Sheets compatible
  - **PDF Reports**: Professional formatted documentation
- **Collection Management**: Save, organize, and tag analyses

### 🤝 **Collaboration & Sharing**
- **Share by Link**: Generate shareable URLs for analyses
- **Email Sharing**: Direct email sharing with access controls
- **Token-based Access**: Secure sharing with expiration controls
- **View Tracking**: Monitor share engagement and access

### 🔔 **Communication System**
- **Real-time Notifications**: Instant system and analysis updates
- **User Feedback System**: Bug reports, feature requests, and support
- **Notification Preferences**: Customizable alert settings
- **Analytics Tracking**: User engagement and system metrics

### 🎯 **Job Market Intelligence**
- **Live Job Data**: Integration with SerpAPI for current postings
- **Market Analysis**: Salary ranges and demand metrics
- **Geographic Distribution**: Location-based opportunity mapping

### 🤖 **AI Impact Career Planner**
- **Task Automation Assessment**: Analyze which tasks might be automated, augmented, or remain human-only
- **Personalized Task Analysis**: Input your specific tasks to get automation potential assessment
- **Skill Recommendations**: Get personalized skill development recommendations to stay relevant
- **Learning Resources**: Access curated resources for upskilling
- **Progress Tracking**: Track your skill development progress

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **Supabase Account** (free tier available)
- **API Keys** for external services

### 1. Clone & Install
```bash
git clone <repository-url>
cd apo-dashboard
npm install
```

### 2. Environment Setup
Create `.env.local` with your configuration:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Supabase Configuration
Configure these secrets in your Supabase dashboard:
- `ONET_API_KEY`: O*NET Web Services API key
- `GEMINI_API_KEY`: Google AI/Gemini API key  
- `SERPAPI_KEY`: SerpAPI key for job market data

### 4. Database Setup
The application includes comprehensive SQL migrations in `supabase/migrations/`. Key tables:
- User management and authentication
- Analysis storage and caching
- Notification and feedback systems
- Analytics and engagement tracking
- AI task assessments and skill recommendations

### 5. Start Development
```bash
npm run dev
```
Open `http://localhost:5173` to access the application.

## 🏗️ Architecture

### Frontend Stack
- **React 18**: Modern component-based UI framework
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: High-quality component library
- **TanStack Query**: Server state management
- **React Router**: Client-side routing
- **Recharts**: Data visualization

### Backend Infrastructure
- **Supabase**: 
  - PostgreSQL database with Row Level Security
  - Authentication and user management
  - Edge Functions for serverless API integration
  - Real-time subscriptions
- **External APIs**:
  - O*NET Web Services for occupation data
  - Google Gemini AI for automation analysis
  - SerpAPI for job market insights

### Security Features
- **Input Sanitization**: XSS and injection protection
- **Row Level Security**: Database-level access controls
- **API Rate Limiting**: Prevents abuse and ensures fair usage
- **Secure Headers**: Comprehensive security middleware
- **Data Encryption**: HTTPS everywhere with encrypted storage

## 🗄️ Database Schema

### Core Tables

#### **Profiles**
```sql
profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  api_credits INTEGER DEFAULT 10,
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

#### **Saved Analyses**
```sql
saved_analyses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  occupation_code TEXT NOT NULL,
  occupation_title TEXT NOT NULL,
  analysis_data JSONB NOT NULL,
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

#### **AI Task Assessments**
```sql
ai_task_assessments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  occupation_code TEXT NOT NULL,
  occupation_title TEXT NOT NULL,
  task_description TEXT NOT NULL,
  category TEXT CHECK (category IN ('Automate', 'Augment', 'Human-only')),
  explanation TEXT,
  confidence NUMERIC(3,2),
  created_at TIMESTAMP
)
```

#### **AI Skill Recommendations**
```sql
ai_skill_recommendations (
  id UUID PRIMARY KEY,
  occupation_code TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  explanation TEXT NOT NULL,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP
)
```

#### **AI Reskilling Resources**
```sql
ai_reskilling_resources (
  id UUID PRIMARY KEY,
  skill_area TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  provider TEXT NOT NULL,
  description TEXT,
  cost_type TEXT CHECK (cost_type IN ('Free', 'Paid', 'Freemium')),
  created_at TIMESTAMP
)
```

### Supporting Tables
- **search_history**: User search tracking
- **notification_preferences**: User notification settings
- **user_engagement_metrics**: Daily engagement analytics
- **apo_analysis_cache**: Performance optimization cache

### Row Level Security (RLS)
All user data tables implement RLS policies ensuring:
- Users can only access their own data
- Secure sharing through controlled access patterns
- Admin functions for system management
- Public read access for shared content only

## 🔌 API Integrations

### O*NET Web Services
- **Purpose**: Official occupation data and classifications
- **Usage**: Career search and baseline occupation information
- **Rate Limits**: Managed through caching and optimization

### Google Gemini AI
- **Purpose**: Advanced automation potential analysis
- **Features**: 
  - Natural language processing of occupation data
  - Multi-factor automation scoring
  - Confidence level generation
  - Timeline estimation
  - Task assessment and categorization
  - Skill recommendations

### SerpAPI
- **Purpose**: Real-time job market data
- **Features**:
  - Current job postings and trends
  - Salary information and geographic distribution
  - Market demand indicators
  - Learning resources for skill development

## 🚀 Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] Supabase secrets added
- [ ] Database migrations applied
- [ ] SSL certificates verified
- [ ] Performance monitoring enabled

### Recommended Hosting
- **Frontend**: Vercel, Netlify, or similar
- **Backend**: Supabase (managed)
- **Domain**: Custom domain with SSL

### Environment Variables
```env
# Production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key

# Supabase Secrets (Dashboard)
ONET_API_KEY=your_onet_api_key
GEMINI_API_KEY=your_google_ai_key
SERPAPI_KEY=your_serpapi_key
```

## 🛠️ Development

### File Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── APODashboard.tsx # Main dashboard
│   ├── AIImpactDashboard.tsx # AI Impact Career Planner
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useSession.ts   # Authentication
│   ├── useUserFeedback.ts # Feedback system
│   └── ...
├── pages/              # Route components
├── utils/              # Utility functions
└── integrations/       # External service clients
    └── supabase/       # Supabase configuration
```

### Key Development Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run type-check   # TypeScript validation
```

### Code Quality
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality enforcement
- **Prettier**: Consistent code formatting
- **Component Documentation**: Comprehensive inline docs

### Testing Strategy
- **Unit Tests**: Critical utility functions
- **Integration Tests**: API endpoints and database operations
- **E2E Tests**: Core user workflows
- **Performance Tests**: Load testing for scalability

## 🎯 Use Cases

### **Career Counselors**
- Generate professional automation risk assessments
- Create comprehensive career guidance reports
- Compare multiple career paths for clients
- Track client consultation history

### **HR Professionals & Workforce Planners**
- Assess organizational automation impact
- Plan strategic reskilling initiatives
- Make data-driven hiring decisions
- Develop future-ready workforce strategies

### **Job Seekers & Career Changers**
- Understand long-term career viability
- Identify automation-resistant skills to develop
- Make informed career transition decisions
- Plan professional development investments

### **Researchers & Analysts**
- Study automation trends across industries
- Generate reports on labor market evolution
- Compare automation potential across occupations
- Access historical trend data

### **Educational Institutions**
- Guide curriculum development for future relevance
- Help students choose sustainable career paths
- Research workforce development needs
- Plan educational program investments

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Submit pull request with detailed description
5. Code review and merge

### Contribution Guidelines
- Follow TypeScript best practices
- Maintain test coverage above 80%
- Document all new features
- Follow conventional commit messages
- Ensure responsive design compliance

### Issue Reporting
- Use provided issue templates
- Include reproduction steps
- Provide browser/environment details
- Tag with appropriate labels

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

### Documentation
- **User Guide**: Comprehensive usage documentation
- **API Documentation**: Developer integration guides
- **Video Tutorials**: Step-by-step walkthroughs

### Community Support
- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: Community Q&A and best practices
- **Discord**: Real-time community support

### Professional Support
- **Email**: support@apodashboard.com
- **Enterprise**: Custom implementations and integrations
- **Training**: Team onboarding and best practices

---

**🌟 APO Dashboard - Empowering informed career decisions in the age of AI**

*Built with ❤️ for the future of work*

---

## 🗺️ Roadmap

### Version 2.0 (Current)
- **AI Impact Career Planner**: Task automation assessment and skill recommendations
- **Industry Analysis**: Sector-wide automation trends
- **Skills Gap Analysis**: Personalized skill development recommendations
- **Collaborative Workspaces**: Team-based analysis and sharing
- **Mobile App**: Native iOS and Android applications

### Version 3.0 (Future)
- **API Access**: Developer API for third-party integrations
- **Advanced AI Models**: Enhanced prediction accuracy
- **Real-time Collaboration**: Live document editing and sharing
- **Enterprise Features**: White-label solutions and custom integrations

---

*Last updated: December 2024*
*Documentation Version: 2.0*