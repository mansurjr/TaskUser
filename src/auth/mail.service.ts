import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import { User } from "@prisma/client";

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>("SMTP_HOST")!,
      port: Number(this.configService.get<string>("SMTP_PORT")),
      secure: false,
      auth: {
        user: this.configService.get<string>("SMTP_USER")!,
        pass: this.configService.get<string>("SMTP_PASS")!,
      },
    });
  }

  async sendMail(user: User): Promise<void> {
    const activationLink = `${this.configService.get<string>("APP_URL")}/auth/activate/${user.activation_link}`;
    const mailOptions = {
      from: this.configService.get<string>("SMTP_FROM"),
      to: user.email,
      subject: "Account Activation",
      html: `
        <h1>Welcome, ${user.full_name}!</h1>
        <p>Please activate your account by clicking the link below:</p>
        <a href="${activationLink}">Activate Account</a>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Failed to send email:", error);
      throw new ServiceUnavailableException("Failed to send email");
    }
  }
  async sendResetMail(user: User): Promise<void> {
    const reset_link = user.reset_link;
    const mailOptions = {
      from: this.configService.get<string>("SMTP_FROM"),
      to: user.email,
      subject: "Account Reset  code ",
      html: `
        <h1>Reset password</h1>
        <p>Please click on the link to reset your password:</p>
        <h2>${reset_link}</h2>
        <h4>Get this code and confirm your new password</h4>
        <h1>If you did not request a password reset, please ignore this email</h1>
      `,
    };
    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Failed to send email:", error);
      throw new ServiceUnavailableException("Failed to send email");
    }
  }
}
