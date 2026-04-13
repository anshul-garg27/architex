A.HE.prototype={
HL(a){var s=J.V(a).toLowerCase()
return B.c.k(s,"invalid jwt")||B.c.k(s,"jwt")||B.c.k(s,"401")||B.c.k(s,"unauthorized")||B.c.k(s,"missing authorization")},
wM(a){return this.avl(a)},
avl(a){var s=0,r=A.A(t.H),q,p
var $async$wM=A.w(function(b,c){if(b===1)return A.x(c,r)
for(;;)switch(s){case 0:p=$.ct().b
p===$&&A.b()
q=t.z
s=2
return A.n(p.e0("specialization_drafts").cz(0,A.u(["is_runtime_current",!1],q,q)).ex("component_type",a.b).ex("is_runtime_current",!0),$async$wM)
case 2:return A.y(null,r)}})
return A.z($async$wM,r)},
GS(a){return this.awD(a)},
awD(a){var s=0,r=A.A(t.ZF),q,p,o
var $async$GS=A.w(function(b,c){if(b===1)return A.x(c,r)
for(;;)switch(s){case 0:o=$.ct().b
o===$&&A.b()
s=3
return A.n(o.e0("specialization_drafts").mu(0).ex("component_type",a.b).ex("status","approved").ex("is_runtime_current",!0).agR(),$async$GS)
case 3:p=c
if(p==null){q=null
s=1
break}q=A.Mn(A.bt(p,t.N,t.z))
s=1
break
case 1:return A.y(q,r)}})
return A.z($async$GS,r)},
Eg(a,b,c){return this.b06(a,b,c)},
b05(a){return this.Eg(null,null,a)},
b06(a,b,c){var s=0,r=A.A(t.UJ),q,p=this,o,n,m,l
var $async$Eg=A.w(function(d,e){if(d===1)return A.x(e,r)
for(;;)switch(s){case 0:if(!p.a.gk5())A.a3(A.c1("Admin access required"))
o=$.ct().b
o===$&&A.b()
n=o.e0("specialization_drafts").mu(0)
if(a!=null)n=n.ex("category",a.b)
o=(c!=null?n.ex("status",c.c):n).rQ(0,"updated_at",!1)
l=A
s=3
return A.n(o,$async$Eg)
case 3:o=l.c8(e,!0,t.P)
m=A.v(o).i("q<1,fv>")
o=A.r(new A.q(o,A.bFc(),m),m.i("a2.E"))
o.$flags=1
q=o
s=1
break
case 1:return A.y(q,r)}})
return A.z($async$Eg,r)},
pt(a){return this.aVL(a)},
aVL(a){var s=0,r=A.A(t.Qz),q,p=this,o,n,m,l,k,j
var $async$pt=A.w(function(b,c){if(b===1)return A.x(c,r)
for(;;)switch(s){case 0:k=p.a
if(!k.gk5())A.a3(A.c1("Admin access required"))
o=a.c===B.iW
s=o?3:4
break
case 3:n=a.b.a
s=5
return A.n(p.GS(n),$async$pt)
case 5:m=c
s=m!=null?6:7
break
case 6:o=$.ct().b
o===$&&A.b()
o=o.e0("specialization_drafts")
n=t.z
n=A.cT(a.YF(),n,n)
l=m.f
if(l==null){k=k.gdc()
k=k==null?null:k.a}else k=l
n.j(0,"created_by",k)
n.j(0,"is_runtime_current",!0)
n=o.cz(0,n)
o=m.a
o.toString
j=A
s=8
return A.n(n.ex("id",o).mu(0).oL(0),$async$pt)
case 8:q=j.Mn(c)
s=1
break
case 7:s=9
return A.n(p.wM(n),$async$pt)
case 9:case 4:n=$.ct().b
n===$&&A.b()
n=n.e0("specialization_drafts")
l=A.cT(a.YF(),t.N,t.z)
k=k.gdc()
l.j(0,"created_by",k==null?null:k.a)
l.j(0,"is_runtime_current",o)
j=A
s=10
return A.n(n.iq(0,l).mu(0).oL(0),$async$pt)
case 10:q=j.Mn(c)
s=1
break
case 1:return A.y(q,r)}})
return A.z($async$pt,r)},
Ff(a){return this.b4Y(a)},
b4Y(a){var s=0,r=A.A(t.Qz),q,p=this,o,n,m,l,k,j,i
var $async$Ff=A.w(function(b,c){if(b===1)return A.x(c,r)
for(;;)switch(s){case 0:j=p.a
if(!j.gk5())A.a3(A.c1("Admin access required"))
o=a.a
if(o==null||o.length===0)throw A.d(A.cr("Draft id is required for update.",null))
n=a.YF()
n.L(0,"created_by")
m=a.c===B.iW
s=m?3:4
break
case 3:s=5
return A.n(p.wM(a.b.a),$async$Ff)
case 5:case 4:l=$.ct().b
l===$&&A.b()
l=l.e0("specialization_drafts")
k=t.z
k=A.cT(n,k,k)
k.j(0,"is_runtime_current",m)
if(m){j=j.gdc()
j=j==null?null:j.a}else j=null
k.j(0,"approved_by",j)
i=A
s=6
return A.n(l.cz(0,k).ex("id",o).mu(0).oL(0),$async$Ff)
case 6:q=i.Mn(c)
s=1
break
case 1:return A.y(q,r)}})
return A.z($async$Ff,r)},
w6(a,b){return this.b55(a,b)},
b55(a,b){var s=0,r=A.A(t.Qz),q,p=this,o,n,m,l,k,j,i
var $async$w6=A.w(function(c,d){if(c===1)return A.x(d,r)
for(;;)switch(s){case 0:l=p.a
if(!l.gk5())A.a3(A.c1("Admin access required"))
o=b===B.iW
s=o?3:4
break
case 3:n=$.ct().b
n===$&&A.b()
k=B.b
j=B.es
i=A
s=6
return A.n(n.e0("specialization_drafts").kl(0,"component_type").ex("id",a).oL(0),$async$w6)
case 6:s=5
return A.n(p.wM(k.hG(j,new i.aUF(d))),$async$w6)
case 5:case 4:n=$.ct().b
n===$&&A.b()
n=n.e0("specialization_drafts")
if(o){l=l.gdc()
l=l==null?null:l.a}else l=null
m=t.z
k=A
s=7
return A.n(n.cz(0,A.u(["status",b.c,"is_runtime_current",o,"approved_by",l,"updated_at",new A.az(Date.now(),0,!1).ox().eW()],m,m)).ex("id",a).mu(0).oL(0),$async$w6)
case 7:q=k.Mn(d)
s=1
break
case 1:return A.y(q,r)}})
return A.z($async$w6,r)},
Mg(a){return this.b07(a)},
b07(a){var s=0,r=A.A(t.UJ),q,p=2,o=[],n=this,m,l,k,j,i,h,g
var $async$Mg=A.w(function(b,c){if(b===1){o.push(c)
s=p}for(;;)switch(s){case 0:h=$.ct().b
h===$&&A.b()
if(h.geS().c==null){q=B.nX
s=1
break}m=h.e0("specialization_drafts").mu(0).ex("status","approved").ex("is_runtime_current",!0)
h=a.length
if(h!==0){h=m
j=A.v(a).i("q<1,c>")
j=A.r(new A.q(a,new A.aUA(),j),j.i("a2.E"))
j.$flags=1
m=h.M0("component_type",j)}p=4
h=J.bAS(m,"updated_at",!1)
s=7
return A.n(h,$async$Mg)
case 7:l=c
h=A.c8(l,!0,t.P)
j=A.v(h).i("q<1,fv>")
h=A.r(new A.q(h,A.bFc(),j),j.i("a2.E"))
h.$flags=1
q=h
s=1
break
p=2
s=6
break
case 4:p=3
g=o.pop()
k=A.ac(g)
if(n.HL(k)){q=B.nX
s=1
break}throw g
s=6
break
case 3:s=2
break
case 6:case 1:return A.y(q,r)
case 2:return A.x(o.at(-1),r)}})
return A.z($async$Mg,r)},
Lc(a,b){return this.aXw(a,b)},
aXw(a,b){var s=0,r=A.A(t.UJ),q,p=this,o,n,m,l,k,j
var $async$Lc=A.w(function(c,d){if(c===1)return A.x(d,r)
for(;;)switch(s){case 0:j=A.jk(a,A.v(a).c)
j=A.r(j,A.l(j).c)
j.$flags=1
o=j
if(o.length===0){q=B.nX
s=1
break}j=$.ct().b
j===$&&A.b()
if(j.geS().c==null){q=B.nX
s=1
break}s=3
return A.n(new A.aUv(p,o,b).$0(),$async$Lc)
case 3:n=d
if(n==null){q=B.nX
s=1
break}m=n.a
$label0$0:{if(t.f.b(m)){j=t.j.b(J.aa(m,"drafts"))
l=m}else{l=null
j=!1}if(j){j=A.c8(t.j.a(J.aa(l,"drafts")),!0,t.z)
break $label0$0}if(t.j.b(m)){j=A.c8(m,!0,t.z)
break $label0$0}j=A.a3(A.c1("Invalid specialization ensure response: "+A.m(m)))}k=t.TP
k=A.dd(new A.c9(j,k),new A.aUw(),k.i("k.E"),t.P)
k=A.dd(k,A.bFc(),A.l(k).i("k.E"),t.Qz)
j=A.r(k,A.l(k).i("k.E"))
j.$flags=1
q=j
s=1
break
case 1:return A.y(q,r)}})
return A.z($async$Lc,r)},
Mh(a){return this.b08(a)},
b08(a){var s=0,r=A.A(t.T4),q,p=2,o=[],n=this,m,l,k,j,i,h,g,f,e,d
var $async$Mh=A.w(function(b,c){if(b===1){o.push(c)
s=p}for(;;)switch(s){case 0:if(a.length===0){q=B.mc
s=1
break}i=$.ct()
h=i.b
h===$&&A.b()
if(h.geS().c==null){q=B.mc
s=1
break}h=A.v(a).i("q<1,c>")
g=new A.q(a,new A.aUB(),h).cK(0)
g=A.r(g,A.l(g).c)
g.$flags=1
f=new A.q(a,new A.aUC(),h).cK(0)
f=A.r(f,A.l(f).c)
f.$flags=1
m=i.b.e0("specialization_profile_overlays").mu(0).ex("status","approved").ex("is_runtime_current",!0).M0("component_type",g).M0("profile_signature",f)
p=4
i=J.bAS(m,"updated_at",!1)
s=7
return A.n(i,$async$Mh)
case 7:l=c
k=new A.q(a,new A.aUD(),h).cK(0)
i=A.c8(l,!0,t.P)
i=new A.q(i,A.bR6(),A.v(i).i("q<1,mU>")).nr(0,new A.aUE(k))
i=A.r(i,i.$ti.i("k.E"))
i.$flags=1
q=i
s=1
break
p=2
s=6
break
case 4:p=3
d=o.pop()
j=A.ac(d)
if(n.HL(j)){q=B.mc
s=1
break}throw d
s=6
break
case 3:s=2
break
case 6:case 1:return A.y(q,r)
case 2:return A.x(o.at(-1),r)}})
return A.z($async$Mh,r)},
Ld(a,b){return this.aXx(a,b)},
aXx(a,b){var s=0,r=A.A(t.T4),q,p=this,o,n,m,l,k,j,i,h
var $async$Ld=A.w(function(c,d){if(c===1)return A.x(d,r)
for(;;)switch(s){case 0:h=A.j(t.N,t.RS)
for(o=b.length,n=0;n<b.length;b.length===o||(0,A.o)(b),++n){m=b[n]
h.j(0,m.b.b+"|"+m.d,m)}o=h.$ti.i("aN<2>")
h=A.r(new A.aN(h,o),o.i("k.E"))
h.$flags=1
l=h
if(l.length===0){q=B.mc
s=1
break}h=$.ct().b
h===$&&A.b()
if(h.geS().c==null){q=B.mc
s=1
break}s=3
return A.n(new A.aUy(p,l,a).$0(),$async$Ld)
case 3:k=d
if(k==null){q=B.mc
s=1
break}j=k.a
$label0$0:{if(t.f.b(j)){h=t.j.b(J.aa(j,"overlays"))
i=j}else{i=null
h=!1}if(h){h=A.c8(t.j.a(J.aa(i,"overlays")),!0,t.z)
break $label0$0}h=B.U
break $label0$0}o=t.TP
o=A.dd(new A.c9(h,o),new A.aUz(),o.i("k.E"),t.P)
o=A.dd(o,A.bR6(),A.l(o).i("k.E"),t.L9)
h=A.r(o,A.l(o).i("k.E"))
h.$flags=1
q=h
s=1
break
case 1:return A.y(q,r)}})
return A.z($async$Ld,r)},
aOe(a){var s,r
if(a===B.a6||a===B.bp)return"load_balancer"
if(a===B.ai)return"cache"
s=a.gbD()
$label0$0:{if(B.dj===s){r="compute"
break $label0$0}if(B.dR===s){r="storage"
break $label0$0}if(B.fu===s){r="messaging"
break $label0$0}if(B.h7===s||B.cf===s){r="network"
break $label0$0}if(B.hM===s){r="ai"
break $label0$0}if(B.jo===s){r="security"
break $label0$0}if(B.jp===s){r="data"
break $label0$0}if(B.kB===s){r="fintech"
break $label0$0}if(B.pl===s){r="commerce"
break $label0$0}if(B.nd===s){r="user"
break $label0$0}if(B.pk===s){r="cross_domain"
break $label0$0}if(B.ne===s){r="techniques"
break $label0$0}if(B.h6===s){r="sketchy"
break $label0$0}r=null}return r},
$iaTJ:1}
