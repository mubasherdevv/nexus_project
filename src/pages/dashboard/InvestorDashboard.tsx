import React, { useState, useEffect } from 'react';
import { Users, Calendar as CalendarIcon, Filter, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Calendar } from '../../components/ui/Calendar';
import { useAuth } from '../../context/AuthContext';
import { meetingAPI, profileAPI } from '../../services/api';
import { isSameDay } from 'date-fns';
import toast from 'react-hot-toast';

export const InvestorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [pendingMeetings, setPendingMeetings] = useState<any[]>([]);
  const [recentEntrepreneurs, setRecentEntrepreneurs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [meetingsData, entrepreneursData] = await Promise.all([
        meetingAPI.getMeetings(),
        profileAPI.getEntrepreneurs()
      ]);

      if (meetingsData.success) {
        setMeetings(meetingsData.meetings);
        setPendingMeetings(meetingsData.meetings.filter((m: any) => m.status === 'pending' && m.participant._id === user?._id));
      }
      
      if (entrepreneursData.success) {
        setRecentEntrepreneurs(entrepreneursData.users.slice(0, 4));
      }
    } catch (error) {
      console.error('Error fetching investor dashboard data:', error);
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
        fetchData(); // Refresh data
      }
    } catch (error) {
      toast.error('Failed to update meeting status');
    }
  };
  
  if (!user) return null;

  const selectedDateMeetings = meetings.filter(m => isSameDay(new Date(m.startTime), selectedDate));
  const acceptedMeetings = meetings.filter((m: any) => m.status === 'accepted');
  const activeStartupsCount = new Set(acceptedMeetings.map((m: any) => m.host._id)).size;

  return (
    <div className="space-y-6 animate-fade-in py-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight text-gradient bg-clip-text">Investor Portal</h1>
          <p className="text-gray-500 font-medium tracking-tight">Portfolio Overview & Pitch Scheduling</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Filter size={16} />}>Filter</Button>
          <Button size="sm" leftIcon={<Users size={16} />}>Portfolio</Button>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none bg-amber-50 shadow-sm">
          <CardBody>
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">Pending Pitches</p>
            <h3 className="text-2xl font-bold text-amber-900">{pendingMeetings.length}</h3>
            <div className="mt-2 text-xs text-amber-600 font-bold flex items-center">
               Action required
            </div>
          </CardBody>
        </Card>
        
        <Card className="border-none bg-emerald-50 shadow-sm">
          <CardBody>
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Scheduled Today</p>
            <h3 className="text-2xl font-bold text-emerald-900">{selectedDateMeetings.filter(m => m.status === 'accepted').length}</h3>
            <div className="mt-2 text-xs text-emerald-600 font-bold">In selected date</div>
          </CardBody>
        </Card>
        
        <Card className="border-none bg-rose-50 shadow-sm">
          <CardBody>
            <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">Portfolio Size</p>
            <h3 className="text-2xl font-bold text-rose-900">{activeStartupsCount}</h3>
            <div className="mt-2 text-xs text-rose-600 font-bold">Active startups</div>
          </CardBody>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           {/* Visual Calendar */}
           <Card className="border-none shadow-xl overflow-hidden min-h-[400px]">
              <CardHeader className="flex justify-between items-center pb-0">
                 <h2 className="text-xl font-bold text-gray-900">Meetings Calendar</h2>
                 <Badge variant="primary">{acceptedMeetings.length} Confirmed</Badge>
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
              <CardHeader className="border-b border-gray-50">
                 <h2 className="text-lg font-bold text-gray-800">
                    Schedule for {selectedDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                 </h2>
              </CardHeader>
              <CardBody>
                 {selectedDateMeetings.length > 0 ? (
                    <div className="space-y-3">
                       {selectedDateMeetings.map(meeting => (
                          <div key={meeting._id} className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between hover:shadow-md transition-all">
                             <div className="flex items-center">
                                <div className="p-3 bg-primary-50 rounded-xl mr-4 text-primary-600">
                                   <CalendarIcon size={20} />
                                </div>
                                <div>
                                   <div className="flex items-center gap-2 mb-0.5">
                                      <h4 className="font-bold text-gray-900">{meeting.title}</h4>
                                      <Badge variant={meeting.status === 'accepted' ? 'success' : 'warning'}>{meeting.status}</Badge>
                                   </div>
                                   <p className="text-xs text-gray-500 font-medium">
                                      {new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • 
                                      {meeting.host.name}
                                   </p>
                                </div>
                             </div>
                             {meeting.status === 'accepted' && (
                                <Button size="sm" onClick={() => window.location.href=`/meeting/${meeting.roomId}`}>Join Pitch</Button>
                             )}
                          </div>
                       ))}
                    </div>
                 ) : (
                    <div className="py-12 text-center">
                       <p className="text-gray-400 text-sm italic">You have no meetings scheduled for this day.</p>
                    </div>
                 )}
              </CardBody>
           </Card>
        </div>

        {/* Requests Sidebar */}
        <div className="space-y-6">
           <Card className="border-none shadow-xl">
             <CardHeader className="flex justify-between items-center text-gray-900">
               <h2 className="text-lg font-bold">New Pitch Requests</h2>
               <Badge variant="warning">{pendingMeetings.length}</Badge>
             </CardHeader>
             <CardBody className="max-h-[500px] overflow-y-auto">
               {pendingMeetings.length > 0 ? (
                 <div className="space-y-4">
                   {pendingMeetings.map(meeting => (
                     <div key={meeting._id} className="p-4 border border-gray-100 rounded-2xl bg-gray-50/50 hover:bg-white hover:shadow-md transition-all group">
                       <div className="flex items-center mb-3">
                         <Avatar src={meeting.host.avatarUrl} alt={meeting.host.name} size="sm" className="mr-2" />
                         <div className="flex-1 min-w-0">
                           <h4 className="text-sm font-bold text-gray-900 truncate">{meeting.host.name}</h4>
                           <p className="text-[10px] uppercase font-bold text-gray-400">Founder</p>
                         </div>
                       </div>
                       <h5 className="text-sm font-semibold text-gray-800 mb-2 truncate group-hover:text-primary-600 transition-colors">{meeting.title}</h5>
                       <div className="flex items-center text-[11px] text-gray-500 mb-4 bg-white p-2 rounded-lg">
                         <CalendarIcon size={12} className="mr-1.5" />
                         {new Date(meeting.startTime).toLocaleDateString()} at {new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </div>
                       <div className="flex gap-2">
                         <Button 
                           variant="outline" 
                           size="sm" 
                           className="flex-1 py-2 text-error-600 border-error-100 bg-error-50 hover:bg-error-100"
                           onClick={() => handleUpdateStatus(meeting._id, 'rejected')}
                         >
                           <XCircle size={14} className="mr-1" /> Deny
                         </Button>
                         <Button 
                           size="sm" 
                           className="flex-1 py-2 shadow-lg shadow-primary-600/20"
                           onClick={() => handleUpdateStatus(meeting._id, 'accepted')}
                         >
                           <CheckCircle size={14} className="mr-1" /> Approve
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

           <Card className="border-none shadow-lg bg-gray-900 text-white overflow-hidden">
              <CardBody className="py-6">
                 <h3 className="font-bold text-lg mb-2">Investor Analytics</h3>
                 <p className="text-gray-400 text-xs mb-4">View detailed metrics of your portfolio performance.</p>
                 <Button variant="outline" className="w-full border-gray-700 text-gray-300 hover:text-white">Open Insights</Button>
              </CardBody>
           </Card>
        </div>
      </div>
    </div>
  );
};