import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Automatically trigger native date/datetime picker when clicking anywhere inside the input block
if (typeof document !== 'undefined') {
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (
      target instanceof HTMLInputElement &&
      (target.type === 'date' || target.type === 'datetime-local' || target.type === 'time') &&
      !target.disabled &&
      !target.readOnly
    ) {
      try {
        target.showPicker?.();
      } catch (_) {
        // Safe fallback if already open or unsupported
      }
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
