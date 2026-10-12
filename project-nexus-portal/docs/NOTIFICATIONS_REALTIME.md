# Notifications real-time

Notifications use authenticated Server-Sent Events (SSE), alongside the existing REST endpoints.
`GET /api/notifications/stream` accepts the same `Authorization: Bearer <JWT>` header.
The configured API prefix still applies.

## Polymorphism

`NotificationDelivery` defines `changed(userId)`. `SseNotificationDelivery` implements this
contract. `NotificationServiceImpl` injects a list of `NotificationDelivery` instances and
invokes the interface after transaction commit. Additional transports can implement this
interface without changing notification CRUD logic.

Create/delete broadcast a content-free `changed` signal; read events go only to connections
of the user who marked the notification as read. Clients fetch their authorized list via
the existing REST API, preserving faculty filtering and per-user read state. Rollbacks
do not send events.

The notifications page and header unread badge refresh on events. Connections renew every
60 seconds to revalidate JWTs. Clients retry network failures with backoff and refresh
on `ready` after reconnect, recovering missed changes. Unmounting closes the stream.
No JWTs are placed in URLs.

## Check locally

1. Open two sessions, with an administrator in one and a recipient in the other.
2. Publish a notification; the recipient list and header count update without reloading.
3. Mark it read in one recipient tab; another tab of that account updates too.
4. Delete the notification; both sessions update.
5. Publish for a different faculty; its content must remain invisible to non-members.
6. Disconnect/reconnect the network; the list catches up when the stream reconnects.

The SSE connection registry is in memory and supports one backend instance. Multiple
backend replicas would require a shared event bus and another delivery implementation.
