# First Time Setup

This project uses Volta to manage the development toolchain.
## Windows

Run:
```powershell id="l95j2e"
powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1
```

---

## macOS / Linux

Run:
```bash id="kztjlwm"
chmod +x ./scripts/setup.sh
./scripts/setup.sh
```

---

# What the setup script does

* Installs Volta (if missing)
* Installs the correct Node.js version
* Installs the correct pnpm version
* Installs project dependencies

After setup completes, start the project with:

```bash id="3jlwm"
pnpm install
```
