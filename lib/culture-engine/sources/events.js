// Event adapter (MVP): RSS-backed event feeds work via the RSS adapter.
// Non-feed event sources are handled as manual imports for now.
// Stub kept so the data model + dispatcher support `event` source type cleanly.
export async function fetchEvents(source) {
  console.warn(`[events] "${source.name}" — event auto-fetch not implemented in MVP. Use RSS feed or Manual import for events.`);
  return [];
}
