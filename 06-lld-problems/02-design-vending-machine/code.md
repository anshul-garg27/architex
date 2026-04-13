# Vending Machine -- Complete Java Implementation

## File Structure

```
vendingmachine/
  Coin.java
  Note.java
  Product.java
  Inventory.java
  PaymentStrategy.java
  CashPaymentStrategy.java
  CardPaymentStrategy.java
  VendingState.java
  IdleState.java
  HasMoneyState.java
  DispensingState.java
  VendingMachine.java
  VendingMachineDemo.java
```

---

## 1. Coin Enum

```java
package vendingmachine;

/**
 * Coin denominations accepted by the vending machine.
 * Values are stored in cents to avoid floating-point issues.
 */
public enum Coin {
    PENNY(1),
    NICKEL(5),
    DIME(10),
    QUARTER(25);

    private final int value;

    Coin(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }
}
```

---

## 2. Note Enum

```java
package vendingmachine;

/**
 * Note (bill) denominations accepted by the vending machine.
 * Values are stored in cents to avoid floating-point issues.
 */
public enum Note {
    ONE(100),
    FIVE(500),
    TEN(1000),
    TWENTY(2000);

    private final int value;

    Note(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }
}
```

---

## 3. Product

```java
package vendingmachine;

/**
 * Immutable value object representing a product in the vending machine.
 * Price is stored in cents.
 */
public class Product {
    private final String code;
    private final String name;
    private final int price; // in cents

    public Product(String code, String name, int price) {
        if (code == null || code.isEmpty()) {
            throw new IllegalArgumentException("Product code cannot be null or empty");
        }
        if (name == null || name.isEmpty()) {
            throw new IllegalArgumentException("Product name cannot be null or empty");
        }
        if (price <= 0) {
            throw new IllegalArgumentException("Product price must be positive");
        }
        this.code = code;
        this.name = name;
        this.price = price;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public int getPrice() {
        return price;
    }

    /**
     * Returns the price formatted as dollars for display purposes.
     */
    public String getFormattedPrice() {
        return String.format("$%.2f", price / 100.0);
    }

    @Override
    public String toString() {
        return String.format("[%s] %s - %s", code, name, getFormattedPrice());
    }
}
```

---

## 4. Inventory

```java
package vendingmachine;

import java.util.HashMap;
import java.util.Map;

/**
 * Manages the product catalog and stock quantities.
 * Uses two maps: one for product references, one for quantities.
 */
public class Inventory {
    private final Map<String, Product> products;
    private final Map<String, Integer> stock;

    public Inventory() {
        this.products = new HashMap<>();
        this.stock = new HashMap<>();
    }

    /**
     * Adds a product to the inventory with the given initial quantity.
     * If the product already exists, the quantity is added to the existing stock.
     */
    public void addProduct(Product product, int quantity) {
        if (product == null) {
            throw new IllegalArgumentException("Product cannot be null");
        }
        if (quantity < 0) {
            throw new IllegalArgumentException("Quantity cannot be negative");
        }
        products.put(product.getCode(), product);
        stock.put(product.getCode(), stock.getOrDefault(product.getCode(), 0) + quantity);
    }

    /**
     * Removes a product entirely from the inventory.
     */
    public void removeProduct(String code) {
        products.remove(code);
        stock.remove(code);
    }

    /**
     * Returns the Product object for the given code, or null if not found.
     */
    public Product getProduct(String code) {
        return products.get(code);
    }

    /**
     * Returns the current stock quantity for the given product code.
     */
    public int getQuantity(String code) {
        return stock.getOrDefault(code, 0);
    }

    /**
     * Decrements the stock by 1 after a successful dispense.
     * Throws exception if product is not available.
     */
    public void reduceQuantity(String code) {
        if (\!isAvailable(code)) {
            throw new IllegalStateException("Cannot reduce quantity: product " + code + " is not available");
        }
        stock.put(code, stock.get(code) - 1);
    }

    /**
     * Returns true if the product exists and has at least 1 unit in stock.
     */
    public boolean isAvailable(String code) {
        return products.containsKey(code) && stock.getOrDefault(code, 0) > 0;
    }

    /**
     * Admin operation to add more units of an existing product.
     */
    public void restock(String code, int quantity) {
        if (\!products.containsKey(code)) {
            throw new IllegalArgumentException("Product " + code + " does not exist in inventory");
        }
        if (quantity <= 0) {
            throw new IllegalArgumentException("Restock quantity must be positive");
        }
        stock.put(code, stock.getOrDefault(code, 0) + quantity);
    }

    /**
     * Displays all products with their prices and current stock levels.
     */
    public void displayProducts() {
        System.out.println("============================================");
        System.out.println("         VENDING MACHINE PRODUCTS           ");
        System.out.println("============================================");
        System.out.printf("%-6s %-20s %-8s %-6s%n", "Code", "Name", "Price", "Stock");
        System.out.println("--------------------------------------------");

        for (Map.Entry<String, Product> entry : products.entrySet()) {
            Product p = entry.getValue();
            int qty = stock.getOrDefault(p.getCode(), 0);
            String stockDisplay = qty > 0 ? String.valueOf(qty) : "SOLD OUT";
            System.out.printf("%-6s %-20s %-8s %-6s%n",
                    p.getCode(), p.getName(), p.getFormattedPrice(), stockDisplay);
        }
        System.out.println("============================================");
    }
}
```

---

## 5. PaymentStrategy Interface

```java
package vendingmachine;

/**
 * Strategy interface for payment processing.
 * Allows the vending machine to support multiple payment methods
 * without modifying core logic.
 */
public interface PaymentStrategy {

    /**
     * Processes a payment of the given amount (in cents).
     * Returns true if the payment was successful.
     */
    boolean pay(int amount);

    /**
     * Returns a human-readable name for this payment type.
     */
    String getPaymentType();
}
```

---

## 6. CashPaymentStrategy

```java
package vendingmachine;

/**
 * Concrete strategy for cash payments (coins and notes).
 * In a cash transaction, the machine collects physical money,
 * so payment is always considered successful once the balance
 * has been verified by the state logic.
 */
public class CashPaymentStrategy implements PaymentStrategy {

    @Override
    public boolean pay(int amount) {
        // Cash payment is validated by the state machine's balance check.
        // If we reach this point, the balance was already confirmed sufficient.
        System.out.println("Processing cash payment of " + formatCents(amount));
        return true;
    }

    @Override
    public String getPaymentType() {
        return "CASH";
    }

    private String formatCents(int cents) {
        return String.format("$%.2f", cents / 100.0);
    }
}
```

---

## 7. CardPaymentStrategy

```java
package vendingmachine;

/**
 * Concrete strategy for card-based payments.
 * In a real system, this would integrate with a payment gateway.
 * Here we simulate the authorization process.
 */
public class CardPaymentStrategy implements PaymentStrategy {
    private final String cardNumber;

    public CardPaymentStrategy(String cardNumber) {
        if (cardNumber == null || cardNumber.length() < 4) {
            throw new IllegalArgumentException("Invalid card number");
        }
        this.cardNumber = cardNumber;
    }

    @Override
    public boolean pay(int amount) {
        // Simulate card authorization
        String maskedCard = "****-****-****-" + cardNumber.substring(cardNumber.length() - 4);
        System.out.println("Authorizing card " + maskedCard + " for " + formatCents(amount));
        // In production: call payment gateway API here
        System.out.println("Card payment approved.");
        return true;
    }

    @Override
    public String getPaymentType() {
        return "CARD";
    }

    private String formatCents(int cents) {
        return String.format("$%.2f", cents / 100.0);
    }
}
```

---

## 8. VendingState Interface

```java
package vendingmachine;

/**
 * State interface for the State pattern.
 *
 * Every possible action on the vending machine is declared here.
 * Each concrete state provides its own implementation, either
 * performing the action or rejecting it with a meaningful message.
 *
 * The VendingMachine delegates all action calls to its current state.
 */
public interface VendingState {

    /**
     * Handle money insertion.
     * @param machine the vending machine context
     * @param amount  the amount in cents being inserted
     */
    void insertMoney(VendingMachine machine, int amount);

    /**
     * Handle product selection.
     * @param machine the vending machine context
     * @param code    the product code selected by the user
     */
    void selectProduct(VendingMachine machine, String code);

    /**
     * Handle product dispensing.
     * @param machine the vending machine context
     */
    void dispense(VendingMachine machine);

    /**
     * Handle change return / transaction cancellation.
     * @param machine the vending machine context
     * @return the amount in cents returned to the user
     */
    int returnChange(VendingMachine machine);
}
```

---

## 9. IdleState

```java
package vendingmachine;

/**
 * The machine is idle -- waiting for a user to insert money.
 *
 * Valid action:  insertMoney() -> transitions to HasMoneyState
 * Invalid actions: selectProduct(), dispense(), returnChange()
 */
public class IdleState implements VendingState {

    @Override
    public void insertMoney(VendingMachine machine, int amount) {
        if (amount <= 0) {
            System.out.println("Invalid amount. Please insert a valid coin or note.");
            return;
        }
        machine.setCurrentBalance(machine.getCurrentBalance() + amount);
        System.out.println("Inserted " + formatCents(amount)
                + ". Current balance: " + formatCents(machine.getCurrentBalance()));
        // Transition: Idle -> HasMoney
        machine.setState(new HasMoneyState());
    }

    @Override
    public void selectProduct(VendingMachine machine, String code) {
        System.out.println("Please insert money first.");
    }

    @Override
    public void dispense(VendingMachine machine) {
        System.out.println("No transaction in progress. Please insert money and select a product.");
    }

    @Override
    public int returnChange(VendingMachine machine) {
        System.out.println("No money inserted. Nothing to return.");
        return 0;
    }

    private String formatCents(int cents) {
        return String.format("$%.2f", cents / 100.0);
    }

    @Override
    public String toString() {
        return "IDLE";
    }
}
```

---

## 10. HasMoneyState

```java
package vendingmachine;

/**
 * Money has been inserted. The user can:
 *   - Insert more money (stay in this state)
 *   - Select a product (transition to DispensingState if valid)
 *   - Cancel / return change (transition back to IdleState)
 *
 * Product selection involves two validations:
 *   1. The product must exist and be in stock.
 *   2. The current balance must be >= the product price.
 */
public class HasMoneyState implements VendingState {

    @Override
    public void insertMoney(VendingMachine machine, int amount) {
        if (amount <= 0) {
            System.out.println("Invalid amount. Please insert a valid coin or note.");
            return;
        }
        machine.setCurrentBalance(machine.getCurrentBalance() + amount);
        System.out.println("Inserted " + formatCents(amount)
                + ". Current balance: " + formatCents(machine.getCurrentBalance()));
        // Stay in HasMoneyState -- no transition needed
    }

    @Override
    public void selectProduct(VendingMachine machine, String code) {
        Inventory inventory = machine.getInventory();
        Product product = inventory.getProduct(code);

        // Validation 1: Does the product exist?
        if (product == null) {
            System.out.println("Invalid product code: " + code);
            return;
        }

        // Validation 2: Is the product in stock?
        if (\!inventory.isAvailable(code)) {
            System.out.println("Product " + product.getName() + " (" + code
                    + ") is out of stock. Please select another product.");
            return;
        }

        // Validation 3: Does the user have enough money?
        if (machine.getCurrentBalance() < product.getPrice()) {
            int shortfall = product.getPrice() - machine.getCurrentBalance();
            System.out.println("Insufficient funds for " + product.getName()
                    + " (" + product.getFormattedPrice() + ").");
            System.out.println("Please insert " + formatCents(shortfall)
                    + " more, or press cancel to return your money.");
            return;
        }

        // All validations passed -- set selected product and transition
        machine.setSelectedProduct(product);
        System.out.println("Product selected: " + product.getName()
                + " (" + product.getFormattedPrice() + ")");
        // Transition: HasMoney -> Dispensing
        machine.setState(new DispensingState());
    }

    @Override
    public void dispense(VendingMachine machine) {
        System.out.println("Please select a product first.");
    }

    @Override
    public int returnChange(VendingMachine machine) {
        int balance = machine.getCurrentBalance();
        System.out.println("Transaction cancelled. Returning " + formatCents(balance) + ".");
        machine.resetTransaction();
        // Transition: HasMoney -> Idle
        machine.setState(new IdleState());
        return balance;
    }

    private String formatCents(int cents) {
        return String.format("$%.2f", cents / 100.0);
    }

    @Override
    public String toString() {
        return "HAS_MONEY";
    }
}
```

---

## 11. DispensingState

```java
package vendingmachine;

/**
 * A product has been selected and funds are confirmed sufficient.
 * The only valid action is dispense(), which:
 *   1. Processes payment via the current PaymentStrategy
 *   2. Reduces inventory by 1
 *   3. Calculates and returns change
 *   4. Resets the transaction
 *   5. Transitions back to IdleState
 *
 * All other actions are rejected while dispensing is in progress.
 */
public class DispensingState implements VendingState {

    @Override
    public void insertMoney(VendingMachine machine, int amount) {
        System.out.println("Please wait, dispensing in progress. Cannot accept money right now.");
    }

    @Override
    public void selectProduct(VendingMachine machine, String code) {
        System.out.println("Please wait, dispensing in progress. Cannot change selection.");
    }

    @Override
    public void dispense(VendingMachine machine) {
        Product product = machine.getSelectedProduct();
        if (product == null) {
            System.out.println("Error: no product selected. Returning to idle.");
            machine.resetTransaction();
            machine.setState(new IdleState());
            return;
        }

        // Step 1: Process payment through the strategy
        PaymentStrategy strategy = machine.getPaymentStrategy();
        if (strategy \!= null) {
            strategy.pay(product.getPrice());
        }

        // Step 2: Reduce inventory
        machine.getInventory().reduceQuantity(product.getCode());

        // Step 3: Calculate change
        int change = machine.getCurrentBalance() - product.getPrice();

        // Step 4: Dispense the product
        System.out.println("============================================");
        System.out.println("  DISPENSING: " + product.getName());
        System.out.println("  Price:      " + product.getFormattedPrice());
        if (change > 0) {
            System.out.println("  Change:     " + formatCents(change));
        } else {
            System.out.println("  Change:     None (exact amount)");
        }
        System.out.println("============================================");
        System.out.println("Please collect your " + product.getName() + ".");
        if (change > 0) {
            System.out.println("Please collect your change: " + formatCents(change));
        }

        // Step 5: Reset and return to Idle
        machine.resetTransaction();
        machine.setState(new IdleState());
    }

    @Override
    public int returnChange(VendingMachine machine) {
        System.out.println("Cannot cancel now -- dispensing in progress. Product is being delivered.");
        return 0;
    }

    private String formatCents(int cents) {
        return String.format("$%.2f", cents / 100.0);
    }

    @Override
    public String toString() {
        return "DISPENSING";
    }
}
```

---

## 12. VendingMachine (Singleton)

```java
package vendingmachine;

/**
 * The central Singleton class that ties everything together.
 *
 * Responsibilities:
 *   - Holds the current state, inventory, balance, and selected product
 *   - Delegates all user actions to the current VendingState
 *   - Provides overloaded insertMoney() for both Coin and Note types
 *   - Manages payment strategy
 *   - Provides a reset method for cleaning up after each transaction
 *
 * Thread safety: uses double-checked locking for the singleton instance.
 */
public class VendingMachine {

    // --- Singleton ---
    private static volatile VendingMachine instance;

    public static VendingMachine getInstance() {
        if (instance == null) {
            synchronized (VendingMachine.class) {
                if (instance == null) {
                    instance = new VendingMachine();
                }
            }
        }
        return instance;
    }

    // --- State ---
    private VendingState currentState;

    // --- Data ---
    private final Inventory inventory;
    private int currentBalance; // in cents
    private Product selectedProduct;
    private PaymentStrategy paymentStrategy;

    /**
     * Private constructor -- use getInstance().
     * Initializes with IdleState, empty inventory, zero balance, and cash payment.
     */
    private VendingMachine() {
        this.currentState = new IdleState();
        this.inventory = new Inventory();
        this.currentBalance = 0;
        this.selectedProduct = null;
        this.paymentStrategy = new CashPaymentStrategy();
    }

    // ========================================================================
    // Public API -- delegates to current state
    // ========================================================================

    /**
     * Insert a coin into the machine.
     */
    public void insertMoney(Coin coin) {
        System.out.println("[State: " + currentState + "] Inserting " + coin.name()
                + " (" + formatCents(coin.getValue()) + ")");
        currentState.insertMoney(this, coin.getValue());
    }

    /**
     * Insert a note (bill) into the machine.
     */
    public void insertMoney(Note note) {
        System.out.println("[State: " + currentState + "] Inserting $" + note.name()
                + " note (" + formatCents(note.getValue()) + ")");
        currentState.insertMoney(this, note.getValue());
    }

    /**
     * Select a product by its code.
     */
    public void selectProduct(String code) {
        System.out.println("[State: " + currentState + "] Selecting product: " + code);
        currentState.selectProduct(this, code);
    }

    /**
     * Dispense the selected product.
     */
    public void dispense() {
        System.out.println("[State: " + currentState + "] Dispensing...");
        currentState.dispense(this);
    }

    /**
     * Cancel the transaction and return all inserted money.
     */
    public int cancelTransaction() {
        System.out.println("[State: " + currentState + "] Cancel requested.");
        return currentState.returnChange(this);
    }

    /**
     * Display all available products.
     */
    public void displayProducts() {
        inventory.displayProducts();
    }

    // ========================================================================
    // State management
    // ========================================================================

    public void setState(VendingState state) {
        System.out.println("  >> State transition: " + this.currentState + " -> " + state);
        this.currentState = state;
    }

    public VendingState getState() {
        return currentState;
    }

    // ========================================================================
    // Balance management
    // ========================================================================

    public int getCurrentBalance() {
        return currentBalance;
    }

    public void setCurrentBalance(int balance) {
        this.currentBalance = balance;
    }

    // ========================================================================
    // Selected product management
    // ========================================================================

    public Product getSelectedProduct() {
        return selectedProduct;
    }

    public void setSelectedProduct(Product product) {
        this.selectedProduct = product;
    }

    // ========================================================================
    // Inventory access
    // ========================================================================

    public Inventory getInventory() {
        return inventory;
    }

    // ========================================================================
    // Payment strategy
    // ========================================================================

    public PaymentStrategy getPaymentStrategy() {
        return paymentStrategy;
    }

    public void setPaymentStrategy(PaymentStrategy strategy) {
        this.paymentStrategy = strategy;
        System.out.println("Payment method set to: " + strategy.getPaymentType());
    }

    // ========================================================================
    // Transaction reset
    // ========================================================================

    /**
     * Clears the balance and selected product after a transaction completes
     * or is cancelled.
     */
    public void resetTransaction() {
        this.currentBalance = 0;
        this.selectedProduct = null;
    }

    // ========================================================================
    // Utility -- for testing / resetting singleton between test runs
    // ========================================================================

    /**
     * Resets the singleton instance. Use only in tests.
     */
    public static void resetInstance() {
        instance = null;
    }

    private String formatCents(int cents) {
        return String.format("$%.2f", cents / 100.0);
    }
}
```

---

## 13. VendingMachineDemo (Main)

```java
package vendingmachine;

/**
 * Full demonstration of the vending machine:
 *
 *   Scenario 1: Successful purchase with change
 *   Scenario 2: Insufficient funds, then add more and buy
 *   Scenario 3: Out-of-stock handling
 *   Scenario 4: Cancel transaction and get refund
 *   Scenario 5: Invalid product code
 *   Scenario 6: Invalid actions in wrong state
 *   Scenario 7: Card payment strategy
 *   Scenario 8: Exact amount -- no change
 */
public class VendingMachineDemo {

    public static void main(String[] args) {

        // ================================================================
        // SETUP: Get machine instance and stock it
        // ================================================================
        VendingMachine.resetInstance(); // clean slate for demo
        VendingMachine machine = VendingMachine.getInstance();

        // Stock the machine
        Inventory inv = machine.getInventory();
        inv.addProduct(new Product("A1", "Coca-Cola", 150),      5);  // $1.50
        inv.addProduct(new Product("A2", "Pepsi", 150),           3);  // $1.50
        inv.addProduct(new Product("B1", "Lays Chips", 125),      4);  // $1.25
        inv.addProduct(new Product("B2", "Snickers", 175),        2);  // $1.75
        inv.addProduct(new Product("C1", "Water Bottle", 100),    10); // $1.00
        inv.addProduct(new Product("C2", "Orange Juice", 200),    1);  // $2.00

        machine.displayProducts();

        // ================================================================
        // SCENARIO 1: Successful purchase with change
        // ================================================================
        printScenarioHeader(1, "Successful purchase with change");

        machine.insertMoney(Note.ONE);       // +$1.00  -> balance = $1.00
        machine.insertMoney(Coin.QUARTER);   // +$0.25  -> balance = $1.25
        machine.insertMoney(Coin.QUARTER);   // +$0.25  -> balance = $1.50
        machine.insertMoney(Coin.QUARTER);   // +$0.25  -> balance = $1.75
        machine.selectProduct("A1");         // Coca-Cola $1.50 -- balance sufficient
        machine.dispense();                  // Dispense + return $0.25 change

        // ================================================================
        // SCENARIO 2: Insufficient funds, then add more and buy
        // ================================================================
        printScenarioHeader(2, "Insufficient funds, then add more and purchase");

        machine.insertMoney(Coin.QUARTER);   // +$0.25  -> balance = $0.25
        machine.insertMoney(Coin.QUARTER);   // +$0.25  -> balance = $0.50
        machine.selectProduct("B1");         // Lays Chips $1.25 -- NOT ENOUGH
        // Still in HasMoney state -- insert more
        machine.insertMoney(Coin.QUARTER);   // +$0.25  -> balance = $0.75
        machine.insertMoney(Coin.QUARTER);   // +$0.25  -> balance = $1.00
        machine.insertMoney(Coin.QUARTER);   // +$0.25  -> balance = $1.25
        machine.selectProduct("B1");         // Lays Chips $1.25 -- exact amount\!
        machine.dispense();                  // Dispense, no change

        // ================================================================
        // SCENARIO 3: Out-of-stock handling
        // ================================================================
        printScenarioHeader(3, "Out-of-stock product");

        // Deplete Orange Juice (only 1 in stock)
        machine.insertMoney(Note.FIVE);      // +$5.00
        machine.selectProduct("C2");         // OJ $2.00 -- last one
        machine.dispense();                  // Dispense + return $3.00 change

        // Now try to buy another Orange Juice -- should be out of stock
        machine.insertMoney(Note.FIVE);      // +$5.00
        machine.selectProduct("C2");         // OUT OF STOCK
        // Cancel and get refund since we can't buy what we wanted
        machine.cancelTransaction();

        // ================================================================
        // SCENARIO 4: Cancel transaction and get refund
        // ================================================================
        printScenarioHeader(4, "Cancel transaction and get refund");

        machine.insertMoney(Note.ONE);       // +$1.00
        machine.insertMoney(Coin.QUARTER);   // +$0.25
        machine.insertMoney(Coin.DIME);      // +$0.10
        machine.insertMoney(Coin.NICKEL);    // +$0.05
        // User changes their mind
        machine.cancelTransaction();         // Returns $1.40

        // ================================================================
        // SCENARIO 5: Invalid product code
        // ================================================================
        printScenarioHeader(5, "Invalid product code");

        machine.insertMoney(Note.ONE);       // +$1.00
        machine.selectProduct("Z9");         // Invalid code
        machine.cancelTransaction();         // Return the money

        // ================================================================
        // SCENARIO 6: Invalid actions in wrong state
        // ================================================================
        printScenarioHeader(6, "Invalid actions in wrong state");

        // Try to select product without inserting money (IdleState)
        machine.selectProduct("A1");

        // Try to dispense without any transaction (IdleState)
        machine.dispense();

        // Try to cancel with no money (IdleState)
        machine.cancelTransaction();

        // Now insert money and try to dispense without selecting (HasMoneyState)
        machine.insertMoney(Coin.QUARTER);
        machine.dispense();                  // Should say "select a product first"
        machine.cancelTransaction();         // Clean up

        // ================================================================
        // SCENARIO 7: Card payment strategy
        // ================================================================
        printScenarioHeader(7, "Card payment strategy");

        machine.setPaymentStrategy(new CardPaymentStrategy("4111111111111234"));
        machine.insertMoney(Note.FIVE);
        machine.selectProduct("B2");         // Snickers $1.75
        machine.dispense();                  // Card payment + dispense

        // Switch back to cash for remaining scenarios
        machine.setPaymentStrategy(new CashPaymentStrategy());

        // ================================================================
        // SCENARIO 8: Exact amount -- no change
        // ================================================================
        printScenarioHeader(8, "Exact amount payment -- no change returned");

        machine.insertMoney(Note.ONE);       // +$1.00
        machine.selectProduct("C1");         // Water Bottle $1.00 -- exact\!
        machine.dispense();                  // Dispense, $0.00 change

        // ================================================================
        // FINAL: Display updated inventory
        // ================================================================
        System.out.println("\n");
        System.out.println("========== FINAL INVENTORY STATUS ==========");
        machine.displayProducts();

        System.out.println("\nAll scenarios completed successfully.");
    }

    private static void printScenarioHeader(int number, String description) {
        System.out.println("\n");
        System.out.println("########################################");
        System.out.println("  SCENARIO " + number + ": " + description);
        System.out.println("########################################");
        System.out.println();
    }
}
```

---

## 14. Expected Output

```
============================================
         VENDING MACHINE PRODUCTS
============================================
Code   Name                 Price    Stock
--------------------------------------------
A1     Coca-Cola            $1.50    5
A2     Pepsi                $1.50    3
B1     Lays Chips           $1.25    4
B2     Snickers             $1.75    2
C1     Water Bottle         $1.00    10
C2     Orange Juice         $2.00    1
============================================


########################################
  SCENARIO 1: Successful purchase with change
########################################

[State: IDLE] Inserting $ONE note ($1.00)
Inserted $1.00. Current balance: $1.00
  >> State transition: IDLE -> HAS_MONEY
[State: HAS_MONEY] Inserting QUARTER ($0.25)
Inserted $0.25. Current balance: $1.25
[State: HAS_MONEY] Inserting QUARTER ($0.25)
Inserted $0.25. Current balance: $1.50
[State: HAS_MONEY] Inserting QUARTER ($0.25)
Inserted $0.25. Current balance: $1.75
[State: HAS_MONEY] Selecting product: A1
Product selected: Coca-Cola ($1.50)
  >> State transition: HAS_MONEY -> DISPENSING
[State: DISPENSING] Dispensing...
Processing cash payment of $1.50
============================================
  DISPENSING: Coca-Cola
  Price:      $1.50
  Change:     $0.25
============================================
Please collect your Coca-Cola.
Please collect your change: $0.25
  >> State transition: DISPENSING -> IDLE


########################################
  SCENARIO 2: Insufficient funds, then add more and purchase
########################################

[State: IDLE] Inserting QUARTER ($0.25)
Inserted $0.25. Current balance: $0.25
  >> State transition: IDLE -> HAS_MONEY
[State: HAS_MONEY] Inserting QUARTER ($0.25)
Inserted $0.25. Current balance: $0.50
[State: HAS_MONEY] Selecting product: B1
Insufficient funds for Lays Chips ($1.25).
Please insert $0.75 more, or press cancel to return your money.
[State: HAS_MONEY] Inserting QUARTER ($0.25)
Inserted $0.25. Current balance: $0.75
[State: HAS_MONEY] Inserting QUARTER ($0.25)
Inserted $0.25. Current balance: $1.00
[State: HAS_MONEY] Inserting QUARTER ($0.25)
Inserted $0.25. Current balance: $1.25
[State: HAS_MONEY] Selecting product: B1
Product selected: Lays Chips ($1.25)
  >> State transition: HAS_MONEY -> DISPENSING
[State: DISPENSING] Dispensing...
Processing cash payment of $1.25
============================================
  DISPENSING: Lays Chips
  Price:      $1.25
  Change:     None (exact amount)
============================================
Please collect your Lays Chips.
  >> State transition: DISPENSING -> IDLE


########################################
  SCENARIO 3: Out-of-stock product
########################################

[State: IDLE] Inserting $FIVE note ($5.00)
Inserted $5.00. Current balance: $5.00
  >> State transition: IDLE -> HAS_MONEY
[State: HAS_MONEY] Selecting product: C2
Product selected: Orange Juice ($2.00)
  >> State transition: HAS_MONEY -> DISPENSING
[State: DISPENSING] Dispensing...
Processing cash payment of $2.00
============================================
  DISPENSING: Orange Juice
  Price:      $2.00
  Change:     $3.00
============================================
Please collect your Orange Juice.
Please collect your change: $3.00
  >> State transition: DISPENSING -> IDLE
[State: IDLE] Inserting $FIVE note ($5.00)
Inserted $5.00. Current balance: $5.00
  >> State transition: IDLE -> HAS_MONEY
[State: HAS_MONEY] Selecting product: C2
Product Orange Juice (C2) is out of stock. Please select another product.
[State: HAS_MONEY] Cancel requested.
Transaction cancelled. Returning $5.00.
  >> State transition: HAS_MONEY -> IDLE


########################################
  SCENARIO 4: Cancel transaction and get refund
########################################

[State: IDLE] Inserting $ONE note ($1.00)
Inserted $1.00. Current balance: $1.00
  >> State transition: IDLE -> HAS_MONEY
[State: HAS_MONEY] Inserting QUARTER ($0.25)
Inserted $0.25. Current balance: $1.25
[State: HAS_MONEY] Inserting DIME ($0.10)
Inserted $0.10. Current balance: $1.35
[State: HAS_MONEY] Inserting NICKEL ($0.05)
Inserted $0.05. Current balance: $1.40
[State: HAS_MONEY] Cancel requested.
Transaction cancelled. Returning $1.40.
  >> State transition: HAS_MONEY -> IDLE


########################################
  SCENARIO 5: Invalid product code
########################################

[State: IDLE] Inserting $ONE note ($1.00)
Inserted $1.00. Current balance: $1.00
  >> State transition: IDLE -> HAS_MONEY
[State: HAS_MONEY] Selecting product: Z9
Invalid product code: Z9
[State: HAS_MONEY] Cancel requested.
Transaction cancelled. Returning $1.00.
  >> State transition: HAS_MONEY -> IDLE


########################################
  SCENARIO 6: Invalid actions in wrong state
########################################

[State: IDLE] Selecting product: A1
Please insert money first.
[State: IDLE] Dispensing...
No transaction in progress. Please insert money and select a product.
[State: IDLE] Cancel requested.
No money inserted. Nothing to return.
[State: IDLE] Inserting QUARTER ($0.25)
Inserted $0.25. Current balance: $0.25
  >> State transition: IDLE -> HAS_MONEY
[State: HAS_MONEY] Dispensing...
Please select a product first.
[State: HAS_MONEY] Cancel requested.
Transaction cancelled. Returning $0.25.
  >> State transition: HAS_MONEY -> IDLE


########################################
  SCENARIO 7: Card payment strategy
########################################

Payment method set to: CARD
[State: IDLE] Inserting $FIVE note ($5.00)
Inserted $5.00. Current balance: $5.00
  >> State transition: IDLE -> HAS_MONEY
[State: HAS_MONEY] Selecting product: B2
Product selected: Snickers ($1.75)
  >> State transition: HAS_MONEY -> DISPENSING
[State: DISPENSING] Dispensing...
Authorizing card ****-****-****-1234 for $1.75
Card payment approved.
============================================
  DISPENSING: Snickers
  Price:      $1.75
  Change:     $3.25
============================================
Please collect your Snickers.
Please collect your change: $3.25
  >> State transition: DISPENSING -> IDLE


########################################
  SCENARIO 8: Exact amount payment -- no change returned
########################################

[State: IDLE] Inserting $ONE note ($1.00)
Inserted $1.00. Current balance: $1.00
  >> State transition: IDLE -> HAS_MONEY
[State: HAS_MONEY] Selecting product: C1
Product selected: Water Bottle ($1.00)
  >> State transition: HAS_MONEY -> DISPENSING
[State: DISPENSING] Dispensing...
Processing cash payment of $1.00
============================================
  DISPENSING: Water Bottle
  Price:      $1.00
  Change:     None (exact amount)
============================================
Please collect your Water Bottle.
  >> State transition: DISPENSING -> IDLE


========== FINAL INVENTORY STATUS ==========
============================================
         VENDING MACHINE PRODUCTS
============================================
Code   Name                 Price    Stock
--------------------------------------------
A1     Coca-Cola            $1.50    4
A2     Pepsi                $1.50    3
B1     Lays Chips           $1.25    3
B2     Snickers             $1.75    1
C1     Water Bottle         $1.00    9
C2     Orange Juice         $2.00    SOLD OUT
============================================

All scenarios completed successfully.
```

---

## 15. Key Design Decisions

### Why integers for money?
Floating-point arithmetic causes rounding errors (`0.1 + 0.2 \!= 0.3`). Storing all
values in cents as integers eliminates this entire class of bugs. The `formatCents()`
helper handles display conversion.

### Why create new state objects on each transition?
State objects in this design are stateless -- they carry no instance data. Creating
new instances on each transition is cheap and avoids shared mutable state. An
alternative is to cache state instances as constants, but the allocation cost is
negligible here and the code reads more clearly.

### Why does the VendingMachine pass itself to state methods?
This is the standard State pattern approach. The state object needs access to the
machine's balance, inventory, and state-setter to do its work. Passing `this`
(the context) lets each state operate on the machine without storing a back-reference,
keeping state objects lightweight and reusable.

### Why Singleton with resetInstance()?
The `resetInstance()` method exists purely for testing. In production, the singleton
lives for the application's lifetime. In unit tests, each test can call
`resetInstance()` before `getInstance()` to get a clean machine.

### Why separate Coin and Note enums?
They represent physically different things (coins vs. paper bills) with different
value ranges. Separate enums make the API self-documenting:
`machine.insertMoney(Coin.QUARTER)` vs. `machine.insertMoney(Note.FIVE)`. The
overloaded `insertMoney()` methods on `VendingMachine` handle the dispatch.
