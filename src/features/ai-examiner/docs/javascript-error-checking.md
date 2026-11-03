# JavaScript Error Checking Feature

## Overview

This feature automatically checks for JavaScript errors on the student's screen every 15 seconds after the exam has started. When errors are detected, they are sent to the AI model for acknowledgment and guidance.

## Implementation

### 1. New Hook: `useJavaScriptErrorChecker`

**File:** `src/exam-simulator/pages/AIExaminer/hooks/useJavaScriptErrorChecker.ts`

This custom React hook:

- Captures screenshots from the video stream every 15 seconds
- Sends screenshots to the `/check-javascript-error` endpoint
- Automatically sends detected errors to the AI model using `client.send()`
- Properly cleans up intervals when the exam ends

**Key Features:**

- Only runs when exam has started (`examStarted === true`)
- Requires active video stream (screen sharing)
- Uses canvas to capture screenshots at 768px max width (maintaining aspect ratio)
- Converts screenshots to base64 JPEG format
- Includes authentication token from Supabase session
- Automatically stops when exam ends or video stream stops

### 2. Integration in AIExaminer Component

**File:** `src/exam-simulator/pages/AIExaminer/AIExaminer.tsx`

The hook is integrated into the `ExamWorkflow` component:

```typescript
useJavaScriptErrorChecker({
  client,
  videoRef,
  examStarted,
  videoStream,
});
```

### 3. API Request Format

The hook sends POST requests to `${apiUrl}/check-javascript-error` with:

```json
{
  "image_base64": "data:image/jpeg;base64,..."
}
```

Headers include:

- `Content-Type: application/json`
- `Authorization: Bearer ${session.access_token}`

### 4. Expected Backend Response Format

The backend endpoint returns:

```json
{
  "has_error": true,
  "error_reason": "Line 1: Syntax error due to TypeScript type annotation ': string' in JavaScript file"
}
```

Or when no errors are detected:

```json
{
  "has_error": false
}
```

### 5. AI Model Integration

When errors are detected, the hook sends a message to the AI model:

```typescript
client.send([
  {
    text: `<system_message>IMPORTANT: JavaScript error detected on the student's screen:
Line 1: Syntax error due to TypeScript type annotation ': string' in JavaScript file

Please acknowledge this error and ask the student to fix it if it is blocking progress.</system_message>`,
  },
]);
```

## Behavior

### When Exam Starts

1. Student clicks the exam start button
2. Screen sharing is enabled (required for error detection)
3. The error checker immediately captures first screenshot and checks for errors
4. Sets up 15-second interval to continue checking

### During Exam

- Every 15 seconds, a screenshot is captured
- Screenshot is sent to backend endpoint
- If errors are found, AI model is notified
- Process continues until exam ends

### When Exam Ends

- Interval is automatically cleared
- No more screenshots are captured
- Hook cleanup function handles all cleanup

## Dependencies

- React hooks (useEffect, useRef)
- Supabase authentication
- LiveAPIContext client
- Canvas API for screenshot capture
- Backend endpoint: `/check-javascript-error`

## Error Handling

- Silently fails if video stream is not active
- Logs errors to console for debugging
- Does not interrupt exam if backend is unavailable
- Gracefully handles missing authentication

## Testing Considerations

1. Ensure the backend endpoint `/check-javascript-error` is implemented
2. Verify authentication middleware is working
3. Test with actual JavaScript errors on screen
4. Verify 15-second interval timing
5. Confirm cleanup when exam ends
6. Test without screen sharing enabled (should not crash)
