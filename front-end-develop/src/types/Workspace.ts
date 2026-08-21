export type StaffWorkspace = "SDID" | "CRVS";

export type JurisdictionLevel =
  | "NATIONAL"
  | "PROVINCE"
  | "DISTRICT"
  | "SECTOR"
  | "CELL"
  | "VILLAGE";

export type StaffAssignment = {
  workspace: StaffWorkspace;
  role: string;
  permissions: string[];
  facilityId?: string;
  centerId?: string;
  jurisdiction?: {
    level: JurisdictionLevel;
    id: string;
    name?: string;
  };
  // Absent is treated as "active" for backward compatibility with accounts/
  // fixtures written before this field existed.
  status?: "active" | "inactive";
};
