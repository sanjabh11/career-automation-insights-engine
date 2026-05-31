
# APO Dashboard - Production Deployment Guide

This guide covers the complete infrastructure setup, CI/CD pipeline, monitoring, and deployment process for the APO Dashboard application.

## 🏗️ Infrastructure Architecture

### Overview
The APO Dashboard is designed as a modern serverless application with the following architecture:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Supabase       │    │   External APIs │
│   (React/Vite)  │◄──►│   Backend        │◄──►│   (O*NET, AI)   │
│                 │    │                  │    │                 │
│   - Static Site │    │   - PostgreSQL   │    │   - Google AI   │
│   - CDN Hosted  │    │   - Auth         │    │   - SerpAPI     │
│   - Auto-scale  │    │   - Edge Funcs   │    │   - O*NET API   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Production Hosting Options

### Option 1: Vercel (Recommended)
**Best for**: Automatic deployments, global CDN, serverless scaling

#### Setup Steps:
1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login and deploy
   vercel login
   vercel --prod
   ```

2. **Environment Variables**
   Configure in Vercel dashboard or via CLI:
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```

3. **Build Configuration**
   Create `vercel.json`:
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

### Option 2: Netlify
**Best for**: Branch previews, form handling, edge functions

#### Setup Steps:
1. **Connect Repository** via Netlify dashboard
2. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. **Environment Variables**: Add in Netlify dashboard
4. **Redirects**: Create `_redirects` file:
   ```
   /*    /index.html   200
   ```

### Option 3: AWS S3 + CloudFront
**Best for**: Enterprise-grade hosting, custom configurations

#### Setup Steps:
1. **S3 Bucket Configuration**
   ```bash
   # Create bucket
   aws s3 mb s3://apo-dashboard-prod
   
   # Configure static website
   aws s3 website s3://apo-dashboard-prod --index-document index.html
   ```

2. **CloudFront Distribution**
   ```json
   {
     "Origins": [{
       "DomainName": "apo-dashboard-prod.s3.amazonaws.com",
       "Id": "S3-apo-dashboard-prod",
       "S3OriginConfig": {
         "OriginAccessIdentity": ""
       }
     }],
     "DefaultCacheBehavior": {
       "TargetOriginId": "S3-apo-dashboard-prod",
       "ViewerProtocolPolicy": "redirect-to-https"
     }
   }
   ```

## 🔧 Backend Infrastructure (Supabase)

### Production Setup

1. **Create Production Project**
   ```bash
   # Create new Supabase project
   supabase projects create apo-dashboard-prod --region us-east-1
   ```

2. **Configure Custom Domain**
   - Go to Project Settings > Custom Domains
   - Add your domain (e.g., api.apo-dashboard.com)
   - Configure DNS CNAME records

3. **Set Up Database**
   ```bash
   # Apply migrations
   supabase db push --project-ref your-project-ref
   
   # Seed data if needed
   supabase db seed --project-ref your-project-ref
   ```

4. **Configure API Keys**
   Set these secrets in Supabase Dashboard:
   ```
   ONET_API_KEY=your_onet_api_key
   GOOGLE_AI_API_KEY=your_google_ai_key
   SERPAPI_KEY=your_serpapi_key
   ```

### Database Scaling

1. **Connection Pooling**
   - Enable in Supabase Settings > Database
   - Configure pool size based on expected load

2. **Read Replicas** (Enterprise)
   ```sql
   -- Configure read replicas for heavy analytics queries
   SELECT * FROM pg_stat_activity;
   ```

3. **Performance Monitoring**
   ```sql
   -- Monitor slow queries
   SELECT query, mean_exec_time, calls
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC;
   ```

## 🔄 CI/CD Pipeline

### GitHub Actions Setup

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy APO Dashboard

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint
        run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: staging
    steps:
      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/
      
      - name: Deploy to Staging
        run: |
          # Deploy to staging environment
          # This could be Vercel, Netlify, or custom deployment

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/
      
      - name: Deploy to Production
        run: |
          # Deploy to production environment
          # Include health checks and rollback procedures

  database-migrations:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest
      
      - name: Run database migrations
        run: |
          supabase db push --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

### Environment Management

1. **Staging Environment**
   ```bash
   # Create staging branch deployment
   git checkout -b staging
   # Configure staging-specific environment variables
   ```

2. **Production Environment**
   ```bash
   # Production deployment with health checks
   npm run build:prod
   npm run health-check
   ```

### Rollback Strategy

```yaml
rollback:
  runs-on: ubuntu-latest
  when: manual
  steps:
    - name: Rollback to previous version
      run: |
        # Implement rollback logic
        vercel rollback --token ${{ secrets.VERCEL_TOKEN }}
```

## 📊 Monitoring & Analytics

### Application Performance Monitoring

1. **Sentry Integration**
   ```bash
   npm install @sentry/react @sentry/tracing
   ```
   
   Configure in `src/main.tsx`:
   ```typescript
   import * as Sentry from "@sentry/react";
   
   Sentry.init({
     dsn: "your-sentry-dsn",
     environment: process.env.NODE_ENV,
     tracesSampleRate: 1.0,
   });
   ```

2. **Web Vitals Tracking**
   ```typescript
   import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
   
   function sendToAnalytics(metric) {
     // Send to your analytics service
     gtag('event', metric.name, {
       value: Math.round(metric.value),
       event_category: 'Web Vitals',
     });
   }
   
   getCLS(sendToAnalytics);
   getFID(sendToAnalytics);
   getFCP(sendToAnalytics);
   getLCP(sendToAnalytics);
   getTTFB(sendToAnalytics);
   ```

### Database Monitoring

1. **Supabase Dashboard**
   - Monitor API usage and response times
   - Track database performance metrics
   - Set up alerts for high error rates

2. **Custom Monitoring**
   ```sql
   -- Create monitoring views
   CREATE VIEW api_performance AS
   SELECT
     path,
     method,
     AVG(response_time) as avg_response_time,
     COUNT(*) as request_count,
     DATE_TRUNC('hour', created_at) as hour
   FROM edge_logs
   GROUP BY path, method, hour;
   ```

### User Analytics

1. **Google Analytics 4**
   ```typescript
   // Configure GA4 tracking
   gtag('config', 'GA_MEASUREMENT_ID', {
     page_title: 'APO Dashboard',
     page_location: window.location.href,
   });
   
   // Track custom events
   gtag('event', 'apo_analysis', {
     event_category: 'engagement',
     occupation_code: occupationCode,
   });
   ```

2. **Custom Analytics Dashboard**
   ```sql
   -- Track user engagement
   CREATE TABLE analytics_events (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users,
     event_type TEXT NOT NULL,
     event_data JSONB,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

## 🔐 Security Hardening

### SSL/TLS Configuration

1. **SSL Certificate Setup**
   ```bash
   # For custom domains, use Let's Encrypt
   certbot --nginx -d apo-dashboard.com
   ```

2. **Security Headers**
   Configure in hosting platform:
   ```
   X-Frame-Options: DENY
   X-Content-Type-Options: nosniff
   X-XSS-Protection: 1; mode=block
   Strict-Transport-Security: max-age=31536000; includeSubDomains
   Content-Security-Policy: default-src 'self' https://api.apo-dashboard.com
   ```

### API Security

1. **Rate Limiting**
   ```typescript
   // Implement in Supabase Edge Functions
   const rateLimit = new Map();
   
   export default async function handler(req: Request) {
     const clientIP = req.headers.get('x-forwarded-for');
     const now = Date.now();
     const windowMs = 15 * 60 * 1000; // 15 minutes
     const maxRequests = 100;
     
     // Implement rate limiting logic
   }
   ```

2. **Input Validation**
   ```typescript
   // Validate all inputs using Zod schemas
   import { z } from 'zod';
   
   const searchSchema = z.object({
     term: z.string().min(1).max(500),
     filters: z.object({
       code: z.string().regex(/^[\d\-\.]+$/).optional()
     }).optional()
   });
   ```

## 🚨 Health Checks & Monitoring

### Application Health Checks

1. **Health Check Endpoint**
   ```typescript
   // Create health check API
   export default async function health(req: Request) {
     const checks = {
       database: await checkDatabase(),
       apis: await checkExternalAPIs(),
       timestamp: new Date().toISOString()
     };
     
     return new Response(JSON.stringify(checks), {
       status: checks.database && checks.apis ? 200 : 503
     });
   }
   ```

2. **Uptime Monitoring**
   ```yaml
   # Use GitHub Actions for uptime monitoring
   name: Uptime Check
   on:
     schedule:
       - cron: '*/5 * * * *'  # Every 5 minutes
   
   jobs:
     uptime:
       runs-on: ubuntu-latest
       steps:
         - name: Check website
           run: |
             curl -f https://apo-dashboard.com/health || exit 1
   ```

### Alerting

1. **Slack Integration**
   ```bash
   # Set up Slack webhooks for critical alerts
   curl -X POST -H 'Content-type: application/json' \
     --data '{"text":"APO Dashboard - Critical Error Detected"}' \
     ${{ secrets.SLACK_WEBHOOK_URL }}
   ```

2. **Email Alerts**
   ```typescript
   // Configure email alerts for downtime
   const alertConfig = {
     smtp: {
       host: 'smtp.gmail.com',
       port: 587,
       secure: false,
       auth: {
         user: process.env.ALERT_EMAIL,
         pass: process.env.ALERT_PASSWORD
       }
     }
   };
   ```

## 🔄 Backup & Recovery

### Database Backup

1. **Automated Backups**
   ```bash
   # Supabase provides automated backups
   # Configure additional backup schedule if needed
   supabase db dump --project-ref your-ref > backup.sql
   ```

2. **Point-in-Time Recovery**
   ```sql
   -- Enable point-in-time recovery
   SELECT pg_start_backup('apo-dashboard-backup');
   ```

### Disaster Recovery

1. **Multi-Region Setup**
   ```bash
   # Configure read replicas in different regions
   # Implement failover procedures
   ```

2. **Recovery Procedures**
   ```bash
   #!/bin/bash
   # disaster-recovery.sh
   
   # 1. Assess the situation
   # 2. Switch to backup systems
   # 3. Restore from latest backup
   # 4. Verify system integrity
   # 5. Update DNS if needed
   ```

## 📈 Performance Optimization

### Frontend Optimization

1. **Bundle Analysis**
   ```bash
   npm run build:analyze
   npx webpack-bundle-analyzer dist/static/js/*.js
   ```

2. **Code Splitting**
   ```typescript
   // Implement route-based code splitting
   const UserDashboard = lazy(() => import('./pages/UserDashboard'));
   const SearchInterface = lazy(() => import('./components/SearchInterface'));
   ```

3. **CDN Configuration**
   ```javascript
   // Configure CDN caching headers
   const cacheConfig = {
     static: 'max-age=31536000, immutable',
     html: 'max-age=300, s-maxage=300',
     api: 'max-age=60, s-maxage=60'
   };
   ```

### Database Optimization

1. **Query Optimization**
   ```sql
   -- Add appropriate indexes
   CREATE INDEX CONCURRENTLY idx_search_history_user_term 
   ON search_history(user_id, search_term);
   
   -- Analyze query performance
   EXPLAIN ANALYZE SELECT * FROM saved_analyses 
   WHERE user_id = $1 ORDER BY created_at DESC;
   ```

2. **Connection Pooling**
   ```javascript
   // Configure connection pooling
   const poolConfig = {
     max: 20,
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 2000,
   };
   ```

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] Run full test suite
- [ ] Perform security audit
- [ ] Check environment variables
- [ ] Verify API key quotas
- [ ] Review database migrations
- [ ] Test backup procedures
- [ ] Configure monitoring
- [ ] Set up alerting

### Deployment Steps

- [ ] Deploy to staging
- [ ] Run integration tests
- [ ] Perform UAT
- [ ] Deploy to production
- [ ] Run health checks
- [ ] Monitor for 24 hours
- [ ] Update documentation

### Post-Deployment

- [ ] Verify all features working
- [ ] Check analytics data
- [ ] Monitor error rates
- [ ] Review performance metrics
- [ ] Update team on status
- [ ] Schedule post-mortem if issues

## 📞 Support & Maintenance

### Maintenance Schedule

- **Daily**: Monitor health checks and error rates
- **Weekly**: Review performance metrics and usage analytics
- **Monthly**: Security updates and dependency upgrades
- **Quarterly**: Comprehensive security audit and disaster recovery testing

### Emergency Contacts

- **Technical Lead**: [Your contact info]
- **DevOps Engineer**: [Contact info]
- **Product Owner**: [Contact info]
- **Escalation**: [Management contact]

### Documentation Updates

Keep this deployment guide updated with:
- Infrastructure changes
- New monitoring tools
- Updated procedures
- Lessons learned

---

**Ready for Production!** 🎉

This comprehensive deployment guide ensures your APO Dashboard is production-ready with enterprise-grade infrastructure, monitoring, and security measures.
