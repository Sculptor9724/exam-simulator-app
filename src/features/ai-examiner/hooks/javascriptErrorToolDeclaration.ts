/**
 * Function declaration for the JavaScript error checking tool
 * This tells the Gemini model when and how to check for JavaScript errors on the student's screen
 */

import { Type } from "@google/genai";

export const checkJavaScriptErrorsFunctionDeclaration = {
  name: "check_javascript_errors",
  description: `Checks if there are any JavaScript errors visible on the student's screen by capturing and analyzing a screenshot. 

Use this function when
- You see ANY red lines in the IDE
- You see any errors
- You are unsure if the student is experiencing a JavaScript error
- The student mentions something is not working but you cannot see their screen clearly
- You want to verify if an error exists before providing debugging help
- The student's description suggests a technical issue

You will get a precise explanation of the error if there is any. 

Please use this function very often! Also just as a double check sometimes. Make sure you only call the function when you see the code editor/IDE. But use it often so you make sure the syntax is correct`,
  parameters: {
    type: Type.OBJECT,
    properties: {},
    required: [],
  },
};
