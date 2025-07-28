#include <ncurses.h>
#include <vector>
#include <ctime>
#include <cstdlib>
#include <string>
#include <chrono>
#include <thread>
#include <array>
#include <optional>

using Matrix = std::vector<std::vector<int>>;
constexpr int W = 10, H = 20;

const std::array<Matrix, 7> shapes = {{
    {{1,1,1},{0,1,0}},       // T
    {{1,1},{1,1}},           // O
    {{1,1,0},{0,1,1}},       // Z
    {{0,1,1},{1,1,0}},       // S
    {{1,0,0},{1,1,1}},       // J
    {{0,0,1},{1,1,1}},       // L
    {{1,1,1,1}}              // I
}};

Matrix new_board() {
    return Matrix(H, std::vector<int>(W, 0));
}

Matrix rotate(const Matrix& shape) {
    int r = shape.size(), c = shape[0].size();
    Matrix out(c, std::vector<int>(r));
    for(int y=0; y<r; ++y)
        for(int x=0; x<c; ++x)
            out[x][r - 1 - y] = shape[y][x];
    return out;
}

bool collision(const Matrix& board, const Matrix& shape, int ox, int oy) {
    for(int y=0; y<shape.size(); ++y)
        for(int x=0; x<shape[y].size(); ++x)
            if (shape[y][x]) {
                int nx = ox+x, ny = oy+y;
                if (nx<0 || nx>=W || ny<0 || ny>=H || board[ny][nx])
                    return true;
            }
    return false;
}

void merge(Matrix& board, const Matrix& shape, int ox, int oy) {
    for(int y=0; y<shape.size(); ++y)
        for(int x=0; x<shape[y].size(); ++x)
            if (shape[y][x])
                board[oy+y][ox+x] = 1;
}

int clear_lines(Matrix& board) {
    int cleared = 0;
    Matrix nb;
    for(auto& row : board) {
        if (std::all_of(row.begin(), row.end(), [](int v){return v;}))
            ++cleared;
        else
            nb.push_back(row);
    }
    while (nb.size() < H)
        nb.insert(nb.begin(), std::vector<int>(W,0));
    board.swap(nb);
    return cleared;
}

void draw_border(int top,int left) {
    for(int y=0;y<H;++y) {
        mvprintw(top+y, left-1, "|");
        mvprintw(top+y, left+W*2, "|");
    }
    mvprintw(top+H, left-1, "+");
    for(int x=0;x<W*2;++x) printw("=");
    printw("+");
}

void draw_matrix(const Matrix& m, int ox, int oy, int top, int left) {
    for(int y=0; y<m.size(); ++y)
        for(int x=0; x<m[y].size(); ++x)
            if (m[y][x])
                mvprintw(top+oy+y, left+(ox+x)*2, "[]");
}

void draw(const Matrix& board, const Matrix& shape, int ox, int oy,
          const Matrix& next_shape, int score, int level, bool paused) {
    clear();
    int top = 2, left = 4;
    draw_matrix(board, 0, 0, top, left);
    draw_matrix(shape, ox, oy, top, left);
    draw_border(top,left);

    mvprintw(2, left+W*2+4, "Next:");
    draw_matrix(next_shape, 0, 0, 3, left+W*2+4);
    mvprintw(9, left+W*2+4, "Score: %d", score);
    mvprintw(10, left+W*2+4, "Level: %d", level);
    mvprintw(12, left+W*2+4, "'P' = Pause");
    if(paused)
        mvprintw(top+H/2, left+W/2-3, "-- PAUSED --");
    refresh();
}

int hard_drop(const Matrix& board, const Matrix& shape, int ox, int oy) {
    while (!collision(board, shape, ox, oy+1)) ++oy;
    return oy;
}

int main(){
    initscr(); noecho(); cbreak(); keypad(stdscr, TRUE);
    nodelay(stdscr, TRUE); curs_set(0);
    std::srand(std::time(nullptr));

    Matrix board = new_board();
    Matrix shape = shapes[std::rand()%shapes.size()];
    Matrix next_shape = shapes[std::rand()%shapes.size()];
    int ox = W/2 - shape[0].size()/2, oy = 0;
    int score=0, level=0;
    double speed=1.0;
    bool paused=false;
    auto last = std::chrono::steady_clock::now();

    while(true){
        draw(board, shape, ox, oy, next_shape, score, level, paused);
        int ch = getch();
        if(ch=='q'||ch=='Q') break;
        if(ch=='p'||ch=='P'){
            paused = !paused;
            std::this_thread::sleep_for(std::chrono::milliseconds(200));
        }
        if(paused){
            std::this_thread::sleep_for(std::chrono::milliseconds(50));
            continue;
        }

        if(ch==KEY_LEFT && !collision(board, shape, ox-1, oy)) --ox;
        else if(ch==KEY_RIGHT && !collision(board, shape, ox+1, oy)) ++ox;
        else if(ch==KEY_DOWN || ch==' ') oy = hard_drop(board, shape, ox, oy);
        else if(ch==KEY_UP){
            auto r = rotate(shape);
            if(!collision(board, r, ox, oy)) shape = std::move(r);
        }

        auto now = std::chrono::steady_clock::now();
        if (std::chrono::duration<double>(now - last).count() > speed) {
            if(!collision(board, shape, ox, oy+1)) ++oy;
            else {
                merge(board, shape, ox, oy);
                int lines = clear_lines(board);
                score += lines * 100;
                shape = next_shape;
                next_shape = shapes[std::rand()%shapes.size()];
                ox = W/2 - shape[0].size()/2; oy = 0;
                if(collision(board, shape, ox, oy)) {
                    mvprintw(H/2, 4, " GAME OVER ");
                    refresh();
                    std::this_thread::sleep_for(std::chrono::seconds(2));
                    break;
                }
            }
            last = now;
        }

        int new_level = score / 1000;
        if(new_level > level){
            level = new_level;
            speed = std::max(0.1, speed * 0.9);
        }
        std::this_thread::sleep_for(std::chrono::milliseconds(10));
    }

    endwin();
    return 0;
}

