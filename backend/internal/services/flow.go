package services

import (
	"errors"

	"gorm.io/gorm"

	"github.com/mjmhtjain/ChatBotPlatform/backend/internal/models"
)

var (
	ErrFlowNotFound      = errors.New("flow not found")
	ErrFlowDuplicateName = errors.New("flow name already exists")
)

type FlowService struct {
	db *gorm.DB
}

func NewFlowService(db *gorm.DB) *FlowService {
	return &FlowService{db: db}
}

// verifyProjectOwner returns ErrFlowNotFound if the project does not exist
// or does not belong to ownerEmail (prevents info leakage).
func (s *FlowService) verifyProjectOwner(ownerEmail, projectID string) error {
	var p models.Project
	err := s.db.Where("id = ? AND owner_email = ?", projectID, ownerEmail).First(&p).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrFlowNotFound
		}
		return err
	}
	return nil
}

func (s *FlowService) List(ownerEmail, projectID string) ([]models.Flow, error) {
	if err := s.verifyProjectOwner(ownerEmail, projectID); err != nil {
		return nil, err
	}
	var flows []models.Flow
	err := s.db.
		Where("project_id = ?", projectID).
		Select("id, project_id, name, created_at, updated_at"). // omit data blob
		Order("created_at desc").
		Find(&flows).Error
	return flows, err
}

func (s *FlowService) Create(ownerEmail, projectID, name string) (*models.Flow, error) {
	if err := s.verifyProjectOwner(ownerEmail, projectID); err != nil {
		return nil, err
	}
	f := &models.Flow{ProjectID: projectID, Name: name}
	if err := s.db.Create(f).Error; err != nil {
		if isDuplicate(err) {
			return nil, ErrFlowDuplicateName
		}
		return nil, err
	}
	return f, nil
}

func (s *FlowService) Get(ownerEmail, projectID, flowID string) (*models.Flow, error) {
	if err := s.verifyProjectOwner(ownerEmail, projectID); err != nil {
		return nil, err
	}
	var f models.Flow
	err := s.db.Where("id = ? AND project_id = ?", flowID, projectID).First(&f).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrFlowNotFound
		}
		return nil, err
	}
	return &f, nil
}

func (s *FlowService) Update(ownerEmail, projectID, flowID, name string, data models.RawJSON) (*models.Flow, error) {
	if err := s.verifyProjectOwner(ownerEmail, projectID); err != nil {
		return nil, err
	}
	var f models.Flow
	err := s.db.Where("id = ? AND project_id = ?", flowID, projectID).First(&f).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrFlowNotFound
		}
		return nil, err
	}
	f.Name = name
	if data != nil {
		f.Data = data
	}
	if err := s.db.Save(&f).Error; err != nil {
		if isDuplicate(err) {
			return nil, ErrFlowDuplicateName
		}
		return nil, err
	}
	return &f, nil
}

func (s *FlowService) Delete(ownerEmail, projectID, flowID string) error {
	if err := s.verifyProjectOwner(ownerEmail, projectID); err != nil {
		return err
	}
	result := s.db.Where("id = ? AND project_id = ?", flowID, projectID).Delete(&models.Flow{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrFlowNotFound
	}
	return nil
}
