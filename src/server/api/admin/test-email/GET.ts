import type { Request, Response } from 'express';
import { emailService } from '../../../services/emailService';

export default async function handler(req: Request, res: Response) {
  try {
    const toEmail = (req.query.to as string) || process.env.SMTP_USER || 'test@example.com';
    const testOtp = Math.floor(100000 + Math.random() * 900000).toString();

    const smtpUser = process.env.SMTP_USER || 'NOT_SET';
    const hasSmtpPass = !!process.env.SMTP_PASS;
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';

    console.log(`[TEST EMAIL] Initiating test OTP email dispatch to: ${toEmail}`);

    const result = await emailService.sendRegistrationOtpEmail(
      toEmail,
      testOtp,
      'JanSuraksha Diagnostics'
    );

    return res.status(result.success ? 200 : 500).json({
      success: result.success,
      diagnostic: {
        targetEmail: toEmail,
        configuredSmtpUser: smtpUser.replace(/^(.)(.*)(@.*)$/, (_, f, m, d) => f + '***' + d),
        hasSmtpPass,
        smtpHost,
        smtpResult: result,
      },
      message: result.success
        ? `Test email successfully dispatched to ${toEmail}! Check your inbox/spam.`
        : `SMTP dispatch failed: ${result.error || 'Unknown error'}`,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Diagnostic error';
    return res.status(500).json({
      success: false,
      error: msg,
    });
  }
}
