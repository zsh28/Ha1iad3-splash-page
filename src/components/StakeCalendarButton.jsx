import React from 'react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { toast } from 'react-hot-toast';

const createCalendarEvent = (stake, estimatedDays) => {
  // Validate inputs
  if (!stake || !stake.pubkey || estimatedDays === undefined) {
    console.error('Invalid stake data for calendar event');
    return null;
  }

  // Ensure we have a positive time estimate
  const safeDays = Math.max(0.1, estimatedDays); // Minimum 0.1 days to avoid past events
  
  const now = new Date();
  const completionDate = new Date(now.getTime() + (safeDays * 24 * 60 * 60 * 1000));
  
  // Ensure dates are in future
  if (completionDate <= now) {
    completionDate.setTime(now.getTime() + (1 * 60 * 60 * 1000)); // Set to 1 hour from now
  }
  
  const formatDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const startDate = formatDate(completionDate);
  const endDate = formatDate(new Date(completionDate.getTime() + 60 * 60 * 1000));

  const description = `Your stake of ${(stake.lamports / LAMPORTS_PER_SOL).toFixed(4)} SOL will be ready to withdraw.\\n\\n` +
    `Validator: ${stake.validatorName}\\n` +
    `Stake Account: ${stake.pubkey}\\n\\n` +
    `Visit ${window.location.origin} to withdraw your stake.`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${startDate}`,
    `DTEND:${endDate}`,
    'SUMMARY:SOL Stake Ready to Withdraw',
    `DESCRIPTION:${description}`,
    'STATUS:CONFIRMED',
    `UID:${stake.pubkey}-${startDate}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return icsContent;
};

const downloadCalendarFile = (stake, estimatedDays) => {
  try {
    const icsContent = createCalendarEvent(stake, estimatedDays);
    if (!icsContent) {
      throw new Error('Failed to create calendar event');
    }

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `stake-withdrawal-${stake.pubkey.slice(0, 8)}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Calendar event downloaded successfully');
  } catch (error) {
    console.error('Error creating calendar event:', error);
    toast.error('Failed to create calendar event. Please try again.');
  }
};

const StakeCalendarButton = ({ stake, estimatedDays }) => {
  return (
    <button
      className="ml-2 px-3 py-2 rounded bg-blue-500 hover:bg-blue-600 text-sm flex items-center"
      onClick={() => downloadCalendarFile(stake, Math.ceil(estimatedDays))}
      title="Add to Calendar"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </button>
  );
};

export default StakeCalendarButton; 