# ESI-MS Charge-State Deconvolution Visualizer

This is a simple visual aid to help explain the mathematical principles of Electrospray Ionization (ESI-MS) charge deconvolution.

---

##Running Offline on Your Laptop

This application runs locally with zero external network or database dependencies.

### 1. Prerequisites
- Install **Node.js** (version 18 or higher) from [nodejs.org](https://nodejs.org/).
- Verify Node and npm are installed:
  ```bash
  node -v
  npm -v
  ```

---

### 2. Locate and Open the Project Directory

Open your command line application:
- **macOS:** Open **Terminal** (press `Cmd + Space`, type `Terminal`, hit Enter)
- **Windows:** Open **Command Prompt** (`cmd`) or **PowerShell** (or right-click the extracted folder and choose "Open in Terminal")
- **Linux:** Open your preferred shell

#### Navigate into the project folder:
You must be in the **root directory** of this project (the folder that contains `package.json`).

```bash
# If cloned via Git:
cd path/to/esi-deconvolution-visualizer

# If downloaded and unzipped (example paths):
# macOS / Linux:
cd ~/Downloads/esi-deconvolution-visualizer

# Windows:
cd C:\Users\YourUsername\Downloads\esi-deconvolution-visualizer
```

#### Verify you are in the correct directory:
Run:
```bash
# macOS / Linux:
ls -la

# Windows:
dir
```
You should see `package.json`, `index.html`, `vite.config.ts`, and the `src/` folder listed.

---

### 3. Install Dependencies (Run once while connected to internet)

From the project root directory, run:
```bash
npm install
```
This downloads all necessary local packages into a local `node_modules` folder on your device.

---

### 4. Start the Offline Dev Server

Whenever you want to run or interact with the app offline:
```bash
npm run dev
```

You will see output similar to:
```text
  VITE v6.2.3  ready in 250 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://0.0.0.0:3000/
  ➜  press h + enter to show help
```

---

### 5. Open in Browser

Open your browser and navigate to:
```
http://localhost:3000
```

All animations, playback controls, preset switchers, mathematical breakdowns, and the Manim script export run offline on your device.

---

### Optional: Production Build & Static Offline Viewing

If you want a compiled, ultra-fast static build:
```bash
npm run build
npm run preview
```
Open `http://localhost:3000` to interact with the production build.

---

## Project Structure & Making Edits

| File / Folder | Purpose |
| :--- | :--- |
| `src/components/AnimationCanvas.tsx` | HTML5 Canvas engine rendering trajectories, harmonic stacks, and math cards at 60fps. |
| `src/data/presets.ts` | Molecular mass presets (e.g. 24,000 Da analyte, Myoglobin, BSA, Antibodies). |
| `src/components/TheorySection.tsx` | Algebraic derivation of charge state identification and harmonic alias explanations. |
| `src/components/PeakInspector.tsx` | Interactive single-peak selector with trial hypothesis validation grid. |
| `src/data/manimCodeSource.ts` | Standalone Python Manim script for rendering 4K publication videos. |
