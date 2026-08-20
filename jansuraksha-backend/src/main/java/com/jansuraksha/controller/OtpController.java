package com.jansuraksha.controller;

import com.jansuraksha.service.OtpService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/otp")
@CrossOrigin(origins = "*")
public class OtpController {

    private final OtpService otpService;

    public OtpController(OtpService otpService) {
        this.otpService = otpService;
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody OtpRequest request) {

        Map<String, Object> response = new HashMap<>();

        try {

            if (request.getPhone() == null || request.getPhone().isBlank()) {
                response.put("success", false);
                response.put("message", "Phone number is required");
                return ResponseEntity.badRequest().body(response);
            }

            otpService.sendOtp(request.getPhone());

            response.put("success", true);
            response.put("message", "OTP sent successfully");

            return ResponseEntity.ok(response);

        } catch (Exception e) {

            response.put("success", false);
            response.put("message", e.getMessage());

            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(
            @RequestBody VerifyOtpRequest request) {

        Map<String, Object> response = new HashMap<>();

        try {

            if (request.getPhone() == null || request.getPhone().isBlank()) {
                response.put("success", false);
                response.put("message", "Phone number is required");
                return ResponseEntity.badRequest().body(response);
            }

            if (request.getOtp() == null || request.getOtp().isBlank()) {
                response.put("success", false);
                response.put("message", "OTP is required");
                return ResponseEntity.badRequest().body(response);
            }

            boolean verified = otpService.verifyOtp(
                    request.getPhone(),
                    request.getOtp()
            );

            if (verified) {
                response.put("success", true);
                response.put("message", "OTP verified successfully");
                return ResponseEntity.ok(response);
            }

            response.put("success", false);
            response.put("message", "Invalid or expired OTP");

            return ResponseEntity.badRequest().body(response);

        } catch (Exception e) {

            response.put("success", false);
            response.put("message", e.getMessage());

            return ResponseEntity.badRequest().body(response);
        }
    }

    public static class OtpRequest {

        private String phone;

        public OtpRequest() {
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }
    }

    public static class VerifyOtpRequest {

        private String phone;
        private String otp;

        public VerifyOtpRequest() {
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

        public String getOtp() {
            return otp;
        }

        public void setOtp(String otp) {
            this.otp = otp;
        }
    }
}

