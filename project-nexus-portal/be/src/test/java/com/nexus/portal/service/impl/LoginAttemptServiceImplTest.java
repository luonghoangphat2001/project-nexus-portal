package com.nexus.portal.service.impl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class LoginAttemptServiceImplTest {

    private LoginAttemptServiceImpl loginAttemptService;

    @BeforeEach
    void setUp() {
        loginAttemptService = new LoginAttemptServiceImpl();
    }

    @Test
    void shouldNotBlockInitially() {
        assertFalse(loginAttemptService.isBlocked("principal"));
        assertEquals(0, loginAttemptService.getFailedAttempts("principal"));
    }

    @Test
    void shouldNotBlockBeforeFiveAttempts() {
        for (int i = 1; i <= 4; i++) {
            loginAttemptService.loginFailed("principal");
            assertFalse(loginAttemptService.isBlocked("principal"), "Should not be blocked at attempt " + i);
            assertEquals(i, loginAttemptService.getFailedAttempts("principal"));
        }
    }

    @Test
    void shouldBlockAfterFiveFailedAttempts() {
        for (int i = 1; i <= 5; i++) {
            loginAttemptService.loginFailed("principal");
        }
        assertTrue(loginAttemptService.isBlocked("principal"), "Should be blocked after 5 failed attempts");
    }

    @Test
    void shouldResetAttemptsOnLoginSucceeded() {
        for (int i = 1; i <= 3; i++) {
            loginAttemptService.loginFailed("principal");
        }
        assertEquals(3, loginAttemptService.getFailedAttempts("principal"));

        loginAttemptService.loginSucceeded("principal");
        assertEquals(0, loginAttemptService.getFailedAttempts("principal"));
        assertFalse(loginAttemptService.isBlocked("principal"));
    }

    @Test
    void shouldBeCaseInsensitive() {
        for (int i = 1; i <= 5; i++) {
            loginAttemptService.loginFailed("Principal");
        }
        assertTrue(loginAttemptService.isBlocked("principal"));
        assertTrue(loginAttemptService.isBlocked("PRINCIPAL"));
    }
}
