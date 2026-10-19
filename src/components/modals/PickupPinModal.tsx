import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck } from 'lucide-react';
import { FoodRequest } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface PickupPinModalProps {
  request: FoodRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PickupPinModal: React.FC<PickupPinModalProps> = ({
  request,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  if (!isOpen || !request) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) {
      showToast('Please enter the 6-digit pickup verification code', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.updateRequestStatus(request.id, 'collected', pin);
      showToast('Handoff verified! Food marked as rescued & impact awarded. 🎉', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Incorrect verification code. Please check with recipient.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden p-6">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                Confirm Pickup Code
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Verify recipient PIN to complete handoff
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <p className="text-xs text-stone-600 dark:text-stone-400">
            Ask <strong className="text-stone-900 dark:text-stone-200">{request.recipientName}</strong> for their 6-digit pickup PIN displayed in their ShareBite dashboard.
          </p>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5 text-center">
              Enter 6-Digit PIN
            </label>
            <input
              type="text"
              maxLength={6}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              required
              className="w-full text-center text-2xl font-mono tracking-widest py-3 px-4 rounded-2xl border-2 border-emerald-600 dark:border-emerald-500 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-hidden"
            />
          </div>

          <div className="p-3 bg-stone-100 dark:bg-stone-800/80 rounded-2xl text-xs text-stone-600 dark:text-stone-400 flex items-center justify-between">
            <span>Rescue item:</span>
            <span className="font-semibold text-stone-900 dark:text-stone-200 truncate max-w-[200px]">
              {request.foodTitle}
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || pin.length !== 6}
            className="w-full py-3.5 rounded-2xl font-semibold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{isSubmitting ? 'Verifying...' : 'Verify & Complete Donation'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
