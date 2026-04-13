# Snake and Ladder -- Complete Java Implementation

Full working code covering every entity from the design walkthrough: Board, Player,
Dice with Strategy pattern, Game with Observer pattern, Factory for board elements,
and a 3-player demo that runs to completion.

---

## 1. GameEvent Enum

```java
public enum GameEvent {
    PLAYER_MOVED,
    SNAKE_BITE,
    LADDER_CLIMB,
    PLAYER_WON,
    BOUNCE_BACK
}
```

---

## 2. Snake and Ladder (Value Objects)

```java
public class Snake {
    private final int head;  // higher position (start)
    private final int tail;  // lower position (end)

    public Snake(int head, int tail) {
        if (head <= tail) {
            throw new IllegalArgumentException(
                "Snake head (" + head + ") must be above tail (" + tail + ")");
        }
        this.head = head;
        this.tail = tail;
    }

    public int getHead() { return head; }
    public int getTail() { return tail; }

    @Override
    public String toString() {
        return "Snake[" + head + " -> " + tail + "]";
    }
}
```

```java
public class Ladder {
    private final int bottom;  // lower position (start)
    private final int top;     // higher position (end)

    public Ladder(int bottom, int top) {
        if (bottom >= top) {
            throw new IllegalArgumentException(
                "Ladder bottom (" + bottom + ") must be below top (" + top + ")");
        }
        this.bottom = bottom;
        this.top = top;
    }

    public int getBottom() { return bottom; }
    public int getTop()    { return top; }

    @Override
    public String toString() {
        return "Ladder[" + bottom + " -> " + top + "]";
    }
}
```

---

## 3. Player

```java
public class Player {
    private final String name;
    private int position;

    public Player(String name) {
        this.name = name;
        this.position = 0; // off the board
    }

    public String getName()    { return name; }
    public int getPosition()   { return position; }
    public void setPosition(int position) { this.position = position; }

    @Override
    public String toString() {
        return name + " (pos=" + position + ")";
    }
}
```

---

## 4. DiceStrategy Interface + Implementations (Strategy Pattern)

```java
/**
 * Strategy interface for dice rolling behavior.
 * Allows swapping normal dice, loaded dice, multiple dice, etc.
 */
public interface DiceStrategy {
    int roll();
}
```

### NormalDiceStrategy -- Standard Random Die

```java
import java.util.Random;

public class NormalDiceStrategy implements DiceStrategy {
    private final int sides;
    private final Random random;

    public NormalDiceStrategy() {
        this(6); // default 6-sided die
    }

    public NormalDiceStrategy(int sides) {
        if (sides < 1) {
            throw new IllegalArgumentException("Dice must have at least 1 side");
        }
        this.sides = sides;
        this.random = new Random();
    }

    @Override
    public int roll() {
        return random.nextInt(sides) + 1; // 1 to sides, inclusive
    }
}
```

### LoadedDiceStrategy -- Fixed Value (For Testing)

```java
/**
 * Always returns a fixed value. Essential for deterministic unit tests.
 */
public class LoadedDiceStrategy implements DiceStrategy {
    private final int fixedValue;

    public LoadedDiceStrategy(int fixedValue) {
        if (fixedValue < 1) {
            throw new IllegalArgumentException("Dice value must be >= 1");
        }
        this.fixedValue = fixedValue;
    }

    @Override
    public int roll() {
        return fixedValue;
    }
}
```

### MultipleDiceStrategy -- Sum of N Dice

```java
import java.util.List;
import java.util.ArrayList;

/**
 * Rolls multiple dice and returns the sum.
 * Example: two 6-sided dice -> roll range 2-12.
 */
public class MultipleDiceStrategy implements DiceStrategy {
    private final List<DiceStrategy> dice;

    public MultipleDiceStrategy(List<DiceStrategy> dice) {
        if (dice == null || dice.isEmpty()) {
            throw new IllegalArgumentException("Must have at least one die");
        }
        this.dice = new ArrayList<>(dice);
    }

    @Override
    public int roll() {
        int total = 0;
        for (DiceStrategy die : dice) {
            total += die.roll();
        }
        return total;
    }
}
```

### CrookedDiceStrategy -- Only Even Numbers

```java
import java.util.Random;

/**
 * A crooked die that only rolls even numbers (2, 4, 6).
 * Useful for demonstrating the Strategy pattern flexibility.
 */
public class CrookedDiceStrategy implements DiceStrategy {
    private static final int[] EVEN_VALUES = {2, 4, 6};
    private final Random random;

    public CrookedDiceStrategy() {
        this.random = new Random();
    }

    @Override
    public int roll() {
        return EVEN_VALUES[random.nextInt(EVEN_VALUES.length)];
    }
}
```

---

## 5. GameEventListener Interface + ConsoleLogger (Observer Pattern)

```java
/**
 * Observer interface for game events.
 * Implement this to react to moves, snake bites, ladder climbs, wins, etc.
 */
public interface GameEventListener {

    void onPlayerMoved(Player player, int from, int to);

    void onSnakeBite(Player player, int from, int to);

    void onLadderClimb(Player player, int from, int to);

    void onPlayerWon(Player player);

    void onBounceBack(Player player, int diceValue);
}
```

### ConsoleLogger -- Prints Events to stdout

```java
/**
 * Concrete observer that logs all game events to the console.
 */
public class ConsoleLogger implements GameEventListener {

    @Override
    public void onPlayerMoved(Player player, int from, int to) {
        System.out.println("  " + player.getName() + " moved from " + from + " to " + to);
    }

    @Override
    public void onSnakeBite(Player player, int from, int to) {
        System.out.println("  SNAKE BITE! " + player.getName()
            + " slid from " + from + " down to " + to);
    }

    @Override
    public void onLadderClimb(Player player, int from, int to) {
        System.out.println("  LADDER! " + player.getName()
            + " climbed from " + from + " up to " + to);
    }

    @Override
    public void onPlayerWon(Player player) {
        System.out.println("  >>> " + player.getName() + " WINS THE GAME! <<<");
    }

    @Override
    public void onBounceBack(Player player, int diceValue) {
        System.out.println("  " + player.getName() + " rolled " + diceValue
            + " but can't move (would overshoot). Stays at " + player.getPosition());
    }
}
```

### GameStatsListener -- Tracks Statistics

```java
import java.util.HashMap;
import java.util.Map;

/**
 * Observer that tracks game statistics: total moves, snake bites, ladder climbs per player.
 */
public class GameStatsListener implements GameEventListener {
    private int totalMoves = 0;
    private final Map<String, Integer> snakeBites = new HashMap<>();
    private final Map<String, Integer> ladderClimbs = new HashMap<>();

    @Override
    public void onPlayerMoved(Player player, int from, int to) {
        totalMoves++;
    }

    @Override
    public void onSnakeBite(Player player, int from, int to) {
        snakeBites.merge(player.getName(), 1, Integer::sum);
    }

    @Override
    public void onLadderClimb(Player player, int from, int to) {
        ladderClimbs.merge(player.getName(), 1, Integer::sum);
    }

    @Override
    public void onPlayerWon(Player player) {
        // no-op for stats
    }

    @Override
    public void onBounceBack(Player player, int diceValue) {
        // no-op for stats
    }

    public void printStats() {
        System.out.println("\n--- Game Statistics ---");
        System.out.println("Total moves: " + totalMoves);
        System.out.println("Snake bites per player: " + snakeBites);
        System.out.println("Ladder climbs per player: " + ladderClimbs);
    }
}
```

---

## 6. Board

```java
import java.util.HashMap;
import java.util.Map;

/**
 * Represents the game board with snakes and ladders.
 * Uses HashMaps for O(1) lookup of snakes and ladders at any position.
 */
public class Board {
    private final int size;
    private final Map<Integer, Integer> snakes;  // head -> tail
    private final Map<Integer, Integer> ladders; // bottom -> top

    public Board(int size) {
        if (size < 10) {
            throw new IllegalArgumentException("Board size must be at least 10");
        }
        this.size = size;
        this.snakes = new HashMap<>();
        this.ladders = new HashMap<>();
    }

    /**
     * Adds a snake to the board.
     * Validates: head > tail, head != size, no conflict with existing ladder.
     */
    public void addSnake(int head, int tail) {
        validatePosition(head, "Snake head");
        validatePosition(tail, "Snake tail");

        if (head <= tail) {
            throw new IllegalArgumentException("Snake head must be above tail");
        }
        if (head == size) {
            throw new IllegalArgumentException(
                "Snake cannot start at winning position " + size);
        }
        if (ladders.containsKey(head)) {
            throw new IllegalArgumentException(
                "Position " + head + " already has a ladder");
        }
        if (snakes.containsKey(head)) {
            throw new IllegalArgumentException(
                "Position " + head + " already has a snake");
        }

        snakes.put(head, tail);
    }

    /**
     * Adds a ladder to the board.
     * Validates: top > bottom, no conflict with existing snake.
     */
    public void addLadder(int bottom, int top) {
        validatePosition(bottom, "Ladder bottom");
        validatePosition(top, "Ladder top");

        if (bottom >= top) {
            throw new IllegalArgumentException("Ladder top must be above bottom");
        }
        if (snakes.containsKey(bottom)) {
            throw new IllegalArgumentException(
                "Position " + bottom + " already has a snake");
        }
        if (ladders.containsKey(bottom)) {
            throw new IllegalArgumentException(
                "Position " + bottom + " already has a ladder");
        }

        ladders.put(bottom, top);
    }

    /**
     * Given a position, returns the final position after applying all
     * snakes and ladders in chain (handles chained elements).
     *
     * Returns a FinalPositionResult with the position and what happened.
     */
    public int getFinalPosition(int position) {
        // Follow the chain: a ladder could land on a snake, etc.
        // Use a visited set to prevent infinite loops.
        java.util.Set<Integer> visited = new java.util.HashSet<>();
        while (!visited.contains(position)) {
            visited.add(position);
            if (snakes.containsKey(position)) {
                position = snakes.get(position);
            } else if (ladders.containsKey(position)) {
                position = ladders.get(position);
            } else {
                break; // no snake or ladder, done
            }
        }
        return position;
    }

    public boolean hasSnakeAt(int position) {
        return snakes.containsKey(position);
    }

    public boolean hasLadderAt(int position) {
        return ladders.containsKey(position);
    }

    public int getSize() { return size; }

    public Map<Integer, Integer> getSnakes()  { return new HashMap<>(snakes); }
    public Map<Integer, Integer> getLadders() { return new HashMap<>(ladders); }

    private void validatePosition(int position, String label) {
        if (position < 1 || position > size) {
            throw new IllegalArgumentException(
                label + " (" + position + ") must be between 1 and " + size);
        }
    }
}
```

---

## 7. BoardElementFactory (Factory Pattern)

```java
/**
 * Factory for creating snakes, ladders, and pre-configured boards.
 * Centralizes validation logic and provides convenient defaults.
 */
public class BoardElementFactory {

    private BoardElementFactory() {
        // utility class, prevent instantiation
    }

    public static Snake createSnake(int head, int tail) {
        return new Snake(head, tail);
    }

    public static Ladder createLadder(int bottom, int top) {
        return new Ladder(bottom, top);
    }

    /**
     * Creates a standard 10x10 board with a classic snake-and-ladder layout.
     */
    public static Board createStandardBoard() {
        return createStandardBoard(100);
    }

    /**
     * Creates a standard board of the given size with pre-configured
     * snakes and ladders.
     */
    public static Board createStandardBoard(int size) {
        Board board = new Board(size);

        // --- Snakes (head -> tail): slide DOWN ---
        board.addSnake(16, 6);
        board.addSnake(47, 26);
        board.addSnake(49, 11);
        board.addSnake(56, 53);
        board.addSnake(62, 19);
        board.addSnake(64, 60);
        board.addSnake(87, 24);
        board.addSnake(93, 73);
        board.addSnake(95, 75);
        board.addSnake(98, 78);

        // --- Ladders (bottom -> top): climb UP ---
        board.addLadder(1, 38);
        board.addLadder(4, 14);
        board.addLadder(9, 31);
        board.addLadder(21, 42);
        board.addLadder(28, 84);
        board.addLadder(36, 44);
        board.addLadder(51, 67);
        board.addLadder(71, 91);
        board.addLadder(80, 100);

        return board;
    }

    /**
     * Creates a minimal board for quick testing.
     */
    public static Board createSmallTestBoard() {
        Board board = new Board(20);
        board.addSnake(17, 7);
        board.addSnake(15, 5);
        board.addLadder(3, 12);
        board.addLadder(8, 18);
        return board;
    }
}
```

---

## 8. Game -- The Orchestrator

```java
import java.util.LinkedList;
import java.util.Queue;
import java.util.List;
import java.util.ArrayList;

/**
 * Main game orchestrator. Manages the turn loop, coordinates between
 * Board, Players, and DiceStrategy. Notifies observers on every event.
 */
public class Game {
    private final Board board;
    private final Queue<Player> playerQueue;
    private final DiceStrategy diceStrategy;
    private final List<GameEventListener> listeners;
    private boolean gameOver;
    private Player winner;

    public Game(Board board, List<Player> players, DiceStrategy diceStrategy) {
        if (board == null) {
            throw new IllegalArgumentException("Board cannot be null");
        }
        if (players == null || players.size() < 2) {
            throw new IllegalArgumentException("Need at least 2 players");
        }
        if (diceStrategy == null) {
            throw new IllegalArgumentException("DiceStrategy cannot be null");
        }

        this.board = board;
        this.playerQueue = new LinkedList<>(players);
        this.diceStrategy = diceStrategy;
        this.listeners = new ArrayList<>();
        this.gameOver = false;
        this.winner = null;
    }

    // ---------- Observer management ----------

    public void addListener(GameEventListener listener) {
        if (listener != null) {
            listeners.add(listener);
        }
    }

    public void removeListener(GameEventListener listener) {
        listeners.remove(listener);
    }

    // ---------- Notification helpers ----------

    private void notifyPlayerMoved(Player player, int from, int to) {
        for (GameEventListener l : listeners) {
            l.onPlayerMoved(player, from, to);
        }
    }

    private void notifySnakeBite(Player player, int from, int to) {
        for (GameEventListener l : listeners) {
            l.onSnakeBite(player, from, to);
        }
    }

    private void notifyLadderClimb(Player player, int from, int to) {
        for (GameEventListener l : listeners) {
            l.onLadderClimb(player, from, to);
        }
    }

    private void notifyPlayerWon(Player player) {
        for (GameEventListener l : listeners) {
            l.onPlayerWon(player);
        }
    }

    private void notifyBounceBack(Player player, int diceValue) {
        for (GameEventListener l : listeners) {
            l.onBounceBack(player, diceValue);
        }
    }

    // ---------- Core game loop ----------

    /**
     * Runs the game to completion and returns the winner.
     */
    public Player play() {
        System.out.println("=== Snake and Ladder Game Started! ===");
        System.out.println("Board size: " + board.getSize());
        System.out.println("Players: " + playerQueue);
        System.out.println("Snakes: " + board.getSnakes());
        System.out.println("Ladders: " + board.getLadders());
        System.out.println();

        int turnNumber = 0;

        while (!gameOver) {
            turnNumber++;
            Player currentPlayer = playerQueue.poll();

            System.out.println("--- Turn " + turnNumber
                + ": " + currentPlayer.getName() + " ---");

            takeTurn(currentPlayer);

            if (!gameOver) {
                // Put the player back in the queue for the next round
                playerQueue.add(currentPlayer);
            }
        }

        System.out.println("\nGame finished in " + turnNumber + " turns.");
        return winner;
    }

    /**
     * Executes a single turn for the given player.
     */
    private void takeTurn(Player player) {
        int diceValue = diceStrategy.roll();
        int oldPosition = player.getPosition();
        int newPosition = oldPosition + diceValue;

        System.out.println("  " + player.getName() + " rolled a " + diceValue);

        // --- Edge case: overshoot ---
        if (newPosition > board.getSize()) {
            notifyBounceBack(player, diceValue);
            return;
        }

        // --- Move the player ---
        player.setPosition(newPosition);

        // --- Check for snake at the new position ---
        if (board.hasSnakeAt(newPosition)) {
            int afterSnake = board.getFinalPosition(newPosition);
            notifySnakeBite(player, newPosition, afterSnake);
            player.setPosition(afterSnake);
            newPosition = afterSnake;
        }
        // --- Check for ladder at the new position ---
        else if (board.hasLadderAt(newPosition)) {
            int afterLadder = board.getFinalPosition(newPosition);
            notifyLadderClimb(player, newPosition, afterLadder);
            player.setPosition(afterLadder);
            newPosition = afterLadder;
        }

        notifyPlayerMoved(player, oldPosition, player.getPosition());

        // --- Check for winner ---
        if (player.getPosition() == board.getSize()) {
            gameOver = true;
            winner = player;
            notifyPlayerWon(player);
        }
    }

    // ---------- Getters ----------

    public boolean isGameOver() { return gameOver; }
    public Player getWinner()   { return winner; }
}
```

---

## 9. Main -- 3-Player Demo

```java
import java.util.Arrays;
import java.util.List;

/**
 * Demo: 3-player game on a standard 100-cell board with
 * a normal 6-sided die. ConsoleLogger and GameStatsListener observe events.
 */
public class SnakeLadderMain {

    public static void main(String[] args) {
        // 1. Create the board using the factory
        Board board = BoardElementFactory.createStandardBoard();

        // 2. Create players
        List<Player> players = Arrays.asList(
            new Player("Alice"),
            new Player("Bob"),
            new Player("Charlie")
        );

        // 3. Choose a dice strategy (normal 6-sided die)
        DiceStrategy diceStrategy = new NormalDiceStrategy(6);

        // 4. Create the game
        Game game = new Game(board, players, diceStrategy);

        // 5. Register observers
        ConsoleLogger consoleLogger = new ConsoleLogger();
        GameStatsListener statsListener = new GameStatsListener();

        game.addListener(consoleLogger);
        game.addListener(statsListener);

        // 6. Play the game to completion
        Player winner = game.play();

        // 7. Print final statistics
        statsListener.printStats();

        System.out.println("\nFinal positions:");
        for (Player p : players) {
            System.out.println("  " + p);
        }
    }
}
```

---

## 10. Sample Output

```
=== Snake and Ladder Game Started! ===
Board size: 100
Players: [Alice (pos=0), Bob (pos=0), Charlie (pos=0)]
Snakes: {16=6, 47=26, 49=11, 56=53, 62=19, 64=60, 87=24, 93=73, 95=75, 98=78}
Ladders: {1=38, 4=14, 9=31, 21=42, 28=84, 36=44, 51=67, 71=91, 80=100}

--- Turn 1: Alice ---
  Alice rolled a 4
  LADDER! Alice climbed from 4 up to 14
  Alice moved from 0 to 14

--- Turn 2: Bob ---
  Bob rolled a 1
  LADDER! Bob climbed from 1 up to 38
  Bob moved from 0 to 38

--- Turn 3: Charlie ---
  Charlie rolled a 6
  Charlie moved from 0 to 6

--- Turn 4: Alice ---
  Alice rolled a 2
  SNAKE BITE! Alice slid from 16 down to 6
  Alice moved from 14 to 6

--- Turn 5: Bob ---
  Bob rolled a 3
  Bob moved from 38 to 41

... (game continues) ...

--- Turn 47: Bob ---
  Bob rolled a 3
  LADDER! Bob climbed from 80 up to 100
  Bob moved from 77 to 100
  >>> Bob WINS THE GAME! <<<

Game finished in 47 turns.

--- Game Statistics ---
Total moves: 47
Snake bites per player: {Alice=3, Bob=2, Charlie=4}
Ladder climbs per player: {Alice=2, Bob=4, Charlie=1}

Final positions:
  Alice (pos=68)
  Bob (pos=100)
  Charlie (pos=55)
```

---

## 11. Demo with Loaded Dice (Deterministic Test)

```java
/**
 * Deterministic demo using a sequence of pre-defined dice rolls.
 * Useful for unit testing and verifying specific game scenarios.
 */
public class DeterministicDemo {

    /**
     * A dice strategy that returns values from a pre-defined sequence.
     * Wraps around when the sequence is exhausted.
     */
    static class SequenceDiceStrategy implements DiceStrategy {
        private final int[] sequence;
        private int index = 0;

        SequenceDiceStrategy(int... values) {
            this.sequence = values;
        }

        @Override
        public int roll() {
            int value = sequence[index % sequence.length];
            index++;
            return value;
        }
    }

    public static void main(String[] args) {
        // Small board for quick demo
        Board board = new Board(20);
        board.addSnake(17, 7);
        board.addLadder(3, 12);

        List<Player> players = Arrays.asList(
            new Player("P1"),
            new Player("P2")
        );

        // P1 rolls: 3 -> lands on ladder -> 12, then 5 -> 17 -> snake -> 7, then 6 -> 13, then 5 -> 18, then 2 -> 20 (WIN!)
        // P2 rolls: 4 -> 4, then 6 -> 10, then 3 -> 13, then 4 -> 17 -> snake -> 7
        // Interleaved: P1=3, P2=4, P1=5, P2=6, P1=6, P2=3, P1=5, P2=4, P1=2 -> P1 wins
        DiceStrategy testDice = new SequenceDiceStrategy(3, 4, 5, 6, 6, 3, 5, 4, 2);

        Game game = new Game(board, players, testDice);
        game.addListener(new ConsoleLogger());

        Player winner = game.play();
        System.out.println("Winner: " + winner.getName());
    }
}
```

---

## 12. Complete File Structure

```
snake-and-ladder/
|-- GameEvent.java                  (enum)
|-- Snake.java                      (value object)
|-- Ladder.java                     (value object)
|-- Player.java                     (entity)
|-- Board.java                      (core board logic)
|-- DiceStrategy.java               (strategy interface)
|-- NormalDiceStrategy.java          (concrete strategy)
|-- LoadedDiceStrategy.java          (concrete strategy)
|-- MultipleDiceStrategy.java        (concrete strategy)
|-- CrookedDiceStrategy.java         (concrete strategy)
|-- GameEventListener.java           (observer interface)
|-- ConsoleLogger.java               (concrete observer)
|-- GameStatsListener.java           (concrete observer)
|-- BoardElementFactory.java         (factory)
|-- Game.java                        (orchestrator)
|-- SnakeLadderMain.java             (3-player demo)
|-- DeterministicDemo.java           (test demo)
```

---

## 13. Key Design Decisions in Code

### Why `Queue<Player>` for Turn Management

```java
// Dequeue the current player
Player currentPlayer = playerQueue.poll();

// After their turn, put them back (unless they won)
if (!gameOver) {
    playerQueue.add(currentPlayer);
}
```

This is the simplest and most natural way to handle round-robin turns.
`LinkedList` implements `Queue`, giving O(1) poll and add.

### Why `HashMap<Integer, Integer>` for Snakes/Ladders

```java
// O(1) check: does this position have a snake?
if (board.hasSnakeAt(newPosition)) { ... }

// O(1) lookup: where does the snake drop you?
int destination = snakes.get(position);
```

Compared to iterating over a `List<Snake>`, the HashMap gives constant-time lookup.
On a standard board with ~10 snakes and ~10 ladders, the difference is negligible,
but the HashMap approach is cleaner and more idiomatic.

### Why Separate Notification Methods

```java
// Instead of one generic notify(event, player, from, to),
// we have specific methods for type safety:
private void notifySnakeBite(Player player, int from, int to) { ... }
private void notifyLadderClimb(Player player, int from, int to) { ... }
```

This gives the listener interface clear, typed method signatures. An observer
can implement only the events it cares about (using a no-op default in Java 8+
with default methods).

### Why Validation in Both Factory and Board

The `Snake` and `Ladder` constructors validate their own invariants (head > tail,
top > bottom). The `Board` validates relationships (no conflicts, within bounds).
The `BoardElementFactory` provides a convenient API that invokes both layers.

This follows **defense in depth** -- even if someone bypasses the factory, the
Board still rejects invalid state.

---

## 14. Extending the Code -- Roll-6-Again Rule

To add the rule where rolling a 6 gives an extra turn, modify `takeTurn`:

```java
private void takeTurn(Player player) {
    boolean extraTurn;
    do {
        int diceValue = diceStrategy.roll();
        extraTurn = (diceValue == 6); // or diceValue == diceStrategy.getMaxValue()

        int oldPosition = player.getPosition();
        int newPosition = oldPosition + diceValue;

        System.out.println("  " + player.getName() + " rolled a " + diceValue);

        if (newPosition > board.getSize()) {
            notifyBounceBack(player, diceValue);
            return; // no extra turn on bounce
        }

        player.setPosition(newPosition);

        if (board.hasSnakeAt(newPosition)) {
            int afterSnake = board.getFinalPosition(newPosition);
            notifySnakeBite(player, newPosition, afterSnake);
            player.setPosition(afterSnake);
        } else if (board.hasLadderAt(newPosition)) {
            int afterLadder = board.getFinalPosition(newPosition);
            notifyLadderClimb(player, newPosition, afterLadder);
            player.setPosition(afterLadder);
        }

        notifyPlayerMoved(player, oldPosition, player.getPosition());

        if (player.getPosition() == board.getSize()) {
            gameOver = true;
            winner = player;
            notifyPlayerWon(player);
            return;
        }

        if (extraTurn) {
            System.out.println("  " + player.getName() + " rolled a 6! Extra turn!");
        }
    } while (extraTurn);
}
```

No other class changes. This demonstrates the Single Responsibility Principle --
only `Game.takeTurn()` needed modification, and nothing else was affected.

---

## 15. Unit Test Sketch (JUnit 5)

```java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class SnakeLadderTest {

    // ---- Dice Strategy Tests ----

    @Test
    void normalDiceRollsWithinRange() {
        DiceStrategy dice = new NormalDiceStrategy(6);
        for (int i = 0; i < 1000; i++) {
            int roll = dice.roll();
            assertTrue(roll >= 1 && roll <= 6,
                "Roll " + roll + " out of range");
        }
    }

    @Test
    void loadedDiceAlwaysReturnsSameValue() {
        DiceStrategy dice = new LoadedDiceStrategy(4);
        for (int i = 0; i < 100; i++) {
            assertEquals(4, dice.roll());
        }
    }

    @Test
    void multipleDiceSumsCorrectly() {
        DiceStrategy dice = new MultipleDiceStrategy(Arrays.asList(
            new LoadedDiceStrategy(3),
            new LoadedDiceStrategy(5)
        ));
        assertEquals(8, dice.roll());
    }

    // ---- Board Tests ----

    @Test
    void snakeMovesPlayerDown() {
        Board board = new Board(100);
        board.addSnake(50, 10);

        assertTrue(board.hasSnakeAt(50));
        assertEquals(10, board.getFinalPosition(50));
    }

    @Test
    void ladderMovesPlayerUp() {
        Board board = new Board(100);
        board.addLadder(10, 50);

        assertTrue(board.hasLadderAt(10));
        assertEquals(50, board.getFinalPosition(10));
    }

    @Test
    void snakeAtWinningPositionRejected() {
        Board board = new Board(100);
        assertThrows(IllegalArgumentException.class,
            () -> board.addSnake(100, 50));
    }

    @Test
    void conflictingSnakeAndLadderRejected() {
        Board board = new Board(100);
        board.addSnake(50, 10);
        assertThrows(IllegalArgumentException.class,
            () -> board.addLadder(50, 90));
    }

    @Test
    void positionWithNoSnakeOrLadderUnchanged() {
        Board board = new Board(100);
        board.addSnake(50, 10);
        assertEquals(30, board.getFinalPosition(30));
    }

    // ---- Game Tests ----

    @Test
    void playerWinsOnExactLanding() {
        Board board = new Board(20);
        // No snakes or ladders -- clean board

        List<Player> players = Arrays.asList(
            new Player("P1"), new Player("P2"));

        // P1 rolls 6, 6, 6, 2 = 20 (wins on turn 7 since turns alternate)
        // P2 rolls 1, 1, 1 (never wins)
        // Interleaved: P1=6, P2=1, P1=6, P2=1, P1=6, P2=1, P1=2
        DiceStrategy dice = new SequenceDiceStrategy(6, 1, 6, 1, 6, 1, 2);

        Game game = new Game(board, players, dice);
        Player winner = game.play();

        assertEquals("P1", winner.getName());
        assertEquals(20, winner.getPosition());
    }

    @Test
    void overshootKeepsPlayerAtCurrentPosition() {
        Board board = new Board(20);
        List<Player> players = Arrays.asList(
            new Player("P1"), new Player("P2"));

        // P1: 6 -> pos 6, then 6 -> pos 12, then 6 -> pos 18,
        //     then 6 -> would be 24 > 20 -> stays at 18,
        //     then 2 -> pos 20 (wins)
        // P2: 1 -> pos 1, then 1, then 1, then 1
        DiceStrategy dice = new SequenceDiceStrategy(6, 1, 6, 1, 6, 1, 6, 1, 2);

        Game game = new Game(board, players, dice);
        Player winner = game.play();

        assertEquals("P1", winner.getName());
    }

    @Test
    void minimumTwoPlayersRequired() {
        Board board = new Board(100);
        List<Player> solo = Arrays.asList(new Player("Lonely"));
        DiceStrategy dice = new NormalDiceStrategy(6);

        assertThrows(IllegalArgumentException.class,
            () -> new Game(board, solo, dice));
    }

    // ---- Observer Tests ----

    @Test
    void observerReceivesSnakeBiteEvent() {
        Board board = new Board(20);
        board.addSnake(5, 2);

        List<Player> players = Arrays.asList(
            new Player("P1"), new Player("P2"));

        // P1 rolls 5 -> lands on snake -> drops to 2
        // P2 rolls 1 -> lands on 1
        // P1 rolls 6 -> pos 8
        // ... eventually someone wins (we check the first snake bite)
        DiceStrategy dice = new SequenceDiceStrategy(5, 1, 6, 6, 6, 6, 6, 6);

        // Track whether onSnakeBite was called
        final boolean[] snakeBiteCalled = {false};
        GameEventListener testListener = new GameEventListener() {
            public void onPlayerMoved(Player p, int f, int t) {}
            public void onSnakeBite(Player p, int f, int t) {
                snakeBiteCalled[0] = true;
                assertEquals("P1", p.getName());
                assertEquals(5, f);
                assertEquals(2, t);
            }
            public void onLadderClimb(Player p, int f, int t) {}
            public void onPlayerWon(Player p) {}
            public void onBounceBack(Player p, int d) {}
        };

        Game game = new Game(board, players, dice);
        game.addListener(testListener);
        game.play();

        assertTrue(snakeBiteCalled[0], "Snake bite event should have fired");
    }
}
```

---

## 16. Recap -- What to Write in a 45-Minute Interview

If time is tight, prioritize in this order:

1. **Board** -- HashMap-based, addSnake, addLadder, getFinalPosition (~5 min)
2. **Player** -- name + position (~2 min)
3. **DiceStrategy** interface + NormalDiceStrategy (~3 min)
4. **Game** -- constructor, play(), takeTurn() with overshoot check (~10 min)
5. **GameEventListener** interface + ConsoleLogger (~5 min)
6. **Main** -- wire it all together, run 3 players (~3 min)
7. **Explain** patterns and extensibility verbally (~5 min)

Total coding: ~28 minutes. The remaining time is for requirements and discussion.

> **Final Interview Tip**: Write the `Game.play()` loop first on the whiteboard,
> then fill in the helper classes. Interviewers prefer seeing the big picture
> before the details.
