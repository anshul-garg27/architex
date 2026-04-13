/**
 * Sleeping Barber Problem (OSC-014)
 *
 * Simulates the classic sleeping barber synchronisation problem.
 * A single barber works in a shop with a limited number of waiting
 * chairs. When no customers are present the barber sleeps. An
 * arriving customer wakes the barber if sleeping, sits in a waiting
 * chair if the barber is busy, or leaves if all chairs are full.
 *
 * The simulation is single-threaded and deterministic: customers
 * arrive at regular intervals (every 2 ticks), and haircuts take 3
 * ticks. This produces an event log suitable for step-by-step
 * playback that demonstrates the full range of barber-customer
 * interactions.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BarberEvent {
  tick: number;
  barber: 'sleeping' | 'cutting';
  waitingRoom: number;
  capacity: number;
  customerAction:
    | 'enter'
    | 'leave-full'
    | 'wake-barber'
    | 'sit-wait'
    | 'get-haircut'
    | 'done';
  description: string;
}

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------

/**
 * Simulate the sleeping barber problem.
 *
 * Customers arrive at staggered intervals. The barber takes a fixed
 * number of ticks to finish a haircut. When done, the barber either
 * serves the next waiting customer or goes back to sleep.
 *
 * @param waitingChairs  - Number of chairs in the waiting room.
 * @param totalCustomers - Total customers that will arrive.
 * @returns Ordered array of {@link BarberEvent} for step-by-step playback.
 */
export function simulateSleepingBarber(
  waitingChairs: number,
  totalCustomers: number,
): BarberEvent[] {
  const events: BarberEvent[] = [];
  let tick = 0;

  let barberState: 'sleeping' | 'cutting' = 'sleeping';
  let waitingRoom = 0;
  let cuttingRemaining = 0;
  let customersArrived = 0;
  let customersServed = 0;
  let nextCustomerId = 1;

  const HAIRCUT_DURATION = 3;
  const ARRIVAL_INTERVAL = 2;

  const maxTicks = totalCustomers * (HAIRCUT_DURATION + ARRIVAL_INTERVAL) * 3; // safety

  // Start with barber sleeping
  events.push({
    tick: tick++,
    barber: 'sleeping',
    waitingRoom: 0,
    capacity: waitingChairs,
    customerAction: 'enter',
    description: 'Barber opens shop and falls asleep (no customers)',
  });

  while (tick < maxTicks) {
    // Check termination: all customers arrived AND served, barber idle
    if (
      customersArrived >= totalCustomers &&
      customersServed >= customersArrived &&
      barberState === 'sleeping' &&
      waitingRoom === 0
    ) {
      break;
    }

    // --- Customer arrival ---
    if (
      customersArrived < totalCustomers &&
      tick % ARRIVAL_INTERVAL === 0
    ) {
      const customerId = nextCustomerId++;
      customersArrived++;
      const customerName = `customer-${customerId}`;

      if (barberState === 'sleeping') {
        // Wake the barber
        barberState = 'cutting';
        cuttingRemaining = HAIRCUT_DURATION;

        events.push({
          tick: tick++,
          barber: 'cutting',
          waitingRoom,
          capacity: waitingChairs,
          customerAction: 'wake-barber',
          description: `${customerName} arrives, wakes the barber`,
        });

        events.push({
          tick: tick++,
          barber: 'cutting',
          waitingRoom,
          capacity: waitingChairs,
          customerAction: 'get-haircut',
          description: `${customerName} sits in barber chair, haircut begins`,
        });
      } else if (waitingRoom < waitingChairs) {
        // Sit in waiting room
        waitingRoom++;

        events.push({
          tick: tick++,
          barber: barberState,
          waitingRoom,
          capacity: waitingChairs,
          customerAction: 'sit-wait',
          description: `${customerName} sits in waiting room (${waitingRoom}/${waitingChairs} chairs occupied)`,
        });
      } else {
        // Waiting room full -- customer leaves
        events.push({
          tick: tick++,
          barber: barberState,
          waitingRoom,
          capacity: waitingChairs,
          customerAction: 'leave-full',
          description: `${customerName} leaves (waiting room full: ${waitingRoom}/${waitingChairs})`,
        });
      }
    }

    // --- Barber progress ---
    if (barberState === 'cutting') {
      cuttingRemaining--;
      if (cuttingRemaining <= 0) {
        customersServed++;

        events.push({
          tick: tick++,
          barber: 'cutting',
          waitingRoom,
          capacity: waitingChairs,
          customerAction: 'done',
          description: `Haircut finished (total served: ${customersServed})`,
        });

        // Check waiting room
        if (waitingRoom > 0) {
          waitingRoom--;
          barberState = 'cutting';
          cuttingRemaining = HAIRCUT_DURATION;

          events.push({
            tick: tick++,
            barber: 'cutting',
            waitingRoom,
            capacity: waitingChairs,
            customerAction: 'get-haircut',
            description: `Next customer from waiting room sits down (${waitingRoom}/${waitingChairs} remaining)`,
          });
        } else {
          barberState = 'sleeping';

          events.push({
            tick: tick++,
            barber: 'sleeping',
            waitingRoom,
            capacity: waitingChairs,
            customerAction: 'enter',
            description: 'No customers waiting, barber falls asleep',
          });
        }
      }
    }

    tick++;
  }

  return events;
}
