/** Por que não há indicadores: banco vazio, recorte só com promoções ou filtro sem resultado. */
export function emptyMessage(totalCount: number, filteredCount: number) {
  if (totalCount === 0) return "Ainda não há preços cadastrados. O primeiro registro aparece aqui assim que for publicado.";
  if (filteredCount > 0) return "Neste recorte só há preços promocionais (oferta ou clube), que ficam fora do índice. Veja as fotos abaixo.";
  return "Nenhum registro encontrado para os filtros selecionados.";
}
