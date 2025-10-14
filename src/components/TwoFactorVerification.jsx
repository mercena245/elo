import React, { useState } from 'react';
import { TwoFactorAuthService } from '../services/twoFactorAuthService';
import './TwoFactorVerification.css';

const TwoFactorVerification = ({ user, onVerificationSuccess, onCancel, onBackupCodeUsed }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 5;

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setError('Digite o código de verificação');
      return;
    }

    if (attempts >= maxAttempts) {
      setError('Muitas tentativas falharam. Tente novamente mais tarde.');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const result = TwoFactorAuthService.verifyToken(
        TwoFactorAuthService.getUserTwoFactorConfig(user.uid).config?.secret,
        verificationCode
      );

      if (result.success && result.isValid) {
        // Atualizar último uso
        TwoFactorAuthService.updateLastUsed(user.uid);
        onVerificationSuccess();
      } else {
        setAttempts(prev => prev + 1);
        setError(`Código inválido. Tentativa ${attempts + 1} de ${maxAttempts}`);
        setVerificationCode('');
      }
    } catch (error) {
      setError('Erro na verificação: ' + error.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyBackupCode = async () => {
    if (!backupCode.trim()) {
      setError('Digite o código de backup');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const result = TwoFactorAuthService.verifyBackupCode(user.uid, backupCode);

      if (result.success && result.isValid) {
        onBackupCodeUsed && onBackupCodeUsed();
        onVerificationSuccess();
      } else {
        setError('Código de backup inválido ou já utilizado');
        setBackupCode('');
      }
    } catch (error) {
      setError('Erro na verificação: ' + error.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (showBackupCodes) {
        handleVerifyBackupCode();
      } else {
        handleVerifyCode();
      }
    }
  };

  return (
    <div className="two-factor-verification">
      <div className="verification-container">
        <div className="verification-header">
          <div className="security-icon">
            <i className="fas fa-shield-alt"></i>
          </div>
          <h2>Verificação de Segurança</h2>
          <p>Digite o código de 6 dígitos do seu Google Authenticator</p>
        </div>

        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
          </div>
        )}

        {!showBackupCodes ? (
          /* Verificação com Google Authenticator */
          <div className="verification-form">
            <div className="code-input-container">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                onKeyPress={handleKeyPress}
                placeholder="000000"
                maxLength={6}
                className="verification-code-input"
                autoComplete="off"
                autoFocus
                disabled={isVerifying}
              />
            </div>

            <div className="verification-actions">
              <button
                type="button"
                onClick={handleVerifyCode}
                className="btn-verify"
                disabled={isVerifying || verificationCode.length !== 6}
              >
                {isVerifying ? (
                  <>
                    <div className="spinner-small"></div>
                    Verificando...
                  </>
                ) : (
                  'Verificar'
                )}
              </button>
            </div>

            <div className="alternative-options">
              <button
                type="button"
                onClick={() => setShowBackupCodes(true)}
                className="link-button"
              >
                Usar código de backup
              </button>
            </div>
          </div>
        ) : (
          /* Verificação com código de backup */
          <div className="verification-form">
            <div className="backup-info">
              <i className="fas fa-key"></i>
              <p>Use um dos códigos de backup salvos durante a configuração</p>
            </div>

            <div className="code-input-container">
              <input
                type="text"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.replace(/\s/g, ''))}
                onKeyPress={handleKeyPress}
                placeholder="Código de backup"
                className="backup-code-input"
                autoComplete="off"
                autoFocus
                disabled={isVerifying}
              />
            </div>

            <div className="verification-actions">
              <button
                type="button"
                onClick={handleVerifyBackupCode}
                className="btn-verify"
                disabled={isVerifying || !backupCode.trim()}
              >
                {isVerifying ? (
                  <>
                    <div className="spinner-small"></div>
                    Verificando...
                  </>
                ) : (
                  'Verificar Código de Backup'
                )}
              </button>
            </div>

            <div className="alternative-options">
              <button
                type="button"
                onClick={() => {
                  setShowBackupCodes(false);
                  setBackupCode('');
                  setError('');
                }}
                className="link-button"
              >
                ← Voltar ao Google Authenticator
              </button>
            </div>
          </div>
        )}

        <div className="verification-footer">
          <button
            type="button"
            onClick={onCancel}
            className="btn-cancel"
          >
            Cancelar
          </button>
        </div>

        <div className="help-section">
          <details>
            <summary>Problemas para acessar?</summary>
            <div className="help-content">
              <p><strong>Se você perdeu acesso ao seu dispositivo:</strong></p>
              <ul>
                <li>Use um código de backup se você os salvou</li>
                <li>Entre em contato com o administrador do sistema</li>
              </ul>
              
              <p><strong>Se o código não está funcionando:</strong></p>
              <ul>
                <li>Verifique se o horário do seu dispositivo está correto</li>
                <li>Digite o código atual, não o anterior</li>
                <li>Aguarde o próximo código se o atual estiver expirando</li>
              </ul>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorVerification;