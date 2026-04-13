A.wf.prototype={
yT(a,b){return this.b0l(a,b)},
b0k(){return this.yT(null,!1)},
b0l(a0,a1){var s=0,r=A.A(t.uN),q,p=2,o=[],n=this,m,l,k,j,i,h,g,f,e,d,c,b,a
var $async$yT=A.w(function(a2,a3){if(a2===1){o.push(a3)
s=p}for(;;)switch(s){case 0:p=4
s=7
return A.n(n.a.Li(a0,a1),$async$yT)
case 7:m=a3
l=J.cq(m,new A.au_(),t.mr).bL(0)
q=l
s=1
break
p=2
s=6
break
case 4:p=3
a=o.pop()
l=new A.az(Date.now(),0,!1).wG(-1728e8)
j=t.N
i=t.S
h=t.K
g=t.nf
f=t.m0
e=t.z
l=A.Ex("SystemMaster",u.H,null,A.u(["components",A.u(["users",A.u(["id","users","type","client","position",A.u(["x",5000,"y",4800],j,i),"capacity",A.u(["instances",1,"maxRPSPerInstance",1000],j,i)],j,h),"lb",A.u(["id","lb","type","load_balancer","position",A.u(["x",5250,"y",4800],j,i),"properties",A.u(["algorithm","round_robin"],j,j)],j,h),"api_server",A.u(["id","api_server","type","appServer","position",A.u(["x",5500,"y",4800],j,i),"capacity",A.u(["instances",2,"maxRPSPerInstance",500],j,i)],j,h),"feed_cache",A.u(["id","feed_cache","type","cache","position",A.u(["x",5750,"y",4700],j,i),"properties",A.u(["engine","Redis"],j,j)],j,h),"main_db",A.u(["id","main_db","type","database","position",A.u(["x",5750,"y",4900],j,i),"properties",A.u(["engine","PostgreSQL"],j,j)],j,h)],j,g),"connections",A.a([A.u(["from","users","to","lb","protocol","HTTPS"],j,j),A.u(["from","lb","to","api_server","protocol","HTTPS"],j,j),A.u(["from","api_server","to","feed_cache","protocol","TCP"],j,j),A.u(["from","api_server","to","main_db","protocol","TCP"],j,j)],f),"viewState",A.u(["panOffset",A.u(["x",-5100,"y",-4850],j,i),"scale",0.9],j,h)],j,e),"Social Media",B.q8,4,l,u.H,0.92,"feat_1",null,"approved","Scalable Social Feed",156,"featured")
d=new A.az(Date.now(),0,!1).wG(-432e9)
d=A.Ex("CloudArchitect",u.s3,null,A.u(["components",A.u(["customers",A.u(["id","customers","type","client","position",A.u(["x",5000,"y",5000],j,i)],j,h),"cdn",A.u(["id","cdn","type","cdn","position",A.u(["x",5250,"y",5000],j,i)],j,h),"gateway",A.u(["id","gateway","type","apiGateway","position",A.u(["x",5500,"y",5000],j,i)],j,h),"orders_db",A.u(["id","orders_db","type","database","position",A.u(["x",5750,"y",5000],j,i),"properties",A.u(["replication","primary-replica"],j,j)],j,h)],j,g),"connections",A.a([A.u(["from","customers","to","cdn","protocol","HTTPS"],j,j),A.u(["from","cdn","to","gateway","protocol","HTTPS"],j,j),A.u(["from","gateway","to","orders_db","protocol","TCP"],j,j)],f),"viewState",A.u(["panOffset",A.u(["x",-5200,"y",-5000],j,i),"scale",0.8],j,h)],j,e),"E-Commerce",B.q8,3,d,u.s3,0.95,"feat_2",null,"approved","High-Availability E-Commerce",89,"featured")
c=new A.az(Date.now(),0,!1).wG(-864e8)
c=A.Ex("UberEngineer",u.aC,null,A.u(["components",A.u(["users",A.u(["id","users","type","client","position",A.u(["x",5000,"y",4800],j,i)],j,h),"dns",A.u(["id","dns","type","dns","position",A.u(["x",5200,"y",4800],j,i)],j,h),"lb",A.u(["id","lb","type","load_balancer","position",A.u(["x",5400,"y",4800],j,i)],j,h),"gateway",A.u(["id","gateway","type","apiGateway","position",A.u(["x",5600,"y",4800],j,i)],j,h),"auth_svc",A.u(["id","auth_svc","type","appServer","position",A.u(["x",5800,"y",4650],j,i),"name","Auth Service"],j,h),"user_svc",A.u(["id","user_svc","type","appServer","position",A.u(["x",5800,"y",4800],j,i),"name","User Service"],j,h),"order_svc",A.u(["id","order_svc","type","appServer","position",A.u(["x",5800,"y",4950],j,i),"name","Order Service"],j,h),"auth_db",A.u(["id","auth_db","type","database","position",A.u(["x",6000,"y",4650],j,i)],j,h),"user_db",A.u(["id","user_db","type","database","position",A.u(["x",6000,"y",4800],j,i)],j,h),"order_db",A.u(["id","order_db","type","database","position",A.u(["x",6000,"y",4950],j,i)],j,h)],j,g),"connections",A.a([A.u(["from","users","to","dns","protocol","UDP"],j,j),A.u(["from","users","to","lb","protocol","HTTPS"],j,j),A.u(["from","lb","to","gateway","protocol","HTTPS"],j,j),A.u(["from","gateway","to","auth_svc","protocol","gRPC"],j,j),A.u(["from","gateway","to","user_svc","protocol","gRPC"],j,j),A.u(["from","gateway","to","order_svc","protocol","gRPC"],j,j),A.u(["from","auth_svc","to","auth_db","protocol","TCP"],j,j),A.u(["from","user_svc","to","user_db","protocol","TCP"],j,j),A.u(["from","order_svc","to","order_db","protocol","TCP"],j,j)],f),"viewState",A.u(["panOffset",A.u(["x",-5300,"y",-4800],j,i),"scale",0.8],j,h)],j,e),"Backend",B.q8,5,c,u.aC,0.88,"feat_3",null,"approved","Global Microservices",212,"featured")
b=new A.az(Date.now(),0,!1).wG(-2592e8)
b=A.a([l,d,c,A.Ex("DataWizard",u.e0,null,A.u(["components",A.u(["iot_devices",A.u(["id","iot_devices","type","client","position",A.u(["x",5000,"y",4800],j,i),"name","IoT Devices"],j,h),"ingest",A.u(["id","ingest","type","apiGateway","position",A.u(["x",5200,"y",4800],j,i),"name","Ingestion Layer"],j,h),"stream",A.u(["id","stream","type","stream","position",A.u(["x",5400,"y",4800],j,i),"name","Kafka Stream"],j,h),"worker",A.u(["id","worker","type","worker","position",A.u(["x",5600,"y",4800],j,i),"name","Flink Processor"],j,h),"store",A.u(["id","store","type","objectStore","position",A.u(["x",5800,"y",4720],j,i),"name","Data Lake"],j,h),"analytics_db",A.u(["id","analytics_db","type","database","position",A.u(["x",5800,"y",4880],j,i),"name","ClickHouse"],j,h)],j,g),"connections",A.a([A.u(["from","iot_devices","to","ingest","protocol","MQTT"],j,j),A.u(["from","ingest","to","stream","protocol","TCP"],j,j),A.u(["from","stream","to","worker","protocol","TCP"],j,j),A.u(["from","worker","to","store","protocol","HTTPS"],j,j),A.u(["from","worker","to","analytics_db","protocol","TCP"],j,j)],f),"viewState",A.u(["panOffset",A.u(["x",-5300,"y",-4800],j,i),"scale",0.85],j,h)],j,e),"Data Engineering",B.q8,4,b,u.e0,0.94,"feat_4",null,"approved","Real-time Analytics Pipeline",145,"featured")],t.I_)
q=b
s=1
break
s=6
break
case 3:s=2
break
case 6:case 1:return A.y(q,r)
case 2:return A.x(o.at(-1),r)}})
return A.z($async$yT,r)},
Mm(){var s=0,r=A.A(t.uN),q,p=2,o=[],n=this,m,l,k,j
var $async$Mm=A.w(function(a,b){if(a===1){o.push(b)
s=p}for(;;)switch(s){case 0:p=4
s=7
return A.n(n.a.Lj(),$async$Mm)
case 7:m=b
l=J.cq(m,new A.au0(),t.mr).bL(0)
q=l
s=1
break
p=2
s=6
break
case 4:p=3
j=o.pop()
l=A.a([],t.I_)
q=l
s=1
break
s=6
break
case 3:s=2
break
case 6:case 1:return A.y(q,r)
case 2:return A.x(o.at(-1),r)}})
return A.z($async$Mm,r)},
YV(a){return this.b59(a)},
b59(a){var s=0,r=A.A(t.H)
var $async$YV=A.w(function(b,c){if(b===1)return A.x(c,r)
for(;;)switch(s){case 0:return A.y(null,r)}})
return A.z($async$YV,r)},
JD(a,b){return this.aRc(a,b)},
aRc(a,b){var s=0,r=A.A(t.H),q=this
var $async$JD=A.w(function(c,d){if(c===1)return A.x(d,r)
for(;;)switch(s){case 0:s=2
return A.n(q.a.JE(b.c,a,b.d),$async$JD)
case 2:return A.y(null,r)}})
return A.z($async$JD,r)},
pA(a){return this.aXX(a)},
aXX(a){var s=0,r=A.A(t.bc),q,p=this,o
var $async$pA=A.w(function(b,c){if(b===1)return A.x(c,r)
for(;;)switch(s){case 0:o=J
s=3
return A.n(p.a.pA(a),$async$pA)
case 3:q=o.cq(c,new A.atZ(),t.Ao).bL(0)
s=1
break
case 1:return A.y(q,r)}})
return A.z($async$pA,r)}}
