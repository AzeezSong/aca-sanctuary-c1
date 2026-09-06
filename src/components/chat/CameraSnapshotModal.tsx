import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, RefreshCw, Send, Check, AlertCircle } from 'lucide-react';

interface CameraSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
}

export const CameraSnapshotModal: React.FC<CameraSnapshotModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera access was denied. Please allow camera permissions in your browser.'
          : 'Unable to access camera device. Please check hardware connection.'
      );
    }
  };

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, facingMode]);

  // Clean up when closing
  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCapturedImage(null);
    setCameraError(null);
    onClose();
  };

  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedImage(dataUrl);

        // Stop video stream after capture
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
          setStream(null);
        }
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleSend = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      handleClose();
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        id="camera-snapshot-modal"
        className="w-full max-w-lg bg-[#1b1c1c] text-white rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#d9e6dc]" />
            <h3 className="text-sm font-bold text-white">Camera Snapshot</h3>
          </div>
          <button
            id="close-camera-modal-btn"
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Canvas */}
        <div className="relative aspect-4/3 w-full bg-black flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center text-red-300 max-w-xs flex flex-col items-center gap-3">
              <AlertCircle className="w-10 h-10 text-red-400" />
              <p className="text-xs">{cameraError}</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl mt-2 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Try Again
              </button>
            </div>
          ) : capturedImage ? (
            <img
              src={capturedImage}
              alt="Snapshot"
              className="w-full h-full object-contain"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 pointer-events-none border-2 border-white/20 m-4 rounded-xl flex items-center justify-center">
                <div className="w-12 h-12 border-t-2 border-l-2 border-white/40 absolute top-2 left-2" />
                <div className="w-12 h-12 border-t-2 border-r-2 border-white/40 absolute top-2 right-2" />
                <div className="w-12 h-12 border-b-2 border-l-2 border-white/40 absolute bottom-2 left-2" />
                <div className="w-12 h-12 border-b-2 border-r-2 border-white/40 absolute bottom-2 right-2" />
              </div>
            </>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Bottom Controls */}
        <div className="p-4 bg-black/60 flex items-center justify-between">
          {!capturedImage ? (
            <>
              <button
                onClick={toggleFacingMode}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Switch Camera"
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              <button
                id="take-snapshot-btn"
                onClick={handleTakePhoto}
                disabled={Boolean(cameraError)}
                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-white/20 hover:bg-white/40 active:scale-95 transition-all cursor-pointer disabled:opacity-30"
              >
                <div className="w-12 h-12 rounded-full bg-white" />
              </button>

              <div className="w-11" />
            </>
          ) : (
            <div className="w-full flex items-center justify-between gap-3">
              <button
                id="retake-snapshot-btn"
                onClick={handleRetake}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retake
              </button>

              <button
                id="send-snapshot-btn"
                onClick={handleSend}
                className="px-5 py-2.5 rounded-xl bg-[#56615a] hover:bg-[#434d46] text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-lg"
              >
                <Send className="w-3.5 h-3.5" /> Send Photo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
