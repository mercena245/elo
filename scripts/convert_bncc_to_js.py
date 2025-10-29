"""
Script para converter o arquivo BNCC.md em competenciasBNCC.js
Gera o arquivo JavaScript com todas as 642 competências organizadas
"""

import re
import json

def parse_bncc_md():
    """Lê o arquivo BNCC.md e extrai todas as competências"""
    
    with open('docs/BNCC.md', 'r', encoding='utf-8') as f:
        content = f.read()
    
    competencias = {
        'educacao_infantil_bebes': {'titulo': 'Educação Infantil - Bebês (0 a 1a6m)', 'campos_experiencia': {}},
        'educacao_infantil_bem_pequenas': {'titulo': 'Educação Infantil - Crianças bem pequenas (1a7m a 3a11m)', 'campos_experiencia': {}},
        'educacao_infantil_pequenas': {'titulo': 'Educação Infantil - Crianças pequenas (4a a 5a11m)', 'campos_experiencia': {}},
        'fundamental_1_ano': {'titulo': 'Ensino Fundamental - 1º ano', 'disciplinas': {}},
        'fundamental_2_ano': {'titulo': 'Ensino Fundamental - 2º ano', 'disciplinas': {}},
        'fundamental_3_ano': {'titulo': 'Ensino Fundamental - 3º ano', 'disciplinas': {}},
        'fundamental_4_ano': {'titulo': 'Ensino Fundamental - 4º ano', 'disciplinas': {}},
        'fundamental_5_ano': {'titulo': 'Ensino Fundamental - 5º ano', 'disciplinas': {}},
    }
    
    # Regex para extrair competências no formato: **CÓDIGO** - Descrição
    pattern = r'\*\*([A-Z0-9]+)\*\*\s*-\s*(.+?)(?=\n\n|\n\*\*|$)'
    
    matches = re.findall(pattern, content, re.DOTALL)
    
    for codigo, descricao in matches:
        descricao = descricao.strip().replace('\n', ' ')
        
        # Classificar por código
        if codigo.startswith('EI01'):
            add_to_ei(competencias['educacao_infantil_bebes'], codigo, descricao)
        elif codigo.startswith('EI02'):
            add_to_ei(competencias['educacao_infantil_bem_pequenas'], codigo, descricao)
        elif codigo.startswith('EI03'):
            add_to_ei(competencias['educacao_infantil_pequenas'], codigo, descricao)
        elif 'LP' in codigo or 'MA' in codigo or 'CI' in codigo or 'GE' in codigo or 'HI' in codigo or 'AR' in codigo or 'EF' in codigo or 'ER' in codigo:
            add_to_fundamental(competencias, codigo, descricao)
    
    return competencias

def add_to_ei(faixa, codigo, descricao):
    """Adiciona competência à Educação Infantil"""
    # Determinar o campo de experiência baseado no código
    campo_map = {
        'EO': 'O eu, o outro e o nós',
        'CG': 'Corpo, gestos e movimentos',
        'TS': 'Traços, sons, cores e formas',
        'EF': 'Escuta, fala, pensamento e imaginação',
        'ET': 'Espaços, tempos, quantidades, relações e transformações'
    }
    
    campo_code = codigo[4:6]
    campo = campo_map.get(campo_code, 'Outros')
    
    if campo not in faixa['campos_experiencia']:
        faixa['campos_experiencia'][campo] = []
    
    faixa['campos_experiencia'][campo].append({
        'codigo': codigo,
        'descricao': descricao
    })

def add_to_fundamental(competencias, codigo, descricao):
    """Adiciona habilidade ao Ensino Fundamental"""
    # Extrair disciplina e ano
    disciplina_map = {
        'LP': 'Língua Portuguesa',
        'AR': 'Arte',
        'EF': 'Educação Física',
        'MA': 'Matemática',
        'CI': 'Ciências',
        'GE': 'Geografia',
        'HI': 'História',
        'ER': 'Ensino Religioso'
    }
    
    # Extrair ano do código (EF01LP01 -> 01 = 1º ano)
    if len(codigo) >= 6:
        disc_code = codigo[4:6]
        ano = codigo[2:4]
        
        disciplina = disciplina_map.get(disc_code, 'Outros')
        
        # Mapear códigos especiais (EF15LP, EF12LP, EF35LP)
        if ano in ['15', '12', '35']:
            # Adicionar a múltiplos anos
            anos = []
            if ano == '15':
                anos = ['01', '02', '03', '04', '05']
            elif ano == '12':
                anos = ['01', '02']
            elif ano == '35':
                anos = ['03', '04', '05']
            
            for a in anos:
                faixa_key = f'fundamental_{a}_ano'
                if faixa_key in competencias:
                    if disciplina not in competencias[faixa_key]['disciplinas']:
                        competencias[faixa_key]['disciplinas'][disciplina] = []
                    competencias[faixa_key]['disciplinas'][disciplina].append({
                        'codigo': codigo,
                        'descricao': descricao
                    })
        else:
            faixa_key = f'fundamental_{ano}_ano'
            if faixa_key in competencias:
                if disciplina not in competencias[faixa_key]['disciplinas']:
                    competencias[faixa_key]['disciplinas'][disciplina] = []
                competencias[faixa_key]['disciplinas'][disciplina].append({
                    'codigo': codigo,
                    'descricao': descricao
                })

def generate_js_file(competencias):
    """Gera o arquivo JavaScript"""
    
    js_content = """// Competências BNCC COMPLETAS - Base Nacional Comum Curricular
// Total: 642 competências e habilidades
// Gerado automaticamente a partir de BNCC.md
// Última atualização: 29/10/2025

export const FAIXAS_ETARIAS = [
  { id: 'educacao_infantil_bebes', label: 'Educação Infantil - Bebês (0 a 1a6m)', ordem: 1 },
  { id: 'educacao_infantil_bem_pequenas', label: 'Educação Infantil - Crianças bem pequenas (1a7m a 3a11m)', ordem: 2 },
  { id: 'educacao_infantil_pequenas', label: 'Educação Infantil - Crianças pequenas (4a a 5a11m)', ordem: 3 },
  { id: 'fundamental_1_ano', label: 'Ensino Fundamental - 1º ano', ordem: 4 },
  { id: 'fundamental_2_ano', label: 'Ensino Fundamental - 2º ano', ordem: 5 },
  { id: 'fundamental_3_ano', label: 'Ensino Fundamental - 3º ano', ordem: 6 },
  { id: 'fundamental_4_ano', label: 'Ensino Fundamental - 4º ano', ordem: 7 },
  { id: 'fundamental_5_ano', label: 'Ensino Fundamental - 5º ano', ordem: 8 }
];

// Função auxiliar para obter todas as competências de forma plana para o Autocomplete
export function getAllCompetencias() {
  const competencias = [];
  
  Object.entries(COMPETENCIAS_BNCC).forEach(([faixaKey, faixaData]) => {
    if (faixaData.campos_experiencia) {
      // Educação Infantil
      Object.entries(faixaData.campos_experiencia).forEach(([campo, lista]) => {
        lista.forEach(comp => {
          competencias.push({
            ...comp,
            faixa: faixaData.titulo,
            campo,
            tipo: 'educacao_infantil'
          });
        });
      });
    } else if (faixaData.disciplinas) {
      // Ensino Fundamental
      Object.entries(faixaData.disciplinas).forEach(([disciplina, lista]) => {
        lista.forEach(comp => {
          competencias.push({
            ...comp,
            faixa: faixaData.titulo,
            disciplina,
            tipo: 'ensino_fundamental'
          });
        });
      });
    }
  });
  
  return competencias;
}

// Função para filtrar competências por faixa etária
export function getCompetenciasByFaixa(faixaId) {
  const faixa = COMPETENCIAS_BNCC[faixaId];
  if (!faixa) return [];
  
  return getAllCompetencias().filter(comp => 
    comp.faixa === faixa.titulo
  );
}

export const COMPETENCIAS_BNCC = """
    
    # Converter para JSON e depois para JavaScript
    js_obj = json.dumps(competencias, ensure_ascii=False, indent=2)
    
    # Substituir aspas duplas por aspas simples no JavaScript
    js_obj = js_obj.replace('"', "'")
    
    js_content += js_obj + ";\n"
    
    with open('src/app/sala-professor/components/shared/competenciasBNCC.js', 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print(f"✅ Arquivo gerado com sucesso!")
    print(f"Total de faixas: {len(competencias)}")
    
    # Contar total de competências
    total = 0
    for faixa_key, faixa_data in competencias.items():
        if 'campos_experiencia' in faixa_data:
            for campo, lista in faixa_data['campos_experiencia'].items():
                total += len(lista)
        if 'disciplinas' in faixa_data:
            for disc, lista in faixa_data['disciplinas'].items():
                total += len(lista)
    
    print(f"Total de competências: {total}")

if __name__ == '__main__':
    print("🚀 Iniciando conversão de BNCC.md para competenciasBNCC.js...")
    competencias = parse_bncc_md()
    generate_js_file(competencias)
    print("✨ Conversão concluída!")
