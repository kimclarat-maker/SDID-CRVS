import { SidebarContextType } from "@/types/Sidebar";
import { createContext } from "react";

export const SidebarContext = createContext<SidebarContextType>({
  expanded: true,
  setSidebarExpand: () => {},
});
