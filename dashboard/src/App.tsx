import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Background } from './components/Background';
import { Hero } from './components/Hero';
import { Problem } from './components/Problem';
import { Leak } from './components/Leak';
import { Stakes } from './components/Stakes';
import { Solution } from './components/Solution';
import { HowItWorks } from './components/HowItWorks';
import { Connect } from './components/Connect';
import { ProductPreview } from './components/ProductPreview';
import { Features } from './components/Features';
import { UseCases } from './components/UseCases';
import { Architecture } from './components/Architecture';
import { Roadmap } from './components/Roadmap';
import { CTA } from './components/CTA';
import { Footer } from './components/Footer';
import { StoreProvider } from './dashboard/store';
import { DashboardLayout } from './dashboard/DashboardLayout';
import { Overview } from './dashboard/pages/Overview';
import { Activity } from './dashboard/pages/Activity';
import { Agents } from './dashboard/pages/Agents';
import { Identities } from './dashboard/pages/Identities';
import { Approvals } from './dashboard/pages/Approvals';
import { Logs } from './dashboard/pages/Logs';
import { Tokens } from './dashboard/pages/Tokens';

function Landing() {
  return (
    <div className="relative min-h-screen">
      <Background />
      <div className="relative z-10">
        <Navbar />
        <main>
          {/* PART 1: THE PROBLEM */}
          <Hero />
          <Problem />
          <Leak />
          <Stakes />
          {/* PART 2: THE SOLUTION */}
          <Solution />
          <HowItWorks />
          <Connect />
          <ProductPreview />
          <Features />
          <UseCases />
          <Architecture />
          <Roadmap />
          <CTA />
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Overview />} />
            <Route path="activity" element={<Activity />} />
            <Route path="logs" element={<Logs />} />
            <Route path="agents" element={<Agents />} />
            <Route path="identities" element={<Identities />} />
            <Route path="tokens" element={<Tokens />} />
            <Route path="approvals" element={<Approvals />} />
          </Route>
          <Route path="*" element={<Landing />} />
        </Routes>
      </StoreProvider>
    </BrowserRouter>
  );
}
