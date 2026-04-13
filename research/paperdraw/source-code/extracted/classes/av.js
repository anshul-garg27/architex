A.av.prototype={
M(){return"ComponentType."+this.b},
gKM(){$label0$0:{if(B.ad===this){var s=A.fz(B.es,t._w)
break $label0$0}if(B.ae===this){s=A.fz(new A.J(B.es,new A.avy(),t.lV),t._w)
break $label0$0}s=B.J
break $label0$0}return s},
geU(){var s,r=this
$label0$0:{if(B.c9===r||B.ae===r||B.dn===r){s=B.ND
break $label0$0}if(B.bp===r||B.bM===r||B.bz===r||B.dk===r||B.f8===r||B.cK===r||B.d7===r||B.fy===r||B.f7===r||B.fA===r||B.fC===r||B.ha===r||B.he===r||B.h8===r||B.eh===r||B.d6===r||B.fz===r){s=B.uo
break $label0$0}if(B.eN===r||B.hc===r){s=B.NE
break $label0$0}s=null
break $label0$0}return s},
gmZ(){var s,r=this
$label0$0:{if(B.bp===r){s=B.aRk
break $label0$0}if(B.bM===r){s=B.aRr
break $label0$0}if(B.bz===r){s=B.aRi
break $label0$0}if(B.c9===r){s=B.aRl
break $label0$0}if(B.ae===r){s=B.aRo
break $label0$0}if(B.dk===r){s=B.aRm
break $label0$0}if(B.eN===r){s=B.aRn
break $label0$0}if(B.f8===r){s=B.aRs
break $label0$0}if(B.cK===r){s=B.aRq
break $label0$0}if(B.dn===r){s=B.aRj
break $label0$0}if(B.d7===r){s=B.aRp
break $label0$0}s=B.S
break $label0$0}return s},
gE8(){var s=this
return s===B.ju||s===B.jv||s===B.jw||s===B.js||s===B.jy||s===B.ca||s===B.ck||s===B.ch||s===B.cn||s===B.cg||s===B.cj||s===B.co||s===B.cl||s===B.aM||s===B.aX||s===B.aR||s===B.bX||s===B.bx||s===B.ad},
aj5(a){var s=this
if(s.gE8()||a.gE8())return null
if(s===B.a6||s===B.cy)if(a===B.ar||a===B.ai||a===B.b9||a===B.aN)return"Load Balancers typically sit before Compute (Servers), not directly connected to Storage or Queues."
if(s===B.bT||s===B.bH)if(a===B.ar)return"Direct access from Edge/Client to Database is a major security risk. Use an API Gateway or App Server."
if(s===B.aJ||s===B.dq)if(a===B.ar||a===B.ai)return"API Gateways should route to Services (App Servers, Serverless), not directly to Data Stores."
if(s===B.bH)if(a===B.ar||a===B.aN)return"CDNs cache static content from Object Stores or Servers. They don't connect to Databases or Queues directly."
if(s===B.aN||s===B.bl||s===B.b7){if(a===B.ar||a===B.b9||a===B.ai)return"Queues typically deliver messages to Consumers (Workers/App Servers) which then write to storage."
if(a===B.aJ||a===B.a6)return"Traffic usually flows *into* Queues from these components,/n or Consumers pull from Queues. Pushing from Queue to LB is unusual."}return null},
gbI(a){var s,r=this
$label0$0:{if(B.bT===r){s=B.p8
break $label0$0}if(B.bH===r){s=B.a2
break $label0$0}if(B.a6===r){s=B.kA
break $label0$0}if(B.aJ===r){s=B.jl
break $label0$0}if(B.dq===r){s=B.jl
break $label0$0}if(B.cy===r){s=B.kA
break $label0$0}if(B.av===r){s=B.m
break $label0$0}if(B.aY===r){s=B.pb
break $label0$0}if(B.bU===r){s=B.a6O
break $label0$0}if(B.bN===r){s=B.m
break $label0$0}if(B.cx===r){s=B.pb
break $label0$0}if(B.cm===r){s=B.m
break $label0$0}if(B.dm===r){s=B.pb
break $label0$0}if(B.bO===r){s=B.pb
break $label0$0}if(B.dp===r){s=B.m
break $label0$0}if(B.eO===r){s=B.pa
break $label0$0}if(B.dl===r){s=B.a2
break $label0$0}if(B.eL===r){s=B.jl
break $label0$0}if(B.iu===r){s=B.Ei
break $label0$0}if(B.hb===r){s=B.h5
break $label0$0}if(B.ir===r){s=B.pb
break $label0$0}if(B.iv===r){s=B.E4
break $label0$0}if(B.it===r){s=B.m
break $label0$0}if(B.kE===r){s=B.a2
break $label0$0}if(B.kF===r){s=B.b3
break $label0$0}if(B.bp===r){s=B.kA
break $label0$0}if(B.bM===r){s=B.pa
break $label0$0}if(B.bz===r){s=B.jl
break $label0$0}if(B.c9===r){s=B.m
break $label0$0}if(B.ae===r){s=B.a5i
break $label0$0}if(B.dk===r){s=B.a72
break $label0$0}if(B.eN===r){s=B.a5M
break $label0$0}if(B.f8===r){s=B.pa
break $label0$0}if(B.cK===r){s=B.a5Z
break $label0$0}if(B.dn===r){s=B.p8
break $label0$0}if(B.d7===r){s=B.a7a
break $label0$0}if(B.fy===r){s=B.lD
break $label0$0}if(B.f7===r){s=B.a2
break $label0$0}if(B.fA===r){s=B.a67
break $label0$0}if(B.fC===r){s=B.b3
break $label0$0}if(B.hc===r){s=B.wP
break $label0$0}if(B.ha===r){s=B.rK
break $label0$0}if(B.he===r){s=B.a6M
break $label0$0}if(B.h8===r){s=B.pe
break $label0$0}if(B.eh===r){s=B.a6T
break $label0$0}if(B.d6===r){s=B.h5
break $label0$0}if(B.fz===r){s=B.H
break $label0$0}if(B.ci===r){s=B.wP
break $label0$0}if(B.fx===r){s=B.a5w
break $label0$0}if(B.ef===r){s=B.a73
break $label0$0}if(B.eg===r){s=B.p8
break $label0$0}if(B.fw===r){s=B.a5R
break $label0$0}if(B.dC===r){s=B.m
break $label0$0}if(B.ai===r){s=B.a_
break $label0$0}if(B.ar===r){s=B.h5
break $label0$0}if(B.b9===r){s=B.rO
break $label0$0}if(B.by===r){s=B.a_
break $label0$0}if(B.bA===r){s=B.h5
break $label0$0}if(B.bW===r){s=B.h5
break $label0$0}if(B.bf===r){s=B.h5
break $label0$0}if(B.aQ===r){s=B.h5
break $label0$0}if(B.bP===r){s=B.h5
break $label0$0}if(B.bu===r){s=B.rO
break $label0$0}if(B.aN===r){s=B.wz
break $label0$0}if(B.bl===r){s=B.Ei
break $label0$0}if(B.b7===r){s=B.E4
break $label0$0}if(B.cL===r){s=B.a5e
break $label0$0}if(B.jt===r){s=B.a6P
break $label0$0}if(B.hN===r){s=B.pe
break $label0$0}if(B.eM===r){s=B.pe
break $label0$0}if(B.kD===r){s=B.pe
break $label0$0}if(B.jz===r){s=B.pe
break $label0$0}if(B.f6===r){s=B.nb
break $label0$0}if(B.fv===r){s=B.nb
break $label0$0}if(B.kG===r){s=B.nb
break $label0$0}if(B.eK===r){s=B.nb
break $label0$0}if(B.is===r){s=B.nb
break $label0$0}if(B.hd===r){s=B.nb
break $label0$0}if(B.jr===r){s=B.mm
break $label0$0}if(B.jx===r){s=B.axO
break $label0$0}if(B.h9===r){s=B.zu
break $label0$0}if(B.bV===r){s=B.h5
break $label0$0}if(B.fB===r){s=B.axN
break $label0$0}if(B.bk===r){s=B.ql
break $label0$0}if(B.kH===r){s=B.zv
break $label0$0}if(B.kC===r){s=B.axP
break $label0$0}if(B.cX===r){s=B.K
break $label0$0}if(B.ju===r){s=B.a2O
break $label0$0}if(B.jv===r){s=B.a6m
break $label0$0}if(B.jw===r){s=B.a62
break $label0$0}if(B.js===r){s=B.a77
break $label0$0}if(B.jy===r){s=B.v
break $label0$0}if(B.ca===r){s=B.ky
break $label0$0}if(B.ck===r){s=B.ky
break $label0$0}if(B.ch===r){s=B.ky
break $label0$0}if(B.cn===r){s=B.ky
break $label0$0}if(B.cg===r){s=B.ky
break $label0$0}if(B.cj===r){s=B.ky
break $label0$0}if(B.co===r){s=B.ky
break $label0$0}if(B.cl===r){s=B.ky
break $label0$0}if(B.bq===r){s=B.C
break $label0$0}if(B.aM===r||B.aX===r||B.aR===r||B.bX===r||B.bx===r||B.ad===r){s=B.zx
break $label0$0}s=null}return s},
gbD(){var s,r=this
$label0$0:{if(B.bT===r||B.bH===r||B.a6===r||B.aJ===r||B.dq===r||B.cy===r){s=B.h7
break $label0$0}if(B.bp===r||B.bM===r||B.bz===r||B.c9===r||B.ae===r||B.dk===r||B.eN===r||B.f8===r||B.cK===r||B.dn===r||B.d7===r||B.fy===r||B.f7===r||B.fA===r||B.fC===r||B.hc===r||B.ha===r||B.he===r||B.h8===r||B.eh===r||B.d6===r||B.fz===r){s=B.cf
break $label0$0}if(B.cX===r||B.dC===r){s=B.nd
break $label0$0}if(B.av===r||B.aY===r||B.bU===r||B.bN===r||B.cx===r||B.cm===r||B.dm===r||B.bO===r||B.dp===r||B.eO===r||B.dl===r||B.eL===r||B.iu===r||B.ir===r||B.iv===r||B.it===r||B.kE===r||B.kF===r){s=B.dj
break $label0$0}if(B.ci===r||B.fx===r||B.ef===r||B.eg===r||B.fw===r){s=B.hM
break $label0$0}if(B.ai===r||B.ar===r||B.b9===r||B.by===r||B.bA===r||B.hb===r||B.bW===r||B.bf===r||B.aQ===r||B.bP===r||B.bu===r){s=B.dR
break $label0$0}if(B.aN===r||B.bl===r||B.b7===r){s=B.fu
break $label0$0}if(B.cL===r||B.jt===r||B.hN===r||B.eM===r){s=B.kB
break $label0$0}if(B.kD===r||B.jz===r){s=B.jo
break $label0$0}if(B.f6===r||B.fv===r||B.kG===r||B.eK===r||B.is===r){s=B.jp
break $label0$0}if(B.hd===r){s=B.dj
break $label0$0}if(B.jr===r||B.jx===r||B.h9===r||B.bV===r||B.fB===r||B.bk===r||B.kH===r||B.kC===r){s=B.ne
break $label0$0}if(B.ju===r||B.jv===r||B.jw===r||B.js===r||B.jy===r||B.ca===r||B.ck===r||B.ch===r||B.cn===r||B.cg===r||B.cj===r||B.co===r||B.cl===r){s=B.h6
break $label0$0}if(B.bq===r||B.aM===r||B.aX===r||B.aR===r||B.bX===r||B.bx===r||B.ad===r){s=B.h6
break $label0$0}s=null}return s},
gGl(){var s,r,q,p,o,n=this
$label0$0:{s=null
r=!1
q=null
p=!1
o=!0
if(B.bT!==n)if(B.bH!==n)if(B.a6!==n)if(B.dq!==n)if(B.cy!==n)if(B.iu!==n)if(B.ir!==n)if(B.it!==n)if(B.kF!==n)if(B.bp!==n)if(B.bM!==n)if(B.bz!==n)if(B.eN!==n)if(B.dn!==n)if(B.fy!==n)if(B.f7!==n)if(B.fA!==n)if(B.fC!==n)if(B.ha!==n)if(B.he!==n)if(B.h8!==n)if(B.fz!==n)if(B.aN!==n)if(B.bl!==n)if(B.b7!==n)if(B.jr!==n)if(B.jx!==n)if(B.h9!==n){r=B.fB!==n
if(r){s=B.bV===n
p=!s
if(p){q=B.bk===n
o=q||B.kH===n||B.kC===n||B.cl===n||B.f6===n||B.fv===n||B.eK===n}}}if(o){o=!1
break $label0$0}o=!0
if(B.aJ!==n)if(B.av!==n)if(B.aY!==n)if(B.bU!==n)if(B.c9!==n)if(B.ae!==n)if(B.dk!==n)if(B.f8!==n)if(B.cK!==n)if(B.d7!==n)if(B.hc!==n)if(B.eh!==n)if(B.d6!==n)if(B.bN!==n)if(B.cx!==n)if(B.cm!==n)if(B.dm!==n)if(B.bO!==n)if(B.dp!==n)if(B.eO!==n)if(B.dl!==n)if(B.eL!==n)if(B.hb!==n)if(B.iv!==n)if(B.kE!==n)if(B.ci!==n)if(B.fx!==n)if(B.ef!==n)if(B.eg!==n)if(B.fw!==n)if(B.cX!==n)if(B.ai!==n)if(B.ar!==n)if(B.b9!==n)if(B.by!==n)if(B.bA!==n)if(B.bW!==n)if(B.bf!==n)if(B.aQ!==n)if(B.bP!==n)if(B.bu!==n)if(!(r?s:B.bV===n))o=(p?q:B.bk===n)||B.cL===n||B.jt===n||B.hN===n||B.eM===n||B.kD===n||B.jz===n||B.kG===n||B.is===n||B.hd===n||B.dC===n||B.ju===n||B.jv===n||B.jw===n||B.js===n||B.jy===n||B.ca===n||B.ck===n||B.ch===n||B.cn===n||B.cg===n||B.cj===n||B.co===n||B.bq===n||B.aX===n||B.aM===n||B.aR===n||B.bX===n||B.bx===n||B.ad===n
if(o){o=!0
break $label0$0}o=null}return o},
gb3_(){var s,r=this
$label0$0:{if(B.a6===r){s=B.alp
break $label0$0}if(B.ar===r){s=B.atH
break $label0$0}if(B.ai===r){s=B.aoh
break $label0$0}if(B.bl===r){s=B.asg
break $label0$0}if(B.aN===r){s=B.aoP
break $label0$0}if(B.b9===r){s=B.alH
break $label0$0}if(B.bH===r){s=B.an4
break $label0$0}if(B.aJ===r){s=B.ajn
break $label0$0}if(B.dq===r){s=B.aqQ
break $label0$0}if(B.cy===r){s=B.anB
break $label0$0}if(B.av===r){s=B.an8
break $label0$0}if(B.aY===r){s=B.alA
break $label0$0}if(B.bU===r){s=B.aiU
break $label0$0}if(B.bN===r){s=B.alf
break $label0$0}if(B.cx===r){s=B.alS
break $label0$0}if(B.cm===r){s=B.aq0
break $label0$0}if(B.dm===r){s=B.aos
break $label0$0}if(B.bO===r){s=B.alF
break $label0$0}if(B.dp===r){s=B.HS
break $label0$0}if(B.eO===r){s=B.alO
break $label0$0}if(B.dl===r){s=B.aiO
break $label0$0}if(B.eL===r){s=B.aou
break $label0$0}if(B.iu===r){s=B.an2
break $label0$0}if(B.hb===r){s=B.ar3
break $label0$0}if(B.ir===r){s=B.alh
break $label0$0}if(B.iv===r){s=B.aoi
break $label0$0}if(B.it===r){s=B.ask
break $label0$0}if(B.kE===r){s=B.as9
break $label0$0}if(B.kF===r){s=B.ap1
break $label0$0}if(B.bp===r){s=B.as1
break $label0$0}if(B.bM===r){s=B.anA
break $label0$0}if(B.bz===r){s=B.aoM
break $label0$0}if(B.c9===r){s=B.asn
break $label0$0}if(B.ae===r){s=B.atk
break $label0$0}if(B.dk===r){s=B.all
break $label0$0}if(B.eN===r){s=B.arR
break $label0$0}if(B.f8===r){s=B.amN
break $label0$0}if(B.cK===r){s=B.asT
break $label0$0}if(B.dn===r){s=B.amD
break $label0$0}if(B.d7===r){s=B.HS
break $label0$0}if(B.fy===r){s=B.apD
break $label0$0}if(B.f7===r){s=B.an0
break $label0$0}if(B.fA===r){s=B.alE
break $label0$0}if(B.fC===r){s=B.atg
break $label0$0}if(B.hc===r){s=B.al0
break $label0$0}if(B.ha===r){s=B.asS
break $label0$0}if(B.he===r){s=B.akN
break $label0$0}if(B.h8===r){s=B.aqN
break $label0$0}if(B.eh===r){s=B.akg
break $label0$0}if(B.d6===r){s=B.arh
break $label0$0}if(B.fz===r){s=B.am_
break $label0$0}if(B.ci===r){s=B.amO
break $label0$0}if(B.fx===r){s=B.aqI
break $label0$0}if(B.ef===r){s=B.aky
break $label0$0}if(B.eg===r){s=B.anb
break $label0$0}if(B.fw===r){s=B.apX
break $label0$0}if(B.bT===r){s=B.asz
break $label0$0}if(B.b7===r){s=B.asP
break $label0$0}if(B.jr===r){s=B.apP
break $label0$0}if(B.jx===r){s=B.akc
break $label0$0}if(B.ca===r){s=B.apv
break $label0$0}if(B.ck===r){s=B.aoo
break $label0$0}if(B.ch===r){s=B.alD
break $label0$0}if(B.cn===r){s=B.alb
break $label0$0}if(B.cg===r){s=B.ami
break $label0$0}if(B.cj===r){s=B.anN
break $label0$0}if(B.co===r){s=B.apA
break $label0$0}if(B.cl===r){s=B.aqK
break $label0$0}if(B.cX===r){s=B.akz
break $label0$0}if(B.by===r){s=B.alU
break $label0$0}if(B.bA===r){s=B.akP
break $label0$0}if(B.bW===r){s=B.asX
break $label0$0}if(B.bf===r){s=B.anZ
break $label0$0}if(B.aQ===r){s=B.arU
break $label0$0}if(B.bP===r){s=B.amj
break $label0$0}if(B.bu===r){s=B.apu
break $label0$0}if(B.cL===r){s=B.aox
break $label0$0}if(B.jt===r){s=B.aj4
break $label0$0}if(B.hN===r){s=B.arW
break $label0$0}if(B.eM===r){s=B.aob
break $label0$0}if(B.kD===r){s=B.amn
break $label0$0}if(B.jz===r){s=B.apK
break $label0$0}if(B.f6===r){s=B.aso
break $label0$0}if(B.fv===r){s=B.aoA
break $label0$0}if(B.kG===r){s=B.asw
break $label0$0}if(B.eK===r){s=B.ats
break $label0$0}if(B.is===r){s=B.aln
break $label0$0}if(B.hd===r){s=B.akQ
break $label0$0}s=B.t
break $label0$0}return s}}
