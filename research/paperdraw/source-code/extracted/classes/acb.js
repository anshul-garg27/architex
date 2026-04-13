A.acb.prototype={
a9z(){var s,r,q,p=this.a.d,o=p.b
if(!(o===B.aM||o===B.aX||o===B.aR))return null
s=p.ch
r=s.b
q=s.a
$label0$0:{if(B.iT===q){p="Manual runtime override is active for this drawn shape."
break $label0$0}if(B.uM===q&&r!=null){p="AI inferred runtime behavior as "+r.c+"."
break $label0$0}if(B.mt===q){p="This drawing changed. Re-run inference before simulation."
break $label0$0}if(B.ms===q){p="Inference is incomplete. Pick a runtime here or re-run inference before simulation."
break $label0$0}p="This drawn shape keeps its visuals and uses the selected runtime behavior."
break $label0$0}return p},
aM(){var s,r,q,p,o,n,m,l=this,k=null
l.b3()
s=l.a.d
r=s.e
l.w=r.b
l.x=r.a
q=s.w
if(q==null)q=s.b.c
p=$.aU()
l.y=new A.eR(new A.d3(q,B.cG,B.bh),p)
o=r.vV()
l.z=new A.eR(new A.d3(o.e,B.cG,B.bh),p)
l.Q=s.b===B.a6?o.a:r.f
l.as=o.b
l.at=o.c
l.ax=o.d
l.ay=o.f
l.ch=o.r
l.CW=o.w
l.cx=o.x
l.cy=o.y
l.db=o.z
l.dx=o.Q
l.dy=o.as
l.fr=o.at
l.fx=o.ax
l.fy=o.ay
l.go=r.x
l.id=r.y
l.k1=r.z
l.k2=r.Q
l.k3=r.as
l.k4=r.at
l.ok=r.ax
l.p1=r.w
l.p2=r.CW
l.p3=r.cx
l.p4=r.c
l.R8=r.d
l.RG=r.e
l.rx=r.cy
l.ry=r.db
l.to=r.dx
l.x1=r.dy
l.x2=r.fr
l.xr=r.fx
l.y1=r.fy
s=r.ay
l.y2=s.length!==0?B.b.gS(s):"us-east-1"
l.aZ=A.c4j(l.a.d.b,r.go)
l.aj=r.ok
l.ai=A.c8(r.p1,!0,t.u0)
l.am=A.c8(r.p2,!0,t.Qs)
l.aV=r.p3
n=r.k3
s=r.k4
l.bj=s==null?l.a.d.b.geU():s
l.F=n.a
l.U=n.b
l.X=n.c
l.a8=n.d
l.a2=n.e
s=r.p4
l.aP=s==null?"LRU":s
s=r.R8
l.aJ=s==null?"JWT":s
s=r.RG
l.bT=s==null?3600:s
s=r.rx
l.ca=s==null?"strong":s
s=r.ry
l.c7=s==null?"at-least-once":s
s=r.to
l.a5=s==null?"gpt-4o":s
s=r.x1
l.W=s==null?4096:s
l.af=r.xr
m=r.j5(l.a.d.b)
s=m==null
q=s?k:m.a
l.b6=q==null?B.ej:q
q=s?k:m.c
l.cu=q==null?B.nr:q
q=s?k:m.d
l.cC=q==null?B.lN:q
q=s?k:m.e
l.c3=q==null?B.nm:q
q=s?k:m.f
l.d5=q==null?B.pu:q
q=s?k:m.r
l.cv=q==null?B.ps:q
q=s?k:m.w
l.ez=q==null?B.pq:q
q=s?k:m.x
l.d6=q==null?B.kO:q
q=s?k:m.y
l.dQ=q==null?180:q
s=s?k:m.z
l.cY=s==null?100:s},
n(){var s,r=this.y
r===$&&A.b()
s=$.aU()
r.W$=s
r.a5$=0
r=this.z
r===$&&A.b()
r.W$=s
r.a5$=0
this.aR()},
R(b7){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,b0,b1=this,b2=null,b3="Dead Letter Queue (DLQ)",b4="realtime",b5=b1.a.d.b.gbD(),b6=b1.gab().an($.t6(),t.py)
if(b6==null)b6=A.Ib()
s=b1.a.d
r=s.b
q=r===B.aJ||r===B.bz
p=b6.EY(s)
s=p.length
o=b6.aip(b1.a.d)
n=b6.EZ(b1.a.d)
r=b6.alf(b1.a.d)
m=J.ji(r.slice(0),A.v(r).c)
B.b.be(m,new A.b4g())
r=t.w
l=A.bM(b7,b2,r).w
r=A.bM(b7,b2,r).w
k=b1.a.d.b.gbI(0).u(0.15)
j=A.Z(12)
i=b1.a.d
h=i.b
j=A.ab(b2,A.bv(h.e,h.gbI(0),b2,28),B.i,b2,b2,new A.a4(k,b2,b2,j,b2,b2,b2,B.p),b2,b2,b2,b2,B.eQ,b2,b2,b2)
i=i.w
k=t.p
i=A.al(A.a([j,B.aFJ,A.bC(A.au(A.a([A.B(i==null?h.c:i,b2,b2,b2,b2,B.aIt,b2,b2,b2)],k),B.A,B.f,B.j),1,b2)],k),B.n,B.f,B.j,0,b2)
h=b1.y
h===$&&A.b()
j=B.a0.u(0.35)
j=A.a([i,B.cR,A.iz(b2,!1,h,A.p3(b2,new A.es(4,A.Z(10),new A.aO(B.B.u(0.5),1,B.k,-1)),b2,b2,b2,b2,b2,b2,!0,new A.es(4,A.Z(10),new A.aO(B.B.u(0.5),1,B.k,-1)),b2,b2,b2,b2,b2,j,!0,b2,b2,b2,b2,B.aAv,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,!0,b2,B.dY,"Component Name",!0,!0,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2,b2),!0,!1,b2,b2,1,b2,new A.b4h(b1),b2,b2,b2,b2,b2,b2,B.Ba,B.ah,b2,b2),B.v0],k)
if(b5===B.cf){b5=A.a([b1.au1(),b1.au2()],k)
s=b1.a.d.b
if(s===B.ad||s===B.ae)b5.push(b1.au0())
b5.push(B.oo)
B.b.q(j,b5)}else{b5=b1.dM("DEPLOYMENT")
i=b1.y2
i===$&&A.b()
h=b1.dM("SLO & ERROR BUDGET")
g=A.B("Default every component to a 30% error budget, or override it with a stricter target.",b2,b2,b2,b2,A.aA(b2,b2,B.H.u(0.9),b2,b2,b2,b2,b2,b2,b2,b2,12,b2,b2,b2,b2,b2,!0,b2,b2,b2,b2,b2,b2,b2,b2),b2,b2,b2)
f=b1.ayk()
e=b1.ayj()
d=b1.af
d===$&&A.b()
d=b1.a5Z(d)?"Default: "+b1.B4(0.7)+" SLO with "+b1.B5(0.30000000000000004)+" error budget.":"Override: "+b1.B4(d)+" SLO with "+b1.B5(1-b1.af)+" error budget."
d=A.B(d,b2,b2,b2,b2,A.aA(b2,b2,B.O.u(0.85),b2,b2,b2,b2,b2,b2,b2,b2,12,b2,b2,b2,b2,b2,!0,b2,b2,b2,b2,b2,b2,b2,b2),b2,b2,b2)
c=b1.dM("ARCHITECTURE VISUALIZATION")
b=b1.aj
b===$&&A.b()
b=A.a([b5,new A.eT("Deployment Region",i,B.avX,new A.b4i(b1),b2),B.P,h,g,B.E,new A.eT("Budget Policy",f,e,new A.b4t(b1),b2),B.b1,d,B.P,c,new A.eT("Display Mode",b.b,B.aws,new A.b4E(b1),b2)],k)
if(b1.aj===B.jq){b5=A.a([B.P,B.aO9],k)
i=b1.ai
i===$&&A.b()
B.b.q(b5,new A.q(i,new A.b4P(b1),A.v(i).i("q<1,f>")))
b5.push(new A.dB(B.e1,b2,b2,A.py(B.Ha,B.aOs,new A.b5_(b1),b2),b2))
b5.push(B.a9t)
b5.push(B.aO_)
i=b1.am
i===$&&A.b()
B.b.q(b5,new A.q(i,new A.b5a(b1),A.v(i).i("q<1,f>")))
b5.push(new A.dB(B.e1,b2,b2,A.py(B.Ha,B.aPd,new A.b5l(b1),b2),b2))
b5.push(B.E)
i=b1.aV
i===$&&A.b()
b5.push(new A.eT("Replication Type",i.b,B.Np,new A.b5w(b1),b2))
B.b.q(b,b5)}if(A.bMq(b1.a.d.b)){b5=b1.dM("SIMULATION MAPPING")
i=b1.aZ
i===$&&A.b()
h=t.N
h=A.j(h,h)
for(a=0;a<37;++a){a0=B.nU[a]
h.j(0,a0.b,a0.c)}b5=A.a([B.P,b5,new A.eT("Simulate As",i.b,h,new A.b5D(b1),b2)],k)
if(b1.a9z()!=null){i=b1.a9z()
i.toString
B.b.q(b5,A.a([B.b1,A.B(i,b2,b2,b2,b2,A.aA(b2,b2,B.H.u(0.92),b2,b2,b2,b2,b2,b2,b2,b2,12,b2,b2,b2,b2,1.35,!0,b2,b2,b2,b2,b2,b2,b2,b2),b2,b2,b2)],k))}B.b.q(b,b5)}b.push(B.P)
b.push(b1.auu(p,s!==0,q,o,n,m))
b.push(B.P)
b.push(b1.dM("SCALING & DISTRIBUTION"))
b5=b1.w
b5===$&&A.b()
b.push(new A.fM("Replicas / Instances",""+b5,new A.b4j(b1),new A.b4k(b1),b2))
b.push(B.P)
b5=b1.x
b5===$&&A.b()
b.push(new A.fM("Node Capacity (RPS)",b1.azl(b5),new A.b4l(b1),new A.b4m(b1),b2))
b.push(B.P)
if(A.os(b1.a.d.b))B.b.q(b,A.a([b1.atA()],k))
b5=b1.a.d.b
if(!A.os(b5))b5=b5.gbD()===B.dR||b5.gbD()===B.fu
else b5=!1
if(b5){b5=b1.k2
b5===$&&A.b()
b5=A.a([new A.im("Enable Sharding / Partitioning",b5,new A.b4n(b1),b2)],k)
if(b1.k2){s=b1.k4
s===$&&A.b()
i=b1.ok
i===$&&A.b()
B.b.q(b5,A.a([B.E,new A.fM("Partition / Shard Count",""+s,new A.b4o(b1),new A.b4p(b1),b2),B.E,new A.im("Consistent Hashing",i,new A.b4q(b1),b2)],k))}b5.push(B.P)
B.b.q(b,b5)}if(!A.os(b1.a.d.b)){b5=b1.dM("CONSISTENCY & HIGH AVAILABILITY")
s=b1.go
s===$&&A.b()
s=A.a([b5,new A.im("Enable Replication",s,new A.b4r(b1),b2)],k)
if(b1.go){b5=b1.k1
b5===$&&A.b()
if(b5==null)b5="Leader-Follower"
i=b1.id
i===$&&A.b()
B.b.q(s,A.a([B.E,new A.eT("Replication Strategy",b5,B.avg,new A.b4s(b1),b2),B.E,new A.fM("Replication Factor",""+i,new A.b4u(b1),new A.b4v(b1),b2)],k))}s.push(B.P)
B.b.q(b,s)}if(b1.a.d.b===B.a6){b5=b1.dM("LOAD BALANCER")
s=b1.Q
s===$&&A.b()
if(s==null)s="round_robin"
i=b1.as
i===$&&A.b()
h=b1.at
h===$&&A.b()
g=b1.ax
g===$&&A.b()
f=b1.z
f===$&&A.b()
f=A.al(A.a([B.abz,new A.aL(170,b2,A.iz(b2,!1,f,B.Hn,!0,!1,b2,b2,1,b2,new A.b4w(b1),b2,b2,b2,b2,b2,b2,B.aIs,B.ah,b2,b2),b2)],k),B.n,B.f,B.j,0,b2)
e=b1.ay
e===$&&A.b()
d=b1.ch
d===$&&A.b()
c=b1.CW
c===$&&A.b()
a1=b1.cx
a1===$&&A.b()
a2=b1.cy
a2===$&&A.b()
a3=b1.db
a3===$&&A.b()
a4=b1.dx
a4===$&&A.b()
a5=b1.dy
a5===$&&A.b()
a6=b1.fr
a6===$&&A.b()
a7=b1.fx
a7===$&&A.b()
a8=b1.fy
a8===$&&A.b()
B.b.q(b,A.a([b5,new A.eT("Balancing Strategy",s,B.ave,new A.b4x(b1),b2),B.E,new A.im("Sticky Sessions",i,new A.b4y(b1),b2),B.E,new A.eT("Discovery Mode",h,B.aw2,new A.b4z(b1),b2),B.E,new A.im("Health Checks",g,new A.b4A(b1),b2),B.E,f,B.E,new A.fM("Health Timeout (ms)",""+e,new A.b4B(b1),new A.b4C(b1),b2),B.E,new A.fM("Healthy Threshold",""+d,new A.b4D(b1),new A.b4F(b1),b2),B.E,new A.fM("Unhealthy Threshold",""+c,new A.b4G(b1),new A.b4H(b1),b2),B.E,new A.fM("Backend Timeout (ms)",""+a1,new A.b4I(b1),new A.b4J(b1),b2),B.E,new A.fM("Idle Timeout (ms)",""+a2,new A.b4K(b1),new A.b4L(b1),b2),B.E,new A.im("TLS Termination",a3,new A.b4M(b1),b2),B.E,new A.eT("Minimum TLS",a4,B.axG,new A.b4N(b1),b2),B.E,new A.eT("Certificate State",a5,B.axo,new A.b4O(b1),b2),B.E,new A.fM("Backend Connections",""+a6,new A.b4Q(b1),new A.b4R(b1),b2),B.E,new A.fM("Slow Start (s)",""+a7,new A.b4S(b1),new A.b4T(b1),b2),B.E,new A.fM("Max Header Bytes",""+a8,new A.b4U(b1),new A.b4V(b1),b2),B.P],k))}if(b1.a.d.b===B.aJ){b5=b1.dM("API GATEWAY")
s=b1.aJ
s===$&&A.b()
if(s==null)s="JWT"
i=b1.p1
i===$&&A.b()
B.b.q(b,A.a([b5,new A.eT("Auth Type",s,B.awR,new A.b4W(b1),b2),B.E,A.al(A.a([B.Vd,A.al(A.a([A.B(""+i,b2,b2,b2,b2,B.kg,b2,b2,b2),A.l4(36,b2,3600,0,new A.b4X(b1),i)],k),B.n,B.f,B.j,0,b2)],k),B.n,B.ff,B.j,0,b2),B.P],k))}b5=b1.a.d.b
if(b5===B.bT||b5===B.bH){s=b1.dM(b5===B.bH?"CDN SETTINGS":"DNS SETTINGS")
b5=A.B(b1.a.d.b===B.bH?"Cache TTL (s)":"Record TTL (s)",b2,b2,b2,b2,B.fS,b2,b2,b2)
i=b1.p1
i===$&&A.b()
B.b.q(b,A.a([s,A.al(A.a([b5,A.al(A.a([A.B(""+i,b2,b2,b2,b2,B.kg,b2,b2,b2),A.l4(100,b2,86400,60,new A.b4Y(b1),i)],k),B.n,B.f,B.j,0,b2)],k),B.n,B.ff,B.j,0,b2),B.P],k))}if(b1.a.d.b===B.bN){b5=b1.dM("AUTH SERVICE")
s=b1.aJ
s===$&&A.b()
if(s==null)s="JWT"
i=b1.bT
i===$&&A.b()
h=A.B(""+i+"s",b2,b2,b2,b2,B.kg,b2,b2,b2)
B.b.q(b,A.a([b5,new A.eT("Protocol",s,B.axf,new A.b4Z(b1),b2),B.E,A.al(A.a([B.aQ5,A.al(A.a([h,A.l4(50,b2,86400,300,new A.b50(b1),i)],k),B.n,B.f,B.j,0,b2)],k),B.n,B.ff,B.j,0,b2),B.P],k))}if(b1.a.d.b===B.bU){b5=b1.dM("SERVERLESS")
s=b1.R8
s===$&&A.b()
i=b1.RG
i===$&&A.b()
B.b.q(b,A.a([b5,new A.fM("Min Instances (warm)",""+s,new A.b51(b1),new A.b52(b1),b2),B.E,new A.fM("Max Instances (burst)",""+i,new A.b53(b1),new A.b54(b1),b2),B.P],k))}b5=b1.a.d.b
if(b5!==B.bU)b5=b5===B.av||b5===B.bN||b5===B.cm||b5===B.dm||b5===B.aY
else b5=!1
if(b5){b5=b1.dM("AUTO-SCALE")
s=b1.p4
s===$&&A.b()
s=A.a([b5,new A.im("Enable Auto-Scaling",s,new A.b55(b1),b2)],k)
if(b1.p4){b5=b1.R8
b5===$&&A.b()
i=b1.RG
i===$&&A.b()
B.b.q(s,A.a([B.E,new A.fM("Min Instances",""+b5,new A.b56(b1),new A.b57(b1),b2),B.E,new A.fM("Max Instances",""+i,new A.b58(b1),new A.b59(b1),b2)],k))}s.push(B.P)
B.b.q(b,s)}b5=b1.a.d.b
s=b5===B.ai
if(s||b5===B.by){b5=b1.dM(s?"CACHE":"KEY-VALUE STORE")
i=b1.aP
i===$&&A.b()
s=b1.p1
s===$&&A.b()
B.b.q(b,A.a([b5,new A.eT("Eviction Policy",i,B.avQ,new A.b5b(b1),b2),B.E,A.al(A.a([B.Vd,A.al(A.a([A.B(""+s,b2,b2,b2,b2,B.kg,b2,b2,b2),A.l4(36,b2,3600,0,new A.b5c(b1),s)],k),B.n,B.f,B.j,0,b2)],k),B.n,B.ff,B.j,0,b2),B.P],k))}if(b1.a.d.b===B.bf){b5=b1.dM("VECTOR DATABASE")
s=b1.Q
s===$&&A.b()
if(s==null)s="cosine"
B.b.q(b,A.a([b5,new A.eT("Similarity Metric",s,B.awo,new A.b5d(b1),b2),B.P],k))}if(b1.a.d.b===B.aQ){b5=b1.dM("SEARCH INDEX")
s=b1.Q
s===$&&A.b()
if(s==null)s="standard"
B.b.q(b,A.a([b5,new A.eT("Analyzer",s,B.avG,new A.b5e(b1),b2),B.P],k))}if(b1.a.d.b===B.aN){b5=b1.dM("MESSAGE QUEUE")
s=b1.c7
s===$&&A.b()
i=b1.x2
i===$&&A.b()
B.b.q(b,A.a([b5,new A.eT("Delivery Mode",s,B.awm,new A.b5f(b1),b2),B.E,new A.im(b3,i,new A.b5g(b1),b2),B.P],k))}if(b1.a.d.b===B.bl){b5=b1.dM("PUB/SUB")
s=b1.Q
s===$&&A.b()
if(s==null)s="broadcast"
B.b.q(b,A.a([b5,new A.eT("Fan-out Mode",s,B.avB,new A.b5h(b1),b2),B.P],k))}if(b1.a.d.b===B.b7){b5=b1.dM("STREAM")
s=b1.p1
s===$&&A.b()
B.b.q(b,A.a([b5,A.al(A.a([B.aOc,A.al(A.a([A.B(""+B.e.bc(s,3600)+"h",b2,b2,b2,b2,B.kg,b2,b2,b2),A.l4(27,b2,168,1,new A.b5i(b1),B.d.t(s/3600,1,168))],k),B.n,B.f,B.j,0,b2)],k),B.n,B.ff,B.j,0,b2),B.P],k))}if(b1.a.d.b===B.ci){b5=b1.dM("LLM GATEWAY")
s=A.a([],k)
for(a=0;a<5;++a){a9=B.as6[a]
i=A.B(a9,b2,b2,b2,b2,B.r1,b2,b2,b2)
h=b1.a5
h===$&&A.b()
g=B.m.u(0.28)
f=B.a0.u(0.25)
e=b1.a5===a9?B.m.u(0.8):B.B.u(0.6)
s.push(A.zA(f,i,b2,new A.b5j(b1,a9),b2,h===a9,g,b2,b2,new A.aO(e,1,B.k,-1)))}s=A.f2(B.a8,s,B.bE,8,8)
i=b1.W
i===$&&A.b()
h=A.B(""+i,b2,b2,b2,b2,B.kg,b2,b2,b2)
B.b.q(b,A.a([b5,B.aPc,B.E,s,B.P,A.al(A.a([B.aO1,A.al(A.a([h,A.l4(50,b2,128e3,512,new A.b5k(b1),i)],k),B.n,B.f,B.j,0,b2)],k),B.n,B.ff,B.j,0,b2),B.P],k))}if(b1.a.d.b===B.ef){b5=b1.dM("MEMORY FABRIC")
s=b1.Q
s===$&&A.b()
if(s==null)s="working"
i=b1.p1
i===$&&A.b()
B.b.q(b,A.a([b5,new A.eT("Memory Tier",s,B.avw,new A.b5m(b1),b2),B.E,A.al(A.a([B.aOx,A.al(A.a([A.B(""+i,b2,b2,b2,b2,B.kg,b2,b2,b2),A.l4(50,b2,86400,300,new A.b5n(b1),i)],k),B.n,B.f,B.j,0,b2)],k),B.n,B.ff,B.j,0,b2),B.P],k))}if(b1.a.d.b===B.eg){b5=b1.dM("AGENT ORCHESTRATOR")
s=b1.Q
s===$&&A.b()
if(s==null)s="react"
B.b.q(b,A.a([b5,new A.eT("Planning Mode",s,B.avt,new A.b5o(b1),b2),B.E,new A.fM("Max Agent Steps",""+B.e.t(b1.x,1,100),new A.b5p(b1),new A.b5q(b1),b2),B.P],k))}b5=b1.a.d.b
if(b5===B.f6||b5===B.fv||b5===B.eK){if(b5===B.eK)b5="BATCH PROCESSOR"
else b5=b5===B.fv?"CDC SERVICE":"ETL PIPELINE"
b5=b1.dM(b5)
s=b1.Q
s===$&&A.b()
if(s==null)s=b4
B.b.q(b,A.a([b5,new A.eT("Schedule",s,B.awg,new A.b5r(b1),b2),B.P],k))}if(b1.a.d.b===B.bO){b5=b1.dM("SCHEDULER")
s=b1.Q
s===$&&A.b()
if(s==null)s="cron"
B.b.q(b,A.a([b5,new A.eT("Schedule Type",s,B.axm,new A.b5s(b1),b2),B.P],k))}if(b1.a.d.b===B.cL){b5=b1.dM("PAYMENT GATEWAY")
s=b1.Q
s===$&&A.b()
if(s==null)s="instant"
B.b.q(b,A.a([b5,new A.eT("Settlement",s,B.ax7,new A.b5t(b1),b2),B.P],k))}if(b1.a.d.b===B.hN){b5=b1.dM("FRAUD DETECTION")
s=b1.Q
s===$&&A.b()
if(s==null)s=b4
B.b.q(b,A.a([b5,new A.eT("Scoring Mode",s,B.awN,new A.b5u(b1),b2),B.P],k))}b5=b1.a.d.b
if(b5===B.iu||b5===B.ir||b5===B.it){b5=b1.dM("OBSERVABILITY")
s=b1.p1
s===$&&A.b()
B.b.q(b,A.a([b5,A.al(A.a([B.aQ0,A.al(A.a([A.B(""+s,b2,b2,b2,b2,B.kg,b2,b2,b2),A.l4(30,b2,300,1,new A.b5v(b1),B.e.t(s,1,300))],k),B.n,B.f,B.j,0,b2)],k),B.n,B.ff,B.j,0,b2),B.P],k))}b5=b1.a.d.b
if(A.bMn(b5)||A.bMp(b5)||A.bMo(b5)){b5=A.a([b1.dM("RESILIENCE & RELIABILITY")],k)
if(A.bMn(b1.a.d.b)){s=b1.to
s===$&&A.b()
b5.push(new A.im("Circuit Breaker",s,new A.b5x(b1),b2))}if(A.bMp(b1.a.d.b)){s=b1.x1
s===$&&A.b()
b5.push(new A.im("Automatic Retries (with Jitter)",s,new A.b5y(b1),b2))}s=b1.a.d.b
if(A.bMo(s)&&s!==B.aN){s=b1.x2
s===$&&A.b()
b5.push(new A.im(b3,s,new A.b5z(b1),b2))}b5.push(B.P)
B.b.q(b,b5)}b5=b1.a.d.b
b0=b5.gbD()
if(b0===B.h7||b0===B.dj||b0===B.hM||b5===B.cL){b5=b1.dM("TRAFFIC CONTROL")
s=b1.rx
s===$&&A.b()
s=A.a([b5,new A.im("Rate Limiting",s,new A.b5A(b1),b2)],k)
if(b1.rx){b5=b1.ry
b5===$&&A.b()
if(b5==null)b5=1000
B.b.q(s,A.a([B.E,new A.fM("Max RPS (Throttle)",""+b5,new A.b5B(b1),new A.b5C(b1),b2)],k))}s.push(B.P)
B.b.q(b,s)}b.push(B.oo)
B.b.q(j,b)}return A.ab(b2,A.fL(A.au(j,B.A,B.f,B.W),b2,b2,b2,B.aC),B.i,b2,new A.ay(0,1/0,0,l.a.b*0.8),b2,b2,b2,b2,b2,new A.ag(20,20,20,r.f.d+20),b2,b2,b2)},
au1(){var s,r=this,q=r.bj
q===$&&A.b()
if(q==null){q=r.a.d.b.geU()
s=q}else s=q
if(s==null)s=B.uo
return A.au(A.a([r.dM("NETWORK SCOPE"),new A.eT("Scope",s.b,B.ax8,new A.b2y(r),null),B.P],t.p),B.A,B.f,B.j)},
au2(){var s,r,q,p,o,n=this,m=null,l=n.dM("TRAFFIC PROCESSING"),k=A.bC(A.B("Ingress Processing Latency",m,m,m,m,A.aA(m,m,B.O.u(0.8),m,m,m,m,m,m,m,m,15,m,m,m,m,m,!0,m,m,m,m,m,m,m,m),m,m,m),1,m),j=n.F
j===$&&A.b()
s=t.p
j=A.al(A.a([k,B.an,A.B(B.d.Z(j,1)+" ms",m,m,m,m,B.B2,m,m,m)],s),B.n,B.ff,B.j,0,m)
k=A.l4(100,m,50,0,new A.b2E(n),n.F)
r=n.U
r===$&&A.b()
q=n.X
q===$&&A.b()
p=n.a8
p===$&&A.b()
o=n.a2
o===$&&A.b()
return A.au(A.a([l,j,k,new A.im("Routing Rules",r,new A.b2F(n),m),new A.im("WAF",q,new A.b2G(n),m),new A.im("Rate Limiting",p,new A.b2H(n),m),new A.im("Health Checks",o,new A.b2I(n),m),B.P],s),B.A,B.f,B.j)},
au0(){var s,r=this.a.d,q=r.e.k2
q=q.length!==0?q:r.b.gKM()
r=A.a([this.dM("CONTAINER POLICY"),B.aOw,B.d1],t.p)
if(q.length===0)r.push(B.aR_)
else{s=A.v(q).i("q<1,tB>")
s=A.r(new A.q(q,new A.b2u(),s),s.i("a2.E"))
r.push(A.f2(B.a8,s,B.bE,8,8))}r.push(B.P)
return A.au(r,B.A,B.f,B.j)},
dM(a){var s=null
return new A.ap(B.aaw,A.B(a,s,s,s,s,A.aA(s,s,B.H.u(0.5),s,s,s,s,s,s,s,s,11,s,s,B.x,s,s,!0,s,1.2,s,s,s,s,s,s),s,s,s),s)},
Gx(a){var s,r,q,p,o,n,m,l,k,j,i=this,h=i.gab(),g=h.K(0,$.t6(),t.py)
if(g==null)g=A.Ib()
s=g.ZZ(i.a.d)
r=A.jk(s,A.v(s).c)
s=t.N
q=A.bt(g.f,s,s)
p=A.j(s,t.yp)
for(o=g.r,o=o.gdI(o),o=o.gT(o);o.p();){n=o.gH(o)
p.j(0,n.a,A.c8(n.b,!0,s))}m=A.a([],t.s)
l=A.ak(s)
for(s=a.length,o=g.d,k=0;k<a.length;a.length===s||(0,A.o)(a),++k){j=a[k]
n=!0
if(j.length!==0)if(o.ae(0,j))n=r.a!==0&&!r.k(0,j)||!l.B(0,j)
if(n)continue
m.push(j)}s=m.length
if(s===0){q.L(0,i.a.d.a)
p.L(0,i.a.d.a)}else{o=i.a
if(s===1){q.j(0,o.d.a,B.b.gS(m))
p.L(0,i.a.d.a)}else{q.L(0,o.d.a)
p.j(0,i.a.d.a,m)}}h.K(0,$.t6().gal(),t.lm).bM(0,g.ado(p,q))},
abG(a,b){var s,r=a.b
if(r==null)r=this.aQJ(a.d)
s=this.aQF(a.e)
if(b)return r+" - "+s+" ("+a.a+")"
return r+" - "+s},
aQH(a){return this.abG(a,!1)},
aQJ(a){var s
switch(a.a){case 0:s="CRUD"
break
case 1:s="Bulk Upload"
break
case 2:s="External API"
break
case 3:s="File Ops"
break
case 4:s="Analytics"
break
case 5:s="Async Jobs"
break
case 6:s="Streaming"
break
default:s=null}return s},
aQF(a){var s
switch(a.a){case 0:s="High"
break
case 1:s="Normal"
break
case 2:s="Low"
break
default:s=null}return s},
aQI(a){if(a.length===0)return"Default"
return new A.q(a,new A.b2P(),A.v(a).i("q<1,c>")).aB(0,", ")},
aN6(a){var s,r=this
r.d6=a
switch(a.a){case 0:r.k2=!1
r.k4=1
r.go=!1
r.id=1
break
case 1:r.k2=!1
r.k4=1
r.go=!0
s=r.id
s===$&&A.b()
if(s<2)s=2
r.id=s
break
case 2:r.k2=!0
s=r.k4
s===$&&A.b()
if(s<2)s=2
r.k4=s
s=r.k3
s===$&&A.b()
if(s==null){s=r.ok
s===$&&A.b()
r.k3=s?"consistent-hash":"hash"}break
case 3:r.k2=!0
s=r.k4
s===$&&A.b()
if(s<2)s=2
r.k4=s
s=r.k3
s===$&&A.b()
if(s==null)r.k3="range"
break}},
PG(a,b){var s=null,r=B.a0.u(0.3),q=A.Z(10),p=A.aC(B.B.u(0.55),B.k,1)
return A.ab(s,A.au(A.a([A.B(a,s,s,s,s,A.aA(s,s,B.H.u(0.9),s,s,s,s,s,s,s,s,10,s,s,B.x,s,s,!0,s,0.7,s,s,s,s,s,s),s,s,s),B.aK,A.B(b,s,s,s,s,B.B3,s,s,s)],t.p),B.A,B.f,B.j),B.i,s,s,new A.a4(r,s,p,q,s,s,s,B.p),s,s,s,s,B.pE,s,s,s)},
a1u(a,b,c,d,e,f){var s=null,r=A.B(b,s,s,s,s,B.vh,s,s,s),q=d.gdI(d),p=t.p
q=A.a([r,B.E,A.f2(B.a8,q.cp(q,new A.b1x(e,c,f),t.Vo).cP(0,!1),B.bE,8,8)],p)
if(a!=null)B.b.q(q,A.a([B.b1,A.B(a,s,s,s,s,B.UQ,s,s,s)],p))
return A.au(q,B.A,B.f,B.j)},
qv(a,b,c,d,e){return this.a1u(null,a,b,c,d,e)},
auu(a,b,c,d,a0,a1){var s,r,q,p,o,n,m,l,k,j,i,h=this,g=null,f=t.p,e=A.a([h.dM("WORKLOAD POLICY")],f)
if(c){s=A.a([B.aQu,B.b1,B.aQs],f)
if(b)B.b.q(s,A.a([B.E,A.xb(B.aPD,new A.b2K(h))],f))
B.b.q(e,s)}else{s=!b
r=A.B("Default ("+h.abG(d,!0)+")",g,g,g,g,g,g,g,g)
q=B.m.u(0.24)
p=B.a0.u(0.2)
o=s?B.m.u(0.8):B.B.u(0.6)
o=A.zA(p,r,g,new A.b2L(h),g,s,q,g,g,new A.aO(o,1,B.k,-1))
q=B.m.u(0.24)
s=B.a0.u(0.2)
r=b?B.m.u(0.8):B.B.u(0.6)
r=A.a([B.aP6,B.E,A.f2(B.a8,A.a([o,A.zA(s,B.aP7,g,new A.b2M(h,b,a1,d),g,b,q,g,g,new A.aO(r,1,B.k,-1))],f),B.bE,8,8)],f)
if(b){s=A.a([],f)
for(q=a1.length,n=0;n<a1.length;a1.length===q||(0,A.o)(a1),++n){m=a1[n]
p=m.a
o=B.b.k(a,p)
l=A.B(h.aQH(m),g,g,g,g,g,g,g,g)
k=m.c
if(k==null)k=p
j=B.m.u(0.22)
i=B.a0.u(0.18)
p=B.b.k(a,p)?B.m.u(0.72):B.B.u(0.6)
s.push(A.bBT(i,g,l,g,new A.b2N(h,a,m),o,j,g,new A.aO(p,1,B.k,-1),k))}B.b.q(r,A.a([B.d1,A.f2(B.a8,s,B.bE,8,8)],f))}r.push(B.d1)
f=B.a0.u(0.18)
s=A.Z(10)
q=A.aC(B.B.u(0.5),B.k,1)
r.push(A.ab(g,A.B("Selected summary: "+h.aQI(a0),g,g,g,g,B.UH,g,g,g),B.i,g,g,new A.a4(f,g,q,s,g,g,g,B.p),g,g,g,g,B.lS,g,g,1/0))
B.b.q(e,r)}return A.au(e,B.A,B.f,B.j)},
atA(){var s,r,q,p,o,n,m,l,k,j,i,h,g=this,f=null,e="Topology",d=A.a([],t.s),c=g.go
c===$&&A.b()
if(c){c=g.id
c===$&&A.b()
s=c}else s=1
c=g.xr
c===$&&A.b()
if(c==null)c=1
if(c<=s){c=g.y1
c===$&&A.b()
if(c==null)c=1
c=c>s}else c=!0
if(c)d.push("Quorum read/write cannot exceed the available replica count.")
c=!1
if(g.go){r=g.aV
r===$&&A.b()
if(r===B.l8){c=g.ca
c===$&&A.b()
c=c==="strong"||c==="session"}}if(c)d.push("Async replication can violate strong or session read expectations under lag.")
c=g.cC
c===$&&A.b()
if((c===B.lO||c===B.ns)&&!g.go)d.push("Quorum or multi-writer routing expects multiple writable DB nodes.")
c=g.d6
c===$&&A.b()
r=!0
if(c!==B.iA)if(c!==B.fD){c=g.k2
c===$&&A.b()}else c=r
else c=r
r=!1
if(c){c=g.k3
c===$&&A.b()
if(c==null||B.c.N(c).length===0){c=g.ok
c===$&&A.b()
c=!c}else c=r}else c=r
if(c)d.push("Sharded and partitioned layouts need a routing strategy or consistent hashing.")
q=g.a.d.b===B.ar
c=g.d6
if(c===B.kO)p="Single node"
else{if(g.go){r=g.id
r===$&&A.b()}else r=1
p=c.c+" with RF "+r}c=g.cu
c===$&&A.b()
r=g.cC
o=g.dM(q?"DATABASE CONTROL PANEL":"DB BEHAVIOR")
n=g.b6
n===$&&A.b()
m=t.p
r=A.a([o,B.aPJ,B.P,A.f2(B.a8,A.a([g.PG("Engine",n.c),g.PG(e,p),g.PG("Routing",c.c+" reads / "+r.c+" writes")],m),B.bE,8,8),B.P],m)
for(c=d.length,l=0;l<d.length;d.length===c||(0,A.o)(d),++l){k=d[l]
o=B.a2.u(0.12)
n=new A.be(10,10)
j=new A.aO(B.a2.u(0.45),1,B.k,-1)
r.push(A.ab(f,A.al(A.a([A.bv(B.H3,B.a2.u(0.95),f,18),B.an,new A.fk(1,B.d_,A.B(k,f,f,f,f,B.aJZ,f,f,f),f)],m),B.A,B.f,B.j,0,f),B.i,f,f,new A.a4(o,f,new A.dC(j,j,j,j),new A.dw(n,n,n,n),f,f,f,B.p),f,f,f,B.jI,B.lS,f,f,1/0))}r.push(g.a1u("Single-select chips make the chosen engine family explicit.","Engine",new A.b21(g),B.avj,g.b6,t.Cv))
if(q){c=g.Q
c===$&&A.b()
if(c==null)c="postgresql"
B.b.q(r,A.a([B.P,new A.eT("Engine Flavor",c,B.awe,new A.b22(g),f)],m))}r.push(B.cR)
r.push(g.qv(e,new A.b23(g),B.avW,g.d6,t.Kt))
r.push(B.P)
c=g.aj
c===$&&A.b()
r.push(new A.eT("Visualization",c.b,B.awr,new A.b2e(g),f))
r.push(B.E)
r.push(new A.im("Replication Enabled",g.go,new A.b2n(g),f))
if(g.go){c=g.id
c===$&&A.b()
o=g.k1
o===$&&A.b()
if(o==null)o="Leader-Follower"
n=g.aV
n===$&&A.b()
B.b.q(r,A.a([B.E,new A.fM("Replication Factor",""+c,new A.b2o(g),new A.b2p(g),f),B.E,new A.eT("Replication Strategy",o,B.avf,new A.b2q(g),f),B.E,new A.eT("Replication Type",n.b,B.Np,new A.b2r(g),f)],m))}c=g.d6
o=!0
if(c!==B.iA)if(c!==B.fD){c=g.k2
c===$&&A.b()}else c=o
else c=o
if(c){c=g.k4
c===$&&A.b()
o=g.k3
o===$&&A.b()
if(o==null){o=g.ok
o===$&&A.b()
o=o?"consistent-hash":"hash"}B.b.q(r,A.a([B.E,new A.fM("Shard / Partition Count",""+c,new A.b2s(g),new A.b2t(g),f),B.E,new A.eT("Routing Strategy",o,B.awz,new A.b24(g),f)],m))}r.push(B.cR)
c=g.ca
c===$&&A.b()
r.push(g.qv("Consistency",new A.b25(g),B.awn,c,t.N))
r.push(B.E)
c=g.xr
r.push(new A.fM("Quorum Read",""+(c==null?1:c),new A.b26(g),new A.b27(g),f))
r.push(B.E)
c=g.y1
c===$&&A.b()
if(c==null)c=1
r.push(new A.fM("Quorum Write",""+c,new A.b28(g),new A.b29(g),f))
r.push(B.cR)
r.push(g.qv("Read Routing",new A.b2a(g),B.axj,g.cu,t.cC))
r.push(B.P)
r.push(g.qv("Write Routing",new A.b2b(g),B.axx,g.cC,t.kL))
r.push(B.P)
c=g.c3
c===$&&A.b()
r.push(g.qv("Failover",new A.b2c(g),B.axJ,c,t.JA))
r.push(B.cR)
c=g.d5
c===$&&A.b()
r.push(g.qv("Transaction Mode",new A.b2d(g),B.axt,c,t.hJ))
r.push(B.P)
c=g.cv
c===$&&A.b()
r.push(g.qv("Pool Profile",new A.b2f(g),B.axs,c,t.DL))
r.push(B.E)
c=g.cY
c===$&&A.b()
r.push(new A.fM("Connection Pool Size",""+c,new A.b2g(g),new A.b2h(g),f))
r.push(B.E)
c=g.dQ
c===$&&A.b()
r.push(new A.fM("Replica Lag Budget",""+c+"ms",new A.b2i(g),new A.b2j(g),f))
r.push(B.P)
c=g.ez
c===$&&A.b()
r.push(g.qv("Schema / Index Health",new A.b2k(g),B.aw0,c,t.ra))
if(q){c=g.dM("DATABASE SCHEMA")
o=A.Z(8)
n=A.aC(B.B,B.k,1)
i=g.p3
i===$&&A.b()
h=g.p2
h===$&&A.b()
h=h==null?B.i1:new A.d3(h,B.cG,B.bh)
B.b.q(r,A.a([B.P,c,A.ab(f,A.au(A.a([new A.im("Show on Canvas",i,new A.b2l(g),f),B.t9,A.iz(f,!1,new A.eR(h,$.aU()),B.ahK,!0,!1,f,f,4,f,new A.b2m(g),f,f,f,f,f,f,A.aA(f,f,f,f,f,f,f,f,$.KI(),f,f,12,f,f,f,f,f,!0,f,f,f,f,f,f,f,f),B.ah,f,f)],m),B.A,B.f,B.j),B.i,f,f,new A.a4(B.a0,f,n,o,f,f,f,B.p),f,f,f,f,B.fG,f,f,f),B.P,new A.MK(!0,f),B.P],m))}return A.au(r,B.A,B.f,B.j)},
aG(){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,b0,b1,b2,b3,b4,b5,b6,b7,b8,b9,c0,c1,c2,c3,c4,c5,c6,c7,c8,c9,d0,d1,d2,d3,d4=this,d5="round_robin",d6=d4.a.d
if(d6.b===B.a6){d6=d4.Q
d6===$&&A.b()
if(d6==null)d6=d5
s=d4.as
s===$&&A.b()
r=d4.at
r===$&&A.b()
q=d4.ax
q===$&&A.b()
p=d4.z
p===$&&A.b()
p=B.c.N(p.a.a)
if(p.length===0)p="/health"
o=d4.ay
o===$&&A.b()
n=d4.ch
n===$&&A.b()
m=d4.CW
m===$&&A.b()
l=d4.cx
l===$&&A.b()
k=d4.cy
k===$&&A.b()
j=d4.db
j===$&&A.b()
i=d4.dx
i===$&&A.b()
h=d4.dy
h===$&&A.b()
g=d4.fr
g===$&&A.b()
f=d4.fx
f===$&&A.b()
e=d4.fy
e===$&&A.b()
d=A.aGA(r,l,h,p,o,q,n,k,g,e,i,d6,f,s,j,m)}else d=d6.e.r
d6=d4.gab().K(0,$.aP().gal(),t.F)
s=d4.a.d
r=s.e
q=d4.w
q===$&&A.b()
p=d4.x
p===$&&A.b()
o=d4.p4
o===$&&A.b()
n=d4.R8
n===$&&A.b()
m=d4.RG
m===$&&A.b()
l=s.b
k=d4.Q
if(l===B.a6){k===$&&A.b()
if(k==null)k=d5}else k===$&&A.b()
j=d4.go
j===$&&A.b()
i=d4.id
i===$&&A.b()
h=d4.k1
h===$&&A.b()
g=d4.k2
g===$&&A.b()
f=d4.k3
f===$&&A.b()
e=d4.k4
e===$&&A.b()
c=d4.ok
c===$&&A.b()
b=d4.p1
b===$&&A.b()
a=d4.p2
a===$&&A.b()
a0=d4.p3
a0===$&&A.b()
a1=d4.rx
a1===$&&A.b()
a2=d4.ry
a2===$&&A.b()
a3=d4.to
a3===$&&A.b()
a4=d4.x1
a4===$&&A.b()
a5=d4.x2
a5===$&&A.b()
a6=d4.xr
a6===$&&A.b()
a7=d4.y1
a7===$&&A.b()
if(A.bMq(l)){l=d4.aZ
l===$&&A.b()}else l=r.go
a8=d4.y2
a8===$&&A.b()
a8=A.a([a8],t.s)
a9=d4.aj
a9===$&&A.b()
b0=d4.ai
b0===$&&A.b()
b1=d4.am
b1===$&&A.b()
b2=d4.aV
b2===$&&A.b()
b3=d4.a.d
b4=b3.b
if(b4.gbD()===B.cf){b5=d4.bj
b5===$&&A.b()
if(b5==null)b5=b4.geU()}else b5=b3.e.k4
if(b4.gbD()===B.cf){b6=d4.F
b6===$&&A.b()
b7=d4.U
b7===$&&A.b()
b8=d4.X
b8===$&&A.b()
b9=d4.a8
b9===$&&A.b()
c0=d4.a2
c0===$&&A.b()
b6=new A.kz(b6,b7,b8,b9,c0)}else b6=b3.e.k3
b7=d4.aP
b7===$&&A.b()
b8=d4.aJ
b8===$&&A.b()
b9=d4.bT
b9===$&&A.b()
c0=d4.ca
c0===$&&A.b()
c1=d4.c7
c1===$&&A.b()
c2=d4.a5
c2===$&&A.b()
c3=d4.W
c3===$&&A.b()
c4=d4.af
c4===$&&A.b()
b3=b3.e
if(A.os(b4)){c5=b3.j5(b4)
if(c5==null)c5=A.mu(b4,null,null,1,1,!1)
b3=d4.b6
b3===$&&A.b()
b4=d4.cu
b4===$&&A.b()
c6=d4.cC
c6===$&&A.b()
c7=d4.c3
c7===$&&A.b()
c8=d4.d5
c8===$&&A.b()
c9=d4.cv
c9===$&&A.b()
d0=d4.ez
d0===$&&A.b()
d1=d4.d6
d1===$&&A.b()
d2=d4.dQ
d2===$&&A.b()
d3=d4.cY
d3===$&&A.b()
c6=c5.aUw(d3,b3,c7,d0,d2,c9,b4,d1,c8,c6)
b3=c6}else b3=b3.x2
d6.zC(s.a,r.aVx(k,b8,o,c4,b,p,a3,c0,c,b3,a,c1,a9,a5,b7,q,c2,d,m,c3,n,b5,b1,e,a6,a7,a2,a1,a8,j,i,h,b2,a4,b0,g,f,a0,l,b9,b6))},
azl(a){if(a>=1e6)return B.d.Z(a/1e6,1)+"M"
if(a>=1000)return B.d.Z(a/1000,1)+"K"
return B.e.l(a)},
ayk(){var s=this.af
s===$&&A.b()
if(this.a5Z(s))return"default"
return"availability:"+B.d.P(s*1e5)},
ayj(){var s,r,q,p=this,o=t.N,n=A.u(["default","Default ("+p.B4(0.7)+" / "+p.B5(0.30000000000000004)+")"],o,o)
for(s=0;s<5;++s){r=B.I1[s]
n.j(0,"availability:"+B.d.P(r*1e5),p.B4(r)+" / "+p.B5(1-r))}o=p.af
o===$&&A.b()
q=B.b.aE(B.I1,new A.b2O(o))
if(!q)n.j(0,"availability:"+B.d.P(o*1e5),p.B4(o)+" / "+p.B5(1-o))
return n},
ata(a){var s,r
if(a==="default")return 0.7
if(!B.c.aT(a,"availability:")){s=this.af
s===$&&A.b()
return s}r=A.ix(B.c.bg(a,13),null)
if(r==null){s=this.af
s===$&&A.b()
return s}return B.d.t(r/1e5,0.9,0.99999)},
a5Z(a){return Math.abs(a-0.7)<0.000001},
B4(a){var s=a*100
if(s>=99.99)return B.d.Z(s,2)+"%"
if(s>=99)return B.d.Z(s,1)+"%"
return B.d.Z(s,0)+"%"},
B5(a){var s=B.d.t(a*100,0,100)
if(s<0.1)return B.d.Z(s,2)+"%"
if(s<1)return B.d.Z(s,1)+"%"
return B.d.Z(s,0)+"%"}}
