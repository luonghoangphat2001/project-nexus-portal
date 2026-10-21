package com.nexus.portal.service;

public interface LoginAttemptService {
    void loginSucceeded(String key);
    void loginFailed(String key);
    boolean isBlocked(String key);
    int getFailedAttempts(String key);
    void resetAttempts(String key);
}
