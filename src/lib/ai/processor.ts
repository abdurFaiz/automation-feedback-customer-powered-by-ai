import { defaultModel } from '@/lib/ai/provider';
import { generateObject } from 'ai';
import { z } from 'zod';

// Define the schema for review analysis
export const reviewAnalysisSchema = z.object({
    sentiment: z.enum(['POSITIVE', 'NEUTRAL', 'NEGATIVE', 'MIXED']),
    score: z.number().min(0).max(1).describe('Sentiment score from 0 (very negative) to 1 (very positive)'),
    primaryCategory: z.enum(['FOOD', 'SERVICE', 'AMBIANCE', 'VALUE', 'LOCATION', 'OTHER']).describe('The main category this review discusses'),
    keywords: z.array(z.string()).describe('Key topics or keywords mentioned in Indonesian'),
    isUrgent: z.boolean().describe('Whether this review requires attention. Mark TRUE if the sentiment is negative or mixed, including mild complaints (e.g. "agak kurang", slow service), not just critical emergencies.'),
    summary: z.string().describe('Brief summary of the review content in Indonesian'),
    suggestedResponse: z.string().describe('A professional, personalized response draft in Indonesian'),
    actionableInsight: z.string().nullable().describe('Specific suggestion for business improvement in Indonesian if applicable, or null if none'),
});

export type ReviewAnalysis = z.infer<typeof reviewAnalysisSchema>;

export async function analyzeReview(reviewText: string, businessContext?: string) {
    try {
        const { object } = await generateObject({
            model: defaultModel,
            schema: reviewAnalysisSchema,
            system: `You are an expert customer feedback analyst for a business.${businessContext ? ` The business context is: ${businessContext}` : ''}. Analyze the following customer review and extract structured data. Ensure all text outputs (summary, suggestedResponse, actionableInsight) are in Indonesian language.`,
            prompt: reviewText,
        });

        return object;
    } catch (error) {
        console.error("AI Analysis failed:", error);
        throw error;
    }
}