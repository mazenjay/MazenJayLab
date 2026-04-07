//go:build release

package config

import (
	"os"
	"path/filepath"
)

var (
	WorkDir string
	Mode    string
)

func initVar() {
	Mode = "release"

	exePath, err := os.Executable()
	if err != nil {
		panic(err)
	}
	//  ~/.mjlab/bin/mjlab
	binDir := filepath.Dir(exePath) // ~/.mjlab/bin
	WorkDir = filepath.Dir(binDir)  // ~/.mjlab
}
