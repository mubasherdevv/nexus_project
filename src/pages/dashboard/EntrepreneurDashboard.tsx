import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Bell, Calendar as CalendarIcon, TrendingUp, PlusCircle, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Calendar } from '../../components/ui/Calendar';
import { useAuth } from '../../context/AuthContext';
import { meetingAPI, profileAPI } from '../../services/api';
import { CollaborationRequest } from '../../types';
import isSameDay from 'date-fns/isSameDay';

export const EntrepreneurDashboard: React.FC = () => {
  const { user } = useAuth();
  const [collaborationRequests] = useState<CollaborationRequest[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [recommendedInvestors, setRecommendedInvestors] = useState<any[]>([]);
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const fetchData = async () => {
    try {
      const meetingsData = await meetingAPI.getMeetings();
      if (meetingsData.success) {
        setMeetings(meetingsData.meetings);
      }
      
      const investorsData = await profileAPI.getInvestors();
      if (investorsData.success) {
        setRecommendedInvestors(investorsData.users.slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsRecommendationsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);
  
  if (!user) return null;
  
  const pendingRequests = collaborationRequests.filter(req => req.status === 'pending');
  const upcomingMeetings = meetings.filter(m => (m.status === 'accepted' || m.status === 'pending') && new Date(m.startTime) > new Date());
  const selectedDateMeetings = meetings.filter(m => isSameDay(new Date(m.startTime), selectedDate));

  return (
    <div className="space-y-6 animate-fade-in py-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome, {user.name}</h1>
          <p className="text-gray-500 font-medium">Dashboard Overview & Scheduling</p>
        </div>
        
        <Link to="/investors">
          <Button leftIcon={<PlusCircle size={18} />} className="shadow-lg shadow-primary-600/20">
            Find Investors
          </Button>
        </Link>
      </div>
      
      {/* Summary cards omitted for brevity/layout focus */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <Card className="bg-primary-50 border-none shadow-sm"><CardBody><div className="flex items-center"><div className="p-3 bg-primary-100 rounded-xl mr-3"><Bell size={20} className="text-primary-700"/></div><div><p className="text-xs font-bold text-primary-700 uppercase">Requests</p><h3 className="text-xl font-bold text-primary-900">{pendingRequests.length}</h3></div></div></CardBody></Card>
         <Card className="bg-secondary-50 border-none shadow-sm"><CardBody><div className="flex items-center"><div className="p-3 bg-secondary-100 rounded-xl mr-3"><Users size={20} className="text-secondary-700"/></div><div><p className="text-xs font-bold text-secondary-700 uppercase">Connects</p><h3 className="text-xl font-bold text-secondary-900">{collaborationRequests.filter(req => req.status === 'accepted').length}</h3></div></div></CardBody></Card>
         <Card className="bg-accent-50 border-none shadow-sm"><CardBody><div className="flex items-center"><div className="p-3 bg-accent-100 rounded-xl mr-3"><CalendarIcon size={20} className="text-accent-700"/></div><div><p className="text-xs font-bold text-accent-700 uppercase">Upcoming</p><h3 className="text-xl font-bold text-accent-900">{upcomingMeetings.length}</h3></div></div></CardBody></Card>
         <Card className="bg-green-50 border-none shadow-sm"><CardBody><div className="flex items-center"><div className="p-3 bg-green-100 rounded-xl mr-3"><TrendingUp size={20} className="text-green-700"/></div><div><p className="text-xs font-bold text-green-700 uppercase">Profile Views</p><h3 className="text-xl font-bold text-green-900">24</h3></div></div></CardBody></Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden border-none shadow-xl">
             <CardHeader className="bg-white pb-0">
                <h2 className="text-xl font-bold text-gray-900">Meetings Calendar</h2>
                <p className="text-xs font-medium text-gray-400">Select a date to view scheduled calls</p>
             </CardHeader>
             <CardBody className="p-0 sm:p-6">
                <Calendar 
                   meetings={meetings} 
                   onDateClick={(date) => setSelectedDate(date)} 
                />
             </CardBody>
          </Card>

          {/* Selected Date Meetings */}
          <Card className="border-none shadow-lg">
             <CardHeader className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">
                   Events on {selectedDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                </h3>
                <Badge variant="secondary">{selectedDateMeetings.length} Events</Badge>
             </CardHeader>
             <CardBody>
                {selectedDateMeetings.length > 0 ? (
                   <div className="space-y-3">
                      {selectedDateMeetings.map(meeting => (
                         <div key={meeting._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-md transition-all">
                            <div className="flex-1">
                               <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-bold text-gray-900">{meeting.title}</h4>
                                  <Badge variant={meeting.status === 'accepted' ? 'success' : 'warning'}>
                                     {meeting.status}
                                  </Badge>
                               </div>
                               <p className="text-sm text-gray-500 flex items-center">
                                  <CalendarIcon size={14} className="mr-2" /> 
                                  {new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  <span className="mx-2">•</span>
                                  {meeting.participant?.name || 'Investor'}
                               </p>
                            </div>
                            {meeting.status === 'accepted' && (
                               <Link to={`/meeting/${meeting.roomId}`}>
                                  <Button size="sm">Join Room</Button>
                                </Link>
                            )}
                         </div>
                      ))}
                   </div>
                ) : (
                   <div className="py-12 text-center">
                      <p className="text-gray-400 text-sm font-medium italic">No meetings scheduled for this day.</p>
                   </div>
                )}
             </CardBody>
          </Card>
        </div>
        
        {/* Sidebar Info */}
        <div className="space-y-6">
           <Card className="border-none shadow-lg bg-gradient-to-br from-primary-600 to-primary-700 text-white overflow-hidden">
              <CardBody className="relative py-8">
                 <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                 <h3 className="text-xl font-bold mb-2">Startup Networking</h3>
                 <p className="text-primary-100 text-sm mb-6">Complete your pitch deck to get 2x more investor interest.</p>
                 <Link to="/documents">
                    <Button variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20">
                       Go to Documents
                    </Button>
                 </Link>
              </CardBody>
           </Card>

           <Card className="border-none shadow-lg">
             <CardHeader className="flex justify-between items-center text-gray-900">
               <h2 className="text-lg font-bold">Recommendations</h2>
               <Link to="/investors" className="text-xs font-bold text-primary-600 hover:underline">VIEW ALL</Link>
             </CardHeader>
             <CardBody>
               {isRecommendationsLoading ? (
                 <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary-600" size={32} /></div>
               ) : (
                 <div className="space-y-4">
                   {recommendedInvestors.map(investor => (
                     <div key={investor._id} className="group flex items-center p-3 hover:bg-gray-50 rounded-2xl transition-all cursor-pointer">
                       <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold mr-3 shadow-inner">
                         {investor.name.charAt(0)}
                       </div>
                       <div className="flex-1 min-w-0">
                         <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-primary-600 transition-colors">{investor.name}</h4>
                         <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                            {investor.investmentStage?.[0] || 'Early Stage'}
                         </p>
                       </div>
                       <Link to={`/profile/investor/${investor._id}`}>
                         <div className="p-1.5 bg-gray-100 rounded-lg text-gray-400 group-hover:bg-primary-600 group-hover:text-white transition-all">
                            <PlusCircle size={16} />
                         </div>
                       </Link>
                     </div>
                   ))}
                 </div>
               )}
             </CardBody>
           </Card>
        </div>
      </div>
    </div>
  );
};