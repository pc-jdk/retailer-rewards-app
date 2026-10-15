import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './components/App.jsx';

const scenario = new URLSearchParams(window.location.search).get('scenario') || 'success';
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App scenario={scenario} />
  </StrictMode>,
);
