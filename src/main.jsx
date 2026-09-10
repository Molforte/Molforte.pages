import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { initTheme } from './theme.js'
import { loadCodeFont } from './lib/fonts.js'
import './styles/global.css'

initTheme()
loadCodeFont()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* BASE_URL：开发时是 /，GitHub Pages 构建时自动是 /Molforte.pages/ */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
