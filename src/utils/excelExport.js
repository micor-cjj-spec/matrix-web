import { fixMojibake } from './textEncoding.js'

const encoder = new TextEncoder()
const CRC_TABLE = createCrcTable()

export function exportRowsToXlsx({ filename, sheetName = 'Sheet1', headers = [], rows = [] }) {
  const workbook = createWorkbook({
    sheetName,
    data: [headers, ...rows].map((row) => row.map((value) => fixMojibake(String(value ?? '')))),
  })
  downloadBlob(workbook, ensureXlsxName(filename))
}

function createWorkbook({ sheetName, data }) {
  const safeSheetName = sanitizeSheetName(sheetName)
  const files = {
    '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`,
    '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`,
    'docProps/app.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Matrix</Application>
</Properties>`,
    'docProps/core.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>Matrix</dc:creator>
  <cp:lastModifiedBy>Matrix</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:modified>
</cp:coreProperties>`,
    'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${escapeXml(safeSheetName)}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`,
    'xl/_rels/workbook.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    'xl/styles.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Microsoft YaHei"/></font>
    <font><b/><sz val="11"/><name val="Microsoft YaHei"/></font>
  </fonts>
  <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`,
    'xl/worksheets/sheet1.xml': createWorksheetXml(data),
  }
  return new Blob([zipFiles(files)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

function createWorksheetXml(data) {
  const rowsXml = data.map((row, rowIndex) => {
    const cells = row.map((value, cellIndex) => {
      const ref = `${columnName(cellIndex + 1)}${rowIndex + 1}`
      const style = rowIndex === 0 ? ' s="1"' : ''
      return `<c r="${ref}" t="inlineStr"${style}><is><t>${escapeXml(value)}</t></is></c>`
    }).join('')
    return `<row r="${rowIndex + 1}">${cells}</row>`
  }).join('')

  const columnCount = data.reduce((max, row) => Math.max(max, row.length), 0)
  const rowCount = Math.max(data.length, 1)
  const dimension = `A1:${columnName(Math.max(columnCount, 1))}${rowCount}`
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="${dimension}"/>
  <sheetViews><sheetView workbookViewId="0"/></sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  <sheetData>${rowsXml}</sheetData>
</worksheet>`
}

function zipFiles(files) {
  const localParts = []
  const centralParts = []
  let offset = 0

  Object.entries(files).forEach(([name, content]) => {
    const nameBytes = encoder.encode(name)
    const data = encoder.encode(content)
    const crc = crc32(data)
    const localHeader = createLocalHeader(nameBytes, data, crc)
    localParts.push(localHeader, data)
    centralParts.push(createCentralHeader(nameBytes, data, crc, offset))
    offset += localHeader.length + data.length
  })

  const centralSize = centralParts.reduce((size, part) => size + part.length, 0)
  const end = createEndRecord(Object.keys(files).length, centralSize, offset)
  return concatUint8Arrays([...localParts, ...centralParts, end])
}

function createLocalHeader(nameBytes, data, crc) {
  const header = new Uint8Array(30 + nameBytes.length)
  const view = new DataView(header.buffer)
  view.setUint32(0, 0x04034b50, true)
  view.setUint16(4, 20, true)
  view.setUint16(6, 0x0800, true)
  view.setUint16(8, 0, true)
  view.setUint16(10, 0, true)
  view.setUint16(12, 0, true)
  view.setUint32(14, crc, true)
  view.setUint32(18, data.length, true)
  view.setUint32(22, data.length, true)
  view.setUint16(26, nameBytes.length, true)
  view.setUint16(28, 0, true)
  header.set(nameBytes, 30)
  return header
}

function createCentralHeader(nameBytes, data, crc, offset) {
  const header = new Uint8Array(46 + nameBytes.length)
  const view = new DataView(header.buffer)
  view.setUint32(0, 0x02014b50, true)
  view.setUint16(4, 20, true)
  view.setUint16(6, 20, true)
  view.setUint16(8, 0x0800, true)
  view.setUint16(10, 0, true)
  view.setUint16(12, 0, true)
  view.setUint16(14, 0, true)
  view.setUint32(16, crc, true)
  view.setUint32(20, data.length, true)
  view.setUint32(24, data.length, true)
  view.setUint16(28, nameBytes.length, true)
  view.setUint16(30, 0, true)
  view.setUint16(32, 0, true)
  view.setUint16(34, 0, true)
  view.setUint16(36, 0, true)
  view.setUint32(38, 0, true)
  view.setUint32(42, offset, true)
  header.set(nameBytes, 46)
  return header
}

function createEndRecord(fileCount, centralSize, centralOffset) {
  const record = new Uint8Array(22)
  const view = new DataView(record.buffer)
  view.setUint32(0, 0x06054b50, true)
  view.setUint16(8, fileCount, true)
  view.setUint16(10, fileCount, true)
  view.setUint32(12, centralSize, true)
  view.setUint32(16, centralOffset, true)
  return record
}

function concatUint8Arrays(parts) {
  const total = parts.reduce((size, part) => size + part.length, 0)
  const result = new Uint8Array(total)
  let offset = 0
  parts.forEach((part) => {
    result.set(part, offset)
    offset += part.length
  })
  return result
}

function crc32(data) {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i += 1) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ data[i]) & 0xff]
  }
  return (crc ^ 0xffffffff) >>> 0
}

function createCrcTable() {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i += 1) {
    let c = i
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[i] = c >>> 0
  }
  return table
}

function downloadBlob(blob, filename) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

function ensureXlsxName(filename) {
  return /\.xlsx$/i.test(filename) ? filename : `${filename.replace(/\.[^.]+$/, '')}.xlsx`
}

function sanitizeSheetName(value) {
  return String(value || 'Sheet1').replace(/[\\/?*:[\]]/g, '').slice(0, 31) || 'Sheet1'
}

function columnName(index) {
  let name = ''
  let current = index
  while (current > 0) {
    const mod = (current - 1) % 26
    name = String.fromCharCode(65 + mod) + name
    current = Math.floor((current - mod) / 26)
  }
  return name
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
