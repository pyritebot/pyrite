{ pkgs }: {
  deps = with pkgs; [
		esbuild
    nodejs-17_x
		
		nodePackages.typescript
		nodePackages.typescript-language-server
		
		fontconfig
  ];
	env = { LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [pkgs.fontconfig]; };
}