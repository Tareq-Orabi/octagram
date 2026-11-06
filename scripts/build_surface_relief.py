"""Blender source for the interactive card's lit, machined surface."""
import bpy, math
from pathlib import Path
root=Path(__file__).resolve().parents[1]
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=512;scene.render.resolution_y=512;scene.render.resolution_percentage=100
scene.world.color=(.035,.035,.035)
verts=[];faces=[];n=100
for j in range(n+1):
 for i in range(n+1):
  x=i/n*6-3;y=j/n*6-3
  z=.12*math.sin(x*8+y*2)+.055*math.cos(y*12)+.08*math.sin(math.hypot(x,y)*8)
  verts.append((x,y,z))
for j in range(n):
 for i in range(n):
  a=j*(n+1)+i;faces.append((a,a+1,a+n+2,a+n+1))
mesh=bpy.data.meshes.new('Machined wave relief');mesh.from_pydata(verts,[],faces);mesh.update()
obj=bpy.data.objects.new('Octagram interactive relief',mesh);scene.collection.objects.link(obj)
for p in mesh.polygons:p.use_smooth=True
mat=bpy.data.materials.new('Octagram satin alloy');mat.use_nodes=True
p=mat.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(.13,.18,.16,1);p.inputs['Metallic'].default_value=.75;p.inputs['Roughness'].default_value=.35
obj.data.materials.append(mat)
for loc,col,power,size in [((-3,1,3),(1,.49,.23),650,4),((3,-2,2),(.22,.7,.6),500,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc);l=bpy.context.object;l.data.energy=power;l.data.color=col;l.data.shape='DISK';l.data.size=size
bpy.ops.object.camera_add(location=(0,0,9));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=5.9;scene.camera=cam
scene.render.image_settings.file_format='PNG';scene.render.filepath=str(root/'public/assets/surface-relief.png')
(root/'assets/source').mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(root/'assets/source/surface-relief.blend'))
bpy.ops.render.render(write_still=True)
