A.GR.prototype={
saT8(a){var s=this.a8.a
if(s===0)return
s=A.fH(null,null,null,t.S,t.PA)
this.a8=s
this.a9()},
saW8(a){if(this.a2===a)return
this.a2=a
this.a9()},
sbO(a){if(this.aj===a)return
this.aj=a
this.a9()},
saSh(a,b){if(J.e(this.ai,b))return
this.ai=b
this.aS()},
saiz(a){var s,r,q,p=this,o=p.am
if(o==null?a==null:o===a)return
p.am=a
o=p.aV
if(o!=null)for(s=o.length,r=0;r<s;++r){q=o[r]
if(q!=null)q.n()}o=p.am
p.aV=o!=null?A.bB(o.length,null,!1,t.ls):null},
snR(a){if(a.m(0,this.aP))return
this.aP=a
this.aS()},
saW9(a){if(this.aJ===a)return
this.aJ=a
this.a9()},
sYw(a,b){return},
fJ(a){if(!(a.b instanceof A.rv))a.b=new A.rv(B.l)},
fb(a){this.jg(a)
a.y1=B.aDD
a.e=a.a=a.r=!0},
un(c2,c3,c4){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,b0,b1,b2,b3,b4,b5,b6=this,b7=null,b8=t.QF,b9=A.a([],b8),c0=b6.X,c1=J.wU(c0,t.bG)
for(s=t.Vv,r=0;r<c0;++r){q=b6.U
p=A.a(new Array(q),s)
for(o=0;o<q;++o)p[o]=A.a([],b8)
c1[r]=p}n=new A.aPz()
m=new A.aPy(b6)
l=new A.aPx(b6)
k=new A.aPA()
for(s=c4.length,j=b6.ca,i=0;i<c4.length;c4.length===s||(0,A.o)(c4),++i){h=c4[i]
if(j.ae(0,h.b)){g=j.h(0,h.b)
f=g.a
e=g.b
if(f<b6.X&&e<b6.U)c1[f][e].push(h)}else{d=n.$1(h)
f=m.$1(d.b)
e=l.$1(d.a)
if(f!==-1&&e!==-1)c1[f][e].push(h)}}for(s=b6.af,c=b6.a5,b=b6.c7,f=0;f<b6.X;f=a1){a=s[f]
a0=b6.fy
a0=(a0==null?A.a3(A.a6("RenderBox was not laid out: "+A.Q(b6).l(0)+"#"+A.bX(b6))):a0).a
a1=f+1
a2=s[a1]
a3=a2-a
if(a3===0)continue
a4=b.h(0,f)
if(a4==null){a4=A.Ca(b7,new A.aPw(b6,new A.M(0,a,a0,a2)))
b.j(0,f,a4)}a5=A.a([],b8)
for(a2=a3+1e-10,a3=0+a3,e=0;e<b6.U;++e){a6=c1[f][e]
a7=a6.length
if(a7===0)continue
if(a7<=1)a8=B.b.geB(a6).y2!==B.Ac&&B.b.geB(a6).y2!==B.aDE
else a8=!0
if(a8){a7=c.h(0,new A.J2(f,e))
if(a7==null){a7=A.Ca(b7,b7)
a9=A.ko()
a9.y1=B.Ac
a9.r=!0
a7.mr(0,a6,a9)
c.j(0,new A.J2(f,e),a7)
b0=a7}else b0=a7}else b0=B.b.geB(a6)
a7=b6.U
a9=b6.b6
if(e===a7-1){a9.toString
b1=a0-J.k3(a9,e)}else{a9.toString
a7=J.k3(a9,e+1)
a9=b6.b6
a9.toString
b1=a7-J.k3(a9,e)}if(b1<=0)continue
if(a8){a7=b6.b6
a7.toString
a7=J.k3(a7,e)
a9=new Float64Array(16)
b2=new A.bu(a9)
b2.dh()
a9[14]=0
a9[13]=0
a9[12]=a7
if(!A.aJD(b0.d,b2)){a7=A.OP(b2)
b0.d=a7?b7:b2
b0.ji()}a7=new A.M(0,0,0+b1,a3)
if(!b0.e.m(0,a7)){b0.e=a7
b0.ji()}}for(a7=a6.length,i=0;i<a6.length;a6.length===a7||(0,A.o)(a6),++i){h=a6[i]
j.j(0,h.b,new A.J2(f,e))
b3=n.$1(h)
b4=b3.d>a2?-s[f]:0
b5=0
if(a8){if(b3.a>=b1){a9=b6.b6
a9.toString
a9=J.bVF(J.k3(a9,e))
b5=a9}}else{a9=b3.c
b2=b6.b6
b2.toString
if(a9<=J.k3(b2,e)){a9=b6.b6
a9.toString
a9=J.k3(a9,e)
b5=a9}}if(b5!==0||b4!==0)k.$3(h,b5,b4)}b0.w=e
a5.push(b0)}a2=A.ko()
a2.p4=f
a2.r=!0
a2.y1=B.T0
a4.mr(0,a5,a2)
a2=new Float64Array(16)
a7=new A.bu(a2)
a7.dh()
a2[14]=0
a2[13]=a
a2[12]=0
if(!A.aJD(a4.d,a7)){a=A.OP(a7)
a4.d=a?b7:a7
a4.ji()}a=new A.M(0,0,0+a0,a3)
if(!a4.e.m(0,a)){a4.e=a
a4.ji()}b9.push(a4)}c2.mr(0,b9,c3)},
aly(a,b){var s,r,q,p,o,n,m,l,k=this,j=k.F
if(b===j&&a===k.U)return
if(a===0||b.length===0){k.U=a
s=j.length
if(s===0)return
for(r=0;r<j.length;j.length===s||(0,A.o)(j),++r){q=j[r]
if(q!=null)k.n0(q)}k.X=0
B.b.aa(k.F)
k.a9()
return}p=A.f8(t.x)
for(o=0;o<k.X;++o)for(j=o*a,n=0;s=k.U,n<s;++n){m=n+j
s=k.F[n+o*s]
if(s!=null)l=n>=a||m>=b.length||s!==b[m]
else l=!1
if(l)p.B(0,s)}for(o=0;j=o*a,j<b.length;){for(n=0;n<a;++n){m=n+j
s=k.U
l=b[m]
if(l!=null)s=n>=s||o>=k.X||k.F[n+o*s]!==l
else s=!1
if(s)if(!p.L(0,l)){s=b[m]
s.toString
k.jT(s)}}++o}p.av(0,k.gaX9())
k.U=a
k.X=B.e.iE(b.length,a)
j=A.r(b,t.aA)
k.F=j
k.a9()},
a_3(a,b,c){var s,r=this,q=a+b*r.U,p=r.F[q]
if(p==c)return
if(p!=null)r.n0(p)
s=r.F
s.$flags&2&&A.aR(s)
s[q]=c
if(c!=null)r.jT(c)},
aK(a){var s,r,q,p
this.ee(a)
for(s=this.F,r=s.length,q=0;q<s.length;s.length===r||(0,A.o)(s),++q){p=s[q]
if(p!=null)p.aK(a)}},
aC(a){var s,r,q,p,o,n=this
n.e6(0)
s=n.aV
if(s!=null){for(r=s.length,q=0;q<r;++q){p=s[q]
if(p!=null)p.n()}n.aV=A.bB(n.am.length,null,!1,t.ls)}for(s=n.F,r=s.length,q=0;q<s.length;s.length===r||(0,A.o)(s),++q){o=s[q]
if(o!=null)o.aC(0)}},
cb(a){var s,r,q,p
for(s=this.F,r=s.length,q=0;q<s.length;s.length===r||(0,A.o)(s),++q){p=s[q]
if(p!=null)a.$1(p)}},
ix(){this.cb(this.gNj())},
by(a){var s
for(s=0;s<this.U;++s){this.a8.h(0,s)
this.Ke(s)}return 0},
bu(a){var s
for(s=0;s<this.U;++s){this.a8.h(0,s)
this.Ke(s)}return 0},
bx(a){var s,r,q,p,o,n,m,l,k=this,j=k.GM(A.k6(1/0,a))
for(s=0,r=0;r<k.X;++r){for(q=0,p=0;o=k.U,p<o;++p){n=k.F[p+r*o]
if(n!=null){o=j[p]
m=n.gc9()
l=B.d4.em(n.dy,o,m)
q=Math.max(q,l)}}s+=q}return s},
bt(a){return this.aw(B.c5,a,this.gbP())},
ho(a){return this.W},
Ke(a){return new A.ju(this.aT7(a),t.bm)},
aT7(a){var s=this
return function(){var r=a
var q=0,p=1,o=[],n,m,l
return function $async$Ke(b,c,d){if(c===1){o.push(d)
q=p}for(;;)switch(q){case 0:n=0
case 2:if(!(n<s.X)){q=4
break}m=s.U
l=s.F[r+n*m]
q=l!=null?5:6
break
case 5:q=7
return b.b=l,1
case 7:case 6:case 3:++n
q=2
break
case 4:return 0
case 1:return b.c=o.at(-1),3}}}},
GM(a3){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b=this,a=t.i,a0=A.bB(b.U,0,!1,a),a1=A.bB(b.U,0,!1,a),a2=A.bB(b.U,null,!1,t.PM)
for(s=0,r=0;q=b.U,r<q;++r){b.a8.h(0,r)
b.Ke(r)
a0[r]=0
a1[r]=0
a2[r]=1;++s}p=a3.b
o=a3.a
n=0
if(s>0){m=isFinite(p)?p:o
if(0<m)for(r=0;r<q;++r){a=a2[r]
if(a!=null){l=m*a/s
a=a0[r]
if(a<l){n+=l-a
a0[r]=l}}}}else if(0<o){k=o/q
for(r=0;r<q;++r)a0[r]=a0[r]+k
n=o}if(n>p){j=n-p
i=q
for(;;){if(!(j>1e-10&&s>1e-10))break
for(h=0,r=0;r<q;++r){a=a2[r]
if(a!=null){g=a0[r]
f=g-j*a/s
e=a1[r]
if(f<=e){j-=g-e
a0[r]=e
a2[r]=null;--i}else{j-=g-f
a0[r]=f
h+=a}}}s=h}for(;;){if(!(j>1e-10&&i>0))break
k=j/i
for(d=0,r=0;r<q;++r){a=a0[r]
g=a1[r]
c=a-g
if(c>0)if(c<=k){j-=c
a0[r]=g}else{j-=k
a0[r]=a-k;++d}}i=d}}return a0},
e_(a,b){var s,r,q,p,o,n,m,l,k,j,i=this,h=null
if(i.X*i.U===0)return h
s=i.GM(a)
for(r=t.o3,q=h,p=0;p<i.U;++p){o=i.F[p]
n=A.fQ(h,s[p])
if(o==null)continue
m=o.b
m.toString
r.a(m)
l=i.aJ
$label0$1:{m=h
if(B.aHo===l){m=o.gtL()
k=B.kt.em(o.dy,new A.aH(n,b),m)
m=k
break $label0$1}if(B.aHm===l||B.v7===l||B.aHn===l||B.aHp===l||B.aHq===l)break $label0$1}if(m!=null)j=q==null||q<m
else j=!1
if(j)q=m}return q},
cI(a){var s,r,q,p,o,n,m,l,k,j,i,h=this
if(h.X*h.U===0)return a.bk(B.aa)
s=h.GM(a)
r=B.b.co(s,0,new A.aPB())
for(q=t.o3,p=0,o=0;o<h.X;++o){for(n=0,m=0;l=h.U,m<l;++m){k=h.F[m+o*l]
if(k!=null){l=k.b
l.toString
q.a(l)
l=h.aJ
switch(l.a){case 3:return B.aa
case 0:case 1:case 2:case 5:l=A.fQ(null,s[m])
j=k.gcr()
i=B.au.em(k.dy,l,j)
n=Math.max(n,i.b)
break
case 4:break}}}p+=n}return a.bk(new A.K(r,p))},
bU(){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2=this,a3="RenderBox was not laid out: ",a4=t.k.a(A.P.prototype.gah.call(a2)),a5=a2.X,a6=a2.U
if(a5*a6===0){a2.cu=0
a2.fy=a4.bk(B.aa)
return}s=a2.GM(a4)
r=t.i
q=A.bB(a6,0,!1,r)
switch(a2.aj.a){case 0:q[a6-1]=0
for(p=a6-2;p>=0;--p){o=p+1
q[p]=q[o]+s[o]}a2.b6=new A.cy(q,A.v(q).i("cy<1>"))
a2.cu=B.b.gS(q)+B.b.gS(s)
break
case 1:q[0]=0
for(p=1;p<a6;++p){o=p-1
q[p]=q[o]+s[o]}a2.b6=q
a2.cu=B.b.gY(q)+B.b.gY(s)
break}o=a2.af
B.b.aa(o)
a2.W=null
for(n=t.o3,m=0,l=0;l<a5;++l,m=a){o.push(m)
k=A.bB(a6,0,!1,r)
for(j=l*a6,i=0,h=!1,g=0,f=0,p=0;p<a6;++p){e=a2.F[p+j]
if(e!=null){d=e.b
d.toString
n.a(d)
c=a2.aJ
switch(c.a){case 3:e.cG(A.fQ(null,s[p]),!0)
c=a2.bT
c.toString
b=e.zO(c,!0)
c=e.fy
if(b!=null){g=Math.max(g,b)
f=Math.max(f,(c==null?A.a3(A.a6(a3+A.Q(e).l(0)+"#"+A.bX(e))):c).b-b)
k[p]=b
h=!0}else{i=Math.max(i,(c==null?A.a3(A.a6(a3+A.Q(e).l(0)+"#"+A.bX(e))):c).b)
d.a=new A.i(q[p],m)}break
case 0:case 1:case 2:case 5:e.cG(A.fQ(null,s[p]),!0)
d=e.fy
i=Math.max(i,(d==null?A.a3(A.a6(a3+A.Q(e).l(0)+"#"+A.bX(e))):d).b)
break
case 4:break}}}if(h){if(l===0)a2.W=g
i=Math.max(i,g+f)}for(a=m+i,d=m+g,p=0;p<a6;++p){e=a2.F[p+j]
if(e!=null){c=e.b
c.toString
n.a(c)
a0=a2.aJ
switch(a0.a){case 3:c.a=new A.i(q[p],d-k[p])
break
case 0:c.a=new A.i(q[p],m)
break
case 1:a0=q[p]
a1=e.fy
c.a=new A.i(a0,m+(i-(a1==null?A.a3(A.a6(a3+A.Q(e).l(0)+"#"+A.bX(e))):a1).b)/2)
break
case 2:a0=q[p]
a1=e.fy
c.a=new A.i(a0,a-(a1==null?A.a3(A.a6(a3+A.Q(e).l(0)+"#"+A.bX(e))):a1).b)
break
case 4:case 5:e.hJ(A.fQ(i,s[p]))
c.a=new A.i(q[p],m)
break}}}}o.push(m)
r=a2.cu
r===$&&A.b()
a2.fy=a4.bk(new A.K(r,m))},
dv(a,b){var s,r,q,p
for(s=this.F.length-1,r=t.r;s>=0;--s){q=this.F[s]
if(q!=null){p=q.b
p.toString
if(a.lf(new A.aPC(q),r.a(p).a,b))return!0}}return!1},
aX(a,b){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e=this
if(e.X*e.U===0){s=e.ai
if(s!=null){r=b.a
q=b.b
p=e.cu
p===$&&A.b()
s.ahq(a.gbH(0),new A.M(r,q,r+p,q+0),B.u3,B.u3)}return}if(e.am!=null){o=a.gbH(0)
for(s=e.af,r=b.a,q=b.b,p=e.geI(),n=0;n<e.X;++n){m=e.am
if(m.length<=n)break
m=m[n]
if(m!=null){l=e.aV
if(l[n]==null)l[n]=m.Da(p)
m=e.aV[n]
m.toString
l=s[n]
k=e.aP
j=e.fy
if(j==null)j=A.a3(A.a6("RenderBox was not laid out: "+A.Q(e).l(0)+"#"+A.bX(e)))
m.kR(o,new A.i(r,q+l),k.y8(new A.K(j.a,s[n+1]-l)))}}}for(s=t.r,r=b.a,q=b.b,i=0;p=e.F,i<p.length;++i){h=p[i]
if(h!=null){p=h.b
p.toString
p=s.a(p).a
a.e3(h,new A.i(p.a+r,p.b+q))}}if(e.ai!=null){s=e.cu
s===$&&A.b()
p=e.af
m=B.b.gY(p)
l=p.length
k=l-1
A.ew(1,k,l,null,null)
g=A.cD(p,1,k,A.v(p).c)
p=e.b6
p.toString
f=J.vL(p,1)
p=e.ai
p.toString
p.ahq(a.gbH(0),new A.M(r,q,r+s,q+m),f,g)}}}
