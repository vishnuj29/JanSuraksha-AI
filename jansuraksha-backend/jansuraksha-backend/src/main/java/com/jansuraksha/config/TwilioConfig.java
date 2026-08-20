package com.jansuraksha.config;

import com.twilio.Twilio;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TwilioConfig {

    @Value("${twilio.account-sid:}")
    private String accountSid;

    @Value("${twilio.auth-token:}")
    private String authToken;

    @PostConstruct
    public void initialize() {
        if (accountSid != null && !accountSid.isBlank() && !accountSid.equals("NONE") && !accountSid.startsWith("YOUR_")
                && authToken != null && !authToken.isBlank() && !authToken.equals("NONE") && !authToken.startsWith("YOUR_")) {
            try {
                Twilio.init(accountSid, authToken);
                System.out.println("Twilio initialized successfully.");
            } catch (Exception e) {
                System.err.println("Twilio initialization warning: " + e.getMessage());
            }
        } else {
            System.out.println("Twilio credentials not configured. Running without live SMS gateway.");
        }
    }
}

