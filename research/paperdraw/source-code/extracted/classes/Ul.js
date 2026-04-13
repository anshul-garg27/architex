A.Ul.prototype={
aM(){var s,r,q=this
q.b3()
s=q.gab()
r=$.aP()
q.a6j(s.K(0,r,t.v).c)
q.CW=s.vw(new A.ch(r,new A.b70(),r.$ti.i("ch<cR.0,c?>")),new A.b71(q),t.A)},
n(){var s=this.CW
if(s!=null)s.aA(0)
this.aR()},
R(a5){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1=this,a2=null,a3=a1.ch,a4=a1.w
a4===$&&A.b()
s=a1.at
s===$&&A.b()
r=a1.y
r===$&&A.b()
q=a1.z
q===$&&A.b()
p=a1.Q
p===$&&A.b()
o=a1.as
o===$&&A.b()
n=a1.x
n===$&&A.b()
m=new A.awq(a4,s,r,q,p,o,n)
l=A.bBz(m)
k=A.bYa(m)
j=B.b.gS(A.bBz(m)).a
i=A.ak(t.rE)
h=A.a([],t.s)
if(a4>=20){i.B(0,B.lJ)
h.push("Read-heavy + full-text needs")}if(s.k(0,B.uA)){i.B(0,B.lJ)
h.push("Full-text queries benefit from search engine")}if(s.k(0,B.qC)){i.B(0,B.lK)
h.push("Analytics separated from OLTP")}if(s.k(0,B.ux)){i.B(0,B.kN)
h.push("High ingest telemetry")}if(s.k(0,B.uz)){i.B(0,B.lL)
h.push("Relationship queries")}if(s.k(0,B.uy)){i.B(0,B.pp)
h.push("Embedding similarity search")}i.L(0,j)
if(i.a===0)h.push("Single-store is sufficient for current workload")
a4=A.r(i,i.$ti.c)
s=t.S
r=A.cD(h,0,A.dz(3,"count",s),t.N).bL(0)
q=t.p
p=A.a([B.afR,B.an,B.abw],q)
a1.a.toString
p=A.a([A.al(p,B.n,B.f,B.j,0,a2),B.P,new A.ap(B.iB,A.B("Workload Profile".toUpperCase(),a2,a2,a2,a2,B.os,a2,a2,a2),a2)],q)
o=a3!=null
if(o){n=A.Z(8)
g=A.aC(B.B,B.k,1)
f=a3.b
e=A.bv(f.e,f.gbI(0),a2,14)
d=a3.w
p.push(A.ab(a2,A.al(A.a([e,B.db,A.bC(A.B("Target: "+(d==null?f.c:d),a2,B.as,a2,a2,B.aMw,a2,a2,a2),1,a2),B.aO7],q),B.n,B.f,B.j,0,a2),B.i,a2,a2,new A.a4(B.a0,a2,g,n,a2,a2,a2,B.p),a2,a2,a2,B.jI,B.pJ,a2,a2,a2))}p.push(a1.aKF())
p.push(a1.awF())
p.push(a1.aPc())
p.push(a1.axW())
p.push(B.d1)
p.push(new A.ap(B.iB,A.B("Query Patterns".toUpperCase(),a2,a2,a2,a2,B.os,a2,a2,a2),a2))
n=t.dR
n=A.r(new A.q(B.apn,new A.b6Z(a1),n),n.i("a2.E"))
p.push(A.f2(B.a8,n,B.bE,6,6))
p.push(B.P)
p.push(new A.ap(B.iB,A.B("Decision Tree".toUpperCase(),a2,a2,a2,a2,B.os,a2,a2,a2),a2))
s=A.cD(l,0,A.dz(3,"count",s),A.v(l).c)
B.b.q(p,new A.q(s,new A.b7_(a1),s.$ti.i("q<a2.E,f>")))
if(o){s=A.B("Selected DB Config".toUpperCase(),a2,a2,a2,a2,B.os,a2,a2,a2)
c=a3.e
b=c.x?"RF "+c.y+" \xb7 "+c.p3.b:"Disabled"
o=c.fx
if(o==null)o=1
n=c.fy
if(n==null)n=1
a=c.ay.length
if(a===0)a=1
g=A.Z(8)
f=A.aC(B.B,B.k,1)
n=A.a([A.B("Replication: "+b,a2,a2,a2,a2,B.r0,a2,a2,a2),B.aK,A.B("Quorum (R/W): "+(""+o+"/"+n),a2,a2,a2,a2,B.r0,a2,a2,a2),B.aK,A.B("Regions: "+a,a2,a2,a2,a2,B.r0,a2,a2,a2)],q)
if(c.Q)B.b.q(n,A.a([B.aK,A.B("Shards: "+c.at,a2,a2,a2,a2,B.r0,a2,a2,a2)],q))
B.b.q(p,A.a([B.d1,new A.ap(B.iB,s,a2),A.ab(a2,A.au(n,B.A,B.f,B.j),B.i,a2,a2,new A.a4(B.a0,a2,f,g,a2,a2,a2,B.p),a2,a2,a2,a2,B.cA,a2,a2,a2)],q))}p.push(B.P)
p.push(new A.ap(B.iB,A.B("Comparative Modeling".toUpperCase(),a2,a2,a2,a2,B.os,a2,a2,a2),a2))
p.push(new A.ap(B.iB,A.al(B.an6,B.n,B.f,B.j,0,a2),a2))
B.b.q(p,new A.q(k,a1.gavz(),A.v(k).i("q<1,f>")))
p.push(B.P)
p.push(new A.ap(B.iB,A.B("Hybrid Architecture".toUpperCase(),a2,a2,a2,a2,B.os,a2,a2,a2),a2))
p.push(a1.aEM(new A.awm(j,a4,r)))
a0=A.au(p,B.A,B.f,B.j)
a1.a.toString
a4=A.Z(12)
s=A.aC(B.B,B.k,1)
return A.ab(a2,new A.ap(B.eQ,a0,a2),B.i,a2,a2,new A.a4(B.a0,a2,s,a4,a2,a2,a2,B.p),a2,a2,a2,B.aw,a2,a2,a2,a2)},
a6j(a){var s,r,q,p,o=this,n=o.gab(),m=n.K(0,$.fO(),t.C),l=n.K(0,$.aP(),t.v),k=a!=null?l.ax.h(0,a):null,j=k!=null&&o.aFk(k.b),i=j?k.a:"__global__",h=o.ax.h(0,i)
if(h==null){s=m.e
r=o.ax2(s,k)
q=o.ax0(s,k,r)
p=new A.Um(r,s.w,o.awS(s,k),o.awX(s,k),o.ax5(k),o.awT(k),q)}else p=h
o.J(new A.b6P(o,i,j,k,p))},
u7(){var s,r,q,p,o,n,m=this,l=m.ay,k=m.w
k===$&&A.b()
s=m.x
s===$&&A.b()
r=m.y
r===$&&A.b()
q=m.z
q===$&&A.b()
p=m.Q
p===$&&A.b()
o=m.as
o===$&&A.b()
n=m.at
n===$&&A.b()
m.ax.j(0,l,new A.Um(k,s,r,q,p,o,n))},
aKF(){var s=null,r=this.w
r===$&&A.b()
return A.au(A.a([A.B("Read/Write Ratio: "+B.d.Z(r,0)+":1",s,s,s,s,B.i2,s,s,s),A.l4(199,s,200,1,new A.b6R(this),B.d.t(this.w,1,200))],t.p),B.A,B.f,B.j)},
awF(){var s=this,r=null,q=s.x
q===$&&A.b()
return A.au(A.a([A.B("Data Size: "+s.azp(q),r,r,r,r,B.i2,r,r,r),A.l4(100,r,5000,10,new A.b6F(s),B.d.t(s.x,10,5000))],t.p),B.A,B.f,B.j)},
aPc(){var s,r=this,q=r.Q
q===$&&A.b()
q=A.bC(A.bLp(B.aw,!0,new A.b6V(r),B.aPT,q),1,null)
s=r.as
s===$&&A.b()
return A.al(A.a([q,A.bC(A.bLp(B.aw,!0,new A.b6W(r),B.aOP,s),1,null)],t.p),B.n,B.f,B.j,0,null)},
axW(){var s,r=this,q=r.y
q===$&&A.b()
q=A.bC(r.a3y("Consistency",new A.b6I(),new A.b6J(r),q,B.aq3,t.ey),1,null)
s=r.z
s===$&&A.b()
return A.al(A.a([q,B.an,A.bC(r.a3y("Latency",new A.b6K(),new A.b6L(r),s,B.aj3,t.ME),1,null)],t.p),B.n,B.f,B.j,0,null)},
a3y(a,b,c,d,e,f){var s=null,r=A.B(a,s,s,s,s,B.kf,s,s,s),q=A.v(e).i("@<1>").aD(f.i("f6<0>")).i("q<1,2>")
q=A.r(new A.q(e,new A.b6M(b,f),q),q.i("a2.E"))
return A.au(A.a([r,A.N8(B.ahH,s,!0,q,c,d,f)],t.p),B.A,B.f,B.j)},
aKN(a){var s,r,q,p=null,o=B.d.P(a.b*100),n=A.Z(8),m=A.aC(B.B,B.k,1),l=A.B(a.a.c,p,p,p,p,B.aJb,p,p,p)
if(o>=75)s=B.b3
else s=o>=55?B.a2:B.O
r=t.p
s=A.al(A.a([l,B.cb,A.B(""+o+"%",p,p,p,p,A.aA(p,p,s,p,p,p,p,p,p,p,p,11,p,p,B.x,p,p,!0,p,p,p,p,p,p,p,p),p,p,p)],r),B.n,B.f,B.j,0,p)
l=a.c
q=A.v(l).i("q<1,zz>")
l=A.r(new A.q(l,new A.b6S(),q),q.i("a2.E"))
return A.ab(p,A.au(A.a([s,B.aK,A.f2(B.a8,l,B.bE,4,6)],r),B.A,B.f,B.j),B.i,p,p,new A.a4(B.a0,p,m,n,p,p,p,B.p),p,p,p,B.jI,B.cA,p,p,p)},
avA(a){var s=null,r=A.bC(A.B(a.a.c,s,s,s,s,B.aKI,s,s,s),1,s),q=A.B(B.d.Z(a.b,0)+"%",s,s,s,s,B.B1,s,s,s),p=A.B(B.d.Z(a.d,0)+"ms",s,s,s,s,B.B1,s,s,s),o=this.awH(a.c)
return new A.ap(B.aaA,A.al(A.a([r,new A.aL(52,s,q,s),new A.aL(64,s,p,s),new A.aL(64,s,A.B(o,s,s,s,s,A.aA(s,s,a.e==="High"?B.a2:B.O,s,s,s,s,s,s,s,s,10,s,s,s,s,s,!0,s,s,s,s,s,s,s,s),s,s,s),s)],t.p),B.n,B.f,B.j,0,s),s)},
aEM(a){var s,r,q,p=null,o=a.b,n=o.length===0?"None":new A.q(o,new A.b6N(),A.v(o).i("q<1,c>")).aB(0,", ")
o=A.Z(8)
s=A.aC(B.B,B.k,1)
r=A.a([A.B("Primary: "+a.a.c,p,p,p,p,B.aKr,p,p,p),B.aK,A.B("Secondary: "+n,p,p,p,p,B.B1,p,p,p),B.b1],t.p)
q=a.c
B.b.q(r,new A.q(q,new A.b6O(),A.v(q).i("q<1,f>")))
return A.ab(p,A.au(r,B.A,B.f,B.j),B.i,p,p,new A.a4(B.a0,p,s,o,p,p,p,B.p),p,p,p,p,B.cA,p,p,p)},
awH(a){if(a>=1e6)return B.d.Z(a/1e6,1)+"M"
if(a>=1000)return B.d.Z(a/1000,1)+"K"
return B.e.l(a)},
azp(a){if(a>=1000)return B.d.Z(a/1000,1)+"TB"
return B.d.Z(a,0)+"GB"},
awS(a,b){var s,r,q
if(b==null){if(a.f>=0.9999)return B.lF
if(a.c>50)return B.lE
return B.nh}s=b.e
r=s.fx
if(r!=null&&r>1)return B.lF
r=s.fy
if(r!=null&&r>1)return B.lF
r=s.p3
if(r===B.og)return B.lF
if(r===B.zW)return B.nh
if(r===B.l8)return B.lE
q=b.b
$label0$0:{if(B.bW===q){r=B.nh
break $label0$0}if(B.by===q){r=B.lE
break $label0$0}if(B.bA===q){r=B.lE
break $label0$0}if(B.aQ===q){r=B.lE
break $label0$0}if(B.bf===q){r=B.lE
break $label0$0}if(B.bP===q){r=B.lF
break $label0$0}r=B.nh
break $label0$0}return r},
awX(a,b){var s,r
if(b==null){s=a.e
if(s<=100)return B.q5
if(s<=250)return B.tZ
return B.q4}r=b.b
$label0$0:{if(B.bP===r){s=B.q4
break $label0$0}if(B.bu===r){s=B.q4
break $label0$0}if(B.aQ===r){s=B.q5
break $label0$0}if(B.bA===r){s=B.tZ
break $label0$0}if(B.bf===r){s=B.q5
break $label0$0}s=B.tZ
break $label0$0}return s},
ax2(a,b){var s,r
if(b==null)return a.c
s=b.b
$label0$0:{if(B.bA===s){r=2
break $label0$0}if(B.bP===s){r=60
break $label0$0}if(B.bu===s){r=50
break $label0$0}if(B.aQ===s){r=40
break $label0$0}if(B.bf===s){r=25
break $label0$0}if(B.bW===s){r=6
break $label0$0}r=a.c
break $label0$0}return r},
ax0(a,b,c){var s=A.cp([B.Sf],t.Sm)
if(c>=10)s.B(0,B.Se)
if(a.a>5e7)s.B(0,B.qC)
if(b!=null)switch(b.b.a){case 58:s.B(0,B.uz)
break
case 57:s.B(0,B.ux)
break
case 60:s.B(0,B.uA)
break
case 59:s.B(0,B.uy)
break
case 61:case 62:s.B(0,B.qC)
break
default:break}return s},
ax5(a){var s,r
if(a==null)return!0
s=a.b
$label0$0:{r=!1
if(B.ar===s){r=!0
break $label0$0}if(B.bW===s){r=!0
break $label0$0}if(B.by===s)break $label0$0
if(B.bA===s)break $label0$0
if(B.aQ===s)break $label0$0
if(B.bf===s)break $label0$0
if(B.bP===s){r=!0
break $label0$0}if(B.bu===s)break $label0$0
r=!0
break $label0$0}return r},
awT(a){var s,r
if(a==null)return!1
s=a.b
$label0$0:{r=!0
if(B.by===s)break $label0$0
if(B.bA===s)break $label0$0
if(B.aQ===s)break $label0$0
if(B.bf===s)break $label0$0
if(B.bu===s)break $label0$0
r=!1
break $label0$0}return r},
aFk(a){var s
$label0$0:{s=B.ar===a||B.by===a||B.bA===a||B.bW===a||B.bf===a||B.aQ===a||B.bP===a||B.bu===a
break $label0$0}return s}}
