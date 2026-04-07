import React, { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval 
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface CalendarProps {
  meetings: any[];
  onDateClick?: (date: Date) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ meetings, onDateClick }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full p-1.5 hover:bg-gray-100 text-gray-600"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft size={20} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full p-1.5 hover:bg-gray-100 text-gray-600"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 border-b border-gray-50 bg-gray-50/50">
        {days.map((day, index) => (
          <div key={index} className="py-2 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = 'd';
    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, dateFormat);
        const cloneDay = day;
        
        // Find meetings on this day
        const dayMeetings = meetings.filter(m => isSameDay(new Date(m.startTime), cloneDay));
        const hasAcceptedMeeting = dayMeetings.some(m => m.status === 'accepted');
        const hasPendingMeeting = dayMeetings.some(m => m.status === 'pending');

        days.push(
          <div
            key={day.toString()}
            className={`relative h-14 sm:h-20 border-r border-b border-gray-100 p-1 flex flex-col items-center justify-start transition-colors duration-200 cursor-pointer ${
              !isSameMonth(day, monthStart)
                ? 'bg-gray-50/30 text-gray-300'
                : 'bg-white text-gray-700 hover:bg-primary-50/30'
            } ${isSameDay(day, new Date()) ? 'bg-primary-50/50' : ''}`}
            onClick={() => onDateClick && onDateClick(cloneDay)}
          >
            <span className={`text-sm font-semibold mt-1 px-2 py-0.5 rounded-full ${
              isSameDay(day, new Date()) ? 'bg-primary-600 text-white shadow-sm' : ''
            }`}>
              {formattedDate}
            </span>
            
            <div className="mt-auto mb-1 flex space-x-1">
              {hasAcceptedMeeting && (
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-sm" title="Accepted Meeting" />
              )}
              {hasPendingMeeting && (
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-sm" title="Pending Meeting" />
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="bg-white">{rows}</div>;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  );
};
