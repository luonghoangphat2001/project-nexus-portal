// Fetch supports the existing Bearer header without putting JWTs in URLs.
export function subscribeNotifications(onRefresh, onStatus) {
  let stopped = false;
  let timer;
  let controller;
  let retry = 1000;

  async function connect() {
    controller = new AbortController();
    let reader;
    try {
      const token = localStorage.getItem('nexus_auth_token');
      if (!token) return;
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/notifications/stream`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
        signal: controller.signal,
      });
      if (response.status === 401 || response.status === 403) {
        onStatus('disconnected');
        return;
      }
      if (!response.ok || !response.body) throw new Error('Stream unavailable');
      onStatus('connected');
      retry = 1000;
      reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (!stopped) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let boundary;
        while ((boundary = buffer.search(/\r?\n\r?\n/)) !== -1) {
          const frame = buffer.slice(0, boundary);
          const separator = buffer.slice(boundary).match(/^\r?\n\r?\n/)[0];
          buffer = buffer.slice(boundary + separator.length);
          if (/^event:\s*(ready|changed)\s*$/m.test(frame)) onRefresh();
        }
      }
    } catch (error) {
      if (stopped || error.name === 'AbortError') return;
    } finally {
      if (reader) {
        try { await reader.cancel(); } catch { /* Connection already closed. */ }
        reader.releaseLock();
      }
    }
    if (!stopped) {
      onStatus('reconnecting');
      timer = setTimeout(connect, retry);
      retry = Math.min(retry * 2, 15000);
    }
  }

  connect();
  return () => {
    stopped = true;
    clearTimeout(timer);
    controller?.abort();
  };
}
