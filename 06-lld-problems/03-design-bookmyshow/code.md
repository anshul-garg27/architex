# BookMyShow -- Complete Java Implementation

> Full working code for the Movie Ticket Booking system.
> Covers all entities, design patterns, concurrent seat locking, and a demo main class.

---

## Table of Contents

1. [Enums](#1-enums)
2. [Core Entities](#2-core-entities)
3. [Seat Hierarchy and Factory](#3-seat-hierarchy-and-factory)
4. [Show and ShowSeat](#4-show-and-showseat)
5. [SeatLock with TTL](#5-seatlock-with-ttl)
6. [Booking with State Machine](#6-booking-with-state-machine)
7. [Pricing Strategy](#7-pricing-strategy)
8. [Observer -- Notification Service](#8-observer----notification-service)
9. [BookingService -- The Core Engine](#9-bookingservice----the-core-engine)
10. [Main -- Demo Booking Flow](#10-main----demo-booking-flow)

---

## 1. Enums

```java
// ──────────────────────────────────────────────────
// SeatType.java
// ──────────────────────────────────────────────────
public enum SeatType {
    REGULAR,
    PREMIUM,
    VIP
}
```

```java
// ──────────────────────────────────────────────────
// ShowSeatStatus.java
// ──────────────────────────────────────────────────
public enum ShowSeatStatus {
    AVAILABLE,
    LOCKED,
    BOOKED
}
```

```java
// ──────────────────────────────────────────────────
// BookingStatus.java
// ──────────────────────────────────────────────────
public enum BookingStatus {
    PENDING,
    CONFIRMED,
    CANCELLED
}
```

```java
// ──────────────────────────────────────────────────
// PaymentStatus.java
// ──────────────────────────────────────────────────
public enum PaymentStatus {
    PENDING,
    SUCCESS,
    FAILED
}
```

```java
// ──────────────────────────────────────────────────
// PaymentMethod.java
// ──────────────────────────────────────────────────
public enum PaymentMethod {
    CREDIT_CARD,
    DEBIT_CARD,
    UPI,
    NET_BANKING
}
```

```java
// ──────────────────────────────────────────────────
// Genre.java
// ──────────────────────────────────────────────────
public enum Genre {
    ACTION,
    COMEDY,
    DRAMA,
    THRILLER,
    HORROR,
    ROMANCE,
    SCI_FI
}
```

```java
// ──────────────────────────────────────────────────
// City.java
// ──────────────────────────────────────────────────
public enum City {
    MUMBAI,
    DELHI,
    BANGALORE,
    HYDERABAD,
    CHENNAI
}
```

---

## 2. Core Entities

```java
// ──────────────────────────────────────────────────
// User.java
// ──────────────────────────────────────────────────
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

    public String getUserId() { return userId; }
    public String getName()   { return name; }
    public String getEmail()  { return email; }
    public String getPhone()  { return phone; }

    @Override
    public String toString() {
        return "User{" + userId + ", " + name + "}";
    }
}
```

```java
// ──────────────────────────────────────────────────
// Movie.java
// ──────────────────────────────────────────────────
public class Movie {
    private final String movieId;
    private final String title;
    private final String description;
    private final Genre genre;
    private final int durationMinutes;
    private final double rating;

    public Movie(String movieId, String title, String description,
                 Genre genre, int durationMinutes, double rating) {
        this.movieId = movieId;
        this.title = title;
        this.description = description;
        this.genre = genre;
        this.durationMinutes = durationMinutes;
        this.rating = rating;
    }

    public String getMovieId()       { return movieId; }
    public String getTitle()         { return title; }
    public String getDescription()   { return description; }
    public Genre getGenre()          { return genre; }
    public int getDurationMinutes()  { return durationMinutes; }
    public double getRating()        { return rating; }

    @Override
    public String toString() {
        return "Movie{" + title + ", " + genre + ", " + rating + "}";
    }
}
```

```java
// ──────────────────────────────────────────────────
// Theater.java
// ──────────────────────────────────────────────────
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Theater {
    private final String theaterId;
    private final String name;
    private final String address;
    private final City city;
    private final List<Screen> screens;

    public Theater(String theaterId, String name, String address, City city) {
        this.theaterId = theaterId;
        this.name = name;
        this.address = address;
        this.city = city;
        this.screens = new ArrayList<>();
    }

    public void addScreen(Screen screen) {
        screens.add(screen);
    }

    public String getTheaterId()       { return theaterId; }
    public String getName()            { return name; }
    public String getAddress()         { return address; }
    public City getCity()              { return city; }
    public List<Screen> getScreens()   { return Collections.unmodifiableList(screens); }

    @Override
    public String toString() {
        return "Theater{" + name + ", " + city + "}";
    }
}
```

```java
// ──────────────────────────────────────────────────
// Screen.java
// ──────────────────────────────────────────────────
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Screen {
    private final String screenId;
    private final String name;
    private final Theater theater;
    private final List<Seat> seats;

    public Screen(String screenId, String name, Theater theater) {
        this.screenId = screenId;
        this.name = name;
        this.theater = theater;
        this.seats = new ArrayList<>();
    }

    public void addSeat(Seat seat) {
        seats.add(seat);
    }

    public String getScreenId()       { return screenId; }
    public String getName()           { return name; }
    public Theater getTheater()       { return theater; }
    public List<Seat> getSeats()      { return Collections.unmodifiableList(seats); }
    public int getTotalCapacity()     { return seats.size(); }

    @Override
    public String toString() {
        return "Screen{" + name + ", capacity=" + seats.size() + "}";
    }
}
```

---

## 3. Seat Hierarchy and Factory

### Abstract Seat

```java
// ──────────────────────────────────────────────────
// Seat.java (Abstract Base)
// ──────────────────────────────────────────────────
public abstract class Seat {
    private final String seatId;
    private final String seatNumber;    // e.g., "A1", "B5"
    private final SeatType seatType;
    private final double basePrice;

    protected Seat(String seatId, String seatNumber, SeatType seatType, double basePrice) {
        this.seatId = seatId;
        this.seatNumber = seatNumber;
        this.seatType = seatType;
        this.basePrice = basePrice;
    }

    public String getSeatId()       { return seatId; }
    public String getSeatNumber()   { return seatNumber; }
    public SeatType getSeatType()   { return seatType; }
    public double getBasePrice()    { return basePrice; }

    /** Each subclass defines its own price multiplier. */
    public abstract double getPriceMultiplier();

    /** Effective price = base price * multiplier. */
    public double getEffectivePrice() {
        return basePrice * getPriceMultiplier();
    }

    @Override
    public String toString() {
        return seatNumber + "(" + seatType + ", $" + getEffectivePrice() + ")";
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Seat)) return false;
        return seatId.equals(((Seat) o).seatId);
    }

    @Override
    public int hashCode() {
        return seatId.hashCode();
    }
}
```

### Concrete Seat Types

```java
// ──────────────────────────────────────────────────
// RegularSeat.java
// ──────────────────────────────────────────────────
public class RegularSeat extends Seat {

    public RegularSeat(String seatId, String seatNumber, double basePrice) {
        super(seatId, seatNumber, SeatType.REGULAR, basePrice);
    }

    @Override
    public double getPriceMultiplier() {
        return 1.0;   // No surcharge
    }
}
```

```java
// ──────────────────────────────────────────────────
// PremiumSeat.java
// ──────────────────────────────────────────────────
public class PremiumSeat extends Seat {

    public PremiumSeat(String seatId, String seatNumber, double basePrice) {
        super(seatId, seatNumber, SeatType.PREMIUM, basePrice);
    }

    @Override
    public double getPriceMultiplier() {
        return 1.5;   // 50% surcharge over regular
    }
}
```

```java
// ──────────────────────────────────────────────────
// VIPSeat.java
// ──────────────────────────────────────────────────
public class VIPSeat extends Seat {

    public VIPSeat(String seatId, String seatNumber, double basePrice) {
        super(seatId, seatNumber, SeatType.VIP, basePrice);
    }

    @Override
    public double getPriceMultiplier() {
        return 2.5;   // 150% surcharge over regular
    }
}
```

### Seat Factory

```java
// ──────────────────────────────────────────────────
// SeatFactory.java
// ──────────────────────────────────────────────────
public class SeatFactory {

    private static int seatCounter = 0;

    /**
     * Creates a seat of the given type.
     * @param seatNumber  display label like "A1", "C5"
     * @param type        REGULAR, PREMIUM, or VIP
     * @param basePrice   base price before any multiplier
     * @return            a fully initialized Seat subclass
     */
    public static Seat createSeat(String seatNumber, SeatType type, double basePrice) {
        String seatId = "SEAT-" + (++seatCounter);

        switch (type) {
            case REGULAR:
                return new RegularSeat(seatId, seatNumber, basePrice);
            case PREMIUM:
                return new PremiumSeat(seatId, seatNumber, basePrice);
            case VIP:
                return new VIPSeat(seatId, seatNumber, basePrice);
            default:
                throw new IllegalArgumentException("Unknown seat type: " + type);
        }
    }
}
```

---

## 4. Show and ShowSeat

### ShowSeat -- Per-Show Seat State

```java
// ──────────────────────────────────────────────────
// ShowSeat.java
// ──────────────────────────────────────────────────
/**
 * Represents the state of a physical Seat within a specific Show.
 * The same physical seat (e.g., A1) has a separate ShowSeat for the 3PM show
 * and the 6PM show -- they are independent.
 */
public class ShowSeat {
    private final Seat seat;
    private ShowSeatStatus status;
    private SeatLock currentLock;    // non-null only when LOCKED

    public ShowSeat(Seat seat) {
        this.seat = seat;
        this.status = ShowSeatStatus.AVAILABLE;
        this.currentLock = null;
    }

    public Seat getSeat()              { return seat; }
    public ShowSeatStatus getStatus()  { return status; }
    public SeatLock getCurrentLock()   { return currentLock; }

    public boolean isAvailable() {
        // Also treat expired locks as available
        if (status == ShowSeatStatus.LOCKED && currentLock != null && currentLock.isExpired()) {
            release();
        }
        return status == ShowSeatStatus.AVAILABLE;
    }

    public boolean isLocked()  { return status == ShowSeatStatus.LOCKED && !currentLock.isExpired(); }
    public boolean isBooked()  { return status == ShowSeatStatus.BOOKED; }

    /**
     * Acquire a temporary lock on this seat.
     * Must be called inside a synchronized block for thread safety.
     */
    public void lock(SeatLock lock) {
        if (!isAvailable()) {
            throw new IllegalStateException("Seat " + seat.getSeatNumber() + " is not available");
        }
        this.currentLock = lock;
        this.status = ShowSeatStatus.LOCKED;
    }

    /**
     * Convert a locked seat to permanently booked.
     */
    public void book() {
        if (status != ShowSeatStatus.LOCKED) {
            throw new IllegalStateException("Seat " + seat.getSeatNumber()
                + " must be LOCKED before booking, current status: " + status);
        }
        this.status = ShowSeatStatus.BOOKED;
        this.currentLock = null;   // Lock is no longer needed
    }

    /**
     * Release a lock (timeout or cancellation). Seat returns to AVAILABLE.
     */
    public void release() {
        this.status = ShowSeatStatus.AVAILABLE;
        this.currentLock = null;
    }

    @Override
    public String toString() {
        return seat.getSeatNumber() + "[" + status + "]";
    }
}
```

### Show

```java
// ──────────────────────────────────────────────────
// Show.java
// ──────────────────────────────────────────────────
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

public class Show {
    private final String showId;
    private final Movie movie;
    private final Screen screen;
    private final LocalDateTime startTime;
    private final LocalDateTime endTime;
    private final Map<String, ShowSeat> showSeatMap;  // seatId -> ShowSeat

    public Show(String showId, Movie movie, Screen screen,
                LocalDateTime startTime, LocalDateTime endTime) {
        this.showId = showId;
        this.movie = movie;
        this.screen = screen;
        this.startTime = startTime;
        this.endTime = endTime;
        this.showSeatMap = new LinkedHashMap<>();

        // Initialize one ShowSeat per physical seat in the screen
        for (Seat seat : screen.getSeats()) {
            showSeatMap.put(seat.getSeatId(), new ShowSeat(seat));
        }
    }

    public String getShowId()             { return showId; }
    public Movie getMovie()               { return movie; }
    public Screen getScreen()             { return screen; }
    public LocalDateTime getStartTime()   { return startTime; }
    public LocalDateTime getEndTime()     { return endTime; }

    public ShowSeat getShowSeat(String seatId) {
        ShowSeat ss = showSeatMap.get(seatId);
        if (ss == null) {
            throw new IllegalArgumentException("Seat " + seatId + " not found in show " + showId);
        }
        return ss;
    }

    public List<ShowSeat> getAllShowSeats() {
        return new ArrayList<>(showSeatMap.values());
    }

    public List<ShowSeat> getAvailableSeats() {
        return showSeatMap.values().stream()
                .filter(ShowSeat::isAvailable)
                .collect(Collectors.toList());
    }

    @Override
    public String toString() {
        long available = showSeatMap.values().stream().filter(ShowSeat::isAvailable).count();
        return "Show{" + movie.getTitle() + " @ " + screen.getName()
             + " " + startTime + ", available=" + available + "/" + showSeatMap.size() + "}";
    }
}
```

---

## 5. SeatLock with TTL

```java
// ──────────────────────────────────────────────────
// SeatLock.java
// ──────────────────────────────────────────────────
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Represents a temporary hold on a seat for a specific user.
 * The lock expires after a configurable TTL (default 5 minutes).
 */
public class SeatLock {
    private final String lockId;
    private final String userId;
    private final String showId;
    private final String seatId;
    private final LocalDateTime lockTime;
    private final LocalDateTime expiryTime;

    public SeatLock(String userId, String showId, String seatId,
                    LocalDateTime lockTime, int ttlMinutes) {
        this.lockId = "LOCK-" + UUID.randomUUID().toString().substring(0, 8);
        this.userId = userId;
        this.showId = showId;
        this.seatId = seatId;
        this.lockTime = lockTime;
        this.expiryTime = lockTime.plusMinutes(ttlMinutes);
    }

    public String getLockId()              { return lockId; }
    public String getUserId()              { return userId; }
    public String getShowId()              { return showId; }
    public String getSeatId()              { return seatId; }
    public LocalDateTime getLockTime()     { return lockTime; }
    public LocalDateTime getExpiryTime()   { return expiryTime; }

    /**
     * A lock is expired if the current time is past the expiry time.
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiryTime);
    }

    /**
     * Check if this lock belongs to a given user.
     */
    public boolean isOwnedBy(String userId) {
        return this.userId.equals(userId);
    }

    @Override
    public String toString() {
        return "SeatLock{" + lockId + ", user=" + userId
             + ", seat=" + seatId + ", expires=" + expiryTime + "}";
    }
}
```

---

## 6. Booking with State Machine

### Payment

```java
// ──────────────────────────────────────────────────
// Payment.java
// ──────────────────────────────────────────────────
import java.util.UUID;

public class Payment {
    private final String paymentId;
    private final double amount;
    private final PaymentMethod method;
    private PaymentStatus status;
    private String transactionId;

    public Payment(double amount, PaymentMethod method) {
        this.paymentId = "PAY-" + UUID.randomUUID().toString().substring(0, 8);
        this.amount = amount;
        this.method = method;
        this.status = PaymentStatus.PENDING;
    }

    /**
     * Simulates payment processing.
     * In a real system, this would call a payment gateway.
     * Returns true if payment succeeds.
     */
    public boolean process() {
        // Simulate: 90% chance of success
        if (Math.random() < 0.9) {
            this.status = PaymentStatus.SUCCESS;
            this.transactionId = "TXN-" + UUID.randomUUID().toString().substring(0, 8);
            return true;
        } else {
            this.status = PaymentStatus.FAILED;
            return false;
        }
    }

    /** Force success -- used in demo to control the flow. */
    public void markSuccess() {
        this.status = PaymentStatus.SUCCESS;
        this.transactionId = "TXN-" + UUID.randomUUID().toString().substring(0, 8);
    }

    /** Force failure -- used in demo to control the flow. */
    public void markFailed() {
        this.status = PaymentStatus.FAILED;
    }

    public String getPaymentId()       { return paymentId; }
    public double getAmount()          { return amount; }
    public PaymentMethod getMethod()   { return method; }
    public PaymentStatus getStatus()   { return status; }
    public String getTransactionId()   { return transactionId; }
    public boolean isSuccessful()      { return status == PaymentStatus.SUCCESS; }

    @Override
    public String toString() {
        return "Payment{" + paymentId + ", " + amount + ", " + method + ", " + status + "}";
    }
}
```

### Booking with State Transitions

```java
// ──────────────────────────────────────────────────
// Booking.java
// ──────────────────────────────────────────────────
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

public class Booking {
    private final String bookingId;
    private final User user;
    private final Show show;
    private final List<Seat> seats;
    private final double totalAmount;
    private final LocalDateTime createdAt;
    private BookingStatus status;
    private Payment payment;

    public Booking(User user, Show show, List<Seat> seats, double totalAmount) {
        this.bookingId = "BK-" + UUID.randomUUID().toString().substring(0, 8);
        this.user = user;
        this.show = show;
        this.seats = seats;
        this.totalAmount = totalAmount;
        this.createdAt = LocalDateTime.now();
        this.status = BookingStatus.PENDING;
    }

    // ─── State machine transitions ───

    /**
     * PENDING -> CONFIRMED (only valid transition for confirm)
     */
    public void confirm(Payment payment) {
        if (this.status != BookingStatus.PENDING) {
            throw new IllegalStateException(
                "Cannot confirm booking in state: " + this.status
                + ". Only PENDING bookings can be confirmed.");
        }
        if (!payment.isSuccessful()) {
            throw new IllegalStateException("Cannot confirm with a failed payment");
        }
        this.payment = payment;
        this.status = BookingStatus.CONFIRMED;
    }

    /**
     * PENDING -> CANCELLED or CONFIRMED -> CANCELLED
     * (CANCELLED -> anything is invalid)
     */
    public void cancel() {
        if (this.status == BookingStatus.CANCELLED) {
            throw new IllegalStateException("Booking is already cancelled");
        }
        this.status = BookingStatus.CANCELLED;
    }

    // ─── Getters ───

    public String getBookingId()           { return bookingId; }
    public User getUser()                  { return user; }
    public Show getShow()                  { return show; }
    public List<Seat> getSeats()           { return Collections.unmodifiableList(seats); }
    public double getTotalAmount()         { return totalAmount; }
    public BookingStatus getStatus()       { return status; }
    public Payment getPayment()            { return payment; }
    public LocalDateTime getCreatedAt()    { return createdAt; }

    @Override
    public String toString() {
        return "Booking{" + bookingId
             + ", user=" + user.getName()
             + ", movie=" + show.getMovie().getTitle()
             + ", seats=" + seats.size()
             + ", amount=" + totalAmount
             + ", status=" + status + "}";
    }
}
```

---

## 7. Pricing Strategy

### Strategy Interface

```java
// ──────────────────────────────────────────────────
// PricingStrategy.java
// ──────────────────────────────────────────────────
/**
 * Strategy interface for calculating ticket prices.
 * Different implementations handle regular days, weekends, holidays, etc.
 */
public interface PricingStrategy {

    /**
     * Calculate the final price for a single seat in a given show.
     * @param seat  the seat being priced
     * @param show  the show (used for date-based pricing)
     * @return      the final price for this seat
     */
    double calculatePrice(Seat seat, Show show);
}
```

### Regular Pricing (weekdays)

```java
// ──────────────────────────────────────────────────
// RegularPricingStrategy.java
// ──────────────────────────────────────────────────
/**
 * Standard pricing: seat's effective price with no surcharge.
 */
public class RegularPricingStrategy implements PricingStrategy {

    @Override
    public double calculatePrice(Seat seat, Show show) {
        return seat.getEffectivePrice();
    }

    @Override
    public String toString() {
        return "RegularPricing (1.0x)";
    }
}
```

### Weekend Pricing

```java
// ──────────────────────────────────────────────────
// WeekendPricingStrategy.java
// ──────────────────────────────────────────────────
import java.time.DayOfWeek;

/**
 * Weekend surcharge: 20% extra on Saturday and Sunday.
 * Falls back to regular pricing on weekdays.
 */
public class WeekendPricingStrategy implements PricingStrategy {

    private static final double WEEKEND_MULTIPLIER = 1.2;

    @Override
    public double calculatePrice(Seat seat, Show show) {
        double basePrice = seat.getEffectivePrice();
        DayOfWeek day = show.getStartTime().getDayOfWeek();

        if (day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY) {
            return basePrice * WEEKEND_MULTIPLIER;
        }
        return basePrice;   // No surcharge on weekdays
    }

    @Override
    public String toString() {
        return "WeekendPricing (1.2x on Sat/Sun)";
    }
}
```

### Premium / Holiday Pricing

```java
// ──────────────────────────────────────────────────
// PremiumPricingStrategy.java
// ──────────────────────────────────────────────────
/**
 * Premium pricing for holidays, premiere nights, or high-demand shows.
 * Applies a flat 50% surcharge regardless of day.
 */
public class PremiumPricingStrategy implements PricingStrategy {

    private static final double PREMIUM_MULTIPLIER = 1.5;

    @Override
    public double calculatePrice(Seat seat, Show show) {
        return seat.getEffectivePrice() * PREMIUM_MULTIPLIER;
    }

    @Override
    public String toString() {
        return "PremiumPricing (1.5x always)";
    }
}
```

---

## 8. Observer -- Notification Service

### Observer Interface

```java
// ──────────────────────────────────────────────────
// BookingObserver.java
// ──────────────────────────────────────────────────
/**
 * Observer interface for booking events.
 * Implementations react to booking lifecycle changes.
 */
public interface BookingObserver {
    void onBookingConfirmed(Booking booking);
    void onBookingCancelled(Booking booking);
    void onSeatsReleased(Show show, int seatsFreed);
}
```

### Email Notifier

```java
// ──────────────────────────────────────────────────
// EmailNotifier.java
// ──────────────────────────────────────────────────
public class EmailNotifier implements BookingObserver {

    @Override
    public void onBookingConfirmed(Booking booking) {
        System.out.println("  [EMAIL] Sending confirmation to "
            + booking.getUser().getEmail()
            + " | Booking: " + booking.getBookingId()
            + " | Movie: " + booking.getShow().getMovie().getTitle()
            + " | Amount: $" + booking.getTotalAmount());
    }

    @Override
    public void onBookingCancelled(Booking booking) {
        System.out.println("  [EMAIL] Sending cancellation notice to "
            + booking.getUser().getEmail()
            + " | Booking: " + booking.getBookingId());
    }

    @Override
    public void onSeatsReleased(Show show, int seatsFreed) {
        System.out.println("  [EMAIL] " + seatsFreed + " seats now available for "
            + show.getMovie().getTitle() + " at " + show.getStartTime());
    }
}
```

### SMS Notifier

```java
// ──────────────────────────────────────────────────
// SMSNotifier.java
// ──────────────────────────────────────────────────
public class SMSNotifier implements BookingObserver {

    @Override
    public void onBookingConfirmed(Booking booking) {
        System.out.println("  [SMS] Ticket confirmed for "
            + booking.getUser().getPhone()
            + " | " + booking.getBookingId());
    }

    @Override
    public void onBookingCancelled(Booking booking) {
        System.out.println("  [SMS] Booking cancelled for "
            + booking.getUser().getPhone()
            + " | " + booking.getBookingId());
    }

    @Override
    public void onSeatsReleased(Show show, int seatsFreed) {
        System.out.println("  [SMS] " + seatsFreed + " seats freed for "
            + show.getMovie().getTitle());
    }
}
```

### Notification Service (Publisher)

```java
// ──────────────────────────────────────────────────
// NotificationService.java
// ──────────────────────────────────────────────────
import java.util.ArrayList;
import java.util.List;

public class NotificationService {
    private final List<BookingObserver> observers = new ArrayList<>();

    public void addObserver(BookingObserver observer) {
        observers.add(observer);
    }

    public void removeObserver(BookingObserver observer) {
        observers.remove(observer);
    }

    public void notifyBookingConfirmed(Booking booking) {
        for (BookingObserver observer : observers) {
            observer.onBookingConfirmed(booking);
        }
    }

    public void notifyBookingCancelled(Booking booking) {
        for (BookingObserver observer : observers) {
            observer.onBookingCancelled(booking);
        }
    }

    public void notifySeatsReleased(Show show, int seatsFreed) {
        for (BookingObserver observer : observers) {
            observer.onSeatsReleased(show, seatsFreed);
        }
    }
}
```

---

## 9. BookingService -- The Core Engine

This is the most important class. It orchestrates seat locking, payment, booking
creation, and cancellation -- all with thread safety.

```java
// ──────────────────────────────────────────────────
// BookingService.java
// ──────────────────────────────────────────────────
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Core service that handles the entire booking lifecycle:
 * 1. Lock seats (with TTL)
 * 2. Calculate price (via Strategy)
 * 3. Process payment
 * 4. Confirm booking (with Observer notification)
 * 5. Cancel booking
 *
 * Thread safety is achieved through:
 * - ConcurrentHashMap for the lock registry
 * - synchronized blocks on individual ShowSeat objects for state changes
 */
public class BookingService {

    private static final int LOCK_TTL_MINUTES = 5;

    // ── Lock registry: "showId:seatId" -> SeatLock ──
    // ConcurrentHashMap provides thread-safe operations without global locking.
    private final ConcurrentHashMap<String, SeatLock> seatLockMap = new ConcurrentHashMap<>();

    // ── Bookings storage ──
    private final Map<String, Booking> bookings = new ConcurrentHashMap<>();

    // ── Dependencies ──
    private PricingStrategy pricingStrategy;
    private final NotificationService notificationService;

    public BookingService(PricingStrategy pricingStrategy,
                          NotificationService notificationService) {
        this.pricingStrategy = pricingStrategy;
        this.notificationService = notificationService;
    }

    public void setPricingStrategy(PricingStrategy strategy) {
        this.pricingStrategy = strategy;
    }

    // ═══════════════════════════════════════════════════
    // 1. LOCK SEATS
    // ═══════════════════════════════════════════════════

    /**
     * Attempts to lock all requested seats for a user.
     * Uses ALL-OR-NOTHING semantics: if any seat cannot be locked,
     * all previously locked seats in this request are rolled back.
     *
     * @param user     the user requesting the lock
     * @param show     the show
     * @param seatIds  list of seat IDs to lock
     * @return         true if all seats locked successfully
     */
    public boolean lockSeats(User user, Show show, List<String> seatIds) {
        List<String> lockedKeys = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (String seatId : seatIds) {
            String lockKey = buildLockKey(show.getShowId(), seatId);
            SeatLock newLock = new SeatLock(user.getUserId(), show.getShowId(),
                                           seatId, now, LOCK_TTL_MINUTES);

            // ── Atomic lock attempt using ConcurrentHashMap ──
            SeatLock existingLock = seatLockMap.putIfAbsent(lockKey, newLock);

            if (existingLock == null) {
                // Lock acquired -- update ShowSeat state
                ShowSeat showSeat = show.getShowSeat(seatId);
                synchronized (showSeat) {
                    if (showSeat.isAvailable()) {
                        showSeat.lock(newLock);
                        lockedKeys.add(lockKey);
                    } else {
                        // ShowSeat not available (already booked); rollback map entry
                        seatLockMap.remove(lockKey);
                        rollbackLocks(show, lockedKeys);
                        return false;
                    }
                }
            } else if (existingLock.isExpired()) {
                // Previous lock expired -- try to replace atomically
                boolean replaced = seatLockMap.replace(lockKey, existingLock, newLock);
                if (replaced) {
                    ShowSeat showSeat = show.getShowSeat(seatId);
                    synchronized (showSeat) {
                        showSeat.release();       // Clear expired state
                        showSeat.lock(newLock);   // Apply new lock
                    }
                    lockedKeys.add(lockKey);
                } else {
                    // Someone else replaced it first -- fail
                    rollbackLocks(show, lockedKeys);
                    return false;
                }
            } else {
                // Seat is locked by another user and lock is still valid
                rollbackLocks(show, lockedKeys);
                return false;
            }
        }

        System.out.println("  Locked " + seatIds.size() + " seats for " + user.getName()
            + " (expires in " + LOCK_TTL_MINUTES + " min)");
        return true;
    }

    /**
     * Rollback any locks acquired during a failed multi-seat lock attempt.
     */
    private void rollbackLocks(Show show, List<String> lockedKeys) {
        for (String key : lockedKeys) {
            seatLockMap.remove(key);
            String seatId = extractSeatId(key);
            ShowSeat showSeat = show.getShowSeat(seatId);
            synchronized (showSeat) {
                showSeat.release();
            }
        }
        if (!lockedKeys.isEmpty()) {
            System.out.println("  Rolled back " + lockedKeys.size() + " locks");
        }
    }

    // ═══════════════════════════════════════════════════
    // 2. CONFIRM BOOKING
    // ═══════════════════════════════════════════════════

    /**
     * Confirms a booking after successful payment.
     * Validates that all seats are still locked by this user,
     * calculates total price, processes payment, and creates a Booking.
     *
     * @param user     the user
     * @param show     the show
     * @param seatIds  seat IDs previously locked
     * @param payment  the payment object (will be processed here)
     * @return         the confirmed Booking, or null if failed
     */
    public Booking confirmBooking(User user, Show show,
                                  List<String> seatIds, Payment payment) {

        // 1. Validate all locks still belong to this user
        for (String seatId : seatIds) {
            String lockKey = buildLockKey(show.getShowId(), seatId);
            SeatLock lock = seatLockMap.get(lockKey);

            if (lock == null || lock.isExpired() || !lock.isOwnedBy(user.getUserId())) {
                System.out.println("  FAILED: Lock expired or not owned for seat " + seatId);
                releaseAllLocks(user, show, seatIds);
                return null;
            }
        }

        // 2. Calculate total price using the pricing strategy
        List<Seat> seats = new ArrayList<>();
        double totalAmount = 0.0;
        for (String seatId : seatIds) {
            Seat seat = show.getShowSeat(seatId).getSeat();
            seats.add(seat);
            totalAmount += pricingStrategy.calculatePrice(seat, show);
        }

        // 3. Process payment
        // In a real system: payment.process() would call a gateway.
        // Here we use the pre-set status for demo control.
        if (!payment.isSuccessful()) {
            System.out.println("  FAILED: Payment declined");
            releaseAllLocks(user, show, seatIds);
            return null;
        }

        // 4. Create booking and mark seats as BOOKED
        Booking booking = new Booking(user, show, seats, totalAmount);
        booking.confirm(payment);

        for (String seatId : seatIds) {
            ShowSeat showSeat = show.getShowSeat(seatId);
            synchronized (showSeat) {
                showSeat.book();
            }
            // Remove from lock map -- seat is now permanently booked
            seatLockMap.remove(buildLockKey(show.getShowId(), seatId));
        }

        bookings.put(booking.getBookingId(), booking);

        // 5. Notify observers
        notificationService.notifyBookingConfirmed(booking);

        return booking;
    }

    // ═══════════════════════════════════════════════════
    // 3. CANCEL BOOKING
    // ═══════════════════════════════════════════════════

    /**
     * Cancels a confirmed booking. Releases all seats back to AVAILABLE.
     *
     * @param bookingId  the booking to cancel
     * @return           true if cancellation succeeded
     */
    public boolean cancelBooking(String bookingId) {
        Booking booking = bookings.get(bookingId);
        if (booking == null) {
            System.out.println("  Booking not found: " + bookingId);
            return false;
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            System.out.println("  Booking already cancelled: " + bookingId);
            return false;
        }

        // Transition state
        booking.cancel();

        // Release all seats
        Show show = booking.getShow();
        for (Seat seat : booking.getSeats()) {
            ShowSeat showSeat = show.getShowSeat(seat.getSeatId());
            synchronized (showSeat) {
                showSeat.release();
            }
        }

        // Notify observers
        notificationService.notifyBookingCancelled(booking);
        notificationService.notifySeatsReleased(show, booking.getSeats().size());

        System.out.println("  Booking cancelled: " + bookingId);
        return true;
    }

    // ═══════════════════════════════════════════════════
    // 4. RELEASE LOCKS (timeout / payment failure)
    // ═══════════════════════════════════════════════════

    /**
     * Explicitly release all locks held by a user for a show.
     */
    public void releaseAllLocks(User user, Show show, List<String> seatIds) {
        for (String seatId : seatIds) {
            String lockKey = buildLockKey(show.getShowId(), seatId);
            SeatLock lock = seatLockMap.get(lockKey);

            if (lock != null && lock.isOwnedBy(user.getUserId())) {
                seatLockMap.remove(lockKey);
                ShowSeat showSeat = show.getShowSeat(seatId);
                synchronized (showSeat) {
                    showSeat.release();
                }
            }
        }
        System.out.println("  Released locks for " + user.getName());
    }

    // ═══════════════════════════════════════════════════
    // 5. EXPIRED LOCK CLEANUP (background task)
    // ═══════════════════════════════════════════════════

    /**
     * Removes all expired locks from the map and resets ShowSeat status.
     * In production, this runs as a scheduled task every 30-60 seconds.
     */
    public int cleanExpiredLocks(List<Show> allShows) {
        int cleaned = 0;
        Iterator<Map.Entry<String, SeatLock>> it = seatLockMap.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<String, SeatLock> entry = it.next();
            if (entry.getValue().isExpired()) {
                it.remove();
                cleaned++;
                // Find the show and reset ShowSeat -- in production, index by showId
            }
        }
        return cleaned;
    }

    // ═══════════════════════════════════════════════════
    // 6. QUERY METHODS
    // ═══════════════════════════════════════════════════

    public List<ShowSeat> getAvailableSeats(Show show) {
        return show.getAvailableSeats();
    }

    public Booking getBooking(String bookingId) {
        return bookings.get(bookingId);
    }

    public int getActiveLockCount() {
        return (int) seatLockMap.values().stream().filter(l -> !l.isExpired()).count();
    }

    // ═══════════════════════════════════════════════════
    // UTILITY
    // ═══════════════════════════════════════════════════

    private String buildLockKey(String showId, String seatId) {
        return showId + ":" + seatId;
    }

    private String extractSeatId(String lockKey) {
        return lockKey.substring(lockKey.indexOf(':') + 1);
    }
}
```

---

## 10. Main -- Demo Booking Flow

This demo shows three scenarios:
1. **Successful booking** by User A
2. **Concurrent conflict** -- User B tries the same seat and gets rejected
3. **Timeout scenario** -- User C locks seats but does not pay in time

```java
// ──────────────────────────────────────────────────
// BookMyShowDemo.java
// ──────────────────────────────────────────────────
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

public class BookMyShowDemo {

    public static void main(String[] args) {

        System.out.println("╔══════════════════════════════════════════════╗");
        System.out.println("║     BookMyShow -- Movie Ticket Booking      ║");
        System.out.println("╚══════════════════════════════════════════════╝");
        System.out.println();

        // ── Setup: Create users ──
        User alice = new User("U1", "Alice", "alice@email.com", "+91-9876543210");
        User bob   = new User("U2", "Bob",   "bob@email.com",   "+91-9876543211");
        User carol = new User("U3", "Carol", "carol@email.com", "+91-9876543212");

        // ── Setup: Create movie ──
        Movie avengers = new Movie("M1", "Avengers: Endgame",
            "The epic conclusion to the Infinity Saga",
            Genre.ACTION, 181, 8.4);

        // ── Setup: Create theater and screen ──
        Theater pvr = new Theater("T1", "PVR Phoenix Mall", "Whitefield, Bangalore", City.BANGALORE);
        Screen screen1 = new Screen("SCR1", "Screen 1 - Dolby Atmos", pvr);
        pvr.addScreen(screen1);

        // ── Setup: Create seats using Factory ──
        // Row A: VIP (4 seats)
        for (int i = 1; i <= 4; i++) {
            screen1.addSeat(SeatFactory.createSeat("A" + i, SeatType.VIP, 200.0));
        }
        // Row B: Premium (6 seats)
        for (int i = 1; i <= 6; i++) {
            screen1.addSeat(SeatFactory.createSeat("B" + i, SeatType.PREMIUM, 200.0));
        }
        // Row C-D: Regular (8 seats each)
        for (char row = 'C'; row <= 'D'; row++) {
            for (int i = 1; i <= 8; i++) {
                screen1.addSeat(SeatFactory.createSeat("" + row + i, SeatType.REGULAR, 200.0));
            }
        }

        System.out.println("Theater: " + pvr);
        System.out.println("Screen: " + screen1);
        System.out.println("Total seats: " + screen1.getTotalCapacity());
        System.out.println();

        // ── Setup: Create a show ──
        LocalDateTime showStart = LocalDateTime.of(2026, 4, 11, 19, 0);  // Saturday evening
        LocalDateTime showEnd   = showStart.plusMinutes(avengers.getDurationMinutes());
        Show eveningShow = new Show("SH1", avengers, screen1, showStart, showEnd);

        System.out.println("Show: " + eveningShow);
        System.out.println();

        // ── Setup: Notification service with observers ──
        NotificationService notificationService = new NotificationService();
        notificationService.addObserver(new EmailNotifier());
        notificationService.addObserver(new SMSNotifier());

        // ── Setup: Booking service with weekend pricing ──
        PricingStrategy weekendPricing = new WeekendPricingStrategy();
        BookingService bookingService = new BookingService(weekendPricing, notificationService);

        System.out.println("Pricing strategy: " + weekendPricing);
        System.out.println();

        // ══════════════════════════════════════════════
        // SCENARIO 1: Alice books VIP seats successfully
        // ══════════════════════════════════════════════
        System.out.println("═══════════════════════════════════════════════");
        System.out.println("SCENARIO 1: Alice books VIP seats A1 and A2");
        System.out.println("═══════════════════════════════════════════════");

        // Show available seats
        List<ShowSeat> available = bookingService.getAvailableSeats(eveningShow);
        System.out.println("Available seats before: " + available.size());

        // Get seat IDs for A1, A2
        String seatA1 = findSeatId(screen1, "A1");
        String seatA2 = findSeatId(screen1, "A2");
        List<String> aliceSeats = Arrays.asList(seatA1, seatA2);

        // Step 1: Lock seats
        System.out.println("\n[Step 1] Alice locks seats A1, A2...");
        boolean lockSuccess = bookingService.lockSeats(alice, eveningShow, aliceSeats);
        System.out.println("Lock result: " + (lockSuccess ? "SUCCESS" : "FAILED"));

        // Step 2: Calculate price preview
        System.out.println("\n[Step 2] Price calculation (Weekend pricing):");
        for (String seatId : aliceSeats) {
            Seat seat = eveningShow.getShowSeat(seatId).getSeat();
            double price = weekendPricing.calculatePrice(seat, eveningShow);
            System.out.println("  " + seat.getSeatNumber() + " (" + seat.getSeatType()
                + "): base=$" + seat.getBasePrice()
                + " x " + seat.getPriceMultiplier() + " (type)"
                + " x 1.2 (weekend) = $" + price);
        }

        // Step 3: Process payment and confirm
        System.out.println("\n[Step 3] Alice pays...");
        Payment alicePayment = new Payment(1200.0, PaymentMethod.UPI);
        alicePayment.markSuccess();  // Force success for demo

        Booking aliceBooking = bookingService.confirmBooking(
            alice, eveningShow, aliceSeats, alicePayment);

        System.out.println("\nBooking result: " + aliceBooking);
        System.out.println("Available seats after: "
            + bookingService.getAvailableSeats(eveningShow).size());

        // ══════════════════════════════════════════════
        // SCENARIO 2: Bob tries to book the SAME seat A1
        // ══════════════════════════════════════════════
        System.out.println("\n═══════════════════════════════════════════════");
        System.out.println("SCENARIO 2: Bob tries to book seat A1 (already booked by Alice)");
        System.out.println("═══════════════════════════════════════════════");

        System.out.println("\n[Step 1] Bob tries to lock seat A1...");
        boolean bobLock = bookingService.lockSeats(bob, eveningShow, Arrays.asList(seatA1));
        System.out.println("Lock result: " + (bobLock ? "SUCCESS" : "FAILED -- seat unavailable!"));

        // Bob books different seats instead
        String seatA3 = findSeatId(screen1, "A3");
        String seatA4 = findSeatId(screen1, "A4");
        List<String> bobSeats = Arrays.asList(seatA3, seatA4);

        System.out.println("\n[Step 2] Bob locks seats A3, A4 instead...");
        boolean bobLock2 = bookingService.lockSeats(bob, eveningShow, bobSeats);
        System.out.println("Lock result: " + (bobLock2 ? "SUCCESS" : "FAILED"));

        System.out.println("\n[Step 3] Bob pays...");
        Payment bobPayment = new Payment(1200.0, PaymentMethod.CREDIT_CARD);
        bobPayment.markSuccess();

        Booking bobBooking = bookingService.confirmBooking(
            bob, eveningShow, bobSeats, bobPayment);
        System.out.println("\nBooking result: " + bobBooking);

        // ══════════════════════════════════════════════
        // SCENARIO 3: Carol locks seats but payment fails
        // ══════════════════════════════════════════════
        System.out.println("\n═══════════════════════════════════════════════");
        System.out.println("SCENARIO 3: Carol locks seats but payment fails");
        System.out.println("═══════════════════════════════════════════════");

        String seatB1 = findSeatId(screen1, "B1");
        String seatB2 = findSeatId(screen1, "B2");
        List<String> carolSeats = Arrays.asList(seatB1, seatB2);

        System.out.println("\n[Step 1] Carol locks Premium seats B1, B2...");
        boolean carolLock = bookingService.lockSeats(carol, eveningShow, carolSeats);
        System.out.println("Lock result: " + (carolLock ? "SUCCESS" : "FAILED"));
        System.out.println("Active locks: " + bookingService.getActiveLockCount());

        // Simulate payment failure
        System.out.println("\n[Step 2] Carol's payment fails...");
        Payment carolPayment = new Payment(720.0, PaymentMethod.DEBIT_CARD);
        carolPayment.markFailed();

        Booking carolBooking = bookingService.confirmBooking(
            carol, eveningShow, carolSeats, carolPayment);
        System.out.println("Booking result: " + (carolBooking != null ? carolBooking : "null (payment failed)"));

        // Seats should be available again
        ShowSeat b1Status = eveningShow.getShowSeat(seatB1);
        ShowSeat b2Status = eveningShow.getShowSeat(seatB2);
        System.out.println("Seat B1 status after failure: " + b1Status.getStatus());
        System.out.println("Seat B2 status after failure: " + b2Status.getStatus());

        // ══════════════════════════════════════════════
        // SCENARIO 4: Alice cancels her booking
        // ══════════════════════════════════════════════
        System.out.println("\n═══════════════════════════════════════════════");
        System.out.println("SCENARIO 4: Alice cancels her booking");
        System.out.println("═══════════════════════════════════════════════");

        System.out.println("\nAlice's booking status: " + aliceBooking.getStatus());
        System.out.println("Cancelling...");
        bookingService.cancelBooking(aliceBooking.getBookingId());
        System.out.println("Alice's booking status after cancel: " + aliceBooking.getStatus());

        // Seats A1, A2 should be available again
        ShowSeat a1Status = eveningShow.getShowSeat(seatA1);
        ShowSeat a2Status = eveningShow.getShowSeat(seatA2);
        System.out.println("Seat A1 status: " + a1Status.getStatus());
        System.out.println("Seat A2 status: " + a2Status.getStatus());

        // ══════════════════════════════════════════════
        // SCENARIO 5: Switch to Premium Pricing
        // ══════════════════════════════════════════════
        System.out.println("\n═══════════════════════════════════════════════");
        System.out.println("SCENARIO 5: Premium pricing for holiday show");
        System.out.println("═══════════════════════════════════════════════");

        PricingStrategy premiumPricing = new PremiumPricingStrategy();
        bookingService.setPricingStrategy(premiumPricing);
        System.out.println("Switched to: " + premiumPricing);

        // Carol rebooks with premium pricing
        System.out.println("\n[Step 1] Carol locks B1, B2 again...");
        boolean carolLock2 = bookingService.lockSeats(carol, eveningShow, carolSeats);
        System.out.println("Lock result: " + (carolLock2 ? "SUCCESS" : "FAILED"));

        System.out.println("\n[Step 2] Price with Premium pricing:");
        for (String seatId : carolSeats) {
            Seat seat = eveningShow.getShowSeat(seatId).getSeat();
            double price = premiumPricing.calculatePrice(seat, eveningShow);
            System.out.println("  " + seat.getSeatNumber() + " (" + seat.getSeatType()
                + "): $" + seat.getEffectivePrice() + " x 1.5 (premium) = $" + price);
        }

        Payment carolPayment2 = new Payment(900.0, PaymentMethod.UPI);
        carolPayment2.markSuccess();
        Booking carolBooking2 = bookingService.confirmBooking(
            carol, eveningShow, carolSeats, carolPayment2);
        System.out.println("\nBooking result: " + carolBooking2);

        // ══════════════════════════════════════════════
        // SCENARIO 6: Concurrent booking simulation
        // ══════════════════════════════════════════════
        System.out.println("\n═══════════════════════════════════════════════");
        System.out.println("SCENARIO 6: Concurrent booking (two threads)");
        System.out.println("═══════════════════════════════════════════════");

        String seatC1 = findSeatId(screen1, "C1");
        simulateConcurrentBooking(bookingService, eveningShow,
            alice, bob, seatC1);

        // ══════════════════════════════════════════════
        // FINAL SUMMARY
        // ══════════════════════════════════════════════
        System.out.println("\n═══════════════════════════════════════════════");
        System.out.println("FINAL SEAT MAP");
        System.out.println("═══════════════════════════════════════════════");
        printSeatMap(eveningShow);

        System.out.println("\nAvailable: "
            + bookingService.getAvailableSeats(eveningShow).size()
            + " / " + screen1.getTotalCapacity());
        System.out.println("Active locks: " + bookingService.getActiveLockCount());
    }

    // ══════════════════════════════════════════════
    // Helper: Concurrent booking simulation
    // ══════════════════════════════════════════════

    private static void simulateConcurrentBooking(
            BookingService service, Show show,
            User user1, User user2, String seatId) {

        System.out.println("\nTwo users race for seat "
            + show.getShowSeat(seatId).getSeat().getSeatNumber() + "...\n");

        // Use regular pricing for this demo
        service.setPricingStrategy(new RegularPricingStrategy());

        Thread thread1 = new Thread(() -> {
            System.out.println("  [Thread-1 " + user1.getName() + "] Attempting lock...");
            boolean locked = service.lockSeats(user1, show, Arrays.asList(seatId));
            if (locked) {
                System.out.println("  [Thread-1 " + user1.getName() + "] GOT the lock!");
                Payment p = new Payment(200.0, PaymentMethod.UPI);
                p.markSuccess();
                Booking b = service.confirmBooking(user1, show,
                    Arrays.asList(seatId), p);
                System.out.println("  [Thread-1 " + user1.getName() + "] Booked: " + b);
            } else {
                System.out.println("  [Thread-1 " + user1.getName() + "] LOST the race.");
            }
        }, "Booker-" + user1.getName());

        Thread thread2 = new Thread(() -> {
            System.out.println("  [Thread-2 " + user2.getName() + "] Attempting lock...");
            boolean locked = service.lockSeats(user2, show, Arrays.asList(seatId));
            if (locked) {
                System.out.println("  [Thread-2 " + user2.getName() + "] GOT the lock!");
                Payment p = new Payment(200.0, PaymentMethod.CREDIT_CARD);
                p.markSuccess();
                Booking b = service.confirmBooking(user2, show,
                    Arrays.asList(seatId), p);
                System.out.println("  [Thread-2 " + user2.getName() + "] Booked: " + b);
            } else {
                System.out.println("  [Thread-2 " + user2.getName() + "] LOST the race.");
            }
        }, "Booker-" + user2.getName());

        thread1.start();
        thread2.start();

        try {
            thread1.join();
            thread2.join();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        System.out.println("\n  Seat C1 final status: "
            + show.getShowSeat(seatId).getStatus());
    }

    // ══════════════════════════════════════════════
    // Helper: Find seat ID by seat number
    // ══════════════════════════════════════════════

    private static String findSeatId(Screen screen, String seatNumber) {
        return screen.getSeats().stream()
            .filter(s -> s.getSeatNumber().equals(seatNumber))
            .findFirst()
            .orElseThrow(() -> new RuntimeException("Seat not found: " + seatNumber))
            .getSeatId();
    }

    // ══════════════════════════════════════════════
    // Helper: Print seat map
    // ══════════════════════════════════════════════

    private static void printSeatMap(Show show) {
        System.out.println();
        System.out.println("                  [ SCREEN ]");
        System.out.println("  ──────────────────────────────────────");

        String currentRow = "";
        for (ShowSeat ss : show.getAllShowSeats()) {
            String seatNum = ss.getSeat().getSeatNumber();
            String row = seatNum.substring(0, 1);

            if (!row.equals(currentRow)) {
                if (!currentRow.isEmpty()) System.out.println();
                currentRow = row;
                System.out.printf("  %s: ", row);
            }

            String symbol;
            switch (ss.getStatus()) {
                case AVAILABLE: symbol = "[ ]"; break;
                case LOCKED:    symbol = "[L]"; break;
                case BOOKED:    symbol = "[X]"; break;
                default:        symbol = "[?]"; break;
            }
            System.out.print(symbol + " ");
        }
        System.out.println();
        System.out.println();
        System.out.println("  Legend: [ ] = Available, [L] = Locked, [X] = Booked");
    }
}
```

---

## Expected Output

```
╔══════════════════════════════════════════════╗
║     BookMyShow -- Movie Ticket Booking      ║
╚══════════════════════════════════════════════╝

Theater: Theater{PVR Phoenix Mall, BANGALORE}
Screen: Screen{Screen 1 - Dolby Atmos, capacity=26}
Total seats: 26

Show: Show{Avengers: Endgame @ Screen 1 - Dolby Atmos 2026-04-11T19:00, available=26/26}

Pricing strategy: WeekendPricing (1.2x on Sat/Sun)

═══════════════════════════════════════════════
SCENARIO 1: Alice books VIP seats A1 and A2
═══════════════════════════════════════════════
Available seats before: 26

[Step 1] Alice locks seats A1, A2...
  Locked 2 seats for Alice (expires in 5 min)
Lock result: SUCCESS

[Step 2] Price calculation (Weekend pricing):
  A1 (VIP): base=$200.0 x 2.5 (type) x 1.2 (weekend) = $600.0
  A2 (VIP): base=$200.0 x 2.5 (type) x 1.2 (weekend) = $600.0

[Step 3] Alice pays...
  [EMAIL] Sending confirmation to alice@email.com | Booking: BK-xxxx | Movie: Avengers: Endgame | Amount: $1200.0
  [SMS] Ticket confirmed for +91-9876543210 | BK-xxxx

Booking result: Booking{BK-xxxx, user=Alice, movie=Avengers: Endgame, seats=2, amount=1200.0, status=CONFIRMED}
Available seats after: 24

═══════════════════════════════════════════════
SCENARIO 2: Bob tries to book seat A1 (already booked by Alice)
═══════════════════════════════════════════════

[Step 1] Bob tries to lock seat A1...
Lock result: FAILED -- seat unavailable!

[Step 2] Bob locks seats A3, A4 instead...
  Locked 2 seats for Bob (expires in 5 min)
Lock result: SUCCESS

[Step 3] Bob pays...
  [EMAIL] Sending confirmation to bob@email.com | ...
  [SMS] Ticket confirmed for +91-9876543211 | ...

Booking result: Booking{BK-xxxx, user=Bob, movie=Avengers: Endgame, seats=2, amount=1200.0, status=CONFIRMED}

═══════════════════════════════════════════════
SCENARIO 3: Carol locks seats but payment fails
═══════════════════════════════════════════════

[Step 1] Carol locks Premium seats B1, B2...
  Locked 2 seats for Carol (expires in 5 min)
Lock result: SUCCESS
Active locks: 2

[Step 2] Carol's payment fails...
  FAILED: Payment declined
  Released locks for Carol
Booking result: null (payment failed)
Seat B1 status after failure: AVAILABLE
Seat B2 status after failure: AVAILABLE

═══════════════════════════════════════════════
SCENARIO 4: Alice cancels her booking
═══════════════════════════════════════════════

Alice's booking status: CONFIRMED
Cancelling...
  [EMAIL] Sending cancellation notice to alice@email.com | ...
  [SMS] Booking cancelled for +91-9876543210 | ...
  [EMAIL] 2 seats now available for Avengers: Endgame at 2026-04-11T19:00
  [SMS] 2 seats freed for Avengers: Endgame
  Booking cancelled: BK-xxxx
Alice's booking status after cancel: CANCELLED
Seat A1 status: AVAILABLE
Seat A2 status: AVAILABLE

═══════════════════════════════════════════════
SCENARIO 5: Premium pricing for holiday show
═══════════════════════════════════════════════
Switched to: PremiumPricing (1.5x always)

[Step 1] Carol locks B1, B2 again...
  Locked 2 seats for Carol (expires in 5 min)
Lock result: SUCCESS

[Step 2] Price with Premium pricing:
  B1 (PREMIUM): $300.0 x 1.5 (premium) = $450.0
  B2 (PREMIUM): $300.0 x 1.5 (premium) = $450.0

  [EMAIL] Sending confirmation to carol@email.com | ...
  [SMS] Ticket confirmed for +91-9876543212 | ...

Booking result: Booking{BK-xxxx, user=Carol, movie=Avengers: Endgame, seats=2, amount=900.0, status=CONFIRMED}

═══════════════════════════════════════════════
SCENARIO 6: Concurrent booking (two threads)
═══════════════════════════════════════════════

Two users race for seat C1...

  [Thread-1 Alice] Attempting lock...
  [Thread-2 Bob] Attempting lock...
  [Thread-1 Alice] GOT the lock!
  [Thread-2 Bob] LOST the race.
  [Thread-1 Alice] Booked: Booking{BK-xxxx, ...}

  Seat C1 final status: BOOKED

═══════════════════════════════════════════════
FINAL SEAT MAP
═══════════════════════════════════════════════

                  [ SCREEN ]
  ──────────────────────────────────────
  A: [ ] [ ] [X] [X]
  B: [X] [X] [ ] [ ] [ ] [ ]
  C: [X] [ ] [ ] [ ] [ ] [ ] [ ] [ ]
  D: [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ]

  Legend: [ ] = Available, [L] = Locked, [X] = Booked
```

---

## Key Takeaways

| Concept | Implementation Detail |
|---------|----------------------|
| **Concurrent seat lock** | `ConcurrentHashMap.putIfAbsent()` -- atomic, one winner |
| **Lock TTL** | `SeatLock.expiryTime` checked via `isExpired()` |
| **All-or-nothing** | If any seat in a multi-seat request fails, rollback all |
| **State machine** | `Booking.confirm()` and `cancel()` enforce valid transitions |
| **Strategy swap** | `setPricingStrategy()` changes pricing at runtime |
| **Observer notify** | `NotificationService` fans out to Email + SMS observers |
| **Factory creation** | `SeatFactory.createSeat()` returns correct subclass |
| **Thread safety** | `synchronized(showSeat)` for individual seat state changes |
