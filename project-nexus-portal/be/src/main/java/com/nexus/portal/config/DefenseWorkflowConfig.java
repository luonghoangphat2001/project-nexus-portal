package com.nexus.portal.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.time.Clock;
import java.time.ZoneId;

@Configuration
public class DefenseWorkflowConfig {
    @Bean
    public Clock defenseClock() {
        return Clock.system(ZoneId.of("Asia/Ho_Chi_Minh"));
    }
}
