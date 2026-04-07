import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageCircle, Users, Calendar, Building2, MapPin, UserCircle, FileText, DollarSign, Send, Loader2 } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { profileAPI } from '../../services/api';
import { ScheduleMeetingModal } from '../../components/meeting/ScheduleMeetingModal';
import { toast } from 'react-hot-toast';

export const EntrepreneurProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [entrepreneur, setEntrepreneur] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  
  useEffect(() => {
    const fetchEntrepreneur = async () => {
      try {
        if (id) {
          const response = await profileAPI.getUser(id);
          if (response.success) {
            setEntrepreneur(response.user);
          }
        }
      } catch (err) {
        console.error('Error fetching entrepreneur:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEntrepreneur();
  }, [id]);
  
  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }
  
  if (!entrepreneur || entrepreneur.role !== 'entrepreneur') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Entrepreneur not found</h2>
        <p className="text-gray-600 mt-2">The entrepreneur profile you're looking for doesn't exist or has been removed.</p>
        <Link to="/investors">
          <Button variant="outline" className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }
  
  const isCurrentUser = currentUser?._id === entrepreneur._id;
  const isInvestor = currentUser?.role === 'investor';
  
  const handleSendRequest = () => {
    toast.success('Collaboration request sent successfully');
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Profile header */}
      <Card>
        <CardBody className="sm:flex sm:items-start sm:justify-between p-6">
          <div className="sm:flex sm:space-x-6">
            <Avatar
              src={entrepreneur.avatarUrl}
              alt={entrepreneur.name}
              size="xl"
              status={entrepreneur.isOnline ? 'online' : 'offline'}
              className="mx-auto sm:mx-0"
            />
            
            <div className="mt-4 sm:mt-0 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">{entrepreneur.name}</h1>
              <p className="text-gray-600 flex items-center justify-center sm:justify-start mt-1">
                <Building2 size={16} className="mr-1" />
                Founder at {entrepreneur.startupName || 'Startup'}
              </p>
              
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
                <Badge variant="primary">{entrepreneur.industry || 'Tech'}</Badge>
                <Badge variant="gray">
                  <MapPin size={14} className="mr-1" />
                  {entrepreneur.location || 'San Francisco, CA'}
                </Badge>
                <Badge variant="accent">
                  <Calendar size={14} className="mr-1" />
                  Founded {entrepreneur.foundedYear || 2023}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="mt-6 sm:mt-0 flex flex-col sm:flex-row gap-2 justify-center sm:justify-end">
            {!isCurrentUser && (
              <>
                <Link to={`/chat/${entrepreneur._id}`}>
                  <Button
                    variant="outline"
                    leftIcon={<MessageCircle size={18} />}
                  >
                    Message
                  </Button>
                </Link>
                
                {isInvestor && (
                  <>
                    <Button
                      onClick={() => setIsMeetingModalOpen(true)}
                      className="bg-accent-600 hover:bg-accent-700 text-white"
                    >
                      Schedule Meeting
                    </Button>
                    <Button
                      leftIcon={<Send size={18} />}
                      onClick={handleSendRequest}
                    >
                      Request Collaboration
                    </Button>
                  </>
                )}
              </>
            )}
            
            {isCurrentUser && (
              <Button
                variant="outline"
                leftIcon={<UserCircle size={18} />}
              >
                Edit Profile
              </Button>
            )}
          </div>
        </CardBody>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">About</h2>
            </CardHeader>
            <CardBody>
              <p className="text-gray-700">{entrepreneur.bio}</p>
            </CardBody>
          </Card>
          
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Startup Overview</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <h3 className="text-md font-medium text-gray-900">Pitch Summary</h3>
                  <p className="text-gray-700 mt-1">
                    {entrepreneur.pitchSummary}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Funding Needed</h2>
            </CardHeader>
            <CardBody>
              <div className="flex items-center">
                <DollarSign size={24} className="text-accent-600 mr-2" />
                <p className="text-2xl font-bold text-gray-900">{entrepreneur.fundingNeeded || '$500K'}</p>
              </div>
            </CardBody>
          </Card>
          
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Documents</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <div className="flex items-center p-3 border border-gray-200 rounded-md">
                  <FileText size={18} className="text-primary-700 mr-3" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">Pitch Deck</h3>
                  </div>
                  <Button variant="outline" size="sm">View</Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <ScheduleMeetingModal
        isOpen={isMeetingModalOpen}
        onClose={() => setIsMeetingModalOpen(false)}
        participantId={entrepreneur._id}
        participantName={entrepreneur.name}
      />
    </div>
  );
};