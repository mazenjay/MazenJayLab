package db

type DatabaseConfig struct {
	Driver   string `mapstructure:"driver"`
	Source   string `mapstructure:"source"` // SQLite 使用这个字段
	Host     string `mapstructure:"host"`
	Port     string `mapstructure:"port"`
	User     string `mapstructure:"user"`
	Password string `mapstructure:"password"`
	DBName   string `mapstructure:"db_name"`
}
