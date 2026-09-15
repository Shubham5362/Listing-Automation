# CI regression guard for the Pillow API used by vision_ai.
from PIL import Image, ImageFilter, ImageStat


def edge_variance(image: Image.Image) -> float:
    stats = ImageStat.Stat(image.convert("L").filter(ImageFilter.FIND_EDGES))
    return float(stats.stddev[0] ** 2)
