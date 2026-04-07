import React from 'react';
import { Modal } from '../ui/Modal';
import { Download, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface DocumentPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    name: string;
    url: string;
    fileType: string;
    originalName?: string;
  } | null;
}

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ 
  isOpen, 
  onClose, 
  document 
}) => {
  if (!document) return null;

  const fullUrl = `${BACKEND_URL}${document.url}`;
  const isPDF = document.fileType.includes('pdf');
  const isImage = document.fileType.includes('image');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Preview: ${document.name}`}
      size="full"
    >
      <div className="flex flex-col h-full bg-gray-50">
        {/* Toolbar */}
        <div className="p-3 bg-white border-b border-gray-200 flex justify-between items-center px-6">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded">
              {document.fileType.split('/')[1] || 'FILE'}
            </span>
            <span className="text-sm font-medium text-gray-500 truncate max-w-[200px]">
              {document.originalName || document.name}
            </span>
          </div>
          
          <div className="flex space-x-2">
            <a 
              href={fullUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all hover:shadow-sm"
            >
              <ExternalLink size={14} className="mr-2" /> Open Original
            </a>
            <a 
              href={fullUrl} 
              download={document.originalName || document.name}
              className="inline-flex items-center px-4 py-1.5 text-xs font-bold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-all shadow-md shadow-primary-600/20"
            >
              <Download size={14} className="mr-2" /> Download
            </a>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4 sm:p-8">
          {isPDF ? (
            <iframe
              src={`${fullUrl}#toolbar=0&navpanes=0&view=FitH`}
              className="w-full h-full rounded-xl shadow-2xl bg-white border border-transparent"
              title="PDF Preview"
            />
          ) : isImage ? (
            <div className="relative group max-w-full max-h-full">
              <img
                src={fullUrl}
                alt={document.name}
                className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl bg-white p-2"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-xl max-w-md text-center">
              <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 mb-6">
                <Loader2 className="animate-spin" size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Generating Preview...</h3>
              <p className="text-gray-500 mb-6 text-sm">
                We're optimizing this file for the web viewer. You can always download the original file instead.
              </p>
              <Button onClick={() => window.open(fullUrl, '_blank')}>
                Open Manually
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
