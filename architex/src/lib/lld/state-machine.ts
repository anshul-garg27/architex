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
        { id: "cancelled", name: "Cancelled", isFinal: true, entryAction: "refundPayment()", exitAction: "releaseInventory()" },
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

  // 2. TCP Connection
  {
    id: "tcp-connection",
    name: "TCP Connection",
    description:
      "Simplified TCP connection state machine showing the key states of a TCP socket from CLOSED through ESTABLISHED and back to CLOSED via the FIN handshake.",
    data: {
      states: [
        { id: "closed", name: "CLOSED", isInitial: true, isFinal: true },
        { id: "listen", name: "LISTEN", entryAction: "openSocket()" },
        { id: "syn-sent", name: "SYN_SENT", entryAction: "startTimer()" },
        { id: "syn-rcvd", name: "SYN_RCVD" },
        { id: "established", name: "ESTABLISHED", entryAction: "connectionReady()", exitAction: "flushBuffers()" },
        { id: "fin-wait", name: "FIN_WAIT", entryAction: "startCloseTimer()" },
      ],
      transitions: [
        { id: "t1", from: "closed", to: "listen", trigger: "passive open", action: "createTCB()" },
        { id: "t2", from: "closed", to: "syn-sent", trigger: "active open", action: "sendSYN()" },
        { id: "t3", from: "listen", to: "syn-rcvd", trigger: "rcv SYN", action: "sendSYN+ACK()" },
        { id: "t4", from: "syn-sent", to: "established", trigger: "rcv SYN+ACK", action: "sendACK()" },
        { id: "t5", from: "syn-rcvd", to: "established", trigger: "rcv ACK" },
        { id: "t6", from: "established", to: "fin-wait", trigger: "close()", action: "sendFIN()" },
        { id: "t7", from: "fin-wait", to: "closed", trigger: "rcv ACK", action: "deleteTCB()" },
        { id: "t8", from: "listen", to: "closed", trigger: "close()" },
      ],
    },
  },

  // 3. Traffic Light
  {
    id: "traffic-light",
    name: "Traffic Light",
    description:
      "A simple cyclic state machine for a traffic light controller. Each light phase has a timed trigger that advances to the next state.",
    data: {
      states: [
        { id: "red", name: "Red", isInitial: true, entryAction: "enableRedLamp()", exitAction: "disableRedLamp()" },
        { id: "green", name: "Green", entryAction: "enableGreenLamp()", exitAction: "disableGreenLamp()" },
        { id: "yellow", name: "Yellow", entryAction: "enableYellowLamp()", exitAction: "disableYellowLamp()" },
      ],
      transitions: [
        { id: "t1", from: "red", to: "green", trigger: "timer(60s)", action: "resetTimer()" },
        { id: "t2", from: "green", to: "yellow", trigger: "timer(45s)", action: "resetTimer()" },
        { id: "t3", from: "yellow", to: "red", trigger: "timer(5s)", action: "resetTimer()" },
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
        { id: "succeeded", name: "Succeeded", isFinal: true, entryAction: "sendReceipt()", exitAction: "archiveTransaction()" },
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
];

// ── Helpers ──────────────────────────────────────────────────

export function getStateMachineExampleById(
  id: string,
): (typeof STATE_MACHINE_EXAMPLES)[number] | undefined {
  return STATE_MACHINE_EXAMPLES.find((e) => e.id === id);
}
