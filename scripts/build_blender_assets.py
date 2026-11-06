"""Rebuild the exact Octagram brand asset with Blender 3.6+.

Run: blender --background --factory-startup --python scripts/build_blender_assets.py
Optional arguments after --: --project /path/to/octagram --render-preview

Input paths and 101-stop gradients were extracted from the owner's PDF. Curves
remain cubic Beziers until mesh conversion; the center is empty geometry.
Outputs: public/assets/models/octagram.glb and assets/source/octagram.blend.
The web asset has eight named parent modules and twelve individually beveled
meshes, so the original modules can separate and reassemble at runtime.
"""
from __future__ import annotations
import argparse
import bisect
import json
import math
import re
import struct
import sys
import zlib
from pathlib import Path
import bpy
from mathutils import Vector

parser=argparse.ArgumentParser()
parser.add_argument('--project',type=Path,default=Path(__file__).resolve().parents[1])
parser.add_argument('--render-preview',action='store_true')
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
project=args.project.resolve()
source=project/'assets/source';models=project/'public/assets/models'
source.mkdir(parents=True,exist_ok=True);models.mkdir(parents=True,exist_ok=True)
textures=source/'textures';textures.mkdir(exist_ok=True)
data=json.loads((project/'scripts/brand-source.json').read_text())
modules=data['modules'];gradients=data['gradients']
assert len(modules)==8 and sum(len(m['paths']) for m in modules)==12
scale=3.5/(max(m['bounds'][2] for m in modules)-min(m['bounds'][0] for m in modules))


def parse_path(path: str):
    """Canonical source contains absolute M/L/C/Z only; reject other commands."""
    tokens=re.findall(r'[A-Za-z]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?',path)
    segments=[];i=0;current=None;first=None
    while i<len(tokens):
        command=tokens[i];i+=1
        if command=='M':
            current=(float(tokens[i]),float(tokens[i+1]));first=current;i+=2
        elif command=='L':
            end=(float(tokens[i]),float(tokens[i+1]));i+=2
            if math.dist(current,end)>1e-7:segments.append((current,None,None,end))
            current=end
        elif command=='C':
            numbers=list(map(float,tokens[i:i+6]));i+=6
            c1,c2,end=tuple(numbers[:2]),tuple(numbers[2:4]),tuple(numbers[4:])
            segments.append((current,c1,c2,end));current=end
        elif command=='Z':
            if math.dist(current,first)>1e-7:segments.append((current,None,None,first))
            current=first
        else:raise ValueError(f'Unsupported SVG command: {command}')
    assert segments and math.dist(segments[-1][3],segments[0][0])<1e-6
    return segments


def png_rgb(path: Path,width:int,height:int,pixels:bytes):
    def chunk(kind,payload):return struct.pack('>I',len(payload))+kind+payload+struct.pack('>I',zlib.crc32(kind+payload)&0xffffffff)
    rows=b''.join(b'\0'+pixels[row*width*3:(row+1)*width*3] for row in range(height))
    path.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',width,height,8,2,0,0,0))+chunk(b'sRGB',b'\0')+chunk(b'IDAT',zlib.compress(rows,9))+chunk(b'IEND',b''))


def gradient_texture(path_record,name):
    definition=gradients[path_record['gradientId']]
    # Extra margin covers every bevel vertex without UV clamping at path edges.
    bounds=[path_record['bounds'][0]-2,path_record['bounds'][1]-2,path_record['bounds'][2]+2,path_record['bounds'][3]+2]
    stops=definition['stops'];offsets=[s['offset'] for s in stops]
    values=[tuple(int(s['color'][i:i+2],16) for i in (1,3,5)) for s in stops]
    size=256;pixels=bytearray(size*size*3)
    for row in range(size):
        y=bounds[1]+(row+.5)/size*(bounds[3]-bounds[1])
        for column in range(size):
            x=bounds[0]+(column+.5)/size*(bounds[2]-bounds[0])
            if definition['type']=='radial':t=math.hypot(x-definition['cx'],y-definition['cy'])/definition['r']
            else:
                dx=definition['x2']-definition['x1'];dy=definition['y2']-definition['y1']
                t=((x-definition['x1'])*dx+(y-definition['y1'])*dy)/(dx*dx+dy*dy)
            t=max(0,min(1,t));upper=max(1,min(len(stops)-1,bisect.bisect_left(offsets,t)));lower=upper-1
            ratio=(t-offsets[lower])/(offsets[upper]-offsets[lower])
            index=(row*size+column)*3
            for channel in range(3):pixels[index+channel]=round(values[lower][channel]+ratio*(values[upper][channel]-values[lower][channel]))
    file=textures/f'{name}.png';png_rgb(file,size,size,bytes(pixels))
    image=bpy.data.images.load(str(file),check_existing=True);image.colorspace_settings.name='sRGB';image.pack()
    material=bpy.data.materials.new(f'Octagram {name}');material.use_nodes=True
    principled=material.node_tree.nodes.get('Principled BSDF')
    principled.inputs['Metallic'].default_value=.12;principled.inputs['Roughness'].default_value=.46
    principled.inputs['Coat Weight' if 'Coat Weight' in principled.inputs else 'Clearcoat'].default_value=.15
    principled.inputs['Coat Roughness' if 'Coat Roughness' in principled.inputs else 'Clearcoat Roughness'].default_value=.55
    texture=material.node_tree.nodes.new('ShaderNodeTexImage');texture.image=image;texture.interpolation='Linear';texture.extension='EXTEND'
    material.node_tree.links.new(texture.outputs['Color'],principled.inputs['Base Color'])
    material.diffuse_color=tuple(v/255 for v in values[len(values)//2])+(1,)
    return material,bounds


bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
root=bpy.data.objects.new('Octagram',None);bpy.context.collection.objects.link(root)
root['source']='Exact cubic Bezier paths and sampled gradients from the owner-supplied Octagram PDF'
root['module_count']=8;root['source_path_count']=12;root['width']=3.5;root['open_center']=True
export_objects=[root];mesh_objects=[]
for module_index,module in enumerate(modules):
    group=bpy.data.objects.new('module-'+module['id'],None);bpy.context.collection.objects.link(group);group.parent=root
    cx,cy=module['centroid'];group.location=((cx-150)*scale,0,(150-cy)*scale)
    group['module_index']=module_index;group['source_id']=module['id'];group['home']=[(cx-150)*scale,(150-cy)*scale,0]
    export_objects.append(group)
    for path_index,record in enumerate(module['paths']):
        name=f"{module['id']}-path-{path_index:02d}"
        segments=parse_path(record['d']);curve=bpy.data.curves.new(name+' Bezier','CURVE')
        curve.dimensions='2D';curve.resolution_u=16;curve.fill_mode='BOTH';curve.extrude=.11
        spline=curve.splines.new('BEZIER');spline.bezier_points.add(len(segments)-1);spline.use_cyclic_u=True
        def coordinate(p):return ((p[0]-cx)*scale,(cy-p[1])*scale,0)
        for i,(start,c1,c2,end) in enumerate(segments):
            point=spline.bezier_points[i];previous=segments[(i-1)%len(segments)]
            point.co=coordinate(start);point.handle_left_type='FREE';point.handle_right_type='FREE'
            left=previous[2] if previous[2] else tuple(start[k]+(previous[0][k]-start[k])/3 for k in (0,1))
            right=c1 if c1 else tuple(start[k]+(end[k]-start[k])/3 for k in (0,1))
            point.handle_left=coordinate(left);point.handle_right=coordinate(right)
        obj=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(obj);obj.parent=group;obj.rotation_euler.x=math.pi/2
        # Keep the editable exact curve as an unlinked data block in the .blend.
        curve.use_fake_user=True
        bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj;bpy.ops.object.convert(target='MESH')
        if hasattr(obj.data,'use_auto_smooth'):obj.data.use_auto_smooth=True
        bevel=obj.modifiers.new('Precise soft perimeter','BEVEL');bevel.width=.012;bevel.segments=3;bevel.affect='EDGES';bevel.limit_method='ANGLE';bevel.angle_limit=.35;bevel.harden_normals=True
        bpy.ops.object.modifier_apply(modifier=bevel.name)
        for polygon in obj.data.polygons:polygon.use_smooth=True
        if hasattr(obj.data,'use_auto_smooth'):obj.data.use_auto_smooth=True
        weighted=obj.modifiers.new('Satin corner normals','WEIGHTED_NORMAL');weighted.keep_sharp=True;weighted.weight=50
        bpy.ops.object.modifier_apply(modifier=weighted.name)
        material,bounds=gradient_texture(record,name);obj.data.materials.append(material)
        uv=obj.data.uv_layers.new(name='SourceGradientUV')
        for polygon in obj.data.polygons:
            for loop_index in polygon.loop_indices:
                vertex=obj.data.vertices[obj.data.loops[loop_index].vertex_index].co
                sx=vertex.x/scale+cx;sy=cy-vertex.y/scale
                uv.data[loop_index].uv=((sx-bounds[0])/(bounds[2]-bounds[0]),1-(sy-bounds[1])/(bounds[3]-bounds[1]))
        obj['source_path']=record['d'];obj['gradient_id']=record['gradientId'];obj['module_index']=module_index
        obj['surface']='Satin ceramic / anodized metal';export_objects.append(obj);mesh_objects.append(obj)

# A reusable studio setup is part of the native .blend, but is excluded from GLB.
scene=bpy.context.scene;scene.world.color=(.09,.09,.09);scene.render.film_transparent=True
scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=32
scene.render.resolution_x=800;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX' if bpy.app.version >= (4,0,0) else 'Filmic'
camera_data=bpy.data.cameras.new('Studio camera');camera=bpy.data.objects.new('Studio camera',camera_data);scene.collection.objects.link(camera)
camera.location=(2.9,-6.7,2.5);camera.rotation_euler=(Vector((0,0,0))-camera.location).to_track_quat('-Z','Y').to_euler();camera_data.type='ORTHO';camera_data.ortho_scale=5.0;scene.camera=camera
for name,location,power,color,size in [('Key',(3,-4,5),600,(1,.88,.76),4),('Mint fill',(-4,-2,1),320,(.65,1,.87),3),('Rim',(1,2,3),450,(1,.67,.45),3)]:
    light_data=bpy.data.lights.new(name,'AREA');light_data.energy=power;light_data.color=color;light_data.shape='DISK';light_data.size=size
    light=bpy.data.objects.new(name,light_data);scene.collection.objects.link(light);light.location=location;light.rotation_euler=(Vector((0,0,0))-light.location).to_track_quat('-Z','Y').to_euler()

bpy.ops.object.select_all(action='DESELECT')
for obj in export_objects:obj.select_set(True)
bpy.context.view_layer.objects.active=root
bpy.ops.wm.save_as_mainfile(filepath=str(source/'octagram.blend'))
bpy.ops.export_scene.gltf(filepath=str(models/'octagram.glb'),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_texcoords=True,export_normals=True,export_materials='EXPORT',export_extras=True,export_cameras=False,export_lights=False)
report={'blender':bpy.app.version_string,'modules':len(modules),'meshes':len(mesh_objects),'vertices':sum(len(o.data.vertices) for o in mesh_objects),'polygons':sum(len(o.data.polygons) for o in mesh_objects),'source':'Exact owner PDF cubic paths + 101-stop gradients','glb_bytes':(models/'octagram.glb').stat().st_size,'axis':'glTF Y up, logo front +Z','module_names':[o.name for o in export_objects if o.type=='EMPTY' and o!=root]}
(source/'build-report.json').write_text(json.dumps(report,indent=2)+'\n');print('OCTAGRAM_BUILD_REPORT',json.dumps(report))
if args.render_preview:
    scene.render.filepath=str(source/'octagram-studio.png');bpy.ops.render.render(write_still=True)
