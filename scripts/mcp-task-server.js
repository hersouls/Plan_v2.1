#!/usr/bin/env node

/**
 * Moonwave MCP Task Server
 * Provides task management capabilities via Model Context Protocol
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

class MoonwaveTaskServer {
  constructor() {
    this.server = new Server(
      {
        name: 'moonwave-task-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'create_task',
            description: 'Create a new task in the Moonwave system',
            inputSchema: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: 'Task title',
                },
                description: {
                  type: 'string',
                  description: 'Task description (optional)',
                },
                priority: {
                  type: 'string',
                  enum: ['low', 'medium', 'high'],
                  description: 'Task priority',
                },
                category: {
                  type: 'string',
                  description: 'Task category',
                },
                assigneeId: {
                  type: 'string',
                  description: 'ID of the person assigned to this task',
                },
                dueDate: {
                  type: 'string',
                  description: 'Due date in ISO format (optional)',
                },
                estimatedMinutes: {
                  type: 'number',
                  description: 'Estimated time to complete in minutes (optional)',
                },
              },
              required: ['title', 'priority', 'category', 'assigneeId'],
            },
          },
          {
            name: 'list_tasks',
            description: 'List tasks with optional filtering',
            inputSchema: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: ['pending', 'in_progress', 'completed'],
                  description: 'Filter by task status (optional)',
                },
                assigneeId: {
                  type: 'string',
                  description: 'Filter by assignee ID (optional)',
                },
                category: {
                  type: 'string',
                  description: 'Filter by category (optional)',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of tasks to return (optional)',
                },
              },
              required: [],
            },
          },
          {
            name: 'update_task',
            description: 'Update an existing task',
            inputSchema: {
              type: 'object',
              properties: {
                taskId: {
                  type: 'string',
                  description: 'ID of the task to update',
                },
                updates: {
                  type: 'object',
                  description: 'Fields to update',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    status: { 
                      type: 'string',
                      enum: ['pending', 'in_progress', 'completed']
                    },
                    priority: {
                      type: 'string',
                      enum: ['low', 'medium', 'high']
                    },
                    category: { type: 'string' },
                    dueDate: { type: 'string' },
                    estimatedMinutes: { type: 'number' },
                  },
                },
              },
              required: ['taskId', 'updates'],
            },
          },
          {
            name: 'delete_task',
            description: 'Delete a task',
            inputSchema: {
              type: 'object',
              properties: {
                taskId: {
                  type: 'string',
                  description: 'ID of the task to delete',
                },
              },
              required: ['taskId'],
            },
          },
          {
            name: 'get_task_stats',
            description: 'Get task statistics and insights',
            inputSchema: {
              type: 'object',
              properties: {
                groupId: {
                  type: 'string',
                  description: 'Group ID to get stats for (optional)',
                },
                timeframe: {
                  type: 'string',
                  enum: ['today', 'week', 'month'],
                  description: 'Timeframe for statistics',
                },
              },
              required: [],
            },
          },
          {
            name: 'suggest_task_improvements',
            description: 'Get AI suggestions for task improvements',
            inputSchema: {
              type: 'object',
              properties: {
                taskId: {
                  type: 'string',
                  description: 'ID of the task to analyze',
                },
              },
              required: ['taskId'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'create_task':
            return await this.createTask(args);
          case 'list_tasks':
            return await this.listTasks(args);
          case 'update_task':
            return await this.updateTask(args);
          case 'delete_task':
            return await this.deleteTask(args);
          case 'get_task_stats':
            return await this.getTaskStats(args);
          case 'suggest_task_improvements':
            return await this.suggestTaskImprovements(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async createTask(args) {
    // In a real implementation, this would interface with your Firebase/Firestore
    const task = {
      id: `task_${Date.now()}`,
      ...args,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      content: [
        {
          type: 'text',
          text: `Task created successfully: ${task.title} (ID: ${task.id})`,
        },
      ],
    };
  }

  async listTasks(args) {
    // Mock implementation - in reality, query your database
    const mockTasks = [
      {
        id: 'task_1',
        title: '주방 청소하기',
        status: 'pending',
        priority: 'medium',
        category: 'household',
        assigneeId: 'user_1',
      },
      {
        id: 'task_2',
        title: '장보기',
        status: 'in_progress',
        priority: 'high',
        category: 'shopping',
        assigneeId: 'user_2',
      },
    ];

    let filteredTasks = mockTasks;

    if (args.status) {
      filteredTasks = filteredTasks.filter(task => task.status === args.status);
    }
    if (args.assigneeId) {
      filteredTasks = filteredTasks.filter(task => task.assigneeId === args.assigneeId);
    }
    if (args.category) {
      filteredTasks = filteredTasks.filter(task => task.category === args.category);
    }
    if (args.limit) {
      filteredTasks = filteredTasks.slice(0, args.limit);
    }

    return {
      content: [
        {
          type: 'text',
          text: `Found ${filteredTasks.length} tasks:\n${filteredTasks.map(task => 
            `- ${task.title} (${task.status}, ${task.priority})`
          ).join('\n')}`,
        },
      ],
    };
  }

  async updateTask(args) {
    const { taskId, updates } = args;
    
    return {
      content: [
        {
          type: 'text',
          text: `Task ${taskId} updated successfully with: ${JSON.stringify(updates, null, 2)}`,
        },
      ],
    };
  }

  async deleteTask(args) {
    const { taskId } = args;
    
    return {
      content: [
        {
          type: 'text',
          text: `Task ${taskId} deleted successfully`,
        },
      ],
    };
  }

  async getTaskStats(args) {
    // Mock statistics
    const stats = {
      total: 15,
      completed: 8,
      inProgress: 3,
      pending: 4,
      completionRate: 53,
      avgCompletionTime: 45, // minutes
      topCategory: 'household',
      topAssignee: 'user_1',
    };

    return {
      content: [
        {
          type: 'text',
          text: `Task Statistics (${args.timeframe || 'all time'}):\n` +
                `- Total: ${stats.total}\n` +
                `- Completed: ${stats.completed}\n` +
                `- In Progress: ${stats.inProgress}\n` +
                `- Pending: ${stats.pending}\n` +
                `- Completion Rate: ${stats.completionRate}%\n` +
                `- Avg Completion Time: ${stats.avgCompletionTime} minutes\n` +
                `- Top Category: ${stats.topCategory}\n` +
                `- Most Active User: ${stats.topAssignee}`,
        },
      ],
    };
  }

  async suggestTaskImprovements(args) {
    const { taskId } = args;
    
    // Mock AI suggestions
    const suggestions = [
      "이 작업을 더 작은 단위로 나누어 관리하기 쉽게 만들어보세요",
      "마감일을 설정하여 우선순위를 명확히 하세요",
      "필요한 도구나 재료 목록을 추가해보세요",
      "가족 구성원과 함께 할 수 있는 방법을 고려해보세요"
    ];

    return {
      content: [
        {
          type: 'text',
          text: `AI Suggestions for Task ${taskId}:\n${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
        },
      ],
    };
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Moonwave MCP Task Server running on stdio');
  }
}

// Run the server
if (require.main === module) {
  const server = new MoonwaveTaskServer();
  server.run().catch(console.error);
}

module.exports = MoonwaveTaskServer;