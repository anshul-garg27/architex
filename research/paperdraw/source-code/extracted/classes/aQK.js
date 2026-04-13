A.aQK.prototype={
ga6a(){var s,r=this.c.dU()
if(r==null)return!1
switch(r){case 45:case 59:case 47:case 58:case 64:case 38:case 61:case 43:case 36:case 46:case 126:case 63:case 42:case 39:case 40:case 41:case 37:return!0
default:s=!0
if(!(r>=48&&r<=57))if(!(r>=97&&r<=122))s=r>=65&&r<=90
return s}},
gaFg(){if(!this.ga65())return!1
switch(this.c.dU()){case 44:case 91:case 93:case 123:case 125:return!1
default:return!0}},
ga6_(){var s=this.c.dU()
return s!=null&&s>=48&&s<=57},
gaFl(){var s,r=this.c.dU()
if(r==null)return!1
s=!0
if(!(r>=48&&r<=57))if(!(r>=97&&r<=102))s=r>=65&&r<=70
return s},
gaFq(){var s,r=this.c.dU()
$label0$0:{s=!1
if(r==null)break $label0$0
if(10===r||13===r||65279===r)break $label0$0
if(9===r||133===r){s=!0
break $label0$0}s=this.Rv(0)
break $label0$0}return s},
ga65(){var s,r=this.c.dU()
$label0$0:{s=!1
if(r==null)break $label0$0
if(10===r||13===r||65279===r||32===r)break $label0$0
if(133===r){s=!0
break $label0$0}s=this.Rv(0)
break $label0$0}return s},
eM(){var s,r,q,p=this
if(p.e)throw A.d(A.a6("Out of tokens."))
if(!p.w)p.a3S()
s=p.f
r=s.b
if(r===s.c)A.a3(A.a6("No element"))
q=J.aa(s.a,r)
if(q==null)q=s.$ti.i("jQ.E").a(q)
J.bP(s.a,s.b,null)
s.b=(s.b+1&J.b1(s.a)-1)>>>0
p.w=!1;++p.r
p.e=q.gbh(q)===B.r3
return q},
eJ(){var s,r=this
if(r.e)return null
if(!r.w)r.a3S()
s=r.f
return s.gS(s)},
a3S(){var s,r,q=this
for(s=q.f,r=q.z;;){if(!s.ga3(s)){q.a9J()
if(s.gv(0)===0)A.a3(A.d9())
if(J.bVZ(s.h(0,s.gv(0)-1))===B.r3)break
if(!B.b.aE(r,new A.aQL(q)))break}q.ayL()}q.w=!0},
ayL(){var s,r,q,p,o,n,m=this
if(!m.d){m.d=!0
s=m.c
s=A.fx(s.f,s.c)
r=s.b
m.f.kv(0,new A.fD(B.aR8,A.h_(s.a,r,r)))
return}m.aMf()
m.a9J()
s=m.c
m.Ji(s.at)
if(s.c===s.b.length){m.Ji(-1)
m.qU()
m.y=!1
s=A.fx(s.f,s.c)
r=s.b
m.f.kv(0,new A.fD(B.r3,A.h_(s.a,r,r)))
return}if(s.at===0){if(s.dU()===37){m.Ji(-1)
m.qU()
m.y=!1
q=m.aM9()
if(q!=null)m.f.kv(0,q)
return}if(m.HM(3)){if(s.k8(0,"---")){m.a3O(B.Bk)
return}if(s.k8(0,"...")){m.a3O(B.Bl)
return}}}switch(s.dU()){case 91:m.a3Q(B.Vh)
return
case 123:m.a3Q(B.Ve)
return
case 93:m.a3P(B.ow)
return
case 125:m.a3P(B.ox)
return
case 44:m.qU()
m.y=!0
m.tE(B.mI)
return
case 42:m.a3M(!1)
return
case 38:m.ayI()
return
case 33:m.C3()
m.y=!1
r=s.c
if(s.dL(1)===60){s.f1(s.eP())
s.f1(s.eP())
p=m.a8B()
s.pz(">")
o=""}else{o=m.aMd()
if(o.length>1&&B.c.aT(o,"!")&&B.c.fB(o,"!"))p=m.aMe(!1)
else{p=m.SJ(!1,o)
if(p.length===0){o=null
p="!"}else o="!"}}m.f.kv(0,new A.xV(s.jM(new A.lh(r)),o,p))
return
case 39:m.a3R(!0)
return
case 34:m.ayK()
return
case 124:if(m.z.length!==1)m.HJ()
m.a3N(!0)
return
case 62:if(m.z.length!==1)m.HJ()
m.ayJ()
return
case 37:case 64:case 96:m.HJ()
break
case 45:if(m.Br(1))m.H8()
else{if(m.z.length===1){if(!m.y)A.a3(A.dY("Block sequence entries are not allowed here.",s.gm5()))
m.SH(s.at,B.Vg,A.fx(s.f,s.c))}m.qU()
m.y=!0
m.tE(B.oy)}return
case 63:if(m.Br(1))m.H8()
else{r=m.z
if(r.length===1){if(!m.y)A.a3(A.dY("Mapping keys are not allowed here.",s.gm5()))
m.SH(s.at,B.vm,A.fx(s.f,s.c))}m.y=r.length===1
m.tE(B.j_)}return
case 58:if(m.z.length!==1){s=m.f
s=!s.ga3(s)}else s=!1
if(s){s=m.f
n=s.gY(s)
s=!0
if(n.gbh(n)!==B.ow)if(n.gbh(n)!==B.ox)if(n.gbh(n)===B.Vf){s=t.zI.a(n).c
s=s===B.SF||s===B.SE}else s=!1
if(s){m.a3T()
return}}if(m.Br(1))m.H8()
else m.a3T()
return
default:if(!m.gaFq())m.HJ()
m.H8()
return}},
HJ(){return this.c.W2(0,"Unexpected character.",1)},
a9J(){var s,r,q,p,o,n,m,l,k,j,i,h=this
for(s=h.z,r=h.c,q=h.f,p=r.f,o=0;n=s.length,o<n;++o){m=s[o]
if(m==null)continue
if(n!==1)continue
if(m.c===r.as)continue
if(m.e){n=r.c
new A.Fe(p,n).a0D(p,n)
l=new A.ve(p,n,n)
l.Pf(p,n,n)
A.a3(new A.Tm(null,"Expected ':'.",l))
n=m.a
l=h.r
k=m.b
j=k.a
k=k.b
i=new A.ve(j,k,k)
i.Pf(j,k,k)
q.fc(q,n-l,new A.fD(B.j_,i))}s[o]=null}},
C3(){var s,r,q,p,o,n,m=this,l=m.z,k=l.length===1&&B.b.gY(m.x)===m.c.at
if(!m.y)return
m.qU()
s=l.length
r=m.r
q=m.f.gv(0)
p=m.c
o=p.as
n=p.at
l[s-1]=new A.JM(r+q,A.fx(p.f,p.c),o,n,k)},
qU(){var s=this.z,r=B.b.gY(s)
if(r!=null&&r.e)throw A.d(A.dY("Could not find expected ':' for simple key.",r.b.EK()))
s[s.length-1]=null},
awP(){var s=this.z
if(s.length===1)return
s.pop()},
a8r(a,b,c,d){var s,r,q=this
if(q.z.length!==1)return
s=q.x
if(B.b.gY(s)!==-1&&B.b.gY(s)>=a)return
s.push(a)
s=c.b
r=new A.fD(b,A.h_(c.a,s,s))
s=q.f
if(d==null)s.kv(0,r)
else s.fc(s,d-q.r,r)},
SH(a,b,c){return this.a8r(a,b,c,null)},
Ji(a){var s,r,q,p,o,n,m=this
if(m.z.length!==1)return
for(s=m.x,r=m.f,q=m.c,p=q.f;B.b.gY(s)>a;){o=q.c
new A.Fe(p,o).a0D(p,o)
n=new A.ve(p,o,o)
n.Pf(p,o,o)
r.kv(0,new A.fD(B.mJ,n))
s.pop()}},
a3O(a){var s,r,q=this
q.Ji(-1)
q.qU()
q.y=!1
s=q.c
r=s.c
s.j2()
s.j2()
s.j2()
q.f.kv(0,new A.fD(a,s.jM(new A.lh(r))))},
a3Q(a){var s=this
s.C3()
s.z.push(null)
s.y=!0
s.tE(a)},
a3P(a){var s=this
s.qU()
s.awP()
s.y=!1
s.tE(a)},
a3T(){var s,r,q,p,o,n=this,m=n.z,l=B.b.gY(m)
if(l!=null){s=n.f
r=l.a
q=n.r
p=l.b
o=p.b
s.fc(s,r-q,new A.fD(B.j_,A.h_(p.a,o,o)))
n.a8r(l.d,B.vm,p,r)
m[m.length-1]=null
n.y=!1}else if(m.length===1){if(!n.y)throw A.d(A.dY("Mapping values are not allowed here. Did you miss a colon earlier?",n.c.gm5()))
m=n.c
n.SH(m.at,B.vm,A.fx(m.f,m.c))
n.y=!0}else if(n.y){n.y=!1
n.tE(B.j_)}n.tE(B.j0)},
tE(a){var s=this.c,r=s.c
s.j2()
this.f.kv(0,new A.fD(a,s.jM(new A.lh(r))))},
a3M(a){var s=this
s.C3()
s.y=!1
s.f.kv(0,s.aM7(a))},
ayI(){return this.a3M(!0)},
a3N(a){var s=this
s.qU()
s.y=!0
s.f.kv(0,s.aM8(a))},
ayJ(){return this.a3N(!1)},
a3R(a){var s=this
s.C3()
s.y=!1
s.f.kv(0,s.aMb(a))},
ayK(){return this.a3R(!1)},
H8(){var s=this
s.C3()
s.y=!1
s.f.kv(0,s.aMc())},
aMf(){var s,r,q,p,o,n,m=this
for(s=m.z,r=m.c,q=!1;;q=!0){if(r.at===0)r.wh("\ufeff")
p=!q
for(;;){if(r.dU()!==32)o=(s.length!==1||p)&&r.dU()===9
else o=!0
if(!o)break
r.f1(r.eP())}if(r.dU()===9)r.W2(0,"Tab characters are not allowed as indentation.",1)
m.SV()
n=r.dL(0)
if(n===13||n===10){m.IX()
if(s.length===1)m.y=!0}else break}},
aM9(){var s,r,q,p,o,n,m,l,k,j=this,i="Expected whitespace.",h=j.c,g=new A.lh(h.c)
h.f1(h.eP())
s=j.aMa()
if(s==="YAML"){j.Ca()
r=j.a8C()
h.pz(".")
q=j.a8C()
p=new A.T0(h.jM(g),r,q)}else if(s==="TAG"){j.Ca()
o=j.a8A(!0)
if(!j.aFi(0))A.a3(A.dY(i,h.gm5()))
j.Ca()
n=j.a8B()
if(!j.HM(0))A.a3(A.dY(i,h.gm5()))
p=new A.Sd(h.jM(g),o,n)}else{m=h.jM(g)
$.bGn().$2("Warning: unknown directive.",m)
m=h.b.length
for(;;){if(h.c!==m){l=h.dL(0)
k=l===13||l===10}else k=!0
if(!!k)break
h.j2()}return null}j.Ca()
j.SV()
if(!(h.c===h.b.length||j.a5X(0)))throw A.d(A.dY("Expected comment or line break after directive.",h.jM(g)))
j.IX()
return p},
aMa(){var s,r=this.c,q=r.c
while(this.ga65())r.j2()
s=r.bg(0,q)
if(s.length===0)throw A.d(A.dY("Expected directive name.",r.gm5()))
else if(!this.HM(0))throw A.d(A.dY("Unexpected character in directive name.",r.gm5()))
return s},
a8C(){var s,r,q=this.c,p=q.c
for(;;){s=q.dU()
if(!(s!=null&&s>=48&&s<=57))break
q.f1(q.eP())}r=q.bg(0,p)
if(r.length===0)throw A.d(A.dY("Expected version number.",q.gm5()))
return A.dN(r,null)},
aM7(a){var s,r,q,p,o=this.c,n=new A.lh(o.c)
o.j2()
s=o.c
while(this.gaFg())o.j2()
r=o.bg(0,s)
q=o.dU()
if(r.length!==0)p=!this.HM(0)&&q!==63&&q!==58&&q!==44&&q!==93&&q!==125&&q!==37&&q!==64&&q!==96
else p=!0
if(p)throw A.d(A.dY("Expected alphanumeric character.",o.gm5()))
if(a)return new A.vS(o.jM(n),r)
else return new A.KX(o.jM(n),r)},
a8A(a){var s,r,q,p=this.c
p.pz("!")
s=new A.dl("!")
r=p.c
while(this.ga6a())p.f1(p.eP())
q=p.bg(0,r)
q=s.a+=q
if(p.dU()===33)p=s.a=q+A.c4(p.j2())
else{if(a&&(q.charCodeAt(0)==0?q:q)!=="!")p.pz("!")
p=q}return p.charCodeAt(0)==0?p:p},
aMd(){return this.a8A(!1)},
SJ(a,b){var s,r,q,p
if((b==null?0:b.length)>1){b.toString
B.c.bg(b,1)}s=this.c
r=s.c
q=s.dU()
for(;;){if(!this.ga6a())if(a)p=q===44||q===91||q===93
else p=!1
else p=!0
if(!p)break
s.f1(s.eP())
q=s.dU()}s=s.bg(0,r)
return A.iG(s,0,s.length,B.ao,!1)},
a8B(){return this.SJ(!0,null)},
aMe(a){return this.SJ(a,null)},
aM8(a4){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0=this,a1="0 may not be used as an indentation indicator.",a2=a0.c,a3=new A.lh(a2.c)
a2.j2()
s=a2.dU()
r=s===43
q=0
if(r||s===45){p=r?B.BJ:B.BI
a2.j2()
if(a0.ga6_()){if(a2.dU()===48)throw A.d(A.dY(a1,a2.jM(a3)))
q=a2.j2()-48}}else if(a0.ga6_()){if(a2.dU()===48)throw A.d(A.dY(a1,a2.jM(a3)))
q=a2.j2()-48
s=a2.dU()
r=s===43
if(r||s===45){p=r?B.BJ:B.BI
a2.j2()}else p=B.VK}else p=B.VK
a0.Ca()
a0.SV()
r=a2.b
o=r.length
if(!(a2.c===o||a0.a5X(0)))throw A.d(A.dY("Expected comment or line break.",a2.gm5()))
a0.IX()
if(q!==0){n=a0.x
m=B.b.gY(n)>=0?B.b.gY(n)+q:q}else m=0
l=a0.a8z(m)
m=l.a
k=l.b
j=new A.dl("")
i=new A.lh(a2.c)
n=!a4
h=""
g=!1
f=""
for(;;){e=a2.at
if(!(e===m&&a2.c!==o))break
d=!1
if(e===0){s=a2.dL(3)
if(s==null||s===32||s===9||s===13||s===10)e=a2.k8(0,"---")||a2.k8(0,"...")
else e=d}else e=d
if(e)break
s=a2.dL(0)
c=s===32||s===9
if(n&&h.length!==0&&!g&&!c){if(k.length===0){f+=A.c4(32)
j.a=f}}else f=j.a=f+h
j.a=f+k
s=a2.dL(0)
g=s===32||s===9
b=a2.c
for(;;){if(a2.c!==o){s=a2.dL(0)
f=s===13||s===10}else f=!0
if(!!f)break
a2.j2()}i=a2.c
f=j.a+=B.c.a_(r,b,i)
a=new A.lh(i)
h=i!==o?a0.xn():""
l=a0.a8z(m)
m=l.a
k=l.b
i=a}if(p!==B.BI){r=f+h
j.a=r}else r=f
if(p===B.BJ)r=j.a=r+k
a2=a2.OL(a3,i)
o=a4?B.aD1:B.aD0
return new A.xH(a2,r.charCodeAt(0)==0?r:r,o)},
a8z(a){var s,r,q,p,o,n,m,l=new A.dl("")
for(s=this.c,r=a===0,q=!r,p=0;;){for(;;){if(!((!q||s.at<a)&&s.dU()===32))break
s.f1(s.eP())}o=s.at
if(o>p)p=o
n=s.dL(0)
if(!(n===13||n===10))break
m=this.xn()
l.a+=m}if(r){s=this.x
a=p<B.b.gY(s)+1?B.b.gY(s)+1:p}s=l.a
return new A.ahF(a,s.charCodeAt(0)==0?s:s)},
aMb(a){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e=this,d=e.c,c=d.c,b=new A.dl("")
d.f1(d.eP())
for(s=!a,r=d.b.length;;){q=!1
if(d.at===0){p=d.dL(3)
if(p==null||p===32||p===9||p===13||p===10)q=d.k8(0,"---")||d.k8(0,"...")}if(q)d.aXC(0,"Unexpected document indicator.")
if(d.c===r)throw A.d(A.dY("Unexpected end of file.",d.gm5()))
for(;;){p=d.dL(0)
o=!1
if(!!(p==null||p===32||p===9||p===13||p===10))break
p=d.dU()
if(a&&p===39&&d.dL(1)===39){d.f1(d.eP())
d.f1(d.eP())
q=A.c4(39)
b.a+=q}else if(p===(a?39:34))break
else{q=!1
if(s)if(p===92){n=d.dL(1)
q=n===13||n===10}if(q){d.f1(d.eP())
e.IX()
o=!0
break}else if(s&&p===92){m=new A.lh(d.c)
l=null
switch(d.dL(1)){case 48:q=A.c4(0)
b.a+=q
break
case 97:q=A.c4(7)
b.a+=q
break
case 98:q=A.c4(8)
b.a+=q
break
case 116:case 9:q=A.c4(9)
b.a+=q
break
case 110:q=A.c4(10)
b.a+=q
break
case 118:q=A.c4(11)
b.a+=q
break
case 102:q=A.c4(12)
b.a+=q
break
case 114:q=A.c4(13)
b.a+=q
break
case 101:q=A.c4(27)
b.a+=q
break
case 32:case 34:case 47:case 92:q=d.dL(1)
q.toString
q=A.c4(q)
b.a+=q
break
case 78:q=A.c4(133)
b.a+=q
break
case 95:q=A.c4(160)
b.a+=q
break
case 76:q=A.c4(8232)
b.a+=q
break
case 80:q=A.c4(8233)
b.a+=q
break
case 120:l=2
break
case 117:l=4
break
case 85:l=8
break
default:throw A.d(A.dY("Unknown escape character.",d.jM(m)))}d.f1(d.eP())
d.f1(d.eP())
if(l!=null){for(k=0,j=0;j<l;++j){if(!e.gaFl()){d.f1(d.eP())
throw A.d(A.dY("Expected "+A.m(l)+"-digit hexidecimal number.",d.jM(m)))}i=d.eP()
d.f1(i)
k=(k<<4>>>0)+e.at0(i)}if(k>=55296&&k<=57343||k>1114111)throw A.d(A.dY("Invalid Unicode character escape code.",d.jM(m)))
q=A.c4(k)
b.a+=q}}else{q=A.c4(d.j2())
b.a+=q}}}q=d.dU()
if(q===(a?39:34))break
h=new A.dl("")
g=new A.dl("")
f=""
for(;;){p=d.dL(0)
if(!(p===32||p===9)){p=d.dL(0)
q=p===13||p===10}else q=!0
if(!q)break
p=d.dL(0)
if(p===32||p===9)if(!o){i=d.eP()
d.f1(i)
q=A.c4(i)
h.a+=q}else d.f1(d.eP())
else if(!o){h.a=""
f=e.xn()
o=!0}else{q=e.xn()
g.a+=q}}if(o)if(f.length!==0&&g.a.length===0){q=A.c4(32)
b.a+=q}else b.a+=g.l(0)
else{b.a+=h.l(0)
h.a=""}}d.f1(d.eP())
d=d.jM(new A.lh(c))
c=b.a
s=a?B.SF:B.SE
return new A.xH(d,c.charCodeAt(0)==0?c:c,s)},
aMc(){var s,r,q,p,o,n,m,l,k=this,j=k.c,i=j.c,h=new A.lh(i),g=new A.dl(""),f=new A.dl(""),e=B.b.gY(k.x)+1
for(s=k.z,r="",q="";;){p=""
o=!1
if(j.at===0){n=j.dL(3)
if(n==null||n===32||n===9||n===13||n===10)o=j.k8(0,"---")||j.k8(0,"...")}if(o)break
if(j.dU()===35)break
if(k.Br(0))if(r.length!==0){if(q.length===0){o=A.c4(32)
g.a+=o}else g.a+=q
r=p
q=""}else{g.a+=f.l(0)
f.a=""}m=j.c
while(k.Br(0))j.j2()
h=j.c
g.a+=B.c.a_(j.b,m,h)
h=new A.lh(h)
n=j.dL(0)
if(!(n===32||n===9)){n=j.dL(0)
o=!(n===13||n===10)}else o=!1
if(o)break
for(;;){n=j.dL(0)
if(!(n===32||n===9)){n=j.dL(0)
o=n===13||n===10}else o=!0
if(!o)break
n=j.dL(0)
if(n===32||n===9){o=r.length===0
if(!o&&j.at<e&&j.dU()===9)j.W2(0,"Expected a space but found a tab.",1)
if(o){l=j.eP()
j.f1(l)
o=A.c4(l)
f.a+=o}else j.f1(j.eP())}else if(r.length===0){r=k.xn()
f.a=""}else q=k.xn()}if(s.length===1&&j.at<e)break}if(r.length!==0)k.y=!0
j=j.OL(new A.lh(i),h)
i=g.a
return new A.xH(j,i.charCodeAt(0)==0?i:i,B.eS)},
IX(){var s=this.c,r=s.dU(),q=r===13
if(!q&&r!==10)return
s.f1(s.eP())
if(q&&s.dU()===10)s.f1(s.eP())},
xn(){var s=this.c,r=s.dU(),q=r===13
if(!q&&r!==10)throw A.d(A.dY("Expected newline.",s.gm5()))
s.f1(s.eP())
if(q&&s.dU()===10)s.f1(s.eP())
return"\n"},
aFi(a){var s=this.c.dL(a)
return s===32||s===9},
a5X(a){var s=this.c.dL(a)
return s===13||s===10},
HM(a){var s=this.c.dL(a)
return s==null||s===32||s===9||s===13||s===10},
Br(a){var s,r=this.c
switch(r.dL(a)){case 58:return this.a66(a+1)
case 35:s=r.dL(a-1)
return s!==32&&s!==9
default:return this.a66(a)}},
a66(a){var s,r=this.c.dL(a)
$label0$0:{s=!1
if(r==null)break $label0$0
if(44===r||91===r||93===r||123===r||125===r){s=this.z.length===1
break $label0$0}if(32===r||9===r||10===r||13===r||65279===r)break $label0$0
if(133===r){s=!0
break $label0$0}s=this.Rv(a)
break $label0$0}return s},
Rv(a){var s,r=this.c,q=r.dL(a)
if(q==null)return!1
if(q>>>10===54){s=r.dL(a+1)
return s!=null&&s>>>10===55}r=!0
if(!(q>=32&&q<=126))if(!(q>=160&&q<=55295))r=q>=57344&&q<=65533
return r},
at0(a){if(a<=57)return a-48
if(a<=70)return 10+a-65
return 10+a-97},
Ca(){var s,r=this.c
for(;;){s=r.dL(0)
if(!(s===32||s===9))break
r.f1(r.eP())}},
SV(){var s,r,q,p=this.c
if(p.dU()!==35)return
s=p.b.length
for(;;){if(p.c!==s){r=p.dL(0)
q=r===13||r===10}else q=!0
if(!!q)break
p.f1(p.eP())}}}
