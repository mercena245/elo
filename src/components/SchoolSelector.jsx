'use client';

import { useAuth } from '../context/AuthContext';

export default function SchoolSelector() {
  const { selectedSchool, accessType, resetAccessType } = useAuth();

  if (accessType !== 'school' || !selectedSchool) {
    return null;
  }

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2">
        <span className="text-2xl">{selectedSchool.logo}</span>
        <div>
          <p className="text-sm font-medium text-gray-900">{selectedSchool.nome}</p>
          <p className="text-xs text-gray-500">{selectedSchool.cidade}</p>
        </div>
      </div>
      
      <button
        onClick={resetAccessType}
        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
        title="Trocar escola ou ir para gerenciamento"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      </button>
    </div>
  );
}