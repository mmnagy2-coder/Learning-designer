import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { NavBar } from './components/shared/NavBar'
import { ToastProvider } from './components/shared/Toast'
import { AIAssistantPanel } from './components/ai/AIAssistantPanel'
import { Start } from './pages/Start'
import { Browser } from './pages/Browser'
import { Designer } from './pages/Designer'

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="min-h-screen bg-background">
          <NavBar />
          <Routes>
            <Route path="/" element={<Start />} />
            <Route path="/browser" element={<Browser />} />
            <Route path="/designer" element={<Designer />} />
          </Routes>
          <AIAssistantPanel />
        </div>
      </ToastProvider>
    </BrowserRouter>
  )
}
