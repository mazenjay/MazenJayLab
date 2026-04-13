"use client";

import { LabHeroSection } from "@/components/lab/LabHeroSection";
import { LabJournalReveal } from "@/components/lab/LabJournalReveal";
import { LabJournalSection } from "@/components/lab/LabJournalSection";
import { LabLenisProvider } from "@/components/lab/LabLenisProvider";
import { LabScrollNav } from "@/components/lab/LabScrollNav";
import { LabRolesGroup } from "@/components/lab/roles/LabRolesGroup";
import { SpotlightSearch } from "@/components/lab/SpotlightSearch";

export function LabHomePage() {
  return (
    <LabLenisProvider>
      <SpotlightSearch />
      <main className="relative overflow-x-hidden bg-slate-50 font-sans text-slate-900">
        <LabScrollNav />
        <LabHeroSection />
        <LabJournalReveal>
          <LabJournalSection />
        </LabJournalReveal>
        {/* <LabRolesGroup /> */}
      </main>
    </LabLenisProvider>
  );
}
