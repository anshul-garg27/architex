A.tm.prototype={
lR(a,b){var s=A.j(t.N,t.X)
s.j(0,"problem_id",this.x)
s.q(0,b)
A.aZ(a,s)},
aPo(a){return this.lR(a,B.am)},
es(){var s=0,r=A.A(t.H),q=this,p
var $async$es=A.w(function(a,b){if(a===1)return A.x(b,r)
for(;;)switch(s){case 0:p=q.x
s=p!=null?2:3
break
case 2:s=4
return A.n(q.r.FK(p,q.f),$async$es)
case 4:case 3:return A.y(null,r)}})
return A.z($async$es,r)},
EH(){var s=0,r=A.A(t.H),q=this
var $async$EH=A.w(function(a,b){if(a===1)return A.x(b,r)
for(;;)switch(s){case 0:s=2
return A.n(q.es(),$async$EH)
case 2:return A.y(null,r)}})
return A.z($async$EH,r)},
aJK(a,b){var s,r,q,p,o,n
if(a.length===0)return 0
s=A.c8(a,!0,t.i)
B.b.d_(s)
r=B.d.t(b,0,1)
q=(s.length-1)*r
p=B.d.dS(q)
o=B.d.f4(q)
if(p===o)return s[p]
n=q-p
return s[p]*(1-n)+s[o]*n},
aQA(a,b){if(!isFinite(a)||a<=0)return 0
return Math.max(0.1,Math.sqrt(B.d.t(a/b,0,1)))},
aO6(a,b){var s
if(a<=0){s=b*0.8
return s<1?0:s}return a*0.2+b*0.8},
a9T(a){var s
$label0$0:{s=B.ar===a||B.by===a||B.bA===a||B.hb===a||B.bW===a||B.bf===a||B.aQ===a||B.d6===a||B.bP===a||B.bu===a
break $label0$0}return s},
HX(a,b){var s=a.a
if(s===B.iT||s===B.ka)return a
return a.V5(B.mt,b)},
aGl(a,b){var s=a.a
if(s===B.iT||s===B.ka)return a
return a.V5(B.mt,b)},
a6m(a,b,c){var s=c==null?a.f:c,r=b==null?a.e:b
return a.y.aVv(r,s,B.iT,"Connection semantics manually overridden on canvas.")},
aGi(a,b){return this.a6m(a,b,null)},
aGj(a,b){return this.a6m(a,null,b)},
BD(a,b,c){if(b.a===0)return a
return J.cq(a,new A.arP(this,b,c),t.D).cP(0,!1)},
tT(a,b){var s,r,q=t.D,p=A.j(t.N,q)
for(s=J.ar(a);s.p();){r=s.gH(s)
p.j(0,r.a,r)}return J.cq(b,new A.arO(this,p),q).cP(0,!1)},
auG(a,b,c){var s,r,q,p,o,n=b.b
if(!(n===B.ad||n===B.ae||b.e.k1)||b.a===a.a)return!1
s=A.bD2(b)
if(s.length!==0&&!B.b.k(s,a.b))return!1
r=A.bLr(b)
q=A.bLr(a)
if(r!=null&&q!=null&&A.aKR(q)<A.aKR(r))return!1
p=b.a
o=A.ak(t.N)
n=a.a
for(;;){if(!(p!=null&&o.B(0,p)))break
if(p===n)return!1
p=c.h(0,p)}return!0},
l9(a1){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0=J.Y(a1)
if(a0.ga3(a1))return a1
s=a0.cA(a1,new A.arQ())
r=A.r(s,s.$ti.i("k.E"))
B.b.be(r,new A.arR(this))
s=t.D
q=A.c8(a1,!0,s)
B.b.be(q,new A.arS(this))
p=A.j(t.N,t.A)
for(o=q.length,n=0;n<q.length;q.length===o||(0,A.o)(q),++n){m=q[n]
k=r.length
j=m.c
i=m.d
h=i.a
g=j.a+h/2
i=i.b
j=j.b+i/2
i=h*i+0.001
h=m.a
f=0
for(;;){if(!(f<r.length)){l=null
break}c$0:{e=r[f]
l=e.a
if(l===h)break c$0
d=e.d
c=d.a
d=d.b
if(c*d<=i)break c$0
b=e.c
a=b.a
b=b.b
if(!new A.M(a,b,a+c,b+d).k(0,new A.i(g,j)))break c$0
if(!this.auG(m,e,p))break c$0
break}r.length===k||(0,A.o)(r);++f}p.j(0,h,l)}return a0.cp(a1,new A.arT(p),s).cP(0,!1)},
atB(){var s=null,r=B.fq.lA()
return A.Ec(s,A.a([A.S6(A.tx(B.cX),s,s,!1,!1,r,!1,s,s,!1,s,B.nf,s,new A.i(4960,4968),B.ng,B.AA,B.cX)],t.Jc),s,s,s,s,!1,B.lt,B.l,1,s,B.cr,!0,s,1)},
M4(a,b){return this.b_a(a,!0)},
b_a(a,b){var s=0,r=A.A(t.H),q,p=this,o
var $async$M4=A.w(function(c,d){if(c===1)return A.x(d,r)
for(;;)switch(s){case 0:p.x=a
p.z=p.y=null
p.lR("problem_initialized",A.u(["selected_problem_id",a,"force_test_design",!0],t.N,t.X))
s=3
return A.n(p.aG_("assets/solutions/minimal_design.json",B.lt),$async$M4)
case 3:o=d
if(!o)p.sbn(0,p.atB())
p.es()
s=1
break
case 1:return A.y(q,r)}})
return A.z($async$M4,r)},
awY(a){var s
$label0$0:{if(B.aM===a){s="Service/Class"
break $label0$0}if(B.ad===a){s="Container"
break $label0$0}if(B.ae===a){s="VPC"
break $label0$0}if(B.dk===a){s="Subnet"
break $label0$0}if(B.bp===a){s="Load Balancer"
break $label0$0}if(B.bz===a){s="API Gateway"
break $label0$0}if(B.c9===a){s="Edge Router"
break $label0$0}if(B.cK===a){s="Service Mesh"
break $label0$0}if(B.dn===a){s="DNS Server"
break $label0$0}if(B.d7===a){s="Discovery Service"
break $label0$0}if(B.ca===a){s="Class"
break $label0$0}if(B.ck===a){s="Interface"
break $label0$0}if(B.ch===a){s="API"
break $label0$0}if(B.cn===a){s="State"
break $label0$0}if(B.cg===a){s="Enum"
break $label0$0}if(B.cj===a){s="Abstract"
break $label0$0}if(B.co===a){s="Table"
break $label0$0}if(B.cl===a){s="extends"
break $label0$0}s=null
break $label0$0}return s},
Qn(a){var s
$label0$0:{if(B.aM===a){s=B.Az
break $label0$0}if(B.aX===a){s=B.aFd
break $label0$0}if(B.aR===a){s=B.aFf
break $label0$0}if(B.bx===a){s=B.TI
break $label0$0}if(B.bX===a){s=B.TI
break $label0$0}if(B.ad===a){s=B.aFx
break $label0$0}if(B.ae===a){s=B.aFE
break $label0$0}if(B.ca===a){s=A.zr(B.ca)
break $label0$0}if(B.ck===a){s=A.zr(B.ck)
break $label0$0}if(B.ch===a){s=A.zr(B.ch)
break $label0$0}if(B.cn===a){s=A.zr(B.cn)
break $label0$0}if(B.cg===a){s=A.zr(B.cg)
break $label0$0}if(B.cj===a){s=A.zr(B.cj)
break $label0$0}if(B.co===a){s=A.zr(B.co)
break $label0$0}if(B.cl===a){s=A.zr(B.cl)
break $label0$0}s=B.Az
break $label0$0}return s},
aNP(a,b,c){var s,r
if(c===B.bq||c===B.aX||c===B.aR||c===B.bx||c===B.bX||c===B.ad||this.aFy(c))return a
s=B.c.N(b).length
if(s===0)return a
r=Math.max(1,Math.min(4,B.d.f4(s/18)))
return new A.K(Math.max(a.a,Math.min(320,s*8.25+56)),Math.max(a.b,Math.min(200,70+r*17)))},
aFy(a){var s
$label0$0:{s=B.ca===a||B.ck===a||B.ch===a||B.cn===a||B.cg===a||B.cj===a||B.co===a||B.cl===a
break $label0$0}return s},
aKo(a){var s
$label0$0:{s=B.bq===a||B.aM===a||B.ad===a||B.bp===a||B.bM===a||B.bz===a||B.c9===a||B.ae===a||B.dk===a||B.eN===a||B.f8===a||B.cK===a||B.dn===a||B.d7===a||B.aX===a||B.aR===a||B.bX===a||B.bx===a||B.ca===a||B.ck===a||B.ch===a||B.cn===a||B.cg===a||B.cj===a||B.co===a||B.cl===a||B.ju===a||B.jv===a||B.jw===a||B.js===a||B.jy===a
break $label0$0}return s},
PY(a,b){var s=Math.max(50,29900-b.a),r=Math.max(50,29900-b.b)
return new A.i(B.d.t(a.a,50,s),B.d.t(a.b,50,r))},
a70(a){var s,r,q,p
for(s=J.ar(this.f.a);s.p();){r=s.gH(s)
q=r.c
p=q.a
q=q.b
r=r.d
if(a.fp(new A.M(p-16,q-16,p+r.a+16,q+r.b+16)))return!0}return!1},
amD(a,b){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e=this
if(!(a.gbD()===B.cf||a===B.ae))return b
s=e.Qn(a)
r=e.PY(b,s)
q=r.a
p=r.b
o=s.a
n=s.b
if(!e.a70(new A.M(q,p,q+o,p+n)))return r
m=A.ak(t.N)
for(l=1;l<=12;++l){k=l*48
for(j=0;j<16;++j){i=B.aru[j]
h=e.PY(new A.i(q+i.a*k,p+i.b*k),s)
g=h.a
f=h.b
if(!m.B(0,""+B.d.P(g)+"_"+B.d.P(f)))continue
if(!e.a70(new A.M(g,f,g+o,f+n)))return h}}return r},
TX(a,b,c,d,e){var s,r,q,p=this,o=null,n=p.awY(a),m=n==null?a.c:n,l=p.aNP(e==null?p.Qn(a):e,m,a),k=B.fq.lA(),j=A.S6(A.tx(a),o,n,c,d,k,!1,o,o,!1,o,B.nf,o,b,B.ng,l,a)
k=p.f.a
s=A.r(k,t.D)
s.push(j)
r=p.tT(k,p.l9(s))
k=A.os(a)
s=p.f
q=k?p.Sr(r,s.b,j.a):new A.yB(r,s.b)
k=j.a
s=t.N
p.sbn(0,p.f.aVr(q.a,q.b,k,A.cp([k],s)))
p.es()
p.lR("component_added",A.u(["component_type",a.b,"component_count",J.b1(p.f.a)],s,t.X))
return k},
abT(a,b){return this.TX(a,b,!1,!1,null)},
aRe(a,b,c){return this.TX(a,b,!1,!1,c)},
Yj(a){var s,r,q,p,o,n,m,l,k,j,i,h,g=this,f=g.f.ax.h(0,a)
if(f==null||f.ay)return
s=t.N
r=g.a3I(A.cp([a],s))
q=g.f.d.cA(0,new A.asa(r)).cK(0)
if(q.k(0,g.f.c))p=g.f.c
else p=q.a!==0?q.gS(0):null
o=g.f.a
n=J.i5(o,new A.asb(r))
n=A.r(n,n.$ti.i("k.E"))
m=g.tT(o,g.l9(n))
o=g.f.b
n=A.v(o).i("J<1>")
o=A.r(new A.J(o,new A.asc(r),n),n.i("k.E"))
o.$flags=1
l=o
o=A.ak(s)
for(n=l.length,k=t.s,j=0;j<l.length;l.length===n||(0,A.o)(l),++j){i=l[j]
o.q(0,A.a([i.b,i.c],k))}o.Yh(r)
n=g.f
o=g.BD(m,o,u.X)
k=g.f.b
h=A.v(k).i("J<1>")
k=A.r(new A.J(k,new A.asd(r),h),h.i("k.E"))
g.sbn(0,n.adB(q.a===0,o,k,p,q))
g.es()
g.lR("component_removed",A.u(["component_type",f.b.b,"component_count",J.b1(g.f.a)],s,t.X))},
b3N(a){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e=this
if(a.ga3(a))return
s=a.cA(0,new A.ase(e)).cK(0)
if(s.a===0)return
r=e.a3I(s)
q=J.i5(e.f.a,new A.asf(r))
p=q.$ti.i("bd<1,c>")
o=A.r(new A.bd(q,new A.asg(),p),p.i("k.E"))
n=e.f.d.cA(0,new A.ash(r)).cK(0)
if(n.k(0,e.f.c))m=e.f.c
else m=n.a!==0?n.gS(0):null
q=e.f.a
p=J.i5(q,new A.asi(r))
p=A.r(p,p.$ti.i("k.E"))
l=e.tT(q,e.l9(p))
q=e.f.b
p=A.v(q).i("J<1>")
q=A.r(new A.J(q,new A.asj(r),p),p.i("k.E"))
q.$flags=1
k=q
q=t.N
p=A.ak(q)
for(j=k.length,i=t.s,h=0;h<k.length;k.length===j||(0,A.o)(k),++h){g=k[h]
p.q(0,A.a([g.b,g.c],i))}p.Yh(r)
j=e.f
p=e.BD(l,p,u.X)
i=e.f.b
f=A.v(i).i("J<1>")
i=A.r(new A.J(i,new A.ask(r),f),f.i("k.E"))
e.sbn(0,j.adB(n.a===0,p,i,m,n))
e.es()
e.lR("components_removed",A.u(["removed_count",a.gv(a),"removed_types",B.b.aB(o,","),"component_count",J.b1(e.f.a)],q,t.X))},
agZ(a,b,c){var s,r,q,p=this,o=p.f.ax.h(0,a)
if(o==null)return
if(o.ay)return
s=o.b
if(s===B.ad||s===B.ae||o.e.k1){r=b.a6(0,o.c)
p.Xx(A.cp([a],t.N),r,!1)
return}q=J.cq(p.f.a,new A.as5(a,b),t.D).bL(0)
p.sbn(0,p.f.rh(q))},
akk(a){var s,r,q,p,o,n,m,l,k,j=this.f.ax.h(0,a)
if(j!=null){s=j.b
r=!(s===B.ad||s===B.ae||j.e.k1)
s=r}else s=!0
if(s)return A.ak(t.N)
s=t.N
q=A.j(s,t.yp)
for(r=J.ar(this.f.a);r.p();){p=r.gH(r)
o=p.Q
if(o==null)continue
J.cj(q.b_(0,o,new A.as4()),p.a)}n=A.ak(s)
m=A.a([a],t.s)
while(m.length!==0){l=q.h(0,m.pop())
if(l==null)continue
for(s=J.ar(l);s.p();){r=s.gH(s)
if(!n.B(0,r))continue
k=this.f.ax.h(0,r)
if(k!=null){p=k.b
p=p===B.ad||p===B.ae||k.e.k1}else p=!1
if(p)m.push(r)}}return n},
Xx(a,b,c){var s
if(a.ga3(a))return
s=J.cq(this.f.a,new A.as6(a,b),t.D).bL(0)
this.sbn(0,this.f.rh(s))},
a_g(a,b){var s,r=this
if(J.em(r.f.a))return
if(Math.abs(a.a)<0.01&&Math.abs(a.b)<0.01)return
s=r.f
r.sbn(0,s.rh(J.cq(s.a,new A.asr(a),t.D).bL(0)))
if(b)r.es()},
alO(a){return this.a_g(a,!0)},
XZ(){var s,r,q=this,p=q.f.a,o=q.tT(p,q.l9(p))
p=A.j(t.N,t.A)
for(s=J.ar(q.f.a);s.p();){r=s.gH(s)
p.j(0,r.a,r.Q)}if(B.b.aE(o,new A.as9(p)))q.sbn(0,q.f.rh(o))
q.es()},
mv(a){var s=this
if(a==null){s.sbn(0,s.f.adm(!0,B.cr))
return}s.sbn(0,s.f.aV4(a,A.cp([a],t.N)))},
Os(a,b){var s,r,q=this,p=a.cA(0,new A.asq(q)).cK(0)
if(p.a===0){q.sbn(0,q.f.adm(!0,B.cr))
return}s=p.k(0,b)
r=s?b:p.gS(0)
q.sbn(0,q.f.aVg(!1,r,p))},
aGh(a){var s,r,q=A.ak(t.N)
for(s=J.ar(this.f.a);s.p();){r=s.gH(s)
if(r.as===a)q.B(0,r.a)}return q},
a3I(a){var s,r,q,p=a.cK(0)
for(s=A.dc(a,a.r,A.l(a).c),r=s.$ti.c;s.p();){q=s.d
p.q(0,this.aGh(q==null?r.a(q):q))}return p},
RY(a,b){var s,r,q,p,o,n,m,l,k,j,i,h,g,f
if(!A.os(a)&&a!==B.bV&&a!==B.bk)return b
s=b.x||b.y>1
r=s?Math.max(1,b.y):1
q=b.j5(a)
if(q==null)q=A.mu(a,b.rx,b.f,b.at,r,b.Q)
if(b.Q)p=q.a===B.ej?B.fD:B.iA
else if(b.at>1)p=B.fD
else{o=r>1?B.pt:B.kO
p=o}if(a===B.bV)o=B.pr
else o=a===B.bk?B.no:B.t8
n=b.rx
if(n==null)n=""
m=n.toLowerCase()
$label0$0:{if("eventual"===m){n=B.np
break $label0$0}if("bounded"===m){n=B.nq
break $label0$0}if("session"===m){n=B.nq
break $label0$0}n=q.c
break $label0$0}l=r>1
if(l){k=b.z
if(k==null)k=""
k=B.c.k(k.toLowerCase(),"multi")?B.ns:B.lO}else k=B.lN
j=l?B.nm:B.po
i=q.aVF(j,A.os(a),o,n,p,k)
h=l?Math.max(1,B.d.f4(r/2)):1
o=b.fx
if(o==null)o=i.c===B.np?1:h
n=Math.max(1,r)
g=B.d.aW(B.e.t(o,1,n))
o=b.fy
f=B.d.aW(B.e.t(o==null?h:o,1,n))
o=Math.max(1,b.at)
n=A.os(a)
return b.aVG(A.os(a)?B.as4:b.k2,i,n,o,g,f,s,r)},
awG(a){var s,r,q,p,o=null,n=a.x2,m=a.y,l=Math.max(0,m-1),k=Math.max(1,a.at)
if(a.ok!==B.jq){s=n==null
if((s?o:n.x)!==B.iA){r=(s?o:n.x)===B.fD
s=r}else s=!0
if(s)return B.aFr
if(m>1)return B.aFm
return B.aFi}m=n==null
if((m?o:n.x)!==B.iA){s=(m?o:n.x)===B.fD
m=s}else m=!0
if(m){q=Math.min(2,k)
p=B.e.iE(k+q-1,q)
return new A.K(Math.max(340,q*260+(q+1)*18),Math.max(220,p*Math.max(156,120+l*30)+(p+1)*18))}return new A.K(Math.max(280,140+l*92),Math.max(176,160+l*12))},
Sr(d5,d6,d7){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,b0,b1,b2,b3,b4,b5,b6,b7,b8,b9,c0,c1,c2,c3,c4,c5,c6,c7,c8,c9,d0=this,d1="read replica",d2="partition",d3="shard",d4=B.b.vl(d5,new A.arW(d7))
if(d4===-1)return new A.yB(d5,d6)
s=d5[d4]
r=s.aTF(d0.RY(s.b,s.e))
q="managed-db:"+d7+":"
p=A.ak(t.N)
for(o=d5.length,n=0;n<d5.length;d5.length===o||(0,A.o)(d5),++n){m=d5[n]
if(m.as===d7)p.B(0,m.a)}o=t.Jc
l=A.a([],o)
for(k=d5.length,n=0;n<d5.length;d5.length===k||(0,A.o)(d5),++n){m=d5[n]
if(m.a===d7)l.push(r)
else if(m.as!==d7)l.push(m)}k=A.a([],t.tv)
for(j=d6.length,n=0;n<d6.length;d6.length===j||(0,A.o)(d6),++n){i=d6[n]
if(!B.c.aT(i.a,q)&&!p.k(0,i.b)&&!p.k(0,i.c))k.push(i)}p=r.e
j=r.b
if(!p.Ej(j))return new A.yB(d0.l9(l),k)
h=p.j5(j)
if(h==null)h=A.mu(j,null,null,1,1,!1)
g=p.ok===B.jq
j=r.c
f=j.a
j=j.b
e=r.d
d=f+e.a
e=j+e.b
c=Math.max(1,p.at)
b=Math.max(0,p.y-1)
a=h.x
a0=a===B.iA||a===B.fD
p=p.a
a1=a0?Math.max(1,B.d.P(p/c)):Math.max(1,p)
a2=new A.arX(new A.M(f,j,d,e))
a3=new A.arV(d0,g,a2,r,a1,d7)
a4=new A.arU(d0,k,d7)
if(a===B.kO||a===B.pt){p="db:"+d7
a5=p+":primary"
l.push(a3.$6$id$name$ordinal$parentContainerId$position$role(a5,"Primary",0,d7,new A.i(f+16,j+(e-j-62)/2),B.pr))
k.push(new A.bR(q+("route:"+a5),d7,a5,B.hf,B.cz,B.kJ,0,"primary",!0,B.jA))
a6=A.a([],o)
for(p+=":replica:",f=f+(d-f)-100-16,j+=16,a7=0;a7<b;a7=a8){a8=a7+1
o=""+a8
a9=p+o
b0=a3.$6$id$name$ordinal$parentContainerId$position$role(a9,"Replica "+o,a8,d7,new A.i(f,j+a7*72),B.no)
a6.push(b0)
l.push(b0)
k.push(new A.bR(q+("route:"+a9),d7,a9,B.hf,B.cz,B.kJ,0,d1,!0,B.jA))}a4.$2(a5,a6)
return new A.yB(d0.l9(l),k)}b1=a===B.fD?B.fB:B.h9
p=b1===B.fB
b2=p?"Partition":"Shard"
b3=Math.min(2,c)
b4=B.e.iE(c+b3-1,b3)
b5=(d-f-16*(b3+1))/b3
b6=(e-j-16*(b4+1))/b4
for(e="db:"+d7+":",d=(b6-62)/2,a=b2+" ",f+=16,a0=b5+16,j+=16,b7=b6+16,a7=0;a7<c;a7=a8){b8=B.e.iE(a7,b3)
b9=B.e.bl(a7,b3)
c0=p?d2:d3
a8=a7+1
c1=""+a8
c2=e+c0+":"+c1
c3=g?new A.i(f+b9*a0,j+b8*b7):a2.$1(a7)
c0=A.tx(b1)
c0=c0.aVe(a1,0,h.V4(!1,p?B.x0:B.x1))
c4=p?B.x0:B.x1
l.push(new A.bw(c2,b1,c3,new A.K(b5,b6),c0,B.nf,!1,a+c1,null,!1,!1,d7,d7,c4,a7,!0,B.ng))
k.push(new A.bR(q+("route:"+c2),d7,c2,B.hf,B.cz,B.kJ,0,b2.toLowerCase(),!0,B.jA))
c5=e+(p?d2:d3)+":"+c1+":primary"
c0=c3.a
c4=c3.b
l.push(a3.$6$id$name$ordinal$parentContainerId$position$role(c5,"Primary",a7,c2,new A.i(c0+12,c4+d),B.pr))
k.push(new A.bR(q+("route:"+c5),c2,c5,B.hf,B.cz,B.kJ,0,"primary",!0,B.jA))
a6=A.a([],o)
for(c0=c0+b5-100-12,c4+=12,c6=0;c6<b;c6=c8){c7=p?d2:d3
c8=c6+1
c9=""+c8
a9=e+c7+":"+c1+":replica:"+c9
b0=a3.$6$id$name$ordinal$parentContainerId$position$role(a9,"Replica "+c9,a7+c6+1,c2,new A.i(c0,c4+c6*70),B.no)
a6.push(b0)
l.push(b0)
k.push(new A.bR(q+("route:"+a9),c2,a9,B.hf,B.cz,B.kJ,0,d1,!0,B.jA))}a4.$2(c5,a6)}return new A.yB(d0.l9(l),k)},
zC(a,b){var s,r,q,p,o,n=this,m={},l=n.f.ax.h(0,a)
if(l==null||l.ay)return
s=l.b
r=n.RY(s,b)
q=l.e
m.a=n.Qn(B.av)
if(r.Ej(s))m.a=n.awG(r)
else if(r.ok===B.jq)m.a=B.aFv
else if(r.Q){s=r.at
if(s<1)p=1
else p=s>4?4:s
m.a=new A.K(Math.max(216,148+p*26),128)}else if(r.x&&r.y>1)m.a=B.aFj
else if(r.b>1)m.a=B.aFk
o=n.Sr(J.cq(n.f.a,new A.ass(m,n,a,r,q.go!=r.go,q.id!=r.id),t.D).bL(0),n.f.b,a)
n.sbn(0,n.f.Kt(o.a,o.b))
n.es()},
Ym(a,b){var s,r,q,p=this,o=p.f.ax.h(0,a)
if(o==null||o.ay)return
s=B.c.N(b)
r=o.w
if(r==null)r=""
q=p.f
p.sbn(0,q.rh(J.cq(q.a,new A.asn(p,a,b,r!==b,s),t.D).bL(0)))
p.es()},
zq(a,b){var s,r,q=this,p=q.f.ax.h(0,a)
if(p==null||p.ay)return
s=J.cq(q.f.a,new A.aso(a,b),t.D).bL(0)
r=q.f
q.sbn(0,r.rh(q.tT(r.a,q.l9(s))))
q.es()},
abv(a,b,c){var s=b.b,r=c.b,q=s.aj5(r)
if(q!=null)return q
if(a===B.cz)return null
if(!s.gGl()||!r.gGl())return s.c+" and "+r.c+" support one-way traffic only."
if(r.aj5(s)!=null)return"Reverse flow from "+r.c+" to "+s.c+" is not valid."
return null},
Kh(a,b,c,d){var s,r,q,p,o,n,m,l,k,j=this,i=null
if(c===a){j.sbn(0,j.f.m_(!0))
return i}s=j.f.ax.h(0,c)
r=j.f.ax.h(0,a)
q=s==null
p=q?i:s.ay
if(p!==!0){p=r==null?i:r.ay
p=p===!0}else p=!0
if(p){j.sbn(0,j.f.m_(!0))
return"Managed DB topology nodes cannot be rewired directly. Edit the parent DB settings instead."}if(!q&&r!=null){o=j.abv(b,s,r)
if(o!=null){j.sbn(0,j.f.m_(!0))
j.lR("connection_rejected",A.u(["source_type",s.b.b,"target_type",r.b.b,"reason",o],t.N,t.X))
return o}}p=B.fq.lA()
n=j.f
m=t.N
l=j.BD(n.a,A.cp([c,a],m),u.X)
k=A.r(j.f.b,t.dS)
k.push(new A.bR(p,c,a,B.hf,b,d,0,i,!0,B.jA))
j.sbn(0,n.aVf(!0,l,k))
j.es()
q=q?i:s.b.b
p=r==null?i:r.b.b
j.lR("connection_created",A.u(["source_type",q,"target_type",p,"protocol",d.b,"direction",b.b,"connection_count",j.f.b.length],m,t.X))
return i},
aTi(a,b,c){return this.Kh(a,b,c,B.kK)},
aej(b3){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,b0=this,b1=null,b2=b0.f.ax.h(0,b3)
if(b2==null||b2.ay)return b1
s=B.fq.lA()
r=b2.c
q=r.a4(0,B.azL)
p=b2.d
o=b2.Q
n=o==null?b1:b0.f.ax.h(0,o)
if(n==null)m=b1
else{o=n.c
l=o.a+12
o=o.b+12
k=n.d
m=new A.M(l,o,l+Math.max(0,k.a-24),o+Math.max(0,k.b-24))}j=new A.as2(b0,p,m,b2)
i=new A.as3(b0,p,m,b2)
o=p.a
l=p.b
h=Math.max(o,l)+24
k=t.N
g=A.ak(k)
f=r.a
e=r.b
d=!1
c=1
for(;;){if(!(c<=8&&!d))break
b=c*h
for(a=0;a<8;++a){a0=B.apZ[a]
a1=j.$1(new A.i(f+a0.a*b,e+a0.b*b))
if(!g.B(0,""+B.d.P(a1.a)+"_"+B.d.P(a1.b)))continue
if(!i.$1(a1))continue
q=a1
d=!0
break}++c}if(!d&&m!=null){a2=m.b
a3=m.a
o=m.c-o
l=m.d-l
for(;;){if(!(a2<=l&&!d))break
for(a4=a3;a4<=o;a4+=28){a1=new A.i(a4,a2)
if(!i.$1(a1))continue
q=a1
d=!0
break}a2+=28}}if(!d)q=j.$1(r.a4(0,B.azQ))
r=b2.w
a5=b2.aVj(r!=null?r+" (Replica)":b1,s,q)
a6=A.a([],t.tv)
r=b0.f.b
for(o=B.b.gT(r),r=new A.cV(o,new A.as0(b3),A.v(r).i("cV<1>"));r.p();)a6.push(o.gH(0).aUS(B.fq.lA(),s))
r=b0.f.b
for(o=B.b.gT(r),r=new A.cV(o,new A.as1(b0,b3),A.v(r).i("cV<1>"));r.p();)a6.push(o.gH(0).aUR(B.fq.lA(),s))
r=b0.f.a
o=A.r(r,t.D)
o.push(a5)
a7=b0.tT(r,b0.l9(o))
r=b2.e.Ej(b2.b)
o=t.dS
l=b0.f
if(r){r=A.r(l.b,o)
B.b.q(r,a6)
a8=b0.Sr(a7,r,s)}else{r=A.r(l.b,o)
B.b.q(r,a6)
a8=new A.yB(a7,r)}r=A.cp([b3],k)
for(o=a6.length,l=t.s,a=0;a<a6.length;a6.length===o||(0,A.o)(a6),++a){a9=a6[a]
r.q(0,A.a([a9.b,a9.c],l))}r.L(0,s)
b0.sbn(0,b0.f.Kt(b0.BD(a8.a,r,u.X),a8.b))
b0.es()
return s},
aTx(a){var s,r,q,p,o,n,m,l,k=this,j=(a==null?k.f.d:a).cK(0)
if(j.ga3(j))return!1
s=j.cA(0,new A.arY(k)).cK(0)
if(s.a===0)return!1
r=J.i5(k.f.a,new A.arZ(s))
r=A.r(r,r.$ti.i("k.E"))
r.$flags=1
q=r
if(q.length===0)return!1
r=k.f.b
p=A.v(r).i("J<1>")
r=A.r(new A.J(r,new A.as_(s),p),p.i("k.E"))
r.$flags=1
o=r
for(r=q.length,n=1/0,m=1/0,l=0;l<r;++l){p=q[l].c
n=Math.min(n,p.a)
m=Math.min(m,p.b)}k.Q=new A.b_F(q,o,new A.i(n,m))
k.as=0
k.lR("canvas_components_copied",A.u(["component_count",q.length,"connection_count",o.length],t.N,t.X))
return!0},
b2z(a4){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2=this,a3=a2.Q
if(a3==null||a3.a.length===0)return B.t
s=++a2.as
if(a4!=null)r=a4.a6(0,a3.c)
else{s=32*s
r=new A.i(s,s)}s=t.N
q=A.j(s,s)
for(p=a3.a,o=p.length,n=0;n<p.length;p.length===o||(0,A.o)(p),++n)q.j(0,p[n].a,B.fq.lA())
m=A.a([],t.Jc)
for(o=p.length,l=r.a,k=r.b,n=0;n<p.length;p.length===o||(0,A.o)(p),++n){j=p[n]
i=q.h(0,j.a)
i.toString
h=j.Q
if(h!=null&&q.ae(0,h))h=q.h(0,h)
g=j.c
f=j.d
e=Math.max(50,29900-f.a)
d=Math.max(50,29900-f.b)
m.push(new A.bw(i,j.b,new A.i(B.d.t(g.a+l,50,e),B.d.t(g.b+k,50,d)),f,j.e,j.f,!1,j.w,j.x,j.y,j.z,h,null,null,null,!1,j.ch))}c=A.a([],t.tv)
for(p=a3.b,o=p.length,n=0;n<p.length;p.length===o||(0,A.o)(p),++n){j=p[n]
b=q.h(0,j.b)
a=q.h(0,j.c)
if(b==null||a==null)continue
c.push(j.aVD(B.fq.lA(),!0,b,a,0))}q=a2.f.a
p=A.r(q,t.D)
B.b.q(p,m)
a0=a2.tT(q,a2.l9(p))
q=t.QN
a1=new A.q(m,new A.as7(),q).cK(0)
p=a2.f
o=A.r(p.b,t.dS)
B.b.q(o,c)
a2.sbn(0,p.aVB(!0,a0,o,B.b.gS(m).a,a1))
a2.es()
a2.lR("canvas_components_pasted",A.u(["component_count",m.length,"connection_count",c.length],s,t.X))
s=A.r(new A.q(m,new A.as8(),q),q.i("a2.E"))
s.$flags=1
return s},
aca(a0,a1){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c=this,b="Leader-Follower",a=c.f.ax.h(0,a1)
if(a==null)return
s=a.e
r=s.b
q=0
switch(a0.a){case 0:p=Math.max(r,2)
o=Math.max(s.d,2)
s=s.V6(!0,p,Math.max(s.e,p+4),o)
q=Math.max(0,p-r)
break
case 1:s=s.aTE(!0)
break
case 2:p=r+1
o=s.c||p>s.e
n=s.e
m=Math.min(Math.max(s.d,1),Math.max(n,p))
s=s.V6(o,p,Math.max(n,p+2),m)
q=Math.max(1,p-r)
break
case 3:l=s.y
if(l<2)l=2
k=l>=3?2:1
o=s.p3
if(o===B.G)o=B.l8
n=s.z
if(n==null)n=b
m=s.fx
if(m==null)m=k
j=s.fy
s=s.V8(m,j==null?k:j,!0,l,n,o)
break
case 4:if(!c.a9T(a.b)){p=r+1
o=s.c||p>s.e
n=s.e
m=Math.min(Math.max(s.d,1),Math.max(n,p))
s=s.V6(o,p,Math.max(n,p+2),m)
q=Math.max(1,p-r)
break}o=s.y
l=o<2?2:B.e.aW(B.e.t(o+1,2,9))
k=l>=3?2:1
o=s.fx
i=B.e.aW(o==null?k:B.e.t(o,1,l))
o=s.fy
h=B.e.aW(o==null?k:B.e.t(o,1,l))
o=s.p3
if(o===B.G)o=B.l8
n=s.z
s=s.V8(i,h,!0,l,n==null?b:n,o)
break
case 5:if(!c.a9T(a.b)){s=s.aUG(!0,!0)
break}l=B.d.aW(Math.max(3,s.y))
g=B.e.bc(l,2)+1
s=s.V8(g,g,!0,l,b,B.og)
break
case 6:o=s.at
f=o<2?2:B.e.aW(B.e.t(o+1,2,64))
o=s.as
s=s.aVs(!0,f,!0,o==null?"Consistent Hashing":o)
break
case 7:s=s.aV3(Math.max(500,B.d.P(s.a*r*0.8)),!0)
break
case 8:p=r+1
o=Math.max(s.d,2)
n=Math.max(s.e,p+3)
s=s.aVy(!0,B.d.P(s.a*1.2),p,n,o)
q=Math.max(1,p-r)
break
case 9:p=r+1
o=Math.max(s.d,2)
s=s.aVz(!0,!0,p,Math.max(s.e,p+3),o)
q=Math.max(1,p-r)
break}c.zC(a1,s)
e=B.e.t(q,0,3)
for(d=0;d<e;++d)if(c.aej(a1)==null)break
c.w.K(0,$.fh().gal(),t.Rb).aSV(a1)},
ai8(a){var s,r,q,p,o,n=this,m=n.f.b,l=A.v(m).i("J<1>"),k=A.r(new A.J(m,new A.asl(a),l),l.i("k.E"))
m=t.N
l=A.ak(m)
for(s=k.length,r=t.s,q=0;q<k.length;k.length===s||(0,A.o)(k),++q){p=k[q]
l.q(0,A.a([p.b,p.c],r))}s=n.f
l=n.BD(s.a,l,u.X)
r=n.f.b
o=A.v(r).i("J<1>")
r=A.r(new A.J(r,new A.asm(a),o),o.i("k.E"))
n.sbn(0,s.Kt(l,r))
n.es()
l=k.length!==0?B.b.gS(k).f.b:null
n.lR("connection_removed",A.u(["protocol",l,"connection_count",n.f.b.length],m,t.X))},
aiX(a,b){var s,r,q,p,o,n=this,m=n.f,l=m.b,k=l.length,j=0
for(;;){if(!(j<k)){s=null
break}r=l[j]
if(r.a===a){s=r
break}++j}if(s==null)return"Connection not found."
l=s.b
q=m.ax.h(0,l)
l=n.f
m=s.c
p=l.ax.h(0,m)
if(q!=null&&p!=null){o=n.abv(b,q,p)
if(o!=null)return o}m=n.f
l=m.b
k=A.v(l).i("q<1,bR>")
l=A.r(new A.q(l,new A.ast(n,a,b),k),k.i("a2.E"))
n.sbn(0,m.Kn(l))
n.es()
return null},
b4W(a,b){var s=this,r=s.f,q=r.b,p=A.v(q).i("q<1,bR>")
q=A.r(new A.q(q,new A.asv(s,a,b),p),p.i("a2.E"))
s.sbn(0,r.Kn(q))
s.es()},
b4V(a,b){var s=this,r=B.c.N(b==null?"":b),q=s.f,p=q.b,o=A.v(p).i("q<1,bR>")
p=A.r(new A.q(p,new A.asu(s,a,r),o),o.i("a2.E"))
s.sbn(0,q.Kn(p))
s.es()},
b50(a){var s=this.f
this.sbn(0,s.rh(J.cq(s.a,new A.asy(a),t.D).bL(0)))},
b4X(a){var s,r,q,p,o,n,m,l,k=this,j={},i=k.w.K(0,$.fh(),t.rD).z,h=A.j(t.N,t.i)
for(s=k.f.b,r=s.length,q=0;q<r;++q){p=s[q].a
o=a.h(0,p)
n=o!=null&&isFinite(o)&&o>0?o:0
m=i.h(0,p)
h.j(0,p,k.aO6(n,m==null?0:m))}s=h.$ti.i("aN<2>")
r=s.i("J<k.E>")
s=A.r(new A.J(new A.aN(h,s),new A.asw(),r),r.i("k.E"))
s.$flags=1
l=Math.max(400,k.aJK(s,0.9))
j.a=!1
s=k.f.b
r=A.v(s).i("q<1,bR>")
s=A.r(new A.q(s,new A.asx(j,k,h,l),r),r.i("a2.E"))
s.$flags=1
if(!j.a)return
k.sbn(0,k.f.Kn(s))},
OB(a){this.sbn(0,this.f.aUt(B.d.t(a,0,5)))
this.es()},
NQ(a,b){this.sbn(0,this.f.aV0(a,b))
this.es()},
rK(a){var s=this
s.sbn(0,a.rh(s.l9(a.a)))
s.es()
s.lR("canvas_state_loaded",A.u(["component_count",J.b1(s.f.a),"connection_count",s.f.b.length],t.N,t.X))},
UD(){var s=this,r=null
s.z=s.y=null
s.sbn(0,A.Ec(r,r,r,r,r,r,!1,B.lt,B.l,1,r,B.cr,!0,r,1))
s.es()
s.aPo("canvas_cleared")},
CI(a){return this.aS4(a)},
aS4(a){var s=0,r=A.A(t.H),q=this,p,o,n,m
var $async$CI=A.w(function(b,c){if(b===1)return A.x(c,r)
for(;;)switch(s){case 0:n=q.f
s=2
return A.n(A.ne(A.cda(),new A.E0(n.a,n.b,a),null,t.JL,t.FD),$async$CI)
case 2:m=c
n=q.f
p=q.l9(m.a)
o=m.c
q.sbn(0,n.aVh(p,m.b,o))
q.es()
o=J.b1(q.f.a)
p=q.f
q.lR("auto_layout_applied",A.u(["component_count",o,"connection_count",p.b.length,"scale",p.w],t.N,t.X))
return A.y(null,r)}})
return A.z($async$CI,r)},
Mk(a,b){return this.b0j(a,b)},
b0j(a,b){var s=0,r=A.A(t.y),q,p=this,o
var $async$Mk=A.w(function(c,d){if(c===1)return A.x(d,r)
for(;;)switch(s){case 0:s=3
return A.n(p.xc(a,!0,!1,b),$async$Mk)
case 3:o=d
if(o)p.XZ()
q=o
s=1
break
case 1:return A.y(q,r)}})
return A.z($async$Mk,r)},
xc(a,b,c,d){return this.aG0(a,!0,!1,d)},
aG_(a,b){return this.xc(a,!0,!1,b)},
aG0(a2,a3,a4,a5){var s=0,r=A.A(t.y),q,p=2,o=[],n=this,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1
var $async$xc=A.w(function(a6,a7){if(a6===1){o.push(a7)
s=p}for(;;)switch(s){case 0:p=4
s=7
return A.n($.z7().agG(a2),$async$xc)
case 7:m=a7
s=8
return A.n(A.bB9(m),$async$xc)
case 8:l=a7
k=l.a
e=n.f
j=e.r
i=e.w
h=J.fu(m,'"viewState"')
if(h){j=l.r
i=l.w}e=n.f
d=n.l9(k)
c=l.b
b=j
a=i
n.sbn(0,e.aVC(d,c,a5,b,a))
q=!0
s=1
break
p=2
s=6
break
case 4:p=3
a1=o.pop()
g=A.ac(a1)
f=A.b3(a1)
A.e1().$1("Error loading design from asset ("+a2+"): "+A.m(g)+"\n"+A.m(f))
q=!1
s=1
break
s=6
break
case 3:s=2
break
case 6:case 1:return A.y(q,r)
case 2:return A.x(o.at(-1),r)}})
return A.z($async$xc,r)}}
