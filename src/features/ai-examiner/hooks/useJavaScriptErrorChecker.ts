import { useCallback, useRef, useEffect } from "react";
import { supabase } from "../../../config/supabaseClient";
import { apiUrl } from "../../../config/apiConfig";

interface JavaScriptErrorCheckerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  examStarted: boolean;
  videoStream: MediaStream | null;
}

interface ErrorCheckResult {
  has_error: boolean;
  error_reason?: string;
}

/**
 * Hook that provides a function to capture screenshots and check for JavaScript errors
 * Returns a function that can be called by the Gemini model via function calling
 */
export function useJavaScriptErrorChecker({
  videoRef,
  examStarted,
  videoStream,
}: JavaScriptErrorCheckerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isCheckingRef = useRef<boolean>(false);

  useEffect(() => {
    // Create a canvas element for capturing screenshots
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }
  }, []);

  const captureAndCheckForErrors =
    useCallback(async (): Promise<ErrorCheckResult> => {
      // Prevent concurrent calls
      if (isCheckingRef.current) {
        //console.log("JavaScript error check already in progress, skipping...");
        return { has_error: false };
      }

      // Only proceed if exam has started and video stream is active
      if (!examStarted || !videoRef.current || !videoStream) {
        //console.log("Cannot check for errors: exam not started or video not available");
        return { has_error: false };
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!canvas || video.videoWidth === 0 || video.videoHeight === 0) {
        //console.log("Cannot check for errors: video dimensions not ready");
        return { has_error: false };
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error("Cannot get canvas context");
        return { has_error: false };
      }

      isCheckingRef.current = true;

      try {
        // Calculate dimensions with max width of 768px while maintaining aspect ratio
        const maxWidth = 1100;
        let targetWidth = video.videoWidth;
        let targetHeight = video.videoHeight;

        if (targetWidth > maxWidth) {
          const aspectRatio = targetHeight / targetWidth;
          targetWidth = maxWidth;
          targetHeight = maxWidth * aspectRatio;
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Draw the current video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to base64 image
        const base64Image = canvas.toDataURL("image/jpeg", 1);

        window.open(base64Image);

        // Get authentication token
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          console.error("No authentication token available");
          return { has_error: false };
        }

        // Send screenshot to backend for JavaScript error detection
        const response = await fetch(`${apiUrl}/check-javascript-error`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            image_base64: base64Image,
          }),
        });

        if (!response.ok) {
          console.error(
            "Error checking for JavaScript errors:",
            response.statusText
          );
          return { has_error: false };
        }

        const result = await response.json();
        //console.log("JavaScript error check result:", result);

        return result;
      } catch (error) {
        console.error("Error in JavaScript error checker:", error);
        return { has_error: false };
      } finally {
        isCheckingRef.current = false;
      }
    }, [examStarted, videoRef, videoStream]);

  return { captureAndCheckForErrors };
}
