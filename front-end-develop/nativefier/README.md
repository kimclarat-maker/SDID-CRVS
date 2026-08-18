# Native App Installation

Go into the `nativefier` directory, and follow the steps below depending on the target plaatform.

## Windows

```pwsh
npx nativefier@latest "https://sdid.enrollment.dev.nida.gov.rw" `
  --name "SDID Enrollment Client" `
  --platform win32 --arch x64 `
  --icon icon.ico
```

## Mac

```bash
npx nativefier@latest "https://sdid.enrollment.dev.nida.gov.rw" \
  --name "SDID Enrollment Client" \
  --platform mac --arch arm64 \
  --icon icon.ico
```

```bash
npx nativefier@latest "https://sdid.enrollment.dev.nida.gov.rw" \
  --name "SDID Enrollment Client" \
  --platform mac --arch x64 \
  --icon icon.ico
```

```bash
npx electron-installer-dmg@latest \
  "SDID Enrollment Client-darwin-x64/SDID Enrollment Client.app" \
  "sdid-client_x64" \
  --out=mac-out \
  --icon=icon.ico \
  --overwrite
```

```bash
npx electron-installer-dmg@latest \
  "SDID Enrollment Client-darwin-arm64/SDID Enrollment Client.app" \
  "sdid-client_arm64" \
  --out=mac-out \
  --icon=icon.ico \
  --overwrite
```
