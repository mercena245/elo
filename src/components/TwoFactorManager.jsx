import React, { useState, useEffect } from 'react';
import { TwoFactorAuthService } from '../services/twoFactorAuthService';
import TwoFactorSetup from './TwoFactorSetup';
import './TwoFactorManager.css';

const TwoFactorManager = ({ user }) => {
  const [twoFactorConfig, setTwoFactorConfig] = useState(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTwoFactorStatus();
  }, [user]);

  const loadTwoFactorStatus = () => {
    if (!user) return;

    setLoading(true);
    try {
      const enabled = TwoFactorAuthService.isUserTwoFactorEnabled(user.uid);
      setIsEnabled(enabled);

      if (enabled) {
        const result = TwoFactorAuthService.getUserTwoFactorConfig(user.uid);
        if (result.success) {
          setTwoFactorConfig(result.config);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar status 2FA:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnableTwoFactor = () => {
    setShowSetup(true);
  };

  const handleSetupComplete = () => {
    setShowSetup(false);
    loadTwoFactorStatus(); // Recarregar status
  };

  const handleDisableTwoFactor = () => {
    try {
      TwoFactorAuthService.disableTwoFactor(user.uid);
      setIsEnabled(false);
      setTwoFactorConfig(null);
      setShowDisableConfirm(false);
      
      // Limpar sessão atual
      sessionStorage.removeItem(`2fa_authenticated_${user.uid}`);
    } catch (error) {
      console.error('Erro ao desabilitar 2FA:', error);
    }
  };

  const handleRegenerateBackupCodes = () => {
    try {
      const result = TwoFactorAuthService.regenerateBackupCodes(user.uid);
      if (result.success) {
        setBackupCodes(result.backupCodes);
        setShowBackupCodes(true);
        loadTwoFactorStatus(); // Recarregar config
      }
    } catch (error) {
      console.error('Erro ao regenerar códigos:', error);
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

  if (loading) {
    return (
      <div className="two-factor-manager loading">
        <div className="spinner"></div>
        <p>Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="two-factor-manager">
      <div className="manager-header">
        <h3>Autenticação de Dois Fatores (2FA)</h3>
        <p>Adicione uma camada extra de segurança à sua conta usando o Google Authenticator.</p>
      </div>

      {!isEnabled ? (
        <div className="twofa-disabled">
          <div className="status-card disabled">
            <div className="status-icon">
              <i className="fas fa-shield-alt"></i>
            </div>
            <div className="status-content">
              <h4>2FA Desabilitado</h4>
              <p>Sua conta está protegida apenas pela senha. Habilite o 2FA para maior segurança.</p>
            </div>
            <button 
              onClick={handleEnableTwoFactor}
              className="btn-enable"
            >
              Habilitar 2FA
            </button>
          </div>
        </div>
      ) : (
        <div className="twofa-enabled">
          <div className="status-card enabled">
            <div className="status-icon enabled">
              <i className="fas fa-shield-check"></i>
            </div>
            <div className="status-content">
              <h4>2FA Habilitado</h4>
              <p>Sua conta está protegida com autenticação de dois fatores.</p>
              {twoFactorConfig && (
                <div className="config-details">
                  <p><strong>Configurado em:</strong> {new Date(twoFactorConfig.setupDate).toLocaleString()}</p>
                  {twoFactorConfig.lastUsed && (
                    <p><strong>Último uso:</strong> {new Date(twoFactorConfig.lastUsed).toLocaleString()}</p>
                  )}
                  <p><strong>Códigos de backup:</strong> {twoFactorConfig.backupCodes?.length || 0} disponíveis</p>
                </div>
              )}
            </div>
          </div>

          <div className="management-actions">
            <div className="action-card">
              <div className="action-info">
                <h5>Códigos de Backup</h5>
                <p>Regenere códigos de backup caso você tenha perdido os anteriores.</p>
              </div>
              <button 
                onClick={handleRegenerateBackupCodes}
                className="btn-secondary"
              >
                <i className="fas fa-refresh"></i>
                Regenerar Códigos
              </button>
            </div>

            <div className="action-card danger">
              <div className="action-info">
                <h5>Desabilitar 2FA</h5>
                <p>Remover a proteção de dois fatores da sua conta.</p>
              </div>
              <button 
                onClick={() => setShowDisableConfirm(true)}
                className="btn-danger"
              >
                <i className="fas fa-times"></i>
                Desabilitar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Setup */}
      {showSetup && (
        <TwoFactorSetup
          user={user}
          onSetupComplete={handleSetupComplete}
          onCancel={() => setShowSetup(false)}
        />
      )}

      {/* Modal de Confirmação de Desabilitação */}
      {showDisableConfirm && (
        <div className="modal-overlay">
          <div className="confirm-dialog">
            <div className="confirm-header">
              <i className="fas fa-exclamation-triangle warning"></i>
              <h4>Desabilitar Autenticação 2FA</h4>
            </div>
            <div className="confirm-content">
              <p>Tem certeza que deseja desabilitar a autenticação de dois fatores?</p>
              <p><strong>Isso reduzirá a segurança da sua conta.</strong></p>
            </div>
            <div className="confirm-actions">
              <button 
                onClick={() => setShowDisableConfirm(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDisableTwoFactor}
                className="btn-danger"
              >
                Sim, Desabilitar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Códigos de Backup */}
      {showBackupCodes && (
        <div className="modal-overlay">
          <div className="backup-codes-dialog">
            <div className="dialog-header">
              <h4>Novos Códigos de Backup</h4>
              <button 
                onClick={() => setShowBackupCodes(false)}
                className="close-button"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="dialog-content">
              <p>Salve estes novos códigos em local seguro. Os códigos anteriores não funcionam mais.</p>
              
              <div className="backup-codes-display">
                {backupCodes.map((code, index) => (
                  <div key={index} className="backup-code-item">
                    {code}
                  </div>
                ))}
              </div>
              
              <div className="dialog-actions">
                <button 
                  onClick={downloadBackupCodes}
                  className="btn-primary"
                >
                  <i className="fas fa-download"></i>
                  Baixar Códigos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TwoFactorManager;