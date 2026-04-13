"use client";

import { DeveloperRoleSection } from "./DeveloperRoleSection";
import { ManUnitedRoleSection } from "./ManUnitedRoleSection";
import { MusicRoleSection } from "./MusicRoleSection";

/** 多个独立 section，外层 id 供导航「Me」锚定到本组起点 */
export function LabRolesGroup() {
  return (
    <div id="lab-roles" className="scroll-mt-0">
      <DeveloperRoleSection />
      <ManUnitedRoleSection />
      <MusicRoleSection />
    </div>
  );
}
