import './setupEnv';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { reportWebVitals, persistWebVitals } from './utils/webVitals';

createRoot(document.getElementById("root")!).render(<App />);

// Report web vitals to console or analytics endpoint
reportWebVitals(persistWebVitals);
