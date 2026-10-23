import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '@/app/usePageTitle';
import { LandingCta, LandingFooter } from '@/features/landing/ClosingSections';
import { DecisionSection } from '@/features/landing/DecisionSection';
import { FarmSection } from '@/features/landing/FarmSection';
import { FieldSection } from '@/features/landing/FieldSection';
import { HeroSection } from '@/features/landing/HeroSection';
import { InstrumentsSection } from '@/features/landing/InstrumentsSection';
import { LandingHeader } from '@/features/landing/LandingHeader';
import { useLandingMotion } from '@/features/landing/landingMotion';
import { MakingOfSection } from '@/features/landing/MakingOfSection';
import { ProductSection } from '@/features/landing/ProductSection';
import { AboutSection, StatusStrip, WhySection } from '@/features/landing/TopSections';
import type { LandingDecisionKey } from '@/features/landing/workedExample';
import './landing.css';

/** Public portfolio page, intentionally outside the operational AppShell. */
export function Component() {
  const { t } = useTranslation();
  const root = useRef<HTMLDivElement>(null);
  const [scenarioKey, setScenarioKey] = useState<LandingDecisionKey>('irrigate');
  const [farmView, setFarmView] = useState<'map' | 'list'>('map');
  usePageTitle(t('landing.metaTitle'));
  useLandingMotion(root, scenarioKey, farmView);

  return (
    <div ref={root} className="landing">
      <a href="#landing-main" className="landing-skip">
        {t('shell.skipToContent')}
      </a>
      <LandingHeader />
      <main id="landing-main">
        <HeroSection />
        <StatusStrip />
        <AboutSection />
        <WhySection />
        <ProductSection />
        <FarmSection view={farmView} onViewChange={setFarmView} />
        <DecisionSection scenarioKey={scenarioKey} onScenarioChange={setScenarioKey} />
        <InstrumentsSection onScenarioChange={setScenarioKey} />
        <FieldSection />
        <MakingOfSection />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
