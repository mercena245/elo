import { useState, useCallback } from 'react';
import { useSchoolDatabase } from './useSchoolDatabase';

/**
 * Hook para operações de Storage da escola atual
 * Upload e gerenciamento de arquivos no Firebase Storage
 * 
 * Wrapper simplificado do useSchoolDatabase focado em Storage
 */
export const useSchoolStorage = () => {
  const { 
    uploadFile: uploadFileBase, 
    deleteFile: deleteFileBase,
    getFileURL,
    storage,
    currentSchool,
    isReady 
  } = useSchoolDatabase();
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  /**
   * Upload de arquivo para o Storage
   * @param {File} file - Arquivo a ser enviado
   * @param {string} path - Caminho no storage (ex: 'configuracoes/logo')
   * @returns {Promise<string>} URL do arquivo uploadado
   */
  const uploadFile = useCallback(async (file, path) => {
    console.log('📤 [useSchoolStorage] Upload iniciado');
    console.log('📤 [useSchoolStorage] File:', file?.name, file?.size, file?.type);
    console.log('📤 [useSchoolStorage] Path:', path);
    console.log('📤 [useSchoolStorage] isReady:', isReady);
    console.log('📤 [useSchoolStorage] storage:', !!storage);
    
    if (!isReady || !storage) {
      console.error('❌ [useSchoolStorage] Storage não está pronto!');
      throw new Error('Storage não está inicializado. Aguarde a conexão com a escola.');
    }

    if (!currentSchool?.storageBucket) {
      console.error('❌ [useSchoolStorage] Storage bucket não configurado!');
      throw new Error('Storage bucket não configurado para esta escola');
    }

    try {
      setUploading(true);
      setProgress(0);

      console.log('📤 [useSchoolStorage] Chamando uploadFileBase...');
      // Corrigir ordem dos parâmetros: (path, file) não (file, path)
      const result = await uploadFileBase(path, file);
      
      console.log('✅ [useSchoolStorage] Upload result:', result);
      
      // O resultado pode ser um objeto {url} ou uma string direta
      const downloadURL = result?.url || result;
      
      console.log('✅ [useSchoolStorage] Download URL:', downloadURL);
      
      setProgress(100);
      return downloadURL;
    } catch (error) {
      console.error('❌ [useSchoolStorage] Erro ao fazer upload:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  }, [uploadFileBase, storage, currentSchool, isReady]);

  /**
   * Deletar arquivo do Storage
   * @param {string} path - Caminho do arquivo no storage
   */
  const deleteFile = useCallback(async (path) => {
    if (!isReady || !storage) {
      throw new Error('Storage não está inicializado');
    }

    try {
      await deleteFileBase(path);
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
      throw error;
    }
  }, [deleteFileBase, storage, isReady]);

  /**
   * Upload de imagem com validação e compressão opcional
   * @param {File} file - Arquivo de imagem
   * @param {string} path - Caminho no storage
   * @param {Object} options - Opções de validação
   * @returns {Promise<string>} URL da imagem
   */
  const uploadImage = useCallback(async (file, path, options = {}) => {
    const { 
      maxSize = 5 * 1024 * 1024, // 5MB padrão
      allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    } = options;

    // Validar tipo
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Tipo de arquivo não permitido. Use: ${allowedTypes.join(', ')}`);
    }

    // Validar tamanho
    if (file.size > maxSize) {
      throw new Error(`Arquivo muito grande. Máximo: ${(maxSize / 1024 / 1024).toFixed(0)}MB`);
    }

    return await uploadFile(file, path);
  }, [uploadFile]);

  return {
    uploadFile,
    uploadImage,
    deleteFile,
    uploading,
    progress
  };
};

export default useSchoolStorage;
