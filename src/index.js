import React from 'react';
import { createRoot } from 'react-dom/client';
import FormBuilder from './FormBuilder';

// Render the React app into the admin root div
const rootElement = document.getElementById('rest-form-builder-root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<FormBuilder />);
}
