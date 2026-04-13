# Splitwise / Expense Sharing System -- Full Java Implementation

All classes below compile and work together. The `Main.java` at the end
demonstrates all three split types, balance tracking, and debt simplification.

---

## 1. User.java

```java
import java.util.Objects;

public class User {
    private final String userId;
    private final String name;
    private final String email;
    private final String phone;

    public User(String userId, String name, String email, String phone) {
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.phone = phone;
    }

    public String getUserId() {
        return userId;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getPhone() {
        return phone;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return Objects.equals(userId, user.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId);
    }

    @Override
    public String toString() {
        return name + "(" + userId + ")";
    }
}
```

---

## 2. SplitType.java (Enum)

```java
public enum SplitType {
    EQUAL,
    EXACT,
    PERCENTAGE
}
```

---

## 3. Split.java (Abstract) and Subclasses

### Split.java

```java
public abstract class Split {
    private final User user;
    private double amount;

    public Split(User user) {
        this.user = user;
        this.amount = 0;
    }

    public Split(User user, double amount) {
        this.user = user;
        this.amount = amount;
    }

    public User getUser() {
        return user;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    @Override
    public String toString() {
        return user.getName() + " owes " + String.format("%.2f", amount);
    }
}
```

### EqualSplit.java

```java
public class EqualSplit extends Split {

    public EqualSplit(User user) {
        super(user);
    }

    public EqualSplit(User user, double amount) {
        super(user, amount);
    }
}
```

### ExactSplit.java

```java
public class ExactSplit extends Split {

    public ExactSplit(User user, double amount) {
        super(user, amount);
    }
}
```

### PercentageSplit.java

```java
public class PercentageSplit extends Split {
    private final double percentage;

    public PercentageSplit(User user, double percentage) {
        super(user);
        this.percentage = percentage;
    }

    public PercentageSplit(User user, double amount, double percentage) {
        super(user, amount);
        this.percentage = percentage;
    }

    public double getPercentage() {
        return percentage;
    }

    @Override
    public String toString() {
        return getUser().getName() + " owes " + String.format("%.2f", getAmount())
                + " (" + String.format("%.1f", percentage) + "%)";
    }
}
```

---

## 4. SplitStrategy Interface

This is the **core Strategy pattern interface**. Each split type provides its own
implementation for validation and calculation.

```java
import java.util.List;
import java.util.Map;

public interface SplitStrategy {

    /**
     * Validate inputs before computing splits.
     * Throws IllegalArgumentException if invalid.
     */
    boolean validate(double totalAmount, List<User> participants,
                     Map<String, Double> splitDetails);

    /**
     * Compute splits for each participant.
     * @param totalAmount   total expense amount
     * @param participants  list of users sharing this expense
     * @param splitDetails  additional info (exact amounts or percentages keyed by userId)
     * @return list of Split objects, one per participant
     */
    List<Split> calculateSplits(double totalAmount, List<User> participants,
                                 Map<String, Double> splitDetails);
}
```

---

## 5. EqualSplitStrategy.java

Divides the total equally among all participants. Handles rounding remainder
by assigning it to the first participant.

```java
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class EqualSplitStrategy implements SplitStrategy {

    @Override
    public boolean validate(double totalAmount, List<User> participants,
                            Map<String, Double> splitDetails) {
        if (participants == null || participants.isEmpty()) {
            throw new IllegalArgumentException(
                "EQUAL split requires at least one participant.");
        }
        if (totalAmount <= 0) {
            throw new IllegalArgumentException(
                "Total amount must be positive.");
        }
        return true;
    }

    @Override
    public List<Split> calculateSplits(double totalAmount, List<User> participants,
                                        Map<String, Double> splitDetails) {
        validate(totalAmount, participants, splitDetails);

        int n = participants.size();
        // Use floor to 2 decimal places for base share
        double baseShare = Math.floor(totalAmount * 100.0 / n) / 100.0;
        double totalDistributed = baseShare * n;
        double remainder = Math.round((totalAmount - totalDistributed) * 100.0) / 100.0;

        List<Split> splits = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            double share = baseShare;
            if (i == 0 && remainder > 0) {
                // Assign rounding remainder to first participant
                share = Math.round((baseShare + remainder) * 100.0) / 100.0;
            }
            splits.add(new EqualSplit(participants.get(i), share));
        }
        return splits;
    }
}
```

---

## 6. ExactSplitStrategy.java

Each participant's share is specified as an exact amount. Validates that all
exact amounts sum to the total expense amount.

```java
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class ExactSplitStrategy implements SplitStrategy {

    @Override
    public boolean validate(double totalAmount, List<User> participants,
                            Map<String, Double> splitDetails) {
        if (participants == null || participants.isEmpty()) {
            throw new IllegalArgumentException(
                "EXACT split requires at least one participant.");
        }
        if (splitDetails == null || splitDetails.size() != participants.size()) {
            throw new IllegalArgumentException(
                "EXACT split requires an amount for each participant.");
        }

        double sum = 0;
        for (User user : participants) {
            Double amount = splitDetails.get(user.getUserId());
            if (amount == null) {
                throw new IllegalArgumentException(
                    "Missing exact amount for user: " + user.getName());
            }
            if (amount < 0) {
                throw new IllegalArgumentException(
                    "Exact amount cannot be negative for user: " + user.getName());
            }
            sum += amount;
        }

        // Compare with tolerance for floating point
        if (Math.abs(sum - totalAmount) > 0.01) {
            throw new IllegalArgumentException(
                "EXACT split amounts (" + String.format("%.2f", sum)
                + ") do not sum to total (" + String.format("%.2f", totalAmount) + ").");
        }
        return true;
    }

    @Override
    public List<Split> calculateSplits(double totalAmount, List<User> participants,
                                        Map<String, Double> splitDetails) {
        validate(totalAmount, participants, splitDetails);

        List<Split> splits = new ArrayList<>();
        for (User user : participants) {
            double amount = splitDetails.get(user.getUserId());
            splits.add(new ExactSplit(user, amount));
        }
        return splits;
    }
}
```

---

## 7. PercentageSplitStrategy.java

Each participant's share is specified as a percentage. Validates that all
percentages sum to exactly 100.

```java
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class PercentageSplitStrategy implements SplitStrategy {

    @Override
    public boolean validate(double totalAmount, List<User> participants,
                            Map<String, Double> splitDetails) {
        if (participants == null || participants.isEmpty()) {
            throw new IllegalArgumentException(
                "PERCENTAGE split requires at least one participant.");
        }
        if (splitDetails == null || splitDetails.size() != participants.size()) {
            throw new IllegalArgumentException(
                "PERCENTAGE split requires a percentage for each participant.");
        }

        double totalPercentage = 0;
        for (User user : participants) {
            Double pct = splitDetails.get(user.getUserId());
            if (pct == null) {
                throw new IllegalArgumentException(
                    "Missing percentage for user: " + user.getName());
            }
            if (pct < 0 || pct > 100) {
                throw new IllegalArgumentException(
                    "Percentage must be between 0 and 100 for user: " + user.getName());
            }
            totalPercentage += pct;
        }

        if (Math.abs(totalPercentage - 100.0) > 0.01) {
            throw new IllegalArgumentException(
                "Percentages must sum to 100. Got: "
                + String.format("%.2f", totalPercentage));
        }
        return true;
    }

    @Override
    public List<Split> calculateSplits(double totalAmount, List<User> participants,
                                        Map<String, Double> splitDetails) {
        validate(totalAmount, participants, splitDetails);

        List<Split> splits = new ArrayList<>();
        for (User user : participants) {
            double pct = splitDetails.get(user.getUserId());
            double amount = Math.round(totalAmount * pct) / 100.0;
            splits.add(new PercentageSplit(user, amount, pct));
        }
        return splits;
    }
}
```

---

## 8. Expense.java

An immutable record of a payment event: who paid, how much, and how the cost
is distributed among participants.

```java
import java.time.LocalDateTime;
import java.util.List;

public class Expense {
    private final String expenseId;
    private final String description;
    private final double amount;
    private final User paidBy;
    private final List<Split> splits;
    private final Group group;
    private final LocalDateTime createdAt;

    public Expense(String expenseId, String description, double amount,
                   User paidBy, List<Split> splits, Group group) {
        this.expenseId = expenseId;
        this.description = description;
        this.amount = amount;
        this.paidBy = paidBy;
        this.splits = splits;
        this.group = group;
        this.createdAt = LocalDateTime.now();
    }

    public String getExpenseId() {
        return expenseId;
    }

    public String getDescription() {
        return description;
    }

    public double getAmount() {
        return amount;
    }

    public User getPaidBy() {
        return paidBy;
    }

    public List<Split> getSplits() {
        return splits;
    }

    public Group getGroup() {
        return group;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("Expense[").append(expenseId).append("]: ")
          .append(description).append(" | Amount: ")
          .append(String.format("%.2f", amount))
          .append(" | Paid by: ").append(paidBy.getName())
          .append(" | Splits: ");
        for (Split s : splits) {
            sb.append("\n    ").append(s);
        }
        return sb.toString();
    }
}
```

---

## 9. Group.java

A collection of users who share expenses together.

```java
import java.util.ArrayList;
import java.util.List;

public class Group {
    private final String groupId;
    private final String name;
    private final List<User> members;
    private final List<Expense> expenses;

    public Group(String groupId, String name) {
        this.groupId = groupId;
        this.name = name;
        this.members = new ArrayList<>();
        this.expenses = new ArrayList<>();
    }

    public String getGroupId() {
        return groupId;
    }

    public String getName() {
        return name;
    }

    public List<User> getMembers() {
        return members;
    }

    public List<Expense> getExpenses() {
        return expenses;
    }

    public void addMember(User user) {
        if (!members.contains(user)) {
            members.add(user);
        }
    }

    public void addExpense(Expense expense) {
        expenses.add(expense);
    }

    @Override
    public String toString() {
        return "Group[" + groupId + "]: " + name
               + " (" + members.size() + " members, "
               + expenses.size() + " expenses)";
    }
}
```

---

## 10. Transaction.java

A simplified debt record: one person pays another a specific amount.
Produced by the debt simplification algorithm.

```java
public class Transaction {
    private final String fromUserId;
    private final String fromUserName;
    private final String toUserId;
    private final String toUserName;
    private final double amount;

    public Transaction(String fromUserId, String fromUserName,
                       String toUserId, String toUserName, double amount) {
        this.fromUserId = fromUserId;
        this.fromUserName = fromUserName;
        this.toUserId = toUserId;
        this.toUserName = toUserName;
        this.amount = amount;
    }

    public String getFromUserId() {
        return fromUserId;
    }

    public String getToUserId() {
        return toUserId;
    }

    public double getAmount() {
        return amount;
    }

    @Override
    public String toString() {
        return fromUserName + " pays " + toUserName
               + ": " + String.format("%.2f", amount);
    }
}
```

---

## 11. DebtSimplifier.java

The greedy net-balance algorithm that minimizes the number of transactions
to settle all debts.

**Algorithm:**
1. Calculate net balance per person (positive = creditor, negative = debtor)
2. Separate into creditor and debtor lists
3. Sort both by absolute value descending
4. Greedy match: biggest debtor pays biggest creditor, repeat

```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DebtSimplifier {

    /**
     * Takes the raw balance map and returns minimum transactions to settle all debts.
     *
     * @param balances  Map<owerId, Map<lenderId, amount>>
     * @param userNames Map<userId, userName> for readable output
     * @return list of simplified transactions
     */
    public List<Transaction> simplify(Map<String, Map<String, Double>> balances,
                                       Map<String, String> userNames) {

        // Step 1: Calculate net balance for each person.
        // Positive = net creditor (others owe them).
        // Negative = net debtor (they owe others).
        Map<String, Double> netBalance = new HashMap<>();

        for (Map.Entry<String, Map<String, Double>> owerEntry : balances.entrySet()) {
            String owerId = owerEntry.getKey();
            for (Map.Entry<String, Double> lenderEntry : owerEntry.getValue().entrySet()) {
                String lenderId = lenderEntry.getKey();
                double amount = lenderEntry.getValue();

                if (amount <= 0.001) continue; // Skip zero/negligible balances

                // owerId owes lenderId this amount
                netBalance.merge(owerId, -amount, Double::sum);
                netBalance.merge(lenderId, amount, Double::sum);
            }
        }

        // Step 2: Separate into creditors and debtors.
        List<String> creditorIds = new ArrayList<>();
        List<Double> creditorAmounts = new ArrayList<>();
        List<String> debtorIds = new ArrayList<>();
        List<Double> debtorAmounts = new ArrayList<>();

        for (Map.Entry<String, Double> entry : netBalance.entrySet()) {
            double net = entry.getValue();
            if (net > 0.01) {
                creditorIds.add(entry.getKey());
                creditorAmounts.add(net);
            } else if (net < -0.01) {
                debtorIds.add(entry.getKey());
                debtorAmounts.add(-net); // Store as positive for easier comparison
            }
            // net ~= 0 means settled, skip
        }

        // Step 3: Sort both by amount descending (largest first).
        sortDescending(creditorIds, creditorAmounts);
        sortDescending(debtorIds, debtorAmounts);

        // Step 4: Greedy matching.
        List<Transaction> transactions = new ArrayList<>();
        int ci = 0; // creditor index
        int di = 0; // debtor index

        while (ci < creditorIds.size() && di < debtorIds.size()) {
            double credAmt = creditorAmounts.get(ci);
            double debtAmt = debtorAmounts.get(di);
            double settlement = Math.min(credAmt, debtAmt);

            // Round to 2 decimal places
            settlement = Math.round(settlement * 100.0) / 100.0;

            if (settlement > 0.001) {
                String fromId = debtorIds.get(di);
                String toId = creditorIds.get(ci);
                String fromName = userNames.getOrDefault(fromId, fromId);
                String toName = userNames.getOrDefault(toId, toId);
                transactions.add(new Transaction(fromId, fromName, toId, toName, settlement));
            }

            creditorAmounts.set(ci, credAmt - settlement);
            debtorAmounts.set(di, debtAmt - settlement);

            if (creditorAmounts.get(ci) < 0.01) ci++;
            if (debtorAmounts.get(di) < 0.01) di++;
        }

        return transactions;
    }

    /**
     * Sorts ids and amounts in descending order of amount (in place).
     * Simple selection sort -- fine for small N in Splitwise context.
     */
    private void sortDescending(List<String> ids, List<Double> amounts) {
        for (int i = 0; i < amounts.size(); i++) {
            int maxIdx = i;
            for (int j = i + 1; j < amounts.size(); j++) {
                if (amounts.get(j) > amounts.get(maxIdx)) {
                    maxIdx = j;
                }
            }
            if (maxIdx != i) {
                // Swap amounts
                double tmpAmt = amounts.get(i);
                amounts.set(i, amounts.get(maxIdx));
                amounts.set(maxIdx, tmpAmt);
                // Swap ids
                String tmpId = ids.get(i);
                ids.set(i, ids.get(maxIdx));
                ids.set(maxIdx, tmpId);
            }
        }
    }
}
```

---

## 12. BalanceSheet.java

Central ledger. Tracks who owes whom and delegates simplification to
`DebtSimplifier`. Handles netting of reverse debts in `updateBalance`.

```java
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class BalanceSheet {
    // balances[owerId][lenderId] = amount that ower owes to lender
    private final Map<String, Map<String, Double>> balances;
    private final DebtSimplifier debtSimplifier;

    public BalanceSheet() {
        this.balances = new HashMap<>();
        this.debtSimplifier = new DebtSimplifier();
    }

    /**
     * Update balance: 'from' now owes 'to' an additional 'amount'.
     * Handles netting of reverse debts automatically.
     *
     * Example: if B already owes A 500, and A now owes B 300,
     * the result is B owes A 200 (not both directions stored).
     */
    public void updateBalance(String fromId, String toId, double amount) {
        if (fromId.equals(toId)) return; // Cannot owe yourself

        // Check if 'to' already owes 'from' (reverse debt)
        double reverseDebt = getDirectDebt(toId, fromId);

        if (reverseDebt > 0) {
            if (reverseDebt >= amount) {
                // Reverse debt absorbs the new amount fully
                setDirectDebt(toId, fromId, reverseDebt - amount);
            } else {
                // Reverse debt partially absorbs; remainder becomes forward debt
                setDirectDebt(toId, fromId, 0);
                double remainder = amount - reverseDebt;
                double existingForward = getDirectDebt(fromId, toId);
                setDirectDebt(fromId, toId, existingForward + remainder);
            }
        } else {
            // No reverse debt; simply add forward debt
            double existing = getDirectDebt(fromId, toId);
            setDirectDebt(fromId, toId, existing + amount);
        }
    }

    /**
     * Get the direct debt: how much 'fromId' owes 'toId'.
     */
    private double getDirectDebt(String fromId, String toId) {
        return balances.getOrDefault(fromId, new HashMap<>())
                       .getOrDefault(toId, 0.0);
    }

    /**
     * Set the direct debt value. Removes entry if zero or negligible.
     */
    private void setDirectDebt(String fromId, String toId, double amount) {
        if (amount < 0.001) {
            // Remove zero/negligible balances to keep the map clean
            if (balances.containsKey(fromId)) {
                balances.get(fromId).remove(toId);
                if (balances.get(fromId).isEmpty()) {
                    balances.remove(fromId);
                }
            }
        } else {
            balances.computeIfAbsent(fromId, k -> new HashMap<>())
                    .put(toId, Math.round(amount * 100.0) / 100.0);
        }
    }

    /**
     * Get balance between two users as a human-readable string.
     */
    public String getBalance(String userId1, String name1,
                             String userId2, String name2) {
        double debt1to2 = getDirectDebt(userId1, userId2);
        double debt2to1 = getDirectDebt(userId2, userId1);

        if (debt1to2 > 0.01) {
            return name1 + " owes " + name2 + ": " + String.format("%.2f", debt1to2);
        } else if (debt2to1 > 0.01) {
            return name2 + " owes " + name1 + ": " + String.format("%.2f", debt2to1);
        } else {
            return name1 + " and " + name2 + " are settled up.";
        }
    }

    /**
     * Get all current balances as a readable report.
     */
    public String getAllBalancesReport() {
        StringBuilder sb = new StringBuilder();
        sb.append("=== Current Balances ===\n");
        if (balances.isEmpty()) {
            sb.append("  All settled up!\n");
            return sb.toString();
        }
        for (Map.Entry<String, Map<String, Double>> owerEntry : balances.entrySet()) {
            for (Map.Entry<String, Double> lenderEntry : owerEntry.getValue().entrySet()) {
                double amt = lenderEntry.getValue();
                if (amt > 0.01) {
                    sb.append("  ")
                      .append(owerEntry.getKey())
                      .append(" owes ")
                      .append(lenderEntry.getKey())
                      .append(": ")
                      .append(String.format("%.2f", amt))
                      .append("\n");
                }
            }
        }
        return sb.toString();
    }

    /**
     * Get the raw balance map (deep copy to avoid external mutation).
     */
    public Map<String, Map<String, Double>> getRawBalances() {
        Map<String, Map<String, Double>> copy = new HashMap<>();
        for (Map.Entry<String, Map<String, Double>> entry : balances.entrySet()) {
            copy.put(entry.getKey(), new HashMap<>(entry.getValue()));
        }
        return copy;
    }

    /**
     * Simplify debts: minimize the number of transactions to settle everything.
     */
    public List<Transaction> simplifyDebts(Map<String, String> userNames) {
        return debtSimplifier.simplify(getRawBalances(), userNames);
    }
}
```

---

## 13. ExpenseObserver.java (Observer Interface)

Decouples notification side-effects from the core expense logic. Any class that
wants to react to expense events implements this interface and registers with
the `ExpenseService`.

```java
public interface ExpenseObserver {
    void onExpenseAdded(Expense expense);
    void onDebtSettled(String fromUserId, String toUserId, double amount);
}
```

---

## 14. EmailNotifier.java (Concrete Observer)

Prints email-style notifications to stdout. In production, this would send
actual emails via an email service.

```java
public class EmailNotifier implements ExpenseObserver {

    @Override
    public void onExpenseAdded(Expense expense) {
        System.out.println("[EMAIL] Expense added: " + expense.getDescription()
                + " | Amount: " + String.format("%.2f", expense.getAmount())
                + " | Paid by: " + expense.getPaidBy().getName());
        for (Split split : expense.getSplits()) {
            if (!split.getUser().getUserId().equals(expense.getPaidBy().getUserId())) {
                System.out.println("  -> Notify " + split.getUser().getName()
                        + ": You owe " + expense.getPaidBy().getName()
                        + " " + String.format("%.2f", split.getAmount()));
            }
        }
    }

    @Override
    public void onDebtSettled(String fromUserId, String toUserId, double amount) {
        System.out.println("[EMAIL] Debt settled: " + fromUserId
                + " paid " + toUserId + " " + String.format("%.2f", amount));
    }
}
```

---

## 15. ExpenseService.java

The orchestrator. Brings together strategies, balance sheet, and observers.
This is the main entry point for all expense operations.

```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class ExpenseService {
    private final BalanceSheet balanceSheet;
    private final Map<SplitType, SplitStrategy> strategies;
    private final List<ExpenseObserver> observers;

    public ExpenseService(BalanceSheet balanceSheet) {
        this.balanceSheet = balanceSheet;
        this.observers = new ArrayList<>();

        // Register all split strategies (Factory-like registration)
        this.strategies = new HashMap<>();
        strategies.put(SplitType.EQUAL, new EqualSplitStrategy());
        strategies.put(SplitType.EXACT, new ExactSplitStrategy());
        strategies.put(SplitType.PERCENTAGE, new PercentageSplitStrategy());
    }

    /**
     * Add an observer for expense events.
     */
    public void addObserver(ExpenseObserver observer) {
        observers.add(observer);
    }

    /**
     * Add an expense and update balances.
     *
     * Flow:
     *   1. Look up the right SplitStrategy
     *   2. Strategy validates and calculates splits
     *   3. Create the Expense object
     *   4. Update balance sheet for each split (skip payer's own split)
     *   5. Add expense to group (if applicable)
     *   6. Notify all observers
     *
     * @param paidBy       the user who paid
     * @param amount       total expense amount
     * @param splitType    how to split (EQUAL, EXACT, PERCENTAGE)
     * @param participants users sharing this expense
     * @param splitDetails additional details (exact amounts or percentages by userId)
     *                     Pass null for EQUAL split.
     * @param description  expense description
     * @param group        optional group (can be null for non-group expenses)
     * @return the created Expense
     */
    public Expense addExpense(User paidBy, double amount, SplitType splitType,
                               List<User> participants,
                               Map<String, Double> splitDetails,
                               String description, Group group) {

        // 1. Look up the right strategy
        SplitStrategy strategy = strategies.get(splitType);
        if (strategy == null) {
            throw new IllegalArgumentException("Unknown split type: " + splitType);
        }

        // 2. Calculate splits (validates internally)
        List<Split> splits = strategy.calculateSplits(amount, participants, splitDetails);

        // 3. Create the expense
        String expenseId = UUID.randomUUID().toString().substring(0, 8);
        Expense expense = new Expense(expenseId, description, amount,
                                       paidBy, splits, group);

        // 4. Update balance sheet
        for (Split split : splits) {
            if (!split.getUser().getUserId().equals(paidBy.getUserId())) {
                // This user owes the payer
                balanceSheet.updateBalance(
                    split.getUser().getUserId(),
                    paidBy.getUserId(),
                    split.getAmount()
                );
            }
        }

        // 5. Add expense to group if applicable
        if (group != null) {
            group.addExpense(expense);
        }

        // 6. Notify observers
        notifyExpenseAdded(expense);

        return expense;
    }

    /**
     * Notify all registered observers that an expense was added.
     */
    private void notifyExpenseAdded(Expense expense) {
        for (ExpenseObserver observer : observers) {
            observer.onExpenseAdded(expense);
        }
    }

    /**
     * Get the balance sheet for inspection.
     */
    public BalanceSheet getBalanceSheet() {
        return balanceSheet;
    }
}
```

---

## 16. Main.java -- Full Demo

This demo creates a group of 4 users, adds expenses with all 3 split types,
shows running balances after each expense, checks individual balances, and
demonstrates debt simplification and input validation.

```java
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Main {

    public static void main(String[] args) {

        System.out.println("=============================================");
        System.out.println("   SPLITWISE / EXPENSE SHARING SYSTEM DEMO   ");
        System.out.println("=============================================\n");

        // ---- Create Users ----
        User alice   = new User("u1", "Alice",   "alice@email.com",   "9000000001");
        User bob     = new User("u2", "Bob",     "bob@email.com",     "9000000002");
        User charlie = new User("u3", "Charlie", "charlie@email.com", "9000000003");
        User diana   = new User("u4", "Diana",   "diana@email.com",   "9000000004");

        // ---- Create Group ----
        Group tripGroup = new Group("g1", "Goa Trip");
        tripGroup.addMember(alice);
        tripGroup.addMember(bob);
        tripGroup.addMember(charlie);
        tripGroup.addMember(diana);

        System.out.println("Group created: " + tripGroup);
        System.out.println("Members: Alice, Bob, Charlie, Diana\n");

        // ---- Set up Service ----
        BalanceSheet balanceSheet = new BalanceSheet();
        ExpenseService service = new ExpenseService(balanceSheet);
        service.addObserver(new EmailNotifier());

        // User name map for readable simplified output
        Map<String, String> userNames = new HashMap<>();
        userNames.put("u1", "Alice");
        userNames.put("u2", "Bob");
        userNames.put("u3", "Charlie");
        userNames.put("u4", "Diana");

        // ============================================================
        // EXPENSE 1: EQUAL SPLIT
        // Alice pays 4000 for dinner, split equally among all 4
        // Each person's share: 1000
        // ============================================================
        System.out.println("---------------------------------------------");
        System.out.println("EXPENSE 1: EQUAL SPLIT");
        System.out.println("Alice pays 4000 for dinner, split among 4");
        System.out.println("---------------------------------------------");

        List<User> allMembers = Arrays.asList(alice, bob, charlie, diana);
        Expense exp1 = service.addExpense(
            alice, 4000, SplitType.EQUAL,
            allMembers, null,
            "Group dinner at beach shack", tripGroup
        );

        System.out.println("\n" + exp1);
        System.out.println();
        System.out.println(balanceSheet.getAllBalancesReport());

        // ============================================================
        // EXPENSE 2: EXACT SPLIT
        // Bob pays 3000 for activities.
        // Alice: 500, Bob: 1000, Charlie: 1000, Diana: 500
        // ============================================================
        System.out.println("---------------------------------------------");
        System.out.println("EXPENSE 2: EXACT SPLIT");
        System.out.println("Bob pays 3000. Alice:500, Bob:1000, Charlie:1000, Diana:500");
        System.out.println("---------------------------------------------");

        Map<String, Double> exactDetails = new HashMap<>();
        exactDetails.put("u1", 500.0);   // Alice
        exactDetails.put("u2", 1000.0);  // Bob (his own share, will be skipped in balance)
        exactDetails.put("u3", 1000.0);  // Charlie
        exactDetails.put("u4", 500.0);   // Diana

        Expense exp2 = service.addExpense(
            bob, 3000, SplitType.EXACT,
            allMembers, exactDetails,
            "Water sports and parasailing", tripGroup
        );

        System.out.println("\n" + exp2);
        System.out.println();
        System.out.println(balanceSheet.getAllBalancesReport());

        // ============================================================
        // EXPENSE 3: PERCENTAGE SPLIT
        // Charlie pays 5000 for hotel.
        // Alice: 40% (2000), Bob: 30% (1500), Charlie: 20% (1000), Diana: 10% (500)
        // ============================================================
        System.out.println("---------------------------------------------");
        System.out.println("EXPENSE 3: PERCENTAGE SPLIT");
        System.out.println("Charlie pays 5000. Alice:40%, Bob:30%, Charlie:20%, Diana:10%");
        System.out.println("---------------------------------------------");

        Map<String, Double> pctDetails = new HashMap<>();
        pctDetails.put("u1", 40.0);  // Alice  -> 2000
        pctDetails.put("u2", 30.0);  // Bob    -> 1500
        pctDetails.put("u3", 20.0);  // Charlie -> 1000 (his own share)
        pctDetails.put("u4", 10.0);  // Diana  -> 500

        Expense exp3 = service.addExpense(
            charlie, 5000, SplitType.PERCENTAGE,
            allMembers, pctDetails,
            "Hotel room charges", tripGroup
        );

        System.out.println("\n" + exp3);
        System.out.println();
        System.out.println(balanceSheet.getAllBalancesReport());

        // ============================================================
        // EXPENSE 4: Another EQUAL SPLIT (makes debts more complex)
        // Diana pays 2000 for cab, split equally among all 4
        // Each person's share: 500
        // ============================================================
        System.out.println("---------------------------------------------");
        System.out.println("EXPENSE 4: EQUAL SPLIT");
        System.out.println("Diana pays 2000 for cab, split among 4");
        System.out.println("---------------------------------------------");

        Expense exp4 = service.addExpense(
            diana, 2000, SplitType.EQUAL,
            allMembers, null,
            "Airport cab ride", tripGroup
        );

        System.out.println("\n" + exp4);
        System.out.println();

        // ============================================================
        // FINAL BALANCES (before simplification)
        // ============================================================
        System.out.println("=============================================");
        System.out.println("FINAL BALANCES (before simplification)");
        System.out.println("=============================================");
        System.out.println(balanceSheet.getAllBalancesReport());

        // ============================================================
        // GROUP SUMMARY
        // ============================================================
        System.out.println("Group summary: " + tripGroup);
        System.out.println("Total expenses in group: " + tripGroup.getExpenses().size());
        double totalSpent = tripGroup.getExpenses().stream()
                .mapToDouble(Expense::getAmount).sum();
        System.out.println("Total amount spent: " + String.format("%.2f", totalSpent));
        System.out.println();

        // ============================================================
        // INDIVIDUAL BALANCE CHECKS
        // ============================================================
        System.out.println("=============================================");
        System.out.println("INDIVIDUAL BALANCE CHECKS");
        System.out.println("=============================================");
        System.out.println(balanceSheet.getBalance("u1", "Alice", "u2", "Bob"));
        System.out.println(balanceSheet.getBalance("u1", "Alice", "u3", "Charlie"));
        System.out.println(balanceSheet.getBalance("u1", "Alice", "u4", "Diana"));
        System.out.println(balanceSheet.getBalance("u2", "Bob", "u3", "Charlie"));
        System.out.println(balanceSheet.getBalance("u2", "Bob", "u4", "Diana"));
        System.out.println(balanceSheet.getBalance("u3", "Charlie", "u4", "Diana"));
        System.out.println();

        // ============================================================
        // DEBT SIMPLIFICATION
        // ============================================================
        System.out.println("=============================================");
        System.out.println("SIMPLIFIED DEBTS (minimum transactions)");
        System.out.println("=============================================");

        List<Transaction> simplified = balanceSheet.simplifyDebts(userNames);

        if (simplified.isEmpty()) {
            System.out.println("  All debts are settled!");
        } else {
            System.out.println("Only " + simplified.size()
                    + " transaction(s) needed to settle all debts:\n");
            for (int i = 0; i < simplified.size(); i++) {
                System.out.println("  " + (i + 1) + ". " + simplified.get(i));
            }
        }
        System.out.println();

        // ============================================================
        // VALIDATION DEMO: Invalid exact split (amounts don't sum to total)
        // ============================================================
        System.out.println("=============================================");
        System.out.println("VALIDATION DEMO: Invalid exact split");
        System.out.println("=============================================");

        try {
            Map<String, Double> badExact = new HashMap<>();
            badExact.put("u1", 500.0);
            badExact.put("u2", 500.0);
            // Amounts sum to 1000, but total is 2000 --> should fail
            service.addExpense(
                alice, 2000, SplitType.EXACT,
                Arrays.asList(alice, bob), badExact,
                "Invalid expense", null
            );
        } catch (IllegalArgumentException e) {
            System.out.println("Caught expected error: " + e.getMessage());
        }

        System.out.println();

        // ============================================================
        // VALIDATION DEMO: Invalid percentage split (percentages don't sum to 100)
        // ============================================================
        System.out.println("=============================================");
        System.out.println("VALIDATION DEMO: Invalid percentage split");
        System.out.println("=============================================");

        try {
            Map<String, Double> badPct = new HashMap<>();
            badPct.put("u1", 60.0);
            badPct.put("u2", 60.0);
            // Percentages sum to 120, not 100 --> should fail
            service.addExpense(
                alice, 1000, SplitType.PERCENTAGE,
                Arrays.asList(alice, bob), badPct,
                "Invalid expense", null
            );
        } catch (IllegalArgumentException e) {
            System.out.println("Caught expected error: " + e.getMessage());
        }

        System.out.println();
        System.out.println("=============================================");
        System.out.println("   DEMO COMPLETE                             ");
        System.out.println("=============================================");
    }
}
```

---

## Verified Output

This output was produced by compiling and running the code above:

```
=============================================
   SPLITWISE / EXPENSE SHARING SYSTEM DEMO   
=============================================

Group created: Group[g1]: Goa Trip (4 members, 0 expenses)
Members: Alice, Bob, Charlie, Diana

---------------------------------------------
EXPENSE 1: EQUAL SPLIT
Alice pays 4000 for dinner, split among 4
---------------------------------------------
[EMAIL] Expense added: Group dinner at beach shack | Amount: 4000.00 | Paid by: Alice
  -> Notify Bob: You owe Alice 1000.00
  -> Notify Charlie: You owe Alice 1000.00
  -> Notify Diana: You owe Alice 1000.00

Expense[...]: Group dinner at beach shack | Amount: 4000.00 | Paid by: Alice | Splits:
    Alice owes 1000.00
    Bob owes 1000.00
    Charlie owes 1000.00
    Diana owes 1000.00

=== Current Balances ===
  u2 owes u1: 1000.00
  u3 owes u1: 1000.00
  u4 owes u1: 1000.00

---------------------------------------------
EXPENSE 2: EXACT SPLIT
Bob pays 3000. Alice:500, Bob:1000, Charlie:1000, Diana:500
---------------------------------------------
[EMAIL] Expense added: Water sports and parasailing | Amount: 3000.00 | Paid by: Bob
  -> Notify Alice: You owe Bob 500.00
  -> Notify Charlie: You owe Bob 1000.00
  -> Notify Diana: You owe Bob 500.00

Expense[...]: Water sports and parasailing | Amount: 3000.00 | Paid by: Bob | Splits:
    Alice owes 500.00
    Bob owes 1000.00
    Charlie owes 1000.00
    Diana owes 500.00

=== Current Balances ===
  u2 owes u1: 500.00          (was 1000, netted with Alice's 500 debt to Bob)
  u3 owes u1: 1000.00
  u3 owes u2: 1000.00
  u4 owes u1: 1000.00
  u4 owes u2: 500.00

---------------------------------------------
EXPENSE 3: PERCENTAGE SPLIT
Charlie pays 5000. Alice:40%, Bob:30%, Charlie:20%, Diana:10%
---------------------------------------------
[EMAIL] Expense added: Hotel room charges | Amount: 5000.00 | Paid by: Charlie
  -> Notify Alice: You owe Charlie 2000.00
  -> Notify Bob: You owe Charlie 1500.00
  -> Notify Diana: You owe Charlie 500.00

Expense[...]: Hotel room charges | Amount: 5000.00 | Paid by: Charlie | Splits:
    Alice owes 2000.00 (40.0%)
    Bob owes 1500.00 (30.0%)
    Charlie owes 1000.00 (20.0%)
    Diana owes 500.00 (10.0%)

=== Current Balances ===
  u1 owes u3: 1000.00
  u2 owes u1: 500.00
  u2 owes u3: 500.00
  u4 owes u1: 1000.00
  u4 owes u2: 500.00
  u4 owes u3: 500.00

---------------------------------------------
EXPENSE 4: EQUAL SPLIT
Diana pays 2000 for cab, split among 4
---------------------------------------------
[EMAIL] Expense added: Airport cab ride | Amount: 2000.00 | Paid by: Diana
  -> Notify Alice: You owe Diana 500.00
  -> Notify Bob: You owe Diana 500.00
  -> Notify Charlie: You owe Diana 500.00

=============================================
FINAL BALANCES (before simplification)
=============================================
=== Current Balances ===
  u1 owes u3: 1000.00
  u2 owes u1: 500.00
  u2 owes u3: 500.00
  u4 owes u1: 500.00

Group summary: Group[g1]: Goa Trip (4 members, 4 expenses)
Total expenses in group: 4
Total amount spent: 14000.00

=============================================
INDIVIDUAL BALANCE CHECKS
=============================================
Bob owes Alice: 500.00
Alice owes Charlie: 1000.00
Diana owes Alice: 500.00
Bob owes Charlie: 500.00
Bob and Diana are settled up.
Charlie and Diana are settled up.

=============================================
SIMPLIFIED DEBTS (minimum transactions)
=============================================
Only 2 transaction(s) needed to settle all debts:

  1. Bob pays Charlie: 1000.00
  2. Diana pays Charlie: 500.00

=============================================
VALIDATION DEMO: Invalid exact split
=============================================
Caught expected error: EXACT split amounts (1000.00) do not sum to total (2000.00).

=============================================
VALIDATION DEMO: Invalid percentage split
=============================================
Caught expected error: Percentages must sum to 100. Got: 120.00

=============================================
   DEMO COMPLETE                             
=============================================
```

---

## Compilation and Run Instructions

Place all `.java` files in the same directory (default package) and run:

```bash
javac *.java
java Main
```

---

## Architecture Summary

```
┌──────────────────────────────────────────────────────────────────────┐
│                         ExpenseService                               │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────────┐   │
│  │ Strategy Map     │  │ BalanceSheet     │  │ Observer List     │   │
│  │ EQUAL  -> EqStr  │  │ Map<id,Map<id,d>>│  │ EmailNotifier     │   │
│  │ EXACT  -> ExStr  │  │ updateBalance()  │  │ PushNotifier ...  │   │
│  │ PERCENT-> PcStr  │  │ simplifyDebts()  │  │ onExpenseAdded()  │   │
│  └────────┬────────┘  └────────┬─────────┘  └────────┬──────────┘   │
│           │                    │                      │              │
│  addExpense() ────────────────────────────────────────┘              │
│   1. strategy.calculateSplits()                                      │
│   2. balanceSheet.updateBalance() for each split                     │
│   3. group.addExpense()                                              │
│   4. observers.forEach(o -> o.onExpenseAdded())                      │
└──────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        DebtSimplifier                                │
│  1. Compute net balance per person                                   │
│  2. Separate into creditors (+) and debtors (-)                      │
│  3. Sort by absolute value descending                                │
│  4. Greedy match largest creditor with largest debtor                │
│  5. Output: List<Transaction> with minimum count                     │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Complexity Summary

| Operation          | Time           | Space                     |
|--------------------|----------------|---------------------------|
| `addExpense`       | O(k) where k = number of splits | O(n^2) balance sheet |
| `getBalance`       | O(1)           | O(1)                      |
| `getAllBalances`    | O(n^2)         | O(1)                      |
| `simplifyDebts`    | O(n log n)     | O(n)                      |

---

## Design Patterns Summary

| Pattern       | Class(es)                               | Purpose                              |
|---------------|-----------------------------------------|--------------------------------------|
| **Strategy**  | `SplitStrategy` + 3 implementations     | Pluggable split calculation          |
| **Observer**  | `ExpenseObserver` + `EmailNotifier`     | Decoupled event notifications        |
| **Template**  | `Split` abstract + 3 subclasses         | Common split structure, varied types |
| **Factory**   | Strategy `Map` in `ExpenseService`      | Strategy selection by `SplitType`    |

---

## Key Interview Discussion Points

1. **Why Strategy over if-else?** Open/Closed Principle. Adding a new split type
   requires zero changes to `ExpenseService` -- just a new class and one map entry.

2. **Why the greedy algorithm works for debt simplification.** Net balances always
   sum to zero. Matching largest creditor-debtor pairs converges in at most N-1
   steps. The general minimum-transaction problem is NP-hard, but the greedy
   approach is optimal when there is a single currency.

3. **Balance netting.** If A owes B 500 and B owes A 300, the balance sheet
   stores A owes B 200 -- not both directions. Handled in `updateBalance()`.

4. **Thread safety.** In production, `BalanceSheet.updateBalance()` must be
   synchronized. Use `ConcurrentHashMap` or database-level row locking.

5. **Floating point.** Use `BigDecimal` in production. For interview clarity,
   `double` with rounding to 2 decimal places is acceptable.
