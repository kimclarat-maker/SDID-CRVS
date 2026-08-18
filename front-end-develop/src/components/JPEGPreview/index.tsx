import { OpenJPEG } from "openjpeg";
import { useState, useEffect } from "react";

interface JP2ViewerProps {
  jp2Data: string | ArrayBuffer | null;
}

const JP2Viewer = ({ jp2Data }: JP2ViewerProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to convert base64 string to ArrayBuffer
  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    console.log("🔧 Converting base64 to ArrayBuffer");
    console.log("Base64 length:", base64.length);
    console.log("Base64 starts with:", base64.substring(0, 50));

    // Remove data URL prefix if present
    const base64Clean = base64.replace(/^data:[^;]*;base64,/, "");
    console.log("Cleaned base64 length:", base64Clean.length);

    try {
      const binaryString = atob(base64Clean);
      console.log("Binary string length:", binaryString.length);

      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      console.log("ArrayBuffer created with size:", bytes.buffer.byteLength);
      return bytes.buffer;
    } catch (err) {
      console.error("❌ Base64 conversion error:", err);
      throw new Error(`Base64 conversion failed: ${err}`);
    }
  };

  // Function to normalize input data to ArrayBuffer
  const normalizeToArrayBuffer = (
    data: string | ArrayBuffer | null
  ): ArrayBuffer | null => {
    console.log("🔄 Normalizing data to ArrayBuffer");
    console.log("Input data type:", typeof data);

    if (!data) {
      console.log("❌ No data provided");
      return null;
    }

    if (typeof data === "string") {
      console.log("📝 Input is string, converting...");
      if (data.trim().length === 0) {
        console.log("❌ Empty string provided");
        return null;
      }
      return base64ToArrayBuffer(data);
    }

    console.log("📦 Input is ArrayBuffer, size:", data.byteLength);
    if (data.byteLength === 0) {
      console.log("❌ Empty ArrayBuffer provided");
      return null;
    }

    return data;
  };

  useEffect(() => {
    console.log("🎬 useEffect triggered");
    console.log("jp2Data received:", jp2Data ? "Has data" : "Null/undefined");

    const decodeJP2 = async (arrayBuffer: ArrayBuffer) => {
      setLoading(true);
      setImageUrl(null);
      setError(null);

      try {
        console.log("🚀 Starting JP2 decoding process");
        console.log("ArrayBuffer size:", arrayBuffer.byteLength);

        // Check if OpenJPEG is available
        if (typeof OpenJPEG === "undefined") {
          throw new Error("OpenJPEG library not found");
        }

        console.log("📚 Creating OpenJPEG decoder instance");
        const decoder = new OpenJPEG();
        console.log("Decoder instance created:", decoder);

        console.log("⚙️ Initializing decoder...");
        await decoder.initialize();
        console.log("✅ Decoder initialized successfully");

        console.log("🔍 Decoding JP2 data...");
        const imageData = decoder.decode(arrayBuffer);
        console.log("✅ Decoding completed");
        console.log(
          "Image dimensions:",
          imageData.width,
          "x",
          imageData.height
        );
        console.log("Image data length:", imageData.data.length);

        if (!imageData.width || !imageData.height) {
          throw new Error("Invalid image dimensions received");
        }

        if (!imageData.data || imageData.data.length === 0) {
          throw new Error("No image data received");
        }

        console.log("🎨 Creating canvas...");
        const canvas = document.createElement("canvas");
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        console.log(
          "Canvas created with dimensions:",
          canvas.width,
          "x",
          canvas.height
        );

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Could not get 2D context from canvas");
        }
        console.log("✅ Canvas context obtained");

        console.log("🖼️ Creating ImageData object...");
        const imageDataObj = ctx.createImageData(
          imageData.width,
          imageData.height
        );
        console.log("ImageData object created");

        console.log("📥 Setting image data...");
        imageDataObj.data.set(imageData.data);
        console.log("✅ Image data set");

        console.log("🖌️ Putting image data to canvas...");
        ctx.putImageData(imageDataObj, 0, 0);
        console.log("✅ Image data rendered to canvas");

        console.log("🔗 Converting to data URL...");
        const dataUrl = canvas.toDataURL("image/png");
        console.log("✅ Data URL created, length:", dataUrl.length);
        console.log("Data URL starts with:", dataUrl.substring(0, 50));

        setImageUrl(dataUrl);
        console.log("🎉 Image URL set successfully!");
      } catch (error) {
        console.error("❌ JP2 decoding failed:", error);
        setError(
          error instanceof Error ? error.message : "Unknown decoding error"
        );
      } finally {
        setLoading(false);
        console.log("🏁 Decoding process completed");
      }
    };

    const arrayBuffer = normalizeToArrayBuffer(jp2Data);
    console.log("Normalized ArrayBuffer:", arrayBuffer ? "Valid" : "Invalid");

    if (arrayBuffer) {
      decodeJP2(arrayBuffer);
    } else {
      console.log("❌ No valid ArrayBuffer created");
      setImageUrl(null);
      setError("Invalid or empty JP2 data");
      setLoading(false);
    }
  }, [jp2Data]);

  console.log("🔄 Component render - imageUrl:", imageUrl);
  console.log("🔄 Component render - loading:", loading);
  console.log("🔄 Component render - error:", error);

  if (loading) return <div>Loading JP2 image...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!imageUrl) return <div>No image to display</div>;

  return <img src={imageUrl} alt="Decoded JP2" style={{ maxWidth: "100%" }} />;
};

export default JP2Viewer;
