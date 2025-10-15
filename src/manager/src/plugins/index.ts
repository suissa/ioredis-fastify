import type { DashboardPlugin } from "./plugin";

// Carrega dinamicamente todos os plugins da pasta
const pluginModules = import.meta.glob<{ default: DashboardPlugin }>(
  "./*/index.tsx",
  { eager: true }
);

export const plugins: DashboardPlugin[] = Object.values(pluginModules).map(
  (module) => module.default
);
