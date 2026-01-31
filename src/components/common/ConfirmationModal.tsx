import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  details?: { label: string; value: string }[];
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'default' | 'success' | 'warning' | 'danger';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  details = [],
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'default'
}) => {
  if (!isOpen) return null;

  const colors = {
    default: {
      bg: 'bg-primary',
      text: 'text-primary-dark',
      border: 'border-primary',
      icon: 'verified_user'
    },
    success: {
      bg: 'bg-emerald-500',
      text: 'text-emerald-500',
      border: 'border-emerald-500',
      icon: 'check_circle'
    },
    warning: {
      bg: 'bg-amber-500',
      text: 'text-amber-500',
      border: 'border-amber-500',
      icon: 'warning'
    },
    danger: {
      bg: 'bg-rose-500',
      text: 'text-rose-500',
      border: 'border-rose-500',
      icon: 'dangerous'
    }
  };

  const scheme = colors[type];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-8 bg-app-bg/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-app-surface rounded-[3.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300 border border-app-border overflow-hidden font-sans">
        {/* Header */}
        <div className="p-8 pb-6 border-b border-app-border relative">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-app-text tracking-tighter uppercase">{title}</h2>
            <button
              onClick={onCancel}
              className="w-10 h-10 flex items-center justify-center bg-app-surface-2 rounded-full text-app-text-muted hover:text-app-text hover:bg-app-surface-2 transition-all active:scale-90"
            >
              <span className="material-symbols-rounded">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <p className="text-app-text-muted text-[13px] font-bold leading-relaxed mb-6">{message}</p>

          {details.length > 0 && (
            <div className="bg-app-surface-2 rounded-[2.5rem] p-6 space-y-4 mb-6 border border-app-border">
              {details.map((detail, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-app-text-muted uppercase tracking-widest">
                    {detail.label}
                  </span>
                  <span className="text-sm font-black text-app-text tracking-tight">
                    {detail.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className={`flex items-start gap-4 p-5 rounded-[2rem] ${scheme.text} bg-app-bg/50 border-2 border-app-border group`}>
            <span className="material-symbols-rounded text-2xl group-hover:scale-110 transition-transform">{scheme.icon}</span>
            <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
              {type === 'default' && 'Payment will be collected in cash on arrival at the venue.'}
              {type === 'success' && 'Everything looks good. No action needed.'}
              {type === 'warning' && 'Please double-check the details before proceeding.'}
              {type === 'danger' && 'Caution: This action is permanent and cannot be reversed.'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className={`p-8 pt-4 flex gap-4 ${!cancelText ? 'justify-center' : ''}`}>
          {cancelText && (
            <button
              onClick={onCancel}
              className="flex-1 bg-app-surface-2 text-app-text-muted font-black py-5 rounded-[1.8rem] hover:bg-app-surface-2 hover:text-app-text transition-all text-[11px] tracking-[0.2em] uppercase active:scale-95"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`${cancelText ? 'flex-1' : 'w-full max-w-[200px]'} ${scheme.bg} ${type === 'default' ? 'text-slate-900' : 'text-white'} font-black py-5 rounded-[1.8rem] transition-all text-[11px] tracking-[0.2em] uppercase shadow-xl shadow-${type === 'default' ? 'primary' : type}/20 active:scale-95`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

interface SuccessModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  buttonText?: string;
  onClose: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  title,
  message,
  buttonText = 'OK',
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-8 bg-app-bg/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-app-surface rounded-[4rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-500 border border-app-border overflow-hidden font-sans text-center p-10">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-primary rounded-[2.5rem] flex items-center justify-center animate-bounce-short shadow-2xl shadow-primary/20">
            <span className="material-symbols-rounded text-5xl text-slate-900 font-bold">celebration</span>
          </div>
        </div>

        {/* Content */}
        <h2 className="text-3xl font-black text-app-text mb-3 tracking-tighter uppercase">{title}</h2>
        <p className="text-app-text-muted text-[13px] font-bold leading-relaxed mb-8">
          {message}
        </p>

        <button
          onClick={onClose}
          className="w-full bg-app-surface-2 text-app-text font-black py-5 rounded-[1.8rem] hover:brightness-110 transition-all text-[11px] tracking-[0.2em] uppercase shadow-2xl shadow-black/20 active:scale-95 border border-app-border"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};
