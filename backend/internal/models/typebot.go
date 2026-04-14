package models

import "time"

type TypebotResult struct {
	ID            string    `json:"id" db:"id"`
	TypebotID     string    `json:"typebot_id" db:"typebot_id"`
	ResultID      string    `json:"result_id" db:"result_id"`
	CreatedAtBot  time.Time `json:"created_at_bot" db:"created_at_bot"`
	CollectedAt   time.Time `json:"collected_at" db:"collected_at"`
	IsCompleted   bool      `json:"is_completed" db:"is_completed"`
	DurationSecs  int       `json:"duration_secs" db:"duration_secs"`
	RawData       string    `json:"raw_data" db:"raw_data"`
	Processed     bool      `json:"processed" db:"processed"`
}

type TypebotResponse struct {
	ID         string                 `json:"id"`
	CreatedAt  string                 `json:"createdAt"`
	IsCompleted bool                  `json:"isCompleted"`
	Variables  map[string]interface{} `json:"variables"`
	Results    []TypebotBlockResult   `json:"results"`
}

type TypebotBlockResult struct {
	BlockID string      `json:"blockId"`
	Output  interface{} `json:"output"`
}
