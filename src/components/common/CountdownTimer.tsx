import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, AlertCircle } from 'lucide-react';

interface CountdownTimerProps {
  expiryDate: string;
  className?: string;
  showIcon?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  expiryDate,
  className = '',
  showIcon = true,
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
    totalHours: number;
  }>({ hours: 0, minutes: 0, seconds: 0, isExpired: false, totalHours: 0 });

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const target = new Date(expiryDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true, totalHours: 0 });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      const totalHours = diff / (1000 * 60 * 60);

      setTimeLeft({ hours, minutes, seconds, isExpired: false, totalHours });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [expiryDate]);

  if (timeLeft.isExpired) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-900 ${className}`}
      >
        {showIcon && <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
        Expired
      </span>
    );
  }

  // Under 1 hour - critical red
  if (timeLeft.totalHours < 1) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse ${className}`}
      >
        {showIcon && <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
        Urgent: {timeLeft.minutes}m {timeLeft.seconds}s left
      </span>
    );
  }

  // Under 4 hours - warning orange
  if (timeLeft.totalHours < 4) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 ${className}`}
      >
        {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
        {timeLeft.hours}h {timeLeft.minutes}m left
      </span>
    );
  }

  // Normal safe window - calm emerald
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 ${className}`}
    >
      {showIcon && <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
      {timeLeft.hours}h {timeLeft.minutes}m left
    </span>
  );
};
