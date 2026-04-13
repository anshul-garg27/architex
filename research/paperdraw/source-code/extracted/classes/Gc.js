A.Gc.prototype={
B(a,b){this.Q.B(0,b)
this.a8L()},
L(a,b){var s,r,q=this
if(q.Q.L(0,b))return
s=B.b.eH(q.b,b)
B.b.df(q.b,s)
r=q.c
if(s<=r)q.c=r-1
r=q.d
if(s<=r)q.d=r-1
b.V(0,q.gRg())
q.a8L()},
a8L(){var s,r
if(!this.y){this.y=!0
s=new A.aKu(this)
r=$.cK
if(r.x1$===B.A0)A.hD(s)
else r.rx$.push(s)}},
az5(){var s,r,q,p,o,n,m,l,k=this,j=k.Q,i=A.r(j,A.l(j).c)
B.b.be(i,k.gCY())
s=k.b
k.b=A.a([],t.D1)
r=k.d
q=k.c
j=k.gRg()
p=0
o=0
for(;;){n=i.length
if(!(p<n||o<s.length))break
c$0:{if(p<n)n=o<s.length&&k.acV(s[o],i[p])<0
else n=!0
if(n){if(o===k.d)r=k.b.length
if(o===k.c)q=k.b.length
B.b.B(k.b,s[o]);++o
break c$0}m=i[p]
n=k.d
l=k.c
if(o<Math.max(n,l)&&o>Math.min(n,l))k.ru(m)
m.ag(0,j)
B.b.B(k.b,m);++p}}k.c=q
k.d=r
k.Q=A.ak(t.x9)},
KR(){this.Jl()},
Jl(){var s=this,r=s.akL()
if(!s.at.m(0,r)){s.at=r
s.aI()}s.aPU()},
gCY(){return A.ceL()},
aDm(){if(this.x)return
this.Jl()},
akL(){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c=this,b=null,a=c.c
if(a===-1||c.d===-1||c.b.length===0)return new A.xJ(b,b,B.la,B.yS,c.b.length!==0)
if(!c.as){a=c.a11(c.d,a)
c.d=a
c.c=c.a11(c.c,a)}a=c.b[c.d]
s=a.gA(a)
a=c.c
r=c.d
q=a>=r
for(;;){if(!(r!==c.c&&s.a==null))break
r+=q?1:-1
a=c.b[r]
s=a.gA(a)}a=s.a
if(a!=null){p=c.b[r]
o=c.a.gad()
o.toString
n=A.cm(p.bf(0,t.x.a(o)),a.a)
m=isFinite(n.a)&&isFinite(n.b)?new A.C6(n,a.b,a.c):b}else m=b
a=c.b[c.c]
l=a.gA(a)
k=c.c
for(;;){if(!(k!==c.d&&l.b==null))break
k+=q?-1:1
a=c.b[k]
l=a.gA(a)}a=l.b
if(a!=null){p=c.b[k]
o=c.a.gad()
o.toString
j=A.cm(p.bf(0,t.x.a(o)),a.a)
i=isFinite(j.a)&&isFinite(j.b)?new A.C6(j,a.b,a.c):b}else i=b
h=A.a([],t.AO)
g=c.gaZy()?new A.M(0,0,0+c.gad2().a,0+c.gad2().b):b
for(f=c.d;f<=c.c;++f){a=c.b[f]
e=a.gA(a).d
a=new A.q(e,new A.aKv(c,f,g),A.v(e).i("q<1,M>")).nr(0,new A.aKw())
d=A.r(a,a.$ti.i("k.E"))
B.b.q(h,d)}return new A.xJ(m,i,!s.m(0,l)?B.A9:s.c,h,!0)},
a11(a,b){var s,r=b>a
for(;;){if(a!==b){s=this.b[a]
s=s.gA(s).c!==B.A9}else s=!1
if(!s)break
a+=r?1:-1}return a},
om(a,b){return},
aPU(){var s,r=this,q=null,p=r.e,o=r.r,n=r.d
if(n===-1||r.c===-1){n=r.f
if(n!=null){n.om(q,q)
r.f=null}n=r.w
if(n!=null){n.om(q,q)
r.w=null}return}n=r.b[n]
s=r.f
if(n!==s)if(s!=null)s.om(q,q)
n=r.b[r.c]
s=r.w
if(n!==s)if(s!=null)s.om(q,q)
n=r.b
s=r.d
n=r.f=n[s]
if(s===r.c){r.w=n
n.om(p,o)
return}n.om(p,q)
n=r.b[r.c]
r.w=n
n.om(q,o)},
a92(){var s,r,q,p=this,o=p.d,n=o===-1
if(n&&p.c===-1)return
if(n||p.c===-1){if(n)o=p.c
n=p.b
new A.J(n,new A.aKq(p,o),A.v(n).i("J<1>")).av(0,new A.aKr(p))
return}n=p.c
s=Math.min(o,n)
r=Math.max(o,n)
for(q=0;n=p.b,q<n.length;++q){if(q>=s&&q<=r)continue
p.h0(n[q],B.p6)}},
LN(a){var s,r,q,p=this
for(s=p.b,r=s.length,q=0;q<s.length;s.length===r||(0,A.o)(s),++q)p.h0(s[q],a)
p.d=0
p.c=p.b.length-1
return B.qL},
a5j(a){var s,r,q,p,o,n,m,l,k,j,i=this,h=A.cW(),g=a.a
if(g===B.aDg)h.sdR(t.hI.a(a).gZO())
else if(g===B.aDh)h.sdR(a.b)
for(g=h.a,s=null,r=0;q=i.b,r<q.length;++r){p=!1
if(q[r].gpo().length!==0)for(q=i.b[r].gpo(),o=q.length,n=0;n<q.length;q.length===o||(0,A.o)(q),++n){m=q[n]
l=A.hn(i.b[r].bf(0,null),m)
k=h.b
if(k===h)A.a3(A.p8(g))
if(l.k(0,k)){p=!0
break}}if(p){q=i.b[r]
j=q.gA(q)
s=i.h0(i.b[r],a)
q=i.b
if(r===q.length-1&&s===B.aI)return B.aI
if(s===B.aI)continue
if(r===0&&s===B.aS)return B.aS
g=q[r]
if(!g.gA(g).m(0,j)){g=i.b
new A.J(g,new A.aKs(i,r),A.v(g).i("J<1>")).av(0,new A.aKt(i))
i.d=i.c=r}return B.b0}else if(s===B.aI){i.d=i.c=r-1
return B.b0}}return B.b0},
LP(a){return this.a5j(a)},
LO(a){return this.a5j(a)},
LI(a){var s,r,q,p=this
for(s=p.b,r=s.length,q=0;q<s.length;s.length===r||(0,A.o)(s),++q)p.h0(s[q],a)
p.d=p.c=-1
return B.qL},
Wn(a){var s,r,q,p=this
if(p.d===-1)if(a.gLD(a))p.d=p.c=0
else p.d=p.c=p.b.length-1
s=a.gnc()?p.c:p.d
r=p.h0(p.b[s],a)
if(a.gLD(a))for(;;){q=p.b
if(!(s<q.length-1&&r===B.aI))break;++s
r=p.h0(q[s],a)}else for(;;){if(!(s>0&&r===B.aS))break;--s
r=p.h0(p.b[s],a)}if(a.gnc())p.c=s
else p.d=s
return r},
Wm(a){var s,r,q,p=this
if(p.d===-1){a.gKW(a)
$label0$0:{}p.d=p.c=null}s=a.gnc()?p.c:p.d
r=p.h0(p.b[s],a)
switch(a.gKW(a)){case B.A6:if(r===B.aS)if(s>0){--s
r=p.h0(p.b[s],a.aTH(B.uL))}break
case B.A7:if(r===B.aI){q=p.b
if(s<q.length-1){++s
r=p.h0(q[s],a.aTH(B.uK))}}break
case B.uK:case B.uL:break}if(a.gnc())p.c=s
else p.d=s
return r},
o4(a){var s=this
if(a.a===B.l9)return s.c===-1?s.a93(a,!0):s.a91(a,!0)
return s.d===-1?s.a93(a,!1):s.a91(a,!1)},
rp(a){var s,r=this,q=!(a instanceof A.M8)
if(!r.z&&q)B.b.be(r.b,r.gCY())
r.z=q
r.x=!0
s=A.cW()
switch(a.a.a){case 0:case 1:r.as=!1
s.b=r.o4(t.mb.a(a))
break
case 2:r.as=!1
s.b=r.LI(t.nR.a(a))
break
case 3:r.as=!1
s.b=r.LN(t.qd.a(a))
break
case 4:r.as=!1
s.b=r.LP(t.hI.a(a))
break
case 5:r.as=!1
s.b=r.LO(t.NU.a(a))
break
case 6:r.as=!0
s.b=r.Wn(t.rQ.a(a))
break
case 7:r.as=!0
s.b=r.Wm(t.GV.a(a))
break}r.x=!1
r.Jl()
return s.bi()},
n(){var s,r,q,p,o=this
for(s=o.b,r=s.length,q=o.gRg(),p=0;p<s.length;s.length===r||(0,A.o)(s),++p)s[p].V(0,q)
o.b=B.aqf
o.y=!1
o.eO()},
h0(a,b){return a.rp(b)},
a93(a,b){var s,r,q=this,p=-1,o=!1,n=null,m=0
for(;;){s=q.b
if(!(m<s.length&&!o))break
r=!0
switch(q.h0(s[m],a).a){case 0:case 4:p=m
break
case 2:o=r
p=m
n=B.b0
break
case 1:if(m===0){p=0
n=B.aS}if(n==null)n=B.b0
o=r
break
case 3:o=r
p=m
n=B.A8
break}++m}if(p===-1)return B.qL
if(b)q.c=p
else q.d=p
q.a92()
return n==null?B.aI:n},
a91(a6,a7){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1=this,a2=null,a3=a1.at,a4=a7?a3.b!=null:a3.a!=null,a5=a7?a3.a!=null:a3.b!=null
$label0$0:{s=a2
r=a2
a3=!1
if(a7){if(a4){a3=a5
r=a3
s=r}q=a4
p=q
o=p
n=o}else{o=a2
n=o
p=!1
q=!1}m=0
if(a3){a3=a1.c
break $label0$0}l=a2
k=!1
a3=!1
if(a7)if(n){if(q)a3=r
else{a3=a5
r=a3
q=!0}l=!1===a3
a3=l
k=!0}if(a3){a3=a1.c
break $label0$0}j=a2
a3=!1
if(a7){j=!1===o
i=j
if(i)if(p)a3=s
else{if(q)a3=r
else{a3=a5
r=a3
q=!0}s=!0===a3
a3=s
p=!0}}if(a3){a3=a1.d
break $label0$0}a3=!1
if(a7)if(j)if(k)a3=l
else{if(q)a3=r
else{a3=a5
r=a3
q=!0}l=!1===a3
a3=l
k=!0}if(a3){a3=m
break $label0$0}h=!a7
a3=h
i=!1
if(a3){if(a7){a3=n
g=a7
f=g}else{n=!0===a4
a3=n
o=a4
f=!0
g=!0}if(a3)if(p)a3=s
else{if(q)a3=r
else{a3=a5
r=a3
q=!0}s=!0===a3
a3=s
p=!0}else a3=i}else{a3=i
g=a7
f=g}if(a3){a3=a1.d
break $label0$0}a3=!1
if(h){if(f)i=n
else{if(g)i=o
else{i=a4
o=i
g=!0}n=!0===i
i=n}if(i)if(k)a3=l
else{if(q)a3=r
else{a3=a5
r=a3
q=!0}l=!1===a3
a3=l
k=!0}}if(a3){a3=a1.d
break $label0$0}a3=!1
if(h){if(a7){i=j
e=a7}else{if(g)i=o
else{i=a4
o=i
g=!0}j=!1===i
i=j
e=!0}if(i)if(p)a3=s
else{if(q)a3=r
else{a3=a5
r=a3
q=!0}s=!0===a3
a3=s}}else e=a7
if(a3){a3=a1.c
break $label0$0}a3=!1
if(h){if(e)i=j
else{j=!1===(g?o:a4)
i=j}if(i)if(k)a3=l
else{l=!1===(q?r:a5)
a3=l}}if(a3){a3=m
break $label0$0}a3=a2}d=A.cW()
c=a2
b=a3
a=c
for(;;){a3=a1.b
if(!(b<a3.length&&b>=0&&a==null))break
a0=d.b=a1.h0(a3[b],a6)
switch(a0.a){case 2:case 3:case 4:a=a0
break
case 0:if(c===!1){++b
a=B.b0}else if(b===a1.b.length-1)a=a0
else{++b
c=!0}break
case 1:if(c===!0){--b
a=B.b0}else if(b===0)a=a0
else{--b
c=!1}break}}if(a7)a1.c=b
else a1.d=b
a1.a92()
a.toString
return a},
acV(a,b){return this.gCY().$2(a,b)}}
