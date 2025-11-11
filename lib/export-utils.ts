// Utility functions for exporting river water quality data

import { WaterQualityData, calculateConcentration, RIVER_POSITIONS, RIVER_LENGTH } from './water-quality-calculations';

export interface ExportDataPoint {
  tt: number; // Thứ tự
  viTri: string; // Vị trí
  z: number; // Khoảng cách (m)
  bod5_sample1: number;
  bod5_sample0: number;
  nh4_sample1: number;
  nh4_sample0: number;
  no3_sample1: number;
}

/**
 * Tạo dữ liệu xuất cho bảng nghiên cứu - sử dụng công thức toán học thực tế
 */
export const generateExportData = (rainfall: number, temperature: number): ExportDataPoint[] => {
  const exportData: ExportDataPoint[] = [];
  let tt = 1;

  // Tạo dữ liệu cho từng khu vực theo công thức toán học
  
  // 1. Sài Đồng region (0-1112m)
  const saiDongPoints = [0, 100, 300, 500, 700, 900, 1100];
  saiDongPoints.forEach(z => {
    const data = calculateConcentration(z, rainfall, temperature);
    exportData.push({
      tt: tt++,
      viTri: z === 0 ? "1. Sài Đồng Tại cống" : z.toString(),
      z: z,
      bod5_sample1: data.BOD5_sample1,
      bod5_sample0: data.BOD5_sample0,
      nh4_sample1: data.NH4_sample1,
      nh4_sample0: data.NH4_sample0,
      no3_sample1: data.NO3_sample1
    });
  });

  // 2. Đài Tư region (1107-3170m)
  const daiTuPoints = [
    { z: 1107, label: "2. Đài Tư Trước cống" },
    { z: 1112, label: "Tại cống" },
    { z: 1117, label: "Sau cống" },
    { z: 1317, label: "1.317" },
    { z: 1517, label: "1.517" },
    { z: 1717, label: "1.717" },
    { z: 1917, label: "1.917" },
    { z: 2117, label: "2.117" },
    { z: 2317, label: "2.317" },
    { z: 2517, label: "2.517" },
    { z: 2717, label: "2.717" },
    { z: 2917, label: "2.917" },
    { z: 3117, label: "3.117" }
  ];
  
  daiTuPoints.forEach(point => {
    const data = calculateConcentration(point.z, rainfall, temperature);
    exportData.push({
      tt: tt++,
      viTri: point.label,
      z: point.z,
      bod5_sample1: data.BOD5_sample1,
      bod5_sample0: data.BOD5_sample0,
      nh4_sample1: data.NH4_sample1,
      nh4_sample0: data.NH4_sample0,
      no3_sample1: data.NO3_sample1
    });
  });

  // 3. An Lạc region (3165-4590m)
  const anLacPoints = [
    { z: 3165, label: "3. An Lạc Trước cống" },
    { z: 3170, label: "Tại cống" },
    { z: 3175, label: "Sau cống" },
    { z: 3375, label: "3.375" },
    { z: 3575, label: "3.575" },
    { z: 3775, label: "3.775" },
    { z: 3975, label: "3.975" },
    { z: 4175, label: "4.175" },
    { z: 4375, label: "4.375" },
    { z: 4575, label: "4.575" }
  ];
  
  anLacPoints.forEach(point => {
    const data = calculateConcentration(point.z, rainfall, temperature);
    exportData.push({
      tt: tt++,
      viTri: point.label,
      z: point.z,
      bod5_sample1: data.BOD5_sample1,
      bod5_sample0: data.BOD5_sample0,
      nh4_sample1: data.NH4_sample1,
      nh4_sample0: data.NH4_sample0,
      no3_sample1: data.NO3_sample1
    });
  });

  // 4. Trâu Quỳ region (4585-7070m)
  const trauQuyPoints = [
    { z: 4585, label: "4. Trâu Quỳ Trước cống" },
    { z: 4590, label: "Tại cống" },
    { z: 4595, label: "Sau cống" },
    { z: 4795, label: "4.795" },
    { z: 4995, label: "4.995" },
    { z: 5195, label: "5.195" },
    { z: 5395, label: "5.395" },
    { z: 5595, label: "5.595" },
    { z: 5795, label: "5.795" },
    { z: 5995, label: "5.995" },
    { z: 6195, label: "6.195" },
    { z: 6395, label: "6.395" },
    { z: 6595, label: "6.595" },
    { z: 6795, label: "6.795" },
    { z: 6995, label: "6.995" }
  ];
  
  trauQuyPoints.forEach(point => {
    const data = calculateConcentration(point.z, rainfall, temperature);
    exportData.push({
      tt: tt++,
      viTri: point.label,
      z: point.z,
      bod5_sample1: data.BOD5_sample1,
      bod5_sample0: data.BOD5_sample0,
      nh4_sample1: data.NH4_sample1,
      nh4_sample0: data.NH4_sample0,
      no3_sample1: data.NO3_sample1
    });
  });

  // 5. Đa Tốn region (7065-8013m)
  const daTonPoints = [
    { z: 7065, label: "5. Đa Tốn Trước cống" },
    { z: 7070, label: "Tại cống" },
    { z: 7075, label: "Sau cống" },
    { z: 7275, label: "7.275" },
    { z: 7475, label: "7.475" },
    { z: 7675, label: "7.675" },
    { z: 7875, label: "7.875" }
  ];
  
  daTonPoints.forEach(point => {
    const data = calculateConcentration(point.z, rainfall, temperature);
    exportData.push({
      tt: tt++,
      viTri: point.label,
      z: point.z,
      bod5_sample1: data.BOD5_sample1,
      bod5_sample0: data.BOD5_sample0,
      nh4_sample1: data.NH4_sample1,
      nh4_sample0: data.NH4_sample0,
      no3_sample1: data.NO3_sample1
    });
  });

  // 6. Xuân Thụy (8013m)
  const xuanThuyData = calculateConcentration(8013, rainfall, temperature);
  exportData.push({
    tt: tt++,
    viTri: "6. Xuân Thụy Tại cống",
    z: 8013,
    bod5_sample1: xuanThuyData.BOD5_sample1,
    bod5_sample0: xuanThuyData.BOD5_sample0,
    nh4_sample1: xuanThuyData.NH4_sample1,
    nh4_sample0: xuanThuyData.NH4_sample0,
    no3_sample1: xuanThuyData.NO3_sample1
  });

  return exportData;
};

/**
 * Xuất dữ liệu ra CSV
 */
export const exportToCSV = (data: ExportDataPoint[], rainfall: number, temperature: number): string => {
  const headers = [
    'TT',
    'Vị trí',
    'Z',
    'BOD5 mẫu 1',
    'BOD5 mẫu 0', 
    'NH4+ mẫu 1',
    'NH4+ mẫu 0',
    'NO3- Mẫu 1'
  ];

  const csvContent = [
    `Bảng kết quả tính toán chất lượng nước sông Cầu Bây`,
    `Lượng mưa (X): ${rainfall} mm/hr, Nhiệt độ (Y): ${temperature}°C`,
    '',
    headers.join(','),
    ...data.map(row => [
      row.tt,
      `"${row.viTri}"`,
      row.z.toLocaleString(),
      row.bod5_sample1.toFixed(2),
      row.bod5_sample0.toFixed(2),
      row.nh4_sample1.toFixed(2),
      row.nh4_sample0.toFixed(2),
      row.no3_sample1.toFixed(2)
    ].join(','))
  ].join('\n');

  return csvContent;
};

/**
 * Download CSV file
 */
export const downloadCSV = (data: ExportDataPoint[], rainfall: number, temperature: number): void => {
  const csvContent = exportToCSV(data, rainfall, temperature);
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `CauBay_WaterQuality_X${rainfall}_Y${temperature}_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

/**
 * Generate HTML table for PDF export
 */
export const generateHTMLTable = (data: ExportDataPoint[], rainfall: number, temperature: number): string => {
  const tableRows = data.map(row => `
    <tr>
      <td>${row.tt}</td>
      <td>${row.viTri}</td>
      <td>${row.z.toLocaleString()}</td>
      <td>${row.bod5_sample1.toFixed(2)}</td>
      <td>${row.bod5_sample0.toFixed(2)}</td>
      <td>${row.nh4_sample1.toFixed(2)}</td>
      <td>${row.nh4_sample0.toFixed(2)}</td>
      <td>${row.no3_sample1.toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <html>
      <head>
        <title>Bảng kết quả tính toán chất lượng nước sông Cầu Bây</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; color: #333; }
          .info { text-align: center; margin-bottom: 20px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .location { text-align: left; }
        </style>
      </head>
      <body>
        <h1>Bảng kết quả tính toán chất lượng nước sông Cầu Bây</h1>
        <div class="info">
          <p><strong>Lượng mưa (X):</strong> ${rainfall} mm/hr | <strong>Nhiệt độ (Y):</strong> ${temperature}°C</p>
          <p><strong>Độ dài sông:</strong> ${RIVER_LENGTH.toLocaleString()}m | <strong>Số điểm quan trắc:</strong> ${data.length}</p>
          <p><strong>Thời gian xuất:</strong> ${new Date().toLocaleString('vi-VN')}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>TT</th>
              <th>Vị trí</th>
              <th>Z (m)</th>
              <th>BOD5 mẫu 1</th>
              <th>BOD5 mẫu 0</th>
              <th>NH4+ mẫu 1</th>
              <th>NH4+ mẫu 0</th>
              <th>NO3- mẫu 1</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
    </html>
  `;
};

/**
 * Print/PDF Export function
 */
export const exportToPDF = (data: ExportDataPoint[], rainfall: number, temperature: number): void => {
  const htmlContent = generateHTMLTable(data, rainfall, temperature);
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
};