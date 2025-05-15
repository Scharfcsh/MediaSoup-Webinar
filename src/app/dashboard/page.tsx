// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, where, orderBy, onSnapshot, Timestamp, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/auth/auth-provider';
import type { Webinar } from '@/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { CreateWebinarDialog } from './CreateWebinarDialog';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';


export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [myWebinars, setMyWebinars] = useState<Webinar[]>([]);
  const [joinedWebinars, setJoinedWebinars] = useState<Webinar[]>([]); // Placeholder for future
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      if(!authLoading) setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const q = query(
      collection(db, 'webinars'),
      where('hostId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const webinarsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Webinar));
      setMyWebinars(webinarsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching webinars: ", error);
      toast({ title: "Error", description: "Could not fetch your webinars.", variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, toast]);

  const handleJoinWebinar = async (webinarId: string, webinarTitle: string) => {
    if (!user) return;
    try {
      const participantRef = doc(db, `webinars/${webinarId}/participants/${user.uid}`);
      await setDoc(participantRef, {
        name: user.displayName || user.email || 'Participant',
        role: 'participant',
        joinedAt: serverTimestamp(),
        isMuted: false,
        isVideoOff: false,
        handRaised: false,
      }, { merge: true }); // Merge true to not overwrite if already a participant (e.g. host)
      router.push(`/webinar/${webinarId}`);
    } catch (error) {
      console.error("Error joining webinar: ", error);
      toast({ title: "Error", description: `Could not join webinar "${webinarTitle}".`, variant: "destructive" });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight text-primary">My Webinars</h1>
           <Button disabled className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Icons.PlusCircle className="mr-2 h-5 w-5" /> Create Webinar
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="shadow-lg animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-1/4"></div>
              </CardContent>
              <CardFooter>
                <div className="h-10 bg-muted rounded w-full"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-primary">My Webinars</h1>
        <CreateWebinarDialog />
      </div>

      {myWebinars.length === 0 && !isLoading && (
        <Card className="text-center py-12 shadow-lg">
          <CardHeader>
            <Icons.Video className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="text-2xl">No Webinars Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-6">
              You haven&apos;t created any webinars. Get started by creating your first one!
            </CardDescription>
            <CreateWebinarDialog />
          </CardContent>
        </Card>
      )}

      {myWebinars.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {myWebinars.map((webinar) => (
            <Card key={webinar.id} className="flex flex-col justify-between shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg overflow-hidden border border-border">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl font-semibold text-primary truncate" title={webinar.title}>{webinar.title}</CardTitle>
                  <Badge 
                    variant={webinar.status === 'active' ? 'default' : webinar.status === 'ended' ? 'destructive' : 'secondary'}
                    className={`capitalize ${webinar.status === 'active' ? 'bg-green-500 text-white' : ''}`}
                  >
                    {webinar.status}
                  </Badge>
                </div>
                <CardDescription>
                  Created: {webinar.createdAt ? format(new Date((webinar.createdAt as any).seconds * 1000), 'MMM d, yyyy') : 'N/A'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Placeholder for more details if needed */}
                <p className="text-sm text-muted-foreground">Host: You</p>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full bg-primary hover:bg-primary/80 text-primary-foreground">
                  <Link href={`/webinar/${webinar.id}`}>
                    {webinar.hostId === user?.uid ? 'Manage & Start' : 'Join Webinar'}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Placeholder for "Joined Webinars" section - to be implemented if needed */}
      {/* 
      <h2 className="text-2xl font-bold tracking-tight text-primary mt-12">Joined Webinars</h2>
      {joinedWebinars.length === 0 && (
        <p className="text-muted-foreground">You haven't joined any webinars yet.</p>
      )}
      // ... list joined webinars ...
      */}
    </div>
  );
}
