"""
Script de Validação de Imports - useSchoolDatabase
Verifica se todos os imports estão com caminhos relativos corretos
"""

import re
from pathlib import Path

# Base path
base = Path('c:/Users/Mariana/OneDrive/Documentos/Gustavo/ELO/src')
app_path = base / 'app'
hooks_path = base / 'hooks'

# Find all files with import useSchoolDatabase
errors = []
correct = []

def count_levels(file_path, base_path):
    """Count how many levels to go up from file to base"""
    try:
        rel = file_path.relative_to(base_path)
        return len(rel.parts) - 1  # -1 because we don't count the file itself
    except:
        return -1

# Search all jsx/js files
print("🔍 Escaneando arquivos...\n")

for jsx_file in app_path.rglob('*.jsx'):
    try:
        content = jsx_file.read_text(encoding='utf-8')
        
        # Find import useSchoolDatabase
        match = re.search(r"import.*useSchoolDatabase.*from ['\"]([^'\"]+)['\"]", content)
        if match:
            import_path = match.group(1)
            
            # Count levels needed
            levels_needed = count_levels(jsx_file, base)
            expected_path = '../' * levels_needed + 'hooks/useSchoolDatabase'
            
            file_rel = str(jsx_file.relative_to(base.parent))
            
            if import_path != expected_path:
                errors.append({
                    'file': file_rel,
                    'current': import_path,
                    'expected': expected_path,
                    'levels': levels_needed
                })
            else:
                correct.append(file_rel)
    except Exception as e:
        print(f"⚠️ Erro ao processar arquivo: {jsx_file}")
        print(f"   {str(e)}\n")

# Results
print("\n" + "="*80)
print("📊 RESULTADO DA VALIDAÇÃO")
print("="*80 + "\n")

if errors:
    print(f"❌ {len(errors)} ERRO(S) ENCONTRADO(S):\n")
    for i, err in enumerate(errors, 1):
        print(f"{i}. {err['file']}")
        print(f"   Níveis necessários: {err['levels']}")
        print(f"   ❌ Atual:    {err['current']}")
        print(f"   ✅ Esperado: {err['expected']}")
        print()
else:
    print("✅ Nenhum erro encontrado!\n")

print(f"✅ {len(correct)} arquivo(s) com imports corretos\n")

if correct:
    print("Arquivos corretos (primeiros 10):")
    for f in correct[:10]:
        print(f"  ✓ {f}")
    if len(correct) > 10:
        print(f"  ... e mais {len(correct) - 10} arquivo(s)")

print("\n" + "="*80)
