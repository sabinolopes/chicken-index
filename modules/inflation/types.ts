/** As três séries do IPCA que comparamos com o Frangômetro. */
export interface IpcaValues {
  general: number;
  food: number;
  chicken: number;
}

/** Variação mensal (%) de um mês do IPCA. */
export interface IpcaMonth extends IpcaValues {
  month: string; // YYYY-MM
}

/** IPCA publicado pelo IBGE: variações mensais e o acumulado em 12 meses do último mês. */
export interface OfficialInflation {
  months: IpcaMonth[];
  twelveMonths: IpcaMonth;
}
