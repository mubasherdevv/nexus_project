import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md' 
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95%] h-[90vh]'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-md transition-all"
        onClick={onClose}
      />
      
      <div className={`relative bg-white/90 backdrop-blur-xl border border-white/20 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden w-full ${sizeClasses[size]} animate-in zoom-in-95 duration-200 flex flex-col`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100/50 bg-white/50 backdrop-blur-sm">
          <div className="text-xl font-bold text-gray-900 truncate pr-8 tracking-tight">{title}</div>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full p-1 h-10 w-10 text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 transition-all"
            onClick={onClose}
          >
            <X size={22} />
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
          {children}
        </div>
      </div>
    </div>
  );
};
