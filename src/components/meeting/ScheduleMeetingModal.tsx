import React, { useState } from 'react';
import { Calendar, Clock, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { meetingAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  participantId: string;
  participantName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({
  isOpen,
  participantId,
  participantName,
  onClose,
  onSuccess
}) => {
  if (!isOpen) return null;
  
  const [title, setTitle] = useState(`Meeting with ${participantName}`);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('30');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) {
      toast.error('Please select both date and time');
      return;
    }

    // Robust date construction for cross-browser compatibility
    const startStr = `${date}T${time}:00`;
    const startTime = new Date(startStr);
    
    if (isNaN(startTime.getTime())) {
      toast.error('Invalid date or time format. Please try again.');
      return;
    }

    const endTime = new Date(startTime.getTime() + parseInt(duration) * 60000);

    try {
      setIsSubmitting(true);
      const data = await meetingAPI.schedule({
        title,
        participant: participantId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      });

      if (data.success) {
        toast.success('Meeting scheduled successfully!');
        onSuccess?.();
        onClose();
      } else {
        toast.error(data.message || 'Failed to schedule meeting');
      }
    } catch (error: any) {
      console.error('Schedule meeting error:', error);
      const message = error.response?.data?.message || 'Failed to schedule meeting';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Schedule Meeting</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Meeting Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            fullWidth
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              fullWidth
              startAdornment={<Calendar size={18} />}
            />
            <Input
              label="Time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              fullWidth
              startAdornment={<Clock size={18} />}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">1 hour</option>
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <Button variant="outline" fullWidth onClick={onClose} type="button">
              Cancel
            </Button>
            <Button 
              type="submit" 
              fullWidth 
              isLoading={isSubmitting}
              leftIcon={!isSubmitting && <Calendar size={18} />}
            >
              Schedule
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
