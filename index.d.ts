export interface ISSMLCheckOptions {
  platform?: "google" | "amazon" | "all";
  validateAudioFiles?: boolean;
}

export interface ISSMLCheckError {
  type: string;
  tag?: string;
  attribute?: string;
  value?: string;
  detail?: string;
}

export interface ISSMLCheckVerifyResponse {
  errors?: ISSMLCheckError[];
  ssml?: string;
}

export function check(
  ssml: string,
  options?: ISSMLCheckOptions
): Promise<ISSMLCheckError[] | undefined>;

export function verifyAndFix(
  ssml: string,
  options?: ISSMLCheckOptions
): Promise<ISSMLCheckVerifyResponse>;
