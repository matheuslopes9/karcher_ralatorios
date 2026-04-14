package models

import "time"

type SavedReport struct {
	ID            string    `json:"id" db:"id"`
	Name          string    `json:"name" db:"name"`
	Description   string    `json:"description" db:"description"`
	Filters       string    `json:"filters" db:"filters"`
	Columns       string    `json:"columns" db:"columns"`
	CreatedBy     string    `json:"created_by" db:"created_by"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
	LastGenerated time.Time `json:"last_generated" db:"last_generated"`
	Schedule      string    `json:"schedule" db:"schedule"`
	FormatDefault string    `json:"format_default" db:"format_default"`
}

type CreateReportInput struct {
	Name          string   `json:"name"`
	Description   string   `json:"description"`
	Filters       map[string]interface{} `json:"filters"`
	Columns       []string `json:"columns"`
	Schedule      string   `json:"schedule"`
	FormatDefault string   `json:"format_default"`
}
