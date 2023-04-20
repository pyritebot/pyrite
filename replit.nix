{ pkgs }: {
  deps = with pkgs; [
		esbuild
    nodejs-19_x
		
		nodePackages.typescript
		nodePackages.typescript-language-server
		
		fontconfig
		openssl_1_1
		glibc
  ];
	env = { LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [pkgs.fontconfig pkgs.openssl_1_1]; };
}