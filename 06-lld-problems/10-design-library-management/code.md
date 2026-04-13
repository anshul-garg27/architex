# Library Management System -- Full Java Implementation

## Table of Contents

1. [Enums](#1-enums)
2. [Core Entities](#2-core-entities)
3. [Service Classes](#3-service-classes)
4. [Strategy Pattern -- Search](#4-strategy-pattern----search)
5. [Observer Pattern -- Notifications](#5-observer-pattern----notifications)
6. [Repository Pattern -- Data Access](#6-repository-pattern----data-access)
7. [Library Facade](#7-library-facade)
8. [Main Demo](#8-main-demo)

---

## 1. Enums

### BookStatus

```java
public enum BookStatus {
    AVAILABLE,
    BORROWED,
    RESERVED,
    LOST
}
```

### BookCategory

```java
public enum BookCategory {
    FICTION,
    NON_FICTION,
    SCIENCE,
    HISTORY,
    TECHNOLOGY,
    BIOGRAPHY,
    CHILDREN,
    REFERENCE
}
```

---

## 2. Core Entities

### Rack

```java
public class Rack {
    private final int rackNumber;
    private final String locationDescription;

    public Rack(int rackNumber, String locationDescription) {
        this.rackNumber = rackNumber;
        this.locationDescription = locationDescription;
    }

    public int getRackNumber() {
        return rackNumber;
    }

    public String getLocationDescription() {
        return locationDescription;
    }

    @Override
    public String toString() {
        return "Rack-" + rackNumber + " (" + locationDescription + ")";
    }
}
```

### Book (Metadata)

```java
import java.util.ArrayList;
import java.util.List;

public class Book {
    private final String isbn;
    private final String title;
    private final String author;
    private final BookCategory category;
    private final int publicationYear;
    private final List<BookItem> bookItems;

    public Book(String isbn, String title, String author,
                BookCategory category, int publicationYear) {
        this.isbn = isbn;
        this.title = title;
        this.author = author;
        this.category = category;
        this.publicationYear = publicationYear;
        this.bookItems = new ArrayList<>();
    }

    public String getIsbn() { return isbn; }
    public String getTitle() { return title; }
    public String getAuthor() { return author; }
    public BookCategory getCategory() { return category; }
    public int getPublicationYear() { return publicationYear; }
    public List<BookItem> getBookItems() { return bookItems; }

    public void addBookItem(BookItem item) {
        bookItems.add(item);
    }

    public BookItem getAvailableCopy() {
        return bookItems.stream()
                .filter(BookItem::isAvailable)
                .findFirst()
                .orElse(null);
    }

    public boolean hasAvailableCopy() {
        return bookItems.stream().anyMatch(BookItem::isAvailable);
    }

    @Override
    public String toString() {
        return "\"" + title + "\" by " + author + " (ISBN: " + isbn + ")";
    }
}
```

### BookItem (Physical Copy)

```java
import java.time.LocalDate;

public class BookItem {
    private final String barcode;
    private final Book book;
    private BookStatus status;
    private final Rack rack;
    private LocalDate dueDate;

    public BookItem(String barcode, Book book, Rack rack) {
        this.barcode = barcode;
        this.book = book;
        this.status = BookStatus.AVAILABLE;
        this.rack = rack;
        this.dueDate = null;
    }

    public String getBarcode() { return barcode; }
    public Book getBook() { return book; }
    public BookStatus getStatus() { return status; }
    public Rack getRack() { return rack; }
    public LocalDate getDueDate() { return dueDate; }

    public void setStatus(BookStatus status) {
        this.status = status;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public boolean isAvailable() {
        return status == BookStatus.AVAILABLE;
    }

    @Override
    public String toString() {
        return "[" + barcode + "] " + book.getTitle()
                + " | Status: " + status
                + " | Rack: " + rack;
    }
}
```

### Member

```java
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class Member {
    private static final int MAX_BOOKS = 5;

    private final String memberId;
    private final String name;
    private final String email;
    private final String phone;
    private final LocalDate joinDate;
    private boolean active;
    private final List<Loan> activeLoans;
    private final List<Fine> fines;

    public Member(String memberId, String name, String email, String phone) {
        this.memberId = memberId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.joinDate = LocalDate.now();
        this.active = true;
        this.activeLoans = new ArrayList<>();
        this.fines = new ArrayList<>();
    }

    public String getMemberId() { return memberId; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public LocalDate getJoinDate() { return joinDate; }
    public boolean isActive() { return active; }
    public List<Loan> getActiveLoans() { return activeLoans; }
    public List<Fine> getFines() { return fines; }

    public void setActive(boolean active) {
        this.active = active;
    }

    public int getActiveLoanCount() {
        return activeLoans.size();
    }

    public boolean canBorrow() {
        return active
                && activeLoans.size() < MAX_BOOKS
                && getTotalUnpaidFines() == 0;
    }

    public void addLoan(Loan loan) {
        activeLoans.add(loan);
    }

    public void removeLoan(Loan loan) {
        activeLoans.remove(loan);
    }

    public void addFine(Fine fine) {
        fines.add(fine);
    }

    public int getTotalUnpaidFines() {
        return fines.stream()
                .filter(f -> !f.isPaid())
                .mapToInt(Fine::getAmount)
                .sum();
    }

    @Override
    public String toString() {
        return "Member[" + memberId + "] " + name + " (" + email + ")";
    }
}
```

### Librarian

```java
public class Librarian extends Member {
    private final String employeeId;

    public Librarian(String memberId, String name, String email,
                     String phone, String employeeId) {
        super(memberId, name, email, phone);
        this.employeeId = employeeId;
    }

    public String getEmployeeId() {
        return employeeId;
    }

    public void addBook(Library library, Book book) {
        library.addBook(book);
        System.out.println("LIBRARIAN: Added book " + book);
    }

    public void addBookItem(Library library, Book book, BookItem item) {
        library.addBookItem(book, item);
        System.out.println("LIBRARIAN: Added copy " + item.getBarcode()
                + " for " + book.getTitle());
    }

    public void registerMember(Library library, Member member) {
        library.registerMember(member);
        System.out.println("LIBRARIAN: Registered member " + member.getName());
    }

    public void deactivateMember(Library library, Member member) {
        member.setActive(false);
        System.out.println("LIBRARIAN: Deactivated member " + member.getName());
    }

    @Override
    public String toString() {
        return "Librarian[" + employeeId + "] " + getName();
    }
}
```

### Loan

```java
import java.time.LocalDate;

public class Loan {
    private static int counter = 0;

    private final String loanId;
    private final Member member;
    private final BookItem bookItem;
    private final LocalDate issueDate;
    private final LocalDate dueDate;
    private LocalDate returnDate;
    private Fine fine;

    public Loan(Member member, BookItem bookItem,
                LocalDate issueDate, LocalDate dueDate) {
        this.loanId = "LOAN-" + (++counter);
        this.member = member;
        this.bookItem = bookItem;
        this.issueDate = issueDate;
        this.dueDate = dueDate;
        this.returnDate = null;
        this.fine = null;
    }

    public String getLoanId() { return loanId; }
    public Member getMember() { return member; }
    public BookItem getBookItem() { return bookItem; }
    public LocalDate getIssueDate() { return issueDate; }
    public LocalDate getDueDate() { return dueDate; }
    public LocalDate getReturnDate() { return returnDate; }
    public Fine getFine() { return fine; }

    public void setReturnDate(LocalDate returnDate) {
        this.returnDate = returnDate;
    }

    public void setFine(Fine fine) {
        this.fine = fine;
    }

    public boolean isOverdue() {
        LocalDate checkDate = (returnDate != null) ? returnDate : LocalDate.now();
        return checkDate.isAfter(dueDate);
    }

    public boolean isReturned() {
        return returnDate != null;
    }

    @Override
    public String toString() {
        return loanId + ": " + member.getName()
                + " borrowed " + bookItem.getBook().getTitle()
                + " [" + bookItem.getBarcode() + "]"
                + " | Due: " + dueDate
                + (returnDate != null ? " | Returned: " + returnDate : " | ACTIVE");
    }
}
```

### Fine

```java
public class Fine {
    private static int counter = 0;

    private final String fineId;
    private final Loan loan;
    private final int amount; // in rupees
    private boolean paid;

    public Fine(Loan loan, int amount) {
        this.fineId = "FINE-" + (++counter);
        this.loan = loan;
        this.amount = amount;
        this.paid = false;
    }

    public String getFineId() { return fineId; }
    public Loan getLoan() { return loan; }
    public int getAmount() { return amount; }
    public boolean isPaid() { return paid; }

    public void pay() {
        this.paid = true;
        System.out.println("Fine " + fineId + " of Rs " + amount + " has been paid.");
    }

    @Override
    public String toString() {
        return fineId + ": Rs " + amount
                + " | " + (paid ? "PAID" : "UNPAID")
                + " | For: " + loan.getLoanId();
    }
}
```

### Reservation

```java
import java.time.LocalDate;

public class Reservation {
    private static int counter = 0;

    private final String reservationId;
    private final Member member;
    private final Book book;
    private final LocalDate reservationDate;
    private boolean fulfilled;

    public Reservation(Member member, Book book) {
        this.reservationId = "RES-" + (++counter);
        this.member = member;
        this.book = book;
        this.reservationDate = LocalDate.now();
        this.fulfilled = false;
    }

    public String getReservationId() { return reservationId; }
    public Member getMember() { return member; }
    public Book getBook() { return book; }
    public LocalDate getReservationDate() { return reservationDate; }
    public boolean isFulfilled() { return fulfilled; }

    public void fulfill() {
        this.fulfilled = true;
    }

    @Override
    public String toString() {
        return reservationId + ": " + member.getName()
                + " reserved " + book.getTitle()
                + " | " + (fulfilled ? "FULFILLED" : "PENDING");
    }
}
```

---

## 3. Service Classes

### FineCalculator

```java
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public class FineCalculator {
    private final int dailyFineRate; // Rs per day

    public FineCalculator(int dailyFineRate) {
        this.dailyFineRate = dailyFineRate;
    }

    /**
     * Calculates fine for a late return.
     *
     * @param dueDate    the date the book was due
     * @param returnDate the date the book was actually returned
     * @return fine amount in rupees; 0 if returned on time
     */
    public int calculateFine(LocalDate dueDate, LocalDate returnDate) {
        if (!returnDate.isAfter(dueDate)) {
            return 0;
        }
        long overdueDays = ChronoUnit.DAYS.between(dueDate, returnDate);
        return (int) overdueDays * dailyFineRate;
    }

    public int getDailyFineRate() {
        return dailyFineRate;
    }
}
```

### LoanService

```java
import java.time.LocalDate;

public class LoanService {
    private static final int LOAN_PERIOD_DAYS = 14;

    private final FineCalculator fineCalculator;
    private final ReservationService reservationService;

    public LoanService(FineCalculator fineCalculator,
                       ReservationService reservationService) {
        this.fineCalculator = fineCalculator;
        this.reservationService = reservationService;
    }

    /**
     * Borrows a book item for a member.
     * Validates all business rules before issuing the loan.
     */
    public Loan borrowBook(Member member, BookItem bookItem) {
        validateBorrow(member, bookItem);

        LocalDate issueDate = LocalDate.now();
        LocalDate dueDate = issueDate.plusDays(LOAN_PERIOD_DAYS);

        Loan loan = new Loan(member, bookItem, issueDate, dueDate);

        bookItem.setStatus(BookStatus.BORROWED);
        bookItem.setDueDate(dueDate);
        member.addLoan(loan);

        System.out.println("LOAN ISSUED: " + loan);
        return loan;
    }

    /**
     * Borrows a book item with a simulated issue date (for demo/testing).
     * Allows creating loans that appear to have been issued in the past.
     */
    public Loan borrowBook(Member member, BookItem bookItem,
                           LocalDate simulatedIssueDate) {
        validateBorrow(member, bookItem);

        LocalDate dueDate = simulatedIssueDate.plusDays(LOAN_PERIOD_DAYS);

        Loan loan = new Loan(member, bookItem, simulatedIssueDate, dueDate);

        bookItem.setStatus(BookStatus.BORROWED);
        bookItem.setDueDate(dueDate);
        member.addLoan(loan);

        System.out.println("LOAN ISSUED: " + loan);
        return loan;
    }

    /**
     * Returns a book item. Calculates fine if overdue.
     * Triggers reservation service to notify waiting members if applicable.
     */
    public Fine returnBook(Member member, BookItem bookItem) {
        return returnBook(member, bookItem, LocalDate.now());
    }

    /**
     * Returns a book item with a simulated return date (for demo/testing).
     */
    public Fine returnBook(Member member, BookItem bookItem,
                           LocalDate simulatedReturnDate) {
        Loan activeLoan = findActiveLoan(member, bookItem);
        if (activeLoan == null) {
            throw new IllegalStateException(
                    "No active loan found for member " + member.getName()
                    + " and book copy " + bookItem.getBarcode());
        }

        activeLoan.setReturnDate(simulatedReturnDate);
        member.removeLoan(activeLoan);

        // Calculate fine if overdue
        Fine fine = null;
        int fineAmount = fineCalculator.calculateFine(
                activeLoan.getDueDate(), simulatedReturnDate);
        if (fineAmount > 0) {
            fine = new Fine(activeLoan, fineAmount);
            activeLoan.setFine(fine);
            member.addFine(fine);
            System.out.println("FINE IMPOSED: " + fine);
        }

        // Check for pending reservations before marking available
        boolean hasReservation = reservationService.onBookReturned(
                bookItem.getBook(), bookItem);

        if (!hasReservation) {
            bookItem.setStatus(BookStatus.AVAILABLE);
            bookItem.setDueDate(null);
        }
        // If there was a reservation, onBookReturned already set RESERVED status

        System.out.println("BOOK RETURNED: " + member.getName()
                + " returned " + bookItem.getBook().getTitle()
                + " [" + bookItem.getBarcode() + "]"
                + (fine != null ? " | Fine: Rs " + fine.getAmount() : " | No fine"));

        return fine;
    }

    private void validateBorrow(Member member, BookItem bookItem) {
        if (!member.isActive()) {
            throw new IllegalStateException(
                    "Member " + member.getName() + " account is not active.");
        }
        if (!member.canBorrow()) {
            if (member.getActiveLoanCount() >= 5) {
                throw new IllegalStateException(
                        "Member " + member.getName()
                        + " has reached the borrow limit (max 5 books).");
            }
            if (member.getTotalUnpaidFines() > 0) {
                throw new IllegalStateException(
                        "Member " + member.getName()
                        + " has unpaid fines of Rs "
                        + member.getTotalUnpaidFines()
                        + ". Please clear fines before borrowing.");
            }
        }

        if (bookItem.getStatus() == BookStatus.BORROWED) {
            throw new IllegalStateException(
                    "Book copy " + bookItem.getBarcode()
                    + " is already borrowed.");
        }
        if (bookItem.getStatus() == BookStatus.LOST) {
            throw new IllegalStateException(
                    "Book copy " + bookItem.getBarcode()
                    + " is marked as lost.");
        }
        if (bookItem.getStatus() == BookStatus.RESERVED) {
            // Only the reserving member can borrow a reserved copy
            Reservation res = reservationService
                    .findActiveReservation(bookItem.getBook());
            if (res != null && !res.getMember().getMemberId()
                    .equals(member.getMemberId())) {
                throw new IllegalStateException(
                        "Book copy " + bookItem.getBarcode()
                        + " is reserved by " + res.getMember().getName()
                        + ". Only the reserving member can borrow it.");
            }
        }
    }

    private Loan findActiveLoan(Member member, BookItem bookItem) {
        return member.getActiveLoans().stream()
                .filter(loan -> loan.getBookItem().getBarcode()
                        .equals(bookItem.getBarcode()))
                .filter(loan -> !loan.isReturned())
                .findFirst()
                .orElse(null);
    }
}
```

---

## 4. Strategy Pattern -- Search

### SearchStrategy (Interface)

```java
import java.util.List;

public interface SearchStrategy {
    List<Book> search(List<Book> catalog, String query);
}
```

### SearchByTitle

```java
import java.util.List;
import java.util.stream.Collectors;

public class SearchByTitle implements SearchStrategy {
    @Override
    public List<Book> search(List<Book> catalog, String query) {
        String lowerQuery = query.toLowerCase();
        return catalog.stream()
                .filter(book -> book.getTitle().toLowerCase()
                        .contains(lowerQuery))
                .collect(Collectors.toList());
    }
}
```

### SearchByAuthor

```java
import java.util.List;
import java.util.stream.Collectors;

public class SearchByAuthor implements SearchStrategy {
    @Override
    public List<Book> search(List<Book> catalog, String query) {
        String lowerQuery = query.toLowerCase();
        return catalog.stream()
                .filter(book -> book.getAuthor().toLowerCase()
                        .contains(lowerQuery))
                .collect(Collectors.toList());
    }
}
```

### SearchByISBN

```java
import java.util.List;
import java.util.stream.Collectors;

public class SearchByISBN implements SearchStrategy {
    @Override
    public List<Book> search(List<Book> catalog, String query) {
        return catalog.stream()
                .filter(book -> book.getIsbn().equals(query))
                .collect(Collectors.toList());
    }
}
```

### SearchByCategory

```java
import java.util.List;
import java.util.stream.Collectors;

public class SearchByCategory implements SearchStrategy {
    @Override
    public List<Book> search(List<Book> catalog, String query) {
        BookCategory targetCategory;
        try {
            targetCategory = BookCategory.valueOf(query.toUpperCase());
        } catch (IllegalArgumentException e) {
            return List.of(); // invalid category returns empty
        }
        return catalog.stream()
                .filter(book -> book.getCategory() == targetCategory)
                .collect(Collectors.toList());
    }
}
```

### SearchService

```java
import java.util.List;

public class SearchService {
    private SearchStrategy strategy;

    public SearchService() {
        this.strategy = new SearchByTitle(); // default strategy
    }

    public void setStrategy(SearchStrategy strategy) {
        this.strategy = strategy;
    }

    public List<Book> search(List<Book> catalog, String query) {
        return strategy.search(catalog, query);
    }
}
```

---

## 5. Observer Pattern -- Notifications

### BookAvailabilityObserver (Interface)

```java
public interface BookAvailabilityObserver {
    void onBookAvailable(Book book, BookItem copy);
}
```

### MemberNotificationObserver

```java
public class MemberNotificationObserver implements BookAvailabilityObserver {
    private final Member member;

    public MemberNotificationObserver(Member member) {
        this.member = member;
    }

    @Override
    public void onBookAvailable(Book book, BookItem copy) {
        System.out.println();
        System.out.println("=================================================");
        System.out.println("  NOTIFICATION to " + member.getName() + ":");
        System.out.println("  Your reserved book \"" + book.getTitle()
                + "\" is now available!");
        System.out.println("  Copy barcode: " + copy.getBarcode());
        System.out.println("  Rack location: " + copy.getRack());
        System.out.println("  Please pick it up within 3 days.");
        System.out.println("=================================================");
        System.out.println();
    }

    public Member getMember() {
        return member;
    }
}
```

### ReservationService

```java
import java.util.ArrayList;
import java.util.List;

public class ReservationService {
    private final List<Reservation> reservations;
    private final List<BookAvailabilityObserver> observers;

    public ReservationService() {
        this.reservations = new ArrayList<>();
        this.observers = new ArrayList<>();
    }

    /**
     * Creates a reservation for a member on a book.
     * Also registers a notification observer for that member.
     */
    public Reservation reserve(Member member, Book book) {
        // Validate: book must not have available copies
        if (book.hasAvailableCopy()) {
            throw new IllegalStateException(
                    "Book \"" + book.getTitle()
                    + "\" has available copies. No need to reserve -- "
                    + "borrow directly.");
        }

        // Validate: member should not already have an active reservation
        boolean alreadyReserved = reservations.stream()
                .anyMatch(r -> !r.isFulfilled()
                        && r.getMember().getMemberId()
                                .equals(member.getMemberId())
                        && r.getBook().getIsbn()
                                .equals(book.getIsbn()));
        if (alreadyReserved) {
            throw new IllegalStateException(
                    "Member " + member.getName()
                    + " already has a pending reservation for \""
                    + book.getTitle() + "\".");
        }

        Reservation reservation = new Reservation(member, book);
        reservations.add(reservation);

        // Register observer for this member
        addObserver(new MemberNotificationObserver(member));

        System.out.println("RESERVATION CREATED: " + reservation);
        return reservation;
    }

    /**
     * Called when a book is returned. Checks for pending reservations.
     * If found, marks the copy as RESERVED, fulfills the oldest reservation,
     * and notifies observers.
     *
     * @return true if a reservation was fulfilled, false otherwise
     */
    public boolean onBookReturned(Book book, BookItem copy) {
        Reservation pendingReservation = findOldestPendingReservation(book);

        if (pendingReservation == null) {
            return false; // no pending reservations
        }

        // Mark copy as reserved
        copy.setStatus(BookStatus.RESERVED);

        // Fulfill the reservation
        pendingReservation.fulfill();
        System.out.println("RESERVATION FULFILLED: " + pendingReservation);

        // Notify all observers about the availability
        notifyObservers(book, copy);

        return true;
    }

    /**
     * Finds the active (unfulfilled) reservation for a given book.
     * Used by LoanService to check if a reserved copy can be borrowed
     * by a specific member.
     */
    public Reservation findActiveReservation(Book book) {
        return reservations.stream()
                .filter(r -> !r.isFulfilled()
                        && r.getBook().getIsbn().equals(book.getIsbn()))
                .findFirst()
                .orElse(null);
    }

    public void addObserver(BookAvailabilityObserver observer) {
        observers.add(observer);
    }

    public void removeObserver(BookAvailabilityObserver observer) {
        observers.remove(observer);
    }

    private void notifyObservers(Book book, BookItem copy) {
        // Notify only the observers for the reserving member, then remove them
        List<BookAvailabilityObserver> toRemove = new ArrayList<>();
        for (BookAvailabilityObserver observer : observers) {
            if (observer instanceof MemberNotificationObserver) {
                MemberNotificationObserver memberObserver =
                        (MemberNotificationObserver) observer;
                // Find if this observer's member has a fulfilled reservation
                // for this book
                boolean isFulfilledForThisMember = reservations.stream()
                        .anyMatch(r -> r.isFulfilled()
                                && r.getBook().getIsbn().equals(book.getIsbn())
                                && r.getMember().getMemberId().equals(
                                        memberObserver.getMember().getMemberId()));
                if (isFulfilledForThisMember) {
                    observer.onBookAvailable(book, copy);
                    toRemove.add(observer);
                }
            }
        }
        observers.removeAll(toRemove);
    }

    private Reservation findOldestPendingReservation(Book book) {
        return reservations.stream()
                .filter(r -> !r.isFulfilled()
                        && r.getBook().getIsbn().equals(book.getIsbn()))
                .findFirst() // list is insertion-ordered, so first = oldest
                .orElse(null);
    }

    public List<Reservation> getReservationsForBook(Book book) {
        return reservations.stream()
                .filter(r -> r.getBook().getIsbn().equals(book.getIsbn()))
                .toList();
    }
}
```

---

## 6. Repository Pattern -- Data Access

### BookRepository

```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class BookRepository {
    private final Map<String, Book> booksByIsbn;

    public BookRepository() {
        this.booksByIsbn = new HashMap<>();
    }

    public void addBook(Book book) {
        booksByIsbn.put(book.getIsbn(), book);
    }

    public void removeBook(String isbn) {
        booksByIsbn.remove(isbn);
    }

    public Book findByIsbn(String isbn) {
        return booksByIsbn.get(isbn);
    }

    public List<Book> getAllBooks() {
        return new ArrayList<>(booksByIsbn.values());
    }

    public int getBookCount() {
        return booksByIsbn.size();
    }
}
```

### MemberRepository

```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MemberRepository {
    private final Map<String, Member> membersById;

    public MemberRepository() {
        this.membersById = new HashMap<>();
    }

    public void addMember(Member member) {
        membersById.put(member.getMemberId(), member);
    }

    public void removeMember(String memberId) {
        membersById.remove(memberId);
    }

    public Member findById(String memberId) {
        return membersById.get(memberId);
    }

    public List<Member> getAllMembers() {
        return new ArrayList<>(membersById.values());
    }

    public int getMemberCount() {
        return membersById.size();
    }
}
```

---

## 7. Library Facade

```java
import java.util.List;

public class Library {
    private final String name;
    private final String address;
    private final BookRepository bookRepository;
    private final MemberRepository memberRepository;
    private final LoanService loanService;
    private final SearchService searchService;
    private final ReservationService reservationService;

    public Library(String name, String address) {
        this.name = name;
        this.address = address;
        this.bookRepository = new BookRepository();
        this.memberRepository = new MemberRepository();
        this.reservationService = new ReservationService();
        FineCalculator fineCalculator = new FineCalculator(10); // Rs 10/day
        this.loanService = new LoanService(fineCalculator, reservationService);
        this.searchService = new SearchService();
    }

    // --- Book Management ---

    public void addBook(Book book) {
        bookRepository.addBook(book);
    }

    public void addBookItem(Book book, BookItem item) {
        book.addBookItem(item);
    }

    // --- Member Management ---

    public void registerMember(Member member) {
        memberRepository.addMember(member);
    }

    // --- Search ---

    public List<Book> searchBooks(SearchStrategy strategy, String query) {
        searchService.setStrategy(strategy);
        return searchService.search(bookRepository.getAllBooks(), query);
    }

    // --- Borrow / Return ---

    public Loan borrowBook(Member member, BookItem bookItem) {
        return loanService.borrowBook(member, bookItem);
    }

    public Loan borrowBook(Member member, BookItem bookItem,
                           java.time.LocalDate simulatedIssueDate) {
        return loanService.borrowBook(member, bookItem, simulatedIssueDate);
    }

    public Fine returnBook(Member member, BookItem bookItem) {
        return loanService.returnBook(member, bookItem);
    }

    public Fine returnBook(Member member, BookItem bookItem,
                           java.time.LocalDate simulatedReturnDate) {
        return loanService.returnBook(member, bookItem, simulatedReturnDate);
    }

    // --- Reservations ---

    public Reservation reserveBook(Member member, Book book) {
        return reservationService.reserve(member, book);
    }

    // --- Getters ---

    public String getName() { return name; }
    public String getAddress() { return address; }
    public BookRepository getBookRepository() { return bookRepository; }
    public MemberRepository getMemberRepository() { return memberRepository; }

    @Override
    public String toString() {
        return name + " (" + address + ") | Books: "
                + bookRepository.getBookCount()
                + " | Members: " + memberRepository.getMemberCount();
    }
}
```

---

## 8. Main Demo

```java
import java.time.LocalDate;
import java.util.List;

public class LibraryManagementDemo {

    public static void main(String[] args) {
        System.out.println("========================================");
        System.out.println("  LIBRARY MANAGEMENT SYSTEM DEMO");
        System.out.println("========================================");
        System.out.println();

        // -------------------------------------------------------
        // SETUP: Create library, racks, books, and members
        // -------------------------------------------------------

        Library library = new Library(
                "City Central Library",
                "123 Main Street, Bangalore");

        // Create racks
        Rack rack1 = new Rack(1, "Aisle A, Shelf 1");
        Rack rack2 = new Rack(2, "Aisle A, Shelf 2");
        Rack rack3 = new Rack(3, "Aisle B, Shelf 1");

        // Create a librarian
        Librarian librarian = new Librarian(
                "M001", "Priya Sharma", "priya@library.com",
                "9876543210", "EMP001");
        library.registerMember(librarian);

        // Create books with metadata
        Book cleanCode = new Book(
                "978-0132350884", "Clean Code",
                "Robert C. Martin", BookCategory.TECHNOLOGY, 2008);
        Book effectiveJava = new Book(
                "978-0134685991", "Effective Java",
                "Joshua Bloch", BookCategory.TECHNOLOGY, 2018);
        Book harryPotter = new Book(
                "978-0439708180", "Harry Potter and the Sorcerer's Stone",
                "J.K. Rowling", BookCategory.FICTION, 1997);
        Book sapiens = new Book(
                "978-0062316097", "Sapiens: A Brief History of Humankind",
                "Yuval Noah Harari", BookCategory.HISTORY, 2015);

        // Add books to library
        librarian.addBook(library, cleanCode);
        librarian.addBook(library, effectiveJava);
        librarian.addBook(library, harryPotter);
        librarian.addBook(library, sapiens);

        // Create physical copies (BookItems) for each book
        BookItem cleanCode1 = new BookItem("CC-001", cleanCode, rack1);
        BookItem cleanCode2 = new BookItem("CC-002", cleanCode, rack1);
        BookItem effectiveJava1 = new BookItem("EJ-001", effectiveJava, rack2);
        BookItem harryPotter1 = new BookItem("HP-001", harryPotter, rack3);
        BookItem sapiens1 = new BookItem("SA-001", sapiens, rack3);

        librarian.addBookItem(library, cleanCode, cleanCode1);
        librarian.addBookItem(library, cleanCode, cleanCode2);
        librarian.addBookItem(library, effectiveJava, effectiveJava1);
        librarian.addBookItem(library, harryPotter, harryPotter1);
        librarian.addBookItem(library, sapiens, sapiens1);

        // Create members
        Member alice = new Member(
                "M002", "Alice Johnson", "alice@email.com", "9876500001");
        Member bob = new Member(
                "M003", "Bob Williams", "bob@email.com", "9876500002");
        Member charlie = new Member(
                "M004", "Charlie Brown", "charlie@email.com", "9876500003");

        librarian.registerMember(library, alice);
        librarian.registerMember(library, bob);
        librarian.registerMember(library, charlie);

        System.out.println();
        System.out.println("Library setup complete: " + library);
        System.out.println();

        // -------------------------------------------------------
        // DEMO 1: Search books using different strategies
        // -------------------------------------------------------

        printSection("DEMO 1: SEARCH BOOKS");

        // Search by title
        System.out.println("--- Search by Title: 'clean' ---");
        List<Book> titleResults = library.searchBooks(
                new SearchByTitle(), "clean");
        titleResults.forEach(b -> System.out.println("  Found: " + b));

        // Search by author
        System.out.println("--- Search by Author: 'Bloch' ---");
        List<Book> authorResults = library.searchBooks(
                new SearchByAuthor(), "Bloch");
        authorResults.forEach(b -> System.out.println("  Found: " + b));

        // Search by ISBN
        System.out.println("--- Search by ISBN: '978-0439708180' ---");
        List<Book> isbnResults = library.searchBooks(
                new SearchByISBN(), "978-0439708180");
        isbnResults.forEach(b -> System.out.println("  Found: " + b));

        // Search by category
        System.out.println("--- Search by Category: 'TECHNOLOGY' ---");
        List<Book> catResults = library.searchBooks(
                new SearchByCategory(), "TECHNOLOGY");
        catResults.forEach(b -> System.out.println("  Found: " + b));

        System.out.println();

        // -------------------------------------------------------
        // DEMO 2: Alice borrows books
        // -------------------------------------------------------

        printSection("DEMO 2: ALICE BORROWS BOOKS");

        library.borrowBook(alice, cleanCode1);
        library.borrowBook(alice, harryPotter1);

        System.out.println();
        System.out.println("Alice's active loans: "
                + alice.getActiveLoanCount());
        alice.getActiveLoans().forEach(
                loan -> System.out.println("  " + loan));

        System.out.println();

        // -------------------------------------------------------
        // DEMO 3: Bob tries to borrow the only copy of
        //         Effective Java, then reserves it
        // -------------------------------------------------------

        printSection("DEMO 3: BOB BORROWS EFFECTIVE JAVA, CHARLIE RESERVES IT");

        // Bob borrows the only copy of Effective Java 30 days ago
        // (simulated past date so we can demo a late return)
        LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);
        library.borrowBook(bob, effectiveJava1, thirtyDaysAgo);

        System.out.println();

        // Charlie wants Effective Java but it is borrowed
        System.out.println("Charlie tries to find Effective Java...");
        BookItem availableCopy = effectiveJava.getAvailableCopy();
        if (availableCopy == null) {
            System.out.println("  No available copies of Effective Java.");
            System.out.println("  Charlie reserves the book instead.");
            library.reserveBook(charlie, effectiveJava);
        }

        System.out.println();

        // -------------------------------------------------------
        // DEMO 4: Bob returns Effective Java LATE -- fine imposed
        //         Observer notifies Charlie that book is available
        // -------------------------------------------------------

        printSection("DEMO 4: BOB RETURNS LATE -- FINE + RESERVATION NOTIFICATION");

        // Bob returns today. The book was due 16 days ago (30 - 14 = 16 days late).
        System.out.println("Bob returns Effective Java today "
                + "(16 days overdue)...");
        System.out.println();

        Fine bobFine = library.returnBook(bob, effectiveJava1);
        // Observer notification for Charlie prints automatically here.

        System.out.println();
        if (bobFine != null) {
            System.out.println("Bob's fine details: " + bobFine);
            System.out.println("Bob's total unpaid fines: Rs "
                    + bob.getTotalUnpaidFines());
        }

        System.out.println();

        // -------------------------------------------------------
        // DEMO 5: Charlie borrows the reserved copy
        // -------------------------------------------------------

        printSection("DEMO 5: CHARLIE BORROWS THE RESERVED COPY");

        System.out.println("Effective Java copy status: "
                + effectiveJava1.getStatus());
        System.out.println("Charlie borrows the reserved copy...");
        library.borrowBook(charlie, effectiveJava1);

        System.out.println();
        System.out.println("Charlie's active loans:");
        charlie.getActiveLoans().forEach(
                loan -> System.out.println("  " + loan));

        System.out.println();

        // -------------------------------------------------------
        // DEMO 6: Bob tries to borrow with unpaid fines -- BLOCKED
        // -------------------------------------------------------

        printSection("DEMO 6: BOB TRIES TO BORROW WITH UNPAID FINES");

        try {
            System.out.println("Bob tries to borrow Sapiens...");
            library.borrowBook(bob, sapiens1);
        } catch (IllegalStateException e) {
            System.out.println("  BLOCKED: " + e.getMessage());
        }

        System.out.println();

        // Bob pays the fine
        System.out.println("Bob pays his fine...");
        bobFine.pay();
        System.out.println("Bob's total unpaid fines after payment: Rs "
                + bob.getTotalUnpaidFines());

        System.out.println();

        // Now Bob can borrow
        System.out.println("Bob borrows Sapiens after paying fine...");
        library.borrowBook(bob, sapiens1);

        System.out.println();

        // -------------------------------------------------------
        // DEMO 7: Alice returns books on time -- no fine
        // -------------------------------------------------------

        printSection("DEMO 7: ALICE RETURNS BOOKS ON TIME");

        Fine aliceFine1 = library.returnBook(alice, cleanCode1);
        Fine aliceFine2 = library.returnBook(alice, harryPotter1);

        System.out.println();
        System.out.println("Alice's fines: "
                + (aliceFine1 == null && aliceFine2 == null
                        ? "None (returned on time)" : "Has fines"));
        System.out.println("Alice's active loans: "
                + alice.getActiveLoanCount());

        System.out.println();

        // -------------------------------------------------------
        // DEMO 8: Verify book statuses after all operations
        // -------------------------------------------------------

        printSection("DEMO 8: FINAL BOOK STATUSES");

        System.out.println(cleanCode1);
        System.out.println(cleanCode2);
        System.out.println(effectiveJava1);
        System.out.println(harryPotter1);
        System.out.println(sapiens1);

        System.out.println();

        // -------------------------------------------------------
        // DEMO 9: Borrow limit enforcement
        // -------------------------------------------------------

        printSection("DEMO 9: BORROW LIMIT ENFORCEMENT (MAX 5)");

        // Alice borrows up to her limit
        System.out.println("Alice borrows 5 books to hit the limit...");
        library.borrowBook(alice, cleanCode1);
        library.borrowBook(alice, cleanCode2);
        library.borrowBook(alice, harryPotter1);

        // Create more books so Alice can reach 5
        Book designPatterns = new Book(
                "978-0201633610", "Design Patterns",
                "Gang of Four", BookCategory.TECHNOLOGY, 1994);
        BookItem dp1 = new BookItem("DP-001", designPatterns, rack2);
        library.addBook(designPatterns);
        library.addBookItem(designPatterns, dp1);
        library.borrowBook(alice, dp1);

        Book refactoring = new Book(
                "978-0134757599", "Refactoring",
                "Martin Fowler", BookCategory.TECHNOLOGY, 2018);
        BookItem rf1 = new BookItem("RF-001", refactoring, rack2);
        library.addBook(refactoring);
        library.addBookItem(refactoring, rf1);
        library.borrowBook(alice, rf1);

        System.out.println();
        System.out.println("Alice's active loans: "
                + alice.getActiveLoanCount() + " (max is 5)");

        // Try to borrow a 6th book
        Book mythicalManMonth = new Book(
                "978-0201835953", "The Mythical Man-Month",
                "Frederick Brooks", BookCategory.TECHNOLOGY, 1975);
        BookItem mm1 = new BookItem("MM-001", mythicalManMonth, rack1);
        library.addBook(mythicalManMonth);
        library.addBookItem(mythicalManMonth, mm1);

        try {
            System.out.println("Alice tries to borrow a 6th book...");
            library.borrowBook(alice, mm1);
        } catch (IllegalStateException e) {
            System.out.println("  BLOCKED: " + e.getMessage());
        }

        System.out.println();

        // -------------------------------------------------------
        // SUMMARY
        // -------------------------------------------------------

        printSection("SUMMARY");
        System.out.println("Library: " + library);
        System.out.println();
        System.out.println("Members:");
        System.out.println("  " + alice + " | Active loans: "
                + alice.getActiveLoanCount()
                + " | Unpaid fines: Rs " + alice.getTotalUnpaidFines());
        System.out.println("  " + bob + " | Active loans: "
                + bob.getActiveLoanCount()
                + " | Unpaid fines: Rs " + bob.getTotalUnpaidFines());
        System.out.println("  " + charlie + " | Active loans: "
                + charlie.getActiveLoanCount()
                + " | Unpaid fines: Rs " + charlie.getTotalUnpaidFines());

        System.out.println();
        System.out.println("========================================");
        System.out.println("  DEMO COMPLETE");
        System.out.println("========================================");
    }

    private static void printSection(String title) {
        System.out.println("----------------------------------------");
        System.out.println("  " + title);
        System.out.println("----------------------------------------");
        System.out.println();
    }
}
```

### Expected Output

```
========================================
  LIBRARY MANAGEMENT SYSTEM DEMO
========================================

LIBRARIAN: Added book "Clean Code" by Robert C. Martin (ISBN: 978-0132350884)
LIBRARIAN: Added book "Effective Java" by Joshua Bloch (ISBN: 978-0134685991)
LIBRARIAN: Added book "Harry Potter and the Sorcerer's Stone" by J.K. Rowling (ISBN: 978-0439708180)
LIBRARIAN: Added book "Sapiens: A Brief History of Humankind" by Yuval Noah Harari (ISBN: 978-0062316097)
LIBRARIAN: Added copy CC-001 for Clean Code
LIBRARIAN: Added copy CC-002 for Clean Code
LIBRARIAN: Added copy EJ-001 for Effective Java
LIBRARIAN: Added copy HP-001 for Harry Potter and the Sorcerer's Stone
LIBRARIAN: Added copy SA-001 for Sapiens: A Brief History of Humankind
LIBRARIAN: Registered member Alice Johnson
LIBRARIAN: Registered member Bob Williams
LIBRARIAN: Registered member Charlie Brown

Library setup complete: City Central Library (123 Main Street, Bangalore) | Books: 4 | Members: 4

----------------------------------------
  DEMO 1: SEARCH BOOKS
----------------------------------------

--- Search by Title: 'clean' ---
  Found: "Clean Code" by Robert C. Martin (ISBN: 978-0132350884)
--- Search by Author: 'Bloch' ---
  Found: "Effective Java" by Joshua Bloch (ISBN: 978-0134685991)
--- Search by ISBN: '978-0439708180' ---
  Found: "Harry Potter and the Sorcerer's Stone" by J.K. Rowling (ISBN: 978-0439708180)
--- Search by Category: 'TECHNOLOGY' ---
  Found: "Clean Code" by Robert C. Martin (ISBN: 978-0132350884)
  Found: "Effective Java" by Joshua Bloch (ISBN: 978-0134685991)

----------------------------------------
  DEMO 2: ALICE BORROWS BOOKS
----------------------------------------

LOAN ISSUED: LOAN-1: Alice Johnson borrowed Clean Code [CC-001] | Due: <today+14> | ACTIVE
LOAN ISSUED: LOAN-2: Alice Johnson borrowed Harry Potter and the Sorcerer's Stone [HP-001] | Due: <today+14> | ACTIVE

Alice's active loans: 2

----------------------------------------
  DEMO 3: BOB BORROWS EFFECTIVE JAVA, CHARLIE RESERVES IT
----------------------------------------

LOAN ISSUED: LOAN-3: Bob Williams borrowed Effective Java [EJ-001] | Due: <30daysAgo+14> | ACTIVE

Charlie tries to find Effective Java...
  No available copies of Effective Java.
  Charlie reserves the book instead.
RESERVATION CREATED: RES-1: Charlie Brown reserved Effective Java | PENDING

----------------------------------------
  DEMO 4: BOB RETURNS LATE -- FINE + RESERVATION NOTIFICATION
----------------------------------------

Bob returns Effective Java today (16 days overdue)...

FINE IMPOSED: FINE-1: Rs 160 | UNPAID | For: LOAN-3
RESERVATION FULFILLED: RES-1: Charlie Brown reserved Effective Java | FULFILLED

=================================================
  NOTIFICATION to Charlie Brown:
  Your reserved book "Effective Java" is now available!
  Copy barcode: EJ-001
  Rack location: Rack-2 (Aisle A, Shelf 2)
  Please pick it up within 3 days.
=================================================

BOOK RETURNED: Bob Williams returned Effective Java [EJ-001] | Fine: Rs 160

Bob's fine details: FINE-1: Rs 160 | UNPAID | For: LOAN-3
Bob's total unpaid fines: Rs 160

----------------------------------------
  DEMO 5: CHARLIE BORROWS THE RESERVED COPY
----------------------------------------

Effective Java copy status: RESERVED
Charlie borrows the reserved copy...
LOAN ISSUED: LOAN-4: Charlie Brown borrowed Effective Java [EJ-001] | Due: <today+14> | ACTIVE

Charlie's active loans:
  LOAN-4: Charlie Brown borrowed Effective Java [EJ-001] | Due: <today+14> | ACTIVE

----------------------------------------
  DEMO 6: BOB TRIES TO BORROW WITH UNPAID FINES
----------------------------------------

Bob tries to borrow Sapiens...
  BLOCKED: Member Bob Williams has unpaid fines of Rs 160. Please clear fines before borrowing.

Bob pays his fine...
Fine FINE-1 of Rs 160 has been paid.
Bob's total unpaid fines after payment: Rs 0

Bob borrows Sapiens after paying fine...
LOAN ISSUED: LOAN-5: Bob Williams borrowed Sapiens: A Brief History of Humankind [SA-001] | Due: <today+14> | ACTIVE

----------------------------------------
  DEMO 7: ALICE RETURNS BOOKS ON TIME
----------------------------------------

BOOK RETURNED: Alice Johnson returned Clean Code [CC-001] | No fine
BOOK RETURNED: Alice Johnson returned Harry Potter and the Sorcerer's Stone [HP-001] | No fine

Alice's fines: None (returned on time)
Alice's active loans: 0

----------------------------------------
  DEMO 8: FINAL BOOK STATUSES
----------------------------------------

[CC-001] Clean Code | Status: AVAILABLE | Rack: Rack-1 (Aisle A, Shelf 1)
[CC-002] Clean Code | Status: AVAILABLE | Rack: Rack-1 (Aisle A, Shelf 1)
[EJ-001] Effective Java | Status: BORROWED | Rack: Rack-2 (Aisle A, Shelf 2)
[HP-001] Harry Potter and the Sorcerer's Stone | Status: AVAILABLE | Rack: Rack-3 (Aisle B, Shelf 1)
[SA-001] Sapiens: A Brief History of Humankind | Status: BORROWED | Rack: Rack-3 (Aisle B, Shelf 1)

----------------------------------------
  DEMO 9: BORROW LIMIT ENFORCEMENT (MAX 5)
----------------------------------------

Alice borrows 5 books to hit the limit...
  (5 loan issued messages)

Alice's active loans: 5 (max is 5)
Alice tries to borrow a 6th book...
  BLOCKED: Member Alice Johnson has reached the borrow limit (max 5 books).

----------------------------------------
  SUMMARY
----------------------------------------

Library: City Central Library (123 Main Street, Bangalore) | Books: 7 | Members: 4

Members:
  Member[M002] Alice Johnson (alice@email.com) | Active loans: 5 | Unpaid fines: Rs 0
  Member[M003] Bob Williams (bob@email.com) | Active loans: 1 | Unpaid fines: Rs 0
  Member[M004] Charlie Brown (charlie@email.com) | Active loans: 1 | Unpaid fines: Rs 0

========================================
  DEMO COMPLETE
========================================
```
