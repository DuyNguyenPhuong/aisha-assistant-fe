import {
  calculateConcentration,
  RIVER_LENGTH,
  CRITICAL_POSITIONS,
  RIVER_POSITIONS,
} from "./water-quality-calculations";
export interface ExportDataPoint {
  tt: number;
  viTri: string;
  z: number;
  bod5_sample1: number;
  bod5_sample0: number;
  nh4_sample1: number;
  nh4_sample0: number;
  no3_sample1: number;
}
export const generateExportData = (
  rainfall: number,
  temperature: number,
): ExportDataPoint[] => {
  const exportData: ExportDataPoint[] = [];
  let tt = 1;

  // Tạo một map để lấy tên cho các vị trí
  const positionNames = new Map<number, string>();
  RIVER_POSITIONS.forEach((rp, index) => {
    positionNames.set(rp.position, `${index + 1}. ${rp.name} Tại cống`);
  });

  // Thêm các tên cho điểm trước và sau cống
  positionNames.set(1110, "2. Đài Tư Trước cống 2m");
  positionNames.set(1114, "2. Đài Tư Sau cống 2m");
  positionNames.set(3168, "3. An Lạc Trước cống 2m");
  positionNames.set(3172, "3. An Lạc Sau cống 2m");
  positionNames.set(4588, "4. Trâu Quỳ Trước cống 2m");
  positionNames.set(4592, "4. Trâu Quỳ Sau cống 2m");
  positionNames.set(7068, "5. Đa Tốn Trước cống 2m");
  positionNames.set(7072, "5. Đa Tốn Sau cống 2m");

  // Thêm điểm 0 (Sài Đồng)
  positionNames.set(0, "1. Sài Đồng Tại cống");

  // Sử dụng CRITICAL_POSITIONS làm cơ sở, sau đó thêm các điểm trung gian
  const allPositions = new Set<number>();
  
  // Thêm tất cả các điểm quan trọng
  CRITICAL_POSITIONS.forEach(pos => allPositions.add(pos));

  // Thêm một số điểm trung gian giữa các cống để có đủ dữ liệu
  const additionalPoints = [
    100, 300, 500, 700, 900, // giữa Sài Đồng và Đài Tư
    1317, 1517, 1717, 1917, 2117, 2317, 2517, 2717, 2917, 3117, // giữa Đài Tư và An Lạc  
    3375, 3575, 3775, 3975, 4175, 4375, // giữa An Lạc và Trâu Quỳ
    4795, 4995, 5195, 5395, 5595, 5795, 5995, 6195, 6395, 6595, 6795, 6995, // giữa Trâu Quỳ và Đa Tốn
    7275, 7475, 7675, 7875, // giữa Đa Tốn và Xuân Thụy
  ];
  
  additionalPoints.forEach(pos => allPositions.add(pos));

  // Chuyển Set thành Array và sort
  const sortedPositions = Array.from(allPositions).sort((a, b) => a - b);

  // Generate data cho mỗi position
  sortedPositions.forEach((z) => {
    const data = calculateConcentration(z, rainfall, temperature);
    const viTri = positionNames.get(z) || `Z=${z}m`;
    
    exportData.push({
      tt: tt++,
      viTri,
      z: z,
      bod5_sample1: data.BOD5_sample1,
      bod5_sample0: data.BOD5_sample0,
      nh4_sample1: data.NH4_sample1,
      nh4_sample0: data.NH4_sample0,
      no3_sample1: data.NO3_sample1,
    });
  });

  return exportData;
};
export const exportToCSV = (
  data: ExportDataPoint[],
  rainfall: number,
  temperature: number,
): string => {
  const headers = [
    "TT",
    "Vị trí",
    "Z",
    "BOD5 mẫu 1",
    "BOD5 mẫu 0",
    "NH4+ mẫu 1",
    "NH4+ mẫu 0",
    "NO3- Mẫu 1",
  ];
  const csvContent = [
    `Bảng kết quả tính toán chất lượng nước sông Cầu Bây`,
    `Lượng mưa (X): ${rainfall} mm/hr, Nhiệt độ (Y): ${temperature}°C`,
    "",
    headers.join(","),
    ...data.map((row) =>
      [
        row.tt,
        `"${row.viTri}"`,
        row.z.toLocaleString(),
        row.bod5_sample1.toFixed(2),
        row.bod5_sample0.toFixed(2),
        row.nh4_sample1.toFixed(2),
        row.nh4_sample0.toFixed(2),
        row.no3_sample1.toFixed(2),
      ].join(","),
    ),
  ].join("\n");
  return csvContent;
};
export const downloadCSV = (
  data: ExportDataPoint[],
  rainfall: number,
  temperature: number,
): void => {
  const csvContent = exportToCSV(data, rainfall, temperature);
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `CauBay_WaterQuality_X${rainfall}_Y${temperature}_${new Date().getTime()}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
export const generateHTMLTable = (
  data: ExportDataPoint[],
  rainfall: number,
  temperature: number,
): string => {
  const tableRows = data
    .map(
      (row) => `
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
  `,
    )
    .join("");
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
          <p><strong>Thời gian xuất:</strong> ${new Date().toLocaleString("vi-VN")}</p>
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
export const exportToPDF = (
  data: ExportDataPoint[],
  rainfall: number,
  temperature: number,
): void => {
  const htmlContent = generateHTMLTable(data, rainfall, temperature);
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
};
