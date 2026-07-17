import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { NavBar } from './components/shared/NavBar'
import { ToastProvider } from './components/shared/Toast'
import { AIAssistantPanel } from './components/ai/AIAssistantPanel'
import { Start } from './pages/Start'
import { Browser } from './pages/Browser'
import { Designer } from './pages/Designer'
import { ModuleDesigner } from './pages/ModuleDesigner'
import { CourseDesigner } from './pages/CourseDesigner'

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
            <Route path="/module" element={<ModuleDesigner />} />
            <Route path="/course" element={<CourseDesigner />} />
          </Routes>
          <AIAssistantPanel />
        </div>
      </ToastProvider>
    </BrowserRouter>
  )
}
