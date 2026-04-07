import React, { useState, useEffect } from 'react';
import { CalendarIcon, Loader2, Video, Clock } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Calendar } from '../../components/ui/Calendar';
import { useAuth } from '../../context/AuthContext';
import { meetingAPI } from '../../services/api';
import { isSameDay } from 'date-fns';
import toast from 'react-hot-toast';

export const MeetingsPage: React.FC = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await meetingAPI.getMeetings();
      if (response.success) {
        setMeetings(response.meetings);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleUpdateStatus = async (id: string, status: 'accepted' | 'rejected') => {
    try {
      const response = await meetingAPI.updateStatus(id, status);
      if (response.success) {
        toast.success(`Meeting ${status}`);
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };
  
  if (!user) return null;

  const selectedDateMeetings = meetings.filter(m => isSameDay(new Date(m.startTime), selectedDate));
  const pendingRequests = meetings.filter(m => m.status === 'pending' && m.participant?._id === user?._id);

  return (
    <div className="space-y-6 animate-fade-in py-2">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Meetings & Pitches</h1>
          <p className="text-gray-500 font-medium">Manage your collaborations and scheduled calls</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           {/* Visual Calendar */}
           <Card className="border-none shadow-xl overflow-hidden min-h-[400px]">
              <CardHeader className="flex justify-between items-center pb-0">
                 <h2 className="text-xl font-bold text-gray-900">Events Calendar</h2>
                 <Badge variant="primary">{meetings.filter(m => m.status === 'accepted').length} Confirmed</Badge>
              </CardHeader>
              <CardBody className="p-0 sm:p-6">
                 {isLoading ? (
                    <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-primary-600" /></div>
                 ) : (
                    <Calendar 
                       meetings={meetings} 
                       onDateClick={(date) => setSelectedDate(date)} 
                    />
                 )}
              </CardBody>
           </Card>

           {/* Selected Date Meetings Section */}
           <Card className="border-none shadow-lg">
              <CardHeader className="border-b border-gray-50 flex justify-between items-center">
                 <h2 className="text-lg font-bold text-gray-800">
                    Schedule for {selectedDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                 </h2>
                 <Badge variant="secondary">{selectedDateMeetings.length} Items</Badge>
              </CardHeader>
              <CardBody>
                 {selectedDateMeetings.length > 0 ? (
                    <div className="space-y-4">
                       {selectedDateMeetings.map(meeting => (
                          <div key={meeting._id} className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between hover:shadow-md transition-all">
                             <div className="flex items-center">
                                <div className="p-3 bg-gray-50 rounded-xl mr-4 text-primary-600">
                                   <CalendarIcon size={20} />
                                </div>
                                <div>
                                   <div className="flex items-center gap-2 mb-0.5">
                                      <h4 className="font-bold text-gray-900">{meeting.title}</h4>
                                      <Badge variant={meeting.status === 'accepted' ? 'success' : 'warning'}>{meeting.status}</Badge>
                                   </div>
                                   <div className="flex items-center text-xs text-gray-500 font-medium space-x-3">
                                      <span className="flex items-center"><Clock size={12} className="mr-1" /> {new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                      <span className="flex items-center"><Video size={12} className="mr-1" /> Room {meeting.roomId.substring(0, 8)}</span>
                                      <span>With: {meeting.host?._id === user?._id ? meeting.participant?.name : meeting.host?.name}</span>
                                   </div>
                                </div>
                             </div>
                             {meeting.status === 'accepted' && (
                                <Button size="sm" onClick={() => window.open(`/meeting/${meeting.roomId}`, '_blank')}>Join Call</Button>
                             )}
                          </div>
                       ))}
                    </div>
                 ) : (
                    <div className="py-12 text-center">
                       <p className="text-gray-400 text-sm italic">Nothing scheduled for this day.</p>
                    </div>
                 )}
              </CardBody>
           </Card>
        </div>

        {/* Requests Sidebar */}
        <div className="space-y-6">
           <Card className="border-none shadow-xl">
             <CardHeader className="flex justify-between items-center text-gray-900">
               <h2 className="text-lg font-bold">New Requests</h2>
               <Badge variant="warning">{pendingRequests.length}</Badge>
             </CardHeader>
             <CardBody className="max-h-[600px] overflow-y-auto">
               {pendingRequests.length > 0 ? (
                 <div className="space-y-4">
                   {pendingRequests.map(meeting => (
                     <div key={meeting._id} className="p-4 border border-gray-100 rounded-2xl bg-gray-50/50 hover:bg-white hover:shadow-md transition-all">
                       <div className="flex items-center mb-3">
                         <Avatar src={meeting.host?.avatarUrl} alt={meeting.host?.name} size="sm" className="mr-2" />
                         <div className="flex-1 min-w-0">
                           <h4 className="text-sm font-bold text-gray-900 truncate">{meeting.host?.name}</h4>
                           <p className="text-[10px] uppercase font-bold text-gray-400">{meeting.host?.role}</p>
                         </div>
                       </div>
                       <h5 className="text-sm font-semibold text-gray-800 mb-2 truncate">{meeting.title}</h5>
                       <div className="flex items-center text-[11px] text-gray-500 mb-4 bg-white p-2 rounded-lg">
                         <CalendarIcon size={12} className="mr-1.5" />
                         {new Date(meeting.startTime).toLocaleDateString()} at {new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </div>
                       <div className="flex gap-2">
                         <Button 
                           variant="outline" 
                           size="sm" 
                           className="flex-1 text-xs py-1.5"
                           onClick={() => handleUpdateStatus(meeting._id, 'rejected')}
                         >
                           Deny
                         </Button>
                         <Button 
                           size="sm" 
                           className="flex-1 text-xs py-1.5"
                           onClick={() => handleUpdateStatus(meeting._id, 'accepted')}
                         >
                           Approve
                         </Button>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-12">
                   <p className="text-gray-400 text-sm">No pending requests.</p>
                 </div>
               )}
             </CardBody>
           </Card>
        </div>
      </div>
    </div>
  );
};
