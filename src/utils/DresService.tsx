// src/services/dresService.ts

class DresService {
  // ✅ 1. Rename for clarity
  private dresBaseUrl = '';
  private dresSessionId = '';

  // ✅ 2. Update setConfig signature
  public setConfig(baseUrl: string, sessionId: string) {
    this.dresBaseUrl = baseUrl;
    this.dresSessionId = sessionId;
    console.log('DresService configured:', { baseUrl, sessionId });
  }

  // ✅ 3. This method now correctly and clearly returns the DRES session ID
  public getSessionId(): string {
    return this.dresSessionId;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.dresBaseUrl || !this.dresSessionId) {
      throw new Error('DresService is not configured. Call setConfig first.');
    }

    // ✅ 4. Use the explicit variable names
    const response = await fetch(`${this.dresBaseUrl}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.description || `DRES API request failed: ${response.statusText}`;
        throw new Error(errorMessage);
    }
    return response.json();
  }

  public async getEvaluationId(): Promise<string> {
    // The makeRequest call implicitly uses the configured sessionId
    const evaluations = await this.makeRequest<any[]>(`/api/v2/client/evaluation/list?session=${this.dresSessionId}`);
    const activeEval = evaluations.find((e: any) => e.status === 'ACTIVE');

    if (!activeEval) {
      throw new Error('No active DRES evaluation found');
    }
    return activeEval.id;
  }
}

export const dresService = new DresService();