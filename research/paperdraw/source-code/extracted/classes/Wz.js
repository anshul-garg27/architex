A.Wz.prototype={
sb4s(a){if(this.aP.m(0,a))return
this.aP=a
this.a9()},
sbO(a){if(this.aJ===a)return
this.aJ=a
this.a9()},
saS6(a){if(J.e(this.bT,a))return
this.bT=a
this.a9()},
saWg(a){if(J.e(this.ca,a))return
this.ca=a
this.a9()},
geh(a){var s=this.cS$,r=s.h(0,B.ez),q=s.h(0,B.fl),p=s.h(0,B.j2)
s=A.a([],t.Ik)
if(r!=null)s.push(r)
if(q!=null)s.push(q)
if(p!=null)s.push(p)
return s},
by(a){var s,r,q,p=this.aP,o=p.e.ge1()
p=p.r.ge1()
s=this.cS$
r=s.h(0,B.ez)
r.toString
r=r.aw(B.c4,a,r.gbQ())
q=s.h(0,B.fl)
q.toString
q=q.aw(B.c4,a,q.gbQ())
s=s.h(0,B.j2)
s.toString
return o+p+r+q+s.aw(B.c4,a,s.gbQ())},
bu(a){var s,r,q,p=this.aP,o=p.e.ge1()
p=p.r.ge1()
s=this.cS$
r=s.h(0,B.ez)
r.toString
r=r.aw(B.bt,a,r.gbE())
q=s.h(0,B.fl)
q.toString
q=q.aw(B.bt,a,q.gbE())
s=s.h(0,B.j2)
s.toString
return o+p+r+q+s.aw(B.bt,a,s.gbE())},
bx(a){var s,r,q=this.aP,p=q.e,o=p.gcm(0)
p=p.gcq(0)
q=q.r
s=q.gcm(0)
q=q.gcq(0)
r=this.cS$.h(0,B.fl)
r.toString
return Math.max(32,o+p+(s+q)+r.aw(B.c5,a,r.gbP()))},
bt(a){return this.aw(B.c5,a,this.gbP())},
ho(a){var s,r=this.cS$,q=r.h(0,B.fl)
q.toString
s=q.lC(a)
r=r.h(0,B.fl)
r.toString
r=r.b
r.toString
return A.vZ(s,t.r.a(r).a.b)},
aFD(a,b){var s,r,q,p=this,o=p.bT
if(o==null)o=A.fQ(a,a)
s=p.cS$.h(0,B.ez)
s.toString
r=b.$2(s,o)
s=p.aP
if(!s.x&&!s.w)return new A.K(0,a)
q=s.w?r.a:a
return new A.K(q*p.aj.gA(0),r.b)},
aFF(a,b){var s,r,q=this.ca
if(q==null)q=A.fQ(a,a)
s=this.cS$.h(0,B.j2)
s.toString
r=b.$2(s,q)
s=this.ai
if(s.gb8(0)===B.aB)return new A.K(0,a)
return new A.K(s.gA(0)*r.a,r.b)},
cZ(a,b){var s,r,q,p,o,n,m=this
if(!m.gG(0).k(0,b))return!1
s=m.aP
r=m.gG(0)
q=m.cS$
p=q.h(0,B.j2)
p.toString
if(A.c8z(r,p.gG(0),s.r,s.e,b,m.aJ)){s=q.h(0,B.j2)
s.toString
o=s}else{s=q.h(0,B.fl)
s.toString
o=s}n=o.gG(0).mR(B.l)
return a.Cz(new A.bgz(o,n),b,A.aJC(n))},
cI(a){return this.PW(a,A.jb()).a},
e_(a,b){var s,r=this.PW(a,A.jb()),q=this.cS$.h(0,B.fl)
q.toString
q=A.vZ(q.fI(r.e,b),(r.c-r.f.b+r.w.b)/2)
s=this.aP
return A.vZ(A.vZ(q,s.e.b),s.r.b)},
PW(a,b){var s,r,q,p,o,n,m,l,k,j,i,h,g,f=this,e=a.b,d=f.cS$,c=d.h(0,B.fl)
c.toString
s=c.aw(B.au,new A.ay(0,e,0,a.d),c.gcr())
c=f.aP
r=c.e
c=c.r
q=s.b
p=Math.max(32-(r.gcm(0)+r.gcq(0))+(c.gcm(0)+c.gcq(0)),q+(c.gcm(0)+c.gcq(0)))
o=f.aFD(p,b)
n=f.aFF(p,b)
c=o.a
r=n.a
m=f.aP
l=m.r
k=Math.max(0,e-(c+r)-l.ge1()-m.e.ge1())
j=new A.ay(0,isFinite(k)?k:s.a,q,p)
e=d.h(0,B.fl)
e.toString
e=b.$2(e,j)
d=e.a+l.ge1()
e=e.b
q=l.gcm(0)
l=l.gcq(0)
m=f.aP
i=m.f
h=new A.i(0,new A.i(i.a,i.b).ao(0,4).b/2)
g=new A.K(c+d+r,p).a4(0,h)
m=m.e
return new A.b0X(a.bk(new A.K(g.a+m.ge1(),g.b+(m.gcm(0)+m.gcq(0)))),g,p,o,j,new A.K(d,e+(q+l)),n,h)},
bU(){var s,r,q,p,o,n,m,l,k,j=this,i=t.k,h=j.PW(i.a(A.P.prototype.gah.call(j)),A.q_()),g=h.b,f=g.a,e=new A.bgA(j,h)
switch(j.aJ.a){case 0:s=j.aP
if(s.x||s.w){s=h.d
r=e.$2(s,f)
q=f-s.a}else{q=f
r=B.l}s=h.f
p=e.$2(s,q)
if(j.ai.gb8(0)!==B.aB){o=h.r
n=j.aP.e
j.X=new A.M(0,0,0+(o.a+n.c),0+(g.b+(n.gcm(0)+n.gcq(0))))
m=e.$2(o,q-s.a)}else{j.X=B.aT
m=B.l}s=j.aP
if(s.z){o=j.X
o===$&&A.b()
o=o.c-o.a
s=s.e
j.a8=new A.M(o,0,o+(f-o+s.ge1()),0+(g.b+(s.gcm(0)+s.gcq(0))))}else j.a8=B.aT
break
case 1:s=j.aP
if(s.x||s.w){s=h.d
o=j.cS$.h(0,B.ez)
o.toString
n=s.a
r=e.$2(s,0-o.gG(0).a+n)
q=0+n}else{r=B.l
q=0}s=h.f
p=e.$2(s,q)
q+=s.a
s=j.aP
if(s.z){s=s.e
o=j.ai.gb8(0)!==B.aB?q+s.a:f+s.ge1()
j.a8=new A.M(0,0,0+o,0+(g.b+(s.gcm(0)+s.gcq(0))))}else j.a8=B.aT
s=j.cS$.h(0,B.j2)
s.toString
o=h.r
n=o.a
q-=s.gG(0).a-n
if(j.ai.gb8(0)!==B.aB){m=e.$2(o,q)
s=j.aP.e
o=q+s.a
j.X=new A.M(o,0,o+(n+s.c),0+(g.b+(s.gcm(0)+s.gcq(0))))}else{j.X=B.aT
m=B.l}break
default:r=B.l
p=B.l
m=B.l}s=j.aP.r
o=s.gcm(0)
s=s.gcq(0)
n=j.cS$
l=n.h(0,B.fl)
l.toString
p=p.a4(0,new A.i(0,(h.f.b-(o+s)-l.gG(0).b)/2))
l=n.h(0,B.ez)
l.toString
l=l.b
l.toString
s=t.r
s.a(l)
o=j.aP.e
l.a=new A.i(o.a,o.b).a4(0,r)
o=n.h(0,B.fl)
o.toString
o=o.b
o.toString
s.a(o)
l=j.aP
k=l.e
l=l.r
o.a=new A.i(k.a,k.b).a4(0,p).a4(0,new A.i(l.a,l.b))
n=n.h(0,B.j2)
n.toString
n=n.b
n.toString
s.a(n)
s=j.aP.e
n.a=new A.i(s.a,s.b).a4(0,m)
n=s.ge1()
l=s.gcm(0)
s=s.gcq(0)
j.fy=i.a(A.P.prototype.gah.call(j)).bk(new A.K(f+n,g.b+(l+s)))},
gQp(){if(this.am.gb8(0)===B.be)return B.r
switch(this.aP.d.a){case 1:var s=B.r
break
case 0:s=B.v
break
default:s=null}s=new A.h6(A.aJ(97,s.E()>>>16&255,s.E()>>>8&255,s.E()&255),s).aq(0,this.am.gA(0))
s.toString
return s},
aIJ(a6,a7,a8){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2=this,a3=null,a4=a2.aP,a5=a4.y
if(a5==null){s=a4.d
r=a4.w
$label0$0:{q=B.c0===s
a4=q
if(a4){a4=r
p=a4
o=p
n=!0
m=!0}else{p=a3
o=p
n=!1
m=!1
a4=!1}if(a4){a4=B.r
break $label0$0}l=a3
if(q){if(m)a4=p
else{a4=r
p=a4
m=!0}l=!1===a4
a4=l
k=!0}else{k=!1
a4=!1}if(a4){a4=A.aJ(222,B.v.E()>>>16&255,B.v.E()>>>8&255,B.v.E()&255)
break $label0$0}j=B.c_===s
a4=j
if(a4)if(n)a4=o
else{if(m)a4=p
else{a4=r
p=a4
m=!0}o=!0===a4
a4=o}else a4=!1
if(a4){a4=B.v
break $label0$0}if(j)if(k)a4=l
else{l=!1===(m?p:r)
a4=l}else a4=!1
if(a4){a4=A.aJ(222,B.r.E()>>>16&255,B.r.E()>>>8&255,B.r.E()&255)
break $label0$0}a4=a3}a5=a4}a4=a2.a2.a
if(a4.gb8(a4)===B.eC)a5=new A.h6(B.C,a5).aq(0,a2.a2.gA(0))
a4=$.am()
i=A.ba()
i.r=a5.gA(a5)
i.b=B.bK
h=a2.cS$.h(0,B.ez)
h.toString
i.c=2*h.gG(0).b/24
h=a2.a2.a
g=h.gb8(h)===B.eC?1:a2.a2.gA(0)
if(g===0)return
f=A.cS(a4.w)
a4=a8*0.15
h=a8*0.45
e=a8*0.4
d=a8*0.7
c=new A.i(e,d)
b=a7.a
a=a7.b
a0=b+a4
a1=a+h
if(g<0.5){a4=A.xa(new A.i(a4,h),c,g*2)
a4.toString
f.aL(new A.fS(a0,a1))
f.aL(new A.cO(b+a4.a,a+a4.b))}else{a4=A.xa(c,new A.i(a8*0.85,a8*0.25),(g-0.5)*2)
a4.toString
f.aL(new A.fS(a0,a1))
f.aL(new A.cO(b+e,a+d))
f.aL(new A.cO(b+a4.a,a+a4.b))}a6.fQ(f,i)},
aIH(a,b){var s,r,q,p,o,n,m,l=this,k=new A.bgw(l)
if(!l.aP.w&&l.aj.gb8(0)===B.aB){l.c7.saU(0,null)
return}s=l.gQp()
r=s.ghm(s)
q=l.cx
q===$&&A.b()
p=l.c7
if(q)p.saU(0,a.zb(b,r,k,p.a))
else{p.saU(0,null)
q=r!==255
if(q){p=a.gbH(0)
o=l.cS$.h(0,B.ez)
o.toString
n=o.b
n.toString
n=t.r.a(n).a
o=o.gG(0)
m=n.a
n=n.b
o=new A.M(m,n,m+o.a,n+o.b).e4(b).d8(20)
$.am()
n=A.ba()
n.r=s.gA(s)
p.hO(o,n)}k.$2(a,b)
if(q)a.gbH(0).a.restore()}},
a72(a,b,c,d){var s,r,q,p,o,n=this,m=n.gQp(),l=m.ghm(m)
if(n.am.gb8(0)!==B.be){m=n.cx
m===$&&A.b()
s=n.a5
if(m){s.saU(0,a.zb(b,l,new A.bgx(c),s.a))
if(d){m=n.W
m.saU(0,a.zb(b,l,new A.bgy(c),m.a))}}else{s.saU(0,null)
n.W.saU(0,null)
m=c.b
m.toString
s=t.r
m=s.a(m).a
r=c.gG(0)
q=m.a
m=m.b
p=new A.M(q,m,q+r.a,m+r.b).e4(b)
r=a.gbH(0)
m=p.d8(20)
$.am()
q=A.ba()
o=n.gQp()
q.r=o.gA(o)
r.hO(m,q)
q=c.b
q.toString
a.e3(c,s.a(q).a.a4(0,b))
a.gbH(0).a.restore()}}else{m=c.b
m.toString
a.e3(c,t.r.a(m).a.a4(0,b))}},
aK(a){var s,r,q=this
q.ar5(a)
s=q.geI()
q.a2.a.ag(0,s)
r=q.gyY()
q.aj.a.ag(0,r)
q.ai.a.ag(0,r)
q.am.a.ag(0,s)},
aC(a){var s,r=this,q=r.geI()
r.a2.a.V(0,q)
s=r.gyY()
r.aj.a.V(0,s)
r.ai.a.V(0,s)
r.am.a.V(0,q)
r.ar6(0)},
n(){var s=this
s.a5.saU(0,null)
s.W.saU(0,null)
s.c7.saU(0,null)
s.fu()},
aX(a,b){var s,r=this
r.aIH(a,b)
if(r.ai.gb8(0)!==B.aB){s=r.cS$.h(0,B.j2)
s.toString
r.a72(a,b,s,!0)}s=r.cS$.h(0,B.fl)
s.toString
r.a72(a,b,s,!1)},
ip(a){var s=this.X
s===$&&A.b()
if(!s.k(0,a)){s=this.a8
s===$&&A.b()
s=s.k(0,a)}else s=!0
return s}}
