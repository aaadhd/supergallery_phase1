import { createRoot } from 'react-dom/client';
import App from './app/App';
import { ErrorBoundary } from './app/components/ErrorBoundary';
import { SplashScreen } from './app/components/SplashScreen';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <SplashScreen>
      <App />
    </SplashScreen>
  </ErrorBoundary>,
);
