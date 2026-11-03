import React, { useEffect, useState } from "react";
import QRCode from "qrcode";

interface QRCodeDisplayProps {
  joinCode: string;
  className?: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  joinCode,
  className = "",
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const joinUrl = `${window.location.origin}/join/${joinCode}`;
        const qrCodeDataUrl = await QRCode.toDataURL(joinUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });
        setQrCodeUrl(qrCodeDataUrl);
      } catch (error) {
        console.error("Error generating QR code:", error);
      }
    };

    if (joinCode) {
      generateQRCode();
    }
  }, [joinCode]);

  if (!qrCodeUrl) {
    return <div className="w-48 h-48 bg-gray-200 animate-pulse rounded"></div>;
  }

  return (
    <div className={`text-center ${className}`}>
      <img
        src={qrCodeUrl}
        alt={`QR code for join code ${joinCode}`}
        className="mx-auto border rounded-lg"
      />
      <p className="text-xs text-gray-500 mt-2">
        Scan med telefon for at deltage
      </p>
    </div>
  );
};

export default QRCodeDisplay;
