package collector

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

type Client struct {
	db       *sql.DB
	apiURL   string
	apiToken string
	botSlug  string
	http     *http.Client
}

func NewClient(db *sql.DB, apiURL, apiToken, botSlug string) *Client {
	return &Client{
		db:       db,
		apiURL:   apiURL,
		apiToken: apiToken,
		botSlug:  botSlug,
		http:     &http.Client{Timeout: 30 * time.Second},
	}
}

// --- Typebot API response types ---

type ListResultsResponse struct {
	Results    []ResultItem `json:"results"`
	NextCursor *string      `json:"nextCursor"`
}

type ResultItem struct {
	ID          string         `json:"id"`
	CreatedAt   string         `json:"createdAt"`
	IsCompleted bool           `json:"isCompleted"`
	HasStarted  bool           `json:"hasStarted"`
	Answers     []AnswerItem   `json:"answers"`
	Variables   []VariableItem `json:"variables"`
}

type AnswerItem struct {
	BlockID  string `json:"blockId"`
	Content  string `json:"content"`
}

type VariableItem struct {
	ID    string      `json:"id"`
	Name  string      `json:"name"`
	Value interface{} `json:"value"`
}

// --- Collector ---

func (c *Client) Collect(ctx context.Context) error {
	log.Printf("[collector] Starting collection for bot: %s", c.botSlug)

	collected := 0
	skipped := 0
	var cursor string

	for {
		results, nextCursor, err := c.fetchPage(ctx, cursor)
		if err != nil {
			return fmt.Errorf("failed to fetch page: %w", err)
		}

		for _, r := range results {
			saved, err := c.saveResult(ctx, r)
			if err != nil {
				log.Printf("[collector] Error saving result %s: %v", r.ID, err)
				continue
			}
			if saved {
				collected++
			} else {
				skipped++
			}
		}

		if nextCursor == "" {
			break
		}
		cursor = nextCursor
	}

	log.Printf("[collector] Done: %d new, %d skipped", collected, skipped)
	return nil
}

func (c *Client) fetchPage(ctx context.Context, cursor string) ([]ResultItem, string, error) {
	url := fmt.Sprintf("%s/api/v1/typebots/%s/results?limit=100&timeFilter=allTime", c.apiURL, c.botSlug)
	if cursor != "" {
		url += "&cursor=" + cursor
	}

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, "", err
	}
	req.Header.Set("Authorization", "Bearer "+c.apiToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, "", fmt.Errorf("HTTP request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, "", fmt.Errorf("API returned %d: %s", resp.StatusCode, string(body))
	}

	var data ListResultsResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, "", fmt.Errorf("failed to decode response: %w", err)
	}

	var nextCursor string
	if data.NextCursor != nil {
		nextCursor = *data.NextCursor
	}
	return data.Results, nextCursor, nil
}

func (c *Client) saveResult(ctx context.Context, r ResultItem) (bool, error) {
	// Verifica se já existe
	var count int
	err := c.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM results WHERE result_id = $1`, r.ID).Scan(&count)
	if err != nil {
		return false, err
	}
	if count > 0 {
		return false, nil
	}

	// Parse createdAt — duração não disponível sem updatedAt, usa 0
	createdAt, _ := time.Parse(time.RFC3339, r.CreatedAt)

	// Serializa raw data
	rawData, _ := json.Marshal(r)

	// Insere resultado
	var resultDBID string
	err = c.db.QueryRowContext(ctx, `
		INSERT INTO results (typebot_id, result_id, created_at_bot, is_completed, duration_secs, raw_data)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id
	`, c.botSlug, r.ID, createdAt, r.IsCompleted, 0, string(rawData)).Scan(&resultDBID)
	if err != nil {
		return false, fmt.Errorf("insert result: %w", err)
	}

	// Salva variáveis como campos nomeados (nome legível ex: "nome", "codigo_servico")
	for _, v := range r.Variables {
		if v.Name == "" || v.Value == nil {
			continue
		}
		valStr := fmt.Sprintf("%v", v.Value)
		if valStr == "" || valStr == "<nil>" {
			continue
		}
		_, err := c.db.ExecContext(ctx, `
			INSERT INTO answers (result_id, block_id, field_key, field_value, answered_at)
			VALUES ($1, $2, $3, $4, $5)
		`, resultDBID, v.ID, v.Name, valStr, createdAt)
		if err != nil {
			log.Printf("[collector] Error saving variable for result %s: %v", r.ID, err)
		}
	}

	return true, nil
}

// GetMe retorna informações do usuário autenticado (inclui workspaces)
func (c *Client) GetMe(ctx context.Context) (string, error) {
	url := fmt.Sprintf("%s/api/v1/me", c.apiURL)
	req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
	req.Header.Set("Authorization", "Bearer "+c.apiToken)
	resp, err := c.http.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	return string(body), nil
}

// ListTypebots lista typebots do workspace
func (c *Client) ListTypebots(ctx context.Context, workspaceID string) (string, error) {
	url := fmt.Sprintf("%s/api/v1/typebots?workspaceId=%s", c.apiURL, workspaceID)
	req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
	req.Header.Set("Authorization", "Bearer "+c.apiToken)
	resp, err := c.http.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	return string(body), nil
}

// StartScheduler inicia coleta periódica
func (c *Client) StartScheduler(ctx context.Context, interval time.Duration) {
	log.Printf("[collector] Scheduler started, interval: %s", interval)

	// Coleta imediata no startup
	if err := c.Collect(ctx); err != nil {
		log.Printf("[collector] Initial collection error: %v", err)
	}

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			if err := c.Collect(ctx); err != nil {
				log.Printf("[collector] Scheduled collection error: %v", err)
			}
		case <-ctx.Done():
			log.Println("[collector] Scheduler stopped")
			return
		}
	}
}
