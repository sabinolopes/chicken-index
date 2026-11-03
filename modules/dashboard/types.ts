import type { ChickenPrice } from "@/modules/prices/types";
import type { EconomicSettings } from "@/modules/settings/types";

export interface DashboardData {
  prices: ChickenPrice[];
  settings: EconomicSettings;
  generatedAt: string;
}
