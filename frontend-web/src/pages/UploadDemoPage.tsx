/**
 * 📁 Upload Demo Page - Página de demonstração do sistema de upload
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUpload, AvatarUpload } from '../components/upload';
import { useUpload, useAvatarUpload } from '../hooks/useUpload';
import { UploadResult } from '../services/uploadService';
import { 
  Upload, 
  Image, 
  FileText, 
  Users, 
  Settings,
  Trash2,
  Download,
  Eye,
  ArrowLeft
} from 'lucide-react';

export const UploadDemoPage: React.FC = () => {
  const [currentAvatar, setCurrentAvatar] = useState<string>('');
  const [uploads, setUploads] = useState<UploadResult[]>([]);

  // Hooks de upload
  // Hook removido para evitar warning de variável não utilizada
  // const avatarUpload = useAvatarUpload((avatar) => {
  //   setCurrentAvatar(avatar.url);
  // });

  const documentUpload = useUpload({
    category: 'document',
    multiple: true,
    onSuccess: (results) => {
      setUploads(prev => [...prev, ...results]);
    }
  });

  // Hook removido para evitar warning de variável não utilizada
  // const clientAttachmentUpload = useUpload({
  //   category: 'client-attachment',
  //   multiple: true,
  //   onSuccess: (results) => {
  //     setUploads(prev => [...prev, ...results]);
  //   }
  // });

  const handleDeleteUpload = async (uploadId: string) => {
    await documentUpload.deleteUpload(uploadId);
    setUploads(prev => prev.filter(upload => upload.id !== uploadId));
  };

  const navigate = useNavigate();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    if (type.includes('document') || type.includes('word')) return '📝';
    if (type.includes('sheet') || type.includes('excel')) return '📊';
    return '📎';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        {/* Navigation Button */}
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar ao Dashboard</span>
        </button>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Upload className="w-6 h-6 text-[#159A9C]" />
              <h1 className="text-2xl font-bold text-gray-900">Sistema de Upload</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Coluna 1: Demos de Upload */}
          <div className="space-y-8">
            
            {/* Avatar Upload */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#159A9C]" />
                Upload de Avatar
              </h2>
              
              <div className="flex items-center gap-6">
                <AvatarUpload
                  currentAvatar={currentAvatar}
                  onAvatarChange={(avatar) => setCurrentAvatar(avatar.url)}
                  size="lg"
                />
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Funcionalidades:</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Preview automático</li>
                    <li>• Redimensionamento automático</li>
                    <li>• Validação de tipo de imagem</li>
                    <li>• Limite de 2MB</li>
                    <li>• Drag & Drop</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Document Upload */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#159A9C]" />
                Upload de Documentos
              </h2>
              
              <FileUpload
                category="document"
                multiple={true}
                onUploadSuccess={(results) => setUploads(prev => [...prev, ...results])}
                showPreview={true}
                maxFiles={5}
              />
              
              <div className="mt-4 text-sm text-gray-600">
                <p><strong>Tipos aceitos:</strong> PDF, Word, Excel, Texto</p>
                <p><strong>Tamanho máximo:</strong> 50MB por arquivo</p>
                <p><strong>Múltiplos:</strong> Até 5 arquivos simultâneos</p>
              </div>
            </div>

            {/* Client Attachments */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Image className="w-5 h-5 text-[#159A9C]" />
                Anexos de Cliente
              </h2>
              
              <FileUpload
                category="client-attachment"
                multiple={true}
                onUploadSuccess={(results) => setUploads(prev => [...prev, ...results])}
                showPreview={true}
                maxFiles={10}
              />
              
              <div className="mt-4 text-sm text-gray-600">
                <p><strong>Tipos aceitos:</strong> Imagens, PDF, Office, Texto</p>
                <p><strong>Tamanho máximo:</strong> 10MB por arquivo</p>
                <p><strong>Uso:</strong> Contratos, fotos, documentos do cliente</p>
              </div>
            </div>
          </div>

          {/* Coluna 2: Lista de Uploads */}
          <div className="space-y-8">
            
            {/* Estatísticas */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#159A9C]" />
                Estatísticas
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{uploads.length}</div>
                  <div className="text-sm text-blue-600">Total de Uploads</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(uploads.reduce((sum, upload) => sum + upload.size, 0) / 1024 / 1024 * 100) / 100}MB
                  </div>
                  <div className="text-sm text-green-600">Tamanho Total</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {uploads.filter(u => u.type.startsWith('image/')).length}
                  </div>
                  <div className="text-sm text-purple-600">Imagens</div>
                </div>
                
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {uploads.filter(u => !u.type.startsWith('image/')).length}
                  </div>
                  <div className="text-sm text-orange-600">Documentos</div>
                </div>
              </div>
            </div>

            {/* Lista de Arquivos */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Arquivos Enviados ({uploads.length})
                </h2>
                
                {uploads.length > 0 && (
                  <button
                    onClick={() => setUploads([])}
                    className="text-sm text-red-600 hover:text-red-700 transition-colors"
                  >
                    Limpar Todos
                  </button>
                )}
              </div>
              
              {uploads.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Upload className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhum arquivo enviado ainda</p>
                  <p className="text-sm">Use os formulários ao lado para testar</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {uploads.map((upload) => (
                    <div key={upload.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                      
                      {/* Preview/Ícone */}
                      <div className="flex-shrink-0">
                        {upload.type.startsWith('image/') ? (
                          <img
                            src={upload.url}
                            alt={upload.originalName}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded">
                            <span className="text-lg">{getFileIcon(upload.type)}</span>
                          </div>
                        )}
                      </div>

                      {/* Informações */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {upload.originalName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(upload.size)} • {upload.category}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(upload.uploadedAt).toLocaleString()}
                        </p>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => window.open(upload.url, '_blank')}
                          className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => {
                            const a = document.createElement('a');
                            a.href = upload.url;
                            a.download = upload.originalName;
                            a.click();
                          }}
                          className="p-1 text-gray-400 hover:text-green-500 transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteUpload(upload.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Documentação */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📚 Como Usar</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Componente FileUpload:</h3>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`<FileUpload
  category="document"
  multiple={true}
  onUploadSuccess={(results) => {
    console.log('Uploads:', results);
  }}
  showPreview={true}
  maxFiles={5}
/>`}
              </pre>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Hook useUpload:</h3>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`const upload = useUpload({
  category: 'client-attachment',
  multiple: true,
  onSuccess: (results) => {
    // Handle success
  }
});

// upload.uploadFiles(files);`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
