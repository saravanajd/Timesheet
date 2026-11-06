import {
  collection,
  documentId,
  getDocs,
  query,
  where,
} from 'firebase/firestore'
import { db } from './firebase'
import { buildExportRows } from './exportRows'
import {
  clampRange,
  formatMonthLabel,
  monthRange,
  type AllowedWindow,
} from './workday'

const EXCEL_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export async function exportMonthExcel(
  uid: string,
  selectedKey: string,
  autoHours: number,
  window: AllowedWindow,
): Promise<void> {
  if (!db) throw new Error('Firestore is not configured.')

  const range = clampRange(monthRange(selectedKey), window)
  if (!range) throw new Error('The selected month is outside the allowed window.')

  const daysQuery = query(
    collection(db, 'users', uid, 'days'),
    where(documentId(), '>=', range.startKey),
    where(documentId(), '<=', range.endKey),
  )
  const snapshot = await getDocs(daysQuery)
  const days = Object.fromEntries(
    snapshot.docs.map((dayDocument) => {
      const data = dayDocument.data()
      return [
        dayDocument.id,
        {
          tasks: Array.isArray(data.tasks)
            ? data.tasks.filter(
                (task): task is string =>
                  typeof task === 'string' && task.trim().length > 0,
              )
            : [],
          hoursOverride:
            typeof data.hoursOverride === 'number' &&
            Number.isFinite(data.hoursOverride)
              ? data.hoursOverride
              : null,
        },
      ]
    }),
  )
  const { rows, total } = buildExportRows(days, autoHours)

  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  const monthTitle = formatMonthLabel(selectedKey)
  const worksheet = workbook.addWorksheet(monthTitle)
  worksheet.columns = [
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Day', key: 'weekday', width: 8 },
    { header: 'Tasks', key: 'tasks', width: 70 },
    { header: 'Hours', key: 'hours', width: 8 },
  ]
  worksheet.views = [{ state: 'frozen', ySplit: 1 }]

  for (const row of rows) {
    worksheet.addRow({
      ...row,
      tasks: row.tasks.join('\n'),
    })
  }

  const totalRowNumber = rows.length + 2
  const totalFormula =
    rows.length > 0 ? `SUM(D2:D${totalRowNumber - 1})` : 'SUM(0)'
  worksheet.addRow(['Total', '', '', { formula: totalFormula, result: total }])

  worksheet.eachRow((row) => {
    row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
      cell.alignment = { vertical: 'top', wrapText: columnNumber === 3 }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      }
    })
  })

  const header = worksheet.getRow(1)
  header.font = { bold: true }
  header.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8F0FE' },
  }

  const totalRow = worksheet.getRow(totalRowNumber)
  totalRow.font = { bold: true }
  totalRow.getCell(4).numFmt = '0.##'

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer as ArrayBuffer], { type: EXCEL_MIME_TYPE })
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = `Timesheet-${selectedKey.slice(0, 7)}.xlsx`
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  try {
    anchor.click()
  } finally {
    anchor.remove()
    globalThis.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
  }
}
