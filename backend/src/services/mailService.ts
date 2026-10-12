class MailService {
  private brevoApiKey: string | null = null;
  private senderEmail: string = "vinaayak.gaikwad@gmail.com";
  private senderName: string = "AI Document Editor";

  constructor() {
    const key = process.env.BREVO_API_KEY;
    if (key && key.startsWith("xkeysib-")) {
      this.brevoApiKey = key;
      this.senderEmail = process.env.BREVO_SENDER_EMAIL || "vinaayak.gaikwad@gmail.com";
      console.log(`[MailService] Configured with Brevo Transactional Email API (Sender: ${this.senderEmail}).`);
    } else {
      console.log("[MailService] No valid BREVO_API_KEY found. Local dev console logging active.");
    }
  }

  async sendPasswordResetOTP(toEmail: string, otp: string, userName?: string): Promise<boolean> {
    // Always print to console as well for instant dev feedback
    console.log(`\n======================================================`);
    console.log(`[SECURITY OTP DISPATCH] To: ${toEmail}`);
    console.log(`ONE-TIME PASSWORD (OTP): [ ${otp} ]`);
    console.log(`Valid for 10 minutes`);
    console.log(`======================================================\n`);

    if (!this.brevoApiKey) {
      return true;
    }

    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": this.brevoApiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: this.senderName, email: this.senderEmail },
          to: [{ email: toEmail, name: userName || "Author" }],
          subject: "Your Password Reset OTP - AI Document Editor",
          htmlContent: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e7e5e4; border-radius: 12px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h2 style="color: #1c1917; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">Password Reset Code</h2>
                <p style="color: #78716c; font-size: 13px; margin-top: 6px;">AI Document Editor Security</p>
              </div>
              <p style="color: #292524; font-size: 14px; line-height: 1.6;">Hello <strong>${userName || "Author"}</strong>,</p>
              <p style="color: #57534e; font-size: 14px; line-height: 1.6;">Use the one-time verification code below to reset your password:</p>
              <div style="background-color: #f5f5f4; border: 1px solid #e7e5e4; padding: 20px; border-radius: 8px; text-align: center; margin: 24px 0;">
                <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1c1917; font-family: monospace;">${otp}</span>
              </div>
              <p style="color: #a8a29e; font-size: 12px; line-height: 1.5; margin: 0;">This code is valid for <strong>10 minutes</strong>. If you did not request this code, your account remains completely safe.</p>
            </div>
          `,
        }),
      });

      const data: any = await response.json();

      if (!response.ok) {
        console.warn("[MailService Brevo Warning]:", data?.message || JSON.stringify(data));
        return false;
      }

      console.log(`[MailService] Brevo OTP email delivered successfully! Message ID: ${data?.messageId}`);
      return true;
    } catch (error: any) {
      console.error("[MailService Brevo Error]:", error.message);
      return false;
    }
  }
}

export const mailService = new MailService();
