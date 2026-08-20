package com.jansuraksha;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan("com.jansuraksha.entity")
@EnableJpaRepositories("com.jansuraksha.repository")
public class JanSurakshaApplication {

    public static void main(String[] args) {
        SpringApplication.run(JanSurakshaApplication.class, args);
    }
}

