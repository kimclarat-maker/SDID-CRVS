import React, { useEffect, useRef } from 'react';

interface BoundingBoxProps {
  imageSrc: string;
  coordinates: number[][][];
}

const BoundingBox: React.FC<BoundingBoxProps> = ({ imageSrc, coordinates }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawBoundingBoxes = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
      const image = new Image();
      image.src = imageSrc;
      image.onload = () => {
        ctx.drawImage(image, 0, 0); // Redraw image
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;

        coordinates.forEach(box => {
          ctx.beginPath();
          ctx.moveTo(box[0][0], box[0][1]);
          box.forEach(([x, y]) => ctx.lineTo(x, y));
          ctx.closePath();
          ctx.stroke();
        });
      };
    };

    drawBoundingBoxes();
  }, [imageSrc, coordinates]);

  return <canvas ref={canvasRef} style={{ display: 'none' }} />;
};

export default BoundingBox;
