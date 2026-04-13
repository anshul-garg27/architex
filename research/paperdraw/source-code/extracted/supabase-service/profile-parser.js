0,"downstreamTypes")),J.e(e.h(0,"requiresReplicaPeer"),!0),J.e(e.h(0,"requiresFailoverTarget"),!0))}else e=B.a90
s=A.bP1(n.h(a,"neighborMetricThresholdHints"))
r=A.DB(n.h(a,"neighborFailureHints"))
q=n.h(a,"propagationRole")
return new A.uB(o,m,l,k,j,i,h,g,f,e,s,r,A.c1b(q==null?null:J.V(q)),A.bP0(n.h(a,"causalNarrativeTemplate")),A.DB(n.h(a,"trafficEffectHints")))},
avs(a){var s,r,q,p,o,n,m,l=a.h(0,"componentType"),k=A.bOL(l==null?null:J.V(l))
l=a.h(0,"category")
s=A.bPv(l==null?null:J.V(l))
if(s==null)s=k.gbD()
l=t.kc
r=l.a(a.h(0,"issues"))
if(r==null)r=B.U
q=l.a(a.h(0,"ruleIntents"))
if(q==null)q=B.U
l=a.h(0,"mode")
l=A.c2v(l==null?null:J.V(l))
p=A.t0(a,"domain")
o=t.f
n=J.jv(r,o)
m=t.P
n=A.dd(n,new A.avt(),n.$ti.i("k.E"),m)
n=A.dd(n,A.cfh(),A.l(n).i("k.E"),t.pW)
n=A.r(n,A.l(n).i("k.E"))
n.$flags=1
o=J.jv(q,o)
m=A.dd(o,new A.avu(),o.$ti.i("k.E"),m)
m=A.dd(m,A.cfi(),A.l(m).i("k.E"),t.ac)
o=A.r(m,A.l(m).i("k.E"))
o.$flags=1
return new A.zG(k,s,l,p,n,o,A.bOZ(a.h(0,"confidence")),A.DB(a.h(0,"assumptions")),A.DB(a.h(0,"reviewWarnings")))},
bXI(a){return A.Mn(a)},
Mn(a){var s,r,q,p,o,n,m,l,k,j=null,i=J.Y(a),h=i.h(a,"draftJson")
if(h==null)h=i.h(a,"draft_json")
$label0$0:{s=t.f
if(s.b(h)){s=A.bt(h,t.N,t.z)
break $label0$0}if(typeof h=="string"){s=A.bt(s.a(B.ak.fA(0,h,j)),t.N,t.z)
break $label0$0}s=A.a3(B.aci)}r=i.h(a,"id")
r=r==null?j:J.V(r)
s=A.avs(s)
q=i.h(a,"status")
q=q==null?j:J.V(q)
q=A.bLi(q==null?"draft":q)
p=i.h(a,"modelName")
if(p==null)p=i.h(a,"model_name")
p=J.V(p==null?"":p)
o=i.h(a,"promptVersion")
if(o==null)o=i.h(a,"prompt_version")
o=J.V(o==null?"":o)
n=i.h(a,"createdBy")
n=n==null?j:J.V(n)
if(n==null){n=i.h(a,"created_by")
n=n==null?j:J.V(n)}m=i.h(a,"approvedBy")
m=m==null?j:J.V(m)
if(m==null){m=i.h(a,"approved_by")
m=m==null?j:J.V(m)}l=i.h(a,"createdAt")
l=A.bv4(l==null?i.h(a,"created_at"):l)
k=i.h(a,"updatedAt")
return new A.fv(r,s,q,p,o,n,m,l,A.bv4(k==null?i.h(a,"updated_at"):k))},
c2x(a){return A.c2w(a)},
c2w(a){var s,r,q,p,o,n,m,l,k,j,i,h,g=null,f="profileSignature",e=J.Y(a),d=e.h(a,"draftJson")
if(d==null)d=e.h(a,"draft_json")
$label0$0:{s=t.f
if(s.b(d)){s=A.bt(d,t.N,t.z)
break $label0$0}if(typeof d=="string"){s=A.bt(s.a(B.ak.fA(0,d,g)),t.N,t.z)
break $label0$0}s=A.a3(B.aco)}r=e.h(a,"id")
r=r==null?g:J.V(r)
q=e.h(a,"componentType")
q=q==null?g:J.V(q)
if(q==null){q=e.h(a,"component_type")
q=q==null?g:J.V(q)}q=A.bOL(q)
p=e.h(a,f)
p=A.t0(A.u([f,p==null?e.h(a,"profile_signature"):p],t.N,t.z),f)
o=e.h(a,"domain")
o=J.V(o==null?"":o)
s=A.avs(s)
n=e.h(a,"status")
n=n==null?g:J.V(n)
n=A.bLi(n==null?"draft":n)
m=e.h(a,"modelName")
if(m==null)m=e.h(a,"model_name")
m=J.V(m==null?"":m)
l=e.h(a,"promptVersion")
if(l==null)l=e.h(a,"prompt_version")
l=J.V(l==null?"":l)
k=e.h(a,"createdBy")
k=k==null?g:J.V(k)
if(k==null){k=e.h(a,"created_by")
k=k==null?g:J.V(k)}j=e.h(a,"approvedBy")
j=j==null?g:J.V(j)
if(j==null){j=e.h(a,"approved_by")
j=j==null?g:J.V(j)}i=e.h(a,"createdAt")
i=A.bv4(i==null?e.h(a,"created_at"):i)
h=e.h(a,"updatedAt")
return new A.mU(r,q,p,o,s,n,m,l,k,j,i,A.bv4(h==null?e.h(a,"updated_at"):h))},
c9O(a,b,c,d){var s,r,q,p,o,n,m,l,k,j,i,h
if(a==null){s=b.gbD()
if(c==null)r=d==null?null:d.d
else r=c
q=new A.zG(b,s,B.AH,r==null?b.gbD().b:r,B.Ib,B.u5,0,B.t,B.t)}else q=a
if(d==null)return q
s=t.N
r=A.j(s,t.pW)
for(p=q.e,o=p.length,n=0;n<p.length;p.length===o||(0,A.o)(p),++n){m=p[n]
r.j(0,m.b,m)}for(p=d.e,o=p.length,n=0;n<p.length;p.length===o||(0,A.o)(p),++n){m=p[n]
r.j(0,m.b,m)}p=A.j(s,t.ac)
for(o=q.f,l=o.length,n=0;n<o.length;o.length===l||(0,A.o)(o),++n){k=o[n]
p.j(0,k.a,k)}for(o=d.f,l=o.length,n=0;n<o.length;o.length===l||(0,A.o)(o),++n){k=o[n]
p.j(0,k.a,k)}if(p.a!==0)j=B.v2
else j=r.a!==0?B.AG:B.AH
o=b.gbD()
l=c==null?d.d:c
i=r.$ti.i("aN<2>")
r=A.r(new A.aN(r,i),i.i("k.E"))
r.$flags=1
i=p.$ti.i("aN<2>")
p=A.r(new A.aN(p,i),i.i("k.E"))
p.$flags=1
i=d.r
i=i>0?i:q.r
h=A.r(q.w,s)
B.b.q(h,d.w)
s=A.r(q.x,s)
B.b.q(s,d.x)
return new A.zG(b,o,j,l,r,p,i,h,s)},
t0(a,b){var s=J.aa(a,b),r=s==null?null:B.c.N(J.V(s))
if(r==null)r=""
if(r.length===0)throw A.d(A.cY("Missing required field: "+b,null,null))
return r},
bOZ(a){var s
if(typeof a=="number")return a
if(typeof a=="string"){s=A.l_(B.c.N(a))
if(s!=null)return s}throw A.d(A.cY("Expected numeric value but got "+A.m(a),null,null))},
cao(a){if(a==null)return null
if(A.oo(a))return a
if(typeof a=="number")return B.d.P(a)
if(typeof a=="string")return A.ix(B.c.N(a),null)
return null},
bv4(a){if(a==null)return null
if(a instanceof A.az)return a
if(typeof a=="string")return A.bI1(a)
return null},
bP0(a){var s=a==null?null:B.c.N(J.V(a))
if(s==null||s.length===0)return null
return s},
DB(a){var s
if(!t.j.b(a))return B.t
s=J.cq(a,new A.bv7(),t.N).cA(0,new A.bv8())
s=A.r(s,s.$ti.i("k.E"))
s.$flags=1
return s},
bP_(a){var s,r,q,p,o
if(!t.j.b(a))return B.aqj
s=A.a([],t.u)
for(q=J.ar(a);q.p();){r=q.gH(q)
try{p=r
J.cj(s,A.bOM(p==null?null:J.V(p)))}catch(o){}}return s},
bP1(a){var s,r,q,p,o,n
if(!t.f.b(a))return B.et
s=A.j(t.N,t.i)
for(r=J.mp(a),r=r.gT(r);r.p();){q=r.g