[Setup]
; General
AppName=SDID Enrollment Client
AppVersion=0.1.0
AppPublisher=HuzaLabs Ltd.
AppPublisherURL=https://huzalabs.com

; Installer icon
SetupIconFile=nativefier\icon.ico

; Install location
DefaultDirName={commonpf}\SDID Enrollment Client
DefaultGroupName=SDID Enrollment Client

; Requires elevation to write to Program Files
PrivilegesRequired=admin

; Enable logging of the install and uninstall
SetupLogging=yes
UninstallLogging=yes

; Output
OutputDir=releases
OutputBaseFilename=sdid-client-0.1.0
Compression=lzma
SolidCompression=yes

[Dirs]
; Logs folder
Name: "{app}\logs"

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
; Copy the entire nativefier output folder into {app}
Source: "nativefier\SDID Enrollment Client-win32-x64\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs ignoreversion

[Icons]
; Start Menu shortcut
Name: "{group}\SDID Enrollment Client"; Filename: "{app}\SDID Enrollment Client.exe"; WorkingDir: "{app}"
; Desktop shortcut
Name: "{commondesktop}\SDID Enrollment Client"; Filename: "{app}\SDID Enrollment Client.exe"; WorkingDir: "{app}"

[Run]
; Offer to launch at end of setup
Filename: "{app}\SDID Enrollment Client.exe"; Description: "Launch SDID Enrollment Client"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
; Clean up logs on uninstall
Type: filesandordirs; Name: "{app}\logs"
