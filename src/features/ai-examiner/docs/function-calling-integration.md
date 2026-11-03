# JavaScript Error Checking with Function Calling

## Overview

The JavaScript error checking feature has been refactored to use **Gemini Function Calling** instead of periodic polling. The model can now intelligently decide when to check for errors on the student's screen based on context.

## Architecture

### 1. Function Declaration (`javascriptErrorToolDeclaration.ts`)

Defines the `check_javascript_errors` tool that the Gemini model can call:

```typescript
{
  name: "check_javascript_errors",
  description: "Checks if there are any JavaScript errors visible on the student's screen...",
  parameters: {
    type: Type.OBJECT,
    properties: {},
    required: [],
  }
}
```

The function takes no parameters and returns:

```typescript
{
  has_error: boolean,
  error_reason?: string
}
```

### 2. Error Checking Hook (`useJavaScriptErrorChecker.ts`)

Provides a `captureAndCheckForErrors` function that:

- Captures a screenshot from the video stream
- Resizes it to max 768px width (maintaining aspect ratio)
- Sends it to the backend API for error detection
- Returns the error detection result

Key features:

- **Concurrent call protection**: Uses a ref to prevent multiple simultaneous checks
- **Validation**: Only runs when exam is started and video is available
- **Async/await**: Returns a Promise for easy integration

### 3. Integration in AIExaminer (`AIExaminer.tsx`)

#### Tool Configuration

The function declaration is added to the Gemini config:

```typescript
const getConfig = (prompt: string) => ({
  // ... other config
  tools: [
    {
      functionDeclarations: [checkJavaScriptErrorsFunctionDeclaration],
    },
  ],
});
```

#### Tool Call Handler

A `useEffect` hook sets up an event listener for tool calls:

```typescript
useEffect(() => {
  if (!client || !examStarted) return;

  const handleToolCall = async (toolCall: any) => {
    if (toolCall.functionCalls) {
      for (const functionCall of toolCall.functionCalls) {
        if (functionCall.name === "check_javascript_errors") {
          // Execute the error checking function
          const result = await captureAndCheckForErrors();

          // Send the result back to the model
          client.sendToolResponse({
            functionResponses: [
              {
                id: functionCall.id,
                response: {
                  has_error: result.has_error,
                  error_reason: result.error_reason || "No errors detected",
                },
              },
            ],
          });
        }
      }
    }
  };

  client.on("toolcall", handleToolCall);
  return () => client.off("toolcall", handleToolCall);
}, [client, examStarted, captureAndCheckForErrors]);
```

## How It Works

### Flow Diagram

```
Student mentions issue
    ↓
Gemini analyzes context
    ↓
Decides to check for errors
    ↓
Calls check_javascript_errors function
    ↓
Client receives toolcall event
    ↓
Executes captureAndCheckForErrors()
    ↓
Screenshot captured & sent to backend
    ↓
Backend analyzes image
    ↓
Result returned to client
    ↓
Client sends tool response to Gemini
    ↓
Gemini incorporates result into conversation
```

## When the Model Calls the Function

The model intelligently decides to call `check_javascript_errors` when:

1. **Uncertainty**: The student mentions something isn't working but it's unclear
2. **Debugging**: Before providing technical help
3. **Verification**: To confirm suspicions of an error
4. **Context**: The conversation suggests a technical issue

This is more efficient than checking every 15 seconds because:

- ✅ Only checks when needed
- ✅ Reduces API calls to the backend
- ✅ More contextually relevant
- ✅ Better user experience

## Error Handling

The implementation includes robust error handling:

1. **Concurrent calls**: Prevents multiple simultaneous checks using `isCheckingRef`
2. **Validation**: Checks that exam is started and video is available
3. **Try-catch**: Wraps the entire execution in error handling
4. **Fallback response**: Returns safe defaults on errors

```typescript
try {
  const result = await captureAndCheckForErrors();
  // Send result
} catch (error) {
  console.error("Error executing error check:", error);
  // Send safe fallback
  client.sendToolResponse({
    functionResponses: [
      {
        id: functionCall.id,
        response: {
          has_error: false,
          error_reason: "Failed to check for errors",
        },
      },
    ],
  });
}
```

## Backend API

The function calls the existing backend endpoint:

```
POST /check-javascript-error
Authorization: Bearer <token>
Content-Type: application/json

{
  "image_base64": "data:image/jpeg;base64,..."
}
```

Response:

```json
{
  "has_error": true,
  "error_reason": "TypeError: Cannot read property 'map' of undefined at line 42"
}
```

## Benefits

### Before (Interval-based)

- ❌ Checks every 15 seconds regardless of need
- ❌ Wastes API calls
- ❌ May miss errors between intervals
- ❌ No context awareness

### After (Function Calling)

- ✅ Checks only when model determines it's necessary
- ✅ Efficient API usage
- ✅ Immediate response to suspected issues
- ✅ Context-aware and intelligent

## Testing

To test the function calling:

1. Start an exam with screen sharing
2. Create a JavaScript error on your shared screen
3. Mention to the AI that "something isn't working"
4. Observe the console logs:
   - "Received tool call"
   - "Executing JavaScript error check..."
   - "Error check result: { has_error: true, ... }"
5. The model should respond with information about the detected error

### Tool Response Schema Notes

Depending on the SDK version, the accepted function response payload for Live API can vary. In this project the working response shape is a "flattened" object without a nested `result` wrapper:

```ts
client.sendToolResponse({
  functionResponses: [
    {
      id: functionCall.id,
      response: {
        name: functionCall.name, // helps disambiguate for some SDK builds
        has_error: result.has_error,
        error_reason: result.error_reason || "No errors detected",
      },
    },
  ],
});
```

If you encounter `Could not parse function response, type 'object'` errors:

1. Remove extra nesting like `{ result: {...} }`.
2. Ensure `response` is a plain JSON-serializable object.
3. Optionally include the function name (`name`) inside `response` for compatibility.
4. Confirm the `id` exactly matches the incoming `functionCall.id`.

If future SDK updates restore the nested structure, you can adapt with:

```ts
response: {
  result: {
    has_error, error_reason;
  }
}
```

but only if the plain form stops working.

### Temporary Fallback: Textual Function Responses

If structured tool responses keep failing (e.g. `Could not parse function response, type 'object'.`) you can bypass `client.sendToolResponse` and instead inject the result as a normal text turn so the model can parse it:

```ts
const syntheticMessage = `<function_response name="${functionCall.name}" id="${
  functionCall.id
}">\n${JSON.stringify({
  has_error: result.has_error,
  error_reason: result.error_reason || "No errors detected",
})}\n</function_response>`;
client.send([{ text: syntheticMessage }]);
```

Guidelines:

1. Use a distinct tag (`<function_response>`...) to reduce hallucination risk.
2. Keep JSON stable and limited to keys the model should use.
3. Revert to native `sendToolResponse` once SDK parsing is fixed to regain multi-turn orchestration benefits.

The project currently uses this fallback due to parsing issues with the structured response pathway.

## Future Enhancements

Potential improvements:

- Add parameters to the function (e.g., `focus_area: "console" | "ui" | "network"`)
- Implement caching to avoid duplicate checks
- Add metrics/analytics for function call frequency
- Support parallel function calling with other tools
