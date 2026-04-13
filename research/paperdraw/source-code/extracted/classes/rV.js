A.rV.prototype={
gA(a){var s=this.x
s===$&&A.b()
return s},
aIY(){var s=this,r=s.a4K(),q=s.x
q===$&&A.b()
if(q.m(0,r))return
s.x=r
s.aI()},
a4K(){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b=this,a=null,a0=b.d
if(a0==null||b.e==null)return B.SR
s=a0.a
r=b.e.a
a0=b.b
q=a0.B7(new A.bk(s,B.D))
p=s===r
o=p?q:a0.B7(new A.bk(r,B.D))
n=a0.F
m=n.w
m.toString
l=s>r!==(B.d2===m)
k=A.e7(B.D,s,r,!1)
j=A.a([],t.AO)
for(a0=a0.oD(k),m=a0.length,i=0;i<a0.length;a0.length===m||(0,A.o)(a0),++i){h=a0[i]
j.push(new A.M(h.a,h.b,h.c,h.d))}$label0$0:{if(p){a0=B.aCa
break $label0$0}a0=l
g=a0
if(a0){a0=B.aCB
break $label0$0}a0=!1===g
if(a0){a0=B.aCi
break $label0$0}a0=a}f=a0.a
e=a
d=a0.b
e=d
c=f
a0=n.dN()
a0=a0.gbm(a0)
n=n.dN()
n=n.gbm(n)
p=p?B.aDi:B.A9
return new A.xJ(new A.C6(q,a0,c),new A.C6(o,n,e),p,j,!0)},
rp(a){var s=this,r=A.cW(),q=s.d,p=s.e,o=a.a
switch(o.a){case 0:case 1:t.mb.a(a)
switch(a.c.a){case 0:r.sdR(s.aQ9(a.b,o===B.l9))
break
case 1:r.sdR(s.aQb(a.b,s.gaAl(),o===B.l9))
break
case 2:r.sdR(s.aQa(a.b,s.gazE(),s.gaA5(),o===B.l9))
break
case 4:case 3:break}break
case 2:s.e=s.d=null
s.f=!1
r.sdR(B.qL)
break
case 3:r.sdR(s.a5i())
break
case 4:r.sdR(s.aDl(t.hI.a(a).gZO()))
break
case 5:t.NU.a(a)
s.a5i()
r.sdR(B.aI)
s.f=!0
break
case 6:t.rQ.a(a)
r.sdR(s.aBX(a.gLD(a),a.gnc(),a.gb5y()))
break
case 7:t.GV.a(a)
r.sdR(s.aB6(a.gVT(a),a.gnc(),a.gKW(a)))
break}if(!J.e(q,s.d)||!J.e(p,s.e)){s.b.aS()
s.aIY()}return r.bi()},
abg(a,b,c,d,e){var s,r,q,p,o,n,m=this
if(a!=null)if(m.f&&d!=null&&e!=null){s=c.a
r=e.a
q=d.a
if(s!==r&&q>r!==s>r){p=s<r?a.b:a.a
o=b.$1(e)
s=o.b
m.e=r===s.a?o.a:s}else if(s<r)p=a.b
else p=s>r?a.a:d}else if(e!=null)p=c.a<e.a?a.b:a.a
else p=m.a2k(a,c)
else{if(m.f&&d!=null&&e!=null){s=c.a
r=e.a
n=d.a>r
if(s!==r&&n!==s>r){o=b.$1(e)
m.e=n?o.a:o.b}}p=null}return p==null?c:p},
abd(a,b,c,d,e){var s,r,q,p,o,n,m,l=this
if(a!=null)if(l.f&&d!=null&&e!=null){s=c.a
r=d.a
q=e.a
if(s!==r&&r>q!==s<r){p=s<r?a.b:a.a
o=b.$1(d)
s=o.b
l.d=r===s.a?o.a:s}else if(s<r)p=a.b
else p=s>r?a.a:e}else if(d!=null)p=c.a<d.a?a.b:a.a
else p=l.a2k(a,c)
else{if(l.f&&d!=null&&e!=null){s=c.a
r=d.a
n=s===r
m=r>e.a
if(m!==s<r||n){o=b.$1(d)
l.d=m?o.b:o.a}}p=null}return p==null?c:p},
aQb(a,b,c){var s,r,q,p,o,n,m,l,k=this,j=k.d,i=k.e
if(c)k.e=null
else k.d=null
s=k.b
r=s.bf(0,null)
r.iR(r)
q=A.cm(r,a)
if(k.gla().ga3(0))return A.R7(k.gla(),q)
p=k.gla()
o=s.F.w
o.toString
n=s.f8(A.R6(p,q,o))
m=k.gla().k(0,q)?b.$1(n):null
if(m!=null){s=m.b.a
p=k.a
o=p.a
if(!(s<o&&m.a.a<=o)){p=p.b
s=s>=p&&m.a.a>p}else s=!0}else s=!1
if(s)m=null
l=k.hC(c?k.abd(m,b,n,j,i):k.abg(m,b,n,j,i))
if(c)k.e=l
else k.d=l
s=l.a
p=k.a
if(s===p.b)return B.aI
if(s===p.a)return B.aS
return A.R7(k.gla(),q)},
aQ9(a,b){var s,r,q,p,o,n,m=this
if(b)m.e=null
else m.d=null
s=m.b
r=s.bf(0,null)
r.iR(r)
q=A.cm(r,a)
if(m.gla().ga3(0))return A.R7(m.gla(),q)
p=m.gla()
o=s.F.w
o.toString
n=m.hC(s.f8(A.R6(p,q,o)))
if(b)m.e=n
else m.d=n
s=n.a
p=m.a
if(s===p.b)return B.aI
if(s===p.a)return B.aS
return A.R7(m.gla(),q)},
TF(a,b,c,d,e){var s,r,q,p,o,n,m,l,k,j,i,h,g,f=this
if(f.f&&d!=null&&e!=null){s=e.a
r=s>=d.a
if(b){q=f.c
p=a.$2(c,q)
o=a.$2(r?new A.bk(s-1,e.b):e,q)
n=r?o.a.a:o.b.a
s=c.a
q=s>n
if(s<n)m=p.b
else if(q)m=p.a
else m=r?d:e
if(!r!==q)f.e=f.hC(r?o.b:o.a)
s=f.hC(m)
f.d=s
q=f.e.a
l=p.b.a
k=f.a
j=k.b
if(l>j&&p.a.a>j)return B.aI
k=k.a
if(l<k&&p.a.a<k)return B.aS
if(q>=s.a){s=o.b.a
if(l>=s)return B.b0
if(l<s)return B.aS}else{s=p.a.a
q=o.a.a
if(s<=q)return B.b0
if(s>q)return B.aI}}else{i=f.hC(c)
s=r?new A.bk(s-1,e.b):e
o=a.$2(s,f.c)
if(r&&i.a===f.a.a){f.d=i
return B.aS}s=!r
if(s&&i.a===f.a.b){f.d=i
return B.aI}if(r&&i.a===f.a.b){f.e=f.hC(o.b)
f.d=i
return B.aI}if(s&&i.a===f.a.a){f.e=f.hC(o.a)
f.d=i
return B.aS}}}else{s=f.b.jK(c)
q=f.c
h=B.c.a_(q,s.a,s.b)===$.a_4()
if(!b||h)return null
if(e!=null){p=a.$2(c,q)
s=d==null
g=!0
if(!(s&&e.a===f.a.a))if(!(J.e(d,e)&&e.a===f.a.a)){s=!s&&d.a>e.a
g=s}s=p.b
q=s.a
l=f.a
k=l.a
j=q<k
if(j&&p.a.a<k){f.d=new A.bk(k,B.D)
return B.aS}l=l.b
if(q>l&&p.a.a>l){f.d=new A.bk(l,B.D)
return B.aI}if(g){s=p.a
q=s.a
if(q<=l){f.d=f.hC(s)
return B.b0}if(q>l){f.d=new A.bk(l,B.D)
return B.aI}}else{f.d=f.hC(s)
if(j)return B.aS
if(q>=k)return B.b0}}}return null},
TE(a,b,c,d,e){var s,r,q,p,o,n,m,l,k,j,i,h,g,f=this
if(f.f&&d!=null&&e!=null){s=e.a
r=d.a
q=s>=r
if(b){s=f.c
p=a.$2(c,s)
o=a.$2(q?d:new A.bk(r-1,d.b),s)
n=q?o.b.a:o.a.a
s=c.a
r=s<n
if(r)m=p.b
else if(s>n)m=p.a
else m=q?e:d
if(!q!==r)f.d=f.hC(q?o.a:o.b)
s=f.hC(m)
f.e=s
r=f.d.a
l=p.b.a
k=f.a
j=k.b
if(l>j&&p.a.a>j)return B.aI
k=k.a
if(l<k&&p.a.a<k)return B.aS
if(s.a>=r){s=p.a.a
r=o.a.a
if(s<=r)return B.b0
if(s>r)return B.aI}else{s=o.b.a
if(l>=s)return B.b0
if(l<s)return B.aS}}else{i=f.hC(c)
s=q?d:new A.bk(r-1,d.b)
o=a.$2(s,f.c)
if(q&&i.a===f.a.a){f.d=f.hC(o.a)
f.e=i
return B.aS}s=!q
if(s&&i.a===f.a.b){f.d=f.hC(o.b)
f.e=i
return B.aI}if(q&&i.a===f.a.b){f.e=i
return B.aI}if(s&&i.a===f.a.a){f.e=i
return B.aS}}}else{s=f.b.jK(c)
r=f.c
h=B.c.a_(r,s.a,s.b)===$.a_4()
if(!b||h)return null
if(d!=null){p=a.$2(c,r)
s=e==null
g=!0
if(!(s&&d.a===f.a.b))if(!(d.m(0,e)&&d.a===f.a.b)){s=!s&&d.a>e.a
g=s}s=p.b
r=s.a
l=f.a
k=l.a
j=r<k
if(j&&p.a.a<k){f.e=new A.bk(k,B.D)
return B.aS}l=l.b
if(r>l&&p.a.a>l){f.e=new A.bk(l,B.D)
return B.aI}if(g){f.e=f.hC(s)
if(j)return B.aS
if(r>=k)return B.b0}else{s=p.a
r=s.a
if(r<=l){f.e=f.hC(s)
return B.b0}if(r>l){f.e=new A.bk(l,B.D)
return B.aI}}}}return null},
aQf(a6,a7,a8,a9,b0,b1){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4=this,a5=null
if(a4.f&&b0!=null&&b1!=null){s=b1.a>=b0.a
r=a4.a4B()
q=a4.b
if(r===q)return a4.TF(a6,a8,a9,b0,b1)
p=r.bf(0,a5)
p.iR(p)
o=A.cm(p,a7)
n=r.gG(0)
m=new A.M(0,0,0+n.a,0+n.b).k(0,o)
l=r.f8(o)
if(m){k=r.F.e.q3(!1)
j=a6.$2(l,k)
i=a6.$2(a4.qJ(r),k)
h=s?i.a.a:i.b.a
q=l.a
n=q>h
if(q<h)g=j.b
else g=n?j.a:b0
if(!s!==n)a4.e=b0
q=a4.hC(g)
a4.d=q
n=a4.e.a
f=a4.qJ(r).a
e=f+$.KL()
d=j.b.a
if(d>e&&j.a.a>e)return B.aI
if(d<f&&j.a.a<f)return B.aS
if(n>=q.a){q=j.a.a
n=i.a.a
if(q<=n)return B.b0
if(q>n)return B.aI}else{q=i.b.a
if(d>=q)return B.b0
if(d<q)return B.aS}}else{n=r.gG(0)
q=q.F.w
q.toString
c=r.f8(A.R6(new A.M(0,0,0+n.a,0+n.b),o,q))
q=a4.qJ(r).a
n=q+$.KL()
if(s&&c.a<=q){a4.d=new A.bk(a4.a.a,B.D)
return B.aS}f=!s
if(f&&c.a>=n){a4.d=new A.bk(a4.a.b,B.D)
return B.aI}if(s&&c.a>=n){a4.e=b0
a4.d=new A.bk(a4.a.b,B.D)
return B.aI}if(f&&c.a<=q){a4.e=b0
a4.d=new A.bk(a4.a.a,B.D)
return B.aS}}}else{if(a8)return a4.TF(a6,!0,a9,b0,b1)
if(b1!=null){b=a4.a4D(a7)
if(b==null)return a5
a=b.b
a0=a.f8(b.a)
a1=a.F.e.q3(!1)
q=a.jK(a0)
if(B.c.a_(a1,q.a,q.b)===$.a_4())return a5
q=b0==null
a2=!0
if(!(q&&b1.a===a4.a.a))if(!(J.e(b0,b1)&&b1.a===a4.a.a)){q=!q&&b0.a>b1.a
a2=q}a3=a6.$2(a0,a1)
q=a4.qJ(a).a
n=q+$.KL()
f=a3.b.a
e=f<q
if(e&&a3.a.a<q){a4.d=new A.bk(a4.a.a,B.D)
return B.aS}if(f>n&&a3.a.a>n){a4.d=new A.bk(a4.a.b,B.D)
return B.aI}if(a2){if(a3.a.a<=n){a4.d=new A.bk(a4.a.b,B.D)
return B.b0}a4.d=new A.bk(a4.a.b,B.D)
return B.aI}else{if(f>=q){a4.d=new A.bk(a4.a.a,B.D)
return B.b0}if(e){a4.d=new A.bk(a4.a.a,B.D)
return B.aS}}}}return a5},
aQc(a6,a7,a8,a9,b0,b1){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4=this,a5=null
if(a4.f&&b0!=null&&b1!=null){s=b1.a>=b0.a
r=a4.a4B()
q=a4.b
if(r===q)return a4.TE(a6,a8,a9,b0,b1)
p=r.bf(0,a5)
p.iR(p)
o=A.cm(p,a7)
n=r.gG(0)
m=new A.M(0,0,0+n.a,0+n.b).k(0,o)
l=r.f8(o)
if(m){k=r.F.e.q3(!1)
j=a6.$2(l,k)
i=a6.$2(a4.qJ(r),k)
h=s?i.b.a:i.a.a
q=l.a
n=q<h
if(n)g=j.b
else g=q>h?j.a:b1
if(!s!==n)a4.d=b1
q=a4.hC(g)
a4.e=q
n=a4.d.a
f=a4.qJ(r).a
e=f+$.KL()
d=j.b.a
if(d>e&&j.a.a>e)return B.aI
if(d<f&&j.a.a<f)return B.aS
if(q.a>=n){q=j.a.a
n=i.a.a
if(q<=n)return B.b0
if(q>n)return B.aI}else{q=i.b.a
if(d>=q)return B.b0
if(d<q)return B.aS}}else{n=r.gG(0)
q=q.F.w
q.toString
c=r.f8(A.R6(new A.M(0,0,0+n.a,0+n.b),o,q))
q=a4.qJ(r).a
n=q+$.KL()
if(s&&c.a<=q){a4.d=b1
a4.e=new A.bk(a4.a.a,B.D)
return B.aS}f=!s
if(f&&c.a>=n){a4.d=b1
a4.e=new A.bk(a4.a.b,B.D)
return B.aI}if(s&&c.a>=n){a4.e=new A.bk(a4.a.b,B.D)
return B.aI}if(f&&c.a<=q){a4.e=new A.bk(a4.a.a,B.D)
return B.aS}}}else{if(a8)return a4.TE(a6,!0,a9,b0,b1)
if(b0!=null){b=a4.a4D(a7)
if(b==null)return a5
a=b.b
a0=a.f8(b.a)
a1=a.F.e.q3(!1)
q=a.jK(a0)
if(B.c.a_(a1,q.a,q.b)===$.a_4())return a5
q=b1==null
a2=!0
if(!(q&&b0.a===a4.a.b))if(!(b0.m(0,b1)&&b0.a===a4.a.b)){q=!q&&b0.a>b1.a
a2=q}a3=a6.$2(a0,a1)
q=a4.qJ(a).a
n=q+$.KL()
f=a3.b.a
e=f<q
if(e&&a3.a.a<q){a4.e=new A.bk(a4.a.a,B.D)
return B.aS}if(f>n&&a3.a.a>n){a4.e=new A.bk(a4.a.b,B.D)
return B.aI}if(a2){if(f>=q){a4.e=new A.bk(a4.a.a,B.D)
return B.b0}if(e){a4.e=new A.bk(a4.a.a,B.D)
return B.aS}}else{if(a3.a.a<=n){a4.e=new A.bk(a4.a.b,B.D)
return B.b0}a4.e=new A.bk(a4.a.b,B.D)
return B.aI}}}return a5},
aQa(a,b,c,a0){var s,r,q,p,o,n,m,l,k,j,i,h,g,f=this,e=f.d,d=f.e
if(a0)f.e=null
else f.d=null
s=f.b
r=s.bf(0,null)
r.iR(r)
q=A.cm(r,a)
if(f.gla().ga3(0))return A.R7(f.gla(),q)
p=f.gla()
o=s.F
n=o.w
n.toString
m=A.R6(p,q,n)
n=s.gG(0)
o=o.w
o.toString
l=A.R6(new A.M(0,0,0+n.a,0+n.b),q,o)
k=s.f8(m)
j=s.f8(l)
if(f.aFs())if(a0){s=s.gG(0)
i=f.aQc(c,a,new A.M(0,0,0+s.a,0+s.b).k(0,q),j,e,d)}else{s=s.gG(0)
i=f.aQf(c,a,new A.M(0,0,0+s.a,0+s.b).k(0,q),j,e,d)}else if(a0){s=s.gG(0)
i=f.TE(c,new A.M(0,0,0+s.a,0+s.b).k(0,q),j,e,d)}else{s=s.gG(0)
i=f.TF(c,new A.M(0,0,0+s.a,0+s.b).k(0,q),j,e,d)}if(i!=null)return i
h=f.ati(q)?b.$1(k):null
if(h!=null){s=h.b.a
p=f.a
o=p.a
if(!(s<o&&h.a.a<=o)){p=p.b
s=s>=p&&h.a.a>p}else s=!0}else s=!1
if(s)h=null
g=f.hC(a0?f.abd(h,b,k,e,d):f.abg(h,b,k,e,d))
if(a0)f.e=g
else f.d=g
s=g.a
p=f.a
if(s===p.b)return B.aI
if(s===p.a)return B.aS
return A.R7(f.gla(),q)},
a2k(a,b){var s=b.a,r=a.b,q=a.a
return Math.abs(s-r.a)<Math.abs(s-q.a)?r:q},
aFs(){var s=this.b.d
while(s!=null){if(s instanceof A.xA)return!0
s=s.gbB(s)}return!1},
a4B(){var s,r,q,p,o,n=this.b,m=n.d
for(s=null;m!=null;){if(m instanceof A.xA){r=m.a2
if(r!=null){p=r.length
o=0
for(;;){if(!(o<p)){q=!1
break}if(r[o].f){s=m
q=!0
break}++o}if(!q)return s==null?n:s}}m=m.gbB(m)}return s==null?n:s},
a4D(a){var s,r,q,p=this.b
while(p!=null){if(p instanceof A.xA){s=p.bf(0,null)
s.iR(s)
r=A.cm(s,a)
q=p.fy
if(q==null)q=A.a3(A.a6("RenderBox was not laid out: "+A.Q(p).l(0)+"#"+A.bX(p)))
if(new A.M(0,0,0+q.a,0+q.b).k(0,r))return new A.ahI(r,p)}p=p.gbB(p)}return null},
ati(a){var s,r,q
for(s=this.gpo(),r=s.length,q=0;q<r;++q)if(s[q].k(0,a))return!0
return!1},
hC(a){var s,r=a.a,q=this.a,p=q.b
if(r<=p)s=r===p&&a.b===B.D
else s=!0
if(s)return new A.bk(p,B.cF)
q=q.a
if(r<q)return new A.bk(q,B.D)
return a},
a5i(){var s=this.a
this.d=new A.bk(s.a,B.D)
this.e=new A.bk(s.b,B.cF)
return B.qL},
aDk(a){var s=this,r=a.b,q=r.a,p=s.a,o=p.a
if(q<o&&a.a.a<=o)return B.aS
else{p=p.b
if(q>=p&&a.a.a>p)return B.aI}s.d=r
s.e=a.a
s.f=!0
return B.b0},
Pp(a,b){var s=A.cW(),r=A.cW(),q=b.a,p=a.b
if(q>p){q=new A.bk(q,B.D)
r.sdR(q)
s.sdR(q)}else{s.sdR(new A.bk(a.a,B.D))
r.sdR(new A.bk(p,B.cF))}q=s.bi()
return new A.ahC(r.bi(),q)},
aDl(a){var s=this,r=s.b,q=r.f8(r.eL(a))
if(s.aKj(q)&&!J.e(s.d,s.e))return B.b0
return s.aDk(s.a4R(q))},
a4R(a){return this.Pp(this.b.jK(a),a)},
qJ(a){var s=this.b,r=s.bf(0,a)
s=s.gG(0)
return a.f8(A.cm(r,new A.M(0,0,0+s.a,0+s.b).gacJ()))},
aA6(a,b){var s,r=new A.xe(b),q=a.a,p=b.length,o=r.i6(q===p||a.b===B.cF?q-1:q)
if(o==null)o=0
s=r.i7(q)
return this.Pp(new A.dT(o,s==null?p:s),a)},
azF(a){var s,r,q=this.c,p=new A.xe(q),o=a.a,n=q.length,m=p.i6(o===n||a.b===B.cF?o-1:o)
if(m==null)m=0
s=p.i7(o)
n=s==null?n:s
q=this.a
r=q.a
if(m<r)m=r
else{o=q.b
if(m>o)m=o}s=q.b
if(n>s)n=s
else if(n<r)n=r
return this.Pp(new A.dT(m,n),a)},
aB6(a,b,c){var s,r,q,p,o,n,m,l,k=this,j=k.b,i=j.bf(0,null)
if(i.iR(i)===0)switch(c){case B.A6:case B.uL:return B.aS
case B.A7:case B.uK:return B.aI}s=A.cm(i,new A.i(a,0)).a
switch(c){case B.A6:case B.A7:if(b){j=k.e
j.toString
r=j}else{j=k.d
j.toString
r=j}q=k.aEt(r,!1,s)
p=q.a
o=q.b
break
case B.uK:case B.uL:n=k.e
if(n==null){n=new A.bk(k.a.b,B.cF)
k.e=n
r=n}else r=n
n=k.d
if(n==null){k.d=r
m=r}else m=n
l=j.B7(b?r:m)
n=j.F.dN()
p=j.f8(new A.i(s,l.b-n.gbm(n)/2))
o=B.b0
break
default:p=null
o=null}if(b)k.e=p
else k.d=p
return o},
aBX(a,b,c){var s,r,q,p,o,n,m=this,l=m.e
if(l==null){l=m.a
l=a?new A.bk(l.a,B.D):new A.bk(l.b,B.cF)
m.e=l
s=l}else s=l
l=m.d
if(l==null){m.d=s
r=s}else r=l
s=b?s:r
if(a&&s.a===m.a.b)return B.aI
l=!a
if(l&&s.a===m.a.a)return B.aS
switch(c){case B.AY:l=m.a
q=m.I9(s,a,new A.Ee(B.c.a_(m.c,l.a,l.b)))
p=B.b0
break
case B.aHF:l=m.b.F
o=l.e
o.toString
q=m.I9(s,a,new A.Ia(o,l.b.a.c).gagY())
p=B.b0
break
case B.UB:l=m.a
q=m.I9(s,a,new A.xe(B.c.a_(m.c,l.a,l.b)))
p=B.b0
break
case B.aHG:q=m.aH2(s,a,new A.FN(m))
p=B.b0
break
case B.aHH:o=m.a
n=o.a
o=o.b
q=m.I9(s,a,new A.N0(B.c.a_(m.c,n,o)))
if(a&&q.a===o)p=B.aI
else p=l&&q.a===n?B.aS:B.b0
break
default:p=null
q=null}if(b)m.e=q
else m.d=q
return p},
I9(a,b,c){var s,r=a.a
if(b){r=c.i7(r)
s=r==null?this.a.b:r}else{r=c.i6(r-1)
s=r==null?this.a.a:r}return new A.bk(s,B.D)},
aH2(a,b,c){var s,r,q,p,o=this
switch(a.b.a){case 0:s=a.a
if(s<1&&!b)return B.r_
r=o.a.a
s=new A.Ee(o.c).i6(r+s)
if(s==null)s=r
q=Math.max(0,s)-1
break
case 1:q=a.a
break
default:q=null}if(b){s=c.i7(q)
p=s==null?o.a.b:s}else{s=c.i6(q)
p=s==null?o.a.a:s}return new A.bk(p,B.D)},
aEt(a,b,c){var s,r,q,p,o,n=this,m=n.b,l=m.F.uz(),k=m.oE(a,B.aT),j=l.length,i=j-1
for(s=k.b,r=0;r<l.length;l.length===j||(0,A.o)(l),++r){q=l[r]
if(q.gnK()>s){i=q.gMf(q)
break}}if(b&&i===l.length-1)p=new A.bk(n.a.b,B.cF)
else if(!b&&i===0)p=new A.bk(n.a.a,B.D)
else p=n.hC(m.f8(new A.i(c,l[b?i+1:i-1].gnK())))
m=p.a
j=n.a
if(m===j.a)o=B.aS
else o=m===j.b?B.aI:B.b0
return new A.as(p,o,t.UH)},
aKj(a){var s,r,q,p,o=this
if(o.d==null||o.e==null)return!1
s=A.cW()
r=A.cW()
q=o.d
q.toString
p=o.e
p.toString
if(A.bDH(q,p)>0){s.b=q
r.b=p}else{s.b=p
r.b=q}return A.bDH(s.bi(),a)>=0&&A.bDH(r.bi(),a)<=0},
bf(a,b){return this.b.bf(0,b)},
om(a,b){if(this.b.y==null)return},
gpo(){var s,r,q,p,o,n,m,l=this
if(l.y==null){s=l.b
r=l.a
q=r.a
p=s.Zr(A.e7(B.D,q,r.b,!1),B.CR)
r=t.AO
if(p.length!==0){l.y=A.a([],r)
for(s=p.length,o=0;o<p.length;p.length===s||(0,A.o)(p),++o){n=p[o]
l.y.push(new A.M(n.a,n.b,n.c,n.d))}}else{m=s.B7(new A.bk(q,B.D))
s=s.F.dN()
l.y=A.a([A.nQ(m,new A.i(m.a+0,m.b+-s.gbm(s)))],r)}}s=l.y
s.toString
return s},
gla(){var s,r,q,p,o,n,m=this,l=m.z
if(l==null){l=m.b
s=m.a
r=s.a
q=l.oD(A.e7(B.D,r,s.b,!1))
if(q.length!==0){l=B.b.gS(q)
p=new A.M(l.a,l.b,l.c,l.d)
for(l=q.length,o=1;o<l;++o){s=q[o]
p=p.h2(new A.M(s.a,s.b,s.c,s.d))}m.z=p
l=p}else{n=l.B7(new A.bk(r,B.D))
l=l.F.dN()
l=A.nQ(n,new A.i(n.a+0,n.b+-l.gbm(l)))
m.z=l}}return l},
aX(a,b){var s,r,q,p,o,n,m,l,k=this,j=k.d
if(j==null||k.e==null)return
s=k.b
r=s.aV
if(r!=null){q=A.e7(B.D,j.a,k.e.a,!1)
$.am()
p=A.ba()
p.b=B.eu
p.r=r.gA(0)
for(j=s.oD(q),s=j.length,o=0;o<j.length;j.length===s||(0,A.o)(j),++o){n=j[o]
if(a.e==null)a.T3()
r=a.e
r.toString
m=new A.M(n.a,n.b,n.c,n.d).e4(b)
l=p.dg()
r.a.drawRect(A.el(m),l)
l.delete()}}},
zT(a){var s=this.b.F.b.a.c.Oa(a),r=this.a,q=r.a
r=r.b
return A.e7(B.D,B.e.t(s.a,q,r),B.e.t(s.b,q,r),!1)},
$iaT:1}
