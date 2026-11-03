# Exam Finish Flow Architecture

## Overview

The exam finish flow has been refactored to provide clear separation of concerns and a more maintainable architecture. The flow now uses async functions instead of hooks and centralizes all exam finish logic in a dedicated service.

## Architecture

### Components & Responsibilities

#### 1. **ExamFinishService** (`services/examFinishService.ts`)

**Role**: Business logic layer for finishing exams

**Responsibilities**:

- Fetch grade and feedback from AI backend
- Update exam logs in database
- Handle errors gracefully
- Provide clean async API

**Key Methods**:

- `finishExam(params)` - Complete finish flow with grading (used for user finish AND timer finish)
- `fetchGradeAndFeedback(outputMessage)` - Get AI evaluation

**Note**: For unexpected redirects, the repository is called directly since we can't do async grading during page unload.

#### 2. **ControlTray** (`components/control-tray/ControlTray.tsx`)

**Role**: UI Component

**Responsibilities**:

- Display start/finish button
- Show loading states
- Trigger callbacks (no business logic)
- Handle mic/video controls

**Props**:

- `onStartExam?: () => void` - Called when user clicks start
- `onFinishExam?: () => void` - Called when user clicks finish
- `isFinishing?: boolean` - Shows loading state during finish
- `disabled?: boolean` - Disables all controls

#### 3. **AIExaminer** (`pages/AIExaminer.tsx`)

**Role**: Orchestration layer

**Responsibilities**:

- Manage exam lifecycle
- Coordinate between UI and services
- Handle exam start/finish flows
- Navigate to results page

## Finish Flow Scenarios

### 1. User-Initiated Finish

**Trigger**: User clicks "Afslut eksamen" button

**Flow**:

```
User clicks button
  → ControlTray calls onFinishExam()
    → AIExaminer.onFinishExamClicked()
      → Sets isFinishingExam = true
      → Disconnects client
      → Calls examFinishService.finishExam()
        → Fetches grade/feedback from AI
        → Updates exam log in database
      → Navigates to exam-finished page
```

**Code**:

```typescript
const onFinishExamClicked = async () => {
  if (!examLogId) return;

  setIsFinishingExam(true);

  try {
    client.disconnect();

    const result = await examFinishService.finishExam({
      examLogId,
      outputMessage: client.outputMessage,
      finishedReason: "user_finished",
    });

    navigate(`/exam-finished?user=${user.id}&exam-log-id=${examLogId}`);
  } catch (error) {
    console.error("Error finishing exam:", error);
    navigate(`/exam-finished?user=${user.id}&exam-log-id=${examLogId}`);
  } finally {
    setIsFinishingExam(false);
  }
};
```

### 2. Time-Based Finish

**Trigger**: Exam timer expires

**Flow**:

```
Timer expires
  → examTimers hook callback
    → examFinishService.finishExam()
      → Fetches grade/feedback from AI
      → Updates exam log with finished_reason: "time_passed"
      → Navigates to exam-finished page
```

**Code**:

```typescript
examTimers({
  client,
  examDurationInMinutes: currentExamTotalDurationInMinutes,
  examSimulator,
  onExamFinish: async () => {
    if (examLogId) {
      // Timer finished - get grade and feedback
      await examFinishService.finishExam({
        examLogId,
        outputMessage: client.outputMessage,
        finishedReason: "time_passed",
      });
      // Navigate to results page
      navigate(`/exam-finished?user=${user.id}&exam-log-id=${examLogId}`);
    }
  },
});
```

**Note**: Timer finish gets full grading just like user-initiated finish. The student deserves feedback even if they ran out of time!

### 3. Navigation/Redirect Finish

**Trigger**: User navigates away or closes tab (unexpected exit)

**Flow**:

```
beforeunload event
  → Cleanup effect handler
    → examLogRepository.updateById()
      → Updates exam log with finished_reason: "redirect"
      → No grading (page is unloading, can't do async grading)
```

**Code**:

```typescript
useEffect(() => {
  const handleBeforeUnload = async () => {
    if (examStarted && examLogId) {
      // Use repository directly - can't do complex grading during page unload
      await examLogRepository.updateById(examLogId, {
        finished_at: new Date().toISOString(),
        finished_reason: "redirect",
      });
    }
  };

  window.addEventListener("beforeunload", handleBeforeUnload);

  return () => {
    window.removeEventListener("beforeunload", handleBeforeUnload);

    if (examStarted && examLogId) {
      examLogRepository.updateById(examLogId, {
        finished_at: new Date().toISOString(),
        finished_reason: "redirect",
      });
    }
  };
}, [examStarted, examLogId]);
```

## Data Flow Diagram

```
┌─────────────────┐
│   ControlTray   │ (UI Layer)
│                 │
│ - Start button  │
│ - Finish button │
│ - Loading state │
└────────┬────────┘
         │ callbacks
         │
         ▼
┌─────────────────┐
│   AIExaminer    │ (Orchestration Layer)
│                 │
│ - onStartExam() │
│ - onFinishExam()│
│ - State mgmt    │
└────────┬────────┘
         │ async calls
         │
         ▼
┌──────────────────┐
│ ExamFinishService│ (Service Layer)
│                  │
│ - finishExam()   │
│ - fetch grade    │
│ - update DB      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Backend API    │
│   Database       │
└──────────────────┘
```

## Key Improvements

### Before Refactoring

❌ Grade/feedback fetching in UI component (ControlTray)  
❌ Mixed responsibilities across components  
❌ Complex state management with callbacks  
❌ Unclear flow and hard to follow logic

### After Refactoring

✅ Service layer handles all business logic  
✅ Clean separation of concerns  
✅ Async/await pattern (no complex hooks)  
✅ Single source of truth for finish logic  
✅ Easy to test and maintain  
✅ Clear, linear flow

## Error Handling

The service gracefully handles errors:

1. **Grade fetch fails**: Still finishes exam with null grade/feedback
2. **Database update fails**: Logs error but continues navigation
3. **Network errors**: Returns null values instead of throwing

This ensures the exam always finishes, even if grading fails.

## Testing Considerations

To test the finish flow:

1. **User finish**: Click finish button, verify grade/feedback saved and navigation
2. **Timer finish**: Wait for timer to expire, verify grade/feedback saved and navigation
3. **Navigation**: Close tab/navigate away, verify redirect reason logged (no grade/feedback)
4. **Error handling**: Mock API failure, verify exam still finishes gracefully

**Important**: Both user-initiated and timer-based finishes should receive full grading!

## Future Enhancements

Potential improvements:

- Add retry logic for failed grade fetches
- Implement optimistic updates for faster UX
- Add telemetry/analytics for finish flows
- Cache grade/feedback for offline support
