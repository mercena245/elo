'use client';

export default function SchoolCard({ school, onEdit, onDelete }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'ativa':
        return 'bg-green-100 text-green-800';
      case 'suspensa':
        return 'bg-yellow-100 text-yellow-800';
      case 'inativa':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanoColor = (plano) => {
    switch (plano) {
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      case 'intermediario':
        return 'bg-blue-100 text-blue-800';
      case 'basico':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {school.nome}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              CNPJ: {school.cnpj}
            </p>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(school.status)}`}>
              {school.status}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlanoColor(school.plano)}`}>
              {school.plano}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="space-y-4">
          {/* Responsável */}
          <div className="flex items-center">
            <svg className="h-4 w-4 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <div>
              <div className="text-sm font-medium text-gray-900">{school.responsavel}</div>
              <div className="text-xs text-gray-500">{school.email}</div>
            </div>
          </div>

          {/* Contato */}
          <div className="flex items-center">
            <svg className="h-4 w-4 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="text-sm text-gray-600">{school.telefone}</span>
          </div>

          {/* Endereço */}
          <div className="flex items-start">
            <svg className="h-4 w-4 text-gray-400 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div className="text-sm text-gray-600">
              <div>{school.endereco.rua}</div>
              <div>{school.endereco.cidade}, {school.endereco.estado} - {school.endereco.cep}</div>
            </div>
          </div>

          {/* Informações Financeiras */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-500">Mensalidade</div>
                <div className="font-semibold text-gray-900">{formatCurrency(school.mensalidade)}</div>
              </div>
              <div>
                <div className="text-gray-500">Vencimento</div>
                <div className="font-semibold text-gray-900">Dia {school.dataVencimento}</div>
              </div>
            </div>
          </div>

          {/* Configurações Técnicas */}
          {(school.projectId || school.databaseURL || school.storageBucket) && (
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-2">Configuração Firebase</div>
              <div className="space-y-1 text-xs">
                {school.projectId && (
                  <div className="text-gray-600">
                    <span className="font-medium">Project ID:</span> {school.projectId}
                  </div>
                )}
                {school.databaseURL && (
                  <div className="text-gray-600 truncate">
                    <span className="font-medium">Database:</span> {school.databaseURL.replace('https://', '').replace('.firebaseio.com', '')}
                  </div>
                )}
                {school.storageBucket && (
                  <div className="text-gray-600 truncate">
                    <span className="font-medium">Storage:</span> {school.storageBucket}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Módulos Ativos */}
          <div>
            <div className="text-xs text-gray-500 mb-2">Módulos Ativos</div>
            <div className="flex flex-wrap gap-1">
              {school.configuracoes.modulosAtivos.map((modulo) => (
                <span
                  key={modulo}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                >
                  {modulo}
                </span>
              ))}
            </div>
          </div>

          {/* Limites */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-green-50 rounded p-2">
              <div className="text-gray-500">Limite Alunos</div>
              <div className="font-semibold text-gray-900">{school.configuracoes.limiteAlunos}</div>
            </div>
            <div className="bg-green-50 rounded p-2">
              <div className="text-gray-500">Limite Professores</div>
              <div className="font-semibold text-gray-900">{school.configuracoes.limiteProfessores}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Contrato: {formatDate(school.dataContrato)}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(school)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </button>
            <button
              onClick={() => onDelete(school.id)}
              className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}