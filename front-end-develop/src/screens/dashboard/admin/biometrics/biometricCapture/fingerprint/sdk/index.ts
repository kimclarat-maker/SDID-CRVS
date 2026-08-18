import axios from "axios";

export class FingerprintSDK {
  sessionId: string | null;
  url: string;

  constructor(url: string) {
    this.sessionId = null;
    this.url = url;
  }

  handleRequest(url: string, method: string, data?: any) {
    return new Promise((resolve, reject) => {
      const options: any = {
        url,
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      };

      if (method === "POST") {
        options.data = data;
      }

      if (method === "GET") {
        options.params = data;
      }

      axios(options)
        .then((response) => response)
        .then((data) => resolve(data))
        .catch((error) => reject(error));
    });
  }

  status() {
    return this.handleRequest(`${this.url}/STATUS/QUERY/JSON`, "POST", {});
  }

  environment() {
    return this.handleRequest(`${this.url}/environment/query/json`, "GET");
  }

  registerWorkflow(workflow: string) {
    return this.handleRequest(
      `${this.url}/WORKFLOW/REGISTER/JSON`,
      "POST",
      workflow
    );
  }

  getRegisterredWorkflow() {
    return this.handleRequest(`${this.url}/WORKFLOW/QUERY/JSON`, "GET");
  }

  startCollection = async (workflowName: string) => {
    const response: any = await this.handleRequest(
      `${this.url}/COLLECTION/START/JSON`,
      "POST",
      {
        WorkflowName: workflowName,
      }
    );

    if (response && response?.data?.SessionId) {
      this.sessionId = response.data.SessionId;
    }
    return response;
  };

  preview(sessionId: string, timeOutSec: number) {
    if (sessionId) {
      this.sessionId = sessionId;
    }
    return this.handleRequest(
      `${this.url}/preview/query/json?${this.sessionId}`,
      "POST",
      { TimeOutSec: timeOutSec }
    );
  }

  feedback(userResponse: string) {
    return this.handleRequest(
      `${this.url}/COLLECTION/INTERACT/JSON?${this.sessionId}`,
      "POST",
      {
        UserResponse: userResponse,
      }
    );
  }

  sequenceCheck() {
    return this.handleRequest(
      `${this.url}/collection/query/json?${this.sessionId}`,
      "GET"
    );
  }

  forceCapture() {
    return this.handleRequest(
      `${this.url}/collection/force/json?${this.sessionId}`,
      "GET"
    );
  }

  fullPreview() {
    return this.handleRequest(
      `${this.url}/collection/person/json?${this.sessionId}`,
      "GET"
    );
  }

  reset() {
    return this.handleRequest(`${this.url}/collection/reset/json`, "GET");
  }

  stop() {
    return this.handleRequest(`${this.url}/collection/stop/json`, "GET");
  }
}
