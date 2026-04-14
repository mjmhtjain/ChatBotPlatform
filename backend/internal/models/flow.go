package models

import (
	"database/sql/driver"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// RawJSON persists arbitrary JSON in a PostgreSQL JSONB column without parsing it.
type RawJSON []byte

func (r RawJSON) Value() (driver.Value, error) {
	if len(r) == 0 {
		return nil, nil
	}
	return []byte(r), nil
}

func (r *RawJSON) Scan(value interface{}) error {
	if value == nil {
		*r = nil
		return nil
	}
	switch v := value.(type) {
	case []byte:
		*r = make([]byte, len(v))
		copy(*r, v)
		return nil
	case string:
		*r = []byte(v)
		return nil
	}
	return fmt.Errorf("RawJSON: cannot scan %T", value)
}

func (r RawJSON) MarshalJSON() ([]byte, error) {
	if len(r) == 0 {
		return []byte("null"), nil
	}
	return r, nil
}

func (r *RawJSON) UnmarshalJSON(data []byte) error {
	if r == nil {
		return errors.New("RawJSON: UnmarshalJSON on nil pointer")
	}
	*r = data
	return nil
}

type Flow struct {
	ID        string    `gorm:"primaryKey"                               json:"id"`
	ProjectID string    `gorm:"not null;uniqueIndex:idx_flow_proj_name"  json:"project_id"`
	Name      string    `gorm:"not null;uniqueIndex:idx_flow_proj_name"  json:"name"`
	Data      RawJSON   `gorm:"type:jsonb"                               json:"data"`
	CreatedAt time.Time `                                                json:"created_at"`
	UpdatedAt time.Time `                                                json:"updated_at"`
}

func (f *Flow) BeforeCreate(_ *gorm.DB) error {
	f.ID = uuid.New().String()
	return nil
}
