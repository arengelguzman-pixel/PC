# Prepara los clips del avatar para el hero: MP4 h264 1080×1920 (web, faststart) + póster JPG.
#   python scripts/hero-video.py <antes.mp4> <cambio.mp4> <despues.mp4>
import subprocess, sys, os, imageio_ffmpeg
ff = imageio_ffmpeg.get_ffmpeg_exe()
os.makedirs('public/video', exist_ok=True)
for nombre, src in zip(['antes', 'cambio', 'despues'], sys.argv[1:4]):
    out = f'public/video/avatar-{nombre}.mp4'
    subprocess.run([ff, '-y', '-i', src, '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30', '-an',
                    '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '21', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], check=True, capture_output=True)
    subprocess.run([ff, '-y', '-i', out, '-vframes', '1', '-q:v', '3', f'public/video/avatar-{nombre}.jpg'], check=True, capture_output=True)
    print(nombre, round(os.path.getsize(out) / 1024 / 1024, 1), 'MB')
