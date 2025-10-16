; Inno Setup script for Konsultabot
[Setup]
AppName=Konsultabot
AppVersion=1.0
DefaultDirName={pf}\Konsultabot
DisableProgramGroupPage=yes
OutputBaseFilename=KonsultabotInstaller
Compression=lzma
SolidCompression=yes

[Files]
Source: "dist\Konsultabot.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "VOICE_SETUP.md"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\Konsultabot"; Filename: "{app}\Konsultabot.exe"
Name: "{commondesktop}\Konsultabot"; Filename: "{app}\Konsultabot.exe"

[Run]
Filename: "{app}\Konsultabot.exe"; Description: "Run Konsultabot"; Flags: nowait postinstall
