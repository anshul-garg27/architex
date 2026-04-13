A.ll.prototype={
gpV(){return this},
gpX(){if(this.b.gmw()==null)return!1
return this.as==null},
glY(){return this.gtu()?null:this.ax.ghq()},
gKi(){var s=this.ax
return s.ghq().r||this.e||s.ghq().a||this.b.gmw()==null},
gtu(){var s=this
if(s.ax.ghq().a)return!0
if(s.b.gmw()==null)return!0
if(!s.gKi())return!1
return s.as.c||s.c},
gag7(){var s,r=this,q=r.d
if(q!=null)return q
q=r.ax
s=q.ghq().f
r.d=s
if(s)return!0
if(q.ghq().a)return!1
r.b.i1(new A.bh3(r))
q=r.d
q.toString
return q},
alT(a){return a.gb_H()},
dn(){var s,r,q,p,o,n,m,l=this,k=l.f=!1
if(!l.gpX()?!l.gtu():k)return
for(k=l.z,s=k.length,r=t.ju,q=0;q<k.length;k.length===s||(0,A.o)(k),++q)for(p=J.jv(k[q],r),o=J.ar(p.a),p=p.$ti,n=new A.n2(o,p.i("n2<1>")),p=p.c;n.p();){m=p.a(o.gH(o))
if(m.gpX())continue
if(!m.gtu())m.dn()}},
NM(){var s,r,q,p,o,n,m,l,k,j,i,h,g=this,f=null,e=g.ax
e.d=e.gcg()
e.b=!1
s=g.aAh()
r=!0
if(g.b.gmw()!=null)if(!e.ghq().e){if(!g.gKi()){q=g.as
q=q==null?f:q.c
q=q!==!1}else q=!1
r=q}q=g.as
q=q==null?f:q.b
p=q===!0||e.ghq().d
o=e.ghq().b
if(o==null){q=g.as
o=q==null?f:q.e}q=g.z
B.b.aa(q)
n=g.x
B.b.aa(n)
m=g.as
m=m==null?f:m.a
l=g.avt(new A.Xq(m===!0||e.ghq().x1,p,r,s,o))
k=l.a
B.b.q(n,k)
B.b.q(q,l.b)
j=g.y
B.b.aa(j)
if(g.gKi()){g.RL(n,!0)
B.b.av(q,g.gaGo())
e.aQX(new A.c9(new A.q(n,new A.bh4(),A.v(n).i("q<1,hR?>")),t.t5))
B.b.aa(n)
n.push(g)
for(n=B.b.gT(k),m=new A.n2(n,t.Zw),k=t.ju;m.p();){i=k.a(n.gH(0))
if(i.gtu())j.push(i)
else{B.b.q(j,i.y)
B.b.q(q,i.z)}}q=g.as
h=q==null?f:q.d
if(h!=null)e.Fe(new A.bh5(h))
if(p!==e.ghq().d)e.Fe(new A.bh6(p))
if(!J.e(o,e.ghq().c))e.Fe(new A.bh7(o))}},
a4z(){var s=A.a([],t.z_)
this.b.i1(new A.bgY(s))
return s},
aAh(){var s,r,q=this
if(q.gKi()){s=q.ax.gcg().a5
return s==null?null:s.cK(0)}s=q.ax
r=s.gcg().a5!=null?s.gcg().a5.cK(0):null
s=q.as
if((s==null?null:s.d)!=null)if(r==null)r=s.d
else{s=s.d
s.toString
r.q(0,s)}return r},
avt(a1){var s,r,q,p,o,n,m,l,k,j,i=this,h=A.a([],t.ga),g=A.a([],t.fQ),f=A.a([],t.q1),e=i.ax.ghq().p2,d=e!=null,c=t.vC,b=A.j(t.VR,c),a=d&&a1.c,a0=a?new A.Xq(a1.a,a1.b,!1,a1.d,a1.e):a1
for(s=i.a4z(),r=s.length,q=0;q<s.length;s.length===r||(0,A.o)(s),++q){p=s[q]
p.a3e(a0)
for(o=p.x,n=o.length,m=0;m<o.length;o.length===n||(0,A.o)(o),++m){l=o[m]
if(d&&l.glY()!=null){k=l.glY()
k.toString
f.push(k)
k=l.glY()
k.toString
b.j(0,k,l)}else h.push(l)}o=p.ax
n=o.d
if(n==null){if(o.c==null){n=A.ko()
o.d=o.c=n
o.a.fb(n)}n=o.c
n.toString}k=!0
if(!n.r)if(!p.e){n=o.d
if(n==null){if(o.c==null){n=A.ko()
o.d=o.c=n
o.a.fb(n)}o=o.c
o.toString}else o=n
o=o.a||p.b.gmw()==null}else o=k
else o=k
if(!o)B.b.q(g,p.z)}s=i.e=!1
if(d){j=e.$1(f)
r=j.a
B.b.q(h,new A.q(r,new A.bgW(i,b),A.v(r).i("q<1,hB>")))
for(r=j.b,o=r.length,q=0;q<r.length;r.length===o||(0,A.o)(r),++q)g.push(J.cq(r[q],new A.bgX(i,b),c).bL(0))}if(!i.e?a:s){B.b.aa(h)
B.b.aa(g)
for(c=i.a4z(),s=c.length,q=0;q<c.length;c.length===s||(0,A.o)(c),++q){p=c[q]
p.a3e(a1)
B.b.q(h,p.x)
r=p.ax
o=r.d
if(o==null){if(r.c==null){o=A.ko()
r.d=r.c=o
r.a.fb(o)}o=r.c
o.toString}n=!0
if(!o.r)if(!p.e){o=r.d
if(o==null){if(r.c==null){o=A.ko()
r.d=r.c=o
r.a.fb(o)}r=r.c
r.toString}else r=o
r=r.a||p.b.gmw()==null}else r=n
else r=n
if(!r)B.b.q(g,p.z)}}return new A.aH(h,g)},
a3e(a){var s=this
if(J.e(s.as,a))return
s.at=null
s.dn()
s.as=a
s.NM()},
Xm(a){this.c=a},
aaH(){var s,r,q,p,o,n,m,l,k=this,j=k.at
for(s=k.y,r=s.length,q=j.c,p=j.b,o=0;o<s.length;s.length===r||(0,A.o)(s),++o){n=s[o]
n.aaW(A.bDI(n,k,q,p,null))}for(s=k.z,r=t.fG,r=new A.nv(new A.c9(new A.e4(s,new A.bh0(),A.v(s).i("e4<1,hB>")),r).gT(0),new A.bh1(),B.mZ,r.i("nv<k.E,ll>")),s=j.a,m=t.ju;r.p();){l=r.d
if(l==null)l=m.a(l)
l.aaW(A.bDI(l,k,q,p,s))}},
aaW(a){var s,r,q,p,o=this,n=o.at
o.at=a
o.dn()
if(n!=null){s=o.ax
if(!s.gcg().W.ax){r=o.as
r=r==null?null:r.a
q=r!==!0&&a.e}else q=!0
r=n.d
p=a.d
p=new A.K(r.c-r.a,r.d-r.b).m(0,new A.K(p.c-p.a,p.d-p.b))
s=s.ghq().W.ax===q
if(p&&s)return}o.aaH()},
PF(a){var s,r,q,p,o,n,m,l=this,k=null,j=l.r
if(j!=null)for(s=l.w,r=s.length,q=0;q<r;++q){p=s[q]
if(p!==j)p.dy=null}if(!l.f){j=l.w
B.b.aa(j)
l.Q.aa(0)
l.f=!0
p=l.r
if(p==null)p=l.r=l.awA()
j.push(p)
s=l.as
s=s==null?k:s.a
p.sX2(s===!0)
s=l.as
p.dy=s==null?k:s.d
l.aQi()
l.aGI(a)
l.a1K(j,a)}j=l.r
j.toString
for(s=l.w,r=s.length,o=t.g3,q=0;q<s.length;s.length===r||(0,A.o)(s),++q){p=s[q]
if(p!==j){n=l.as
if((n==null?k:n.d)!=null){m=p.dy
if(m==null)m=p.dy=A.ak(o)
n=n.d
n.toString
m.q(0,n)}else{n=p.dy
n=n==null?k:n.ga3(n)
if(n===!0)p.dy=null}}}},
a1K(a,b){var s,r,q,p,o,n=this,m=A.a([],t.QF)
for(s=n.y,r=s.length,q=0;q<s.length;s.length===r||(0,A.o)(s),++q){p=s[q]
o=p.r
if(o!=null&&b.k(0,o.b)){p.dn()
p.r=null}p.PF(b)
B.b.q(m,p.w)}s=n.r
s.toString
B.b.j4(m,n.galS())
r=n.ax
if(r.ghq().a)n.b.un(s,r.ghq(),m)
else s.mr(0,m,r.ghq())},
aud(a){return this.a1K(null,a)},
awA(){var s,r,q=this.b
if(q.gmw()==null){s=q.gwo()
q=q.y.at
q.toString
r=$.bAo()
r=new A.e6(null,0,s,B.aT,r.x1,r.w,r.x2,r.x,B.uS,r.xr,r.y2,r.aZ,r.bj,r.F,r.U,r.X,r.a2,r.ai,r.aj,r.y1,r.bT,r.ca,r.c7)
r.aK(q)
return r}return A.Ca(null,q.gwo())},
aGI(a6){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4=this,a5=null
for(s=a4.z,r=s.length,q=t.QF,p=t.z_,o=a4.Q,n=a4.w,m=t.wW,l=t.Hx,k=l.i("e4<k.E,hc>"),j=k.i("k.E"),i=a4.b,h=0;h<s.length;s.length===r||(0,A.o)(s),++h){g=s[h]
f=A.a([],p)
for(e=J.bZ(g),d=e.gT(g),c=a5,b=c;d.p();){a=d.gH(d)
if(a instanceof A.ll){if(a.gtu()){f.push(a)
continue}B.b.q(f,a.y)}if(a.glY()!=null){if(c==null)c=a.gpV().r
if(b==null)b=A.ko()
a=a.glY()
a.toString
b.r3(a)}}a0=A.a([],q)
for(d=f.length,a1=0;a1<f.length;f.length===d||(0,A.o)(f),++a1){a2=f[a1]
a2.PF(a6)
B.b.q(a0,a2.w)}if(b!=null){if(c==null||a6.k(0,c.b))c=A.Ca(a5,i.gwo())
a6.B(0,c.b)
for(d=e.gT(g);d.p();){a=d.gH(d)
if(a.glY()!=null){a.gpV().f=!0
a.gpV().r=c}}c.mr(0,a0,b)
o.j(0,c,g)
n.push(c)
e=e.cp(g,new A.bgZ(),m)
a3=A.hu(j)
a3.q(0,new A.e4(new A.c9(e,l),new A.bh_(),k))
if(a3.a!==0){e=c.dy
if(e==null)c.dy=a3
else e.q(0,a3)}e=a4.as
e=e==null?a5:e.a
c.sX2(e===!0)}}a4.aQj()},
aQi(){var s,r,q,p,o=this,n=o.r
n.toString
s=o.at
s.toString
r=o.ax
if(!r.gcg().W.ax){q=o.as
q=q==null?null:q.a
p=q!==!0&&s.e}else p=!0
n.sbJ(0,s.d)
n.scQ(0,s.a)
n.f=s.b
n.r=s.c
if(r.ghq().W.ax!==p)r.Fe(new A.bh2(p))},
aQj(){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c=null,b=this.at
b.toString
for(s=this.Q,s=new A.br(s,A.l(s).i("br<1,2>")).gT(0),r=b.a,q=b.b,b=b.c;s.p();){p=s.d
for(o=J.ar(p.b),n=c,m=n,l=m;o.p();){k=o.gH(o)
if(k.gpV().gtu())continue
j=A.bDI(k.gpV(),this,b,q,r)
i=j.b
h=i==null
g=h?c:i.fk(k.gpV().b.gkm())
if(g==null)g=k.gpV().b.gkm()
k=j.a
f=A.hn(k,g)
l=l==null?c:l.h2(f)
if(l==null)l=f
if(!h){e=A.hn(k,i)
m=m==null?c:m.fk(e)
if(m==null)m=e}i=j.c
if(i!=null){e=A.hn(k,i)
n=n==null?c:n.fk(e)
if(n==null)n=e}}d=p.a
l.toString
if(!d.e.m(0,l)){d.e=l
d.ji()}if(!A.aJD(d.d,c)){d.d=null
d.ji()}d.f=m
d.r=n}},
b0F(){var s,r,q,p,o,n,m,l,k=this,j=k.r!=null
if(j){s=k.ax.c
s=s==null?null:s.a
r=s===!0}else r=!1
s=k.ax
s.aa(0)
k.e=!1
q=s.ghq().p2!=null
p=s.ghq().a&&r
o=k.b
n=o
for(;;){if(n.gmw()!=null)s=q||!p
else s=!1
if(!s)break
if(n!==o&&n.ghS().gpX()&&!q)break
s=n.ghS()
s.d=s.as=s.at=null
if(p)q=!1
s=s.ax
m=s.d
if(m==null){if(s.c==null){m=A.ko()
s.d=s.c=m
s.a.fb(m)}s=s.c
s.toString}else s=m
q=B.nS.FI(q,s.p2!=null)
n=n.gmw()
s=n.ghS()
m=s.ax
l=m.d
if(l==null){if(m.c==null){l=A.ko()
m.d=m.c=l
m.a.fb(l)}m=m.c
m.toString}else m=l
p=m.a&&s.f}if(n!==o&&j&&n.ghS().gpX())o.y.ch.L(0,o)
if(!n.ghS().gpX()){j=o.y
if(j!=null)if(j.ch.B(0,n))o.y.zp()}},
RL(a,b){var s,r,q,p,o,n,m,l,k=A.ak(t.vC)
for(s=J.Y(a),r=this.ax,q=r.a,p=0;p<s.gv(a);++p){o=s.h(a,p)
o.Xm(!1)
if(o.glY()==null)continue
if(b){if(r.c==null){n=A.ko()
r.d=r.c=n
q.fb(n)}n=r.c
n.toString
n=!n.aga(o.glY())}else n=!1
if(n)k.B(0,o)
for(m=0;m<p;++m){l=s.h(a,m)
n=o.glY()
n.toString
if(!n.aga(l.glY())){k.B(0,o)
k.B(0,l)}}}for(s=A.dc(k,k.r,k.$ti.c),r=s.$ti.c;s.p();){q=s.d;(q==null?r.a(q):q).Xm(!0)}},
aGp(a){return this.RL(a,!1)}}
