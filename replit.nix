
{pkgs}: {
  deps = [
    pkgs.chromium
    pkgs.glib
    pkgs.gtk3
    pkgs.dbus
    pkgs.xorg.libXi
    pkgs.xorg.libXcursor
    pkgs.xorg.libXdamage
    pkgs.xorg.libXrandr
    pkgs.xorg.libXcomposite
    pkgs.xorg.libXext
    pkgs.xorg.libXfixes
    pkgs.xorg.libXrender
    pkgs.xorg.libX11
    pkgs.xorg.libXtst
    pkgs.xorg.libXScrnSaver
    pkgs.nss
    pkgs.nspr
    pkgs.alsa-lib
    pkgs.cairo
    pkgs.pango
    pkgs.atk
  ];
}
