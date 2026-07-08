"use client";

import dynamic from "next/dynamic";
import { useHomeData } from "@/lib/useHomeData";

const Background = dynamic(() => import("@/components/home/Background"));
const Tours = dynamic(() => import("@/components/home/Tours"));
const Destinations = dynamic(() => import("@/components/Destinations"));
const Apart = dynamic(() => import("@/components/home/Apart"));
const Service = dynamic(() => import("@/components/home/Service"));
const Promo = dynamic(() => import("@/components/home/Promo"));

export default function ClientSections() {
  const { data } = useHomeData();

  return (
    <>
      <Background initialData={data.background} />
      <Tours initialData={data.tours} />
      <Destinations initialData={data.destinations} />
      <Apart initialData={data.apart} />
      <Service initialData={data.services} />
      <Promo initialData={data.promos} />
    </>
  );
}
