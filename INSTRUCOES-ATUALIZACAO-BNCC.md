# Instruções para Atualização do Componente EditorPlanoAula

## Arquivo: `src/app/sala-professor/components/shared/EditorPlanoAula.jsx`

### Localizar a linha 573 aproximadamente (seção "Competências BNCC")

Substituir TODA a seção do Autocomplete (da linha ~573 até ~620) por:

```jsx
                {/* NOVO: Seletor de Faixa Etária */}
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel id="faixa-etaria-label">Faixa Etária / Nível de Ensino *</InputLabel>
                  <Select
                    labelId="faixa-etaria-label"
                    value={formData.faixaEtaria}
                    label="Faixa Etária / Nível de Ensino *"
                    onChange={(e) => {
                      handleInputChange('faixaEtaria', e.target.value);
                      // Limpar competências selecionadas ao mudar faixa etária
                      handleInputChange('bncc', []);
                    }}
                    error={!!errors.faixaEtaria}
                    required
                  >
                    {FAIXAS_ETARIAS.map((faixa) => (
                      <MenuItem key={faixa.id} value={faixa.id}>
                        {faixa.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.faixaEtaria && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.faixaEtaria}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Selecione a faixa etária para carregar as competências específicas da BNCC
                  </Typography>
                </FormControl>
                
                {/* Autocomplete de Competências - só aparece após selecionar faixa etária */}
                {formData.faixaEtaria && competenciasDisponiveis.length > 0 && (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {competenciasDisponiveis.length} competências disponíveis para esta faixa etária
                    </Typography>
                    
                    <Autocomplete
                      multiple
                      options={competenciasDisponiveis}
                      value={formData.bncc || []}
                      onChange={(event, newValue) => {
                        handleInputChange('bncc', newValue);
                      }}
                      getOptionLabel={(option) => `${option.codigo} - ${option.descricao}`}
                      filterOptions={(options, { inputValue }) => {
                        return options.filter(option =>
                          option.codigo.toLowerCase().includes(inputValue.toLowerCase()) ||
                          option.descricao.toLowerCase().includes(inputValue.toLowerCase())
                        );
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Selecione as competências BNCC"
                          placeholder="Digite para buscar (ex: EF01LP01, EI03EO01)"
                          variant="outlined"
                          size="small"
                        />
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            variant="outlined"
                            label={option.codigo}
                            {...getTagProps({ index })}
                            key={option.codigo}
                            size="small"
                            color="primary"
                          />
                        ))
                      }
                      renderOption={(props, option) => (
                        <Box component="li" {...props} sx={{ display: 'block !important' }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {option.codigo}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.descricao}
                          </Typography>
                        </Box>
                      )}
                      sx={{ mb: 1 }}
                    />
                  </>
                )}
                
                {!formData.faixaEtaria && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Selecione uma faixa etária acima para visualizar e escolher as competências da BNCC
                  </Alert>
                )}
```

## O que foi alterado:

1. ✅ Adicionado seletor de faixa etária (Select)
2. ✅ Competências BNCC agora carregam dinamicamente baseado na faixa selecionada
3. ✅ Autocomplete só aparece após selecionar faixa etária
4. ✅ Mostra contador de competências disponíveis
5. ✅ Alert informativo quando faixa etária não foi selecionada
6. ✅ Validação obrigatória da faixa etária (já adicionado no validateForm)
7. ✅ Imports atualizados (MenuItem, Select, FormControl, InputLabel, Alert)
8. ✅ Import do arquivo de competências BNCC completo

## Arquivos Criados:

- ✅ `src/app/sala-professor/components/shared/competenciasBNCC.js` (TODAS as competências BNCC organizadas)

## Benefícios:

- 🎯 Competências específicas por faixa etária (0-3 anos, 4-5 anos, 1º-2º ano, etc.)
- 📚 Base completa da BNCC (Educação Infantil + Fundamental + Médio)
- 🔍 Busca inteligente por código ou descrição
- ✅ Validação melhorada
- 🎨 UX aprimorada com feedback visual
