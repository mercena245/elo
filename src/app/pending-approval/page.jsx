'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { managementDB, ref, get, onValue } from '../../firebase';

export default function PendingApprovalPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Verificar dados do usuário em tempo real
    const userRef = ref(managementDB, `usuarios/${user.uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setUserData(data);

        // Se usuário foi aprovado e tem escolas, redirecionar
        if (data.escolas && Object.keys(data.escolas).length > 0) {
          router.push('/');
          return;
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Aguardando Aprovação
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            Olá, <strong>{userData?.nome || user.email}</strong>!
          </p>
          <p className="text-gray-600 mb-8">
            Seu cadastro foi recebido com sucesso. No momento, você está aguardando a aprovação do administrador do sistema para ter acesso à plataforma.
          </p>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              O que acontece agora?
            </h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex items-start">
                <span className="mr-2">1.</span>
                <span>O administrador irá revisar seu cadastro</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">2.</span>
                <span>Você será vinculado a uma ou mais escolas</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">3.</span>
                <span>Quando aprovado, você terá acesso imediato ao sistema</span>
              </li>
            </ul>
          </div>

          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-600">
              <strong>Email cadastrado:</strong>
            </p>
            <p className="text-sm text-gray-900 font-mono">{user.email}</p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Verificar Status
            </button>
            
            <button
              onClick={() => {
                // Fazer logout
                import('firebase/auth').then(({ signOut }) => {
                  import('../../firebase').then(({ auth }) => {
                    signOut(auth).then(() => {
                      router.push('/login');
                    });
                  });
                });
              }}
              className="w-full px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium border border-gray-300"
            >
              Sair
            </button>
          </div>

          {/* Contact */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Problemas com sua conta?<br />
              Entre em contato: <a href="mailto:suporte@eloschool.com" className="text-indigo-600 hover:underline">suporte@eloschool.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
