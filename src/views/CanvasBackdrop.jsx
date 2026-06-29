import { useEffect, useRef } from 'react';

export function CanvasBackdrop() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    let frame = 0;
    let animationId;

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * ratio;
      canvas.height = window.innerHeight * ratio;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      context.clearRect(0, 0, width, height);
      context.fillStyle = '#f5f1e8';
      context.fillRect(0, 0, width, height);

      const spacing = width < 700 ? 58 : 76;
      const offset = (frame * 0.12) % spacing;
      context.lineWidth = 1;

      for (let y = -spacing; y < height + spacing; y += spacing) {
        for (let x = -spacing; x < width + spacing; x += spacing) {
          const px = x + Math.sin((y + frame) * 0.01) * 10 + offset;
          const py = y + Math.cos((x + frame) * 0.01) * 8;
          context.fillStyle = 'rgba(49, 92, 69, 0.10)';
          context.beginPath();
          context.arc(px, py, 1.35, 0, Math.PI * 2);
          context.fill();

          context.strokeStyle = 'rgba(49, 92, 69, 0.045)';
          context.beginPath();
          context.moveTo(px, py);
          context.lineTo(px + spacing * 0.72, py + Math.sin(frame * 0.01 + x) * 6);
          context.stroke();
        }
      }

      context.fillStyle = 'rgba(245, 184, 65, 0.10)';
      context.fillRect(0, 0, width, 4);
      frame += 1;
      animationId = window.requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="canvas-backdrop" aria-hidden="true" />;
}
