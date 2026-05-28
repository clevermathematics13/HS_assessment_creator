import type { Template } from '../types';

export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'default-quiz',
    name: 'Multiple Choice Quiz',
    description: 'Standard multiple-choice quiz with 4 answer options (A–D) and an answer key.',
    systemPrompt: `You are an expert high school assessment creator. Generate a multiple-choice quiz based on the content provided by the user.

FORMAT RULES:
- Title: Bold heading that names the quiz topic
- Instructions: One sentence telling students to circle the correct answer
- Questions: Numbered 1–N, each on its own line
- Answer choices: Labeled A, B, C, D on separate indented lines
- Answer Key: Separate section at the end labeled "Answer Key" with question numbers and correct letters
- Difficulty: Appropriate for high school students
- Tone: Academic and clear`,
    formatExample: `**[Topic] Quiz**

*Directions: Circle the letter of the best answer for each question.*

1. [Question text]
   A. [Option]
   B. [Option]
   C. [Option]
   D. [Option]

2. [Question text]
   A. [Option]
   ...

---
**Answer Key**
1. B  2. C  3. A  ...`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-frq',
    name: 'Free Response Questions',
    description: 'Open-ended free response questions with point-value rubrics.',
    systemPrompt: `You are an expert high school assessment creator. Generate free response questions (FRQ) based on the content provided.

FORMAT RULES:
- Title: Bold heading naming the topic
- Instructions: Brief paragraph explaining the task and grading
- Questions: Numbered 1–N with point values in parentheses
- Each question has 2–4 sub-parts labeled (a), (b), (c)
- Rubric: After each question, include a brief rubric section showing how points are awarded
- Total points should sum to 100
- Tone: College-board / AP exam style`,
    formatExample: `**[Topic] Free Response Questions**

*Answer all parts of each question completely. Show your work where applicable.*

**Question 1** (25 points)
[Context or scenario]

(a) [Sub-question] (10 pts)
(b) [Sub-question] (10 pts)
(c) [Sub-question] (5 pts)

*Scoring Rubric – Q1:*
- (a): Award 2 pts per correct element × 5 elements
- (b): ...
- (c): ...`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-unit-test',
    name: 'Unit Test (Mixed Format)',
    description: 'Combined unit test with multiple choice, short answer, and essay sections.',
    systemPrompt: `You are an expert high school assessment creator. Generate a full unit test combining multiple choice, short answer, and essay questions.

FORMAT RULES:
- Title: "[Unit Name] Unit Test" as bold heading
- Header: Class, Date, Name fields
- Section I – Multiple Choice: 20 questions, 2 pts each (40 pts total)
- Section II – Short Answer: 4 questions, 10 pts each (40 pts total), 3–5 sentences expected
- Section III – Essay: 1 prompt, 20 pts, full paragraph response expected
- Answer Key / Rubric: Separate page at the end
- Total: 100 points
- Tone: Rigorous, high school level`,
    formatExample: `**[Unit Name] Unit Test**
Name: _________________  Date: __________  Class Period: ____

---
**Section I: Multiple Choice** (40 points – 2 pts each)
*Directions: Circle the best answer.*

1. [Question]
   A. [Option]  B. [Option]  C. [Option]  D. [Option]

...

---
**Section II: Short Answer** (40 points – 10 pts each)
*Directions: Answer in 3–5 complete sentences.*

1. [Prompt]

...

---
**Section III: Essay** (20 points)
*Directions: Write a well-organized paragraph response.*

[Essay prompt]`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
