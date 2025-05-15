// src/app/webinar/[id]/page.tsx
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, updateDoc, serverTimestamp, setDoc, getDoc, collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/auth/auth-provider';
import type { Webinar, Participant, ChatMessage } from '@/types';

import { VideoGrid } from './components/VideoGrid';
import { ChatSidebar } from './components/ChatSidebar';
import { Controls } from './components/Controls';
import { ParticipantList } from './components/ParticipantList';
import { SummaryGenerator } from './components/SummaryGenerator';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function WebinarRoomPage() {
  const params = useParams();
  const webinarId = params.id as string;
  const { user, loading: authLoading, isHost: checkIsHost } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [webinar, setWebinar] = useState<Webinar | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [localParticipant, setLocalParticipant] = useState<Participant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showParticipants, setShowParticipants] = useState<'chat' | 'participants'>('participants'); // Default to 'participants'


  const isCurrentUserHost = webinar ? checkIsHost(webinar.hostId) : false;

  // Fetch webinar details
  useEffect(() => {
    if (!webinarId) return;
    setIsLoading(true);
    const unsubWebinar = onSnapshot(doc(db, 'webinars', webinarId), (docSnap) => {
      if (docSnap.exists()) {
        const webinarData = { id: docSnap.id, ...docSnap.data() } as Webinar;
        setWebinar(webinarData);
        if(webinarData.status === 'ended' && !checkIsHost(webinarData.hostId)){
          toast({ title: "Webinar Ended", description: "This webinar has already ended.", variant: "destructive" });
          router.push('/dashboard');
        }
      } else {
        toast({ title: "Webinar Not Found", description: "This webinar does not exist or has been deleted.", variant: "destructive" });
        router.push('/dashboard');
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching webinar details:", error);
      toast({ title: "Error", description: "Could not load webinar details.", variant: "destructive" });
      setIsLoading(false);
    });
    return () => unsubWebinar();
  }, [webinarId, router, toast, checkIsHost]);

  // Fetch participants and handle local participant state
  useEffect(() => {
    if (!webinarId || !user) return;

    const participantsRef = collection(db, `webinars/${webinarId}/participants`);
    const unsubParticipants = onSnapshot(participantsRef, (snapshot) => {
      const fetchedParticipants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Participant));
      setParticipants(fetchedParticipants);
      const foundLocal = fetchedParticipants.find(p => p.id === user.uid);
      if (foundLocal) {
        setLocalParticipant(foundLocal);
      } else {
        // If user is not in participant list but is authenticated, try to add them (e.g., rejoining)
        // This could also be handled by a "Join" button before entering the room.
        // For simplicity, if they have access to this page, assume they should be a participant.
         const addParticipant = async () => {
          const webinarDoc = await getDoc(doc(db, 'webinars', webinarId));
          if (!webinarDoc.exists()) return;
          const webinarData = webinarDoc.data() as Omit<Webinar, 'id'>;

          const newParticipant: Omit<Participant, 'id' | 'joinedAt'> = {
            name: user.displayName || user.email || 'User',
            role: user.uid === webinarData.hostId ? 'host' : 'participant',
            isMuted: false,
            isVideoOff: true, // Default video off
            handRaised: false,
          };
          await setDoc(doc(db, `webinars/${webinarId}/participants/${user.uid}`), {
            ...newParticipant,
            joinedAt: serverTimestamp(),
          });
          setLocalParticipant({ ...newParticipant, id: user.uid, joinedAt: new Timestamp(Date.now()/1000,0) }); // Optimistic update
        };
        addParticipant();
      }
    });
    
    return () => unsubParticipants();
  }, [webinarId, user]);

  // Fetch chat messages
  useEffect(() => {
    if (!webinarId) return;
    const messagesRef = collection(db, `webinars/${webinarId}/messages`);
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    const unsubMessages = onSnapshot(q, (snapshot) => {
      setChatMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)));
    });
    return () => unsubMessages();
  }, [webinarId]);
  
  useEffect(() => {
    setShowParticipants(isCurrentUserHost ? 'participants' : 'chat');
  }, [isCurrentUserHost]);


  const updateParticipantField = async (field: keyof Participant, value: any) => {
    if (!webinarId || !user || !localParticipant) return;
    const participantRef = doc(db, `webinars/${webinarId}/participants/${user.uid}`);
    try {
      await updateDoc(participantRef, { [field]: value });
      // Optimistically update local state - handled by onSnapshot for remote, but good for local immediate feedback
      setLocalParticipant(prev => prev ? { ...prev, [field]: value } : null);
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      toast({ title: "Update Failed", description: `Could not update your ${field} status.`, variant: "destructive" });
    }
  };

  const handleToggleMute = () => updateParticipantField('isMuted', !localParticipant?.isMuted);
  const handleToggleVideo = () => updateParticipantField('isVideoOff', !localParticipant?.isVideoOff);
  const handleRaiseHand = () => updateParticipantField('handRaised', !localParticipant?.handRaised);
  const handleToggleScreenShare = () => { /* Placeholder for MediaSoup */ toast({title: "Screen Sharing", description: "This feature is coming soon!"}); };

  const handleEndWebinar = async () => {
    if (!webinarId || !isCurrentUserHost) return;
    try {
      await updateDoc(doc(db, 'webinars', webinarId), { status: 'ended' });
      toast({ title: "Webinar Ended", description: "The webinar has been ended for all participants." });
      // Optionally, kick all participants or redirect host to dashboard.
      // For now, status change will be reflected.
    } catch (error) {
      console.error("Error ending webinar:", error);
      toast({ title: "Error", description: "Could not end the webinar.", variant: "destructive" });
    }
  };

  const handleToggleParticipantMute = async (participantId: string, currentMuteStatus: boolean) => {
    if (!webinarId || !isCurrentUserHost) return;
    const participantRef = doc(db, `webinars/${webinarId}/participants/${participantId}`);
    try {
      await updateDoc(participantRef, { isMuted: !currentMuteStatus });
      toast({ title: "Participant Updated", description: `Participant has been ${!currentMuteStatus ? 'muted' : 'unmuted'}.` });
    } catch (error) {
      console.error("Error toggling participant mute:", error);
      toast({ title: "Error", description: "Could not update participant mute status.", variant: "destructive" });
    }
  };

  const saveSummaryToFirestore = async (summary: string) => {
    if (!webinarId || !isCurrentUserHost) return;
    try {
      await updateDoc(doc(db, 'webinars', webinarId), { summary: summary });
      toast({ title: "Summary Saved", description: "The chat summary has been saved with the webinar." });
    } catch (error) {
      console.error("Error saving summary:", error);
      toast({ title: "Error", description: "Could not save the summary.", variant: "destructive" });
    }
  };


  if (authLoading || isLoading || !webinar || !user) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]"> {/* Adjust height based on Navbar */}
        <div className="p-4 border-b">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </div>
        <div className="flex flex-grow p-4 gap-4">
          <div className="flex-grow space-y-4">
            <Skeleton className="aspect-video w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
          <Skeleton className="w-80 hidden md:block" />
        </div>
      </div>
    );
  }
  
  if (webinar.status === 'ended' && !isCurrentUserHost) {
     return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-center">
        <Icons.VideoOff className="h-24 w-24 text-destructive mb-4" />
        <h1 className="text-3xl font-bold mb-2">Webinar Ended</h1>
        <p className="text-muted-foreground mb-6">This webinar, "{webinar.title}", has concluded.</p>
        <Button asChild>
          <a href="/dashboard">Go to Dashboard</a>
        </Button>
      </div>
    );
  }


  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] overflow-hidden"> {/* Adjust height considering Navbar */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary truncate" title={webinar.title}>{webinar.title}</h1>
           <Button variant="ghost" size="sm" onClick={() => setShowParticipants(showParticipants === 'chat' ? 'participants' : 'chat')} className="md:hidden">
            {showParticipants ? <Icons.EyeOff className="mr-2"/> : <Icons.Users className="mr-2"/>}
            {showParticipants ? "Hide" : "Participants"}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">Status: <span className={`capitalize font-medium ${webinar.status === 'active' ? 'text-green-500' : webinar.status === 'ended' ? 'text-destructive' : ''}`}>{webinar.status}</span></p>
      </div>

      <div className="flex flex-grow">
        <div className="flex flex-col flex-grow">
          <div className="flex-grow overflow-hidden">
            <VideoGrid participants={participants.filter(p => p.id !== user.uid)} localParticipant={localParticipant || undefined} hostId={webinar.hostId} />
          </div>
          <div className="border-t border-border p-2">
            <Controls
              webinarId={webinarId}
              isHost={isCurrentUserHost}
              onToggleMute={handleToggleMute}
              isMuted={localParticipant?.isMuted || false}
              onToggleVideo={handleToggleVideo}
              isVideoOff={localParticipant?.isVideoOff || false}
              onToggleScreenShare={handleToggleScreenShare}
              isScreenSharing={false} // Placeholder
              onRaiseHand={handleRaiseHand}
              handRaised={localParticipant?.handRaised || false}
              onEndWebinar={isCurrentUserHost ? handleEndWebinar : undefined}
            />
          </div>
        </div>

        {showParticipants && (
          <div className="w-1/4 border-l border-border flex flex-col">
            <div className="flex border-b border-border">
              <button
                className={`flex-1 p-2 ${showParticipants === 'chat' ? 'bg-muted text-primary' : ''}`}
                onClick={() => setShowParticipants('chat')}
              >
                Chat
              </button>
              <button
                className={`flex-1 p-2 ${showParticipants === 'participants' ? 'bg-muted text-primary' : ''}`}
                onClick={() => setShowParticipants('participants')}
              >
                Participants
              </button>
            </div>
            <div className="flex-grow overflow-auto p-2">
              {showParticipants === 'chat' && <ChatSidebar webinarId={webinarId} />}
              {showParticipants === 'participants' && (
                <ParticipantList
                  participants={participants}
                  currentUserId={user.uid}
                  hostId={webinar.hostId}
                  onToggleParticipantMute={isCurrentUserHost ? handleToggleParticipantMute : undefined}
                />
              )}
            </div>
          </div>
        )}
      </div>
      
      {isCurrentUserHost && webinar.status !== 'ended' && (
        <div className="p-4 border-t border-border bg-card">
          <SummaryGenerator webinarId={webinarId} chatMessages={chatMessages} onSummaryGenerated={saveSummaryToFirestore}/>
        </div>
      )}
       {webinar.status === 'ended' && webinar.summary && (
         <div className="p-4 border-t border-border bg-card">
            <h3 className="text-lg font-semibold mb-2 text-primary">Webinar Summary</h3>
            <ScrollArea className="max-h-40">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{webinar.summary}</p>
            </ScrollArea>
          </div>
       )}
    </div>
  );
}
