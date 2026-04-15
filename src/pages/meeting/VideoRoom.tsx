import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

import { SOCKET_URL } from '../../services/api';

export const VideoRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const initCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        socketRef.current = io(SOCKET_URL);
        
        socketRef.current.emit('join-room', roomId);

        socketRef.current.on('user-joined', () => {
          toast.success('Someone joined the call');
          createOffer();
        });

        socketRef.current.on('offer', async ({ offer }) => {
          await handleOffer(offer);
        });

        socketRef.current.on('answer', async ({ answer }) => {
          await peerRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socketRef.current.on('ice-candidate', async ({ candidate }) => {
          if (candidate) {
            await peerRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
          }
        });
      } catch (err) {
        toast.error('Could not access camera/microphone');
        console.error(err);
        navigate('/dashboard');
      }
    };

    initCall();

    return () => {
      localStream?.getTracks().forEach(track => track.stop());
      socketRef.current?.disconnect();
      peerRef.current?.close();
    };
  }, [roomId]);

  const createPeer = () => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('ice-candidate', { candidate: event.candidate, roomId });
      }
    };

    peer.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    localStream?.getTracks().forEach(track => {
      peer.addTrack(track, localStream);
    });

    peerRef.current = peer;
    return peer;
  };

  const createOffer = async () => {
    const peer = createPeer();
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socketRef.current?.emit('offer', { offer, roomId });
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    const peer = createPeer();
    await peer.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    socketRef.current?.emit('answer', { answer, roomId });
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks()[0].enabled = isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks()[0].enabled = isVideoOff;
      setIsVideoOff(!isVideoOff);
    }
  };

  const endCall = () => {
    localStream?.getTracks().forEach(track => track.stop());
    navigate('/dashboard');
  };

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col z-[60]">
      {/* Header */}
      <div className="p-4 bg-gray-800 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="font-medium">Live Meeting: {roomId?.substring(0, 8)}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Users size={16} />
            <span>{remoteStream ? '2 Participants' : 'Waiting for others...'}</span>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center justify-center">
        <div className="relative bg-gray-800 rounded-2xl overflow-hidden aspect-video shadow-2xl border-2 border-gray-700">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
          />
          {isVideoOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <AvatarPlaceholder name={user?.name || 'You'} />
            </div>
          )}
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded-full text-white text-sm">
            You {isMuted && '(Muted)'}
          </div>
        </div>

        <div className="relative bg-gray-800 rounded-2xl overflow-hidden aspect-video shadow-2xl border-2 border-gray-700">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${!remoteStream ? 'hidden' : ''}`}
          />
          {!remoteStream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 text-gray-400">
              <Loader2 className="animate-spin mb-2" size={32} />
              <p>Waiting for participant...</p>
            </div>
          )}
          {remoteStream && (
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded-full text-white text-sm">
              Partner
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 bg-gray-800 flex justify-center items-center gap-6">
        <Button
          variant={isMuted ? 'error' : 'outline'}
          className={`rounded-full p-4 ${!isMuted ? 'text-white border-gray-600' : ''}`}
          onClick={toggleMute}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </Button>

        <Button
          variant={isVideoOff ? 'error' : 'outline'}
          className={`rounded-full p-4 ${!isVideoOff ? 'text-white border-gray-600' : ''}`}
          onClick={toggleVideo}
        >
          {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
        </Button>

        <Button
          variant="error"
          className="rounded-full p-4 bg-red-600 hover:bg-red-700"
          onClick={endCall}
        >
          <PhoneOff size={24} />
        </Button>
      </div>
    </div>
  );
};

const AvatarPlaceholder = ({ name }: { name: string }) => (
  <div className="w-24 h-24 rounded-full bg-primary-600 flex items-center justify-center text-white text-3xl font-bold">
    {name.charAt(0).toUpperCase()}
  </div>
);
