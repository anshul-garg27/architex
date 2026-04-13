A.pw.prototype={
a3g(){var s,r,q=this,p=q.ax
for(s=q.c;s.p();){r=s.d
r.toString
if(r instanceof A.iB&&!r.r)++q.ax
else if(r instanceof A.jY)--q.ax
q.as=B.mz
q.at=null
if(q.ax<p)return}},
Iv(){return new A.ju(this.aKH(),t.x_)},
aKH(){var s=this
return function(){var r=0,q=2,p=[],o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2,a3,a4,a5,a6,a7,a8,a9,b0,b1
return function $async$Iv(b2,b3,b4){if(b3===1){p.push(b4)
r=q}for(;;)switch(r){case 0:b1=s.ax
o=s.c,n=s.a.a
case 3:if(!o.p()){r=4
break}m=o.d
m.toString
if(m instanceof A.iB){l=s.awr(m.f)
if(!(l.h(0,"display")!=="none"&&l.h(0,"visibility")!=="hidden")){if(!m.r){++s.ax
s.a3g()}r=3
break}s.at=m
k=s.ax===0?n:null
j=l.h(0,"id")
i=A.kM(l.h(0,"opacity"),!1)
h=i==null?null:B.d.t(i,0,1)
g=s.EG(l.h(0,"color"),"color",j)
k=g==null?k:g
f=l.h(0,"x")
e=l.h(0,"y")
d=l.h(0,"dx")
c=l.h(0,"dy")
i=A.N6(f)
b=A.N6(e)
a=A.N6(d)
a0=A.N6(c)
a1=l.h(0,"href")
a2=l.h(0,"color")
a2=(a2==null?null:a2.toLowerCase())==="none"?B.rF:new A.tv(!1,k)
a3=s.aJz(l,h,k,j)
a4=s.aJh(l,h,k,j)
a5=A.bQA(l.h(0,"fill-rule"))
a6=A.bQA(l.h(0,"clip-rule"))
a7=l.h(0,"clip-path")
a8=B.axg.h(0,l.h(0,"mix-blend-mode"))
a9=A.aoe(l.h(0,"transform"))
if(a9==null)a9=B.e0
s.as=new A.HF(l,j,a1,a2,a3,a4,a9,a5,a6,a7,a8,l.h(0,"font-family"),s.b2r(l.h(0,"font-weight")),s.b2q(l.h(0,"font-size")),s.b2x(l.h(0,"text-decoration")),s.b2y(l.h(0,"text-decoration-style")),s.EG(l.h(0,"text-decoration-color"),"text-decoration-color",j),null,null,i,s.b2w(l.h(0,"text-anchor")),b,a,a0);++s.ax
b0=m.r}else b0=!1
r=5
return b2.b=m,1
case 5:if(b0||m instanceof A.jY){--s.ax
s.as=B.mz
s.at=null}if(s.ax<b1){r=1
break}r=3
break
case 4:case 1:return 0
case 2:return b2.c=p.at(-1),3}}}},
a1c(a){var s,r,q,p,o,n=this,m=B.c.N(a)!==""
if(n.as.cy==null){s=n.ay
s=(s==null?null:s.gXg(0))==="tspan"&&m}else s=!1
r=s||n.ch
n.ch=m&&B.c.eq(a,$.bFY(),a.length-1)
s=A.aX(a,"\n","")
s=B.c.N(A.aX(s,"\t"," "))
q=$.bSG()
a=A.aX(s,q," ")
if(a.length===0)return
s=n.r.gY(0)
q=r?" "+a:a
p=n.f
o=p.gtg()
s.b.TW(A.bLC(q,n.as),p.gwd(),o,o)},
aJA(){var s,r,q,p,o,n=this
for(s=n.Iv(),s=new A.hW(s.a(),s.$ti.i("hW<1>")),r=n.r;s.p();){q=s.b
if(q instanceof A.iB){if(n.amr(q))continue
p=B.awG.h(0,q.e)
if(p==null){if(!q.r)n.a3g()}else p.$2(n,!1)}else if(q instanceof A.jY)n.aXp(0,q)
else{if(!r.ga3(0))o=r.gY(0).a==="text"||r.gY(0).a==="tspan"
else o=!1
if(o)if(q instanceof A.o5)n.a1c(q.e)
else if(q instanceof A.yf)n.a1c(q.gA(0))}}if(n.Q==null)throw A.d(A.a6("Invalid SVG data"))},
eD(a,b){var s=this.as.a.h(0,a)
return s==null?b:s},
hn(a){return this.eD(a,null)},
K7(a){var s="url(#"+A.m(this.as.b)+")"
if(s!=="url(#)"){this.f.aRh(s,a)
return!0}return!1},
xK(a,b){this.r.ib(0,new A.XW(a.e,b))
this.K7(b)},
aRs(a){var s,r,q,p,o,n=this,m=B.Nf.h(0,a.e)
if(m==null)return!1
s=n.r.gY(0)
r=m.$1(n)
if(r==null)return!1
q=A.bKf(r,n.as)
n.K7(q)
p=n.f
o=p.gtg()
s.b.Cu(q,n.as.y,p.gwd(),n.hn("mask"),o,p.FB(n),o)
return!0},
amr(a){if(a.e==="defs")if(!a.r){this.xK(a,A.Bq(this.as,null,null))
return!0}return this.aRs(a)},
aXp(a,b){var s=this.r,r=b.e
for(;;){if(r===s.gY(0).a)s.gY(0)
if(!!1)break
s.hc(0)}if(r===s.gY(0).a)s.hc(0)
this.ay=b
if(r==="text")this.ch=!1},
b2q(a){var s
if(a==null||a==="")return null
s=A.hC(a,this.a,!0)
if(s!=null)return s
a=B.c.N(a.toLowerCase())
s=$.c2N.h(0,a)
if(s!=null)return s
throw A.d(A.a6("Could not parse font-size: "+a))},
b2x(a){if(a==null)return null
switch(a){case"none":return B.Uy
case"underline":return B.aHB
case"overline":return B.aHC
case"line-through":return B.aHD}throw A.d(A.aD('Attribute value for text-decoration="'+a+'" is not supported'))},
b2y(a){if(a==null)return null
switch(a){case"solid":return B.Uw
case"dashed":return B.aHx
case"dotted":return B.aHv
case"double":return B.aHu
case"wavy":return B.aHz}throw A.d(A.aD('Attribute value for text-decoration-style="'+a+'" is not supported'))},
b2w(a){switch(a){case"end":return 1
case"middle":return 0.5
case"start":return 0
case"inherit":default:return null}},
a7r(a){var s
if(a==="100%"||a==="")return 1/0
s=A.hC(a,this.a,!0)
return s==null?1/0:s},
a7u(){var s,r,q,p,o,n,m,l=this,k=l.hn("viewBox")
if(k==null)k=""
s=l.hn("width")
if(s==null)s=""
r=l.hn("height")
if(r==null)r=""
q=k===""
if(q&&s===""&&r==="")throw A.d(A.a6("SVG did not specify dimensions\n\nThe SVG library looks for a `viewBox` or `width` and `height` attribute to determine the viewport boundary of the SVG.  Note that these attributes, as with all SVG attributes, are case sensitive.\nDuring processing, the following attributes were found:\n  "+l.as.a.l(0)))
if(q)return new A.alB(l.a7r(s),l.a7r(r),B.e0)
p=B.c.jN(k,A.ad("[ ,]+",!0,!1,!1))
if(p.length<4)throw A.d(A.a6("viewBox element must be 4 elements long"))
q=A.kM(p[2],!1)
q.toString
o=A.kM(p[3],!1)
o.toString
n=A.kM(p[0],!1)
n.toString
m=A.kM(p[1],!1)
m.toString
return new A.alB(q,o,B.e0.Fb(-n,-m))},
ahA(){switch(this.hn("spreadMethod")){case"pad":return B.Bf
case"repeat":return B.aR4
case"reflect":return B.aR5}return null},
ahx(){switch(this.hn("gradientUnits")){case"userSpaceOnUse":return B.acx
case"objectBoundingBox":return B.yd}return null},
aJ5(a,b){switch(a){case"butt":return B.aGT
case"round":return B.aGU
case"square":return B.aGV
default:return null}},
aJs(a,b){switch(a){case"miter":return B.aGW
case"bevel":return B.aGY
case"round":return B.aGX
default:return null}},
aJ9(a){var s,r,q,p,o,n,m
if(a==null||a==="")return null
else if(a==="none")return B.u3
s=B.c.jN(a,A.ad("[ ,]+",!0,!1,!1))
r=A.a([],t.n)
for(q=s.length,p=this.a,o=!1,n=0;n<s.length;s.length===q||(0,A.o)(s),++n){m=A.hC(s[n],p,!1)
m.toString
if(m!==0)o=!0
r.push(m)}if(r.length===0||!o)return null
return r},
aRN(a,b){var s=A.aoe(this.hn("transform"))
if(s!=null)return a.bZ(s)
else return a},
b2r(a){if(a==null)return null
switch(a){case"normal":return B.y9
case"bold":return B.FZ
case"100":return B.ac3
case"200":return B.ac4
case"300":return B.ac5
case"400":return B.y9
case"500":return B.ac6
case"600":return B.ac7
case"700":return B.FZ
case"800":return B.ac8
case"900":return B.ac9}throw A.d(A.a6('Invalid "font-weight": '+a))},
EG(a,b,c){var s,r=this,q=r.aJ6(a,null)
if(q==null||r.b==null)return q
s=r.b
if(s==null)s=t.AS.a(s)
return new A.aE(s.a.b5D(c,r.at.gXg(0),b,A.cs(q.a)).E())},
aJ6(a,b){var s,r,q,p,o,n,m,l,k,j,i,h,g
if(a==null||a.length===0)return null
if(a==="none")return null
if(a.toLowerCase()==="currentcolor")return this.a.a
if(a[0]==="#"){if(a.length===4){s=a[1]
r=a[2]
q=a[3]
a="#"+s+s+r+r+q+q}p=a.length
if(p===7||p===9){o=A.dN(B.c.a_(a,1,7),16)
return new A.aE((o|(p===9?A.dN(B.c.a_(a,7,9),16):255)<<24)>>>0)}}if(B.c.aT(a.toLowerCase(),"rgb")){n=A.ce5(a)
if(n==null)A.a3(A.h5(a,"colorString","Invalid CSS rgb/rgba color syntax"))
p=n.a
s=A.bsN(p[3],!1)
r=A.bsN(p[2],!1)
q=A.bsN(p[1],!1)
return A.bHB(A.bsN(p[0],!0),s,r,q)}if(B.c.aT(a.toLowerCase(),"hsl")){p=t.OL
m=A.r(new A.q(A.a(B.c.a_(a,B.c.eH(a,"(")+1,B.c.eH(a,")")).split(","),t.s),new A.aUY(),p),p.i("a2.E"))
l=B.d.bl(m[0]/360,1)
p=m[1]
k=m[2]/100
j=m.length>3?m[3]:255
i=A.a([0,0,0],t.n)
if(l<0.16666666666666666){i[0]=1
i[1]=l*6}else if(l<0.3333333333333333){i[0]=2-l*6
i[1]=1}else if(l<0.5){i[1]=1
i[2]=l*6-2}else if(l<0.6666666666666666){i[1]=4-l*6
i[2]=1}else{h=l*6
if(l<0.8333333333333334){i[0]=h-4
i[2]=1}else{i[0]=1
i[2]=6-h}}h=t.bK
i=A.r(new A.q(i,new A.aUZ(p/100),h),h.i("a2.E"))
p=A.v(i).i("q<1,F>")
if(k<0.5)i=A.r(new A.q(i,new A.aV_(k),p),p.i("a2.E"))
else i=A.r(new A.q(i,new A.aV0(k),p),p.i("a2.E"))
p=A.v(i).i("q<1,F>")
i=A.r(new A.q(i,new A.aV1(),p),p.i("a2.E"))
return A.bHB(j,B.d.P(i[0]),B.d.P(i[1]),B.d.P(i[2]))}g=B.awH.h(0,a)
if(g!=null)return g
return null},
awr(a){var s,r,q,p,o,n,m,l,k=t.N,j=A.j(k,k)
for(k=J.ar(a);k.p();){s=k.gH(k)
r=B.c.N(s.b)
s=s.a
q=B.c.eH(s,":")
p=q>0
if((p?B.c.bg(s,q+1):s)==="style")for(s=r.split(";"),p=s.length,o=0;o<p;++o){n=s[o]
if(n.length===0)continue
m=n.split(":")
l=B.c.N(m[1])
if(l==="inherit")continue
j.j(0,B.c.N(m[0]),l)}else if(r!=="inherit")j.j(0,p?B.c.bg(s,q+1):s,r)}return j},
aJz(a,a0,a1,a2){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e=this,d=null,c=a.h(0,"stroke"),b=a.h(0,"stroke-opacity")
if(b!=null){s=A.kM(b,!1)
s.toString
r=B.d.t(s,0,1)}else r=d
if(a0!=null)r=r==null?a0:r*a0
q=a.h(0,"stroke-linecap")
p=a.h(0,"stroke-linejoin")
o=a.h(0,"stroke-miterlimit")
n=a.h(0,"stroke-width")
m=a.h(0,"stroke-dasharray")
l=a.h(0,"stroke-dashoffset")
s=c==null
k=s?q:c
if(k==null)k=p
if(k==null)k=o
if(k==null)k=n
j=k==null?m:k
if((j==null?l:j)==null)return d
s=s?d:B.c.aT(c,"url")
if(s===!0){i=e.z.k(0,c)?!0:d
h=c
g=B.ww}else{g=e.EG(c,"stroke",a2)
i=d
h=i}s=c==="none"?B.rF:new A.tv(!1,g)
k=e.aJ5(q,d)
f=e.a
return new A.S0(e.f,s,h,e.aJs(p,d),k,A.kM(o,!1),A.hC(n,f,!0),e.aJ9(m),A.hC(l,f,!1),i,r)},
aJh(a,b,c,d){var s,r,q,p,o,n=this,m=null,l=a.h(0,"fill")
if(l==null)l=""
s=a.h(0,"fill-opacity")
if(s!=null){r=A.kM(s,!1)
r.toString
q=B.d.t(r,0,1)}else q=m
if(b!=null)q=q==null?b:q*b
if(B.c.aT(l,"url")){p=n.z.k(0,l)?!0:m
return new A.HG(n.f,B.a2H,q,l,p)}o=n.EG(l,"fill",d)
r=o==null?m:o.a>>>24
if((r==null?255:r)!==255){r=o.a
q=(r>>>24)/255
o=A.Mh(r>>>16&255,r>>>8&255,r&255,1)}r=l==="none"?B.rF:new A.tv(!1,o)
return new A.HG(n.f,r,q,m,m)}}
