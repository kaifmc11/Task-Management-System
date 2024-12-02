import { useState, useEffect } from 'react';

const CountdownTimer = ({ dueDate, dueTime }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const dueDatetime = new Date(`${dueDate}T${dueTime}`);
      const now = new Date();
      const difference = dueDatetime - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor((difference / (1000 * 60 * 60)));
      const minutes = Math.floor((difference / (1000 * 60)) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ hours, minutes, seconds });
    };

    // Initial calculation
    calculateTimeLeft();

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [dueDate, dueTime]);

  const formatNumber = (num) => String(num).padStart(2, '0');

  return (
    <div className={`flex items-center gap-1 font-mono text-sm ${isExpired ? 'text-red-500' : 'text-gray-600'}`}>
      <span>{formatNumber(timeLeft.hours)}</span>
      <span>:</span>
      <span>{formatNumber(timeLeft.minutes)}</span>
      <span>:</span>
      <span>{formatNumber(timeLeft.seconds)}</span>
    </div>
  );
};

export default CountdownTimer;