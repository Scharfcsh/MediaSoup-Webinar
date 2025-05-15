// src/app/webinar/[id]/components/VideoPlaceholder.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icons } from "@/components/icons";
import type { Participant } from "@/types";

interface VideoPlaceholderProps {
  participant?: Participant; // Make participant optional for general placeholders
  isLocal?: boolean;
  name?: string; // Allow overriding name
}

export function VideoPlaceholder({ participant, isLocal = false, name }: VideoPlaceholderProps) {
  const displayName = name || participant?.name || (isLocal ? "You" : "Participant");
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <Card className="aspect-video bg-muted flex flex-col items-center justify-center relative overflow-hidden shadow-md rounded-lg">
      <CardContent className="p-0 w-full h-full flex flex-col items-center justify-center">
        <Avatar className="w-16 h-16 md:w-24 md:h-24 mb-2 border-2 border-background">
          {/* Placeholder for actual avatar image if available */}
          {/* <AvatarImage src={participant?.avatarUrl} /> */}
          <AvatarFallback className="text-2xl md:text-4xl bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <p className="text-sm md:text-base font-medium text-foreground truncate px-2">{displayName}</p>
        <div className="absolute bottom-2 left-2 flex space-x-1 bg-black/30 p-1 rounded">
          {participant?.isMuted ?? true ? <Icons.MicOff className="h-4 w-4 text-destructive-foreground" /> : <Icons.Mic className="h-4 w-4 text-primary-foreground" />}
          {participant?.isVideoOff ?? true ? <Icons.VideoOff className="h-4 w-4 text-destructive-foreground" /> : <Icons.Video className="h-4 w-4 text-primary-foreground" />}
        </div>
        {participant?.handRaised && (
           <div className="absolute top-2 right-2 bg-accent p-1.5 rounded-full shadow-md">
            <Icons.Hand className="h-4 w-4 text-accent-foreground" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
