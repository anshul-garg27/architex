A.XY.prototype={
kw(a){var s=this
if(s.p4===a&&s.c!=null)return
s.J(new A.bl3(s,a))
s.a.x.$1(a)},
aM(){var s,r,q,p=this
p.b3()
s=p.gab()
r=$.aP()
p.ay.sA(0,s.K(0,r,t.v).b)
p.CW=s.vw(new A.ch(r,new A.bmA(),r.$ti.i("ch<cR.0,t<bR>>")),new A.bmB(p),t.h0)
r=$.bVx()
q=t.CK
p.ax.sA(0,s.K(0,r,q))
p.ch=s.vw(r,new A.bmC(p),q)
p.w.ag(0,p.ga6Y())
$.ax.rx$.push(new A.bmD(p))},
b9(a){var s=this
s.bs(a)
if(s.a.f!==a.f){if(s.c==null)return
s.J(new A.bmx(s))}if(s.a.w!=a.w)s.J(new A.bmy(s))
if(s.a.r!==a.r){if(s.c==null)return
s.J(new A.bmz(s))}},
n(){var s,r,q=this
q.a.d.$1(!1)
s=q.CW
if(s!=null)s.aA(0)
s=q.ch
if(s!=null)s.aA(0)
s=q.w
s.V(0,q.ga6Y())
s.W$=$.aU()
s.a5$=0
q.ok.n()
s=q.Q
if(s!=null)s.aN(0)
s=q.as
if(s!=null)s.aN(0)
for(s=q.at,r=new A.bF(s,s.r,s.e,A.l(s).i("bF<2>"));r.p();)r.d.aN(0)
s.aa(0)
s=q.ax
r=$.aU()
s.W$=r
s.a5$=0
s=q.ay
s.W$=r
s.a5$=0
q.aR()},
aIj(){if(this.x||this.y)return
this.awJ()},
awJ(){var s=this.Q
if(s!=null)s.aN(0)
this.Q=A.dr(B.Y,new A.bkE(this))},
Ci(){var s=this.w.a,r=s.tk(),q=s.lE(),p=r.a
this.gab().K(0,$.aP().gal(),t.F).NQ(new A.i(p[0],p[1]),q)},
xF(a){this.x=!0
this.w.sA(0,a)
this.x=!1},
nz(a){var s,r,q,p=t.aA.a(this.c.gad())
if(p==null)return a
s=p.eL(a)
r=this.w.a
q=new A.bu(new Float64Array(16))
q.bC(r)
q.iR(q)
return A.cm(q,s)},
ga6q(){var s,r=this.id
if(!(r!=null&&this.k1!=null))return null
s=this.k1
s.toString
return A.nQ(r,s)},
a9V(a){return A.bEj(a)||a===B.aM||a===B.aX||a===B.aR},
J6(a){var s=a.b
return s!==B.bq&&s!==B.bx&&s!==B.bX},
aNm(a,b,c,d,e){var s,r=this
if(e||!r.J6(b))return!1
s=b.a
if(r.k3===s)return!1
if(!d)return!1
if(r.cx===s||c===s)return!0
if(!(a===B.d5||a===B.ct))return!1
return r.fy===s||r.go===s},
ax3(a){var s,r=a.e.go
if(r!=null&&B.b.k(B.nU,r))return r
s=a.b
if(B.b.k(B.nU,s))return s
return B.av},
It(a,b){return this.aKy(a,b)},
aKy(a,b){var s=0,r=A.A(t.y),q,p=this,o,n,m,l,k,j,i,h
var $async$It=A.w(function(c,d){if(c===1)return A.x(d,r)
for(;;)switch(s){case 0:h=A.a([],t.Jc)
if(p.a9V(a.b))h.push(a)
if(p.a9V(b.b)&&b.a!==a.a)h.push(b)
o=h.length
if(o===0){q=!0
s=1
break}n=A.j(t.N,t._w)
for(m=0;m<h.length;h.length===o||(0,A.o)(h),++m){l=h[m]
n.j(0,l.a,p.ax3(l))}o=p.c
o.toString
s=3
return A.n(A.fE(null,!1,new A.bl1(h,n),o,t.y),$async$It)
case 3:if(d!==!0){q=!1
s=1
break}k=p.gab().K(0,$.aP().gal(),t.F)
for(o=h.length,m=0;m<h.length;h.length===o||(0,A.o)(h),++m){l=h[m]
j=l.a
i=n.h(0,j)
if(i==null||l.e.go===i)continue
k.zC(j,l.e.V3(i))}q=!0
s=1
break
case 1:return A.y(q,r)}})
return A.z($async$It,r)},
tM(a,b,c){return this.avZ(a,b,c)},
avZ(a,b,c){var s=0,r=A.A(t.y),q,p=this,o,n,m,l,k
var $async$tM=A.w(function(d,e){if(d===1)return A.x(e,r)
for(;;)switch(s){case 0:o=p.gab()
n=$.aP()
m=o.K(0,n,t.v).ax
l=m.h(0,b)
k=m.h(0,c)
if(l==null||k==null){q=!1
s=1
break}s=3
return A.n(p.It(l,k),$async$tM)
case 3:if(!e||p.c==null){q=!1
s=1
break}q=o.K(0,n.gal(),t.F).aTi(c,a,b)==null
s=1
break
case 1:return A.y(q,r)}})
return A.z($async$tM,r)},
R(b3){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4,a5,a6=this,a7=null,a8=a6.gab(),a9=a8.an($.je(),t.y),b0=$.aP(),b1=b0.$ti,b2=a8.an(new A.ch(b0,new A.bmd(),b1.i("ch<cR.0,t<bw>>")),t.Xv)
a8.an(new A.ch(b0,new A.bme(a6),b1.i("ch<cR.0,p>")),t.S)
s=a6.ay.a
r=b1.i("ch<cR.0,c?>")
q=t.A
p=a8.an(new A.ch(b0,new A.bmf(),r),q)
o=a8.an(new A.ch(b0,new A.bmp(),b1.i("ch<cR.0,bT<c>>")),t.c8)
n=a8.an(new A.ch(b0,new A.bmq(),r),q)
m=A.Ec(a7,b2,a7,n,a7,s,!1,B.lt,B.l,1,p,o,!0,a7,1)
l=a6.aQz(m)
k=a8.an($.h4(),t._Y)
j=a8.an($.ec(),t.g)===B.b8
i=a8.an($.fh(),t.rD)
q=i.x
r=A.v(q).i("J<1>")
b1=A.r(new A.J(q,new A.bmr(),r),r.i("k.E"))
b1.$flags=1
h=b1
g=a8.an($.fO(),t.C)
b1=A.bM(b3,B.e_,t.w).w
f=a6.p2&&a6.rx!=null
r=k===B.ct
e=A.ceN(b2,n,s,r)
d=k===B.d5
c=k===B.Dj||k===B.lu||k===B.n3||r||k===B.n4||k===B.p3
b=d&&a6.a64()
a=a6.ga6q()
a8.vv(b0,new A.bms(a6))
a8=j?B.rN:B.cJ
b0=A.Z(12)
s=A.aC(j?B.Es:B.B,B.k,1)
r=t.p
b0=A.a([A.lS(0,A.ab(a7,A.ts(A.Z(12),new A.F_(new A.bmt(a6,k===B.ja,k,d,c,b,m,j,l,i.a===B.cs,a,n!=null,a9,i),new A.bmu(),new A.bmv(a6,b3),new A.bmw(a6),new A.bmg(a6),a7,t.BK),B.ec),B.i,a7,a7,new A.a4(a8,a7,s,b0,a7,a7,a7,B.p),a7,a7,a7,a7,a7,a7,a7,a7))],r)
if(h.length!==0){a8=i.b
b0.push(A.lS(0,A.ht(new A.ac_(h,a8.d,a8.r,a8.ay,a7),!0,a7)))}if(e&&!a9){a8=f?366:16
s=B.F.u(0.92)
q=A.Z(12)
a0=A.aC(B.m.u(0.6),B.k,1)
a1=A.a([new A.b6(0,B.Q,B.v.u(0.35),B.iQ,14)],t.V)
b0.push(A.dj(a7,new A.dB(B.i7,a7,a7,new A.eM(B.Yh,A.dq(!1,B.Y,!0,a7,A.ab(a7,A.al(A.a([A.bv(B.nQ,B.m.u(0.9),a7,18),B.cQ,B.abv,B.an,A.py(B.agP,B.aOZ,new A.bmh(a6),A.xX(a7,a7,a7,a7,a7,a7,a7,a7,a7,B.m,a7,a7,B.pE,a7,a7,a7,a7,a7,a7,B.ki))],r),B.n,B.f,B.j,0,a7),B.i,a7,a7,new A.a4(s,a7,a0,q,a1,a7,a7,B.p),a7,a7,a7,a7,B.pF,a7,a7,a7),B.i,B.C,0,a7,a7,a7,a7,a7,B.aO),a7),a7),a7,a7,16,a8,12,a7))}a8=a6.p2&&a6.rx!=null?0:-350
s=B.F.u(0.95)
q=t.V
a0=A.a([new A.b6(5,B.Q,B.v.u(0.4),B.l,20)],q)
$.am()
a1=a6.rx
if(a1!=null){a2=B.B.u(0.5)
a3=A.a([new A.b6(0,B.Q,B.v.u(0.2),B.NY,20)],q)
a3=A.ab(a7,A.au(A.a([new A.ap(B.dU,A.al(A.a([B.agK,B.bg,B.abA,A.fI(B.O,a7,a7,B.H9,a7,a7,a6.gavp(),a7,a7,a7,a7,a7)],r),B.n,B.f,B.j,0,a7),a7),B.t9,A.bC(new A.U3(a1,a7),1,a7)],r),B.A,B.f,B.j),B.i,a7,a7,new A.a4(B.F,a7,new A.dC(B.z,B.z,B.z,new A.aO(a2,1,B.k,-1)),a7,a3,a7,a7,B.p),a7,a7,a7,a7,a7,a7,a7,320)
a1=a3}else a1=B.ag
b0.push(A.L4(0,A.ab(a7,A.ts(B.bw,A.a02(A.dq(!1,B.Y,!0,a7,a1,B.i,B.C,0,a7,a7,a7,a7,a7,B.aO),new A.v8(10,10,a7)),B.ec),B.i,a7,a7,new A.a4(s,a7,B.CL,a7,a0,a7,a7,B.p),a7,a7,a7,a7,a7,a7,a7,a7),B.aZ,B.dT,a7,a8,0,350))
a8=a6.p3?0:-300
s=B.F.u(0.95)
a0=A.a([new A.b6(5,B.Q,B.v.u(0.4),B.l,20)],q)
b0.push(A.L4(0,A.ab(a7,A.ts(B.bw,A.a02(A.dq(!1,B.Y,!0,a7,new A.a9f(new A.bmi(a6),new A.bmj(a6),a7),B.i,B.C,0,a7,a7,a7,a7,a7,B.aO),new A.v8(10,10,a7)),B.ec),B.i,a7,a7,new A.a4(s,a7,B.CL,a7,a0,a7,a7,B.p),a7,a7,a7,a7,a7,a7,a7,a7),B.aZ,B.dT,a7,a8,0,300))
a8=a6.p4?0:-420
s=A.a([new A.b6(0,B.Q,B.v.u(0.2),B.NY,15)],q)
a0=a6.RG
if(a0!=null)a0=new A.MR(a7,a0,new A.bmk(a6),a7)
else{a0=a6.R8
a0=a0!=null?new A.MR(a0,a7,new A.bml(a6),a7):B.ag}b0.push(A.L4(0,A.ab(a7,A.nU(!0,a0,B.aw,!0),B.i,a7,a7,new A.a4(B.F,a7,a7,a7,s,a7,a7,B.p),a7,a7,a7,a7,a7,a7,a7,a7),B.a8y,B.dT,a7,a8,0,420))
if(!(b1.a.a<900)){a8=a6.a.y
if(f)b1=350
else if(a6.p4)b1=420
else b1=a6.p3?300:0
if(j)s=A.AT(14,!0)
else{s=B.F.u(0.86)
a0=A.Z(12)
a0=new A.a4(s,a7,A.aC(B.B,B.k,1),a0,A.a([new A.b6(0,B.Q,B.v.u(0.1),B.fg,10)],q),a7,a7,B.p)
s=a0}a0=j?"Dark Mode":"Light Mode"
a1=A.Z(8)
a2=j?B.ae3:B.aeh
s=A.ab(a7,A.al(A.a([B.on,A.lc(A.f0(!1,a1,!0,new A.ap(B.abl,A.bv(a2,j?B.rP:B.O,a7,18),a7),a7,!0,a7,a7,a7,a7,a7,a7,a7,a7,a7,a7,a7,new A.bmm(a6,j),a7,a7,a7,a7,a7,a7,a7),a7,a7,a0,a7,a7,a7,a7,a7)],r),B.n,B.f,B.W,0,a7),B.i,a7,a7,s,a7,a7,a7,a7,B.tj,a7,a7,a7)
if(j)a0=B.aW.u(0.98)
else a0=m.z?B.a5C.u(0.82):B.F.u(0.82)
a1=A.Z(6)
if(j)a2=B.aE.u(0.9)
else a2=m.z?B.b3.u(0.45):B.B
a2=A.aC(a2,B.k,0.7)
if(j)q=A.a([new A.b6(0,B.Q,B.jn.u(0.14),B.fg,10)],q)
else q=m.z?A.a([new A.b6(0,B.Q,B.b3.u(0.16),B.l,4)],q):A.a([],q)
a3=A.Z(8)
a4=i.b
a5=a4.z
a5=A.al(A.a([A.bC(a6.Gz("Rate","$"+B.d.Z(a5>0?a5:m.gb4K(),2)+"/h"),1,a7),B.db,A.bC(a6.Gz("Spent",a4.gadE()),1,a7)],r),B.n,B.f,B.j,0,a7)
a4=A.al(A.a([A.bC(a6.Gz("Sim",a6.azo(a4.as)),1,a7),B.db,A.bC(a6.Gz("Budget","$"+a6.azk(g.e.r)+"/mo"),1,a7)],r),B.n,B.f,B.j,0,a7)
b0.push(A.L4(a7,A.au(A.a([s,A.ab(a7,A.f0(!1,a3,!0,new A.aL(220,a7,A.au(A.a([a5,B.i0,a4,B.i0,A.B("5s=1h x speed",a7,a7,a7,a7,A.KB().$3$color$fontSize$fontWeight(j?B.aD:B.O,7,B.V),a7,a7,a7)],r),B.A,B.f,B.j),a7),a7,!0,a7,a7,a7,a7,a7,a7,a7,a7,a7,a7,a7,new A.bmn(a6,g),a7,a7,a7,a7,a7,a7,a7),B.i,a7,a7,new A.a4(a0,a7,a2,a1,q,a7,a7,B.p),a7,a7,a7,a7,B.abd,a7,a7,a7)],r),B.ni,B.f,B.j),B.lG,B.aa2,a7,b1+16,a8,a7))}if(J.em(m.a))b0.push(A.dO(A.au(A.a([A.bv(B.acB,B.H.u(0.3),a7,40),B.E,B.aQX,B.aK,B.aPm],r),B.n,B.f,B.W),a7,a7))
return A.mA(!0,a7,A.fW(B.cT,b0,B.y,B.aGN,a7),a7,a7,a7,a6.ok,!0,a7,a7,a7,new A.bmo(a6,m,k),a7,a7)},
aw0(a){var s,r,q,p
for(s=a.length,r=17,q=0;q<s;++q){p=a[q]
r=A.a1(r,p.a,p.b,p.c,p.d.a,p.e.a,p.f.a,p.w,p.x,B.a,B.a,B.a,B.a,B.a,B.a,B.a,B.a,B.a,B.a,B.a)}return A.a1(r,s,B.a,B.a,B.a,B.a,B.a,B.a,B.a,B.a,B.a,B.a,B.a,B.a,B.a,B.a,B.a,B.a,B.a,B.a)},
atK(a){var s,r,q,p=this,o=null,n=p.cx
n.toString
s=a.ax.h(0,n)
if(s==null)return B.ag
n=p.cy
n.toString
r=p.k2!=null?new A.bkA(p,a,s).$0():A.bXK(s,n,a.a)
if(r==null)return B.ag
n=r.UM()
q=A.r(n,A.l(n).i("k.E"))
if(q.length!==0){n=B.b.gY(q)
n=n.gv(n)<8}else n=!0
if(n)return B.ag
return A.lS(0,A.ht(A.ir(o,o,o,new A.ahe(r,p.gab().K(0,$.ec(),t.g)===B.b8,o),B.aa),!0,o))},
a2c(){var s,r=this
r.gab().K(0,$.aP().gal(),t.F).mv(null)
s=r.p2&&r.rx!=null
r.J(new A.bkB(r))
if(s)r.a.d.$1(!1)},
C9(a,b,c){return this.aNH(a,b,c,c.i("0?"))},
aNH(a,b,c,d){var s=0,r=A.A(d),q,p=this,o,n,m,l,k,j,i,h
var $async$C9=A.w(function(e,f){if(e===1)return A.x(f,r)
for(;;)switch(s){case 0:h=p.c
h.toString
o=t.aA.a(A.xd(h,!0).c.gad())
if(o==null){q=null
s=1
break}n=o.eL(a)
m=B.d.t(n.a,12,o.gG(0).a-12)
l=B.d.t(n.b,12,o.gG(0).b-12)
h=p.c
h.toString
k=B.F.u(0.98)
j=A.Z(14)
i=B.B.u(0.9)
q=A.bQZ(B.i,k,B.Y7,h,18,null,b,null,null,new A.xx(m,l,o.gG(0).a-m,o.gG(0).b-l),null,null,null,null,new A.cU(j,new A.aO(i,1,B.k,-1)),null,!1,c)
s=1
break
case 1:return A.y(q,r)}})
return A.z($async$C9,r)},
Qc(a,b){var s=null
return A.rc(A.B(a.toUpperCase(),s,s,s,s,B.aLi,s,s,s),!1,28,s,B.aaK,s,b)},
wO(a,b,c,d,e,f,g){var s=d==null?44:52
return A.rc(new A.acg(c,e,d,a,b,null),b,s,null,B.Fa,f,g)},
qC(a,b,c,d,e){return this.wO(B.m,!0,a,b,c,d,e)},
l6(a,b,c,d,e,f){return this.wO(B.m,a,b,c,d,e,f)},
a2S(a,b,c,d){return this.wO(B.m,!0,a,null,b,c,d)},
C6(a){return this.aNw(a)},
aNw(b2){var s=0,r=A.A(t.H),q,p=this,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,b0,b1
var $async$C6=A.w(function(b3,b4){if(b3===1)return A.x(b4,r)
for(;;)switch(s){case 0:a9=p.gab()
b0=$.aP()
b1=a9.K(0,b0,t.v)
b0=b0.gal()
o=t.F
n=a9.K(0,b0,o)
m=a9.K(0,$.je(),t.y)
l=n.Q
k=l!=null&&l.a.length!==0
l=t.DN
j=p.Qc("Canvas",l)
i=p.qC(B.yp,"Default cursor for selection and drag","Select Tool",B.aUB,l)
h=p.qC(B.afE,"Pan around the canvas","Hand Tool",B.aUC,l)
g=p.qC(B.tR,"Create links between components","Arrow Connect Tool",B.aUH,l)
f=p.qC(B.afu,"Drop freeform notes","Text Tool",B.aUI,l)
e=!m
d=p.l6(e,B.aeo,"Create a text note at click position","Add Text Here",B.aUJ,l)
c=p.l6(e&&J.i3(b1.a),B.ym,"Rearrange components into clean flow","Auto Layout",B.aUK,l)
b=b1.a
a=J.Y(b)
a0=p.l6(a.gbp(b),B.aea,"Center and scale diagram to viewport","Fit to Content",B.aUL,l)
a1=p.a2S(B.aeT,"Zoom In",B.aUM,l)
a2=p.a2S(B.aeU,"Zoom Out",B.aUN,l)
a3=b1.d
a3=p.l6(a3.gbp(a3),B.yv,"Copy selected components and links","Copy Selection",B.aUO,l)
a4=p.l6(e&&k,B.GS,"Paste copied components at cursor","Paste Here",B.aUD,l)
a5=p.qC(B.afD,"Unselect components and close side panels","Clear Selection",B.aUE,l)
a6=p.l6(b1.e!=null,B.GY,"Exit connect mode","Cancel Pending Connection",B.aUF,l)
s=3
return A.n(p.C9(b2,A.a([j,i,h,g,f,d,B.uw,c,a0,a1,a2,a3,a4,a5,a6,B.uw,p.wO(B.a_,e&&a.gbp(b),B.GA,"Remove all components and links","Clear Canvas",B.aUG,l)],t.Bh),l),$async$C6)
case 3:a7=b4
if(p.c==null||a7==null){s=1
break}switch(a7.a){case 0:a9.K(0,$.h4().gal(),t.V4).bM(0,B.d5)
break
case 1:a9.K(0,$.h4().gal(),t.V4).bM(0,B.ja)
break
case 2:a9.K(0,$.h4().gal(),t.V4).bM(0,B.ct)
break
case 3:a9.K(0,$.h4().gal(),t.V4).bM(0,B.ib)
break
case 4:p.Pn(b2)
break
case 5:a9=a9.K(0,b0,o)
b0=p.c
b0.toString
a9.CI(A.bM(b0,B.e_,t.w).w.a)
break
case 6:p.a44()
break
case 7:a9=a9.K(0,b0,o)
a8=B.d.t(a9.f.w*1.2,0.1,3)
a9.sbn(0,a9.f.adg(a8))
a9.es()
break
case 8:a9=a9.K(0,b0,o)
a8=B.d.t(a9.f.w/1.2,0.1,3)
a9.sbn(0,a9.f.adg(a8))
a9.es()
break
case 9:p.a2W()
break
case 10:p.Sh(b2)
break
case 11:p.a2c()
p.J(new A.bl7(p))
break
case 12:a9=a9.K(0,b0,o)
a9.sbn(0,a9.f.m_(!0))
break
case 13:a9.K(0,b0,o).UD()
break}case 1:return A.y(q,r)}})
return A.z($async$C6,r)},
C7(a,b){return this.aNx(a,b)},
aNx(a9,b0){var s=0,r=A.A(t.H),q,p=this,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4,a5,a6,a7,a8
var $async$C7=A.w(function(b1,b2){if(b1===1)return A.x(b2,r)
for(;;)switch(s){case 0:a1=p.gab()
a2=a1.K(0,$.je(),t.y)
a3=$.aP()
a4=a3.gal()
a5=t.F
a6=a1.K(0,a4,a5)
a7=a1.K(0,a3,t.v)
a8=a7.e
a3=a9.a
o=a8===a3
n=a8==null
m=!n
l=m&&!o
k=a6.Q
j=k!=null&&k.a.length!==0
k=t.FT
i=p.Qc("Component",k)
h=p.qC(B.tT,"Configure behavior and capacity","Open Settings",B.aUW,k)
g=!a2
f=p.l6(g,B.afc,"Edit component label inline","Rename",B.aUX,k)
n=p.l6(g&&n,B.af3,"Set this as connection source","Start Connection Here",B.aUY,k)
e=p.l6(g&&l,B.yx,"Complete current connection to this node","Connect Pending Source To This",B.aUZ,k)
d=p.l6(g&&o,B.GY,"Exit connect mode","Cancel Pending Connection",B.aV_,k)
c=p.qC(B.yv,"Copy this component or current selection","Copy",B.aV0,k)
s=3
return A.n(p.C9(b0,A.a([i,h,f,n,e,d,c,p.l6(g&&j,B.GS,"Paste copied components near this node","Paste Here",B.aV1,k),p.l6(g,B.GT,"Clone with incoming and outgoing links","Duplicate",B.aV2,k),B.uw,p.wO(B.a_,g,B.GU,"Remove node and attached connections","Delete Component",B.aV3,k)],t.RA),k),$async$C7)
case 3:b=b2
if(p.c==null||b==null){s=1
break}case 4:switch(b.a){case 0:s=6
break
case 1:s=7
break
case 2:s=8
break
case 3:s=9
break
case 4:s=10
break
case 5:s=11
break
case 6:s=12
break
case 7:s=13
break
case 8:s=14
break
default:s=5
break}break
case 6:p.ST(a9)
s=5
break
case 7:a1.K(0,a4,a5).mv(a3)
p.J(new A.bl8(p,a9))
s=5
break
case 8:a1.K(0,$.h4().gal(),t.V4).bM(0,B.ct)
a1=a1.K(0,a4,a5)
a1.sbn(0,a1.f.Km(a3))
s=5
break
case 9:s=m&&!o?15:16
break
case 15:s=17
return A.n(p.tM(B.cz,a8,a3),$async$C7)
case 17:if(b2&&p.c!=null){a3=a1.K(0,a4,a5)
a3.sbn(0,a3.f.m_(!0))
a1.K(0,$.h4().gal(),t.V4).bM(0,B.d5)}case 16:s=5
break
case 10:a1=a1.K(0,a4,a5)
a1.sbn(0,a1.f.m_(!0))
s=5
break
case 11:a=a7.d
p.a2X(a.gv(a)>1&&a.k(0,a3)?a:A.cp([a3],t.N))
s=5
break
case 12:p.Sh(b0)
s=5
break
case 13:a0=a1.K(0,a4,a5).aej(a3)
if(a0!=null)a1.K(0,a4,a5).mv(a0)
s=5
break
case 14:a1.K(0,a4,a5).Yj(a3)
s=5
break
case 5:case 1:return A.y(q,r)}})
return A.z($async$C7,r)},
IT(a,b){return this.aNy(a,b)},
aNy(a,b){var s=0,r=A.A(t.H),q,p=this,o,n,m,l,k,j,i,h,g,f,e,d
var $async$IT=A.w(function(c,a0){if(c===1)return A.x(a0,r)
for(;;)switch(s){case 0:m=p.gab()
l=m.K(0,$.je(),t.y)
k=t.VT
j=p.Qc("Connection",k)
i=p.qC(B.tT,"Label, protocol, and full options","Edit Connection",B.aVe,k)
h=a.e===B.cz
g=h?"Make Bidirectional":"Make One-way"
f=h?"Allow traffic in both directions":"Limit flow to one direction"
e=!l
s=3
return A.n(p.C9(b,A.a([j,i,p.l6(e,B.aft,f,g,B.aVf,k),B.uw,p.wO(B.a_,e,B.GU,"Remove this link","Delete Connection",B.aVg,k)],t.kd),k),$async$IT)
case 3:d=a0
if(p.c==null||d==null){s=1
break}switch(d.a){case 0:p.a9v(a)
break
case 1:o=h?B.kI:B.cz
n=m.K(0,$.aP().gal(),t.F).aiX(a.a,o)
if(n!=null&&p.c!=null)p.c.a0(t.q).f.bb(A.da(null,null,null,null,null,B.y,null,A.B(n,null,null,null,null,null,null,null,null),null,B.X,null,null,null,null,null,null,null,null,null,null))
break
case 2:m.K(0,$.aP().gal(),t.F).ai8(a.a)
break}case 1:return A.y(q,r)}})
return A.z($async$IT,r)},
a44(){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d=this,c=d.gab().K(0,$.aP(),t.v).a,b=J.Y(c)
if(b.ga3(c))return
s=t.aA.a(d.c.gad())
r=s==null?null:s.gG(0)
if(r==null){q=d.c
q.toString
r=A.bM(q,B.e_,t.w).w.a}q=r.a
if(q<=0||r.b<=0)return
for(c=b.gT(c),p=1/0,o=1/0,n=-1/0,m=-1/0;c.p();){b=c.gH(c)
l=b.c
k=l.a
p=Math.min(p,k)
l=l.b
o=Math.min(o,l)
b=b.d
n=Math.max(n,k+b.a)
m=Math.max(m,l+b.b)}j=r.gft()<700?120:200
c=n-p
i=c+j
b=m-o
h=b+j
if(i<=0||h<=0)return
l=r.b
g=Math.max(0.2,Math.min(1.4,Math.min(q/i,l/h)))
f=new A.i(q/2,l/2).a6(0,new A.i(p+c/2,o+b/2).ao(0,g))
e=new A.bu(new Float64Array(16))
e.dh()
e.jd(f.a,f.b,0)
e.iB(g,g,g,1)
d.xF(e)
d.Ci()},
a6M(a,b){var s=this,r=s.gab()
if(r.K(0,$.je(),t.y))return
if(!s.J6(a))return
s.J(new A.bkR(s,a,b))
r=r.K(0,$.aP().gal(),t.F)
r.sbn(0,r.f.Km(a.a))},
a6N(a){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e=this,d={},c=e.gab()
if(c.K(0,$.je(),t.y))return
s=e.nz(a)
r=c.K(0,$.aP(),t.v)
d.a=null
d.b=s
for(q=J.ar(r.a),p=s.a,o=s.b,n=64;q.p();){m=q.gH(q)
l=m.a
if(l===e.cx)continue
k=m.b
if(!(k!==B.bq&&k!==B.bx&&k!==B.bX))continue
j=A.bBr(m)
for(m=j.length,i=0;i<j.length;j.length===m||(0,A.o)(j),++i){h=j[i]
k=p-h.a
g=o-h.b
f=Math.sqrt(k*k+g*g)
if(f<n){d.a=l
d.b=h
n=f}}}e.J(new A.bkS(d,e))
q=t.F
if(d.a!=null){c=c.K(0,$.aP().gal(),q)
q=d.a
c.sbn(0,c.f.ad7(q))}else{c=c.K(0,$.aP().gal(),q)
c.sbn(0,c.f.ad7(null))}},
BJ(){var s=0,r=A.A(t.H),q,p=this,o,n,m,l
var $async$BJ=A.w(function(a,b){if(a===1)return A.x(b,r)
for(;;)switch(s){case 0:l=p.gab()
if(l.K(0,$.je(),t.y)){p.J(new A.bkP(p))
s=1
break}o=p.cx
n=p.k2
s=o!=null&&n!=null?3:4
break
case 3:s=5
return A.n(p.tM(B.cz,o,n),$async$BJ)
case 5:case 4:if(p.c==null){s=1
break}p.J(new A.bkQ(p))
m=l.K(0,$.aP().gal(),t.F)
m.sbn(0,m.f.m_(!0))
m=$.h4()
if(l.K(0,m,t._Y)===B.ct)l.K(0,m.gal(),t.V4).bM(0,B.d5)
case 1:return A.y(q,r)}})
return A.z($async$BJ,r)},
aty(a){var s=A.bBr(a),r=this.gab().K(0,$.ec(),t.g),q=A.aFa(s,0,t.o)
q=A.dd(q,new A.bkz(this,a,r===B.b8),A.l(q).i("k.E"),t.iB)
r=A.r(q,A.l(q).i("k.E"))
return r},
BI(a,b){return this.aHu(a,b)},
aHu(a,b){var s=0,r=A.A(t.H),q,p=this,o,n,m,l,k,j,i,h,g,f
var $async$BI=A.w(function(c,d){if(c===1)return A.x(d,r)
for(;;)switch(s){case 0:i=p.gab()
h=$.aP()
g=i.K(0,h.gal(),t.F)
f=i.K(0,h,t.v)
h=$.h4()
o=i.K(0,h,t._Y)
n=i.K(0,$.je(),t.y)
m=p.a64()&&o===B.d5
if(n){g.mv(a.a)
s=1
break}s=o===B.ct?3:4
break
case 3:l=f.e
s=l==null?5:7
break
case 5:g.sbn(0,g.f.Km(a.a))
p.J(new A.bkJ(p,a))
s=6
break
case 7:k=a.a
s=l!==k?8:10
break
case 8:s=11
return A.n(p.tM(B.cz,l,k),$async$BI)
case 11:if(d&&p.c!=null){g.sbn(0,g.f.m_(!0))
p.J(new A.bkK(p))
i.K(0,h.gal(),t.V4).bM(0,B.d5)}s=9
break
case 10:g.sbn(0,g.f.m_(!0))
p.J(new A.bkL(p))
case 9:case 6:s=1
break
case 4:s=b?12:13
break
case 12:i=f.e
h=a.a
s=i!==h?14:15
break
case 14:i.toString
s=16
return A.n(p.tM(B.cz,i,h),$async$BI)
case 16:if(d&&p.c!=null)g.sbn(0,g.f.m_(!0))
case 15:s=1
break
case 13:if(m){j=f.d.cK(0)
i=a.a
if(j.k(0,i))j.L(0,i)
else j.B(0,i)
g.Os(j,i)
p.J(new A.bkM(p,j,a))
s=1
break}if(p.p2){i=p.rx
i=i==null?null:i.a
i=i!==a.a}else i=!1
if(i)p.GI()
i=f.d
if(i.gv(i)===1&&i.k(0,a.a)){g.mv(null)
if(p.p2)p.GI()
p.J(new A.bkN(p))
s=1
break}i=a.a
g.Os(A.cp([i],t.N),i)
p.J(new A.bkO(p,a))
case 1:return A.y(q,r)}})
return A.z($async$BI,r)},
atb(a){var s=this,r=s.gab().K(0,$.aP(),t.v),q=s.nz(a)
if(J.q6(r.a,new A.bko(q)))return
s.J(new A.bkp(s,q))},
aQ1(a){var s=this
if(!(s.id!=null&&s.k1!=null))return
s.J(new A.blf(s,a))},
az3(){var s,r,q,p,o,n=this,m=n.ga6q()
if(m==null){n.GG()
return}if(!(m.c-m.a>6||m.d-m.b>6)){n.GG()
return}s=n.gab()
r=$.aP()
q=J.i5(s.K(0,r,t.v).a,new A.bkH(m))
p=q.$ti.i("bd<1,c>")
o=A.cZ(new A.bd(q,new A.bkI(),p),p.i("k.E"))
q=t.F
if(o.a===0)s.K(0,r.gal(),q).mv(null)
else s.K(0,r.gal(),q).Os(o,o.gS(0))
n.GG()},
a2f(a){var s=this
if(s.id==null&&s.k1==null)return
if(!a){s.k1=s.id=null
return}s.J(new A.bkC(s))},
GG(){return this.a2f(!0)},
a1n(a,b){var s,r,q,p,o,n,m=this,l=m.fx=a.a
m.fr=m.nz(b)
m.fy=null
s=m.gab()
r=$.aP()
q=s.K(0,r,t.v).d
if(q.gv(q)>1&&q.k(0,l))m.ry=A.jk(q,t.N)
else{p=a.b
p=p===B.ad||p===B.ae||a.e.k1
o=t.N
if(p){n=s.K(0,r.gal(),t.F).akk(l)
l=A.cp([l],o)
l.q(0,n)
m.ry=l}else m.ry=A.cp([l],o)}},
aPQ(a,b){var s,r,q,p,o,n,m=this
if(m.fx!==a.a){m.a1n(a,b)
return}s=m.nz(b)
r=m.fr
m.fr=s
if(r==null)return
q=s.a6(0,r)
if(q.grq()<0.0001)return
p=m.ry
if(p!=null&&p.a!==0){p=m.gab().K(0,$.aP().gal(),t.F)
o=m.ry
o.toString
p.Xx(o,q,!1)}else m.aH_(a,q)
n=m.ayu(q)
if(!n.m(0,B.l))m.fr=m.fr.a4(0,n)},
aH_(a,b){var s,r,q=this.gab(),p=$.aP(),o=t.v,n=a.a,m=q.K(0,p,o).ax.h(0,n)
if(m==null)m=a
s=q.K(0,p,o).d
if(s.gv(s)>1&&s.k(0,n)){q.K(0,p.gal(),t.F).Xx(s,b,!1)
return}o=m.c
r=B.d.t(o.a+b.a,0,29900)
o=B.d.t(o.b+b.b,0,29900)
q.K(0,p.gal(),t.F).agZ(n,new A.i(r,o),!1)},
ayu(a1){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0=this
if(a0.fx==null)return B.l
s=a0.gab()
r=s.K(0,$.aP(),t.v)
q=r.a
p=J.Y(q)
if(p.ga3(q))return B.l
o=r.d
if(o.gv(o)>1&&o.k(0,a0.fx))n=o
else{m=a0.fx
m.toString
n=A.cp([m],t.N)}for(q=p.gT(q),l=1/0,k=1/0,j=-1/0,i=-1/0,h=!1;q.p();){p=q.gH(q)
if(!n.k(0,p.a))continue
m=p.c
g=m.a
l=Math.min(l,g)
m=m.b
k=Math.min(k,m)
p=p.d
j=Math.max(j,g+p.a)
i=Math.max(i,m+p.b)
h=!0}if(!h)return B.l
q=a1.a
if(q>0&&j>=29580)f=-4000
else f=q<0&&l<=320?4000:0
q=a1.b
if(q>0&&i>=29580)e=-4000
else e=q<0&&k<=320?4000:0
if(f===0&&e===0)return B.l
d=new A.i(f,e)
s.K(0,$.aP().gal(),t.F).a_g(d,!1)
s=a0.w
c=s.a.lE()
b=s.a.tk()
s=s.a
a=new A.bu(new Float64Array(16))
a.bC(s)
s=b.a
a.jd(s[0]-f*c,s[1]-e*c,s[2])
a0.xF(a)
return d},
a7U(){var s,r,q,p,o,n,m,l,k,j,i=this,h=i.gab(),g=h.K(0,$.aP(),t.v).a,f=J.Y(g)
if(f.ga3(g))return!1
for(g=f.gT(g),s=1/0,r=1/0,q=-1/0,p=-1/0;g.p();){f=g.gH(g)
o=f.c
n=o.a
s=Math.min(s,n)
o=o.b
r=Math.min(r,o)
f=f.d
q=Math.max(q,n+f.a)
p=Math.max(p,o+f.b)}if(!(s<700||r<700||q>29300||p>29300))return!1
m=B.azP.a6(0,new A.i((s+q)/2,(r+p)/2))
g=m.a
if(Math.abs(g)<0.01&&Math.abs(m.b)<0.01)return!1
h.K(0,$.aP().gal(),t.F).alO(m)
h=i.w
l=h.a.lE()
k=h.a.tk()
h=h.a
j=new A.bu(new Float64Array(16))
j.bC(h)
h=k.a
j.jd(h[0]-g*l,h[1]-m.b*l,h[2])
i.xF(j)
i.Ci()
return!0},
a64(){var s,r=$.fd.c3$
r===$&&A.b()
r=r.a
s=A.l(r).i("aN<2>")
if(!(new A.aN(r,s).k(0,B.hX)||new A.aN(r,s).k(0,B.iN)))r=new A.aN(r,s).k(0,B.iM)||new A.aN(r,s).k(0,B.k1)||new A.aN(r,s).k(0,B.iO)||new A.aN(r,s).k(0,B.k2)
else r=!0
return r},
a2X(a){if(!this.gab().K(0,$.aP().gal(),t.F).aTx(a)&&this.c!=null)this.c.a0(t.q).f.bb(B.aGp)},
a2W(){return this.a2X(null)},
Sh(a){var s,r=this,q=r.gab()
if(q.K(0,$.je(),t.y))return
s=a==null?null:r.nz(a)
if(q.K(0,$.aP().gal(),t.F).b2z(s).length===0&&r.c!=null)r.c.a0(t.q).f.bb(B.aGo)},
aJG(){return this.Sh(null)},
Pn(a){var s,r,q,p,o,n,m,l,k,j,i,h=this,g=h.nz(a),f=h.gab()
for(s=f.K(0,$.aP(),t.v).a,r=J.bZ(s),q=r.gT(s);q.p();){p=q.gH(q)
o=p.c
n=o.a
o=o.b
if(new A.M(n,o,n+80,o+64).k(0,g)){g=new A.i(n,o+p.d.b+12)
break}}m=g
l=0
do{q=m.a
p=q-40
o=m.b
n=o-20
k=new A.M(p,n,p+100,n+40)
p=r.gT(s)
for(;;){if(!p.p()){j=!1
break}n=p.gH(p).c
i=n.a
n=n.b
if(new A.M(i,n,i+80,n+64).fp(k)){m=new A.i(q+0,o+48)
j=!0
break}}++l}while(j&&l<3)
h.J(new A.bkn(h,f.K(0,$.aP().gal(),t.F).aRe(B.bq,m,B.aFc)))
f.K(0,$.h4().gal(),t.V4).bM(0,B.d5)},
a0M(a,b,c,d,e){var s,r=A.cW()
switch(a.a){case 2:r.sdR(B.aM)
break
case 3:r.sdR(B.ad)
break
case 4:r.sdR(B.aX)
break
case 5:r.sdR(B.aR)
break
case 6:return
case 7:r.sdR(B.bx)
break
case 9:r.sdR(B.bq)
break
default:return}s=this.gab().K(0,$.aP().gal(),t.F).TX(r.bi(),b,c,d,e)
if(a===B.ib)this.J(new A.bkm(this,s))},
ass(a,b){return this.a0M(a,b,!1,!1,null)},
a8K(a,b,c){var s=this.at,r=s.h(0,b)
if(r!=null)r.aN(0)
s.j(0,b,A.dr(B.aad,new A.bl2(this,b,c,a)))},
aMo(a,b){return this.a8K(a,b,null)},
aMp(a,b){return this.a8K(null,a,b)},
a49(a,b,c){var s=this.at.L(0,b)
if(s!=null)s.aN(0)
this.a8g(a,b,c)},
aza(a,b){return this.a49(a,b,null)},
azb(a,b){return this.a49(null,a,b)},
a8g(b6,b7,b8){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,b0,b1,b2=null,b3=this.gab(),b4=$.aP(),b5=b3.K(0,b4,t.v).ax.h(0,b7)
if(b5==null)return
s=b5.b
if(s===B.aM){r=A.KB().$3$fontSize$fontWeight$height(13,B.a4,1.25)
b4=b8==null?b5.w:b8
q=B.c.N(b4==null?"Service/Class":b4)
p=b6==null?b5.e.id:b6
if(p==null)p=""
b4=t.s
o=p.length===0?A.a([""],b4):A.a(p.split("\n"),b4)
b4=A.a([q],b4)
B.b.q(b4,o)
for(s=b4.length,n=0,m=16.8,l=0;l<b4.length;b4.length===s||(0,A.o)(b4),++l){k=A.cF(b2,b2,b2,b2,r,b4[l])
j=new A.pA(k,B.ah,B.aF,new A.iE(1),b2,b2,b2,b2,B.aG,b2)
j.k7()
n=Math.max(n,j.b.c)
k=j.ch
if(k==null)k=j.ch=j.a2Y()
m=k.gbm(k)}i=b5.e.go
h=A.jp(b2,b2,b2,b2,A.cF(b2,b2,b2,b2,B.aKp,(i==null?B.av:i).gbD()===B.dR?"DB":"COMPUTE"),B.ah,B.aF,b2,B.dL,B.aG)
h.k7()
b4=h.b
s=b4.c
b4=b4.a.c
b4=b4.gbm(b4)
g=Math.min(1200,Math.max(144,Math.max(n+22,s+26)))
f=Math.min(640,Math.max(88,28+Math.max(m,o.length*m)+(b4+6)+18))
b4=b5.d
if(Math.abs(g-b4.a)>1||Math.abs(f-b4.b)>1)b3.K(0,$.aP().gal(),t.F).zq(b5.a,new A.K(g,f))
return}k=s!==B.ca
if(!k||s===B.ck||s===B.ch||s===B.cn||s===B.cg||s===B.cj||s===B.co||s===B.cl){r=A.mm().$3$fontSize$fontWeight$height(13,B.V,1.4)
e=A.mm().$3$fontSize$fontWeight$height(13,B.x,1.2)
b4=b8==null?b5.w:b8
q=B.c.N(b4==null?s.c:b4)
p=b6==null?b5.e.id:b6
if(p==null)p=""
b4=t.s
o=p.length===0?A.a([],b4):A.a(p.split("\n"),b4)
d=A.jp(b2,b2,b2,b2,A.cF(b2,b2,b2,b2,e,q),B.ah,B.aF,b2,B.dL,B.aG)
d.k7()
for(b4=o.length,c=0,m=20,l=0;s=o.length,l<s;o.length===b4||(0,A.o)(o),++l){s=A.cF(b2,b2,b2,b2,r,o[l])
j=new A.pA(s,B.ah,B.aF,new A.iE(1),b2,b2,b2,b2,B.aG,b2)
j.k7()
c=Math.max(c,j.b.c)
s=j.ch
if(s==null)s=j.ch=j.a2Y()
m=s.gbm(s)}g=Math.min(500,Math.max(160,Math.max(d.b.c,c)+28))
f=Math.min(600,Math.max(100,48+(s===0?m:s*m)+16))
b4=b5.d
if(Math.abs(g-b4.a)>1||Math.abs(f-b4.b)>1)b3.K(0,$.aP().gal(),t.F).zq(b5.a,new A.K(g,f))
return}b=s!==B.aX
a=!0
if(b)if(s!==B.aR)a=s===B.ad||s===B.ae||b5.e.k1
if(a)return
a0=!k||s===B.ck||s===B.ch||s===B.cn||s===B.cg||s===B.cj||s===B.co||s===B.cl
k=s===B.bq
a1=!1
if(!k)if(s!==B.bx){if(s!==B.bX)if(b)if(s!==B.aR)s=!(s===B.ad||s===B.ae||b5.e.k1)&&!a0
else s=a1
else s=a1
else s=a1
a1=s}if(a1){s=b8==null?b5.w:b8
a2=B.c.N(s==null?"":s)
r=A.ie(B.aA,14.5,B.x,1.1,b2)
a3=A.jp(b2,b2,4,b2,A.cF(b2,b2,b2,b2,r,a2),B.ah,B.aF,b2,B.dL,B.aG)
a3.vt(520)
g=Math.min(460,Math.max(220,a3.b.a.c.goe()+88))
a4=A.jp(b2,b2,4,b2,A.cF(b2,b2,b2,b2,r,a2),B.ah,B.aF,b2,B.dL,B.aG)
a4.vt(Math.max(120,g-28))
s=a4.b.a.c
f=Math.min(260,Math.max(140,66+s.gbm(s)+28))
s=b5.d
if(Math.abs(g-s.a)>2||Math.abs(f-s.b)>2)b3.K(0,b4.gal(),t.F).zq(b5.a,new A.K(g,f))
return}r=k?B.aLq:A.ie(B.aA,14,B.a4,1.2,b2)
a2=b8==null?b5.w:b8
a5=A.jp(b2,b2,b2,b2,A.cF(b2,b2,b2,b2,r,a2==null?"":a2),B.ah,B.aF,b2,B.dL,B.aG)
a5.k7()
if(k){a6=40
a7=28
a8=28
a9=14}else{a6=80
a7=64
a8=44
a9=20}s=a5.b
b0=Math.min(900,Math.max(a6,s.c+a8))
s=s.a.c
b1=Math.min(220,Math.max(a7,s.gbm(s)+a9))
s=b5.d
if(Math.abs(b0-s.a)>2||Math.abs(b1-s.b)>2)b3.K(0,b4.gal(),t.F).zq(b5.a,new A.K(b0,b1))},
az2(a){var s,r,q,p,o,n,m=this,l=m.dx
if(l==null||m.dy==null)return
if(a===B.ct){m.J(new A.bkF(m))
return}s=m.dy
s.toString
r=A.nQ(l,s)
q=l.a
p=l.b
o=r.a
n=r.c-o
if(n<10&&r.d-r.b<10){$label0$0:{if(B.lu===a){s=B.aFe
break $label0$0}if(B.n3===a){s=B.aFg
break $label0$0}if(B.n4===a){s=B.aFh
break $label0$0}if(B.p3===a){s=B.aFz
break $label0$0}s=B.TK
break $label0$0}m.ass(a,l.a6(0,new A.i(s.a/2,s.b/2)))}else{l=r.b
m.a0M(a,new A.i(o,l),s.a<q,s.b<p,new A.K(n,r.d-l))}m.J(new A.bkG(m))
m.gab().K(0,$.h4().gal(),t.V4).bM(0,B.d5)},
atI(a){var s,r,q,p,o,n,m=null,l=this.dx
if(l==null||this.dy==null)return B.ag
s=this.dy
s.toString
r=A.nQ(l,s)
s=r.a
l=r.b
q=r.c-s
p=r.d-l
o=A.aC(B.m,B.k,2)
n=a===B.lu?A.Z(Math.max(q,p)):A.Z(4)
return A.dj(m,A.ab(m,m,B.i,m,m,new A.a4(B.m.u(0.1),m,o,n,m,m,m,B.p),m,m,m,m,m,m,m,m),p,m,s,m,l,q)},
aD6(a,b){var s,r,q,p,o,n,m,l,k,j=this
if(j.to==null){j.xr=b
return}s=j.xr
if(s==null){j.xr=b
return}r=b.a6(0,s).f_(0,j.w.a.lE())
s=j.x2
q=s.a
p=s.b
s=j.x1
o=s.a
n=s.b
switch(j.to.a){case 3:o=Math.max(40,o+r.a)
n=Math.max(40,n+r.b)
break
case 2:m=Math.max(40,o-r.a)
n=Math.max(40,n+r.b)
q+=o-m
o=m
break
case 1:o=Math.max(40,o+r.a)
l=Math.max(40,n-r.b)
p+=n-l
n=l
break
case 0:m=Math.max(40,o-r.a)
l=Math.max(40,n-r.b)
q+=o-m
p+=n-l
n=l
o=m
break}k=j.gab().K(0,$.aP().gal(),t.F)
s=a.c
if(q!==s.a||p!==s.b)k.agZ(a.a,new A.i(q,p),!1)
k.zq(a.a,new A.K(o,n))},
ST(a){var s,r,q,p,o=this
if(a.ay&&a.as!=null){s=o.gab().K(0,$.aP(),t.v)
r=a.as
r.toString
q=s.ax.h(0,r)
if(q!=null){o.ST(q)
return}}s=a.a
A.e1().$1("Show Component Options: "+s+" ("+a.b.c+")")
o.gab().K(0,$.aP().gal(),t.F).mv(s)
p=o.p2&&o.rx!=null
o.J(new A.bl9(o,a))
if(!p)o.a.d.$1(!0)},
GI(){var s=this,r=s.p2&&s.rx!=null
s.J(new A.bkD(s))
if(r)s.a.d.$1(!1)},
a2s(a,b){var s,r
if(!a.ay||a.as==null)return!0
s=a.as
s.toString
r=b.ax.h(0,s)
if(r==null)return!0
return r.e.ok===B.jq},
aQz(a){var s=J.i5(a.a,new A.blg(this,a))
s=A.r(s,s.$ti.i("k.E"))
s.$flags=1
return s},
a9v(a){var s=this.c
s.toString
A.KD(B.F,new A.ble(this,a),s,!1,B.qE,!1,t.z)},
azL(a){switch(a.a){case 1:return B.v5
case 6:return B.fj
case 10:return B.aHi
case 0:return B.dc
case 9:return B.v6
default:return B.aHj}},
azk(a){if(a>=1e6)return B.d.Z(a/1e6,1)+"M"
if(a>=1000)return B.d.Z(a/1000,1)+"K"
return B.e.l(a)},
Gz(a,b){var s=null,r=this.gab().K(0,$.ec(),t.g)===B.b8,q=A.B(a.toUpperCase(),1,B.as,s,s,A.KB().$4$color$fontSize$fontWeight$letterSpacing(r?B.aD:B.O,7,B.a4,0.4),s,s,s)
return A.au(A.a([q,B.TU,A.B(b,1,B.as,s,s,A.KB().$3$color$fontSize$fontWeight(r?B.aA:B.K,10,B.a5),s,s,s)],t.p),B.A,B.f,B.j)},
azo(a){var s,r,q,p,o=isFinite(a)?B.d.t(a,0,1/0):0
if(o<1)return"<1h"
s=B.d.dS(o)
r=B.e.bc(s,24)
q=B.e.bl(s,24)
p=r>0
if(p&&q>0)return""+r+"d "+q+"h"
if(p)return""+r+"d"
return""+q+"h"},
IS(a){return this.aNu(a)},
aNu(a){var s=0,r=A.A(t.H),q,p=this,o,n,m,l,k
var $async$IS=A.w(function(b,c){if(b===1)return A.x(c,r)
for(;;)switch(s){case 0:n=a.e
m=B.e.l(n.r)
l=$.aU()
k=p.c
k.toString
s=3
return A.n(A.fE(null,!0,new A.bl6(new A.eR(new A.d3(m,B.cG,B.bh),l)),k,t.bo),$async$IS)
case 3:o=c
if(p.c==null||o==null){s=1
break}m=p.gab().K(0,$.fO().gal(),t.uE)
m.bM(0,new A.jl(a.a,a.b,a.c,a.d,new A.pj(n.a,n.b,n.c,n.d,n.e,n.f,o,n.w,n.x,n.y),a.f,a.r,a.w,a.x,a.y,a.z))
case 1:return A.y(q,r)}})
return A.z($async$IS,r)}}
