import Hero from "@/components/explore-uae/Hero";
import Intro from "@/components/explore-uae/Intro";
import Destinations from "@/components/explore-uae/Destinations";
import CallToAction from "@/components/CalltoAction";

export default function UAE() {
  return (
    <div className="relative z-30">
      <Hero />
      <Intro />
      <Destinations />
      <CallToAction />
    </div>
  );
}
