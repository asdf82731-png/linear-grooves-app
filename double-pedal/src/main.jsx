import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {registerSW} from '../../shared/src/ui.jsx';
import './dp.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
registerSW();
