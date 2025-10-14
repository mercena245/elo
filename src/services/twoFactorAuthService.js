import { authenticator } from 'otplib';
import QRCode from 'qrcode';

export class TwoFactorAuthService {
  
  // Gerar um secret único para o usuário
  static generateSecret() {
    return authenticator.generateSecret();
  }
  
  // Gerar URL para QR Code do Google Authenticator
  static generateQRCodeURL(userEmail, secret, appName = 'ELO School Super Admin') {
    return authenticator.keyuri(userEmail, appName, secret);
  }
  
  // Gerar QR Code como data URL
  static async generateQRCode(userEmail, secret) {
    try {
      const otpauth = this.generateQRCodeURL(userEmail, secret);
      const qrCodeDataURL = await QRCode.toDataURL(otpauth);
      return { success: true, qrCode: qrCodeDataURL, otpauth };
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Verificar código TOTP
  static verifyToken(secret, token) {
    try {
      // Remove espaços e converte para string
      const cleanToken = token.toString().replace(/\s/g, '');
      
      // Verifica o token com janela de tolerância (30 segundos antes/depois)
      const isValid = authenticator.check(cleanToken, secret);
      
      return { success: true, isValid };
    } catch (error) {
      console.error('Erro ao verificar token 2FA:', error);
      return { success: false, error: error.message, isValid: false };
    }
  }
  
  // Gerar códigos de backup (para caso de perda do dispositivo)
  static generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      // Gerar código de 8 dígitos
      const code = Math.random().toString().substr(2, 8);
      codes.push(code);
    }
    return codes;
  }
  
  // Salvar configuração 2FA do usuário
  static async saveUserTwoFactorConfig(userId, config) {
    try {
      const twoFactorConfig = {
        ...config,
        enabled: true,
        setupDate: new Date().toISOString(),
        lastUsed: null
      };
      
      // Salvar no localStorage por enquanto (em produção seria no Firebase)
      localStorage.setItem(`2fa_${userId}`, JSON.stringify(twoFactorConfig));
      
      return { success: true, config: twoFactorConfig };
    } catch (error) {
      console.error('Erro ao salvar configuração 2FA:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Buscar configuração 2FA do usuário
  static getUserTwoFactorConfig(userId) {
    try {
      const configString = localStorage.getItem(`2fa_${userId}`);
      if (configString) {
        const config = JSON.parse(configString);
        return { success: true, config };
      }
      return { success: true, config: null };
    } catch (error) {
      console.error('Erro ao buscar configuração 2FA:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Verificar se usuário tem 2FA configurado
  static isUserTwoFactorEnabled(userId) {
    const result = this.getUserTwoFactorConfig(userId);
    return result.success && result.config && result.config.enabled;
  }
  
  // Atualizar último uso do 2FA
  static updateLastUsed(userId) {
    try {
      const result = this.getUserTwoFactorConfig(userId);
      if (result.success && result.config) {
        const updatedConfig = {
          ...result.config,
          lastUsed: new Date().toISOString()
        };
        localStorage.setItem(`2fa_${userId}`, JSON.stringify(updatedConfig));
        return { success: true };
      }
      return { success: false, error: 'Configuração 2FA não encontrada' };
    } catch (error) {
      console.error('Erro ao atualizar último uso:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Desabilitar 2FA
  static disableTwoFactor(userId) {
    try {
      localStorage.removeItem(`2fa_${userId}`);
      return { success: true };
    } catch (error) {
      console.error('Erro ao desabilitar 2FA:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Verificar código de backup
  static verifyBackupCode(userId, code) {
    try {
      const result = this.getUserTwoFactorConfig(userId);
      if (result.success && result.config && result.config.backupCodes) {
        const codeIndex = result.config.backupCodes.indexOf(code);
        
        if (codeIndex !== -1) {
          // Remove o código usado dos backups
          result.config.backupCodes.splice(codeIndex, 1);
          
          // Salva a configuração atualizada
          localStorage.setItem(`2fa_${userId}`, JSON.stringify(result.config));
          
          return { success: true, isValid: true };
        }
      }
      
      return { success: true, isValid: false };
    } catch (error) {
      console.error('Erro ao verificar código de backup:', error);
      return { success: false, error: error.message, isValid: false };
    }
  }
  
  // Gerar novos códigos de backup
  static regenerateBackupCodes(userId) {
    try {
      const result = this.getUserTwoFactorConfig(userId);
      if (result.success && result.config) {
        const newBackupCodes = this.generateBackupCodes();
        const updatedConfig = {
          ...result.config,
          backupCodes: newBackupCodes,
          backupCodesGenerated: new Date().toISOString()
        };
        
        localStorage.setItem(`2fa_${userId}`, JSON.stringify(updatedConfig));
        
        return { success: true, backupCodes: newBackupCodes };
      }
      
      return { success: false, error: 'Configuração 2FA não encontrada' };
    } catch (error) {
      console.error('Erro ao regenerar códigos de backup:', error);
      return { success: false, error: error.message };
    }
  }
}