# NickShop Content Studio for Windows

## Download and open

Use **Windows 10 or Windows 11, 64-bit (x64)**. Download **`NickShop-Content-Studio-1.0.0-Windows.exe`** and double-click it. This is a portable application: no installation, Node.js, browser, terminal or web server is required. Keep the executable in a convenient folder and optionally create a Windows shortcut. The first launch may take a few moments while the bundled runtime is extracted.

An optional installable edition (`NickShop-Content-Studio-Setup-1.0.0.exe`) can be built by the Windows CI workflow. It creates Start menu and desktop shortcuts. A successful portable build does not imply that an installer was built.

The Windows executable is unsigned: Windows may identify the publisher as unknown. Only use the file from this project’s trusted delivery channel. Managed computers may require an administrator’s approval. The app does not bypass Windows security policies.

## What works offline

Products, product photos, editorial templates, visual concepts and prompts, the content library, calendar planning and exports work locally without an account. The example products are clearly marked as demonstration. Nothing is published to a social network automatically.

Data is stored in the Windows user’s app-data folder, in a profile dedicated to **NickShop Content Studio**. It survives closing and reopening the app and is kept when uninstalling. Do not delete this folder without exporting a backup first.

The web version and desktop version use separate storage. To transfer existing work, export the JSON backup from the web version’s Settings, then import it in desktop Settings. Data is not automatically synchronized across computers. Backups include product photos but never the Gemini key.

## Connect real AI

In **Paramètres → Connexions & confidentialité**, paste your Gemini API key and select **Enregistrer la clé**. The key is encrypted with Windows DPAPI and retained only on that computer under your Windows account. It is used by the app’s main process, never returned to the interface. No developer server is needed. The next generation uses Gemini; internet connectivity and available Gemini quota are required. A configured key is not a guarantee of valid access: run a generation to verify it. Remove it with **Déconnecter Gemini**.

The app does not generate AI images, publish to social networks or provide Supabase accounts. These remain future integrations. Review all marketing text before publishing.

## Exports and printing

CSV, ICS, text and JSON downloads open a native save dialog. The PDF export uses Windows printing: choose **Microsoft Print to PDF** if available. Standard Copy/Paste and Ctrl+P work from the app menu. The app only opens WhatsApp links externally; remote websites cannot replace the desktop interface.

## Build from source

Node.js 24 is recommended. On Windows:

```powershell
npm ci
npm run desktop
```

The Electron runtime is downloaded on first use. To build the portable executable:

```powershell
npm run desktop:windows:portable
```

To create an installer on Windows:

```powershell
npm run desktop:windows
```

The output is in `release/`. The GitHub Actions workflow **Windows desktop installer** can produce and retain an installer artifact on a real Windows runner via manual dispatch or a `v*` tag. Publishing to GitHub Releases and code signing are not configured.

For restricted cloud environments, use writable caches without changing HOME:

```sh
XDG_CACHE_HOME=/workspace/.cache electron_config_cache=/workspace/.electron-cache ELECTRON_BUILDER_CACHE=/workspace/.electron-builder-cache npm run desktop:windows
```

Cross-building the NSIS installer on Linux also requires Wine. A graphical display is needed to run the desktop runtime tests on Linux (for example Xvfb). Downloading the runtime directly with Node behind an HTTP proxy may require `node --use-env-proxy node_modules/electron/install.js`.

## Verification

- `npm run build`: TypeScript and production frontend.
- `npm test`: business rules and exports.
- `npm run test:e2e`: browser workflows with the local web server.
- `npm run test:desktop`: actual Electron launch, isolated renderer, local generation API, native connection settings and data persistence across a full restart. Run `npm run desktop:install-runtime` and `npm run build` first. This test uses a disposable user profile.

The desktop runtime uses a secure custom origin (`app://nickshop`), a sandboxed renderer, context isolation and a narrow validated IPC bridge. No local HTTP port is opened. API keys are not bundled. Only compiled frontend files and required desktop modules are packaged; source secrets, tests and development servers are excluded.
