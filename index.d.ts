export interface ISSMLCheckOptions {
  platform?: "google" | "amazon" | "all";
  locale?: string;
  validateAudioFiles?: boolean;
  unsupportedTags?: string[];
  getPositions?: boolean;
}

export interface ISSMLCheckSimpleError {
  type: string;
}

export interface ISSMLCheckTagError {
  type: "tag";
  tag: string;
  attribute: string;
  value: string;
}

export interface ISSMLCheckAudioError {
  type: "audio";
  value: string;
  detail: string;
}

export type ISSMLCheckError =
  | ISSMLCheckSimpleError
  | ISSMLCheckAudioError
  | ISSMLCheckTagError;

export interface ISSMLCheckVerifyResponse {
  errors?: ISSMLCheckError[];
  fixedSSML?: string;
}

export function check(
  ssml: string,
  options?: ISSMLCheckOptions
): Promise<ISSMLCheckError[] | undefined>;

export function verifyAndFix(
  ssml: string,
  options?: ISSMLCheckOptions
): Promise<ISSMLCheckVerifyResponse>;
