export interface AIChatbotResponse {
  category: 'PLUMBING' | 'ELECTRICAL' | 'SECURITY' | 'MAINTENANCE' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  reason: string;
}

export class AIService {
  private getApiKey(): string | undefined {
    return process.env.GEMINI_API_KEY;
  }

  async classifyComplaint(title: string, description: string): Promise<AIChatbotResponse> {
    const apiKey = this.getApiKey();

    if (!apiKey) {
      // Heuristic keyword classifier (graceful fallback)
      console.log('Gemini API key missing. Using local rule-based AI classifier...');
      return this.localHeuristicClassify(title, description);
    }

    try {
      const prompt = `
You are an AI assistant for a multi-tenant residential society portal. 
Analyze the following tenant complaint title and description:
Title: "${title}"
Description: "${description}"

Classify it into one of these categories:
- PLUMBING
- ELECTRICAL
- SECURITY
- MAINTENANCE
- OTHER

Determine the severity/priority:
- LOW
- MEDIUM
- HIGH
- URGENT (use for active leaks, fire hazards, power blackouts, break-ins, safety threats)

Return ONLY a valid JSON object matching this schema:
{
  "category": "PLUMBING" | "ELECTRICAL" | "SECURITY" | "MAINTENANCE" | "OTHER",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "reason": "Brief 1-sentence explanation of why it was categorized this way"
}
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API returned status ${response.status}`);
      }

      const resData = (await response.json()) as any;
      const text = resData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('Empty response from Gemini model.');
      }

      const parsed: AIChatbotResponse = JSON.parse(text.trim());
      return parsed;
    } catch (error) {
      console.error('Failed to classify complaint with Gemini API. Falling back to local classifier:', error);
      return this.localHeuristicClassify(title, description);
    }
  }

  private localHeuristicClassify(title: string, description: string): AIChatbotResponse {
    const text = `${title} ${description}`.toLowerCase();

    // 1. Security check
    if (
      text.includes('theft') ||
      text.includes('robbery') ||
      text.includes('stranger') ||
      text.includes('fight') ||
      text.includes('intruder') ||
      text.includes('guard') ||
      text.includes('gate') ||
      text.includes('security')
    ) {
      return {
        category: 'SECURITY',
        priority: text.includes('weapon') || text.includes('fire') ? 'URGENT' : 'HIGH',
        reason: 'Classified as SECURITY based on keyword triggers.',
      };
    }

    // 2. Plumbing check
    if (
      text.includes('leak') ||
      text.includes('clog') ||
      text.includes('pipe') ||
      text.includes('water') ||
      text.includes('drain') ||
      text.includes('sink') ||
      text.includes('tap') ||
      text.includes('toilet')
    ) {
      return {
        category: 'PLUMBING',
        priority: text.includes('burst') || text.includes('flooding') ? 'URGENT' : 'MEDIUM',
        reason: 'Classified as PLUMBING based on water/pipe keywords.',
      };
    }

    // 3. Electrical check
    if (
      text.includes('power') ||
      text.includes('wire') ||
      text.includes('spark') ||
      text.includes('shock') ||
      text.includes('electricity') ||
      text.includes('meter') ||
      text.includes('short circuit') ||
      text.includes('bulb')
    ) {
      return {
        category: 'ELECTRICAL',
        priority: text.includes('spark') || text.includes('blackout') ? 'URGENT' : 'HIGH',
        reason: 'Classified as ELECTRICAL based on wire/power keywords.',
      };
    }

    // Default Maintenance
    return {
      category: 'MAINTENANCE',
      priority: 'MEDIUM',
      reason: 'Assigned default category and priority.',
    };
  }
}
