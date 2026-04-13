/**
 * Producer-Consumer with Bounded Buffer
 *
 * Simulates a classic producer-consumer problem with a bounded (fixed-size)
 * buffer. Producers add items; consumers remove them. When the buffer is
 * full producers wait; when empty consumers wait. Signalling wakes the
 * blocked party.
 *
 * The simulation is single-threaded and deterministic: producers and
 * consumers take turns in round-robin order, yielding an event log that
 * faithfully represents the synchronisation protocol.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BufferEvent {
  tick: number;
  actor: string; // 'producer-1', 'consumer-1', etc.
  action: 'produce' | 'consume' | 'wait-full' | 'wait-empty' | 'signal';
  item?: number;
  bufferState: number[];
  bufferSize: number;
  description: string;
}

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------

/**
 * Simulate a producer-consumer scenario on a bounded buffer.
 *
 * Producers are scheduled in round-robin before consumers in each tick.
 * When the buffer is full a producer emits a `wait-full` event and yields.
 * When the buffer is empty a consumer emits a `wait-empty` event and yields.
 * After producing or consuming a `signal` event is emitted to wake the
 * other side.
 *
 * @param producerCount - Number of producer actors.
 * @param consumerCount - Number of consumer actors.
 * @param bufferSize    - Maximum items the buffer can hold.
 * @param totalItems    - Total items to produce (once reached, production stops).
 * @returns Ordered array of {@link BufferEvent} for step-by-step playback.
 */
export function simulateProducerConsumer(
  producerCount: number,
  consumerCount: number,
  bufferSize: number,
  totalItems: number,
): BufferEvent[] {
  const events: BufferEvent[] = [];
  const buffer: number[] = [];
  let tick = 0;
  let produced = 0;
  let consumed = 0;
  let nextItem = 1;

  // Track how many items each producer still needs to produce.
  // Distribute items evenly among producers, remainder to first producers.
  const perProducer = Math.floor(totalItems / producerCount);
  const remainder = totalItems % producerCount;
  const producerRemaining: number[] = [];
  for (let i = 0; i < producerCount; i++) {
    producerRemaining.push(perProducer + (i < remainder ? 1 : 0));
  }

  const maxTicks = totalItems * (producerCount + consumerCount) * 4; // safety bound

  while (consumed < totalItems && tick < maxTicks) {
    // --- Producer round ---
    for (let p = 0; p < producerCount; p++) {
      if (producerRemaining[p] <= 0) continue; // this producer is done

      const actor = `producer-${p + 1}`;

      if (buffer.length >= bufferSize) {
        // Buffer full -- wait
        events.push({
          tick: tick++,
          actor,
          action: 'wait-full',
          bufferState: [...buffer],
          bufferSize,
          description: `${actor} waits (buffer full, ${buffer.length}/${bufferSize})`,
        });
        continue;
      }

      // Produce item
      const item = nextItem++;
      buffer.push(item);
      produced++;
      producerRemaining[p]--;

      events.push({
        tick: tick++,
        actor,
        action: 'produce',
        item,
        bufferState: [...buffer],
        bufferSize,
        description: `${actor} produces item ${item} (buffer: ${buffer.length}/${bufferSize})`,
      });

      // Signal consumers that buffer is no longer empty
      events.push({
        tick: tick++,
        actor,
        action: 'signal',
        bufferState: [...buffer],
        bufferSize,
        description: `${actor} signals: buffer not empty`,
      });
    }

    // --- Consumer round ---
    for (let c = 0; c < consumerCount; c++) {
      if (consumed >= totalItems) break;

      const actor = `consumer-${c + 1}`;

      if (buffer.length === 0) {
        // Buffer empty -- wait (only if there are still items to consume)
        if (produced < totalItems || consumed < produced) {
          events.push({
            tick: tick++,
            actor,
            action: 'wait-empty',
            bufferState: [...buffer],
            bufferSize,
            description: `${actor} waits (buffer empty)`,
          });
        }
        continue;
      }

      // Consume item
      const item = buffer.shift()!;
      consumed++;

      events.push({
        tick: tick++,
        actor,
        action: 'consume',
        item,
        bufferState: [...buffer],
        bufferSize,
        description: `${actor} consumes item ${item} (buffer: ${buffer.length}/${bufferSize})`,
      });

      // Signal producers that buffer is no longer full
      events.push({
        tick: tick++,
        actor,
        action: 'signal',
        bufferState: [...buffer],
        bufferSize,
        description: `${actor} signals: buffer not full`,
      });
    }
  }

  return events;
}
