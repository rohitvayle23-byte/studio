'use server';

/**
 * @fileOverview A flow that provides the appropriate distress signal pattern based on the user's location.
 *
 * - provideDistressSignal - A function that handles the process of determining and providing the distress signal.
 * - ProvideDistressSignalInput - The input type for the provideDistressSignal function.
 * - ProvideDistressSignalOutput - The return type for the provideDistressSignal function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProvideDistressSignalInputSchema = z.object({
  location: z
    .string()
    .describe("The user's current location, including latitude and longitude."),
  environment: z
    .string()
    .optional()
    .describe("The user's environment, such as 'mountain', 'sea', or 'urban'."),
});
export type ProvideDistressSignalInput = z.infer<typeof ProvideDistressSignalInputSchema>;

const ProvideDistressSignalOutputSchema = z.object({
  signalPattern: z
    .string()
    .describe(
      'The appropriate distress signal pattern based on the user location, such as SOS.'
    ),
  signalDescription: z
    .string()
    .describe('A description of how to execute the distress signal pattern.'),
});
export type ProvideDistressSignalOutput = z.infer<typeof ProvideDistressSignalOutputSchema>;

export async function provideDistressSignal(
  input: ProvideDistressSignalInput
): Promise<ProvideDistressSignalOutput> {
  return provideDistressSignalFlow(input);
}

const prompt = ai.definePrompt({
  name: 'provideDistressSignalPrompt',
  input: {schema: ProvideDistressSignalInputSchema},
  output: {schema: ProvideDistressSignalOutputSchema},
  prompt: `You are an expert in emergency situations and distress signals.

  Based on the user's location and environment, provide the most appropriate distress signal pattern and a description of how to execute it. Adhere to international standards where applicable.

  Location: {{{location}}}
  Environment: {{{environment}}}

  Provide the signal pattern and a description of how to execute it. Be specific about timing (e.g. number of short flashes, long flashes, pauses).
  `,
});

const provideDistressSignalFlow = ai.defineFlow(
  {
    name: 'provideDistressSignalFlow',
    inputSchema: ProvideDistressSignalInputSchema,
    outputSchema: ProvideDistressSignalOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
