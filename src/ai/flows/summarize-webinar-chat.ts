'use server';

/**
 * @fileOverview This file defines a Genkit flow to summarize webinar chat transcripts.
 *
 * - summarizeWebinarChat - A function that takes a webinar chat transcript and returns a summary.
 * - SummarizeWebinarChatInput - The input type for the summarizeWebinarChat function.
 * - SummarizeWebinarChatOutput - The return type for the summarizeWebinarChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeWebinarChatInputSchema = z.object({
  chatTranscript: z
    .string()
    .describe('The complete chat transcript from the webinar.'),
});
export type SummarizeWebinarChatInput = z.infer<
  typeof SummarizeWebinarChatInputSchema
>;

const SummarizeWebinarChatOutputSchema = z.object({
  summary: z
    .string()
    .describe('A concise summary of the key discussion points and decisions made during the webinar.'),
});
export type SummarizeWebinarChatOutput = z.infer<
  typeof SummarizeWebinarChatOutputSchema
>;

export async function summarizeWebinarChat(
  input: SummarizeWebinarChatInput
): Promise<SummarizeWebinarChatOutput> {
  return summarizeWebinarChatFlow(input);
}

const summarizeWebinarChatPrompt = ai.definePrompt({
  name: 'summarizeWebinarChatPrompt',
  input: {schema: SummarizeWebinarChatInputSchema},
  output: {schema: SummarizeWebinarChatOutputSchema},
  prompt: `You are an AI assistant tasked with summarizing webinar chat transcripts.  Your goal is to provide a concise and informative summary of the key discussion points and any decisions that were made.

Here is the chat transcript:

{{{chatTranscript}}}

Provide a summary of the chat transcript.`,
});

const summarizeWebinarChatFlow = ai.defineFlow(
  {
    name: 'summarizeWebinarChatFlow',
    inputSchema: SummarizeWebinarChatInputSchema,
    outputSchema: SummarizeWebinarChatOutputSchema,
  },
  async input => {
    const {output} = await summarizeWebinarChatPrompt(input);
    return output!;
  }
);
