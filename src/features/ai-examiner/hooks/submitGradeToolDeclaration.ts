import { Type } from "@google/genai";

export const submitGradeFunctionDeclaration = {
  name: "submit_grade",
  description: `Submit a grade and/or feedback for the student's exam session.

Call this tool when you have evaluated the student's performance and are ready to provide a grade and/or feedback. Both grade and feedback are optional — you can submit one, both, or neither. If feedback or a grade is not relevant just reutnr null

Use this when:
- The exam session is ending and you want to record your assessment
- You have enough information to evaluate the student's performance
- The closing phase of the exam has begun

The grade should match the grading criteria specified for this exam (e.g. 7-skala, bestået/ikke bestået).
The feedback should be a brief summary of the student's performance.`,
  parameters: {
    type: Type.OBJECT,
    properties: {
      grade: {
        type: Type.STRING,
        description:
          "The grade for the student. Use the grading scale specified in the exam instructions. If a grade is not relevant just return null",
        nullable: true,
      },
      feedback: {
        type: Type.STRING,
        description:
          "Brief feedback summarizing the student's performance, strengths, and areas for improvement. If feedback is not relevant just return null",
        nullable: true,
      },
    },
    required: [],
  },
};
