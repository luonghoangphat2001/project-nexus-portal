package com.nexus.portal.service.impl;

import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.io.IOException;
import java.util.function.Consumer;
import static org.junit.jupiter.api.Assertions.*;

class SseNotificationDisconnectTest {
    @Test void failedWriteIsRemovedWithoutCompletingFailedAsyncContext() {
        TestEmitter emitter = new TestEmitter();
        SseNotificationDelivery delivery = delivery(emitter);
        delivery.subscribe(1L);
        emitter.fail = true;
        assertDoesNotThrow(() -> delivery.changed(null));
        assertDoesNotThrow(() -> delivery.changed(null));
        assertEquals(2, emitter.writes); // Ready and the single failed write.
        assertEquals(0, emitter.completions);
    }

    @Test void containerErrorPreventsAnyFurtherWrites() {
        TestEmitter emitter = new TestEmitter();
        SseNotificationDelivery delivery = delivery(emitter);
        delivery.subscribe(1L);
        emitter.error.accept(new IOException("Client disconnected"));
        delivery.changed(null);
        assertEquals(1, emitter.writes);
        assertEquals(0, emitter.completions);
    }

    private SseNotificationDelivery delivery(TestEmitter emitter) {
        return new SseNotificationDelivery() {
            @Override SseEmitter newEmitter() { return emitter; }
        };
    }

    private static class TestEmitter extends SseEmitter {
        boolean fail;
        int writes, completions;
        Consumer<Throwable> error;
        @Override public void send(SseEventBuilder event) throws IOException {
            writes++;
            if (fail) throw new IOException("Client disconnected");
        }
        @Override public void onError(Consumer<Throwable> callback) { error = callback; }
        @Override public void completeWithError(Throwable error) {
            completions++;
            throw new IllegalStateException("AsyncContext has already failed");
        }
        @Override public void complete() { completions++; }
    }
}
