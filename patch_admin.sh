#!/bin/bash
# Patch Admin.jsx to add Lighting and Camera Movements tabs
# Run from: /mnt/c/users/joe/culmina-studio

FILE="src/pages/Admin.jsx"

if [ ! -f "$FILE" ]; then
  echo "ERROR: $FILE not found. Run from culmina-studio root."
  exit 1
fi

python3 - << 'PYEOF'
with open('src/pages/Admin.jsx', 'r') as f:
    src = f.read()

# 1. Add imports after existing tab imports
old_imports = "import DiscoverySourcesTab from '../components/DiscoverySourcesTab'"
new_imports = """import DiscoverySourcesTab from '../components/DiscoverySourcesTab'
import LightingTab from '../components/LightingTab'
import CameraMovementsTab from '../components/CameraMovementsTab'"""

if 'LightingTab' not in src:
    src = src.replace(old_imports, new_imports)
    print("✓ Added imports")
else:
    print("✓ Imports already present")

# 2. Add tabs to the tabs array
# Find the tabs array and add new entries
# Look for the discovery tab entry to insert after
old_tab = "{ id: 'discovery', label: 'Discovery Sources' },"
new_tab = """{ id: 'discovery', label: 'Discovery Sources' },
    { id: 'lighting', label: 'Lighting' },
    { id: 'camera', label: 'Camera Movements' },"""

if "'lighting'" not in src:
    src = src.replace(old_tab, new_tab)
    print("✓ Added tabs to tabs array")
else:
    print("✓ Tabs already present")

# 3. Add tab render conditions
# Find the last tab render line and add after it
# Look for the discovery tab render
old_render = "{activeTab === 'discovery' && <DiscoverySourcesTab />}"
new_render = """{activeTab === 'discovery' && <DiscoverySourcesTab />}
      {activeTab === 'lighting'   && <LightingTab />}
      {activeTab === 'camera'     && <CameraMovementsTab />}"""

if "'lighting'" not in src.split(old_render)[-1][:200] if old_render in src else True:
    if old_render in src:
        src = src.replace(old_render, new_render)
        print("✓ Added tab render conditions")
    else:
        print("WARNING: Could not find discovery tab render. Looking for alternative pattern...")
        # Try without braces
        alt = "activeTab === 'discovery' && <DiscoverySourcesTab />"
        if alt in src:
            src = src.replace(alt, alt + "\n      {activeTab === 'lighting' && <LightingTab />}\n      {activeTab === 'camera' && <CameraMovementsTab />}")
            print("✓ Added tab render conditions (alt pattern)")
        else:
            print("MANUAL STEP: Add these two lines after the discovery tab render:")
            print("  {activeTab === 'lighting' && <LightingTab />}")
            print("  {activeTab === 'camera'   && <CameraMovementsTab />}")
else:
    print("✓ Render conditions already present")

with open('src/pages/Admin.jsx', 'w') as f:
    f.write(src)

print("\nAdmin.jsx patched successfully.")
PYEOF

echo ""
echo "Done. Copy component files:"
echo "  cp ~/Downloads/LightingTab.jsx src/components/LightingTab.jsx"
echo "  cp ~/Downloads/CameraMovementsTab.jsx src/components/CameraMovementsTab.jsx"
