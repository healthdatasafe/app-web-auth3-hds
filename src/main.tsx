import { createRoot } from 'react-dom/client'
import App from './App'
import './app.css'
import { loadSettings } from './loadSettings'

const container = document.getElementById('root')
if (container) {
  loadSettings().then(({ serviceInfoUrl }) => {
    window.__HDS_SERVICE_INFO_URL__ = serviceInfoUrl
    const root = createRoot(container)
    root.render(<App />)
  })
}
