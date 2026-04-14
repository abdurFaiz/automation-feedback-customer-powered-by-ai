import { defaultModel } from '@/lib/ai/provider';
import { streamText } from 'ai';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { promises as fs } from 'fs';
import path from 'path';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const session = await auth();

    if (!session?.user) {
        return new Response('Unauthorized', { status: 401 });
    }

    const { messages } = await req.json();

    console.log('Received messages:', JSON.stringify(messages, null, 2));

    // 1. Read Rules
    let rulesContent = '';
    try {
        const rulesPath = path.join(process.cwd(), 'rules.md');
        rulesContent = await fs.readFile(rulesPath, 'utf-8');
    } catch (error) {
        console.error('Failed to read rules.md:', error);
        rulesContent = 'No specific rules found.';
    }

    // 2. Fetch Knowledge (Dataset/Reviews)
    // We'll fetch the most recent high-impact data
    let knowledgeBase = '';
    try {
        // Get user's business
        const business = await db.business.findFirst({
            where: { ownerId: session.user.id }
        });

        if (business) {
            // Fetch recent reviews
            const recentReviews = await db.review.findMany({
                where: { businessId: business.id },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    customerName: true,
                    rating: true,
                    comment: true,
                    sentimentType: true,
                    source: true
                }
            });

            // Fetch actionable insights
            const insights = await db.actionableInsight.findMany({
                where: { businessId: business.id },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    customerInput: true,
                    aiSolution: true,
                    impactLevel: true,
                    status: true
                }
            });

            knowledgeBase = `
## BUSINES CONTEXT
Business Name: ${business.name}

## RECENT REVIEWS (Context)
${recentReviews.map(r => `- [${r.source}] ${r.customerName} (${r.rating}/5): "${r.comment}" (Sentiment: ${r.sentimentType})`).join('\n')}

## RECENT INSIGHTS (Context)
${insights.map(i => `- [${i.impactLevel}] Issue: "${i.customerInput}" -> Solution: "${i.aiSolution}"`).join('\n')}
            `;
        }
    } catch (error) {
        console.error("Failed to fetch knowledge base:", error);
        knowledgeBase = "Error fetching database context.";
    }

    // Convert messages to the correct format for the model
    const modelMessages = messages.map((msg: any) => ({
        role: msg.role,
        content: msg.parts?.map((part: any) => part.text).join('') || msg.content || ''
    }));

    console.log('Converted messages:', JSON.stringify(modelMessages, null, 2));

    const systemPrompt = `You are an expert AI assistant for **Everloop (Feedback Management System) by Spinotek**, a comprehensive platform designed to transform customer feedback into business growth.

## SYSTEM DEFINITION: Everloop By Spinotek
When the user asks about "Everloop" or "the system", they are referring to THIS specific application, NOT general "Facility Management Systems" or others.

**Core Capabilities of Spinotek Everloop:**
1. **Feedback Aggregation**: Centralizes reviews from Google Maps, Surveys, and other sources into one dashboard.
2. **AI Analysis**: Automatically analyzes sentiment (Positive, Neutral, Negative) and categorizes feedback (Service, Food, Ambiance, etc.).
3. **Actionable Insights**: Generates specific AI-driven solutions and SOP recommendations based on customer pain points.
4. **Impact Velocity**: Tracks how operational changes affect customer satisfaction over time using a proprietary "Impact Velocity" metric.
5. **Growth Tracking**: Monitors NPS (Net Promoter Score), Churn Risk, and Revenue correlation with feedback trends.

## KNOWLEDGE BASE
${rulesContent}

${knowledgeBase}

## YOUR ROLE
- Your primary goal is to help businesses understand their customer perception.
- You can draft responses to reviews, explain charts, and provide strategic advice based on the data.
- **Language**: ALWAYS answer in **Indonesian (Bahasa Indonesia)** unless the user explicitly asks in another language.
- If asked "What is Everloop?", describe Spinotek's Feedback Management System as defined above.

Keep your responses professional, strategic, and concise.`;

    const result = streamText({
        model: defaultModel,
        messages: modelMessages,
        system: systemPrompt,
    });

    return result.toUIMessageStreamResponse();
}

