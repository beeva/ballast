import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/marketing/hero";
import { MetricsBand } from "@/components/marketing/metrics-band";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Features } from "@/components/marketing/features";
import { TechStack } from "@/components/marketing/tech-stack";
import { CTABand } from "@/components/marketing/cta-band";
import { JsonLd } from "@/components/json-ld";

export default function HomePage() {
  return (
    <>
      <JsonLd />
      <Navbar />
      <main>
        <Hero />
        <MetricsBand />
        <HowItWorks />
        <Features />
        <TechStack />
        <CTABand />
      </main>
      <Footer />
    </>
  );
}
