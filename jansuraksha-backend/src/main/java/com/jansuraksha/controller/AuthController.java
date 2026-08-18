package com.jansuraksha.controller;

import com.jansuraksha.entity.User;
import com.jansuraksha.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {

        try {

            User savedUser = authService.register(user);

            Map<String, Object> response = new HashMap<>();

            response.put("success", true);
            response.put("message", "Registration successful");
            response.put("userId", savedUser.getId());
            response.put("name", savedUser.getName());
            response.put("email", savedUser.getEmail());
            response.put("phone", savedUser.getPhone());

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {

            Map<String, Object> response = new HashMap<>();

            response.put("success", false);
            response.put("message", e.getMessage());

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(response);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request) {

        try {

            User user = authService.login(
                    request.getEmail(),
                    request.getPassword()
            );

            Map<String, Object> response = new HashMap<>();

            response.put("success", true);
            response.put("message", "Login successful");
            response.put("userId", user.getId());
            response.put("name", user.getName());
            response.put("email", user.getEmail());
            response.put("phone", user.getPhone());

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {

            Map<String, Object> response = new HashMap<>();

            response.put("success", false);
            response.put("message", e.getMessage());

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(response);
        }
    }

    public static class LoginRequest {

        private String email;
        private String password;

        public LoginRequest() {
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }
}

