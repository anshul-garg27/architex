// ─────────────────────────────────────────────────────────────
// Architex — State Machine Types & Examples (LLD-012, LLD-013)
// ─────────────────────────────────────────────────────────────

export interface StateNode {
  id: string;
  name: string;
  isInitial?: boolean;
  isFinal?: boolean;
  entryAction?: string;
  exitAction?: string;
}

export interface StateTransition {
  id: string;
  from: string;
  to: string;
  trigger: string;
  guard?: string;
  action?: string;
}

export interface StateMachineData {
  states: StateNode[];
  transitions: StateTransition[];
}

// ── Pre-built State Machine Examples ──────────────────────────

export const STATE_MACHINE_EXAMPLES: Array<{
  id: string;
  name: string;
  description: string;
  data: StateMachineData;
}> = [
  // 1. Order Lifecycle
  {
    id: "order-lifecycle",
    name: "Order Lifecycle",
    description:
      "Models the lifecycle of an e-commerce order from creation through fulfillment, including the cancellation path available before shipment.",
    data: {
      states: [
        { id: "new", name: "New", isInitial: true, entryAction: "generateOrderId()", exitAction: "notifyWarehouse()" },
        { id: "confirmed", name: "Confirmed", entryAction: "sendConfirmationEmail()", exitAction: "reserveInventory()" },
        { id: "shipped", name: "Shipped", entryAction: "createTrackingNumber()", exitAction: "updateETA()" },
        { id: "delivered", name: "Delivered", isFinal: true, entryAction: "sendDeliveryConfirmation()" },
        { id: "cancelled", name: "Cancelled", isFinal: true, entryAction: "releaseInventory(); refundPayment()" },
      ],
      transitions: [
        { id: "t1", from: "new", to: "confirmed", trigger: "pay()", guard: "paymentValid", action: "chargeCard()" },
        { id: "t2", from: "confirmed", to: "shipped", trigger: "ship()", action: "printLabel()" },
        { id: "t3", from: "shipped", to: "delivered", trigger: "deliver()", guard: "signatureReceived", action: "closeOrder()" },
        { id: "t4", from: "new", to: "cancelled", trigger: "cancel()", action: "logCancellation()" },
        { id: "t5", from: "confirmed", to: "cancelled", trigger: "cancel()", guard: "!shipped", action: "logCancellation()" },
      ],
    },
  },

  // 2. TCP Connection (RFC 793)
  {
    id: "tcp-connection",
    name: "TCP Connection",
    description:
      "RFC 793 TCP connection state machine with all 11 states: connection establishment (3-way handshake), data transfer, and both active/passive close paths including simultaneous close.",
    data: {
      states: [
        { id: "closed", name: "CLOSED", isInitial: true, isFinal: true },
        { id: "listen", name: "LISTEN", entryAction: "openSocket()" },
        { id: "syn-sent", name: "SYN_SENT", entryAction: "startTimer()" },
        { id: "syn-rcvd", name: "SYN_RCVD" },
        { id: "established", name: "ESTABLISHED", entryAction: "connectionReady()", exitAction: "flushBuffers()" },
        { id: "fin-wait-1", name: "FIN_WAIT_1", entryAction: "startCloseTimer()" },
        { id: "fin-wait-2", name: "FIN_WAIT_2" },
        { id: "closing", name: "CLOSING" },
        { id: "time-wait", name: "TIME_WAIT", entryAction: "startTimeWaitTimer(2 * MSL)" },
        { id: "close-wait", name: "CLOSE_WAIT" },
        { id: "last-ack", name: "LAST_ACK" },
      ],
      transitions: [
        // ── Connection establishment (3-way handshake) ──
        { id: "t1", from: "closed", to: "listen", trigger: "passive open", action: "createTCB()" },
        { id: "t2", from: "closed", to: "syn-sent", trigger: "active open", action: "sendSYN()" },
        { id: "t3", from: "listen", to: "syn-rcvd", trigger: "rcv SYN", action: "sendSYN+ACK()" },
        { id: "t4", from: "syn-sent", to: "established", trigger: "rcv SYN+ACK", action: "sendACK()" },
        { id: "t5", from: "syn-rcvd", to: "established", trigger: "rcv ACK" },
        { id: "t6", from: "listen", to: "closed", trigger: "close()" },
        // ── Active close path (local initiates close) ──
        { id: "t7", from: "established", to: "fin-wait-1", trigger: "close()", action: "sendFIN()" },
        { id: "t8", from: "fin-wait-1", to: "fin-wait-2", trigger: "rcv ACK" },
        { id: "t9", from: "fin-wait-2", to: "time-wait", trigger: "rcv FIN", action: "sendACK()" },
        { id: "t10", from: "time-wait", to: "closed", trigger: "timeout (2MSL)", action: "deleteTCB()" },
        // ── Passive close path (remote initiates close) ──
        { id: "t11", from: "established", to: "close-wait", trigger: "rcv FIN", action: "sendACK()" },
        { id: "t12", from: "close-wait", to: "last-ack", trigger: "close()", action: "sendFIN()" },
        { id: "t13", from: "last-ack", to: "closed", trigger: "rcv ACK", action: "deleteTCB()" },
        // ── Simultaneous close ──
        { id: "t14", from: "fin-wait-1", to: "closing", trigger: "rcv FIN", action: "sendACK()" },
        { id: "t15", from: "closing", to: "time-wait", trigger: "rcv ACK" },
      ],
    },
  },

  // 3. Traffic Light
  {
    id: "traffic-light",
    name: "Traffic Light",
    description:
      "Advanced traffic light controller with pedestrian crossing, emergency vehicle preemption, and night-mode flashing. Models the full intersection lifecycle including all-red clearance intervals and degraded-mode operation.",
    data: {
      states: [
        { id: "red", name: "Red", isInitial: true, entryAction: "enableRedLamp()", exitAction: "disableRedLamp()" },
        { id: "green", name: "Green", entryAction: "enableGreenLamp()", exitAction: "disableGreenLamp()" },
        { id: "yellow", name: "Yellow", entryAction: "enableYellowLamp()", exitAction: "disableYellowLamp()" },
        { id: "pedestrian-walk", name: "PedestrianWalk", entryAction: "enableWalkSignal(); startCountdown()", exitAction: "disableWalkSignal()" },
        { id: "all-red", name: "AllRed", entryAction: "enableAllRedLamps(); soundSiren()", exitAction: "disableAllRedLamps()" },
        { id: "flashing-yellow", name: "FlashingYellow", entryAction: "startFlashCycle()", exitAction: "stopFlashCycle()" },
      ],
      transitions: [
        // ── Normal cycle ──
        { id: "t1", from: "red", to: "green", trigger: "timer(60s)", guard: "!emergencyVehicleDetected && !nightModeEnabled", action: "resetTimer()" },
        { id: "t2", from: "green", to: "yellow", trigger: "timer(45s)", action: "resetTimer()" },
        { id: "t3", from: "yellow", to: "red", trigger: "timer(5s)", action: "resetTimer()" },
        // ── Pedestrian crossing ──
        { id: "t4", from: "red", to: "pedestrian-walk", trigger: "pedestrianButton()", guard: "pedestrianButtonPressed", action: "resetTimer()" },
        { id: "t5", from: "pedestrian-walk", to: "red", trigger: "countdownExpired", action: "resetTimer()" },
        { id: "t6", from: "green", to: "pedestrian-walk", trigger: "pedestrianButton()", guard: "pedestrianButtonPressed", action: "transitionToYellowThenWalk()" },
        // ── Emergency vehicle preemption ──
        { id: "t7", from: "red", to: "all-red", trigger: "emergencyPreempt()", guard: "emergencyVehicleDetected", action: "activatePreemptionMode()" },
        { id: "t8", from: "green", to: "all-red", trigger: "emergencyPreempt()", guard: "emergencyVehicleDetected", action: "activatePreemptionMode()" },
        { id: "t9", from: "yellow", to: "all-red", trigger: "emergencyPreempt()", guard: "emergencyVehicleDetected", action: "activatePreemptionMode()" },
        { id: "t10", from: "all-red", to: "red", trigger: "emergencyCleared", action: "deactivatePreemptionMode(); resetTimer()" },
        // ── Night mode ──
        { id: "t11", from: "red", to: "flashing-yellow", trigger: "nightModeActivated()", guard: "nightModeEnabled", action: "logModeChange()" },
        { id: "t12", from: "green", to: "flashing-yellow", trigger: "nightModeActivated()", guard: "nightModeEnabled", action: "logModeChange()" },
        { id: "t13", from: "flashing-yellow", to: "red", trigger: "dayModeActivated()", guard: "!nightModeEnabled", action: "logModeChange(); resetTimer()" },
      ],
    },
  },

  // 4. User Authentication
  {
    id: "user-authentication",
    name: "User Authentication",
    description:
      "Models user authentication states including login, session management, account locking after repeated failures, and cooldown-based recovery. Covers the full security lifecycle of a user session.",
    data: {
      states: [
        { id: "logged-out", name: "LoggedOut", isInitial: true, entryAction: "clearSession()", exitAction: "initLoginAttempt()" },
        { id: "logging-in", name: "LoggingIn", entryAction: "showSpinner()", exitAction: "hideSpinner()" },
        { id: "authenticated", name: "Authenticated", entryAction: "startSessionTimer()", exitAction: "persistSession()" },
        { id: "session-expired", name: "SessionExpired", entryAction: "showReAuthPrompt()", exitAction: "clearExpiredToken()" },
        { id: "locked", name: "Locked", entryAction: "startCooldownTimer()", exitAction: "resetFailedAttempts()" },
      ],
      transitions: [
        { id: "t1", from: "logged-out", to: "logging-in", trigger: "submitCredentials()", action: "sendAuthRequest()" },
        { id: "t2", from: "logging-in", to: "authenticated", trigger: "authSuccess", action: "storeToken()" },
        { id: "t3", from: "logging-in", to: "logged-out", trigger: "authFailed", guard: "failedAttempts < 3", action: "incrementFailedAttempts()" },
        { id: "t4", from: "logging-in", to: "locked", trigger: "authFailed", guard: "failedAttempts >= 3", action: "lockAccount()" },
        { id: "t5", from: "authenticated", to: "session-expired", trigger: "tokenExpired", action: "invalidateToken()" },
        { id: "t6", from: "authenticated", to: "logged-out", trigger: "logout()", action: "revokeToken()" },
        { id: "t7", from: "session-expired", to: "logging-in", trigger: "reAuthenticate()", action: "sendAuthRequest()" },
        { id: "t8", from: "session-expired", to: "logged-out", trigger: "cancelReAuth()", action: "clearSession()" },
        { id: "t9", from: "locked", to: "logged-out", trigger: "cooldownExpired", action: "unlockAccount()" },
      ],
    },
  },

  // 5. Payment Processing
  {
    id: "payment-processing",
    name: "Payment Processing",
    description:
      "Models the lifecycle of a payment from initiation through processing, with paths to success, failure, retry, and refund. Covers the common payment gateway integration scenarios including idempotent retries.",
    data: {
      states: [
        { id: "pending", name: "Pending", isInitial: true, entryAction: "generatePaymentId()", exitAction: "logTransitionFromPending()" },
        { id: "processing", name: "Processing", entryAction: "submitToGateway()", exitAction: "recordGatewayResponse()" },
        { id: "succeeded", name: "Succeeded", entryAction: "sendReceipt()", exitAction: "archiveTransaction()" },
        { id: "failed", name: "Failed", entryAction: "notifyFailure()", exitAction: "logRetryAttempt()" },
        { id: "retrying", name: "Retrying", entryAction: "waitBackoff()", exitAction: "incrementRetryCount()" },
        { id: "refunding", name: "Refunding", entryAction: "submitRefundToGateway()", exitAction: "recordRefundResponse()" },
        { id: "refunded", name: "Refunded", isFinal: true, entryAction: "sendRefundConfirmation()" },
      ],
      transitions: [
        { id: "t1", from: "pending", to: "processing", trigger: "initiatePayment()", action: "chargeCard()" },
        { id: "t2", from: "processing", to: "succeeded", trigger: "gatewayApproved", action: "captureCharge()" },
        { id: "t3", from: "processing", to: "failed", trigger: "gatewayDeclined", action: "recordDeclineReason()" },
        { id: "t4", from: "failed", to: "retrying", trigger: "retry()", guard: "retryCount < maxRetries", action: "prepareRetry()" },
        { id: "t5", from: "retrying", to: "processing", trigger: "backoffComplete", action: "resubmitToGateway()" },
        { id: "t6", from: "succeeded", to: "refunding", trigger: "requestRefund()", guard: "withinRefundWindow", action: "initiateRefund()" },
        { id: "t7", from: "refunding", to: "refunded", trigger: "refundApproved", action: "creditAccount()" },
        { id: "t8", from: "refunding", to: "succeeded", trigger: "refundDenied", action: "notifyRefundFailure()" },
      ],
    },
  },

  // 6. CI/CD Pipeline
  {
    id: "cicd-pipeline",
    name: "CI/CD Pipeline",
    description:
      "Models a CI/CD pipeline with stages from queued through building, testing, deploying, to deployed. Any stage can fail, and a failed pipeline can be retried by re-entering the queue.",
    data: {
      states: [
        { id: "queued", name: "Queued", isInitial: true, entryAction: "addToQueue()", exitAction: "assignRunner()" },
        { id: "building", name: "Building", entryAction: "cloneRepo()", exitAction: "cacheArtifacts()" },
        { id: "testing", name: "Testing", entryAction: "runTestSuites()", exitAction: "collectCoverage()" },
        { id: "deploying", name: "Deploying", entryAction: "pushToStaging()", exitAction: "runSmokeTests()" },
        { id: "deployed", name: "Deployed", isFinal: true, entryAction: "notifyTeam()" },
        { id: "failed", name: "Failed", entryAction: "notifyFailure()", exitAction: "collectLogs()" },
      ],
      transitions: [
        { id: "t1", from: "queued", to: "building", trigger: "runnerAvailable", action: "startBuild()" },
        { id: "t2", from: "building", to: "testing", trigger: "buildSucceeded", action: "uploadBuildArtifact()" },
        { id: "t3", from: "testing", to: "deploying", trigger: "testsPassedAndCoverageOk", guard: "coverage >= threshold", action: "createRelease()" },
        { id: "t4", from: "deploying", to: "deployed", trigger: "deploySucceeded", action: "tagRelease()" },
        { id: "t5", from: "building", to: "failed", trigger: "buildFailed", action: "logBuildError()" },
        { id: "t6", from: "testing", to: "failed", trigger: "testsFailed", action: "logTestFailures()" },
        { id: "t7", from: "deploying", to: "failed", trigger: "deployFailed", action: "rollback()" },
        { id: "t8", from: "failed", to: "queued", trigger: "retry()", guard: "retryCount < maxRetries", action: "resetPipelineState()" },
      ],
    },
  },

  // 7. Thread Lifecycle
  {
    id: "thread-lifecycle",
    name: "Thread Lifecycle",
    description:
      "Java Thread.State enum modeled as a state machine. Covers the full lifecycle from creation through scheduling, blocking on monitors, waiting on conditions, timed waits, and termination. The most commonly asked state machine in FAANG system design interviews.",
    data: {
      states: [
        { id: "new", name: "New", isInitial: true, entryAction: "allocateStack()" },
        { id: "runnable", name: "Runnable", entryAction: "addToRunQueue()", exitAction: "removeFromRunQueue()" },
        { id: "running", name: "Running", entryAction: "loadContext()", exitAction: "saveContext()" },
        { id: "blocked", name: "Blocked", entryAction: "addToBlockQueue()", exitAction: "removeFromBlockQueue()" },
        { id: "waiting", name: "Waiting", entryAction: "releaseMonitor()", exitAction: "reacquireMonitor()" },
        { id: "timed-waiting", name: "TimedWaiting", entryAction: "startSleepTimer()", exitAction: "cancelSleepTimer()" },
        { id: "terminated", name: "Terminated", isFinal: true, entryAction: "releaseResources(); notifyJoiningThreads()" },
      ],
      transitions: [
        { id: "t1", from: "new", to: "runnable", trigger: "start()", action: "registerWithScheduler()" },
        { id: "t2", from: "runnable", to: "running", trigger: "schedulerDispatch()", action: "loadContext()" },
        { id: "t3", from: "running", to: "runnable", trigger: "yield() / timeSliceExpired", action: "saveContext()" },
        { id: "t4", from: "running", to: "blocked", trigger: "synchronized()", guard: "!lockAvailable", action: "acquireLock()" },
        { id: "t5", from: "blocked", to: "runnable", trigger: "lockReleased()", guard: "lockAvailable", action: "acquireLock()" },
        { id: "t6", from: "running", to: "waiting", trigger: "wait() / join()", action: "releaseLock()" },
        { id: "t7", from: "waiting", to: "runnable", trigger: "notify() / notifyAll()", guard: "notified", action: "reacquireMonitor()" },
        { id: "t8", from: "running", to: "timed-waiting", trigger: "sleep(ms) / wait(ms)", action: "startSleepTimer()" },
        { id: "t9", from: "timed-waiting", to: "runnable", trigger: "timeout / notify()", guard: "timeoutExpired || notified", action: "cancelSleepTimer()" },
        { id: "t10", from: "running", to: "terminated", trigger: "run() completes / uncaughtException", action: "releaseResources()" },
        { id: "t11", from: "waiting", to: "runnable", trigger: "interrupt()", action: "interrupt(); throwInterruptedException()" },
        { id: "t12", from: "timed-waiting", to: "runnable", trigger: "interrupt()", action: "interrupt(); throwInterruptedException()" },
      ],
    },
  },

  // 8. Circuit Breaker
  {
    id: "circuit-breaker-states",
    name: "Circuit Breaker",
    description:
      "Resilience4j / Hystrix circuit breaker pattern. Protects downstream services by tracking failure rates and short-circuiting calls when a threshold is exceeded. The half-open probe state allows gradual recovery without overwhelming a struggling service.",
    data: {
      states: [
        { id: "closed", name: "Closed", isInitial: true, entryAction: "resetCounter()", exitAction: "snapshotMetrics()" },
        { id: "open", name: "Open", entryAction: "startTimer(); rejectAllCalls()", exitAction: "stopTimer()" },
        { id: "half-open", name: "HalfOpen", entryAction: "allowProbeRequest()", exitAction: "evaluateProbe()" },
        { id: "disabled", name: "Disabled", isFinal: true, entryAction: "logManualOverride(); bypassBreaker()" },
      ],
      transitions: [
        { id: "t1", from: "closed", to: "open", trigger: "callFailed()", guard: "failureCount >= threshold", action: "incrementFailure(); startTimer()" },
        { id: "t2", from: "closed", to: "closed", trigger: "callSucceeded()", action: "resetCounter()" },
        { id: "t3", from: "open", to: "half-open", trigger: "recoveryTimeout()", guard: "timeout >= recoveryTime", action: "recordProbe()" },
        { id: "t4", from: "half-open", to: "closed", trigger: "probeSucceeded()", guard: "probeSucceeded", action: "resetCounter()" },
        { id: "t5", from: "half-open", to: "open", trigger: "probeFailed()", action: "incrementFailure(); startTimer()" },
        { id: "t6", from: "closed", to: "disabled", trigger: "manualOverride()", action: "logManualOverride()" },
        { id: "t7", from: "open", to: "disabled", trigger: "manualOverride()", action: "logManualOverride()" },
        { id: "t8", from: "half-open", to: "disabled", trigger: "manualOverride()", action: "logManualOverride()" },
      ],
    },
  },

  // 9. Document Workflow
  {
    id: "document-workflow",
    name: "Document Workflow",
    description:
      "Content management lifecycle from draft to publication. Models the editorial review process with role-based guards, approval chains, and rejection-resubmission loops. Covers the complete CMS publishing workflow used in enterprise content platforms.",
    data: {
      states: [
        { id: "draft", name: "Draft", isInitial: true, entryAction: "createDraftVersion()", exitAction: "snapshotContent()" },
        { id: "pending-review", name: "PendingReview", entryAction: "addToReviewQueue()", exitAction: "removeFromReviewQueue()" },
        { id: "in-review", name: "InReview", entryAction: "lockDocument()", exitAction: "unlockDocument()" },
        { id: "approved", name: "Approved", entryAction: "notifyAuthor('approved')", exitAction: "prepareForPublishing()" },
        { id: "published", name: "Published", isFinal: true, entryAction: "publishToSite(); archivePreviousVersion()" },
        { id: "rejected", name: "Rejected", entryAction: "notifyAuthor('rejected')", exitAction: "clearReviewComments()" },
      ],
      transitions: [
        { id: "t1", from: "draft", to: "pending-review", trigger: "submit()", action: "notifyReviewer()" },
        { id: "t2", from: "pending-review", to: "in-review", trigger: "assignReviewer()", guard: "reviewerAssigned", action: "notifyReviewer()" },
        { id: "t3", from: "in-review", to: "approved", trigger: "approve()", guard: "reviewer != author", action: "stampApproval()" },
        { id: "t4", from: "in-review", to: "rejected", trigger: "reject()", guard: "reviewer != author", action: "addRejectionComments()" },
        { id: "t5", from: "rejected", to: "draft", trigger: "revise()", guard: "changesAddressed", action: "createRevision()" },
        { id: "t6", from: "approved", to: "published", trigger: "publish()", action: "publishToSite(); archivePreviousVersion()" },
        { id: "t7", from: "approved", to: "draft", trigger: "requestChanges()", action: "notifyAuthor('changesRequested')" },
      ],
    },
  },

  // 10. Elevator
  {
    id: "elevator-states",
    name: "Elevator",
    description:
      "Multi-floor elevator controller state machine modeling movement, door operations, and emergency handling. Includes directional movement, door obstruction detection with automatic reopening, and emergency stop with alarm activation.",
    data: {
      states: [
        { id: "idle", name: "Idle", isInitial: true, entryAction: "updateFloorDisplay()", exitAction: "determineDirection()" },
        { id: "moving-up", name: "MovingUp", entryAction: "startMotor('up')", exitAction: "stopMotor()" },
        { id: "moving-down", name: "MovingDown", entryAction: "startMotor('down')", exitAction: "stopMotor()" },
        { id: "door-open", name: "DoorOpen", entryAction: "openDoor(); startDoorTimer()", exitAction: "cancelDoorTimer()" },
        { id: "door-closing", name: "DoorClosing", entryAction: "closeDoor()", exitAction: "reportDoorStatus()" },
        { id: "emergency-stop", name: "EmergencyStop", entryAction: "stopMotor(); soundAlarm(); notifyEmergencyServices()", exitAction: "silenceAlarm()" },
      ],
      transitions: [
        // ── Normal operation ──
        { id: "t1", from: "idle", to: "moving-up", trigger: "requestFloor(n)", guard: "requestedFloor > currentFloor", action: "updateFloorDisplay()" },
        { id: "t2", from: "idle", to: "moving-down", trigger: "requestFloor(n)", guard: "requestedFloor < currentFloor", action: "updateFloorDisplay()" },
        { id: "t3", from: "moving-up", to: "door-open", trigger: "arrivedAtFloor()", action: "updateFloorDisplay()" },
        { id: "t4", from: "moving-down", to: "door-open", trigger: "arrivedAtFloor()", action: "updateFloorDisplay()" },
        { id: "t5", from: "door-open", to: "door-closing", trigger: "doorTimer(5s)", guard: "doorClear", action: "closeDoor()" },
        { id: "t6", from: "door-closing", to: "idle", trigger: "doorClosed()", guard: "!emergencyActive", action: "checkPendingRequests()" },
        // ── Door obstruction ──
        { id: "t7", from: "door-closing", to: "door-open", trigger: "obstacleDetected()", action: "openDoor(); resetDoorTimer()" },
        // ── Emergency ──
        { id: "t8", from: "moving-up", to: "emergency-stop", trigger: "emergencyButton()", action: "soundAlarm()" },
        { id: "t9", from: "moving-down", to: "emergency-stop", trigger: "emergencyButton()", action: "soundAlarm()" },
        { id: "t10", from: "door-open", to: "emergency-stop", trigger: "emergencyButton()", action: "soundAlarm()" },
        { id: "t11", from: "idle", to: "emergency-stop", trigger: "emergencyButton()", action: "soundAlarm()" },
        { id: "t12", from: "emergency-stop", to: "idle", trigger: "emergencyReset()", guard: "!emergencyActive", action: "silenceAlarm(); runDiagnostics()" },
        // ── Idle → DoorOpen for same-floor request ──
        { id: "t13", from: "idle", to: "door-open", trigger: "requestFloor(n)", guard: "requestedFloor == currentFloor", action: "openDoor()" },
      ],
    },
  },

  // 11. ATM Session
  {
    id: "atm-session",
    name: "ATM Session",
    description:
      "ATM transaction flow from card insertion through PIN verification, transaction selection, cash dispensing, and card ejection. Includes PIN retry limits with card retention, balance checks, and receipt printing. Models the complete self-service banking session lifecycle.",
    data: {
      states: [
        { id: "idle", name: "Idle", isInitial: true, entryAction: "displayWelcomeScreen()", exitAction: "initializeSession()" },
        { id: "card-inserted", name: "CardInserted", entryAction: "readCardData()", exitAction: "validateCard()" },
        { id: "pin-entry", name: "PINEntry", entryAction: "displayPINPrompt(); resetAttempts()", exitAction: "maskPINDisplay()" },
        { id: "pin-verified", name: "PINVerified", entryAction: "loadAccountInfo()", exitAction: "clearSensitiveData()" },
        { id: "selecting-transaction", name: "SelectingTransaction", entryAction: "displayTransactionMenu()", exitAction: "logSelection()" },
        { id: "processing", name: "Processing", entryAction: "displayProcessingScreen(); contactBank()", exitAction: "recordTransactionResult()" },
        { id: "dispensing", name: "Dispensing", entryAction: "dispenseCash(); printReceipt()", exitAction: "updateCashInventory()" },
        { id: "ejecting-card", name: "EjectingCard", entryAction: "ejectCard(); displayRemoveCardPrompt()", exitAction: "endSession()" },
      ],
      transitions: [
        { id: "t1", from: "idle", to: "card-inserted", trigger: "insertCard()", action: "readCardData()" },
        { id: "t2", from: "card-inserted", to: "pin-entry", trigger: "cardReadSuccess()", action: "displayPINPrompt()" },
        { id: "t3", from: "pin-entry", to: "pin-verified", trigger: "enterPIN()", guard: "pinCorrect", action: "validatePIN()" },
        { id: "t4", from: "pin-entry", to: "pin-entry", trigger: "enterPIN()", guard: "!pinCorrect && attemptsRemaining > 0", action: "incrementAttempts(); displayRetryPrompt()" },
        { id: "t5", from: "pin-entry", to: "ejecting-card", trigger: "enterPIN()", guard: "!pinCorrect && attemptsRemaining == 0", action: "retainCard(); displayCardRetainedMessage()" },
        { id: "t6", from: "pin-verified", to: "selecting-transaction", trigger: "continue()", action: "displayTransactionMenu()" },
        { id: "t7", from: "selecting-transaction", to: "processing", trigger: "selectWithdrawal(amount)", guard: "balanceSufficient", action: "checkBalance()" },
        { id: "t8", from: "selecting-transaction", to: "selecting-transaction", trigger: "selectWithdrawal(amount)", guard: "!balanceSufficient", action: "displayInsufficientFunds()" },
        { id: "t9", from: "processing", to: "dispensing", trigger: "transactionApproved()", guard: "cashAvailable", action: "dispenseCash()" },
        { id: "t10", from: "processing", to: "selecting-transaction", trigger: "transactionDenied()", action: "displayDenialReason()" },
        { id: "t11", from: "dispensing", to: "ejecting-card", trigger: "cashTaken()", action: "printReceipt()" },
        { id: "t12", from: "ejecting-card", to: "idle", trigger: "cardTaken()", action: "resetSession()" },
        { id: "t13", from: "selecting-transaction", to: "ejecting-card", trigger: "cancel()", action: "logCancellation()" },
        { id: "t14", from: "card-inserted", to: "ejecting-card", trigger: "cardReadFailed()", action: "displayCardError()" },
      ],
    },
  },
];

// ── Helpers ──────────────────────────────────────────────────

export function getStateMachineExampleById(
  id: string,
): (typeof STATE_MACHINE_EXAMPLES)[number] | undefined {
  return STATE_MACHINE_EXAMPLES.find((e) => e.id === id);
}
