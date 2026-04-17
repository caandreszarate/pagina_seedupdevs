import CircuitBackground from '@/components/CircuitBackground';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import LandingContent from '@/components/LandingContent';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[#05070D]">
      <CircuitBackground />
      <Navbar />

      <div className="relative z-10">
        <HeroSection />
        <LandingContent />
        <Footer />
      </div>
    </main>
  );
}
