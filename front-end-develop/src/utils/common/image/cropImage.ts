export const cropImage = (
  imageSrc: string,
  boundingBox: number[]
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      const [x, y, width, height] = boundingBox;

      // Calculate aspect ratio of the bounding box
      const aspectRatio = (width - x) / (height - y);

      // Determine maximum width and height to fit into container (180x250)
      let maxWidth = 180;
      let maxHeight = 250;

      // Calculate target width and height based on aspect ratio
      let targetWidth = maxWidth;
      let targetHeight = maxHeight;

      if (aspectRatio > 1) {
        // Landscape orientation
        targetHeight = maxWidth / aspectRatio;
      } else {
        // Portrait orientation
        targetWidth = maxHeight * aspectRatio;
      }

      // Ensure canvas size matches the target dimensions
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Calculate offsets to center the cropped image
      const offsetX = (maxWidth - targetWidth) / 2;
      const offsetY = (maxHeight - targetHeight) / 2;

      // Draw the cropped image onto the canvas
      ctx.drawImage(
        img,
        x,
        y,
        width - x,
        height - y,
        offsetX,
        offsetY,
        targetWidth,
        targetHeight
      );

      // Convert the canvas to a data URL
      const dataUrl = canvas.toDataURL("image/jpeg");

      // Check if data URL is valid
      if (dataUrl.startsWith("data:image/jpeg")) {
        resolve(dataUrl);
      } else {
        reject(new Error("Failed to generate a valid data URL"));
      }
    };

    img.onerror = (err) => {
      reject(new Error("Failed to load image"));
    };

    img.src = imageSrc;
  });
};
