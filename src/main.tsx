import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { reportWebVitals } from './utils/webVitals';

createRoot(document.getElementById("root")!).render(<App />);

// Report web vitals to console or analytics endpoint
reportWebVitals((metric) => {
  // Replace this with API call to analytics if needed
  console.log('[WebVitals]', metric);
});
