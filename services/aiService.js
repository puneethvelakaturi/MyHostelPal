const axios = require('axios');

class AIService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || "AIzaSyD5HBX3YyH9dqSBgTyiaR_s41_FZKAlzL0";
    this.baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
  }

  // Simple categorization: accepts title + description and returns category
  async categorizeComplaint(title, description) {
    try {
      const prompt = `You are a JSON API that categorizes hostel complaints. Categories: maintenance, cleaning, medical, wifi, electricity, water, security, other

Input:
Title: "${title}"
Description: "${description}"

Return a raw JSON object without any markdown formatting or code blocks. Just the JSON like this:
{"category": "medical", "confidence": 0.9}`;

      const response = await this.callGeminiAPI(prompt);
      return this.parseAIResponse(response);
    } catch (error) {
      console.error('Error in AI categorization:', error);
      return {
        category: 'other',
        confidence: 0.5,
        keywords: []
      };
    }
  }

  // Predict priority using title + description + category; returns structured JSON
  async predictPriority(title, description, category) {
    try {
      const prompt = `You are an assistant that determines the urgency of hostel service requests. Return a JSON object only in this exact format:
  {"priority":"<urgent|high|medium|low>","confidence":<0-1>,"reasoning":"brief explanation"}

Rules/Guidance:
- Medical emergencies (ambulance, severe injury, difficulty breathing) -> priority: urgent
- Safety/security threats -> priority: urgent
- Major service outages (no water/electricity for many residents) or critical infrastructure failures -> high
- Minor repairs or cleaning requests -> low/medium depending on impact

Title: "${title}"
Description: "${description}"
Category: "${category}"

Return the JSON object.`;

      const response = await this.callGeminiAPI(prompt);
      return this.parsePriorityResponse(response);
    } catch (error) {
      console.error('Error in AI priority prediction:', error);
      return {
        priority: 'medium',
        confidence: 0.5,
        reasoning: 'Unable to analyze priority'
      };
    }
  }

  async generateSuggestions(description, category, priority) {
    return []; // Skip suggestions generation
  }

  async generateReport(tickets, reportType) {
    try {
      const ticketSummary = tickets.map(ticket => ({
        id: ticket._id,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.createdAt
      }));

      let timeframe, focus;
      switch(reportType) {
        case 'weekly':
          timeframe = 'weekly';
          focus = 'week-over-week trends, service level metrics, and short-term improvements';
          break;
        case 'monthly':
          timeframe = 'monthly';
          focus = 'month-over-month trends, strategic patterns, and long-term improvements';
          break;
        default:
          timeframe = 'daily';
          focus = 'immediate issues and day-to-day operations';
      }

      const prompt = `
        Generate a ${timeframe} summary report for hostel management based on these tickets:

        ${JSON.stringify(ticketSummary, null, 2)}

        Focus on ${focus}.

        Include:
        1. Total tickets by category and priority
        2. Resolution status overview
        3. Critical issues requiring attention
        4. ${timeframe} trends and patterns
        5. Actionable recommendations

        Format in markdown with proper headings (##) and bullet points (*).
        Keep it concise and actionable for hostel administrators.
      `;

      const response = await this.callGeminiAPI(prompt);
      return response;
    } catch (error) {
      console.error('Error in AI report generation:', error);
      return 'Unable to generate report at this time.';
    }
  }

  async generateDailyReport(tickets) {
    return this.generateReport(tickets, 'daily');
  }

  async generateWeeklyReport(tickets) {
    return this.generateReport(tickets, 'weekly');
  }

  async generateMonthlyReport(tickets) {
    return this.generateReport(tickets, 'monthly');
  }

  // Gemini API call method with retries
  async callGeminiAPI(prompt, retryCount = 0) {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 second delay between retries

    try {
      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 700
        }
      };

      console.debug('Calling Gemini API - prompt length:', prompt.length);

        const response = await axios.post(this.baseUrl, payload, {
          headers: { 'Content-Type': 'application/json' },
          params: { key: this.apiKey },
          // Increase timeout to handle occasional slowness from the Gemini API
          timeout: 60000
        });

      // Basic validation of response shape
      if (!response.data || !response.data.candidates || !response.data.candidates[0]) {
        console.error('Unexpected Gemini response shape:', response.data);
        throw new Error('Invalid Gemini response');
      }

      // Log a short preview of the raw response for debugging
      if (process.env.NODE_ENV !== 'production') {
        const preview = String(response.data.candidates[0].content?.parts?.[0]?.text || '').slice(0, 300);
        console.debug('Gemini response preview:', preview);
      }

      return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
      // Handle specific error cases
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;

        // If service is unavailable (503) and we haven't exceeded retries
        if (status === 503 && retryCount < MAX_RETRIES) {
          console.log(`Gemini API overloaded, retrying in ${RETRY_DELAY}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          return this.callGeminiAPI(prompt, retryCount + 1);
        }

        // Handle other specific status codes
        switch (status) {
          case 400:
            throw new Error('Invalid request to Gemini API');
          case 401:
            throw new Error('Invalid API key');
          case 429:
            throw new Error('Rate limit exceeded');
          case 500:
            throw new Error('Gemini API internal error');
          default:
            console.error('Gemini API error:', errorData);
            throw new Error(`Gemini API error: ${status}`);
        }
      }

      console.error('Gemini API call failed:', error.message);
      throw error;
    }
  }

  parseAIResponse(response) {
    try {
      // Remove markdown code block markers if present
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const obj = JSON.parse(cleanResponse);
      
      return {
        category: obj.category || 'other',
        confidence: typeof obj.confidence === 'number' ? obj.confidence : parseFloat(obj.confidence) || 0.5,
        keywords: [] // Simplified to not include keywords
      };
    } catch (err) {
      console.error('Failed to parse AI response:', err);
      console.log('Raw response:', response);
      return {
        category: 'other',
        confidence: 0.5,
        keywords: []
      };
    }
  }

  parsePriorityResponse(response) {
    const lines = response.split('\n');
    const result = {
      priority: 'medium',
      confidence: 0.5,
      reasoning: 'Unable to analyze'
    };

    lines.forEach(line => {
      if (line.startsWith('priority:')) {
        result.priority = line.split(':')[1].trim();
      } else if (line.startsWith('confidence:')) {
        result.confidence = parseFloat(line.split(':')[1].trim());
      } else if (line.startsWith('reasoning:')) {
        result.reasoning = line.split(':')[1].trim();
      }
    });

    return result;
  }

  parseSuggestionsResponse(response) {
    try {
      // Try to parse as JSON
      const suggestions = JSON.parse(response);
      return Array.isArray(suggestions) ? suggestions : [];
    } catch (error) {
      // Fallback: extract suggestions from text
      const lines = response.split('\n').filter(line => line.trim());
      return lines.map(line => line.replace(/^\d+\.\s*/, '').trim());
    }
  }
}

module.exports = new AIService();
