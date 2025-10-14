import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { TwoFactorAuthService } from '../services/twoFactorAuthService';
import './TwoFactorSetup.css';

const TwoFactorSetup = ({ user, onSetupComplete, onCancel }) => {
  const [step, setStep] = useState(1); // 1: QR Code, 2: Verificação, 3: Códigos de backup
  const [secret, setSecret] = useState('');
  const [qrCodeURL, setQRCodeURL] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeSetup();
  }, []);

  const initializeSetup = async () => {
    try {
      setIsLoading(true);
      
      // Gerar secret único
      const newSecret = TwoFactorAuthService.generateSecret();
      setSecret(newSecret);
      
      // Gerar QR Code
      const qrResult = await TwoFactorAuthService.generateQRCode(user.email, newSecret);
      
      if (qrResult.success) {
        setQRCodeURL(qrResult.otpauth);
      } else {
        setError('Erro ao gerar QR Code: ' + qrResult.error);
      }
      
      // Gerar códigos de backup
      const codes = TwoFactorAuthService.generateBackupCodes();
      setBackupCodes(codes);
      
    } catch (error) {
      setError('Erro na inicialização: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setError('Digite o código de verificação');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const result = TwoFactorAuthService.verifyToken(secret, verificationCode);
      
      if (result.success && result.isValid) {
        // Código válido, ir para próximo passo
        setStep(3);
      } else {
        setError('Código inválido. Verifique se digitou corretamente.');
      }
    } catch (error) {
      setError('Erro na verificação: ' + error.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCompleteSetup = async () => {
    try {
      // Salvar configuração 2FA
      const config = {
        secret: secret,
        backupCodes: backupCodes,
        enabled: true
      };
      
      const saveResult = await TwoFactorAuthService.saveUserTwoFactorConfig(user.uid, config);
      
      if (saveResult.success) {
        onSetupComplete && onSetupComplete();
      } else {
        setError('Erro ao salvar configuração: ' + saveResult.error);
      }
    } catch (error) {
      setError('Erro ao finalizar configuração: ' + error.message);
    }
  };

  const downloadBackupCodes = () => {
    const content = `Códigos de Backup - ELO School Super Admin\n\nUsuário: ${user.email}\nData: ${new Date().toLocaleString()}\n\n${backupCodes.map(code => `• ${code}`).join('\n')}\n\nGuarde estes códigos em local seguro. Eles podem ser usados uma única vez cada um caso você perca acesso ao seu dispositivo de autenticação.`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-codes-${user.email}-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="two-factor-setup">
        <div className="setup-loading">
          <div className="spinner"></div>
          <p>Configurando autenticação 2FA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="two-factor-setup">
      <div className="setup-container">
        <h2>Configurar Autenticação de Dois Fatores</h2>
        
        {/* Indicador de progresso */}
        <div className="progress-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
        </div>

        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
          </div>
        )}

        {/* Passo 1: QR Code */}
        {step === 1 && (
          <div className="setup-step">
            <h3>1. Escaneie o QR Code</h3>
            <p>Abra o Google Authenticator no seu dispositivo móvel e escaneie o código abaixo:</p>
            
            <div className="qr-code-container">
              {qrCodeURL && (
                <QRCode 
                  value={qrCodeURL} 
                  size={200}
                  level="M"
                />
              )}
            </div>
            
            <div className="manual-entry">
              <p><strong>Ou digite manualmente:</strong></p>
              <code>{secret}</code>
              <button 
                type="button" 
                onClick={() => navigator.clipboard.writeText(secret)}
                className="copy-button"
              >
                Copiar
              </button>
            </div>

            <div className="step-actions">
              <button type="button" onClick={onCancel} className="btn-secondary">
                Cancelar
              </button>
              <button type="button" onClick={() => setStep(2)} className="btn-primary">
                Próximo
              </button>
            </div>
          </div>
        )}

        {/* Passo 2: Verificação */}
        {step === 2 && (
          <div className="setup-step">
            <h3>2. Verifique a Configuração</h3>
            <p>Digite o código de 6 dígitos gerado pelo Google Authenticator:</p>
            
            <div className="verification-input">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="code-input"
                autoComplete="off"
              />
            </div>

            <div className="step-actions">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary">
                Voltar
              </button>
              <button 
                type="button" 
                onClick={handleVerifyCode} 
                className="btn-primary"
                disabled={isVerifying || verificationCode.length !== 6}
              >
                {isVerifying ? 'Verificando...' : 'Verificar'}
              </button>
            </div>
          </div>
        )}

        {/* Passo 3: Códigos de backup */}
        {step === 3 && (
          <div className="setup-step">
            <h3>3. Códigos de Backup</h3>
            <p>Guarde estes códigos em local seguro. Cada um pode ser usado apenas uma vez:</p>
            
            <div className="backup-codes">
              {backupCodes.map((code, index) => (
                <div key={index} className="backup-code">
                  {code}
                </div>
              ))}
            </div>

            <div className="backup-actions">
              <button type="button" onClick={downloadBackupCodes} className="btn-secondary">
                <i className="fas fa-download"></i>
                Baixar Códigos
              </button>
            </div>

            <div className="warning-message">
              <i className="fas fa-exclamation-triangle"></i>
              <strong>Importante:</strong> Salve estes códigos em local seguro. 
              Você precisará deles se perder acesso ao seu dispositivo móvel.
            </div>

            <div className="step-actions">
              <button type="button" onClick={handleCompleteSetup} className="btn-primary btn-large">
                Finalizar Configuração
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoFactorSetup;