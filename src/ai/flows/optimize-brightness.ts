// src/ai/flows/optimize-brightness.ts
'use server';
/**
 * @fileOverview A flow to optimize brightness based on ambient light conditions.
 *
 * - optimizeBrightness - A function that handles the brightness optimization process.
 * - OptimizeBrightnessInput - The input type for the optimizeBrightness function.
 * - OptimizeBrightnessOutput - The return type for the optimizeBrightness function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeBrightnessInputSchema = z.object({
  ambientLightLevel: z
    .number()
    .describe(
      'The ambient light level, in lux. Higher values indicate brighter surroundings.'
    ),
  currentBatteryPercentage: z
    .number()
    .describe('The current battery percentage of the device (0-100).'),
  userBrightnessPreference: z
    .number()
    .describe(
      'The users preferred brightness level (0-100), regardless of ambient light.'
    ).optional(),
});
export type OptimizeBrightnessInput = z.infer<typeof OptimizeBrightnessInputSchema>;

const OptimizeBrightnessOutputSchema = z.object({
  screenBrightness: z
    .number()
    .describe(
      'The recommended screen brightness level (0-100), based on ambient light and battery level.'
    ),
  flashlightStrength: z
    .number()
    .describe(
      'The recommended flashlight strength level (0-100), based on ambient light and battery level.'
    ),
  reasoning: z
    .string()
    .describe(
      'A brief explanation of why the brightness levels were chosen, considering ambient light and battery.'
    ),
});
export type OptimizeBrightnessOutput = z.infer<typeof OptimizeBrightnessOutputSchema>;

export async function optimizeBrightness(input: OptimizeBrightnessInput): Promise<OptimizeBrightnessOutput> {
  return optimizeBrightnessFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeBrightnessPrompt',
  input: {schema: OptimizeBrightnessInputSchema},
  output: {schema: OptimizeBrightnessOutputSchema},
  prompt: `You are an AI assistant that helps optimize screen and flashlight brightness for mobile devices to balance visibility and power consumption.

You will receive the ambient light level in lux (higher values mean brighter surroundings), the current battery percentage, and the user's brightness preference.

Based on these inputs, determine the optimal screen brightness and flashlight strength (both on a scale of 0-100). Consider these factors:

*   **Visibility:** Ensure the screen and flashlight are bright enough for comfortable viewing in the current ambient light.
*   **Battery Life:** Conserve battery by reducing brightness when possible, especially when the battery is low.
* **User Preference:** Try to respect the userBrightnessPreference if provided.  Only deviate from this preference if it is unsafe or wastes battery.

Explain your reasoning for the chosen brightness levels.

Ambient Light Level: {{{ambientLightLevel}}} lux
Current Battery Percentage: {{{currentBatteryPercentage}}}%
User Brightness Preference: {{{userBrightnessPreference}}}%

Output the recommended screenBrightness, flashlightStrength, and reasoning.

Follow the schema for OptimizeBrightnessOutputSchema. Do not include any additional fields.
`,
});

const optimizeBrightnessFlow = ai.defineFlow(
  {
    name: 'optimizeBrightnessFlow',
    inputSchema: OptimizeBrightnessInputSchema,
    outputSchema: OptimizeBrightnessOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
