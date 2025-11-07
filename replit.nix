{ pkgs }: {
  deps = [
    pkgs.redis
    pkgs.gcc-unwrapped
    pkgs.python311
    pkgs.python311Packages.pip
    pkgs.postgresql
    pkgs.nodejs_20
    pkgs.nodePackages.npm
    pkgs.bash
    pkgs.git
  ];
}
