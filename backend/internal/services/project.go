package services

import (
	"errors"
	"strings"

	"gorm.io/gorm"

	"github.com/mjmhtjain/ChatBotPlatform/backend/internal/models"
)

var (
	ErrDuplicateName = errors.New("project name already exists")
	ErrNotFound      = errors.New("project not found")
)

type ProjectService struct {
	db *gorm.DB
}

func NewProjectService(db *gorm.DB) *ProjectService {
	return &ProjectService{db: db}
}

func (s *ProjectService) Create(ownerEmail, name string) (*models.Project, error) {
	p := &models.Project{Name: name, OwnerEmail: ownerEmail}
	if err := s.db.Create(p).Error; err != nil {
		if isDuplicate(err) {
			return nil, ErrDuplicateName
		}
		return nil, err
	}
	return p, nil
}

func (s *ProjectService) List(ownerEmail string) ([]models.Project, error) {
	var projects []models.Project
	err := s.db.
		Where("owner_email = ?", ownerEmail).
		Order("created_at desc").
		Find(&projects).Error
	return projects, err
}

func (s *ProjectService) Rename(ownerEmail, id, name string) (*models.Project, error) {
	var p models.Project
	if err := s.db.Where("id = ? AND owner_email = ?", id, ownerEmail).First(&p).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	p.Name = name
	if err := s.db.Save(&p).Error; err != nil {
		if isDuplicate(err) {
			return nil, ErrDuplicateName
		}
		return nil, err
	}
	return &p, nil
}

func (s *ProjectService) Delete(ownerEmail, id string) error {
	result := s.db.Where("id = ? AND owner_email = ?", id, ownerEmail).Delete(&models.Project{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return nil
}

// isDuplicate detects unique constraint violations from PostgreSQL.
func isDuplicate(err error) bool {
	if errors.Is(err, gorm.ErrDuplicatedKey) {
		return true
	}
	return strings.Contains(err.Error(), "23505")
}
