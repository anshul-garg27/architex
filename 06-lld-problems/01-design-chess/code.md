# Chess Game -- Complete Java Implementation

> All classes in a single file for interview convenience.
> Compiles and runs with: `javac ChessGame.java && java ChessGame`

---

## Full Source Code

```java
import java.util.ArrayList;
import java.util.List;

// ============================================================================
// ENUMS
// ============================================================================

enum Color {
    WHITE, BLACK;

    public Color opposite() {
        return this == WHITE ? BLACK : WHITE;
    }
}

enum PieceType {
    KING, QUEEN, ROOK, BISHOP, KNIGHT, PAWN
}

enum GameStatus {
    ACTIVE, CHECK, CHECKMATE, STALEMATE, RESIGNED, DRAW
}

// ============================================================================
// POSITION -- immutable value object
// ============================================================================

class Position {
    private final int row;
    private final int col;

    public Position(int row, int col) {
        this.row = row;
        this.col = col;
    }

    public int getRow() { return row; }
    public int getCol() { return col; }

    public boolean isValid() {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Position)) return false;
        Position p = (Position) o;
        return row == p.row && col == p.col;
    }

    @Override
    public int hashCode() {
        return 31 * row + col;
    }

    @Override
    public String toString() {
        char file = (char) ('a' + col);
        int rank = 8 - row;
        return "" + file + rank;
    }
}

// ============================================================================
// PIECE -- abstract base class (Template Method pattern)
// ============================================================================

abstract class Piece {
    protected Color color;
    protected PieceType type;
    protected boolean hasMoved;

    public Piece(Color color, PieceType type) {
        this.color = color;
        this.type = type;
        this.hasMoved = false;
    }

    public Color getColor() { return color; }
    public PieceType getType() { return type; }
    public boolean hasMoved() { return hasMoved; }
    public void setMoved(boolean moved) { this.hasMoved = moved; }

    /**
     * Each piece subclass implements its own movement rules.
     * This method checks ONLY whether the piece can physically make the move:
     *   - correct movement pattern for this piece type
     *   - path is clear (for sliding pieces)
     *   - destination is not occupied by a friendly piece
     *
     * It does NOT check whether the move leaves the king in check --
     * that is the Game's responsibility (two-phase validation).
     */
    public abstract boolean canMove(Board board, Position from, Position to);

    public abstract String getSymbol();

    @Override
    public String toString() {
        return color.name().charAt(0) + getSymbol();
    }
}

// ============================================================================
// KING -- 1 square in any direction + castling
// ============================================================================

class King extends Piece {

    public King(Color color) {
        super(color, PieceType.KING);
    }

    @Override
    public boolean canMove(Board board, Position from, Position to) {
        if (!to.isValid()) return false;

        // Cannot capture own piece
        Piece destPiece = board.getCell(to).getPiece();
        if (destPiece != null && destPiece.getColor() == this.color) return false;

        int rowDiff = Math.abs(to.getRow() - from.getRow());
        int colDiff = Math.abs(to.getCol() - from.getCol());

        // Normal king move: 1 square in any direction
        if (rowDiff <= 1 && colDiff <= 1 && (rowDiff + colDiff) > 0) {
            return true;
        }

        // Castling: king moves 2 squares horizontally
        if (rowDiff == 0 && colDiff == 2) {
            return canCastle(board, from, to);
        }

        return false;
    }

    private boolean canCastle(Board board, Position from, Position to) {
        // King must not have moved
        if (this.hasMoved) return false;

        // King must not be in check
        if (board.isSquareUnderAttack(from, this.color.opposite())) return false;

        int direction = (to.getCol() > from.getCol()) ? 1 : -1; // +1 = king-side, -1 = queen-side
        int rookCol = (direction == 1) ? 7 : 0;
        Position rookPos = new Position(from.getRow(), rookCol);

        // Rook must exist and must not have moved
        Cell rookCell = board.getCell(rookPos);
        if (rookCell.isEmpty()) return false;
        Piece rook = rookCell.getPiece();
        if (rook.getType() != PieceType.ROOK || rook.getColor() != this.color || rook.hasMoved()) {
            return false;
        }

        // Path between king and rook must be clear
        int startCol = Math.min(from.getCol(), rookCol) + 1;
        int endCol = Math.max(from.getCol(), rookCol);
        for (int c = startCol; c < endCol; c++) {
            if (!board.getCell(new Position(from.getRow(), c)).isEmpty()) {
                return false;
            }
        }

        // King must not pass through or land on a square under attack
        for (int step = 1; step <= 2; step++) {
            Position intermediate = new Position(from.getRow(), from.getCol() + direction * step);
            if (board.isSquareUnderAttack(intermediate, this.color.opposite())) {
                return false;
            }
        }

        return true;
    }

    @Override
    public String getSymbol() { return "K"; }
}

// ============================================================================
// QUEEN -- any number of squares horizontally, vertically, or diagonally
// ============================================================================

class Queen extends Piece {

    public Queen(Color color) {
        super(color, PieceType.QUEEN);
    }

    @Override
    public boolean canMove(Board board, Position from, Position to) {
        if (!to.isValid()) return false;

        Piece destPiece = board.getCell(to).getPiece();
        if (destPiece != null && destPiece.getColor() == this.color) return false;

        int rowDiff = Math.abs(to.getRow() - from.getRow());
        int colDiff = Math.abs(to.getCol() - from.getCol());

        // Must move along rank, file, or diagonal
        boolean straight = (rowDiff == 0 || colDiff == 0);
        boolean diagonal = (rowDiff == colDiff);

        if (!straight && !diagonal) return false;
        if (rowDiff == 0 && colDiff == 0) return false;

        return board.isPathClear(from, to);
    }

    @Override
    public String getSymbol() { return "Q"; }
}

// ============================================================================
// ROOK -- any number of squares horizontally or vertically
// ============================================================================

class Rook extends Piece {

    public Rook(Color color) {
        super(color, PieceType.ROOK);
    }

    @Override
    public boolean canMove(Board board, Position from, Position to) {
        if (!to.isValid()) return false;

        Piece destPiece = board.getCell(to).getPiece();
        if (destPiece != null && destPiece.getColor() == this.color) return false;

        int rowDiff = Math.abs(to.getRow() - from.getRow());
        int colDiff = Math.abs(to.getCol() - from.getCol());

        // Must move along rank or file (one of the diffs must be 0)
        if (rowDiff != 0 && colDiff != 0) return false;
        if (rowDiff == 0 && colDiff == 0) return false;

        return board.isPathClear(from, to);
    }

    @Override
    public String getSymbol() { return "R"; }
}

// ============================================================================
// BISHOP -- any number of squares diagonally
// ============================================================================

class Bishop extends Piece {

    public Bishop(Color color) {
        super(color, PieceType.BISHOP);
    }

    @Override
    public boolean canMove(Board board, Position from, Position to) {
        if (!to.isValid()) return false;

        Piece destPiece = board.getCell(to).getPiece();
        if (destPiece != null && destPiece.getColor() == this.color) return false;

        int rowDiff = Math.abs(to.getRow() - from.getRow());
        int colDiff = Math.abs(to.getCol() - from.getCol());

        // Must move diagonally (equal row and col distance)
        if (rowDiff != colDiff) return false;
        if (rowDiff == 0) return false;

        return board.isPathClear(from, to);
    }

    @Override
    public String getSymbol() { return "B"; }
}

// ============================================================================
// KNIGHT -- L-shape: 2 squares in one direction + 1 perpendicular
// ============================================================================

class Knight extends Piece {

    public Knight(Color color) {
        super(color, PieceType.KNIGHT);
    }

    @Override
    public boolean canMove(Board board, Position from, Position to) {
        if (!to.isValid()) return false;

        Piece destPiece = board.getCell(to).getPiece();
        if (destPiece != null && destPiece.getColor() == this.color) return false;

        int rowDiff = Math.abs(to.getRow() - from.getRow());
        int colDiff = Math.abs(to.getCol() - from.getCol());

        // L-shape: one dimension is 2, the other is 1
        // Knight CAN jump over pieces -- no path clearance check
        return (rowDiff == 2 && colDiff == 1) || (rowDiff == 1 && colDiff == 2);
    }

    @Override
    public String getSymbol() { return "N"; }
}

// ============================================================================
// PAWN -- forward 1 (or 2 from start), capture diagonally, en passant, promotion
// ============================================================================

class Pawn extends Piece {
    // The game sets this to allow en passant checks
    private static Move lastMoveRef = null;

    public Pawn(Color color) {
        super(color, PieceType.PAWN);
    }

    public static void setLastMove(Move move) {
        lastMoveRef = move;
    }

    @Override
    public boolean canMove(Board board, Position from, Position to) {
        if (!to.isValid()) return false;

        Piece destPiece = board.getCell(to).getPiece();

        // Cannot capture own piece
        if (destPiece != null && destPiece.getColor() == this.color) return false;

        // Direction: White moves up (row decreases), Black moves down (row increases)
        int direction = (this.color == Color.WHITE) ? -1 : 1;
        int startRow = (this.color == Color.WHITE) ? 6 : 1;

        int rowDiff = to.getRow() - from.getRow();
        int colDiff = Math.abs(to.getCol() - from.getCol());

        // Forward 1 square (destination must be empty)
        if (rowDiff == direction && colDiff == 0 && destPiece == null) {
            return true;
        }

        // Forward 2 squares from starting position (both squares must be empty)
        if (rowDiff == 2 * direction && colDiff == 0 && from.getRow() == startRow && destPiece == null) {
            Position intermediate = new Position(from.getRow() + direction, from.getCol());
            return board.getCell(intermediate).isEmpty();
        }

        // Diagonal capture (destination must have enemy piece)
        if (rowDiff == direction && colDiff == 1 && destPiece != null) {
            return true;
        }

        // En passant
        if (rowDiff == direction && colDiff == 1 && destPiece == null) {
            return isEnPassant(board, from, to);
        }

        return false;
    }

    private boolean isEnPassant(Board board, Position from, Position to) {
        if (lastMoveRef == null) return false;

        Piece lastMovedPiece = lastMoveRef.getMovedPiece();
        Position lastFrom = lastMoveRef.getFrom();
        Position lastTo = lastMoveRef.getTo();

        // Last move must be a pawn moving 2 squares
        if (lastMovedPiece.getType() != PieceType.PAWN) return false;
        if (Math.abs(lastTo.getRow() - lastFrom.getRow()) != 2) return false;

        // The pawn that double-moved must be adjacent to our pawn
        if (lastTo.getRow() != from.getRow()) return false;
        if (lastTo.getCol() != to.getCol()) return false;

        return true;
    }

    @Override
    public String getSymbol() { return "P"; }
}

// ============================================================================
// CELL -- a single square on the board
// ============================================================================

class Cell {
    private final Position position;
    private Piece piece;

    public Cell(Position position) {
        this.position = position;
        this.piece = null;
    }

    public Position getPosition() { return position; }
    public Piece getPiece() { return piece; }
    public void setPiece(Piece piece) { this.piece = piece; }
    public boolean isEmpty() { return piece == null; }

    @Override
    public String toString() {
        return piece == null ? ".." : piece.toString();
    }
}

// ============================================================================
// BOARD -- 8x8 grid of cells
// ============================================================================

class Board {
    private final Cell[][] grid;

    public Board() {
        grid = new Cell[8][8];
        for (int r = 0; r < 8; r++) {
            for (int c = 0; c < 8; c++) {
                grid[r][c] = new Cell(new Position(r, c));
            }
        }
    }

    public void initialize() {
        // Place Black pieces (row 0 = rank 8)
        placePiece(0, 0, PieceFactory.createPiece(PieceType.ROOK, Color.BLACK));
        placePiece(0, 1, PieceFactory.createPiece(PieceType.KNIGHT, Color.BLACK));
        placePiece(0, 2, PieceFactory.createPiece(PieceType.BISHOP, Color.BLACK));
        placePiece(0, 3, PieceFactory.createPiece(PieceType.QUEEN, Color.BLACK));
        placePiece(0, 4, PieceFactory.createPiece(PieceType.KING, Color.BLACK));
        placePiece(0, 5, PieceFactory.createPiece(PieceType.BISHOP, Color.BLACK));
        placePiece(0, 6, PieceFactory.createPiece(PieceType.KNIGHT, Color.BLACK));
        placePiece(0, 7, PieceFactory.createPiece(PieceType.ROOK, Color.BLACK));

        for (int c = 0; c < 8; c++) {
            placePiece(1, c, PieceFactory.createPiece(PieceType.PAWN, Color.BLACK));
        }

        // Place White pieces (row 7 = rank 1)
        placePiece(7, 0, PieceFactory.createPiece(PieceType.ROOK, Color.WHITE));
        placePiece(7, 1, PieceFactory.createPiece(PieceType.KNIGHT, Color.WHITE));
        placePiece(7, 2, PieceFactory.createPiece(PieceType.BISHOP, Color.WHITE));
        placePiece(7, 3, PieceFactory.createPiece(PieceType.QUEEN, Color.WHITE));
        placePiece(7, 4, PieceFactory.createPiece(PieceType.KING, Color.WHITE));
        placePiece(7, 5, PieceFactory.createPiece(PieceType.BISHOP, Color.WHITE));
        placePiece(7, 6, PieceFactory.createPiece(PieceType.KNIGHT, Color.WHITE));
        placePiece(7, 7, PieceFactory.createPiece(PieceType.ROOK, Color.WHITE));

        for (int c = 0; c < 8; c++) {
            placePiece(6, c, PieceFactory.createPiece(PieceType.PAWN, Color.WHITE));
        }
    }

    private void placePiece(int row, int col, Piece piece) {
        grid[row][col].setPiece(piece);
    }

    public Cell getCell(int row, int col) {
        return grid[row][col];
    }

    public Cell getCell(Position pos) {
        return grid[pos.getRow()][pos.getCol()];
    }

    public boolean isWithinBounds(Position pos) {
        return pos.getRow() >= 0 && pos.getRow() < 8
            && pos.getCol() >= 0 && pos.getCol() < 8;
    }

    /**
     * Checks that all squares between from and to (exclusive) are empty.
     * Used for sliding pieces (Queen, Rook, Bishop).
     */
    public boolean isPathClear(Position from, Position to) {
        int rowDir = Integer.signum(to.getRow() - from.getRow());
        int colDir = Integer.signum(to.getCol() - from.getCol());

        int r = from.getRow() + rowDir;
        int c = from.getCol() + colDir;

        while (r != to.getRow() || c != to.getCol()) {
            if (!grid[r][c].isEmpty()) {
                return false;
            }
            r += rowDir;
            c += colDir;
        }
        return true;
    }

    /**
     * Finds the position of the king of the given color.
     */
    public Position findKing(Color color) {
        for (int r = 0; r < 8; r++) {
            for (int c = 0; c < 8; c++) {
                Piece piece = grid[r][c].getPiece();
                if (piece != null && piece.getType() == PieceType.KING && piece.getColor() == color) {
                    return new Position(r, c);
                }
            }
        }
        throw new IllegalStateException("King not found for " + color);
    }

    /**
     * Checks if a square is under attack by any piece of the given attacker color.
     * This is used for check detection and castling validation.
     */
    public boolean isSquareUnderAttack(Position target, Color attackerColor) {
        for (int r = 0; r < 8; r++) {
            for (int c = 0; c < 8; c++) {
                Piece piece = grid[r][c].getPiece();
                if (piece != null && piece.getColor() == attackerColor) {
                    Position attackerPos = new Position(r, c);
                    // Special handling for king to avoid infinite recursion
                    // (King.canMove checks isSquareUnderAttack for castling)
                    if (piece.getType() == PieceType.KING) {
                        int rowDiff = Math.abs(target.getRow() - r);
                        int colDiff = Math.abs(target.getCol() - c);
                        if (rowDiff <= 1 && colDiff <= 1 && (rowDiff + colDiff) > 0) {
                            return true;
                        }
                    } else if (piece.canMove(this, attackerPos, target)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Prints the board to console with coordinates.
     */
    public void printBoard() {
        System.out.println("    a   b   c   d   e   f   g   h");
        System.out.println("  +---+---+---+---+---+---+---+---+");
        for (int r = 0; r < 8; r++) {
            System.out.print((8 - r) + " |");
            for (int c = 0; c < 8; c++) {
                Piece piece = grid[r][c].getPiece();
                if (piece == null) {
                    System.out.print("   |");
                } else {
                    System.out.print(" " + piece.toString() + "|");
                }
            }
            System.out.println(" " + (8 - r));
            System.out.println("  +---+---+---+---+---+---+---+---+");
        }
        System.out.println("    a   b   c   d   e   f   g   h");
    }
}

// ============================================================================
// PIECE FACTORY -- Factory pattern
// ============================================================================

class PieceFactory {
    public static Piece createPiece(PieceType type, Color color) {
        switch (type) {
            case KING:   return new King(color);
            case QUEEN:  return new Queen(color);
            case ROOK:   return new Rook(color);
            case BISHOP: return new Bishop(color);
            case KNIGHT: return new Knight(color);
            case PAWN:   return new Pawn(color);
            default:     throw new IllegalArgumentException("Unknown piece type: " + type);
        }
    }
}

// ============================================================================
// MOVE -- Command pattern with execute() and undo()
// ============================================================================

class Move {
    private final Position from;
    private final Position to;
    private final Piece movedPiece;
    private Piece capturedPiece;
    private final boolean wasFirstMove;

    // Special move flags
    private boolean isCastlingMove;
    private boolean isEnPassantMove;
    private boolean isPromotionMove;
    private Piece promotedTo; // the piece the pawn was promoted to

    public Move(Position from, Position to, Piece movedPiece) {
        this.from = from;
        this.to = to;
        this.movedPiece = movedPiece;
        this.wasFirstMove = !movedPiece.hasMoved();
        this.isCastlingMove = false;
        this.isEnPassantMove = false;
        this.isPromotionMove = false;
    }

    public Position getFrom() { return from; }
    public Position getTo() { return to; }
    public Piece getMovedPiece() { return movedPiece; }
    public Piece getCapturedPiece() { return capturedPiece; }
    public boolean isCastlingMove() { return isCastlingMove; }
    public boolean isEnPassantMove() { return isEnPassantMove; }
    public boolean isPromotionMove() { return isPromotionMove; }

    /**
     * Execute this move on the board. Handles normal moves, captures,
     * castling, en passant, and pawn promotion.
     */
    public void execute(Board board) {
        Cell fromCell = board.getCell(from);
        Cell toCell = board.getCell(to);

        capturedPiece = toCell.getPiece();

        // Detect and handle castling
        if (movedPiece.getType() == PieceType.KING && Math.abs(to.getCol() - from.getCol()) == 2) {
            isCastlingMove = true;
            executeCastling(board);
            return;
        }

        // Detect and handle en passant
        if (movedPiece.getType() == PieceType.PAWN
                && from.getCol() != to.getCol()
                && toCell.isEmpty()) {
            isEnPassantMove = true;
            executeEnPassant(board);
            return;
        }

        // Normal move or capture
        toCell.setPiece(movedPiece);
        fromCell.setPiece(null);
        movedPiece.setMoved(true);

        // Detect and handle pawn promotion
        if (movedPiece.getType() == PieceType.PAWN) {
            int promotionRow = (movedPiece.getColor() == Color.WHITE) ? 0 : 7;
            if (to.getRow() == promotionRow) {
                isPromotionMove = true;
                promotedTo = PieceFactory.createPiece(PieceType.QUEEN, movedPiece.getColor());
                promotedTo.setMoved(true);
                toCell.setPiece(promotedTo);
            }
        }
    }

    private void executeCastling(Board board) {
        Cell fromCell = board.getCell(from);
        Cell toCell = board.getCell(to);

        // Move king
        toCell.setPiece(movedPiece);
        fromCell.setPiece(null);
        movedPiece.setMoved(true);

        // Move rook
        int direction = (to.getCol() > from.getCol()) ? 1 : -1;
        int rookFromCol = (direction == 1) ? 7 : 0;
        int rookToCol = (direction == 1) ? 5 : 3;

        Cell rookFromCell = board.getCell(new Position(from.getRow(), rookFromCol));
        Cell rookToCell = board.getCell(new Position(from.getRow(), rookToCol));

        Piece rook = rookFromCell.getPiece();
        rookToCell.setPiece(rook);
        rookFromCell.setPiece(null);
        rook.setMoved(true);
    }

    private void executeEnPassant(Board board) {
        Cell fromCell = board.getCell(from);
        Cell toCell = board.getCell(to);

        // Move the pawn to the destination
        toCell.setPiece(movedPiece);
        fromCell.setPiece(null);
        movedPiece.setMoved(true);

        // Remove the captured pawn (it is on the same row as 'from', same col as 'to')
        Position capturedPawnPos = new Position(from.getRow(), to.getCol());
        Cell capturedPawnCell = board.getCell(capturedPawnPos);
        capturedPiece = capturedPawnCell.getPiece();
        capturedPawnCell.setPiece(null);
    }

    /**
     * Undo this move, restoring the board to its exact state before the move.
     */
    public void undo(Board board) {
        Cell fromCell = board.getCell(from);
        Cell toCell = board.getCell(to);

        if (isCastlingMove) {
            undoCastling(board);
            return;
        }

        if (isEnPassantMove) {
            undoEnPassant(board);
            return;
        }

        // Undo promotion: restore the original pawn
        if (isPromotionMove) {
            fromCell.setPiece(movedPiece);
        } else {
            fromCell.setPiece(movedPiece);
        }
        toCell.setPiece(capturedPiece);

        // Restore first-move flag
        if (wasFirstMove) {
            movedPiece.setMoved(false);
        }
    }

    private void undoCastling(Board board) {
        Cell fromCell = board.getCell(from);
        Cell toCell = board.getCell(to);

        // Move king back
        fromCell.setPiece(movedPiece);
        toCell.setPiece(null);
        movedPiece.setMoved(false);

        // Move rook back
        int direction = (to.getCol() > from.getCol()) ? 1 : -1;
        int rookFromCol = (direction == 1) ? 7 : 0;
        int rookToCol = (direction == 1) ? 5 : 3;

        Cell rookOriginalCell = board.getCell(new Position(from.getRow(), rookFromCol));
        Cell rookCurrentCell = board.getCell(new Position(from.getRow(), rookToCol));

        Piece rook = rookCurrentCell.getPiece();
        rookOriginalCell.setPiece(rook);
        rookCurrentCell.setPiece(null);
        rook.setMoved(false);
    }

    private void undoEnPassant(Board board) {
        Cell fromCell = board.getCell(from);
        Cell toCell = board.getCell(to);

        // Move pawn back
        fromCell.setPiece(movedPiece);
        toCell.setPiece(null);

        // Restore the captured pawn
        Position capturedPawnPos = new Position(from.getRow(), to.getCol());
        board.getCell(capturedPawnPos).setPiece(capturedPiece);

        if (wasFirstMove) {
            movedPiece.setMoved(false);
        }
    }

    @Override
    public String toString() {
        String base = movedPiece.toString() + " " + from + " -> " + to;
        if (isCastlingMove) base += " (castling)";
        if (isEnPassantMove) base += " (en passant)";
        if (isPromotionMove) base += " (promotion to " + promotedTo.getType() + ")";
        if (capturedPiece != null) base += " captures " + capturedPiece.toString();
        return base;
    }
}

// ============================================================================
// PLAYER
// ============================================================================

class Player {
    private final String name;
    private final Color color;

    public Player(String name, Color color) {
        this.name = name;
        this.color = color;
    }

    public String getName() { return name; }
    public Color getColor() { return color; }

    @Override
    public String toString() {
        return name + " (" + color + ")";
    }
}

// ============================================================================
// GAME OBSERVER -- Observer pattern
// ============================================================================

interface GameObserver {
    void onCheck(Color kingColor);
    void onCheckmate(Color loserColor);
    void onStalemate();
    void onResign(Color resignedColor);
    void onMoveMade(Move move);
}

class ConsoleObserver implements GameObserver {
    @Override
    public void onCheck(Color kingColor) {
        System.out.println(">>> CHECK! " + kingColor + " king is in check!");
    }

    @Override
    public void onCheckmate(Color loserColor) {
        System.out.println(">>> CHECKMATE! " + loserColor + " is checkmated. "
                + loserColor.opposite() + " wins!");
    }

    @Override
    public void onStalemate() {
        System.out.println(">>> STALEMATE! The game is a draw.");
    }

    @Override
    public void onResign(Color resignedColor) {
        System.out.println(">>> " + resignedColor + " resigns. "
                + resignedColor.opposite() + " wins!");
    }

    @Override
    public void onMoveMade(Move move) {
        System.out.println("Move: " + move);
    }
}

// ============================================================================
// GAME -- main orchestrator
// ============================================================================

class Game {
    private final Board board;
    private final Player whitePlayer;
    private final Player blackPlayer;
    private Player currentPlayer;
    private GameStatus status;
    private final List<Move> moveHistory;
    private int moveIndex; // for undo/redo
    private final List<GameObserver> observers;

    public Game(String whiteName, String blackName) {
        this.board = new Board();
        this.whitePlayer = new Player(whiteName, Color.WHITE);
        this.blackPlayer = new Player(blackName, Color.BLACK);
        this.currentPlayer = whitePlayer; // White always moves first
        this.status = GameStatus.ACTIVE;
        this.moveHistory = new ArrayList<>();
        this.moveIndex = 0;
        this.observers = new ArrayList<>();

        board.initialize();
    }

    // ---- Observer management ----

    public void addObserver(GameObserver observer) {
        observers.add(observer);
    }

    public void removeObserver(GameObserver observer) {
        observers.remove(observer);
    }

    private void notifyObservers(Move move) {
        for (GameObserver obs : observers) {
            obs.onMoveMade(move);
        }
    }

    // ---- Core game play ----

    /**
     * Attempt to make a move from 'from' to 'to'.
     * Returns true if the move was valid and executed, false otherwise.
     */
    public boolean makeMove(Position from, Position to) {
        // Game must be active
        if (status == GameStatus.CHECKMATE || status == GameStatus.STALEMATE
                || status == GameStatus.RESIGNED) {
            System.out.println("Game is over. No more moves allowed.");
            return false;
        }

        // Validate positions
        if (!from.isValid() || !to.isValid()) {
            System.out.println("Invalid position.");
            return false;
        }

        Cell fromCell = board.getCell(from);
        if (fromCell.isEmpty()) {
            System.out.println("No piece at " + from);
            return false;
        }

        Piece piece = fromCell.getPiece();

        // Must be current player's piece
        if (piece.getColor() != currentPlayer.getColor()) {
            System.out.println("Not your piece! It is " + currentPlayer.getName() + "'s turn.");
            return false;
        }

        // Phase 1: Can the piece physically make this move?
        // Set last move for en passant detection
        if (moveIndex > 0) {
            Pawn.setLastMove(moveHistory.get(moveIndex - 1));
        } else {
            Pawn.setLastMove(null);
        }

        if (!piece.canMove(board, from, to)) {
            System.out.println("Illegal move for " + piece + " from " + from + " to " + to);
            return false;
        }

        // Phase 2: Would this move leave own king in check?
        if (wouldLeaveKingInCheck(from, to)) {
            System.out.println("Move would leave your king in check!");
            return false;
        }

        // Execute the move
        Move move = new Move(from, to, piece);
        move.execute(board);

        // If we had undone moves, remove them (no redo past a new move)
        while (moveHistory.size() > moveIndex) {
            moveHistory.remove(moveHistory.size() - 1);
        }
        moveHistory.add(move);
        moveIndex++;

        // Notify observers of the move
        notifyObservers(move);

        // Update game status
        updateGameStatus();

        // Switch turn
        switchTurn();

        return true;
    }

    /**
     * Undo the last move. Returns true if successful.
     */
    public boolean undoMove() {
        if (moveIndex <= 0) {
            System.out.println("No moves to undo.");
            return false;
        }

        moveIndex--;
        Move lastMove = moveHistory.get(moveIndex);
        lastMove.undo(board);

        // Switch turn back
        switchTurn();

        // Recompute game status
        updateGameStatus();

        System.out.println("Undone: " + lastMove);
        return true;
    }

    /**
     * Redo a previously undone move. Returns true if successful.
     */
    public boolean redoMove() {
        if (moveIndex >= moveHistory.size()) {
            System.out.println("No moves to redo.");
            return false;
        }

        Move move = moveHistory.get(moveIndex);
        move.execute(board);
        moveIndex++;

        // Switch turn
        switchTurn();

        // Recompute status
        updateGameStatus();

        System.out.println("Redone: " + move);
        return true;
    }

    /**
     * Current player resigns. Opponent wins.
     */
    public void resign() {
        this.status = GameStatus.RESIGNED;
        for (GameObserver obs : observers) {
            obs.onResign(currentPlayer.getColor());
        }
    }

    // ---- Check / Checkmate / Stalemate ----

    /**
     * Is the king of the given color currently in check?
     */
    public boolean isCheck(Color color) {
        Position kingPos = board.findKing(color);
        return board.isSquareUnderAttack(kingPos, color.opposite());
    }

    /**
     * Is it checkmate for the given color?
     * Checkmate = king is in check AND no legal moves exist.
     */
    public boolean isCheckmate(Color color) {
        if (!isCheck(color)) return false;
        return !hasAnyLegalMove(color);
    }

    /**
     * Is it stalemate for the given color?
     * Stalemate = king is NOT in check AND no legal moves exist.
     */
    public boolean isStalemate(Color color) {
        if (isCheck(color)) return false;
        return !hasAnyLegalMove(color);
    }

    /**
     * Does the player with the given color have any legal move?
     */
    private boolean hasAnyLegalMove(Color color) {
        for (int r = 0; r < 8; r++) {
            for (int c = 0; c < 8; c++) {
                Piece piece = board.getCell(r, c).getPiece();
                if (piece != null && piece.getColor() == color) {
                    Position from = new Position(r, c);
                    // Try every possible destination
                    for (int dr = 0; dr < 8; dr++) {
                        for (int dc = 0; dc < 8; dc++) {
                            Position to = new Position(dr, dc);
                            // Set last move for en passant
                            if (moveIndex > 0) {
                                Pawn.setLastMove(moveHistory.get(moveIndex - 1));
                            } else {
                                Pawn.setLastMove(null);
                            }
                            if (piece.canMove(board, from, to)
                                    && !wouldLeaveKingInCheck(from, to)) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        return false;
    }

    /**
     * Simulate a move and check if it would leave the moving player's king in check.
     * This is the Phase 2 validation.
     */
    private boolean wouldLeaveKingInCheck(Position from, Position to) {
        Cell fromCell = board.getCell(from);
        Cell toCell = board.getCell(to);

        Piece movedPiece = fromCell.getPiece();
        Piece capturedPiece = toCell.getPiece();

        // Handle en passant simulation
        Piece enPassantCaptured = null;
        Position enPassantPos = null;
        if (movedPiece.getType() == PieceType.PAWN
                && from.getCol() != to.getCol()
                && toCell.isEmpty()) {
            enPassantPos = new Position(from.getRow(), to.getCol());
            enPassantCaptured = board.getCell(enPassantPos).getPiece();
            board.getCell(enPassantPos).setPiece(null);
        }

        // Temporarily execute
        toCell.setPiece(movedPiece);
        fromCell.setPiece(null);

        // Check if own king is in check
        boolean inCheck = isCheck(movedPiece.getColor());

        // Undo
        fromCell.setPiece(movedPiece);
        toCell.setPiece(capturedPiece);
        if (enPassantPos != null) {
            board.getCell(enPassantPos).setPiece(enPassantCaptured);
        }

        return inCheck;
    }

    /**
     * After each move, update the game status based on the opponent's situation.
     */
    private void updateGameStatus() {
        Color opponentColor = currentPlayer.getColor().opposite();

        if (isCheck(opponentColor)) {
            if (!hasAnyLegalMove(opponentColor)) {
                status = GameStatus.CHECKMATE;
                for (GameObserver obs : observers) {
                    obs.onCheckmate(opponentColor);
                }
            } else {
                status = GameStatus.CHECK;
                for (GameObserver obs : observers) {
                    obs.onCheck(opponentColor);
                }
            }
        } else {
            if (!hasAnyLegalMove(opponentColor)) {
                status = GameStatus.STALEMATE;
                for (GameObserver obs : observers) {
                    obs.onStalemate();
                }
            } else {
                status = GameStatus.ACTIVE;
            }
        }
    }

    private void switchTurn() {
        currentPlayer = (currentPlayer == whitePlayer) ? blackPlayer : whitePlayer;
    }

    // ---- Getters ----

    public Board getBoard() { return board; }
    public GameStatus getStatus() { return status; }
    public Player getCurrentPlayer() { return currentPlayer; }
    public List<Move> getMoveHistory() { return moveHistory; }
}

// ============================================================================
// MAIN -- demo game with check detection
// ============================================================================

public class ChessGame {

    /**
     * Helper to convert algebraic notation (e.g., "e2") to a Position.
     */
    static Position pos(String algebraic) {
        char file = algebraic.charAt(0);
        char rank = algebraic.charAt(1);
        int col = file - 'a';
        int row = 8 - (rank - '0');
        return new Position(row, col);
    }

    public static void main(String[] args) {
        System.out.println("=== CHESS GAME - Low Level Design Demo ===\n");

        // Create game and register observer
        Game game = new Game("Alice", "Bob");
        game.addObserver(new ConsoleObserver());

        // Print initial board
        System.out.println("Initial board state:");
        game.getBoard().printBoard();
        System.out.println();

        // -----------------------------------------------------------------
        // Demo 1: Scholar's Mate (4-move checkmate)
        // 1. e4    e5
        // 2. Bc4   Nc6
        // 3. Qh5   Nf6??
        // 4. Qxf7# (checkmate)
        // -----------------------------------------------------------------

        System.out.println("=== Demo: Scholar's Mate ===\n");

        // Move 1: White e2-e4 (pawn forward 2)
        System.out.println("--- Move 1: White e2->e4 ---");
        game.makeMove(pos("e2"), pos("e4"));
        game.getBoard().printBoard();
        System.out.println("Status: " + game.getStatus() + "\n");

        // Move 1: Black e7-e5 (pawn forward 2)
        System.out.println("--- Move 1: Black e7->e5 ---");
        game.makeMove(pos("e7"), pos("e5"));
        game.getBoard().printBoard();
        System.out.println("Status: " + game.getStatus() + "\n");

        // Move 2: White Bf1-c4 (bishop to c4)
        System.out.println("--- Move 2: White Bf1->c4 ---");
        game.makeMove(pos("f1"), pos("c4"));
        game.getBoard().printBoard();
        System.out.println("Status: " + game.getStatus() + "\n");

        // Move 2: Black Nb8-c6 (knight to c6)
        System.out.println("--- Move 2: Black Nb8->c6 ---");
        game.makeMove(pos("b8"), pos("c6"));
        game.getBoard().printBoard();
        System.out.println("Status: " + game.getStatus() + "\n");

        // Move 3: White Qd1-h5 (queen to h5)
        System.out.println("--- Move 3: White Qd1->h5 ---");
        game.makeMove(pos("d1"), pos("h5"));
        game.getBoard().printBoard();
        System.out.println("Status: " + game.getStatus() + "\n");

        // Move 3: Black Ng8-f6 (knight to f6 -- the blunder!)
        System.out.println("--- Move 3: Black Ng8->f6 (blunder!) ---");
        game.makeMove(pos("g8"), pos("f6"));
        game.getBoard().printBoard();
        System.out.println("Status: " + game.getStatus() + "\n");

        // Move 4: White Qh5xf7# (queen takes f7 -- checkmate!)
        System.out.println("--- Move 4: White Qh5->f7 (CHECKMATE!) ---");
        game.makeMove(pos("h5"), pos("f7"));
        game.getBoard().printBoard();
        System.out.println("Status: " + game.getStatus() + "\n");

        // -----------------------------------------------------------------
        // Demo 2: Show that illegal moves are rejected
        // -----------------------------------------------------------------

        System.out.println("\n=== Demo 2: Illegal Move Rejection ===\n");

        Game game2 = new Game("Charlie", "Diana");
        game2.addObserver(new ConsoleObserver());

        // Try to move opponent's piece
        System.out.println("Try moving opponent's piece (Black's pawn while it's White's turn):");
        boolean result = game2.makeMove(pos("e7"), pos("e5"));
        System.out.println("Result: " + result + "\n");

        // Try illegal knight move
        System.out.println("Try illegal knight move (b1 to b3):");
        result = game2.makeMove(pos("b1"), pos("b3"));
        System.out.println("Result: " + result + "\n");

        // Legal knight move
        System.out.println("Legal knight move (b1 to c3):");
        result = game2.makeMove(pos("b1"), pos("c3"));
        System.out.println("Result: " + result + "\n");

        // -----------------------------------------------------------------
        // Demo 3: Undo functionality
        // -----------------------------------------------------------------

        System.out.println("\n=== Demo 3: Undo ===\n");

        Game game3 = new Game("Eve", "Frank");
        game3.addObserver(new ConsoleObserver());

        System.out.println("Make move e2->e4:");
        game3.makeMove(pos("e2"), pos("e4"));

        System.out.println("\nMake move e7->e5:");
        game3.makeMove(pos("e7"), pos("e5"));

        System.out.println("\nBoard before undo:");
        game3.getBoard().printBoard();

        System.out.println("\nUndo last move:");
        game3.undoMove();

        System.out.println("\nBoard after undo (e5 pawn should be back at e7):");
        game3.getBoard().printBoard();

        System.out.println("\nRedo the undone move:");
        game3.redoMove();

        System.out.println("\nBoard after redo (e5 pawn should be at e5 again):");
        game3.getBoard().printBoard();

        // -----------------------------------------------------------------
        // Demo 4: Check detection (not checkmate)
        // -----------------------------------------------------------------

        System.out.println("\n=== Demo 4: Check Detection (Fool's Opening) ===\n");

        Game game4 = new Game("Grace", "Hank");
        game4.addObserver(new ConsoleObserver());

        // Set up a quick check scenario
        // 1. f3  e5
        // 2. g4  Qh4+ (check!)

        System.out.println("1. f2->f3:");
        game4.makeMove(pos("f2"), pos("f3"));

        System.out.println("1. e7->e5:");
        game4.makeMove(pos("e7"), pos("e5"));

        System.out.println("2. g2->g4:");
        game4.makeMove(pos("g2"), pos("g4"));

        System.out.println("2. Qd8->h4+ (CHECK!):");
        game4.makeMove(pos("d8"), pos("h4"));

        game4.getBoard().printBoard();
        System.out.println("Status: " + game4.getStatus());
        System.out.println("(This is actually Fool's Mate -- CHECKMATE in 2 moves!)");

        // -----------------------------------------------------------------
        // Demo 5: Resign
        // -----------------------------------------------------------------

        System.out.println("\n=== Demo 5: Resign ===\n");

        Game game5 = new Game("Ivan", "Julia");
        game5.addObserver(new ConsoleObserver());
        game5.makeMove(pos("e2"), pos("e4"));
        System.out.println("Black (Julia) resigns:");
        game5.resign();
        System.out.println("Status: " + game5.getStatus());

        System.out.println("\n=== All demos complete. ===");
    }
}
```

---

## Compilation and Execution

```bash
# Save the code above as ChessGame.java, then:
javac ChessGame.java
java ChessGame
```

---

## Expected Output (abbreviated)

```
=== CHESS GAME - Low Level Design Demo ===

Initial board state:
    a   b   c   d   e   f   g   h
  +---+---+---+---+---+---+---+---+
8 | BR| BN| BB| BQ| BK| BB| BN| BR| 8
  +---+---+---+---+---+---+---+---+
7 | BP| BP| BP| BP| BP| BP| BP| BP| 7
  +---+---+---+---+---+---+---+---+
6 |   |   |   |   |   |   |   |   | 6
  +---+---+---+---+---+---+---+---+
5 |   |   |   |   |   |   |   |   | 5
  +---+---+---+---+---+---+---+---+
4 |   |   |   |   |   |   |   |   | 4
  +---+---+---+---+---+---+---+---+
3 |   |   |   |   |   |   |   |   | 3
  +---+---+---+---+---+---+---+---+
2 | WP| WP| WP| WP| WP| WP| WP| WP| 2
  +---+---+---+---+---+---+---+---+
1 | WR| WN| WB| WQ| WK| WB| WN| WR| 1
  +---+---+---+---+---+---+---+---+
    a   b   c   d   e   f   g   h

=== Demo: Scholar's Mate ===

--- Move 4: White Qh5->f7 (CHECKMATE!) ---
Move: WQ h5 -> f7 captures BP
>>> CHECKMATE! BLACK is checkmated. WHITE wins!
Status: CHECKMATE

=== Demo 4: Check Detection (Fool's Opening) ===
>>> CHECKMATE! WHITE is checkmated. BLACK wins!
Status: CHECKMATE
(This is actually Fool's Mate -- CHECKMATE in 2 moves!)
```

---

## Class-by-Class Breakdown

| Class | Lines | Pattern | Responsibility |
|-------|-------|---------|----------------|
| `Color` | 6 | Enum | WHITE/BLACK with `opposite()` helper |
| `PieceType` | 3 | Enum | KING, QUEEN, ROOK, BISHOP, KNIGHT, PAWN |
| `GameStatus` | 3 | Enum | ACTIVE, CHECK, CHECKMATE, STALEMATE, RESIGNED, DRAW |
| `Position` | 30 | Value Object | Immutable (row, col) with `isValid()`, `equals()`, `hashCode()`, algebraic `toString()` |
| `Piece` | 25 | Template Method | Abstract base: color, type, hasMoved, abstract `canMove()` |
| `King` | 55 | Subclass | 1-square movement + castling validation (5 conditions) |
| `Queen` | 20 | Subclass | Horizontal + vertical + diagonal sliding |
| `Rook` | 18 | Subclass | Horizontal + vertical sliding |
| `Bishop` | 18 | Subclass | Diagonal sliding |
| `Knight` | 14 | Subclass | L-shape (2+1), no path check |
| `Pawn` | 55 | Subclass | Forward 1/2, diagonal capture, en passant detection |
| `Cell` | 15 | - | Square on board with optional Piece |
| `Board` | 80 | - | 8x8 grid, `isPathClear`, `findKing`, `isSquareUnderAttack`, `printBoard` |
| `PieceFactory` | 12 | Factory | Creates pieces by PieceType and Color |
| `Move` | 110 | Command | `execute()`/`undo()` with castling, en passant, promotion handling |
| `Player` | 12 | - | Name + Color |
| `GameObserver` | 7 | Observer | Interface: onCheck, onCheckmate, onStalemate, onResign, onMoveMade |
| `ConsoleObserver` | 20 | Observer | Prints events to console |
| `Game` | 170 | Orchestrator | `makeMove()`, `undoMove()`, `isCheck()`, `isCheckmate()`, `isStalemate()`, turn management |
| `ChessGame` (Main) | 100 | - | Demo: Scholar's Mate, illegal moves, undo/redo, Fool's Mate, resign |

**Total: ~770 lines of Java code**

---

## Key Design Decisions in Code

### 1. Two-Phase Move Validation

```java
// In Game.makeMove():
// Phase 1: piece-level rules
if (!piece.canMove(board, from, to)) return false;

// Phase 2: king safety
if (wouldLeaveKingInCheck(from, to)) return false;
```

### 2. Check Detection via Reuse

```java
// isCheck reuses each piece's canMove() -- no duplicated logic
public boolean isCheck(Color color) {
    Position kingPos = board.findKing(color);
    return board.isSquareUnderAttack(kingPos, color.opposite());
}
```

### 3. Checkmate = Check + No Legal Moves

```java
public boolean isCheckmate(Color color) {
    if (!isCheck(color)) return false;
    return !hasAnyLegalMove(color);
}
```

### 4. Undo via Command Pattern

```java
// Each Move stores everything needed to reverse itself
public void undo(Board board) {
    fromCell.setPiece(movedPiece);
    toCell.setPiece(capturedPiece);
    if (wasFirstMove) movedPiece.setMoved(false);
}
```

### 5. King Attack Check Avoids Infinite Recursion

```java
// In Board.isSquareUnderAttack(), king attacks are checked directly
// (not via King.canMove) to avoid infinite recursion since
// King.canMove calls isSquareUnderAttack for castling validation
if (piece.getType() == PieceType.KING) {
    int rowDiff = Math.abs(target.getRow() - r);
    int colDiff = Math.abs(target.getCol() - c);
    if (rowDiff <= 1 && colDiff <= 1 && (rowDiff + colDiff) > 0) {
        return true;
    }
}
```

### 6. En Passant Uses Static Last-Move Reference

```java
// Pawn checks the last move made in the game to determine
// if en passant is legal. The Game sets this before validation.
Pawn.setLastMove(moveHistory.get(moveIndex - 1));
```

---

## How to Extend

### Adding a Timer

```java
class Clock {
    private long remainingMillis;
    private long lastStartTime;
    private boolean running;

    public void start() { lastStartTime = System.currentTimeMillis(); running = true; }
    public void pause() { remainingMillis -= (System.currentTimeMillis() - lastStartTime); running = false; }
    public boolean isExpired() { return remainingMillis <= 0; }
}
// Add Clock to Player; start/pause in Game.switchTurn()
```

### Adding AI

```java
interface MoveStrategy {
    Move selectMove(Board board, Color color, List<Move> history);
}

class MinimaxStrategy implements MoveStrategy {
    public Move selectMove(Board board, Color color, List<Move> history) {
        // minimax with alpha-beta pruning
    }
}
// Player gets a MoveStrategy; Game calls strategy.selectMove() for AI players
```
