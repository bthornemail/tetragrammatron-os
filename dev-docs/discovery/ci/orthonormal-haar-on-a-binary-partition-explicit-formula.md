# Orthonormal Haar on a binary partition (explicit formula)

Let VVV be the vertex set (finite), and suppose we have a parent block PPP partitioned into two disjoint children B0B_0B0  and B1B_1B1  with cardinalities n0=∣B0∣n_0=|B_0|n0 =∣B0 ∣, n1=∣B1∣n_1=|B_1|n1 =∣B1 ∣, N=n0+n1N=n_0+n_1N=n0 +n1 .

Define the parent **scaling function** (normalized indicator)

φP(v)=1N{1v∈P0otherwise.\varphi_P(v)=\frac{1}{\sqrt{N}}\begin{cases}1 & v\in P\0 & 	ext{otherwise}\end{cases}.φP (v)=N 1 {10 v∈Potherwise .

Define the child **Haar wavelet** ψP\psi_PψP  supported on PPP as

ψP(v)={av∈B0,bv∈B1,0otherwise,\psi_P(v) = \begin{cases} a & v\in B_0,\[4pt] b & v\in B_1,\[4pt] 0 & 	ext{otherwise}, \end{cases}ψP (v)=⎩⎨⎧ ab0 v∈B0 ,v∈B1 ,otherwise, 

where choose a,ba,ba,b so that (i) ⟨φP,ψP⟩=0\langle\varphi_P,\psi_P\rangle=0⟨φP ,ψP ⟩=0 and (ii) ∥ψP∥2=1\|\psi_P\|_2=1∥ψP ∥2 =1.

Solving these gives

a=n1 n0(n0+n1) ,b=−n0 n1(n0+n1) .a = \sqrt{\dfrac{n_1}{\,n_0 (n_0+n_1)\,}},\qquad b = -\sqrt{\dfrac{n_0}{\,n_1 (n_0+n_1)\,}}.a=n0 (n0 +n1 )n1   ,b=−n1 (n0 +n1 )n0   .

Check: an0+bn1=0a n_0 + b n_1 = 0an0 +bn1 =0 (orthogonality to φP\varphi_PφP ) and a2n0+b2n1=1a^2 n_0 + b^2 n_1 = 1a2n0 +b2n1 =1 (unit norm).

**Special (balanced) case**: n0=n1=nn_0=n_1=nn0 =n1 =n → a=b ⁣=±1/2na=b_{\!}= \pm 1/\sqrt{2n}a=b =±1/2n , so

ψP=12n(1B0−1B1).\psi_P = \frac{1}{\sqrt{2n}}\big( \mathbf{1}_{B_0} - \mathbf{1}_{B_1}\big).ψP =2n 1 (1B0  −1B1  ).

---
