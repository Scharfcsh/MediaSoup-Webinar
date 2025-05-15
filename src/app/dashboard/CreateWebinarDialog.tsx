// src/app/dashboard/CreateWebinarDialog.tsx
"use client";

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/components/auth/auth-provider';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';

const webinarSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters long' }).max(100, { message: 'Title must be 100 characters or less' }),
});

type WebinarFormValues = z.infer<typeof webinarSchema>;

export function CreateWebinarDialog() {
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const form = useForm<WebinarFormValues>({
    resolver: zodResolver(webinarSchema),
    defaultValues: {
      title: '',
    },
  });

  const onSubmit = async (data: WebinarFormValues) => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to create a webinar.', variant: 'destructive' });
      return;
    }
    setIsCreating(true);
    try {
      const webinarRef = await addDoc(collection(db, 'webinars'), {
        title: data.title,
        hostId: user.uid,
        createdAt: serverTimestamp(),
        status: 'scheduled',
      });

      // Add host as a participant
      const participantRef = doc(db, `webinars/${webinarRef.id}/participants/${user.uid}`);
      await setDoc(participantRef, {
        name: user.displayName || user.email || 'Host',
        role: 'host',
        joinedAt: serverTimestamp(),
        isMuted: false,
        isVideoOff: false,
        handRaised: false,
      });

      toast({ title: 'Webinar Created!', description: `"${data.title}" is ready.` });
      form.reset();
      setOpen(false);
      router.push(`/webinar/${webinarRef.id}`);
    } catch (error) {
      console.error('Error creating webinar:', error);
      toast({ title: 'Error', description: 'Could not create webinar. Please try again.', variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Icons.PlusCircle className="mr-2 h-5 w-5" /> Create Webinar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-primary">Create New Webinar</DialogTitle>
          <DialogDescription>
            Fill in the details below to schedule your new webinar.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Webinar Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Introduction to Next.js 14" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isCreating}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {isCreating && <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />}
                Create Webinar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
