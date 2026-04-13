A.aX9.prototype={
adQ(e1,e2,e3,e4){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,b0,b1,b2,b3,b4,b5,b6,b7,b8,b9,c0,c1,c2,c3,c4,c5,c6,c7,c8,c9,d0,d1,d2,d3,d4,d5,d6,d7,d8,d9=null,e0="The provided data was not a vector_graphics binary asset."
if(e4==null){s=new A.bgl(e2)
if(e2.byteLength<5)throw A.d(A.a6(e0))
if(s.Og(0)!==8924514)throw A.d(A.a6(e0))
if(s.no(0)!==1)throw A.d(A.a6("The provided data does not match the currently supported version."))}else{r=e4.b
r.toString
s=r}$label0$1:for(r=s.a,q=e3.as,p=e3.ay,o=e3.Q,n=t.qR,m=e3.r,l=$.cc.a,k=m.a,j=e3.y,i=e3.e,h=e3.x,g=e3.b,f=e3.c,e=e3.d,d=!1;c=s.b,c<r.byteLength;){s.b=c+1
b=r.getUint8(c)
switch(b){case 48:if(d)return new A.a1F(!1,s)
continue $label0$1
case 39:a=r.getUint16(s.b,!0)
a0=r.getFloat32(s.b+=2,!0)
a1=r.getFloat32(s.b+=4,!0)
a2=r.getFloat32(s.b+=4,!0)
a3=r.getFloat32(s.b+=4,!0)
a4=r.getUint16(s.b+=4,!0)
s.b+=2
a5=s.Zy(a4)
a4=r.getUint16(s.b,!0)
s.b+=2
e3.b1E(a0,a1,a2,a3,a5,s.Fx(a4),r.getUint8(s.b++),a)
continue $label0$1
case 40:a=r.getUint16(s.b,!0)
a0=r.getFloat32(s.b+=2,!0)
a1=r.getFloat32(s.b+=4,!0)
a2=r.getFloat32(s.b+=4,!0)
c=s.b+=4
s.b=c+1
if(r.getUint8(c)===1){a3=r.getFloat32(s.b,!0)
a4=r.getFloat32(s.b+=4,!0)
s.b+=4
a6=a4
a7=a3}else{a6=d9
a7=a6}a3=r.getUint16(s.b,!0)
s.b+=2
a5=s.Zy(a3)
a3=r.getUint16(s.b,!0)
s.b+=2
e3.b1H(a0,a1,a2,a7,a6,a5,s.Fx(a3),s.FE(),r.getUint8(s.b++),a)
continue $label0$1
case 28:a=r.getUint32(s.b,!0)
c=s.b+=4
s.b=c+1
a8=r.getUint8(c)
a0=r.getUint16(s.b,!0)
a1=r.getUint16(s.b+=2,!0)
s.b+=2
e3.ahd(a8,a,a0,0,a1===65535?d9:a1,d9,d9,d9,d9)
continue $label0$1
case 29:a=r.getUint32(s.b,!0)
c=s.b+=4
s.b=c+1
a9=r.getUint8(c)
b0=r.getUint8(s.b++)
a8=r.getUint8(s.b++)
a0=r.getFloat32(s.b,!0)
a1=r.getFloat32(s.b+=4,!0)
a2=r.getUint16(s.b+=4,!0)
a3=r.getUint16(s.b+=2,!0)
s.b+=2
e3.ahd(a8,a,a2,1,a3===65535?d9:a3,a9,b0,a0,a1)
continue $label0$1
case 27:this.a7R(s,e3,!1)
continue $label0$1
case 52:this.a7R(s,e3,!0)
continue $label0$1
case 30:a=r.getUint16(s.b,!0)
a0=r.getUint16(s.b+=2,!0)
a1=r.getUint16(s.b+=2,!0)
s.b+=2
e3.XG(a,a0,a1===65535?d9:a1)
continue $label0$1
case 31:a=r.getUint16(s.b,!0)
a0=r.getUint16(s.b+=2,!0)
s.b+=2
b1=s.Fx(a0)
a0=r.getUint16(s.b,!0)
s.b+=2
b2=a0!==0?s.ZM(a0):d9
c=a!==65535?a:d9
$.am()
b3=A.bXp(B.aTb,b1,d9,b2,d9)
b4=c!=null?h[c]:d9
m.aX8(b3,B.fX,b4==null?$.bRF():b4)
c=b3.f
c===$&&A.b()
if(c!=null)c.n()
continue $label0$1
case 38:c=e3.dy
if(c!=null){b5=c.a
b6=p.h(0,b5).c
b7=p.h(0,b5).a
b7.toString
b6.toString
b8=A.bIH(0,g,b6,b7,f,e,i,d9)
b7=c.b
b6=c.c
b8.CW=new A.K(b7,b6)
b9=b8.YE()
e3.dy=null
c0=b9.a.zv(B.d.P(b7),B.d.P(b6))
c=c.d
$.am()
c1=new A.a0P(B.Bg,B.Bg,c,d9,c0)
c1.a5O(B.jU)
p.h(0,b5).b=c1
c0.n()}else k.restore()
continue $label0$1
case 37:a=r.getUint16(s.b,!0)
s.b+=2
c=h[a]
c2=c.dg()
c=$.cc.b
if(c===$.cc)A.a3(A.On(l))
c=c.TileMode.Clamp
k.saveLayer.apply(k,[c2,null,null,null,c])
c2.delete()
continue $label0$1
case 41:a=r.getFloat32(s.b,!0)
a0=r.getFloat32(s.b+=4,!0)
s.b+=4
if(i)k.clipRect(A.el(new A.M(0,0,0+a,0+a0)),$.mn()[1],!0)
e3.CW=new A.K(a,a0)
continue $label0$1
case 42:a=r.getUint16(s.b,!0)
s.b+=2
J.b2(k.save())
c=j[a].gfa().a
c===$&&A.b()
c=c.a
c.toString
k.clipPath(c,$.vH(),!0)
continue $label0$1
case 43:c=$.bRG()
c2=c.dg()
c=$.cc.b
if(c===$.cc)A.a3(A.On(l))
c=c.TileMode.Clamp
k.saveLayer.apply(k,[c2,null,null,null,c])
c2.delete()
continue $label0$1
case 45:r.getUint16(s.b,!0)
a=r.getFloat32(s.b+=2,!0)
a0=r.getFloat32(s.b+=4,!0)
c=s.b+=4
s.b=c+1
c3=r.getUint8(c)
c4=r.getUint8(s.b++)
c5=r.getUint8(s.b++)
a1=r.getUint32(s.b,!0)
a2=r.getUint16(s.b+=4,!0)
s.b+=2
if(a2>0){c6=J.ft(B.br.gbo(r),r.byteOffset+s.b,a2)
s.b+=a2
c7=new A.Dw(!1).AG(c6,0,d9,!0)}else c7=d9
a2=r.getUint16(s.b,!0)
s.b+=2
c6=J.ft(B.br.gbo(r),r.byteOffset+s.b,a2)
s.b+=a2
c8=new A.Dw(!1).AG(c6,0,d9,!0)
c9=A.a([],n)
if((c4&1)!==0)c9.push(B.AX)
if((c4&2)!==0)c9.push(B.Uz)
if((c4&4)!==0)c9.push(B.UA)
o.push(new A.akr(c8,c7,a0,a,B.z2[c3],A.c32(c9),B.aoK[c5],A.cs(a1)))
continue $label0$1
case 44:a=r.getUint16(s.b,!0)
a0=r.getUint16(s.b+=2,!0)
c=s.b+=2
d0=a0===65535?d9:a0
a0=r.getUint16(c,!0)
c=s.b+=2
d1=a0===65535?d9:a0
a0=r.getUint16(c,!0)
s.b+=2
e3.XH(a,d0,d1,a0===65535?d9:a0)
continue $label0$1
case 46:a=r.getUint16(s.b,!0)
c=s.b+=2
s.b=c+1
d2=r.getUint8(c)
a0=r.getUint32(s.b,!0)
s.b+=4
c6=J.ft(B.br.gbo(r),r.byteOffset+s.b,a0)
s.b+=a0
e3.b1C(a,d2,c6)
d=!0
continue $label0$1
case 47:a=r.getUint16(s.b,!0)
a0=r.getFloat32(s.b+=2,!0)
a1=r.getFloat32(s.b+=4,!0)
a2=r.getFloat32(s.b+=4,!0)
a3=r.getFloat32(s.b+=4,!0)
s.b+=4
e3.b1s(a,a0,a1,a2,a3,s.FE())
continue $label0$1
case 49:a=r.getUint16(s.b,!0)
a0=r.getFloat32(s.b+=2,!0)
a1=r.getFloat32(s.b+=4,!0)
a2=r.getFloat32(s.b+=4,!0)
a3=r.getFloat32(s.b+=4,!0)
s.b+=4
d3=s.FE()
d3.toString
e3.dy=new A.beD(a,a2,a3,d3)
$.am()
d4=new A.mt()
d5=d4.K_(B.l6)
d5.a.clipRect(A.el(new A.M(a0,a1,a0+a2,a1+a3)),$.mn()[1],!0)
c=new A.agv()
c.c=d4
c.a=d5
p.j(0,a,c)
continue $label0$1
case 50:r.getUint16(s.b,!0)
a=r.getFloat32(s.b+=2,!0)
a0=r.getFloat32(s.b+=4,!0)
a1=r.getFloat32(s.b+=4,!0)
a2=r.getFloat32(s.b+=4,!0)
c=s.b+=4
s.b=c+1
c=r.getUint8(c)
d3=s.FE()
b6=isNaN(a)?d9:a
b7=isNaN(a0)?d9:a0
d6=isNaN(a1)?d9:a1
d7=isNaN(a2)?d9:a2
q.push(new A.akv(b6,b7,d6,d7,c!==0,d3))
continue $label0$1
case 51:a=r.getUint16(s.b,!0)
s.b+=2
d8=q[a]
if(d8.e)e3.db=e3.cy=0
c=d8.a
if(c!=null)e3.cy=c
c=d8.b
if(c!=null)e3.db=c
c=d8.c
if(c!=null){b6=e3.cy
e3.cy=(b6==null?0:b6)+c}c=d8.d
if(c!=null)e3.db+=c
e3.dx=d8.f
continue $label0$1
default:throw A.d(A.a6("Unknown type tag "+b))}}return B.a8Z},
Vo(a,b,c){return this.adQ(0,b,c,null)},
ajv(a,b,c,d){a.ia(B.j3)
a.oS()
a.a.push(30)
a.pa(b)
a.pa(c)
a.pa(d==null?65535:d)},
awM(a){var s,r=a.length,q=new Float32Array(r),p=new DataView(new ArrayBuffer(8))
for(s=0;s<r;++s){p.setUint16(0,a[s],!1)
q[s]=A.cfC(p)}return q},
a7R(a,b,c){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e=a.no(0)
a.akQ(0)
s=a.Og(0)
r=a.qf(s)
q=a.Og(0)
p=c?this.awM(a.ZM(q)):a.Fx(q)
o=A.cS($.am().w)
o.sDL(B.anX[e])
b.y.push(o)
b.ch=o
$label0$1:for(n=0,m=0;n<s;++n)switch(r[n]){case 0:l=p[m]
k=p[m+1]
j=b.ch
k=new A.fS(l,k)
j.e.push(k)
l=j.d
if(l!=null)k.dH(l)
m+=2
continue $label0$1
case 1:l=p[m]
k=p[m+1]
j=b.ch
k=new A.cO(l,k)
j.e.push(k)
l=j.d
if(l!=null)k.dH(l)
m+=2
continue $label0$1
case 2:l=p[m]
k=p[m+1]
j=p[m+2]
i=p[m+3]
h=p[m+4]
g=p[m+5]
f=b.ch
g=new A.Mx(l,k,j,i,h,g)
f.e.push(g)
l=f.d
if(l!=null)g.dH(l)
m+=6
continue $label0$1
case 3:l=b.ch
k=new A.oG()
l.e.push(k)
l=l.d
if(l!=null)k.dH(l)
continue $label0$1}b.ch=null}}
