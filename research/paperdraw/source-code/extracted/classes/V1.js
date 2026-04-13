A.V1.prototype={
ig(a,b){var s=this.gab().K(0,$.aP(),t.v),r=A.j(t.N,t.X)
r.j(0,"component_count",J.b1(s.a))
r.j(0,"connection_count",s.b.length)
r.q(0,b)
A.aZ(a,r)},
Cj(a){return this.ig(a,B.am)},
Ix(){var s=0,r=A.A(t.H),q,p=2,o=[],n=this,m,l,k,j
var $async$Ix=A.w(function(a,b){if(a===1){o.push(b)
s=p}for(;;)switch(s){case 0:if(n.a8){s=1
break}l=n.gab().K(0,$.jf(),t.op)
if((l==null?$.d5().gdc():l)==null){s=1
break}n.a8=!0
p=4
s=7
return A.n($.d5().ET(),$async$Ix)
case 7:p=2
s=6
break
case 4:p=3
j=o.pop()
m=A.ac(j)
n.a8=!1
A.aZ("daily_visit_record_failed",A.u(["error",J.V(m)],t.N,t.X))
s=6
break
case 3:s=2
break
case 6:case 1:return A.y(q,r)
case 2:return A.x(o.at(-1),r)}})
return A.z($async$Ix,r)},
u8(a){return this.aPp(a)},
aPp(a8){var s=0,r=A.A(t.H),q,p=2,o=[],n=this,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4,a5,a6,a7
var $async$u8=A.w(function(a9,b0){if(a9===1){o.push(b0)
s=p}for(;;)switch(s){case 0:a1=n.gab()
a2=$.aP()
a3=t.v
a4=a1.K(0,a2,a3)
a5=n.y!=null||n.a.e!=null
a6=A.ccM(a4,a5,a8.r)
a5=a6.w
if(a5<=5){s=1
break}e=$.jf()
d=t.op
c=a1.K(0,e,d)
if(c==null)c=$.d5().gdc()
a4=a1.K(0,a2,a3)
a2=t.N
a3=t.X
b=A.j(a2,a3)
b.j(0,"component_count",a6.x)
b.j(0,"connection_count",a6.y)
b.j(0,"origin_kind",a6.f)
b.j(0,"tick_count",a5)
b.j(0,"is_authenticated",c!=null)
a5=a6.r
if(a5!=null)b.j(0,"starter_path",a5)
a5=a4.y.b
if(a5!=null)b.j(0,"template_id",a5)
a5=n.RG
b.q(0,a5.aSk())
m=b
if(!a6.a){i=A.cT(m,a2,a3)
i.j(0,"rejection_reason",a6.e)
A.aZ("aha_candidate_rejected",i)
s=1
break}l=new A.az(Date.now(),0,!1).ox().eW()
a3=t.z
b=A.cT(A.bt(m,a2,a3),a2,a3)
b.j(0,"reached_at",l)
k=b
c=a1.K(0,e,d)
s=(c==null?$.d5().gdc():c)!=null?3:4
break
case 3:p=6
s=9
return A.n(a5.zd("meaningful_simulation"),$async$u8)
case 9:j=b0
if(j!=null&&A.ao(J.aa(j,"backfilled_user_id"))==null){i=A.cT(j,a2,a3)
J.aoC(i,k)
a1=J.aa(j,"reached_at")
if(a1==null)a1=l
J.bP(i,"reached_at",a1)
J.bP(i,"backfilled_from_guest",!0)
a=i}else a=k
h=a
s=10
return A.n($.d5().ze(h,"meaningful_simulation"),$async$u8)
case 10:g=b0
i=g?"aha_meaningful_simulation_reached":"aha_meaningful_simulation_repeat"
A.aZ(i,m)
p=2
s=8
break
case 6:p=5
a7=o.pop()
f=A.ac(a7)
A.e1().$1("Failed to record authenticated aha milestone: "+A.m(f))
s=8
break
case 5:s=2
break
case 8:s=1
break
case 4:s=13
return A.n(a5.zd("meaningful_simulation"),$async$u8)
case 13:s=b0==null?11:12
break
case 11:s=14
return A.n(a5.Fm("meaningful_simulation",k),$async$u8)
case 14:A.aZ("aha_meaningful_simulation_reached",m)
s=1
break
case 12:A.aZ("aha_meaningful_simulation_repeat",m)
case 1:return A.y(q,r)
case 2:return A.x(o.at(-1),r)}})
return A.z($async$u8,r)},
aP9(a){var s=this,r=!s.id
s.J(new A.bbG(s,r))
s.ig("focus_mode_toggled",A.u(["enabled",r,"simulation_running",a.a===B.cs],t.N,t.X))},
aPb(){var s=this,r=!s.k1
s.J(new A.bbH(s,r))
s.ig("focus_mode_scenario_panel_toggled",A.u(["expanded",r],t.N,t.X))},
aBU(a,b){var s,r=this
if(!(b instanceof A.p7)||!b.b.m(0,B.md))return B.jY
s=r.gab().K(0,$.fh(),t.rD).a===B.cs
if(s&&r.id){r.J(new A.bal(r))
r.ig("focus_mode_exited_via_escape",A.u(["simulation_running",s],t.N,t.X))
return B.cP}return B.jY},
Cd(a){return this.aOp(a)},
aOp(a){var s=0,r=A.A(t.H),q,p=this
var $async$Cd=A.w(function(b,c){if(b===1)return A.x(c,r)
for(;;)switch(s){case 0:s=3
return A.n(p.H4(a),$async$Cd)
case 3:if(!c||p.c==null){s=1
break}s=4
return A.n(p.tN(a),$async$Cd)
case 4:if(!c||p.c==null){s=1
break}p.X=!1
p.ig("simulation_started",A.u(["source",a],t.N,t.X))
p.J(new A.bbD(p))
p.tJ()
p.Ce()
p.gab().K(0,$.DK(),t._P).xt()
case 1:return A.y(q,r)}})
return A.z($async$Cd,r)},
H4(a){return this.aye(a)},
aye(a){var s=0,r=A.A(t.y),q,p=this,o,n,m
var $async$H4=A.w(function(b,c){if(b===1)return A.x(c,r)
for(;;)switch(s){case 0:o=p.gab()
n=o.K(0,$.bV9(),t.WT)
m=n.afU(o.K(0,$.aP(),t.v))
o=m.a.length
if(!(o!==0||m.b.length!==0)){q=!0
s=1
break}p.ig("canvas_semantic_inference_gate_opened",A.u(["source",a,"pending_components",o,"pending_connections",m.b.length],t.N,t.X))
o=p.c
o.toString
s=3
return A.n(A.fE(null,!1,new A.baa(p,m,n,a),o,t.y),$async$H4)
case 3:q=c===!0
s=1
break
case 1:return A.y(q,r)}})
return A.z($async$H4,r)},
tN(a){return this.aw4(a)},
aw4(a){var s=0,r=A.A(t.y),q,p=this,o,n,m,l,k,j,i
var $async$tN=A.w(function(b,c){if(b===1)return A.x(c,r)
for(;;)switch(s){case 0:j=p.gab()
i=j.K(0,$.z5(),t.y)
if(i){q=!0
s=1
break}s=3
return A.n(A.kq(),$async$tN)
case 3:o=c
n=j.K(0,$.jf(),t.op)
if(n==null)n=$.d5().gdc()
j=n==null?null:n.a
m="simulation_usage_v1_"+(j==null?"guest":j)
l=A.cQ(J.aa(o.a,m))
if(l==null)l=0
if(p.c==null){q=!1
s=1
break}s=l>=3?4:5
break
case 4:p.ig("simulation_start_blocked_upgrade",A.u(["source",a,"used_count",l,"free_limit",3],t.N,t.X))
s=8
return A.n(p.aNG(l),$async$tN)
case 8:s=c===!0&&p.c!=null?6:7
break
case 6:s=9
return A.n(p.Bj(),$async$tN)
case 9:case 7:q=!1
s=1
break
case 5:k=l+1
s=10
return A.n(o.pc("Int",m,k),$async$tN)
case 10:p.ig("free_simulation_consumed",A.u(["source",a,"used_count",k,"remaining_count",B.e.t(3-k,0,99)],t.N,t.X))
q=!0
s=1
break
case 1:return A.y(q,r)}})
return A.z($async$tN,r)},
aNG(a){var s=B.e.t(3-a,0,99),r=s>0,q=r?"Free Simulation Limit Near":"Upgrade To Continue Simulations",p=r?"You have "+s+" free simulation runs left. Upgrade to Pro for unlimited simulation runs.":"Free users can run up to 3 simulations. Upgrade to Pro to keep simulating."
r=this.c
r.toString
return A.fE(null,!0,new A.bbC(q,p),r,t.y)},
tQ(){var s=0,r=A.A(t.y),q,p=2,o=[],n=this,m,l,k,j,i,h,g,f,e,d,c,b
var $async$tQ=A.w(function(a,a0){if(a===1){o.push(a0)
s=p}for(;;)switch(s){case 0:k=t.pN,j=t.gd,i=t.H,h=0
case 3:if(!(h<6)){s=5
break}m=null
l=null
p=7
g=n.gab()
f=$.KR().gLE()
if(g.e==null)A.a3(A.a6(u.w))
g=A.nN(g,!1)
g.h9(f.a)
g=f.iw(0,g)
if(!j.b(g)){f=new A.aI($.aG,k)
f.a=8
f.c=g
g=f}s=10
return A.n(g,$async$tQ)
case 10:m=a0
p=2
s=9
break
case 7:p=6
c=o.pop()
m=null
s=9
break
case 6:s=2
break
case 9:p=12
g=n.gab()
f=$.z6().gLE()
if(g.e==null)A.a3(A.a6(u.w))
g=A.nN(g,!1)
g.h9(f.a)
g=f.iw(0,g)
if(!j.b(g)){f=new A.aI($.aG,k)
f.a=8
f.c=g
g=f}s=15
return A.n(g,$async$tQ)
case 15:l=a0
p=2
s=14
break
case 12:p=11
b=o.pop()
l=null
s=14
break
case 11:s=2
break
case 14:g=n.gab()
f=$.kN()
if(g.e==null)A.a3(A.a6(u.w))
if(!f.iw(0,A.nN(g,!1))){g=$.d5().gdc()
d=A.byt(g==null?null:g.z)||A.bEU(m)||A.bEV(l)}else d=!0
if(d){q=!0
s=1
break}s=h<5?16:17
break
case 16:s=18
return A.n(A.nx(B.hh,null,i),$async$tQ)
case 18:case 17:case 4:++h
s=3
break
case 5:k=n.gab()
j=$.KR()
if(k.e==null)A.a3(A.a6(u.w))
k.ghk().h9(j)
j=$.z6()
if(k.e==null)A.a3(A.a6(u.w))
k.ghk().h9(j)
q=k.K(0,$.z5(),t.BS)
s=1
break
case 1:return A.y(q,r)
case 2:return A.x(o.at(-1),r)}})
return A.z($async$tQ,r)},
aOv(a){var s=this
s.ig("simulation_stopped",A.u(["source",a],t.N,t.X))
if(s.k1)s.J(new A.bbF(s))
s.tJ()
s.gab().K(0,$.DK(),t._P).e5(0)
s.a3Y("manual_stop",!0)},
aJI(){this.Cj("simulation_paused")
var s=this.gab().K(0,$.DK(),t._P).a.K(0,$.fh().gal(),t.Rb)
s.sbn(0,s.f.adi(B.Tj))},
aLM(){this.Cj("simulation_resumed")
var s=this.gab().K(0,$.DK(),t._P).a.K(0,$.fh().gal(),t.Rb)
s.sbn(0,s.f.adi(B.cs))},
aLj(){var s,r,q,p,o
this.Cj("simulation_reset")
this.tJ()
s=this.gab()
r=s.K(0,$.DK(),t._P)
r.e5(0)
r=r.a
q=r.K(0,$.fh().gal(),t.Rb)
q.r.a.aa(0)
q.w.hd(0)
q.sbn(0,B.Ti)
q=t.g8
p=t.N
o=t.Gp
r.K(0,$.z8().gal(),q).bM(0,A.j(p,o))
r.K(0,$.bAH().gal(),q).bM(0,A.j(p,o))
s.K(0,$.aP().gal(),t.F).UD()},
auL(){var s=$.ax.ak$.x.h(0,this.cx)
s=s==null?null:s.gad()
t.aA.a(s)
if(s!=null&&s.fy!=null)return s.gG(0)
s=this.c
s.toString
return A.bM(s,B.e_,t.w).w.a},
Jw(a){var s,r,q,p,o=this.gab(),n=$.aP(),m=o.K(0,n,t.v),l=m.w,k=B.d.t(l*a,0.1,3)
if(Math.abs(k-l)<0.0001)return
s=this.auL()
r=s.a/2
q=s.b/2
p=m.r
o.K(0,n.gal(),t.F).NQ(new A.i(r-(r-p.a)/l*k,q-(q-p.b)/l*k),k)},
Ce(){var s=0,r=A.A(t.H),q,p=this,o,n,m
var $async$Ce=A.w(function(a,b){if(a===1)return A.x(b,r)
for(;;)switch(s){case 0:n=p.R8
m=n.d
if(m){s=1
break}s=3
return A.n(n.OM(0,24),$async$Ce)
case 3:if(b){p.tJ()
s=1
break}if(p.c==null){s=1
break}if(p.aNk()){p.aMv()
s=1
break}if(!n.d){o=n.e
if(o==null)o="Unable to start simulation video capture."
p.c.a0(t.q).f.bb(A.da(null,null,null,null,null,B.y,null,A.B(o,null,null,null,null,null,null,null,null),null,B.X,null,null,null,null,null,null,null,null,null,null))}case 1:return A.y(q,r)}})
return A.z($async$Ce,r)},
AZ(a,b,c){return this.ayR(a,b,c)},
a3Y(a,b){return this.AZ(a,!0,b)},
ayR(a,b,c){var s=0,r=A.A(t.H),q,p=2,o=[],n=[],m=this,l,k,j,i,h
var $async$AZ=A.w(function(d,e){if(d===1){o.push(e)
s=p}for(;;)switch(s){case 0:if(!m.R8.d||m.rx){s=1
break}m.tJ()
m.rx=!0
l=m.gab().K(0,$.fO(),t.C)
p=3
i=m.R8
s=6
return A.n(i.e5(0),$async$AZ)
case 6:k=e
if(m.c==null){n=[1]
s=4
break}if(k){A.aZ("simulation_video_capture_ready",A.u(["problem_id",l.a,"reason",a],t.N,t.X))
if(c)m.c.a0(t.q).f.bb(B.aGe)
n=[1]
s=4
break}h=i.e
j=h==null?"Failed to export simulation video.":h
if(b){m.tJ()
m.c.a0(t.q).f.bb(A.da(null,null,null,null,null,B.y,null,A.B(j,null,null,null,null,null,null,null,null),null,B.X,null,null,null,null,null,null,null,null,null,null))}n.push(5)
s=4
break
case 3:n=[2]
case 4:p=2
m.rx=!1
s=n.pop()
break
case 5:case 1:return A.y(q,r)
case 2:return A.x(o.at(-1),r)}})
return A.z($async$AZ,r)},
AW(){var s=0,r=A.A(t.H),q,p=this,o,n,m,l,k,j,i
var $async$AW=A.w(function(a,b){if(a===1)return A.x(b,r)
for(;;)switch(s){case 0:i=p.gab()
if(i.K(0,$.fh(),t.rD).a===B.cs){p.c.a0(t.q).f.bb(B.aGi)
s=1
break}if(p.rx){p.c.a0(t.q).f.bb(B.aGv)
s=1
break}o=p.R8
s=o.d?3:4
break
case 3:s=5
return A.n(p.a3Y("manual_export_finalize",!1),$async$AW)
case 5:case 4:if(o.b==null){n=o.e
i=p.c.a0(t.q).f
i.bb(A.da(null,null,null,null,null,B.y,null,A.B(n==null?"No captured simulation video found to export.":"Video capture unavailable: "+n,null,null,null,null,null,null,null,null),null,B.X,null,null,null,null,null,null,null,null,null,null))
s=1
break}i=i.K(0,$.fO(),t.C).a
m="simulation_"+i+"_"+Date.now()+".webm"
s=6
return A.n(o.Ok(m),$async$AW)
case 6:l=b
k=p.c
if(k==null){s=1
break}if(l){A.aZ("simulation_video_exported",A.u(["problem_id",i,"reason","manual_export"],t.N,t.X))
p.c.a0(t.q).f.bb(A.da(null,null,null,null,null,B.y,null,A.B("Simulation video exported: "+m,null,null,null,null,null,null,null,null),null,B.X,null,null,null,null,null,null,null,null,null,null))
s=1
break}j=o.e
if(j==null)j="Failed to export simulation video."
k.a0(t.q).f.bb(A.da(null,null,null,null,null,B.y,null,A.B(j,null,null,null,null,null,null,null,null),null,B.X,null,null,null,null,null,null,null,null,null,null))
case 1:return A.y(q,r)}})
return A.z($async$AW,r)},
aM(){var s,r,q,p=this,o="canvas_data"
p.b3()
$.ax.cU$.push(p)
A.e1().$1("GameScreen Initialized")
s=p.a
r=t.N
A.aZ("game_screen_opened",A.u(["has_initial_community_design",s.d!=null,"has_shared_design_id",s.e!=null,"is_read_only",s.r],r,t.X))
p.HQ()
s=p.gab()
p.p2=s.vw($.jf(),new A.bbV(p),t.op)
q=$.aP()
p.p3=s.vw(new A.ch(q,new A.bbW(),q.$ti.i("ch<cR.0,p>")),new A.bbX(p),t.S)
q=$.fh()
p.p4=s.vw(new A.ch(q,new A.bbY(),q.$ti.i("ch<cR.0,l3>")),new A.bbZ(p),t.bU)
s=p.a.d
if(s!=null){if(J.q7(s,o)){s=p.a.d
s.toString
s=t.P.b(J.aa(s,o))}else s=!1
q=p.a
if(s){s=q.d
s.toString
p.x=A.bt(J.aa(s,o),r,t.z)}else p.x=q.d
s=p.a
r=s.f
if(r==null){s=s.d
s.toString
s=A.ao(J.aa(s,"__owner_id"))}else s=r
p.ay=s
s=p.a.d
s.toString
p.ch=A.ao(J.aa(s,"__owner_email"))}s=p.a
r=s.e
p.y=r
if(p.ay==null)p.ay=s.f
if(r!=null||p.x!=null){s=p.a9R(p.x,"__title")
p.a1f(p.a9R(p.x,"__description"),s)}$.ax.rx$.push(new A.bc_(p))},
pv(a){if(a===B.i8)return
this.gab().K(0,$.aP().gal(),t.F).EH()},
aNF(){var s=this.gab(),r=s.K(0,$.fh(),t.rD),q=s.K(0,$.fO(),t.C)
s=this.c
s.toString
return A.fE(null,!0,new A.bbz(r,q),s,t.H)},
I2(){var s=0,r=A.A(t.H),q,p=2,o=[],n=this,m,l,k,j,i,h,g,f,e,d,c,b,a
var $async$I2=A.w(function(a0,a1){if(a0===1){o.push(a1)
s=p}for(;;)switch(s){case 0:b=n.gab().K(0,$.jf(),t.op)
if((b==null?$.d5().gdc():b)==null){s=1
break}p=4
s=7
return A.n($.d5().yn(),$async$I2)
case 7:m=a1
for(g=J.ar(m),f=n.bj;g.p();){l=g.gH(g)
k=A.ao(J.aa(l,"id"))
j=A.ao(J.aa(l,"status"))
if(k==null||!J.e(j,"rejected"))continue
if(f.k(0,k))continue
e=A.ao(J.aa(l,"rejection_reason"))
i=e==null?"Rejected by AI review.":e
d=A.ao(J.aa(l,"title"))
h=d==null?"Design":d
f.B(0,k)
n.a0W(k,i,h)}p=2
s=6
break
case 4:p=3
a=o.pop()
s=6
break
case 3:s=2
break
case 6:case 1:return A.y(q,r)
case 2:return A.x(o.at(-1),r)}})
return A.z($async$I2,r)},
a0W(a,b,c){var s=this
if(s.U.k(0,a))return
if(B.b.aE(s.F,new A.b9M(a)))return
if(s.c==null)return
s.J(new A.b9N(s,a,c,b))},
BL(){var s=0,r=A.A(t.H),q,p=this,o,n,m,l
var $async$BL=A.w(function(a,b){if(a===1)return A.x(b,r)
for(;;)switch(s){case 0:n=p.F
m=t.N
l=t.X
A.aZ("notifications_opened",A.u(["pending_notifications",n.length],m,l))
if(n.length===0&&p.U.a===0){A.aZ("notifications_empty",B.am)
p.c.a0(t.q).f.bb(B.aGs)
s=1
break}o=A.c8(n,!0,t.na)
n=p.c
n.toString
s=3
return A.n(A.KD(B.F,new A.baR(o),n,!1,B.qE,!1,t.z),$async$BL)
case 3:p.J(new A.baS(p,o))
A.aZ("notifications_marked_read",A.u(["dismissed_count",o.length],m,l))
s=4
return A.n(p.BP(),$async$BL)
case 4:case 1:return A.y(q,r)}})
return A.z($async$BL,r)},
BA(a){return this.aG7(a)},
aG7(a){var s=0,r=A.A(t.H),q,p=2,o=[],n=[],m=this,l,k,j,i,h,g,f,e,d
var $async$BA=A.w(function(b,c){if(b===1){o.push(c)
s=p}for(;;)switch(s){case 0:f=t.N
e=t.X
A.aZ("shared_design_load_attempted",A.u(["design_id",a],f,e))
m.J(new A.baH(m))
p=4
s=7
return A.n($.d5().Dy(a),$async$BA)
case 7:l=c
s=l!=null&&m.c!=null?8:10
break
case 8:s=11
return A.n(A.th(l),$async$BA)
case 11:k=c
if(m.c==null){n=[1]
s=5
break}m.gab().K(0,$.aP().gal(),t.F).rK(k)
m.Q=a
i=J.aa(l,"__title")
m.as=A.ao(i==null?J.aa(l,"title"):i)
m.ay=A.ao(J.aa(l,"__owner_id"))
m.ch=A.ao(J.aa(l,"__owner_email"))
m.a9j()
m.B0()
i=m.as
h=J.aa(l,"__description")
m.a1f(A.ao(h==null?J.aa(l,"description"):h),i)
if(m.SP(l))m.tI()
m.ig("shared_design_loaded",A.u(["design_id",a],f,e))
s=9
break
case 10:if(m.c!=null){A.bwS(new A.H8("Shared Design Not Found | paperdraw.dev","The requested shared system design could not be found.","/design/"+A.k_(2,a,B.ao,!1),"noindex,follow","WebPage"))
A.aZ("shared_design_not_found",A.u(["design_id",a],f,e))
m.c.a0(t.q).f.bb(B.aGd)}case 9:n.push(6)
s=5
break
case 4:p=3
d=o.pop()
j=A.ac(d)
A.aZ("shared_design_load_failed",A.u(["design_id",a,"error",J.V(j)],f,e))
f=m.c
if(f!=null)f.a0(t.q).f.bb(A.da(null,null,null,null,null,B.y,null,A.B("Failed to load shared design: "+A.m(j),null,null,null,null,null,null,null,null),null,B.X,null,null,null,null,null,null,null,null,null,null))
n.push(6)
s=5
break
case 3:n=[2]
case 5:p=2
if(m.c!=null)m.J(new A.baI(m))
s=n.pop()
break
case 6:case 1:return A.y(q,r)
case 2:return A.x(o.at(-1),r)}})
return A.z($async$BA,r)},
a9R(a,b){var s=a==null?null:J.aa(a,b)
if(typeof s=="string"&&B.c.N(s).length!==0)return B.c.N(s)
return null},
a1f(a,b){var s,r=b==null?null:B.c.N(b),q=a==null?null:B.c.N(a),p=this.y
if(p!=null)s="/design/"+A.k_(2,p,B.ao,!1)
else{p=A.kC()
if(p.gfd(p).length===0)s="/"
else{p=A.kC()
p=p.gfd(p)
s=p}}p=r!=null&&r.length!==0?r+" | paperdraw.dev":"Shared System Design Blueprint | paperdraw.dev"
A.bwS(new A.H8(p,q!=null&&q.length!==0?q:"Explore a shared distributed systems blueprint on paperdraw.dev.",s,u.Fv,"CreativeWork"))},
qE(a,b){return this.ayd(a,b)},
H3(a){return this.qE(a,null)},
ayd(a,b){var s=0,r=A.A(t.y),q,p=this,o,n,m
var $async$qE=A.w(function(c,d){if(c===1)return A.x(d,r)
for(;;)switch(s){case 0:n=$.d5().gdc()
m=p.gab().K(0,$.bAE(),t.y)
if(n!=null||m){q=!0
s=1
break}o=p.c
o.toString
s=3
return A.n(A.bQY(o,!0,B.aw),$async$qE)
case 3:o=d===!0
if(!o&&b!=null)A.aZ(b,B.am)
q=o
s=1
break
case 1:return A.y(q,r)}})
return A.z($async$qE,r)},
aGF(){if(this.ax)return
var s=this.gab()
s.K(0,$.aP().gal(),t.F).OB(0.4)
s.K(0,$.KQ().gal(),t.zu).bM(0,null)
this.ax=!0},
HQ(){var s=0,r=A.A(t.H),q=this,p,o,n,m
var $async$HQ=A.w(function(a,b){if(a===1)return A.x(b,r)
for(;;)switch(s){case 0:n=t.kc
m=J
s=2
return A.n(A.kq(),$async$HQ)
case 2:o=n.a(m.aa(b.a,"dismissed_rejections"))
o=o==null?null:J.mo(o,t.N)
p=o==null?null:o.bL(o)
t.H_.a(p)
q.J(new A.baG(q,p==null?A.a([],t.s):p))
return A.y(null,r)}})
return A.z($async$HQ,r)},
BP(){var s=0,r=A.A(t.H),q=this,p,o
var $async$BP=A.w(function(a,b){if(a===1)return A.x(b,r)
for(;;)switch(s){case 0:s=2
return A.n(A.kq(),$async$BP)
case 2:p=b
o=q.U
o=A.r(o,A.l(o).c)
s=3
return A.n(p.pc("StringList","dismissed_rejections",o),$async$BP)
case 3:return A.y(null,r)}})
return A.z($async$BP,r)},
I4(){var s=0,r=A.A(t.H),q,p=this,o,n,m
var $async$I4=A.w(function(a,b){if(a===1)return A.x(b,r)
for(;;)switch(s){case 0:o=p.a
if(o.r||o.e!=null){s=1
break}n=A
m=J
s=3
return A.n(A.kq(),$async$I4)
case 3:o=n.de(m.aa(b.a,"seen_connect_components_guide_v1"))
if(o===!0||p.c==null){s=1
break}p.J(new A.baJ(p))
A.aZ("connection_guide_shown",B.am)
case 1:return A.y(q,r)}})
return A.z($async$I4,r)},
AM(){var s=0,r=A.A(t.H),q=this
var $async$AM=A.w(function(a,b){if(a===1)return A.x(b,r)
for(;;)switch(s){case 0:if(q.c!=null&&q.w)q.J(new A.ba8(q))
s=3
return A.n(A.kq(),$async$AM)
case 3:s=2
return A.n(b.pc("Bool","seen_connect_components_guide_v1",!0),$async$AM)
case 2:A.aZ("connection_guide_dismissed",B.am)
return A.y(null,r)}})
return A.z($async$AM,r)},
wX(){var s=0,r=A.A(t.H),q=1,p=[],o=this,n,m,l,k,j,i,h
var $async$wX=A.w(function(a,b){if(a===1){p.push(b)
s=q}for(;;)switch(s){case 0:q=3
j=o.gab()
n=j.K(0,$.aP(),t.v)
m=j.K(0,$.fO(),t.C)
s=6
return A.n(A.w1(n,m),$async$wX)
case 6:l=b
j=o.c
j.toString
s=7
return A.n(A.fE(null,!0,new A.bad(l),j,t.z),$async$wX)
case 7:o.ig("canvas_json_exported",A.u(["problem_id",m.a],t.N,t.X))
q=1
s=5
break
case 3:q=2
h=p.pop()
k=A.ac(h)
A.aZ("canvas_json_export_failed",A.u(["error",J.V(k)],t.N,t.X))
o.c.a0(t.q).f.bb(A.da(null,null,null,null,null,B.y,null,A.B("Export failed: "+A.m(k),null,null,null,null,null,null,null,null),null,B.X,null,null,null,null,null,null,null,null,null,null))
s=5
break
case 2:s=1
break
case 5:return A.y(null,r)
case 1:return A.x(p.at(-1),r)}})
return A.z($async$wX,r)},
x9(){var s=0,r=A.A(t.H),q,p=2,o=[],n=this,m,l,k,j,i,h,g,f,e,d,c,b
var $async$x9=A.w(function(a,a0){if(a===1){o.push(a0)
s=p}for(;;)switch(s){case 0:d=$.aU()
c=n.c
c.toString
s=3
return A.n(A.fE(null,!0,new A.baF(new A.eR(B.i1,d)),c,t.A),$async$x9)
case 3:m=a0
if(m==null||m.length===0){s=1
break}A.aZ("canvas_json_import_attempted",B.am)
p=5
l=B.ak.fA(0,m,null)
d=t.P
k=d.b(l)?l:null
if(k==null)throw A.d("JSON must be an object")
j=d.b(J.aa(k,"canvas_data"))?A.bt(J.aa(k,"canvas_data"),t.N,t.z):k
i=n.SP(j)
s=8
return A.n(A.th(j),$async$x9)
case 8:h=a0
if(n.c==null){s=1
break}d=n.gab()
c=d.K(0,$.aP().gal(),t.F)
f=h
c.rK(f.y.a===B.n2?f:f.Ko(B.wi))
d.K(0,$.je().gal(),t.D9).bM(0,!1)
n.B0()
if(i)n.tI()
n.Cj("canvas_json_imported")
n.c.a0(t.q).f.bb(B.aGD)
p=2
s=7
break
case 5:p=4
b=o.pop()
g=A.ac(b)
A.aZ("canvas_json_import_failed",A.u(["error",J.V(g)],t.N,t.X))
n.c.a0(t.q).f.bb(A.da(null,null,null,null,null,B.y,null,A.B("Import failed: "+A.m(g),null,null,null,null,null,null,null,null),null,B.X,null,null,null,null,null,null,null,null,null,null))
s=7
break
case 4:s=2
break
case 7:case 1:return A.y(q,r)
case 2:return A.x(o.at(-1),r)}})
return A.z($async$x9,r)},
a9u(a){var s=this.c
s.toString
return A.fE(null,!1,new A.bbx(a),s,t.H)},
ayD(a){var s
switch(a.a){case 0:s=B.m9
break
case 1:s=B.afj
break
case 2:s=B.afB
break
case 3:s=B.aeV
break
case 4:s=B.H4
break
case 5:s=B.afa
break
case 6:s=B.afA
break
default:s=null}return s},
aKv(){var s=this.c
s.toString
return A.fE(null,!0,new A.bbk(this,B.aku),s,t.Gg)},
aKu(a){var s={},r=a.c,q=r.length
if(q===0)return A.f_(null,t.hy)
if(q===1)return A.f_(B.b.gS(r),t.hy)
s.a=B.b.gS(r)
q=this.c
q.toString
return A.fE(null,!0,new A.bbh(s,r),q,t.Sa)},
atM(a,b){var s,r,q="# External Import Report\n\n"+("Imported `"+a.a.a+"` ("+a.b.b+") as **"+b.b+"**.\n")+"\n## Summary\n"+(b.c+"\n")+"\n## Simulation Context\n"+("Using **"+b.f.b+"** with imported-system defaults or a matched built-in challenge.\n"),p=b.d,o=p.length
if(o!==0){q+="\n## Assumptions\n"
for(s=0;s<o;++s)q+="- "+p[s]+"\n"}p=A.cZ(a.d,t.N)
p.q(0,b.e)
p=A.r(p,A.l(p).c)
p.$flags=1
r=p
p=r.length
if(p!==0){q+="\n## Warnings\n"
for(s=0;s<p;++s)q+="- "+r[s]+"\n"}return B.c.N(q.charCodeAt(0)==0?q:q)},
iG(){return this.aBE()},
aBE(){var s=0,r=A.A(t.H),q,p=2,o=[],n=this,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4,a5,a6,a7,a8,a9
var $async$iG=A.w(function(b0,b1){if(b0===1){o.push(b1)
s=p}for(;;)switch(s){case 0:a5={}
a6=n.gab()
a7=t.y
if(!a6.K(0,$.bG8(),a7)){b=n.c
if(b==null){s=1
break}b.a0(t.q).f.bb(B.aGt)
s=1
break}a=$.d5()
s=a.gdc()==null?3:4
break
case 3:s=5
return A.n(n.H3("External import"),$async$iG)
case 5:if(!b1){s=1
break}case 4:m=a.gdc()
if(m==null){s=1
break}a0=A.oy(a6.K(0,$.z6(),t.oM))
s=a0==null?6:7
break
case 6:s=8
return A.n(a.we(),$async$iG)
case 8:a0=b1
case 7:l=n.PK(a0)
k=a6.K(0,$.kN(),a7)||a.gk5()
a9=l
if(a9)b1=a9
else{s=11
break}s=12
break
case 11:a9=k
if(a9)b1=a9
else{s=13
break}s=14
break
case 13:s=15
return A.n(n.GE(m.a),$async$iG)
case 15:case 14:case 12:s=!b1?9:10
break
case 9:if(n.c==null){s=1
break}A.aZ("external_import_blocked_daily_limit",A.u(["user_id",m.a],t.N,t.X))
s=18
return A.n(n.SS(a0,"AI-powered import",B.VC),$async$iG)
case 18:s=b1===!0?16:17
break
case 16:s=19
return A.n(n.p0(m.a),$async$iG)
case 19:case 17:s=1
break
case 10:s=20
return A.n(n.aKv(),$async$iG)
case 20:j=b1
if(j==null){s=1
break}a6.K(0,$.bVd(),t.YM)
s=21
return A.n(A.bBS(A.bIy(j)),$async$iG)
case 21:i=b1
if(i==null){s=1
break}a7=t.N
a=t.X
A.aZ("external_import_started",A.u(["file_name",i.a,"requested_source_kind",j.b],a7,a))
a5.a=null
h=null
g=!1
p=23
g=!0
n.a9u("Parsing external diagram...")
a1=t.H
s=26
return A.n(A.nx(B.al,null,a1),$async$iG)
case 26:f=a6.K(0,$.bVe(),t.EI)
a9=a5
s=27
return A.n(f.EN(i),$async$iG)
case 27:a2=a9.a=b1
a3=n.c
if(a3==null){s=1
break}if(g){A.b8(a3,!0).cE()
g=!1}s=28
return A.n(n.aKu(a2),$async$iG)
case 28:h=b1
if(h==null){s=1
break}g=!0
n.a9u("Importing architecture with AI...")
s=29
return A.n(A.nx(B.al,null,a1),$async$iG)
case 29:s=30
return A.n(f.M_(h,a2),$async$iG)
case 30:e=b1
s=31
return A.n(A.th(e.a),$async$iG)
case 31:d=b1
a1=n.c
if(a1==null){s=1
break}if(g){A.b8(a1,!0).cE()
g=!1}a6.K(0,$.fO().gal(),t.uE).bM(0,e.f)
a1=a6.K(0,$.aP().gal(),t.F)
a3=d.aTz(e.f.a)
a1.rK(a3.y.a===B.n2?a3:a3.Ko(B.wi))
a6.K(0,$.je().gal(),t.D9).bM(0,!1)
n.J(new A.baj(a5,n,e))
n.B0()
s=!l&&!k?32:33
break
case 32:s=34
return A.n(n.BB(m.a),$async$iG)
case 34:case 33:A.aZ("external_import_succeeded",A.u(["file_name",i.a,"requested_source_kind",j.b,"format",a5.a.b.b,"page_name",h.b,"warnings_count",e.e.length,"problem_id",e.f.a],a7,a))
n.c.a0(t.q).f.bb(A.da(null,null,null,null,null,B.y,null,A.B("Imported "+e.b+" from "+i.a+".",null,null,null,null,null,null,null,null),null,B.X,null,null,null,null,null,null,null,null,null,null))
p=2
s=25
break
case 23:p=22
a8=o.pop()
c=A.ac(a8)
a6=n.c
if(a6!=null&&g){A.b8(a6,!0).cE()
g=!1}b=A.j(a7,a)
J.bP(b,"file_name",i.a)
J.bP(b,"requested_source_kind",j.b)
a5=a5.a
if(a5!=null)J.bP(b,"format",a5.b.b)
if(h!=null)J.bP(b,"page_name",h.b)
J.bP(b,"error",J.V(c))
A.aZ("external_import_failed",b)
b=n.c
if(b==null){s=1
break}b.a0(t.q).f.bb(A.da(null,null,null,null,null,B.y,null,A.B("External import failed: "+A.m(c),null,null,null,null,null,null,null,null),null,B.X,null,null,null,null,null,null,null,null,null,null))
s=25
break
case 22:s=2
break
case 25:case 1:return A.y(q,r)
case 2:return A.x(o.at(-1),r)}})
return A.z($async$iG,r)},
SP(a3){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a="position",a0=J.aa(a3,"components"),a1=[],a2=t.f
if(a2.b(a0))B.b.q(a1,J.bAO(a0))
else if(t.j.b(a0))B.b.q(a1,a0)
s=a1.length
if(s===0)return!1
r=A.ak(t.o)
for(q=0,p=0;o=a1.length,p<o;a1.length===s||(0,A.o)(a1),++p){n=a1[p]
if(!a2.b(n)){++q
continue}m=J.aa(n,a)
if(a2.b(m)){o=J.Y(m)
o=o.h(m,"x")==null||o.h(m,"y")==null}else o=!0
if(o)++q
else{o=J.Y(m)
r.B(0,new A.i(A.dg(o.h(m,"x")),A.dg(o.h(m,"y"))))}}if(q>0)return!0
if(r.a<=1&&o>1)return!0
if(o>2){l=A.a([],t.AO)
for(s=a1.length,o=t.N,k=t.i,p=0;p<a1.length;a1.length===s||(0,A.o)(a1),++p){n=a1[p]
if(!a2.b(n))continue
j=J.Y(n)
m=j.h(n,a)
i=j.h(n,"size")
if(i==null)i=A.u(["width",120,"height",64],o,k)
if(a2.b(m)){j=J.Y(m)
j=j.h(m,"x")!=null&&j.h(m,"y")!=null}else j=!1
if(j){j=J.Y(m)
h=A.dg(j.h(m,"x"))
j=A.dg(j.h(m,"y"))
g=J.Y(i)
l.push(new A.M(h,j,h+A.dg(g.h(i,"width")),j+A.dg(g.h(i,"height"))))}}for(a2=l.length,f=0,e=0;e<a2;e=d)for(d=e+1,c=d;c<a2;++c){b=l[e].fk(l[c])
if(b.c-b.a>20&&b.d-b.b>20)++f}if(f>B.d.t(a2*(a2-1)/2*0.15,1,10))return!0}return!1},
a9j(){var s,r,q,p=this,o=$.d5().gdc()
if(o!=null){s=p.ay
r=s!=null&&o.a===s}else r=!1
s=p.gab().K(0,$.je().gal(),t.D9)
if(!p.a.r)q=!r&&p.ay!=null
else q=!0
s.bM(0,q)},
wR(){var s=0,r=A.A(t.H),q,p=2,o=[],n=this,m,l,k,j,i,h,g,f,e,d,c,b,a,a0
var $async$wR=A.w(function(a1,a2){if(a1===1){o.push(a2)
s=p}for(;;)switch(s){case 0:b=$.d5()
a=b.gdc()
if(a==null){A.aZ("copy_design_login_required",B.am)
n.c.a0(t.q).f.bb(B.aGB)
s=1
break}p=4
f=n.gab()
m=f.K(0,$.aP(),t.v)
l=f.K(0,$.fO(),t.C)
s=7
return A.n(A.w1(m,l),$async$wR)
case 7:k=a2
e=t.N
s=8
return A.n(A.ne(A.ao8(),k,null,e,t.P),$async$wR)
case 8:j=a2
d=n.as
i=(d==null?l.b:d)+" (copy)"
s=9
return A.n(b.FJ(j,l.c,null,i),$async$wR)
case 9:h=a2
n.Q=h
n.as=i
n.ay=a.a
f.K(0,$.je().gal(),t.D9).bM(0,!1)
n.ig("design_copied_to_my_designs",A.u(["new_design_id",h],e,t.X))
n.c.a0(t.q).f.bb(B.aGn)
p=2
s=6
break
case 4:p=3
a0=o.pop()
g=A.ac(a0)
A.aZ("copy_design_failed",A.u(["error",J.V(g)],t.N,t.X))
n.c.a0(t.q).f.bb(A.da(null,null,null,null,null,B.y,null,A.B("Copy failed: "+A.m(g),null,null,null,null,null,null,null,null),null,B.X,null,null,null,null,null,null,null,null,null,null))
s=6
break
case 3:s=2
break
case 6:case 1:return A.y(q,r)
case 2:return A.x(o.at(-1),r)}})
return A.z($async$wR,r)},
aOq(a){this.T4()
this.x1=A.CD(B.xj,new A.bbE(this))},
T4(){var s=this.x1
if(s!=null)s.aN(0)
this.x1=null
this.aZ.aa(0)},
a9n(a){var s,r,q=this
if(q.ok!=null&&q.p1===a.a)return
q.Qs()
s=q.p1=a.a
$.d5()
r=$.ct().b
r===$&&A.b()
r=r.ax
r===$&&A.b()
q.ok=r.acM(0,"design-status-"+s,B.D6).ahg(new A.bbt(q),B.zQ,new A.a5T(B.zR,"user_id",s),"public","designs").amB(0)},
a9w(a,b){var s,r,q,p,o,n=this,m=null,l="Design rejected by AI review."
if(n.c==null)return
switch(a){case"approved":s=B.b3
r="Your design passed AI review and is now published!"
break
case"rejected":q=b==null
r=!q&&b.length!==0?"AI review rejected this design: "+b:l
p=n.Q
o=p==null?n.y:p
if(o==null)o="unknown"
p=n.as
if(p==null)p="Design"
n.a0W(o,q?l:b,p)
s=B.a_
break
default:return}q=n.c.a0(t.q).f
p=A.B(r,m,m,m,m,m,m,m,m)
q.bb(A.da(m,m,m,s.u(0.9),B.iU,B.y,m,p,m,B.X,m,m,m,m,m,m,m,m,m,m))},
Qs(){var s=this.ok
if(s!=null)s.Fd(0)
this.p1=this.ok=null},
x5(){var s=0,r=A.A(t.H),q,p=this,o,n,m,l,k,j,i
var $async$x5=A.w(function(a,b){if(a===1)return A.x(b,r)
for(;;)switch(s){case 0:A.aZ("publish_design_clicked",B.am)
s=3
return A.n(p.qE("Publishing designs","publish_design_login_cancelled"),$async$x5)
case 3:if(!b){s=1
break}o=p.gab()
n=o.K(0,$.aP(),t.v)
m=o.K(0,$.fO(),t.C)
o=t.N
j=A
i=A.ao8()
s=5
return A.n(A.w1(n,m),$async$x5)
case 5:s=4
return A.n(j.ne(i,b,null,o,t.P),$async$x5)
case 4:l=b
if(p.c==null){s=1
break}p.ig("publish_flow_opened",A.u(["problem_id",m.a],o,t.X))
o=p.c
o.toString
k=A.G1(new A.baB(m,l),!1,null,t.z)
A.b8(o,!1).hv(k)
case 1:return A.y(q,r)}})
return A.z($async$x5,r)},
qL(){var s=0,r=A.A(t.H),q,p=2,o=[],n=this,m,l,k,j,i,h,g,f,e,d,c,b,a,a0
var $async$qL=A.w(function(a1,a2){if(a1===1){o.push(a2)
s=p}for(;;)switch(s){case 0:A.aZ("save_design_clicked",B.am)
p=4
s=7
return A.n(n.qE("Saving designs","save_design_login_cancelled"),$async$qL)
case 7:m=a2
if(!m){s=1
break}d=n.as
s=8
return A.n(n.Sm(d==null?n.gab().K(0,$.fO(),t.C).b:d),$async$qL)
case 8:l=a2
if(l==null||B.c.N(l).length===0){A.aZ("save_design_title_cancelled",B.am)
s=1
break}d=n.gab()
k=d.K(0,$.aP(),t.v)
j=d.K(0,$.fO(),t.C)
s=9
return A.n(A.w1(k,j),$async$qL)
case 9:i=a2
d=t.N
s=10
return A.n(A.ne(A.ao8(),i,null,d,t.P),$async$qL)
case 10:h=a2
c=$.d5()
b=B.c.N(l)
s=11
return A.n(c.FJ(h,j.c,n.Q,b),$async$qL)
case 11:g=a2
n.Q=g
n.as=B.c.N(l)
n.ig("design_saved",A.u(["design_id",g,"design_title",B.c.N(l)],d,t.X))
d=n.c
if(d==null){s=1
break}d=d.a0(t.q).f
c=A.B("Design saved to your account",null,null,null,null,null,null,null,null)
d.bb(A.da(null,null,null,B.b3.u(0.8),B.iU,B.y,null,c,null,B.X,null,null,null,null,null,null,null,null,null,null))
p=2
s=6
break
case 4:p=3
a0=o.pop()
f=A.ac(a0)
if(n.c==null){s=1
break}A.aZ("design_save_failed",A.u(["error",J.V(f)],t.N,t.X))
e=B.c.k(J.V(f),"row-level security")?"Save failed: permission denied. Please ensure you are logged in and have access to save designs.":"Save failed: "+A.m(f)
n.c.a0(t.q).f.bb(A.da(null,null,null,B.a_,null,B.y,null,A.B(e,null,null,null,null,null,null,null,null),null,B.X,null,null,null,null,null,null,null,null,null,null))
s=6
break
case 3:s=2
break
case 6:case 1:return A.y(q,r)
case 2:return A.x(o.at(-1),r)}})
return A.z($async$qL,r)},
IG(){var s=$.ax.ak$.x.h(0,this.cx),r=s==null?null:s.gad()
if(r instanceof A.S&&r.fy!=null)return r.gG(0)
s=this.c
s.toString
return A.bM(s,B.e_,t.w).w.a},
a8F(a){var s=this
if(s.y1||s.y2)return
s.y2=!0
$.ax.rx$.push(new A.bbp(s,a))},
aMh(){return this.a8F(B.al)},
QO(a){var s,r,q,p,o,n,m,l,k,j,i,h=this.gab(),g=h.K(0,$.aP(),t.v).a,f=J.Y(g)
if(f.ga3(g))return
s=a==null?this.IG():a
r=s.a
if(r<=0||s.b<=0)return
q=s.gft()<700?120:200
for(g=f.gT(g),p=1/0,o=1/0,n=-1/0,m=-1/0;g.p();){f=g.gH(g)
l=f.c
k=l.a
p=Math.min(p,k)
l=l.b
o=Math.min(o,l)
f=f.d
n=Math.max(n,k+f.a)
m=Math.max(m,l+f.b)}g=n-p
f=m-o
l=s.b
j=Math.max(0.2,Math.min(1.2,Math.min(r/(g+q),l/(f+q))))
i=new A.i(r/2,l/2).a6(0,new A.i(p+g/2,o+f/2).ao(0,j))
h.K(0,$.aP().gal(),t.F).NQ(i,j)
this.y1=!0},
B0(){return this.QO(null)},
aIs(a){var s,r,q=this,p=q.xr
q.xr=a
if(p==null){q.aMh()
return}s=p.a
r=p.b
if(Math.abs(a.a-s)<8&&Math.abs(a.b-r)<8)return
s=q.x2
if(s!=null)s.aN(0)
q.x2=A.dr(B.pz,new A.baO(q))},
aQn(a,b,c){var s=this,r=(c?s.k4:s.k3).a4(0,b),q=a.b,p=Math.max(16,a.d-140),o=new A.i(B.d.t(r.a,-q*0.45,q*0.45),B.d.t(r.b,-8,p))
if(c){if(o.m(0,s.k4))return
s.J(new A.bbI(s,o))}else{if(o.m(0,s.k3))return
s.J(new A.bbJ(s,o))}},
aLp(a,b){var s,r,q,p,o,n,m,l,k
if(b)return 16
s=this.k2
r=s==null
q=r?null:s.b
if(q==null)q=88
p=r?null:s.a
if(p==null)p=a.b*0.72
s=this.k3
o=12+s.b
n=o+q
r=a.b
m=r/2+s.a
s=p/2
r-=16
l=m+s>r-232&&m-s<r
k=n>16&&o<94
if(!l||!k)return 16
return B.d.t(n+12,16,Math.max(16,a.d-78-72))},
aMu(){$.ax.rx$.push(new A.bbr(this))},
at8(){this.tI()},
tI(){var s=0,r=A.A(t.H),q,p=this,o,n,m,l
var $async$tI=A.w(function(a,b){if(a===1)return A.x(b,r)
for(;;)switch(s){case 0:n=p.gab()
m=$.aP()
l=n.K(0,m.gal(),t.F)
n=n.K(0,m,t.v).a
m=J.Y(n)
if(m.ga3(n)){s=1
break}o=p.IG()
p.ig("auto_layout_requested",A.u(["component_count",m.gv(n)],t.N,t.X))
s=3
return A.n(l.CI(o),$async$tI)
case 3:case 1:return A.y(q,r)}})
return A.z($async$tI,r)},
Hv(){var s=0,r=A.A(t.H),q=this,p,o
var $async$Hv=A.w(function(a,b){if(a===1)return A.x(b,r)
for(;;)switch(s){case 0:o=q.gab().K(0,$.aP(),t.v)
A.aZ("feedback_open_clicked",B.am)
p=q.c
p.toString
s=2
return A.n(A.fE(null,!0,new A.bak(q,o),p,t.z),$async$Hv)
case 2:return A.y(null,r)}})
return A.z($async$Hv,r)},
x3(){var s=0,r=A.A(t.H),q,p=2,o=[],n=this,m,l,k,j,i,h
var $async$x3=A.w(function(a,b){if(a===1){o.push(b)
s=p}for(;;)switch(s){case 0:A.aZ("load_my_designs_clicked",B.am)
p=4
s=7
return A.n(n.qE("Loading your saved designs","load_my_designs_login_cancelled"),$async$x3)
case 7:m=b
if(!m){s=1
break}s=8
return A.n($.d5().yn(),$async$x3)
case 8:l=b
A.aZ("my_designs_loaded",A.u(["design_count",J.b1(l)],t.N,t.X))
if(n.c==null){s=1
break}if(J.em(l)){n.c.a0(t.q).f.bb(B.aGr)
s=1
break}j=n.c
j.toString
s=9
return A.n(A.KD(B.F,new A.baq(n,l),j,!1,B.qE,!1,t.z),$async$x3)
case 9:p=2
s=6
break
case 4:p=3
h=o.pop()
k=A.ac(h)
A.aZ("my_designs_fetch_failed",A.u(["error",J.V(k)],t.N,t.X))
j=n.c
if(j!=null)j.a0(t.q).f.bb(A.da(null,null,null,null,null,B.y,null,A.B("Failed to load designs: "+A.m(k),null,null,null,null,null,null,null,null),null,B.X,null,null,null,null,null,null,null,null,null,null))
s=6
break
case 3:s=2
break
case 6:case 1:return A.y(q,r)
case 2:return A.x(o.at(-1),r)}})
return A.z($async$x3,r)},
qM(){var s=0,r=A.A(t.H),q,p=2,o=[],n=this,m,l,k,j,i,h,g,f,e,d,c,b,a
var $async$qM=A.w(function(a0,a1){if(a0===1){o.push(a1)
s=p}for(;;)switch(s){case 0:A.aZ("share_link_clicked",B.am)
p=4
s=7
return A.n(n.qE("Sharing a design link","share_link_login_cancelled"),$async$qM)
case 7:m=a1
if(!m){s=1
break}e=n.gab()
l=e.K(0,$.aP(),t.v)
k=e.K(0,$.fO(),t.C)
s=8
return A.n(A.w1(l,k),$async$qM)
case 8:j=a1
e=t.N
s=9
return A.n(A.ne(A.ao8(),j,null,e,t.P),$async$qM)
case 9:i=a1
d=$.d5()
c=k.b
s=10
return A.n(d.z9(i,k.c,null,c),$async$qM)
case 10:h=a1
g=A.kC().ac("/design/"+A.k_(2,h,B.ao,!1))
s=11
return A.n(A.zD(new A.tt(J.V(g))),$async$qM)
case 11:A.aZ("share_link_created",A.u(["design_id",h],e,t.X))
e=n.c
if(e==null){s=1
break}e.a0(t.q).f.bb(B.aGj)
p=2
s=6
break
case 4:p=3
a=o.pop()
f=A.ac(a)
A.aZ("share_link_failed",A.u(["error",J.V(f)],t.N,t.X))
e=n.c
if(e==null){s=1
break}e.a0(t.q).f.bb(A.da(null,null,null,B.a_,null,B.y,null,A.B("Could not generate link: "+A.m(f),null,null,null,null,null,null,null,null),null,B.X,null,null,null,null,null,null,null,null,null,null))
s=6
break
case 3:s=2
break
case 6:case 1:return A.y(q,r)
case 2:return A.x(o.at(-1),r)}})
return A.z($async$qM,r)},
I5(){var s=0,r=A.A(t.H),q,p=this,o
var $async$I5=A.w(function(a,b){if(a===1)return A.x(b,r)
for(;;)switch(s){case 0:if(p.c==null||p.X){s=1
break}p.X=!0
A.aZ("simulation_share_reward_dialog_shown",B.am)
o=p.c
o.toString
s=3
return A.n(A.fE(null,!0,new A.baN(p),o,t.H),$async$I5)
case 3:p.X=!1
case 1:return A.y(q,r)}})
return A.z($async$I5,r)},
Bh(a){return this.aDK(a)},
aDK(a){var s=0,r=A.A(t.H),q,p=2,o=[],n=this,m,l,k,j,i,h,g,f,e,d,c
var $async$Bh=A.w(function(b,a0){if(b===1){o.push(a0)
s=p}for(;;)switch(s){case 0:d=B.c.N(a).toLowerCase()
if(!J.e(d,"linkedin")&&!J.e(d,"twitter")){s=1
break}k=A.k_(2,"I just completed a system design simulation on paperdraw.dev. Try it: https://paperdraw.dev",B.ao,!1)
j=J.e(d,"linkedin")?"https://www.linkedin.com/feed/?shareActive=true&text="+k:"https://twitter.com/intent/tweet?text="+k
i=t.N
h=t.X
A.aZ("social_share_clicked",A.u(["platform",d],i,h))
v.G.window.open(j,"_blank")
g=$.d5()
if(g.gdc()==null){i=n.c
if(i==null){s=1
break}i.a0(t.q).f.bb(B.aGc)
s=1
break}p=4
s=7
return A.n(g.K9(5,d),$async$Bh)
case 7:m=a0
g=n.c
if(g==null){s=1
break}g=g.a0(t.q).f
f=A.B(m?"5 AI credits added for sharing on "+A.m(d)+".":"Credits for "+A.m(d)+" already claimed.",null,null,null,null,null,null,null,null)
g.bb(A.da(null,null,null,m?B.b3:B.a0,null,B.y,null,f,null,B.X,null,null,null,null,null,null,null,null,null,null))
g=m?"social_share_reward_granted":"social_share_reward_skipped"
A.aZ(g,A.u(["platform",d],i,h))
p=2
s=6
break
case 4:p=3
c=o.pop()
l=A.ac(c)
g=n.c
if(g==null){s=1
break}g.a0(t.q).f.bb(A.da(null,null,null,B.a_,null,B.y,null,A.B("Could not add share credits: "+A.m(l),null,null,null,null,null,null,null,null),null,B.X,null,null,null,null,null,null,null,null,null,null))
A.aZ("social_share_reward_error",A.u(["platform",d,"error",J.V(l)],i,h))
s=6
break
case 3:s=2
break
case 6:case 1:return A.y(q,r)
case 2:return A.x(o.at(-1),r)}})
return A.z($async$Bh,r)},
aDd(){A.aZ("save_design_requested",B.am)
this.qL()},
wI(a,b){return this.at9(a,b)},
at9(a,b){var s=0,r=A.A(t.y),q,p=this,o,n,m,l,k,j
var $async$wI=A.w(function(c,d){if(c===1)return A.x(d,r)
for(;;)switch(s){case 0:m=$.d5()
if(m.gdc()==null){q=!1
s=1
break}o=t.N
l=m
k=A
j=A.ao8()
s=5
return A.n(A.w1(p.gab().K(0,$.aP(),t.v),b),$async$wI)
case 5:s=4
return A.n(k.ne(j,d,null,o,t.P),$async$wI)
case 4:s=3
return A.n(l.FJ(d,b.c,null,a),$async$wI)
case 3:n=d
p.Q=n
p.as=a
p.ig("ai_design_auto_saved",A.u(["design_id",n,"design_title",a],o,t.X))
q=!0
s=1
break
case 1:return A.y(q,r)}})
return A.z($async$wI,r)},
HC(){var s=0,r=A.A(t.H),q,p=this,o,n,m,l
var $async$HC=A.w(function(a,b){if(a===1)return A.x(b,r)
for(;;)switch(s){case 0:A.aZ("profile_opened",B.am)
o=$.d5()
s=o.gdc()==null?3:4
break
case 3:s=5
return A.n(p.H3("Opening profile"),$async$HC)
case 5:if(!b){s=1
break}case 4:n=o.gdc()
if(n==null){s=1
break}if(p.c==null){s=1
break}m=A.oy(p.gab().K(0,$.z6(),t.oM))
o=A.ao(m==null?null:J.aa(m,"subscription_tier"))
l=o==null?null:o.toUpperCase()
if(l==null)l="FREE"
o=p.c
o.toString
A.fE(null,!0,new A.baA(p,n,l,new A.xi()),o,t.z)
case 1:return A.y(q,r)}})
return A.z($async$HC,r)},
Bj(){var s=0,r=A.A(t.H),q,p=this,o
var $async$Bj=A.w(function(a,b){if(a===1)return A.x(b,r)
for(;;)switch(s){case 0:A.aZ("upgrade_button_clicked",B.am)
o=p.c
if(o==null){s=1
break}s=3
return A.n(A.b8(o,!1).hv(A.G1(new A.baC(),!1,null,t.z)),$async$Bj)
case 3:case 1:return A.y(q,r)}})
return A.z($async$Bj,r)},
p0(a){return this.aCB(a)},
aCB(a0){var s=0,r=A.A(t.H),q,p=2,o=[],n=this,m,l,k,j,i,h,g,f,e,d,c,b,a
var $async$p0=A.w(function(a1,a2){if(a1===1){o.push(a2)
s=p}for(;;)switch(s){case 0:c={}
b=B.c.N(u.F).length!==0
if(!(b&&B.c.N("P-6R451683RV991140PNGR5MGA").length!==0)){A.aZ("paypal_checkout_unavailable",A.u(["reason","sdk_not_configured"],t.N,t.X))
b=n.c
if(b==null){s=1
break}b.a0(t.q).f.bb(B.U3)
s=1
break}k=t.N
j=t.X
A.aZ("paypal_checkout_dialog_opened",A.u(["user_id",a0],k,j))
c.a=c.b=null
i=n.c
i.toString
s=3
return A.n(A.fE(null,!0,new A.bav(c,new A.xi(),a0),i,t.UW),$async$p0)
case 3:h=a2
if(n.c==null){s=1
break}b=b&&B.c.N("P-6R451683RV991140PNGR5MGA").length!==0
i=h==null
g=i?null:h.b
A.aZ("paypal_subscribe_clicked",A.u(["configured",b,"result",g==null?"dismissed":g],k,j))
b=i?null:h.b
A.aZ("paypal_checkout_dialog_closed",A.u(["result",b==null?"dismissed":b],k,j))
case 4:switch(h){case B.Wf:s=6
break
case B.C_:s=7
break
case B.Wg:s=8
break
case null:s=9
break
case void 0:s=10
break
default:s=5
break}break
case 6:b=c.a
f=b==null?null:B.c.N(b)
m=f==null?"":f
s=J.b1(m)!==0?11:12
break
case 11:p=14
s=17
return A.n($.aon().Ap(m),$async$p0)
case 17:p=2
s=16
break
case 14:p=13
a=o.pop()
l=A.ac(a)
A.aZ("paypal_subscription_sync_failed",A.u(["error",J.V(l)],k,j))
s=16
break
case 13:s=2
break
case 16:case 12:s=18
return A.n(n.tQ(),$async$p0)
case 18:d=a2
b=n.c
if(b==null){s=1
break}b=b.a0(t.q).f
b.bb(A.da(null,null,null,null,null,B.y,null,A.B(d?"Pro features are now unlocked.":u.EY,null,null,null,null,null,null,null,null),null,B.X,null,null,null,null,null,null,null,null,null,null))
s=5
break
case 7:n.c.a0(t.q).f.bb(B.U2)
s=5
break
case 8:b=n.c.a0(t.q).f
k=c.b
b.bb(A.da(null,null,null,null,null,B.y,null,A.B(k==null||k.length===0?"PayPal subscription failed.":"PayPal subscription failed: "+k,null,null,null,null,null,null,null,null),null,B.X,null,null,null,null,null,null,null,null,null,null))
s=5
break
case 9:case 10:s=5
break
case 5:case 1:return A.y(q,r)
case 2:return A.x(o.at(-1),r)}})
return A.z($async$p0,r)},
Re(){var s=0,r=A.A(t.H),q,p=this,o,n,m,l,k,j
var $async$Re=A.w(function(a,b){if(a===1)return A.x(b,r)
for(;;)switch(s){case 0:m=new A.xi().aho()
l=B.c.N("").length!==0
k=t.N
j=t.X
A.aZ("paypal_manage_clicked",A.u(["opened",m,"configured",l],k,j))
o=m?"paypal_manage_opened":"paypal_manage_failed"
A.aZ(o,A.u(["has_portal",l],k,j))
l=p.c
if(l==null){s=1
break}n=m?"PayPal subscription portal opened in a new tab.":"Customer portal URL not configured."
l.a0(t.q).f.bb(A.da(null,null,null,null,null,B.y,null,A.B(n,null,null,null,null,null,null,null,null),null,B.X,null,null,null,null,null,null,null,null,null,null))
case 1:return A.y(q,r)}})
return A.z($async$Re,r)},
aNE(){var s=new A.xi().aXW(A.kC())
if(s===B.O7||this.c==null)return
switch(s.a){case 1:A.aZ("paypal_return_success",B.am)
new A.bby(this).$0()
break
case 2:A.aZ("paypal_return_canceled",B.am)
this.c.a0(t.q).f.bb(B.aGm)
break
case 0:break}},
aus(a,b,c,d){var s,r,q=this,p=null
if(a.a===B.cs&&q.id){s=A.a([],t.p)
if(q.k1){r=q.c
r.toString
s.push(new A.aL(A.bKN(r),p,B.Ey,p))}s.push(A.bC(q.PB(a,b,c,d),1,p))
return A.al(s,B.n,B.f,B.j,0,p)}s=q.c
s.toString
return A.al(A.a([new A.aL(A.bKN(s),p,B.Ey,p),A.bC(q.PB(a,b,c,d),1,p)],t.p),B.n,B.f,B.j,0,p)},
atV(a,b,c,d){var s=this,r=null,q=!(a.a===B.cs&&s.id),p=s.gab().an($.KP(),t.y),o=q&&!b&&!p,n=t.p,m=A.a([A.bC(s.PB(a,b,c,d),1,r)],n)
if(q)m.push(B.a8n)
n=A.a([A.au(m,B.n,B.f,B.j)],n)
if(o)n.push(A.dj(12,new A.afW(new A.ba7(s),r),r,r,12,72,r,r))
if(q)n.push(A.dj(10,B.aRg,r,r,r,12,r,r))
n.push(B.a1c)
return A.fW(B.cT,n,B.y,B.c3,r)},
PB(a4,a5,a6,a7){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2=this,a3=null
a2.aMu()
s=a4.a===B.cs
r=s&&a2.id
q=a2.gab()
p=q.an($.ec(),t.g)===B.b8
o=t.y
n=q.an($.kN(),o)
m=q.an($.a_b(),t.MJ)
l=q.an($.KM(),o)
k=m===B.mv
j=a7.b<900
o=!r
i=o&&!j&&!a5
h=a2.fr
if(h)g=350
else if(a2.fy)g=420
else{f=a2.fx?300:0
g=f}e=!s&&!j&&!h
h=$.aP()
h=B.d.P(q.an(new A.ch(h,new A.b9T(),h.$ti.i("ch<cR.0,F>")),t.i)*100)
q=a2.fy
f=a2.go
d=a2.fx
c=r?16:a2.aLp(a7,j)
b=t.p
c=A.a([new A.S5(new A.b9U(a2),new A.b9V(a2),d,q,f,new A.ba_(a2),c,a3)],b)
if(i)c.push(A.dj(a3,B.aVo,a3,a3,20,a3,72,a3))
if(s){s=j?12:16
q=p?B.aW.u(0.98):B.F.u(0.95)
f=A.Z(12)
d=A.Z(12)
a=r?B.afh:B.afi
a=A.bv(a,p?B.ce:B.m,a3,16)
a0=r?"Exit Focus":"Focus Mode"
q=A.a([A.dq(!1,B.Y,!0,f,A.f0(!1,d,!0,new A.ap(B.fG,A.al(A.a([a,B.db,A.B(a0,a3,a3,a3,a3,A.aA(a3,a3,p?B.aA:B.K,a3,a3,a3,a3,a3,a3,a3,a3,12,a3,a3,B.a5,a3,a3,!0,a3,a3,a3,a3,a3,a3,a3,a3),a3,a3,a3)],b),B.n,B.f,B.W,0,a3),a3),a3,!0,a3,a3,a3,a3,a3,a3,a3,a3,a3,a3,a3,new A.ba0(a2,a4),a3,a3,a3,a3,a3,a3,a3),B.i,q,0,a3,a3,a3,a3,a3,B.aO)],b)
if(r&&!j){f=p?B.aW.u(0.98):B.F.u(0.95)
d=A.Z(12)
a=A.Z(12)
a0=a2.k1
a1=a0?B.afz:B.afy
a1=A.bv(a1,p?B.ce:B.m,a3,16)
a0=a0?"Hide Scenarios":"Show Scenarios"
B.b.q(q,A.a([B.E,A.dq(!1,B.Y,!0,d,A.f0(!1,a,!0,new A.ap(B.fG,A.al(A.a([a1,B.db,A.B(a0,a3,a3,a3,a3,A.aA(a3,a3,p?B.aA:B.K,a3,a3,a3,a3,a3,a3,a3,a3,12,a3,a3,B.a5,a3,a3,!0,a3,a3,a3,a3,a3,a3,a3,a3),a3,a3,a3)],b),B.n,B.f,B.W,0,a3),a3),a3,!0,a3,a3,a3,a3,a3,a3,a3,a3,a3,a3,a3,a2.gaPa(),a3,a3,a3,a3,a3,a3,a3),B.i,f,0,a3,a3,a3,a3,a3,B.aO)],b))}c.push(A.dj(a3,A.au(q,B.A,B.f,B.j),a3,a3,12,a3,s,a3))}if(o){s=j?10:12
q=j?12:0
f=j?12:0
d=j?B.bR:B.i7
a=j?a2.k4:a2.k3
c.push(A.lS(0,new A.ap(new A.ag(q,s,f,0),A.f7(a3,new A.dB(d,a3,a3,A.aWH(new A.jm(new A.aL(a3,a3,new A.a2d(j,a3),a2.CW),a3),a),a3),B.ay,!1,a3,a3,a3,a3,a3,a3,a3,a3,a3,a3,a3,a3,a3,new A.ba1(a2,j,a7),a3,a3,a3,a3,a3,a3,a3,a3,a3,a3,a3,a3,a3,a3,!1,B.bv),a3)))}if(j)c.push(A.dj(a3,A.bMl(!0,a2.ga8f(),new A.ba2(a2),new A.ba3(a2),""+h+"%"),a3,a3,a3,12,12,a3))
if(e){s=p?B.aW:B.F
q=a2.fy
h=q?"Close Documentation":"Show Documentation"
q=q?B.jX:B.ad8
c.push(A.dj(134,new A.a2K(A.bv(q,p?B.ce:B.m,a3,a3),h,s,new A.ba4(a2),a3),a3,a3,a3,g+16,a3,a3))}if(a2.w&&o)c.push(new A.NV(new A.ba5(a2),a2.ga1l(),new A.ba6(a2),a3))
if(n&&!j&&o){s=A.aYT(B.GV,"Export JSON",a2.gayx())
q=A.aYT(B.H2,"Import JSON",a2.gaER())
h=k?B.tR:B.GW
f=k?"Model: Lifecycle V2":"Model: Legacy"
f=A.aYT(h,f,new A.b9W(a2,k))
h=l?B.yu:B.tN
d=l?"Chaos Synergy: ON":"Chaos Synergy: OFF"
c.push(A.dj(a3,A.au(A.a([s,B.E,q,B.E,f,B.E,A.aYT(h,d,new A.b9X(a2,l))],b),B.A,B.f,B.j),a3,a3,16,a3,16,a3))}if(n&&j&&o){s=p?B.aW.u(0.98):B.F.u(0.95)
q=A.Z(10)
o=A.aC(p?B.aE.u(0.9):B.B,B.k,1)
c.push(A.dj(a3,A.a5Q(A.ab(a3,A.bv(B.tT,p?B.ce:B.m,a3,a3),B.i,a3,a3,new A.a4(s,a3,o,q,a3,a3,a3,B.p),a3,a3,a3,a3,B.cA,a3,a3,a3),B.F,a3,new A.b9Y(k,l),new A.b9Z(a2,k,l),"Admin actions",t.N),a3,a3,a3,12,10,a3))}return A.bL7(A.fW(B.cT,c,B.y,B.c3,a3),a2.cx)},
Sm(a){return this.aKw(a)},
aKw(a){var s=0,r=A.A(t.A),q,p=this,o,n
var $async$Sm=A.w(function(b,c){if(b===1)return A.x(c,r)
for(;;)switch(s){case 0:o=$.aU()
n=p.c
n.toString
q=A.fE(null,!0,new A.bbn(new A.eR(new A.d3(a,B.cG,B.bh),o)),n,t.A)
s=1
break
case 1:return A.y(q,r)}})
return A.z($async$Sm,r)},
Sl(a){return this.aKt(a)},
aKt(a){var s=0,r=A.A(t.pL),q,p=this,o,n,m,l,k,j,i,h
var $async$Sl=A.w(function(b,c){if(b===1)return A.x(c,r)
for(;;)switch(s){case 0:l={}
k=$.aU()
j=a.e
i=B.e.l(j.a)
h=B.e.l(j.gyi())
j=B.b.aB(j.x,", ")
o=t.N
n=A.u(["Balanced","availability, scalability, latency","Reliability","availability, fault-tolerance, observability","Cost","cost, efficiency, autoscaling","Performance","latency, throughput, caching"],o,o)
m=A.a([A.u(["label","E-commerce","useCase","Multi-region checkout + cart + inventory APIs","dau","120000","rps","2800","regions","us-east-1, eu-west-1","datastore","PostgreSQL + Redis"],o,o),A.u(["label","Social Feed","useCase","Timeline read-heavy feed with notifications and media","dau","450000","rps","7500","regions","us-east-1, us-west-2, eu-west-1","datastore","Cassandra + Redis"],o,o),A.u(["label","SaaS Analytics","useCase","Event ingest, real-time dashboard, historical reporting","dau","80000","rps","4200","regions","us-east-1","datastore","ClickHouse + object storage"],o,o),A.u(["label","Media Streaming","useCase","Global video delivery with recommendations and auth","dau","600000","rps","9800","regions","us-east-1, ap-south-1, eu-central-1","datastore","PostgreSQL + Redis + CDN cache"],o,o)],t.m0)
l.a="Balanced"
l.b=-1
o=p.c
o.toString
q=A.fE(null,!0,new A.bb9(l,new A.eR(new A.d3("availability, scalability, latency",B.cG,B.bh),k),n,m,new A.eR(new A.d3(a.c,B.cG,B.bh),k),new A.eR(new A.d3(i,B.cG,B.bh),k),new A.eR(new A.d3(h,B.cG,B.bh),k),new A.eR(new A.d3(j,B.cG,B.bh),k),new A.eR(B.i1,k),new A.eR(new A.d3(a.b,B.cG,B.bh),k),a,new A.eR(B.i1,k),new A.eR(B.i1,k)),o,t.jQ)
s=1
break
case 1:return A.y(q,r)}})
return A.z($async$Sl,r)},
atp(a){var s,r,q,p,o,n,m,l,k,j,i,h,g,f=t.N,e=A.j(f,f),d=t.e,c=A.a([],d)
for(s=J.ar(a.a),r=t.z,q=1;s.p();){p=s.gH(s)
if(!this.aFe(p))continue
o="c"+q;++q
e.j(0,o,p.a)
n=p.b
m=this.avD(p)
p=p.e
c.push(A.u(["key",o,"type",n.b,"name",m,"configSummary",A.u(["autoScale",p.c,"instances",p.b,"replication",p.x,"replicationFactor",p.y,"circuitBreaker",p.dx,"retries",p.dy,"dlq",p.fr,"rateLimiting",p.cy,"rateLimitRps",p.db,"cacheTtlSeconds",p.w,"sharding",p.Q,"partitionCount",p.at,"quorumRead",p.fx,"quorumWrite",p.fy],f,r)],f,r))}s=A.j(f,f)
for(p=new A.br(e,e.$ti.i("br<1,2>")).gT(0);p.p();){l=p.d
s.j(0,l.b,l.a)}k=A.a([],d)
for(d=a.b,p=d.length,j=0;j<p;++j){i=d[j]
h=s.h(0,i.b)
g=s.h(0,i.c)
if(h==null||g==null)continue
k.push(A.u(["fromKey",h,"toKey",g,"protocol",i.f.b],f,r))}return new A.aYY(A.u(["components",c,"connections",k],f,r),e)},
aFe(a){switch(a.b.a){case 100:case 105:case 104:case 102:case 101:case 103:case 106:return!1
default:return!0}},
avD(a){var s=a.w,r=s==null?null:B.c.N(s)
if(r!=null&&r.length!==0)return r
return a.b.c},
mI(){var s=0,r=A.A(t.H),q,p=2,o=[],n=this,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,b0,b1
var $async$mI=A.w(function(b2,b3){if(b2===1){o.push(b3)
s=p}for(;;)switch(s){case 0:a9=$.d5()
s=a9.gdc()==null?3:4
break
case 3:s=5
return A.n(n.H3("AI design generation"),$async$mI)
case 5:if(!b3){s=1
break}case 4:b=a9.gdc()
if(b==null){s=1
break}s=6
return A.n(a9.we(),$async$mI)
case 6:a=b3
m=n.PK(a)
a0=a9.gk5()
s=!m&&!a0?7:8
break
case 7:if(n.c==null){s=1
break}a9=b.a
A.aZ("ai_design_generation_blocked_pro_only",A.u(["user_id",a9],t.N,t.X))
s=11
return A.n(n.SS(a,"AI design generation",B.VB),$async$mI)
case 11:s=b3===!0?9:10
break
case 9:s=12
return A.n(n.p0(a9),$async$mI)
case 12:case 10:s=1
break
case 8:a9=n.gab()
l=a9.K(0,$.fO(),t.C)
s=13
return A.n(n.Sl(l),$async$mI)
case 13:k=b3
if(k==null){s=1
break}if(n.c==null){s=1
break}a1=t.N
a2=t.X
A.aZ("ai_design_generation_started",A.u(["problem_id",l.a],a1,a2))
a3=n.c
a3.toString
A.fE(null,!1,new A.bae(),a3,t.H)
p=15
j=A.a_k()
s=18
return A.n(j.Fo(k,l),$async$mI)
case 18:i=b3
s=19
return A.n(A.th(i.a),$async$mI)
case 19:h=b3
a3=n.c
if(a3==null){s=1
break}A.b8(a3,!0).cE()
g=new A.dl("")
g.a+="# AI Engineering Rationale\n"
a3=g
a4="\n"+i.c+"\n"
a3.a+=a4
if(i.d.length!==0){g.a+="\n## Architectural Assumptions\n"
for(a3=i.d,a4=a3.length,a5=0;a5<a3.length;a3.length===a4||(0,A.o)(a3),++a5){f=a3[a5]
a6=g
a7="- "+A.m(f)+"\n"
a6.a+=a7}}n.J(new A.baf(n,g))
a9.K(0,$.aP().gal(),t.F).rK(h.Ko(B.a0U))
n.B0()
e=!1
p=21
s=24
return A.n(n.wI(i.b,l),$async$mI)
case 24:e=b3
p=15
s=23
break
case 21:p=20
b0=o.pop()
d=A.ac(b0)
A.aZ("ai_design_auto_save_failed",A.u(["problem_id",l.a,"error",J.V(d)],a1,a2))
s=23
break
case 20:s=15
break
case 23:a9=n.c.a0(t.q).f
a9.bb(A.da(null,null,null,null,null,B.y,null,A.B(e?"AI design generated and auto-saved. "+i.c:"AI design generated. "+i.c,null,null,null,null,null,null,null,null),null,B.X,null,null,null,null,null,null,null,null,null,null))
A.aZ("ai_design_generation_succeeded",A.u(["problem_id",l.a,"assumptions_count",i.d.length,"auto_saved",e,"is_pro_user",m],a1,a2))
p=2
s=17
break
case 15:p=14
b1=o.pop()
c=A.ac(b1)
a9=n.c
if(a9==null){s=1
break}A.b8(a9,!0).cE()
n.c.a0(t.q).f.bb(A.da(null,null,null,null,null,B.y,null,A.B(A.apW(c,"AI design generation"),null,null,null,null,null,null,null,null),null,B.X,null,null,null,null,null,null,null,null,null,null))
A.aZ("ai_design_generation_failed",A.u(["problem_id",l.a,"error",J.V(c)],a1,a2))
s=17
break
case 14:s=2
break
case 17:case 1:return A.y(q,r)
case 2:return A.x(o.at(-1),r)}})
return A.z($async$mI,r)},
qK(){var s=0,r=A.A(t.H),q,p=2,o=[],n=this,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2
var $async$qK=A.w(function(a3,a4){if(a3===1){o.push(a4)
s=p}for(;;)switch(s){case 0:a1=$.d5()
s=a1.gdc()==null?3:4
break
case 3:s=5
return A.n(n.H3("AI design review"),$async$qK)
case 5:if(!a4){s=1
break}case 4:g=a1.gdc()
if(g==null){s=1
break}s=6
return A.n(a1.we(),$async$qK)
case 6:f=a4
e=n.PK(f)
d=a1.gk5()
s=!e&&!d?7:8
break
case 7:if(n.c==null){s=1
break}i=g.a
A.aZ("ai_review_blocked_pro_only",A.u(["user_id",i],t.N,t.X))
s=11
return A.n(n.aNt(f,B.VB),$async$qK)
case 11:s=a4===!0?9:10
break
case 9:s=12
return A.n(n.p0(i),$async$qK)
case 12:case 10:s=1
break
case 8:a1=n.gab()
m=n.atp(a1.K(0,$.aP(),t.v))
l=a1.K(0,$.fO(),t.C)
a1=t.N
c=t.X
A.aZ("ai_review_started",A.u(["problem_id",l.a],a1,c))
b=n.c
b.toString
a=t.H
A.fE(null,!1,new A.bag(),b,a)
p=14
k=A.a_k()
s=17
return A.n(k.Nv(m.a,l),$async$qK)
case 17:j=a4
b=n.c
if(b==null){s=1
break}A.b8(b,!0).cE()
b=n.c
b.toString
A.fE(null,!0,new A.bah(j,m),b,a)
b=j.e==null?"ai_review_succeeded":"ai_review_failed"
i=A.j(a1,c)
J.bP(i,"problem_id",l.a)
J.bP(i,"score",j.a)
J.bP(i,"issues_count",j.c.length)
J.bP(i,"suggestions_count",j.d.length)
if(j.e!=null)J.bP(i,"error",j.e)
A.aZ(b,i)
p=2
s=16
break
case 14:p=13
a2=o.pop()
h=A.ac(a2)
i=n.c
if(i==null){s=1
break}A.b8(i,!0).cE()
i=n.c
i.toString
A.fE(null,!0,new A.bai(h,m),i,a)
A.aZ("ai_review_failed",A.u(["problem_id",l.a,"error",J.V(h)],a1,c))
s=16
break
case 13:s=2
break
case 16:case 1:return A.y(q,r)
case 2:return A.x(o.at(-1),r)}})
return A.z($async$qK,r)},
PK(a){var s,r,q,p,o,n=$.d5().gdc()
if(A.byt(n==null?null:n.z))return!0
if(a==null)return!1
n=J.Y(a)
s=A.ao(n.h(a,"subscription_tier"))
if(s==null)s="free"
r=B.c.N(s.toLowerCase())
n=A.ao(n.h(a,"subscription_status"))
if(n==null)n="inactive"
q=B.c.N(n.toLowerCase())
p=r==="pro"||r==="premium"||r==="enterprise"
o=q==="active"||q==="trialing"
return p&&o},
GE(a){return this.auJ(a)},
auJ(a){var s=0,r=A.A(t.y),q,p,o
var $async$GE=A.w(function(b,c){if(b===1)return A.x(c,r)
for(;;)switch(s){case 0:s=3
return A.n(A.kq(),$async$GE)
case 3:p=c
o=B.c.a_(new A.az(Date.now(),0,!1).eW(),0,10)
o=A.de(J.aa(p.a,"ai_daily_usage_"+a+"_"+o))
q=o!==!0
s=1
break
case 1:return A.y(q,r)}})
return A.z($async$GE,r)},
BB(a){return this.aGn(a)},
aGn(a){var s=0,r=A.A(t.H)
var $async$BB=A.w(function(b,c){if(b===1)return A.x(c,r)
for(;;)switch(s){case 0:s=3
return A.n(A.kq(),$async$BB)
case 3:s=2
return A.n(c.pc("Bool","ai_daily_usage_"+a+"_"+B.c.a_(new A.az(Date.now(),0,!1).eW(),0,10),!0),$async$BB)
case 2:return A.y(null,r)}})
return A.z($async$BB,r)},
SS(a,b,c){var s,r,q,p=null,o=a==null,n=A.ao(o?p:J.aa(a,"subscription_tier")),m=n==null?p:n.toUpperCase()
if(m==null)m="FREE"
n=A.ao(o?p:J.aa(a,"subscription_status"))
s=n==null?p:n.toUpperCase()
if(s==null)s="INACTIVE"
o=c===B.VC
r=o?"Daily AI Limit Reached":b[0].toUpperCase()+B.c.bg(b,1)+" Is Pro"
q=o?"Free plan includes 1 AI-powered action per day. Upgrade to Pro for unlimited AI generations and imports.":"Subscribe to Pro to unlock "+b+"."
o=this.c
o.toString
return A.fE(p,!0,new A.bbw(m,s,c,r,q),o,t.y)},
aNt(a,b){return this.SS(a,"AI design",b)},
R(a){var s=this,r=null,q=s.gab(),p=q.an($.fh(),t.rD),o=q.an($.ec(),t.g),n=p.a===B.cs&&s.id,m=A.bM(a,B.e_,t.w).w,l=$.aP(),k=l.$ti,j=t.y,i=q.an(new A.ch(l,new A.bbQ(),k.i("ch<cR.0,H>")),j),h=q.an($.fO(),t.C),g=q.an($.z6(),t.oM),f=q.an($.kN(),j),e=q.an($.je(),j),d=q.an($.bVy(),t.Rw),c=A.oy(d)
if(c==null)c=B.aT3
q=B.d.P(q.an(new A.ch(l,new A.bbR(),k.i("ch<cR.0,F>")),t.i)*100)
o=o===B.b8?B.rN:B.cJ
l=A.a([A.FM(new A.bbS(s,n,p,g,f,i,h,d,c))],t.p)
m=!(m.a.a<900)
if(m)l.push(B.a1d)
if(m)l.push(A.dj(24,A.bMl(!1,s.ga8f(),new A.bbT(s),new A.bbU(s),""+q+"%"),r,r,r,24,r,r))
if(e&&!n)l.push(new A.ahw(s.gawg(),s.ch,r))
return A.uD(r,o,A.mA(!0,r,A.fW(B.cT,l,B.y,B.c3,r),r,r,r,s.cy,!0,r,r,r,s.gaBT(),r,r))},
n(){var s,r=this
r.cy.n()
$.ax.kc(r)
r.gab().K(0,$.aP().gal(),t.F).EH()
r.tJ()
s=r.x2
if(s!=null)s.aN(0)
r.Qs()
s=r.p2
if(s!=null)s.aA(0)
s=r.p3
if(s!=null)s.aA(0)
s=r.p4
if(s!=null)s.aA(0)
r.T4()
r.aR()},
aNk(){var s=this.R8.e
if(s==null)return!1
if(!B.c.k(s.toLowerCase(),"no canvas found"))return!1
return this.to<20},
aMv(){if(this.ry!=null)return
this.ry=A.dr(B.te,new A.bbs(this))},
tJ(){var s=this.ry
if(s!=null)s.aN(0)
this.ry=null
this.to=0}}
