import type { ViolationRecord } from '../types';

// Helper to format Lithuanian date string
export function formatLtDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('lt-LT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Generates an Excel Spreadsheet (.xls XML format) that Microsoft Excel,
 * LibreOffice Calc, and Google Sheets open natively with styling, borders, and headers.
 */
export function exportToExcel(records: ViolationRecord[], filenamePrefix = 'telefonu_registras'): void {
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('lt-LT', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const timeFormatted = now.toLocaleTimeString('lt-LT', { hour: '2-digit', minute: '2-digit' });

  // XML Spreadsheet 2003 template
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>Tryškių Lazdynų Pelėdos gimnazija - Telefonų pažeidimų registras</Title>
  <Author>Tryškių Lazdynų Pelėdos gimnazija</Author>
  <Created>${now.toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="SchoolTitle">
   <Font ss:FontName="Calibri" ss:Size="14" ss:Color="#1e293b" ss:Bold="1"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="SubTitle">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#64748b" ss:Italic="1"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="TableHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0f172a"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0f172a"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#cbd5e1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#cbd5e1"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#ffffff" ss:Bold="1"/>
   <Interior ss:Color="#b45309" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="DataCell">
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#1e293b"/>
  </Style>
  <Style ss:ID="DataCellCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#1e293b"/>
  </Style>
  <Style ss:ID="DataCellBold">
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#0f172a" ss:Bold="1"/>
  </Style>
  <Style ss:ID="DataCellArchived">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="9" ss:Color="#64748b" ss:Italic="1"/>
   <Interior ss:Color="#f1f5f9" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Telefonų pažeidimai">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="35"/>  <!-- Nr. -->
   <Column ss:Width="110"/> <!-- Data -->
   <Column ss:Width="140"/> <!-- Mokinys -->
   <Column ss:Width="50"/>  <!-- Klasė -->
   <Column ss:Width="160"/> <!-- Vieta -->
   <Column ss:Width="250"/> <!-- Pastaba -->
   <Column ss:Width="140"/> <!-- Mokytojas -->
   <Column ss:Width="80"/>  <!-- Būsena -->

   <!-- Row 1: School Header -->
   <Row ss:Height="24">
    <Cell ss:MergeAcross="7" ss:StyleID="SchoolTitle">
     <Data ss:Type="String">TRYŠKIŲ LAZDYNŲ PELĖDOS GIMNAZIJA</Data>
    </Cell>
   </Row>
   
   <!-- Row 2: Subtitle -->
   <Row ss:Height="18">
    <Cell ss:MergeAcross="7" ss:StyleID="SubTitle">
     <Data ss:Type="String">Mobiliųjų telefonų naudojimo taisyklių pažeidimų registravimo žurnalas | Sugeneruota: ${dateFormatted} ${timeFormatted}</Data>
    </Cell>
   </Row>

   <!-- Empty row -->
   <Row ss:Height="10"/>

   <!-- Table Headers -->
   <Row ss:Height="26">
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Nr.</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Data ir laikas</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Mokinys</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Klasė</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Pažeidimo vieta</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Aplinkybės / Pastaba</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Užregistravęs mokytojas</Data></Cell>
    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">Būsena</Data></Cell>
   </Row>
`;

  records.forEach((r, idx) => {
    const escapeXml = (str: string) =>
      str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    const dateStr = formatLtDate(r.timestamp);
    const student = escapeXml(r.studentName || '');
    const sClass = escapeXml(r.studentClass || '');
    const location = escapeXml(r.location || '');
    const note = escapeXml(r.note || '-');
    const teacher = escapeXml(r.registeredByTeacherName || r.registeredByTeacherEmail || '');
    const status = r.archived ? 'Archyvuotas' : 'Aktyvus';

    xml += `   <Row ss:Height="22">
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${dateStr}</Data></Cell>
    <Cell ss:StyleID="DataCellBold"><Data ss:Type="String">${student}</Data></Cell>
    <Cell ss:StyleID="DataCellCenter"><Data ss:Type="String">${sClass}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${location}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${note}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${teacher}</Data></Cell>
    <Cell ss:StyleID="${r.archived ? 'DataCellArchived' : 'DataCellCenter'}"><Data ss:Type="String">${status}</Data></Cell>
   </Row>
`;
  });

  xml += `  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenamePrefix}_${now.toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates an official formatted Microsoft Word document (.doc) with
 * Tryškių Lazdynų Pelėdos gimnazija official letterhead, summary statistics,
 * violations table, and signature approval section.
 */
export function exportToWord(
  records: ViolationRecord[],
  title = 'PAŽYMA DĖL MOKSLEIVIŲ MOBILIŲJŲ TELEFONŲ NAUDOJIMO TAISYKLIŲ LAIKYMOSI',
  periodDescription = 'Einamieji mokslo metai'
): void {
  const now = new Date();
  const formattedToday = now.toLocaleDateString('lt-LT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Calculate quick stats
  const total = records.length;
  const uniqueStudents = new Set(records.map((r) => r.studentName)).size;
  
  // Group by student for mini-TOP list in report
  const studentMap = new Map<string, { studentClass: string; count: number }>();
  records.forEach((r) => {
    const key = r.studentName;
    if (!studentMap.has(key)) {
      studentMap.set(key, { studentClass: r.studentClass, count: 0 });
    }
    studentMap.get(key)!.count += 1;
  });

  const topStudents = Array.from(studentMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  const wordContent = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @page Section1 {
      size: 595.3pt 841.9pt; /* A4 */
      margin: 56.7pt 56.7pt 56.7pt 56.7pt; /* 2 cm margins */
      mso-header-margin: 35.4pt;
      mso-footer-margin: 35.4pt;
      mso-paper-source: 0;
    }
    div.Section1 { page: Section1; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.35;
      color: #000000;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
    }
    .header-table {
      width: 100%;
      border-bottom: 2pt solid #000000;
      padding-bottom: 8pt;
      margin-bottom: 20pt;
    }
    .school-title {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
      margin: 0;
    }
    .school-subtitle {
      font-size: 10pt;
      color: #333333;
      margin-top: 3pt;
    }
    .doc-title {
      text-align: center;
      font-size: 14pt;
      font-weight: bold;
      margin-top: 15pt;
      margin-bottom: 4pt;
      text-transform: uppercase;
    }
    .doc-meta {
      text-align: center;
      font-size: 11pt;
      margin-bottom: 18pt;
      color: #333333;
    }
    .stat-box {
      border: 1pt solid #000000;
      background-color: #f8fafc;
      padding: 8pt 12pt;
      margin-bottom: 16pt;
    }
    .stat-box p {
      margin: 3pt 0;
      font-size: 11pt;
    }
    h3 {
      font-size: 12pt;
      font-weight: bold;
      margin-top: 16pt;
      margin-bottom: 6pt;
      text-transform: uppercase;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8pt;
      margin-bottom: 18pt;
      font-size: 10pt;
    }
    table.data-table th {
      border: 1pt solid #000000;
      background-color: #f1f5f9;
      padding: 5pt 6pt;
      font-weight: bold;
      text-align: center;
    }
    table.data-table td {
      border: 1pt solid #000000;
      padding: 4pt 6pt;
      vertical-align: middle;
    }
    .signatures {
      margin-top: 35pt;
      width: 100%;
    }
    .signatures td {
      padding-top: 20pt;
      font-size: 11pt;
      vertical-align: top;
    }
    .signature-line {
      display: inline-block;
      width: 180pt;
      border-bottom: 1pt solid #000000;
      margin-right: 8pt;
    }
  </style>
</head>
<body>
<div class="Section1">
  <!-- School Letterhead Header -->
  <table class="header-table" cellpadding="0" cellspacing="0">
    <tr>
      <td style="width: 75%; vertical-align: middle;">
        <div class="school-title">TRYŠKIŲ LAZDYNŲ PELĖDOS GIMNAZIJA</div>
        <div class="school-subtitle">
          Biudžetinė įstaiga, įmonės kodas 190581723<br>
          Lazdynų Pelėdos g. 20, Tryškiai, LT-88161 Telšių r. sav. | Tel. (8 444) 47311<br>
          El. paštas: rastine@tryskiumokykla.lt | www.tryskiumokykla.lt
        </div>
      </td>
      <td style="width: 25%; text-align: right; vertical-align: middle;">
        <!-- School Icon Emblema -->
        <div style="font-weight: bold; font-size: 11pt; border: 1pt solid #000; padding: 4pt 8pt; text-align: center; display: inline-block;">
          TELŠIŲ R. SAV.<br>GIMNAZIJA
        </div>
      </td>
    </tr>
  </table>

  <!-- Document Title & Date -->
  <div class="doc-title">${title}</div>
  <div class="doc-meta">
    ${formattedToday} Nr. VGK-${now.getFullYear()}-01<br>
    Tryškiai
  </div>

  <p style="text-indent: 20pt; text-align: justify;">
    Remiantis Tryškių Lazdynų Pelėdos gimnazijos mokinių elgesio ir mobiliųjų telefonų bei kitų išmaniųjų įrenginių naudojimo tvarkos aprašu, teikiama suvestinė apie užfiksuotus moksleivių taisyklių pažeidimus (laikotarpis: <strong>${periodDescription}</strong>).
  </p>

  <!-- Key Statistics Summary -->
  <div class="stat-box">
    <p><strong>1. Pagrindiniai apskaitos rodikliai:</strong></p>
    <p>• Iš viso per nagrinėjamą laikotarpį užfiksuota pažeidimų: <strong>${total}</strong></p>
    <p>• Unikalių taisykles pažeidusių moksleivių skaičius: <strong>${uniqueStudents}</strong></p>
    <p>• Dažniausios pažeidimų aplinkybės: telefonų naudojimas pamokų metu be mokytojo leidimo, filmavimas/fotografavimas, žaidimai bei socialiniai tinklai.</p>
  </div>

  ${
    topStudents.length > 0
      ? `
  <h3>2. Dažniausiai taisykles pažeidę mokiniai ir siūlomos prevencinės priemonės</h3>
  <table class="data-table" cellpadding="0" cellspacing="0">
    <thead>
      <tr>
        <th style="width: 30pt;">Nr.</th>
        <th style="width: 140pt;">Mokinio vardas, pavardė</th>
        <th style="width: 50pt;">Klasė</th>
        <th style="width: 60pt;">Kartai</th>
        <th>Siūlomos pedagoginės / prevencinės priemonės</th>
      </tr>
    </thead>
    <tbody>
      ${topStudents
        .map(
          ([name, data], i) => `
      <tr>
        <td style="text-align: center;">${i + 1}</td>
        <td><strong>${name}</strong></td>
        <td style="text-align: center;">${data.studentClass}</td>
        <td style="text-align: center; font-weight: bold;">${data.count}</td>
        <td>
          ${
            data.count >= 4
              ? 'Mokinio ir tėvų kvietimas į Vaiko gerovės komisijos (VGK) posėdį; individualus prevencinis pokalbis su administracija.'
              : data.count >= 2
              ? 'Įspėjimas TAMO dienyne, individualus pokalbis su klasės vadovu ir socialine pedagoge.'
              : 'Žodinis įspėjimas, tėvų informavimas TAMO dienyne.'
          }
        </td>
      </tr>
      `
        )
        .join('')}
    </tbody>
  </table>
  `
      : ''
  }

  <h3>3. Užregistruotų pažeidimų detalus registras</h3>
  <table class="data-table" cellpadding="0" cellspacing="0">
    <thead>
      <tr>
        <th style="width: 25pt;">Nr.</th>
        <th style="width: 85pt;">Data ir laikas</th>
        <th style="width: 110pt;">Mokinys</th>
        <th style="width: 35pt;">Klasė</th>
        <th style="width: 100pt;">Vieta</th>
        <th>Aplinkybės / Pastaba</th>
        <th style="width: 100pt;">Užregistravo</th>
      </tr>
    </thead>
    <tbody>
      ${records
        .map(
          (r, idx) => `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td style="text-align: center;">${formatLtDate(r.timestamp)}</td>
        <td><strong>${r.studentName}</strong></td>
        <td style="text-align: center;">${r.studentClass}</td>
        <td>${r.location}</td>
        <td>${r.note || '—'}</td>
        <td>${r.registeredByTeacherName}</td>
      </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <!-- Signatures Block -->
  <table class="signatures" cellpadding="0" cellspacing="0">
    <tr>
      <td style="width: 50%;">
        Pažymą parengė:<br><br>
        <span class="signature-line"></span><br>
        (Parašas, vardas, pavardė, pareigos)
      </td>
      <td style="width: 50%;">
        Susipažino:<br><br>
        Gimnazijos direktorė / VGK pirmininkė<br>
        <span class="signature-line"></span><br>
        (Parašas, vardas, pavardė)
      </td>
    </tr>
  </table>
</div>
</body>
</html>`;

  const blob = new Blob(['\ufeff' + wordContent], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pazyma_telefonu_pazeidimai_tryskiai_${now.toISOString().slice(0, 10)}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
