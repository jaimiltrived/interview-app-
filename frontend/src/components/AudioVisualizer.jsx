import React, { useRef, useEffect, useState } from 'react';

export default function AudioVisualizer({ audioStream, isListening, minimal = false }) {
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
        analyser.fftSize = 64; // smaller FFT size for clean discrete bars
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

          // Draw green bars (similar to screenshot 2)
          const barWidth = (width / dataArray.length) * 1.8;
          let barHeight;
          let x = 0;

          for (let i = 0; i < dataArray.length; i++) {
            barHeight = (dataArray[i] / 255) * height * 0.95;

            // Green/teal gradient matching prepflow screenshot
            const grad = ctx.createLinearGradient(0, height - barHeight, 0, height);
            grad.addColorStop(0, '#10b981'); // Emerald
            grad.addColorStop(1, '#059669'); // Dark green

            ctx.fillStyle = grad;

            // Draw rounded bar
            ctx.beginPath();
            const radius = 2;
            ctx.moveTo(x + radius, height - barHeight);
            ctx.lineTo(x + barWidth - radius - 1, height - barHeight);
            ctx.quadraticCurveTo(x + barWidth - 1, height - barHeight, x + barWidth - 1, height - barHeight + radius);
            ctx.lineTo(x + barWidth - 1, height);
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

        // Draw standard passive visualizer bars
        const barsCount = 10;
        const barWidth = width / barsCount;
        ctx.fillStyle = isListening ? '#10b981' : '#cbd5e1';

        for (let i = 0; i < barsCount; i++) {
          const time = phase + i * 0.5;
          const amp = isListening ? (15 + Math.sin(time) * 10) : 4;
          const barHeight = (amp / 30) * height;
          
          ctx.beginPath();
          ctx.arc(i * barWidth + barWidth / 2, height - barHeight, barWidth / 3, 0, Math.PI, true);
          ctx.rect(i * barWidth + barWidth / 2 - barWidth / 3, height - barHeight, barWidth / 1.5, barHeight);
          ctx.closePath();
          ctx.fill();
        }

        phase += 0.15;
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

  if (minimal) {
    return (
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }}></canvas>
    );
  }

  return (
    <div className="glass-card visualizer-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px' }}>
      <div className="flex-between" style={{ marginBottom: '8px' }}>
        <div className="stat-label" style={{ fontWeight: '700', fontSize: '12px' }}>Audio Input Waveform</div>
        <span className="text-success" style={{ fontSize: '12px', fontWeight: '800' }}>
          {dbLevel}dB
        </span>
      </div>
      <canvas ref={canvasRef} className="visualizer-canvas" style={{ width: '100%', height: '40px' }}></canvas>
    </div>
  );
}
