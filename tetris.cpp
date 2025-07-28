#include <ncurses.h>
#include <vector>
#include <ctime>
#include <cstdlib>
#include <string>
#include <chrono>
#include <thread>

using namespace std;

const int W = 10, H = 20;

vector<vector<vector<int>>> shapes = {
    {{1,1,1},{0,1,0}},          // T
    {{1,1},{1,1}},              // O
    {{1,1,0},{0,1,1}},          // Z
    {{0,1,1},{1,1,0}},          // S
    {{1,0,0},{1,1,1}},          // J
    {{0,0,1},{1,1,1}},          // L
    {{1,1,1,1}}                 // I
};

typedef vector<vector<int>> Matrix;

vector<vector<int>> new_board() {
    return vector<vector<int>>(H, vector<int>(W, 0));
}

Matrix rotate(const Matrix& shape) {
    int rows = shape.size(), cols = shape[0].size();
    Matrix rotated(cols, vector<int>(rows));
    for (int y = 0; y < rows; y++)
        for (int x = 0; x < cols; x++)
            rotated[x][rows - y - 1] = shape[y][x];
    return rotated;
}

bool check_collision(const vector<vector<int>>& board, const Matrix& shape, int ox, int oy) {
    for (int y = 0; y < shape.size(); y++) {
        for (int x = 0; x < shape[y].size(); x++) {
            if (shape[y][x]) {
                int nx = ox + x, ny = oy + y;
                if (nx < 0 || nx >= W || ny < 0 || ny >= H || board[ny][nx])
                    return true;
            }
        }
    }
    return false;
}

void merge(vector<vector<int>>& board, const Matrix& shape, int ox, int oy) {
    for (int y = 0; y < shape.size(); y++)
        for (int x = 0; x < shape[y].size(); x++)
            if (shape[y][x]) board[oy + y][ox + x] = 1;
}

void clear_lines(vector<vector<int>>& board, int& score) {
    vector<vector<int>> new_board;
    int lines = 0;
    for (auto& row : board) {
        bool full = true;
        for (int cell : row)
            if (cell == 0) full = false;
        if (!full) new_board.push_back(row);
        else lines++;
    }
    while (new_board.size() < H)
        new_board.insert(new_board.begin(), vector<int>(W, 0));
    board = new_board;
    score += lines * 100;
}

void draw_border(int top, int left) {
    for (int y = 0; y < H; y++) {
        mvprintw(top + y, left - 1, "|");
        mvprintw(top + y, left + W * 2, "|");
    }
    mvprintw(top + H, left - 1, "+");
    for (int x = 0; x < W * 2; x++) printw("=");
    printw("+");
}

void draw_shape(const Matrix& shape, int ox, int oy, int top, int left) {
    for (int y = 0; y < shape.size(); y++)
        for (int x = 0; x < shape[y].size(); x++)
            if (shape[y][x])
                mvprintw(top + oy + y, left + (ox + x) * 2, "[]");
}

void draw_board(const vector<vector<int>>& board, const Matrix& shape, int ox, int oy,
                const Matrix& next_shape, int score, int level, bool paused) {
    clear();
    int top = 2, left = 4;

    for (int y = 0; y < H; y++)
        for (int x = 0; x < W; x++)
            if (board[y][x])
                mvprintw(top + y, left + x * 2, "[]");

    draw_shape(shape, ox, oy, top, left);
    draw_border(top, left);

    mvprintw(2, left + W * 2 + 4, "Next:");
    for (int y = 0; y < next_shape.size(); y++)
        for (int x = 0; x < next_shape[y].size(); x++)
            if (next_shape[y][x])
                mvprintw(3 + y, left + W * 2 + 4 + x * 2, "[]");

    mvprintw(9,  left + W * 2 + 4, "Score: %d", score);
    mvprintw(10, left + W * 2 + 4, "Level: %d", level);
    mvprintw(12, left + W * 2 + 4, "'P' = Pause");

    if (paused)
        mvprintw(H / 2, left + 2, "-- PAUSED --");

    refresh();
}

int hard_drop(const vector<vector<int>>& board, const Matrix& shape, int ox, int oy) {
    while (!check_collision(board, shape, ox, oy + 1))
        oy++;
    return oy;
}

int main() {
    initscr();
    noecho();
    cbreak();
    keypad(stdscr, TRUE);
    nodelay(stdscr, TRUE);
    curs_set(0);

    srand(time(0));
    auto board = new_board();
    auto shape = shapes[rand() % shapes.size()];
    auto next_shape = shapes[rand() % shapes.size()];
    int ox = W / 2 - shape[0].size() / 2, oy = 0;
    int score = 0, level = 0;
    double speed = 1.0;  // Lambat di awal
    bool paused = false;
    auto last_fall = chrono::steady_clock::now();

    while (true) {
        draw_board(board, shape, ox, oy, next_shape, score, level, paused);

        int ch = getch();
        if (ch == 'q') break;
        else if (ch == 'p' || ch == 'P') {
            paused = !paused;
            this_thread::sleep_for(chrono::milliseconds(200));
        }

        if (paused) {
            this_thread::sleep_for(chrono::milliseconds(50));
            continue;
        }

        if (ch == KEY_LEFT && !check_collision(board, shape, ox - 1, oy)) ox--;
        else if (ch == KEY_RIGHT && !check_collision(board, shape, ox + 1, oy)) ox++;
        else if (ch == KEY_DOWN || ch == ' ') oy = hard_drop(board, shape, ox, oy);
        else if (ch == KEY_UP) {
            auto rotated = rotate(shape);
            if (!check_collision(board, rotated, ox, oy))
                shape = rotated;
        }

        auto now = chrono::steady_clock::now();
        if (chrono::duration<double>(now - last_fall).count() > speed) {
            if (!check_collision(board, shape, ox, oy + 1)) {
                oy++;
            } else {
                merge(board, shape, ox, oy);
                clear_lines(board, score);
                shape = next_shape;
                next_shape = shapes[rand() % shapes.size()];
                ox = W / 2 - shape[0].size() / 2;
                oy = 0;
                if (check_collision(board, shape, ox, oy)) {
                    mvprintw(H / 2, 4, " GAME OVER ");
                    refresh();
                    this_thread::sleep_for(chrono::seconds(2));
                    break;
                }
            }
            last_fall = now;
        }

        int new_level = score / 2000;
        if (new_level > level) {
            level = new_level;
            speed = max(0.2, speed - 0.1);
        }

        this_thread::sleep_for(chrono::milliseconds(10));
    }

    endwin();
    return 0;
}
