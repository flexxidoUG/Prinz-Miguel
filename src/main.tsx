import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/700.css';
import '@fontsource/cormorant-garamond/500-italic.css';
import '@fontsource/cormorant-garamond/600-italic.css';
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/700.css';
import './styles.css';
import { App } from './App';

const Admin = lazy(() => import('./admin/Admin'));
const Legal = lazy(() => import('./sections/Legal'));

const path = location.pathname.replace(/\/+$/, '') || '/';
const page =
  path === '/admin' ? <Admin /> :
  path === '/impressum' || path === '/datenschutz' ? <Legal kind={path.slice(1) as 'impressum' | 'datenschutz'} /> :
  <App />;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}>{page}</Suspense>
  </StrictMode>,
);
