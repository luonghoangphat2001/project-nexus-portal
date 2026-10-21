package com.nexus.portal.service.impl;

import com.nexus.portal.service.LoginAttemptService;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
public class LoginAttemptServiceImpl implements LoginAttemptService {

    public static final int MAX_ATTEMPTS = 5;
    public static final long LOCK_DURATION_MS = 15 * 60 * 1000L; // 15 minutes lockout

    private static class AttemptInfo {
        int attempts;
        long lockedUntil;

        AttemptInfo(int attempts, long lockedUntil) {
            this.attempts = attempts;
            this.lockedUntil = lockedUntil;
        }
    }

    private final ConcurrentMap<String, AttemptInfo> attemptsCache = new ConcurrentHashMap<>();

    private String normalizeKey(String key) {
        return key == null ? "" : key.trim().toLowerCase();
    }

    @Override
    public void loginSucceeded(String key) {
        attemptsCache.remove(normalizeKey(key));
    }

    @Override
    public void loginFailed(String key) {
        String normalized = normalizeKey(key);
        long now = System.currentTimeMillis();

        attemptsCache.compute(normalized, (k, info) -> {
            if (info == null || (info.lockedUntil > 0 && now > info.lockedUntil)) {
                // Initial failed attempt or previous lockout has expired
                return new AttemptInfo(1, 0);
            }
            int newAttempts = info.attempts + 1;
            long lockUntil = info.lockedUntil;
            if (newAttempts >= MAX_ATTEMPTS) {
                lockUntil = now + LOCK_DURATION_MS;
            }
            return new AttemptInfo(newAttempts, lockUntil);
        });
    }

    @Override
    public boolean isBlocked(String key) {
        String normalized = normalizeKey(key);
        AttemptInfo info = attemptsCache.get(normalized);
        if (info == null) {
            return false;
        }
        long now = System.currentTimeMillis();
        if (info.lockedUntil > 0) {
            if (now < info.lockedUntil) {
                return true;
            } else {
                // Lockout period has elapsed, clean up
                attemptsCache.remove(normalized);
                return false;
            }
        }
        return false;
    }

    @Override
    public int getFailedAttempts(String key) {
        AttemptInfo info = attemptsCache.get(normalizeKey(key));
        return info != null ? info.attempts : 0;
    }

    @Override
    public void resetAttempts(String key) {
        attemptsCache.remove(normalizeKey(key));
    }
}
