import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { BountyProvider } from './store/BountyStore';
import './styles/fonts';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <BountyProvider>
        <App />
      </BountyProvider>
    </BrowserRouter>
  </StrictMode>,
);
