import './setupEnv';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App.tsx';
import './index.css';
import { reportWebVitals } from './utils/webVitals';
import { initPostHog } from './lib/posthog';

const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    tracesSampleRate: 0.1,
    environment: import.meta.env.MODE,
  });
}

initPostHog();

createRoot(document.getElementById("root")!).render(<App />);

reportWebVitals(console.log);
