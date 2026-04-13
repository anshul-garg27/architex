A.bu.prototype={
bC(a){var s=a.a,r=this.a,q=s[15]
r.$flags&2&&A.aR(r)
r[15]=q
r[14]=s[14]
r[13]=s[13]
r[12]=s[12]
r[11]=s[11]
r[10]=s[10]
r[9]=s[9]
r[8]=s[8]
r[7]=s[7]
r[6]=s[6]
r[5]=s[5]
r[4]=s[4]
r[3]=s[3]
r[2]=s[2]
r[1]=s[1]
r[0]=s[0]},
l(a){var s=this
return"[0] "+s.kY(0).l(0)+"\n[1] "+s.kY(1).l(0)+"\n[2] "+s.kY(2).l(0)+"\n[3] "+s.kY(3).l(0)+"\n"},
h(a,b){return this.a[b]},
j(a,b,c){var s=this.a
s.$flags&2&&A.aR(s)
s[b]=c},
m(a,b){var s,r,q
if(b==null)return!1
if(b instanceof A.bu){s=this.a
r=s[0]
q=b.a
s=r===q[0]&&s[1]===q[1]&&s[2]===q[2]&&s[3]===q[3]&&s[4]===q[4]&&s[5]===q[5]&&s[6]===q[6]&&s[7]===q[7]&&s[8]===q[8]&&s[9]===q[9]&&s[10]===q[10]&&s[11]===q[11]&&s[12]===q[12]&&s[13]===q[13]&&s[14]===q[14]&&s[15]===q[15]}else s=!1
return s},
gI(a){return A.ce(this.a)},
Oz(a,b){var s=b.a,r=this.a,q=s[0]
r.$flags&2&&A.aR(r)
r[a]=q
r[4+a]=s[1]
r[8+a]=s[2]
r[12+a]=s[3]},
kY(a){var s=new Float64Array(4),r=this.a
s[0]=r[a]
s[1]=r[4+a]
s[2]=r[8+a]
s[3]=r[12+a]
return new A.pK(s)},
ao(a,b){var s=new A.bu(new Float64Array(16))
s.bC(this)
s.iB(b,b,b,1)
return s},
a4(a,b){var s,r=new Float64Array(16),q=new A.bu(r)
q.bC(this)
s=b.a
r[0]=r[0]+s[0]
r[1]=r[1]+s[1]
r[2]=r[2]+s[2]
r[3]=r[3]+s[3]
r[4]=r[4]+s[4]
r[5]=r[5]+s[5]
r[6]=r[6]+s[6]
r[7]=r[7]+s[7]
r[8]=r[8]+s[8]
r[9]=r[9]+s[9]
r[10]=r[10]+s[10]
r[11]=r[11]+s[11]
r[12]=r[12]+s[12]
r[13]=r[13]+s[13]
r[14]=r[14]+s[14]
r[15]=r[15]+s[15]
return q},
a6(a,b){var s,r=new Float64Array(16),q=new A.bu(r)
q.bC(this)
s=b.a
r[0]=r[0]-s[0]
r[1]=r[1]-s[1]
r[2]=r[2]-s[2]
r[3]=r[3]-s[3]
r[4]=r[4]-s[4]
r[5]=r[5]-s[5]
r[6]=r[6]-s[6]
r[7]=r[7]-s[7]
r[8]=r[8]-s[8]
r[9]=r[9]-s[9]
r[10]=r[10]-s[10]
r[11]=r[11]-s[11]
r[12]=r[12]-s[12]
r[13]=r[13]-s[13]
r[14]=r[14]-s[14]
r[15]=r[15]-s[15]
return q},
en(a,b,c,d){var s=this.a,r=s[0],q=s[4],p=s[8],o=s[12]
s.$flags&2&&A.aR(s)
s[12]=r*a+q*b+p*c+o*d
s[13]=s[1]*a+s[5]*b+s[9]*c+s[13]*d
s[14]=s[2]*a+s[6]*b+s[10]*c+s[14]*d
s[15]=s[3]*a+s[7]*b+s[11]*c+s[15]*d},
t0(a){var s=Math.cos(a),r=Math.sin(a),q=this.a,p=q[0],o=q[4],n=q[1],m=q[5],l=q[2],k=q[6],j=q[3],i=q[7],h=-r
q.$flags&2&&A.aR(q)
q[0]=p*s+o*r
q[1]=n*s+m*r
q[2]=l*s+k*r
q[3]=j*s+i*r
q[4]=p*h+o*s
q[5]=n*h+m*s
q[6]=l*h+k*s
q[7]=j*h+i*s},
iB(a,b,c,d){var s=this.a,r=s[0]
s.$flags&2&&A.aR(s)
s[0]=r*a
s[1]=s[1]*a
s[2]=s[2]*a
s[3]=s[3]*a
s[4]=s[4]*b
s[5]=s[5]*b
s[6]=s[6]*b
s[7]=s[7]*b
s[8]=s[8]*c
s[9]=s[9]*c
s[10]=s[10]*c
s[11]=s[11]*c
s[12]=s[12]*d
s[13]=s[13]*d
s[14]=s[14]*d
s[15]=s[15]*d},
G1(){var s=this.a
s.$flags&2&&A.aR(s)
s[0]=0
s[1]=0
s[2]=0
s[3]=0
s[4]=0
s[5]=0
s[6]=0
s[7]=0
s[8]=0
s[9]=0
s[10]=0
s[11]=0
s[12]=0
s[13]=0
s[14]=0
s[15]=0},
dh(){var s=this.a
s.$flags&2&&A.aR(s)
s[0]=1
s[1]=0
s[2]=0
s[3]=0
s[4]=0
s[5]=1
s[6]=0
s[7]=0
s[8]=0
s[9]=0
s[10]=1
s[11]=0
s[12]=0
s[13]=0
s[14]=0
s[15]=1},
Vw(){var s=this.a,r=s[0],q=s[5],p=s[1],o=s[4],n=r*q-p*o,m=s[6],l=s[2],k=r*m-l*o,j=s[7],i=s[3],h=r*j-i*o,g=p*m-l*q,f=p*j-i*q,e=l*j-i*m
m=s[8]
i=s[9]
j=s[10]
l=s[11]
return-(i*e-j*f+l*g)*s[12]+(m*e-j*h+l*k)*s[13]-(m*f-i*h+l*n)*s[14]+(m*g-i*k+j*n)*s[15]},
tk(){var s=this.a,r=s[14],q=s[13],p=s[12]
s=new A.dm(new Float64Array(3))
s.fe(p,q,r)
return s},
a_f(a){var s=a.a,r=s[2],q=s[1],p=s[0],o=this.a
o.$flags&2&&A.aR(o)
o[14]=r
o[13]=q
o[12]=p},
jd(a,b,c){var s=this.a
s.$flags&2&&A.aR(s)
s[14]=c
s[13]=b
s[12]=a},
lE(){var s=this.a,r=s[0],q=s[1],p=s[2],o=s[4],n=s[5],m=s[6],l=s[8],k=s[9]
s=s[10]
return Math.sqrt(Math.max(r*r+q*q+p*p,Math.max(o*o+n*n+m*m,l*l+k*k+s*s)))},
iR(b5){var s,r,q,p,o=b5.a,n=o[0],m=o[1],l=o[2],k=o[3],j=o[4],i=o[5],h=o[6],g=o[7],f=o[8],e=o[9],d=o[10],c=o[11],b=o[12],a=o[13],a0=o[14],a1=o[15],a2=n*i-m*j,a3=n*h-l*j,a4=n*g-k*j,a5=m*h-l*i,a6=m*g-k*i,a7=l*g-k*h,a8=f*a-e*b,a9=f*a0-d*b,b0=f*a1-c*b,b1=e*a0-d*a,b2=e*a1-c*a,b3=d*a1-c*a0,b4=a2*b3-a3*b2+a4*b1+a5*b0-a6*a9+a7*a8
if(b4===0){this.bC(b5)
return 0}s=1/b4
r=this.a
r.$flags&2&&A.aR(r)
r[0]=(i*b3-h*b2+g*b1)*s
r[1]=(-m*b3+l*b2-k*b1)*s
r[2]=(a*a7-a0*a6+a1*a5)*s
r[3]=(-e*a7+d*a6-c*a5)*s
q=-j
r[4]=(q*b3+h*b0-g*a9)*s
r[5]=(n*b3-l*b0+k*a9)*s
p=-b
r[6]=(p*a7+a0*a4-a1*a3)*s
r[7]=(f*a7-d*a4+c*a3)*s
r[8]=(j*b2-i*b0+g*a8)*s
r[9]=(-n*b2+m*b0-k*a8)*s
r[10]=(b*a6-a*a4+a1*a2)*s
r[11]=(-f*a6+e*a4-c*a2)*s
r[12]=(q*b1+i*a9-h*a8)*s
r[13]=(n*b1-m*a9+l*a8)*s
r[14]=(p*a5+a*a3-a0*a2)*s
r[15]=(f*a5-e*a3+d*a2)*s
return b4},
fn(b5,b6){var s=this.a,r=s[0],q=s[4],p=s[8],o=s[12],n=s[1],m=s[5],l=s[9],k=s[13],j=s[2],i=s[6],h=s[10],g=s[14],f=s[3],e=s[7],d=s[11],c=s[15],b=b6.a,a=b[0],a0=b[4],a1=b[8],a2=b[12],a3=b[1],a4=b[5],a5=b[9],a6=b[13],a7=b[2],a8=b[6],a9=b[10],b0=b[14],b1=b[3],b2=b[7],b3=b[11],b4=b[15]
s.$flags&2&&A.aR(s)
s[0]=r*a+q*a3+p*a7+o*b1
s[4]=r*a0+q*a4+p*a8+o*b2
s[8]=r*a1+q*a5+p*a9+o*b3
s[12]=r*a2+q*a6+p*b0+o*b4
s[1]=n*a+m*a3+l*a7+k*b1
s[5]=n*a0+m*a4+l*a8+k*b2
s[9]=n*a1+m*a5+l*a9+k*b3
s[13]=n*a2+m*a6+l*b0+k*b4
s[2]=j*a+i*a3+h*a7+g*b1
s[6]=j*a0+i*a4+h*a8+g*b2
s[10]=j*a1+i*a5+h*a9+g*b3
s[14]=j*a2+i*a6+h*b0+g*b4
s[3]=f*a+e*a3+d*a7+c*b1
s[7]=f*a0+e*a4+d*a8+c*b2
s[11]=f*a1+e*a5+d*a9+c*b3
s[15]=f*a2+e*a6+d*b0+c*b4},
iv(a){var s=new A.bu(new Float64Array(16))
s.bC(this)
s.fn(0,a)
return s},
adS(a0,a1,a2){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a=$.bJP
if(a==null)a=$.bJP=new A.dm(new Float64Array(3))
s=this.a
a.fe(s[0],s[1],s[2])
r=Math.sqrt(a.gEf())
a.fe(s[4],s[5],s[6])
q=Math.sqrt(a.gEf())
a.fe(s[8],s[9],s[10])
p=Math.sqrt(a.gEf())
if(this.Vw()<0)r=-r
o=a0.a
n=s[12]
o.$flags&2&&A.aR(o)
o[0]=n
o[1]=s[13]
o[2]=s[14]
m=1/r
l=1/q
k=1/p
j=$.bJN
if(j==null)j=$.bJN=new A.bu(new Float64Array(16))
j.bC(this)
s=j.a
o=s[0]
s.$flags&2&&A.aR(s)
s[0]=o*m
s[1]=s[1]*m
s[2]=s[2]*m
s[4]=s[4]*l
s[5]=s[5]*l
s[6]=s[6]*l
s[8]=s[8]*k
s[9]=s[9]*k
s[10]=s[10]*k
i=$.bJO
if(i==null)i=$.bJO=new A.Bb(new Float64Array(9))
h=i.a
o=s[0]
h.$flags&2&&A.aR(h)
h[0]=o
h[1]=s[1]
h[2]=s[2]
h[3]=s[4]
h[4]=s[5]
h[5]=s[6]
h[6]=s[8]
h[7]=s[9]
h[8]=s[10]
s=h[0]
o=h[4]
n=h[8]
g=0+s+o+n
if(g>0){f=Math.sqrt(g+1)
s=a1.a
s.$flags&2&&A.aR(s)
s[3]=f*0.5
f=0.5/f
s[0]=(h[5]-h[7])*f
s[1]=(h[6]-h[2])*f
s[2]=(h[1]-h[3])*f}else{if(s<o)e=o<n?2:1
else e=s<n?2:0
d=(e+1)%3
c=(e+2)%3
s=e*3
o=d*3
n=c*3
f=Math.sqrt(h[s+e]-h[o+d]-h[n+c]+1)
b=a1.a
b.$flags&2&&A.aR(b)
b[e]=f*0.5
f=0.5/f
b[3]=(h[o+c]-h[n+d])*f
b[d]=(h[s+d]+h[o+e])*f
b[c]=(h[s+c]+h[n+e])*f}s=a2.a
s.$flags&2&&A.aR(s)
s[0]=r
s[1]=q
s[2]=p},
oz(a){var s=a.a,r=this.a,q=r[0],p=s[0],o=r[4],n=s[1],m=r[8],l=s[2],k=r[12],j=r[1],i=r[5],h=r[9],g=r[13],f=r[2],e=r[6],d=r[10]
r=r[14]
s.$flags&2&&A.aR(s)
s[0]=q*p+o*n+m*l+k
s[1]=j*p+i*n+h*l+g
s[2]=f*p+e*n+d*l+r
return a},
aq(a2,a3){var s=a3.a,r=this.a,q=r[0],p=s[0],o=r[4],n=s[1],m=r[8],l=s[2],k=r[12],j=s[3],i=r[1],h=r[5],g=r[9],f=r[13],e=r[2],d=r[6],c=r[10],b=r[14],a=r[3],a0=r[7],a1=r[11]
r=r[15]
s.$flags&2&&A.aR(s)
s[0]=q*p+o*n+m*l+k*j
s[1]=i*p+h*n+g*l+f*j
s[2]=e*p+d*n+c*l+b*j
s[3]=a*p+a0*n+a1*l+r*j
return a3},
N1(a){var s=a.a,r=this.a,q=r[0],p=s[0],o=r[4],n=s[1],m=r[8],l=s[2],k=r[12],j=r[1],i=r[5],h=r[9],g=r[13],f=r[2],e=r[6],d=r[10],c=r[14],b=1/(r[3]*p+r[7]*n+r[11]*l+r[15])
s.$flags&2&&A.aR(s)
s[0]=(q*p+o*n+m*l+k)*b
s[1]=(j*p+i*n+h*l+g)*b
s[2]=(f*p+e*n+d*l+c)*b
return a},
agz(){var s=this.a
return s[0]===0&&s[1]===0&&s[2]===0&&s[3]===0&&s[4]===0&&s[5]===0&&s[6]===0&&s[7]===0&&s[8]===0&&s[9]===0&&s[10]===0&&s[11]===0&&s[12]===0&&s[13]===0&&s[14]===0&&s[15]===0}}
