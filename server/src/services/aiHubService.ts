
export class AIHubService {
  private getApiKey(): string | undefined {
    return process.env.GEMINI_API_KEY;
  }

  // 1. AI Event Planner: outputs marketing, risks, budget, schedule
  async eventPlanner(title: string, description: string) {
    const apiKey = this.getApiKey();

    if (!apiKey) {
      return {
        schedule: [
          '09:00 AM - Registration & Welcome Coffee',
          '10:00 AM - Opening Keynote Speech',
          '11:30 AM - Practical Hands-on Workshop',
          '01:00 PM - Networking & Lunch Break',
          '02:30 PM - Mentorship & Q&A Panel',
          '04:00 PM - Closing Ceremony & Group Photo',
        ],
        budget: {
          marketing: 150,
          catering: 350,
          logistics: 200,
          prizes: 300,
          total: 1000,
        },
        risks: [
          'High attendance leading to catering shortage. Mitigate: Enforce RSVPs.',
          'Technical AV glitch during speaker session. Mitigate: Double-check projection and cables.',
          'Schedule delays due to traffic. Mitigate: Include buffer periods.',
        ],
        marketingStrategy:
          'Send personalized email newsletters, pin notice on society noticeboard, and publish poster to social channels with custom engagement captions.',
      };
    }

    try {
      const prompt = `
You are an AI Event Planner for an IEEE Student Society. Analyze this event:
Title: "${title}"
Description: "${description}"

Provide a structured plan. Return ONLY a valid JSON object matching this schema:
{
  "schedule": ["string", "string"],
  "budget": {
    "marketing": number,
    "catering": number,
    "logistics": number,
    "prizes": number,
    "total": number
  },
  "risks": ["string", "string"],
  "marketingStrategy": "string"
}
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );

      const resData = (await response.json()) as any;
      const text = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      return JSON.parse(text.trim());
    } catch (e) {
      console.log('Gemini EventPlanner failed, using local fallback:', e);
      return {
        schedule: ['10:00 AM - Introduction', '11:00 AM - Speakers', '02:00 PM - Closing'],
        budget: { marketing: 100, catering: 200, logistics: 100, prizes: 200, total: 600 },
        risks: ['AV glitches', 'Time delays'],
        marketingStrategy: 'Flyers and notices.',
      };
    }
  }

  // 2. AI Resume Reviewer & Skill Gap Analysis
  async resumeReviewer(skills: string, bio: string, techStack: string) {
    const apiKey = this.getApiKey();

    if (!apiKey) {
      return {
        gaps: [
          'Advanced Cloud Infrastructure (AWS / Docker)',
          'Automated testing suites (Jest, Playwright)',
          'Redis caching integration',
        ],
        interviewQuestions: [
          'How do you design database models for multi-tenant tenant isolation?',
          'What is the difference between custom JWT refresh token rotation and session management?',
          'Explain the benefits of Repository Pattern in large TypeScript codebases.',
        ],
        recommendations:
          'Build intermediate backend projects focusing on security protocols and rate limiting middleware. Complete cloud deployment certifications.',
      };
    }

    try {
      const prompt = `
Analyze the profile of this IEEE student developer:
Bio: "${bio}"
Skills: "${skills}"
Tech Stack: "${techStack}"

Identify skill gaps, draft interview questions, and suggest recommendations.
Return ONLY a valid JSON object matching this schema:
{
  "gaps": ["string", "string"],
  "interviewQuestions": ["string", "string"],
  "recommendations": "string"
}
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );

      const resData = (await response.json()) as any;
      const text = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      return JSON.parse(text.trim());
    } catch (e) {
      console.log('Gemini ResumeReviewer failed, using local fallback:', e);
      return {
        gaps: ['Cloud architecture', 'CI/CD pipeline configuration'],
        interviewQuestions: ['Explain middleware.', 'How do you handle auth scaling?'],
        recommendations: 'Study system design.',
      };
    }
  }

  // 3. AI Hub Generators: Meeting minutes, announcements, poster captions
  async generateWriting(type: string, userPrompt: string) {
    const apiKey = this.getApiKey();

    if (!apiKey) {
      if (type === 'minutes') {
        return `📝 **AI MEETING MINUTES SUMMARY**\n\n- **Agenda**: Discussion of upcoming hackathon timeline.\n- **Decisions**: Hackathon dates set to Nov 14-16, volunteer roles delegated.\n- **Action Items**: PR team to design poster, technical team to initialize GitHub templates.\n- **Notes**: Next sync set for Thursday.`;
      }
      if (type === 'caption') {
        return `🔥 **AI POSTER CAPTIONS & ENGAGEMENT**\n\n"Code your ideas, build the future! 🚀 Join us for an intensive learning session mapping projects on Kanban boards. Link in bio! #IEEE #Hackathon #Coding #Mentorship"`;
      }
      return `📢 **AI ANNOUNCEMENT**\n\nWe are excited to launch our technical training sprints! All members can now track progress, log volunteer hours, and claim verified digital badges. Access the dashboard to register!`;
    }

    try {
      const prompt = `
Generate text for: ${type.toUpperCase()}
Based on this raw input: "${userPrompt}"

Output clean, well-formatted markdown text ready for posting. Keep it under 250 words.
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      const resData = (await response.json()) as any;
      const text = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      return text ? text.trim() : 'AI generation error.';
    } catch (e) {
      return `Generated placeholder for ${type} based on input: ${userPrompt}`;
    }
  }
}
