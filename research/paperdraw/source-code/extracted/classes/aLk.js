A.aLk.prototype={
ng(a){var s,r,q,p
try{if(this.c===B.Cd){q=A.a6("No more events.")
throw A.d(q)}s=this.aOs()
return s}catch(p){q=A.ac(p)
if(q instanceof A.RU){r=q
throw A.d(A.dY(r.a,r.b))}else throw p}},
aOs(){var s,r,q,p=this
switch(p.c){case B.Wv:s=p.a.eM()
p.c=B.Cc
return new A.qK(B.abs,s.gc8(s))
case B.Cc:return p.aJe()
case B.Wr:return p.aJc()
case B.Cb:return p.aJd()
case B.Wp:return p.Im(!0)
case B.aYC:return p.BO(!0,!0)
case B.aYB:return p.tZ()
case B.Wq:p.a.eM()
return p.a7h()
case B.C9:return p.a7h()
case B.vW:return p.aJo()
case B.Wo:p.a.eM()
return p.a7g()
case B.vT:return p.a7g()
case B.vU:return p.aJ2()
case B.Wu:return p.a7n(!0)
case B.Cf:return p.aJl()
case B.Ww:return p.aJm()
case B.C8:return p.aJn()
case B.Ca:p.c=B.Cf
r=p.a.eJ()
r=r.gc8(r)
r=A.fx(r.a,r.b)
q=r.b
return new A.qK(B.tm,A.h_(r.a,q,q))
case B.Wt:return p.a7l(!0)
case B.vV:return p.aJj()
case B.Ce:return p.aJk()
case B.Ws:return p.a7m(!0)
default:throw A.d(A.a6("Unreachable"))}},
aJe(){var s,r,q,p=this,o=p.a,n=o.eJ()
n.toString
for(s=n;s.gbh(s)===B.Bl;s=n){o.eM()
n=o.eJ()
n.toString}if(s.gbh(s)!==B.Bi&&s.gbh(s)!==B.Bj&&s.gbh(s)!==B.Bk&&s.gbh(s)!==B.r3){p.a7L()
p.b.push(B.Cb)
p.c=B.Wp
o=s.gc8(s)
o=A.fx(o.a,o.b)
n=o.b
return A.bIk(A.h_(o.a,n,n),!0,null,null)}if(s.gbh(s)===B.r3){p.c=B.Cd
o.eM()
return new A.qK(B.Fw,s.gc8(s))}r=s.gc8(s)
q=p.a7L()
s=o.eJ()
if(s.gbh(s)!==B.Bk)throw A.d(A.dY("Expected document start.",s.gc8(s)))
p.b.push(B.Cb)
p.c=B.Wr
o.eM()
return A.bIk(r.kE(0,s.gc8(s)),!1,q.b,q.a)},
aJc(){var s,r,q=this,p=q.a.eJ()
switch(p.gbh(p).a){case 2:case 3:case 4:case 5:case 1:q.c=q.b.pop()
s=p.gc8(p)
s=A.fx(s.a,s.b)
r=s.b
return new A.jR(A.h_(s.a,r,r),null,null,"",B.eS)
default:return q.Im(!0)}},
aJd(){var s,r,q
this.d.aa(0)
this.c=B.Cc
s=this.a
r=s.eJ()
if(r.gbh(r)===B.Bl){s.eM()
return new A.N1(r.gc8(r),!1)}else{s=r.gc8(r)
s=A.fx(s.a,s.b)
q=s.b
return new A.N1(A.h_(s.a,q,q),!0)}},
BO(a,b){var s,r,q,p,o,n=this,m={},l=n.a,k=l.eJ()
k.toString
if(k instanceof A.KX){l.eM()
n.c=n.b.pop()
return new A.a_n(k.a,k.b)}m.a=m.b=null
s=k.gc8(k)
s=A.fx(s.a,s.b)
r=s.b
m.c=A.h_(s.a,r,r)
r=new A.aLl(m,n)
s=new A.aLm(m,n)
if(k instanceof A.vS){q=r.$1(k)
if(q instanceof A.xV)q=s.$1(q)}else if(k instanceof A.xV){q=s.$1(k)
if(q instanceof A.vS)q=r.$1(q)}else q=k
k=m.a
if(k!=null){s=k.b
if(s==null)p=k.c
else{o=n.d.h(0,s)
if(o==null)throw A.d(A.dY("Undefined tag handle.",m.a.a))
k=o.b
s=m.a
s=s==null?null:s.c
p=k+(s==null?"":s)}}else p=null
if(b&&q.gbh(q)===B.oy){n.c=B.vW
return new A.H9(m.c.kE(0,q.gc8(q)),m.b,p,B.wu)}if(q instanceof A.xH){if(p==null&&q.c!==B.eS)p="!"
n.c=n.b.pop()
l.eM()
return new A.jR(m.c.kE(0,q.a),m.b,p,q.b,q.c)}if(q.gbh(q)===B.Vh){n.c=B.Wu
return new A.H9(m.c.kE(0,q.gc8(q)),m.b,p,B.wv)}if(q.gbh(q)===B.Ve){n.c=B.Wt
return new A.G0(m.c.kE(0,q.gc8(q)),m.b,p,B.wv)}if(a&&q.gbh(q)===B.Vg){n.c=B.Wq
return new A.H9(m.c.kE(0,q.gc8(q)),m.b,p,B.wu)}if(a&&q.gbh(q)===B.vm){n.c=B.Wo
return new A.G0(m.c.kE(0,q.gc8(q)),m.b,p,B.wu)}if(m.b!=null||p!=null){n.c=n.b.pop()
return new A.jR(m.c,m.b,p,"",B.eS)}throw A.d(A.dY("Expected node content.",m.c))},
Im(a){return this.BO(a,!1)},
tZ(){return this.BO(!1,!1)},
a7h(){var s,r,q=this,p=q.a,o=p.eJ()
if(o.gbh(o)===B.oy){s=o.gc8(o)
r=A.fx(s.a,s.b)
p.eM()
o=p.eJ()
if(o.gbh(o)===B.oy||o.gbh(o)===B.mJ){q.c=B.C9
p=r.b
return new A.jR(A.h_(r.a,p,p),null,null,"",B.eS)}else{q.b.push(B.C9)
return q.Im(!0)}}if(o.gbh(o)===B.mJ){p.eM()
q.c=q.b.pop()
return new A.qK(B.tl,o.gc8(o))}throw A.d(A.dY("While parsing a block collection, expected '-'.",o.gc8(o).gcl(0).EK()))},
aJo(){var s,r,q=this,p=q.a,o=p.eJ()
if(o.gbh(o)!==B.oy){q.c=q.b.pop()
p=o.gc8(o)
p=A.fx(p.a,p.b)
s=p.b
return new A.qK(B.tl,A.h_(p.a,s,s))}s=o.gc8(o)
r=A.fx(s.a,s.b)
p.eM()
o=p.eJ()
if(o.gbh(o)===B.oy||o.gbh(o)===B.j_||o.gbh(o)===B.j0||o.gbh(o)===B.mJ){q.c=B.vW
p=r.b
return new A.jR(A.h_(r.a,p,p),null,null,"",B.eS)}else{q.b.push(B.vW)
return q.Im(!0)}},
a7g(){var s,r,q=this,p=null,o=q.a,n=o.eJ()
if(n.gbh(n)===B.j_){s=n.gc8(n)
r=A.fx(s.a,s.b)
o.eM()
n=o.eJ()
if(n.gbh(n)===B.j_||n.gbh(n)===B.j0||n.gbh(n)===B.mJ){q.c=B.vU
o=r.b
return new A.jR(A.h_(r.a,o,o),p,p,"",B.eS)}else{q.b.push(B.vU)
return q.BO(!0,!0)}}if(n.gbh(n)===B.j0){q.c=B.vU
o=n.gc8(n)
o=A.fx(o.a,o.b)
s=o.b
return new A.jR(A.h_(o.a,s,s),p,p,"",B.eS)}if(n.gbh(n)===B.mJ){o.eM()
q.c=q.b.pop()
return new A.qK(B.tm,n.gc8(n))}throw A.d(A.dY("Expected a key while parsing a block mapping.",n.gc8(n).gcl(0).EK()))},
aJ2(){var s,r,q=this,p=null,o=q.a,n=o.eJ()
if(n.gbh(n)!==B.j0){q.c=B.vT
o=n.gc8(n)
o=A.fx(o.a,o.b)
s=o.b
return new A.jR(A.h_(o.a,s,s),p,p,"",B.eS)}s=n.gc8(n)
r=A.fx(s.a,s.b)
o.eM()
n=o.eJ()
if(n.gbh(n)===B.j_||n.gbh(n)===B.j0||n.gbh(n)===B.mJ){q.c=B.vT
o=r.b
return new A.jR(A.h_(r.a,o,o),p,p,"",B.eS)}else{q.b.push(B.vT)
return q.BO(!0,!0)}},
a7n(a){var s,r,q,p=this
if(a)p.a.eM()
s=p.a
r=s.eJ()
if(r.gbh(r)!==B.ow){if(!a){if(r.gbh(r)!==B.mI)throw A.d(A.dY("While parsing a flow sequence, expected ',' or ']'.",r.gc8(r).gcl(0).EK()))
s.eM()
q=s.eJ()
q.toString
r=q}if(r.gbh(r)===B.j_){p.c=B.Ww
s.eM()
return new A.G0(r.gc8(r),null,null,B.wv)}else if(r.gbh(r)!==B.ow){p.b.push(B.Cf)
return p.tZ()}}s.eM()
p.c=p.b.pop()
return new A.qK(B.tl,r.gc8(r))},
aJl(){return this.a7n(!1)},
aJm(){var s,r,q=this,p=q.a.eJ()
if(p.gbh(p)===B.j0||p.gbh(p)===B.mI||p.gbh(p)===B.ow){s=p.gc8(p)
r=A.fx(s.a,s.b)
q.c=B.C8
s=r.b
return new A.jR(A.h_(r.a,s,s),null,null,"",B.eS)}else{q.b.push(B.C8)
return q.tZ()}},
aJn(){var s,r=this,q=r.a,p=q.eJ()
if(p.gbh(p)===B.j0){q.eM()
p=q.eJ()
if(p.gbh(p)!==B.mI&&p.gbh(p)!==B.ow){r.b.push(B.Ca)
return r.tZ()}}r.c=B.Ca
q=p.gc8(p)
q=A.fx(q.a,q.b)
s=q.b
return new A.jR(A.h_(q.a,s,s),null,null,"",B.eS)},
a7l(a){var s,r,q,p=this
if(a)p.a.eM()
s=p.a
r=s.eJ()
if(r.gbh(r)!==B.ox){if(!a){if(r.gbh(r)!==B.mI)throw A.d(A.dY("While parsing a flow mapping, expected ',' or '}'.",r.gc8(r).gcl(0).EK()))
s.eM()
q=s.eJ()
q.toString
r=q}if(r.gbh(r)===B.j_){s.eM()
r=s.eJ()
if(r.gbh(r)!==B.j0&&r.gbh(r)!==B.mI&&r.gbh(r)!==B.ox){p.b.push(B.Ce)
return p.tZ()}else{p.c=B.Ce
s=r.gc8(r)
s=A.fx(s.a,s.b)
q=s.b
return new A.jR(A.h_(s.a,q,q),null,null,"",B.eS)}}else if(r.gbh(r)!==B.ox){p.b.push(B.Ws)
return p.tZ()}}s.eM()
p.c=p.b.pop()
return new A.qK(B.tm,r.gc8(r))},
aJj(){return this.a7l(!1)},
a7m(a){var s,r=this,q=null,p=r.a,o=p.eJ()
o.toString
if(a){r.c=B.vV
p=o.gc8(o)
p=A.fx(p.a,p.b)
o=p.b
return new A.jR(A.h_(p.a,o,o),q,q,"",B.eS)}if(o.gbh(o)===B.j0){p.eM()
s=p.eJ()
if(s.gbh(s)!==B.mI&&s.gbh(s)!==B.ox){r.b.push(B.vV)
return r.tZ()}}else s=o
r.c=B.vV
p=s.gc8(s)
p=A.fx(p.a,p.b)
o=p.b
return new A.jR(A.h_(p.a,o,o),q,q,"",B.eS)},
aJk(){return this.a7m(!1)},
a7L(){var s,r,q,p,o,n=this,m=n.a,l=m.eJ()
l.toString
s=A.a([],t.vG)
r=l
q=null
for(;;){if(!(r.gbh(r)===B.Bi||r.gbh(r)===B.Bj))break
if(r instanceof A.T0){if(q!=null)throw A.d(A.dY("Duplicate %YAML directive.",r.a))
l=r.b
if(l!==1||r.c===0)throw A.d(A.dY("Incompatible YAML document. This parser only supports YAML 1.1 and 1.2.",r.a))
else{p=r.c
if(p>2)$.bGn().$2("Warning: this parser only supports YAML 1.1 and 1.2.",r.a)}q=new A.aXd(l,p)}else if(r instanceof A.Sd){o=new A.Cq(r.b,r.c)
n.asU(o,r.a)
s.push(o)}m.eM()
l=m.eJ()
l.toString
r=l}m=r.gc8(r)
m=A.fx(m.a,m.b)
l=m.b
n.Pv(new A.Cq("!","!"),A.h_(m.a,l,l),!0)
l=r.gc8(r)
l=A.fx(l.a,l.b)
m=l.b
n.Pv(new A.Cq("!!","tag:yaml.org,2002:"),A.h_(l.a,m,m),!0)
return new A.aH(q,s)},
Pv(a,b,c){var s=this.d,r=a.a
if(s.ae(0,r)){if(c)return
throw A.d(A.dY("Duplicate %TAG directive.",b))}s.j(0,r,a)},
asU(a,b){return this.Pv(a,b,!1)}}
