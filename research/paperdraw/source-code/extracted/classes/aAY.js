A.aAY.prototype={
MX(a){return this.b2p(a)},
b2p(a){var s=0,r=A.A(t.dd),q,p=this,o,n
var $async$MX=A.w(function(b,c){if(b===1)return A.x(c,r)
for(;;)switch(s){case 0:case 3:switch(p.aWk(a).a){case 0:s=5
break
case 1:s=6
break
case 2:s=7
break
case 3:s=8
break
case 4:s=9
break
case 5:s=10
break
case 6:s=11
break
default:s=12
break}break
case 5:o=A.a3(B.acm)
s=4
break
case 6:o=p.aJg(a)
s=4
break
case 7:s=13
return A.n(p.Il(a),$async$MX)
case 13:o=c
s=4
break
case 8:o=new A.qL(a,B.y2,A.a([A.ca6(a)],t.P8),B.t)
s=4
break
case 9:n=A.ca4(a)
o=new A.qL(a,B.FR,A.a([n.a],t.P8),n.b)
s=4
break
case 10:n=A.cae(a)
o=new A.qL(a,B.y3,A.a([n.a],t.P8),n.b)
s=4
break
case 11:o=A.a3(B.acj)
s=4
break
case 12:o=null
case 4:q=o
s=1
break
case 1:return A.y(q,r)}})
return A.z($async$MX,r)},
aWk(a){var s,r,q,p,o,n,m
if(a.gyM())return B.FS
r=a.gW5()
q=B.c.NG(a.gkf())
if(r==="drawio"||r==="xml")return B.y1
if(r==="excalidraw")return B.y0
if(r==="mmd"||r==="mermaid")return B.y2
p=!1
if(r==="yaml"||r==="yml"){o=A.ad("^\\s*apiVersion\\s*:",!0,!0,!1)
if(o.b.test(q)){p=A.ad("^\\s*kind\\s*:",!0,!0,!1)
p=p.b.test(q)}}if(p)return B.FR
if(r==="tf"||r==="hcl")return B.y3
if(B.c.aT(q,"<mxfile")||B.c.aT(q,"<mxGraphModel"))return B.y1
n=B.c.NG(q)
p=A.ad("^(flowchart|graph)\\b",!1,!0,!1)
if(!p.b.test(n)){p=A.ad("^\\s*subgraph\\b",!1,!0,!1)
p=p.b.test(n)}else p=!0
if(p)return B.y2
p=A.ad('^\\s*(resource|module|data|provider)\\s+"',!0,!0,!1)
if(p.b.test(q))return B.y3
try{s=B.ak.fA(0,a.gkf(),null)
if(t.f.b(s)&&t.j.b(J.aa(s,"elements")))return B.y0}catch(m){if(t.bE.b(A.ac(m)))throw A.d(B.G0)
else throw m}throw A.d(B.G0)},
aJg(c9){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,b0,b1,b2,b3,b4,b5,b6,b7,b8=null,b9="elements",c0="type",c1="text",c2="containerId",c3="startBinding",c4="elementId",c5="endBinding",c6="strokeColor",c7=B.ak.fA(0,c9.gkf(),b8),c8=t.f
if(!c8.b(c7)||!t.j.b(J.aa(c7,b9)))throw A.d(B.acg)
s=J.Y(c7)
r=J.jv(t.j.a(s.h(c7,b9)),c8)
r=A.dd(r,new A.aBb(),r.$ti.i("k.E"),t.P)
q=A.l(r).i("J<k.E>")
r=A.r(new A.J(r,new A.aBc(),q),q.i("k.E"))
r.$flags=1
p=r
r=t.N
o=A.j(r,r)
n=A.a([],t.e)
m=A.a([],t.s)
for(q=p.length,l=0;l<p.length;p.length===q||(0,A.o)(p),++l){k=p[l]
j=J.Y(k)
i=j.h(k,c0)
if((i==null?b8:J.V(i))!=="text")continue
i=j.h(k,c1)
i=i==null?b8:J.V(i)
if(i==null){i=j.h(k,"rawText")
i=i==null?b8:J.V(i)}h=A.eV(i==null?"":i)
j=j.h(k,c2)
g=j==null?b8:J.V(j)
if(g!=null&&h.length!==0)o.j(0,g,h)
else n.push(k)}f=A.a([],t.ZT)
e=A.a([],t.LV)
q=t.YT
d=A.j(r,q)
j=t.c8
c=A.j(r,j)
b=A.j(r,q)
a=A.j(r,j)
a0=A.j(r,r)
a1=new A.aBa(d)
a2=new A.aB9(b)
for(q=p.length,j=t.z,l=0;l<p.length;p.length===q||(0,A.o)(p),++l){k=p[l]
i=J.Y(k)
a3=i.h(k,c0)
a4=a3==null?b8:J.V(a3)
if(a4==null)a4=""
a3=i.h(k,"id")
a5=a3==null?b8:J.V(a3)
if(a5==null||a5.length===0)continue
if(a4==="frame"){b.j(0,a5,A.bDV(k))
a3=i.h(k,"name")
a3=a3==null?b8:J.V(a3)
if(a3==null)a3=o.h(0,a5)
if(a3==null){i=i.h(k,c1)
i=i==null?b8:J.V(i)}else i=a3
a0.j(0,a5,A.eV(i==null?"":i))
continue}if(a4==="arrow"||A.c8T(k)){if(c8.b(i.h(k,c3))){a3=J.aa(c8.a(i.h(k,c3)),c4)
a6=a3==null?b8:J.V(a3)}else a6=b8
if(c8.b(i.h(k,c5))){a3=J.aa(c8.a(i.h(k,c5)),c4)
a7=a3==null?b8:J.V(a3)}else a7=b8
if(a6==null||a7==null)m.push('Skipped floating connector "'+a5+'" because it was not bound to two shapes.')
a3=o.h(0,a5)
if(a3==null)a3=""
e.push(new A.ig(a5,a3,a6,a7,A.c7F(k),A.u(["sourceType",a4,"strokeColor",i.h(k,c6)],r,j)))
continue}if(a4==="text"){if(i.h(k,c2)!=null)continue
a8=A.bDV(k)
a3=i.h(k,c1)
a3=a3==null?b8:J.V(a3)
if(a3==null){a3=i.h(k,"rawText")
a3=a3==null?b8:J.V(a3)}a9=a8.a
b0=a8.b
f.push(new A.dS(a5,A.eV(a3==null?"":a3),new A.i(a9,b0),new A.K(a8.c-a9,a8.d-b0),c1,A.bEb(k),!0,A.u(["sourceType",a4],r,j)))
for(a3=A.bEb(k),a9=a3.length,b1=0;b1<a3.length;a3.length===a9||(0,A.o)(a3),++b1){b2=a3[b1]
a1.$2(b2,a8)
c.b_(0,b2,new A.aBd()).B(0,a5)}i=i.h(k,"frameId")
b3=i==null?b8:J.V(i)
if(b3!=null&&b3.length!==0){a2.$2(b3,a8)
a.b_(0,b3,new A.aBe()).B(0,a5)}continue}a8=A.bDV(k)
b4=A.bEb(k)
a3=i.h(k,"frameId")
b3=a3==null?b8:J.V(a3)
a3=A.r(b4,r)
a9=b3!=null
if(a9&&b3.length!==0)a3.push(b3)
b0=o.h(0,a5)
if(b0==null){b0=i.h(k,c1)
b0=b0==null?b8:J.V(b0)}if(b0==null){b0=i.h(k,"name")
b0=b0==null?b8:J.V(b0)}b5=a8.a
b6=a8.b
f.push(new A.dS(a5,A.eV(b0==null?"":b0),new A.i(b5,b6),new A.K(a8.c-b5,a8.d-b6),a4,a3,!1,A.u(["sourceType",a4,"strokeColor",i.h(k,c6),"backgroundColor",i.h(k,"backgroundColor")],r,j)))
for(i=b4.length,b1=0;b1<b4.length;b4.length===i||(0,A.o)(b4),++b1){b2=b4[b1]
a1.$2(b2,a8)
c.b_(0,b2,new A.aBf()).B(0,a5)}if(a9&&b3.length!==0){a2.$2(b3,a8)
a.b_(0,b3,new A.aBg()).B(0,a5)}}c8=A.a([],t.K8)
for(r=new A.br(d,d.$ti.i("br<1,2>")).gT(0);r.p();){b7=r.d
q=b7.a
j=b7.b
i=j.a
a3=j.b
a9=c.h(0,q)
c8.push(new A.eG(q,"Group",new A.i(i,a3),new A.K(j.c-i,j.d-a3),(a9==null?B.cr:a9).bL(0),b8,B.avo))}for(r=new A.br(b,b.$ti.i("br<1,2>")).gT(0);r.p();){b7=r.d
q=b7.a
j=a0.h(0,q)
if((j==null?b8:j.length!==0)===!0){j=a0.h(0,q)
j.toString}else j="Frame"
i=b7.b
a3=i.a
a9=i.b
b0=a.h(0,q)
c8.push(new A.eG(q,j,new A.i(a3,a9),new A.K(i.c-a3,i.d-a9),(b0==null?B.cr:b0).bL(0),b8,B.avq))}s=s.h(c7,c0)
s=s==null?b8:J.V(s)
return new A.qL(c9,B.y0,A.a([new A.fm("main",A.eV(s==null?"":s)==="excalidraw"?"Main Scene":"Imported Scene",f,e,c8,m)],t.P8),B.t)},
Il(a){return this.aJf(a)},
aJf(a2){var s=0,r=A.A(t.dd),q,p=this,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1
var $async$Il=A.w(function(a3,a4){if(a3===1)return A.x(a4,r)
for(;;)switch(s){case 0:b=A.c41(a2.gkf()).gaiw(0)
a=A.a([],t.s)
a0=A.a([],t.P8)
a1=b.b
s=a1.grM()==="mxfile"?3:5
break
case 3:o=b.zM(0,"compressed")!=="false"
n=A.bPV("diagram",null)
a1=B.b.wb(b.m9$.a,t.Tn)
m=a1.$ti.i("J<k.E>")
a1=A.r(new A.J(a1,n,m),m.i("k.E"))
a1.$flags=1
l=a1
a1=t.ov,m=t.OS,k=t.bX,j=0
case 6:if(!(j<l.length)){s=8
break}i=l[j]
s=9
return A.n(p.IH(i,o),$async$Il)
case 9:h=a4
g=A.a([],a1)
new A.Tf(h,B.rt,!0,!0,!1,!1,!1).av(0,new A.am7(new A.zN(B.b.gabR(g),m)).gFk())
f=new A.CK(A.a([],a1),k)
e=new A.Te(f)
f.b=e
f.c=B.T7
f.q(0,g)
f=e.gaiw(0)
d=i.i5("id",null)
d=d==null?null:d.b
if(d==null)d="page_"+(j+1)
c=i.i5("name",null)
c=c==null?null:c.b
a0.push(p.a7k(f,d,A.eV(c==null?"Page "+(j+1):c)))
case 7:++j
s=6
break
case 8:s=4
break
case 5:if(a1.grM()==="mxGraphModel")a0.push(p.a7k(b,"page_1",a2.a))
else throw A.d(B.acc)
case 4:if(a0.length===0)throw A.d(B.acn)
q=new A.qL(a2,B.y1,a0,a)
s=1
break
case 1:return A.y(q,r)}})
return A.z($async$Il,r)},
IH(a,b){return this.aLq(a,b)},
aLq(a,b){var s=0,r=A.A(t.N),q,p,o,n
var $async$IH=A.w(function(c,d){if(c===1)return A.x(d,r)
for(;;)switch(s){case 0:o=B.c.N(A.c44(a))
n=o.length
if(n===0)throw A.d(B.acd)
if(B.c.aT(o,"<")){q=o
s=1
break}if(!b){q=B.c.aT(o,"%3C")?A.iG(o,0,n,B.ao,!1):o
s=1
break}s=3
return A.n(A.bxH(B.ks.c0(o)),$async$IH)
case 3:p=d
q=A.iG(p,0,p.length,B.ao,!1)
s=1
break
case 1:return A.y(q,r)}})
return A.z($async$IH,r)},
a7k(b7,b8,b9){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,b0,b1,b2,b3,b4=null,b5=A.a([],t.s),b6=A.AL(new A.c9(new A.yc(b7),t.N9),new A.aAZ())
if(b6==null)throw A.d(B.aca)
s=t.N
r=A.j(s,t.E2)
q=A.j(s,t.yp)
for(p=new A.yc(b6).gT(0),o=t.hY,n=new A.n2(p,o),m=t.Tn;n.p();){l=m.a(p.gH(0))
if(l.b.grM()!=="mxCell")continue
k=l.i5("id",b4)
j=k==null?b4:k.b
if(j==null||j.length===0)continue
k=A.bDp(l)
i=(k==null?b4:k.b.grM())==="mxCell"?b4:A.bDp(l)
k=l.i5("parent",b4)
h=k==null?b4:k.b
k=l.i5("source",b4)
k=k==null?b4:k.b
g=l.i5("target",b4)
g=g==null?b4:g.b
f=l.i5("vertex",b4)
f=f==null?b4:f.b
e=l.i5("edge",b4)
e=e==null?b4:e.b
d=i==null
if(d)c=b4
else{c=i.i5("label",b4)
c=c==null?b4:c.b}if(c==null)if(d)c=b4
else{c=i.i5("name",b4)
c=c==null?b4:c.b}if(c==null)if(d)c=b4
else{c=i.i5("value",b4)
c=c==null?b4:c.b}if(c==null){c=l.i5("value",b4)
c=c==null?b4:c.b}c=A.eV(c==null?"":c)
if(d)d=b4
else{d=i.i5("style",b4)
d=d==null?b4:d.b}if(d==null){d=l.i5("style",b4)
d=d==null?b4:d.b}if(d==null)d=""
r.j(0,j,new A.rM(j,h,k,g,f==="1",e==="1",c,d,A.AL(B.b.wb(l.m9$.a,m),new A.aB_())))
if(h!=null&&h.length!==0)J.cj(q.b_(0,h,new A.aB0()),j)}b=new A.aB8(A.j(s,t.YT),r)
a=A.ak(s)
for(p=r.$ti.i("aN<2>"),n=new A.aN(r,p).gT(0),l=p.i("cV<k.E>"),k=new A.cV(n,new A.aB1(),l),g=t.YX,f=t.PC;k.p();){e=n.gH(0)
a0=e.w.toLowerCase()
e=e.a
d=q.h(0,e)
if(d==null)d=B.t
c=!0
if(!new A.c9(J.cq(d,new A.aB2(r),g),f).aE(0,new A.aB3()))if(!A.ea(a0,"swimlane",0))if(!A.ea(a0,"group",0))d=A.ea(a0,"container",0)
else d=c
else d=c
else d=c
if(d)a.B(0,e)}a1=new A.aB7(r,a)
a2=A.a([],t.ZT)
a3=A.a([],t.K8)
a4=A.a([],t.LV)
for(n=new A.aN(r,p).gT(0),k=new A.cV(n,new A.aB4(),l),g=t.z;k.p();){f=n.gH(0)
e=f.a
a5=b.$1(e)
a6=a1.$1(e)
if(a.k(0,e)){d=q.h(0,e)
if(d==null)d=B.t
d=J.i5(d,new A.aB5(a))
d=A.r(d,d.$ti.i("k.E"))
d.$flags=1
c=f.r
if(c.length===0)c="Container"
a7=a5.a
a8=a5.b
a9=a5.c
b0=a5.d
b1=J.Y(a6)
b1=b1.gv(a6)===0?b4:b1.gY(a6)
a3.push(new A.eG(e,c,new A.i(a7,a8),new A.K(a9-a7,b0-a8),d,b1,A.u(["sourceType","drawio_group","style",f.w],s,g)))
continue}d=f.w
f=f.r
c=a5.a
a7=a5.b
a8=a5.c
a9=a5.d
b0=A.c7D(d)
a2.push(new A.dS(e,f,new A.i(c,a7),new A.K(a8-c,a9-a7),b0,a6,A.ea(d.toLowerCase(),"text",0),A.u(["sourceType","drawio_vertex","style",d],s,g)))}for(p=new A.aN(r,p).gT(0),l=new A.cV(p,new A.aB6(),l),n=t.yv;l.p();){k=p.gH(0)
f=k.c
if(f==null||k.d==null)b5.push('Skipped floating connector "'+k.a+'" because it was not attached to two nodes.')
b2=A.a([],n)
b3=k.x
if(b3!=null)for(e=new A.yc(b3).gT(0),d=new A.n2(e,o);d.p();){c=m.a(e.gH(0))
if(c.b.grM()!=="mxPoint")continue
a7=c.i5("x",b4)
a7=A.ZD(a7==null?b4:a7.b,0)
c=c.i5("y",b4)
b2.push(new A.i(a7,A.ZD(c==null?b4:c.b,0)))}a4.push(new A.ig(k.a,k.r,f,k.d,b2,A.u(["sourceType","drawio_edge","style",k.w],s,g)))}return new A.fm(b8,b9.length===0?"Imported Page":b9,a2,a4,a3,b5)}}
