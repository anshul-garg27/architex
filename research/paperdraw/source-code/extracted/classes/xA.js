A.xA.prototype={
gxl(){var s,r=null,q=this.U
if(q==null)q=this.U=A.jp(r,r,r,r,r,B.ah,r,r,B.dL,B.aG)
s=this.F
q.scX(0,s.e)
q.st1(0,s.r)
q.sbO(s.w)
q.scO(s.x)
q.srN(s.Q)
q.sVV(s.y)
q.smg(0,s.z)
q.smy(s.as)
q.st3(s.at)
q.st2(s.ax)
return q},
scX(a,b){var s=this,r=s.F
switch(r.e.au(0,b).a){case 0:return
case 1:r.scX(0,b)
s.a8=null
s.bA()
break
case 2:r.scX(0,b)
s.a8=s.X=null
s.aS()
s.bA()
break
case 3:r.scX(0,b)
s.a8=s.X=s.aJ=null
s.a9()
s.Sx()
s.Qr()
s.abf()
break}},
svR(a){var s=this
if(a==s.aj)return
s.Sx()
s.Qr()
s.aj=a
s.abf()},
abf(){var s,r,q=this
if(q.aj==null)return
s=q.a2
if(s==null)s=q.a2=q.aAd()
r=q.aj
B.b.av(s,r.gkA(r))
if(q.a2.length!==0)q.oc()},
Sx(){var s,r=this.aj
if(r==null||this.a2==null)return
s=this.a2
s.toString
B.b.av(s,r.gzj(r))},
aAd(){var s,r,q,p,o=this.F.e.q3(!1),n=A.a([],t.lb)
for(s=o.length,r=0;r<s;){q=B.c.h8(o,$.bSz(),r)
if(r!==q){if(q===-1)q=s
p=new A.rV(new A.dT(r,q),this,o,$.aU())
p.x=p.a4K()
n.push(p)
r=q}++r}return n},
Qr(){var s,r,q,p=this.a2
if(p==null)return
for(s=p.length,r=0;r<s;++r){q=p[r]
q.W$=$.aU()
q.a5$=0}this.a2=null},
glT(){var s=this.a2
s=s==null?null:s.length!==0
return s===!0},
a9(){var s=this.a2
if(s!=null)B.b.av(s,new A.aPd())
this.qo()},
n(){var s,r=this
r.Sx()
r.Qr()
r.F.n()
s=r.U
if(s!=null)s.n()
r.fu()},
st1(a,b){var s=this.F
if(s.r===b)return
s.st1(0,b)
this.aS()},
sbO(a){var s=this.F
if(s.w===a)return
s.sbO(a)
this.a9()},
samf(a){if(this.ai===a)return
this.ai=a
this.a9()},
sb2d(a,b){var s,r=this
if(r.am===b)return
r.am=b
s=b===B.as?"\u2026":null
r.F.sVV(s)
r.a9()},
scO(a){var s=this.F
if(s.x.m(0,a))return
s.scO(a)
this.aJ=null
this.a9()},
srN(a){var s=this.F
if(s.Q==a)return
s.srN(a)
this.aJ=null
this.a9()},
smg(a,b){var s=this.F
if(J.e(s.z,b))return
s.smg(0,b)
this.aJ=null
this.a9()},
smy(a){var s=this.F
if(J.e(s.as,a))return
s.smy(a)
this.aJ=null
this.a9()},
st3(a){var s=this.F
if(s.at===a)return
s.st3(a)
this.aJ=null
this.a9()},
st2(a){var s=this.F
if(J.e(s.ax,a))return
s.st2(a)
this.aJ=null
this.a9()},
salh(a){var s,r=this
if(J.e(r.aV,a))return
r.aV=a
s=r.a2
s=s==null?null:B.b.aE(s,new A.aPf())
if(s===!0)r.aS()},
B7(a){var s=this,r=s.oE(a,B.aT)
s.qN(t.k.a(A.P.prototype.gah.call(s)))
return r.a4(0,new A.i(0,s.F.Zw(a,B.aT)))},
by(a){var s=this.mf(1/0,new A.aPc(),A.ml()),r=this.gxl()
r.l_(s)
r.k7()
return r.b.a.c.gXu()},
bu(a){var s=this.mf(1/0,new A.aPb(),A.ml()),r=this.gxl()
r.l_(s)
r.k7()
return r.b.a.c.goe()},
a2C(a){var s=this,r=s.gxl()
r.l_(s.mf(a,A.jb(),A.ml()))
r.jB(s.ai||s.am===B.as?a:1/0,a)
r=r.b.a.c
return r.gbm(r)},
bx(a){return this.a2C(a)},
bt(a){return this.a2C(a)},
ip(a){return!0},
dv(a,b){var s,r=this.F,q=r.Zs(b),p=q!=null&&q.a.k(0,b)?r.e.ZH(new A.bk(q.b.a,B.D)):null
r=t.zE.b(p)
s=r?p:null
if(r){a.B(0,new A.mB(s,t.AL))
return!0}return this.afF(a,b)},
Aq(){this.P1()
this.F.a9()},
qN(a){var s,r=this,q=r.F
q.l_(r.bT)
s=a.b
s=r.ai||r.am===B.as?s:1/0
q.jB(s,a.a)},
cI(a){var s=this,r=s.gxl(),q=a.b
r.l_(s.mf(q,A.jb(),A.ml()))
q=s.ai||s.am===B.as?q:1/0
r.jB(q,a.a)
r=r.b
q=r.c
r=r.a.c
return a.bk(new A.K(q,r.gbm(r)))},
ho(a){this.qN(t.k.a(A.P.prototype.gah.call(this)))
return this.F.b.a.qb(B.a1)},
e_(a,b){var s=this,r=s.gxl(),q=a.b
r.l_(s.mf(q,A.jb(),A.ml()))
q=s.ai||s.am===B.as?q:1/0
r.jB(q,a.a)
return s.gxl().b.a.qb(B.a1)},
bU(){var s,r,q,p,o,n,m,l,k,j,i,h=this,g=null,f=h.a2
if(f!=null)B.b.av(f,new A.aPe())
s=t.k.a(A.P.prototype.gah.call(h))
h.bT=h.mf(s.b,A.q_(),A.byE())
h.qN(s)
f=h.F
r=f.gafQ()
r.toString
h.ahH(r)
r=f.b
q=r.c
r=r.a.c
r=r.gbm(r)
h.fy=s.bk(new A.K(q,r))
p=h.gG(0).b<r||f.b.a.c.gae3()
o=h.gG(0).a<q
if(o||p)switch(h.am.a){case 3:h.aP=!1
h.aJ=null
break
case 0:case 2:h.aP=!0
h.aJ=null
break
case 1:h.aP=!0
r=A.cF(g,g,g,g,f.e.a,"\u2026")
q=f.w
q.toString
n=f.x
m=A.jp(g,f.z,g,g,r,B.ah,q,g,n,B.aG)
m.k7()
if(o){switch(f.w.a){case 0:f=new A.aH(m.b.c,0)
break
case 1:f=new A.aH(h.gG(0).a-m.b.c,h.gG(0).a)
break
default:f=g}l=f.a
k=g
j=f.b
k=j
i=l
h.aJ=A.aDN(new A.i(i,0),new A.i(k,0),A.a([B.r,B.DT],t.O),g,B.b2,g)}else{k=h.gG(0).b
f=m.b.a.c
h.aJ=A.aDN(new A.i(0,k-f.gbm(f)/2),new A.i(0,k),A.a([B.r,B.DT],t.O),g,B.b2,g)}m.n()
break}else{h.aP=!1
h.aJ=null}},
eg(a,b){this.adU(a,b)},
aX(a,b){var s,r,q,p,o,n,m=this
m.qN(t.k.a(A.P.prototype.gah.call(m)))
if(m.aP){s=m.gG(0)
r=b.a
q=b.b
p=new A.M(r,q,r+s.a,q+s.b)
if(m.aJ!=null){s=a.gbH(0)
$.am()
s.hO(p,A.ba())}else J.b2(a.gbH(0).a.save())
a.gbH(0).a.clipRect(A.el(p),$.mn()[1],!0)}s=m.a2
if(s!=null)for(r=s.length,o=0;o<s.length;s.length===r||(0,A.o)(s),++o)s[o].aX(a,b)
m.F.aX(a.gbH(0),b)
m.ahs(a,b)
if(m.aP){if(m.aJ!=null){a.gbH(0).a.translate(b.a,b.b)
$.am()
n=A.ba()
n.a=B.CC
n.swn(m.aJ)
s=a.gbH(0)
r=m.gG(0)
s.hU(new A.M(0,0,0+r.a,0+r.b),n)}a.gbH(0).a.restore()}},
oE(a,b){this.qN(t.k.a(A.P.prototype.gah.call(this)))
return this.F.oE(a,b)},
Zr(a,b){this.qN(t.k.a(A.P.prototype.gah.call(this)))
return this.F.te(a,b,B.lp)},
oD(a){return this.Zr(a,B.rq)},
f8(a){this.qN(t.k.a(A.P.prototype.gah.call(this)))
return this.F.f8(a)},
jK(a){this.qN(t.k.a(A.P.prototype.gah.call(this)))
return this.F.b.a.c.jK(a)},
fb(a){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b=this
b.jg(a)
s=b.F
r=s.e
r.toString
q=A.a([],t.O_)
r.Kf(q)
b.ca=q
r=q.length
o=!1
n=0
for(;;){if(!(n<r)){p=!1
break}m=q[n]
if(m.d!=null){p=!0
break}o=o||m.e;++n}if(p)a.a=a.e=!0
else if(o)a.p2=b.gav6()
else{r=b.X
if(r==null){l=new A.dl("")
k=A.a([],t.oU)
for(r=b.ca,j=r.length,i=0,n=0,h="";n<r.length;r.length===j||(0,A.o)(r),++n){m=r[n]
g=m.b
if(g==null)g=m.a
for(h=m.r,f=h.length,e=0;e<h.length;h.length===f||(0,A.o)(h),++e){d=h[e]
c=d.a
k.push(d.UV(new A.dT(i+c.a,i+c.b)))}h=l.a+=g
i+=g.length}r=b.X=A.a([new A.f5(h.charCodeAt(0)==0?h:h,k)],t.NS)}a.y2=r[0]
a.r=!0
s=s.w
s.toString
a.a2=s}},
av7(a){var s,r,q,p,o,n,m,l,k,j=this,i=A.a([],t.q1),h=A.a([],t.X_),g=j.a8
if(g==null){g=j.ca
g.toString
g=j.a8=A.bEL(g)}for(s=g.length,r=0,q=0,p=0,o=null,n=0;n<g.length;g.length===s||(0,A.o)(g),++n){m=g[n]
if(m.e){if(o!=null){i.push(j.a31(o,p));++p}l="PlaceholderSpanIndexSemanticsTag("+r+")"
for(;;){if(q<a.length){k=a[q].a5
k=k==null?null:k.k(0,new A.ul(r,l))
k=k===!0}else k=!1
if(!k)break
i.push(a[q]);++q}++r}else o=m}if(o!=null)i.push(j.a31(o,p))
return new A.Eg(i,h)},
a31(a,b){var s,r,q,p=this.X
if(p==null)p=this.X=A.a([],t.NS)
s=p.length
r=A.cW()
if(b<s)r.b=p[b]
else{s=a.b
if(s==null)s=a.a
r.b=new A.f5(s,a.r)
p.push(r.bi())}s=A.ko()
q=this.F.w
q.toString
s.a2=q
s.r=!0
s.y2=r.bi()
s.r=!0
return s},
un(c1,c2,c3){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,b0,b1,b2,b3,b4,b5,b6=this,b7=null,b8=A.a([],t.QF),b9=b6.F,c0=b9.w
c0.toString
s=b6.ar$
r=A.j(t.D2,t.bu)
q=b6.a8
if(q==null){q=b6.ca
q.toString
q=b6.a8=A.bEL(q)}for(p=q.length,o=t.k,n=t.Nw,m=A.l(b6).i("aQ.1"),l=t.tq,k=c0,j=0,i=0,h=0,g=0,f=0;f<q.length;q.length===p||(0,A.o)(q),++f,i=d){e=q[f]
c0=e.a
d=i+c0.length
c=i<d
b=c?i:d
c=c?d:i
if(e.e){c0="PlaceholderSpanIndexSemanticsTag("+h+")"
for(;;){if(c3.length>g){c=c3[g].dy
c=c!=null&&c.k(0,new A.ul(h,c0))}else c=!1
if(!c)break
a=c3[g]
c=s.b
c.toString
if(l.a(c).a!=null)b8.push(a);++g}c0=s.b
c0.toString
s=m.a(c0).aH$;++h}else{a0=o.a(A.P.prototype.gah.call(b6))
b9.l_(b6.bT)
a1=a0.b
a1=b6.ai||b6.am===B.as?a1:1/0
b9.jB(a1,a0.a)
a2=b9.te(new A.la(i,d,B.D,!1,b,c),B.rq,B.lp)
if(a2.length===0)continue
c=B.b.gS(a2)
a3=new A.M(c.a,c.b,c.c,c.d)
a4=B.b.gS(a2).e
for(c=A.v(a2),b=c.i("aV<1>"),a0=new A.aV(a2,1,b7,b),a0.bX(a2,1,b7,c.c),a0=new A.bp(a0,a0.gv(0),b.i("bp<a2.E>")),b=b.i("a2.E");a0.p();){c=a0.d
if(c==null)c=b.a(c)
a3=a3.h2(new A.M(c.a,c.b,c.c,c.d))
a4=c.e}c=a3.a
b=Math.max(0,c)
a0=a3.b
a1=Math.max(0,a0)
c=Math.min(a3.c-c,o.a(A.P.prototype.gah.call(b6)).b)
a0=Math.min(a3.d-a0,o.a(A.P.prototype.gah.call(b6)).d)
a5=Math.floor(b)-4
a6=Math.floor(a1)-4
c=Math.ceil(b+c)+4
a0=Math.ceil(a1+a0)+4
a7=new A.M(a5,a6,c,a0)
a8=A.ko()
a9=j+1
a8.p3=new A.ue(j,b7)
a8.r=!0
a8.a2=k
a8.xr=""
b=e.b
c0=b==null?c0:b
a8.y2=new A.f5(c0,e.r)
$label0$1:{b0=e.d
c0=b7
if(b0 instanceof A.ku){b1=b0.X
b=n.b(b1)
if(b)c0=b1}else b=!1
if(b){if(c0!=null){a8.hR(B.mu,c0)
a8.y=c0
a8.W=a8.W.V1(!0)
a8.r=!0}break $label0$1}break $label0$1}c0=c1.r
if(c0!=null){b2=c0.fk(a7)
if(b2.a>=b2.c||b2.b>=b2.d)c0=!(a5>=c||a6>=a0)
else c0=!1
a8.W=a8.W.V0(c0)}c0=b6.c7
c=c0==null?b7:c0.a!==0
if(c===!0){c0.toString
b3=new A.bs(c0,A.l(c0).i("bs<1>")).gT(0)
if(!b3.p())A.a3(A.d9())
c0=c0.L(0,b3.gH(0))
c0.toString
b4=c0}else{b5=new A.pG()
b4=A.Ca(b5,b6.aIX(b5))}b4.aj4(0,a8)
if(!b4.e.m(0,a7)){b4.e=a7
b4.ji()}c0=b4.a
c0.toString
r.j(0,c0,b4)
b8.push(b4)
j=a9
k=a4}}b6.c7=r
c1.mr(0,b8,c2)},
aIX(a){return new A.aPa(this,a)},
uw(){this.P2()
this.c7=null}}
