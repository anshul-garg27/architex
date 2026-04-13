return this.adu(null,a,null)},
gL7(){var s=this,r=s.r
if(r==null)r=s.gaGK()
if(r!=null)return r
if(s.x!=null||s.w===B.w)return null
return A.bZg(s.c)},
gv_(){var s=this.x
s=s==null?null:s.c
return s==null?this.c.c:s},
gaZR(){var s=this.x,r=this.b+"|"
return s==null?r+this.c.b:r+s.a+"|"+s.b},
gaGK(){var s,r=$.bRD().dD(this.d)
if(r==null)return null
s=r.b[1]
s.toString
return A.ix(s,null)}}
A.ke.prototype={
M(){return"FixType."+this.b}}
A.bf.prototype={
M(){return"FailureType."+this.b}}
A.eY.prototype={
M(){return"DropReason."+this.b}}
A.F1.prototype={}
A.ty.prototype={}
A.pi.prototype={}
A.a9H.prototype={}
A.mV.prototype={}
A.oF.prototype={}
A.oE.prototype={}
A.kb.prototype={}
A.a0z.prototype={
gWG(){var s=this,r=!0
if(s.a.length===0)if(s.b.length===0)if(s.c.length===0){r=s.d
r=r.gbp(r)||s.w>0}return r}}
A.jl.prototype={
gbw(a){return this.a}}
A.a1j.prototype={}
A.pj.prototype={
gyi(){var s=this.b
if(s>0)return s
return B.d.f4(B.d.aW(this.a*10*0.8)/28800)},
gCJ(){var s=this.f*100
if(s>=99.99)return"99.99%"
if(s>=99.9)return"99.9%"
if(s>=99)return"99%"
return B.d.Z(s,1)+"%"},
b4(){var s=this
return A.u(["dau",s.a,"qps",s.b,"readWriteRatio",s.c,"latencySlaMsP50",s.d,"latencySlaMsP95",s.e,"availabilityTarget",s.f,"budgetPerMonth",s.r,"dataStorageGb",s.w,"regions",s.x,"customConstraints",s.y],t.N,t.z)}}
A.rj.prototype={}
A.xL.prototype={
M(){return"SemanticInferenceStatus."+this.b}}
A.Cg.prototype={
b4(){var s=this
return A.u(["tick",s.a,"elapsed_ms",s.b,"total_rps",s.c,"p95_latency_ms",s.d,"error_rate",s.e,"availability",s.f,"monthly_cost",s.r,"failure_count",s.w,"active_chaos_events",s.x,"traffic_level",s.y],t.N,t.z)}}
A.aT0.prototype={
b4(){var s,r,q,p,o=this,n=o.b,m=n.ox().eW(),l=o.c,k=l.ox().eW()
n=B.e.bc(l.f5(n).a,1000)
l=o.e
s=l.z
r=t.N
q=t.z
l=A.u(["total_rps",l.a,"avg_latency_ms",l.b,"p50_latency_ms",l.c,"p95_latency_ms",l.d,"p99_latency_ms",l.e,"error_rate",l.r,"availability",l.w,"error_budget_remaining",l.x,"error_budget_burn_rate",l.y,"total_cost_per_hour",s,"monthly_cost",s*24*30,"cost_spent",l.Q,"total_requests",l.at,"successful_requests",l.ax,"failed_requests",l.ay],r,q)
s=o.w
p=A.v(s).i("q<1,O<c,@>>")
s=A.r(new A.q(s,new A.aT1(),p),p.i("a2.E"))
return A.u(["id",o.a,"started_at",m,"ended_at",k,"duration_ms",n,"total_ticks",o.d,"final_failure_count",o.f,"active_chaos_types",o.r,"final_metrics",l,"timeline",s],r,q)},
gbw(a){return this.a}}
A.aT1.prototype={
$1(a){return a.b4()},
$S:759}
A.Hs.prototype={
M(){return"SpecializationDraftMode."+this.b}}
A.Cj.prototype={
M(){return"SpecializationDraftStatus."+this.b}}
A.fJ.prototype={
b4(){var s,r,q=this,p=q.Q
p=p==null?null:p.b
s=q.as
r=A.v(s).i("q<1,c>")
s=A.r(new A.q(s,new A.aFu(),r),r.i("a2.E"))
return A.u(["domain",q.a,"code",q.b,"title",q.c,"cause",q.d,"rootReason",q.e,"recommendation",q.f,"impactSummary",q.r,"issueLevel",q.w.b,"defaultSeverity",q.x,"errorCode",q.y,"type",q.z.b,"fixType",p,"replacementTypes",s,"defaultEffects",q.at],t.N,t.z)}}
A.aFu.prototype={
$1(a){return a.b},
$S:280}
A.pt.prototype={
M(){return"SpecializationDependencyScope."+this.b}}
A.a1S.prototype={
b4(){var s,r,q,p=this,o=p.a,n=A.v(o).i("q<1,c>")
o=A.r(new A.q(o,new A.axC(),n),n.i("a2.E"))
o.$flags=1
n=p.b
s=A.v(n).i("q<1,c>")
n=A.r(new A.q(n,new A.axD(),s),s.i("a2.E"))
n.$flags=1
s=p.c
r=A.v(s).i("q<1,c>")
s=A.r(new A.q(s,new A.axE(),r),r.i("a2.E"))
s.$flags=1
r=p.d
q=A.v(r).i("q<1,c>")
r=A.r(new A.q(r,new A.axF(),q),q.i("a2.E"))
r.$flags=1
return A.u(["upstreamCategories",o,"downstreamCategories",n,"upstreamTypes",s,"downstreamTypes",r,"requiresReplicaPeer",p.e,"requiresFailoverTarget",p.f],t.N,t.z)}}
A.axC.prototype={
$1(a){return a.b},
$S:281}
A.axD.prototype={
$1(a){return a.b},
$S:281}
A.axE.prototype={
$1(a){return a.b},
$S:78}
A.axF.prototype={
$1(a){return a.b},
$S:78}
A.uB.prototype={
b4(){var s,r,q=this,p=q.r,o=A.v(p).i("q<1,c>")
p=A.r(new A.q(p,new A.aQl(),o),o.i("a2.E"))
o=q.x
s=A.v(o).i("q<1,c>")
o=A.r(new A.q(o,new A.aQm(),s),s.i("a2.E"))
o.$flags=1
s=q.y.b4()
r=q.as
r=r==null?nu