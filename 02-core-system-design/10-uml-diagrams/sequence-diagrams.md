# Sequence Diagrams -- The Second Most Important UML for LLD Interviews

## Why Sequence Diagrams Matter

While class diagrams show the **static structure** (what exists), sequence diagrams show the **dynamic behavior** (what happens). When an interviewer says "walk me through the flow of placing an order" or "how do these objects interact?", they want a sequence diagram.

A sequence diagram shows:
- **Which objects** participate in a use case
- **What messages** they send to each other
- **In what order** those messages occur
- **What is returned** at each step

---

## Anatomy of a Sequence Diagram

### Core Elements

| Element | Description | Mermaid Syntax |
|---------|-------------|----------------|
| Participant / Lifeline | An object or actor involved | `participant A` or `actor A` |
| Solid arrow (->>)  | Synchronous message (call) | `A->>B: message` |
| Dashed arrow (-->>)  | Asynchronous message (fire-and-forget) | `A-->>B: message` |
| Dashed return (--)  | Return value | `B-->>A: response` |
| Activation box | Period when an object is processing | `activate B` / `deactivate B` |
| Self-message | Object calls itself | `A->>A: validate()` |
| Note | Annotation | `Note over A,B: text` |
| Destruction | Object is destroyed | `destroy B` |

### Message Types in Detail

```
Synchronous:   A->>B     Caller waits for response (method call)
Async:         A-->>B    Caller does not wait (event, queue message)
Return:        B-->>A    Return value (dashed, going back)
Create:        A->>+B    Create and activate B
```

---

## Fragments -- Modeling Control Flow

Fragments model conditional logic, loops, and parallel execution within a sequence diagram.

### alt (if/else)

Models conditional branching. Equivalent to if-else.

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server

    C->>S: login(user, pass)
    alt valid credentials
        S-->>C: 200 OK + token
    else invalid credentials
        S-->>C: 401 Unauthorized
    end
```

### opt (optional)

Models behavior that occurs only if a condition is true. Equivalent to a single if with no else.

```mermaid
sequenceDiagram
    participant U as User
    participant O as OrderService
    participant N as NotificationService

    U->>O: placeOrder()
    O-->>U: orderConfirmed

    opt user has email notifications enabled
        O->>N: sendConfirmationEmail()
    end
```

### loop

Models repeated behavior.

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server

    C->>S: connect()
    loop every 30 seconds
        C->>S: heartbeat()
        S-->>C: ack
    end
```

### par (parallel)

Models actions that happen concurrently.

```mermaid
sequenceDiagram
    participant O as OrderService
    participant P as PaymentService
    participant I as InventoryService
    participant N as NotificationService

    par payment and inventory
        O->>P: chargeCustomer()
        P-->>O: paymentSuccess
    and
        O->>I: reserveItems()
        I-->>O: itemsReserved
    end
    O->>N: sendConfirmation()
```

### break

Models an early exit when an exceptional condition is met.

```mermaid
sequenceDiagram
    participant C as Client
    participant A as API
    participant DB as Database

    C->>A: getUser(id)
    A->>DB: SELECT * FROM users WHERE id=?
    break user not found
        DB-->>A: null
        A-->>C: 404 Not Found
    end
    DB-->>A: userRecord
    A-->>C: 200 OK + user
```

### critical

Models a critical section where interactions must complete atomically.

```mermaid
sequenceDiagram
    participant T as Thread
    participant L as Lock
    participant A as Account

    T->>L: acquire()
    critical balance update
        T->>A: getBalance()
        A-->>T: balance
        T->>A: setBalance(balance - amount)
    end
    T->>L: release()
```

---

## Complete Example 1: User Login Flow

This is a bread-and-butter interview question. Show the full authentication flow.

```mermaid
sequenceDiagram
    actor U as User
    participant C as Client App
    participant API as API Gateway
    participant Auth as AuthService
    participant DB as UserDB
    participant Cache as Redis Cache
    participant Token as TokenService

    U->>C: enter credentials
    C->>API: POST /login {email, password}
    activate API

    API->>Auth: authenticate(email, password)
    activate Auth

    Auth->>Cache: get(email)
    alt cached user found
        Cache-->>Auth: cachedUser
    else cache miss
        Cache-->>Auth: null
        Auth->>DB: findByEmail(email)
        activate DB
        DB-->>Auth: userRecord
        deactivate DB
        Auth->>Cache: set(email, userRecord, TTL=5min)
    end

    Auth->>Auth: verifyPassword(password, hash)

    alt password valid
        Auth->>Token: generateTokens(userId)
        activate Token
        Token->>Token: createAccessToken(userId, 15min)
        Token->>Token: createRefreshToken(userId, 7d)
        Token-->>Auth: {accessToken, refreshToken}
        deactivate Token

        Auth->>DB: updateLastLogin(userId)
        Auth-->>API: AuthSuccess{tokens, user}
        API-->>C: 200 {accessToken, refreshToken, user}
        C->>C: storeTokens()
        C-->>U: redirect to dashboard
    else password invalid
        Auth->>Auth: incrementFailedAttempts()
        opt failedAttempts >= 5
            Auth->>DB: lockAccount(userId)
            Auth->>Auth: sendLockNotification()
        end
        Auth-->>API: AuthFailure{reason}
        API-->>C: 401 {error: "Invalid credentials"}
        C-->>U: show error message
    end
    deactivate Auth
    deactivate API
```

### What This Diagram Shows an Interviewer

1. **Cache-aside pattern** -- check Redis before hitting DB.
2. **Token-based auth** -- separate access and refresh tokens with different TTLs.
3. **Account lockout** -- brute-force protection after 5 failed attempts.
4. **Separation of concerns** -- API Gateway, AuthService, TokenService, and DB are distinct participants.
5. **Error handling** -- both the happy path and failure path are shown.

---

## Complete Example 2: Place Order Flow

An e-commerce order placement with payment, inventory, and notifications.

```mermaid
sequenceDiagram
    actor U as User
    participant C as Client
    participant API as API Gateway
    participant OS as OrderService
    participant IS as InventoryService
    participant PS as PaymentService
    participant NS as NotificationService
    participant DB as OrderDB

    U->>C: click "Place Order"
    C->>API: POST /orders {cartId, paymentMethod}
    activate API
    API->>OS: createOrder(cartId, userId, paymentMethod)
    activate OS

    %% Step 1: Validate and reserve inventory
    OS->>IS: reserveItems(cartItems)
    activate IS
    IS->>IS: checkStock(items)

    alt all items in stock
        IS->>IS: decrementStock(items)
        IS-->>OS: ReservationSuccess{reservationId}
    else some items out of stock
        IS-->>OS: ReservationFailed{unavailableItems}
        OS-->>API: 409 {error: "Items out of stock", items}
        API-->>C: show out-of-stock error
        C-->>U: display error
    end
    deactivate IS

    %% Step 2: Process payment
    OS->>PS: processPayment(amount, method, orderId)
    activate PS
    PS->>PS: validatePaymentMethod()
    PS->>PS: chargeAmount()

    alt payment successful
        PS-->>OS: PaymentSuccess{transactionId}
    else payment failed
        PS-->>OS: PaymentFailed{reason}
        OS->>IS: releaseReservation(reservationId)
        IS-->>OS: released
        OS-->>API: 402 {error: "Payment failed"}
        API-->>C: show payment error
        C-->>U: display error
    end
    deactivate PS

    %% Step 3: Persist order
    OS->>DB: saveOrder(order)
    activate DB
    DB-->>OS: orderSaved{orderId}
    deactivate DB

    OS->>OS: updateOrderStatus(CONFIRMED)

    %% Step 4: Async notifications
    OS-->>NS: orderConfirmed(orderId, userId)
    activate NS
    par send notifications
        NS->>NS: sendEmail()
    and
        NS->>NS: sendPushNotification()
    and
        NS->>NS: sendSMS()
    end
    deactivate NS

    OS-->>API: 201 {orderId, status: CONFIRMED}
    deactivate OS
    API-->>C: order confirmation
    deactivate API
    C-->>U: show order confirmation page
```

### What This Diagram Shows an Interviewer

1. **Saga-like compensation** -- if payment fails, inventory reservation is released.
2. **Sequential dependency** -- payment only runs after inventory is reserved.
3. **Async notifications** -- fire-and-forget (dashed arrow), does not block the order response.
4. **Parallel notifications** -- email, push, and SMS sent concurrently.
5. **Clear error handling** at each step with distinct HTTP status codes.

---

## Complete Example 3: Book Movie Ticket

A seat-locking flow with temporary reservation and timeout.

```mermaid
sequenceDiagram
    actor U as User
    participant C as Client
    participant BS as BookingService
    participant SS as SeatService
    participant SL as SeatLockService
    participant PS as PaymentService
    participant NS as NotificationService
    participant DB as BookingDB

    U->>C: select movie, showtime, seats
    C->>BS: POST /bookings/initiate {showId, seatIds}
    activate BS

    BS->>SS: getSeats(showId, seatIds)
    activate SS
    SS-->>BS: seatDetails
    deactivate SS

    BS->>SL: lockSeats(showId, seatIds, userId, TTL=10min)
    activate SL
    SL->>SL: checkAvailability(seatIds)

    alt seats available
        SL->>SL: acquireLocks(seatIds, userId, expiry)
        SL-->>BS: LockSuccess{lockId, expiresAt}
    else seats already locked
        SL-->>BS: LockFailed{unavailableSeats}
        BS-->>C: 409 {error: "Seats unavailable"}
        C-->>U: show "seats taken" error
    end
    deactivate SL

    BS-->>C: 200 {lockId, expiresAt, totalAmount}
    deactivate BS
    C-->>U: show payment page with countdown timer

    Note over U,C: User has 10 minutes to complete payment

    U->>C: enter payment details, confirm
    C->>BS: POST /bookings/confirm {lockId, paymentDetails}
    activate BS

    BS->>SL: validateLock(lockId, userId)
    activate SL
    alt lock still valid
        SL-->>BS: LockValid
    else lock expired
        SL-->>BS: LockExpired
        BS-->>C: 410 {error: "Session expired"}
        C-->>U: show "time expired, select seats again"
    end
    deactivate SL

    BS->>PS: processPayment(amount, paymentDetails)
    activate PS
    alt payment successful
        PS-->>BS: PaymentSuccess{transactionId}
    else payment failed
        PS-->>BS: PaymentFailed{reason}
        BS->>SL: releaseLocks(lockId)
        BS-->>C: 402 {error: "Payment failed"}
        C-->>U: show payment error
    end
    deactivate PS

    BS->>DB: createBooking(showId, seatIds, userId, transactionId)
    activate DB
    DB-->>BS: booking{bookingId}
    deactivate DB

    BS->>SL: confirmSeats(lockId)
    SL->>SL: convertLockToPermanent()

    BS-->>NS: bookingConfirmed(bookingId)
    activate NS
    par
        NS->>NS: sendEmail(ticket)
    and
        NS->>NS: sendSMS(bookingId)
    end
    deactivate NS

    BS-->>C: 201 {bookingId, seats, showDetails}
    deactivate BS
    C-->>U: show e-ticket with QR code

    Note over SL: Background job: release expired locks every minute
```

### What This Diagram Shows an Interviewer

1. **Optimistic locking with TTL** -- seats are temporarily locked with a 10-minute expiry.
2. **Two-phase booking** -- initiate (lock) then confirm (pay). This prevents double-booking.
3. **Countdown timer on client** -- user sees how much time remains to complete payment.
4. **Lock validation** before payment -- catches expired sessions.
5. **Background cleanup** -- a scheduled job releases locks that users abandoned.
6. **Compensation** -- if payment fails, locks are explicitly released.

---

## How to Draw Sequence Diagrams in an Interview

### Step 1: Pick ONE Use Case

Do not try to show the entire system. Pick the most interesting or complex use case and diagram just that flow.

Good choices:
- The "happy path" of the core functionality
- A flow with interesting error handling or concurrency
- A flow the interviewer specifically asks about

### Step 2: Identify Participants

List the objects (not classes -- specific instances or services) that participate in this use case. Draw them left to right in roughly the order they first appear.

Typical participants in an LLD sequence diagram:
- Actor (User, Admin)
- Client / UI
- Controller / API Gateway
- Domain Services (OrderService, PaymentService)
- External Services (email provider, payment gateway)
- Database / Cache

### Step 3: Draw the Happy Path First

Walk through the success scenario from left to right, top to bottom. Show each method call and its return value.

### Step 4: Add Error Handling

Use `alt` fragments to show what happens when things fail:
- Invalid input
- Insufficient inventory
- Payment declined
- Timeout

### Step 5: Add Activation Boxes

Show when each object is actively processing. This makes it clear which object is doing work at each point in time.

### Step 6: Mark Async vs Sync

Use solid arrows (->>)  for synchronous calls where the caller waits. Use dashed arrows (-->>) for fire-and-forget async calls (like sending to a message queue).

---

## When to Use Sequence Diagrams

| Situation | Use Sequence Diagram? |
|-----------|----------------------|
| "Walk me through how X works" | Yes -- this is exactly what sequence diagrams show |
| Complex multi-service interaction | Yes -- shows ordering and dependencies |
| API call chains with error handling | Yes -- alt fragments show branching |
| Simple CRUD operation | Probably not -- too trivial |
| "Show me all the classes" | No -- use a class diagram |
| Concurrent or parallel flows | Yes -- par fragment shows concurrency |
| Long-running saga with compensation | Yes -- shows rollback steps clearly |

---

## Mermaid Sequence Diagram Syntax Reference

```
sequenceDiagram
    %% Participants (left to right order)
    actor U as User
    participant A as ServiceA
    participant B as ServiceB

    %% Messages
    A->>B: synchronous call
    A-->>B: async message
    B-->>A: return value
    A->>A: self-call

    %% Activation
    activate A
    deactivate A
    %% Or shorthand:
    A->>+B: call (auto-activate)
    B-->>-A: return (auto-deactivate)

    %% Fragments
    alt condition
        A->>B: do this
    else other condition
        A->>B: do that
    end

    opt optional condition
        A->>B: maybe do this
    end

    loop description
        A->>B: repeated action
    end

    par parallel task 1
        A->>B: task 1
    and parallel task 2
        A->>C: task 2
    end

    critical critical section
        A->>B: atomic operation
    end

    break exception condition
        B-->>A: error
    end

    %% Notes
    Note over A: single participant note
    Note over A,B: spanning note
    Note left of A: left note
    Note right of B: right note

    %% Numbering
    autonumber
```

---

## Common Mistakes in Sequence Diagrams

### 1. Too Many Participants

**Wrong:** 15 participants making the diagram unreadable.
**Right:** Limit to 5-7 participants. Group related services if needed.

### 2. Missing Return Arrows

**Wrong:** Showing calls going right but never showing what comes back.
**Right:** Always show the return value, even if it is just "ack" or "void."

### 3. No Error Handling

**Wrong:** Only showing the happy path.
**Right:** Use alt/break fragments to show at least one failure scenario. Interviewers specifically look for this.

### 4. Wrong Arrow Types

**Wrong:** Using synchronous arrows for message queue interactions.
**Right:** Use dashed arrows (async) for queues, events, notifications.

### 5. No Activation Boxes

**Wrong:** Flat lifelines with no indication of which object is processing.
**Right:** Show activation boxes to clarify processing time and call depth.

### 6. Trying to Show Everything

**Wrong:** One massive sequence diagram covering login, search, order, payment, and delivery.
**Right:** One diagram per use case. Focus on depth, not breadth.

---

## Sequence Diagrams and Design Patterns

Sequence diagrams are excellent for illustrating how design patterns work at runtime:

| Pattern | What the Sequence Diagram Shows |
|---------|-------------------------------|
| Observer | Subject notifying all registered observers |
| Chain of Responsibility | Request passed from handler to handler |
| Strategy | Client calling the strategy interface, dispatched to concrete strategy |
| Command | Invoker executing a command, command calling receiver |
| Mediator | All participants communicating through the mediator |
| Proxy | Client calling proxy, proxy forwarding to real subject |

These runtime-behavior patterns are much clearer in sequence diagrams than in class diagrams alone.
