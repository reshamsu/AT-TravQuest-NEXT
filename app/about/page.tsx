import Hero from "@/components/about/Hero";
import Intro from "@/components/about/Intro";
import Values from "@/components/about/Values";

export default function About() {
  return (
    <div className="relative z-30">
      <Hero />
      <Intro />
      <Values />
    </div>
  );
}
