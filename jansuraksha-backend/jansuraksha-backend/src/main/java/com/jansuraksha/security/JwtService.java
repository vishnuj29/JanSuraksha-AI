package com.jansuraksha.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey secretKey =
            Keys.secretKeyFor(SignatureAlgorithm.HS256);

    private final long expirationTime = 86400000L;

    /*
     * Generate JWT token
     */
    public String generateToken(String email) {

        return Jwts.builder()
                .subject(email)
                .issuedAt(new Date())
                .expiration(
                        new Date(System.currentTimeMillis() + expirationTime)
                )
                .signWith(secretKey)
                .compact();
    }

    /*
     * Extract email from JWT token
     */
    public String extractEmail(String token) {

        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    /*
     * Validate token without email parameter.
     * This matches your existing JwtAuthenticationFilter.
     */
    public boolean isTokenValid(String token) {

        try {

            Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token);

            return true;

        } catch (Exception e) {

            return false;
        }
    }

    /*
     * Validate token against a specific email.
     */
    public boolean isTokenValid(String token, String email) {

        try {

            String extractedEmail = extractEmail(token);

            return extractedEmail != null
                    && extractedEmail.equals(email)
                    && isTokenValid(token);

        } catch (Exception e) {

            return false;
        }
    }
}

