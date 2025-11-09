{ pkgs }: {
  deps = [
    pkgs.python311
    pkgs.python311Packages.pip
    pkgs.python311Packages.setuptools
    pkgs.nodejs_20
    pkgs.nodePackages.npm
    pkgs.bash
    pkgs.gcc
    pkgs.stdenv.cc.cc.lib
  ];
}
