A.aDv.prototype={
gH7(){var s=this.r
return s===$?this.r=new A.a33(this.f):s},
FA(a,b,c,d){return this.akv(a,b,c,d)},
aku(a,b){return this.FA(a,null,b,null)},
akv(a,b,c,d){var s=0,r=A.A(t.PN),q,p=this
var $async$FA=A.w(function(e,f){if(e===1)return A.x(f,r)
for(;;)switch(s){case 0:q=p.Hp(a,b,c,d,p.d+"/authorize")
s=1
break
case 1:return A.y(q,r)}})
return A.z($async$FA,r)},
yl(a){return this.aXI(a)},
aXI(a){var s=0,r=A.A(t.en),q,p=this,o,n,m,l,k,j
var $async$yl=A.w(function(b,c){if(b===1)return A.x(c,r)
for(;;)switch(s){case 0:k=p.ax
s=3
return A.n(k.Fz(0,"supabase.auth.token-code-verifier"),$async$yl)
case 3:j=c
if(j==null)throw A.d(A.tg("Code verifier could not be found in local storage.",null,null))
o=B.b.gS(j.split("/"))
n=A.bWr(B.b.gY(j.split("/")))
m=t.N
s=4
return A.n(p.gH7().vU(0,p.d+"/token",B.zX,A.aDM(A.u(["auth_code",a,"code_verifier",o],m,t.z),p.e,null,null,A.u(["grant_type","pkce"],m,m))),$async$yl)
case 4:l=c
s=5
return A.n(k.zl(0,"supabase.auth.token-code-verifier"),$async$yl)
case 5:k=A.Ri(l)
k.toString
p.C2(k)
if(n===B.oU)p.of(B.oU)
else p.of(B.oV)
q=new A.Lo(k)
s=1
break
case 1:return A.y(q,r)}})
return A.z($async$yl,r)},
EV(a){return this.b3B(a)},
b3A(){return this.EV(null)},
b3B(a){var s=0,r=A.A(t.W8),q,p=this,o,n,m
var $async$EV=A.w(function(b,c){if(b===1)return A.x(c,r)
for(;;)switch(s){case 0:m=p.ch
m.bF(B.mb,"Refresh session",null,null)
if(a==null){o=p.c
n=o==null?null:o.e}else n=a
if(n==null){m.bF(B.ht,"Can't refresh session, no refresh token found.",null,null)
throw A.d(A.bGT())}s=3
return A.n(p.wJ(n),$async$EV)
case 3:q=c
s=1
break
case 1:return A.y(q,r)}})
return A.z($async$EV,r)},
FF(a){return this.akR(a)},
akR(a){var s=0,r=A.A(t.Zu),q,p=this,o,n,m
var $async$FF=A.w(function(b,c){if(b===1)return A.x(c,r)
for(;;)switch(s){case 0:o=A.aDM(null,p.e,a,null,null)
n=A
m=A
s=3
return A.n(p.gH7().vU(0,p.d+"/user",B.Ss,o),$async$FF)
case 3:q=new n.aa0(m.bDf(c))
s=1
break
case 1:return A.y(q,r)}})
return A.z($async$FF,r)},
zV(a){return this.akN(a)},
akN(a0){var s=0,r=A.A(t.en),q,p=this,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a
var $async$zV=A.w(function(a1,a2){if(a1===1)return A.x(a2,r)
for(;;)switch(s){case 0:if(a0.gDU()){o=a0.l(0)
n=A.ei(A.aX(o,"#","&"),0,null)}else{o=a0.l(0)
n=A.ei(A.aX(o,"#","?"),0,null)}m=n.ghw().h(0,"error_description")
l=n.ghw().h(0,"error_code")
k=n.ghw().h(0,"error")
if(m!=null)throw A.d(A.tg(m,k,l))
s=p.ay===B.rm?3:4
break
case 3:j=a0.ghw().h(0,"code")
if(j==null)throw A.d(new A.a_R("No code detected in query parameters.",null,null))
s=5
return A.n(p.yl(j),$async$zV)
case 5:q=a2
s=1
break
case 4:i=n.ghw().h(0,"access_token")
h=n.ghw().h(0,"expires_in")
g=n.ghw().h(0,"refresh_token")
f=n.ghw().h(0,"token_type")
e=n.ghw().h(0,"provider_token")
d=n.ghw().h(0,"provider_refresh_token")
if(i==null)throw A.d(A.tg("No access_token detected.",null,null))
if(h==null)throw A.d(A.tg("No expires_in detected.",null,null))
if(g==null)throw A.d(A.tg("No refresh_token detected.",null,null))
if(f==null)throw A.d(A.tg("No token_type detected.",null,null))
s=6
return A.n(p.FF(i),$async$zV)
case 6:c=a2.a
if(c==null)throw A.d(A.tg("No user found.",null,null))
b=new A.kp(e,d,i,A.dN(h,null),g,f,c)
a=n.ghw().h(0,"type")
p.C2(b)
if(a==="recovery")p.of(B.oU)
else p.of(B.oV)
q=new A.Lo(b)
s=1
break
case 1:return A.y(q,r)}})
return A.z($async$zV,r)},
l0(){var s=B.Tg
return this.am4()},
am4(){var s=0,r=A.A(t.H),q=1,p=[],o=this,n,m,l,k,j,i,h
var $async$l0=A.w(function(a,b){if(a===1){p.push(b)
s=q}for(;;)switch(s){case 0:j=B.Tg
i=o.ch
i.bF(B.mb,"Signing out user with scope: "+A.m(j),null,null)
l=o.c
n=l==null?null:l.c
s=j!==B.aEj?2:3
break
case 2:i.bF(B.d9,"Removing session",null,null)
o.c=null
i=o.ax
i=i==null?null:i.zl(0,"supabase.auth.token-code-verifier")
s=4
return A.n(t.uz.b(i)?i:A.kF(i,t.H),$async$l0)
case 4:o.of(B.mY)
case 3:s=n!=null?5:6
break
case 5:q=8
i=o.a
i===$&&A.b()
s=11
return A.n(i.G5(n,j),$async$l0)
case 11:q=1
s=10
break
case 8:q=7
h=p.pop()
i=A.ac(h)
if(i instanceof A.qi){m=i
if(m.b!=="401"&&m.b!=="403"&&m.b!=="404")throw h}else throw h
s=10
break
case 7:s=1
break
case 10:case 6:return A.y(null,r)
case 1:return A.x(p.at(-1),r)}})
return A.z($async$l0,r)},
FY(a){return this.alA(a)},
alA(a){var s=0,r=A.A(t.H),q=this,p
var $async$FY=A.w(function(b,c){if(b===1)return A.x(c,r)
for(;;)switch(s){case 0:p=A.Ri(B.ak.bN(0,a))
s=p==null?2:3
break
case 2:s=4
return A.n(q.l0(),$async$FY)
case 4:throw A.d(q.XA(A.tg("Initial session is missing data.",null,null)))
case 3:q.c=p
q.of(B.mX)
return A.y(null,r)}})
return A.z($async$FY,r)},
zg(a){return this.b3z(a)},
b3z(a){var s=0,r=A.A(t.W8),q,p=2,o=[],n=this,m,l,k,j,i,h,g,f
var $async$zg=A.w(function(b,c){if(b===1){o.push(c)
s=p}for(;;)switch(s){case 0:p=4
m=A.Ri(B.ak.bN(0,a))
s=m==null?7:8
break
case 7:n.ch.bF(B.ht,"Can't recover session from string, session is null",null,null)
s=9
return A.n(n.l0(),$async$zg)
case 9:h=n.XA(A.tg("Current session is missing data.",null,null))
throw A.d(h)
case 8:s=m.gagd()?10:12
break
case 10:n.ch.bF(B.d9,"Session from recovery is expired",null,null)
l=m.e
n.w===$&&A.b()
s=l!=null?13:15
break
case 13:s=16
return A.n(n.wJ(l),$async$zg)
case 16:h=c
q=h
s=1
break
s=14
break
case 15:s=17
return A.n(n.l0(),$async$zg)
case 17:h=n.XA(A.tg("Session expired.",null,null))
throw A.d(h)
case 14:s=11
break
case 12:h=n.c
k=h==null||h.r.a!==m.r.a
n.C2(m)
if(k)n.of(B.oW)
q=new A.oz(m)
s=1
break
case 11:p=2
s=6
break
case 4:p=3
f=o.pop()
j=A.ac(f)
i=A.b3(f)
n.Ex(j,i)
throw f
s=6
break
case 3:s=2
break
case 6:case 1:return A.y(q,r)
case 2:return A.x(o.at(-1),r)}})
return A.z($async$zg,r)},
wr(){var s=0,r=A.A(t.H),q=this
var $async$wr=A.w(function(a,b){if(a===1)return A.x(b,r)
for(;;)switch(s){case 0:q.a_x()
q.ch.bF(B.d9,"Starting auto refresh",null,null)
q.x=A.CD(B.py,new A.aDC(q))
s=2
return A.n(A.nx(B.al,null,t.z),$async$wr)
case 2:s=3
return A.n(q.Ax(),$async$wr)
case 3:return A.y(null,r)}})
return A.z($async$wr,r)},
a_x(){this.ch.bF(B.d9,"Stopping auto refresh",null,null)
var s=this.x
if(s!=null)s.aN(0)
this.x=null},
Ax(){var s=0,r=A.A(t.H),q,p=2,o=[],n=this,m,l,k,j,i,h,g,f
var $async$Ax=A.w(function(a,b){if(a===1){o.push(b)
s=p}for(;;)switch(s){case 0:p=4
m=new A.az(Date.now(),0,!1)
i=n.c
h=i==null
l=h?null:i.e
if(l==null){s=1
break}k=h?null:i.gDw()
if(k==null){s=1
break}j=B.d.dS(B.e.bc(new A.az(A.wl(k*1000,0,!1),0,!1).f5(m).a,1000)/1e4)
n.ch.bF(B.Hv,"Access token expires in "+A.m(j)+" ticks",null,null)
s=j<=3?7:8
break
case 7:s=9
return A.n(n.wJ(l),$async$Ax)
case 9:case 8:p=2
s=6
break
case 4:p=3
f=o.pop()
s=6
break
case 3:s=2
break
case 6:case 1:return A.y(q,r)
case 2:return A.x(o.at(-1),r)}})
return A.z($async$Ax,r)},
Iy(a){return this.aKX(a)},
aKX(a){var s=0,r=A.A(t.W8),q,p=this,o,n
var $async$Iy=A.w(function(b,c){if(b===1)return A.x(c,r)
for(;;)switch(s){case 0:o={}
n=Date.now()
o.a=0
s=3
return A.n(new A.a7g(B.Y,0,A.d7(0,0,10),999).vW(new A.aDA(o,p,a),null,new A.aDB(o,new A.az(n,0,!1)),t.W8),$async$Iy)
case 3:q=c
s=1
break
case 1:return A.y(q,r)}})
return A.z($async$Iy,r)},
Hp(a,b,c,d,e){return this.aAj(a,b,c,d,e)},
aAj(a,b,c,d,e){var s=0,r=A.A(t.PN),q,p=this,o,n,m,l,k
var $async$Hp=A.w(function(f,g){if(f===1)return A.x(g,r)
for(;;)switch(s){case 0:l=t.N
k=A.u(["provider",A.c3q(a)],l,l)
k.j(0,"redirect_to",c)
o=p.ay
s=o===B.rm?3:4
break
case 3:n=A.cdc()
s=5
return A.n(p.ax.A2("supabase.auth.token-code-verifier",n),$async$Hp)
case 5:m=B.Dg.c0(B.Cs.c0(n))
k.q(0,A.u(["flow_type",o.b,"code_challenge",B.Cz.gDr().c0(m.a).split("=")[0],"code_challenge_method","s256"],l,l))
case 4:l=A.hf(null,null,null,null,null,k,null).f
if(l==null)l=""
q=new A.a5b(e+"?"+l)
s=1
break
case 1:return A.y(q,r)}})
return A.z($async$Hp,r)},
C2(a){var s=null,r=this.ch
r.bF(B.dF,"Saving session: "+a.l(0),s,s)
r.bF(B.d9,"Saving session",s,s)
this.c=a},
aGw(){var s,r,q,p=this,o=A.ei(p.d,0,null),n="sb-"+B.b.gS(o.go5(o).split("."))+"-auth-token"
try{o=A.cde(n)
p.CW=o
o=o.b.pO(new A.aDz(p))
p.cx=o}catch(q){s=A.ac(q)
r=A.b3(q)
p.ch.bF(B.ht,"Failed to start broadcast channel",s,r)}},
wJ(a){return this.auD(a)},
auD(a){var s=0,r=A.A(t.W8),q,p=2,o=[],n=[],m=this,l,k,j,i,h,g,f,e,d
var $async$wJ=A.w(function(b,c){if(b===1){o.push(c)
s=p}for(;;)switch(s){case 0:if(m.y!=null){m.ch.bF(B.Hv,"Don't call refresh token, already in progress",null,null)
q=m.y.a
s=1
break}p=4
f=new A.aI($.aG,t.lc)
m.y=new A.bJ(f,t.qs)
f.ed(new A.aDw(),new A.aDx(),t.a)
m.ch.bF(B.d9,"Refresh access token",null,null)
s=7
return A.n(m.Iy(a),$async$wJ)
case 7:l=c
k=l.a
if(k==null){f=A.bGT()
throw A.d(f)}m.C2(k)
m.of(B.oW)
f=m.y
if(f!=null)f.eE(0,l)
q=l
n=[1]
s=5
break
n.push(6)
s=5
break
case 4:p=3
d=o.pop()
f=A.ac(d)
if(f instanceof A.qi){j=f
i=A.b3(d)
if(!(j instanceof A.E_)){m.ch.bF(B.d9,"Removing session",null,null)
m.c=null
m.of(B.mY)}else m.Ex(j,i)
f=m.y
if(f!=null)f.kC(j)
throw d}else{h=f
g=A.b3(d)
f=m.y
if(f!=null)f.kC(h)
m.Ex(h,g)
throw d}n.push(6)
s=5
break
case 3:n=[2]
case 5:p=2
m.y=null
s=n.pop()
break
case 6:case 1:return A.y(q,r)
case 2:return A.x(o.at(-1),r)}})
return A.z($async$wJ,r)},
ah4(a,b,c){var s,r,q,p,o=this
if(c==null)c=o.c
if(b&&a!==B.mX){s=o.CW
if(s!=null){s=s.c
r=c==null?null:c.b4()
q=t.z
s.$1(A.u(["event",a.c,"session",r],q,q))}}p=new A.hh(a,c,!b)
o.ch.bF(B.dF,"onAuthStateChange: "+p.l(0),null,null)
o.as.B(0,p)
o.at.B(0,p)},
of(a){return this.ah4(a,!0,null)},
Ex(a,b){var s
this.ch.bF(B.ht,"Notifying exception",a,b)
s=b==null?A.rs():b
this.as.fZ(a,s)
return a},
XA(a){return this.Ex(a,null)}}
