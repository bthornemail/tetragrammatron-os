# How the four parts snap together (one tiny example)

A “circulating fold loop” that emits to SVG+WAVE:

1) read time  
2) quantize phase  
3) choose scheduler slot  
4) fold lane executes  
5) emit projection event  
6) wait to next tick

That is literally:
- physiology (clock)
- metabolism (patch/flip)
- nervous system (scheduler)
- perception (mux)

---
