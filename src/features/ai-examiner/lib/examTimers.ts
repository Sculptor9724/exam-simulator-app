import { examLogger } from "./examLogger";

export const PRE_END_MUTE_SECONDS = 5;
export const PRE_END_MUTE_MS = PRE_END_MUTE_SECONDS * 1000;

type SetupExamTimersParams = {
  examDurationInMs: number;
  onPreEndMute?: () => void;
  onExamEnd: () => void;
};

// Sets up standard exam timers (pre-end mute and hard end) and returns a cleanup function
export function setupExamTimers({
  examDurationInMs,
  onPreEndMute,
  onExamEnd,
}: SetupExamTimersParams) {
  examLogger.log("timers_setup", {
    examDurationInMs,
    preMuteAt: examDurationInMs - PRE_END_MUTE_MS,
  });

  const preMuteId = window.setTimeout(
    () => {
      examLogger.log("timer_pre_mute_fired");
      try {
        onPreEndMute?.();
      } catch {}
    },
    Math.max(0, examDurationInMs - PRE_END_MUTE_MS),
  );

  const endId = window.setTimeout(() => {
    examLogger.log("timer_exam_end_fired");
    try {
      onExamEnd();
    } catch {}
  }, examDurationInMs);

  return () => {
    examLogger.log("timers_cleared");
    window.clearTimeout(preMuteId);
    window.clearTimeout(endId);
  };
}
