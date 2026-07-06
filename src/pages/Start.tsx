// VISUAL DESIGN BRIEF: The marketing-style landing page — cinematic hero, curved divider,
// feature panels, then a data-driven proof section built from the user's own seed designs.
// Fully responsive: hero text scales down and feature panels stack below 768px.
import { HeroSection } from '../components/start/HeroSection'
import { FeaturePanels } from '../components/start/FeaturePanels'
import { DemoCharts } from '../components/start/DemoCharts'
import { useDesigns } from '../hooks/useDesigns'

export function Start() {
  const { designs, loaded } = useDesigns()

  return (
    <div>
      <HeroSection />
      <FeaturePanels />
      <DemoCharts designs={designs} loaded={loaded} />
    </div>
  )
}
