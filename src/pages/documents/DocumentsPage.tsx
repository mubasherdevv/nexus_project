import React, { useState, useEffect, useRef } from 'react';
import { FileText, Upload, Download, Trash2, Share2, Loader2, AlertCircle, Eye } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { documentAPI } from '../../services/api';
import { DocumentPreview } from '../../components/documents/DocumentPreview';
import toast from 'react-hot-toast';

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const data = await documentAPI.getDocuments();
      if (data.success) {
        setDocuments(data.documents);
      }
    } catch (error) {
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('document', file);
    formData.append('name', file.name);

    try {
      setIsUploading(true);
      const data = await documentAPI.upload(formData);
      if (data.success) {
        toast.success('Document uploaded successfully');
        fetchDocuments();
      }
    } catch (error) {
      toast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openPreview = (doc: any) => {
    setSelectedDoc(doc);
    setIsPreviewOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'signed':
        return <Badge variant="success">Signed</Badge>;
      case 'pending_signature':
        return <Badge variant="warning">Pending Signature</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">Manage your startup's important files</p>
        </div>
        
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          />
          <Button 
            leftIcon={isUploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Storage info omitted for brevity */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Storage</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Used</span>
                <span className="font-medium text-gray-900">0.5 GB</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-primary-600 rounded-full" style={{ width: '5%' }}></div>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200">
               <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Filters</p>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-primary-600 bg-primary-50">All Files</Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-gray-600 hover:bg-gray-100">Shared with Me</Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-gray-600 hover:bg-gray-100">Signed Docs</Button>
               </div>
            </div>
          </CardBody>
        </Card>
        
        {/* Document list */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">All Documents</h2>
              <Badge variant="primary">{documents.length} files total</Badge>
            </CardHeader>
            <CardBody>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
                  <p className="mt-2 text-gray-500">Loading documents...</p>
                </div>
              ) : documents.length > 0 ? (
                <div className="space-y-2">
                  {documents.map(doc => (
                    <div
                      key={doc._id}
                      className="flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors duration-200 border border-transparent hover:border-gray-200"
                    >
                      <div className="p-2 bg-primary-50 rounded-lg mr-4">
                        <FileText size={24} className="text-primary-600" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {doc.name}
                          </h3>
                          {getStatusBadge(doc.status)}
                        </div>
                        
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span className="uppercase">{doc.fileType.split('/')[1] || 'DOC'}</span>
                          <span>{formatSize(doc.size)}</span>
                          <span>Added {new Date(doc.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 text-gray-400 hover:text-primary-600"
                          onClick={() => openPreview(doc)}
                          title="Preview"
                        >
                          <Eye size={18} />
                        </Button>

                        <a 
                          href={`${BACKEND_URL}${doc.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={doc.name}
                          className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                          title="Download"
                        >
                          <Download size={18} />
                        </a>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 text-error-600 hover:text-error-700"
                          aria-label="Delete"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <AlertCircle size={24} className="text-gray-500" />
                  </div>
                  <p className="text-gray-600">No documents found</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <DocumentPreview 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        document={selectedDoc} 
      />
    </div>
  );
};