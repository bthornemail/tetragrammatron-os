# Build quantum polynomial system
CC = gcc
CFLAGS = -O2 -Wall -Wextra -DF2POLY_MAX_DEGREE=63
LDFLAGS = -lm

QUANTUM_SRCS = \
    clbc_poly_final.c \
    clbc_harmonics.c \
    quantum_polynomial.c \
    periodic_table.c \
    test_quantum_polynomial.c

all: quantum_demo

quantum_demo: $(QUANTUM_SRCS)
	$(CC) $(CFLAGS) -o $@ $^ $(LDFLAGS)

test: quantum_demo
	./quantum_demo

clean:
	rm -f quantum_demo *.o
