import { z } from 'zod';

/**
 * optimizePromptPlugin
 *
 * This plugin generates a final, structured prompt for AI based on the provided context sections and instructions.
 * The result is intended to be used as the FINAL prompt for the AI after all relevant data has been collected by the client.
 * Clients should call this tool after gathering all necessary context and use the returned prompt as the input for the AI model.
 */
export const OptimizePromptInputSchema = z.object({
  sections: z.array(z.object({
    title: z.string(),
    content: z.string(),
  })),
  instructions: z.string().optional(),
});

// Основная функция плагина
export default async function optimizePromptPlugin(input: unknown): Promise<string> {
  const { sections, instructions } = OptimizePromptInputSchema.parse(input);

  let prompt = 'Ты — ассистент-разработчик. Вот контекст:\n\n';
  for (const section of sections) {
    prompt += `=== ${section.title} ===\n${section.content}\n\n`;
  }
  if (instructions) {
    prompt += `Инструкции:\n${instructions}\n`;
  } else {
    prompt += 'Выполни задачу, следуя приведённому выше контексту.';
  }
  return prompt;
} 