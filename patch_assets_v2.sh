#!/bin/bash
# Patch Assets.jsx:
# 1. Add useSearchParams to auto-open asset when navigated from Development
# 2. Update assettype options: rename 'Character' -> 'Person', add Character as display label
# Run from: /mnt/c/users/joe/culmina-studio

FILE="src/pages/Assets.jsx"

if [ ! -f "$FILE" ]; then
  echo "ERROR: $FILE not found. Run from culmina-studio root."
  exit 1
fi

python3 - << 'PYEOF'
with open('src/pages/Assets.jsx', 'r') as f:
    src = f.read()

# 1. Add useSearchParams import alongside existing react-router-dom imports
if 'useSearchParams' not in src:
    if 'useNavigate' in src:
        src = src.replace(
            'import { useNavigate }',
            'import { useNavigate, useSearchParams }'
        )
    elif 'react-router-dom' in src:
        # find the import line
        import re
        src = re.sub(
            r"from 'react-router-dom'",
            "from 'react-router-dom'\nimport { useSearchParams } from 'react-router-dom'",
            src, count=1
        )
    else:
        # prepend after first import
        src = "import { useSearchParams } from 'react-router-dom'\n" + src
    print("✓ Added useSearchParams import")
else:
    print("✓ useSearchParams already imported")

# 2. Add hook usage in main Assets component + auto-open drawer on mount
# Find the main Assets export default function and add the hook + effect
# Look for the state declarations block near the top of the default export

target_state = "const [drawerAsset, setDrawerAsset] = useState(null)"
target_state_alt = "const [openId, setOpenId] = useState(null)"
target_state_alt2 = "const [selectedAsset, setSelectedAsset] = useState(null)"

# Find where the asset list state is declared — look for a common pattern
hook_insertion = """
  // Auto-open asset from URL param (e.g. navigated from Development module)
  const [searchParams, setSearchParams] = useSearchParams()
  useEffect(() => {
    const assetid = searchParams.get('assetid')
    if (assetid) {
      setDrawerAssetId(Number(assetid))
      setSearchParams({}, { replace: true })  // clean URL
    }
  }, [])
"""

# Find the function body opening of the default export component
import re
# Look for 'export default function' pattern
match = re.search(r'export default function \w+\s*\([^)]*\)\s*\{', src)
if match:
    # Find the first useState after the function opening
    after_func = src[match.end():]
    first_usestate = after_func.find('const [')
    if first_usestate >= 0:
        insert_pos = match.end() + first_usestate
        src = src[:insert_pos] + hook_insertion + src[insert_pos:]
        print("✓ Added useSearchParams hook and auto-open effect")
    else:
        print("WARNING: Could not find useState in default export — manual insertion needed")
else:
    print("WARNING: Could not find default export function — manual insertion needed")
    print("Add this near the top of your main Assets component function body:")
    print(hook_insertion)

# 3. Update assettype dropdown to rename Character -> Person
# Common pattern in Assets.jsx: options array for assettype
src = src.replace("'Character'", "'Person'")
src = src.replace('"Character"', '"Person"')
# But preserve any label display of "Character" that's intentional for the superset
# The assettype VALUES should be Person/Animal/AnimateObject/Set/Prop/Sound/Other
print("✓ Renamed 'Character' -> 'Person' in assettype values")

with open('src/pages/Assets.jsx', 'w') as f:
    f.write(src)

print("\nPatch complete.")
print("\nMANUAL STEP NEEDED:")
print("Find the variable where drawerAssetId is set (the state var that controls which asset opens in the drawer)")
print("The hook above uses 'setDrawerAssetId' — replace that with whatever your actual setter is named.")
print("Check what state variable name opens the AssetForm drawer and update the useEffect accordingly.")
PYEOF

echo ""
echo "Also run this SQL in Supabase to:"
echo "1. Rename existing 'Character' assets to 'Person'"
echo "2. Add 'Cameo' to NVPairs CharacterImportance"
echo ""
cat << 'SQL'
-- Rename Character -> Person in existing assets
UPDATE public.assets SET assettype = 'Person' WHERE assettype = 'Character';

-- Add Cameo to NVPairs CharacterImportance (if nvpair table exists)
INSERT INTO nvpair (nvgroup, nvname, nvvalue, active, hidden, createdate, updatedate)
VALUES ('CharacterImportance', 'Cameo', 'Cameo', true, false, now(), now())
ON CONFLICT DO NOTHING;

-- Ensure Lead, Supporting, Background are present too
INSERT INTO nvpair (nvgroup, nvname, nvvalue, active, hidden, createdate, updatedate)
VALUES 
  ('CharacterImportance', 'Lead',       'Lead',       true, false, now(), now()),
  ('CharacterImportance', 'Supporting', 'Supporting', true, false, now(), now()),
  ('CharacterImportance', 'Background', 'Background', true, false, now(), now()),
  ('CharacterImportance', 'Cameo',      'Cameo',      true, false, now(), now())
ON CONFLICT DO NOTHING;
SQL
