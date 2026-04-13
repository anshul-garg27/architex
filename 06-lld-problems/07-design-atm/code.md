# Design an ATM System -- Complete Java Implementation

## Table of Contents

1. [TransactionType Enum](#1-transactiontype-enum)
2. [Card](#2-card)
3. [Account](#3-account)
4. [Transaction](#4-transaction)
5. [CashSlot](#5-cashslot)
6. [DispenseChain Interface](#6-dispensechain-interface)
7. [DenominationHandler](#7-denominationhandler)
8. [CashDispenser](#8-cashdispenser)
9. [ATMState Interface](#9-atmstate-interface)
10. [IdleState](#10-idlestate)
11. [CardInsertedState](#11-cardinsertedstate)
12. [AuthenticatedState](#12-authenticatedstate)
13. [TransactionSelectedState](#13-transactionselectedstate)
14. [ProcessingState](#14-processingstate)
15. [TransactionStrategy Interface](#15-transactionstrategy-interface)
16. [BalanceInquiry](#16-balanceinquiry)
17. [WithdrawTransaction](#17-withdrawtransaction)
18. [DepositTransaction](#18-deposittransaction)
19. [TransferTransaction](#19-transfertransaction)
20. [TransactionStrategyFactory](#20-transactionstrategyfactory)
21. [ATM](#21-atm)
22. [ATMDemo (Main)](#22-atmdemo-main)

---

## 1. TransactionType Enum

```java
public enum TransactionType {
    BALANCE_INQUIRY,
    WITHDRAWAL,
    DEPOSIT,
    TRANSFER
}
```

---

## 2. Card

```java
public class Card {
    private final String cardNumber;
    private final String accountNumber;
    private boolean blocked;

    public Card(String cardNumber, String accountNumber) {
        this.cardNumber = cardNumber;
        this.accountNumber = accountNumber;
        this.blocked = false;
    }

    public String getCardNumber() {
        return cardNumber;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public boolean isBlocked() {
        return blocked;
    }

    public void setBlocked(boolean blocked) {
        this.blocked = blocked;
    }

    @Override
    public String toString() {
        return "Card[" + cardNumber + "]";
    }
}
```

---

## 3. Account

```java
public class Account {
    private final String accountNumber;
    private final String holderName;
    private int balance; // in smallest currency unit
    private final String pin;

    public Account(String accountNumber, String holderName, int balance, String pin) {
        this.accountNumber = accountNumber;
        this.holderName = holderName;
        this.balance = balance;
        this.pin = pin;
    }

    public boolean validatePin(String enteredPin) {
        return this.pin.equals(enteredPin);
    }

    public int getBalance() {
        return balance;
    }

    public boolean debit(int amount) {
        if (amount <= 0) {
            System.out.println("  [Account] Invalid debit amount.");
            return false;
        }
        if (balance < amount) {
            System.out.println("  [Account] Insufficient funds. Balance: " + balance
                    + ", Requested: " + amount);
            return false;
        }
        balance -= amount;
        return true;
    }

    public void credit(int amount) {
        if (amount <= 0) {
            System.out.println("  [Account] Invalid credit amount.");
            return;
        }
        balance += amount;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public String getHolderName() {
        return holderName;
    }

    @Override
    public String toString() {
        return "Account[" + accountNumber + ", " + holderName + ", balance=" + balance + "]";
    }
}
```

---

## 4. Transaction

```java
import java.util.Map;
import java.util.UUID;

public class Transaction {
    private final String transactionId;
    private final TransactionType type;
    private final int amount;
    private final long timestamp;
    private final String accountNumber;
    private final String targetAccountNumber; // null unless TRANSFER
    private final String status;
    private final int balanceAfter;
    private final Map<Integer, Integer> denominationBreakdown; // null unless WITHDRAWAL

    public Transaction(TransactionType type, int amount, String accountNumber,
                       String targetAccountNumber, String status, int balanceAfter,
                       Map<Integer, Integer> denominationBreakdown) {
        this.transactionId = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.type = type;
        this.amount = amount;
        this.timestamp = System.currentTimeMillis();
        this.accountNumber = accountNumber;
        this.targetAccountNumber = targetAccountNumber;
        this.status = status;
        this.balanceAfter = balanceAfter;
        this.denominationBreakdown = denominationBreakdown;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public TransactionType getType() {
        return type;
    }

    public String getStatus() {
        return status;
    }

    public String getReceipt() {
        StringBuilder sb = new StringBuilder();
        sb.append("  ╔══════════════════════════════════════╗\n");
        sb.append("  ║           ATM RECEIPT                ║\n");
        sb.append("  ╠══════════════════════════════════════╣\n");
        sb.append("  ║  Transaction ID : ").append(transactionId).append("              ║\n");
        sb.append("  ║  Type           : ").append(type).append("\n");
        sb.append("  ║  Account        : ").append(accountNumber).append("\n");
        if (targetAccountNumber != null) {
            sb.append("  ║  Transfer To    : ").append(targetAccountNumber).append("\n");
        }
        if (amount > 0) {
            sb.append("  ║  Amount         : ").append(amount).append("\n");
        }
        if (denominationBreakdown != null && !denominationBreakdown.isEmpty()) {
            sb.append("  ║  Notes Dispensed :\n");
            for (Map.Entry<Integer, Integer> entry : denominationBreakdown.entrySet()) {
                sb.append("  ║    ").append(entry.getKey()).append(" x ")
                  .append(entry.getValue()).append(" = ")
                  .append(entry.getKey() * entry.getValue()).append("\n");
            }
        }
        sb.append("  ║  Balance After  : ").append(balanceAfter).append("\n");
        sb.append("  ║  Status         : ").append(status).append("\n");
        sb.append("  ╚══════════════════════════════════════╝");
        return sb.toString();
    }
}
```

---

## 5. CashSlot

```java
public class CashSlot {
    private final int denomination;
    private int count;

    public CashSlot(int denomination, int count) {
        this.denomination = denomination;
        this.count = count;
    }

    public int getDenomination() {
        return denomination;
    }

    public int getCount() {
        return count;
    }

    public void dispenseNotes(int num) {
        if (num > count) {
            throw new IllegalStateException("Cannot dispense " + num
                    + " notes of " + denomination + ". Only " + count + " available.");
        }
        count -= num;
    }

    public void addNotes(int num) {
        count += num;
    }

    public int getTotalValue() {
        return denomination * count;
    }

    @Override
    public String toString() {
        return denomination + " x " + count + " = " + getTotalValue();
    }
}
```

---

## 6. DispenseChain Interface

```java
import java.util.Map;

/**
 * Chain of Responsibility interface for cash dispensing.
 * Each handler is responsible for one denomination.
 */
public interface DispenseChain {

    /**
     * Set the next handler in the chain.
     */
    void setNextChain(DispenseChain next);

    /**
     * Attempt to dispense the given amount using this denomination.
     * Puts dispensed note counts into the result map.
     * Passes the remainder to the next chain link.
     *
     * @param amount the remaining amount to dispense
     * @param result accumulator map: denomination -> note count
     * @return true if the full amount was dispensed (remainder == 0)
     */
    boolean dispense(int amount, Map<Integer, Integer> result);
}
```

---

## 7. DenominationHandler

```java
import java.util.Map;

/**
 * Concrete handler in the Chain of Responsibility.
 * Handles a single denomination and delegates the remainder.
 */
public class DenominationHandler implements DispenseChain {
    private final CashSlot cashSlot;
    private DispenseChain nextChain;

    public DenominationHandler(CashSlot cashSlot) {
        this.cashSlot = cashSlot;
    }

    @Override
    public void setNextChain(DispenseChain next) {
        this.nextChain = next;
    }

    @Override
    public boolean dispense(int amount, Map<Integer, Integer> result) {
        if (amount <= 0) {
            return true; // nothing left to dispense
        }

        int denomination = cashSlot.getDenomination();
        int notesNeeded = amount / denomination;
        int notesAvailable = cashSlot.getCount();
        int notesToDispense = Math.min(notesNeeded, notesAvailable);

        if (notesToDispense > 0) {
            result.put(denomination, notesToDispense);
        }

        int remainder = amount - (notesToDispense * denomination);

        if (remainder == 0) {
            return true; // fully dispensed
        }

        // Pass remainder to next handler
        if (nextChain != null) {
            return nextChain.dispense(remainder, result);
        }

        // No more handlers and remainder > 0: cannot dispense
        return false;
    }

    public CashSlot getCashSlot() {
        return cashSlot;
    }
}
```

---

## 8. CashDispenser

```java
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Manages the physical cash in the ATM.
 * Builds a Chain of Responsibility from highest to lowest denomination.
 */
public class CashDispenser {
    private final List<CashSlot> cashSlots;
    private final List<DenominationHandler> handlers;
    private DispenseChain chainHead;

    public CashDispenser() {
        this.cashSlots = new ArrayList<>();
        this.handlers = new ArrayList<>();
    }

    /**
     * Initialise the dispenser with denominations in descending order.
     * Must be called after all cash slots are added.
     */
    public void addCashSlot(CashSlot slot) {
        cashSlots.add(slot);
    }

    /**
     * Build the chain of responsibility. Slots must be added in
     * descending denomination order before calling this.
     */
    public void buildChain() {
        handlers.clear();
        for (CashSlot slot : cashSlots) {
            handlers.add(new DenominationHandler(slot));
        }
        // Link the chain: each handler points to the next
        for (int i = 0; i < handlers.size() - 1; i++) {
            handlers.get(i).setNextChain(handlers.get(i + 1));
        }
        if (!handlers.isEmpty()) {
            chainHead = handlers.get(0);
        }
    }

    /**
     * Check if the ATM can dispense the requested amount.
     * Does a dry-run without modifying note counts.
     */
    public boolean canDispense(int amount) {
        if (amount <= 0 || amount % 100 != 0) {
            return false;
        }
        if (chainHead == null) {
            return false;
        }
        // Dry run: simulate dispensing
        Map<Integer, Integer> dryRunResult = new LinkedHashMap<>();
        return chainHead.dispense(amount, dryRunResult);
    }

    /**
     * Dispense the requested amount. Returns a map of denomination -> note count.
     * Actually decrements note counts from cash slots.
     *
     * @throws IllegalStateException if the amount cannot be dispensed
     */
    public Map<Integer, Integer> dispense(int amount) {
        if (!canDispense(amount)) {
            throw new IllegalStateException("Cannot dispense " + amount);
        }

        Map<Integer, Integer> result = new LinkedHashMap<>();
        chainHead.dispense(amount, result);

        // Commit: actually remove notes from the slots
        for (Map.Entry<Integer, Integer> entry : result.entrySet()) {
            int denomination = entry.getKey();
            int count = entry.getValue();
            for (CashSlot slot : cashSlots) {
                if (slot.getDenomination() == denomination) {
                    slot.dispenseNotes(count);
                    break;
                }
            }
        }

        return result;
    }

    public int getTotalCash() {
        int total = 0;
        for (CashSlot slot : cashSlots) {
            total += slot.getTotalValue();
        }
        return total;
    }

    public void printCashInventory() {
        System.out.println("  [CashDispenser] Current inventory:");
        for (CashSlot slot : cashSlots) {
            System.out.println("    " + slot);
        }
        System.out.println("    Total: " + getTotalCash());
    }
}
```

---

## 9. ATMState Interface

```java
/**
 * State pattern interface. Every ATM state implements this contract.
 * Each method corresponds to a user action on the ATM.
 */
public interface ATMState {

    void insertCard(Card card);

    void authenticatePin(String pin);

    void selectTransaction(TransactionType type);

    void executeTransaction(int amount);

    /**
     * Overloaded for transfers that need a target account.
     */
    void executeTransaction(int amount, String targetAccountNumber);

    void ejectCard();
}
```

---

## 10. IdleState

```java
/**
 * The ATM is waiting for a card. Only insertCard() is meaningful.
 */
public class IdleState implements ATMState {
    private final ATM atm;

    public IdleState(ATM atm) {
        this.atm = atm;
    }

    @Override
    public void insertCard(Card card) {
        if (card.isBlocked()) {
            System.out.println("  [IdleState] This card is blocked. Please contact your bank.");
            return;
        }
        System.out.println("  [IdleState] Card inserted: " + card);
        atm.setCurrentCard(card);
        atm.setFailedPinAttempts(0);
        atm.setState(new CardInsertedState(atm));
    }

    @Override
    public void authenticatePin(String pin) {
        System.out.println("  [IdleState] No card inserted. Please insert your card first.");
    }

    @Override
    public void selectTransaction(TransactionType type) {
        System.out.println("  [IdleState] No card inserted. Please insert your card first.");
    }

    @Override
    public void executeTransaction(int amount) {
        System.out.println("  [IdleState] No card inserted. Please insert your card first.");
    }

    @Override
    public void executeTransaction(int amount, String targetAccountNumber) {
        System.out.println("  [IdleState] No card inserted. Please insert your card first.");
    }

    @Override
    public void ejectCard() {
        System.out.println("  [IdleState] No card to eject.");
    }

    @Override
    public String toString() {
        return "IdleState";
    }
}
```

---

## 11. CardInsertedState

```java
/**
 * A card is in the machine. Only PIN entry and card ejection are allowed.
 */
public class CardInsertedState implements ATMState {
    private static final int MAX_PIN_ATTEMPTS = 3;
    private final ATM atm;

    public CardInsertedState(ATM atm) {
        this.atm = atm;
    }

    @Override
    public void insertCard(Card card) {
        System.out.println("  [CardInsertedState] A card is already inserted.");
    }

    @Override
    public void authenticatePin(String pin) {
        Account account = atm.getAccountForCurrentCard();
        if (account == null) {
            System.out.println("  [CardInsertedState] Account not found. Ejecting card.");
            atm.ejectCard();
            return;
        }

        if (account.validatePin(pin)) {
            System.out.println("  [CardInsertedState] PIN accepted. Welcome, "
                    + account.getHolderName() + "!");
            atm.setCurrentAccount(account);
            atm.setFailedPinAttempts(0);
            atm.setState(new AuthenticatedState(atm));
        } else {
            int attempts = atm.getFailedPinAttempts() + 1;
            atm.setFailedPinAttempts(attempts);
            int remaining = MAX_PIN_ATTEMPTS - attempts;

            if (remaining <= 0) {
                System.out.println("  [CardInsertedState] Too many failed attempts. "
                        + "Card has been BLOCKED.");
                atm.getCurrentCard().setBlocked(true);
                ejectCard();
            } else {
                System.out.println("  [CardInsertedState] Incorrect PIN. "
                        + remaining + " attempt(s) remaining.");
            }
        }
    }

    @Override
    public void selectTransaction(TransactionType type) {
        System.out.println("  [CardInsertedState] Please authenticate first.");
    }

    @Override
    public void executeTransaction(int amount) {
        System.out.println("  [CardInsertedState] Please authenticate first.");
    }

    @Override
    public void executeTransaction(int amount, String targetAccountNumber) {
        System.out.println("  [CardInsertedState] Please authenticate first.");
    }

    @Override
    public void ejectCard() {
        System.out.println("  [CardInsertedState] Ejecting card: " + atm.getCurrentCard());
        atm.setCurrentCard(null);
        atm.setCurrentAccount(null);
        atm.setSelectedTransactionType(null);
        atm.setState(new IdleState(atm));
    }

    @Override
    public String toString() {
        return "CardInsertedState";
    }
}
```

---

## 12. AuthenticatedState

```java
/**
 * The user is authenticated. They can select a transaction type or eject the card.
 */
public class AuthenticatedState implements ATMState {
    private final ATM atm;

    public AuthenticatedState(ATM atm) {
        this.atm = atm;
    }

    @Override
    public void insertCard(Card card) {
        System.out.println("  [AuthenticatedState] A card is already inserted.");
    }

    @Override
    public void authenticatePin(String pin) {
        System.out.println("  [AuthenticatedState] Already authenticated.");
    }

    @Override
    public void selectTransaction(TransactionType type) {
        System.out.println("  [AuthenticatedState] Transaction selected: " + type);
        atm.setSelectedTransactionType(type);
        atm.setState(new TransactionSelectedState(atm));
    }

    @Override
    public void executeTransaction(int amount) {
        System.out.println("  [AuthenticatedState] Please select a transaction type first.");
    }

    @Override
    public void executeTransaction(int amount, String targetAccountNumber) {
        System.out.println("  [AuthenticatedState] Please select a transaction type first.");
    }

    @Override
    public void ejectCard() {
        System.out.println("  [AuthenticatedState] Ending session. Ejecting card.");
        atm.setCurrentCard(null);
        atm.setCurrentAccount(null);
        atm.setSelectedTransactionType(null);
        atm.setState(new IdleState(atm));
    }

    @Override
    public String toString() {
        return "AuthenticatedState";
    }
}
```

---

## 13. TransactionSelectedState

```java
/**
 * The user has chosen a transaction type. Now they enter the amount (or
 * target account for transfers). They can also go back by ejecting.
 */
public class TransactionSelectedState implements ATMState {
    private final ATM atm;

    public TransactionSelectedState(ATM atm) {
        this.atm = atm;
    }

    @Override
    public void insertCard(Card card) {
        System.out.println("  [TransactionSelectedState] A card is already inserted.");
    }

    @Override
    public void authenticatePin(String pin) {
        System.out.println("  [TransactionSelectedState] Already authenticated.");
    }

    @Override
    public void selectTransaction(TransactionType type) {
        System.out.println("  [TransactionSelectedState] Changing selection to: " + type);
        atm.setSelectedTransactionType(type);
    }

    @Override
    public void executeTransaction(int amount) {
        executeTransaction(amount, null);
    }

    @Override
    public void executeTransaction(int amount, String targetAccountNumber) {
        System.out.println("  [TransactionSelectedState] Processing "
                + atm.getSelectedTransactionType() + "...");
        atm.setTargetAccountNumber(targetAccountNumber);
        atm.setState(new ProcessingState(atm));
        // Delegate to ProcessingState to carry out the transaction
        atm.getCurrentState().executeTransaction(amount, targetAccountNumber);
    }

    @Override
    public void ejectCard() {
        System.out.println("  [TransactionSelectedState] Cancelling selection. "
                + "Returning to menu.");
        atm.setSelectedTransactionType(null);
        atm.setState(new AuthenticatedState(atm));
    }

    @Override
    public String toString() {
        return "TransactionSelectedState";
    }
}
```

---

## 14. ProcessingState

```java
import java.util.Map;

/**
 * The transaction is being executed. Uses the Strategy pattern to delegate
 * to the correct TransactionStrategy implementation.
 */
public class ProcessingState implements ATMState {
    private final ATM atm;

    public ProcessingState(ATM atm) {
        this.atm = atm;
    }

    @Override
    public void insertCard(Card card) {
        System.out.println("  [ProcessingState] Transaction in progress. Please wait.");
    }

    @Override
    public void authenticatePin(String pin) {
        System.out.println("  [ProcessingState] Transaction in progress. Please wait.");
    }

    @Override
    public void selectTransaction(TransactionType type) {
        System.out.println("  [ProcessingState] Transaction in progress. Please wait.");
    }

    @Override
    public void executeTransaction(int amount) {
        executeTransaction(amount, null);
    }

    @Override
    public void executeTransaction(int amount, String targetAccountNumber) {
        TransactionType type = atm.getSelectedTransactionType();
        TransactionStrategy strategy = TransactionStrategyFactory.getStrategy(
                type, targetAccountNumber);

        Transaction transaction = strategy.execute(atm, amount);

        if (transaction != null) {
            System.out.println("\n" + transaction.getReceipt() + "\n");
        }

        // Return to Authenticated so the user can do another transaction
        atm.setSelectedTransactionType(null);
        atm.setState(new AuthenticatedState(atm));
    }

    @Override
    public void ejectCard() {
        System.out.println("  [ProcessingState] Cannot eject during processing. Please wait.");
    }

    @Override
    public String toString() {
        return "ProcessingState";
    }
}
```

---

## 15. TransactionStrategy Interface

```java
/**
 * Strategy pattern interface for different transaction types.
 */
public interface TransactionStrategy {

    /**
     * Execute the transaction against the given ATM context.
     *
     * @param atm    the ATM providing account and dispenser access
     * @param amount the monetary amount (0 for balance inquiry)
     * @return the completed Transaction record, or null on failure
     */
    Transaction execute(ATM atm, int amount);
}
```

---

## 16. BalanceInquiry

```java
/**
 * Strategy: read and display the account balance.
 */
public class BalanceInquiry implements TransactionStrategy {

    @Override
    public Transaction execute(ATM atm, int amount) {
        Account account = atm.getCurrentAccount();
        int balance = account.getBalance();

        System.out.println("  [BalanceInquiry] Your current balance is: " + balance);

        return new Transaction(
                TransactionType.BALANCE_INQUIRY,
                0,
                account.getAccountNumber(),
                null,
                "SUCCESS",
                balance,
                null
        );
    }
}
```

---

## 17. WithdrawTransaction

```java
import java.util.Map;

/**
 * Strategy: withdraw cash with denomination breakdown.
 * Uses the CashDispenser's Chain of Responsibility.
 */
public class WithdrawTransaction implements TransactionStrategy {

    @Override
    public Transaction execute(ATM atm, int amount) {
        Account account = atm.getCurrentAccount();
        CashDispenser dispenser = atm.getCashDispenser();

        // Validate amount is a multiple of 100
        if (amount <= 0 || amount % 100 != 0) {
            System.out.println("  [Withdraw] Amount must be a positive multiple of 100. "
                    + "Entered: " + amount);
            return new Transaction(
                    TransactionType.WITHDRAWAL, amount, account.getAccountNumber(),
                    null, "FAILED", account.getBalance(), null
            );
        }

        // Check account balance
        if (account.getBalance() < amount) {
            System.out.println("  [Withdraw] Insufficient funds. Balance: "
                    + account.getBalance() + ", Requested: " + amount);
            return new Transaction(
                    TransactionType.WITHDRAWAL, amount, account.getAccountNumber(),
                    null, "FAILED", account.getBalance(), null
            );
        }

        // Check ATM cash availability
        if (!dispenser.canDispense(amount)) {
            System.out.println("  [Withdraw] ATM cannot dispense " + amount
                    + ". Insufficient notes.");
            return new Transaction(
                    TransactionType.WITHDRAWAL, amount, account.getAccountNumber(),
                    null, "FAILED", account.getBalance(), null
            );
        }

        // Dispense cash (Chain of Responsibility runs here)
        Map<Integer, Integer> notes = dispenser.dispense(amount);

        // Debit the account
        account.debit(amount);

        System.out.println("  [Withdraw] Dispensing " + amount + ":");
        for (Map.Entry<Integer, Integer> entry : notes.entrySet()) {
            System.out.println("    " + entry.getKey() + " x " + entry.getValue()
                    + " = " + (entry.getKey() * entry.getValue()));
        }
        System.out.println("  [Withdraw] Please collect your cash.");

        return new Transaction(
                TransactionType.WITHDRAWAL, amount, account.getAccountNumber(),
                null, "SUCCESS", account.getBalance(), notes
        );
    }
}
```

---

## 18. DepositTransaction

```java
/**
 * Strategy: deposit cash into the account.
 */
public class DepositTransaction implements TransactionStrategy {

    @Override
    public Transaction execute(ATM atm, int amount) {
        Account account = atm.getCurrentAccount();

        if (amount <= 0) {
            System.out.println("  [Deposit] Amount must be positive. Entered: " + amount);
            return new Transaction(
                    TransactionType.DEPOSIT, amount, account.getAccountNumber(),
                    null, "FAILED", account.getBalance(), null
            );
        }

        // Credit the account
        account.credit(amount);
        System.out.println("  [Deposit] " + amount + " deposited successfully.");
        System.out.println("  [Deposit] New balance: " + account.getBalance());

        return new Transaction(
                TransactionType.DEPOSIT, amount, account.getAccountNumber(),
                null, "SUCCESS", account.getBalance(), null
        );
    }
}
```

---

## 19. TransferTransaction

```java
/**
 * Strategy: transfer funds from the current account to a target account.
 */
public class TransferTransaction implements TransactionStrategy {
    private final String targetAccountNumber;

    public TransferTransaction(String targetAccountNumber) {
        this.targetAccountNumber = targetAccountNumber;
    }

    @Override
    public Transaction execute(ATM atm, int amount) {
        Account source = atm.getCurrentAccount();

        if (amount <= 0) {
            System.out.println("  [Transfer] Amount must be positive.");
            return new Transaction(
                    TransactionType.TRANSFER, amount, source.getAccountNumber(),
                    targetAccountNumber, "FAILED", source.getBalance(), null
            );
        }

        // Look up target account
        Account target = atm.getAccount(targetAccountNumber);
        if (target == null) {
            System.out.println("  [Transfer] Target account " + targetAccountNumber
                    + " not found.");
            return new Transaction(
                    TransactionType.TRANSFER, amount, source.getAccountNumber(),
                    targetAccountNumber, "FAILED", source.getBalance(), null
            );
        }

        // Check source balance
        if (source.getBalance() < amount) {
            System.out.println("  [Transfer] Insufficient funds. Balance: "
                    + source.getBalance() + ", Requested: " + amount);
            return new Transaction(
                    TransactionType.TRANSFER, amount, source.getAccountNumber(),
                    targetAccountNumber, "FAILED", source.getBalance(), null
            );
        }

        // Execute transfer
        source.debit(amount);
        target.credit(amount);

        System.out.println("  [Transfer] " + amount + " transferred from "
                + source.getAccountNumber() + " to " + target.getAccountNumber());
        System.out.println("  [Transfer] Your new balance: " + source.getBalance());

        return new Transaction(
                TransactionType.TRANSFER, amount, source.getAccountNumber(),
                targetAccountNumber, "SUCCESS", source.getBalance(), null
        );
    }
}
```

---

## 20. TransactionStrategyFactory

```java
/**
 * Factory that maps TransactionType to the correct Strategy implementation.
 */
public class TransactionStrategyFactory {

    public static TransactionStrategy getStrategy(TransactionType type,
                                                   String targetAccountNumber) {
        switch (type) {
            case BALANCE_INQUIRY:
                return new BalanceInquiry();
            case WITHDRAWAL:
                return new WithdrawTransaction();
            case DEPOSIT:
                return new DepositTransaction();
            case TRANSFER:
                return new TransferTransaction(targetAccountNumber);
            default:
                throw new IllegalArgumentException("Unknown transaction type: " + type);
        }
    }
}
```

---

## 21. ATM

```java
import java.util.HashMap;
import java.util.Map;

/**
 * The ATM context class. Delegates all user actions to the current state.
 * Manages session data: current card, account, transaction type.
 */
public class ATM {
    private ATMState currentState;
    private final CashDispenser cashDispenser;
    private Card currentCard;
    private Account currentAccount;
    private TransactionType selectedTransactionType;
    private String targetAccountNumber;
    private int failedPinAttempts;
    private final Map<String, Account> accountStore; // simulates bank database

    public ATM() {
        this.accountStore = new HashMap<>();
        this.cashDispenser = new CashDispenser();
        this.currentState = new IdleState(this);
        this.failedPinAttempts = 0;
    }

    // ---- User actions (delegated to current state) ----

    public void insertCard(Card card) {
        System.out.println("\n>> ACTION: Insert card " + card.getCardNumber());
        currentState.insertCard(card);
    }

    public void authenticatePin(String pin) {
        System.out.println("\n>> ACTION: Enter PIN ****");
        currentState.authenticatePin(pin);
    }

    public void selectTransaction(TransactionType type) {
        System.out.println("\n>> ACTION: Select " + type);
        currentState.selectTransaction(type);
    }

    public void executeTransaction(int amount) {
        System.out.println("\n>> ACTION: Execute with amount " + amount);
        currentState.executeTransaction(amount);
    }

    public void executeTransaction(int amount, String targetAccountNumber) {
        System.out.println("\n>> ACTION: Execute transfer of " + amount
                + " to " + targetAccountNumber);
        currentState.executeTransaction(amount, targetAccountNumber);
    }

    public void ejectCard() {
        System.out.println("\n>> ACTION: Eject card");
        currentState.ejectCard();
    }

    // ---- State management ----

    public void setState(ATMState state) {
        System.out.println("  [ATM] State transition: " + currentState + " -> " + state);
        this.currentState = state;
    }

    public ATMState getCurrentState() {
        return currentState;
    }

    // ---- Session data getters/setters ----

    public Card getCurrentCard() {
        return currentCard;
    }

    public void setCurrentCard(Card card) {
        this.currentCard = card;
    }

    public Account getCurrentAccount() {
        return currentAccount;
    }

    public void setCurrentAccount(Account account) {
        this.currentAccount = account;
    }

    public TransactionType getSelectedTransactionType() {
        return selectedTransactionType;
    }

    public void setSelectedTransactionType(TransactionType type) {
        this.selectedTransactionType = type;
    }

    public String getTargetAccountNumber() {
        return targetAccountNumber;
    }

    public void setTargetAccountNumber(String targetAccountNumber) {
        this.targetAccountNumber = targetAccountNumber;
    }

    public int getFailedPinAttempts() {
        return failedPinAttempts;
    }

    public void setFailedPinAttempts(int attempts) {
        this.failedPinAttempts = attempts;
    }

    public CashDispenser getCashDispenser() {
        return cashDispenser;
    }

    // ---- Account store (simulated bank) ----

    public void addAccount(Account account) {
        accountStore.put(account.getAccountNumber(), account);
    }

    public Account getAccount(String accountNumber) {
        return accountStore.get(accountNumber);
    }

    public Account getAccountForCurrentCard() {
        if (currentCard == null) return null;
        return accountStore.get(currentCard.getAccountNumber());
    }
}
```

---

## 22. ATMDemo (Main)

```java
/**
 * Full demonstration of the ATM system:
 * 1. Setup ATM with cash and accounts
 * 2. Insert card, enter PIN, check balance
 * 3. Withdraw with denomination breakdown
 * 4. Deposit cash
 * 5. Transfer to another account
 * 6. Eject card
 * 7. Invalid PIN lockout scenario
 */
public class ATMDemo {

    public static void main(String[] args) {

        // ============================================================
        // SETUP
        // ============================================================
        System.out.println("========================================");
        System.out.println("       ATM SYSTEM -- DEMO");
        System.out.println("========================================");

        ATM atm = new ATM();

        // Load cash into the ATM: 2000 x 10, 500 x 20, 200 x 15, 100 x 20
        CashDispenser dispenser = atm.getCashDispenser();
        dispenser.addCashSlot(new CashSlot(2000, 10)); // 20,000
        dispenser.addCashSlot(new CashSlot(500, 20));   // 10,000
        dispenser.addCashSlot(new CashSlot(200, 15));   //  3,000
        dispenser.addCashSlot(new CashSlot(100, 20));   //  2,000
        dispenser.buildChain();                          // Total: 35,000

        System.out.println("\n--- ATM Cash Loaded ---");
        dispenser.printCashInventory();

        // Create accounts
        Account acc1 = new Account("ACC-001", "Alice", 50000, "1234");
        Account acc2 = new Account("ACC-002", "Bob", 30000, "5678");
        atm.addAccount(acc1);
        atm.addAccount(acc2);

        // Create cards
        Card aliceCard = new Card("CARD-1111", "ACC-001");
        Card bobCard = new Card("CARD-2222", "ACC-002");

        // ============================================================
        // SCENARIO 1: Full happy path with Alice
        // ============================================================
        System.out.println("\n========================================");
        System.out.println("  SCENARIO 1: Alice -- Full Session");
        System.out.println("========================================");

        // Step 1: Insert card
        atm.insertCard(aliceCard);

        // Step 2: Authenticate
        atm.authenticatePin("1234");

        // Step 3: Balance Inquiry
        atm.selectTransaction(TransactionType.BALANCE_INQUIRY);
        atm.executeTransaction(0);

        // Step 4: Withdraw 4700 (should give 2000x2 + 500x1 + 200x1)
        atm.selectTransaction(TransactionType.WITHDRAWAL);
        atm.executeTransaction(4700);

        // Step 5: Deposit 2000
        atm.selectTransaction(TransactionType.DEPOSIT);
        atm.executeTransaction(2000);

        // Step 6: Transfer 5000 to Bob
        atm.selectTransaction(TransactionType.TRANSFER);
        atm.executeTransaction(5000, "ACC-002");

        // Step 7: Final balance check
        atm.selectTransaction(TransactionType.BALANCE_INQUIRY);
        atm.executeTransaction(0);

        // Step 8: Eject card
        atm.ejectCard();

        // Print remaining ATM cash
        System.out.println("\n--- ATM Cash After Alice's Session ---");
        dispenser.printCashInventory();

        // ============================================================
        // SCENARIO 2: Invalid PIN lockout with Bob
        // ============================================================
        System.out.println("\n========================================");
        System.out.println("  SCENARIO 2: Bob -- PIN Lockout");
        System.out.println("========================================");

        atm.insertCard(bobCard);

        // Wrong PIN attempt 1
        atm.authenticatePin("0000");

        // Wrong PIN attempt 2
        atm.authenticatePin("1111");

        // Wrong PIN attempt 3 -> card blocked
        atm.authenticatePin("9999");

        // Try to insert the blocked card again
        System.out.println("\n--- Attempting to use blocked card ---");
        atm.insertCard(bobCard);

        // ============================================================
        // SCENARIO 3: Insufficient funds
        // ============================================================
        System.out.println("\n========================================");
        System.out.println("  SCENARIO 3: Alice -- Insufficient Funds");
        System.out.println("========================================");

        atm.insertCard(aliceCard);
        atm.authenticatePin("1234");

        // Try to withdraw more than balance
        atm.selectTransaction(TransactionType.WITHDRAWAL);
        atm.executeTransaction(999900);

        atm.ejectCard();

        // ============================================================
        // SCENARIO 4: Invalid amount (not multiple of 100)
        // ============================================================
        System.out.println("\n========================================");
        System.out.println("  SCENARIO 4: Alice -- Invalid Amount");
        System.out.println("========================================");

        atm.insertCard(aliceCard);
        atm.authenticatePin("1234");

        atm.selectTransaction(TransactionType.WITHDRAWAL);
        atm.executeTransaction(350);

        atm.ejectCard();

        // ============================================================
        // SCENARIO 5: Operations in wrong state
        // ============================================================
        System.out.println("\n========================================");
        System.out.println("  SCENARIO 5: Wrong State Operations");
        System.out.println("========================================");

        // Try to authenticate without inserting a card
        atm.authenticatePin("1234");

        // Try to select transaction without a card
        atm.selectTransaction(TransactionType.WITHDRAWAL);

        // Try to execute without a card
        atm.executeTransaction(1000);

        // Try to eject when there is no card
        atm.ejectCard();

        System.out.println("\n========================================");
        System.out.println("       DEMO COMPLETE");
        System.out.println("========================================");
    }
}
```

---

## Expected Output

```
========================================
       ATM SYSTEM -- DEMO
========================================

--- ATM Cash Loaded ---
  [CashDispenser] Current inventory:
    2000 x 10 = 20000
    500 x 20 = 10000
    200 x 15 = 3000
    100 x 20 = 2000
    Total: 35000

========================================
  SCENARIO 1: Alice -- Full Session
========================================

>> ACTION: Insert card CARD-1111
  [IdleState] Card inserted: Card[CARD-1111]
  [ATM] State transition: IdleState -> CardInsertedState

>> ACTION: Enter PIN ****
  [CardInsertedState] PIN accepted. Welcome, Alice!
  [ATM] State transition: CardInsertedState -> AuthenticatedState

>> ACTION: Select BALANCE_INQUIRY
  [AuthenticatedState] Transaction selected: BALANCE_INQUIRY
  [ATM] State transition: AuthenticatedState -> TransactionSelectedState

>> ACTION: Execute with amount 0
  [TransactionSelectedState] Processing BALANCE_INQUIRY...
  [ATM] State transition: TransactionSelectedState -> ProcessingState
  [BalanceInquiry] Your current balance is: 50000

  ╔══════════════════════════════════════╗
  ║           ATM RECEIPT                ║
  ╠══════════════════════════════════════╣
  ║  Transaction ID : A1B2C3D4              ║
  ║  Type           : BALANCE_INQUIRY
  ║  Account        : ACC-001
  ║  Balance After  : 50000
  ║  Status         : SUCCESS
  ╚══════════════════════════════════════╝

  [ATM] State transition: ProcessingState -> AuthenticatedState

>> ACTION: Select WITHDRAWAL
  [AuthenticatedState] Transaction selected: WITHDRAWAL
  [ATM] State transition: AuthenticatedState -> TransactionSelectedState

>> ACTION: Execute with amount 4700
  [TransactionSelectedState] Processing WITHDRAWAL...
  [ATM] State transition: TransactionSelectedState -> ProcessingState
  [Withdraw] Dispensing 4700:
    2000 x 2 = 4000
    500 x 1 = 500
    200 x 1 = 200
  [Withdraw] Please collect your cash.

  ╔══════════════════════════════════════╗
  ║           ATM RECEIPT                ║
  ╠══════════════════════════════════════╣
  ║  Transaction ID : E5F6G7H8              ║
  ║  Type           : WITHDRAWAL
  ║  Account        : ACC-001
  ║  Amount         : 4700
  ║  Notes Dispensed :
  ║    2000 x 2 = 4000
  ║    500 x 1 = 500
  ║    200 x 1 = 200
  ║  Balance After  : 45300
  ║  Status         : SUCCESS
  ╚══════════════════════════════════════╝

  [ATM] State transition: ProcessingState -> AuthenticatedState

>> ACTION: Select DEPOSIT
  ...

>> ACTION: Select TRANSFER
  ...

>> ACTION: Eject card
  [AuthenticatedState] Ending session. Ejecting card.
  [ATM] State transition: AuthenticatedState -> IdleState

--- ATM Cash After Alice's Session ---
  [CashDispenser] Current inventory:
    2000 x 8 = 16000
    500 x 19 = 9500
    200 x 14 = 2800
    100 x 20 = 2000
    Total: 30300

========================================
  SCENARIO 2: Bob -- PIN Lockout
========================================

>> ACTION: Insert card CARD-2222
  [IdleState] Card inserted: Card[CARD-2222]
  [ATM] State transition: IdleState -> CardInsertedState

>> ACTION: Enter PIN ****
  [CardInsertedState] Incorrect PIN. 2 attempt(s) remaining.

>> ACTION: Enter PIN ****
  [CardInsertedState] Incorrect PIN. 1 attempt(s) remaining.

>> ACTION: Enter PIN ****
  [CardInsertedState] Too many failed attempts. Card has been BLOCKED.
  [CardInsertedState] Ejecting card: Card[CARD-2222]
  [ATM] State transition: CardInsertedState -> IdleState

--- Attempting to use blocked card ---

>> ACTION: Insert card CARD-2222
  [IdleState] This card is blocked. Please contact your bank.

========================================
  SCENARIO 5: Wrong State Operations
========================================

>> ACTION: Enter PIN ****
  [IdleState] No card inserted. Please insert your card first.

>> ACTION: Select WITHDRAWAL
  [IdleState] No card inserted. Please insert your card first.

>> ACTION: Execute with amount 1000
  [IdleState] No card inserted. Please insert your card first.

>> ACTION: Eject card
  [IdleState] No card to eject.

========================================
       DEMO COMPLETE
========================================
```

---

## Pattern Summary

| Pattern | Where Used | Benefit |
|---------|-----------|---------|
| **State** | `ATMState` interface + 5 concrete states | Each ATM phase is a self-contained class. Adding a new state (e.g., OutOfService) is adding one class. |
| **Chain of Responsibility** | `DispenseChain` interface + `DenominationHandler` | Each denomination handler is independent. Adding a new denomination is inserting one handler into the chain. |
| **Strategy** | `TransactionStrategy` interface + 4 implementations | Each transaction type has its own logic. Adding a new type (e.g., BillPayment) is adding one class. |
| **Factory** | `TransactionStrategyFactory` | Centralises strategy selection. States never instantiate strategies directly. |

All three patterns work together: the **State** pattern controls *when* actions
are allowed, the **Strategy** pattern controls *what* logic runs for each
transaction, and the **Chain of Responsibility** controls *how* cash is
physically dispensed in denominations.
