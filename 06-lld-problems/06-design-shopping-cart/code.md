# Online Shopping Cart with Pricing Rules -- Full Java Code

## Table of Contents

1. [Category Enum](#1-category-enum)
2. [Product](#2-product)
3. [CartItem](#3-cartitem)
4. [CartObserver and Implementations](#4-cartobserver)
5. [Cart](#5-cart)
6. [PricingRule Interface (Strategy)](#6-pricingrule-interface)
7. [FlatDiscount](#7-flatdiscount)
8. [PercentDiscount](#8-percentdiscount)
9. [BuyXGetYFree](#9-buyxgetyfree)
10. [CategoryDiscount](#10-categorydiscount)
11. [Coupon with Validation](#11-coupon)
12. [DiscountDetail and PricingResult](#12-discountdetail-and-pricingresult)
13. [PricingEngine](#13-pricingengine)
14. [TaxCalculator](#14-taxcalculator)
15. [Order and OrderLineItem](#15-order-and-orderlineitem)
16. [OrderBuilder](#16-orderbuilder)
17. [Main Demo](#17-main-demo)

---

## 1. Category Enum

```java
public enum Category {
    ELECTRONICS,
    CLOTHING,
    GROCERIES,
    BOOKS
}
```

---

## 2. Product

```java
public class Product {
    private final String id;
    private final String name;
    private final double price;
    private final Category category;

    public Product(String id, String name, double price, Category category) {
        if (price < 0) throw new IllegalArgumentException("Price cannot be negative");
        this.id = id;
        this.name = name;
        this.price = price;
        this.category = category;
    }

    public String getId()        { return id; }
    public String getName()      { return name; }
    public double getPrice()     { return price; }
    public Category getCategory(){ return category; }

    @Override
    public String toString() {
        return name + " ($" + String.format("%.2f", price) + ", " + category + ")";
    }
}
```

---

## 3. CartItem

```java
public class CartItem {
    private final Product product;
    private int quantity;

    public CartItem(Product product, int quantity) {
        if (quantity <= 0) throw new IllegalArgumentException("Quantity must be positive");
        this.product = product;
        this.quantity = quantity;
    }

    public Product getProduct()   { return product; }
    public int getQuantity()      { return quantity; }

    public void setQuantity(int quantity) {
        if (quantity <= 0) throw new IllegalArgumentException("Quantity must be positive");
        this.quantity = quantity;
    }

    public void addQuantity(int delta) {
        if (delta <= 0) throw new IllegalArgumentException("Delta must be positive");
        this.quantity += delta;
    }

    /** Subtotal = unit price * quantity (before any discounts). */
    public double getSubtotal() {
        return product.getPrice() * quantity;
    }

    @Override
    public String toString() {
        return product.getName() + " x" + quantity
                + " = $" + String.format("%.2f", getSubtotal());
    }
}
```

---

## 4. CartObserver

### Observer Interface

```java
/** Observer pattern -- notified whenever the cart changes. */
public interface CartObserver {
    void onCartChanged(Cart cart);
}
```

### PricingSummaryObserver (Concrete Observer)

```java
public class PricingSummaryObserver implements CartObserver {

    @Override
    public void onCartChanged(Cart cart) {
        System.out.println("[Observer] Cart updated. "
                + cart.getItems().size() + " unique item(s), "
                + "subtotal = $" + String.format("%.2f", cart.getSubtotal()));
    }
}
```

### InventoryObserver (Concrete Observer)

```java
public class InventoryObserver implements CartObserver {

    @Override
    public void onCartChanged(Cart cart) {
        System.out.println("[InventoryObserver] Checking stock for "
                + cart.getItems().size() + " item(s)...");
    }
}
```

---

## 5. Cart

```java
import java.util.*;

public class Cart {
    private final Map<String, CartItem> items = new LinkedHashMap<>();
    private final List<CartObserver> observers = new ArrayList<>();

    // ---- Item management ----

    public void addItem(Product product, int quantity) {
        if (quantity <= 0) throw new IllegalArgumentException("Quantity must be positive");

        CartItem existing = items.get(product.getId());
        if (existing != null) {
            existing.addQuantity(quantity);
        } else {
            items.put(product.getId(), new CartItem(product, quantity));
        }
        notifyObservers();
    }

    public void removeItem(String productId) {
        CartItem removed = items.remove(productId);
        if (removed == null) {
            System.out.println("[Cart] Warning: product " + productId + " not in cart.");
            return;
        }
        notifyObservers();
    }

    public void updateQuantity(String productId, int newQuantity) {
        CartItem item = items.get(productId);
        if (item == null) {
            System.out.println("[Cart] Warning: product " + productId + " not in cart.");
            return;
        }
        if (newQuantity <= 0) {
            items.remove(productId);
        } else {
            item.setQuantity(newQuantity);
        }
        notifyObservers();
    }

    // ---- Queries ----

    public Collection<CartItem> getItems() {
        return Collections.unmodifiableCollection(items.values());
    }

    public CartItem getItem(String productId) {
        return items.get(productId);
    }

    public boolean isEmpty() {
        return items.isEmpty();
    }

    /** Raw subtotal before any discounts. */
    public double getSubtotal() {
        double total = 0;
        for (CartItem item : items.values()) {
            total += item.getSubtotal();
        }
        return total;
    }

    // ---- Observer management ----

    public void addObserver(CartObserver observer) {
        observers.add(observer);
    }

    public void removeObserver(CartObserver observer) {
        observers.remove(observer);
    }

    private void notifyObservers() {
        for (CartObserver obs : observers) {
            obs.onCartChanged(this);
        }
    }

    // ---- Display ----

    public void printCart() {
        System.out.println("===== Shopping Cart =====");
        if (items.isEmpty()) {
            System.out.println("  (empty)");
        } else {
            for (CartItem item : items.values()) {
                System.out.println("  " + item);
            }
            System.out.println("  -----------------------");
            System.out.println("  Subtotal: $" + String.format("%.2f", getSubtotal()));
        }
        System.out.println("=========================");
    }
}
```

---

## 6. PricingRule Interface

```java
/**
 * Strategy pattern -- each pricing rule encapsulates a single discount algorithm.
 *
 * Rules are applied in priority order (lower number = applied first).
 * Each rule receives the cart and the current running total, and returns
 * the new running total after applying its discount.
 */
public interface PricingRule {

    /**
     * Apply this rule's discount to the running total.
     *
     * @param cart         the current cart (for item-level inspection)
     * @param runningTotal the total after all higher-priority rules
     * @return the new running total (must be >= 0)
     */
    double apply(Cart cart, double runningTotal);

    /** Lower priority number = applied first. */
    int getPriority();

    /** Human-readable description for the order summary. */
    String getDescription();
}
```

---

## 7. FlatDiscount

```java
/**
 * Subtracts a fixed dollar amount from the running total.
 * Example: "$20 off your order"
 */
public class FlatDiscount implements PricingRule {
    private final double amount;
    private final int priority;

    public FlatDiscount(double amount, int priority) {
        if (amount < 0) throw new IllegalArgumentException("Discount amount cannot be negative");
        this.amount = amount;
        this.priority = priority;
    }

    @Override
    public double apply(Cart cart, double runningTotal) {
        double discount = Math.min(amount, runningTotal);  // never go below zero
        return runningTotal - discount;
    }

    @Override
    public int getPriority() { return priority; }

    @Override
    public String getDescription() {
        return "Flat $" + String.format("%.2f", amount) + " off";
    }
}
```

---

## 8. PercentDiscount

```java
/**
 * Reduces the running total by a percentage.
 * Example: "15% off your entire order"
 */
public class PercentDiscount implements PricingRule {
    private final double percent;   // e.g., 15.0 for 15%
    private final int priority;

    public PercentDiscount(double percent, int priority) {
        if (percent < 0 || percent > 100) {
            throw new IllegalArgumentException("Percent must be between 0 and 100");
        }
        this.percent = percent;
        this.priority = priority;
    }

    @Override
    public double apply(Cart cart, double runningTotal) {
        double discount = runningTotal * (percent / 100.0);
        return runningTotal - discount;
    }

    @Override
    public int getPriority() { return priority; }

    @Override
    public String getDescription() {
        return String.format("%.0f", percent) + "% off entire order";
    }
}
```

---

## 9. BuyXGetYFree

```java
/**
 * For a specific product: if the customer buys at least (buyCount + freeCount) units,
 * the cheapest `freeCount` units are free.
 *
 * Example: buy 2 get 1 free on product "P001"
 *   - Customer has 3 units -> 1 unit is free
 *   - Customer has 6 units -> 2 units are free
 *   - Customer has 2 units -> no discount (need at least 3)
 */
public class BuyXGetYFree implements PricingRule {
    private final String productId;
    private final int buyCount;
    private final int freeCount;
    private final int priority;

    public BuyXGetYFree(String productId, int buyCount, int freeCount, int priority) {
        this.productId = productId;
        this.buyCount = buyCount;
        this.freeCount = freeCount;
        this.priority = priority;
    }

    @Override
    public double apply(Cart cart, double runningTotal) {
        CartItem item = cart.getItem(productId);
        if (item == null) return runningTotal;

        int qty = item.getQuantity();
        int groupSize = buyCount + freeCount;

        if (qty < groupSize) return runningTotal;  // not enough to trigger

        // How many complete groups?
        int completeGroups = qty / groupSize;
        // Each group gives `freeCount` free items
        int totalFreeItems = completeGroups * freeCount;

        double unitPrice = item.getProduct().getPrice();
        double discount = totalFreeItems * unitPrice;

        // Ensure we don't over-discount
        discount = Math.min(discount, runningTotal);
        return runningTotal - discount;
    }

    @Override
    public int getPriority() { return priority; }

    @Override
    public String getDescription() {
        return "Buy " + buyCount + " Get " + freeCount
                + " Free on product " + productId;
    }
}
```

---

## 10. CategoryDiscount

```java
/**
 * Applies a percentage discount to all items in a specific category.
 * Example: "20% off all Electronics"
 */
public class CategoryDiscount implements PricingRule {
    private final Category category;
    private final double percent;
    private final int priority;

    public CategoryDiscount(Category category, double percent, int priority) {
        if (percent < 0 || percent > 100) {
            throw new IllegalArgumentException("Percent must be between 0 and 100");
        }
        this.category = category;
        this.percent = percent;
        this.priority = priority;
    }

    @Override
    public double apply(Cart cart, double runningTotal) {
        double categorySubtotal = 0;
        for (CartItem item : cart.getItems()) {
            if (item.getProduct().getCategory() == category) {
                categorySubtotal += item.getSubtotal();
            }
        }

        if (categorySubtotal == 0) return runningTotal;

        double discount = categorySubtotal * (percent / 100.0);
        discount = Math.min(discount, runningTotal);
        return runningTotal - discount;
    }

    @Override
    public int getPriority() { return priority; }

    @Override
    public String getDescription() {
        return String.format("%.0f", percent) + "% off " + category + " items";
    }
}
```

---

## 11. Coupon

```java
import java.time.LocalDate;

/**
 * A coupon wraps an inner PricingRule (flat or percent) and adds validation:
 *  - Must not be expired
 *  - Cart subtotal must meet minimum value
 *
 * Implements PricingRule itself so the PricingEngine can treat it uniformly.
 */
public class Coupon implements PricingRule {
    private final String code;
    private final PricingRule innerRule;      // the actual discount (flat or percent)
    private final LocalDate expiryDate;
    private final double minCartValue;
    private final int priority;

    public Coupon(String code, PricingRule innerRule,
                  LocalDate expiryDate, double minCartValue, int priority) {
        this.code = code;
        this.innerRule = innerRule;
        this.expiryDate = expiryDate;
        this.minCartValue = minCartValue;
        this.priority = priority;
    }

    /** Checks expiry date and minimum cart value. */
    public boolean isValid(double cartSubtotal) {
        if (LocalDate.now().isAfter(expiryDate)) {
            System.out.println("[Coupon] '" + code + "' is expired.");
            return false;
        }
        if (cartSubtotal < minCartValue) {
            System.out.println("[Coupon] '" + code + "' requires min cart value $"
                    + String.format("%.2f", minCartValue)
                    + " but cart is $" + String.format("%.2f", cartSubtotal) + ".");
            return false;
        }
        return true;
    }

    @Override
    public double apply(Cart cart, double runningTotal) {
        // Validate against the ORIGINAL cart subtotal (not the discounted running total)
        if (!isValid(cart.getSubtotal())) {
            return runningTotal;  // skip silently
        }
        return innerRule.apply(cart, runningTotal);
    }

    @Override
    public int getPriority() { return priority; }

    @Override
    public String getDescription() {
        return "Coupon '" + code + "': " + innerRule.getDescription();
    }

    public String getCode() { return code; }
}
```

---

## 12. DiscountDetail and PricingResult

```java
/**
 * Records one discount that was applied.
 */
public class DiscountDetail {
    private final String description;
    private final double amountOff;

    public DiscountDetail(String description, double amountOff) {
        this.description = description;
        this.amountOff = amountOff;
    }

    public String getDescription() { return description; }
    public double getAmountOff()   { return amountOff; }

    @Override
    public String toString() {
        return description + " -> -$" + String.format("%.2f", amountOff);
    }
}
```

```java
import java.util.List;

/**
 * Result of running the PricingEngine on a cart.
 */
public class PricingResult {
    private final double originalTotal;
    private final double discountedTotal;
    private final List<DiscountDetail> discountsApplied;

    public PricingResult(double originalTotal, double discountedTotal,
                         List<DiscountDetail> discountsApplied) {
        this.originalTotal = originalTotal;
        this.discountedTotal = discountedTotal;
        this.discountsApplied = discountsApplied;
    }

    public double getOriginalTotal()               { return originalTotal; }
    public double getDiscountedTotal()              { return discountedTotal; }
    public List<DiscountDetail> getDiscountsApplied() { return discountsApplied; }

    public double getTotalDiscount() {
        return originalTotal - discountedTotal;
    }
}
```

---

## 13. PricingEngine

```java
import java.util.*;

/**
 * Orchestrates pricing rules in priority order.
 *
 * Decorator-style chaining: each rule takes the running total from the
 * previous rule and returns a (possibly reduced) total. The output of
 * one rule is the input to the next.
 */
public class PricingEngine {
    private final List<PricingRule> rules = new ArrayList<>();

    public void addRule(PricingRule rule) {
        rules.add(rule);
        // Keep sorted by priority (lower = first)
        rules.sort(Comparator.comparingInt(PricingRule::getPriority));
    }

    /**
     * Apply all rules in priority order. Returns a PricingResult
     * with the original total, discounted total, and a breakdown
     * of every discount that fired.
     */
    public PricingResult applyAll(Cart cart) {
        double originalTotal = cart.getSubtotal();
        double runningTotal = originalTotal;
        List<DiscountDetail> details = new ArrayList<>();

        for (PricingRule rule : rules) {
            double before = runningTotal;
            runningTotal = rule.apply(cart, runningTotal);

            // Floor at zero
            if (runningTotal < 0) runningTotal = 0;

            double saved = before - runningTotal;
            if (saved > 0.001) {  // only record if meaningful discount
                details.add(new DiscountDetail(rule.getDescription(), saved));
            }
        }

        return new PricingResult(originalTotal, runningTotal, details);
    }
}
```

---

## 14. TaxCalculator

```java
import java.util.*;

/**
 * Calculates tax per category using configurable rates.
 * Categories with no configured rate default to 0%.
 */
public class TaxCalculator {
    private final Map<Category, Double> taxRates = new HashMap<>();

    public TaxCalculator() {
        // Default rates -- can be overridden
        taxRates.put(Category.ELECTRONICS, 12.0);
        taxRates.put(Category.CLOTHING, 5.0);
        taxRates.put(Category.GROCERIES, 0.0);
        taxRates.put(Category.BOOKS, 0.0);
    }

    public void setRate(Category category, double ratePercent) {
        taxRates.put(category, ratePercent);
    }

    public double getRate(Category category) {
        return taxRates.getOrDefault(category, 0.0);
    }

    /**
     * Calculates tax on the post-discount cart.
     *
     * Strategy: distribute the total discount proportionally across items,
     * then apply each category's tax rate to the item's discounted subtotal.
     *
     * @param cart            the cart with items
     * @param discountedTotal the total after all discounts
     * @return TaxResult with breakdown and total
     */
    public TaxResult calculateTax(Cart cart, double discountedTotal) {
        double originalTotal = cart.getSubtotal();
        Map<Category, Double> breakdown = new LinkedHashMap<>();
        double totalTax = 0;

        if (originalTotal == 0) {
            return new TaxResult(breakdown, 0);
        }

        // Proportional discount factor
        double discountRatio = discountedTotal / originalTotal;

        for (CartItem item : cart.getItems()) {
            Category cat = item.getProduct().getCategory();
            double itemDiscountedSubtotal = item.getSubtotal() * discountRatio;
            double rate = getRate(cat) / 100.0;
            double tax = itemDiscountedSubtotal * rate;

            breakdown.merge(cat, tax, Double::sum);
            totalTax += tax;
        }

        return new TaxResult(breakdown, totalTax);
    }
}
```

```java
import java.util.Map;

/**
 * Result of tax calculation with per-category breakdown.
 */
public class TaxResult {
    private final Map<Category, Double> taxBreakdown;
    private final double totalTax;

    public TaxResult(Map<Category, Double> taxBreakdown, double totalTax) {
        this.taxBreakdown = taxBreakdown;
        this.totalTax = totalTax;
    }

    public Map<Category, Double> getTaxBreakdown() { return taxBreakdown; }
    public double getTotalTax()                     { return totalTax; }

    public void printBreakdown() {
        for (Map.Entry<Category, Double> entry : taxBreakdown.entrySet()) {
            if (entry.getValue() > 0.001) {
                System.out.println("    " + entry.getKey()
                        + " tax: $" + String.format("%.2f", entry.getValue()));
            }
        }
    }
}
```

---

## 15. Order and OrderLineItem

```java
/**
 * A single line in an order receipt.
 */
public class OrderLineItem {
    private final String productName;
    private final int quantity;
    private final double unitPrice;
    private final double lineTotal;

    public OrderLineItem(String productName, int quantity,
                         double unitPrice, double lineTotal) {
        this.productName = productName;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.lineTotal = lineTotal;
    }

    public String getProductName() { return productName; }
    public int getQuantity()       { return quantity; }
    public double getUnitPrice()   { return unitPrice; }
    public double getLineTotal()   { return lineTotal; }

    @Override
    public String toString() {
        return String.format("  %-20s %3d x $%8.2f = $%8.2f",
                productName, quantity, unitPrice, lineTotal);
    }
}
```

```java
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

/**
 * Immutable order produced by OrderBuilder.
 * Contains the complete breakdown: line items, discounts, tax, grand total.
 */
public class Order {
    private final String orderId;
    private final List<OrderLineItem> lineItems;
    private final double subtotal;
    private final List<DiscountDetail> discountsApplied;
    private final double totalDiscount;
    private final double taxAmount;
    private final double grandTotal;
    private final LocalDateTime createdAt;

    Order(List<OrderLineItem> lineItems, double subtotal,
          List<DiscountDetail> discountsApplied, double totalDiscount,
          double taxAmount, double grandTotal) {
        this.orderId = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.lineItems = List.copyOf(lineItems);               // immutable
        this.subtotal = subtotal;
        this.discountsApplied = List.copyOf(discountsApplied); // immutable
        this.totalDiscount = totalDiscount;
        this.taxAmount = taxAmount;
        this.grandTotal = grandTotal;
        this.createdAt = LocalDateTime.now();
    }

    // ---- Getters ----

    public String getOrderId()                        { return orderId; }
    public List<OrderLineItem> getLineItems()         { return lineItems; }
    public double getSubtotal()                       { return subtotal; }
    public List<DiscountDetail> getDiscountsApplied() { return discountsApplied; }
    public double getTotalDiscount()                  { return totalDiscount; }
    public double getTaxAmount()                      { return taxAmount; }
    public double getGrandTotal()                     { return grandTotal; }
    public LocalDateTime getCreatedAt()               { return createdAt; }

    // ---- Summary ----

    public void printSummary() {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        System.out.println();
        System.out.println("╔══════════════════════════════════════════════════════════╗");
        System.out.println("║                    ORDER RECEIPT                         ║");
        System.out.println("╠══════════════════════════════════════════════════════════╣");
        System.out.println("  Order ID : " + orderId);
        System.out.println("  Date     : " + createdAt.format(fmt));
        System.out.println("──────────────────────────────────────────────────────────");
        System.out.println("  ITEMS:");
        for (OrderLineItem li : lineItems) {
            System.out.println(li);
        }
        System.out.println("──────────────────────────────────────────────────────────");
        System.out.printf("  Subtotal:              $%8.2f%n", subtotal);

        if (!discountsApplied.isEmpty()) {
            System.out.println("  DISCOUNTS:");
            for (DiscountDetail d : discountsApplied) {
                System.out.printf("    %-38s -$%8.2f%n", d.getDescription(), d.getAmountOff());
            }
            System.out.printf("  Total Discount:        -$%8.2f%n", totalDiscount);
        }

        System.out.printf("  Tax:                    $%8.2f%n", taxAmount);
        System.out.println("══════════════════════════════════════════════════════════");
        System.out.printf("  GRAND TOTAL:            $%8.2f%n", grandTotal);
        System.out.println("╚══════════════════════════════════════════════════════════╝");
        System.out.println();
    }
}
```

---

## 16. OrderBuilder

```java
import java.util.*;

/**
 * Builder pattern: assembles an Order from a Cart by applying pricing rules,
 * computing tax, and building line items.
 *
 * Usage:
 *   Order order = new OrderBuilder()
 *       .setCart(cart)
 *       .setPricingEngine(engine)
 *       .setTaxCalculator(taxCalc)
 *       .setCoupon(coupon)        // optional
 *       .build();
 */
public class OrderBuilder {
    private Cart cart;
    private PricingEngine pricingEngine;
    private TaxCalculator taxCalculator;
    private Coupon coupon;

    public OrderBuilder setCart(Cart cart) {
        this.cart = cart;
        return this;
    }

    public OrderBuilder setPricingEngine(PricingEngine pricingEngine) {
        this.pricingEngine = pricingEngine;
        return this;
    }

    public OrderBuilder setTaxCalculator(TaxCalculator taxCalculator) {
        this.taxCalculator = taxCalculator;
        return this;
    }

    public OrderBuilder setCoupon(Coupon coupon) {
        this.coupon = coupon;
        return this;
    }

    public Order build() {
        // ---- Validate ----
        if (cart == null || cart.isEmpty()) {
            throw new IllegalStateException("Cannot build order from empty or null cart");
        }
        if (pricingEngine == null) {
            throw new IllegalStateException("PricingEngine is required");
        }
        if (taxCalculator == null) {
            throw new IllegalStateException("TaxCalculator is required");
        }

        // ---- Step 1: Add coupon as a pricing rule if present ----
        if (coupon != null) {
            pricingEngine.addRule(coupon);
        }

        // ---- Step 2: Apply all pricing rules ----
        PricingResult pricingResult = pricingEngine.applyAll(cart);

        double subtotal = pricingResult.getOriginalTotal();
        double discountedTotal = pricingResult.getDiscountedTotal();
        double totalDiscount = pricingResult.getTotalDiscount();
        List<DiscountDetail> discounts = pricingResult.getDiscountsApplied();

        // ---- Step 3: Calculate tax on post-discount total ----
        TaxResult taxResult = taxCalculator.calculateTax(cart, discountedTotal);
        double taxAmount = taxResult.getTotalTax();

        // ---- Step 4: Grand total ----
        double grandTotal = discountedTotal + taxAmount;

        // ---- Step 5: Build line items ----
        List<OrderLineItem> lineItems = new ArrayList<>();
        for (CartItem item : cart.getItems()) {
            lineItems.add(new OrderLineItem(
                    item.getProduct().getName(),
                    item.getQuantity(),
                    item.getProduct().getPrice(),
                    item.getSubtotal()
            ));
        }

        // ---- Step 6: Construct immutable Order ----
        return new Order(lineItems, subtotal, discounts, totalDiscount,
                         taxAmount, grandTotal);
    }
}
```

---

## 17. Main Demo

```java
import java.time.LocalDate;

/**
 * Complete demonstration:
 *
 * 1. Create products across categories
 * 2. Add items to cart (with observer notifications)
 * 3. Configure pricing rules:
 *    - 10% off all Electronics (CategoryDiscount)
 *    - Buy 2 Get 1 Free on T-Shirts (BuyXGetYFree)
 *    - 5% storewide discount (PercentDiscount)
 *    - $15 flat discount (FlatDiscount)
 * 4. Apply a coupon ($25 off, min cart $100, expires 2026-12-31)
 * 5. Build the order and print the full receipt
 */
public class ShoppingCartDemo {

    public static void main(String[] args) {
        System.out.println("==========================================================");
        System.out.println("     ONLINE SHOPPING CART -- PRICING RULES DEMO");
        System.out.println("==========================================================\n");

        // ---- 1. Create Products ----
        Product laptop   = new Product("P001", "Laptop",          999.99, Category.ELECTRONICS);
        Product mouse    = new Product("P002", "Wireless Mouse",   29.99, Category.ELECTRONICS);
        Product tshirt   = new Product("P003", "Cotton T-Shirt",   24.99, Category.CLOTHING);
        Product novel    = new Product("P004", "Java Design Book",  49.99, Category.BOOKS);
        Product bread    = new Product("P005", "Whole Wheat Bread",  3.49, Category.GROCERIES);

        System.out.println("Products created:");
        System.out.println("  " + laptop);
        System.out.println("  " + mouse);
        System.out.println("  " + tshirt);
        System.out.println("  " + novel);
        System.out.println("  " + bread);
        System.out.println();

        // ---- 2. Create Cart with Observers ----
        Cart cart = new Cart();
        cart.addObserver(new PricingSummaryObserver());
        cart.addObserver(new InventoryObserver());

        System.out.println("--- Adding items to cart ---");
        cart.addItem(laptop, 1);     // $999.99
        cart.addItem(mouse, 2);      // $59.98
        cart.addItem(tshirt, 3);     // $74.97   (buy 2 get 1 free eligible)
        cart.addItem(novel, 1);      // $49.99
        cart.addItem(bread, 4);      // $13.96

        System.out.println();
        cart.printCart();
        // Expected subtotal: $1198.89

        // ---- 3. Configure Pricing Rules ----
        PricingEngine engine = new PricingEngine();

        // Priority 1: Category discount -- 10% off Electronics
        engine.addRule(new CategoryDiscount(Category.ELECTRONICS, 10.0, 1));

        // Priority 2: Buy 2 Get 1 Free on T-Shirts
        engine.addRule(new BuyXGetYFree("P003", 2, 1, 2));

        // Priority 3: 5% storewide discount
        engine.addRule(new PercentDiscount(5.0, 3));

        // Priority 4: Flat $15 off
        engine.addRule(new FlatDiscount(15.0, 4));

        System.out.println("Pricing rules configured:");
        System.out.println("  [Priority 1] 10% off Electronics");
        System.out.println("  [Priority 2] Buy 2 Get 1 Free on T-Shirts");
        System.out.println("  [Priority 3] 5% off entire order");
        System.out.println("  [Priority 4] Flat $15 off");
        System.out.println();

        // ---- 4. Create Coupon ----
        // $25 off, requires $100 minimum, expires end of 2026
        Coupon coupon = new Coupon(
                "SAVE25",
                new FlatDiscount(25.0, 5),     // inner rule
                LocalDate.of(2026, 12, 31),    // expiry
                100.0,                          // min cart value
                5                               // priority (applied last)
        );

        System.out.println("Coupon created: SAVE25 ($25 off, min cart $100, expires 2026-12-31)");
        System.out.println();

        // ---- 5. Run the Pricing Engine standalone (preview) ----
        System.out.println("--- Pricing Engine Preview (before coupon) ---");
        PricingResult preview = engine.applyAll(cart);
        System.out.println("  Original total:   $" + String.format("%.2f", preview.getOriginalTotal()));
        System.out.println("  Discounted total: $" + String.format("%.2f", preview.getDiscountedTotal()));
        System.out.println("  Discounts applied:");
        for (DiscountDetail d : preview.getDiscountsApplied()) {
            System.out.println("    - " + d);
        }
        System.out.println();

        // ---- 6. Configure Tax Calculator ----
        TaxCalculator taxCalc = new TaxCalculator();
        taxCalc.setRate(Category.ELECTRONICS, 12.0);   // 12% on electronics
        taxCalc.setRate(Category.CLOTHING, 5.0);        // 5% on clothing
        taxCalc.setRate(Category.BOOKS, 0.0);            // 0% on books
        taxCalc.setRate(Category.GROCERIES, 0.0);        // 0% on groceries

        System.out.println("Tax rates configured:");
        System.out.println("  Electronics: 12%");
        System.out.println("  Clothing:     5%");
        System.out.println("  Books:        0%");
        System.out.println("  Groceries:    0%");
        System.out.println();

        // ---- 7. Build Order (with coupon) ----
        System.out.println("--- Building Order ---");

        // Create a fresh engine for the order build to avoid double-adding rules
        PricingEngine orderEngine = new PricingEngine();
        orderEngine.addRule(new CategoryDiscount(Category.ELECTRONICS, 10.0, 1));
        orderEngine.addRule(new BuyXGetYFree("P003", 2, 1, 2));
        orderEngine.addRule(new PercentDiscount(5.0, 3));
        orderEngine.addRule(new FlatDiscount(15.0, 4));

        Order order = new OrderBuilder()
                .setCart(cart)
                .setPricingEngine(orderEngine)
                .setTaxCalculator(taxCalc)
                .setCoupon(coupon)
                .build();

        order.printSummary();

        // ---- 8. Tax breakdown ----
        System.out.println("Tax breakdown:");
        double discountedTotal = order.getGrandTotal() - order.getTaxAmount();
        TaxResult taxResult = taxCalc.calculateTax(cart, discountedTotal);
        taxResult.printBreakdown();
        System.out.println();

        // ---- 9. Demonstrate edge cases ----
        System.out.println("==========================================================");
        System.out.println("     EDGE CASE DEMOS");
        System.out.println("==========================================================\n");

        // 9a. Expired coupon
        System.out.println("--- Expired Coupon ---");
        Coupon expiredCoupon = new Coupon(
                "OLD10",
                new FlatDiscount(10.0, 5),
                LocalDate.of(2020, 1, 1),   // already expired
                0.0,
                5
        );
        double result = expiredCoupon.apply(cart, 500.0);
        System.out.println("  Running total after expired coupon: $"
                + String.format("%.2f", result) + " (unchanged)");
        System.out.println();

        // 9b. Coupon with min cart value not met
        System.out.println("--- Coupon Min Value Not Met ---");
        Cart smallCart = new Cart();
        smallCart.addObserver(new PricingSummaryObserver());
        smallCart.addItem(bread, 1);  // only $3.49
        Coupon bigMinCoupon = new Coupon(
                "BIG50",
                new FlatDiscount(50.0, 5),
                LocalDate.of(2026, 12, 31),
                500.0,   // needs $500 minimum
                5
        );
        result = bigMinCoupon.apply(smallCart, smallCart.getSubtotal());
        System.out.println("  Running total: $" + String.format("%.2f", result) + " (unchanged)");
        System.out.println();

        // 9c. BuyXGetYFree with insufficient quantity
        System.out.println("--- Buy 2 Get 1 Free with only 1 item ---");
        Cart singleItemCart = new Cart();
        singleItemCart.addItem(tshirt, 1);
        BuyXGetYFree b2g1 = new BuyXGetYFree("P003", 2, 1, 2);
        double before = singleItemCart.getSubtotal();
        result = b2g1.apply(singleItemCart, before);
        System.out.println("  Before: $" + String.format("%.2f", before)
                + " | After: $" + String.format("%.2f", result) + " (no change, qty < 3)");
        System.out.println();

        // 9d. Discount exceeding total (floor at zero)
        System.out.println("--- Discount Exceeds Total ---");
        Cart cheapCart = new Cart();
        cheapCart.addItem(bread, 1);  // $3.49
        FlatDiscount hugeDiscount = new FlatDiscount(1000.0, 1);
        result = hugeDiscount.apply(cheapCart, cheapCart.getSubtotal());
        System.out.println("  Cart: $" + String.format("%.2f", cheapCart.getSubtotal())
                + " | Flat $1000 off -> $" + String.format("%.2f", result) + " (floored at 0)");
        System.out.println();

        // 9e. Remove item and update quantity
        System.out.println("--- Remove and Update Quantity ---");
        Cart modCart = new Cart();
        modCart.addObserver(new PricingSummaryObserver());
        modCart.addItem(laptop, 2);
        modCart.addItem(mouse, 5);
        System.out.println("  Before removal:");
        modCart.printCart();
        modCart.removeItem("P001");
        modCart.updateQuantity("P002", 3);
        System.out.println("  After removing Laptop and setting Mouse qty to 3:");
        modCart.printCart();

        System.out.println("==========================================================");
        System.out.println("     DEMO COMPLETE");
        System.out.println("==========================================================");
    }
}
```

---

## Expected Output

```
==========================================================
     ONLINE SHOPPING CART -- PRICING RULES DEMO
==========================================================

Products created:
  Laptop ($999.99, ELECTRONICS)
  Wireless Mouse ($29.99, ELECTRONICS)
  Cotton T-Shirt ($24.99, CLOTHING)
  Java Design Book ($49.99, BOOKS)
  Whole Wheat Bread ($3.49, GROCERIES)

--- Adding items to cart ---
[Observer] Cart updated. 1 unique item(s), subtotal = $999.99
[InventoryObserver] Checking stock for 1 item(s)...
[Observer] Cart updated. 2 unique item(s), subtotal = $1059.97
[InventoryObserver] Checking stock for 2 item(s)...
[Observer] Cart updated. 3 unique item(s), subtotal = $1134.94
[InventoryObserver] Checking stock for 3 item(s)...
[Observer] Cart updated. 4 unique item(s), subtotal = $1184.93
[InventoryObserver] Checking stock for 4 item(s)...
[Observer] Cart updated. 5 unique item(s), subtotal = $1198.89
[InventoryObserver] Checking stock for 5 item(s)...

===== Shopping Cart =====
  Laptop x1 = $999.99
  Wireless Mouse x2 = $59.98
  Cotton T-Shirt x3 = $74.97
  Java Design Book x1 = $49.99
  Whole Wheat Bread x4 = $13.96
  -----------------------
  Subtotal: $1198.89
=========================
Pricing rules configured:
  [Priority 1] 10% off Electronics
  [Priority 2] Buy 2 Get 1 Free on T-Shirts
  [Priority 3] 5% off entire order
  [Priority 4] Flat $15 off

--- Pricing Engine Preview ---
  Original total:   $1198.89
  Discounted total: ~$977.xx  (after all 4 rules)
  Discounts applied:
    - 10% off ELECTRONICS items -> -$106.00
    - Buy 2 Get 1 Free on product P003 -> -$24.99
    - 5% off entire order -> -$53.40
    - Flat $15.00 off -> -$15.00

Tax breakdown:
  ELECTRONICS tax: $xxx.xx   (12% of discounted electronics subtotal)
  CLOTHING tax:    $x.xx     (5% of discounted clothing subtotal)

╔══════════════════════════════════════════════════════════╗
║                    ORDER RECEIPT                         ║
╠══════════════════════════════════════════════════════════╣
  Order ID : A1B2C3D4
  Date     : 2026-04-07 14:30:00
──────────────────────────────────────────────────────────
  ITEMS:
  Laptop                 1 x $  999.99 = $  999.99
  Wireless Mouse         2 x $   29.99 = $   59.98
  Cotton T-Shirt         3 x $   24.99 = $   74.97
  Java Design Book       1 x $   49.99 = $   49.99
  Whole Wheat Bread      4 x $    3.49 = $   13.96
──────────────────────────────────────────────────────────
  Subtotal:              $ 1198.89
  DISCOUNTS:
    10% off ELECTRONICS items              -$  106.00
    Buy 2 Get 1 Free on product P003       -$   24.99
    5% off entire order                    -$   53.40
    Flat $15.00 off                        -$   15.00
    Coupon 'SAVE25': Flat $25.00 off       -$   25.00
  Total Discount:        -$  224.38
  Tax:                    $  xxx.xx
══════════════════════════════════════════════════════════
  GRAND TOTAL:            $  xxx.xx
╚══════════════════════════════════════════════════════════╝
```

*(Exact tax and grand total values depend on the proportional tax distribution.)*

---

## Design Pattern Summary

| Pattern | Where Used | Purpose |
|---------|-----------|---------|
| **Strategy** | `PricingRule` interface with `FlatDiscount`, `PercentDiscount`, `BuyXGetYFree`, `CategoryDiscount` | Encapsulate interchangeable discount algorithms |
| **Decorator** | `PricingEngine` chains rules: each rule wraps the previous total | Layer multiple discounts in a defined order |
| **Observer** | `CartObserver` with `PricingSummaryObserver`, `InventoryObserver` | React to cart changes without coupling |
| **Builder** | `OrderBuilder` assembles `Order` step by step | Separate complex construction from representation |

---

## Class Responsibilities (Single Responsibility Principle)

| Class | Single Responsibility |
|-------|----------------------|
| `Product` | Hold product catalog data |
| `CartItem` | Bind a product to a quantity |
| `Cart` | Manage items and notify observers |
| `FlatDiscount` | Subtract a fixed amount |
| `PercentDiscount` | Subtract a percentage |
| `BuyXGetYFree` | Make Y items free per X bought |
| `CategoryDiscount` | Percentage off one category |
| `Coupon` | Validate + delegate to inner rule |
| `PricingEngine` | Sort and chain rules |
| `TaxCalculator` | Compute per-category tax |
| `OrderBuilder` | Assemble order from parts |
| `Order` | Immutable receipt |
