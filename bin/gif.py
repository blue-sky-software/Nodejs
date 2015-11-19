from images2gif import writeGif
from PIL import Image

import os
import sys

# SCREW YOU NODE!!
# 
base = sys.argv[1]
file_names = sorted((fn for fn in os.listdir(base) if fn.endswith('.png')))
images = [Image.open(base + '/' + fn) for fn in file_names]
writeGif(sys.argv[2] + '.gif', images, duration=0.5)