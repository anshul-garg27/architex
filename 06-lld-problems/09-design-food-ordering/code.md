# Food Ordering System -- Complete Java Implementation

## Table of Contents

1. [Core Entities](#1-core-entities)
2. [Menu System](#2-menu-system)
3. [Cart System](#3-cart-system)
4. [Order State Machine](#4-order-state-machine)
5. [Delivery Partner & Assignment Strategy](#5-delivery-partner--assignment-strategy)
6. [Observer / Notification System](#6-observer--notification-system)
7. [Order Builder](#7-order-builder)
8. [Services](#8-services)
9. [Rating System](#9-rating-system)
10. [Main Demo](#10-main-demo)

---

## 1. Core Entities

### Customer.java

```java
public class Customer {
    private final String id;
    private final String name;
    private final String email;
    private final String phone;
    private String deliveryAddress;
    private double latitude;
    private double longitude;

    public Customer(String id, String name, String email, String phone,
                    String deliveryAddress, double latitude, double longitude) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.deliveryAddress = deliveryAddress;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getDeliveryAddress() { return deliveryAddress; }
    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }

    public void setDeliveryAddress(String address, double lat, double lon) {
        this.deliveryAddress = address;
        this.latitude = lat;
        this.longitude = lon;
    }

    @Override
    public String toString() {
        return "Customer{name='" + name + "', address='" + deliveryAddress + "'}";
    }
}
```

### Restaurant.java

```java
public class Restaurant {
    private final String id;
    private final String name;
    private final String address;
    private final String cuisineType;
    private final Menu menu;
    private final double latitude;
    private final double longitude;
    private boolean isOpen;

    public Restaurant(String id, String name, String address, String cuisineType,
                      double latitude, double longitude) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.cuisineType = cuisineType;
        this.latitude = latitude;
        this.longitude = longitude;
        this.menu = new Menu(id);
        this.isOpen = true;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getAddress() { return address; }
    public String getCuisineType() { return cuisineType; }
    public Menu getMenu() { return menu; }
    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }
    public boolean isOpen() { return isOpen; }
    public void setOpen(boolean open) { this.isOpen = open; }

    @Override
    public String toString() {
        return "Restaurant{name='" + name + "', cuisine='" + cuisineType + "'}";
    }
}
```

---

## 2. Menu System

### MenuItem.java

```java
public class MenuItem {
    private final String id;
    private final String name;
    private final String description;
    private double price;
    private final String category;
    private boolean available;

    public MenuItem(String id, String name, String description,
                    double price, String category) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.price = price;
        this.category = category;
        this.available = true;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public double getPrice() { return price; }
    public String getCategory() { return category; }
    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }
    public void setPrice(double price) { this.price = price; }

    @Override
    public String toString() {
        return String.format("%-25s $%.2f  [%s]%s",
            name, price, category, available ? "" : " (UNAVAILABLE)");
    }
}
```

### Menu.java

```java
import java.util.*;
import java.util.stream.Collectors;

public class Menu {
    private final String restaurantId;
    private final Map<String, MenuItem> items;  // itemId -> MenuItem

    public Menu(String restaurantId) {
        this.restaurantId = restaurantId;
        this.items = new LinkedHashMap<>();
    }

    public void addItem(MenuItem item) {
        items.put(item.getId(), item);
    }

    public void removeItem(String itemId) {
        items.remove(itemId);
    }

    public MenuItem getItem(String itemId) {
        MenuItem item = items.get(itemId);
        if (item == null) {
            throw new IllegalArgumentException("Menu item not found: " + itemId);
        }
        return item;
    }

    public List<MenuItem> getAllItems() {
        return new ArrayList<>(items.values());
    }

    public List<MenuItem> getAvailableItems() {
        return items.values().stream()
            .filter(MenuItem::isAvailable)
            .collect(Collectors.toList());
    }

    public List<MenuItem> getItemsByCategory(String category) {
        return items.values().stream()
            .filter(item -> item.getCategory().equalsIgnoreCase(category))
            .collect(Collectors.toList());
    }

    public void displayMenu() {
        System.out.println("\n===== MENU =====");
        Map<String, List<MenuItem>> byCategory = items.values().stream()
            .collect(Collectors.groupingBy(MenuItem::getCategory,
                     LinkedHashMap::new, Collectors.toList()));

        for (Map.Entry<String, List<MenuItem>> entry : byCategory.entrySet()) {
            System.out.println("\n--- " + entry.getKey() + " ---");
            for (MenuItem item : entry.getValue()) {
                System.out.println("  " + item);
            }
        }
        System.out.println();
    }
}
```

---

## 3. Cart System

### CartItem.java

```java
public class CartItem {
    private final MenuItem menuItem;
    private int quantity;

    public CartItem(MenuItem menuItem, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be positive");
        }
        this.menuItem = menuItem;
        this.quantity = quantity;
    }

    public MenuItem getMenuItem() { return menuItem; }
    public int getQuantity() { return quantity; }

    public void setQuantity(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be positive");
        }
        this.quantity = quantity;
    }

    public double getSubtotal() {
        return menuItem.getPrice() * quantity;
    }

    @Override
    public String toString() {
        return String.format("%dx %-20s $%.2f",
            quantity, menuItem.getName(), getSubtotal());
    }
}
```

### Cart.java

```java
import java.util.*;

public class Cart {
    private final String customerId;
    private String restaurantId;
    private final Map<String, CartItem> items;  // menuItemId -> CartItem

    public Cart(String customerId) {
        this.customerId = customerId;
        this.items = new LinkedHashMap<>();
    }

    public void addItem(MenuItem menuItem, int quantity, String restaurantId) {
        // Enforce single-restaurant constraint
        if (this.restaurantId != null && !this.restaurantId.equals(restaurantId)) {
            throw new IllegalStateException(
                "Cart contains items from a different restaurant. " +
                "Clear the cart before adding items from a new restaurant.");
        }

        if (!menuItem.isAvailable()) {
            throw new IllegalStateException(
                "Item '" + menuItem.getName() + "' is currently unavailable.");
        }

        this.restaurantId = restaurantId;

        CartItem existing = items.get(menuItem.getId());
        if (existing != null) {
            existing.setQuantity(existing.getQuantity() + quantity);
        } else {
            items.put(menuItem.getId(), new CartItem(menuItem, quantity));
        }
    }

    public void removeItem(String menuItemId) {
        items.remove(menuItemId);
        if (items.isEmpty()) {
            restaurantId = null;
        }
    }

    public void updateQuantity(String menuItemId, int quantity) {
        CartItem item = items.get(menuItemId);
        if (item == null) {
            throw new IllegalArgumentException("Item not in cart: " + menuItemId);
        }
        if (quantity <= 0) {
            removeItem(menuItemId);
        } else {
            item.setQuantity(quantity);
        }
    }

    public List<CartItem> getItems() {
        return new ArrayList<>(items.values());
    }

    public double getTotal() {
        return items.values().stream()
            .mapToDouble(CartItem::getSubtotal)
            .sum();
    }

    public void clear() {
        items.clear();
        restaurantId = null;
    }

    public boolean isEmpty() {
        return items.isEmpty();
    }

    public String getCustomerId() { return customerId; }
    public String getRestaurantId() { return restaurantId; }

    public void displayCart() {
        if (isEmpty()) {
            System.out.println("Cart is empty.");
            return;
        }
        System.out.println("\n===== YOUR CART =====");
        for (CartItem item : items.values()) {
            System.out.println("  " + item);
        }
        System.out.printf("  %-22s $%.2f%n", "SUBTOTAL:", getTotal());
        System.out.println();
    }
}
```

---

## 4. Order State Machine

### OrderStatus.java (Enum)

```java
public enum OrderStatus {
    PLACED("Order has been placed"),
    CONFIRMED("Restaurant confirmed the order"),
    PREPARING("Food is being prepared"),
    READY("Food is ready for pickup"),
    PICKED_UP("Delivery partner picked up the food"),
    DELIVERED("Food delivered to customer"),
    CANCELLED("Order has been cancelled");

    private final String description;

    OrderStatus(String description) {
        this.description = description;
    }

    public String getDescription() { return description; }
}
```

### OrderState.java (State Interface)

```java
/**
 * State Pattern: each concrete state handles only its valid transitions.
 * Invalid transitions throw IllegalStateException.
 */
public interface OrderState {

    default void confirm(Order order) {
        throw new IllegalStateException(
            "Cannot confirm order in " + getStateName() + " state.");
    }

    default void startPreparing(Order order) {
        throw new IllegalStateException(
            "Cannot start preparing in " + getStateName() + " state.");
    }

    default void markReady(Order order) {
        throw new IllegalStateException(
            "Cannot mark ready in " + getStateName() + " state.");
    }

    default void pickUp(Order order) {
        throw new IllegalStateException(
            "Cannot pick up in " + getStateName() + " state.");
    }

    default void deliver(Order order) {
        throw new IllegalStateException(
            "Cannot deliver in " + getStateName() + " state.");
    }

    default void cancel(Order order) {
        throw new IllegalStateException(
            "Cannot cancel order in " + getStateName() + " state.");
    }

    String getStateName();
}
```

### PlacedState.java

```java
public class PlacedState implements OrderState {

    @Override
    public void confirm(Order order) {
        System.out.println("  [State] Order " + order.getId() +
                           ": PLACED -> CONFIRMED");
        order.setCurrentState(new ConfirmedState());
        order.setStatus(OrderStatus.CONFIRMED);
        order.notifyObservers(OrderStatus.PLACED, OrderStatus.CONFIRMED);
    }

    @Override
    public void cancel(Order order) {
        System.out.println("  [State] Order " + order.getId() +
                           ": PLACED -> CANCELLED");
        order.setCurrentState(new CancelledState());
        order.setStatus(OrderStatus.CANCELLED);
        order.notifyObservers(OrderStatus.PLACED, OrderStatus.CANCELLED);
    }

    @Override
    public String getStateName() { return "PLACED"; }
}
```

### ConfirmedState.java

```java
public class ConfirmedState implements OrderState {

    @Override
    public void startPreparing(Order order) {
        System.out.println("  [State] Order " + order.getId() +
                           ": CONFIRMED -> PREPARING");
        order.setCurrentState(new PreparingState());
        order.setStatus(OrderStatus.PREPARING);
        order.notifyObservers(OrderStatus.CONFIRMED, OrderStatus.PREPARING);
    }

    @Override
    public void cancel(Order order) {
        System.out.println("  [State] Order " + order.getId() +
                           ": CONFIRMED -> CANCELLED");
        order.setCurrentState(new CancelledState());
        order.setStatus(OrderStatus.CANCELLED);
        order.notifyObservers(OrderStatus.CONFIRMED, OrderStatus.CANCELLED);
    }

    @Override
    public String getStateName() { return "CONFIRMED"; }
}
```

### PreparingState.java

```java
public class PreparingState implements OrderState {

    @Override
    public void markReady(Order order) {
        System.out.println("  [State] Order " + order.getId() +
                           ": PREPARING -> READY");
        order.setCurrentState(new ReadyState());
        order.setStatus(OrderStatus.READY);
        order.notifyObservers(OrderStatus.PREPARING, OrderStatus.READY);
    }

    @Override
    public String getStateName() { return "PREPARING"; }
}
```

### ReadyState.java

```java
public class ReadyState implements OrderState {

    @Override
    public void pickUp(Order order) {
        System.out.println("  [State] Order " + order.getId() +
                           ": READY -> PICKED_UP");
        order.setCurrentState(new PickedUpState());
        order.setStatus(OrderStatus.PICKED_UP);
        order.notifyObservers(OrderStatus.READY, OrderStatus.PICKED_UP);
    }

    @Override
    public String getStateName() { return "READY"; }
}
```

### PickedUpState.java

```java
public class PickedUpState implements OrderState {

    @Override
    public void deliver(Order order) {
        System.out.println("  [State] Order " + order.getId() +
                           ": PICKED_UP -> DELIVERED");
        order.setCurrentState(new DeliveredState());
        order.setStatus(OrderStatus.DELIVERED);
        order.setDeliveredAt(java.time.LocalDateTime.now());
        // Mark delivery partner as available again
        if (order.getDeliveryPartner() != null) {
            order.getDeliveryPartner().setAvailable(true);
        }
        order.notifyObservers(OrderStatus.PICKED_UP, OrderStatus.DELIVERED);
    }

    @Override
    public String getStateName() { return "PICKED_UP"; }
}
```

### DeliveredState.java

```java
/** Terminal state -- no transitions allowed. */
public class DeliveredState implements OrderState {
    @Override
    public String getStateName() { return "DELIVERED"; }
}
```

### CancelledState.java

```java
/** Terminal state -- no transitions allowed. */
public class CancelledState implements OrderState {
    @Override
    public String getStateName() { return "CANCELLED"; }
}
```

### OrderItem.java

```java
/**
 * Snapshot of a menu item at the time of ordering.
 * Price is frozen -- menu price changes after ordering do not affect this.
 */
public class OrderItem {
    private final String itemName;
    private final double priceAtOrder;
    private final int quantity;

    public OrderItem(String itemName, double priceAtOrder, int quantity) {
        this.itemName = itemName;
        this.priceAtOrder = priceAtOrder;
        this.quantity = quantity;
    }

    public String getItemName() { return itemName; }
    public double getPriceAtOrder() { return priceAtOrder; }
    public int getQuantity() { return quantity; }

    public double getSubtotal() {
        return priceAtOrder * quantity;
    }

    @Override
    public String toString() {
        return String.format("%dx %-20s $%.2f", quantity, itemName, getSubtotal());
    }
}
```

### Order.java

```java
import java.time.LocalDateTime;
import java.util.*;

public class Order {
    private final String id;
    private final Customer customer;
    private final Restaurant restaurant;
    private final List<OrderItem> items;
    private DeliveryPartner deliveryPartner;
    private OrderState currentState;
    private OrderStatus status;
    private final double subtotal;
    private final double deliveryFee;
    private final double tax;
    private final double totalAmount;
    private final LocalDateTime placedAt;
    private LocalDateTime deliveredAt;
    private final List<OrderStatusObserver> observers;

    // Package-private constructor -- use OrderBuilder to create
    Order(String id, Customer customer, Restaurant restaurant,
          List<OrderItem> items, double subtotal, double deliveryFee,
          double tax, double totalAmount) {
        this.id = id;
        this.customer = customer;
        this.restaurant = restaurant;
        this.items = Collections.unmodifiableList(items);
        this.subtotal = subtotal;
        this.deliveryFee = deliveryFee;
        this.tax = tax;
        this.totalAmount = totalAmount;
        this.placedAt = LocalDateTime.now();
        this.currentState = new PlacedState();
        this.status = OrderStatus.PLACED;
        this.observers = new ArrayList<>();
    }

    // ----- State transition methods (delegate to current state) -----

    public void confirm() { currentState.confirm(this); }
    public void startPreparing() { currentState.startPreparing(this); }
    public void markReady() { currentState.markReady(this); }
    public void pickUp() { currentState.pickUp(this); }
    public void deliver() { currentState.deliver(this); }
    public void cancel() {
        currentState.cancel(this);
        // Release delivery partner if assigned
        if (deliveryPartner != null) {
            deliveryPartner.setAvailable(true);
            System.out.println("  [Order] Delivery partner " +
                deliveryPartner.getName() + " released back to available pool.");
        }
    }

    // ----- Observer management -----

    public void addObserver(OrderStatusObserver observer) {
        observers.add(observer);
    }

    public void removeObserver(OrderStatusObserver observer) {
        observers.remove(observer);
    }

    public void notifyObservers(OrderStatus oldStatus, OrderStatus newStatus) {
        for (OrderStatusObserver observer : observers) {
            observer.onStatusChange(this, oldStatus, newStatus);
        }
    }

    // ----- Delivery partner assignment -----

    public void assignDeliveryPartner(DeliveryPartner partner) {
        this.deliveryPartner = partner;
        partner.setAvailable(false);
    }

    // ----- Getters and package-private setters -----

    public String getId() { return id; }
    public Customer getCustomer() { return customer; }
    public Restaurant getRestaurant() { return restaurant; }
    public List<OrderItem> getItems() { return items; }
    public DeliveryPartner getDeliveryPartner() { return deliveryPartner; }
    public OrderStatus getStatus() { return status; }
    public double getSubtotal() { return subtotal; }
    public double getDeliveryFee() { return deliveryFee; }
    public double getTax() { return tax; }
    public double getTotalAmount() { return totalAmount; }
    public LocalDateTime getPlacedAt() { return placedAt; }
    public LocalDateTime getDeliveredAt() { return deliveredAt; }

    void setCurrentState(OrderState state) { this.currentState = state; }
    void setStatus(OrderStatus status) { this.status = status; }
    void setDeliveredAt(LocalDateTime time) { this.deliveredAt = time; }

    public void displayOrderSummary() {
        System.out.println("\n===== ORDER SUMMARY =====");
        System.out.println("  Order ID:    " + id);
        System.out.println("  Customer:    " + customer.getName());
        System.out.println("  Restaurant:  " + restaurant.getName());
        System.out.println("  Status:      " + status);
        System.out.println("  Items:");
        for (OrderItem item : items) {
            System.out.println("    " + item);
        }
        System.out.printf("  Subtotal:    $%.2f%n", subtotal);
        System.out.printf("  Delivery:    $%.2f%n", deliveryFee);
        System.out.printf("  Tax:         $%.2f%n", tax);
        System.out.printf("  TOTAL:       $%.2f%n", totalAmount);
        if (deliveryPartner != null) {
            System.out.println("  Driver:      " + deliveryPartner.getName());
        }
        System.out.println();
    }
}
```

---

## 5. Delivery Partner & Assignment Strategy

### DeliveryPartner.java

```java
public class DeliveryPartner {
    private final String id;
    private final String name;
    private final String phone;
    private double latitude;
    private double longitude;
    private boolean available;
    private double averageRating;
    private int totalDeliveries;
    private int activeDeliveries;

    public DeliveryPartner(String id, String name, String phone,
                           double latitude, double longitude) {
        this.id = id;
        this.name = name;
        this.phone = phone;
        this.latitude = latitude;
        this.longitude = longitude;
        this.available = true;
        this.averageRating = 5.0;  // new partners start at 5.0
        this.totalDeliveries = 0;
        this.activeDeliveries = 0;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getPhone() { return phone; }
    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }
    public boolean isAvailable() { return available; }
    public double getAverageRating() { return averageRating; }
    public int getTotalDeliveries() { return totalDeliveries; }
    public int getActiveDeliveries() { return activeDeliveries; }

    public void setAvailable(boolean available) { this.available = available; }

    public void setLocation(double latitude, double longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public void incrementActiveDeliveries() { this.activeDeliveries++; }
    public void decrementActiveDeliveries() {
        this.activeDeliveries = Math.max(0, activeDeliveries - 1);
    }

    /**
     * Update running average rating without storing all historical ratings.
     * Formula: newAvg = (oldAvg * count + newRating) / (count + 1)
     */
    public void updateRating(double newRating) {
        averageRating = ((averageRating * totalDeliveries) + newRating)
                        / (totalDeliveries + 1);
        totalDeliveries++;
    }

    /**
     * Haversine distance in kilometers to a target location.
     */
    public double distanceTo(double targetLat, double targetLon) {
        final double R = 6371.0; // Earth radius in km
        double dLat = Math.toRadians(targetLat - latitude);
        double dLon = Math.toRadians(targetLon - longitude);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(latitude))
                 * Math.cos(Math.toRadians(targetLat))
                 * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    @Override
    public String toString() {
        return String.format("DeliveryPartner{name='%s', rating=%.1f, available=%s}",
            name, averageRating, available);
    }
}
```

### DeliveryAssignmentStrategy.java (Strategy Interface)

```java
import java.util.List;

/**
 * Strategy Pattern: defines how a delivery partner is selected for an order.
 * Different strategies can be swapped at runtime.
 */
public interface DeliveryAssignmentStrategy {

    /**
     * Select the best available delivery partner for the given order.
     *
     * @param order the order needing a delivery partner
     * @param availablePartners list of currently available partners
     * @return the selected partner
     * @throws IllegalStateException if no partner is available
     */
    DeliveryPartner assignPartner(Order order, List<DeliveryPartner> availablePartners);
}
```

### NearestPartnerStrategy.java

```java
import java.util.*;

/**
 * Selects the delivery partner closest to the restaurant.
 * Minimizes pickup time -- best default strategy.
 */
public class NearestPartnerStrategy implements DeliveryAssignmentStrategy {

    @Override
    public DeliveryPartner assignPartner(Order order,
                                          List<DeliveryPartner> availablePartners) {
        if (availablePartners.isEmpty()) {
            throw new IllegalStateException(
                "No delivery partners available at this time.");
        }

        Restaurant restaurant = order.getRestaurant();
        double restLat = restaurant.getLatitude();
        double restLon = restaurant.getLongitude();

        DeliveryPartner nearest = null;
        double minDistance = Double.MAX_VALUE;

        for (DeliveryPartner partner : availablePartners) {
            double distance = partner.distanceTo(restLat, restLon);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = partner;
            }
        }

        System.out.printf("  [Strategy] NearestPartner: selected '%s' (%.2f km away)%n",
            nearest.getName(), minDistance);
        return nearest;
    }
}
```

### HighestRatedStrategy.java

```java
import java.util.*;

/**
 * Selects the delivery partner with the highest average rating.
 * Best for premium orders or VIP customers.
 */
public class HighestRatedStrategy implements DeliveryAssignmentStrategy {

    @Override
    public DeliveryPartner assignPartner(Order order,
                                          List<DeliveryPartner> availablePartners) {
        if (availablePartners.isEmpty()) {
            throw new IllegalStateException(
                "No delivery partners available at this time.");
        }

        DeliveryPartner bestRated = availablePartners.stream()
            .max(Comparator.comparingDouble(DeliveryPartner::getAverageRating))
            .orElseThrow();

        System.out.printf("  [Strategy] HighestRated: selected '%s' (rating: %.1f)%n",
            bestRated.getName(), bestRated.getAverageRating());
        return bestRated;
    }
}
```

### LeastBusyStrategy.java

```java
import java.util.*;

/**
 * Selects the delivery partner with the fewest active deliveries.
 * Best for load balancing during peak hours.
 */
public class LeastBusyStrategy implements DeliveryAssignmentStrategy {

    @Override
    public DeliveryPartner assignPartner(Order order,
                                          List<DeliveryPartner> availablePartners) {
        if (availablePartners.isEmpty()) {
            throw new IllegalStateException(
                "No delivery partners available at this time.");
        }

        DeliveryPartner leastBusy = availablePartners.stream()
            .min(Comparator.comparingInt(DeliveryPartner::getActiveDeliveries))
            .orElseThrow();

        System.out.printf(
            "  [Strategy] LeastBusy: selected '%s' (active deliveries: %d)%n",
            leastBusy.getName(), leastBusy.getActiveDeliveries());
        return leastBusy;
    }
}
```

---

## 6. Observer / Notification System

### OrderStatusObserver.java

```java
/**
 * Observer Pattern: notified whenever an order's status changes.
 * Each party (customer, restaurant, delivery partner) has its own observer.
 */
public interface OrderStatusObserver {
    void onStatusChange(Order order, OrderStatus oldStatus, OrderStatus newStatus);
}
```

### CustomerNotificationObserver.java

```java
/**
 * Sends notifications to the customer about their order status.
 */
public class CustomerNotificationObserver implements OrderStatusObserver {

    @Override
    public void onStatusChange(Order order, OrderStatus oldStatus,
                                OrderStatus newStatus) {
        String customerName = order.getCustomer().getName();
        String message;

        switch (newStatus) {
            case CONFIRMED:
                message = "Your order has been confirmed by " +
                          order.getRestaurant().getName() + "!";
                break;
            case PREPARING:
                message = "Your food is being prepared!";
                break;
            case READY:
                message = "Your food is ready and waiting for pickup!";
                break;
            case PICKED_UP:
                message = "Your driver " + order.getDeliveryPartner().getName() +
                          " picked up your food!";
                break;
            case DELIVERED:
                message = "Your food has arrived! Enjoy your meal!";
                break;
            case CANCELLED:
                message = "Your order has been cancelled. " +
                          "A refund will be processed shortly.";
                break;
            default:
                message = "Order status updated to: " + newStatus;
        }

        System.out.println("    [Notify -> Customer " + customerName + "] " + message);
    }
}
```

### RestaurantNotificationObserver.java

```java
/**
 * Sends notifications to the restaurant about order events.
 */
public class RestaurantNotificationObserver implements OrderStatusObserver {

    @Override
    public void onStatusChange(Order order, OrderStatus oldStatus,
                                OrderStatus newStatus) {
        String restaurantName = order.getRestaurant().getName();
        String message;

        switch (newStatus) {
            case CONFIRMED:
                message = "You confirmed order " + order.getId() +
                          ". Please start preparing soon.";
                break;
            case PREPARING:
                message = "Order " + order.getId() + " is now being prepared.";
                break;
            case PICKED_UP:
                message = "Driver picked up order " + order.getId() + ".";
                break;
            case CANCELLED:
                message = "Order " + order.getId() +
                          " has been cancelled by the customer.";
                break;
            default:
                // Restaurant does not need all notifications
                return;
        }

        System.out.println("    [Notify -> Restaurant " + restaurantName +
                           "] " + message);
    }
}
```

### DeliveryPartnerNotificationObserver.java

```java
/**
 * Sends notifications to the delivery partner about their assignment.
 */
public class DeliveryPartnerNotificationObserver implements OrderStatusObserver {

    @Override
    public void onStatusChange(Order order, OrderStatus oldStatus,
                                OrderStatus newStatus) {
        DeliveryPartner partner = order.getDeliveryPartner();
        if (partner == null) return;  // no partner assigned yet

        String partnerName = partner.getName();
        String message;

        switch (newStatus) {
            case READY:
                message = "Food is ready for pickup at " +
                          order.getRestaurant().getName() +
                          " (" + order.getRestaurant().getAddress() + ")";
                break;
            case PICKED_UP:
                message = "Pickup confirmed. Deliver to " +
                          order.getCustomer().getDeliveryAddress();
                break;
            case DELIVERED:
                message = "Delivery confirmed! You are now available " +
                          "for new assignments.";
                break;
            case CANCELLED:
                message = "Order " + order.getId() +
                          " has been cancelled. You are now available.";
                break;
            default:
                // Delivery partner does not need all notifications
                return;
        }

        System.out.println("    [Notify -> Driver " + partnerName + "] " + message);
    }
}
```

---

## 7. Order Builder

### OrderBuilder.java

```java
import java.util.*;

/**
 * Builder Pattern: constructs a complex Order object step by step.
 * Snapshots cart items into OrderItems (freezing prices at order time).
 */
public class OrderBuilder {
    private static int orderCounter = 0;

    private Customer customer;
    private Restaurant restaurant;
    private final List<OrderItem> items = new ArrayList<>();
    private double deliveryFee = 0.0;
    private double taxRate = 0.0;

    public OrderBuilder setCustomer(Customer customer) {
        this.customer = customer;
        return this;
    }

    public OrderBuilder setRestaurant(Restaurant restaurant) {
        this.restaurant = restaurant;
        return this;
    }

    /**
     * Snapshot cart items into order items.
     * Prices are frozen at this point -- future menu price changes
     * will not affect this order.
     */
    public OrderBuilder addItemsFromCart(Cart cart) {
        for (CartItem cartItem : cart.getItems()) {
            MenuItem menuItem = cartItem.getMenuItem();
            items.add(new OrderItem(
                menuItem.getName(),
                menuItem.getPrice(),    // snapshot the price
                cartItem.getQuantity()
            ));
        }
        return this;
    }

    public OrderBuilder setDeliveryFee(double deliveryFee) {
        this.deliveryFee = deliveryFee;
        return this;
    }

    public OrderBuilder setTaxRate(double taxRate) {
        this.taxRate = taxRate;
        return this;
    }

    public Order build() {
        // Validate required fields
        if (customer == null) {
            throw new IllegalStateException("Customer is required.");
        }
        if (restaurant == null) {
            throw new IllegalStateException("Restaurant is required.");
        }
        if (items.isEmpty()) {
            throw new IllegalStateException(
                "Order must contain at least one item.");
        }

        // Calculate financial fields
        double subtotal = items.stream()
            .mapToDouble(OrderItem::getSubtotal)
            .sum();
        double tax = subtotal * taxRate;
        double totalAmount = subtotal + deliveryFee + tax;

        String orderId = "ORD-" + String.format("%04d", ++orderCounter);

        return new Order(orderId, customer, restaurant, items,
                         subtotal, deliveryFee, tax, totalAmount);
    }
}
```

---

## 8. Services

### OrderService.java

```java
import java.util.*;
import java.util.stream.Collectors;

/**
 * Orchestrates the complete order lifecycle.
 * Uses Strategy for partner assignment and Builder for order construction.
 */
public class OrderService {
    private DeliveryAssignmentStrategy assignmentStrategy;
    private final List<DeliveryPartner> allPartners;
    private final Map<String, Order> orders;
    private final Object partnerAssignmentLock = new Object();

    public OrderService(DeliveryAssignmentStrategy strategy) {
        this.assignmentStrategy = strategy;
        this.allPartners = new ArrayList<>();
        this.orders = new LinkedHashMap<>();
    }

    // ----- Partner management -----

    public void registerPartner(DeliveryPartner partner) {
        allPartners.add(partner);
    }

    public List<DeliveryPartner> getAvailablePartners() {
        return allPartners.stream()
            .filter(DeliveryPartner::isAvailable)
            .collect(Collectors.toList());
    }

    public void setAssignmentStrategy(DeliveryAssignmentStrategy strategy) {
        this.assignmentStrategy = strategy;
        System.out.println("[OrderService] Assignment strategy changed to: " +
            strategy.getClass().getSimpleName());
    }

    // ----- Order lifecycle -----

    /**
     * Place an order from a customer's cart.
     * Builds the order, registers it, attaches observers, and clears the cart.
     */
    public Order placeOrder(Customer customer, Cart cart, Restaurant restaurant) {
        if (cart.isEmpty()) {
            throw new IllegalStateException("Cannot place order with empty cart.");
        }
        if (!restaurant.isOpen()) {
            throw new IllegalStateException(
                "Restaurant '" + restaurant.getName() + "' is currently closed.");
        }

        System.out.println("\n[OrderService] Placing order...");

        // Build the order (snapshots cart prices)
        Order order = new OrderBuilder()
            .setCustomer(customer)
            .setRestaurant(restaurant)
            .addItemsFromCart(cart)
            .setDeliveryFee(5.99)
            .setTaxRate(0.08)
            .build();

        // Attach observers for all three parties
        order.addObserver(new CustomerNotificationObserver());
        order.addObserver(new RestaurantNotificationObserver());
        order.addObserver(new DeliveryPartnerNotificationObserver());

        // Register the order
        orders.put(order.getId(), order);

        // Clear the cart after successful order placement
        cart.clear();

        System.out.println("[OrderService] Order " + order.getId() +
                           " placed successfully.");
        order.displayOrderSummary();

        return order;
    }

    /**
     * Assign a delivery partner using the current strategy.
     * Synchronized to prevent two orders from grabbing the same partner.
     */
    public void assignDeliveryPartner(Order order) {
        System.out.println("[OrderService] Assigning delivery partner for order " +
                           order.getId() + "...");

        synchronized (partnerAssignmentLock) {
            List<DeliveryPartner> available = getAvailablePartners();
            DeliveryPartner partner = assignmentStrategy.assignPartner(
                order, available);
            order.assignDeliveryPartner(partner);
            partner.incrementActiveDeliveries();
        }

        System.out.println("[OrderService] Delivery partner '" +
            order.getDeliveryPartner().getName() +
            "' assigned to order " + order.getId());
    }

    public void confirmOrder(String orderId) {
        Order order = getOrderOrThrow(orderId);
        System.out.println("\n[OrderService] Confirming order " + orderId + "...");
        order.confirm();
    }

    public void startPreparing(String orderId) {
        Order order = getOrderOrThrow(orderId);
        System.out.println("\n[OrderService] Restaurant starts preparing " +
                           orderId + "...");
        order.startPreparing();
    }

    public void markReady(String orderId) {
        Order order = getOrderOrThrow(orderId);
        System.out.println("\n[OrderService] Food ready for " + orderId + "...");
        order.markReady();
    }

    public void pickUp(String orderId) {
        Order order = getOrderOrThrow(orderId);
        System.out.println("\n[OrderService] Driver picking up " + orderId + "...");
        order.pickUp();
    }

    public void deliver(String orderId) {
        Order order = getOrderOrThrow(orderId);
        System.out.println("\n[OrderService] Driver delivering " + orderId + "...");
        order.deliver();
    }

    public void cancelOrder(String orderId) {
        Order order = getOrderOrThrow(orderId);
        System.out.println("\n[OrderService] Cancelling order " + orderId + "...");
        order.cancel();
    }

    public Order getOrder(String orderId) {
        return orders.get(orderId);
    }

    private Order getOrderOrThrow(String orderId) {
        Order order = orders.get(orderId);
        if (order == null) {
            throw new IllegalArgumentException("Order not found: " + orderId);
        }
        return order;
    }
}
```

### RestaurantService.java

```java
import java.util.*;
import java.util.stream.Collectors;

/**
 * Manages the restaurant catalog. Provides browsing and search functionality.
 */
public class RestaurantService {
    private final Map<String, Restaurant> restaurants = new LinkedHashMap<>();

    public void registerRestaurant(Restaurant restaurant) {
        restaurants.put(restaurant.getId(), restaurant);
    }

    public List<Restaurant> getAllRestaurants() {
        return new ArrayList<>(restaurants.values());
    }

    public List<Restaurant> getOpenRestaurants() {
        return restaurants.values().stream()
            .filter(Restaurant::isOpen)
            .collect(Collectors.toList());
    }

    public List<Restaurant> searchByCuisine(String cuisine) {
        return restaurants.values().stream()
            .filter(r -> r.getCuisineType().equalsIgnoreCase(cuisine))
            .filter(Restaurant::isOpen)
            .collect(Collectors.toList());
    }

    public Restaurant getRestaurant(String id) {
        Restaurant r = restaurants.get(id);
        if (r == null) {
            throw new IllegalArgumentException("Restaurant not found: " + id);
        }
        return r;
    }

    public void displayAllRestaurants() {
        System.out.println("\n===== AVAILABLE RESTAURANTS =====");
        for (Restaurant r : getOpenRestaurants()) {
            System.out.printf("  [%s] %-25s (%s) - %s%n",
                r.getId(), r.getName(), r.getCuisineType(), r.getAddress());
        }
        System.out.println();
    }
}
```

---

## 9. Rating System

### RatingType.java

```java
public enum RatingType {
    RESTAURANT,
    DELIVERY_PARTNER
}
```

### Rating.java

```java
import java.time.LocalDateTime;

public class Rating {
    private static int counter = 0;

    private final String id;
    private final String reviewerId;
    private final String targetId;
    private final int stars;
    private final String comment;
    private final RatingType type;
    private final LocalDateTime createdAt;

    public Rating(String reviewerId, String targetId, int stars,
                  String comment, RatingType type) {
        if (stars < 1 || stars > 5) {
            throw new IllegalArgumentException(
                "Rating must be between 1 and 5 stars.");
        }
        this.id = "RAT-" + String.format("%04d", ++counter);
        this.reviewerId = reviewerId;
        this.targetId = targetId;
        this.stars = stars;
        this.comment = comment;
        this.type = type;
        this.createdAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public String getReviewerId() { return reviewerId; }
    public String getTargetId() { return targetId; }
    public int getStars() { return stars; }
    public String getComment() { return comment; }
    public RatingType getType() { return type; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    @Override
    public String toString() {
        return String.format("Rating{%s, %d stars, '%s'}",
            type, stars, comment);
    }
}
```

### RatingService.java

```java
import java.util.*;

/**
 * Manages ratings for restaurants and delivery partners.
 * Updates running averages on the rated entities.
 */
public class RatingService {
    private final Map<String, List<Rating>> restaurantRatings = new HashMap<>();
    private final Map<String, List<Rating>> partnerRatings = new HashMap<>();

    public Rating rateRestaurant(String customerId, String restaurantId,
                                  int stars, String comment) {
        Rating rating = new Rating(customerId, restaurantId, stars,
                                    comment, RatingType.RESTAURANT);
        restaurantRatings
            .computeIfAbsent(restaurantId, k -> new ArrayList<>())
            .add(rating);

        System.out.println("[RatingService] Restaurant rated: " + stars +
                           " stars - \"" + comment + "\"");
        return rating;
    }

    public Rating rateDeliveryPartner(String customerId,
                                       DeliveryPartner partner,
                                       int stars, String comment) {
        Rating rating = new Rating(customerId, partner.getId(), stars,
                                    comment, RatingType.DELIVERY_PARTNER);
        partnerRatings
            .computeIfAbsent(partner.getId(), k -> new ArrayList<>())
            .add(rating);

        // Update running average on the partner entity
        partner.updateRating(stars);

        System.out.println("[RatingService] Delivery partner '" +
            partner.getName() + "' rated: " + stars +
            " stars - \"" + comment + "\"");
        return rating;
    }

    public double getRestaurantAverageRating(String restaurantId) {
        List<Rating> ratings = restaurantRatings.get(restaurantId);
        if (ratings == null || ratings.isEmpty()) return 0.0;
        return ratings.stream()
            .mapToInt(Rating::getStars)
            .average()
            .orElse(0.0);
    }

    public double getPartnerAverageRating(String partnerId) {
        List<Rating> ratings = partnerRatings.get(partnerId);
        if (ratings == null || ratings.isEmpty()) return 0.0;
        return ratings.stream()
            .mapToInt(Rating::getStars)
            .average()
            .orElse(0.0);
    }
}
```

---

## 10. Main Demo

### FoodOrderingApp.java

```java
/**
 * Full demonstration of the Food Ordering System.
 *
 * Flow:
 *   1. Set up restaurants, menu items, delivery partners
 *   2. Customer browses restaurants and views a menu
 *   3. Customer adds items to cart
 *   4. Customer places order (Builder constructs Order from Cart)
 *   5. System assigns delivery partner (Strategy selects best)
 *   6. Order progresses through all states (State pattern)
 *   7. All parties receive notifications (Observer pattern)
 *   8. Customer rates restaurant and delivery partner
 *   9. Demonstrate cancellation flow
 *  10. Demonstrate strategy switching
 */
public class FoodOrderingApp {

    public static void main(String[] args) {

        System.out.println("=".repeat(60));
        System.out.println("    FOOD ORDERING SYSTEM -- FULL DEMO");
        System.out.println("=".repeat(60));

        // ===== SETUP =====

        // Create restaurants
        Restaurant burgerJoint = new Restaurant("R001", "Burger Palace",
            "123 Main St", "American", 37.7749, -122.4194);
        Restaurant sushiPlace = new Restaurant("R002", "Tokyo Sushi",
            "456 Oak Ave", "Japanese", 37.7849, -122.4094);

        // Populate menus
        burgerJoint.getMenu().addItem(new MenuItem("M001",
            "Classic Burger", "Beef patty with lettuce and tomato",
            12.99, "Burgers"));
        burgerJoint.getMenu().addItem(new MenuItem("M002",
            "Cheese Fries", "Crispy fries with melted cheddar",
            6.99, "Sides"));
        burgerJoint.getMenu().addItem(new MenuItem("M003",
            "Milkshake", "Vanilla bean milkshake",
            5.99, "Drinks"));
        burgerJoint.getMenu().addItem(new MenuItem("M004",
            "Double Bacon Burger", "Double patty with crispy bacon",
            16.99, "Burgers"));
        burgerJoint.getMenu().addItem(new MenuItem("M005",
            "Onion Rings", "Beer-battered onion rings",
            7.49, "Sides"));

        sushiPlace.getMenu().addItem(new MenuItem("M010",
            "Salmon Roll", "Fresh salmon with avocado",
            14.99, "Rolls"));
        sushiPlace.getMenu().addItem(new MenuItem("M011",
            "Tuna Sashimi", "Premium bluefin tuna",
            18.99, "Sashimi"));
        sushiPlace.getMenu().addItem(new MenuItem("M012",
            "Miso Soup", "Traditional fermented soybean soup",
            4.99, "Soups"));

        // Register restaurants
        RestaurantService restaurantService = new RestaurantService();
        restaurantService.registerRestaurant(burgerJoint);
        restaurantService.registerRestaurant(sushiPlace);

        // Create delivery partners at different locations
        DeliveryPartner driverAlex = new DeliveryPartner("DP001",
            "Alex", "555-0101", 37.7760, -122.4180);
        DeliveryPartner driverMaya = new DeliveryPartner("DP002",
            "Maya", "555-0102", 37.7800, -122.4100);
        DeliveryPartner driverSam = new DeliveryPartner("DP003",
            "Sam", "555-0103", 37.7700, -122.4250);

        // Simulate different ratings for drivers
        driverAlex.updateRating(4.8);  // experienced, highly rated
        driverMaya.updateRating(4.9);  // top rated
        driverSam.updateRating(4.2);   // newer driver

        // Create order service with NearestPartner strategy (default)
        OrderService orderService = new OrderService(new NearestPartnerStrategy());
        orderService.registerPartner(driverAlex);
        orderService.registerPartner(driverMaya);
        orderService.registerPartner(driverSam);

        // Create rating service
        RatingService ratingService = new RatingService();

        // Create customer
        Customer customer = new Customer("C001", "John Doe",
            "john@example.com", "555-1234",
            "789 Pine St, Apt 4B", 37.7850, -122.4000);

        // ===== FLOW 1: FULL HAPPY-PATH ORDER =====

        System.out.println("\n" + "=".repeat(60));
        System.out.println("  FLOW 1: Complete Order (Happy Path)");
        System.out.println("=".repeat(60));

        // Step 1: Browse restaurants
        System.out.println("\n--- Step 1: Browse Restaurants ---");
        restaurantService.displayAllRestaurants();

        // Step 2: View menu
        System.out.println("--- Step 2: View Menu ---");
        burgerJoint.getMenu().displayMenu();

        // Step 3: Add items to cart
        System.out.println("--- Step 3: Add Items to Cart ---");
        Cart cart = new Cart(customer.getId());
        cart.addItem(burgerJoint.getMenu().getItem("M001"), 2,
                     burgerJoint.getId());  // 2x Classic Burger
        cart.addItem(burgerJoint.getMenu().getItem("M002"), 1,
                     burgerJoint.getId());  // 1x Cheese Fries
        cart.addItem(burgerJoint.getMenu().getItem("M003"), 2,
                     burgerJoint.getId());  // 2x Milkshake
        cart.displayCart();

        // Step 4: Place order
        System.out.println("--- Step 4: Place Order ---");
        Order order1 = orderService.placeOrder(customer, cart, burgerJoint);

        // Step 5: Assign delivery partner (nearest to restaurant)
        System.out.println("--- Step 5: Assign Delivery Partner ---");
        orderService.assignDeliveryPartner(order1);

        // Step 6: Progress through all states
        System.out.println("\n--- Step 6: Order State Progression ---");

        // 6a: Restaurant confirms the order
        orderService.confirmOrder(order1.getId());

        // 6b: Restaurant starts preparing
        orderService.startPreparing(order1.getId());

        // 6c: Food is ready
        orderService.markReady(order1.getId());

        // 6d: Driver picks up food
        orderService.pickUp(order1.getId());

        // 6e: Driver delivers food
        orderService.deliver(order1.getId());

        // Step 7: Customer rates
        System.out.println("\n--- Step 7: Rate Restaurant & Driver ---");
        ratingService.rateRestaurant(customer.getId(),
            burgerJoint.getId(), 5, "Amazing burgers! Best in town.");
        ratingService.rateDeliveryPartner(customer.getId(),
            order1.getDeliveryPartner(), 4, "Fast delivery, food was warm.");

        // Final order status
        System.out.println("\n--- Final Order Status ---");
        order1.displayOrderSummary();

        // ===== FLOW 2: ORDER CANCELLATION =====

        System.out.println("\n" + "=".repeat(60));
        System.out.println("  FLOW 2: Order Cancellation");
        System.out.println("=".repeat(60));

        // Place a new order
        Cart cart2 = new Cart(customer.getId());
        cart2.addItem(sushiPlace.getMenu().getItem("M010"), 1,
                      sushiPlace.getId());
        cart2.addItem(sushiPlace.getMenu().getItem("M012"), 1,
                      sushiPlace.getId());

        Order order2 = orderService.placeOrder(customer, cart2, sushiPlace);
        orderService.assignDeliveryPartner(order2);

        // Confirm and then cancel
        orderService.confirmOrder(order2.getId());
        orderService.cancelOrder(order2.getId());

        // Verify driver is available again
        System.out.println("\n  Driver '" +
            order2.getDeliveryPartner().getName() +
            "' available after cancel: " +
            order2.getDeliveryPartner().isAvailable());

        // Try to cancel an already-cancelled order (should fail)
        System.out.println("\n--- Attempting double cancellation ---");
        try {
            orderService.cancelOrder(order2.getId());
        } catch (IllegalStateException e) {
            System.out.println("  Caught expected error: " + e.getMessage());
        }

        // ===== FLOW 3: INVALID STATE TRANSITION =====

        System.out.println("\n" + "=".repeat(60));
        System.out.println("  FLOW 3: Invalid State Transition");
        System.out.println("=".repeat(60));

        Cart cart3 = new Cart(customer.getId());
        cart3.addItem(burgerJoint.getMenu().getItem("M004"), 1,
                      burgerJoint.getId());

        Order order3 = orderService.placeOrder(customer, cart3, burgerJoint);

        // Try to mark food ready before it is even confirmed (should fail)
        System.out.println("\n--- Attempting to skip states ---");
        try {
            orderService.markReady(order3.getId());
        } catch (IllegalStateException e) {
            System.out.println("  Caught expected error: " + e.getMessage());
        }

        // Try to cancel after PREPARING (should fail)
        orderService.confirmOrder(order3.getId());
        orderService.startPreparing(order3.getId());

        System.out.println("\n--- Attempting cancel after PREPARING ---");
        try {
            orderService.cancelOrder(order3.getId());
        } catch (IllegalStateException e) {
            System.out.println("  Caught expected error: " + e.getMessage());
        }

        // ===== FLOW 4: STRATEGY SWITCHING =====

        System.out.println("\n" + "=".repeat(60));
        System.out.println("  FLOW 4: Strategy Switching");
        System.out.println("=".repeat(60));

        // Reset partner availability
        driverAlex.setAvailable(true);
        driverMaya.setAvailable(true);
        driverSam.setAvailable(true);

        // Switch to HighestRated strategy
        orderService.setAssignmentStrategy(new HighestRatedStrategy());

        Cart cart4 = new Cart(customer.getId());
        cart4.addItem(sushiPlace.getMenu().getItem("M011"), 2,
                      sushiPlace.getId());

        Order order4 = orderService.placeOrder(customer, cart4, sushiPlace);

        System.out.println("\n--- Using HighestRated strategy ---");
        orderService.assignDeliveryPartner(order4);
        System.out.println("  Assigned: " +
            order4.getDeliveryPartner().getName() +
            " (rating: " +
            String.format("%.1f", order4.getDeliveryPartner().getAverageRating()) +
            ")");

        // Switch to LeastBusy strategy
        orderService.setAssignmentStrategy(new LeastBusyStrategy());

        Cart cart5 = new Cart(customer.getId());
        cart5.addItem(burgerJoint.getMenu().getItem("M001"), 1,
                      burgerJoint.getId());
        cart5.addItem(burgerJoint.getMenu().getItem("M005"), 1,
                      burgerJoint.getId());

        Order order5 = orderService.placeOrder(customer, cart5, burgerJoint);

        System.out.println("\n--- Using LeastBusy strategy ---");
        orderService.assignDeliveryPartner(order5);
        System.out.println("  Assigned: " +
            order5.getDeliveryPartner().getName() +
            " (active deliveries: " +
            order5.getDeliveryPartner().getActiveDeliveries() + ")");

        // ===== FLOW 5: CART VALIDATION =====

        System.out.println("\n" + "=".repeat(60));
        System.out.println("  FLOW 5: Cart Validation");
        System.out.println("=".repeat(60));

        // Try adding items from different restaurants
        Cart mixedCart = new Cart(customer.getId());
        mixedCart.addItem(burgerJoint.getMenu().getItem("M001"), 1,
                          burgerJoint.getId());

        System.out.println("\n--- Adding item from different restaurant ---");
        try {
            mixedCart.addItem(sushiPlace.getMenu().getItem("M010"), 1,
                              sushiPlace.getId());
        } catch (IllegalStateException e) {
            System.out.println("  Caught expected error: " + e.getMessage());
        }

        // Try placing order with empty cart
        System.out.println("\n--- Placing order with empty cart ---");
        Cart emptyCart = new Cart(customer.getId());
        try {
            orderService.placeOrder(customer, emptyCart, burgerJoint);
        } catch (IllegalStateException e) {
            System.out.println("  Caught expected error: " + e.getMessage());
        }

        // Try ordering from a closed restaurant
        System.out.println("\n--- Ordering from closed restaurant ---");
        sushiPlace.setOpen(false);
        Cart closedCart = new Cart(customer.getId());
        closedCart.addItem(sushiPlace.getMenu().getItem("M010"), 1,
                           sushiPlace.getId());
        try {
            orderService.placeOrder(customer, closedCart, sushiPlace);
        } catch (IllegalStateException e) {
            System.out.println("  Caught expected error: " + e.getMessage());
        }
        sushiPlace.setOpen(true);  // reopen

        // Try adding unavailable item
        System.out.println("\n--- Adding unavailable item ---");
        burgerJoint.getMenu().getItem("M003").setAvailable(false);
        Cart unavailCart = new Cart(customer.getId());
        try {
            unavailCart.addItem(burgerJoint.getMenu().getItem("M003"), 1,
                                burgerJoint.getId());
        } catch (IllegalStateException e) {
            System.out.println("  Caught expected error: " + e.getMessage());
        }
        burgerJoint.getMenu().getItem("M003").setAvailable(true);

        // ===== FLOW 6: RATING VALIDATION =====

        System.out.println("\n" + "=".repeat(60));
        System.out.println("  FLOW 6: Rating Validation");
        System.out.println("=".repeat(60));

        // Valid ratings
        ratingService.rateRestaurant(customer.getId(),
            sushiPlace.getId(), 4, "Fresh sushi, good portion size.");
        ratingService.rateDeliveryPartner(customer.getId(),
            driverAlex, 5, "Excellent service, very polite!");

        // Check average ratings
        System.out.printf("\n  Burger Palace avg rating: %.1f stars%n",
            ratingService.getRestaurantAverageRating(burgerJoint.getId()));
        System.out.printf("  Tokyo Sushi avg rating:   %.1f stars%n",
            ratingService.getRestaurantAverageRating(sushiPlace.getId()));
        System.out.printf("  Driver Alex avg rating:   %.1f stars%n",
            ratingService.getPartnerAverageRating(driverAlex.getId()));

        // Invalid rating (out of range)
        System.out.println("\n--- Invalid rating (6 stars) ---");
        try {
            ratingService.rateRestaurant(customer.getId(),
                burgerJoint.getId(), 6, "Too many stars!");
        } catch (IllegalArgumentException e) {
            System.out.println("  Caught expected error: " + e.getMessage());
        }

        // ===== SUMMARY =====

        System.out.println("\n" + "=".repeat(60));
        System.out.println("  DEMO COMPLETE");
        System.out.println("=".repeat(60));
        System.out.println("\n  Patterns demonstrated:");
        System.out.println("    1. State    -- Order lifecycle (PLACED through DELIVERED)");
        System.out.println("    2. Strategy -- NearestPartner, HighestRated, LeastBusy");
        System.out.println("    3. Observer -- Customer, Restaurant, Driver notifications");
        System.out.println("    4. Builder  -- OrderBuilder from Cart contents");
        System.out.println("\n  Flows demonstrated:");
        System.out.println("    1. Full happy-path order with all state transitions");
        System.out.println("    2. Order cancellation from CONFIRMED state");
        System.out.println("    3. Invalid state transitions (skipping states, late cancel)");
        System.out.println("    4. Runtime strategy switching for partner assignment");
        System.out.println("    5. Cart validation (mixed restaurants, empty, closed, unavailable)");
        System.out.println("    6. Rating system with validation and averages");
    }
}
```

---

## Expected Output

```
============================================================
    FOOD ORDERING SYSTEM -- FULL DEMO
============================================================

============================================================
  FLOW 1: Complete Order (Happy Path)
============================================================

--- Step 1: Browse Restaurants ---

===== AVAILABLE RESTAURANTS =====
  [R001] Burger Palace             (American) - 123 Main St
  [R002] Tokyo Sushi               (Japanese) - 456 Oak Ave

--- Step 2: View Menu ---

===== MENU =====

--- Burgers ---
  Classic Burger              $12.99  [Burgers]
  Double Bacon Burger         $16.99  [Burgers]

--- Sides ---
  Cheese Fries                $6.99  [Sides]
  Onion Rings                 $7.49  [Sides]

--- Drinks ---
  Milkshake                   $5.99  [Drinks]

--- Step 3: Add Items to Cart ---

===== YOUR CART =====
  2x Classic Burger        $25.98
  1x Cheese Fries          $6.99
  2x Milkshake             $11.98
  SUBTOTAL:                $44.95

--- Step 4: Place Order ---

[OrderService] Placing order...
[OrderService] Order ORD-0001 placed successfully.

===== ORDER SUMMARY =====
  Order ID:    ORD-0001
  Customer:    John Doe
  Restaurant:  Burger Palace
  Status:      PLACED
  Items:
    2x Classic Burger        $25.98
    1x Cheese Fries          $6.99
    2x Milkshake             $11.98
  Subtotal:    $44.95
  Delivery:    $5.99
  Tax:         $3.60
  TOTAL:       $54.54

--- Step 5: Assign Delivery Partner ---
[OrderService] Assigning delivery partner for order ORD-0001...
  [Strategy] NearestPartner: selected 'Alex' (0.19 km away)
[OrderService] Delivery partner 'Alex' assigned to order ORD-0001

--- Step 6: Order State Progression ---

[OrderService] Confirming order ORD-0001...
  [State] Order ORD-0001: PLACED -> CONFIRMED
    [Notify -> Customer John Doe] Your order has been confirmed by Burger Palace!
    [Notify -> Restaurant Burger Palace] You confirmed order ORD-0001. Please start preparing soon.

[OrderService] Restaurant starts preparing ORD-0001...
  [State] Order ORD-0001: CONFIRMED -> PREPARING
    [Notify -> Customer John Doe] Your food is being prepared!
    [Notify -> Restaurant Burger Palace] Order ORD-0001 is now being prepared.

[OrderService] Food ready for ORD-0001...
  [State] Order ORD-0001: PREPARING -> READY
    [Notify -> Customer John Doe] Your food is ready and waiting for pickup!
    [Notify -> Driver Alex] Food is ready for pickup at Burger Palace (123 Main St)

[OrderService] Driver picking up ORD-0001...
  [State] Order ORD-0001: READY -> PICKED_UP
    [Notify -> Customer John Doe] Your driver Alex picked up your food!
    [Notify -> Restaurant Burger Palace] Driver picked up order ORD-0001.
    [Notify -> Driver Alex] Pickup confirmed. Deliver to 789 Pine St, Apt 4B

[OrderService] Driver delivering ORD-0001...
  [State] Order ORD-0001: PICKED_UP -> DELIVERED
    [Notify -> Customer John Doe] Your food has arrived! Enjoy your meal!
    [Notify -> Driver Alex] Delivery confirmed! You are now available for new assignments.

--- Step 7: Rate Restaurant & Driver ---
[RatingService] Restaurant rated: 5 stars - "Amazing burgers! Best in town."
[RatingService] Delivery partner 'Alex' rated: 4 stars - "Fast delivery, food was warm."

...
(further flows for cancellation, invalid transitions, strategy switching, validation)
```

---

## Class Summary

| Class | Pattern | Lines | Responsibility |
|-------|---------|-------|----------------|
| `Customer` | Entity | ~35 | Customer data and delivery address |
| `Restaurant` | Entity | ~35 | Restaurant info with menu and location |
| `MenuItem` | Entity | ~35 | Single menu item with price and availability |
| `Menu` | Entity | ~50 | Collection of menu items with category browsing |
| `CartItem` | Entity | ~30 | Item in cart with quantity and subtotal |
| `Cart` | Entity | ~65 | Single-restaurant cart with validation |
| `OrderStatus` | Enum | ~15 | All possible order statuses |
| `OrderState` | State | ~30 | Interface with default illegal-transition methods |
| `PlacedState` | State | ~20 | Handles confirm() and cancel() |
| `ConfirmedState` | State | ~20 | Handles startPreparing() and cancel() |
| `PreparingState` | State | ~15 | Handles markReady() |
| `ReadyState` | State | ~15 | Handles pickUp() |
| `PickedUpState` | State | ~20 | Handles deliver(), releases partner |
| `DeliveredState` | State | ~5 | Terminal state |
| `CancelledState` | State | ~5 | Terminal state |
| `OrderItem` | Entity | ~25 | Price-snapshotted item in an order |
| `Order` | Core | ~90 | Central entity with state delegation and observer management |
| `DeliveryPartner` | Entity | ~60 | Driver with location, rating, Haversine distance |
| `DeliveryAssignmentStrategy` | Strategy | ~10 | Interface for partner selection |
| `NearestPartnerStrategy` | Strategy | ~25 | Select closest partner to restaurant |
| `HighestRatedStrategy` | Strategy | ~20 | Select highest-rated partner |
| `LeastBusyStrategy` | Strategy | ~20 | Select partner with fewest active deliveries |
| `OrderStatusObserver` | Observer | ~5 | Interface for status change notification |
| `CustomerNotificationObserver` | Observer | ~30 | Notify customer of all status changes |
| `RestaurantNotificationObserver` | Observer | ~25 | Notify restaurant of relevant changes |
| `DeliveryPartnerNotificationObserver` | Observer | ~25 | Notify driver of relevant changes |
| `OrderBuilder` | Builder | ~45 | Fluent builder for Order from Cart |
| `OrderService` | Service | ~80 | Orchestrates full order lifecycle |
| `RestaurantService` | Service | ~40 | Restaurant catalog and search |
| `Rating` | Entity | ~30 | Star rating with comment |
| `RatingType` | Enum | ~5 | RESTAURANT or DELIVERY_PARTNER |
| `RatingService` | Service | ~40 | Rating submission and average calculation |
| `FoodOrderingApp` | Main | ~200 | Full demo with all six flows |
