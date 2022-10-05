{ pkgs }: {
  deps = with pkgs; [
    nodejs-17_x
		libuuid
  ];
	env = { LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [pkgs.libuuid]; };
}