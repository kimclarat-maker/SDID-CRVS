const API = "https://localhost:11401";
const API_KEY =
  "723259e0dee63366e057c8b9ee6369e7062d832c9c4bbf87452cf2fbb4120a83";

export interface TokenImageResponse {
  tokenImageBase64: string;
  bBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  icaoWarnings: {
    passed: string[];
    failed: string[];
  };
}

export async function generateTokenImage(
  imageBase64: string
): Promise<TokenImageResponse> {
  try {
    // Remove the data URL prefix if present and get pure base64
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    // Convert base64 to blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "image/jpeg" });

    // Create form data
    const formData = new FormData();
    formData.append("file", blob, "capture.jpg");

    // Make API request
    const apiResponse = await fetch(`${API}/token-image`, {
      method: "POST",
      headers: {
        "X-Api-Key": API_KEY,
      },
      body: formData,
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      throw new Error(
        `HTTP error! status: ${apiResponse.status}, message: ${errorText}`
      );
    }

    return await apiResponse.json();
  } catch (error) {
    console.error("Error generating token image:", error);
    throw error;
  }
}
