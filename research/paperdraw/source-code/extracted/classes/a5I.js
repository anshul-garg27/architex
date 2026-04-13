A.a5I.prototype={
b2Z(a,b){var s=this,r=s.d
if(J.e(r.h(0,a),b)){if(!B.b.k(s.w,a))s.f.B(0,a)
return}r.j(0,a,b)
s.f.B(0,a)},
avK(a,b){var s,r=this,q=r.e.b_(0,a,new A.aLD(a)),p=q.b,o=p.style,n=b.b
A.aF(o,"width",A.m(n.a)+"px")
A.aF(o,"height",A.m(n.b)+"px")
A.aF(o,"position","absolute")
s=r.awo(b.c)
if(s!==q.c){q.a=r.aKQ(s,p,q.a)
q.c=s}r.asX(b,p,a)},
awo(a){var s,r,q,p
for(s=a.a,r=A.v(s).i("cy<1>"),s=new A.cy(s,r),s=new A.bp(s,s.gv(0),r.i("bp<a2.E>")),r=r.i("a2.E"),q=0;s.p();){p=s.d
p=(p==null?r.a(p):p).a
if(p===B.Ny||p===B.Nz||p===B.NA)++q}return q},
aKQ(a,b,c){var s,r,q,p,o,n=c.parentNode!=null
if(n){s=c.nextSibling
c.remove()}else s=null
r=b
q=0
for(;;){if(!(!J.e(r,c)&&q<a))break
p=r.parentElement
p.toString;++q
r=p}for(p=v.G;q<a;r=o){o=A.dA(p.document,"flt-clip")
o.append(r);++q}r.remove()
if(n)this.a.insertBefore(r,s)
return r},
asX(a,b,c){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e=a.a
if(e.m(0,B.l))s=A.u9()
else{s=A.u9()
s.jd(e.a,e.b,0)}this.aLi(b)
for(e=a.c.a,r=A.v(e).i("cy<1>"),e=new A.cy(e,r),e=new A.bp(e,e.gv(0),r.i("bp<a2.E>")),r=r.i("a2.E"),q=b,p=1;e.p();){o=e.d
if(o==null)o=r.a(o)
switch(o.a.a){case 3:o=o.e
o.toString
n=new Float32Array(16)
m=new A.lN(n)
m.bC(o)
m.fn(0,s)
o=q.style
n=A.by6(n)
o.setProperty("transform",n,"")
s=m
break
case 0:case 1:case 2:q=q.parentElement
n=q.style
n.setProperty("clip","","")
n=q.style
n.setProperty("clip-path","","")
s=new A.lN(new Float32Array(16))
s.arL()
n=q.style
n.setProperty("transform","","")
n=q.style
n.setProperty("width","100%","")
n=q.style
n.setProperty("height","100%","")
n=o.b
if(n!=null){o=q.style
l=n.b
k=n.c
j=n.d
n=n.a
o.setProperty("clip-path","rect("+A.m(l)+"px "+A.m(k)+"px "+A.m(j)+"px "+A.m(n)+"px)","")}else{n=o.c
if(n!=null){o=n.z
l=n.Q
if(new A.be(o,l).m(0,new A.be(n.x,n.y))&&new A.be(o,l).m(0,new A.be(n.e,n.f))&&new A.be(o,l).m(0,new A.be(n.r,n.w))&&o===l){l=q.style
k=n.b
j=n.c
i=n.d
n=n.a
l.setProperty("clip-path","rect("+A.m(k)+"px "+A.m(j)+"px "+A.m(i)+"px "+A.m(n)+"px round "+A.m(o)+"px)","")}else{h=A.cS($.am().w)
o=new A.hE(n)
h.e.push(o)
n=h.d
if(n!=null)o.dH(n)
o=q.style
n=h.gfa().a
n===$&&A.b()
n=n.a.toSVGString()
o.setProperty("clip-path",'path("'+n+'")',"")}}else{o=o.d
if(o!=null){h=o.gfa()
o=q.style
n=h.a
n===$&&A.b()
n=n.a.toSVGString()
o.setProperty("clip-path",'path("'+n+'")',"")}}}o=q.style
o.setProperty("transform-origin","0 0 0","")
o=q.style
o.setProperty("position","absolute","")
break
case 4:o=o.f
o.toString
p*=o/255
break}}A.aF(b.style,"opacity",B.d.l(p))
e=$.h3()
g=e.d
f=1/(g==null?e.gdl():g)
e=new Float32Array(16)
e[15]=1
e[10]=1
e[5]=f
e[0]=f
s=new A.lN(e).iv(s)
A.aF(q.style,"transform",A.by6(s.a))},
aLi(a){A.aF(a.style,"transform-origin","0 0 0")
A.aF(a.style,"position","absolute")},
b2a(){var s,r,q,p,o,n,m,l,k,j,i,h,g=this,f=g.aGX(A.ccv(g.c.b,g.d))
g.c.c=f
s=A.a([],t.kD)
r=A.a([],t.k_)
q=A.j(t.sT,t.E9)
p=t.SF
p=A.r(new A.c9(f.a,p),p.i("k.E"))
o=p.length
n=0
for(;n<p.length;p.length===o||(0,A.o)(p),++n){m=p[n]
$.am()
l=new A.mt()
s.push(l)
k=g.z
k===$&&A.b()
if(l.a!=null)A.a3(A.cr(u.Aw,null))
j=l.K_(new A.M(0,0,k.a,k.b))
r.push(j)
for(k=m.b,i=k.length,h=0;h<k.length;k.length===i||(0,A.o)(k),++h)q.j(0,k[h],j)}p=g.c
p.d=s
p.e=r
p.f=q},
G9(a,b){return this.amA(0,b)},
amA(a,b){var s=0,r=A.A(t.H),q,p=this,o,n,m,l,k,j,i,h,g,f,e,d,c
var $async$G9=A.w(function(a0,a1){if(a0===1)return A.x(a1,r)
for(;;)switch(s){case 0:c=p.c.c
c.toString
p.aPS(c)
if(c.v2(p.x)){o=c.a
n=t.SF
m=n.i("k.E")
l=0
for(;;){k=A.r(new A.c9(o,n),m)
if(!(l<k.length))break
k=A.r(new A.c9(o,n),m)
k=k[l]
j=A.r(new A.c9(p.x.a,n),m)
k.c=j[l].c
k=A.r(new A.c9(p.x.a,n),m)
k[l].c=null;++l}}p.x=c
o=t.SF
c=A.r(new A.c9(c.a,o),o.i("k.E"))
o=A.v(c).i("q<1,wu>")
i=A.r(new A.q(c,new A.aLG(),o),o.i("a2.E"))
c=p.c.d
c.toString
o=A.v(c).i("q<1,aLq>")
h=A.r(new A.q(c,new A.aLH(),o),o.i("a2.E"))
s=3
return A.n(p.b.rX(i,h,b),$async$G9)
case 3:for(c=h.length,g=0;g<h.length;h.length===c||(0,A.o)(h),++g){f=h[g]
o=f.a
o===$&&A.b()
o.n()}for(c=p.c.a,c=new A.bF(c,c.r,c.e,A.l(c).i("bF<2>"));c.p();){o=c.d
if(o.a!=null)o.nX()}p.c=new A.Nh(A.j(t.sT,t.Cc),A.a([],t.y8))
c=p.r
o=p.w
if(A.vE(c,o)){B.b.aa(c)
s=1
break}e=A.jk(o,t.S)
B.b.aa(o)
for(l=0;l<c.length;++l){d=c[l]
o.push(d)
e.L(0,d)}B.b.aa(c)
e.av(0,p.gaed())
case 1:return A.y(q,r)}})
return A.z($async$G9,r)},
aee(a){var s=this.e.L(0,a)
if(s!=null)s.a.remove()
this.d.L(0,a)
this.f.L(0,a)},
aGX(a){var s,r,q,p,o,n,m,l=A.a([],t.EV),k=a.a,j=t.SF
j=A.r(new A.c9(k,j),j.i("k.E"))
s=j.length
if(s<=A.fN().gUv())return a
r=s-A.fN().gUv()
q=A.a([],t.RR)
p=A.c8(k,!0,t.id)
for(o=k.length-1,n=!1;o>=0;--o){m=p[o]
if(m instanceof A.hs){if(!n){n=!0
continue}B.b.df(p,o)
B.b.hX(q,0,m.b);--r
if(r===0)break}}n=A.fN().gUv()===1
for(o=p.length-1;o>0;--o){m=p[o]
if(m instanceof A.hs){if(n){B.b.q(m.b,q)
break}n=!0}}B.b.q(l,p)
return new A.Ez(l)},
aPS(a){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d=this
if(a.v2(d.x))return
s=d.azX(d.x,a)
r=A.v(s).i("J<1>")
q=A.r(new A.J(s,new A.aLE(),r),r.i("k.E"))
p=A.bQm(q)
for(r=p.length,o=0;o<r;++o)p[o]=q[p[o]]
for(n=d.b,o=0;o<d.x.a.length;++o){if(B.b.k(s,o))continue
m=d.x.a[o]
if(m instanceof A.tz)d.aee(m.a)
else if(m instanceof A.hs){l=m.c
l.toString
k=n.gKZ()
l.grE().remove()
B.b.L(k.c,l)
k.d.push(l)
m.c=null}}j=new A.aLF(d,s)
for(n=a.a,l=d.a,i=0,h=0;i<r;){g=p[i]
f=d.QV(d.x.a[g])
while(s[h]!==g){e=n[h]
if(e instanceof A.hs)j.$2(e,h)
l.insertBefore(d.QV(e),f);++h}k=n[h]
if(k instanceof A.hs)j.$2(k,h);++h;++i}while(h<n.length){e=n[h]
if(e instanceof A.hs)j.$2(e,h)
l.append(d.QV(e));++h}},
QV(a){var s
$label0$0:{if(a instanceof A.hs){s=a.c.grE()
break $label0$0}if(a instanceof A.tz){s=this.e.h(0,a.a).a
break $label0$0}s=null}return s},
azX(a,b){var s,r,q=A.a([],t.t),p=a.a,o=b.a,n=Math.min(p.length,o.length),m=A.ak(t.S),l=0
for(;;){if(!(l<n&&p[l].v2(o[l])))break
q.push(l)
if(p[l] instanceof A.hs)m.B(0,l);++l}while(l<o.length){r=0
for(;;){if(!(r<p.length)){s=!1
break}if(p[r].v2(o[l])&&!m.k(0,r)){q.push(r)
if(p[r] instanceof A.hs)m.B(0,r)
s=!0
break}++r}if(!s)q.push(-1);++l}return q},
n(){var s,r,q,p=this,o=p.e,n=A.l(o).i("bs<1>")
n=A.r(new A.bs(o,n),n.i("k.E"))
B.b.av(n,p.gaed())
p.c=new A.Nh(A.j(t.sT,t.Cc),A.a([],t.y8))
p.d.aa(0)
o.aa(0)
p.f.aa(0)
B.b.aa(p.w)
B.b.aa(p.r)
o=t.SF
o=A.r(new A.c9(p.x.a,o),o.i("k.E"))
n=o.length
s=0
for(;s<o.length;o.length===n||(0,A.o)(o),++s){r=o[s]
q=r.c
if(q!=null)q.n()
q=r.c
if(q!=null)q.grE().remove()}p.x=new A.Ez(A.a([],t.EV))
o=p.y
if(o!=null)o.n()
o=p.y
if(o!=null)o.grE().remove()
p.y=null}}
