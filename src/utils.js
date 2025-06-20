export async function exportToExcel(counts) {
  const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs');
  const headers = Object.keys(counts).sort();
  const row = headers.map(h => counts[h]);
  const data = [headers, row];
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'SKUs');
  XLSX.writeFile(workbook, 'resultado.xlsx');
}