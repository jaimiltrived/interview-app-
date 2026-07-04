import React, { useRef, useEffect, useState } from 'react';

export default function AudioVisualizer({ audioStream, isListening }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const [dbLevel, setDbLevel] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let phase = 0;

    // --- CASE A: Live Mic Stream ---
    if (audioStream) {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContextClass();
        audioCtxRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(audioStream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        source.connect(analyser);
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const drawLive = () => {
          const width = canvas.width = canvas.offsetWidth;
          const height = canvas.height = canvas.offsetHeight;

          analyser.getByteFrequencyData(dataArray);

          // Calculate average decibels
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avgVolume = Math.round(sum / dataArray.length);
          setDbLevel(avgVolume);

          ctx.clearRect(0, 0, width, height);

          // Draw bars
          const barWidth = (width / dataArray.length) * 1.5;
          let barHeight;
          let x = 0;

          for (let i = 0; i < dataArray.length; i++) {
            barHeight = (dataArray[i] / 255) * height * 0.95;

            const grad = ctx.createLinearGradient(0, height - barHeight, 0, height);
            grad.addColorStop(0, '#06b6d4'); // Cyan
            grad.addColorStop(1, '#8b5cf6'); // Purple

            ctx.fillStyle = grad;
            ctx.shadowBlur = 4;
            ctx.shadowColor = 'rgba(6, 182, 212, 0.3)';

            // Draw rounded bar
            ctx.beginPath();
            const radius = 3;
            ctx.moveTo(x + radius, height - barHeight);
            ctx.lineTo(x + barWidth - radius - 2, height - barHeight);
            ctx.quadraticCurveTo(x + barWidth - 2, height - barHeight, x + barWidth - 2, height - barHeight + radius);
            ctx.lineTo(x + barWidth - 2, height);
            ctx.lineTo(x, height);
            ctx.lineTo(x, height - barHeight + radius);
            ctx.quadraticCurveTo(x, height - barHeight, x + radius, height - barHeight);
            ctx.closePath();
            ctx.fill();

            x += barWidth;
          }

          animationRef.current = requestAnimationFrame(drawLive);
        };

        drawLive();
      } catch (err) {
        console.error('Failed to setup AudioContext:', err);
      }
    } 
    // --- CASE B: Passive Simulated wave ---
    else {
      const drawSimulated = () => {
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = canvas.offsetHeight;

        ctx.clearRect(0, 0, width, height);
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)'; // Purple transparent
        ctx.lineWidth = 2;

        const amp = isListening ? 16 : 2.5;
        for (let x = 0; x < width; x++) {
          const y = height / 2 + Math.sin(x * 0.05 + phase) * amp;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        phase += 0.12;
        setDbLevel(isListening ? Math.round(15 + Math.random() * 15) : 0);
        animationRef.current = requestAnimationFrame(drawSimulated);
      };

      drawSimulated();
    }

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, [audioStream, isListening]);

  return (
    <div className="glass-card visualizer-card">
      <div className="flex-between">
        <div className="stat-label">Audio Input Waveform</div>
        <span className="text-success" style={{ fontSize: '12px', fontWeight: '600' }}>
          {dbLevel}dB
        </span>
      </div>
      <canvas ref={canvasRef} className="visualizer-canvas" style={{ width: '100%', height: '50px' }}></canvas>
    </div>
  );
}
