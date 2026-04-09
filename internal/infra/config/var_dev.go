//go:build !release
package config

import (
	"os"
)

var (
	WorkDir string
	Mode string
)

func initVar() {
	Mode = "debug"

	var (
		wd  string
		err error
	)
	if wd, err = os.Getwd(); err != nil {
		panic(err)
	}
	WorkDir = wd
}