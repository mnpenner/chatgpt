import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)


// https://github.com/vitejs/vite/issues/6695#issuecomment-1069522995
// import 'vite/types/importMeta.d'; // Not needed when not using TypeScript

if (import.meta.hot) {
    import.meta.hot.on('vite:beforeFullReload', () => {
        throw '(skipping full reload)';
    });
}
