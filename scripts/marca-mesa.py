# Une los clips de "La mesa que atiende" + el clip del logo en un reel 9:16 (1080×1920, 24 fps).
#   python scripts/marca-mesa.py <salida.mp4> <clip1.mp4> [clip2.mp4 ...]
# El último clip debe ser el del logo (entregas/marca/meza-logo-9x16.mp4); se recorta a su cierre.
import subprocess, sys, imageio_ffmpeg
ff = imageio_ffmpeg.get_ffmpeg_exe()
salida, clips = sys.argv[1], sys.argv[2:]
LOGO_DESDE = 4.2   # s: arranca en la época 3D y el eslogan
X = 0.5            # s de fundido entre clips

def dur(p):
    out = subprocess.run([ff, '-i', p], capture_output=True, text=True).stderr
    h, m, s = out.split('Duration: ')[1].split(',')[0].split(':'); return int(h) * 3600 + int(m) * 60 + float(s)

entradas, filtros, duras = [], [], []
for i, c in enumerate(clips):
    es_logo = i == len(clips) - 1
    entradas += (['-ss', str(LOGO_DESDE)] if es_logo else []) + ['-i', c]
    d = dur(c) - (LOGO_DESDE if es_logo else 0); duras.append(d)
    filtros.append(f'[{i}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=24,setsar=1,format=yuv420p[v{i}]')
# cadena de xfade: v0+v1 → x1, x1+v2 → x2 ...
prev, t = 'v0', 0
for i in range(1, len(clips)):
    t += duras[i - 1] - X
    filtros.append(f'[{prev}][v{i}]xfade=transition=fade:duration={X}:offset={t:.3f}[x{i}]'); prev = f'x{i}'
cmd = [ff, '-y', *entradas, '-filter_complex', ';'.join(filtros), '-map', f'[{prev}]', '-an', '-c:v', 'libx264', '-crf', '18', '-movflags', '+faststart', salida]
subprocess.run(cmd, check=True, capture_output=True)
print('listo', salida, f'{sum(duras) - X * (len(clips) - 1):.1f}s')
