import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import React from 'react'

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("RootErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <div className="glass-card" style={{ maxWidth: '400px', margin: '2rem auto', padding: '2rem', borderRadius: '12px' }}>
            <h2 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Something went wrong</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>A critical error occurred while rendering the application.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button className="btn btn-primary" onClick={() => window.location.reload()} style={{ padding: '0.75rem' }}>
                Reload
              </button>
              <button className="btn btn-secondary" onClick={() => {
                localStorage.removeItem('currentUser');
                localStorage.removeItem('token');
                localStorage.removeItem('fastnet_partner_session');
                window.location.reload();
              }} style={{ padding: '0.75rem' }}>
                Reset session and reload
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
)
