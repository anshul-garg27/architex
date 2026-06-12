import type { Metadata } from "next";
import ParkingLotLesson from "./ParkingLotLesson";

export const metadata: Metadata = {
  title: "Parking Lot — Low Level Design · Architex",
  description:
    "Design the software that runs every parking facility, end to end. Entities, hierarchies, relationships, behaviors, patterns, anti-patterns, edge cases, and scaling — built up from first principles.",
};

export default function Page() {
  return <ParkingLotLesson />;
}
