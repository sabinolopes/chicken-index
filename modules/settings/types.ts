export interface EconomicSettings {
  min_wage: number;
  avg_wage: number;
  updated_at: string;
}

/** Valores iniciais (o schema cria a linha id = 1; isto só cobre um banco sem ela). */
export const DEFAULT_SETTINGS: EconomicSettings = { min_wage: 1518, avg_wage: 3225, updated_at: "1970-01-01T00:00:00Z" };
