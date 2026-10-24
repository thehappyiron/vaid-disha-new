export interface SendVerificationResult {
  id?: string;
  email: string;
}

export interface VerifyOtpResult {
  email: string;
  verified: boolean;
}

export interface ActivityEmailResult {
  id?: string;
  event: string;
  email: string;
}

export function sendVerificationOtp(args: { email: string; patientName?: string }): Promise<SendVerificationResult>;
export function verifyOtp(args: { email: string; otp: string }): VerifyOtpResult;
export function sendActivityEmail(args: {
  event: string;
  to: string;
  vars?: Record<string, string | number | undefined>;
}): Promise<ActivityEmailResult>;
