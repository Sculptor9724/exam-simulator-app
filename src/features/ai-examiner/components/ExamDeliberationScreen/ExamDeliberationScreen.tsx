import React, { useEffect, useRef, useState } from "react";
import cn from "classnames";
import doorSvg from "./door.svg";
import radioSvg from "./radio.svg";

interface ExamDeliberationScreenProps {
  gradeReady: boolean;
  onViewResult: () => void;
}

interface Point {
  x: number;
  y: number;
}

function AnimatedVotingText() {
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setDotCount((currentCount) => (currentCount + 1) % 4);
    }, 450);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <span className="inline-flex items-baseline">
      <span>Eksaminator voterer</span>
      <span
        aria-hidden="true"
        className="inline-block text-left"
        style={{ width: "3ch" }}
      >
        {".".repeat(dotCount)}
      </span>
    </span>
  );
}

function WorkingWallClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const seconds = now.getSeconds();
  const minutes = now.getMinutes();
  const hours = now.getHours() % 12;

  const secondRotation = seconds * 6;
  const minuteRotation = minutes * 6 + seconds * 0.1;
  const hourRotation = hours * 30 + minutes * 0.5;

  return (
    <svg
      viewBox="0 0 300 300"
      role="img"
      aria-label="Analogt ur"
      style={{
        width: "clamp(80px, 12vw, 140px)",
        filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.25))",
      }}
    >
      <title>Analogt ur</title>
      <circle
        cx="150"
        cy="150"
        r="140"
        fill="#f4f4f4"
        stroke="#333"
        strokeWidth="6"
      />
      <circle
        cx="150"
        cy="150"
        r="125"
        fill="white"
        stroke="#ccc"
        strokeWidth="2"
      />

      <g stroke="#333" strokeWidth="4" strokeLinecap="round">
        <line x1="150" y1="35" x2="150" y2="55" />
        <line x1="150" y1="245" x2="150" y2="265" />
        <line x1="35" y1="150" x2="55" y2="150" />
        <line x1="245" y1="150" x2="265" y2="150" />
      </g>

      <g stroke="#666" strokeWidth="2" strokeLinecap="round">
        <line x1="225" y1="75" x2="235" y2="65" />
        <line x1="225" y1="225" x2="235" y2="235" />
        <line x1="75" y1="75" x2="65" y2="65" />
        <line x1="75" y1="225" x2="65" y2="235" />
      </g>

      <line
        x1="150"
        y1="150"
        x2="150"
        y2="95"
        stroke="#111"
        strokeWidth="8"
        strokeLinecap="round"
        transform={`rotate(${hourRotation} 150 150)`}
      />
      <line
        x1="150"
        y1="150"
        x2="150"
        y2="85"
        stroke="#111"
        strokeWidth="5"
        strokeLinecap="round"
        transform={`rotate(${minuteRotation} 150 150)`}
      />
      <line
        x1="150"
        y1="160"
        x2="150"
        y2="60"
        stroke="red"
        strokeWidth="2.5"
        strokeLinecap="round"
        transform={`rotate(${secondRotation} 150 150)`}
      />

      <circle cx="150" cy="150" r="6" fill="red" />
      <circle cx="150" cy="150" r="2.5" fill="white" />
    </svg>
  );
}

function DrawingChalkboard() {
  const boardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPointRef = useRef<Point | null>(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    const board = boardRef.current;
    const canvas = canvasRef.current;

    if (!board || !canvas) {
      return undefined;
    }

    const resizeCanvas = () => {
      const nextBoard = boardRef.current;
      const nextCanvas = canvasRef.current;

      if (!nextBoard || !nextCanvas) {
        return;
      }

      const rect = nextBoard.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const displayWidth = Math.max(Math.round(rect.width), 1);
      const displayHeight = Math.max(Math.round(rect.height), 1);
      const currentWidth = nextCanvas.width;
      const currentHeight = nextCanvas.height;

      const snapshot = document.createElement("canvas");
      snapshot.width = currentWidth;
      snapshot.height = currentHeight;

      const snapshotContext = snapshot.getContext("2d");
      if (snapshotContext && currentWidth > 0 && currentHeight > 0) {
        snapshotContext.drawImage(nextCanvas, 0, 0);
      }

      nextCanvas.width = Math.max(Math.round(displayWidth * ratio), 1);
      nextCanvas.height = Math.max(Math.round(displayHeight * ratio), 1);
      nextCanvas.style.width = `${displayWidth}px`;
      nextCanvas.style.height = `${displayHeight}px`;

      const context = nextCanvas.getContext("2d");
      if (!context) {
        return;
      }

      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.lineCap = "round";
      context.lineJoin = "round";

      if (snapshot.width > 0 && snapshot.height > 0) {
        context.drawImage(snapshot, 0, 0, displayWidth, displayHeight);
      }
    };

    resizeCanvas();

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });

    resizeObserver.observe(board);
    window.addEventListener("resize", resizeCanvas);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();

    if (!rect) {
      return { x: 0, y: 0 };
    }

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const drawStroke = (from: Point, to: Point) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    context.strokeStyle = "rgba(244, 245, 239, 0.98)";
    context.lineWidth = 3.2;
    context.shadowBlur = 5;
    context.shadowColor = "rgba(255, 255, 255, 0.4)";
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = getPoint(event);

    isDrawingRef.current = true;
    lastPointRef.current = point;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawStroke(point, point);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !lastPointRef.current) {
      return;
    }

    const nextPoint = getPoint(event);
    drawStroke(lastPointRef.current, nextPoint);
    lastPointRef.current = nextPoint;
  };

  const stopDrawing = (event?: React.PointerEvent<HTMLCanvasElement>) => {
    if (event && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  return (
    <div
      aria-label="Kridttavle"
      className="absolute"
      style={{ left: "5.5%", top: "40%", width: "clamp(140px, 20vw, 250px)" }}
    >
      <div
        className="relative rounded-[18px] p-2.5"
        style={{
          background: "linear-gradient(145deg, #b98d54, #8f673a)",
          boxShadow: "0 10px 22px rgba(0,0,0,0.18)",
        }}
      >
        <div
          ref={boardRef}
          className="relative overflow-hidden rounded-[10px] border border-[#204838]"
          style={{
            aspectRatio: "4 / 3",
            background: `
              radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08), transparent 28%),
              radial-gradient(circle at 80% 70%, rgba(255,255,255,0.05), transparent 24%),
              linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.1)),
              #234c3d
            `,
            boxShadow:
              "inset 0 0 0 2px rgba(255,255,255,0.03), inset 0 18px 40px rgba(0,0,0,0.18)",
          }}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
            aria-label="Tegn på kridttavlen"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopDrawing}
            onPointerLeave={stopDrawing}
            onPointerCancel={stopDrawing}
          />
        </div>
      </div>
    </div>
  );
}

function WallShelves() {
  return (
    <div
      className="absolute"
      style={{ right: "8%", top: "22%", width: "clamp(140px, 18vw, 220px)" }}
    >
      <div className="relative mb-24">
        <div
          style={{
            height: 10,
            borderRadius: 9999,
            background: "linear-gradient(to right, #a07f5f, #8b6d4d)",
            boxShadow: "0 3px 10px rgba(0,0,0,0.16)",
          }}
        />
        <div
          className="absolute"
          style={{
            left: 18,
            bottom: -6,
            width: 8,
            height: 18,
            borderRadius: 9999,
            background: "#7d6449",
          }}
        />
        <div
          className="absolute"
          style={{
            right: 18,
            bottom: -6,
            width: 8,
            height: 18,
            borderRadius: 9999,
            background: "#7d6449",
          }}
        />
        <div
          className="absolute deliberation-radio-wrap"
          style={{
            left: "50%",
            bottom: -4,
            width: "78%",
            transform: "translateX(-50%)",
          }}
        >
          <img src={radioSvg} alt="" className="block w-full" />
        </div>
      </div>

      <div className="relative ml-10">
        <div
          style={{
            height: 10,
            borderRadius: 9999,
            background: "linear-gradient(to right, #9d7b5b, #876948)",
            boxShadow: "0 3px 10px rgba(0,0,0,0.16)",
          }}
        />
        <div
          className="absolute"
          style={{
            left: 16,
            bottom: -6,
            width: 8,
            height: 18,
            borderRadius: 9999,
            background: "#7d6449",
          }}
        />
        <div
          className="absolute"
          style={{
            right: 16,
            bottom: -6,
            width: 8,
            height: 18,
            borderRadius: 9999,
            background: "#7d6449",
          }}
        />
      </div>
    </div>
  );
}

export default function ExamDeliberationScreen({
  gradeReady,
  onViewResult,
}: ExamDeliberationScreenProps) {
  return (
    <>
      {/* Full-viewport room scene */}
      <div
        className="relative w-full overflow-hidden flex flex-col"
        style={{
          height: "calc(100dvh - 140px)",
          background: "linear-gradient(to bottom, #f7f7f4, #efeee9)",
        }}
      >
        {/* Wall area — fills all space above the floor, with top padding so door isn't flush to top */}
        <div
          className="relative flex-1 flex items-end justify-center"
          style={{ paddingTop: "6%" }}
        >
          {/* Clock on the wall */}
          <div
            aria-hidden
            className="absolute"
            style={{ top: "10%", left: "8%" }}
          >
            <WorkingWallClock />
          </div>

          <DrawingChalkboard />

          <WallShelves />

          {/* Door sitting on the floor — no bottom gap */}
          <img
            src={doorSvg}
            alt="Eksamen dør"
            style={{ width: "min(55%, 380px)", display: "block" }}
          />

          {/* Text + CTA overlaid at the bottom of the wall, on top of the door */}
          <div className="absolute top-10 left-1/2 flex w-fit max-w-[min(90vw,32rem)] -translate-x-1/2 flex-col items-center text-center px-6 pb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Eksamen er afsluttet
            </h2>
            <p className="text-lg text-gray-600">
              {gradeReady ? "" : <AnimatedVotingText />}
            </p>

            <button
              onClick={onViewResult}
              className={cn(
                "px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors transition-opacity duration-300 cursor-pointer",
                {
                  "opacity-0 pointer-events-none": !gradeReady,
                  "opacity-100": gradeReady,
                },
              )}
              aria-hidden={!gradeReady}
              style={{ opacity: gradeReady ? 1 : 0 }}
            >
              Din karakter er klar. Se resultat
            </button>
          </div>
        </div>

        {/* Floor strip */}
        <div
          style={{
            height: 50,
            background: "linear-gradient(to bottom, #c8c2b8, #b8b2a8)",
            flexShrink: 0,
          }}
        />
      </div>
    </>
  );
}
