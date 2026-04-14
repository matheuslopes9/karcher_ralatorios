'use client';

export default function ExportPage() {
  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Exportar Dados</h3>
        <p className="text-gray-600">Funcionalidade de exportação será implementada com os formatos:</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
          {['CSV', 'XLSX', 'JSON', 'XML', 'PDF'].map((format) => (
            <div key={format} className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-sm font-medium text-gray-700">{format}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
