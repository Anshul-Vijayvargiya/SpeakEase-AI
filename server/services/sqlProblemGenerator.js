import axios from 'axios';
import { extractJSON } from '../utils/jsonHelper.js';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

export const generateSQLProblem = async (topic, difficulty) => {
    const systemPrompt = `You are an expert SQL instructor and database architect.

    Generate a single, comprehensive SQL problem for an interview candidate.
    Topic: ${topic}
    Difficulty: ${difficulty}

    The problem must include:
    1. A realistic scenario and problem description.
    2. DDL statements to create the required table(s) (SQLite compatible).
    3. DML statements to insert sample data (SQLite compatible).
    4. The expected correct SQL query to solve the problem.

    Make sure the DDL and DML are completely valid SQLite.

    Return ONLY a valid JSON object:
    {
      "topic": "${topic}",
      "difficulty": "${difficulty}",
      "problemStatement": "Clear description of what needs to be queried",
      "expectedSchema": "CREATE TABLE ...",
      "initialData": "INSERT INTO ...",
      "expectedQuery": "SELECT ..."
    }`;

    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'openai/gpt-4o-mini',
            messages: [{ role: 'user', content: systemPrompt }],
            response_format: { type: "json_object" },
            temperature: 0.7,
            max_tokens: 1500
        }, {
            headers: { 
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 20000
        });

        const content = response.data.choices[0].message.content.trim();
        return extractJSON(content);
    } catch (error) {
        console.error("[SQL Generator] Generation Error:", error);
        // Fallback problem
        return {
            topic,
            difficulty,
            problemStatement: "Find the names of employees who earn more than 50000.",
            expectedSchema: "CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, salary INTEGER);",
            initialData: "INSERT INTO employees (name, salary) VALUES ('Alice', 60000), ('Bob', 45000), ('Charlie', 70000);",
            expectedQuery: "SELECT name FROM employees WHERE salary > 50000;"
        };
    }
};

export const evaluateSQLAnswer = async (problem, userQuery, isCorrect, executionError) => {
    const prompt = `You are a Senior Database Engineer reviewing a candidate's SQL query.

    Problem: ${problem.problemStatement}
    Expected Query: ${problem.expectedQuery}
    User Query: ${userQuery}
    Execution Successful: ${isCorrect}
    Execution Error: ${executionError || 'None'}

    Provide constructive feedback. If the query failed, explain why based on the error. If it succeeded, evaluate its efficiency and readability. Give a score out of 100.

    Return ONLY valid JSON:
    {
      "score": 0-100,
      "feedback": "Detailed constructive feedback"
    }`;

    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'openai/gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.5,
            max_tokens: 1000
        }, {
            headers: { 
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        return extractJSON(response.data.choices[0].message.content);
    } catch (error) {
        console.error("[SQL Generator] Evaluation Error:", error);
        return {
            score: isCorrect ? 100 : 0,
            feedback: isCorrect ? "Great job!" : `Query failed: ${executionError}`
        };
    }
};
