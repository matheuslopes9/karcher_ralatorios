package models

import "time"

type Answer struct {
	ID         string    `json:"id" db:"id"`
	ResultID   string    `json:"result_id" db:"result_id"`
	BlockID    string    `json:"block_id" db:"block_id"`
	StepID     string    `json:"step_id" db:"step_id"`
	FieldKey   string    `json:"field_key" db:"field_key"`
	FieldValue string    `json:"field_value" db:"field_value"`
	AnsweredAt time.Time `json:"answered_at" db:"answered_at"`
}
