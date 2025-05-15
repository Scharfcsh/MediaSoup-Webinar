// src/app/webinar/[id]/components/VideoGrid.tsx
"use client";

import type { Participant } from "@/types";
import { VideoPlaceholder } from "./VideoPlaceholder";

interface VideoGridProps {
  participants: Participant[];
  localParticipant?: Participant; // Optional local participant representation
  hostId?: string;
}

export function VideoGrid({ participants, localParticipant, hostId }: VideoGridProps) {
  // Ensure host is displayed first if present, then local participant, then others
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.id === hostId) return -1;
    if (b.id === hostId) return 1;
    if (localParticipant && a.id === localParticipant.id) return -1;
    if (localParticipant && b.id === localParticipant.id) return 1;
    return (a.name || "").localeCompare(b.name || "");
  });
  
  // Filter out local participant from the main list if provided separately
  const remoteParticipants = localParticipant 
    ? sortedParticipants.filter(p => p.id !== localParticipant.id) 
    : sortedParticipants;

  const gridCols = (count: number) => {
    if (count <= 1) return "grid-cols-1";
    if (count <= 2) return "grid-cols-1 md:grid-cols-2";
    if (count <= 4) return "grid-cols-2";
    if (count <= 6) return "grid-cols-2 md:grid-cols-3";
    if (count <= 9) return "grid-cols-3";
    return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";
  };
  
  const totalParticipants = remoteParticipants.length + (localParticipant ? 1 : 0);

  return (
    <div className={`grid ${gridCols(totalParticipants)} gap-4 p-4 bg-muted/50 rounded-lg shadow-inner flex-grow`}>
      {localParticipant && (
        <VideoPlaceholder participant={localParticipant} isLocal={true} />
      )}
      {remoteParticipants.map((participant) => (
        <VideoPlaceholder key={participant.id} participant={participant} />
      ))}
      {totalParticipants === 0 && (
         <div className="col-span-full flex items-center justify-center h-full">
            <p className="text-muted-foreground text-lg">Waiting for participants...</p>
         </div>
      )}
    </div>
  );
}
