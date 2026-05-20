import './style/style.css'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { ToastProvider } from "./Elements/Toast";

createRoot(document.getElementById('root')!).render(
  <>
  <ToastProvider>
    <App />
  </ToastProvider>
  </>
)
