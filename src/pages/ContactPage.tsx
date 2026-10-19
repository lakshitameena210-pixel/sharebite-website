import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: 'How quickly can surplus food be picked up after posting?',
    answer:
      'Most food listings are claimed within 45 to 90 minutes. Registered community shelters and nearby non-profit vans within a 5-mile radius receive real-time notifications for urgent posts.',
  },
  {
    question: 'Is surplus food donation legally protected against liability?',
    answer:
      'Yes. In the United States, food donors and non-profit recipients are protected under the Bill Emerson Good Samaritan Food Donation Act, which shields donors from civil and criminal liability when donating wholesome food in good faith.',
  },
  {
    question: 'Who is eligible to request food on ShareBite?',
    answer:
      'Both verified non-profit organizations (501(c)(3) charities, shelters, food banks, church kitchens) and independent individuals in need can request food. Verified organizations receive prioritized access to high-volume commercial catering rescues.',
  },
  {
    question: 'What food safety protocols does ShareBite require?',
    answer:
      'Donors specify whether food is hot (must be kept above 60°C / 140°F) or cold (chilled below 4°C / 40°F). Prepared foods must be properly covered in clean food-safe containers with accurate allergen and preparation time stamps.',
  },
  {
    question: 'How do charities obtain the Verified Partner badge?',
    answer:
      'Charities can submit their legal non-profit registration or tax ID directly from the Dashboard. Our verification team reviews documentation within 24 hours to approve priority claims.',
  },
];

export const ContactPage: React.FC = () => {
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('Restaurant / Business Donor Inquiry');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // FAQ accordion open states
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      showToast('Please fill in your name, email, and message.', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.submitContact({
        name,
        email,
        phone,
        category,
        subject: subject || `${category} - from ${name}`,
        message,
      });

      setIsSubmitted(true);
      showToast('Thank you! Your message has been sent to our coordination team.', 'success');
      // Reset form
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit contact form', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#fbfbfa] dark:bg-[#0f1715] text-stone-900 dark:text-stone-100 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Community Support & Inquiries</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif text-stone-900 dark:text-stone-100">
            Contact the ShareBite Team
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-2 leading-relaxed">
            Have questions about donating surplus food, registering your shelter, or setting up a corporate food recovery program? We're here to help.
          </p>
        </div>

        {/* Centered Clean Contact Form */}
        <div className="max-w-2xl mx-auto">
          <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xl">
            <h2 className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100 mb-1">
              Send Us a Message
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">
              Fill out the simple form below and our team will get back to you within 24 hours.
            </p>

            {isSubmitted ? (
              <div className="p-8 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-center space-y-3 animate-in fade-in">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-emerald-900 dark:text-emerald-100 font-serif">
                  Message Sent Successfully!
                </h3>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 max-w-md mx-auto leading-relaxed">
                  Thank you for reaching out. We have received your inquiry and our team is already reviewing your details.
                </p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="mt-2 px-5 py-2 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-300 border border-emerald-400 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+91 98200 12345"
                      className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                      Topic
                    </label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                    >
                      <option value="Restaurant / Business Donor Inquiry">Restaurant or Business Donor Inquiry</option>
                      <option value="Charity & Shelter Verification Help">Charity or Shelter Verification Help</option>
                      <option value="General Question / Community Support">General Question or Community Support</option>
                      <option value="Urgent Same-Day Food Pickup Assistance">Food Pickup Assistance</option>
                      <option value="Partnership & Press">Partnership or Feedback</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Brief description of your question..."
                    className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Message *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Tell us what you need help with..."
                    className="w-full p-3.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Sending Message...' : 'Send Message'}</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Frequently Asked Questions
            </span>
            <h2 className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100 mt-1">
              Common Questions About ShareBite
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs transition"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-sm font-semibold text-stone-900 dark:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-850 transition"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-stone-600 dark:text-stone-300 leading-relaxed border-t border-stone-100 dark:border-stone-800 animate-in fade-in">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
