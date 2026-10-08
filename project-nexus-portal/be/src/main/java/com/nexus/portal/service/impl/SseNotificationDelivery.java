package com.nexus.portal.service.impl;

import com.nexus.portal.service.NotificationDelivery;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SseNotificationDelivery implements NotificationDelivery {
    private final ConcurrentHashMap<SseEmitter, Long> clients = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long userId) {
        // Reconnect periodically to revalidate JWT and recover missed changes.
        SseEmitter emitter = newEmitter();
        clients.put(emitter, userId);
        emitter.onCompletion(() -> remove(emitter));
        emitter.onTimeout(() -> {
            synchronized (emitter) {
                if (clients.remove(emitter) != null) emitter.complete();
            }
        });
        emitter.onError(error -> remove(emitter));
        send(emitter, "ready");
        return emitter;
    }

    SseEmitter newEmitter() { return new SseEmitter(60_000L); }

    @Override
    public void changed(Long userId) {
        clients.forEach((emitter, recipient) -> {
            if (userId == null || userId.equals(recipient)) send(emitter, "changed");
        });
    }

    private void send(SseEmitter emitter, String event) {
        synchronized (emitter) {
            if (!clients.containsKey(emitter)) return;
            try {
                // Only an invalidation signal: content remains behind the authorized REST API.
                emitter.send(SseEmitter.event().name(event).data("refresh"));
            } catch (IOException | IllegalStateException error) {
                // The container owns error completion after a failed write.
                // Calling completeWithError here can dispatch an already failed AsyncContext.
                clients.remove(emitter);
            }
        }
    }

    private void remove(SseEmitter emitter) {
        synchronized (emitter) { clients.remove(emitter); }
    }
}
