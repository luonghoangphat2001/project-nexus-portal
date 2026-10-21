package com.nexus.portal;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableJpaAuditing
@EnableAsync
public class NexusPortalApplication {

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        return new ObjectMapper().findAndRegisterModules();
    }

    public static void main(String[] args) {
        loadDotenv();
        SpringApplication.run(NexusPortalApplication.class, args);
    }

    private static void loadDotenv() {
        java.nio.file.Path[] potentialPaths = new java.nio.file.Path[] {
            java.nio.file.Paths.get(".env"),
            java.nio.file.Paths.get("project-nexus-portal/be/.env"),
            java.nio.file.Paths.get("be/.env")
        };
        for (java.nio.file.Path path : potentialPaths) {
            if (java.nio.file.Files.exists(path)) {
                try {
                    java.util.List<String> lines = java.nio.file.Files.readAllLines(path);
                    for (String line : lines) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#")) continue;
                        int idx = line.indexOf('=');
                        if (idx > 0) {
                            String key = line.substring(0, idx).trim();
                            String value = line.substring(idx + 1).trim();
                            if ((value.startsWith("\"") && value.endsWith("\"")) ||
                                (value.startsWith("'") && value.endsWith("'"))) {
                                value = value.substring(1, value.length() - 1);
                            }
                            if (System.getProperty(key) == null && System.getenv(key) == null) {
                                System.setProperty(key, value);
                            }
                        }
                    }
                    break;
                } catch (Exception ignored) {
                }
            }
        }
    }
}
