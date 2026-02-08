import './setupEnv';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { reportWebVitals } from './utils/webVitals';

createRoot(document.getElementById("root")!).render(<App />);

// Report web vitals to console only (Supabase persistence disabled to reduce DB load)
// To re-enable: import { persistWebVitals } and pass it to reportWebVitals
reportWebVitals(console.log);
