A.a2n.prototype={
arD(){var s,r,q,p,o,n,m,l=this
l.asm()
s=$.bAj()
r=s.a
if(r.length===0)s.b.addListener(s.ga6R())
r.push(l.gaaY())
l.asu()
l.asy()
$.om.push(l.gdd())
s=l.ga19()
r=l.ga9b()
q=s.b
if(q.length===0){p=v.G
p.window.addEventListener("focus",s.ga4b())
p.window.addEventListener("blur",s.ga1o())
p.document.addEventListener("visibilitychange",s.gabA())
p=s.d
o=s.c
n=o.d
m=s.gaIm()
p.push(new A.f3(n,A.l(n).i("f3<1>")).pO(m))
o=o.e
p.push(new A.f3(o,A.l(o).i("f3<1>")).pO(m))}q.push(r)
r.$1(s.a)
s=l.gJp()
r=v.G
q=r.document.body
if(q!=null)q.addEventListener("keydown",s.ga5a())
q=r.document.body
if(q!=null)q.addEventListener("keyup",s.ga5b())
q=s.a.d
s.e=new A.f3(q,A.l(q).i("f3<1>")).pO(s.gaEu())
r=r.document.body
if(r!=null)r.prepend(l.c)
s=l.geZ().e
l.a=new A.f3(s,A.l(s).i("f3<1>")).pO(new A.aAC(l))
l.asz()},
n(){var s,r,q,p=this
p.p3.removeListener(p.p4)
p.p4=null
s=p.ok
if(s!=null)s.disconnect()
p.ok=null
s=p.k2
if(s!=null)s.b.removeEventListener(s.a,s.c)
p.k2=null
s=$.bAj()
r=s.a
B.b.L(r,p.gaaY())
if(r.length===0)s.b.removeListener(s.ga6R())
s=p.ga19()
r=s.b
B.b.L(r,p.ga9b())
if(r.length===0)s.fz()
s=p.gJp()
r=v.G
q=r.document.body
if(q!=null)q.removeEventListener("keydown",s.ga5a())
r=r.document.body
if(r!=null)r.removeEventListener("keyup",s.ga5b())
s=s.e
if(s!=null)s.aN(0)
p.c.remove()
s=p.a
s===$&&A.b()
s.aN(0)
s=p.geZ()
r=s.b
q=A.l(r).i("bs<1>")
r=A.r(new A.bs(r,q),q.i("k.E"))
B.b.av(r,s.gaWE())
s.d.aA(0)
s.e.aA(0)},
geZ(){var s,r,q=null,p=this.w
if(p===$){s=t.S
r=t.mm
p=this.w=new A.a2N(this,A.j(s,t.lz),A.j(s,t.m),new A.mi(q,q,r),new A.mi(q,q,r))}return p},
ga19(){var s,r,q,p=this,o=p.x
if(o===$){s=p.geZ()
r=A.a([],t.Gl)
q=A.a([],t.LY)
p.x!==$&&A.b0()
o=p.x=new A.abL(s,r,B.i8,q)}return o},
WW(){var s=this.y
if(s!=null)A.t2(s,this.z)},
gJp(){var s,r=this,q=r.Q
if(q===$){s=r.geZ()
r.Q!==$&&A.b0()
q=r.Q=new A.aab(s,r.gb_u(),B.Vu)}return q},
b_v(a){A.vD(this.as,this.at,a,t.Hi)},
b_t(a,b){var s=this.dx
if(s!=null)A.t2(new A.aAD(b,s,a),this.dy)
else b.$1(!1)},
me(a,b,c){var s
if(a==="dev.flutter/channel-buffers")try{s=$.aov()
b.toString
s.aYS(b)}finally{c.$1(null)}else $.aov().b35(a,b,c)},
aN0(a1,a2,a3){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a=this,a0=null
switch(a1){case"flutter/skia":s=B.f_.m1(a2)
switch(s.a){case"Skia.setResourceCacheMaxBytes":r=A.hY(s.b)
q=$.am().a
q===$&&A.b()
q.a_b(r)
a.iy(a3,B.c1.dt([A.a([!0],t.HZ)]))
break}return
case"flutter/assets":a2.toString
a.Bb(B.ao.bN(0,J.vK(B.br.gbo(a2))),a3)
return
case"flutter/platform":s=B.f_.m1(a2)
switch(s.a){case"SystemNavigator.pop":q=a.geZ().b
p=t.e8
if(p.a(q.h(0,0))!=null)p.a(q.h(0,0)).gUm().Dv().bV(new A.aAx(a,a3),t.a)
else a.iy(a3,B.c1.dt([!0]))
return
case"HapticFeedback.vibrate":o=a.azV(A.ao(s.b))
n=v.G.window.navigator
if("vibrate" in n)n.vibrate(o)
a.iy(a3,B.c1.dt([!0]))
return
case u.Fj:m=t.xE.a(s.b)
q=J.Y(m)
l=A.ao(q.h(m,"label"))
if(l==null)l=""
k=A.cQ(q.h(m,"primaryColor"))
if(k==null)k=4278190080
v.G.document.title=l
A.bQX(A.cs(k))
a.iy(a3,B.c1.dt([!0]))
return
case"SystemChrome.setSystemUIOverlayStyle":j=A.cQ(J.aa(t.xE.a(s.b),"statusBarColor"))
A.bQX(j==null?a0:A.cs(j))
a.iy(a3,B.c1.dt([!0]))
return
case"SystemChrome.setPreferredOrientations":B.a_h.G_(t.j.a(s.b)).bV(new A.aAy(a,a3),t.a)
return
case"SystemSound.play":a.iy(a3,B.c1.dt([!0]))
return
case"Clipboard.setData":new A.Mc(new A.Me()).alx(a3,A.ao(J.aa(t.xE.a(s.b),"text")))
return
case"Clipboard.getData":new A.Mc(new A.Me()).akl(a3,A.ao(s.b))
return
case"Clipboard.hasStrings":new A.Mc(new A.Me()).aZz(a3)
return}break
case"flutter/service_worker":q=v.G
p=q.window
i=q.document.createEvent("Event")
i.initEvent("flutter-first-frame",!0,!0)
p.dispatchEvent(i)
return
case"flutter/textinput":$.KO().gCR(0).aZs(a2,a3)
return
case"flutter/contextmenu":switch(B.f_.m1(a2).a){case"enableContextMenu":t.e8.a(a.geZ().b.h(0,0)).gad3().aXg(0)
a.iy(a3,B.c1.dt([!0]))
return
case"disableContextMenu":t.e8.a(a.geZ().b.h(0,0)).gad3().m4(0)
a.iy(a3,B.c1.dt([!0]))
return}return
case"flutter/mousecursor":s=B.n0.m1(a2)
m=t.f.a(s.b)
switch(s.a){case"activateSystemCursor":q=a.geZ().b
q=A.bJf(new A.aN(q,A.l(q).i("aN<2>")))
if(q!=null){if(q.w===$){q.gij()
q.w!==$&&A.b0()
q.w=new A.aKb()}h=B.aw3.h(0,A.ao(J.aa(m,"kind")))
if(h==null)h="default"
q=v.G
if(h==="default")q.document.body.style.removeProperty("cursor")
else A.aF(q.document.body.style,"cursor",h)}break}return
case"flutter/web_test_e2e":a.iy(a3,B.c1.dt([A.c8v(B.f_,a2)]))
return
case"flutter/platform_views":g=B.n0.m1(a2)
m=a0
f=g.b
m=f
q=$.bSn()
a3.toString
q.aZ2(g.a,m,a3)
return
case"flutter/accessibility":e=$.dD
if(e==null)e=$.dD=A.is()
if(e.b){q=t.f
d=q.a(J.aa(q.a(B.j8.jY(a2)),"data"))
c=A.ao(J.aa(d,"message"))
if(c!=null&&c.length!==0){b=A.bCd(d,"assertiveness")
e.a.ac5(c,B.ale[b==null?0:b])}}a.iy(a3,B.j8.dt(!0))
return
case"flutter/navigation":q=a.geZ().b
p=t.e8
if(p.a(q.h(0,0))!=null)p.a(q.h(0,0)).Wr(a2).bV(new A.aAz(a,a3),t.a)
else if(a3!=null)a3.$1(a0)
a.aZ="/"
return}q=$.bQK
if(q!=null){q.$3(a1,a2,a3)
return}a.iy(a3,a0)},
Bb(a,b){return this.aBI(a,b)},
aBI(a,b){var s=0,r=A.A(t.H),q=1,p=[],o=this,n,m,l,k,j,i,h
var $async$Bb=A.w(function(c,d){if(c===1){p.push(d)
s=q}for(;;)switch(s){case 0:q=3
k=$.Zv
h=t.BJ
s=6
return A.n(A.Ku(k.Ft(a)),$async$Bb)
case 6:n=h.a(d)
s=7
return A.n(A.bBJ(n.gN_().a),$async$Bb)
case 7:m=d
o.iy(b,J.ls(m))
q=1
s=5
break
case 3:q=2
i=p.pop()
l=A.ac(i)
$.i1().$1("Error while trying to load an asset: "+A.m(l))
o.iy(b,null)
s=5
break
case 2:s=1
break
case 5:return A.y(null,r)
case 1:return A.x(p.at(-1),r)}})
return A.z($async$Bb,r)},
azV(a){var s
$label0$0:{s=10
if("HapticFeedbackType.lightImpact"===a)break $label0$0
if("HapticFeedbackType.mediumImpact"===a){s=20
break $label0$0}if("HapticFeedbackType.heavyImpact"===a){s=30
break $label0$0}if("HapticFeedbackType.selectionClick"===a)break $label0$0
s=50
break $label0$0}return s},
a_e(a){var s
if(!a)for(s=this.geZ().b,s=new A.bF(s,s.r,s.e,A.l(s).i("bF<2>"));s.p();)s.d.gFT().hd(0)},
No(a,b){return this.b3U(a,b)},
b3U(a,b){var s=0,r=A.A(t.H),q=this,p
var $async$No=A.w(function(c,d){if(c===1)return A.x(d,r)
for(;;)switch(s){case 0:p=q.ax
p=p==null?null:p.B(0,b)
s=p===!0?2:3
break
case 2:s=4
return A.n($.am().Yn(a,b),$async$No)
case 4:case 3:return A.y(null,r)}})
return A.z($async$No,r)},
asy(){var s=this
if(s.k2!=null)return
s.d=s.d.adc(A.bBO())
s.k2=A.dP(v.G.window,"languagechange",A.ci(new A.aAv(s)))},
asu(){var s,r,q=v.G,p=new q.MutationObserver(A.brD(new A.aAu(this)))
this.ok=p
q=q.document.documentElement
q.toString
s=A.a(["style"],t.s)
r=A.j(t.N,t.z)
r.j(0,"attributes",!0)
r.j(0,"attributeFilter",s)
s=A.aY(r)
s.toString
p.observe(q,s)},
aN2(a){this.me("flutter/lifecycle",J.ls(B.af.gbo(B.cH.c0(a.M()))),new A.aAA())},
ab5(a){var s=this,r=s.d
if(r.d!==a){s.d=r.aUf(a)
A.t2(null,null)
A.t2(s.R8,s.RG)}},
aPV(a){var s=this.d,r=s.a
if((r.a&32)!==0!==a){this.d=s.ad5(r.aTO(a))
A.t2(null,null)}},
asm(){var s,r=this,q=r.p3
r.ab5(q.matches?B.c_:B.c0)
s=A.hZ(new A.aAt(r))
r.p4=s
q.addListener(s)},
yK(a,b,c,d){var s=new A.aAE(this,c,b,a,d),r=$.tV
if(r==null){r=new A.Ar(B.tE)
$.om.push(r.gGX())
$.tV=r}if(r.d)A.dr(B.al,s)
else s.$0()},
gVq(){var s=this.aZ
if(s==null){s=t.e8.a(this.geZ().b.h(0,0))
s=s==null?null:s.gUm().grl()
s=this.aZ=s==null?"/":s}return s},
iy(a,b){A.nx(B.al,null,t.H).bV(new A.aAF(a,b),t.a)},
asz(){var s=A.ci(new A.aAw(this))
v.G.document.addEventListener("click",s,!0)},
az1(a){var s,r,q=a.target
while(q!=null){s=A.jI(q,"Element")
if(s){r=q.getAttribute("id")
if(r!=null&&B.c.aT(r,"flt-semantic-node-"))if(this.a63(q))if(A.ix(B.c.bg(r,18),null)!=null)return new A.aKF(q)}q=q.parentNode}return null},
az0(a){var s,r=a.tabIndex
if(r!=null&&r>=0)return a
if(this.a9U(a))return a
s=a.querySelector('[tabindex]:not([tabindex="-1"])')
if(s!=null)return s
return this.az_(a)},
a9U(a){var s,r,q,p,o=a.getAttribute("id")
if(o==null||!B.c.aT(o,"flt-semantic-node-"))return!1
s=A.ix(B.c.bg(o,18),null)
if(s==null)return!1
r=t.e8.a($.c_().geZ().b.h(0,0))
q=r==null?null:r.gFT().e
if(q==null)return!1
p=q.h(0,s)
if(p==null)r=null
else{r=p.b
r.toString
r=(r&4194304)!==0}return r===!0},
az_(a){var s,r,q=a.querySelectorAll('[id^="flt-semantic-node-"]')
for(s=new A.CX(q,t.rM);s.p();){r=A.h2(q.item(s.b))
if(this.a9U(r))return r}return null},
aFn(a){var s,r,q=A.jI(a,"MouseEvent")
if(!q)return!1
s=a.clientX
r=a.clientY
if(s<=2&&r<=2&&s>=0&&r>=0)return!0
if(this.aFm(a,s,r))return!0
return!1},
aFm(a,b,c){var s
if(b!==B.d.P(b)||c!==B.d.P(c))return!1
s=a.target
if(s==null)return!1
return this.a63(s)},
a63(a){var s=a.getAttribute("role"),r=a.tagName.toLowerCase()
return r==="button"||s==="button"||r==="a"||s==="link"||s==="tab"}}
