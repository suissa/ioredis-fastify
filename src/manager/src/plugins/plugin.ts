import type React from "react";
import type { IconType } from "react-icons";

export interface DashboardPlugin {
  name: string;
  icon: IconType;
  component: React.ComponentType;
}
