#!/bin/bash
# Add Camera Movements page to nav and routing
# Run from: /mnt/c/users/joe/culmina-studio

python3 - << 'PYEOF'
import re

# ── 1. App.jsx — add import + route ──────────────────────────
with open('src/App.jsx', 'r') as f:
    app = f.read()

if 'CameraMovements' not in app:
    # Add import after Lighting import
    app = app.replace(
        "import Lighting from './pages/Lighting'",
        "import Lighting from './pages/Lighting'\nimport CameraMovements from './pages/CameraMovements'"
    )
    # Add route after lighting route
    app = app.replace(
        "<Route path=\"lighting\" element={<Lighting />} />",
        "<Route path=\"lighting\" element={<Lighting />} />\n        <Route path=\"camera-movements\" element={<CameraMovements />} />"
    )
    with open('src/App.jsx', 'w') as f:
        f.write(app)
    print("✓ App.jsx updated")
else:
    print("✓ App.jsx already has CameraMovements")

# ── 2. AppShell.jsx — add nav entries ────────────────────────
with open('src/components/AppShell.jsx', 'r') as f:
    shell = f.read()

if 'camera-movements' not in shell:
    # Find the last entry in NAV array — look for admin entry
    old_nav_end = "{ to: '/admin',        label: 'Admin',"
    if old_nav_end in shell:
        # Add lighting and camera after admin
        shell = shell.replace(
            old_nav_end,
            "{ to: '/lighting',         label: 'Lighting',          icon: <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"1.5\"><circle cx=\"12\" cy=\"12\" r=\"5\"/><line x1=\"12\" y1=\"1\" x2=\"12\" y2=\"3\"/><line x1=\"12\" y1=\"21\" x2=\"12\" y2=\"23\"/><line x1=\"4.22\" y1=\"4.22\" x2=\"5.64\" y2=\"5.64\"/><line x1=\"18.36\" y1=\"18.36\" x2=\"19.78\" y2=\"19.78\"/><line x1=\"1\" y1=\"12\" x2=\"3\" y2=\"12\"/><line x1=\"21\" y1=\"12\" x2=\"23\" y2=\"12\"/><line x1=\"4.22\" y1=\"19.78\" x2=\"5.64\" y2=\"18.36\"/><line x1=\"18.36\" y1=\"5.64\" x2=\"19.78\" y2=\"4.22\"/></svg> },\n  { to: '/camera-movements', label: 'Camera Movements', icon: <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"1.5\"><polygon points=\"23 7 16 12 23 17 23 7\"/><rect x=\"1\" y=\"5\" width=\"15\" height=\"14\" rx=\"2\"/></svg> },\n  " + old_nav_end
        )
        with open('src/components/AppShell.jsx', 'w') as f:
            f.write(shell)
        print("✓ AppShell.jsx updated — added Lighting + Camera Movements to NAV")
    else:
        print("WARNING: Could not find admin nav entry. Checking for alternative pattern...")
        # Try finding the closing of the NAV array
        if "{ to: '/admin'" in shell:
            shell = shell.replace(
                "{ to: '/admin'",
                "{ to: '/lighting', label: 'Lighting', icon: <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"1.5\"><circle cx=\"12\" cy=\"12\" r=\"5\"/><line x1=\"12\" y1=\"1\" x2=\"12\" y2=\"3\"/><line x1=\"12\" y1=\"21\" x2=\"12\" y2=\"23\"/></svg> },\n  { to: '/camera-movements', label: 'Camera Movements', icon: <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"1.5\"><polygon points=\"23 7 16 12 23 17 23 7\"/><rect x=\"1\" y=\"5\" width=\"15\" height=\"14\" rx=\"2\"/></svg> },\n  { to: '/admin'"
            )
            with open('src/components/AppShell.jsx', 'w') as f:
                f.write(shell)
            print("✓ AppShell.jsx updated (alt pattern)")
else:
    print("✓ AppShell.jsx already has camera-movements")

# ── 3. Add breadcrumbs ────────────────────────────────────────
with open('src/components/AppShell.jsx', 'r') as f:
    shell = f.read()

if '/camera-movements' not in shell and 'BREADCRUMBS' in shell:
    shell = shell.replace(
        "'/admin': 'Admin',",
        "'/admin': 'Admin',\n  '/lighting': 'Lighting',\n  '/camera-movements': 'Camera Movements',"
    )
    with open('src/components/AppShell.jsx', 'w') as f:
        f.write(shell)
    print("✓ Added breadcrumbs")

print("\nDone.")
PYEOF
