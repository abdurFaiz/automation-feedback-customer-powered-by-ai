import { createOpenAI } from '@ai-sdk/openai';
import { env } from '@/env.js';

// Configuration for OpenAI provider
// Use OpenAI API directly
const apiKey = env.OPENAI_API_KEY;

if (!apiKey) {
    if (process.env.NODE_ENV !== 'production') {
        console.warn('Missing OpenAI API Key. AI features may not work.');
    }
}

export const customOpenai = createOpenAI({
    apiKey,
    // Remove baseURL to use OpenAI directly
});

// Export a default model instance for convenience
export const defaultModel = customOpenai('gpt-4o');
