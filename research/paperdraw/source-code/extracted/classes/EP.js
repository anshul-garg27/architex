A.EP.prototype={
zL(a,b){return this.ak4(a,b)},
Zm(a){return this.zL(a,null)},
ak4(a,b){var s=0,r=A.A(t.Qz),q,p=this,o,n
var $async$zL=A.w(function(c,d){if(c===1)return A.x(d,r)
for(;;)switch(s){case 0:n=B.rs.aSo(a,b)
if(n!=null){q=p.a.pt(new A.fv(null,n,B.iW,"reference_catalog","reference_catalog_v1",null,null,null,new A.az(Date.now(),0,!1)))
s=1
break}s=3
return A.n(p.b.Fp(a,b,"specialization_studio_v1"),$async$zL)
case 3:o=d
q=p.a.pt(new A.fv(null,o.a,B.U6,o.b,o.c,null,null,null,new A.az(Date.now(),0,!1)))
s=1
break
case 1:return A.y(q,r)}})
return A.z($async$zL,r)},
Fn(a){return this.ak2(a)},
ak2(a){var s=0,r=A.A(t.UJ),q,p=2,o=[],n=this,m,l,k,j,i,h,g,f,e,d,c
var $async$Fn=A.w(function(b,a0){if(b===1){o.push(a0)
s=p}for(;;)switch(s){case 0:g=A.a([],t.Cu)
f=null
k=A.a1M(a),j=k.length,i=0
case 3:if(!(i<k.length)){s=5
break}m=k[i]
p=7
d=J
c=g
s=10
return A.n(n.Zm(m),$async$Fn)
case 10:d.cj(c,a0)
p=2
s=9
break
case 7:p=6
e=o.pop()
l=A.ac(e)
f=l
s=9
break
case 6:s=2
break
case 9:case 4:k.length===j||(0,A.o)(k),++i
s=3
break
case 5:if(J.b1(g)===0&&f!=null)throw A.d(A.c1("Category generation failed: "+A.m(f)))
q=g
s=1
break
case 1:return A.y(q,r)
case 2:return A.x(o.at(-1),r)}})
return A.z($async$Fn,r)},
Oj(a,b){return this.akY(a,b)},
akY(a,b){var s=0,r=A.A(t.Qz),q,p=this
var $async$Oj=A.w(function(c,d){if(c===1)return A.x(d,r)
for(;;)switch(s){case 0:a.aj6()
q=p.a.Ff(b.aUM(a,new A.az(Date.now(),0,!1)))
s=1
break
case 1:return A.y(q,r)}})
return A.z($async$Oj,r)},
Lf(){var s=0,r=A.A(t.Xe),q,p=this,o,n,m,l
var $async$Lf=A.w(function(a,b){if(a===1)return A.x(b,r)
for(;;)switch(s){case 0:s=3
return A.n(p.a.b05(B.iW),$async$Lf)
case 3:o=p.atr(b)
n=o.d
m=B.b.co(n,0,new A.axr())
l=B.b.co(n,0,new A.axs())
q=new A.a8C(o,A.yz(o.b4(),null,"  "),m,l)
s=1
break
case 1:return A.y(q,r)}})
return A.z($async$Lf,r)},
ra(a,b,c,d,e,f){return this.aSp(a,b,c,d,e,f)},
aSp(a4,a5,a6,a7,a8,a9){var s=0,r=A.A(t.RJ),q,p=this,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3
var $async$ra=A.w(function(b0,b1){if(b0===1)return A.x(b1,r)
for(;;)switch(s){case 0:b=p.aM3(a4)
a=p.atD(a4,a5)
a0=p.aLs(a4,a6)
a1=p.ayO(a9)
a2=b.length
if(a2===0){q=null
s=1
break}a8.$1(new A.jT(B.U9,"Fetching stored specialization coverage for this design...",0,a2+a.length))
a2=p.a
o=A.j(t._w,t.Qz)
a3=J
s=3
return A.n(a2.Mg(b),$async$ra)
case 3:n=a3.ar(b1)
case 4:if(!n.p()){s=5
break}m=n.gH(n)
o.j(0,m.b.a,m)
s=4
break
case 5:n=t.O6
m=A.a([],n)
for(l=b.length,k=0;k<b.length;b.length===l||(0,A.o)(b),++k){j=b[k]
if(!o.ae(0,j))m.push(j)}i=A.j(t.N,t.L9)
a3=J
s=6
return A.n(a2.Mh(a),$async$ra)
case 6:l=a3.ar(b1)
case 7:if(!l.p()){s=8
break}h=l.gH(l)
i.j(0,h.b.b+"|"+h.c,h)
s=7
break
case 8:l=A.a([],t.Bk)
for(h=a.length,k=0;g=a.length,k<g;a.length===h||(0,A.o)(a),++k){f=a[k]
if(!i.ae(0,f.b.b+"|"+f.d))l.push(f)}h=m.length
s=h!==0?9:10
break
case 9:e=b.length
a8.$1(new A.jT(B.v3,"Generating missing base specialization on server...",e-h,e+g))
a3=J
s=11
return A.n(a2.Lc(m,p.att(m,a4,a0,a7,a1)),$async$ra)
case 11:h=a3.ar(b1)
case 12:if(!h.p()){s=13
break}g=h.gH(h)
o.j(0,g.b.a,g)
s=12
break
case 13:n=A.a([],n)
for(h=m.length,k=0;k<m.length;m.length===h||(0,A.o)(m),++k){j=m[k]
if(o.h(0,j)==null)n.push(j)}m=n.length
s=m!==0?14:15
break
case 14:h=b.length
a8.$1(new A.jT(B.v3,"Server cache missed some components. Generating local fallback drafts...",h-m,h+a.length))
m=n.length,k=0
case 16:if(!(k<n.length)){s=18
break}j=n[k]
s=19
return A.n(p.Hd(j),$async$ra)
case 19:d=b1
if(d!=null)o.j(0,j,d)
case 17:n.length===m||(0,A.o)(n),++k
s=16
break
case 18:case 15:case 10:n=l.length
s=n!==0?20:21
break
case 20:m=b.length
h=a.length
a8.$1(new A.jT(B.v3,"Generating missing topology overlays on server...",m+(h-n),m+h))
a3=J
s=22
return A.n(a2.Ld(p.au6(a4,a5,a0,a7,a1,l),l),$async$ra)
case 22:a2=a3.ar(b1)
case 23:if(!a2.p()){s=24
break}n=a2.gH(a2)
i.j(0,n.b.b+"|"+n.c,n)
s=23
break
case 24:case 21:a2=A.a([],t.Cu)
for(n=b.length,k=0;m=b.length,k<m;b.length===n||(0,A.o)(b),++k){j=b[k]
if(o.h(0,j)!=null){m=o.h(0,j)
m.toString
a2.push(m)}}if(a2.length===0){a2=A.v(b)
n=a2.i("bd<1,c>")
a2=A.r(new A.bd(new A.J(b,new A.axp(o),a2.i("J<1>")),new A.axq(),n),n.i("k.E"))
a2.$flags=1
c=a2
a8.$1(new A.jT(B.Ua,c.length===0?"No stored or generated base specialization drafts were available for this design.":"No stored or generated base specialization drafts were available for: "+B.b.aB(c,", ")+".",0,0))
q=null
s=1
break}o=m+a.length
a8.$1(new A.jT(B.aGI,"Simulation specialization is ready.",o,o))
o=i.$ti.i("aN<2>")
o=A.r(new A.aN(i,o),o.i("k.E"))
o.$flags=1
q=p.a1t(a2,o,a)
s=1
break
case 1:return A.y(q,r)}})
return A.z($async$ra,r)},
aLs(a,b){var s,r,q,p,o,n=A.j(t.N,t.Gp)
for(s=J.ar(a),r=b==null;s.p();){q=s.gH(s)
p=r?null:J.aa(b,q.a)
if(p!=null&&this.Rn(p)){n.j(0,q.a,p)
continue}o=q.f
if(this.Rn(o))n.j(0,q.a,o)}return n},
ayO(a){var s,r,q,p
if(a==null||J.em(a))return B.Nk
s=A.j(t.N,t.Gp)
for(r=J.mp(a),r=r.gT(r);r.p();){q=r.gH(r)
p=q.b
if(this.Rn(p))s.j(0,q.a,p)}return s},
att(a,b,c,d,e){var s,r,q,p,o,n,m,l,k,j,i
if(a.length===0)return B.awY
s=A.jk(a,A.v(a).c)
r=t._w
q=A.j(r,t.Xv)
for(p=J.ar(b);p.p();){o=p.gH(p)
n=o.b
if(!s.k(0,n))continue
q.b_(0,n,new A.ax9())
n=q.h(0,n)
n.toString
J.cj(n,o)}m=A.j(r,t.P)
for(r=a.length,l=0;l<a.length;a.length===r||(0,A.o)(a),++l){k=a[l]
j=q.h(0,k)
i=this.ats(j==null?B.k_:j,k,c,d,e)
if(i!=null)m.j(0,k,i)}return m},
au6(a,b,c,d,e,f){var s,r,q,p,o,n,m,l,k,j,i,h
if(f.length===0)return B.ui
s=t.N
r=A.j(s,t.D)
for(q=J.bZ(a),p=q.gT(a);p.p();){o=p.gH(p)
r.j(0,o.a,o)}n=A.j(s,t.P)
for(s=f.length,m=0;m<f.length;f.length===s||(0,A.o)(f),++m){l=f[m]
k=r.h(0,l.a)
if(k==null)continue
p=k.a
j=this.a2L(r,p,b,!0)
i=this.a2L(r,p,b,!1)
p=q.cA(a,new A.axh(k))
p=A.r(p,p.$ti.i("k.E"))
p.$flags=1
o=A.v(i).i("J<1>")
o=A.r(new A.J(i,new A.axi(k),o),o.i("k.E"))
o.$flags=1
h=this.au5(k,c,i,p,d,e,o,j)
if(h==null)continue
n.j(0,l.b.b+"|"+l.d,h)}return n},
ats(a,b,c,d,e){var s,r,q,p,o,n,m,l=this,k=J.Y(a)
if(k.ga3(a))return null
s=l.aMP(a,c,e)
if(s==null)return null
r=s.a
q=l.a9F(c.h(0,r))
p=l.a9F(e.h(0,r))
r=q==null
if(r&&p==null)return null
o=k.cA(a,new A.ax8(c,e)).gv(0)
k=A.j(t.N,t.z)
k.j(0,"sampleStrategy","representative_component_of_type")
k.j(0,"sampleCount",o)
k.j(0,"componentType",b.b)
if(!r)k.j(0,"current",q)
if(p!=null)k.j(0,"baseline",p)
n=l.a1w(p,q)
if(n.gbp(n))k.j(0,"delta",n)
m=l.a4S(d)
if(m!=null)k.j(0,"global",m)
return k},
au5(a,b,c,d,e,f,g,h){var s,r,q=t.N,p=t.z,o=A.j(q,p),n=new A.axg(this,b,f,o)
n.$2("local",A.a([a],t.Jc))
n.$2("upstream",h)
n.$2("downstream",c)
n.$2("failover",d)
n.$2("replica",g)
if(o.a===0)return null
s=A.u(["sampleStrategy","scope_aggregated_runtime_metrics","scopes",o],q,p)
r=this.a4S(e)
if(r!=null)s.j(0,"global",r)
return s},
auc(a,b,c){var s,r,q,p,o,n,m=t.so,l=A.a([],m)
for(s=c.length,r=0;r<c.length;c.length===s||(0,A.o)(c),++r){q=c[r].a
if(a.h(0,q)!=null){q=a.h(0,q)
q.toString
l.push(q)}}m=A.a([],m)
for(s=c.length,r=0;r<c.length;c.length===s||(0,A.o)(c),++r){q=c[r].a
if(b.h(0,q)!=null){q=b.h(0,q)
q.toString
m.push(q)}}if(l.length===0&&m.length===0)return null
p=this.a13(l)
o=this.a13(m)
m=A.j(t.N,t.z)
m.j(0,"componentCount",c.length)
if(p!=null)m.j(0,"current",p)
if(o!=null)m.j(0,"baseline",o)
n=this.a1w(o,p)
if(n.gbp(n))m.j(0,"delta",n)
return m},
a2L(a,b,c,d){var s=A.v(c),r=t.AJ
s=A.r(new A.c9(new A.bd(new A.J(c,new A.axj(d,b),s.i("J<1>")),new A.axk(a,d),s.i("bd<1,bw?>")),r),r.i("k.E"))
s.$flags=1
return s},
aMP(a,b,c){var s,r,q,p,o,n,m,l
for(s=J.ar(a),r=null,q=-1/0;s.p();){p=s.gH(s)
o=p.a
n=b.h(0,o)
m=c.h(0,o)
if(n==null&&m==null)continue
l=Math.max(this.a6z(n),this.a6z(m))
if(l>q){q=l
r=p}}return r},
a6z(a){var s,r,q,p,o,n,m,l
if(a==null)return-1/0
s=a.dx?2:0
r=a.Q?1.4:0
q=a.z?1.2:0
p=B.d.t(a.f*20,0,2)
o=B.d.t(a.d,0,2)
n=B.d.t(a.e,0,2)
m=B.d.t(a.as,0,2)
l=a.r
l=l>0?B.d.t(1-l,0,1):0
return B.b.co(A.a([s,r,q,p,o,n,m,l,B.d.t(a.c/500,0,2),B.d.t(a.w/100,0,2),B.d.t(a.at/250,0,2),B.d.t(a.y/5,0,2),B.d.t((a.db-1)/2,0,2)],t.n),0,B.fY)},
Rn(a){return a.a>0||a.b>0||a.c>0||a.d>0||a.e>0||a.f>0||a.r>0||a.w>0||a.y>0||a.z||a.Q||a.as>0||a.at>0||a.ay||a.cy||a.db>1||a.dx||a.fr>0||a.fx>0||a.fy>0||a.go>0||a.id>0||a.k1>0||a.k2>0||a.k3>0},
a9F(a){var s=this,r="connectionPoolUtilization",q="activeConnections",p="replicaWriteRejects",o="writeConcernTimeouts",n="lockWaitTimeouts",m="constraintRejects",l="diskWatermarkRejects",k="persistenceRejects",j="readOnlyWriteRejects"
if(a==null)return null
return A.u(["currentRps",s.cL("currentRps",a.a),"latencyMs",s.cL("latencyMs",a.b),"p95LatencyMs",s.cL("p95LatencyMs",a.c),"cpuUsage",s.cL("cpuUsage",a.d),"memoryUsage",s.cL("memoryUsage",a.e),"errorRate",s.cL("errorRate",a.f),"cacheHitRate",s.cL("cacheHitRate",a.r),"queueDepth",s.cL("queueDepth",a.w),"evictionRate",s.cL("evictionRate",a.y),r,s.cL(r,a.as),q,s.cL(q,a.at),"maxConnections",s.cL("maxConnections",a.ax),"slownessFactor",s.cL("slownessFactor",a.db),"highLoadSeconds",s.cL("highLoadSeconds",a.fr),p,s.cL(p,a.fx),o,s.cL(o,a.fy),n,s.cL(n,a.go),m,s.cL(m,a.id),l,s.cL(l,a.k1),k,s.cL(k,a.k2),j,s.cL(j,a.k3),"isThrottled",a.z,"isCircuitOpen",a.Q,"isScaling",a.ay,"isSlow",a.cy,"isCrashed",a.dx],t.N,t.z)},
a13(a){var s,r,q,p,o,n=this,m="connectionPoolUtilization",l="activeConnections",k="replicaWriteRejects",j="writeConcernTimeouts",i="lockWaitTimeouts",h="constraintRejects",g="diskWatermarkRejects",f="persistenceRejects",e="readOnlyWriteRejects"
if(a.length===0)return null
s=new A.ax2(a)
r=new A.ax5(a)
q=new A.ax3(a)
p=q.$1(new A.awD())
o=a.length
return A.u(["currentRps",n.cL("currentRps",r.$1(new A.awE())),"latencyMs",n.cL("latencyMs",s.$1(new A.awF())),"p95LatencyMs",n.cL("p95LatencyMs",s.$1(new A.awQ())),"cpuUsage",n.cL("cpuUsage",s.$1(new A.awW())),"memoryUsage",n.cL("memoryUsage",s.$1(new A.awX())),"errorRate",n.cL("errorRate",s.$1(new A.awY())),"cacheHitRate",n.cL("cacheHitRate",p/o),"queueDepth",n.cL("queueDepth",q.$1(new A.awZ())),"evictionRate",n.cL("evictionRate",s.$1(new A.ax_())),m,n.cL(m,s.$1(new A.ax0())),l,n.cL(l,r.$1(new A.ax1())),"maxConnections",n.cL("maxConnections",s.$1(new A.awG())),"slownessFactor",n.cL("slownessFactor",s.$1(new A.awH())),"highLoadSeconds",n.cL("highLoadSeconds",s.$1(new A.awI())),k,n.cL(k,s.$1(new A.awJ())),j,n.cL(j,s.$1(new A.awK())),i,n.cL(i,s.$1(new A.awL())),h,n.cL(h,s.$1(new A.awM())),g,n.cL(g,s.$1(new A.awN())),f,n.cL(f,s.$1(new A.awO())),e,n.cL(e,s.$1(new A.awP())),"isThrottled",B.b.aE(a,new A.awR()),"isCircuitOpen",B.b.aE(a,new A.awS()),"isScaling",B.b.aE(a,new A.awT()),"isSlow",B.b.aE(a,new A.awU()),"isCrashed",B.b.aE(a,new A.awV())],t.N,t.z)},
a1w(a,b){var s,r,q,p,o
if(b==null||a==null)return B.ba
s=A.j(t.N,t.z)
for(r=0;r<12;++r){q=B.alG[r]
p=b.h(0,q)
o=a.h(0,q)
if(typeof p!="number"||typeof o!="number")continue
s.j(0,q,this.cL(q,p-o))}return s},
a4S(a){var s=this,r="errorBudgetBurnRate",q=a.a
if(!(q>0||a.d>0||a.r>0||a.y>0))return null
return A.u(["totalRps",s.cL("totalRps",q),"p95LatencyMs",s.cL("p95LatencyMs",a.d),"errorRate",s.cL("errorRate",a.r),r,s.cL(r,a.y)],t.N,t.z)},
cL(a,b){var s=this
if(!isFinite(b))return 0
switch(a){case"totalRps":return s.Ay(b,25)
case"currentRps":case"activeConnections":case"maxConnections":return s.Ay(b,10)
case"latencyMs":case"p95LatencyMs":return s.Ay(b,5)
case"queueDepth":return s.Ay(b,5)
case"replicaWriteRejects":case"writeConcernTimeouts":case"lockWaitTimeouts":case"constraintRejects":case"diskWatermarkRejects":case"persistenceRejects":case"readOnlyWriteRejects":return s.Ay(b,1)
default:return A.or(B.d.Z(b,2))}},
Ay(a,b){if(b<=1)return B.d.P(a)
return B.e.aW(B.d.P(a/b)*b)},
aM3(a){var s,r,q,p=A.ak(t._w)
for(s=J.ar(a);s.p();){r=this.aLx(s.gH(s))
if(r==null)continue
p.B(0,r)}s=A.r(p,p.$ti.c)
s.$flags=1
q=s
B.b.be(q,new A.axl())
return q},
aLx(a){var s=a.b
if(this.a68(s))return s
return null},
a68(a){var s
$label0$0:{s=B.bq===a||B.jr===a||B.jx===a||B.kH===a||B.kC===a||B.aM===a||B.aX===a||B.aR===a||B.bX===a||B.bx===a||B.ad===a||B.ca===a||B.ck===a||B.ch===a||B.cn===a||B.cg===a||B.cj===a||B.co===a||B.cl===a
break $label0$0}return!s},
atD(a3,a4){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0=this,a1="none",a2=A.j(t.N,t.D)
for(s=J.bZ(a3),r=s.gT(a3);r.p();){q=r.gH(r)
a2.j(0,q.a,q)}p=A.a([],t.Bk)
for(s=s.gT(a3),r=t.Ri,q=r.i("k.E"),o=A.v(a4),n=o.i("J<1>"),o=o.i("bd<1,bw?>"),m=t.AJ,l=m.i("k.E");s.p();){k=s.gH(s)
j=k.b
if(!a0.a68(j))continue
i=A.r(new A.c9(new A.bd(new A.J(a4,new A.axa(k),n),new A.axb(a2),o),m),l)
i.$flags=1
h=i
i=A.r(new A.c9(new A.bd(new A.J(a4,new A.axc(k),n),new A.axd(a2),o),m),l)
i.$flags=1
g=i
i=A.hu(q)
i.q(0,new A.c9(new A.q(h,new A.axe(a0),A.v(h).i("q<1,c?>")),r))
i=A.r(i,A.l(i).c)
i.$flags=1
f=i
B.b.d_(f)
i=A.hu(q)
i.q(0,new A.c9(new A.q(g,new A.axf(a0),A.v(g).i("q<1,c?>")),r))
i=A.r(i,A.l(i).c)
i.$flags=1
e=i
B.b.d_(e)
d=a0.aPs(k,g,h)
B.b.d_(d)
k=k.a
i=a0.a8v(j)
c=f.length===0?a1:B.b.aB(f,",")
b=e.length===0?a1:B.b.aB(e,",")
a=d.length===0?a1:B.b.aB(d,",")
p.push(new A.oJ(k,j,i,j.b+"|up:"+c+"|down:"+b+"|traits:"+a,f,e,d))}return p},
aPs(a,b,c){var s=A.ak(t.N),r=a.e,q=r.y>1
if(q)s.B(0,"has_replica")
if(r.dx)s.B(0,"has_circuit_breaker")
if(r.cy)s.B(0,"has_rate_limiting")
if(r.fr)s.B(0,"has_dlq")
if(r.dy)s.B(0,"has_retries")
if(r.c)s.B(0,"autoscale")
if(r.Q)s.B(0,"sharded")
if(b.length>=3)s.B(0,"fanout_high")
if(c.length>=3)s.B(0,"fanin_high")
r=a.b
if(r===B.aY||r===B.aN||r===B.bl||r===B.b7||B.b.aE(c,new A.axm(this)))s.B(0,"is_async_path")
if(B.b.aE(c,new A.axn(this)))s.B(0,"is_sync_request_path")
if(q||B.b.aE(b,new A.axo(a)))s.B(0,"has_failover_target")
if(r===B.ar||r===B.aN||r===B.b7||r===B.b9||r===B.cL)s.B(0,"write_heavy")
if(r===B.ai||r===B.aQ||r===B.cm||r===B.bH)s.B(0,"read_heavy")
r=A.r(s,s.$ti.c)
r.$flags=1
return r},
a35(a){var s
if(a===B.cX)return"client"
if(a===B.a6||a===B.bp||a===B.cy||a===B.bM)return"load_balancer"
if(a===B.aJ||a===B.bz)return"api_gateway"
if(a===B.aN||a===B.bl||a===B.b7)return a===B.b7?"stream":"queue"
if(a===B.bO)return"scheduler"
if(a===B.aY)return"worker"
if(a===B.cK||a===B.eh)return"service_mesh"
if(a===B.bT||a===B.dn||a===B.dp||a===B.d7)return"dns_discovery"
if(a===B.ar||a===B.by||a===B.bA||a===B.bW||a===B.bf||a===B.bP||a===B.bu||a===B.bV||a===B.bk||a===B.d6)return"database"
if(a===B.ai)return"cache"
if(a===B.b9)return"object_store"
if(a===B.aQ||a===B.cm)return"search"
s=a===B.cL
if(s||a===B.eM||a===B.ci)return"external_dependency"
if(s)return"payment"
if(a===B.cx)return"notification"
if(a===B.ci||a===B.eg||a===B.ef)return"ai_model"
return a.gbD().b},
a8v(a){var s,r
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
Hd(a){return this.azv(a)},
azv(a){var s=0,r=A.A(t.ZF),q,p=2,o=[],n=this,m,l,k,j,i
var $async$Hd=A.w(function(b,c){if(b===1){o.push(c)
s=p}for(;;)switch(s){case 0:p=4
s=7
return A.n(n.zL(a,n.a8v(a)),$async$Hd)
case 7:m=c
if(m.c===B.iW){q=m
s=1
break}l=m.a
if(l==null||l.length===0){k=n.a.pt(m.aV6(B.iW,new A.az(Date.now(),0,!1)))
q=k
s=1
break}k=n.a.w6(l,B.iW)
q=k
s=1
break
p=2
s=6
break
case 4:p=3
i=o.pop()
q=null
s=1
break
s=6
break
case 3:s=2
break
case 6:case 1:return A.y(q,r)
case 2:return A.x(o.at(-1),r)}})
return A.z($async$Hd,r)},
a1t(a,b,c){var s,r,q,p,o,n,m,l,k,j,i=A.j(t.N,t.Qz)
for(s=J.ar(a);s.p();){r=s.gH(s)
q=r.b.a.b
p=i.h(0,q)
if(p==null){i.j(0,q,r)
continue}o=p.x
if(o==null)o=new A.az(A.wl(0,0,!1),0,!1)
n=r.x
if(n==null)n=new A.az(A.wl(0,0,!1),0,!1)
m=n.a
l=o.a
if(m<=l)m=m===l&&n.b>o.b
else m=!0
if(m)i.j(0,q,r)}s=i.$ti.i("aN<2>")
s=A.r(new A.aN(i,s),s.i("k.E"))
s.$flags=1
k=s
B.b.be(k,new A.ax7())
j=k.length===0?"specialization_studio_v1":B.b.gS(k).e
return new A.rq(1,j,new A.az(Date.now(),0,!1).ox(),k,b,c)},
atr(a){return this.a1t(a,B.mc,B.aqB)},
$iaTN:1}
