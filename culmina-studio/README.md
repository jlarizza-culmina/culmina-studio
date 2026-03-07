# Culmina Manuscript Module — Local Setup

## One-time setup

```bash
cd /mnt/c/users/joe/culmina-studio
npm install
npm run dev
```

Then open http://localhost:5173 in your browser.

## Running after setup

```bash
cd /mnt/c/users/joe/culmina-studio
npm run dev
```

## API Key

Enter your Anthropic API key (sk-ant-...) in the key bar at the top of the app.
It is saved to localStorage so you only need to enter it once.

## Project structure

```
culmina-studio/
  index.html
  vite.config.js
  package.json
  src/
    main.jsx               ← React entry point
    ManuscriptModule.jsx   ← Main component
```

## Adding future pipeline steps

In ManuscriptModule.jsx, find the STEPS array at the top and add a new entry:
  { id: "episodes", num: "03", label: "Episodes", desc: "Generate episode structure" }

Then add a render block below the existing step blocks:
  {step === "episodes" && ( ... your new UI ... )}
