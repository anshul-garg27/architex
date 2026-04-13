A.Vn.prototype={
gcR(){var s=this.d
if(s===$){s=this.a.cy
this.d=s}return s},
gGy(){var s,r=$.ax.ak$.x.h(0,this.e).gad()
r.toString
s=t.x.a(r).gG(0)
return this.a.f.E0(new A.M(0,0,0+s.a,0+s.b))},
gJq(){var s=$.ax.ak$.x.h(0,this.f).gad()
s.toString
s=t.x.a(s).gG(0)
return new A.M(0,0,0+s.a,0+s.b)},
xg(a2,a3){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1=this
if(a3.m(0,B.l)){s=new A.bu(new Float64Array(16))
s.bC(a2)
return s}if(a1.Q!=null){a1.a.toString
switch(3){case 3:break}}r=new A.bu(new Float64Array(16))
r.bC(a2)
r.en(a3.a,a3.b,0,1)
q=A.bPt(r,a1.gJq())
if(a1.gGy().gagg(0))return r
s=a1.gGy()
p=a1.ay
o=new A.bu(new Float64Array(16))
o.dh()
n=s.c
m=s.a
l=n-m
k=s.d
s=s.b
j=k-s
o.en(l/2,j/2,0,1)
o.t0(p)
o.en(-l/2,-j/2,0,1)
p=new A.dm(new Float64Array(3))
p.fe(m,s,0)
p=o.oz(p)
l=new A.dm(new Float64Array(3))
l.fe(n,s,0)
l=o.oz(l)
s=new A.dm(new Float64Array(3))
s.fe(n,k,0)
s=o.oz(s)
n=new A.dm(new Float64Array(3))
n.fe(m,k,0)
n=o.oz(n)
m=new Float64Array(3)
new A.dm(m).bC(p)
p=new Float64Array(3)
new A.dm(p).bC(l)
l=new Float64Array(3)
new A.dm(l).bC(s)
s=new Float64Array(3)
new A.dm(s).bC(n)
n=m[0]
k=p[0]
j=l[0]
i=s[0]
h=Math.min(n,Math.min(k,Math.min(j,i)))
m=m[1]
p=p[1]
l=l[1]
s=s[1]
g=Math.min(m,Math.min(p,Math.min(l,s)))
f=Math.max(n,Math.max(k,Math.max(j,i)))
e=Math.max(m,Math.max(p,Math.max(l,s)))
s=new A.dm(new Float64Array(3))
s.fe(h,g,0)
p=new A.dm(new Float64Array(3))
p.fe(f,g,0)
n=new A.dm(new Float64Array(3))
n.fe(f,e,0)
m=new A.dm(new Float64Array(3))
m.fe(h,e,0)
l=new A.dm(new Float64Array(3))
l.bC(s)
s=new A.dm(new Float64Array(3))
s.bC(p)
p=new A.dm(new Float64Array(3))
p.bC(n)
n=new A.dm(new Float64Array(3))
n.bC(m)
d=new A.PS(l,s,p,n)
c=A.bO8(d,q)
if(c.m(0,B.l))return r
s=r.tk().a
p=s[0]
s=s[1]
b=a2.lE()
p-=c.a*b
s-=c.b*b
a=new A.bu(new Float64Array(16))
a.bC(a2)
n=new A.dm(new Float64Array(3))
n.fe(p,s,0)
a.a_f(n)
a0=A.bO8(d,A.bPt(a,a1.gJq()))
if(a0.m(0,B.l))return a
n=a0.a===0
if(!n&&a0.b!==0){s=new A.bu(new Float64Array(16))
s.bC(a2)
return s}p=n?p:0
s=a0.b===0?s:0
n=new A.bu(new Float64Array(16))
n.bC(a2)
m=new A.dm(new Float64Array(3))
m.fe(p,s,0)
n.a_f(m)
return n},
RM(a,b){var s,r,q,p,o,n,m,l=this
if(b===1){s=new A.bu(new Float64Array(16))
s.bC(a)
return s}r=l.gcR().a.lE()
s=l.gJq()
q=l.gGy()
p=l.gJq()
o=l.gGy()
n=Math.max(r*b,Math.max((s.c-s.a)/(q.c-q.a),(p.d-p.b)/(o.d-o.b)))
o=l.a
m=A.T(n,o.ax,o.at)/r
s=new A.bu(new Float64Array(16))
s.bC(a)
s.iB(m,m,m,1)
return s},
aGu(a,b,c){var s,r,q,p
if(b===0){s=new A.bu(new Float64Array(16))
s.bC(a)
return s}r=this.gcR().kV(c)
s=new A.bu(new Float64Array(16))
s.bC(a)
q=r.a
p=r.b
s.en(q,p,0,1)
s.t0(-b)
s.en(-q,-p,0,1)
return s},
Hf(a){var s
$label0$0:{if(B.aVI===a){s=!1
break $label0$0}if(B.vE===a){s=this.a.z
break $label0$0}if(B.rd===a||a==null){s=this.a.y
break $label0$0}s=null}return s},
a4p(a){var s=!this.a.z?1:a.d
if(Math.abs(s-1)>Math.abs(0))return B.vE
else return B.rd},
aI1(a){var s,r,q=this
q.a.CW.$1(a)
s=q.y
s===$&&A.b()
r=s.r
if(r!=null&&r.a!=null){s.e5(0)
s=q.y
s.sA(0,s.a)
s=q.r
if(s!=null)s.a.V(0,q.gHx())
q.r=null}s=q.z
s===$&&A.b()
r=s.r
if(r!=null&&r.a!=null){s.e5(0)
s=q.z
s.sA(0,s.a)
s=q.w
if(s!=null)s.a.V(0,q.gHF())
q.w=null}q.Q=q.ch=null
q.at=q.gcR().a.lE()
q.as=q.gcR().kV(a.b)
q.ax=q.ay},
aI3(a){var s,r,q,p,o,n,m=this,l=m.gcR().a.lE(),k=m.x=a.c,j=m.gcR().kV(k),i=m.ch
if(i===B.rd)i=m.ch=m.a4p(a)
else if(i==null){i=m.a4p(a)
m.ch=i}if(!m.Hf(i)){m.a.toString
return}switch(i.a){case 1:i=m.at
i.toString
m.gcR().sA(0,m.RM(m.gcR().a,i*a.d/l))
s=m.gcR().kV(k)
i=m.gcR()
r=m.gcR().a
q=m.as
q.toString
i.sA(0,m.xg(r,s.a6(0,q)))
p=m.gcR().kV(k)
k=m.as
k.toString
if(!A.bEt(k).m(0,A.bEt(p)))m.as=p
break
case 2:i=a.r
if(i===0){m.a.toString
return}r=m.ax
r.toString
o=r+i
m.gcR().sA(0,m.aGu(m.gcR().a,m.ay-o,k))
m.ay=o
break
case 0:if(a.d!==1){m.a.toString
return}if(m.Q==null){i=m.as
i.toString
m.Q=A.c8r(i,j)}i=m.as
i.toString
n=j.a6(0,i)
m.gcR().sA(0,m.xg(m.gcR().a,n))
m.as=m.gcR().kV(k)
break}m.a.toString},
aI_(a){var s,r,q,p,o,n,m,l,k,j,i,h=this
h.a.ch.$1(a)
h.as=h.ax=h.at=null
s=h.r
if(s!=null)s.a.V(0,h.gHx())
s=h.w
if(s!=null)s.a.V(0,h.gHF())
s=h.y
s===$&&A.b()
s.sA(0,s.a)
s=h.z
s===$&&A.b()
s.sA(0,s.a)
s=h.ch
if(!h.Hf(s)){h.Q=null
return}$label0$0:{if(B.rd===s){s=a.a.a
if(s.gd1()<50){h.Q=null
return}r=h.gcR().a.tk().a
q=r[0]
r=r[1]
h.a.toString
p=A.aCE(0.0000135,q,s.a,0)
h.a.toString
o=A.aCE(0.0000135,r,s.b,0)
s=s.gd1()
h.a.toString
n=A.bOg(s,0.0000135,10)
s=p.gyC()
m=o.gyC()
l=t.Ni
k=A.d1(B.ku,h.y,null)
h.r=new A.b9(k,new A.bc(new A.i(q,r),new A.i(s,m),l),l.i("b9<b7.T>"))
h.y.e=A.d7(0,B.d.P(n*1000),0)
k.ag(0,h.gHx())
h.y.cc(0)
break $label0$0}if(B.vE===s){s=a.b
r=Math.abs(s)
if(r<0.1){h.Q=null
return}j=h.gcR().a.lE()
h.a.toString
i=A.aCE(0.0026999999999999997,j,s/10,0)
h.a.toString
n=A.bOg(r,0.0000135,0.1)
s=i.hB(0,n)
r=t.Y
q=A.d1(B.ku,h.z,null)
h.w=new A.b9(q,new A.bc(j,s,r),r.i("b9<b7.T>"))
h.z.e=A.d7(0,B.d.P(n*1000),0)
q.ag(0,h.gHF())
h.z.cc(0)
break $label0$0}break $label0$0}},
aF8(a){var s,r,q,p,o,n,m,l=this,k=a.gea(),j=a.gb5(a)
if(t.Mj.b(a)){s=a.gd3(a)===B.ew
if(s)l.a.toString
if(s){s=l.a.CW
s.$1(new A.BW(j,k,0,null))
s=j.a4(0,a.gnq())
r=a.gnq()
q=A.Bv(a.gcQ(a),null,r,s)
if(!l.Hf(B.rd)){s=l.a
s.ch.$1(new A.rh(B.eU,0,0))
return}p=l.gcR().kV(k)
o=l.gcR().kV(k.a6(0,q))
l.gcR().sA(0,l.xg(l.gcR().a,o.a6(0,p)))
s=l.a
s.ch.$1(new A.rh(B.eU,0,0))
return}if(a.gnq().b===0)return
s=a.gnq()
l.a.toString
n=Math.exp(-s.b/200)}else if(t.gy.b(a))n=a.ghP(a)
else return
s=l.a.CW
s.$1(new A.BW(j,k,0,null))
if(!l.Hf(B.vE)){s=l.a
s.ch.$1(new A.rh(B.eU,0,0))
return}p=l.gcR().kV(k)
l.gcR().sA(0,l.RM(l.gcR().a,n))
m=l.gcR().kV(k)
l.gcR().sA(0,l.xg(l.gcR().a,m.a6(0,p)))
s=l.a
s.ch.$1(new A.rh(B.eU,0,0))},
aC2(){var s,r,q,p,o,n,m=this,l=m.y
l===$&&A.b()
l=l.r
if(!(l!=null&&l.a!=null)){m.Q=null
l=m.r
if(l!=null)l.a.V(0,m.gHx())
m.r=null
l=m.y
l.sA(0,l.a)
return}l=m.gcR().a.tk().a
s=l[0]
l=l[1]
r=m.gcR()
q=m.gcR().a
p=m.gcR()
o=m.r
n=o.b
o=o.a
r.sA(0,m.xg(q,p.kV(n.aq(0,o.gA(o))).a6(0,m.gcR().kV(new A.i(s,l)))))},
aDe(){var s,r,q,p,o,n=this,m=n.z
m===$&&A.b()
m=m.r
if(!(m!=null&&m.a!=null)){n.Q=null
m=n.w
if(m!=null)m.a.V(0,n.gHF())
n.w=null
m=n.z
m.sA(0,m.a)
return}m=n.w
s=m.b
m=m.a
r=s.aq(0,m.gA(m))
m=n.gcR().a.lE()
s=n.gcR()
q=n.x
q===$&&A.b()
p=s.kV(q)
n.gcR().sA(0,n.RM(n.gcR().a,r/m))
o=n.gcR().kV(n.x)
n.gcR().sA(0,n.xg(n.gcR().a,o.a6(0,p)))},
aEl(){this.J(new A.bd6())},
aM(){var s=this,r=null
s.b3()
s.y=A.cM(r,r,r,r,s)
s.z=A.cM(r,r,r,r,s)
s.gcR().ag(0,s.gRi())},
b9(a){var s,r,q=this
q.bs(a)
s=q.a.cy
if(s===a.cy)return
r=q.gRi()
q.gcR().V(0,r)
q.d=s
q.gcR().ag(0,r)},
n(){var s=this,r=s.y
r===$&&A.b()
r.n()
r=s.z
r===$&&A.b()
r.n()
s.gcR().V(0,s.gRi())
s.a.toString
s.ar_()},
R(a){var s,r,q,p=this,o=null
p.a.toString
s=p.gcR().a
r=p.a.w
q=new A.af4(r,p.e,B.y,!1,s,o,o)
return A.x2(B.er,A.f7(B.bY,q,B.ay,!1,o,o,o,o,o,o,o,o,o,o,o,o,o,o,p.gaHZ(),p.gaI0(),p.gaI2(),o,o,o,o,o,o,o,o,o,o,o,!1,new A.i(0,-0.005)),p.f,o,o,o,p.gaF7(),o)}}
