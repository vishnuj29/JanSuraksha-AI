package com.jansuraksha.service;

import com.twilio.rest.verify.v2.service.Verification;
import com.twilio.rest.verify.v2.service.VerificationCheck;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class OtpService {

    @Value("${twilio.verify-service-sid:}")
    private String verifyServiceSid;

    public void sendOtp(String phone) {

        try {
            Verification.creator(
                    verifyServiceSid,
                    phone,
                    "sms"
            ).create();

        } catch (Exception e) {
            throw new RuntimeException(
                    "Failed to send OTP: " + e.getMessage()
            );
        }
    }

    public boolean verifyOtp(String phone, String otp) {

        try {

            VerificationCheck check = VerificationCheck
                    .creator(verifyServiceSid)
                    .setTo(phone)
                    .setCode(otp)
                    .create();

            return "approved".equalsIgnoreCase(
                    check.getStatus()
            );

        } catch (Exception e) {
            throw new RuntimeException(
                    "Failed to verify OTP: " + e.getMessage()
            );
        }
    }
}

