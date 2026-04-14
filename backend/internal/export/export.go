package export

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"strings"

	"karcher-analytics/internal/results"

	"github.com/xuri/excelize/v2"
)

// Ordered list of fields to use as columns (fallback to dynamic if empty)
var preferredFields = []string{
	"nome", "email", "telefone", "cpf", "cnpj",
	"codigo_servico", "numero_serie", "modelo", "tipo_produto",
	"problema", "descricao", "data_compra", "nota_fiscal",
	"cidade", "estado", "cep", "endereco",
}

var fieldLabels = map[string]string{
	"nome":           "Nome",
	"email":          "E-mail",
	"telefone":       "Telefone",
	"cpf":            "CPF",
	"cnpj":           "CNPJ",
	"codigo_servico": "Código de Serviço",
	"numero_serie":   "Número de Série",
	"modelo":         "Modelo",
	"tipo_produto":   "Tipo de Produto",
	"problema":       "Problema Relatado",
	"descricao":      "Descrição",
	"data_compra":    "Data de Compra",
	"nota_fiscal":    "Nota Fiscal",
	"cidade":         "Cidade",
	"estado":         "Estado",
	"cep":            "CEP",
	"endereco":       "Endereço",
}

func labelOf(key string) string {
	if l, ok := fieldLabels[key]; ok {
		return l
	}
	return strings.ReplaceAll(strings.Title(strings.ReplaceAll(key, "_", " ")), "_", " ")
}

// collectColumns returns ordered unique column keys present in the rows
func collectColumns(rows []results.ReportRow) []string {
	present := map[string]bool{}
	for _, r := range rows {
		for k := range r.Fields {
			present[k] = true
		}
	}

	var cols []string
	// First add preferred fields that exist in data
	for _, f := range preferredFields {
		if present[f] {
			cols = append(cols, f)
			delete(present, f)
		}
	}
	// Then any remaining fields not in preferred list
	for k := range present {
		cols = append(cols, k)
	}
	return cols
}

// ToCSV generates a UTF-8 CSV with BOM for Excel compatibility
func ToCSV(summary *results.ReportSummary) ([]byte, error) {
	var buf bytes.Buffer
	// UTF-8 BOM so Excel opens correctly
	buf.WriteString("\xEF\xBB\xBF")

	w := csv.NewWriter(&buf)
	w.Comma = ';'

	cols := collectColumns(summary.Rows)

	// Header
	header := []string{"Data/Hora", "Status"}
	for _, c := range cols {
		header = append(header, labelOf(c))
	}
	w.Write(header)

	for _, row := range summary.Rows {
		status := "Incompleto"
		if row.IsCompleted {
			status = "Completado"
		}
		record := []string{row.CreatedAt, status}
		for _, c := range cols {
			record = append(record, row.Fields[c])
		}
		w.Write(record)
	}

	w.Flush()
	return buf.Bytes(), w.Error()
}

// ToXLSX generates an Excel workbook
func ToXLSX(summary *results.ReportSummary) ([]byte, error) {
	f := excelize.NewFile()
	defer f.Close()

	// ── Summary sheet ──────────────────────────────────────────
	f.SetSheetName("Sheet1", "Resumo")
	sheet := "Resumo"

	// Styles
	titleStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Size: 14, Color: "0A0A0F"},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"FFD100"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center"},
	})
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Color: "FFFFFF"},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"1A1A2E"}, Pattern: 1},
	})
	labelStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Color: "555555"},
	})
	completedStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Color: "22C55E"},
	})
	incompleteStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Color: "EF4444"},
	})

	// Title
	f.MergeCell(sheet, "A1", "D1")
	f.SetCellValue(sheet, "A1", "Relatório Kärcher Analytics")
	f.SetCellStyle(sheet, "A1", "D1", titleStyle)
	f.SetRowHeight(sheet, 1, 28)

	// Period
	f.SetCellValue(sheet, "A3", "Período:")
	f.SetCellStyle(sheet, "A3", "A3", labelStyle)
	f.SetCellValue(sheet, "B3", fmt.Sprintf("%s  →  %s",
		summary.From.Format("02/01/2006"),
		summary.To.Format("02/01/2006"),
	))

	// KPIs
	kpis := [][]interface{}{
		{"Total de Respostas", summary.TotalResults},
		{"Completados", summary.CompletedCount},
		{"Incompletos", summary.IncompleteCount},
		{"Taxa de Conclusão", fmt.Sprintf("%.1f%%", summary.CompletionRate)},
	}
	for i, kpi := range kpis {
		row := 5 + i
		f.SetCellValue(sheet, fmt.Sprintf("A%d", row), kpi[0])
		f.SetCellStyle(sheet, fmt.Sprintf("A%d", row), fmt.Sprintf("A%d", row), labelStyle)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", row), kpi[1])
	}

	// Col widths for summary
	f.SetColWidth(sheet, "A", "A", 26)
	f.SetColWidth(sheet, "B", "D", 18)

	// ── Data sheet ─────────────────────────────────────────────
	dataSheet := "Dados"
	f.NewSheet(dataSheet)

	cols := collectColumns(summary.Rows)

	// Header row
	headers := []string{"Data/Hora", "Status"}
	for _, c := range cols {
		headers = append(headers, labelOf(c))
	}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(dataSheet, cell, h)
		f.SetCellStyle(dataSheet, cell, cell, headerStyle)
	}
	f.SetRowHeight(dataSheet, 1, 22)

	// Data rows
	for ri, row := range summary.Rows {
		rowNum := ri + 2
		status := "Incompleto"
		if row.IsCompleted {
			status = "Completado"
		}
		values := []string{row.CreatedAt, status}
		for _, c := range cols {
			values = append(values, row.Fields[c])
		}
		for ci, v := range values {
			cell, _ := excelize.CoordinatesToCellName(ci+1, rowNum)
			f.SetCellValue(dataSheet, cell, v)
			if ci == 1 {
				if row.IsCompleted {
					f.SetCellStyle(dataSheet, cell, cell, completedStyle)
				} else {
					f.SetCellStyle(dataSheet, cell, cell, incompleteStyle)
				}
			}
		}
	}

	// Auto column widths (approximate)
	f.SetColWidth(dataSheet, "A", "A", 18)
	f.SetColWidth(dataSheet, "B", "B", 14)
	for i := range cols {
		col, _ := excelize.ColumnNumberToName(i + 3)
		f.SetColWidth(dataSheet, col, col, 20)
	}

	// Set active sheet to data
	idx, _ := f.GetSheetIndex(dataSheet)
	f.SetActiveSheet(idx)

	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}
