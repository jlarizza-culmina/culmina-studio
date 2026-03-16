#!/bin/bash
# Wire ProductionReadinessReport into Manuscript.jsx scoring tab
# Run from: /mnt/c/users/joe/culmina-studio

python3 - << 'PYEOF'
with open('src/pages/Manuscript.jsx', 'r') as f:
    src = f.read()

# 1. Add import after ScoringRunner import
old_import = "import ScoringRunner from '../components/ScoringRunner'"
new_import = """import ScoringRunner from '../components/ScoringRunner'
import ProductionReadinessReport from '../components/ProductionReadinessReport'"""

if 'ProductionReadinessReport' not in src:
    src = src.replace(old_import, new_import)
    print('✓ Added import')
else:
    print('✓ Import already present')

# 2. Add component after ScoringRunner in the scoring tab
old_scoring = """        {activeStep==='scoring'&&(
          <ScoringRunner title={{ ...title,excerpt:form.excerpt,summary:form.summary,generated_extract:form.generatedExtract,_fullText:form._fullText }} onScored={()=>{if(onRefresh)onRefresh()}}/>
        )}"""

new_scoring = """        {activeStep==='scoring'&&(
          <div>
            <ScoringRunner title={{ ...title,excerpt:form.excerpt,summary:form.summary,generated_extract:form.generatedExtract,_fullText:form._fullText }} onScored={()=>{if(onRefresh)onRefresh()}}/>
            <ProductionReadinessReport title={title} />
          </div>
        )}"""

if 'ProductionReadinessReport' not in src.split('activeStep')[1] if 'activeStep' in src else True:
    if old_scoring in src:
        src = src.replace(old_scoring, new_scoring)
        print('✓ Wired ProductionReadinessReport into scoring tab')
    else:
        print('WARNING: Could not find exact scoring tab pattern.')
        print('Manually add <ProductionReadinessReport title={title} /> after the ScoringRunner component in the scoring tab.')
else:
    print('✓ Component already wired')

with open('src/pages/Manuscript.jsx', 'w') as f:
    f.write(src)

print('\nDone.')
PYEOF
