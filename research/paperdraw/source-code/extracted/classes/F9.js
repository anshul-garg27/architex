A.F9.prototype={
aX(a8,a9){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4="type",a5="points",a6=this.b,a7=a6.length
if(a7===0)return
for(s=t.j,r=1/0,q=1/0,p=-1/0,o=-1/0,n=0;n<a7;++n){m=a6[n]
l=A.dg(m.h(0,"x"))
k=A.dg(m.h(0,"y"))
j=A.dg(m.h(0,"width"))
i=A.dg(m.h(0,"height"))
if(l<r)r=l
if(k<q)q=k
h=l+j
if(h>p)p=h
g=k+i
if(g>o)o=g
if((J.e(m.h(0,a4),"line")||J.e(m.h(0,a4),"arrow"))&&m.h(0,a5)!=null){f=J.mo(s.a(m.h(0,a5)),s)
for(e=A.l(f),d=new A.bp(f,f.gv(f),e.i("bp<W.E>")),e=e.i("W.E");d.p();){c=d.d
if(c==null)c=e.a(c)
b=J.Y(c)
a=l+A.dg(b.h(c,0))
a0=k+A.dg(b.h(c,1))
if(a<r)r=a
if(a>p)p=a
if(a0<q)q=a0
if(a0>o)o=a0}}}if(isFinite(r)){a1=p-r
a2=o-q
if(a1>0&&a2>0){s=a8.a
J.b2(s.save())
a8.oF(0,a9.a/a1,a9.b/a2)
s.translate(-r,-q)
for(n=0;n<a7;++n)this.a3u(a8,a6[n])
s.restore()
return}}for(s=t.j,r=1/0,q=1/0,p=-1/0,o=-1/0,n=0;n<a7;++n){m=a6[n]
l=A.dg(m.h(0,"x"))
k=A.dg(m.h(0,"y"))
j=A.dg(m.h(0,"width"))
i=A.dg(m.h(0,"height"))
if(l<r)r=l
if(k<q)q=k
h=l+j
if(h>p)p=h
g=k+i
if(g>o)o=g
if((J.e(m.h(0,a4),"line")||J.e(m.h(0,a4),"arrow"))&&m.h(0,a5)!=null){f=J.mo(s.a(m.h(0,a5)),s)
for(e=A.l(f),d=new A.bp(f,f.gv(f),e.i("bp<W.E>")),e=e.i("W.E");d.p();){c=d.d
if(c==null)c=e.a(c)
b=J.Y(c)
a=l+A.dg(b.h(c,0))
a0=k+A.dg(b.h(c,1))
if(a<r)r=a
if(a>p)p=a
if(a0<q)q=a0
if(a0>o)o=a0}}}a1=p-r
a2=o-q
if(a1<=0||a2<=0)return
s=a9.a
e=a9.b
a3=Math.min(s/a1,e/a2)*0.95
d=a8.a
J.b2(d.save())
d.translate((s-a1*a3)/2,(e-a2*a3)/2)
a8.b2(0,a3)
d.translate(-r,-q)
for(n=0;n<a7;++n)this.a3u(a8,a6[n])
d.restore()},
a3u(a7,a8){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2=this,a3=null,a4=J.Y(a8),a5=a4.h(a8,"type"),a6=A.ao(a4.h(a8,"strokeColor"))
if(a6==null)a6="#000000"
s=A.ao(a4.h(a8,"backgroundColor"))
if(s==null)s="transparent"
r=A.ao(a4.h(a8,"fillStyle"))
if(r==null)r="solid"
q=a2.e?"solid":r
p=a2.c
if(p==null)p=a2.a3H(a6)
o=a2.a3H(s)
$.am()
n=A.ba()
n.r=p.gA(0)
n.b=B.bK
n.d=B.lc
n.e=B.qW
m=A.aq(a4.h(a8,"strokeWidth"))
if(m==null)m=a3
if(m==null)m=2
n.c=m*a2.x
l=A.dg(a4.h(a8,"x"))
k=A.dg(a4.h(a8,"y"))
j=A.dg(a4.h(a8,"width"))
i=A.dg(a4.h(a8,"height"))
switch(a5){case"rectangle":a4=l+j
m=k+i
h=new A.M(l,k,a4,m)
g=a2.w
f=g==null?a3:A.lV(h,new A.be(g,g))
if(!a2.f&&!o.m(0,B.C))if(f!=null)a2.axO(a7,f,o,q)
else a2.Qu(a7,h,o,q)
if(f!=null)a2.axS(a7,f,n)
else a2.Qv(a7,A.a([new A.i(l,k),new A.i(a4,k),new A.i(a4,m),new A.i(l,m),new A.i(l,k)],t.yv),n)
break
case"ellipse":h=new A.M(l,k,l+j,k+i)
if(!a2.f&&!o.m(0,B.C))a2.Qu(a7,h,o,q)
a2.axR(a7,h,n)
break
case"diamond":a4=l+j
m=k+i
if(!a2.f&&!o.m(0,B.C))a2.Qu(a7,new A.M(l,k,a4,m),o,q)
j=a4-l
i=m-k
a4=l+j/2
m=k+i/2
a2.Qv(a7,A.a([new A.i(a4,k),new A.i(l+j,m),new A.i(a4,k+i),new A.i(l,m),new A.i(a4,k)],t.yv),n)
break
case"arrow":case"line":if(a4.h(a8,"points")!=null){m=t.j
e=J.mo(m.a(a4.h(a8,"points")),m)
if(!e.ga3(e)){m=A.l(e).i("q<W.E,i>")
d=A.r(new A.q(e,new A.aAO(l,k),m),m.i("a2.E"))
a2.Qv(a7,d,n)
if(J.e(a4.h(a8,"endArrowhead"),"arrow")&&e.gv(e)>=2){c=e.h(0,e.gv(e)-2)
b=e.gY(e)
a4=J.Y(c)
m=J.Y(b)
a2.axQ(a7,l+a4.h(c,0),k+a4.h(c,1),l+m.h(b,0),k+m.h(b,1),A.cs(n.r))}}}break
case"text":a=A.ao(a4.h(a8,"text"))
if(a==null)a=""
a4=A.aq(a4.h(a8,"fontSize"))
a0=a4==null?a3:a4
if(a0==null)a0=16
a1=A.jp(a3,a3,a3,a3,A.cF(a3,a3,a3,a3,A.ie(A.cs(n.r),a0,B.V,1.2,a3),a),B.ah,B.aF,a3,B.dL,B.aG)
a1.k7()
a4=a7.a
J.b2(a4.save())
a4.translate(l,k)
m=new A.li()
m.l2(a2.aMK(a))
a7.Yu(0,0.015*a2.r*(m.aO()-0.5))
a1.aX(a7,B.l)
a4.restore()
break}},
axS(a,b,c){var s,r,q,p,o,n,m,l,k,j=b.a,i=b.b,h=b.c,g=b.d,f=new A.li()
f.l2(this.IL(new A.M(j,i,h,g)))
s=b.e
for(r=this.r,q=a.a,p=0;p<2;++p){o=f.aO()
n=f.aO()
m=f.aO()
l=new A.M(j,i,h,g).e4(new A.i((o-0.5)*1.8*r,(n-0.5)*1.8*r))
m=Math.max(0,s+(m-0.5)*r)
m=A.lV(l,new A.be(m,m))
k=c.dg()
q.drawRRect(A.q4(m),k)
k.delete()}},
axR(a,b,c){var s,r,q,p,o,n,m,l,k,j=new A.li()
j.l2(this.IL(b))
for(s=this.r,r=b.a,q=b.b,p=b.c,o=b.d,n=a.a,m=0;m<2;++m){l=(j.aO()-0.5)*3*s
k=c.dg()
n.drawOval(A.el(new A.M(r-l,q-l,p+l,o+l)),k)
k.delete()}},
Qv(a,b,c){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d
if(b.length<2)return
s=new A.li()
s.l2(this.aMJ(b))
for(r=a.a,q=this.r,p=0;p<2;++p){o=A.cS($.am().w)
n=new A.fS(b[0].a+(s.aO()-0.5)*3*q,b[0].b+(s.aO()-0.5)*3*q)
m=o.e
m.push(n)
l=o.d
if(l!=null)n.dH(l)
for(k=1;k<b.length;++k){j=b[k-1]
i=b[k]
n=i.a
l=j.a
h=n-l
g=i.b
f=j.b
e=g-f
if(Math.sqrt(h*h+e*e)>10){l=new A.cO((l+n)/2+(s.aO()-0.5)*3*q,(f+g)/2+(s.aO()-0.5)*3*q)
m.push(l)
h=o.d
if(h!=null)l.dH(h)}n=new A.cO(n+(s.aO()-0.5)*3*q,g+(s.aO()-0.5)*3*q)
m.push(n)
l=o.d
if(l!=null)n.dH(l)}d=c.dg()
n=o.gfa().a
n===$&&A.b()
n=n.a
n.toString
r.drawPath(n,d)
d.delete()}},
axQ(a,b,c,d,a0,a1){var s,r,q,p,o,n,m,l,k,j,i,h,g,f=Math.atan2(a0-c,d-b),e=new A.li()
e.l2(this.SM(A.a([b,c,d,a0],t.a0)))
s=$.am()
r=A.ba()
r.r=a1.gA(0)
r.b=B.bK
r.c=2.5
r.d=B.lc
for(q=a.a,p=f+0.5235987755982988,o=f-0.5235987755982988,n=this.r,m=0;m<2;++m){l=(e.aO()-0.5)*3*n
k=A.cS(s.w)
j=new A.fS(d,a0)
i=k.e
i.push(j)
h=k.d
if(h!=null)j.dH(h)
j=new A.cO(d-14*Math.cos(o)+l,a0-14*Math.sin(o)+l)
i.push(j)
h=k.d
if(h!=null)j.dH(h)
j=new A.fS(d,a0)
i.push(j)
h=k.d
if(h!=null)j.dH(h)
j=new A.cO(d-14*Math.cos(p)+l,a0-14*Math.sin(p)+l)
i.push(j)
i=k.d
if(i!=null)j.dH(i)
g=r.dg()
j=k.gfa().a
j===$&&A.b()
j=j.a
j.toString
q.drawPath(j,g)
g.delete()}},
Qu(a,b,c,d){var s,r,q,p,o,n,m,l,k,j,i,h,g
if(d==="solid"){$.am()
s=A.ba()
s.r=c.u(0.3).gA(0)
a.hU(b,s)
return}$.am()
r=A.ba()
r.r=c.u(0.4).gA(0)
r.b=B.bK
r.c=1.5
q=new A.li()
q.l2(this.IL(b))
s=a.a
J.b2(s.save())
s.clipRect(A.el(b),$.mn()[1],!0)
for(p=b.d,o=b.b,n=p-o,m=-n,l=b.a,k=b.c-l,j=this.r;m<k;m+=10){i=(q.aO()-0.5)*3*j
h=l+m
g=r.dg()
s.drawLine.apply(s,[h+i,o,h+n+i,p,g])
g.delete()}if(d==="cross-hatch")for(k+=n,m=0;m<k;m+=10){i=(q.aO()-0.5)*3*j
h=l+m
g=r.dg()
s.drawLine.apply(s,[h+i,p,h-n+i,o,g])
g.delete()}s.restore()},
axO(a,b,c,d){var s,r,q,p,o,n,m,l,k,j,i,h,g
if(d==="solid"){$.am()
s=A.ba()
s.r=c.u(0.3).gA(0)
a.e7(b,s)
return}$.am()
r=A.ba()
r.r=c.u(0.4).gA(0)
r.b=B.bK
r.c=1.5
s=b.a
q=b.b
p=b.c
o=b.d
n=new A.li()
n.l2(this.IL(new A.M(s,q,p,o)))
m=a.a
J.b2(m.save())
m.clipRRect(A.q4(b),$.vH(),!0)
for(l=o-q,k=-l,p-=s,j=this.r;k<p;k+=10){i=(n.aO()-0.5)*3*j
h=s+k
g=r.dg()
m.drawLine.apply(m,[h+i,q,h+l+i,o,g])
g.delete()}if(d==="cross-hatch")for(p+=l,k=0;k<p;k+=10){i=(n.aO()-0.5)*3*j
h=s+k
g=r.dg()
m.drawLine.apply(m,[h+i,o,h-l+i,q,g])
g.delete()}m.restore()},
IL(a){var s=a.a,r=a.b
return this.SM(A.a([s,r,a.c-s,a.d-r],t.a0))},
aMJ(a){var s,r,q,p=A.a([],t.n)
for(s=a.length,r=0;r<a.length;a.length===s||(0,A.o)(a),++r){q=a[r]
p.push(q.a)
p.push(q.b)}return this.SM(p)},
aMK(a){var s,r,q,p
for(s=new A.fR(a),r=t.Hz,s=new A.bp(s,s.gv(0),r.i("bp<W.E>")),r=r.i("W.E"),q=17;s.p();){p=s.d
if(p==null)p=r.a(p)
q=q*31+p&536870911}return q},
SM(a){var s,r,q
for(s=a.length,r=17,q=0;q<s;++q)r=r*31+B.d.P(a[q]*100)&536870911
return r},
a3H(a){if(a==="transparent")return B.C
a=A.aX(a,"#","")
return A.cs(A.dN(a.length===6?"FF"+a:a,16))},
f0(a){var s=this
return a.b!==s.b||!J.e(a.c,s.c)||a.e!==s.e||a.f!==s.f||a.r!==s.r||a.w!=s.w||a.x!==s.x}}
