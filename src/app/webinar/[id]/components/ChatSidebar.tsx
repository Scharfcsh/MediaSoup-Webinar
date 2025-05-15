// src/app/webinar/[id]/components/ChatSidebar.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/auth/auth-provider';
import type { ChatMessage } from '@/types';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Icons } from '@/components/icons';
import { Separator } from '@/components/ui/separator';

const chatSchema = z.object({
  message: z.string().min(1, { message: "Message cannot be empty" }).max(500, { message: "Message too long" }),
});
type ChatFormValues = z.infer<typeof chatSchema>;

interface ChatSidebarProps {
  webinarId: string;
}

export function ChatSidebar({ webinarId }: ChatSidebarProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const form = useForm<ChatFormValues>({
    resolver: zodResolver(chatSchema),
    defaultValues: { message: '' },
  });

  useEffect(() => {
    const messagesRef = collection(db, `webinars/${webinarId}/messages`);
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      setMessages(newMessages);
    });
    return () => unsubscribe();
  }, [webinarId]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [messages]);


  const onSubmit = async (data: ChatFormValues) => {
    if (!user) return;
    setIsSending(true);
    try {
      await addDoc(collection(db, `webinars/${webinarId}/messages`), {
        userId: user.uid,
        userName: user.displayName || user.email || 'Anonymous',
        text: data.message,
        timestamp: serverTimestamp(),
      });
      form.reset();
    } catch (error) {
      console.error("Error sending message: ", error);
    } finally {
      setIsSending(false);
    }
  };
  
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
  };

  return (
    <Card className="w-full md:w-80 lg:w-96 flex flex-col shadow-lg rounded-lg border border-border h-full">
      <CardHeader className="p-4 border-b border-border">
        <CardTitle className="text-lg font-semibold text-primary flex items-center">
          <Icons.MessageCircle className="mr-2 h-5 w-5" /> Live Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-grow overflow-hidden">
        <ScrollArea className="h-[calc(100%-0px)]" ref={scrollAreaRef}> {/* Adjust height dynamically if needed */}
          <div className="p-4 space-y-4">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No messages yet. Start the conversation!</p>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-start space-x-3 ${msg.userId === user?.uid ? 'justify-end' : ''}`}>
                {msg.userId !== user?.uid && (
                  <Avatar className="h-8 w-8">
                    {/* Add user avatar logic if available */}
                    {/* <AvatarImage src={msg.userAvatarUrl} /> */}
                    <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">{getInitials(msg.userName)}</AvatarFallback>
                  </Avatar>
                )}
                <div className={`p-3 rounded-lg max-w-[75%] break-words ${
                    msg.userId === user?.uid 
                    ? 'bg-primary text-primary-foreground rounded-br-none' 
                    : 'bg-muted text-foreground rounded-bl-none'
                }`}>
                  <p className="text-sm">{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.userId === user?.uid ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground'}`}>
                    {msg.userId !== user?.uid && <span className="font-medium">{msg.userName} &bull; </span>}
                    {msg.timestamp ? format(new Date((msg.timestamp as Timestamp).seconds * 1000), 'p') : 'Sending...'}
                  </p>
                </div>
                 {msg.userId === user?.uid && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">{getInitials(msg.userName)}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <Separator />
      <CardFooter className="p-4 border-t border-border">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full items-center space-x-2">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormControl>
                    <Input placeholder="Type your message..." {...field} disabled={!user || isSending} className="bg-background"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="icon" disabled={!user || isSending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isSending ? <Icons.Spinner className="h-4 w-4 animate-spin" /> : <Icons.Send className="h-4 w-4" />}
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </Form>
      </CardFooter>
    </Card>
  );
}
