# Hotel Booking System -- Complete Java Implementation

## Table of Contents

1. [DateRange](#1-daterange)
2. [RoomType Enum](#2-roomtype-enum)
3. [Room Hierarchy](#3-room-hierarchy)
4. [RoomFactory](#4-roomfactory)
5. [Guest](#5-guest)
6. [ReservationState Interface + Implementations](#6-reservationstate-interface--implementations)
7. [Reservation](#7-reservation)
8. [Payment](#8-payment)
9. [PricingStrategy Interface + Implementations](#9-pricingstrategy-interface--implementations)
10. [CancellationPolicy](#10-cancellationpolicy)
11. [BookingObserver + EmailNotificationObserver](#11-bookingobserver--emailnotificationobserver)
12. [Hotel](#12-hotel)
13. [BookingService](#13-bookingservice)
14. [Main -- Demo](#14-main----demo)

---

## 1. DateRange

```java
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public class DateRange {
    private final LocalDate checkIn;
    private final LocalDate checkOut;

    public DateRange(LocalDate checkIn, LocalDate checkOut) {
        if (checkIn == null || checkOut == null) {
            throw new IllegalArgumentException("Dates must not be null");
        }
        if (!checkOut.isAfter(checkIn)) {
            throw new IllegalArgumentException(
                "Check-out date must be after check-in date");
        }
        this.checkIn = checkIn;
        this.checkOut = checkOut;
    }

    /**
     * Half-open interval overlap: [A.checkIn, A.checkOut) overlaps
     * [B.checkIn, B.checkOut) iff A.checkIn < B.checkOut AND B.checkIn < A.checkOut.
     *
     * This means a guest checking out on Jan 8 does NOT conflict with
     * a new guest checking in on Jan 8.
     */
    public boolean overlaps(DateRange other) {
        return this.checkIn.isBefore(other.checkOut)
            && other.checkIn.isBefore(this.checkOut);
    }

    public int getNightCount() {
        return (int) ChronoUnit.DAYS.between(checkIn, checkOut);
    }

    public LocalDate getCheckIn() { return checkIn; }
    public LocalDate getCheckOut() { return checkOut; }

    @Override
    public String toString() {
        return checkIn + " to " + checkOut + " (" + getNightCount() + " nights)";
    }
}
```

---

## 2. RoomType Enum

```java
public enum RoomType {
    SINGLE,
    DOUBLE,
    SUITE
}
```

---

## 3. Room Hierarchy

```java
public abstract class Room {
    protected final String roomId;
    protected final int roomNumber;
    protected final RoomType roomType;
    protected final int basePricePerNight; // in cents

    protected Room(String roomId, int roomNumber, RoomType roomType,
                   int basePricePerNight) {
        this.roomId = roomId;
        this.roomNumber = roomNumber;
        this.roomType = roomType;
        this.basePricePerNight = basePricePerNight;
    }

    public String getRoomId() { return roomId; }
    public int getRoomNumber() { return roomNumber; }
    public RoomType getRoomType() { return roomType; }
    public int getBasePricePerNight() { return basePricePerNight; }

    public abstract int getCapacity();
    public abstract String getDescription();

    @Override
    public String toString() {
        return String.format("Room %d (%s) - $%.2f/night - %s",
            roomNumber, roomType, basePricePerNight / 100.0, getDescription());
    }
}

// ---------------------------------------------------------------------------

public class SingleRoom extends Room {

    public SingleRoom(String roomId, int roomNumber, int basePricePerNight) {
        super(roomId, roomNumber, RoomType.SINGLE, basePricePerNight);
    }

    @Override
    public int getCapacity() { return 1; }

    @Override
    public String getDescription() {
        return "Single room with one bed, ideal for solo travellers";
    }
}

// ---------------------------------------------------------------------------

public class DoubleRoom extends Room {

    public DoubleRoom(String roomId, int roomNumber, int basePricePerNight) {
        super(roomId, roomNumber, RoomType.DOUBLE, basePricePerNight);
    }

    @Override
    public int getCapacity() { return 2; }

    @Override
    public String getDescription() {
        return "Double room with two beds, suitable for couples or friends";
    }
}

// ---------------------------------------------------------------------------

public class SuiteRoom extends Room {

    public SuiteRoom(String roomId, int roomNumber, int basePricePerNight) {
        super(roomId, roomNumber, RoomType.SUITE, basePricePerNight);
    }

    @Override
    public int getCapacity() { return 4; }

    @Override
    public String getDescription() {
        return "Luxury suite with separate living area, minibar, and premium amenities";
    }
}
```

---

## 4. RoomFactory

```java
import java.util.UUID;

public class RoomFactory {

    public static Room createRoom(int roomNumber, RoomType type,
                                  int basePricePerNight) {
        String roomId = UUID.randomUUID().toString().substring(0, 8);

        switch (type) {
            case SINGLE:
                return new SingleRoom(roomId, roomNumber, basePricePerNight);
            case DOUBLE:
                return new DoubleRoom(roomId, roomNumber, basePricePerNight);
            case SUITE:
                return new SuiteRoom(roomId, roomNumber, basePricePerNight);
            default:
                throw new IllegalArgumentException("Unknown room type: " + type);
        }
    }
}
```

---

## 5. Guest

```java
public class Guest {
    private final String guestId;
    private final String name;
    private final String email;
    private final String phone;

    public Guest(String guestId, String name, String email, String phone) {
        this.guestId = guestId;
        this.name = name;
        this.email = email;
        this.phone = phone;
    }

    public String getGuestId() { return guestId; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }

    @Override
    public String toString() {
        return name + " (" + email + ")";
    }
}
```

---

## 6. ReservationState Interface + Implementations

```java
// ---- Interface ----

public interface ReservationState {
    void confirm(Reservation reservation);
    void checkIn(Reservation reservation);
    void checkOut(Reservation reservation);
    void cancel(Reservation reservation);
    String getStateName();
}

// ---- RequestedState ----

public class RequestedState implements ReservationState {

    @Override
    public void confirm(Reservation reservation) {
        System.out.println("[Reservation " + reservation.getReservationId()
            + "] Payment processed. Reservation confirmed.");
        reservation.setState(new ConfirmedState());
    }

    @Override
    public void checkIn(Reservation reservation) {
        System.out.println("[Reservation " + reservation.getReservationId()
            + "] Cannot check in. Reservation is not yet confirmed.");
    }

    @Override
    public void checkOut(Reservation reservation) {
        System.out.println("[Reservation " + reservation.getReservationId()
            + "] Cannot check out. Guest has not checked in.");
    }

    @Override
    public void cancel(Reservation reservation) {
        System.out.println("[Reservation " + reservation.getReservationId()
            + "] Reservation request cancelled. Full refund issued.");
        reservation.setState(new CancelledState());
    }

    @Override
    public String getStateName() { return "REQUESTED"; }
}

// ---- ConfirmedState ----

import java.time.LocalDate;

public class ConfirmedState implements ReservationState {

    @Override
    public void confirm(Reservation reservation) {
        System.out.println("[Reservation " + reservation.getReservationId()
            + "] Reservation is already confirmed.");
    }

    @Override
    public void checkIn(Reservation reservation) {
        LocalDate today = LocalDate.now();
        LocalDate checkInDate = reservation.getDateRange().getCheckIn();

        if (today.isBefore(checkInDate)) {
            System.out.println("[Reservation " + reservation.getReservationId()
                + "] Cannot check in yet. Check-in date is " + checkInDate
                + ". Today is " + today + ".");
            return;
        }

        System.out.println("[Reservation " + reservation.getReservationId()
            + "] Guest " + reservation.getGuest().getName()
            + " checked into Room " + reservation.getRoom().getRoomNumber()
            + ".");
        reservation.setState(new CheckedInState());
    }

    @Override
    public void checkOut(Reservation reservation) {
        System.out.println("[Reservation " + reservation.getReservationId()
            + "] Cannot check out. Guest has not checked in yet.");
    }

    @Override
    public void cancel(Reservation reservation) {
        System.out.println("[Reservation " + reservation.getReservationId()
            + "] Confirmed reservation cancelled.");
        reservation.setState(new CancelledState());
    }

    @Override
    public String getStateName() { return "CONFIRMED"; }
}

// ---- CheckedInState ----

public class CheckedInState implements ReservationState {

    @Override
    public void confirm(Reservation reservation) {
        System.out.println("[Reservation " + reservation.getReservationId()
            + "] Guest is already checked in. Cannot confirm again.");
    }

    @Override
    public void checkIn(Reservation reservation) {
        System.out.println("[Reservation " + reservation.getReservationId()
            + "] Guest is already checked in.");
    }

    @Override
    public void checkOut(Reservation reservation) {
        System.out.println("[Reservation " + reservation.getReservationId()
            + "] Guest " + reservation.getGuest().getName()
            + " checked out of Room " + reservation.getRoom().getRoomNumber()
            + ". Thank you for staying with us!");
        reservation.setState(new CheckedOutState());
    }

    @Override
    public void cancel(Reservation reservation) {
        System.out.println("[Reservation " + reservation.getReservationId()
            + "] Cannot cancel. Guest has already checked in.");
    }

    @Override
    public String getStateName() { return "CHECKED_IN"; }
}

// ---- CheckedOutState ----

public class CheckedOutState implements ReservationState {

    @Override
    public void confirm(Reservation reservation) {
        System.out.println("[Reservation " + reservation.getReservationId()
            + "] Reservation is complete. No further actions allowed.");
    }

    @Override
    public void checkIn(Reservation reservation) {
        System.out.println("[Reservation " + reservation.getReservationId()
            + "] Reservation is complete. No further actions allowed.");
    }

    @Override
    public void checkOut(Reservation reservation) {
        System.out.println("[Reservation " + reservation.getReservationId()
            + "] Guest has already checked out.");
    }

    @Override
    public void cancel(Reservation reservation) {
        System.out.println("[Reservation " + reservation.getReservationId()
            + "] Reservation is complete. No further actions allowed.");
    }

    @Override
    public String getStateName() { return "CHECKED_OUT"; }
}

// ---- CancelledState ----

public class CancelledState implements ReservationState {

    @Override
    public void confirm(Reservation reservation) {
        System.out.println("[Reservation " + reservation.getReservationId()
            + "] Reservation is cancelled. No further actions allowed.");
    }

    @Override
    public void checkIn(Reservation reservation) {
        System.out.println("[Reservation " + reservation.getReservationId()
            + "] Reservation is cancelled. No further actions allowed.");
    }

    @Override
    public void checkOut(Reservation reservation) {
        System.out.println("[Reservation " + reservation.getReservationId()
            + "] Reservation is cancelled. No further actions allowed.");
    }

    @Override
    public void cancel(Reservation reservation) {
        System.out.println("[Reservation " + reservation.getReservationId()
            + "] Reservation is already cancelled.");
    }

    @Override
    public String getStateName() { return "CANCELLED"; }
}
```

---

## 7. Reservation

```java
import java.time.LocalDateTime;
import java.util.UUID;

public class Reservation {
    private final String reservationId;
    private final Guest guest;
    private final Room room;
    private final DateRange dateRange;
    private final int totalPrice; // in cents
    private final LocalDateTime createdAt;
    private ReservationState state;

    public Reservation(Guest guest, Room room, DateRange dateRange,
                       int totalPrice) {
        this.reservationId = "RES-" + UUID.randomUUID().toString()
                                          .substring(0, 8).toUpperCase();
        this.guest = guest;
        this.room = room;
        this.dateRange = dateRange;
        this.totalPrice = totalPrice;
        this.createdAt = LocalDateTime.now();
        this.state = new RequestedState(); // initial state
    }

    // --- State-delegated actions ---

    public void confirm() {
        state.confirm(this);
    }

    public void checkIn() {
        state.checkIn(this);
    }

    public void checkOut() {
        state.checkOut(this);
    }

    public void cancel() {
        state.cancel(this);
    }

    // --- State management ---

    public void setState(ReservationState newState) {
        System.out.println("  [State Transition] " + state.getStateName()
            + " -> " + newState.getStateName());
        this.state = newState;
    }

    public ReservationState getState() { return state; }
    public String getStateName() { return state.getStateName(); }

    // --- Getters ---

    public String getReservationId() { return reservationId; }
    public Guest getGuest() { return guest; }
    public Room getRoom() { return room; }
    public DateRange getDateRange() { return dateRange; }
    public int getTotalPrice() { return totalPrice; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public boolean isActive() {
        String name = state.getStateName();
        return name.equals("REQUESTED") || name.equals("CONFIRMED")
            || name.equals("CHECKED_IN");
    }

    @Override
    public String toString() {
        return String.format("Reservation[%s] %s | Room %d | %s | $%.2f | %s",
            reservationId, guest.getName(), room.getRoomNumber(),
            dateRange, totalPrice / 100.0, state.getStateName());
    }
}
```

---

## 8. Payment

```java
import java.time.LocalDateTime;
import java.util.UUID;

public enum PaymentType {
    CHARGE,
    REFUND
}

// ---------------------------------------------------------------------------

public class Payment {
    private final String paymentId;
    private final String reservationId;
    private final int amount; // in cents
    private final PaymentType type;
    private final LocalDateTime timestamp;

    public Payment(String reservationId, int amount, PaymentType type) {
        this.paymentId = "PAY-" + UUID.randomUUID().toString()
                                      .substring(0, 8).toUpperCase();
        this.reservationId = reservationId;
        this.amount = amount;
        this.type = type;
        this.timestamp = LocalDateTime.now();
    }

    public String getPaymentId() { return paymentId; }
    public String getReservationId() { return reservationId; }
    public int getAmount() { return amount; }
    public PaymentType getType() { return type; }
    public LocalDateTime getTimestamp() { return timestamp; }

    @Override
    public String toString() {
        return String.format("Payment[%s] %s $%.2f for reservation %s at %s",
            paymentId, type, amount / 100.0, reservationId, timestamp);
    }
}
```

---

## 9. PricingStrategy Interface + Implementations

```java
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.Month;
import java.util.Map;

// ---- Interface ----

public interface PricingStrategy {
    /**
     * Calculate the total price in cents for a room over a date range.
     */
    int calculatePrice(Room room, DateRange dateRange);
}

// ---- WeekdayPricingStrategy (flat rate) ----

public class WeekdayPricingStrategy implements PricingStrategy {

    @Override
    public int calculatePrice(Room room, DateRange dateRange) {
        return room.getBasePricePerNight() * dateRange.getNightCount();
    }

    @Override
    public String toString() { return "WeekdayPricing (flat rate)"; }
}

// ---- WeekendPricingStrategy ----

public class WeekendPricingStrategy implements PricingStrategy {
    private final double weekendMultiplier;

    public WeekendPricingStrategy(double weekendMultiplier) {
        this.weekendMultiplier = weekendMultiplier;
    }

    @Override
    public int calculatePrice(Room room, DateRange dateRange) {
        int total = 0;
        int basePrice = room.getBasePricePerNight();
        LocalDate current = dateRange.getCheckIn();

        while (current.isBefore(dateRange.getCheckOut())) {
            DayOfWeek day = current.getDayOfWeek();
            if (day == DayOfWeek.FRIDAY || day == DayOfWeek.SATURDAY) {
                total += (int) (basePrice * weekendMultiplier);
            } else {
                total += basePrice;
            }
            current = current.plusDays(1);
        }
        return total;
    }

    @Override
    public String toString() {
        return "WeekendPricing (" + weekendMultiplier + "x on Fri/Sat)";
    }
}

// ---- SeasonalPricingStrategy ----

public class SeasonalPricingStrategy implements PricingStrategy {
    private final Map<Month, Double> seasonMultipliers;

    public SeasonalPricingStrategy(Map<Month, Double> seasonMultipliers) {
        this.seasonMultipliers = seasonMultipliers;
    }

    @Override
    public int calculatePrice(Room room, DateRange dateRange) {
        int total = 0;
        int basePrice = room.getBasePricePerNight();
        LocalDate current = dateRange.getCheckIn();

        while (current.isBefore(dateRange.getCheckOut())) {
            double multiplier = seasonMultipliers
                .getOrDefault(current.getMonth(), 1.0);
            total += (int) (basePrice * multiplier);
            current = current.plusDays(1);
        }
        return total;
    }

    @Override
    public String toString() { return "SeasonalPricing"; }
}

// ---- DynamicPricingStrategy ----

public class DynamicPricingStrategy implements PricingStrategy {
    private final Hotel hotel;
    private final double highOccupancyThreshold; // e.g. 0.8 = 80%
    private final double surgeMultiplier;        // e.g. 1.5

    public DynamicPricingStrategy(Hotel hotel,
                                  double highOccupancyThreshold,
                                  double surgeMultiplier) {
        this.hotel = hotel;
        this.highOccupancyThreshold = highOccupancyThreshold;
        this.surgeMultiplier = surgeMultiplier;
    }

    @Override
    public int calculatePrice(Room room, DateRange dateRange) {
        int total = 0;
        int basePrice = room.getBasePricePerNight();
        int totalRooms = hotel.getRooms().size();

        LocalDate current = dateRange.getCheckIn();
        while (current.isBefore(dateRange.getCheckOut())) {
            // Count how many rooms are booked for this specific night
            final LocalDate nightOf = current;
            DateRange singleNight = new DateRange(nightOf, nightOf.plusDays(1));

            long bookedCount = hotel.getReservations().stream()
                .filter(Reservation::isActive)
                .filter(r -> r.getDateRange().overlaps(singleNight))
                .map(r -> r.getRoom().getRoomId())
                .distinct()
                .count();

            double occupancy = (double) bookedCount / totalRooms;
            if (occupancy >= highOccupancyThreshold) {
                total += (int) (basePrice * surgeMultiplier);
            } else {
                total += basePrice;
            }
            current = current.plusDays(1);
        }
        return total;
    }

    @Override
    public String toString() {
        return String.format("DynamicPricing (surge %.1fx above %.0f%% occupancy)",
            surgeMultiplier, highOccupancyThreshold * 100);
    }
}
```

---

## 10. CancellationPolicy

```java
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

public class CancellationPolicy {

    /**
     * Calculate refund amount based on how far in advance the cancellation is.
     *
     * Policy:
     *   > 48 hours before check-in  ->  100% refund
     *   24-48 hours before check-in ->   50% refund
     *   < 24 hours before check-in  ->    0% refund
     *
     * @return refund amount in cents
     */
    public static int calculateRefund(Reservation reservation) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime checkInDateTime = reservation.getDateRange()
            .getCheckIn().atStartOfDay();

        long hoursUntilCheckIn = ChronoUnit.HOURS.between(now, checkInDateTime);

        int totalPrice = reservation.getTotalPrice();

        if (hoursUntilCheckIn > 48) {
            System.out.println("  [Cancellation Policy] " + hoursUntilCheckIn
                + " hours until check-in (>48h) -> 100% refund");
            return totalPrice;
        } else if (hoursUntilCheckIn >= 24) {
            System.out.println("  [Cancellation Policy] " + hoursUntilCheckIn
                + " hours until check-in (24-48h) -> 50% refund");
            return totalPrice / 2;
        } else {
            System.out.println("  [Cancellation Policy] " + hoursUntilCheckIn
                + " hours until check-in (<24h) -> 0% refund");
            return 0;
        }
    }

    /**
     * Overload that accepts explicit "now" for testability and demo purposes.
     */
    public static int calculateRefund(Reservation reservation,
                                      LocalDateTime simulatedNow) {
        LocalDateTime checkInDateTime = reservation.getDateRange()
            .getCheckIn().atStartOfDay();

        long hoursUntilCheckIn = ChronoUnit.HOURS
            .between(simulatedNow, checkInDateTime);

        int totalPrice = reservation.getTotalPrice();

        if (hoursUntilCheckIn > 48) {
            System.out.println("  [Cancellation Policy] " + hoursUntilCheckIn
                + " hours until check-in (>48h) -> 100% refund");
            return totalPrice;
        } else if (hoursUntilCheckIn >= 24) {
            System.out.println("  [Cancellation Policy] " + hoursUntilCheckIn
                + " hours until check-in (24-48h) -> 50% refund");
            return totalPrice / 2;
        } else {
            System.out.println("  [Cancellation Policy] " + hoursUntilCheckIn
                + " hours until check-in (<24h) -> 0% refund");
            return 0;
        }
    }
}
```

---

## 11. BookingObserver + EmailNotificationObserver

```java
// ---- Observer Interface ----

public interface BookingObserver {
    void onReservationCreated(Reservation reservation);
    void onReservationCancelled(Reservation reservation, int refundAmount);
    void onGuestCheckedIn(Reservation reservation);
    void onGuestCheckedOut(Reservation reservation);
}

// ---- EmailNotificationObserver ----

public class EmailNotificationObserver implements BookingObserver {

    @Override
    public void onReservationCreated(Reservation reservation) {
        System.out.println("  [EMAIL -> " + reservation.getGuest().getEmail()
            + "] Booking confirmation for " + reservation.getReservationId()
            + ". Room " + reservation.getRoom().getRoomNumber()
            + ", " + reservation.getDateRange()
            + ". Total: $" + String.format("%.2f",
                reservation.getTotalPrice() / 100.0));
    }

    @Override
    public void onReservationCancelled(Reservation reservation,
                                       int refundAmount) {
        System.out.println("  [EMAIL -> " + reservation.getGuest().getEmail()
            + "] Reservation " + reservation.getReservationId()
            + " has been cancelled. Refund: $"
            + String.format("%.2f", refundAmount / 100.0));
    }

    @Override
    public void onGuestCheckedIn(Reservation reservation) {
        System.out.println("  [EMAIL -> " + reservation.getGuest().getEmail()
            + "] Welcome! You have checked into Room "
            + reservation.getRoom().getRoomNumber() + ". Enjoy your stay!");
    }

    @Override
    public void onGuestCheckedOut(Reservation reservation) {
        System.out.println("  [EMAIL -> " + reservation.getGuest().getEmail()
            + "] Thank you for staying with us! Reservation "
            + reservation.getReservationId() + " is now complete.");
    }
}
```

---

## 12. Hotel

```java
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class Hotel {
    private final String hotelId;
    private final String name;
    private final List<Room> rooms;
    private final List<Reservation> reservations;

    public Hotel(String hotelId, String name) {
        this.hotelId = hotelId;
        this.name = name;
        this.rooms = new ArrayList<>();
        this.reservations = new ArrayList<>();
    }

    public void addRoom(Room room) {
        rooms.add(room);
    }

    /**
     * Search for rooms that are:
     *   1. Available (no overlapping active reservation) for the date range
     *   2. Of the specified type (or any type if null)
     *   3. At or below the max price per night (or any price if maxPrice <= 0)
     */
    public List<Room> searchAvailableRooms(DateRange dateRange,
                                           RoomType type,
                                           int maxPricePerNight) {
        return rooms.stream()
            .filter(room -> type == null || room.getRoomType() == type)
            .filter(room -> maxPricePerNight <= 0
                         || room.getBasePricePerNight() <= maxPricePerNight)
            .filter(room -> isRoomAvailable(room, dateRange))
            .collect(Collectors.toList());
    }

    /**
     * Check if a room has no overlapping active reservations for the
     * given date range. An "active" reservation is one in REQUESTED,
     * CONFIRMED, or CHECKED_IN state.
     */
    public boolean isRoomAvailable(Room room, DateRange dateRange) {
        return reservations.stream()
            .filter(Reservation::isActive)
            .filter(r -> r.getRoom().getRoomId().equals(room.getRoomId()))
            .noneMatch(r -> r.getDateRange().overlaps(dateRange));
    }

    public void addReservation(Reservation reservation) {
        reservations.add(reservation);
    }

    public Reservation findReservation(String reservationId) {
        return reservations.stream()
            .filter(r -> r.getReservationId().equals(reservationId))
            .findFirst()
            .orElse(null);
    }

    // --- Getters ---

    public String getHotelId() { return hotelId; }
    public String getName() { return name; }
    public List<Room> getRooms() { return rooms; }
    public List<Reservation> getReservations() { return reservations; }

    @Override
    public String toString() {
        return name + " (" + rooms.size() + " rooms)";
    }
}
```

---

## 13. BookingService

```java
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class BookingService {
    private final Hotel hotel;
    private PricingStrategy pricingStrategy;
    private final List<BookingObserver> observers;
    private final List<Payment> payments;

    public BookingService(Hotel hotel, PricingStrategy pricingStrategy) {
        this.hotel = hotel;
        this.pricingStrategy = pricingStrategy;
        this.observers = new ArrayList<>();
        this.payments = new ArrayList<>();
    }

    public void setPricingStrategy(PricingStrategy strategy) {
        this.pricingStrategy = strategy;
    }

    public void addObserver(BookingObserver observer) {
        observers.add(observer);
    }

    // --- Search ---

    public List<Room> searchAvailable(DateRange dateRange, RoomType type,
                                      int maxPricePerNight) {
        return hotel.searchAvailableRooms(dateRange, type, maxPricePerNight);
    }

    // --- Create Reservation ---

    public Reservation createReservation(Guest guest, Room room,
                                         DateRange dateRange) {
        // Double-booking prevention: check availability before creating
        if (!hotel.isRoomAvailable(room, dateRange)) {
            System.out.println("ERROR: Room " + room.getRoomNumber()
                + " is not available for " + dateRange
                + ". Reservation not created.");
            return null;
        }

        int totalPrice = pricingStrategy.calculatePrice(room, dateRange);
        Reservation reservation = new Reservation(guest, room, dateRange,
                                                  totalPrice);
        hotel.addReservation(reservation);

        System.out.println("Reservation created: " + reservation);
        System.out.println("  Pricing strategy: " + pricingStrategy);

        // Notify observers
        for (BookingObserver observer : observers) {
            observer.onReservationCreated(reservation);
        }

        return reservation;
    }

    // --- Confirm (with payment) ---

    public void confirmReservation(String reservationId) {
        Reservation reservation = hotel.findReservation(reservationId);
        if (reservation == null) {
            System.out.println("ERROR: Reservation " + reservationId
                + " not found.");
            return;
        }

        // Process payment
        Payment payment = new Payment(reservationId,
            reservation.getTotalPrice(), PaymentType.CHARGE);
        payments.add(payment);
        System.out.println("  " + payment);

        reservation.confirm(); // delegates to state
    }

    // --- Check In ---

    public void checkIn(String reservationId) {
        Reservation reservation = hotel.findReservation(reservationId);
        if (reservation == null) {
            System.out.println("ERROR: Reservation " + reservationId
                + " not found.");
            return;
        }

        String stateBefore = reservation.getStateName();
        reservation.checkIn(); // delegates to state

        // Notify only if state actually changed
        if (!stateBefore.equals(reservation.getStateName())) {
            for (BookingObserver observer : observers) {
                observer.onGuestCheckedIn(reservation);
            }
        }
    }

    // --- Check Out ---

    public void checkOut(String reservationId) {
        Reservation reservation = hotel.findReservation(reservationId);
        if (reservation == null) {
            System.out.println("ERROR: Reservation " + reservationId
                + " not found.");
            return;
        }

        String stateBefore = reservation.getStateName();
        reservation.checkOut(); // delegates to state

        if (!stateBefore.equals(reservation.getStateName())) {
            for (BookingObserver observer : observers) {
                observer.onGuestCheckedOut(reservation);
            }
        }
    }

    // --- Cancel ---

    /**
     * Cancel a reservation and calculate refund based on cancellation policy.
     * Returns the refund amount in cents.
     */
    public int cancelReservation(String reservationId) {
        return cancelReservation(reservationId, LocalDateTime.now());
    }

    /**
     * Overload with simulated time for demo/testing.
     */
    public int cancelReservation(String reservationId,
                                 LocalDateTime simulatedNow) {
        Reservation reservation = hotel.findReservation(reservationId);
        if (reservation == null) {
            System.out.println("ERROR: Reservation " + reservationId
                + " not found.");
            return 0;
        }

        String stateBefore = reservation.getStateName();

        // Calculate refund before state transition
        int refundAmount = 0;
        if (stateBefore.equals("REQUESTED")) {
            // Always full refund for unconfirmed reservations
            refundAmount = reservation.getTotalPrice();
            System.out.println("  [Cancellation Policy] Reservation not yet "
                + "confirmed -> 100% refund");
        } else if (stateBefore.equals("CONFIRMED")) {
            refundAmount = CancellationPolicy
                .calculateRefund(reservation, simulatedNow);
        }

        reservation.cancel(); // delegates to state

        // Process refund if state changed and refund is due
        if (!stateBefore.equals(reservation.getStateName())
                && refundAmount > 0) {
            Payment refund = new Payment(reservationId, refundAmount,
                                         PaymentType.REFUND);
            payments.add(refund);
            System.out.println("  " + refund);
        }

        // Notify observers if state changed
        if (!stateBefore.equals(reservation.getStateName())) {
            for (BookingObserver observer : observers) {
                observer.onReservationCancelled(reservation, refundAmount);
            }
        }

        return refundAmount;
    }

    // --- Utility ---

    public List<Payment> getPayments() { return payments; }
    public Hotel getHotel() { return hotel; }
}
```

---

## 14. Main -- Demo

```java
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Month;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class HotelBookingDemo {

    public static void main(String[] args) {

        // ============================================================
        // SETUP: Create hotel with rooms
        // ============================================================

        System.out.println("=".repeat(70));
        System.out.println("  HOTEL BOOKING SYSTEM -- DEMO");
        System.out.println("=".repeat(70));
        System.out.println();

        Hotel hotel = new Hotel("H001", "The Grand Palace");

        // Create rooms using the Factory pattern
        Room room101 = RoomFactory.createRoom(101, RoomType.SINGLE, 10000);
        Room room102 = RoomFactory.createRoom(102, RoomType.SINGLE, 10000);
        Room room201 = RoomFactory.createRoom(201, RoomType.DOUBLE, 15000);
        Room room202 = RoomFactory.createRoom(202, RoomType.DOUBLE, 15000);
        Room room301 = RoomFactory.createRoom(301, RoomType.SUITE,  30000);

        hotel.addRoom(room101);
        hotel.addRoom(room102);
        hotel.addRoom(room201);
        hotel.addRoom(room202);
        hotel.addRoom(room301);

        System.out.println("Hotel: " + hotel);
        System.out.println("Rooms:");
        for (Room r : hotel.getRooms()) {
            System.out.println("  " + r);
        }
        System.out.println();

        // Create guests
        Guest alice = new Guest("G001", "Alice Johnson",
                                "alice@email.com", "555-0101");
        Guest bob   = new Guest("G002", "Bob Smith",
                                "bob@email.com", "555-0202");
        Guest carol = new Guest("G003", "Carol White",
                                "carol@email.com", "555-0303");

        // Setup booking service with weekend pricing strategy
        PricingStrategy weekendPricing = new WeekendPricingStrategy(1.25);
        BookingService service = new BookingService(hotel, weekendPricing);
        service.addObserver(new EmailNotificationObserver());

        // ============================================================
        // SCENARIO 1: Happy Path -- Search, Book, Confirm, Check-in,
        //              Check-out
        // ============================================================

        System.out.println("-".repeat(70));
        System.out.println("SCENARIO 1: Happy Path (Alice books a Double room)");
        System.out.println("-".repeat(70));
        System.out.println();

        // Search for Double rooms
        DateRange aliceDates = new DateRange(
            LocalDate.now(), LocalDate.now().plusDays(3));
        System.out.println("Searching for DOUBLE rooms, " + aliceDates
            + ", max $200/night...");

        List<Room> available = service.searchAvailable(
            aliceDates, RoomType.DOUBLE, 20000);
        System.out.println("Found " + available.size() + " rooms:");
        for (Room r : available) {
            System.out.println("  " + r);
        }
        System.out.println();

        // Book Room 201
        Reservation res1 = service.createReservation(
            alice, room201, aliceDates);
        System.out.println();

        // Confirm (pay)
        System.out.println("Confirming reservation...");
        service.confirmReservation(res1.getReservationId());
        System.out.println();

        // Check in (today is check-in date)
        System.out.println("Checking in...");
        service.checkIn(res1.getReservationId());
        System.out.println();

        // Check out
        System.out.println("Checking out...");
        service.checkOut(res1.getReservationId());
        System.out.println();

        // ============================================================
        // SCENARIO 2: Double-Booking Prevention
        // ============================================================

        System.out.println("-".repeat(70));
        System.out.println("SCENARIO 2: Double-Booking Prevention");
        System.out.println("-".repeat(70));
        System.out.println();

        // Bob tries to book Room 201 for overlapping dates
        DateRange bobDates = new DateRange(
            LocalDate.now().plusDays(5), LocalDate.now().plusDays(8));

        Reservation res2 = service.createReservation(bob, room201, bobDates);
        System.out.println();

        // Carol tries to book Room 201 for overlapping dates with Bob
        DateRange carolOverlap = new DateRange(
            LocalDate.now().plusDays(6), LocalDate.now().plusDays(10));
        System.out.println("Carol tries to book Room 201 for " + carolOverlap
            + " (overlaps with Bob)...");
        Reservation res3 = service.createReservation(
            carol, room201, carolOverlap);
        System.out.println();

        // Carol books Room 201 AFTER Bob's stay (no overlap)
        DateRange carolValid = new DateRange(
            LocalDate.now().plusDays(8), LocalDate.now().plusDays(11));
        System.out.println("Carol tries Room 201 for " + carolValid
            + " (after Bob's checkout)...");
        Reservation res4 = service.createReservation(
            carol, room201, carolValid);
        System.out.println();

        // ============================================================
        // SCENARIO 3: Cancellation with Full Refund (>48h)
        // ============================================================

        System.out.println("-".repeat(70));
        System.out.println("SCENARIO 3: Cancellation -- Full Refund (>48h)");
        System.out.println("-".repeat(70));
        System.out.println();

        DateRange futureStay = new DateRange(
            LocalDate.now().plusDays(10), LocalDate.now().plusDays(13));
        Reservation res5 = service.createReservation(
            alice, room102, futureStay);
        service.confirmReservation(res5.getReservationId());
        System.out.println();

        // Cancel 10 days out (240 hours > 48 hours)
        System.out.println("Cancelling 10 days before check-in...");
        int refund = service.cancelReservation(
            res5.getReservationId(), LocalDateTime.now());
        System.out.println("Refund received: $"
            + String.format("%.2f", refund / 100.0));
        System.out.println();

        // ============================================================
        // SCENARIO 4: Cancellation with Partial Refund (24-48h)
        // ============================================================

        System.out.println("-".repeat(70));
        System.out.println("SCENARIO 4: Cancellation -- 50% Refund (24-48h)");
        System.out.println("-".repeat(70));
        System.out.println();

        DateRange soonStay = new DateRange(
            LocalDate.now().plusDays(2), LocalDate.now().plusDays(4));
        Reservation res6 = service.createReservation(
            bob, room101, soonStay);
        service.confirmReservation(res6.getReservationId());
        System.out.println();

        // Simulate cancellation 36 hours before check-in
        LocalDateTime simulated36h = soonStay.getCheckIn().atStartOfDay()
            .minusHours(36);
        System.out.println("Cancelling 36 hours before check-in "
            + "(simulated time: " + simulated36h + ")...");
        refund = service.cancelReservation(
            res6.getReservationId(), simulated36h);
        System.out.println("Refund received: $"
            + String.format("%.2f", refund / 100.0));
        System.out.println();

        // ============================================================
        // SCENARIO 5: Late Cancellation -- No Refund (<24h)
        // ============================================================

        System.out.println("-".repeat(70));
        System.out.println("SCENARIO 5: Cancellation -- No Refund (<24h)");
        System.out.println("-".repeat(70));
        System.out.println();

        DateRange tomorrowStay = new DateRange(
            LocalDate.now().plusDays(1), LocalDate.now().plusDays(3));
        Reservation res7 = service.createReservation(
            carol, room102, tomorrowStay);
        service.confirmReservation(res7.getReservationId());
        System.out.println();

        // Simulate cancellation 12 hours before check-in
        LocalDateTime simulated12h = tomorrowStay.getCheckIn().atStartOfDay()
            .minusHours(12);
        System.out.println("Cancelling 12 hours before check-in "
            + "(simulated time: " + simulated12h + ")...");
        refund = service.cancelReservation(
            res7.getReservationId(), simulated12h);
        System.out.println("Refund received: $"
            + String.format("%.2f", refund / 100.0));
        System.out.println();

        // ============================================================
        // SCENARIO 6: Invalid State Transitions
        // ============================================================

        System.out.println("-".repeat(70));
        System.out.println("SCENARIO 6: Invalid State Transitions");
        System.out.println("-".repeat(70));
        System.out.println();

        DateRange newStay = new DateRange(
            LocalDate.now().plusDays(20), LocalDate.now().plusDays(23));
        Reservation res8 = service.createReservation(
            alice, room301, newStay);
        System.out.println();

        // Try to check in before confirming
        System.out.println("Attempt: check in without confirming...");
        service.checkIn(res8.getReservationId());
        System.out.println();

        // Try to check out without checking in
        System.out.println("Attempt: check out without checking in...");
        service.checkOut(res8.getReservationId());
        System.out.println();

        // Confirm, then try to confirm again
        service.confirmReservation(res8.getReservationId());
        System.out.println();
        System.out.println("Attempt: confirm again...");
        service.confirmReservation(res8.getReservationId());
        System.out.println();

        // Cancel, then try further actions on cancelled reservation
        service.cancelReservation(res8.getReservationId());
        System.out.println();
        System.out.println("Attempt: check in after cancellation...");
        service.checkIn(res8.getReservationId());
        System.out.println();

        // ============================================================
        // SCENARIO 7: Switching Pricing Strategy
        // ============================================================

        System.out.println("-".repeat(70));
        System.out.println("SCENARIO 7: Pricing Strategy Comparison");
        System.out.println("-".repeat(70));
        System.out.println();

        // A date range that spans both weekdays and weekends
        DateRange pricingDates = new DateRange(
            LocalDate.of(2026, 6, 11),  // Thursday
            LocalDate.of(2026, 6, 15)); // Monday (4 nights: Thu, Fri, Sat, Sun)

        System.out.println("Comparing pricing for Room 201 ($150/night base), "
            + pricingDates + ":");
        System.out.println();

        // Flat rate
        PricingStrategy flat = new WeekdayPricingStrategy();
        System.out.println("  " + flat + ": $"
            + String.format("%.2f",
                flat.calculatePrice(room201, pricingDates) / 100.0));

        // Weekend pricing (1.25x on Fri/Sat)
        System.out.println("  " + weekendPricing + ": $"
            + String.format("%.2f",
                weekendPricing.calculatePrice(room201, pricingDates) / 100.0));

        // Seasonal pricing
        Map<Month, Double> multipliers = new HashMap<>();
        multipliers.put(Month.JUNE, 1.3);     // summer premium
        multipliers.put(Month.DECEMBER, 1.5); // holiday premium
        multipliers.put(Month.FEBRUARY, 0.8); // winter discount
        PricingStrategy seasonal = new SeasonalPricingStrategy(multipliers);
        System.out.println("  " + seasonal + " (June 1.3x): $"
            + String.format("%.2f",
                seasonal.calculatePrice(room201, pricingDates) / 100.0));

        System.out.println();

        // Switch the service to seasonal pricing and make a booking
        System.out.println("Switching service to Seasonal pricing...");
        service.setPricingStrategy(seasonal);

        DateRange seasonalStay = new DateRange(
            LocalDate.of(2026, 6, 20),
            LocalDate.of(2026, 6, 23));
        Reservation res9 = service.createReservation(
            bob, room202, seasonalStay);
        System.out.println();

        // ============================================================
        // SUMMARY
        // ============================================================

        System.out.println("=".repeat(70));
        System.out.println("  ALL RESERVATIONS");
        System.out.println("=".repeat(70));
        for (Reservation r : hotel.getReservations()) {
            System.out.println("  " + r);
        }
        System.out.println();

        System.out.println("=".repeat(70));
        System.out.println("  ALL PAYMENTS");
        System.out.println("=".repeat(70));
        for (Payment p : service.getPayments()) {
            System.out.println("  " + p);
        }
        System.out.println();

        System.out.println("=".repeat(70));
        System.out.println("  DEMO COMPLETE");
        System.out.println("=".repeat(70));
    }
}
```

---

## Design Patterns Summary

| Pattern | Where | Purpose |
|---------|-------|---------|
| **State** | `ReservationState` + 5 implementations | Manages reservation lifecycle; each state encapsulates its own transition rules |
| **Strategy** | `PricingStrategy` + 4 implementations | Swappable pricing algorithms without modifying booking logic |
| **Observer** | `BookingObserver` + `EmailNotificationObserver` | Decoupled notifications on booking events |
| **Factory** | `RoomFactory` | Centralises Room subclass creation based on RoomType |

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Half-open date intervals `[checkIn, checkOut)` | Allows adjacent bookings without false overlap; checkout day is free for new check-in |
| Monetary values in cents (int) | Avoids floating-point precision errors in financial calculations |
| `isActive()` checks state name | Only REQUESTED, CONFIRMED, and CHECKED_IN reservations block availability |
| Simulated time parameter on cancel | Enables deterministic testing of the tiered refund policy |
| State objects are stateless | Each state implementation carries no instance fields -- transitions create new state objects, keeping it simple and thread-friendly |
