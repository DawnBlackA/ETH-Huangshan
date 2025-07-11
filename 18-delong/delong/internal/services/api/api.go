package api

import (
	"context"
	"delong/pkg/contracts"
	"delong/pkg/db"
	"delong/pkg/tee"
	"delong/pkg/ws"
	"log"
	"net/http"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/contrib/rest"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ApiService struct {
	name       string
	addr       string
	ctrAddr    map[string]common.Address
	engine     *gin.Engine
	httpserver *http.Server

	ApiServiceOptions
}

type ApiServiceOptions struct {
	Addr              string
	IpfsStore         *db.IpfsStore
	MysqlDb           *gorm.DB
	CtrCaller         *contracts.ContractCaller
	KeyVault          *tee.KeyVault
	Notifier          *ws.Notifier
	DiagnosticSrvAddr string
	UseJwt            bool
	JwtSecret         string
	SampleSrvAddr     string
}

func NewService(opts ApiServiceOptions) *ApiService {
	return &ApiService{
		name:              "api-service",
		addr:              opts.Addr,
		engine:            gin.Default(),
		ctrAddr:           map[string]common.Address{},
		httpserver:        &http.Server{},
		ApiServiceOptions: opts,
	}
}

func (s *ApiService) Name() string {
	return s.name
}

func (s *ApiService) Init(ctx context.Context) error {
	// CORS allow all
	s.engine.Use(cors.New(cors.Config{
		AllowAllOrigins:  true,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"},
		AllowHeaders:     []string{"*"},
		ExposeHeaders:    []string{"*"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	jwtMiddleware := NewJwtMiddleware(s.JwtSecret)

	// Register routes
	s.engine.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "healthy"})
	})
	s.engine.GET("/ws", ws.NewHandler(s.Notifier.Hub()))
	apiGroup := s.engine.Group("/api")

	apiGroup.Use(jwtMiddleware.Auth(s.UseJwt))

	datasets := &DatasetResource{s.ApiServiceOptions}
	rest.CRUD(apiGroup, "/datasets", datasets)

	testReports := &TestReportResource{s.ApiServiceOptions}
	rest.CRUD(apiGroup, "/reports", testReports)

	algos := &AlgoExeResource{s.ApiServiceOptions}
	rest.CRUD(apiGroup, "/algoexes", algos)

	committee := &CommitteeResource{s.ApiServiceOptions}
	rest.CRUD(apiGroup, "/committee", committee)
	apiGroup.GET("/committee/is-member", committee.IsCommitteeMember)

	votes := &VoteResource{s.ApiServiceOptions}
	rest.CRUD(apiGroup, "/votes", votes)
	apiGroup.POST("/set-voting-duration", votes.SetVotingDuration)

	metas := &ContractMetaResource{s.ApiServiceOptions}
	rest.CRUD(apiGroup, "/contracts", metas)

	stcDataset := &StaticDatasetResource{s.ApiServiceOptions}
	rest.CRUD(apiGroup, "/static-datasets", stcDataset)
	s.engine.GET("/api/sample/:cid", stcDataset.SampleHandler)

	return nil
}

func (s *ApiService) Start(ctx context.Context) error {
	s.httpserver = &http.Server{
		Addr:    s.addr,
		Handler: s.engine,
	}

	go func() {
		err := s.httpserver.ListenAndServe()
		if err != nil && err != http.ErrServerClosed {
			log.Printf("Failed to listen: %v", err)
		}
	}()

	log.Println("Api service started")
	<-ctx.Done()
	log.Println("API service context cancelled, will shut down")
	return nil
}

func (s *ApiService) Stop(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	err := s.httpserver.Shutdown(ctx)
	if err != nil {
		log.Printf("Failed to shutdown gracefully: %v", err)
		return err
	}

	log.Println("Http server shutdown cleanly")
	return nil
}
