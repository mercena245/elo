
// Componente para exibir e checar os claims customizados do usuário logado
// Útil para debug de permissões e validação de status admin
import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';


const AdminClaimChecker = () => {
  // Estado para status admin e claims customizados
  const [isAdmin, setIsAdmin] = useState(null);
  const [claims, setClaims] = useState(null);

  useEffect(() => {
    // Observa mudanças de autenticação para atualizar claims em tempo real
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Força refresh do token para garantir claims atualizados
        const token = await user.getIdTokenResult(true);
        setClaims(token.claims); // Salva todos os claims customizados
        setIsAdmin(!!token.claims.admin); // Verifica se o claim admin está presente
        console.log('Custom claims:', token.claims); // Log para debug
      } else {
        setIsAdmin(null);
        setClaims(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Exibe mensagem enquanto verifica claims
  if (isAdmin === null) return <div>Verificando claims...</div>;
  return (
    <div style={{padding: 16, background: '#f5f5f5', borderRadius: 8, margin: 16}}>
      {/* Mostra status admin de forma visual */}
      <strong>Status admin:</strong> {isAdmin ? '✅ Usuário é admin' : '❌ Usuário NÃO é admin'}<br/>
      {/* Exibe todos os claims customizados do token JWT */}
      <pre style={{fontSize: 12, marginTop: 8}}>{JSON.stringify(claims, null, 2)}</pre>
    </div>
  );
};

export default AdminClaimChecker;
