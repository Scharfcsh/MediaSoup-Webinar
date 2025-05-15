// src/app/webinar/[id]/components/Controls.tsx
"use client";

import { useState } from 'react';
import { useRouter }   from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ControlsProps {
  webinarId: string;
  isHost: boolean;
  onToggleMute: () => void;
  isMuted: boolean;
  onToggleVideo: () => void;
  isVideoOff: boolean;
  onToggleScreenShare: () => void; // Placeholder
  isScreenSharing: boolean; // Placeholder
  onRaiseHand: () => void;
  handRaised: boolean;
  onEndWebinar?: () => void; // Host only
}

export function Controls({
  webinarId,
  isHost,
  onToggleMute,
  isMuted,
  onToggleVideo,
  isVideoOff,
  onToggleScreenShare,
  isScreenSharing,
  onRaiseHand,
  handRaised,
  onEndWebinar,
}: ControlsProps) {
  const router = useRouter();

  const handleLeave = () => {
    router.push('/dashboard');
    // Add logic to update participant status in Firestore if needed
  };

  return (
    <TooltipProvider>
      <div className="flex flex-wrap justify-center items-center gap-2 md:gap-4 p-4 bg-card border-t border-border shadow-md rounded-t-lg">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant={isMuted ? "destructive" : "outline"} size="lg" onClick={onToggleMute} className="flex-col h-auto p-3 md:p-4">
              {isMuted ? <Icons.MicOff className="h-6 w-6 md:h-7 md:w-7" /> : <Icons.Mic className="h-6 w-6 md:h-7 md:w-7" />}
              <span className="text-xs mt-1">{isMuted ? 'Unmute' : 'Mute'}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>{isMuted ? 'Unmute Microphone' : 'Mute Microphone'}</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant={isVideoOff ? "destructive" : "outline"} size="lg" onClick={onToggleVideo} className="flex-col h-auto p-3 md:p-4">
              {isVideoOff ? <Icons.VideoOff className="h-6 w-6 md:h-7 md:w-7" /> : <Icons.Video className="h-6 w-6 md:h-7 md:w-7" />}
              <span className="text-xs mt-1">{isVideoOff ? 'Start Video' : 'Stop Video'}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>{isVideoOff ? 'Start Camera' : 'Stop Camera'}</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="lg" onClick={onToggleScreenShare} className="flex-col h-auto p-3 md:p-4" disabled> {/* Disabled for now */}
              <Icons.ScreenShare className="h-6 w-6 md:h-7 md:w-7" />
              <span className="text-xs mt-1">{isScreenSharing ? 'Stop Sharing' : 'Share Screen'}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>{isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen (Coming Soon)'}</p></TooltipContent>
        </Tooltip>

        {!isHost && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant={handRaised ? "secondary": "outline"} size="lg" onClick={onRaiseHand} className={`flex-col h-auto p-3 md:p-4 ${handRaised ? 'bg-accent text-accent-foreground' : ''}`}>
                <Icons.Hand className="h-6 w-6 md:h-7 md:w-7" />
                <span className="text-xs mt-1">{handRaised ? 'Lower Hand' : 'Raise Hand'}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>{handRaised ? 'Lower Hand' : 'Raise Hand'}</p></TooltipContent>
          </Tooltip>
        )}
        
        {isHost && onEndWebinar && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="destructive" size="lg" onClick={onEndWebinar} className="flex-col h-auto p-3 md:p-4">
                <Icons.LogOut className="h-6 w-6 md:h-7 md:w-7" />
                <span className="text-xs mt-1">End Webinar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>End Webinar for All</p></TooltipContent>
          </Tooltip>
        )}

        {!isHost && (
           <Tooltip>
            <TooltipTrigger asChild>
               <Button variant="destructive" size="lg" onClick={handleLeave} className="flex-col h-auto p-3 md:p-4">
                <Icons.LogOut className="h-6 w-6 md:h-7 md:w-7" />
                <span className="text-xs mt-1">Leave</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Leave Webinar</p></TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
