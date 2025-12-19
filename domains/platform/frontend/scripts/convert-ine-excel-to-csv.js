/**
 * Script para convertir el archivo Excel del INE a CSV
 * Usa exceljs en lugar de xlsx (sin vulnerabilidades)
 */

const ExcelJS = require('exceljs');
const fs = require('fs');

async function convertExcel() {
  const workbook = new ExcelJS.Workbook();
  
  // Leer el archivo Excel
  await workbook.xlsx.readFile('/tmp/diccionario-ine.xlsx');

  // Obtener la primera hoja
  const worksheet = workbook.worksheets[0];

  // Convertir a JSON
  const jsonData = [];
  let headers = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      // Primera fila son los headers
      headers = row.values.slice(1); // slice(1) porque exceljs usa índice 1
    } else {
      const rowData = {};
      row.values.slice(1).forEach((value, index) => {
        if (headers[index]) {
          rowData[headers[index]] = value;
        }
      });
      jsonData.push(rowData);
    }
  });

  console.log(`📊 Datos del INE cargados:`);
  console.log(`   - Registros totales: ${jsonData.length}`);
  console.log(`   - Columnas: ${headers.join(', ')}`);
  console.log('');

  // Mostrar primeros registros
  console.log('📝 Primeros 5 registros:');
  jsonData.slice(0, 5).forEach((row, i) => {
    console.log(`   ${i + 1}.`, JSON.stringify(row));
  });

  // Guardar como JSON temporal para inspección
  fs.writeFileSync('/tmp/ine-data.json', JSON.stringify(jsonData, null, 2));
  console.log('\n✅ Datos guardados en /tmp/ine-data.json para inspección');
}

convertExcel().catch(console.error);
