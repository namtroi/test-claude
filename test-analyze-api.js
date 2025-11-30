// Test script to verify the /analyze API endpoint
const fs = require('fs');
const path = require('path');

const sampleFiles = [
  {
    name: 'util.ts',
    path: 'src/util.ts',
    content: `export function add(a: number, b: number): number {
  return a + b;
}

export function subtract(a: number, b: number): number {
  return a - b;
}`,
    language: 'typescript'
  },
  {
    name: 'main.ts',
    path: 'src/main.ts',
    content: `import { add } from './util';

export function calculate(): number {
  return add(1, 2);
}`,
    language: 'typescript'
  }
];

async function testAnalyze() {
  try {
    const response = await fetch('http://localhost:3001/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ files: sampleFiles }),
    });

    const data = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));
    
    if (data.mermaid) {
      console.log('\n===== MERMAID DIAGRAM =====');
      console.log(data.mermaid);
      console.log('===========================\n');
    } else {
      console.log('\n⚠️  WARNING: No mermaid field in response!');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAnalyze();
