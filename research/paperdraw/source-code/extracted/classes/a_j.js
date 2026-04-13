A.a_j.prototype={
Fo(a,b){return this.ak3(a,b)},
ak3(a,b){var s=0,r=A.A(t.j5),q,p=2,o=[],n=this,m,l,k,j,i
var $async$Fo=A.w(function(c,d){if(c===1){o.push(d)
s=p}for(;;)switch(s){case 0:p=4
s=7
return A.n(n.p7("ai-generate-design",A.u(["problem",n.Sj(b),"input",a.NC()],t.N,t.z)),$async$Fo)
case 7:m=d
k=n.aJa(m)
q=k
s=1
break
p=2
s=6
break
case 4:p=3
i=o.pop()
l=A.ac(i)
A.e1().$1("AI design generation failed: "+A.m(l))
k=A.c1(A.bGI(J.V(l)))
throw A.d(k)
s=6
break
case 3:s=2
break
case 6:case 1:return A.y(q,r)
case 2:return A.x(o.at(-1),r)}})
return A.z($async$Fo,r)},
El(a,b,c){return this.b0C(a,b,c)},
b0C(a,b,c){var s=0,r=A.A(t.BI),q,p=2,o=[],n=this,m,l,k,j,i
var $async$El=A.w(function(d,e){if(d===1){o.push(e)
s=p}for(;;)switch(s){case 0:p=4
m=new A.apU(n,b,a,c)
s=7
return A.n(n.d.nn(A.u(["format",b.b,"fileName",a,"page",n.Sf(c)],t.N,t.K),"external_import_mapping_v1",new A.apT(n,b),m,n.gayB(),t.BI),$async$El)
case 7:k=e
q=k
s=1
break
p=2
s=6
break
case 4:p=3
i=o.pop()
l=A.ac(i)
A.e1().$1("AI external import via function failed: "+A.m(l))
k=A.c1("Failed to map external diagram: "+A.m(l))
throw A.d(k)
s=6
break
case 3:s=2
break
case 6:case 1:return A.y(q,r)
case 2:return A.x(o.at(-1),r)}})
return A.z($async$El,r)},
Lh(a){return this.aXV(a)},
aXV(a){var s=0,r=A.A(t.Sa),q,p=2,o=[],n=this,m,l,k,j,i,h
var $async$Lh=A.w(function(b,c){if(b===1){o.push(c)
s=p}for(;;)switch(s){case 0:if(!a.gyM())throw A.d(A.c1("Image extraction requires an image file."))
m=n.aEC(a.gacr())
p=4
l=new A.apR(n,a)
j=t.N
s=7
return A.n(n.d.nn(A.u(["mimeType",a.gaek(),"name",a.a,"imageHash",m],j,j),"external_import_image_v1",n.gaJC(),l,n.gaJE(),t.Sa),$async$Lh)
case 7:j=c
q=j
s=1
break
p=2
s=6
break
case 4:p=3
h=o.pop()
k=A.ac(h)
A.e1().$1("AI image import via function failed: "+A.m(k))
j=A.c1("Failed to extract external diagram from image: "+A.m(k))
throw A.d(j)
s=6
break
case 3:s=2
break
case 6:case 1:return A.y(q,r)
case 2:return A.x(o.at(-1),r)}})
return A.z($async$Lh,r)},
Nv(a,b){return this.b4f(a,b)},
b4f(a,b){var s=0,r=A.A(t.nT),q,p=2,o=[],n=this,m,l,k,j,i,h
var $async$Nv=A.w(function(c,d){if(c===1){o.push(d)
s=p}for(;;)switch(s){case 0:p=4
m=new A.apV(n,b,a)
s=7
return A.n(n.d.nn(A.u(["problem",n.Sj(b),"designSnapshot",a],t.N,t.P),"review_design_v1",n.gaLR(),m,n.gaLT(),t.nT),$async$Nv)
case 7:k=d
q=k
s=1
break
p=2
s=6
break
case 4:p=3
h=o.pop()
l=A.ac(h)
A.e1().$1("AI review via function failed: "+A.m(l))
k=A.apW(l,"AI review")
i=A.a([k],t.s)
q=new A.lt(0,"Unable to review design.",i,B.yY,k)
s=1
break
s=6
break
case 3:s=2
break
case 6:case 1:return A.y(q,r)
case 2:return A.x(o.at(-1),r)}})
return A.z($async$Nv,r)},
Fp(a,b,c){return this.ak5(a,b,c)},
ak5(a,b,c){var s=0,r=A.A(t.pF),q,p=2,o=[],n=this,m,l,k,j,i
var $async$Fp=A.w(function(d,e){if(d===1){o.push(e)
s=p}for(;;)switch(s){case 0:p=4
m=new A.apS(n,a,b,c)
s=7
return A.n(n.d.nn(A.u(["componentType",a.b,"domainOverride",b,"promptVersion",c],t.N,t.A),"specialization_draft_v1",n.gaOb(),m,n.gaOc(),t.pF),$async$Fp)
case 7:k=e
q=k
s=1
break
p=2
s=6
break
case 4:p=3
i=o.pop()
l=A.ac(i)
A.e1().$1("AI specialization draft via function failed: "+A.m(l))
k=A.c1("Failed to generate specialization draft: "+A.m(l))
throw A.d(k)
s=6
break
case 3:s=2
break
case 6:case 1:return A.y(q,r)
case 2:return A.x(o.at(-1),r)}})
return A.z($async$Fp,r)},
aOA(a){var s,r
if(a===B.a6||a===B.bp)return"load_balancer"
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
aHh(a,b){var s
if(!t.j.b(a))return B.yW
s=J.jv(a,t.f)
s=A.dd(s,new A.api(this,b),s.$ti.i("k.E"),t.P)
s=A.r(s,A.l(s).i("k.E"))
s.$flags=1
return s},
aHk(a4,a5,a6){var s,r,q,p,o,n,m,l,k,j,i,h,g,f=this,e=null,d="issueCode",c="dependencyScopes",b="neighborFailureHints",a="trafficEffectHints",a0="neighborMetricThresholdHints",a1="dependencySelectors",a2="propagationRole",a3="causalNarrativeTemplate"
if(!t.j.b(a4))return B.yW
s=t.N
r=A.ak(s)
q=t.Ri
p=q.i("J<k.E>")
q=A.r(new A.J(new A.c9(new A.q(a6,new A.apj(),A.v(a6).i("q<1,c?>")),q),new A.apk(),p),p.i("k.E"))
q.$flags=1
o=q
n=A.a([],t.e)
for(q=J.Y(a4),p=t.z,m=t.f,l=0;l<q.gv(a4);++l){k=q.h(a4,l)
if(!m.b(k))continue
j=A.bt(k,s,p)
if(l<a6.length){i=J.aa(a6[l],"code")
h=i==null?e:J.V(i)}else h=e
j.j(0,"name",f.aHl(j,a5,h,l,r))
i=j.h(0,d)
g=i==null?e:B.c.N(J.V(i))
if(g==null||g.length===0||!B.b.k(o,g))if(h!=null&&B.b.k(o,h))j.j(0,d,h)
else if(o.length===1)j.j(0,d,B.b.geB(o))
j.j(0,c,f.tX(j.h(0,c)))
j.j(0,b,f.tX(j.h(0,b)))
j.j(0,a,f.tX(j.h(0,a)))
j.j(0,a0,f.aHj(j.h(0,a0)))
j.j(0,a1,f.aHg(j.h(0,a1)))
i=j.h(0,a2)
j.j(0,a2,(i==null?e:B.c.N(J.V(i)).length!==0)===!0?B.c.N(J.V(j.h(0,a2))):"directly_impacted")
i=j.h(0,a3)
j.j(0,a3,(i==null?e:B.c.N(J.V(i)).length!==0)===!0?B.c.N(J.V(j.h(0,a3))):"{component} is impacted by {source} and is surfacing this as a local incident.")
n.push(j)}return n},
tX(a){var s
if(!t.j.b(a))return B.t
s=J.cq(a,new A.apl(),t.N).cA(0,new A.apm())
s=A.r(s,s.$ti.i("k.E"))
s.$flags=1
return s},
aHj(a){var s,r,q,p,o
if(!t.f.b(a))return B.et
s=A.j(t.N,t.i)
for(r=J.mp(a),r=r.gT(r);r.p();){q=r.gH(r)
p=B.c.N(J.V(q.a))
if(p.length===0)continue
o=q.b
$label0$1:{if(typeof o=="number"){q=o
break $label0$1}if(typeof o=="string"){q=A.l_(B.c.N(o))
break $label0$1}q=null
break $label0$1}if(q==null)continue
s.j(0,p,q)}return s},
aHg(a){var s,r=this,q="upstreamCategories",p="downstreamCategories",o="requiresReplicaPeer",n="requiresFailoverTarget"
if(!t.f.b(a))return B.ba
s=J.Y(a)
return A.u([q,r.tX(s.h(a,q)),p,r.tX(s.h(a,p)),"upstreamTypes",r.tX(s.h(a,"upstreamTypes")),"downstreamTypes",r.tX(s.h(a,"downstreamTypes")),o,J.e(s.h(a,o),!0),n,J.e(s.h(a,n),!0)],t.N,t.z)},
aHl(a,b,c,d,e){var s,r,q,p,o,n=null,m=a.h(0,"name"),l=m==null?n:B.c.N(J.V(m))
if(l!=null&&l.length!==0)return this.a34(l,e)
m=a.h(0,"impactShape")
s=m==null?n:B.c.N(J.V(m))
r=a.h(0,"triggerSignals")
if(t.j.b(r)&&J.i3(r)){m=J.ou(r)
q=m==null?n:J.V(m)}else q=n
m=s==null?c:s
p=m==null?q:m
o=this.aO5(p==null?b.b+"_rule_"+(d+1):p)
m=b.b
return this.a34(o.length===0?m+"_rule_"+(d+1):m+"_"+o,e)},
a34(a,b){var s,r,q,p=B.c.N(a)
if(p.length===0)p="generated_rule"
if(b.B(0,p))return p
for(s=p+"_",r=2;q=s+r,!b.B(0,q);)++r
return q},
aO5(a){var s=A.lr(a,A.ad("([a-z0-9])([A-Z])",!0,!1,!1),new A.apN(),null),r=A.aX(s.toLowerCase(),"%"," percent "),q=A.ad("[^a-z0-9]+",!0,!1,!1)
r=A.aX(r,q,"_")
q=A.ad("_+",!0,!1,!1)
r=A.aX(r,q,"_")
q=A.ad("^_|_$",!0,!1,!1)
return A.aX(r,q,"")},
a6F(a){var s,r,q,p,o=null
if(a==null)return o
if(typeof a=="number")return this.a6E(a)
if(typeof a=="string"){s=B.c.N(a)
r=s.length
if(r===0)return o
q=B.c.fB(s,"%")
p=A.l_(q?B.c.N(B.c.a_(s,0,r-1)):s)
if(p==null)return o
return this.a6E(q?p/100:p)}return o},
a6E(a){if(a>1&&a<=100)a/=100
if(a<0)return 0
if(a>1)return 1
return a},
Sn(a){var s,r,q,p,o,n=t.f
if(n.b(a)){s=A.j(t.N,t.z)
for(r=J.mp(a),r=r.gT(r),q=t.j;r.p();){p=r.gH(r)
o=this.Sn(p.b)
if(o==null)continue
if(n.b(o)&&J.em(o))continue
if(q.b(o)&&J.em(o))continue
s.j(0,J.V(p.a),o)}return s}if(t.j.b(a)){n=J.cq(a,this.gaKz(),t.z).cA(0,new A.apG())
s=A.r(n,n.$ti.i("k.E"))
return s}return a},
aHf(b2){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2="components",a3="connections",a4=null,a5="position",a6="protocol",a7="label",a8="viewState",a9=b2.h(0,a2),b0=b2.h(0,a3),b1=t.f
if(!b1.b(a9))throw A.d(A.c1("Blueprint must contain components map"))
if(!t.j.b(b0))throw A.d(A.c1("Blueprint must contain connections list"))
s=t.N
r=t.z
q=A.j(s,r)
for(p=J.mp(a9),p=p.gT(p),o=t.i,n=0;p.p();){m=p.gH(p)
l=m.b
if(!b1.b(l))continue
k=J.V(m.a)
j=A.bt(l,s,r)
m=j.h(0,"id")
m=m==null?a4:B.c.N(J.V(m)).length!==0
i=m===!0?J.V(j.h(0,"id")):k
m=j.h(0,"type")
h=m==null?a4:J.V(m)
if(h==null)h="app_server"
m=j.h(0,"name")
g=m==null?a4:J.V(m)
if(g==null){m=j.h(0,"customName")
g=m==null?a4:J.V(m)}f=j.h(0,a5)
m=b1.b(f)
if(m){l=A.aq(J.aa(f,"x"))
e=l==null?a4:l}else e=a4
if(m){m=A.aq(J.aa(f,"y"))
d=m==null?a4:m}else d=a4
m=A.pb(a4,a4,s,r)
m.q(0,j)
m.j(0,"id",i)
m.j(0,"type",h)
m.j(0,"name",g==null?i:g)
l=e==null?5000+B.e.bl(n,4)*260:e
m.j(0,a5,A.u(["x",l,"y",d==null?4700+B.e.bc(n,4)*220:d],s,o))
q.j(0,i,m);++n}if(q.a===0)throw A.d(A.c1("Blueprint components are empty after normalization"))
c=A.a([],t.e)
for(p=J.ar(b0);p.p();){b=p.gH(p)
if(!b1.b(b))continue
a=A.bt(b,s,r)
o=a.h(0,"from")
a0=o==null?a4:J.V(o)
if(a0==null){o=a.h(0,"sourceId")
a0=o==null?a4:J.V(o)}o=a.h(0,"to")
a1=o==null?a4:J.V(o)
if(a1==null){o=a.h(0,"targetId")
a1=o==null?a4:J.V(o)}if(a0==null||a1==null)continue
if(!q.ae(0,a0)||!q.ae(0,a1))continue
o=A.j(s,r)
o.j(0,"from",a0)
o.j(0,"to",a1)
m=a.h(0,a6)
o.j(0,a6,J.V(m==null?"HTTPS":m))
if(a.h(0,a7)!=null)o.j(0,a7,J.V(a.h(0,a7)))
c.push(o)}if(c.length===0)throw A.d(A.c1("Blueprint must include at least one valid connection"))
p=A.j(s,r)
p.j(0,a2,q)
p.j(0,a3,c)
if(b1.b(b2.h(0,a8)))p.j(0,a8,A.bt(b1.a(b2.h(0,a8)),s,r))
return p},
jQ(a,b){var s
if(typeof a=="number")return a
if(typeof a=="string"){s=A.l_(B.c.N(a))
return s==null?b:s}return b},
ayC(a){var s,r=a.f,q=A.v(r).i("q<1,O<c,c?>>")
r=A.r(new A.q(r,new A.apg(),q),q.i("a2.E"))
r.$flags=1
q=a.r
s=A.v(q).i("q<1,O<c,c?>>")
q=A.r(new A.q(q,new A.aph(),s),s.i("a2.E"))
q.$flags=1
return A.u(["systemName",a.b,"summary",a.c,"assumptions",a.d,"warnings",a.e,"nodeMappings",r,"edgeMappings",q],t.N,t.z)},
a3J(a,b){var s,r,q,p,o,n,m,l=this,k=J.Y(a),j=A.ao(k.h(a,"summary")),i=j==null?null:B.c.N(j)
if(i==null)i=""
if(i.length===0)throw A.d(A.c1("AI import response missing summary"))
j=t.kc
s=j.a(k.h(a,"nodeMappings"))
if(s==null)s=B.U
r=j.a(k.h(a,"edgeMappings"))
if(r==null)r=B.U
j=A.ao(k.h(a,"systemName"))
j=j==null?null:B.c.N(j)
if(j==null)j=""
q=l.ld(k.h(a,"assumptions"))
k=l.ld(k.h(a,"warnings"))
p=t.f
o=J.jv(s,p)
n=t.P
o=A.dd(o,new A.apa(),o.$ti.i("k.E"),n)
o=A.dd(o,new A.apb(l),A.l(o).i("k.E"),t.Ok)
m=A.l(o).i("J<k.E>")
o=A.r(new A.J(o,new A.apc(),m),m.i("k.E"))
o.$flags=1
p=J.jv(r,p)
n=A.dd(p,new A.apd(),p.$ti.i("k.E"),n)
n=A.dd(n,new A.ape(l),A.l(n).i("k.E"),t.MO)
p=A.l(n).i("J<k.E>")
p=A.r(new A.J(n,new A.apf(),p),p.i("k.E"))
p.$flags=1
return new A.qa(b,j,i,q,k,o,p)},
Sf(a){var s,r,q=a.c,p=A.v(q).i("q<1,O<c,R>>")
q=A.r(new A.q(q,new A.apD(),p),p.i("a2.E"))
q.$flags=1
p=a.d
s=A.v(p).i("q<1,O<c,R?>>")
p=A.r(new A.q(p,new A.apE(),s),s.i("a2.E"))
p.$flags=1
s=a.e
r=A.v(s).i("q<1,O<c,R?>>")
s=A.r(new A.q(s,new A.apF(),r),r.i("a2.E"))
s.$flags=1
return A.u(["id",a.a,"name",a.b,"warnings",a.f,"nodes",q,"edges",p,"groups",s],t.N,t.z)},
aJD(a){var s,r,q,p=this,o=J.Y(a),n=t.kc,m=n.a(o.h(a,"nodes"))
if(m==null)m=B.U
s=t.f
m=J.jv(m,s)
r=t.P
m=A.dd(m,new A.apw(),m.$ti.i("k.E"),r)
m=A.dd(m,new A.apx(p),A.l(m).i("k.E"),t.nF)
m=A.r(m,A.l(m).i("k.E"))
m.$flags=1
q=n.a(o.h(a,"edges"))
q=J.jv(q==null?B.U:q,s)
q=A.dd(q,new A.apy(),q.$ti.i("k.E"),r)
q=A.dd(q,new A.apz(p),A.l(q).i("k.E"),t.P0)
q=A.r(q,A.l(q).i("k.E"))
q.$flags=1
n=n.a(o.h(a,"groups"))
n=J.jv(n==null?B.U:n,s)
r=A.dd(n,new A.apA(),n.$ti.i("k.E"),r)
r=A.dd(r,new A.apB(p),A.l(r).i("k.E"),t.BG)
n=A.r(r,A.l(r).i("k.E"))
n.$flags=1
s=A.ao(o.h(a,"id"))
s=(s==null?null:B.c.N(s).length!==0)===!0?B.c.N(A.bE(o.h(a,"id"))):"image_import"
r=A.ao(o.h(a,"name"))
r=r==null?null:B.c.N(r)
if(r==null)r="Imported Image"
return new A.fm(s,r,m,q,n,p.ld(o.h(a,"warnings")))},
aJB(a5,a6){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d=this,c=t.N,b=A.ak(c),a=A.ak(c),a0=new A.apt(),a1=new A.apu(d),a2=J.Y(a5),a3=t.kc,a4=a3.a(a2.h(a5,"groups"))
if(a4==null)a4=B.U
s=t.f
a4=J.jv(a4,s)
a4=A.r(a4,a4.$ti.i("k.E"))
a4.$flags=1
r=a4
q=A.j(c,c)
for(a4=A.v(r).i("mH<1>"),p=new A.mH(r,a4),p=p.gdI(p),p=p.gT(p),o=t.z;p.p();){n=p.gH(p)
m=A.bt(n.b,c,o).h(0,"id")
l=m==null?null:B.c.N(J.V(m))
m=l==null?"group_"+(n.a+1):l
q.j(0,m,a0.$4$index$prefix$used(l,n.a,"group",a))}p=a3.a(a2.h(a5,"nodes"))
p=J.jv(p==null?B.U:p,s)
p=A.r(p,p.$ti.i("k.E"))
p.$flags=1
k=p
j=A.j(c,c)
for(p=A.v(k).i("mH<1>"),n=new A.mH(k,p),n=n.gdI(n),n=n.gT(n);n.p();){m=n.gH(n)
i=A.bt(m.b,c,o).h(0,"id")
l=i==null?null:B.c.N(J.V(i))
i=l==null?"node_"+(m.a+1):l
j.j(0,i,a0.$4$index$prefix$used(l,m.a,"node",b))}a4=new A.mH(r,a4)
h=a4.gdI(a4).cp(0,new A.apq(d,q,a0,a,a1,j),t.BG).cP(0,!1)
p=new A.mH(k,p)
g=p.gdI(p).cp(0,new A.apr(d,j,a0,b,a1,q),t.nF).cP(0,!1)
a3=a3.a(a2.h(a5,"edges"))
a3=J.jv(a3==null?B.U:a3,s)
a3=A.r(a3,a3.$ti.i("k.E"))
a3.$flags=1
a3=a3
a3=new A.mH(a3,A.v(a3).i("mH<1>"))
f=a3.gdI(a3).cp(0,new A.aps(a0,A.ak(c),j),t.P0).cP(0,!1)
if(g.length===0&&h.length===0)throw A.d(A.c1("AI image import response did not include any nodes or groups."))
c=A.ao(a2.h(a5,"pageName"))
e=c==null?null:B.c.N(c)
c=e==null||e.length===0?a6:e
return new A.fm("image_import",c,g,f,h,d.ld(a2.h(a5,"warnings")))},
aLU(a){var s=a.d,r=A.v(s).i("q<1,O<c,R?>>")
s=A.r(new A.q(s,new A.apK(this),r),r.i("a2.E"))
s.$flags=1
return A.u(["score",a.a,"summary",a.b,"issues",a.c,"error",a.e,"suggestions",s],t.N,t.z)},
aLQ(a){var s,r,q,p,o,n,m,l,k,j,i,h,g=null
if(a==null)return g
switch(a.a.a){case 0:s="apply_fix"
break
case 1:s="update_config"
break
case 2:s="add_component"
break
case 3:s="add_connection"
break
default:s=g}r=a.b
q=a.c
q=q==null?g:q.b
p=a.d
o=a.e
o=o==null?g:o.b
n=a.f
m=a.r
l=a.w
k=a.x
j=a.y
i=a.z
i=i==null?g:i.b
h=a.Q
return A.u(["type",s,"componentKey",r,"fixType",q,"config",p,"componentType",o,"name",n,"connectFromKey",m,"connectToKey",l,"fromKey",k,"toKey",j,"protocol",i,"direction",h==null?g:h.b],t.N,t.z)},
aLS(a){var s,r,q,p=J.Y(a),o=t.kc.a(p.h(a,"suggestions"))
if(o==null)o=B.U
o=J.jv(o,t.f)
o=A.dd(o,new A.apH(),o.$ti.i("k.E"),t.P)
o=A.dd(o,new A.apI(this),A.l(o).i("k.E"),t.Jm)
s=A.l(o).i("J<k.E>")
o=A.r(new A.J(o,new A.apJ(),s),s.i("k.E"))
o.$flags=1
s=A.aq(p.h(a,"score"))
s=B.e.t(B.d.P(s==null?0:s),0,100)
r=A.ao(p.h(a,"summary"))
r=r==null?null:B.c.N(r)
if(r==null)r=""
q=this.ld(p.h(a,"issues"))
p=A.ao(p.h(a,"error"))
p=p==null?null:B.c.N(p)
return new A.lt(s,r,q,o,p)},
aLP(a){var s,r,q,p,o,n,m,l,k,j,i,h=this,g=null,f="config",e="protocol",d="direction",c=t.f
if(!c.b(a))return g
s=t.N
r=t.z
q=A.bt(a,s,r)
p=q.h(0,"componentKey")
o=p==null?g:J.V(p)
if(o==null)o=""
p=q.h(0,"type")
switch(p==null?g:J.V(p)){case"apply_fix":c=q.h(0,"fixType")
n=h.aJi(c==null?g:J.V(c))
if(n==null||o.length===0)return g
return new A.qc(B.Ck,o,n,g,g,g,g,g,g,g,g,g)
case"update_config":if(o.length===0)return g
return new A.qc(B.Cl,o,g,c.b(q.h(0,f))?A.bt(c.a(q.h(0,f)),s,r):g,g,g,g,g,g,g,g,g)
case"add_component":p=q.h(0,"componentType")
p=p==null?g:J.V(p)
m=h.a7i(p==null?"":p)
if(m==null)return g
p=q.h(0,"name")
p=p==null?g:J.V(p)
l=q.h(0,"connectFromKey")
l=l==null?g:J.V(l)
k=q.h(0,"connectToKey")
k=k==null?g:J.V(k)
j=q.h(0,e)
j=h.In(j==null?g:J.V(j))
i=q.h(0,d)
i=h.Ik(i==null?g:J.V(i))
return new A.qc(B.Cm,o,g,c.b(q.h(0,f))?A.bt(c.a(q.h(0,f)),s,r):g,m,p,l,k,g,g,j,i)
case"add_connection":c=q.h(0,"fromKey")
c=c==null?g:J.V(c)
s=q.h(0,"toKey")
s=s==null?g:J.V(s)
r=q.h(0,e)
r=h.In(r==null?g:J.V(r))
p=q.h(0,d)
return new A.qc(B.Cn,o,g,g,g,g,g,g,c,s,r,h.Ik(p==null?g:J.V(p)))}return g},
aJi(a){var s,r
if(a==null||B.c.N(a).length===0)return null
for(s=0;s<10;++s){r=B.yO[s]
if(r.b===B.c.N(a))return r}return null},
aOd(a){return A.u(["draft",a.a.b4(),"modelName",a.b,"promptVersion",a.c,"rawJson",a.d],t.N,t.z)},
a9G(a){var s,r,q,p,o,n=null,m=J.Y(a),l=m.h(a,"draft")
if(!t.f.b(l))throw A.d(A.c1("Cached specialization draft is missing draft payload"))
s=A.bt(l,t.N,t.z)
r=A.avs(s)
q=A.ao(m.h(a,"modelName"))
q=q==null?n:B.c.N(q)
if(q==null)q="gemini-2.5-flash"
p=A.ao(m.h(a,"promptVersion"))
p=p==null?n:B.c.N(p)
if(p==null)p="specialization_studio_v1"
o=A.ao(m.h(a,"rawJson"))
return new A.qd(r,q,p,(o==null?n:B.c.N(o).length!==0)===!0?B.c.N(A.bE(m.h(a,"rawJson"))):A.yz(s,n,"  "))},
aEC(a){var s,r,q
for(s=a.length,r=2166136261,q=0;q<s;++q)r=((r^a[q])>>>0)*16777619>>>0
return B.c.kQ(B.e.jI(r,16),8,"0")},
aJy(a8,a9){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4,a5,a6,a7=null
try{a=J.Y(a8)
s=a.h(a8,"score")
r=B.e.t(typeof s=="number"?B.d.P(s):0,0,100)
a0=A.ao(a.h(a8,"summary"))
a1=a0==null?a7:B.c.N(a0)
q=a1==null?"":a1
p=this.ld(a.h(a8,"issues"))
a0=t.N
o=A.ak(a0)
n=a9.h(0,"components")
a2=t.j
if(a2.b(n))for(a3=J.ar(n),a4=t.f;a3.p();){m=a3.gH(a3)
if(a4.b(m)){a5=J.aa(m,"key")
l=a5==null?a7:J.V(a5)
if(l!=null&&l.length!==0)J.cj(o,l)}}k=A.a([],t.Ji)
j=a.h(a8,"suggestions")
if(a2.b(j))for(a=J.ar(j),a2=t.z,a3=t.f;a.p();){i=a.gH(a)
if(!a3.b(i))continue
h=A.bt(i,a0,a2)
a4=A.ao(J.aa(h,"id"))
g=a4==null?a7:B.c.N(a4)
a4=A.ao(J.aa(h,"title"))
f=a4==null?a7:B.c.N(a4)
a4=A.ao(J.aa(h,"details"))
e=a4==null?a7:B.c.N(a4)
if(g==null||g.length===0||f==null||f.length===0)continue
a4=A.ao(J.aa(h,"componentKey"))
d=a4==null?a7:B.c.N(a4)
c=this.aJx(J.aa(h,"action"),o)
a4=e
if(a4==null)a4=""
J.cj(k,new A.lu(g,f,a4,d,c))}return new A.lt(r,q,p,k,a7)}catch(a6){b=A.ac(a6)
a="AI review parse failed: "+A.m(b)
a0=A.a([a],t.s)
return new A.lt(0,"Unable to review design.",a0,B.yY,a)}},
aJx(a4,a5){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a=this,a0=null,a1="protocol",a2="direction",a3=t.f
if(!a3.b(a4))return a0
s=t.N
r=t.z
q=A.bt(a4,s,r)
p=q.h(0,"type")
o=p==null?a0:J.V(p)
p=q.h(0,"componentKey")
n=p==null?a0:J.V(p)
if(n==null)n=""
if(o==null)return a0
switch(o){case"apply_fix":if(n.length===0||!a5.k(0,n))return a0
a3=q.h(0,"fixType")
m=a3==null?a0:J.V(a3)
if(m==null)return a0
k=0
for(;;){if(!(k<10)){l=a0
break}j=B.yO[k]
if(j.b===m){l=j
break}++k}if(l==null)return a0
return new A.qc(B.Ck,n,l,a0,a0,a0,a0,a0,a0,a0,a0,a0)
case"update_config":if(n.length===0||!a5.k(0,n))return a0
i=q.h(0,"config")
if(!a3.b(i))return a0
h=a.a8w(A.bt(i,s,r))
if(h.a===0)return a0
return new A.qc(B.Cl,n,a0,h,a0,a0,a0,a0,a0,a0,a0,a0)
case"add_component":p=q.h(0,"componentType")
g=p==null?a0:J.V(p)
if(g==null)return a0
f=a.a7i(g)
if(f==null)return a0
p=q.h(0,"connectFromKey")
e=p==null?a0:J.V(p)
p=q.h(0,"connectToKey")
d=p==null?a0:J.V(p)
if(e!=null&&!a5.k(0,e))return a0
if(d!=null&&!a5.k(0,d))return a0
i=q.h(0,"config")
h=a3.b(i)?a.a8w(A.bt(i,s,r)):a0
a3=q.h(0,"name")
a3=a3==null?a0:J.V(a3)
s=q.h(0,a1)
s=a.In(s==null?a0:J.V(s))
r=q.h(0,a2)
return new A.qc(B.Cm,n,a0,h,f,a3,e,d,a0,a0,s,a.Ik(r==null?a0:J.V(r)))
case"add_connection":a3=q.h(0,"fromKey")
c=a3==null?a0:J.V(a3)
a3=q.h(0,"toKey")
b=a3==null?a0:J.V(a3)
if(c==null||b==null)return a0
if(!a5.k(0,c)||!a5.k(0,b))return a0
a3=q.h(0,a1)
a3=a.In(a3==null?a0:J.V(a3))
s=q.h(0,a2)
return new A.qc(B.Cn,n,a0,a0,a0,a0,a0,a0,c,b,a3,a.Ik(s==null?a0:J.V(s)))}return a0},
a7i(a){var s,r
for(s=0;s<107;++s){r=B.es[s]
if(r.b===a)return r}return null},
In(a){var s,r,q
if(a==null||B.c.N(a).length===0)return null
s=B.c.N(a.toLowerCase())
for(r=0;r<6;++r){q=B.yM[r]
if(q.b.toLowerCase()===s||q.c.toLowerCase()===s)return q}return null},
Ik(a){var s,r,q
if(a==null||B.c.N(a).length===0)return null
s=B.c.N(a.toLowerCase())
for(r=0;r<2;++r){q=B.ama[r]
if(q.b.toLowerCase()===s||q.c.toLowerCase()===s)return q}return null},
a8w(a){var s,r,q,p=A.j(t.N,t.z),o=new A.apL(a),n=new A.apM(a)
for(s=B.T8.gT(B.T8);s.p();){r=s.gH(0)
q=o.$1(r)
if(q!=null)p.j(0,r,q)}for(s=B.T6.gT(B.T6);s.p();){r=s.gH(0)
q=n.$1(r)
if(q!=null)p.j(0,r,q)}return p},
ld(a){var s
if(!t.j.b(a))return B.t
s=J.cq(a,new A.apO(),t.N).cA(0,new A.apP())
s=A.r(s,s.$ti.i("k.E"))
s.$flags=1
return s},
a7j(a){var s,r
if(a==null||B.c.N(a).length===0)return null
for(s=0;s<107;++s){r=B.es[s]
if(r.b===B.c.N(a))return r}return null},
aJ8(a){var s,r,q,p
if(a==null||B.c.N(a).length===0)return null
s=B.c.N(a).toLowerCase()
for(r=0;r<6;++r){q=B.yM[r]
if(q.b.toLowerCase()===s)return q}$label0$0:{if("https"===s||"http"===s){p=B.kK
break $label0$0}if("ws"===s){p=B.rY
break $label0$0}p=null
break $label0$0}return p},
aJ7(a){var s,r
if(a==null||B.c.N(a).length===0)return null
s=B.c.N(a).toLowerCase()
$label0$0:{if("bidirectional"===s||"two_way"===s||"two-way"===s){r=B.kI
break $label0$0}if("unidirectional"===s||"one_way"===s||"one-way"===s){r=B.cz
break $label0$0}r=null
break $label0$0}return r},
aJa(a){var s,r,q,p,o,n,m,l,k
$label0$0:{s=t.P
if(s.b(a)){r=a
break $label0$0}if(t.f.b(a)){r=A.bt(a,t.N,t.z)
break $label0$0}r=A.a3(A.c1("Invalid AI generation response: "+A.m(a)))}q=J.aa(r,"result")
if(q==null)q=r
$label1$1:{if(s.b(q)){s=q
break $label1$1}if(t.f.b(q)){s=A.bt(q,t.N,t.z)
break $label1$1}s=A.a3(A.c1("AI response must be a JSON object"))}r=J.Y(s)
p=A.ao(r.h(s,"designName"))
o=p==null?null:B.c.N(p)
if(o==null)o=""
p=A.ao(r.h(s,"summary"))
n=p==null?null:B.c.N(p)
if(n==null)n=""
if(o.length===0)throw A.d(A.c1("AI response missing designName"))
if(n.length===0)throw A.d(A.c1("AI response missing summary"))
p=t.kc.a(r.h(s,"assumptions"))
if(p==null)p=B.U
m=t.N
l=A.c8(p,!0,m)
k=r.h(s,"blueprint")
if(!t.f.b(k))throw A.d(A.c1("AI response missing blueprint object"))
return new A.a_l(this.aHf(A.bt(k,m,t.z)),o,n,l)},
Sj(a){return A.u(["id",a.a,"title",a.b,"description",a.c,"scenario",a.d,"difficulty",a.x,"constraints",a.e.b4()],t.N,t.z)},
p7(a,b){return this.aFc(a,b)},
aFc(a,b){var s=0,r=A.A(t.z),q,p=2,o=[],n=this,m,l,k,j
var $async$p7=A.w(function(c,d){if(c===1){o.push(d)
s=p}for(;;)switch(s){case 0:p=4
s=7
return A.n(n.HK(a,b),$async$p7)
case 7:l=d
q=l
s=1
break
p=2
s=6
break
case 4:p=3
j=o.pop()
m=A.ac(j)
if(!n.aNj(m))throw j
s=8
return A.n(n.BV(),$async$p7)
case 8:q=n.HK(a,b)
s=1
break
s=6
break
case 3:s=2
break
case 6:case 1:return A.y(q,r)
case 2:return A.x(o.at(-1),r)}})
return A.z($async$p7,r)},
HK(a,b){return this.aFa(a,b)},
aFa(a,b){var s=0,r=A.A(t.z),q,p=this,o,n
var $async$HK=A.w(function(c,d){if(c===1)return A.x(d,r)
for(;;)switch(s){case 0:$label0$0:{if("ai-generate-design"===a){o=p.awU(b)
break $label0$0}o=b
break $label0$0}n=$.ct().b
n===$&&A.b()
n=n.as
n===$&&A.b()
q=n.kL(a,o)
s=1
break
case 1:return A.y(q,r)}})
return A.z($async$HK,r)},
awU(b1){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4,a5=null,a6="constraints",a7="customConstraints",a8=b1.h(0,"problem"),a9=b1.h(0,"input"),b0=t.f
if(b0.b(a8)&&b0.b(a9)){s=J.Y(a8)
r=b0.b(s.h(a8,a6))?A.bt(b0.a(s.h(a8,a6)),t.N,t.z):B.ba
q=J.Y(a9)
p=q.h(a9,"systemName")
p=p==null?a5:J.V(p)
if(p==null)p=""
o=q.h(a9,"useCase")
o=o==null?a5:J.V(o)
if(o==null)o=""
n=A.aq(q.h(a9,"targetDau"))
n=n==null?a5:B.d.P(n)
if(n==null)n=0
m=A.aq(q.h(a9,"peakRps"))
m=m==null?a5:B.d.P(m)
if(m==null)m=0
l=this.ld(q.h(a9,"regions"))
k=this.ld(q.h(a9,"priorities"))
j=q.h(a9,"compliance")
j=j==null?a5:J.V(j)
i=q.h(a9,"dataStorePreference")
i=i==null?a5:J.V(i)
q=q.h(a9,"extraContext")
q=q==null?a5:J.V(q)
h=s.h(a8,"id")
if(h!=null)J.V(h)
h=s.h(a8,"title")
h=h==null?a5:J.V(h)
if(h==null)h="Generated Problem"
g=s.h(a8,"description")
g=g==null?a5:J.V(g)
if(g==null)g=""
f=s.h(a8,"scenario")
if(f!=null)J.V(f)
s=A.aq(s.h(a8,"difficulty"))
if(s!=null)B.d.P(s)
s=A.aq(r.h(0,"dau"))
s=s==null?a5:B.d.P(s)
if(s==null)s=0
f=A.aq(r.h(0,"qps"))
f=f==null?a5:B.d.P(f)
if(f==null)f=0
e=A.aq(r.h(0,"readWriteRatio"))
if(e==null)e=a5
if(e==null)e=10
d=A.aq(r.h(0,"latencySlaMsP50"))
d=d==null?a5:B.d.P(d)
if(d==null)d=50
c=A.aq(r.h(0,"latencySlaMsP95"))
c=c==null?a5:B.d.P(c)
if(c==null)c=200
b=A.aq(r.h(0,"availabilityTarget"))
if(b==null)b=a5
if(b==null)b=0.999
a=A.aq(r.h(0,"budgetPerMonth"))
a=a==null?a5:B.d.P(a)
if(a==null)a=1e4
a0=A.aq(r.h(0,"dataStorageGb"))
a0=a0==null?a5:B.d.P(a0)
if(a0==null)a0=100
a1=this.ld(r.h(0,"regions"))
b0=new A.pj(s,f,e,d,c,b,a,a0,a1,b0.b(r.h(0,a7))?A.bt(b0.a(r.h(0,a7)),t.N,t.z):B.ba)
a2=A.yz(new A.DP(p,o,n,m,l,k,j,i,q).NC(),a5,"  ")
a3=A.yz(B.awk,a5,"  ")
a4=A.yz(B.awi,a5,"  ")
return A.u(["prompt","You are a principal distributed systems architect generating simulator-ready designs.\n\nProject constraints from simulator problem:\n- title: "+h+"\n- description: "+g+"\n- target QPS: "+b0.gyi()+"\n- latency SLA p95(ms): "+c+"\n- availability target: "+b0.gCJ()+"\n- monthly budget USD: "+a+"\n\nInput schema:\n"+a3+"\n\nOutput schema:\n"+a4+"\n\nUser input payload:\n"+a2+'\n\nRules:\n1) Return ONLY valid JSON.\n2) Generate a creative and meaningful "designName" for this architecture (e.g., "The Resilience Mesh", "Global Edge Backbone", "High-Throughput Social Core") that reflects its purpose and scale. Avoid generic names.\n3) Blueprint must be directly consumable by importer:\n   - blueprint.components is a map of id -> component object\n   - each component object must contain: id, type, name, position{x,y}\n   - use component types compatible with this simulator such as:\n     user, api_gateway, load_balancer, app_server, cache, database,\n     queue, cdn, dns, object_store, auth_service, notification_service.\n3) blueprint.connections must use fields: from, to, protocol, optional label.\n4) Keep IDs simple snake_case and ensure all connection endpoints exist.\n5) Generate 8-20 components depending on scale.\n6) Consider reliability and scale tradeoffs for the provided constraints.\n7) Placement is mandatory and should be high quality (do NOT leave defaults):\n   - Place in left-to-right flow (ingress/edge on left, app/services middle, data/sinks right).\n   - Avoid overlaps completely; keep at least 140px horizontal and 110px vertical spacing.\n   - Keep strongly related services near each other.\n   - Minimize edge crossings with coherent layering.\n   - Use simulator canvas coordinates in a visible band, roughly:\n     x: 4700..6900, y: 4300..6200.\n8) Do not return random grid placement. Position components intentionally based on data flow.\n',"model","gemini-2.5-flash"],t.N,t.z)}return b1},
BV(){var s=0,r=A.A(t.H),q=this,p,o,n
var $async$BV=A.w(function(a,b){if(a===1)return A.x(b,r)
for(;;)switch(s){case 0:s=2
return A.n(q.c.$0(),$async$BV)
case 2:p=$.ct().b
p===$&&A.b()
o=p.geS().c
n=o==null?null:o.e
s=n!=null&&n.length!==0?3:4
break
case 3:s=5
return A.n(p.geS().EV(n),$async$BV)
case 5:case 4:return A.y(null,r)}})
return A.z($async$BV,r)},
aNj(a){var s
if(a instanceof A.NO&&a.a===401)return!0
s=J.V(a).toLowerCase()
return B.c.k(s,"invalid jwt")||B.c.k(s,"jwt expired")||B.c.k(s,"expired jwt")},
pg(a){var s,r,q,p,o,n=this,m="AI response must be a JSON object"
if(typeof a=="string"){q=B.c.N(a)
if(q.length===0)throw A.d(A.c1(m))
return n.pg(B.ak.fA(0,q,null))}if(t.P.b(a))return n.aPL(a)
if(t.f.b(a))return n.pg(A.bt(a,t.N,t.z))
try{s=J.bVT(a)
if(s!=null){p=n.pg(s)
return p}}catch(o){}try{r=J.bGr(a)
if(r!=null){p=n.pg(r)
return p}}catch(o){}throw A.d(A.c1(m))},
aPL(a){var s,r,q,p
for(s=t.f,r=J.Y(a),q=0;q<3;++q){p=r.h(a,B.asy[q])
if(s.b(p)||typeof p=="string")return this.pg(p)}if(s.b(r.h(a,"draft"))||r.h(a,"status")!=null||r.h(a,"score")!=null||r.h(a,"summary")!=null||s.b(r.h(a,"blueprint")))return a
return a}}
