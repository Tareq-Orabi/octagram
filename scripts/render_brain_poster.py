"""Render the shipped reference brain geometry into transparent no-WebGL posters.
Python 3 + Pillow. Uses the same original positions/mesh/colors and remap as the renderer.
"""
from pathlib import Path
import array, struct, math, colorsys, base64
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
b=(ROOT/'public/assets/models/brain-reference.bin').read_bytes()
magic,version,n,nv,ni,*_=struct.unpack_from('<8I',b)
def floats(off,count):
 a=array.array('f');a.frombytes(b[off:off+count*4]);return a
pos=floats(32,n*3); scales=floats(32+n*12,n); rgb=floats(32+n*16,n*3); verts=floats(32+n*28,nv*3)
inds=struct.unpack_from('<'+str(ni)+'H',b,32+n*28+nv*12)
def col(s):return tuple(int(s[i:i+2],16)/255 for i in (1,3,5))
coral,peach,orange,lime,mint,teal,pale=map(col,['#f5746f','#f9b096','#f38c31','#f4e96c','#9ac6b4','#3f8f91','#fff2d5'])
def mix(a,b,t):return tuple(x+(y-x)*max(0,min(1,t)) for x,y in zip(a,b))
def linear(x):return x/12.92 if x<.04045 else ((x+.055)/1.055)**2.4
def srgb(x):return x*12.92 if x<.0031308 else 1.055*x**(1/2.4)-.055
palette=[tuple(map(linear,c)) for c in [coral,peach,orange,lime,mint,teal,pale]]
coral,peach,orange,lime,mint,teal,pale=palette
def color(i):
 h,s,v=colorsys.rgb_to_hsv(*rgb[i*3:i*3+3])
 if s<.17:c=mix(mint if i%3==0 else peach,pale,.48)
 elif h<.08:c=mix(coral,orange,h/.08)
 elif h<.21:c=mix(orange,lime,(h-.08)/.13)
 elif h<.40:c=mix(lime,mint,(h-.21)/.19)
 elif h<.72:c=mix(mint,teal,(h-.40)/.16)
 else:c=mix(coral,peach,min(1,(h-.72)/.28)*.45)
 c=tuple(x*(.34+v**.78*1.12)*1.12 for x in c)
 return tuple(round(max(0,min(1,srgb(x)))*255) for x in c)
def smooth(a,b,x):
 t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
# Perspective is identical to the website's camera, then the portrait is fitted to the poster.
points=[]
for i in range(n):
 x,y,z=pos[i*3:i*3+3];points.append((x/(10-z),-y/(10-z)))
minx,miny=min(p[0] for p in points),min(p[1] for p in points)
maxx,maxy=max(p[0] for p in points),max(p[1] for p in points)
W,H=1080,1020;scale=min((W-50)/(maxx-minx),(H-50)/(maxy-miny))
cx,cy=(maxx+minx)/2,(maxy+miny)/2
particles=[]
for i in range(n):
 x,y,z=pos[i*3:i*3+3]
 angle=math.sin(x*.619+y*.41-z*.27)+.55
 sn,cs=math.sin(angle),math.cos(angle);r=1/math.sqrt(2);size=.155*scales[i]
 screen=[]
 for j in range(nv):
  a,b,c=verts[j*3:j*3+3];dot=(b+c)*r
  xx=x+(a*cs+(r*c-r*b)*sn)*size
  yy=y+(b*cs+r*a*sn+r*dot*(1-cs))*size
  zz=z+(c*cs-r*a*sn+r*dot*(1-cs))*size
  screen.append(((xx/(10-zz)-cx)*scale+W/2,(-yy/(10-zz)-cy)*scale+H/2))
 particles.append((z,i,screen))
# Back-to-front compositing preserves the translucent view-depth attenuation.
particles.sort()
image=Image.new('RGBA',(W,H))
for z,i,screen in particles:
 x0=max(0,math.floor(min(p[0] for p in screen)));y0=max(0,math.floor(min(p[1] for p in screen)))
 x1=min(W,math.ceil(max(p[0] for p in screen)));y1=min(H,math.ceil(max(p[1] for p in screen)))
 if x1<=x0 or y1<=y0:continue
 stamp=Image.new('RGBA',(x1-x0+1,y1-y0+1));draw=ImageDraw.Draw(stamp)
 fill=(*color(i),round(255*smooth(-4.5,4,z)))
 for j in range(0,ni,3):
  a,b,c=[screen[inds[j+k]] for k in range(3)]
  # Screen-space winding is flipped by +Y-up projection.
  if (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])>=0:continue
  draw.polygon([(p[0]-x0,p[1]-y0) for p in (a,b,c)],fill=fill)
 image.alpha_composite(stamp,(x0,y0))
output=ROOT/f'public/assets/brain-fallback.webp'
image.save(output,'WEBP',quality=92,method=6)
payload=base64.b64encode(output.read_bytes()).decode()
(ROOT/f'public/assets/brain-fallback.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}"><title>Original reference brain recolored in Octagram colors</title><image width="{W}" height="{H}" href="data:image/webp;base64,{payload}"/></svg>')
preview=Image.new('RGBA',(W,H),'#09090a');preview.alpha_composite(image);preview.convert('RGB').save(ROOT/f'assets/source/brain/poster-check.jpg',quality=92)
print(output,output.stat().st_size)
