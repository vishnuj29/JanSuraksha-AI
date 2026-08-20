package com.jansuraksha.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/")
    public Map<String, String> home() {

        return Map.of(
                "project", "JanSuraksha AI",
                "status", "Backend is running",
                "message", "Welcome to JanSuraksha API"
        );
    }

    @GetMapping("/api/public/health")
    public Map<String, String> health() {

        return Map.of(
                "status", "UP",
                "service", "JanSuraksha Backend"
        );
    }
}

