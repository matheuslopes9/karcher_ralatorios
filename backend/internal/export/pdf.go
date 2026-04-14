package export

import (
	"fmt"

	"karcher-analytics/internal/results"

	"github.com/johnfercher/maroto/v2"
	"github.com/johnfercher/maroto/v2/pkg/components/col"
	"github.com/johnfercher/maroto/v2/pkg/components/line"
	"github.com/johnfercher/maroto/v2/pkg/components/row"
	"github.com/johnfercher/maroto/v2/pkg/components/text"
	"github.com/johnfercher/maroto/v2/pkg/config"
	"github.com/johnfercher/maroto/v2/pkg/consts/align"
	"github.com/johnfercher/maroto/v2/pkg/consts/fontstyle"
	"github.com/johnfercher/maroto/v2/pkg/consts/orientation"
	"github.com/johnfercher/maroto/v2/pkg/consts/pagesize"
	"github.com/johnfercher/maroto/v2/pkg/props"
)

var (
	pYellow    = &props.Color{Red: 255, Green: 209, Blue: 0}
	pDarkBg    = &props.Color{Red: 26, Green: 26, Blue: 36}
	pWhite     = &props.Color{Red: 255, Green: 255, Blue: 255}
	pLightGray = &props.Color{Red: 245, Green: 245, Blue: 248}
	pGreen     = &props.Color{Red: 34, Green: 197, Blue: 94}
	pRed       = &props.Color{Red: 239, Green: 68, Blue: 68}
	pGray      = &props.Color{Red: 120, Green: 120, Blue: 150}
)

func ToPDF(summary *results.ReportSummary) ([]byte, error) {
	cfg := config.NewBuilder().
		WithOrientation(orientation.Horizontal).
		WithPageSize(pagesize.A4).
		WithLeftMargin(10).
		WithRightMargin(10).
		WithTopMargin(12).
		WithBottomMargin(10).
		Build()

	m := maroto.New(cfg)

	// ── Header ────────────────────────────────────────────────
	m.AddRows(
		row.New(12).Add(
			col.New(8).Add(
				text.New("KÄRCHER ANALYTICS", props.Text{
					Size:  16,
					Style: fontstyle.Bold,
					Color: pYellow,
					Align: align.Left,
				}),
			),
			col.New(4).Add(
				text.New(
					fmt.Sprintf("%s  →  %s",
						summary.From.Format("02/01/2006"),
						summary.To.Format("02/01/2006"),
					),
					props.Text{
						Size:  8,
						Color: pGray,
						Align: align.Right,
					},
				),
			),
		),
		row.New(2).Add(
			col.New(12).Add(
				line.New(props.Line{Color: pYellow, Thickness: 0.8}),
			),
		),
		row.New(3),
	)

	// ── KPI cards ────────────────────────────────────────────
	kpiData := []struct{ label, value string }{
		{"Total", fmt.Sprintf("%d", summary.TotalResults)},
		{"Completados", fmt.Sprintf("%d", summary.CompletedCount)},
		{"Incompletos", fmt.Sprintf("%d", summary.IncompleteCount)},
		{"Taxa de Conclusão", fmt.Sprintf("%.1f%%", summary.CompletionRate)},
	}

	kRow := row.New(18)
	for _, kpi := range kpiData {
		kRow.Add(
			col.New(3).
				WithStyle(&props.Cell{BackgroundColor: pDarkBg}).
				Add(
					text.New(kpi.value, props.Text{
						Size:  15,
						Style: fontstyle.Bold,
						Color: pWhite,
						Align: align.Center,
						Top:   2,
					}),
					text.New(kpi.label, props.Text{
						Size:  7,
						Color: pGray,
						Align: align.Center,
						Top:   11,
					}),
				),
		)
	}
	m.AddRows(kRow, row.New(5))

	// ── Top campos ────────────────────────────────────────────
	if len(summary.TopFields) > 0 {
		m.AddRow(7, col.New(12).Add(
			text.New("CAMPOS MAIS RESPONDIDOS", props.Text{
				Size:  8,
				Style: fontstyle.Bold,
				Color: pYellow,
			}),
		))

		maxCount := 1
		if summary.TopFields[0].Count > 0 {
			maxCount = summary.TopFields[0].Count
		}

		for _, f := range summary.TopFields {
			if f.FieldKey == "" {
				continue
			}
			barWidth := int(float64(f.Count) / float64(maxCount) * 8)
			if barWidth < 1 {
				barWidth = 1
			}

			r := row.New(5)
			r.Add(col.New(2).Add(
				text.New(labelOf(f.FieldKey), props.Text{Size: 7, Color: pGray}),
			))
			r.Add(col.New(barWidth).WithStyle(&props.Cell{BackgroundColor: pYellow}))
			r.Add(col.New(1).Add(
				text.New(fmt.Sprintf("%d", f.Count), props.Text{Size: 7, Color: pGray, Align: align.Right}),
			))
			m.AddRows(r)
		}
		m.AddRow(5)
	}

	// ── Data table ────────────────────────────────────────────
	if len(summary.Rows) > 0 {
		cols := collectColumns(summary.Rows)
		if len(cols) > 4 {
			cols = cols[:4]
		}
		numCols := len(cols) + 2 // date + status + data cols
		colW := 12 / numCols

		m.AddRow(7, col.New(12).Add(
			text.New("DETALHAMENTO DAS RESPOSTAS", props.Text{
				Size:  8,
				Style: fontstyle.Bold,
				Color: pYellow,
			}),
		))

		// Header
		hRow := row.New(7)
		hRow.Add(col.New(colW).WithStyle(&props.Cell{BackgroundColor: pDarkBg}).Add(
			text.New("Data/Hora", props.Text{Size: 7, Style: fontstyle.Bold, Color: pWhite}),
		))
		hRow.Add(col.New(colW).WithStyle(&props.Cell{BackgroundColor: pDarkBg}).Add(
			text.New("Status", props.Text{Size: 7, Style: fontstyle.Bold, Color: pWhite}),
		))
		for _, c := range cols {
			hRow.Add(col.New(colW).WithStyle(&props.Cell{BackgroundColor: pDarkBg}).Add(
				text.New(labelOf(c), props.Text{Size: 7, Style: fontstyle.Bold, Color: pWhite}),
			))
		}
		m.AddRows(hRow)

		// Rows (max 100)
		limit := 100
		if len(summary.Rows) < limit {
			limit = len(summary.Rows)
		}
		for i, r := range summary.Rows[:limit] {
			bg := pWhite
			if i%2 == 1 {
				bg = pLightGray
			}
			statusTxt := "Incompleto"
			statusColor := pRed
			if r.IsCompleted {
				statusTxt = "Completo"
				statusColor = pGreen
			}

			dRow := row.New(5)
			dRow.Add(col.New(colW).WithStyle(&props.Cell{BackgroundColor: bg}).Add(
				text.New(r.CreatedAt, props.Text{Size: 6, Color: pGray}),
			))
			dRow.Add(col.New(colW).WithStyle(&props.Cell{BackgroundColor: bg}).Add(
				text.New(statusTxt, props.Text{Size: 6, Color: statusColor}),
			))
			for _, c := range cols {
				val := r.Fields[c]
				if len(val) > 24 {
					val = val[:24] + "…"
				}
				dRow.Add(col.New(colW).WithStyle(&props.Cell{BackgroundColor: bg}).Add(
					text.New(val, props.Text{Size: 6, Color: pGray}),
				))
			}
			m.AddRows(dRow)
		}

		if len(summary.Rows) > 100 {
			m.AddRow(6, col.New(12).Add(
				text.New(
					fmt.Sprintf("... e mais %d registros. Exporte em Excel para ver todos.", len(summary.Rows)-100),
					props.Text{Size: 7, Color: pGray, Align: align.Center},
				),
			))
		}
	}

	// ── Footer ───────────────────────────────────────────────
	m.AddRows(
		row.New(4),
		row.New(2).Add(col.New(12).Add(
			line.New(props.Line{Color: pDarkBg, Thickness: 0.3}),
		)),
		row.New(5).Add(col.New(12).Add(
			text.New("Gerado por Kärcher Analytics · UC Technology do Brasil",
				props.Text{Size: 7, Color: pGray, Align: align.Center},
			),
		)),
	)

	doc, err := m.Generate()
	if err != nil {
		return nil, fmt.Errorf("pdf generation: %w", err)
	}

	return doc.GetBytes(), nil
}
