function cleanCell(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function downloadBlob(content, filename, type) {
  const blob = content instanceof Blob ? content : new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function getBaseName(filename) {
  return filename.replace(/\.[^.]+$/, '')
}

function getExportRows(columns, rows) {
  return rows.map((row) =>
    columns.reduce((entry, column) => {
      entry[column.header] = cleanCell(column.value(row))
      return entry
    }, {})
  )
}

function buildSeparatedValues({ columns, rows, separator }) {
  const escapeValue = (value) => {
    const text = cleanCell(value).replaceAll('"', '""')
    return `"${text}"`
  }

  return [
    columns.map((column) => escapeValue(column.header)).join(separator),
    ...rows.map((row) => columns.map((column) => escapeValue(column.value(row))).join(separator))
  ].join('\n')
}

async function exportPdf({ filename, title, columns, rows }) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ])
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const generatedAt = new Date().toLocaleString('es-AR')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text(title, 40, 36)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Generado: ${generatedAt}`, 40, 53)

  autoTable(doc, {
    startY: 70,
    head: [columns.map((column) => column.header)],
    body: rows.map((row) => columns.map((column) => cleanCell(column.value(row)))),
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 5,
      overflow: 'linebreak',
      valign: 'middle'
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { top: 70, right: 32, bottom: 32, left: 32 },
    didDrawPage: ({ pageNumber }) => {
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      doc.setFontSize(8)
      doc.setTextColor(100)
      doc.text(`Pagina ${pageNumber}`, pageWidth - 72, pageHeight - 18)
    }
  })

  doc.save(`${getBaseName(filename)}.pdf`)
}

async function exportExcel({ filename, title, columns, rows }) {
  const XLSX = await import('xlsx')
  const worksheet = XLSX.utils.json_to_sheet(getExportRows(columns, rows))
  const workbook = XLSX.utils.book_new()
  const sheetName = title.slice(0, 31) || 'Exportacion'

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, `${getBaseName(filename)}.xlsx`, { compression: true })
}

export async function exportTable({ type, filename, title, columns, rows }) {
  const normalizedType = String(type).toLowerCase()
  const baseName = getBaseName(filename)

  if (normalizedType === 'pdf') {
    await exportPdf({ filename, title, columns, rows })
    return
  }

  if (normalizedType === 'excel') {
    await exportExcel({ filename, title, columns, rows })
    return
  }

  if (normalizedType === 'psv') {
    downloadBlob(buildSeparatedValues({ columns, rows, separator: '|' }), `${baseName}.psv`, 'text/plain;charset=utf-8')
    return
  }

  downloadBlob(buildSeparatedValues({ columns, rows, separator: ';' }), `${baseName}.csv`, 'text/csv;charset=utf-8')
}
