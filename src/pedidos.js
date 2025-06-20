import { exportToExcel } from './utils.js';

export default function initApp() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <h1>Integración de Pedidos</h1>
    <p>Pedido #: <input type="text" id="pedidoInput" placeholder="ej. 474" /></p>
    <p>Sube tu archivo PDF o Excel:</p>
    <input type="file" id="fileInput" />
    <button id="generar" disabled>Generar Excel</button>
    <pre id="output"></pre>
  `;

  let skus = [];

  const sheetId = '1phjH7lGHNm9wcd6pEafQNDowrT_e2QVyzjQXRfANGeQ';
  const gid = '0';
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&id=${sheetId}&gid=${gid}`;

  fetch(url)
    .then(response => response.text())
    .then(csvText => {
      skus = csvText
        .split('\n')
        .map(row => row.trim().toLowerCase())
        .filter(r => r && !r.includes('sku'));
      console.log('✅ SKUs cargados:', skus.length);
      document.getElementById('output').textContent = 'Base de SKUs cargada: ' + skus.length + ' registros';
      document.getElementById('generar').disabled = false;
    });

  let uploadedFile = null;

  document.getElementById('fileInput').addEventListener('change', (e) => {
    uploadedFile = e.target.files[0];
    document.getElementById('output').textContent += `\nArchivo cargado: ${uploadedFile.name}`;
  });

  document.getElementById('generar').addEventListener('click', async () => {
    const pedido = document.getElementById('pedidoInput').value.trim();
    if (!pedido || !uploadedFile) {
      alert('Falta ingresar número de pedido o subir archivo');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs');
      const workbook = XLSX.read(e.target.result, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const counts = {};

      const colorMap = {
        black: 'blk',
        blue: 'blu',
        pink: 'pnk',
        navy: 'nvy',
        grey: 'gry',
        gray: 'gry',
        purple: 'prp'
      };
      const colors = Object.keys(colorMap);

      let currentModel = null;

      rows.forEach((row, index) => {
        if (index < 2) return;

        const ctn = String(row[0] || '').trim();
        const rawModel = String(row[1] || '').toLowerCase().replaceAll(' ', '');

        if (ctn && rawModel && !rawModel.includes('total')) {
          currentModel = rawModel;
        } else if (!ctn && rawModel && !rawModel.includes('total')) {
          currentModel = rawModel;
        } else {
          return;
        }

        const fullModel = `${pedido}-${currentModel}`;
        console.log(`📦 Fila ${index + 1}: Modelo: "${fullModel}"`);

        colors.forEach((color, idx) => {
          const qty = row[idx + 2];
          if (!qty || isNaN(qty)) return;

          const abbr = colorMap[color];
          const foundSku = skus.find(sku => sku.includes(fullModel) && sku.includes(abbr));

          if (foundSku) {
            console.log(`✅ Encontrado SKU: ${foundSku} → ${qty}`);
            counts[foundSku] = (counts[foundSku] || 0) + Number(qty);
          } else {
            console.warn(`❌ No se encontró SKU para ${fullModel} + ${abbr}`);
          }
        });
      });

      exportToExcel(counts);
    };
    reader.readAsBinaryString(uploadedFile);
  });
}