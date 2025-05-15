// src/app/webinar/[id]/components/SummaryGenerator.tsx
"use client";

import { useState } from 'react';
import { summarizeWebinarChat, type SummarizeWebinarChatInput } from '@/ai/flows/summarize-webinar-chat';
import type { ChatMessage } from '@/types';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface SummaryGeneratorProps {
  webinarId: string;
  chatMessages: ChatMessage[];
  onSummaryGenerated?: (summary: string) => void; // Optional: Callback to save summary to Firestore
}

export function SummaryGenerator({ webinarId, chatMessages, onSummaryGenerated }: SummaryGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const { toast } = useToast();

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setSummary(null);

    if (chatMessages.length === 0) {
      toast({
        title: 'Cannot Generate Summary',
        description: 'There are no chat messages to summarize.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    const chatTranscript = chatMessages
      .map(msg => `${msg.userName}: ${msg.text}`)
      .join('\n');

    const input: SummarizeWebinarChatInput = { chatTranscript };

    try {
      const result = await summarizeWebinarChat(input);
      setSummary(result.summary);
      setShowSummaryDialog(true);
      toast({ title: 'Summary Generated!', description: 'The chat summary is ready.' });
      if (onSummaryGenerated) {
        onSummaryGenerated(result.summary);
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({
        title: 'Summary Generation Failed',
        description: 'An error occurred while generating the summary. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button onClick={handleGenerateSummary} disabled={isLoading} variant="outline" className="mt-4 w-full md:w-auto">
        {isLoading ? (
          <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.Sparkles className="mr-2 h-4 w-4 text-yellow-400" /> // Custom icon, replace Sparkles if not in Icons
        )}
        Generate Chat Summary
      </Button>

      <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-primary">Webinar Chat Summary</DialogTitle>
            <DialogDescription>
              Here is the AI-generated summary of the webinar chat.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] my-4">
            {summary ? (
              <Alert className="bg-muted/50">
                <AlertTitle className="font-semibold">Summary</AlertTitle>
                <AlertDescription className="whitespace-pre-wrap text-foreground/80">
                  {summary}
                </AlertDescription>
              </Alert>
            ) : (
              <p className="text-muted-foreground">No summary available.</p>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (summary) {
                  navigator.clipboard.writeText(summary);
                  toast({ title: 'Copied to clipboard!'});
                }
              }}
              disabled={!summary}
            >
              <Icons.Copy className="mr-2 h-4 w-4" /> Copy Summary
            </Button>
            <Button onClick={() => setShowSummaryDialog(false)} className="bg-primary text-primary-foreground hover:bg-primary/90">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Add Sparkles to Icons if not present
// In src/components/icons.tsx:
// import { Sparkles } from 'lucide-react';
// export const Icons = { ..., Sparkles };
// If Sparkles is not available, use a generic icon or an SVG. For now, I'll assume it can be added.
// Using Presentation as a placeholder if Sparkles is an issue.
Icons.Sparkles = Icons.Sparkles || Icons.Logo; // Placeholder
