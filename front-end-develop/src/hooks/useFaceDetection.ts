// hooks/useFaceDetection.js
import { useState, useRef, useCallback } from "react";
import * as faceapi from "face-api.js";

export const useFaceDetection = () => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadModels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const MODEL_URL = "/models";
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      setModelsLoaded(true);
    } catch (err) {
      setError("Failed to load face detection models");
      console.error("Error loading models:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getFaceDescriptor = useCallback(
    async (
      imgElement:
        | HTMLImageElement
        | HTMLCanvasElement
        | HTMLVideoElement
        | ImageBitmap
    ): Promise<Float32Array | undefined> => {
      if (!modelsLoaded) {
        throw new Error("Face detection models not loaded");
      }

      try {
        // If an ImageBitmap is passed, draw it into a canvas because some TypeScript DOM typings
        // don't treat ImageBitmap as a valid TNetInput for face-api.js; converting to canvas
        // produces a CanvasImageSource which is accepted.
        let input:
          | HTMLImageElement
          | HTMLCanvasElement
          | HTMLVideoElement
          | ImageBitmap = imgElement;
        if (
          typeof ImageBitmap !== "undefined" &&
          imgElement instanceof ImageBitmap
        ) {
          const canvas = document.createElement("canvas");
          canvas.width = imgElement.width;
          canvas.height = imgElement.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            throw new Error(
              "Could not get canvas 2D context to convert ImageBitmap"
            );
          }
          ctx.drawImage(imgElement, 0, 0);
          input = canvas;
        }

        const detection = await faceapi
          .detectSingleFace(input as any)
          .withFaceLandmarks()
          .withFaceDescriptor();

        return detection?.descriptor;
      } catch (err) {
        console.error("Error detecting face:", err);
        throw new Error("Failed to detect face in image");
      }
    },
    [modelsLoaded]
  );

  const calculateSimilarity = useCallback(
    (descriptor1: Float32Array, descriptor2: Float32Array): number => {
      if (!descriptor1 || !descriptor2) {
        throw new Error("Both descriptors are required for comparison");
      }

      const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
      const matchProbability = Math.max(0, 1 - distance);
      return matchProbability;
    },
    []
  );

  return {
    modelsLoaded,
    loading,
    error,
    loadModels,
    getFaceDescriptor,
    calculateSimilarity,
  };
};
