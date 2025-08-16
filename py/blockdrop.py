import curses
import random
import time

W, H = 10, 20  # Ukuran board

shapes = [
    [[1, 1, 1], [0, 1, 0]],     # T
    [[1, 1], [1, 1]],           # O
    [[1, 1, 0], [0, 1, 1]],     # Z
    [[0, 1, 1], [1, 1, 0]],     # S
    [[1, 0, 0], [1,  1, 1]],    # J
    [[0, 0, 1], [1, 1, 1]],     # L
    [[1, 1, 1, 1]]              # I
]

def new_board():
    return [[0] * W for _ in range(H)]

def rotate(shape):
    return list(zip(*shape[::-1]))

def check_collision(board, shape, offset):
    ox, oy = offset
    for y, row in enumerate(shape):
        for x, cell in enumerate(row):
            if cell:
                nx, ny = x + ox, y + oy
                if nx < 0 or nx >= W or ny < 0 or ny >= H or board[ny][nx]:
                    return True
    return False

def merge(board, shape, offset):
    ox, oy = offset
    for y, row in enumerate(shape):
        for x, cell in enumerate(row):
            if cell:
                board[y + oy][x + ox] = cell

def clear_lines(board):
    new_board = [row for row in board if any(cell == 0 for cell in row)]
    lines_cleared = H - len(new_board)
    for _ in range(lines_cleared):
        new_board.insert(0, [0] * W)
    return new_board, lines_cleared

def draw_border(stdscr, top, left):
    for y in range(H):
        stdscr.addstr(top + y, left - 1, "|")
        stdscr.addstr(top + y, left + W * 2, "|")
    stdscr.addstr(top + H, left - 1, "+" + "=" * (W * 2) + "+")

def draw_shape(stdscr, shape, offset, top, left):
    ox, oy = offset
    for y, row in enumerate(shape):
        for x, cell in enumerate(row):
            if cell:
                sy, sx = top + oy + y, left + (ox + x) * 2
                stdscr.addstr(sy, sx, "[]")  # Ganti '██' dengan '[]'

def draw_board(stdscr, board, shape, offset, next_shape, score, level, paused):
    stdscr.clear()
    h, w = stdscr.getmaxyx()
    top, left = 2, 4

    # Draw settled blocks with [] style
    for y, row in enumerate(board):
        for x, cell in enumerate(row):
            if cell:
                stdscr.addstr(top + y, left + x * 2, '[]')

    # Draw current falling block
    draw_shape(stdscr, shape, offset, top, left)

    # Draw borders
    draw_border(stdscr, top, left)

    # Draw next block preview
    stdscr.addstr(2, left + W * 2 + 4, "Next:")
    for y, row in enumerate(next_shape):
        for x, cell in enumerate(row):
            if cell:
                stdscr.addstr(3 + y, left + W * 2 + 4 + x * 2, '[]')

    # Draw score and level
    stdscr.addstr(9, left + W * 2 + 4, f"Score: {score}")
    stdscr.addstr(10, left + W * 2 + 4, f"Level: {level}")
    stdscr.addstr(12, left + W * 2 + 4, "'P' = Pause")

    if paused:
        stdscr.addstr(H // 2, left + 2, "-- PAUSED --")

    stdscr.refresh()

def hard_drop(board, shape, offset):
    ox, oy = offset
    while not check_collision(board, shape, [ox, oy + 1]):
        oy += 1
    return [ox, oy]

def main(stdscr):
    curses.curs_set(0)
    stdscr.nodelay(1)
    stdscr.keypad(True)

    board = new_board()
    shape = random.choice(shapes)
    next_shape = random.choice(shapes)
    offset = [W // 2 - len(shape[0]) // 2, 0]
    score = 0
    level = 0
    speed = 0.7
    paused = False
    last_fall = time.time()
    start_time = time.time()

    while True:
        draw_board(stdscr, board, shape, offset, next_shape, score, level, paused)

        key = stdscr.getch()

        if key in [ord('p'), ord('P')]:
            paused = not paused
            time.sleep(0.2)

        if paused:
            time.sleep(0.05)
            continue

        if key == ord('q'):
            break
        elif key == curses.KEY_LEFT:
            if not check_collision(board, shape, [offset[0] - 1, offset[1]]):
                offset[0] -= 1
        elif key == curses.KEY_RIGHT:
            if not check_collision(board, shape, [offset[0] + 1, offset[1]]):
                offset[0] += 1
        elif key == curses.KEY_DOWN or key == ord(' '):
            offset = hard_drop(board, shape, offset)
        elif key == curses.KEY_UP:
            new_shape = rotate(shape)
            if not check_collision(board, new_shape, offset):
                shape = new_shape

        # Auto drop
        if time.time() - last_fall > speed:
            if not check_collision(board, shape, [offset[0], offset[1] + 1]):
                offset[1] += 1
            else:
                merge(board, shape, offset)
                board, cleared = clear_lines(board)
                score += cleared * 100
                shape = next_shape
                next_shape = random.choice(shapes)
                offset = [W // 2 - len(shape[0]) // 2, 0]
                if check_collision(board, shape, offset):
                    stdscr.addstr(H // 2, 4, ' GAME OVER ')
                    stdscr.refresh()
                    time.sleep(2)
                    break
            last_fall = time.time()

        # Level up tiap 2 menit
        elapsed = time.time() - start_time
        new_level = int(elapsed // 120)
        if new_level > level:
            level = new_level
            speed = max(0.1, speed - 0.1)

        time.sleep(0.01)

curses.wrapper(main)
