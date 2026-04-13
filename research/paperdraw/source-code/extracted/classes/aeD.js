A.aeD.prototype={
R(b7){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3=this,a4=null,a5="Propagated victim",a6=a3.d,a7=Math.max(1,a6.CW+B.d.P(a6.cx*0.5)),a8=a3.c,a9=a8.e,b0=a9.a,b1=b0*a7,b2=b1>0?a6.a/b1:0,b3=a3.f,b4=b3.e.f,b5=a9.Yr(b4),b6=a9.air(b4)
b4=a3.as
A.c72(a3.ax,a8,b4,a6)
s=A.caX(a8,a3.ay,b4)
if(J.em(b4))r=a4
else{b4=A.c8(b4,!0,t.tx)
B.b.be(b4,new A.bct())
r=B.b.gS(b4)}q=A.bx1(r==null?a4:A.bzk(a8,r,b3))
b3=a6.a
p=a3.a2E(b3,b0,1)
o=a3.a2E(b3,b0,Math.max(1,a7))
b0=B.F.u(0.96)
b4=A.Z(12)
n=A.aC(B.B.u(0.6),B.k,1)
m=A.a([new A.b6(0,B.Q,B.v.u(0.25),B.iQ,16)],t.V)
l=a8.w
k=t.p
l=A.a([A.B(l==null?a8.b.c:l,a4,a4,a4,a4,B.vg,a4,a4,a4),B.aK,A.B("Live metrics and anchors",a4,a4,a4,a4,A.aA(a4,a4,B.H.u(0.9),a4,a4,a4,a4,a4,a4,a4,a4,10,B.hq,a4,a4,a4,a4,!0,a4,a4,a4,a4,a4,a4,a4,a4),a4,a4,a4)],k)
if(s!=null){j=A.a([B.E,new A.ap(B.el,A.B("Chaos Insight".toUpperCase(),a4,a4,a4,a4,B.iX,a4,a4,a4),a4),a3.dO("Triggered By",s.a)],k)
i=s.b
if(i!=null)j.push(a3.dO("Local Effect",i))
j.push(a3.dO("Metric Evidence",s.c))
B.b.q(l,j)}if(q.length!==0){j=A.a([B.E,new A.ap(B.el,A.B("Business Impact".toUpperCase(),a4,a4,a4,a4,B.iX,a4,a4,a4),a4)],k)
for(i=q.length,h=0;h<q.length;q.length===i||(0,A.o)(q),++h){g=q[h]
j.push(new A.ap(B.th,A.al(A.a([new A.fk(1,B.d_,A.B(g.a,1,B.as,a4,a4,a4,a4,a4,a4),a4),B.an,new A.hm(1,B.fL,A.B(g.b,1,B.as,a4,a4,B.cc,B.fR,a4,a4),a4)],k),B.n,B.f,B.j,0,a4),a4))}B.b.q(l,j)}l.push(B.b1)
l.push(new A.ap(B.el,A.B("Metrics".toUpperCase(),a4,a4,a4,a4,B.iX,a4,a4,a4),a4))
l.push(a3.dO("RPS",a3.a2v(b3)))
l.push(a3.dO("P95",""+B.d.P(a6.c)+"ms"))
l.push(a3.dO("CPU",""+B.d.P(a6.d*100)+"%"))
l.push(a3.dO("Mem",""+B.d.P(a6.e*100)+"%"))
l.push(a3.dO("Capacity",a3.a2v(b1)))
l.push(a3.dO("Instances",A.m(a7)))
b3=a6.w
if(b3>0)l.push(a3.dO("Queue",a3.azm(b3)))
b3=a8.b
if(b3===B.ai)l.push(a3.dO("Cache Hit",""+B.d.P(a6.r*100)+"%"))
a6=a6.as
if(a6>0)l.push(a3.dO("Conn",""+B.d.P(a6*100)+"%"))
if(a3.a5Y(b3)){j=a9.fx
if(j==null)j=1
i=a9.fy
if(i==null)i=1
l.push(a3.dO("Quorum R/W",""+j+"/"+i))}j=a9.x
if(j&&a9.y>1)l.push(a3.dO("Replication","RF "+a9.y+" "+a9.p3.b))
if(a3.a5Y(b3)||A.bEY(b3)||A.jV(a8)){i=A.a([B.E,new A.ap(B.el,A.B("Topology".toUpperCase(),a4,a4,a4,a4,B.iX,a4,a4,a4),a4)],k)
f=a9.j5(b3)
e=f==null
d=e?a4:f.x.c
if(d==null)if(a9.Q)d="Sharded"
else{if(a9.at>1)c="Partitioned"
else c=a9.y>1?"Replicated":"Single"
d=c}c=a8.at
c=c==null?a4:c.c
if(c==null){c=e?a4:f.b.c
b=c}else b=c
if(b==null)if(b3===B.bV)b="Primary"
else{b3=b3===B.bk?"Replica":"Logical DB"
b=b3}a=j?Math.max(0,a9.y-1):0
a0=a9.at
a0=a0>0?a0:a9.p1.length
b3=t.mT
j=a9.fx
if(j==null)j=1
c=a9.fy
if(c==null)c=1
a6=B.d.P(a6*100)
a1=e?a4:f.z
if(a1==null)a1=100
a2=A.a([new A.as("Role",b,b3),new A.as("Topology",d,b3),new A.as("Quorum",""+j+"/"+c,b3),new A.as("Pool",""+a6+"% of "+a1,b3)],t.Iq)
if(a>0)a2.push(new A.as("Replicas",A.m(a),b3))
if(a0>1)a2.push(new A.as("Shards",""+a0,b3))
a6=e?a4:f.y
a2.push(new A.as("Lag Budget",""+(a6==null?180:a6)+"ms",b3))
a6=a8.as
if(a6!=null)a2.push(new A.as("Parent DB",a6,b3))
a6=a2.length
h=0
for(;h<a2.length;a2.length===a6||(0,A.o)(a2),++h){g=a2[h]
i.push(new A.ap(B.th,A.al(A.a([new A.fk(1,B.d_,A.B(g.a,1,B.as,a4,a4,a4,a4,a4,a4),a4),B.an,new A.hm(1,B.fL,A.B(g.b,1,B.as,a4,a4,B.cc,B.fR,a4,a4),a4)],k),B.n,B.f,B.j,0,a4),a4))}B.b.q(l,i)}l.push(B.E)
l.push(new A.ap(B.el,A.B("Anchors".toUpperCase(),a4,a4,a4,a4,B.iX,a4,a4,a4),a4))
for(a6=a3.asL(),a8=a6.length,h=0;h<a6.length;a6.length===a8||(0,A.o)(a6),++h){g=a6[h]
l.push(new A.ap(B.th,A.al(A.a([new A.fk(1,B.d_,A.B(g.a,1,B.as,a4,a4,a4,a4,a4,a4),a4),B.an,new A.hm(1,B.fL,A.B(g.b,1,B.as,a4,a4,B.cc,B.fR,a4,a4),a4)],k),B.n,B.f,B.j,0,a4),a4))}a6=a3.r
if(a6!=null){a8=A.a([B.E,new A.ap(B.el,A.B("Flow".toUpperCase(),a4,a4,a4,a4,B.iX,a4,a4,a4),a4),a3.dO("Ingress",B.d.Z(a6.a,1)+" rps"),a3.dO("Processed",B.d.Z(a6.b,1)+" rps"),a3.dO("Egress",B.d.Z(a6.c,1)+" rps"),a3.dO("Dropped",B.d.Z(a6.d,1)+" rps")],k)
a6=a6.e
if(a6.length!==0)a8.push(a3.dO("Top Drop",B.b.gS(a6).a.c+" ("+B.b.gS(a6).b+")"))
B.b.q(l,a8)}a6=a3.w
if(a6!=null&&a6.y>0){a8=A.a([B.E,new A.ap(B.el,A.B("Chaos Interaction".toUpperCase(),a4,a4,a4,a4,B.iX,a4,a4,a4),a4)],k)
b3=a6.b
if(b3.length!==0)a8.push(a3.dO("Top Cascade",b3))
b3=a6.c
a8.push(a3.dO("Top Pair",b3.length===0?"Active":b3))
a8.push(a3.dO("Impact","x"+B.d.Z(1+a6.y/4,2)))
b3=a6.d
if(b3.length!==0)a8.push(a3.dO("Top Chain",b3))
b3=a6.f
if(b3.length!==0){$label0$0:{if("seed"===b3){b3="Seed source"
break $label0$0}if("failover-target"===b3){b3="Failover target"
break $label0$0}if("propagated"===b3){b3=a5
break $label0$0}if("hybrid"===b3){b3="Seed + propagated"
break $label0$0}break $label0$0}a8.push(a3.dO("Cascade Role",b3))}b3=a6.e
if(b3.length!==0){$label1$1:{if("primary"===b3){b3="Primary overlap"
break $label1$1}if("propagated"===b3){b3=a5
break $label1$1}if("hybrid"===b3){b3="Primary + propagated"
break $label1$1}break $label1$1}a8.push(a3.dO("Role",b3))}b3=a6.w
if(b3.length!==0)a8.push(a3.dO("Seed Events",A.cD(b3,0,A.dz(2,"count",t.S),A.v(b3).c).aB(0,", ")))
a6=a6.r
if(a6.length!==0)a8.push(a3.dO("Mechanism",a6))
B.b.q(l,a8)}l.push(B.E)
l.push(new A.ap(B.el,A.B("Queueing".toUpperCase(),a4,a4,a4,a4,B.iX,a4,a4,a4),a4))
if(p!=null)l.push(a3.dO("M/M/1",a3.a4f(p)))
if(o!=null)l.push(a3.dO("M/M/c",a3.a4f(o)))
l.push(B.E)
l.push(new A.ap(B.el,A.B("SLO".toUpperCase(),a4,a4,a4,a4,B.iX,a4,a4,a4),a4))
a6=a3.avE(b5)
a8=Math.abs(a9.xr-0.7)<0.000001?"default":"custom"
l.push(a3.dO("Target",a6+" "+a8))
l.push(a3.dO("Local Budget",a3.avF(b6)))
l.push(B.E)
l.push(new A.ap(B.el,A.B("System".toUpperCase(),a4,a4,a4,a4,B.iX,a4,a4,a4),a4))
a8=a3.e
l.push(a3.dO("Budget Left",""+B.d.P(a8.x*100)+"%"))
l.push(a3.dO("Burn Rate",B.d.Z(a8.y,1)+"\xd7"))
l.push(a3.dO("Utilization",""+B.d.P(b2*100)+"%"))
return A.dq(!1,B.Y,!0,a4,A.ab(a4,A.jC(new A.eM(B.Yf,A.fL(A.au(l,B.A,B.f,B.j),a4,a4,a4,B.aC),a4),a4,a4,B.dX,!0,B.i2,a4,a4,B.aG),B.i,a4,a4,new A.a4(b0,a4,n,b4,m,a4,a4,B.p),a4,a4,a4,a4,B.eQ,a4,a4,340),B.i,B.C,0,a4,a4,a4,a4,a4,B.aO)},
dO(a,b){var s=null
return new A.ap(B.th,A.al(A.a([A.bC(A.B(a,1,B.as,s,s,s,s,s,s),1,s),B.an,new A.hm(1,B.fL,A.B(b,1,B.as,s,s,B.cc,B.fR,s,s),s)],t.p),B.n,B.f,B.j,0,s),s)},
a2v(a){if(a>=1e6)return B.d.Z(a/1e6,1)+"M"
if(a>=1000)return B.d.Z(a/1000,1)+"K"
return B.e.l(a)},
azm(a){if(a>=1e6)return B.d.Z(a/1e6,1)+"M"
if(a>=1000)return B.d.Z(a/1000,1)+"K"
return B.e.l(B.d.P(a))},
a4f(a){var s,r
if(!a.c)return"Unstable (\u03c1 "+B.d.Z(a.a,2)+")"
s=a.b
r=s>=1000?B.d.Z(s/1000,2)+"s":B.d.Z(s,0)+"ms"
return r+" (\u03c1 "+B.d.Z(a.a,2)+")"},
a5Y(a){var s
$label0$0:{s=B.ar===a||B.by===a||B.bA===a||B.bW===a||B.bf===a||B.aQ===a||B.bV===a||B.bk===a||B.bP===a||B.bu===a
break $label0$0}return s},
asL(){var s=A.aFa(A.bBr(this.c),0,t.o)
s=A.dd(s,new A.bcs(this),A.l(s).i("k.E"),t.mT)
s=A.r(s,A.l(s).i("k.E"))
s.$flags=1
return s},
avE(a){var s=a*100
if(s>=99.99)return B.d.Z(s,2)+"%"
if(s>=99)return B.d.Z(s,1)+"%"
return B.d.Z(s,0)+"%"},
avF(a){var s=B.d.t(a*100,0,100)
if(s<0.1)return B.d.Z(s,2)+"%"
if(s<1)return B.d.Z(s,1)+"%"
return B.d.Z(s,0)+"%"},
a2E(a,b,c){var s,r,q,p,o,n,m
if(a<=0||b<=0||c<=0)return null
s=b*c
r=a/s
if(!isFinite(r))return null
if(r>=1)return new A.Wk(r,1/0,!1)
if(c===1)return new A.Wk(r,1/(b-a)*1000,!0)
q=a/b
for(p=1,o=1,n=1;n<c;++n){o*=q/n
p+=o}m=o*q/c/(1-r)
return new A.Wk(r,(m/(p+m)/(s-a)+1/b)*1000,!0)}}
