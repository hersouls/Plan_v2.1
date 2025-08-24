#!/usr/bin/env node

/**
 * Claude API Test Script
 * Tests the Claude AI integration
 */

import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
dotenv.config();

async function testClaudeAPI() {
  console.log('🤖 Testing Claude API Integration...\n');

  // Check environment variables
  const apiKey = process.env.CLAUDE_API_KEY || process.env.VITE_CLAUDE_API_KEY;
  if (!apiKey) {
    console.error('❌ CLAUDE_API_KEY not found in environment variables');
    console.log('Please set CLAUDE_API_KEY in your .env file');
    process.exit(1);
  }

  console.log('✅ API Key found');

  // Initialize Anthropic client
  let anthropic;
  try {
    anthropic = new Anthropic({
      apiKey: apiKey,
    });
    console.log('✅ Anthropic client initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Anthropic client:', error.message);
    process.exit(1);
  }

  // Test basic API call
  try {
    console.log('\n🧪 Testing basic API call...');
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content:
            'Hello! This is a test from Moonwave Plan app. Please respond with "API test successful!" and a brief greeting.',
        },
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      console.log('✅ API Response:', content.text.trim());
    }
  } catch (error) {
    console.error('❌ API call failed:', error.message);
    process.exit(1);
  }

  // Test task suggestion feature
  try {
    console.log('\n🎯 Testing task suggestion feature...');
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `Generate 2 task suggestions for a family task management app based on "주말 집안일".
        
        Return a JSON array of objects with this format:
        {
          "title": "task title",
          "description": "brief description",
          "category": "household|shopping|personal|work|health|education|entertainment|other",
          "priority": "low|medium|high",
          "estimatedMinutes": number
        }`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      try {
        const suggestions = JSON.parse(content.text);
        console.log('✅ Task suggestions generated:');
        suggestions.forEach((task, index) => {
          console.log(
            `   ${index + 1}. ${task.title} (${task.category}, ${
              task.priority
            })`
          );
        });
      } catch (parseError) {
        console.log(
          '✅ Response received (JSON parsing test):',
          content.text.substring(0, 100) + '...'
        );
      }
    }
  } catch (error) {
    console.error('❌ Task suggestion test failed:', error.message);
  }

  // Test categorization feature
  try {
    console.log('\n📂 Testing task categorization...');
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 50,
      messages: [
        {
          role: 'user',
          content: `Categorize this task into one of these categories: household, shopping, personal, work, health, education, entertainment, other.
        
        Title: 방 청소하기
        Description: 침실과 거실 정리정돈
        
        Return only the category name.`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const category = content.text.trim().toLowerCase();
      console.log(`✅ Categorization result: "${category}"`);
    }
  } catch (error) {
    console.error('❌ Categorization test failed:', error.message);
  }

  console.log('\n🎉 Claude API tests completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Add your Claude API key to the .env file');
  console.log('2. Enable Claude features in your app');
  console.log('3. Start using AI-powered task management!');
}

// Run tests
testClaudeAPI().catch(console.error);
