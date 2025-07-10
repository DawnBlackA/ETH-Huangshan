package models

import (
	"time"

	"gorm.io/gorm"
)

const StcDatasetJoinConfirmedTx = `
JOIN blockchain_transactions bt
ON bt.entity_id = static_datasets.id
   AND bt.status = ?
   AND bt.entity_type = ?
`

type StaticDataset struct {
	ID           uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	Name         string    `gorm:"type:varchar(255);not null;uniqueIndex:idx_name" json:"name"`
	UiName       string    `gorm:"type:varchar(255);not null;uniqueIndex:idx_ui_name" json:"ui_name"`
	Desc         string    `gorm:"type:text" json:"desc"`
	FileHash     string    `gorm:"type:varchar(64);not null;uniqueIndex:idx_file_hash" json:"file_hash"` // SHA-256 hash of original file for deduplication
	IpfsCid      string    `gorm:"type:varchar(255);not null" json:"ipfs_cid"`
	FileSize     int64     `gorm:"bigint;not null" json:"file_size"`
	FileFormat   string    `gorm:"type:varchar(50);not null" json:"file_format"` // csv, json, parquet...
	Author       string    `gorm:"type:varchar(255)" json:"author"`
	AuthorWallet string    `gorm:"type:varchar(255);not null;index:idx_author_wallet" json:"author_wallet"`
	SampleUrl    string    `gorm:"type:varchar(255)" json:"sample_url"`
	FilePath     string    `gorm:"type:varchar(255)" json:"file_path"`
	CreatedAt    time.Time `gorm:"autoCreateTime;index:idx_created_at" json:"created_at"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime" json:"updated_at"`
	// Tags    string `gorm:"type:text" json:"tags"`            // separated by commas
	// Version string `gorm:"type:varchar(50)" json:"version"`
	// License string `gorm:"type:varchar(100)" json:"license"`
}

type CreateStcDatasetReq struct {
	Name         string `json:"name"`
	UiName       string `json:"ui_name"`
	Desc         string `json:"desc"`
	FileHash     string `json:"file_hash"`
	IpfsCid      string `json:"ipfs_cid"`
	FileSize     int64  `json:"file_size"`
	FileFormat   string `json:"file_format"`
	Author       string `json:"author"`
	AuthorWallet string `json:"author_wallet"`
	SampleUrl    string `json:"sample_url"`
	FilePath     string `json:"file_path"`
}

func CreateStcDataset(db *gorm.DB, req CreateStcDatasetReq) (*StaticDataset, error) {
	asset := StaticDataset{
		Name:         req.Name,
		UiName:       req.UiName,
		Desc:         req.Desc,
		FileHash:     req.FileHash,
		IpfsCid:      req.IpfsCid,
		FileSize:     req.FileSize,
		FileFormat:   req.FileFormat,
		Author:       req.Author,
		AuthorWallet: req.AuthorWallet,
		SampleUrl:    req.SampleUrl,
		FilePath:     req.FilePath,
		// Tags:       req.Tags,
		// Version:    req.Version,
		// License:    req.License,
	}
	err := db.Create(&asset).Error
	if err != nil {
		return nil, err
	}
	return &asset, nil
}

func GetStcDataset(db *gorm.DB, page, pageSize int) ([]StaticDataset, int64, error) {
	var datasets []StaticDataset
	var total int64

	tx := db.Model(&StaticDataset{}).
		Joins(StcDatasetJoinConfirmedTx, TX_STATUS_CONFIRMED, ENTITY_TYPE_STATIC_DATASET)
	if err := tx.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := tx.Limit(pageSize).
		Offset((page - 1) * pageSize).
		Order("created_at DESC").
		Find(&datasets).Error
	return datasets, total, err
}

func GetStcDatasetByID(db *gorm.DB, id uint) (*StaticDataset, error) {
	var dataset StaticDataset
	err := db.Model(&StaticDataset{}).
		Joins(StcDatasetJoinConfirmedTx, TX_STATUS_CONFIRMED, ENTITY_TYPE_STATIC_DATASET).
		First(&dataset, id).Error
	if err != nil {
		return nil, err
	}
	return &dataset, err
}

func GetStcDatasetByHash(db *gorm.DB, hash string) (*StaticDataset, error) {
	var dataset StaticDataset
	err := db.Model(&StaticDataset{}).
		Joins(StcDatasetJoinConfirmedTx, TX_STATUS_CONFIRMED, ENTITY_TYPE_STATIC_DATASET).
		Where("file_hash = ?", hash).
		First(&dataset).Error
	if err != nil {
		return nil, err
	}
	return &dataset, err
}

func GetStcDatasetByName(db *gorm.DB, name string) (*StaticDataset, error) {
	var dataset StaticDataset
	err := db.Model(&StaticDataset{}).
		Joins(StcDatasetJoinConfirmedTx, TX_STATUS_CONFIRMED, ENTITY_TYPE_STATIC_DATASET).
		Where("name = ?", name).
		First(&dataset).Error
	if err != nil {
		return nil, err
	}
	return &dataset, err
}

func UpdateStcDataset(db *gorm.DB, id uint, uiName, name, desc string) (*StaticDataset, error) {
	updates := map[string]any{
		"ui_name": uiName,
		"name":    name,
		"desc":    desc,
	}
	err := db.Model(&StaticDataset{}).
		Joins(StcDatasetJoinConfirmedTx, TX_STATUS_CONFIRMED, ENTITY_TYPE_STATIC_DATASET).
		Where("id = ?", id).Updates(updates).Error
	if err != nil {
		return nil, err
	}

	dataset := StaticDataset{}
	err = db.First(&dataset, id).Error
	return &dataset, err
}

func DeleteStcDataset(db *gorm.DB, id uint) error {
	result := db.Delete(&StaticDataset{}, id)
	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}
