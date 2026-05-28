import type { AppSettings } from '../utils/storage';

export interface GenerateOptions {
  userPrompt: string;
  fileText: string;
  systemPrompt: string;
  formatExample: string;
}

export async function generateAssessment(
  options: GenerateOptions,
  settings: AppSettings,
): Promise<string> {
  const { userPrompt, fileText, systemPrompt, formatExample } = options;

  if (!settings.apiKey) {
    throw new Error('No API key configured. Please add your OpenAI API key in Settings.');
  }

  const userContent = [
    userPrompt ? `User instructions: ${userPrompt}` : '',
    fileText ? `\n\nSource material:\n${fileText}` : '',
    formatExample
      ? `\n\nFollow this format example closely:\n${formatExample}`
      : '',
  ]
    .filter(Boolean)
    .join('');

  const authHeader = 'Bearer ' + settings.apiKey;

  const response = await fetch(`${settings.apiBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify({
      model: settings.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error (${response.status}): ${err}`);
  }

  const data = (await response.json()) as {
    choices: { message: { content: string } }[];
  };

  return data.choices[0]?.message?.content ?? '';
}
