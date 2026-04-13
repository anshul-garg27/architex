A.aGW.prototype={
R(a){var s,r,q,p=this
B.b.aa(p.ay)
s=p.ch
B.b.aa(s)
B.b.aa(p.CW)
B.b.aa(p.cx)
B.b.aa(p.cy)
p.dy=!1
p.x.av(0,new A.aGY())
s.push(new A.TI(null,A.a([],t.p)))
for(r=a.length,q=0;q<a.length;a.length===r||(0,A.o)(a),++q)a[q].cT(0,p)
return B.b.geB(s).b},
Z7(a){var s,r,q,p,o,n,m,l,k,j=this,i=a.a
if(j.db==null)j.db=i
j.dx=i
s=j.x
if(s.ae(0,i))s.h(0,i).Z7(a)
s=j.y
if(s.ae(0,i))s.h(0,i).Z7(a)
if(B.b.k($.bs9,i)){j.a0K()
r=null
if(B.b.k(B.Il,i)){j.ay.push(i)
s=a.c
if(s.h(0,"start")!=null){s=s.h(0,"start")
s.toString
r=A.dN(s,null)-1}}else if(i==="blockquote")j.dy=!0
else if(i==="table")j.CW.push(new A.akf(A.a([],t.nm)))
else if(i==="tr"){s=j.CW
q=B.b.geB(s).a.length
p=j.c.p2
if(q===0||(q&1)===1)p=null
B.b.geB(s).a.push(new A.rw(p,A.a([],t.p)))}o=new A.TI(i,A.a([],t.p))
if(r!=null)o.c=r
j.ch.push(o)}else{if(i==="a"){n=j.aey(a)
if(n==null)return!1
s=a.c
m=s.h(0,"href")
l=s.h(0,"title")
if(l==null)l=""
j.cy.push(j.a.aVN(n,m,l))}j.a0U(B.b.gY(j.ch).a)
if(i==="td"){s=a.b
s=s!=null&&J.em(s)}else s=!1
if(s){s=a.b
s.toString
J.cj(s,new A.eJ(""))}s=j.cx
k=B.b.gY(s).b
k.toString
s.push(new A.Vg(k.ba(j.c.ai.h(0,i)),A.a([],t.p)))}return!0},
aey(a){var s,r=a instanceof A.cN
if(r){s=a.b
s=s==null?null:J.i3(s)
s=s===!0}else s=!1
if(s){r=a.b
r.toString
r=J.cq(r,new A.aGZ(this),t.A).hZ(0)}else r=r&&a.c.a!==0?a.c.h(0,"alt"):""
return r},
b5k(a){var s,r,q,p=this,o=null,n=p.ch
if(B.b.gY(n).a==null)return
p.a0U(B.b.gY(n).a)
if(n.length!==0&&p.x.ae(0,B.b.gY(n).a)){s=B.b.gY(n).a
s.toString
s=p.x.h(0,s)
s.toString
n=B.b.gY(n).a
n.toString
r=s.b6i(a,p.c.ai.h(0,n))}else if(B.b.gY(n).a==="pre")r=new A.X9(new A.aH0(p),p.PC(p.a.aYt(p.c,a.a)),o)
else{n=p.cx
if(p.dy){s=p.c.cy
s.toString
n=s.ba(B.b.gY(n).b)}else n=B.b.gY(n).b
s=new A.aH1(p).$1(a.a)
q=p.cy
r=p.PD(A.cF(o,o,q.length!==0?B.b.gY(q):o,o,n,s),p.aa5(p.db))}B.b.gY(p.cx).c.push(r)
p.dx=null},
b5j(a0){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c=this,b=null,a=a0.a
if(B.b.k($.bs9,a)){c.a0K()
s=c.ch.pop()
c.x.h(0,a)
r=new A.aH_(c,s).$0()
if(B.b.k(B.Il,a))c.ay.pop()
else if(a==="li"){q=c.ay
if(q.length!==0){p=a0.b
p.toString
o=J.Y(p)
if(o.ga3(p))o.B(p,new A.eJ(""))
n=o.h(p,0)
m=n instanceof A.cN&&n.c.h(0,"type")==="checkbox"?c.atw(n.c.ae(0,"checked")):c.atv(B.b.gY(q))
q=c.Q===B.axL
p=q?b:B.a1
q=q?B.A:B.nj
o=c.c
l=o.fr
l.toString
o=o.fy
k=o.a
o=o.c
r=A.al(A.a([new A.aL(l+k+o,b,m,b),new A.hm(1,B.d_,r,b)],t.p),q,B.f,B.j,0,p)}}else if(a==="table")r=c.auj()
else if(a==="blockquote"){c.dy=!1
q=c.c
p=q.R8
p.toString
q=q.p4
q.toString
r=A.wp(new A.ap(q,r,b),p,B.jE)}else if(a==="pre")r=A.ab(b,r,B.y,b,b,c.c.rx,b,b,b,b,b,b,b,b)
else if(a==="hr")r=A.ab(b,b,B.i,b,b,c.c.ry,b,b,b,b,b,b,b,b)
c.Pg(r)}else{q=c.cx
s=q.pop()
j=B.b.gY(q)
q=c.y
i=q.ae(0,a)?q.h(0,a).akD():B.aw
q=c.x
if(q.ae(0,a)){q=q.h(0,a)
q.toString
p=c.a.c
p.toString
r=q.b6h(p,a0,c.c.ai.h(0,a),j.b)
q=s.c
if(q.length===0)q.push(r)
else q[0]=r}else if(a==="img"){q=a0.c
p=q.h(0,"src")
p.toString
s.c.push(c.au7(i,c.atS(p,q.h(0,"title"),q.h(0,"alt"))))}else if(a==="br")s.c.push(c.PC(B.aI1))
else{q=a==="th"
if(q||a==="td"){h=a0.c.h(0,"align")
if(h==null)g=q?c.c.k1:B.fk
else switch(h){case"left":g=B.fk
break
case"center":g=B.bb
break
case"right":g=B.fR
break
default:g=b}r=c.auk(c.a6x(s.c,g),g)
B.b.gY(B.b.geB(c.CW).a).c.push(r)}else if(a==="a")c.cy.pop()
else if(a==="sup"){q=s.c
f=B.b.gY(q)
if(f instanceof A.a5&&f.d instanceof A.lb){p=f.d
p.toString
e=p}else e=f instanceof A.xI&&f.d instanceof A.lb?f.d:b
if(e!=null){p=e.d
o=a0.gkf()
l=e.a
if(l==null)l=b
else{k=A.a([B.ac2],t.xU)
l=l.aTK(k)}d=c.PC(A.cF(b,b,p,b,l,o))
q.pop()
q.push(d)}}}q=s.c
if(q.length!==0)B.b.q(j.c,q)}if(c.db===a)c.db=null
c.dx=a},
auj(){var s=this.c,r=s.k4
r.toString
return A.c2W(s.k3,this.CW.pop().a,r,s.p3)},
atS(a,b,c){var s,r,q,p,o,n,m,l=null,k=a.split("#")
if(k.length===0)return B.op
s=B.b.gS(k)
r=l
q=l
if(k.length===2){p=B.b.gY(k).split("x")
if(p.length===2){r=A.l_(p[0])
q=A.l_(p[1])}}o=A.a9Z(s)
if(o==null)return B.op
n=$.bVj().$4(o,this.d,r,q)
m=this.cy
if(m.length!==0)return A.f7(l,n,B.ay,!1,l,l,l,l,l,l,l,l,l,l,l,l,l,l,l,l,l,l,l,l,l,B.b.gY(m).X,l,l,l,l,l,l,!1,B.bv)
else return n},
atw(a){var s,r,q=this.c,p=q.fy
p.toString
s=a?B.acK:B.tK
q=q.dx
r=q.r
return new A.ap(p,A.bv(s,q.b,null,r),null)},
atv(a){var s,r,q=null,p=B.b.gY(this.ch).c
if(a==="ul"){s=this.c
r=s.fy
r.toString
return new A.ap(r,A.B("\u2022",q,q,q,q,s.fx,B.bb,q,q),q)}s=this.c
r=s.fy
r.toString
return new A.ap(r,A.B(""+(p+1)+".",q,q,q,q,s.fx,B.fR,q,q),q)},
auk(a,b){var s,r=null,q=this.c,p=q.p1
p.toString
q=q.id
q.toString
$label0$0:{if(B.fk===b){s=B.a8
break $label0$0}if(B.bb===b){s=B.lg
break $label0$0}if(B.fR===b){s=B.Vx
break $label0$0}s=B.a8
break $label0$0}return new A.a97(new A.ap(p,A.jC(A.f2(s,t.Tp.a(a),B.bE,0,0),r,r,B.dX,!0,q,b,r,B.aG),r),r)},
au7(a,b){if(a.m(0,B.aw))return b
return new A.ap(a,b,null)},
a0U(a){var s=this.cx
if(s.length===0){a.toString
s.push(new A.Vg(this.c.ai.h(0,a),A.a([],t.p)))}},
Pg(a){var s=B.b.gY(this.ch),r=s.b
if(r.length!==0)r.push(new A.aL(null,this.c.dy,null,null))
r.push(a);++s.c},
a0K(){var s,r,q,p,o,n,m=this,l=m.cx
if(l.length===0)return
if(B.b.k($.bs9,m.db)){s=m.db
r=m.abH(s)
q=m.aa5(s)
p=m.aOR(s)
o=m.y
if(o.ae(0,s))p=o.h(0,m.db).akD()}else{r=B.a8
q=B.ah
p=B.aw}s=B.b.geB(l).c
if(s.length!==0){n=A.f2(r,m.a6x(s,q),B.vx,0,0)
if(p.m(0,B.aw))m.Pg(n)
else m.Pg(new A.ap(p,n,null))
B.b.aa(l)}},
a4v(a){var s=a.c
if(s==null)return A.a([a],t.VO)
return new A.q(s,new A.aGX(a),A.v(s).i("q<1,iW>"))},
a4u(a){var s
$label0$0:{if(a instanceof A.xI){s=a.d
break $label0$0}if(a instanceof A.a5){s=a.d
break $label0$0}if(a instanceof A.QD){s=a.e
break $label0$0}s=null
break $label0$0}return s},
a6x(a,b){var s,r,q,p,o,n,m,l,k,j,i,h=this,g=null,f=A.a([],t.p)
for(s=a.length,r=t.VO,q=!1,p=0;p<a.length;q=!m,a.length===s||(0,A.o)(a),++p){o=a[p]
n=h.a4u(o)
m=n==null
if(m){f.push(o)
continue}l=A.a([],r)
if(q){k=h.a4u(f.pop())
k.toString
B.b.q(l,h.a4v(k))}B.b.q(l,h.a4v(n))
l=h.aGJ(l)
if(l.length===0)j=o
else{i=B.b.gS(l)
j=h.PD(l.length===1&&i instanceof A.lb?i:A.cF(l,g,g,g,g,g),b)}f.push(j)}return f},
aa5(a){switch(this.abH(a).a){case 0:return B.ah
case 2:return B.bb
case 1:return B.qY
case 4:return B.ld
case 3:return B.ld
case 5:return B.ld}},
abH(a){var s=this
switch(a){case"p":return s.c.to
case"h1":return s.c.x1
case"h2":return s.c.x2
case"h3":return s.c.xr
case"h4":return s.c.y1
case"h5":return s.c.y2
case"h6":return s.c.aZ
case"ul":return s.c.bj
case"ol":return s.c.F
case"blockquote":return s.c.U
case"pre":return s.c.X
case"hr":break
case"li":break}return B.a8},
aOR(a){var s,r=this
switch(a){case"p":s=r.c.c
s.toString
return s
case"h1":s=r.c.f
s.toString
return s
case"h2":s=r.c.w
s.toString
return s
case"h3":s=r.c.y
s.toString
return s
case"h4":s=r.c.Q
s.toString
return s
case"h5":s=r.c.at
s.toString
return s
case"h6":s=r.c.ay
s.toString
return s}return B.aw},
aGJ(a){var s,r,q,p,o,n,m,l,k,j
if(a.length<2)return a
s=t.VO
r=A.a([],s)
for(q=1;q<a.length;++q){p=r.length===0?B.b.gS(a):r.pop()
o=a[q]
if(!(p instanceof A.lb)||!(o instanceof A.lb)){B.b.q(r,A.a([p,o],s))
continue}n=p.d
if(o.d==n)m=J.e(o.a,p.a)
else m=!1
if(m){l=new A.dl("")
p.D0(l,!0,!0)
k=l.a
l=new A.dl("")
o.D0(l,!0,!0)
j=l.a
r.push(A.cF(null,null,n,p.w,p.a,(k.charCodeAt(0)==0?k:k)+(j.charCodeAt(0)==0?j:j)))}else B.b.q(r,A.a([p,o],s))}return r},
PD(a,b){var s=b==null?B.ah:b
return new A.xI(null,a,null,s,this.c.a8,this.at,null,new A.pG())},
PC(a){return this.PD(a,null)}}
