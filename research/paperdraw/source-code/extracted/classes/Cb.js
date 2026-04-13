A.Cb.prototype={
gaXb(){var s=this.id
if(s!==0)return s
else return 2},
gX6(){var s,r=this.a
if(r.ay){s=this.b
s.toString
r=(s&1)===0&&!r.w}else r=!1
return r},
L9(){switch(this.a.c.a){case 0:return B.abo
case 1:return B.abp
case 2:return B.pK}},
NM(){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0=this,a1=a0.fr
if(a1==null||a1.length===0){a1=a0.rx
if(a1==null||a1.length===0){a0.rx=null
return}s=a1.length
for(a1=a0.ok,r=a1.e,q=0;q<s;++q){p=r.h(0,a0.rx[q].k4)
if(p!=null)a1.w.push(p)}a0.rx=null
return}r=a0.dy
r.toString
o=a1.length
n=A.a([],t.Qo)
for(m=a0.ok,l=m.e,q=0;q<o;++q){k=l.h(0,r[q])
k.toString
n.push(k)}if(o>1)for(q=0;q<o;++q){r=l.h(0,a1[q]).ry.a
r===$&&A.b()
r=r.style
r.setProperty("z-index",""+(o-q),"")}a1=a0.rx
if(a1==null||a1.length===0){for(a1=n.length,j=0;j<n.length;n.length===a1||(0,A.o)(n),++j){i=n[j]
r=a0.ry.a
r===$&&A.b()
l=i.ry.a
l===$&&A.b()
r.append(l)
i.RG=a0
m.r.j(0,i.k4,a0)}a0.rx=n
return}h=a1.length
r=t.t
g=A.a([],r)
f=Math.min(h,o)
e=0
for(;;){if(!(e<f&&a1[e]===n[e]))break
g.push(e);++e}if(h===n.length&&e===o)return
while(e<o){for(d=0;d<h;++d)if(a1[d]===n[e]){g.push(d)
break}++e}c=A.bQm(g)
b=A.a([],r)
for(r=c.length,q=0;q<r;++q)b.push(a1[g[c[q]]].k4)
for(q=0;q<h;++q)if(!B.b.k(g,q)){p=l.h(0,a1[q].k4)
if(p!=null)m.w.push(p)}for(q=o-1,a=null;q>=0;--q,a=a1){i=n[q]
a1=i.k4
if(!B.b.k(b,a1)){r=a0.ry
l=i.ry
if(a==null){r=r.a
r===$&&A.b()
l=l.a
l===$&&A.b()
r.append(l)}else{r=r.a
r===$&&A.b()
l=l.a
l===$&&A.b()
r.insertBefore(l,a)}i.RG=a0
m.r.j(0,a1,a0)}a1=i.ry.a
a1===$&&A.b()}a0.rx=n},
azS(){var s,r,q=this
if(q.go!==-1)return B.xW
s=q.p1
s===$&&A.b()
switch(s.a){case 1:return B.xu
case 3:return B.xw
case 2:return B.xv
case 4:return B.xx
case 5:return B.xy
case 6:return B.xz
case 7:return B.xA
case 8:return B.xB
case 9:return B.xC
case 25:return B.xT
case 14:return B.xI
case 13:return B.xJ
case 15:return B.xK
case 16:return B.xL
case 17:return B.xM
case 27:return B.xE
case 26:return B.xD
case 18:return B.xF
case 19:return B.xG
case 28:return B.xN
case 29:return B.xO
case 30:return B.xP
case 31:return B.xQ
case 32:return B.xR
case 20:return B.xS
case 10:case 11:case 12:case 21:case 22:case 23:case 24:case 0:break}if(q.id===0){s=!1
if(q.a.z){r=q.z
if(r!=null&&r.length!==0){s=q.dy
s=!(s!=null&&!B.hw.ga3(s))}}}else s=!0
if(s)return B.Fu
else{s=q.a
if(s.x)return B.Ft
else{r=q.b
r.toString
if((r&64)!==0||(r&128)!==0)return B.Fs
else if(q.gX6())return B.Fv
else if(q.gWZ())return B.xU
else if(s.db)return B.xs
else if(s.w)return B.tk
else if(s.CW)return B.xr
else if(s.as)return B.xV
else if(s.z)return B.xt
else{if((r&1)!==0){s=q.dy
s=!(s!=null&&!B.hw.ga3(s))}else s=!1
if(s)return B.tk
else return B.xH}}}},
awz(a){var s,r,q,p=this
switch(a.a){case 3:s=new A.aS2(B.Ft,p)
r=A.C8(s.ct(0),p)
s.a!==$&&A.bA()
s.a=r
s.aEY()
break
case 1:s=new A.aRU(A.dA(v.G.document,"flt-semantics-scroll-overflow"),B.xr,p)
s.er(B.xr,p,B.bI)
r=s.a
r===$&&A.b()
q=A.aY("group")
q.toString
r.setAttribute("role",q)
break
case 0:s=A.c2a(p)
break
case 2:s=new A.aRq(B.tk,p)
s.er(B.tk,p,B.tY)
s.eC(A.HI(p,s))
r=s.a
r===$&&A.b()
q=A.aY("button")
q.toString
r.setAttribute("role",q)
break
case 4:s=new A.aRO(B.xT,p)
s.er(B.xT,p,B.bI)
r=s.a
r===$&&A.b()
q=A.aY("radiogroup")
q.toString
r.setAttribute("role",q)
break
case 5:s=new A.aRs(A.c7_(p),B.xU,p)
s.er(B.xU,p,B.bI)
s.eC(A.HI(p,s))
break
case 8:s=A.c2c(p)
break
case 7:s=new A.aRz(B.Fv,p)
r=A.C8(s.ct(0),p)
s.a!==$&&A.bA()
s.a=r
r=new A.Aj(new A.zb(p.ok,B.mW),p,s)
s.e=r
s.eC(r)
s.eC(new A.x3(p,s))
s.eC(new A.BU(p,s))
s.eC(A.HI(p,s))
s.U2()
break
case 9:s=new A.aRN(B.xW,p)
s.er(B.xW,p,B.bI)
break
case 10:s=new A.aRD(B.xs,p)
s.er(B.xs,p,B.tY)
s.eC(A.HI(p,s))
break
case 23:s=new A.aRE(B.xF,p)
s.er(B.xF,p,B.bI)
r=s.a
r===$&&A.b()
q=A.aY("list")
q.toString
r.setAttribute("role",q)
break
case 24:s=new A.aRF(B.xG,p)
s.er(B.xG,p,B.bI)
r=s.a
r===$&&A.b()
q=A.aY("listitem")
q.toString
r.setAttribute("role",q)
break
case 6:s=new A.aRy(B.Fu,p)
r=A.C8(s.ct(0),p)
s.a!==$&&A.bA()
s.a=r
r=new A.Aj(new A.zb(p.ok,B.mW),p,s)
s.e=r
s.eC(r)
s.eC(new A.x3(p,s))
s.eC(new A.BU(p,s))
s.TZ(B.tY)
s.U2()
break
case 11:s=new A.aRx(B.xt,p)
s.er(B.xt,p,B.q3)
break
case 12:s=new A.aRZ(B.xu,p)
s.er(B.xu,p,B.bI)
r=s.a
r===$&&A.b()
q=A.aY("tab")
q.toString
r.setAttribute("role",q)
s.eC(A.HI(p,s))
break
case 13:s=new A.aS_(B.xv,p)
s.er(B.xv,p,B.bI)
r=s.a
r===$&&A.b()
q=A.aY("tablist")
q.toString
r.setAttribute("role",q)
break
case 14:s=new A.aS0(B.xw,p)
s.er(B.xw,p,B.bI)
r=s.a
r===$&&A.b()
q=A.aY("tabpanel")
q.toString
r.setAttribute("role",q)
break
case 15:s=A.c29(p)
break
case 16:s=A.c28(p)
break
case 17:s=new A.aS1(B.xz,p)
s.er(B.xz,p,B.bI)
r=s.a
r===$&&A.b()
q=A.aY("table")
q.toString
r.setAttribute("role",q)
break
case 18:s=new A.aRr(B.xA,p)
s.er(B.xA,p,B.q3)
r=s.a
r===$&&A.b()
q=A.aY("cell")
q.toString
r.setAttribute("role",q)
break
case 19:s=new A.aRT(B.xB,p)
s.er(B.xB,p,B.bI)
r=s.a
r===$&&A.b()
q=A.aY("row")
q.toString
r.setAttribute("role",q)
break
case 20:s=new A.aRt(B.xC,p)
s.er(B.xC,p,B.bI)
r=s.a
r===$&&A.b()
q=A.aY("columnheader")
q.toString
r.setAttribute("role",q)
break
case 26:s=new A.a7T(B.xI,p)
s.er(B.xI,p,B.bI)
r=s.a
r===$&&A.b()
q=A.aY("menu")
q.toString
r.setAttribute("role",q)
break
case 27:s=new A.a7U(B.xJ,p)
s.er(B.xJ,p,B.bI)
r=s.a
r===$&&A.b()
q=A.aY("menubar")
q.toString
r.setAttribute("role",q)
break
case 28:s=new A.aRI(B.xK,p)
s.er(B.xK,p,B.bI)
r=s.a
r===$&&A.b()
q=A.aY("menuitem")
q.toString
r.setAttribute("role",q)
s.eC(new A.Ea(p,s))
s.eC(A.HI(p,s))
break
case 29:s=new A.aRJ(B.xL,p)
s.er(B.xL,p,B.bI)
r=s.a
r===$&&A.b()
q=A.aY("menuitemcheckbox")
q.toString
r.setAttribute("role",q)
s.eC(new A.LW(p,s))
s.eC(new A.Ea(p,s))
break
case 30:s=new A.aRK(B.xM,p)
s.er(B.xM,p,B.bI)
r=s.a
r===$&&A.b()
q=A.aY("menuitemradio")
q.toString
r.setAttribute("role",q)
s.eC(new A.LW(p,s))
s.eC(new A.Ea(p,s))
break
case 22:s=new A.aRp(B.xE,p)
s.er(B.xE,p,B.bI)
r=s.a
r===$&&A.b()
q=A.aY("alert")
q.toString
r.setAttribute("role",q)
break
case 21:s=new A.aRY(B.xD,p)
s.er(B.xD,p,B.bI)
r=s.a
r===$&&A.b()
q=A.aY("status")
q.toString
r.setAttribute("role",q)
break
case 25:s=new A.aD3(B.xH,p)
s.er(B.xH,p,B.q3)
r=p.b
r.toString
if((r&1)!==0)s.eC(A.HI(p,s))
break
case 31:s=new A.aRu(B.xN,p)
s.er(B.xN,p,B.bI)
r=s.a
r===$&&A.b()
q=A.aY("complementary")
q.toString
r.setAttribute("role",q)
break
case 32:s=new A.aRv(B.xO,p)
s.er(B.xO,p,B.bI)
r=s.a
r===$&&A.b()
q=A.aY("contentinfo")
q.toString
r.setAttribute("role",q)
break
case 33:s=new A.aRG(B.xP,p)
s.er(B.xP,p,B.bI)
r=s.a
r===$&&A.b()
q=A.aY("main")
q.toString
r.setAttribute("role",q)
break
case 34:s=new A.aRM(B.xQ,p)
s.er(B.xQ,p,B.bI)
r=s.a
r===$&&A.b()
q=A.aY("navigation")
q.toString
r.setAttribute("role",q)
break
case 35:s=new A.aRP(B.xR,p)
s.er(B.xR,p,B.bI)
r=s.a
r===$&&A.b()
q=A.aY("region")
q.toString
r.setAttribute("role",q)
break
case 36:s=new A.aRw(B.xS,p)
s.er(B.xS,p,B.bI)
break
default:s=null}return s},
aQ5(){var s,r,q,p,o,n,m,l=this,k=l.ry,j=l.azS(),i=l.ry
if(i==null)s=null
else{i=i.a
i===$&&A.b()
s=i}if(k!=null)if(k.b===j){k.eY(0)
return}else{k.n()
k=l.ry=null}if(k==null){k=l.ry=l.awz(j)
k.aM()
k.eY(0)}i=l.ry.a
i===$&&A.b()
if(!J.e(s,i)){i=l.rx
if(i!=null)for(r=i.length,q=0;q<i.length;i.length===r||(0,A.o)(i),++q){p=i[q]
o=l.ry.a
o===$&&A.b()
n=p.ry.a
n===$&&A.b()
o.append(n)}m=s==null?null:s.parentElement
if(m!=null){i=l.ry.a
i===$&&A.b()
m.insertBefore(i,s)
s.remove()}}},
gWZ(){var s=this.a
return s.a!==B.n8||s.d!==B.aL},
ahZ(a){var s,r,q,p,o,n,m=this,l=m.dy
if(!(l!=null&&!B.hw.ga3(l)))return
l=m.y
s=-l.a+m.x1
r=-l.b+m.to
for(l=m.dy,q=l.length,p=m.ok.e,o=0;o<q;++o){n=p.h(0,l[o])
if(n.xr!==s||n.x2!==r){n.xr=s
n.x2=r
a.B(0,n)}}},
Nh(){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4,a5=this,a6=a5.ry.a
a6===$&&A.b()
a6=a6.style
s=a5.y
A.aF(a6,"width",A.m(s.c-s.a)+"px")
s=a5.y
A.aF(a6,"height",A.m(s.d-s.b)+"px")
a6=a5.y
r=a6.b===0&&a6.a===0
q=a5.dx
a6=q==null
p=a6||A.bRe(q)===B.Vk
if(r&&p&&a5.x2===0&&a5.xr===0){a6=a5.ry.a
a6===$&&A.b()
A.bL_(a6)
return}o=A.rI("effectiveTransform")
s=a5.y
n=s.a+a5.xr
m=s.b+a5.x2
if(n!==0||m!==0)if(a6){a6=A.u9()
a6.jd(n,m,0)
o.b=a6
l=!1}else{a6=new Float32Array(16)
s=new A.lN(a6)
s.bC(new A.lN(q))
k=a6[0]
j=a6[4]
i=a6[8]
h=a6[12]
g=a6[1]
f=a6[5]
e=a6[9]
d=a6[13]
c=a6[2]
b=a6[6]
a=a6[10]
a0=a6[14]
a1=a6[3]
a2=a6[7]
a3=a6[11]
a4=a6[15]
a6[12]=k*n+j*m+i*0+h
a6[13]=g*n+f*m+e*0+d
a6[14]=c*n+b*m+a*0+a0
a6[15]=a1*n+a2*m+a3*0+a4
o.b=s
a6=o.bi().a
l=a6[0]===1&&a6[1]===0&&a6[2]===0&&a6[3]===0&&a6[4]===0&&a6[5]===1&&a6[6]===0&&a6[7]===0&&a6[8]===0&&a6[9]===0&&a6[10]===1&&a6[11]===0&&a6[12]===0&&a6[13]===0&&a6[14]===0&&a6[15]===1}else{if(!p)o.b=new A.lN(q)
l=p}a6=a5.ry
if(!l){a6=a6.a
a6===$&&A.b()
a6=a6.style
A.aF(a6,"transform-origin","0 0 0")
A.aF(a6,"transform",A.by6(o.bi().a))}else{a6=a6.a
a6===$&&A.b()
A.bL_(a6)}},
aiW(){var s,r,q,p=A.ak(t.UF)
this.ahZ(p)
for(s=A.dc(p,p.r,p.$ti.c),r=s.$ti.c;s.p();){q=s.d;(q==null?r.a(q):q).Nh()}},
TP(a){var s,r,q,p
if(!a.$1(this))return!1
s=this.dy
if(s==null)return!0
for(r=s.length,q=this.ok.e,p=0;p<r;++p)if(!q.h(0,s[p]).TP(a))return!1
return!0},
l(a){return this.ns(0)},
gbw(a){return this.k4}}
