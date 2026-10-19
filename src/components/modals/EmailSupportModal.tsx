import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Send,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Clock,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface EmailSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubject?: string;
}

export const EmailSupportModal: React.FC<EmailSupportModalProps> = ({
  isOpen,
  onClose,
  defaultSubject = 'Food Recovery Support Inquiry',
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync user details if logged in
  useEffect(() => {
    if (user) {
      if (!name) setName(user.name);
      if (!email) setEmail(user.email);
    }
  }, [user]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('lakshitameena210@gmail.com');
    setCopied(true);
    showToast('Copied lakshitameena210@gmail.com to clipboard! 📋', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      showToast('Please fill in your name, email, and message.', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.submitContact({
        name: name.trim(),
        email: email.trim(),
        category: 'Food Recovery Support',
        subject: subject.trim() || 'Food Recovery Support Inquiry',
        message: message.trim(),
      });

      setIsSent(true);
      showToast('Message sent to our food recovery team! We will reply shortly.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to send message. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSent(false);
    setMessage('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in"
      onClick={handleResetAndClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with Close Tab Option on Top Right Corner */}
        <div className="flex items-start justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100">
                Email Food Recovery Team
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Our Jaipur coordination desk responds to support requests 7 days a week.
              </p>
            </div>
          </div>

          {/* Close Button on Top Right Corner */}
          <button
            type="button"
            onClick={handleResetAndClose}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-xl transition cursor-pointer"
            title="Close Tab (Esc)"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </button>
        </div>

        {/* Email Quick Action Card */}
        <div className="my-4 p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-[11px] text-stone-400 font-medium block">
              Official Direct Email Address:
            </span>
            <span className="font-bold text-stone-900 dark:text-stone-100 font-mono text-sm">
              lakshitameena210@gmail.com
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyEmail}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:text-emerald-700 dark:hover:text-emerald-400 font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Email'}</span>
            </button>
            <a
              href="mailto:lakshitameena210@gmail.com?subject=Food%20Recovery%20Support%20Inquiry"
              className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1.5 transition hover:bg-emerald-100 dark:hover:bg-emerald-900"
              title="Open default email application"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Mail App</span>
            </a>
          </div>
        </div>

        {isSent ? (
          <div className="py-8 text-center space-y-4 animate-in fade-in">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                Message Dispatched to Recovery Team!
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 max-w-sm mx-auto mt-1">
                Thank you! Your inquiry has been routed to our Jaipur coordination desk at{' '}
                <strong className="text-emerald-700 dark:text-emerald-400 font-mono">lakshitameena210@gmail.com</strong>.
                Our team will reply to <span className="font-medium underline">{email}</span> shortly.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsSent(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100"
              >
                Send Another Message
              </button>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition"
              >
                Done / Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Rohit Kulkarni"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Your Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Subject
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Subject of your inquiry"
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Message to Recovery Desk *
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Describe your inquiry, urgent surplus pickup, NGO partnership question, or feedback..."
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-600 resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <span className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" /> Average response: Under 30 mins
              </span>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Sending...' : 'Send Message to Team'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
