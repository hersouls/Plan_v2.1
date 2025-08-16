import Anthropic from '@anthropic-ai/sdk';

// Claude AI configuration
const getClaudeConfig = () => {
  const config = {
    apiKey: import.meta.env.VITE_CLAUDE_API_KEY || import.meta.env.CLAUDE_API_KEY,
    model: import.meta.env.VITE_CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
    maxTokens: parseInt(import.meta.env.VITE_CLAUDE_MAX_TOKENS || '4096'),
    enabled: import.meta.env.VITE_ENABLE_CLAUDE_AI === 'true'
  };

  if (!config.apiKey && config.enabled) {
    console.warn('Claude AI is enabled but API key is missing. Please set VITE_CLAUDE_API_KEY in your environment variables.');
  }

  return config;
};

const config = getClaudeConfig();

// Initialize Anthropic client
export const anthropic = config.apiKey ? new Anthropic({
  apiKey: config.apiKey,
  dangerouslyAllowBrowser: true // Only for client-side usage
}) : null;

// Claude AI service interface
export interface ClaudeAIService {
  generateTaskSuggestions: (input: string) => Promise<TaskSuggestion[]>;
  categorizeTask: (title: string, description?: string) => Promise<string>;
  improveTaskDescription: (title: string, description?: string) => Promise<string>;
  generateSubtasks: (taskTitle: string, description?: string) => Promise<string[]>;
  estimateTaskDuration: (title: string, description?: string) => Promise<number>;
  suggestTaskPriority: (title: string, description?: string, dueDate?: Date) => Promise<'low' | 'medium' | 'high'>;
}

export interface TaskSuggestion {
  title: string;
  description?: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  estimatedMinutes?: number;
}

// Claude AI service implementation
export const claudeAIService: ClaudeAIService = {
  async generateTaskSuggestions(input: string): Promise<TaskSuggestion[]> {
    if (!anthropic || !config.enabled) {
      console.warn('Claude AI is not available');
      return [];
    }

    try {
      const response = await anthropic.messages.create({
        model: config.model,
        max_tokens: config.maxTokens,
        messages: [{
          role: 'user',
          content: `Based on this input: "${input}", generate 3-5 helpful task suggestions for a family task management app. 
          
          Return a JSON array of objects with this format:
          {
            "title": "task title",
            "description": "brief description",
            "category": "household|shopping|personal|work|health|education|entertainment|other",
            "priority": "low|medium|high",
            "estimatedMinutes": number
          }
          
          Make suggestions relevant to the input and suitable for family collaboration.`
        }],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        try {
          return JSON.parse(content.text);
        } catch (parseError) {
          console.error('Failed to parse Claude response:', parseError);
          return [];
        }
      }
      return [];
    } catch (error) {
      console.error('Claude AI task suggestions error:', error);
      return [];
    }
  },

  async categorizeTask(title: string, description?: string): Promise<string> {
    if (!anthropic || !config.enabled) {
      return 'other';
    }

    try {
      const response = await anthropic.messages.create({
        model: config.model,
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: `Categorize this task into one of these categories: household, shopping, personal, work, health, education, entertainment, other.
          
          Title: ${title}
          Description: ${description || 'No description'}
          
          Return only the category name.`
        }],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const category = content.text.trim().toLowerCase();
        const validCategories = ['household', 'shopping', 'personal', 'work', 'health', 'education', 'entertainment', 'other'];
        return validCategories.includes(category) ? category : 'other';
      }
      return 'other';
    } catch (error) {
      console.error('Claude AI categorization error:', error);
      return 'other';
    }
  },

  async improveTaskDescription(title: string, description?: string): Promise<string> {
    if (!anthropic || !config.enabled) {
      return description || '';
    }

    try {
      const response = await anthropic.messages.create({
        model: config.model,
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Improve this task description to be more clear and actionable for a family task management app:
          
          Title: ${title}
          Current Description: ${description || 'No description provided'}
          
          Return an improved, concise description (max 2-3 sentences) that includes:
          - Clear action steps
          - Any helpful context
          - What success looks like
          
          Keep it family-friendly and practical.`
        }],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return content.text.trim();
      }
      return description || '';
    } catch (error) {
      console.error('Claude AI description improvement error:', error);
      return description || '';
    }
  },

  async generateSubtasks(taskTitle: string, description?: string): Promise<string[]> {
    if (!anthropic || !config.enabled) {
      return [];
    }

    try {
      const response = await anthropic.messages.create({
        model: config.model,
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: `Break down this task into 3-6 specific subtasks:
          
          Title: ${taskTitle}
          Description: ${description || 'No description'}
          
          Return a JSON array of strings, each being a clear, actionable subtask.
          Make subtasks specific and measurable.
          
          Example format: ["Subtask 1", "Subtask 2", "Subtask 3"]`
        }],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        try {
          return JSON.parse(content.text);
        } catch (parseError) {
          // Fallback: split by lines if JSON parsing fails
          return content.text.split('\n')
            .filter(line => line.trim())
            .map(line => line.replace(/^[-*•]\s*/, '').trim())
            .filter(line => line.length > 0);
        }
      }
      return [];
    } catch (error) {
      console.error('Claude AI subtasks generation error:', error);
      return [];
    }
  },

  async estimateTaskDuration(title: string, description?: string): Promise<number> {
    if (!anthropic || !config.enabled) {
      return 30; // Default 30 minutes
    }

    try {
      const response = await anthropic.messages.create({
        model: config.model,
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: `Estimate how many minutes this task would take for an average person:
          
          Title: ${title}
          Description: ${description || 'No description'}
          
          Consider the complexity and typical time needed.
          Return only a number (minutes).`
        }],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const minutes = parseInt(content.text.trim());
        return isNaN(minutes) ? 30 : Math.max(5, Math.min(minutes, 480)); // Between 5 minutes and 8 hours
      }
      return 30;
    } catch (error) {
      console.error('Claude AI duration estimation error:', error);
      return 30;
    }
  },

  async suggestTaskPriority(title: string, description?: string, dueDate?: Date): Promise<'low' | 'medium' | 'high'> {
    if (!anthropic || !config.enabled) {
      return 'medium';
    }

    try {
      const dueDateInfo = dueDate ? `Due date: ${dueDate.toLocaleDateString()}` : 'No due date';
      
      const response = await anthropic.messages.create({
        model: config.model,
        max_tokens: 50,
        messages: [{
          role: 'user',
          content: `Suggest a priority level (low, medium, high) for this task:
          
          Title: ${title}
          Description: ${description || 'No description'}
          ${dueDateInfo}
          
          Consider urgency, importance, and impact on family.
          Return only: low, medium, or high`
        }],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const priority = content.text.trim().toLowerCase();
        return (['low', 'medium', 'high'].includes(priority) ? priority : 'medium') as 'low' | 'medium' | 'high';
      }
      return 'medium';
    } catch (error) {
      console.error('Claude AI priority suggestion error:', error);
      return 'medium';
    }
  }
};

// Claude AI hooks and utilities
export const useClaudeAI = () => {
  const isAvailable = !!anthropic && config.enabled;
  
  return {
    isAvailable,
    ...claudeAIService
  };
};

// Export configuration for other modules
export { config as claudeConfig };