package models

import (
	"testing"
)

func TestBeforeCreate_PreservesExistingID(t *testing.T) {
	p := &Project{ID: "custom-id"}
	if err := p.BeforeCreate(nil); err != nil {
		t.Fatal(err)
	}
	if p.ID != "custom-id" {
		t.Errorf("expected ID to be preserved as 'custom-id', got %q", p.ID)
	}
}

func TestBeforeCreate_GeneratesIDWhenEmpty(t *testing.T) {
	p := &Project{}
	if err := p.BeforeCreate(nil); err != nil {
		t.Fatal(err)
	}
	if p.ID == "" {
		t.Error("expected a UUID to be generated, got empty string")
	}
}
