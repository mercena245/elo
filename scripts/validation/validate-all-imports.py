"""
Script de Validação Completa de Imports
Verifica imports relativos de hooks, context, components, etc
"""

import re
from pathlib import Path
from collections import defaultdict

base = Path('c:/Users/Mariana/OneDrive/Documentos/Gustavo/ELO/src')
app_path = base / 'app'

# Mapeamento de recursos importantes
resources = {
    'hooks': base / 'hooks',
    'context': base / 'context',
    'components': base / 'components',
    'services': base / 'services',
    'utils': base / 'utils',
}

errors = defaultdict(list)
correct_count = 0

def count_levels(file_path, base_path):
    """Count how many levels to go up from file to base"""
    try:
        rel = file_path.relative_to(base_path)
        return len(rel.parts) - 1
    except:
        return -1

def validate_import(file_path, import_statement, import_path):
    """Validate if import path is correct"""
    global correct_count
    
    # Detect what is being imported
    for resource_name, resource_path in resources.items():
        if f'/{resource_name}/' in import_path or import_path.endswith(f'/{resource_name}'):
            levels_needed = count_levels(file_path, base)
            expected_prefix = '../' * levels_needed + resource_name
            
            # Extract the actual path being used
            actual_prefix = re.match(r'((?:\.\./)+)' + resource_name, import_path)
            if actual_prefix:
                actual_levels = actual_prefix.group(1).count('../')
                
                if actual_levels != levels_needed:
                    errors[resource_name].append({
                        'file': str(file_path.relative_to(base.parent)),
                        'current': import_path,
                        'expected': import_path.replace(actual_prefix.group(1), '../' * levels_needed),
                        'levels_current': actual_levels,
                        'levels_expected': levels_needed,
                        'import_statement': import_statement.strip()
                    })
                    return False
    
    correct_count += 1
    return True

# Scan files
print("🔍 Escaneando todos os arquivos em src/app/...\n")

file_count = 0
for js_file in app_path.rglob('*.js*'):
    file_count += 1
    try:
        content = js_file.read_text(encoding='utf-8')
        
        # Find all import statements
        import_pattern = r"^import\s+.*?from\s+['\"]([^'\"]+)['\"];?"
        for match in re.finditer(import_pattern, content, re.MULTILINE):
            import_statement = match.group(0)
            import_path = match.group(1)
            
            # Only check relative imports
            if import_path.startswith('.'):
                validate_import(js_file, import_statement, import_path)
    except Exception as e:
        pass

# Results
print("\n" + "="*80)
print("📊 RESULTADO DA VALIDAÇÃO COMPLETA")
print("="*80 + "\n")

print(f"📁 Arquivos escaneados: {file_count}")
print(f"✅ Imports corretos: {correct_count}\n")

if errors:
    total_errors = sum(len(errs) for errs in errors.values())
    print(f"❌ {total_errors} ERRO(S) ENCONTRADO(S):\n")
    
    for resource_name, resource_errors in errors.items():
        print(f"\n{'='*80}")
        print(f"🔴 Erros em imports de '{resource_name}' ({len(resource_errors)} erro(s))")
        print(f"{'='*80}\n")
        
        for i, err in enumerate(resource_errors, 1):
            print(f"{i}. {err['file']}")
            print(f"   📝 Statement: {err['import_statement']}")
            print(f"   📊 Níveis: Atual={err['levels_current']}, Esperado={err['levels_expected']}")
            print(f"   ❌ Atual:    {err['current']}")
            print(f"   ✅ Esperado: {err['expected']}")
            print()
else:
    print("✅ Todos os imports relativos estão CORRETOS!\n")
    print("🎉 Parabéns! Nenhum erro encontrado.\n")

print("="*80)
