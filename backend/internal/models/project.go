package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Project struct {
	ID         string    `gorm:"primaryKey"                              json:"id"`
	Name       string    `gorm:"not null;uniqueIndex:idx_owner_name"      json:"name"`
	OwnerEmail string    `gorm:"not null;uniqueIndex:idx_owner_name"      json:"owner_email"`
	CreatedAt  time.Time `                                                json:"created_at"`
	UpdatedAt  time.Time `                                                json:"updated_at"`
}

func (p *Project) BeforeCreate(_ *gorm.DB) error {
	p.ID = uuid.New().String()
	return nil
}
