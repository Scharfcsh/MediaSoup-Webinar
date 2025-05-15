// src/app/webinar/[id]/components/ParticipantList.tsx
"use client";

import type { Participant } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ParticipantListProps {
  participants: Participant[];
  currentUserId?: string;
  hostId?: string;
  onToggleParticipantMute?: (participantId: string, currentMuteStatus: boolean) => void;
  // Add more actions like kick, make presenter etc. later
}

export function ParticipantList({ 
  participants, 
  currentUserId, 
  hostId,
  onToggleParticipantMute 
}: ParticipantListProps) {

  const isCurrentUserHost = currentUserId === hostId;

  const getInitials = (name: string) => {
    if (!name) return 'P';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
  };

  return (
    <Card className="w-full md:w-72 lg:w-80 shadow-lg rounded-lg border border-border h-full flex flex-col">
      <CardHeader className="p-4 border-b border-border">
        <CardTitle className="text-lg font-semibold text-primary flex items-center">
          <Icons.Users className="mr-2 h-5 w-5" /> Participants ({participants.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-grow overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-2 space-y-1">
            {participants.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No participants yet.</p>
            )}
            {participants.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-9 w-9">
                    {/* <AvatarImage src={p.avatarUrl} /> */}
                    <AvatarFallback className="text-sm bg-secondary text-secondary-foreground">{getInitials(p.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-medium truncate" title={p.name}>
                      {p.name} {p.id === currentUserId && "(You)"}
                    </p>
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      {p.isMuted ? <Icons.MicOff className="h-3 w-3 text-destructive" /> : <Icons.Mic className="h-3 w-3 text-green-500" />}
                      {p.isVideoOff ? <Icons.VideoOff className="h-3 w-3 text-destructive" /> : <Icons.Video className="h-3 w-3 text-green-500" />}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {p.role === 'host' && <Badge variant="outline" className="text-xs border-primary text-primary">Host</Badge>}
                  {p.handRaised && <Icons.Hand className="h-4 w-4 text-accent-foreground fill-accent" />}
                  
                  {isCurrentUserHost && p.id !== currentUserId && onToggleParticipantMute && (
                     <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Icons.Settings className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onToggleParticipantMute(p.id, p.isMuted)}>
                          {p.isMuted ? <Icons.Mic className="mr-2 h-4 w-4" /> : <Icons.MicOff className="mr-2 h-4 w-4" />}
                          {p.isMuted ? "Unmute" : "Mute"}
                        </DropdownMenuItem>
                        {/* Add more actions here */}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
