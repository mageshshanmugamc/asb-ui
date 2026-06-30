import { useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";

const BASE_URL = (window as any).__ENV__?.REACT_APP_BASE_URL || "http://localhost:5057";

interface SignalREvent {
  /** The hub method name to listen for (e.g. "UserCreated") */
  name: string;
  /** Callback invoked when the event fires */
  handler: (payload: any) => void;
}

/**
 * Connects to a SignalR hub and subscribes to one or more events.
 * Automatically disconnects on unmount.
 *
 * @param hubPath  - Hub endpoint path, e.g. "/hubs/notifications"
 * @param events   - Array of event names and their handlers
 */
export function useSignalR(hubPath: string, events: SignalREvent[]) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  // Keep handlers in a ref so the effect doesn't re-run on every render
  const eventsRef = useRef(events);
  eventsRef.current = events;

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${BASE_URL}${hubPath}`)
      .build();

    connectionRef.current = connection;

    for (const evt of eventsRef.current) {
      connection.on(evt.name, (payload: any) => {
        const current = eventsRef.current.find((e) => e.name === evt.name);
        current?.handler(payload);
      });
    }

    connection.start().catch((err) =>
      console.error("SignalR connection failed:", err)
    );

    return () => {
      if (connection.state === signalR.HubConnectionState.Connected) {
        connection.stop();
      }
    };
  }, [hubPath]);
}
